/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";

export async function registerBeneficiary(formData: any) {
  await connectDB();

  try {
    // 1. Check for Duplicates (Double Dipping)
    const existingAadhar = await Beneficiary.findOne({ aadharNumber: formData.aadharNumber });
    if (existingAadhar) {
      return { success: false, message: "This Aadhaar Number is already registered!" };
    }

    const existingMobile = await Beneficiary.findOne({ mobileNumber: formData.mobileNumber });
    if (existingMobile) {
      return { success: false, message: "This Mobile Number is already used by another family member!" };
    }

    // 2. Validate Pincode Logic (Simple version for now)
    // You can add your list of allowed pincodes here
    const allowedPincodes = ["400024", "400070"]; 
    
    // If current address is NOT in allowed list
    if (!allowedPincodes.includes(formData.currentPincode)) {
       return { success: false, message: `We do not serve the area: ${formData.currentPincode}` };
    }

    // 3. Create Record
    const newBeneficiary = await Beneficiary.create({
      ...formData,
      status: "ACTIVE", // Default active
    });

    // 4. Refresh Dashboard Data
    revalidatePath("/");
    
    return { success: true, message: "Beneficiary Registered Successfully!" };

  } catch (error: any) {
    console.error("Registration Error:", error);
    return { success: false, message: "Server Error: " + error.message };
  }
}