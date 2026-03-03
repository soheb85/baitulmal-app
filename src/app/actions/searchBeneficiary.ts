/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function searchBeneficiary(query: string) {
  console.log("🔍 Search initiated for:", query);

  await connectDB();

  try {
    if (!query) return { success: false, message: "Please enter a valid number." };

    // Clean the input (remove spaces/dashes)
    const cleanQuery = query.trim().replace(/[\s-]/g, '');

    // --- FIX: Use Regex for Partial Matching ---
    // "^" means "Starts with". So "^98" matches "98765..."
    const beneficiary = await Beneficiary.findOne({
      $or: [
        // 1. Exact Match (Best Case)
        { aadharNumber: cleanQuery },
        { mobileNumber: cleanQuery },
        
        // 2. Partial Match (If exact not found)
        { mobileNumber: { $regex: "^" + cleanQuery, $options: "i" } },
        { aadharNumber: { $regex: "^" + cleanQuery, $options: "i" } }
      ]
    }).lean();

    if (!beneficiary) {
      console.log("❌ No record found in DB.");
      return { success: false, message: "No record found. Please register first." };
    }

    console.log("✅ Record found:", beneficiary.fullName);

    // Manual Serialization (Convert Objects to Strings)
    const serializedData = {
      ...beneficiary,
      _id: beneficiary._id.toString(),
      createdAt: beneficiary.createdAt ? new Date(beneficiary.createdAt).toISOString() : null,
      updatedAt: beneficiary.updatedAt ? new Date(beneficiary.updatedAt).toISOString() : null,
      
      // Handle family members IDs
      familyMembersDetail: Array.isArray(beneficiary.familyMembersDetail) 
        ? beneficiary.familyMembersDetail.map((m: any) => ({
            ...m,
            _id: m._id ? m._id.toString() : undefined 
          })) 
        : []
    };

    return { success: true, data: serializedData };

  } catch (error: any) {
    console.error("🔥 Search Error:", error);
    return { success: false, message: "Server error: " + error.message };
  }
}