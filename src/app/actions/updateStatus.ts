"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";

export async function updateBeneficiaryStatus(
  id: string, 
  newStatus: "ACTIVE" | "BLACKLISTED" | "ON_HOLD", 
  reason?: string
) {
  await connectDB();

  try {
    // If Blacklisting, reason is mandatory
    if (newStatus === "BLACKLISTED" && !reason) {
      return { success: false, message: "Reason is required for blacklisting." };
    }

    const updatedPerson = await Beneficiary.findByIdAndUpdate(
      id,
      { 
        status: newStatus,
        rejectionReason: reason || "" // Clear reason if becoming active
      },
      { new: true } // Return the updated document
    ).lean();

    if (!updatedPerson) {
      return { success: false, message: "Beneficiary not found" };
    }

    revalidatePath("/verify");
    
    return { success: true, message: `Status updated to ${newStatus}` };

  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Server error occurred" };
  }
}