/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

// 1. Fetch unique values for a filter (e.g. get all unique Areas)
export async function getDistinctOptions(field: string) {
  await connectDB();
  try {
    const options = await Beneficiary.distinct(field);
    return { success: true, data: options.filter(Boolean).sort() };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 2. Fetch targets based on filter
export async function fetchTargets(field: string, value: string | boolean | number) {
  await connectDB();
  try {
    const query: any = {};
    if (field && value !== "") {
      query[field] = value;
    }
    const results = await Beneficiary.find(query)
      .select(`_id fullName mobileNumber aadharNumber status area currentPincode ${field}`)
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
  filterField: string, 
  filterValue: string | boolean | number, 
  updateField: string, 
  updateValue: any
) {
  await connectDB();
  try {
    let query: any = {};
    
    // Determine Targets
    if (selectAll) {
      query[filterField] = filterValue;
    } else {
      if (targetIds.length === 0) return { success: false, message: "No users selected" };
      query = { _id: { $in: targetIds } };
    }

    let updateOperation: any = {};

    // ============================================================
    // SPECIAL MACRO: Safely inject a new year into the History Arrays
    // ============================================================
    if (updateField === "INJECT_HISTORY_YEAR") {
      const yearNum = Number(updateValue);
      if (!yearNum || isNaN(yearNum)) return { success: false, message: "Invalid year provided." };
      
      // Safety: Only update records that DO NOT already have this year
      query.distributedYears = { $ne: yearNum };

      updateOperation = {
        $addToSet: { distributedYears: yearNum },
        $push: { 
          distributionHistory: {
            date: new Date(yearNum, 2, 15), // Timestamp of when the admin injected it
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

      // --- AUTO-CALCULATE END DATE (WITH LUNAR ADJUSTMENT) ---
      if (updateField === "verificationCycle.startDate" && updateValue) {
        const startDate = new Date(updateValue);
        const endDate = new Date(startDate);
        endDate.setFullYear(endDate.getFullYear() + 3);
        endDate.setDate(endDate.getDate() - 45); // Lunar adjustment
        updateObj["verificationCycle.endDate"] = endDate;
      }

      updateOperation = { $set: updateObj };
    }

    // Run the massive update
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