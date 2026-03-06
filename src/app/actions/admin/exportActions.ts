/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { logAction } from "@/lib/logger";

// Get total count just for the UI display
export async function getExportCount() {
  await connectDB();
  try {
    const count = await Beneficiary.countDocuments();
    return { success: true, count };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// Fetch and flatten EVERYTHING for Excel
export async function fetchAllDataForExport() {
  await connectDB();
  try {
    const records = await Beneficiary.find({}).sort({ createdAt: -1 }).lean();

    // Flatten every single field from the schema into Excel columns
    const flatData = records.map((r: any) => {
      
      // 1. Format Family Members Array into a detailed text block
      const familyDetails = r.familyMembersDetail?.length > 0 
        ? r.familyMembersDetail.map((m: any, i: number) => 
            `[${i + 1}] ${m.name} (${m.relation}, ${m.age}y) | Marital: ${m.maritalStatus} | Earning: ${m.isEarning ? 'Yes (' + m.monthlyIncome + ')' : 'No'} | Studying: ${m.isStudying ? 'Yes (' + m.classStandard + ')' : 'No'} | Notes: ${m.memberNotes || 'N/A'}`
          ).join('\n') 
        : "No Family Members";

      // 2. Format Distribution History Array into a detailed text block
      const historyDetails = r.distributionHistory?.length > 0
        ? r.distributionHistory.map((h: any) => 
            `Year: ${h.year} | Status: ${h.status} | Token: ${h.tokenNumber || 'N/A'} | Date: ${h.date ? new Date(h.date).toLocaleDateString() : 'N/A'}`
          ).join('\n')
        : "No History";

      // 3. Format Problems Array
      const problemsDetails = r.problems?.length > 0 ? r.problems.join(", ") : "None";

      // 4. Map EVERYTHING to the final Excel Row
      return {
        "System ID": r._id.toString(),
        "Full Name": r.fullName,
        "Aadhaar Number": r.aadharNumber,
        "Mobile Number": r.mobileNumber,
        "Gender": r.gender,
        "Marital Status (Husband)": r.husbandStatus || "N/A",
        
        // Economics
        "Main Applicant Earning?": r.isEarning ? "YES" : "NO",
        "Occupation": r.occupation || "None",
        "Monthly Income": r.monthlyIncome || 0,
        "Total Family Income": r.totalFamilyIncome || 0,
        "Earning Members Count": r.earningMembersCount || 0,

        // Address & Housing
        "Aadhaar Pincode": r.aadharPincode || "",
        "Current Pincode": r.currentPincode || "",
        "Current Address": r.currentAddress || "",
        "Area": r.area || "",
        "Housing Type": r.housingType || "OWN",
        "Rent Amount": r.rentAmount || 0,

        // Family Counts
        "Sons": r.sons || 0,
        "Daughters": r.daughters || 0,
        "Other Dependents": r.otherDependents || 0,

        // --- THE DEEP ARRAY DATA ---
        "Detailed Family Members": familyDetails,
        "Distribution History Logs": historyDetails,
        "Noted Problems": problemsDetails,

        // Admin & Status
        "Account Status": r.status || "ACTIVE",
        "Is Exception Case?": r.isException ? "YES" : "NO",
        "Rejection Reason": r.rejectionReason || "",
        "Rejection By": r.rejectionBy || "",
        "Admin Comments": r.comments || "",
        "Referred By": r.referencedBy || "",

        // Verification Logic
        "Cycle Start Date": r.verificationCycle?.startDate ? new Date(r.verificationCycle.startDate).toISOString().split('T')[0] : "",
        "Cycle End Date": r.verificationCycle?.endDate ? new Date(r.verificationCycle.endDate).toISOString().split('T')[0] : "",
        "Is Fully Verified?": r.verificationCycle?.isFullyVerified ? "YES" : "NO",

        // Queue Data
        "Today Queue Status": r.todayStatus?.status || "None",
        "Today Token Number": r.todayStatus?.tokenNumber || "None",
        "Today Queue Date": r.todayStatus?.queueDate || "None",

        // Timestamps
        "Manual Registration Date": r.registerDateManual ? new Date(r.registerDateManual).toISOString().split('T')[0] : "",
        "System Created At": r.createdAt ? new Date(r.createdAt).toISOString() : "",
        "System Updated At": r.updatedAt ? new Date(r.updatedAt).toISOString() : "",
      };
    });

    await logAction(
      "DATABASE_EXPORT",
      "SUPER_ADMIN",
      `Downloaded full database backup (${records.length} records)`
    );

    return { success: true, data: flatData, count: records.length };
  } catch (error: any) {
    console.error("Export Error:", error);
    return { success: false, message: error.message };
  }
}