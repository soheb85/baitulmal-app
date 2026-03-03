/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function getBeneficiaries(
  page: number = 1, 
  search: string = "", 
  statusFilter: string = "ALL"
) {
  await connectDB();
  
  const limit = 10; // Load 10 at a time
  const skip = (page - 1) * limit;

  // Build the query
  const query: any = {};

  // 1. Filter by Status
  if (statusFilter !== "ALL") {
    query.status = statusFilter;
  }

  // 2. Search by Name, Mobile, or Aadhaar
  if (search) {
    const cleanSearch = search.trim();
    query.$or = [
      { fullName: { $regex: cleanSearch, $options: "i" } },
      { mobileNumber: { $regex: cleanSearch, $options: "i" } },
      { aadharNumber: { $regex: cleanSearch, $options: "i" } }
    ];
  }

  try {
    const [data, total] = await Promise.all([
      Beneficiary.find(query)
        .sort({ createdAt: -1 }) // Newest first
        .skip(skip)
        .limit(limit)
        .lean(),
      Beneficiary.countDocuments(query)
    ]);

    // Convert _id to string
    const beneficiaries = data.map((b: any) => ({
      ...b,
      _id: b._id.toString(),
      createdAt: b.createdAt?.toISOString(),
      updatedAt: b.updatedAt?.toISOString(),
      familyMembersDetail: b.familyMembersDetail?.map((m:any) => ({...m, _id: m._id?.toString()}))
    }));

    return { 
      success: true, 
      beneficiaries, 
      hasMore: skip + beneficiaries.length < total 
    };

  } catch (error) {
    console.error("Fetch Error:", error);
    return { success: false, beneficiaries: [], hasMore: false };
  }
}