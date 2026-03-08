"use server";
import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function checkAadharDuplicate(aadhar: string) {
  await connectDB();
  
  try {
    const existing = await Beneficiary.findOne({ aadharNumber: aadhar }).lean();
    
    if (existing) {
      // 1. Calculate Expiry Year
      const expiryDate = existing.verificationCycle?.endDate;
      const expiryYear = expiryDate ? new Date(expiryDate).getFullYear() : (new Date().getFullYear() + 3);

      // 2. Calculate Ration Count from your distributionHistory array
      const rationCount = Array.isArray(existing.distributionHistory) 
        ? existing.distributionHistory.length 
        : 0;

        

      // 3. Return the exact fields matching your schema
      return { 
        exists: true, 
        message: `Already registered. Verified until Ramzan ${expiryYear}`,
        name: existing.fullName,
        mobileNumber: existing.mobileNumber.toString() || "N/A",
        status: existing.status,
        rationCount: rationCount
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Aadhaar Check Error:", error);
    return { exists: false };
  }
}