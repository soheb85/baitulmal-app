/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary, { Counter } from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

// --- 1. BULK RESET ---
export async function resetDailyQueue(queueDate: string, resetCounter: boolean) {
  await connectDB();

  try {
    const updateResult = await Beneficiary.updateMany(
      { 
        "todayStatus.queueDate": queueDate,
        "todayStatus.status": "CHECKED_IN" 
      },
      { 
        $set: { 
          "todayStatus.status": null,
          "todayStatus.tokenNumber": null,
          "todayStatus.queueDate": null,
          "todayStatus.date": null,
          "todayStatus.year": null,
        } 
      }
    );

    let counterResetStr = "Counter left as is.";
    if (resetCounter) {
      const counterId = `tokens-${queueDate}`;
      await Counter.findByIdAndUpdate(
        counterId,
        { $set: { seq: 0 } },
        { upsert: true } 
      );
      counterResetStr = "Token counter reset to 0.";
    }

    await logAction(
      "QUEUE_RESET",
      "SUPER_ADMIN",
      `Cleared ${updateResult.modifiedCount} stuck checked-in tokens for date ${queueDate}. ${counterResetStr}`
    );

    revalidatePath("/distribution/live-queue");
    revalidatePath("/distribution/check-in");

    return { 
      success: true, 
      clearedCount: updateResult.modifiedCount,
      message: `Successfully cleared ${updateResult.modifiedCount} people from the queue.`
    };

  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 2. SINGLE USER RESET ---
export async function resetSingleUserQueue(userId: string) {
  await connectDB();

  try {
    const user = await Beneficiary.findByIdAndUpdate(
      userId,
      {
        $set: {
          "todayStatus.status": null,
          "todayStatus.tokenNumber": null,
          "todayStatus.queueDate": null,
          "todayStatus.date": null,
          "todayStatus.year": null,
        }
      },
      { new: true }
    );

    if (!user) {
      return { success: false, message: "Beneficiary not found" };
    }

    await logAction(
      "QUEUE_RESET",
      "SUPER_ADMIN",
      `Surgically cleared queue status for ${user.fullName} (${user.aadharNumber})`
    );

    revalidatePath("/distribution/live-queue");
    revalidatePath("/distribution/check-in");
    revalidatePath(`/beneficiaries/${userId}`);

    return { success: true, message: `Cleared queue data for ${user.fullName}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 3. GET CURRENT COUNTER ---
export async function getDailyCounter(dateStr: string) {
  await connectDB();
  try {
    const counterId = `tokens-${dateStr}`;
    const counter = await Counter.findById(counterId).lean();
    return { success: true, seq: counter ? counter.seq : 0 };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 4. OVERWRITE COUNTER ---
export async function setDailyCounter(dateStr: string, newSeq: number) {
  await connectDB();
  try {
    if (newSeq < 0) return { success: false, message: "Sequence cannot be negative." };

    const counterId = `tokens-${dateStr}`;
    await Counter.findByIdAndUpdate(
      counterId,
      { $set: { seq: newSeq } },
      { upsert: true, new: true }
    );

    await logAction(
      "COUNTER_FIX",
      "SUPER_ADMIN",
      `Manually set token counter for ${dateStr} to ${newSeq}`
    );

    return { success: true, message: `Token counter for ${dateStr} set to ${newSeq}. Next token will be ${newSeq + 1}.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}