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
    if (!formData.isException && !allowedPincodes.includes(formData.currentPincode)) {
       return { 
         success: false, 
         message: `Area ${formData.currentPincode} is not eligible. If this is an approved special case, please check the 'Special Case Exception' box below.` 
       };
    }

    const manualDate = formData.registerDateManual ? new Date(formData.registerDateManual) : new Date();

    const start = new Date();
    const expiry = new Date(start);
    expiry.setFullYear(expiry.getFullYear() + 3);
    expiry.setDate(expiry.getDate() - 45);

    // 3. Create Record with 3-Year Cycle Initialization
    const person = await Beneficiary.create({
      ...formData,
      status: "ACTIVE",
      registerDateManual: manualDate,
      verificationCycle: {
        startDate: start,
        endDate: expiry,
        isFullyVerified: true
      },
    });

    // --- LOG: Registration Action ---
    const logMessage = formData.isException 
        ? `New beneficiary registered as a SPECIAL EXCEPTION from Pincode ${person.currentPincode}`
        : `New beneficiary registered from Pincode ${person.currentPincode}`;

    await logAction("REGISTRATION", person.fullName, logMessage);

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