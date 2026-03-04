/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function searchBeneficiary(query: string) {
  console.log("🔍 Search initiated for:", query);

  await connectDB();

  try {
    if (!query) return { success: false, message: "Please enter a valid number." };

    const cleanQuery = query.trim().replace(/[\s-]/g, '');

    const beneficiary = await Beneficiary.findOne({
      $or: [
        { aadharNumber: cleanQuery },
        { mobileNumber: cleanQuery },
        { mobileNumber: { $regex: "^" + cleanQuery, $options: "i" } },
        { aadharNumber: { $regex: "^" + cleanQuery, $options: "i" } }
      ]
    }).lean();

    if (!beneficiary) {
      return { success: false, message: "No record found. Please register first." };
    }

    // --- FIX: Manual Serialization ---
    const serializedData = {
      ...beneficiary,
      _id: beneficiary._id.toString(),
      createdAt: beneficiary.createdAt ? new Date(beneficiary.createdAt).toISOString() : null,
      updatedAt: beneficiary.updatedAt ? new Date(beneficiary.updatedAt).toISOString() : null,
      
      // Fix distributionHistory dates
      distributionHistory: beneficiary.distributionHistory?.map((h: any) => ({
        ...h,
        date: h.date ? new Date(h.date).toISOString() : null,
        _id: h._id ? h._id.toString() : undefined
      })) || [],

      // Fix todayStatus dates
      todayStatus: beneficiary.todayStatus ? {
        ...beneficiary.todayStatus,
        date: beneficiary.todayStatus.date ? new Date(beneficiary.todayStatus.date).toISOString() : null
      } : { status: null },

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