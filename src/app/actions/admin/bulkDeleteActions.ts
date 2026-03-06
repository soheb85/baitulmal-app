/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

// --- 1. SEARCH FOR SPECIFIC DELETION ---
export async function searchForBulkDelete(query: string) {
  await connectDB();
  if (!query) return [];

  const regex = new RegExp(query, "i");
  const results = await Beneficiary.find({
    $or: [
      { fullName: regex },
      { mobileNumber: regex },
      { aadharNumber: regex },
      { area: regex },
      { status: regex } 
    ]
  }).limit(100).lean();

  return JSON.parse(JSON.stringify(results));
}

// --- 2. DELETE SELECTED ARRAY OF IDs ---
export async function executeBulkDelete(ids: string[]) {
  await connectDB();

  try {
    if (!ids || ids.length === 0) {
      return { success: false, message: "No records selected for deletion." };
    }

    const result = await Beneficiary.deleteMany({ _id: { $in: ids } });

    await logAction(
      "BULK_DELETE",
      "SUPER_ADMIN",
      `Permanently deleted ${result.deletedCount} selected records.`
    );

    revalidatePath("/");
    revalidatePath("/beneficiaries");
    return { success: true, deletedCount: result.deletedCount };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 3. GET TOTAL COUNT FOR WIPE TAB ---
export async function getTotalBeneficiaryCount() {
  await connectDB();
  try {
    const count = await Beneficiary.countDocuments();
    return { success: true, count };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 4. NUCLEAR OPTION: WIPE ENTIRE DATABASE ---
export async function executeWipeAll() {
  await connectDB();

  try {
    const result = await Beneficiary.deleteMany({});

    await logAction(
      "DATABASE_WIPE",
      "SUPER_ADMIN",
      `NUCLEAR WIPE: Deleted ALL ${result.deletedCount} records from the database.`
    );

    revalidatePath("/");
    revalidatePath("/beneficiaries");
    revalidatePath("/admin/advanced-tools/find-duplicates");

    return { success: true, deletedCount: result.deletedCount };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}