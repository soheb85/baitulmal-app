/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; // Imported logger

export async function syncLegacyData(id: string, years: number[]) {
  await connectDB();

  try {
    const person = await Beneficiary.findById(id);
    if (!person) return { success: false, message: "Beneficiary not found" };

    // 1. Update distributedYears (avoiding duplicates)
    const updatedYears = Array.from(new Set([...(person.distributedYears || []), ...years]));
    person.distributedYears = updatedYears.sort();

    // 2. Add records to distributionHistory so the timeline looks real
    years.forEach(year => {
      // Only add if history for that year doesn't exist
      const exists = person.distributionHistory.some((h: any) => h.year === year);
      if (!exists) {
        person.distributionHistory.push({
          date: new Date(year, 2, 15), // Approximate date (March of that year)
          year: year,
          status: "COLLECTED"
        });
      }
    });

    await person.save();
    
    // --- 3. LOG: Legacy Sync Action ---
    await logAction(
      "LEGACY_SYNC",
      person.fullName,
      `Manually synced history for years: ${years.join(", ")}`
    );

    revalidatePath(`/beneficiaries/${id}`);
    revalidatePath("/");
    
    return { success: true, message: "Legacy data synced successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}