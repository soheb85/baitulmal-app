/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

// --- 1. FIND DUPLICATES ---
export async function scanForDuplicates(type: "MOBILE" | "AADHAAR" | "ADDRESS") {
  await connectDB();
  
  try {
    const pipeline: any[] = [];

    // Step 1: Safely format the grouping field to prevent crashes on null values
    if (type === "ADDRESS") {
      pipeline.push({
        $project: {
          _id: 1, // Keep the document ID
          // Convert address to lowercase, trim spaces, and handle missing fields safely
          groupKey: { $toLower: { $trim: { input: { $ifNull: ["$currentAddress", ""] } } } }
        }
      });
    } else {
      pipeline.push({
        $project: {
          _id: 1,
          groupKey: type === "MOBILE" ? "$mobileNumber" : "$aadharNumber"
        }
      });
    }

    // Step 2: Group by our formatted key
    pipeline.push({
      $group: {
        _id: "$groupKey",
        count: { $sum: 1 },
        records: { $push: "$_id" }
      }
    });

    // Step 3: Match only groups that have more than 1 record AND are not blank/null
    // Fix applied here: using $nin (Not In) instead of double $ne
    pipeline.push({
      $match: {
        count: { $gt: 1 },
        _id: { $nin: ["", null] } 
      }
    });

    // Step 4: Sort by highest duplicate count first, limit to 100 for performance
    pipeline.push({ $sort: { count: -1 } });
    pipeline.push({ $limit: 100 });

    const duplicateGroups = await Beneficiary.aggregate(pipeline);

    if (duplicateGroups.length === 0) return { success: true, data: [] };

    // Fetch the actual full documents for these duplicates
    const allDuplicateIds = duplicateGroups.flatMap(g => g.records);
    const fullRecords = await Beneficiary.find({ _id: { $in: allDuplicateIds } }).lean();

    // Format data: Map the full records back to their duplicate group
    const formattedData = duplicateGroups.map(group => {
      return {
        sharedValue: group._id,
        count: group.count,
        profiles: fullRecords.filter(r => {
          if (type === "ADDRESS") {
            return String(r.currentAddress || "").toLowerCase().trim() === String(group._id);
          }
          return String(r[type === "MOBILE" ? "mobileNumber" : "aadharNumber"]) === String(group._id);
        })
      };
    });

    return { success: true, data: JSON.parse(JSON.stringify(formattedData)) };
  } catch (error: any) {
    console.error("Duplicate Scan Error:", error);
    return { success: false, message: error.message };
  }
}

// --- 2. RESOLVE DUPLICATE (DELETE OR BLACKLIST) ---
export async function resolveDuplicate(id: string, action: "DELETE" | "BLACKLIST") {
  await connectDB();
  
  try {
    const person = await Beneficiary.findById(id);
    if (!person) return { success: false, message: "Record not found" };

    if (action === "DELETE") {
      await Beneficiary.findByIdAndDelete(id);
      await logAction("DUPLICATE_RESOLVED", "SUPER_ADMIN", `Deleted duplicate entry: ${person.fullName}`);
    } else if (action === "BLACKLIST") {
      person.status = "BLACKLISTED";
      person.rejectionReason = "Identified as duplicate household/entry via System Scanner.";
      await person.save();
      await logAction("DUPLICATE_RESOLVED", "SUPER_ADMIN", `Blacklisted duplicate entry: ${person.fullName}`);
    }

    revalidatePath("/admin/advanced-tools/find-duplicates");
    revalidatePath("/beneficiaries");

    return { success: true, message: `Successfully ${action.toLowerCase()}d the record.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}