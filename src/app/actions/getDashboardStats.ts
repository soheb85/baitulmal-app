"use server"

import { connectDB } from "@/lib/mongoose"
import Beneficiary from "@/models/Beneficiary";

export async function getDashboardStats() {
    await connectDB();

    try {
    // 1. Get start of today (00:00:00)
    const startOfDay = new Date();
    startOfDay.setHours(0, 0, 0, 0);

    // 2. Run queries in parallel for speed
    const [totalBeneficiaries, blacklistedCount, newToday] = await Promise.all([
      // Count All Registered
      Beneficiary.countDocuments(),
      
      // Count Rejected/Blacklisted
      Beneficiary.countDocuments({ status: "BLACKLISTED" }),

      // Count Registered TODAY
      Beneficiary.countDocuments({ 
        createdAt: { $gte: startOfDay } 
      }),
    ]);

    return {
      total: totalBeneficiaries || 0,
      blacklisted: blacklistedCount || 0,
      newToday: newToday || 0,
      distributedToday: 0, // Placeholder until we make RationHistory model
    };

  } catch (error) {
    console.error("Error fetching stats:", error);
    // Return zeros if DB fails, so app doesn't crash
    return {
      total: 0,
      blacklisted: 0,
      newToday: 0,
      distributedToday: 0,
    };
  }
}

