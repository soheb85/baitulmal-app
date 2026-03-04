/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function getBeneficiaries(page: number, search: string = "", filter: string = "ALL") {
  await connectDB();
  const limit = 10;
  const skip = (page - 1) * limit;

  try {
    const query: any = {};
    if (filter !== "ALL") query.status = filter;
    if (search) {
      query.$or = [
        { fullName: { $regex: search, $options: "i" } },
        { mobileNumber: { $regex: search, $options: "i" } },
        { aadharNumber: { $regex: search, $options: "i" } },
      ];
    }

    const total = await Beneficiary.countDocuments(query);
    const beneficiaries = await Beneficiary.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .lean();

    // --- FIX: Deep Serialization ---
    const serializedBeneficiaries = beneficiaries.map((b: any) => ({
      ...b,
      _id: b._id.toString(),
      createdAt: b.createdAt ? b.createdAt.toISOString() : null,
      updatedAt: b.updatedAt ? b.updatedAt.toISOString() : null,
      // Ensure nested arrays are cleaned
      familyMembersDetail: b.familyMembersDetail?.map((m: any) => ({
        ...m,
        _id: m._id ? m._id.toString() : undefined,
      })) || [],
      distributionHistory: b.distributionHistory?.map((h: any) => ({
        ...h,
        _id: h._id ? h._id.toString() : undefined,
        date: h.date ? h.date.toISOString() : null,
      })) || [],
      todayStatus: b.todayStatus ? {
        ...b.todayStatus,
        date: b.todayStatus.date ? b.todayStatus.date.toISOString() : null
      } : null
    }));

    return {
      success: true,
      beneficiaries: serializedBeneficiaries,
      hasMore: skip + limit < total,
    };
  } catch (error: any) {
    return { success: false, beneficiaries: [], hasMore: false };
  }
}