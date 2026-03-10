import { unstable_cache } from "next/cache";
import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
// Import your Beneficiary model here
// import Beneficiary from "@/models/Beneficiary"; 

// 1. CACHE: ALL STAFF/USERS
export const getCachedUsersList = unstable_cache(
  async () => {
    await connectDB();
    const users = await User.find({ role: { $ne: "SUPER_ADMIN" } })
      .select("name username email isApproved role hasCollectionAccess canSubmitCollection canApproveCollection _id")
      .sort({ createdAt: -1 })
      .lean();
    return JSON.parse(JSON.stringify(users));
  },
  ["global_users_list"], // Unique Cache Key
  { tags: ["users_cache"], revalidate: 86400 } // Cache for 24 hours, or until manually invalidated
);

// 2. CACHE: INDIVIDUAL USER PERMISSIONS (Speeds up Dashboard)
export const getCachedUserById = unstable_cache(
  async (userId: string) => {
    await connectDB();
    const user = await User.findById(userId).lean();
    return JSON.parse(JSON.stringify(user));
  },
  ["single_user_data"], 
  { tags: ["users_cache"], revalidate: 86400 }
);

// 3. CACHE: ALL BENEFICIARIES (Ration Cards)
/*
export const getCachedBeneficiaries = unstable_cache(
  async () => {
    await connectDB();
    const data = await Beneficiary.find().sort({ createdAt: -1 }).lean();
    return JSON.parse(JSON.stringify(data));
  },
  ["global_beneficiaries_list"],
  { tags: ["beneficiaries_cache"], revalidate: 86400 }
);
*/