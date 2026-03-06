/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; 

export async function updateBeneficiary(id: string, formData: any) {
  await connectDB();

  try {
    // --- 1. NEW: Validate Pincode Logic for Updates ---
    const allowedPincodes = ["400024", "400070"]; 
    if (!formData.isException && !allowedPincodes.includes(formData.currentPincode)) {
       return { 
         success: false, 
         message: `Area ${formData.currentPincode} is not eligible. If this is an approved special case, please check the 'Special Case Exception' box.` 
       };
    }

    // 2. Update the record
    const updated = await Beneficiary.findByIdAndUpdate(
      id,
      { ...formData },
      { new: true, runValidators: true }
    );

    if (!updated) {
      return { success: false, message: "Beneficiary not found" };
    }

    // --- 3. LOG: Update Action ---
    const logDetails = formData.isException 
      ? `Profile updated with SPECIAL EXCEPTION status (Pincode: ${updated.currentPincode})`
      : `Beneficiary profile updated (Mobile/Address/Family details changed)`;

    await logAction(
      "UPDATE_PROFILE",
      updated.fullName,
      logDetails
    );

    // 4. Refresh all relevant pages
    revalidatePath("/");
    revalidatePath("/beneficiaries");
    revalidatePath(`/beneficiaries/${id}`);

    return { success: true, message: "Details updated successfully!" };

  } catch (error: any) {
    console.error("Update Error:", error);
    return { success: false, message: "Update failed: " + error.message };
  }
}