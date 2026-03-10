/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { unstable_cache, revalidateTag } from "next/cache";

// --- HELPER: Safely bypass Next.js 15 TypeScript bug ---
export function safeRevalidateTag(tag: string) {
  // @ts-expect-error Next.js 15 has a bug where revalidateTag is not recognized as a function in some contexts. This wrapper allows us to call it without TypeScript errors.
  revalidateTag(tag);
}

export async function getBeneficiaries(page: number, search: string = "", filter: string = "ALL") {
  
  // 1. Create a dynamic cache function specific to these exact arguments
  const fetchFromCache = unstable_cache(
    async () => {
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

        // Deep Serialization
        const serializedBeneficiaries = beneficiaries.map((b: any) => ({
          ...b,
          _id: b._id.toString(),
          createdAt: b.createdAt ? b.createdAt.toISOString() : null,
          updatedAt: b.updatedAt ? b.updatedAt.toISOString() : null,
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
    },
    // 2. The Cache Key includes the variables! e.g., ["beneficiaries", "1", "", "ALL"]
    [`beneficiaries_page_${page}_search_${search}_filter_${filter}`], 
    // 3. The Master Tag used to destroy ALL combinations at once when an edit happens
    { tags: ["beneficiaries_list"], revalidate: 3600 }
  );

  // 4. Execute and return the cached (or freshly fetched) result
  return await fetchFromCache();
}