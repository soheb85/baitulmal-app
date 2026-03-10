"use server"

import { getCachedDashboardStats } from "@/lib/serverCache";

export async function getDashboardStats() {
    try {
        // ⚡ HITS THE RAM CACHE: 0ms response time!
        return await getCachedDashboardStats();
    } catch (error) {
        console.error("Error fetching stats:", error);
        return { total: 0, blacklisted: 0, newToday: 0, distributedToday: 0, totalKitsAllTime: 0 };
    }
}