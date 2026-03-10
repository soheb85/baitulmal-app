/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { unstable_cache } from "next/cache"; // <-- IMPORT CACHE

// 1. Fetch Metadata for the Dropdowns (⚡ INSTANT RAM CACHE ⚡)
export const getFilterMetadata = unstable_cache(
  async () => {
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
  },
  ["explorer_dropdown_metadata"], // Unique Key
  // We use your master tag! If you add/edit a user, the dropdowns instantly refresh.
  { tags: ["beneficiaries_list"], revalidate: 86400 } 
);

// 2. Fetch Beneficiaries based on applied filters AND search query
// 🛑 DO NOT CACHE THIS: Too many dynamic combinations! MongoDB will handle this fast enough.
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
      
      // 1. Escape special characters to prevent regex crashes
      const escapedSearch = searchStr.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&');
      
      // 2. Smart Name Match: Split by space so "Khan Ali" matches "Ali Khan"
      const nameWords = searchStr.split(/\s+/).map(word => ({
        fullName: { $regex: word.replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: "i" }
      }));

      query.$or = [
        { $and: nameWords }, 
        { aadharNumber: { $regex: escapedSearch, $options: "i" } }, 
        { mobileNumber: { $regex: escapedSearch, $options: "i" } }, 
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
      .limit(5000) 
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}