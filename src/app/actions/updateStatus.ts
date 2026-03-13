/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; 
import { getSession } from "./authActions";

export async function updateBeneficiaryStatus(
  id: string, 
  newStatus: "ACTIVE" | "BLACKLISTED" | "ON_HOLD", 
  authority: string, 
  reason?: string,
  customDateString?: string
) {
  await connectDB();

  try {
    const session = await getSession();
    const adminName = session?.name || "System Admin";
    
    const actionDate = customDateString ? new Date(customDateString) : new Date();
    const dateString = actionDate.toLocaleDateString("en-IN"); 

    let updateData: any = {};
    let logDetails = "";

    if (newStatus === "ACTIVE") {
      const approvalText = `Approved By ${authority} on ${dateString}`;
      updateData = {
        status: "ACTIVE",
        approvedBy: authority,
        approvedAt: actionDate, 
        rejectionReason: "",
        rejectionBy: "",
        comments: `[${approvalText}]`
      };
      logDetails = `Status updated to ACTIVE. ${approvalText} (Action by ${adminName})`;

    } else if (newStatus === "BLACKLISTED") {
      if (!reason) return { success: false, message: "Reason is required for blacklisting." };
      
      const rejectionText = `Blocked/Rejected By ${authority} on ${dateString}. Reason: ${reason}`;
      updateData = {
        status: "BLACKLISTED",
        rejectionReason: rejectionText,
        rejectionBy: authority,
        approvedBy: "",
        approvedAt: null
      };
      logDetails = `Status updated to BLACKLISTED. ${rejectionText} (Action by ${adminName})`;
    }

    // 🌟 FIXED DEPRECATION WARNING HERE 🌟
    const updatedPerson = await Beneficiary.findByIdAndUpdate(id, updateData, { returnDocument: 'after' });
    
    if (!updatedPerson) return { success: false, message: "Beneficiary not found" };

    await logAction("STATUS_CHANGE", updatedPerson.fullName, logDetails);

    revalidatePath("/verify");
    revalidatePath(`/beneficiaries/${id}`);
    revalidatePath("/admin/master-search");
    
    return { success: true, message: `Successfully marked as ${newStatus}` };

  } catch (error) {
    console.error("Update Error:", error);
    return { success: false, message: "Server error occurred" };
  }
}