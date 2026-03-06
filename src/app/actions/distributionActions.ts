/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary, { Counter } from "@/models/Beneficiary"; 
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; 
import Inventory from "@/models/Inventory";

const currentYear = new Date().getFullYear();

// --- ACTION 1: Check-In (Verification Station) ---
export async function checkInBeneficiary(id: string) {
  await connectDB();
  const now = new Date();
  
  // Create a YYYY-MM-DD string to track the "Distribution Day"
  // This allows tokens to persist if the work continues past midnight
  const queueDateString = now.toISOString().split("T")[0]; 

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

    // 3. Annual Check (Has this person already taken ration this Ramadan/Year?)
    if (person.distributedYears?.includes(currentYear)) {
      return {
        success: false,
        message: `Ration already provided for the year ${currentYear}.`,
      };
    }

    // 4. Robust Queue Check (Handles overnight rollovers)
    // If they have an active token from ANY date, don't let them check in again
    if (person.todayStatus && person.todayStatus.status === "CHECKED_IN") {
      return {
        success: false,
        message: `Already in Queue! Token #${person.todayStatus.tokenNumber}`,
      };
    }

    // 5. ATOMIC TOKEN GENERATION (Prevents Duplicate Tokens)
    const counter = await Counter.findOneAndUpdate(
      { _id: `tokens-${queueDateString}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true } 
    );

    const newTokenNumber = counter.seq;

    // 6. Update Status
    person.todayStatus = {
      date: now,
      queueDate: queueDateString,
      year: currentYear,
      status: "CHECKED_IN",
      tokenNumber: newTokenNumber,
    };

    await person.save();

    // 7. Safe Logging (Will not break check-in if logger fails)
    try {
        await logAction(
          "CHECK_IN",
          person.fullName,
          `Verified and issued Token #${newTokenNumber}`
        );
    } catch (e) {
        console.error("Logger Failed for CHECK_IN:", e);
    }

    revalidatePath("/distribution/live-queue");
    revalidatePath("/distribution/check-in");

    return { success: true, message: `Checked In! Token #${newTokenNumber}` };
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
      tokenNumber: beneficiary.todayStatus?.tokenNumber
    });

    // 2. Add to annual distributed years array
    if (!beneficiary.distributedYears.includes(currentYear)) {
      beneficiary.distributedYears.push(currentYear);
    }

    // 3. Update current status to COLLECTED (Removes them from Live Queue)
    beneficiary.todayStatus.status = "COLLECTED";

    await beneficiary.save();

    // 4. Safe Logging for Distribution
    try {
        // If this isn't saving to your DB, you MUST check your Log model enum
        await logAction(
          "DISTRIBUTION",
          beneficiary.fullName,
          `Ration kit handed over for year ${currentYear}`
        );
    } catch (e) {
        console.error("Logger Failed for DISTRIBUTION:", e);
    }

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

// --- ACTION 3: Get Live Queue & Stats ---
export async function getLiveQueue() {
  await connectDB();

  const todayQueue = new Date().toISOString().split("T")[0];
  // 1. Get the Live Queue (Only people who are CHECKED_IN)
  const queue = await Beneficiary.find({
    "todayStatus.status": "CHECKED_IN",
    "todayStatus.queueDate": todayQueue
  })
  .sort({ "todayStatus.tokenNumber": 1 })
  .lean();

  // 2. Calculate "Distributed Today" count
  const todayStart = new Date();
  todayStart.setHours(0, 0, 0, 0);

  const distributedToday = await Beneficiary.countDocuments({
    "todayStatus.status": "COLLECTED",
    "todayStatus.date": { $gte: todayStart }
  });

  // 3. Return BOTH the queue and the count
  return {
    queue: JSON.parse(JSON.stringify(queue)),
    distributedToday
  };
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

    person.verificationCycle = {
      startDate: now,
      endDate: newExpiry,
      isFullyVerified: true,
    };

    const timestamp = now.toLocaleDateString("en-IN");
    person.comments = `[System: Cycle Renewed ${timestamp}] ${person.comments || ""}`;

    await person.save();

    try {
        await logAction(
          "RE_VERIFY",
          person.fullName,
          `3-Year cycle renewed. New expiry: ${newExpiry.getFullYear()}`
        );
    } catch(e) {
        console.error("Logger Failed for RE_VERIFY:", e);
    }

    revalidatePath("/distribution/check-in");
    revalidatePath(`/beneficiaries/${id}`);

    return { success: true, message: "Cycle renewed for 3 more years!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}