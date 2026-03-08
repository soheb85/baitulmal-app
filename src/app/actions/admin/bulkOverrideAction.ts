/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

// Define the filter structure
export interface MultiFilter {
  field: string;
  customField?: string; // Added to support custom typed fields
  operator: string;
  value: string;
}

// Helper to build Mongoose Query from array of filters
function buildMongooseQuery(filters: MultiFilter[]) {
  const query: any = {};
  
  filters.forEach(f => {
    if (!f.value && f.value !== "false") return; // Skip empty values

    // Determine the actual field to query against
    const actualField = f.field === "CUSTOM" ? f.customField : f.field;
    if (!actualField || actualField.trim() === "") return;

    let finalValue: any = f.value;
    
    // 1. Type casting: Booleans
    if (f.value === "true") finalValue = true;
    else if (f.value === "false") finalValue = false;
    
    // 2. Type casting: Known Numbers
    else if (f.field === "distributedYears" && f.value) finalValue = Number(f.value);
    
    // 3. Type casting: Custom Field Numbers
    else if (f.field === "CUSTOM" && !isNaN(Number(f.value)) && f.value.trim() !== "") {
        finalValue = Number(f.value);
    }
    
    // 4. Type casting: Dates strictly formatted as DD/MM/YYYY (e.g., 08/03/2026 or 8/3/2026)
    else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(f.value)) {
        const match = f.value.match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
        
        if (match) {
            const day = parseInt(match[1], 10);
            const month = parseInt(match[2], 10) - 1; // JS Months are 0-11 (Jan=0, Feb=1, etc.)
            const year = parseInt(match[3], 10);

            // Create a start and end boundary for the entire day
            const startDate = new Date(year, month, day, 0, 0, 0, 0);
            const endDate = new Date(year, month, day, 23, 59, 59, 999);

            // Apply date-specific operators covering the whole day
            if (f.operator === "equals") {
                query[actualField] = { $gte: startDate, $lte: endDate };
            } else if (f.operator === "not_equals") {
                query[actualField] = { $not: { $gte: startDate, $lte: endDate } };
            }
            return; // Exit this loop iteration early since query is set
        }
    }

    // 5. Apply Standard Operators (For Strings, Booleans, and Numbers)
    if (f.operator === "equals") query[actualField] = finalValue;
    if (f.operator === "not_equals") query[actualField] = { $ne: finalValue };
  });

  return query;
}

// 1. Fetch unique values for a filter (e.g. get all unique Areas)
export async function getDistinctOptions(field: string) {
  await connectDB();
  try {
    if (field === "CUSTOM") return { success: true, data: [] }; // No distinct for custom
    const options = await Beneficiary.distinct(field);
    return { success: true, data: options.filter(Boolean).sort() };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 2. Fetch targets based on MULTIPLE filters
export async function fetchTargets(filters: MultiFilter[]) {
  await connectDB();
  try {
    const query = buildMongooseQuery(filters);
    
    // Safety check: Don't fetch everything if query is empty
    if (Object.keys(query).length === 0) {
        return { success: false, message: "Please provide at least one valid filter value." };
    }

    const results = await Beneficiary.find(query)
      .select(`_id fullName mobileNumber aadharNumber status area currentPincode`)
      .limit(5000)
      .lean();
      
    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 3. Execute Bulk Override
export async function executeBulkOverride(
  targetIds: string[], 
  selectAll: boolean, 
  filters: MultiFilter[], 
  updateField: string, 
  updateValue: any
) {
  await connectDB();
  try {
    let query: any = {};
    
    // Determine Targets
    if (selectAll) {
      query = buildMongooseQuery(filters);
    } else {
      if (targetIds.length === 0) return { success: false, message: "No users selected" };
      query = { _id: { $in: targetIds } };
    }

    let updateOperation: any = {};

    // ============================================================
    // SPECIAL MACRO
    // ============================================================
    if (updateField === "INJECT_HISTORY_YEAR") {
      const yearNum = Number(updateValue);
      if (!yearNum || isNaN(yearNum)) return { success: false, message: "Invalid year provided." };
      
      query.distributedYears = { $ne: yearNum };

      updateOperation = {
        $addToSet: { distributedYears: yearNum },
        $push: { 
          distributionHistory: {
            date: new Date(yearNum, 2, 15), 
            year: yearNum,
            status: "COLLECTED"
          }
        }
      };
    } 
    // ============================================================
    // STANDARD FIELD OVERRIDE
    // ============================================================
    else {
      const updateObj: any = { [updateField]: updateValue };

      if (updateField === "verificationCycle.startDate" && updateValue) {
        const startDate = new Date(updateValue);
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 3);
        endDate.setDate(endDate.getDate() - 45); 
        updateObj["verificationCycle.endDate"] = endDate;
      }

      updateOperation = { $set: updateObj };
    }

    const result = await Beneficiary.updateMany(query, updateOperation, { runValidators: false });

    await logAction(
      "BULK_OVERRIDE",
      "SUPER_ADMIN",
      updateField === "INJECT_HISTORY_YEAR" 
        ? `Bulk injected Ramzan ${updateValue} history into ${result.modifiedCount} records.`
        : `Bulk updated ${result.modifiedCount} records. Set [${updateField}] to [${updateValue}]`
    );

    revalidatePath("/");
    revalidatePath("/beneficiaries");
    revalidatePath("/admin/advanced-tools");

    return { success: true, count: result.modifiedCount };
  } catch(e: any) {
    return { success: false, message: e.message };
  }
}