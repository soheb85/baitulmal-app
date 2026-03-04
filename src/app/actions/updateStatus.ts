"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; // Imported logger

export async function updateBeneficiaryStatus(
  id: string, 
  newStatus: "ACTIVE" | "BLACKLISTED" | "ON_HOLD", 
  reason?: string
) {
  await connectDB();

  try {
    // 1. If Blacklisting, reason is mandatory
    if (newStatus === "BLACKLISTED" && !reason) {
      return { success: false, message: "Reason is required for blacklisting." };
    }

    // 2. Perform the update
    const updatedPerson = await Beneficiary.findByIdAndUpdate(
      id,
      { 
        status: newStatus,
        rejectionReason: reason || "" // Clear reason if becoming active
      },
      { new: true }
    );

    if (!updatedPerson) {
      return { success: false, message: "Beneficiary not found" };
    }

    // --- 3. LOG: Status Change Action ---
    // We record the new status and the reason in the audit log
    const logDetails = newStatus === "BLACKLISTED" 
      ? `Status changed to BLACKLISTED. Reason: ${reason}` 
      : `Status updated to ${newStatus}`;

    await logAction(
      "STATUS_CHANGE",
      updatedPerson.fullName,
      logDetails
    );

    // 4. Refresh Cache
    revalidatePath("/verify");
    revalidatePath(`/beneficiaries/${id}`);
    revalidatePath("/beneficiaries");
    
    return { success: true, message: `Status updated to ${newStatus}` };

  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Server error occurred" };
  }
}