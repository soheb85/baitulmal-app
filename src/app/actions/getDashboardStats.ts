"use server"

import { connectDB } from "@/lib/mongoose"
import Beneficiary from "@/models/Beneficiary";

export async function getDashboardStats() {
    await connectDB();

    try {
        const startOfDay = new Date();
        startOfDay.setHours(0, 0, 0, 0);

        // Run queries in parallel
        const [totalBeneficiaries, blacklistedCount, newToday, distributedToday, totalKitsResult] = await Promise.all([
            Beneficiary.countDocuments(),
            Beneficiary.countDocuments({ status: "BLACKLISTED" }),
            Beneficiary.countDocuments({ createdAt: { $gte: startOfDay } }),
            
            // Count for TODAY only
            Beneficiary.countDocuments({ 
                "todayStatus.status": "COLLECTED",
                "todayStatus.date": { $gte: startOfDay }
            }),

            // Total Kits Ever Distributed (Sum of all history arrays)
            Beneficiary.aggregate([
                { $project: { count: { $size: { $ifNull: ["$distributionHistory", []] } } } },
                { $group: { _id: null, total: { $sum: "$count" } } }
            ])
        ]);

        return {
            total: totalBeneficiaries || 0,
            blacklisted: blacklistedCount || 0,
            newToday: newToday || 0,
            distributedToday: distributedToday || 0,
            totalKitsAllTime: totalKitsResult[0]?.total || 0, // Lifetime Total
        };

    } catch (error) {
        console.error("Error fetching stats:", error);
        return { total: 0, blacklisted: 0, newToday: 0, distributedToday: 0, totalKitsAllTime: 0 };
    }
}