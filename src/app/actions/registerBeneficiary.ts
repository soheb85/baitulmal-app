/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; // Imported logger

export async function registerBeneficiary(formData: any) {
  await connectDB();

  try {
    // 1. Enhanced Duplicate Check for Aadhaar
    const existingAadhar = await Beneficiary.findOne({ aadharNumber: formData.aadharNumber });
    if (existingAadhar) {
      const expiryYear = new Date(existingAadhar.verificationCycle.endDate).getFullYear();
      return { 
        success: false, 
        message: `This Aadhaar is already registered for ${existingAadhar.fullName}. Valid until Ramzan ${expiryYear}.` 
      };
    }

    const existingMobile = await Beneficiary.findOne({ mobileNumber: formData.mobileNumber });
    if (existingMobile) {
      return { success: false, message: "This Mobile Number is already used by another family!" };
    }

    // 2. Validate Pincode Logic
    const allowedPincodes = ["400024", "400070"]; 
    if (!allowedPincodes.includes(formData.currentPincode)) {
       return { success: false, message: `Area ${formData.currentPincode} is not eligible for this scheme.` };
    }

    // 3. Create Record with 3-Year Cycle Initialization
    const person = await Beneficiary.create({
      ...formData,
      status: "ACTIVE",
      verificationCycle: {
        startDate: new Date(),
        isFullyVerified: true
      },
    });

    // --- LOG: Registration Action ---
    await logAction(
      "REGISTRATION",
      person.fullName,
      `New beneficiary registered from Pincode ${person.currentPincode}`
    );

    // 4. Refresh Cache
    revalidatePath("/");
    revalidatePath("/beneficiaries");
    revalidatePath("/distribution/check-in");
    
    return { success: true, message: "Beneficiary Registered & Verified for 3 Years!" };

  } catch (error: any) {
    console.error("Registration Error:", error);
    return { success: false, message: "Server Error: " + error.message };
  }
}