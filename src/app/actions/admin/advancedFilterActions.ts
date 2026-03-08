/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

// 1. Fetch Metadata for the Dropdowns
export async function getFilterMetadata() {
  await connectDB();
  try {
    const pincodesRaw = await Beneficiary.distinct("currentPincode");
    const areasRaw = await Beneficiary.distinct("area");
    const referencesRaw = await Beneficiary.distinct("referencedBy");

    return {
      success: true,
      data: {
        pincodes: pincodesRaw.filter(Boolean).sort(),
        areas: areasRaw.filter(Boolean).sort(),
        references: referencesRaw.filter(Boolean).sort(),
      }
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 2. Fetch Beneficiaries based on applied filters AND search query
export async function fetchFilteredBeneficiaries(
  filters: {
    pincode?: string;
    area?: string;
    referencedBy?: string;
    yearCount?: number | null; 
    gender?: string;
    husbandStatus?: string;
    isEarning?: string; 
    housingType?: string;
    status?: string;
    // --- NEW FILTERS ---
    isException?: string;
    hasProblems?: string;
    todayStatus?: string;
    isFullyVerified?: string;
  },
  searchQuery?: string
) {
  await connectDB();
  try {
    const query: any = {};

    // --- DIRECT SEARCH LOGIC ---
    if (searchQuery && searchQuery.trim() !== "") {
      const searchStr = searchQuery.trim();
      query.$or = [
        { fullName: { $regex: searchStr, $options: "i" } }, 
        { aadharNumber: searchStr }, 
        { mobileNumber: searchStr }, 
      ];
    }

    // --- FILTER LOGIC ---
    if (filters.pincode) query.currentPincode = filters.pincode;
    if (filters.area) query.area = filters.area;
    if (filters.referencedBy) query.referencedBy = filters.referencedBy;
    if (filters.gender) query.gender = filters.gender;
    if (filters.husbandStatus) query.husbandStatus = filters.husbandStatus;
    if (filters.housingType) query.housingType = filters.housingType;
    if (filters.status) query.status = filters.status;
    if (filters.todayStatus) query["todayStatus.status"] = filters.todayStatus;
    
    // Booleans
    if (filters.isEarning === "true") query.isEarning = true;
    if (filters.isEarning === "false") query.isEarning = false;

    if (filters.isException === "true") query.isException = true;
    if (filters.isException === "false") query.isException = false;

    if (filters.isFullyVerified === "true") query["verificationCycle.isFullyVerified"] = true;
    if (filters.isFullyVerified === "false") query["verificationCycle.isFullyVerified"] = false;

    // Array Checks
    if (filters.hasProblems === "true") query.problems = { $exists: true, $not: { $size: 0 } };
    if (filters.hasProblems === "false") query.problems = { $size: 0 };

    if (filters.yearCount !== undefined && filters.yearCount !== null) {
      query.distributedYears = { $size: filters.yearCount };
    }

    // Fetch the data
    const results = await Beneficiary.find(query)
      .select("fullName aadharNumber mobileNumber currentPincode area referencedBy distributedYears status gender husbandStatus isEarning totalFamilyIncome housingType isException todayStatus verificationCycle")
      .limit(5000) // Increased limit to 5000 
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}