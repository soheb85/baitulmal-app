/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

// 1. Search specifically for the override tool
export async function searchForOverride(query: string) {
  await connectDB();
  if (!query) return [];

  const regex = new RegExp(query, "i");
  const results = await Beneficiary.find({
    $or: [
      { fullName: regex },
      { mobileNumber: regex },
      { aadharNumber: regex }
    ]
  }).limit(10).lean();

  return JSON.parse(JSON.stringify(results));
}

// 2. Override a specific field directly in the database
export async function overrideField(id: string, fieldPath: string, newValue: any) {
  await connectDB();

  try {
    const person = await Beneficiary.findById(id);
    if (!person) return { success: false, message: "Beneficiary not found" };

    // Create the update object. Bracket notation allows updating nested fields like 'todayStatus.tokenNumber'
    const updateObj = { [fieldPath]: newValue };

    // $set forces the update, runValidators: false allows bypassing standard rules for Super Admins
    await Beneficiary.findByIdAndUpdate(
      id, 
      { $set: updateObj }, 
      { new: true, runValidators: false }
    );

    await logAction(
      "SUPER_ADMIN_OVERRIDE", 
      person.fullName, 
      `Force updated field [${fieldPath}] to [${newValue}]`
    );

    // Refresh everything
    revalidatePath("/");
    revalidatePath("/beneficiaries");
    revalidatePath("/admin/advanced-tools");
    revalidatePath(`/beneficiaries/${id}`);

    // Return the updated person so the UI can refresh instantly
    const updatedPerson = await Beneficiary.findById(id).lean();
    return { success: true, data: JSON.parse(JSON.stringify(updatedPerson)) };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}