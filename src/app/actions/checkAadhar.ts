"use server";
import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function checkAadharDuplicate(aadhar: string) {
  await connectDB();
  
  try {
    const existing = await Beneficiary.findOne({ aadharNumber: aadhar }).lean();
    
    if (existing) {
      // Safely extract the year or provide a fallback if the cycle isn't set yet
      const expiryDate = existing.verificationCycle?.endDate;
      const expiryYear = expiryDate ? new Date(expiryDate).getFullYear() : (new Date().getFullYear() + 3);

      return { 
        exists: true, 
        message: `Already registered. Verified until Ramzan ${expiryYear}`,
        name: existing.fullName,
        mobileNumber: existing.mobileNumber
      };
    }
    
    return { exists: false };
  } catch (error) {
    console.error("Aadhaar Check Error:", error);
    return { exists: false };
  }
}