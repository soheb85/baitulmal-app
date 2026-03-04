/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { isValidObjectId } from "mongoose";

export async function searchBeneficiary(query: string) {
  console.log("🔍 Search initiated for:", query);

  await connectDB();

  try {
    if (!query)
      return { success: false, message: "Please enter a valid number or ID." };

    const cleanQuery = query.trim().replace(/[\s-]/g, "");
    let beneficiary;

    // 1️⃣ QR Scan (Mongo ID)
    if (isValidObjectId(cleanQuery)) {
      console.log("Scanning by ID...");
      beneficiary = await Beneficiary.findById(cleanQuery).lean();
    }
    // 2️⃣ Mobile / Aadhaar
    else {
      console.log("Searching by Mobile/Aadhaar...");
      beneficiary = await Beneficiary.findOne({
        $or: [
          { aadharNumber: cleanQuery },
          { mobileNumber: cleanQuery },
          { mobileNumber: { $regex: "^" + cleanQuery, $options: "i" } },
          { aadharNumber: { $regex: "^" + cleanQuery, $options: "i" } },
        ],
      }).lean();
    }

    if (!beneficiary) {
      return {
        success: false,
        message: "No record found. Please register first.",
      };
    }

    // --- Use actual todayStatus stored in DB ---
    const todayStatus = beneficiary.todayStatus || {
      status: "NOT_CHECKED_IN",
      tokenNumber: null,
      date: null,
    };

    // --- Serialization ---
    const serializedData = {
      ...beneficiary,

      _id: beneficiary._id.toString(),

      createdAt: beneficiary.createdAt
        ? new Date(beneficiary.createdAt).toISOString()
        : null,

      updatedAt: beneficiary.updatedAt
        ? new Date(beneficiary.updatedAt).toISOString()
        : null,

      todayStatus: {
        status: todayStatus.status || "NOT_CHECKED_IN",
        tokenNumber: todayStatus.tokenNumber || null,
        date: todayStatus.date
          ? new Date(todayStatus.date).toISOString()
          : null
      },

      verificationCycle: beneficiary.verificationCycle
        ? {
            ...beneficiary.verificationCycle,
            startDate: beneficiary.verificationCycle.startDate
              ? new Date(beneficiary.verificationCycle.startDate).toISOString()
              : null,
            endDate: beneficiary.verificationCycle.endDate
              ? new Date(beneficiary.verificationCycle.endDate).toISOString()
              : null,
          }
        : null,

      distributionHistory:
        beneficiary.distributionHistory?.map((h: any) => ({
          ...h,
          date: h.date ? new Date(h.date).toISOString() : null,
          _id: h._id ? h._id.toString() : undefined,
        })) || [],

      familyMembersDetail: Array.isArray(beneficiary.familyMembersDetail)
        ? beneficiary.familyMembersDetail.map((m: any) => ({
            ...m,
            _id: m._id ? m._id.toString() : undefined,
          }))
        : [],
    };

    return { success: true, data: serializedData };
  } catch (error: any) {
    console.error("🔥 Search Error:", error);
    return { success: false, message: "Server error: " + error.message };
  }
}
