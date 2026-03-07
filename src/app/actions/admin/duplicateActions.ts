/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

// --- 1. FIND DUPLICATES ---
export async function scanForDuplicates(type: "MOBILE" | "AADHAAR" | "ADDRESS" | "NAMES") {
  await connectDB();
  
  try {
    // ==========================================
    // NEW LOGIC: Cross-Check All Names (In-Memory)
    // ==========================================
    if (type === "NAMES") {
      // Fetch all records with just the necessary fields to save memory
      const allRecords = await Beneficiary.find({})
        .select('_id fullName mobileNumber aadharNumber status familyMembersDetail.name familyMembersDetail.relation')
        .lean();

      // Map to store: Normalized Name -> Set of Record IDs
      const nameMap = new Map<string, Set<string>>();

      for (const record of allRecords) {
        // Collect main applicant name + all family member names
        const namesInRecord = [
          record.fullName,
          ...(record.familyMembersDetail?.map((m: any) => m.name) || [])
        ];

        for (const name of namesInRecord) {
          if (!name) continue;
          // Normalize: lowercase, remove extra spaces
          const normalizedName = name.toString().toLowerCase().replace(/\s+/g, ' ').trim();
          
          // Skip extremely short names to avoid false positives (like "ali", "sk")
          if (normalizedName.length < 4) continue;

          if (!nameMap.has(normalizedName)) {
            nameMap.set(normalizedName, new Set());
          }
          nameMap.get(normalizedName)!.add(record._id.toString());
        }
      }

      // Filter down to ONLY names that appear in MORE THAN ONE distinct household
      const duplicateGroups = [];
      for (const [name, recordIdsSet] of nameMap.entries()) {
        if (recordIdsSet.size > 1) {
          duplicateGroups.push({
            sharedValue: name,
            count: recordIdsSet.size,
            recordIds: Array.from(recordIdsSet)
          });
        }
      }

      // Sort by highest count first
      duplicateGroups.sort((a, b) => b.count - a.count);
      // Limit to top 50 to prevent massive browser lag
      const topGroups = duplicateGroups.slice(0, 50);

      // Fetch the full records for the UI
      const allDuplicateIds = topGroups.flatMap(g => g.recordIds);
      const fullRecords = await Beneficiary.find({ _id: { $in: allDuplicateIds } }).lean();

      // Format data for frontend
      const formattedData = topGroups.map(group => {
        return {
          sharedValue: group.sharedValue,
          count: group.count,
          profiles: fullRecords.filter(r => group.recordIds.includes(r._id.toString()))
        };
      });

      return { success: true, data: JSON.parse(JSON.stringify(formattedData)) };
    }

    // ==========================================
    // ORIGINAL LOGIC: Aggregation for Standard Fields
    // ==========================================
    const pipeline: any[] = [];

    if (type === "ADDRESS") {
      pipeline.push({
        $project: {
          _id: 1,
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

    pipeline.push({
      $group: {
        _id: "$groupKey",
        count: { $sum: 1 },
        records: { $push: "$_id" }
      }
    });

    pipeline.push({
      $match: {
        count: { $gt: 1 },
        _id: { $nin: ["", null] } 
      }
    });

    pipeline.push({ $sort: { count: -1 } });
    pipeline.push({ $limit: 100 });

    const duplicateGroups = await Beneficiary.aggregate(pipeline);

    if (duplicateGroups.length === 0) return { success: true, data: [] };

    const allDuplicateIds = duplicateGroups.flatMap(g => g.records);
    const fullRecords = await Beneficiary.find({ _id: { $in: allDuplicateIds } }).lean();

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