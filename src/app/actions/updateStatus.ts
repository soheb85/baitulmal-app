/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; 
import { getSession } from "./authActions"; // Import to get current Admin details

export async function updateBeneficiaryStatus(
  id: string, 
  newStatus: "ACTIVE" | "BLACKLISTED" | "ON_HOLD", 
  reason?: string
) {
  await connectDB();

  try {
    // 1. Get current session to identify the Admin
    const session = await getSession();
    const adminName = session?.name || "System Admin";

    // 2. Logic Check: If Blacklisting, reason is mandatory
    if (newStatus === "BLACKLISTED" && !reason) {
      return { success: false, message: "Reason is required for blacklisting." };
    }

    // 3. Perform the update
    // If ACTIVE, we clear the rejection data. If BLACKLISTED, we save the admin name.
    const updateData: any = {
        status: newStatus,
        rejectionReason: newStatus === "BLACKLISTED" ? reason : "",
        rejectionBy: newStatus === "BLACKLISTED" ? adminName : "" 
    };

    const updatedPerson = await Beneficiary.findByIdAndUpdate(
      id,
      updateData,
      { new: true }
    );

    if (!updatedPerson) {
      return { success: false, message: "Beneficiary not found" };
    }

    // --- 4. LOG: Status Change Action ---
    const logDetails = newStatus === "BLACKLISTED" 
      ? `Status changed to BLACKLISTED by ${adminName}. Reason: ${reason}` 
      : `Status updated to ${newStatus} by ${adminName}`;

    await logAction(
      "STATUS_CHANGE",
      updatedPerson.fullName,
      logDetails
    );

    // 5. Refresh Cache for all relevant pages
    revalidatePath("/verify");
    revalidatePath(`/beneficiaries/${id}`);
    revalidatePath("/beneficiaries");
    
    return { 
        success: true, 
        message: `Status updated to ${newStatus} by ${adminName}` 
    };

  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Server error occurred" };
  }
}