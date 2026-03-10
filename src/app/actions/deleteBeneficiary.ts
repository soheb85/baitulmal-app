/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath, revalidateTag } from "next/cache"; // <-- Added revalidateTag
import { getSession } from "./authActions"; 
import { logAction } from "@/lib/logger"; 

// --- HELPER: Safely bypass Next.js 15 TypeScript bug ---
function safeRevalidateTag(tag: string) {
  // @ts-expect-error Next.js 15 has a bug where revalidateTag is not recognized as a function in some contexts. This wrapper allows us to call it without TypeScript errors.
  revalidateTag(tag);
}

export async function deleteBeneficiary(id: string) {
  await connectDB();

  try {
    // 1. Security Check: Only Super Admins can delete
    const session = await getSession();
    if (session?.role !== "SUPER_ADMIN") {
      return { 
        success: false, 
        message: "Unauthorized: Only Super Admin can delete records." 
      };
    }

    // 2. Find beneficiary before deleting to get their name for the log
    const person = await Beneficiary.findById(id);
    if (!person) {
      return { success: false, message: "Beneficiary not found" };
    }

    const beneficiaryName = person.fullName;

    // 3. Perform Deletion
    await Beneficiary.findByIdAndDelete(id);

    // --- 4. LOG: Delete Action ---
    await logAction(
      "DELETE_RECORD",
      beneficiaryName,
      `Permanently removed beneficiary from the system.`
    );

    // --- 5. NEW: DESTROY THE CACHES ---
    safeRevalidateTag("beneficiaries_list"); // Instantly removes them from the search/table
    safeRevalidateTag("dashboard_cache");    // Instantly fixes the "Total Families" count on the dashboard

    // Refresh Client-side router paths
    revalidatePath("/");
    revalidatePath("/beneficiaries");
    
    return { success: true, message: "Beneficiary deleted successfully" };

  } catch (error: any) {
    console.error("Delete Error:", error);
    return { success: false, message: "Delete failed: " + error.message };
  }
}