/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; // Imported logger

export async function updateBeneficiary(id: string, formData: any) {
  await connectDB();

  try {
    // 1. Update the record
    const updated = await Beneficiary.findByIdAndUpdate(
      id,
      { ...formData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return { success: false, message: "Beneficiary not found" };
    }

    // --- 2. LOG: Update Action ---
    // This records WHO edited the profile and for WHICH beneficiary
    await logAction(
      "UPDATE_PROFILE",
      updated.fullName,
      `Beneficiary profile updated (Mobile/Address/Family details changed)`
    );

    // 3. Refresh all relevant pages
    revalidatePath("/");
    revalidatePath("/beneficiaries");
    revalidatePath(`/beneficiaries/${id}`);

    return { success: true, message: "Details updated successfully!" };

  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, message: "Update failed: " + error.message };
  }
}