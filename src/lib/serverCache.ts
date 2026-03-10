import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import User from "@/models/User";

// --- 1. DASHBOARD STATS CACHE ---
export const getCachedDashboardStats = unstable_cache(
  async () => {
    await connectDB();

    // --- IST TIMEZONE LOGIC (For accurate "Today" stats) ---
    const now = new Date();
    const istOffset = 5.5 * 60; // 330 minutes
    const istTime = new Date(now.getTime() + (istOffset * 60 * 1000));
    
    // Set to 00:00:00 of the current day in IST, then convert back to UTC for MongoDB
    const startOfTodayIST = new Date(istTime.getFullYear(), istTime.getMonth(), istTime.getDate());
    const startOfDay = new Date(startOfTodayIST.getTime() - (istOffset * 60 * 1000));

    // Run queries in parallel
    const [totalBeneficiaries, blacklistedCount, newToday, distributedToday, totalKitsResult] = await Promise.all([
      Beneficiary.countDocuments(),
      Beneficiary.countDocuments({ status: "BLACKLISTED" }),
      Beneficiary.countDocuments({ createdAt: { $gte: startOfDay } }),
      Beneficiary.countDocuments({ 
        "todayStatus.status": "COLLECTED",
        "todayStatus.date": { $gte: startOfDay }
      }),
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
      totalKitsAllTime: totalKitsResult[0]?.total || 0,
    };
  },
  ["dashboard_stats_key"], // Unique cache key
  { tags: ["dashboard_cache"], revalidate: 3600 } // Revalidate every hour automatically, or manually via tags
);

// ==========================================
// 2. USERS LIST CACHE (For Admin Panel)
// ==========================================
export const getCachedUsersList = unstable_cache(
  async () => {
    await connectDB();
    const users = await User.find({ role: { $ne: "SUPER_ADMIN" } })
      .select("name username email isApproved role hasCollectionAccess canSubmitCollection canApproveCollection _id")
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(users));
  },
  ["global_users_list"], 
  { tags: ["users_cache"], revalidate: 86400 } 
);

// ==========================================
// 3. SINGLE USER CACHE (For Lightning Fast Sessions)
// ==========================================
export const getCachedUserById = unstable_cache(
  async (userId: string) => {
    await connectDB();
    const user = await User.findById(userId).lean();
    return user ? JSON.parse(JSON.stringify(user)) : null;
  },
  ["single_user_data"], // Next.js automatically appends the userId to this key behind the scenes
  { tags: ["users_cache"], revalidate: 86400 } 
);