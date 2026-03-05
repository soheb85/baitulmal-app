/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary, { Counter } from "@/models/Beneficiary"; // Import Counter from your model file
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";
import Inventory from "@/models/Inventory";

// Helper to get the current year for annual tracking
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

    // 2. Annual Check (Has this person already taken ration this Ramadan/Year?)
    if (person.distributedYears?.includes(currentYear)) {
      return {
        success: false,
        message: `Ration already provided for the year ${currentYear}.`,
      };
    }

    // 3. Robust Queue Check (Handles overnight rollovers)
    // If they have an active token from ANY date, don't let them check in again
    if (person.todayStatus && person.todayStatus.status === "CHECKED_IN") {
      return {
        success: false,
        message: `Already in Queue! Token #${person.todayStatus.tokenNumber}`,
      };
    }

    // 4. Same-Day Double Collection Check
    // Prevent checking in if they already collected on the same 'queueDate'
    if (person.todayStatus?.status === "COLLECTED" && person.todayStatus?.queueDate === queueDateString) {
      return { success: false, message: "Already collected ration today!" };
    }

    // 5. ATOMIC TOKEN GENERATION (Prevents Duplicate Tokens)
    // findOneAndUpdate with $inc is atomic in MongoDB - it "locks" the number during update
    const counter = await Counter.findOneAndUpdate(
      { _id: `tokens-${queueDateString}` },
      { $inc: { seq: 1 } },
      { upsert: true, new: true } // Create the day's counter if it doesn't exist
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

    // LOG: Check-In Action
    await logAction(
      "CHECK_IN",
      person.fullName,
      `Verified and issued Token #${newTokenNumber}`
    );

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
    // Important: We DON'T change the queueDate here, we keep the original one

    await beneficiary.save();

    // LOG: Distribution Action
    await logAction(
      "DISTRIBUTION",
      beneficiary.fullName,
      `Ration kit handed over for year ${currentYear}`
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

// --- ACTION 3: Get Live Queue (Fixed for Midnight Rollover) ---
export async function getLiveQueue() {
  await connectDB();

  // FIX: Remove date filter. Show everyone whose status is 'CHECKED_IN'.
  // They only leave the list when marked 'COLLECTED'.
  const todayQueue = new Date().toISOString().split("T")[0];

const queue = await Beneficiary.find({
  "todayStatus.status": "CHECKED_IN",
  "todayStatus.queueDate": todayQueue
})
.sort({ "todayStatus.tokenNumber": 1 })
.lean();

  return JSON.parse(JSON.stringify(queue));
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

    await logAction(
      "RE_VERIFY",
      person.fullName,
      `3-Year cycle renewed. New expiry: ${newExpiry.getFullYear()}`
    );

    revalidatePath("/distribution/check-in");
    revalidatePath(`/beneficiaries/${id}`);

    return { success: true, message: "Cycle renewed for 3 more years!" };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}