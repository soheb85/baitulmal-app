/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; // Imported logger
import Inventory from "@/models/Inventory";

// Helper to get the current year for annual tracking
const currentYear = new Date().getFullYear();

// --- ACTION 1: Check-In (Verification Station) ---
export async function checkInBeneficiary(id: string) {
  await connectDB();
  const now = new Date();
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  try {
    const person = await Beneficiary.findById(id);
    if (!person) return { success: false, message: "User not found" };

    // 1. Check if status is BLACKLISTED
    if (person.status === "BLACKLISTED") {
      return {
        success: false,
        message: `Blocked: ${person.rejectionReason || "This beneficiary is blacklisted."}`,
      };
    }

    // 2. Verify 3-Year Cycle Expiry
    if (person.verificationCycle?.endDate) {
      const expiryDate = new Date(person.verificationCycle.endDate);
      if (now > expiryDate) {
        return {
          success: false,
          message: "Verification Cycle Expired. Please perform full re-verification.",
        };
      }
    }

    // 3. Check if already distributed THIS YEAR (Annual Check)
    if (person.distributedYears?.includes(currentYear)) {
      return {
        success: false,
        message: `Ration already provided for the year ${currentYear}.`,
      };
    }

    // 4. Daily Duplicate Check (Already in queue today)
    if (person.todayStatus && person.todayStatus.date) {
      const lastStatusDate = new Date(person.todayStatus.date);
      if (lastStatusDate >= todayStart) {
        if (person.todayStatus.status === "CHECKED_IN") {
          return {
            success: false,
            message: `Already in Queue! Token #${person.todayStatus.tokenNumber}`,
          };
        }
        if (person.todayStatus.status === "COLLECTED") {
          return { success: false, message: "Already collected ration today!" };
        }
      }
    }

    // 5. Generate Token and Update Status
    const count = await Beneficiary.countDocuments({
      "todayStatus.date": { $gte: todayStart },
      "todayStatus.status": { $in: ["CHECKED_IN", "COLLECTED"] },
    });

    person.todayStatus = {
      date: now,
      year: currentYear,
      status: "CHECKED_IN",
      tokenNumber: count + 1,
    };

    await person.save();

    // LOG: Check-In Action
    await logAction(
      "CHECK_IN",
      person.fullName,
      `Verified and added to queue with Token #${count + 1}`
    );

    revalidatePath("/distribution/live-queue");
    revalidatePath("/distribution/check-in");

    return { success: true, message: `Checked In! Token #${count + 1}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- ACTION 2: Mark Distributed (Counter Station) ---
export async function markDistributed(id: string) {
  await connectDB();

  try {
    const beneficiary = await Beneficiary.findById(id);
    if (!beneficiary) return { success: false, message: "Not found" };

    // 1. Add to permanent history
    beneficiary.distributionHistory.push({
      date: new Date(),
      year: currentYear,
      status: "COLLECTED",
    });

    // 2. Add to annual distributed years array
    if (!beneficiary.distributedYears.includes(currentYear)) {
      beneficiary.distributedYears.push(currentYear);
    }

    // 3. Update current today status
    beneficiary.todayStatus.status = "COLLECTED";

    await beneficiary.save();

    // LOG: Distribution Action
    await logAction(
      "DISTRIBUTION",
      beneficiary.fullName,
      `Ration kit handed over for Ramzan ${currentYear}`
    );

    await Inventory.findOneAndUpdate(
        { type: "RATION_KIT" },
        { $inc: { count: -1 } }
    );

    revalidatePath("/");
    revalidatePath("/distribution/live-queue");
    revalidatePath("/distribution/check-in");

    return { success: true, message: "Ration Distributed Successfully!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- ACTION 3: Get Live Queue (Serialization included) ---
export async function getLiveQueue() {
  await connectDB();
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const queue = await Beneficiary.find({
    "todayStatus.date": { $gte: today },
    "todayStatus.status": "CHECKED_IN",
  })
    .sort({ "todayStatus.tokenNumber": 1 })
    .lean();

  return queue.map((b: any) => ({
    ...b,
    _id: b._id.toString(),
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : null,
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : null,
    todayStatus: {
      ...b.todayStatus,
      date: b.todayStatus.date
        ? new Date(b.todayStatus.date).toISOString()
        : null,
    },
    familyMembersDetail: Array.isArray(b.familyMembersDetail)
      ? b.familyMembersDetail.map((m: any) => ({
          ...m,
          _id: m._id ? m._id.toString() : undefined,
        }))
      : [],
    distributionHistory: Array.isArray(b.distributionHistory)
      ? b.distributionHistory.map((h: any) => ({
          ...h,
          date: h.date ? new Date(h.date).toISOString() : null,
          _id: h._id ? h._id.toString() : undefined,
        }))
      : [],
  }));
}

// --- ACTION 4: Renew Cycle ---
export async function renewVerificationCycle(id: string) {
  await connectDB();

  try {
    const person = await Beneficiary.findById(id);
    if (!person) return { success: false, message: "User not found" };

    const now = new Date();
    const newExpiry = new Date();
    newExpiry.setFullYear(now.getFullYear() + 3);

    // Update the cycle
    person.verificationCycle = {
      startDate: now,
      endDate: newExpiry,
      isFullyVerified: true,
    };

    // Add a system comment
    const timestamp = now.toLocaleDateString("en-IN");
    person.comments = `[System: Cycle Renewed ${timestamp}] ${person.comments || ""}`;

    await person.save();

    // LOG: Renewal Action
    await logAction(
      "RE_VERIFY",
      person.fullName,
      `3-Year cycle renewed. New expiry: Ramzan ${newExpiry.getFullYear()}`
    );

    revalidatePath("/distribution/check-in");
    revalidatePath(`/beneficiaries/${id}`);

    return { success: true, message: "Cycle renewed for 3 more years!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}