/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function getCycleStats() {
  await connectDB();

  try {
    const allActive = await Beneficiary.find({ status: "ACTIVE" }).lean();
    
    // Count how many years each person has received ration
    const stats = {
      year1: 0, // Distributed once
      year2: 0, // Distributed twice
      year3: 0, // Distributed thrice
      newlyVerified: 0 // Registered but hasn't received ration yet
    };

    allActive.forEach((b: any) => {
      const count = b.distributedYears?.length || 0;
      if (count === 0) stats.newlyVerified++;
      else if (count === 1) stats.year1++;
      else if (count === 2) stats.year2++;
      else stats.year3++;
    });

    return { success: true, stats };
  } catch (error) {
    return { success: false, stats: { year1: 0, year2: 0, year3: 0, newlyVerified: 0 } };
  }
}