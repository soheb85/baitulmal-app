/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";
import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function getBeneficiaryArrays(identifier: string) {
  await connectDB();
  try {
    const user = await Beneficiary.findOne({
      $or: [
        { aadharNumber: identifier }, 
        { mobileNumber: identifier }, 
        { fullName: new RegExp(identifier, "i") }
      ]
    }).lean();

    if (!user) return { success: false, message: "No beneficiary found." };

    const plainUser = JSON.parse(JSON.stringify(user));

    return { 
      success: true, 
      data: {
        _id: plainUser._id,
        fullName: plainUser.fullName,
        aadharNumber: plainUser.aadharNumber,
        // --- ADDED THESE NEW FIELDS FOR IDENTIFICATION ---
        mobileNumber: plainUser.mobileNumber,
        status: plainUser.status,
        gender: plainUser.gender,
        area: plainUser.area,
        currentPincode: plainUser.currentPincode,
        // -------------------------------------------------
        distributionHistory: plainUser.distributionHistory || [],
        familyMembersDetail: plainUser.familyMembersDetail || [],
        distributedYears: plainUser.distributedYears || [],
        problems: plainUser.problems || []
      }
    };
  } catch (e: any) {
    return { success: false, message: e.message };
  }
}

export async function removeArrayElement(
  beneficiaryId: string,
  arrayName: "distributionHistory" | "familyMembersDetail" | "distributedYears" | "problems",
  matchKey: string,
  matchValue: any
) {
  await connectDB();
  try {
    let pullQuery = {};

    // For Flat Arrays: [String] or [Number]
    if (arrayName === "problems" || arrayName === "distributedYears") {
      pullQuery = { [arrayName]: matchValue };
    } 
    // For Object Arrays: Subdocuments with _id
    else {
      pullQuery = { [arrayName]: { [matchKey]: matchValue } };
    }

    const result = await Beneficiary.findByIdAndUpdate(
      beneficiaryId,
      { $pull: pullQuery },
      { new: true }
    );

    if (result) {
      return { success: true, message: `Item successfully deleted from ${arrayName}.` };
    }
    return { success: false, message: "Beneficiary not found." };
  } catch (error: any) {
    console.error("Array Operation Error:", error);
    return { success: false, message: error.message || "Failed to delete item." };
  }
}