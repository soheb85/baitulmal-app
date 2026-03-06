/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

// 1. Fetch Metadata for the Dropdowns
export async function getFilterMetadata() {
  await connectDB();
  try {
    // Grab all unique values from the database, filter out blanks/nulls, and sort alphabetically
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

// 2. Fetch Beneficiaries based on applied filters
export async function fetchFilteredBeneficiaries(filters: {
  pincode?: string;
  area?: string;
  referencedBy?: string;
  yearCount?: number | null; // null means "All", 0 means "New", 1 means "1 Year", etc.
}) {
  await connectDB();
  try {
    const query: any = {};

    // Apply strict matching if a filter is selected
    if (filters.pincode) query.currentPincode = filters.pincode;
    if (filters.area) query.area = filters.area;
    if (filters.referencedBy) query.referencedBy = filters.referencedBy;

    // Apply Array Length logic to find out how many years they have collected
    if (filters.yearCount !== undefined && filters.yearCount !== null) {
      query.distributedYears = { $size: filters.yearCount };
    }

    // Fetch the data
    const results = await Beneficiary.find(query)
      .select("fullName aadharNumber mobileNumber currentPincode area referencedBy distributedYears status")
      .limit(150) // Limit to keep the UI snappy
      .lean();

    return { success: true, data: JSON.parse(JSON.stringify(results)) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}