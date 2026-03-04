/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { isValidObjectId } from "mongoose";

export async function searchBeneficiary(query: string) {
  console.log("🔍 Search initiated for:", query);

  await connectDB();

  try {
    if (!query) return { success: false, message: "Please enter a valid number or ID." };

    const cleanQuery = query.trim().replace(/[\s-]/g, '');
    let beneficiary;

    // 1. Check if it is a valid MongoDB ID (from QR Scan)
    if (isValidObjectId(cleanQuery)) {
        console.log("Scanning by ID...");
        beneficiary = await Beneficiary.findById(cleanQuery).lean();
    } 
    // 2. Otherwise search by Mobile/Aadhaar
    else {
        console.log("Searching by Mobile/Aadhaar...");
        beneficiary = await Beneficiary.findOne({
          $or: [
            { aadharNumber: cleanQuery },
            { mobileNumber: cleanQuery },
            // Regex for partial matches if needed (optional)
            { mobileNumber: { $regex: "^" + cleanQuery, $options: "i" } },
            { aadharNumber: { $regex: "^" + cleanQuery, $options: "i" } }
          ]
        }).lean();
    }

    if (!beneficiary) {
      return { success: false, message: "No record found. Please register first." };
    }

    // --- Calculate Today's Status ---
    const today = new Date();
    const startOfDay = new Date(today.setHours(0, 0, 0, 0));
    const endOfDay = new Date(today.setHours(23, 59, 59, 999));

    const todayLog = beneficiary.distributionHistory?.find(
      (h: any) => new Date(h.date) >= startOfDay && new Date(h.date) <= endOfDay
    );

    let status = "NOT_CHECKED_IN";
    if (todayLog) {
      status = todayLog.status === "COLLECTED" ? "COLLECTED" : "CHECKED_IN";
    }

    // --- FIX: Deep Manual Serialization ---
    const serializedData = {
      ...beneficiary,
      _id: beneficiary._id.toString(),
      createdAt: beneficiary.createdAt ? new Date(beneficiary.createdAt).toISOString() : null,
      updatedAt: beneficiary.updatedAt ? new Date(beneficiary.updatedAt).toISOString() : null,
      
      // Fix distributionHistory dates & IDs
      distributionHistory: beneficiary.distributionHistory?.map((h: any) => ({
        ...h,
        date: h.date ? new Date(h.date).toISOString() : null,
        _id: h._id ? h._id.toString() : undefined
      })) || [],

      // Add computed todayStatus
      todayStatus: {
        status,
        tokenNumber: todayLog?.tokenNumber || null,
        date: todayLog?.date ? new Date(todayLog.date).toISOString() : null
      },

      // Fix verificationCycle dates
      verificationCycle: beneficiary.verificationCycle ? {
        ...beneficiary.verificationCycle,
        startDate: beneficiary.verificationCycle.startDate ? new Date(beneficiary.verificationCycle.startDate).toISOString() : null,
        endDate: beneficiary.verificationCycle.endDate ? new Date(beneficiary.verificationCycle.endDate).toISOString() : null,
      } : null,

      // Fix family members IDs
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