/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import DailyChallan from "@/models/DailyChallan";
import { getSession } from "@/app/actions/authActions";
import { revalidatePath } from "next/cache";

export type DateFilter = "TODAY" | "WEEK" | "MONTH" | "ALL";

// --- DASHBOARD DATA ---
export async function getCollectionDashboardData(filter: DateFilter) {
  await connectDB();
  const session = await getSession();
  
  if (!session || !session.hasCollectionAccess) {
    return { success: false, message: "Unauthorized" };
  }

  try {
    const query: any = {};
    
    // --- BUSINESS DAY LOGIC (IST +5:30) ---
    const now = new Date();
    // Convert current UTC time to IST Total Minutes from midnight
    const istOffset = 5.5 * 60; // 330 minutes
    const istTime = new Date(now.getTime() + (istOffset * 60 * 1000));
    
    const istHours = istTime.getUTCHours();
    const istMinutes = istTime.getUTCMinutes();
    const totalIstMinutes = istHours * 60 + istMinutes;

    // Determine the "Effective Date" (If before 5:30 AM, use yesterday)
    const effectiveDate = new Date(istTime);
    if (totalIstMinutes < 330) { // 330 mins = 5:30 AM
      effectiveDate.setUTCDate(effectiveDate.getUTCDate() - 1);
    }

    if (filter === "TODAY") {
      // Create a query for the start of the Effective Date
      const startOfToday = new Date(effectiveDate.getUTCFullYear(), effectiveDate.getUTCMonth(), effectiveDate.getUTCDate());
      query.collectionDate = { $gte: startOfToday };
    } 
    else if (filter === "WEEK") {
      const startOfWeek = new Date(effectiveDate.getUTCFullYear(), effectiveDate.getUTCMonth(), effectiveDate.getUTCDate() - effectiveDate.getUTCDay());
      query.collectionDate = { $gte: startOfWeek };
    } 
    else if (filter === "MONTH") {
      const startOfMonth = new Date(effectiveDate.getUTCFullYear(), effectiveDate.getUTCMonth(), 1);
      query.collectionDate = { $gte: startOfMonth };
    }

    const challans = await DailyChallan.find(query)
      .sort({ collectionDate: -1, createdAt: -1 })
      .lean();

    const stats = {
      grandTotal: 0,
      totalCash: 0,
      totalOnline: 0,
      funds: {
        baitulmal: { cash: 0, online: 0, total: 0 },
        madarsa: { cash: 0, online: 0, total: 0 },
        fitra: { cash: 0, online: 0, total: 0 }
      },
      pendingApprovals: 0,
    };

    const userTotals: Record<string, any> = {};

    challans.forEach((ch: any) => {
      if (ch.status === "PENDING") stats.pendingApprovals++;

      if (ch.status === "APPROVED") {
        const bC = Number(ch.baitulmalCash) || 0;
        const bO = Number(ch.baitulmalOnline) || 0;
        const mC = Number(ch.madarsaCash) || 0;
        const mO = Number(ch.madarsaOnline) || 0;
        const fC = Number(ch.fitraCash) || 0;
        const fO = Number(ch.fitraOnline) || 0;

        stats.funds.baitulmal.cash += bC;
        stats.funds.baitulmal.online += bO;
        stats.funds.baitulmal.total += (bC + bO);

        stats.funds.madarsa.cash += mC;
        stats.funds.madarsa.online += mO;
        stats.funds.madarsa.total += (mC + mO);

        stats.funds.fitra.cash += fC;
        stats.funds.fitra.online += fO;
        stats.funds.fitra.total += (fC + fO);

        stats.totalCash += (bC + mC + fC);
        stats.totalOnline += (bO + mO + fO);
        stats.grandTotal += (Number(ch.grandTotal) || 0);

        const uid = String(ch.submittedBy);
        if (!userTotals[uid]) {
          userTotals[uid] = { name: ch.submittedByName, total: 0, challanCount: 0 };
        }
        userTotals[uid].total += (Number(ch.grandTotal) || 0);
        userTotals[uid].challanCount++;
      }
    });

    return {
      success: true,
      stats,
      userWise: Object.values(userTotals).sort((a: any, b: any) => b.total - a.total),
      recentChallans: JSON.parse(JSON.stringify(challans.slice(0, 15)))
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
// --- SUBMIT CHALLAN ---
export async function submitDailyChallan(data: any) {
  await connectDB();
  const session = await getSession();
  if (!session || !session.canSubmitCollection)
    return { success: false, message: "Unauthorized." };

  try {
    const dateObj = new Date(data.collectionDate);
    const dateStr = dateObj.toISOString().slice(0, 10).replace(/-/g, "");

    const count = await DailyChallan.countDocuments({
      collectionDate: {
        $gte: new Date(dateObj.setHours(0, 0, 0, 0)),
        $lte: new Date(dateObj.setHours(23, 59, 59, 999)),
      },
    });
    const challanNumber = `CHL-${dateStr}-${(count + 1).toString().padStart(3, "0")}`;

    const baitulmalCash = Number(data.baitulmalCash) || 0;
const baitulmalOnline = Number(data.baitulmalOnline) || 0;

const madarsaCash = Number(data.madarsaCash) || 0;
const madarsaOnline = Number(data.madarsaOnline) || 0;

const fitraCash = Number(data.fitraCash) || 0;
const fitraOnline = Number(data.fitraOnline) || 0;

const totalCashSubmitted =
  baitulmalCash +
  madarsaCash +
  fitraCash;

const totalOnlineSubmitted =
  baitulmalOnline +
  madarsaOnline +
  fitraOnline;

const grandTotal =
  totalCashSubmitted +
  totalOnlineSubmitted;

const newChallan = new DailyChallan({
  ...data,
  challanNumber,

  baitulmalCash,
  baitulmalOnline,
  madarsaCash,
  madarsaOnline,
  fitraCash,
  fitraOnline,

  totalCashSubmitted,
  totalOnlineSubmitted,
  grandTotal,

  submittedBy: session.id,
  submittedByName: session.name,
  status: "PENDING",
});

    await newChallan.save();
    revalidatePath("/admin/collections");
    return { success: true, message: `Challan ${challanNumber} submitted.` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- GET PENDING ---
export async function getPendingChallans() {
  await connectDB();
  const session = await getSession();
  if (!session || !session.canApproveCollection)
    return { success: false, message: "Unauthorized" };

  try {
    const challans = await DailyChallan.find({ status: "PENDING" })
      .sort({ collectionDate: -1 })
      .lean();
    return { success: true, challans: JSON.parse(JSON.stringify(challans)) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- UPDATE & APPROVE (Crucial Update Here) ---
export async function updateAndApproveChallan(
  challanId: string,
  updatedData: any,
) {
  await connectDB();
  const session = await getSession();
  if (!session || !session.canApproveCollection)
    return { success: false, message: "Unauthorized" };

  try {
    const challan = await DailyChallan.findById(challanId);
    if (!challan) return { success: false, message: "Challan not found" };

    // Update Ranges (NEW)
    challan.baitulmalFrom = updatedData.baitulmalFrom;
    challan.baitulmalTo = updatedData.baitulmalTo;
    challan.madarsaFrom = updatedData.madarsaFrom;
    challan.madarsaTo = updatedData.madarsaTo;

    // Update Book Numbers
    challan.baitulmalReceiptBookNumber = updatedData.baitulmalReceiptBookNumber;
    challan.madarsaReceiptBookNumber = updatedData.madarsaReceiptBookNumber;

    // Update Money Fields
    challan.baitulmalCash = Number(updatedData.baitulmalCash) || 0;
    challan.baitulmalOnline = Number(updatedData.baitulmalOnline) || 0;
    challan.madarsaCash = Number(updatedData.madarsaCash) || 0;
    challan.madarsaOnline = Number(updatedData.madarsaOnline) || 0;
    challan.fitraCash = Number(updatedData.fitraCash) || 0;
    challan.fitraOnline = Number(updatedData.fitraOnline) || 0;

    // Admin Notes
    challan.adminNotes = updatedData.adminNotes;

    // Approval Workflow
    challan.status = "APPROVED";
    challan.approvedBy = session.id;
    challan.approvedByName = session.name;
    challan.approvedAt = new Date();

    const totalCashSubmitted =
  challan.baitulmalCash +
  challan.madarsaCash +
  challan.fitraCash;

const totalOnlineSubmitted =
  challan.baitulmalOnline +
  challan.madarsaOnline +
  challan.fitraOnline;

challan.totalCashSubmitted = totalCashSubmitted;
challan.totalOnlineSubmitted = totalOnlineSubmitted;
challan.grandTotal =
  totalCashSubmitted +
  totalOnlineSubmitted;

    await challan.save(); // pre-save hook will recalculate totals automatically

    revalidatePath("/admin/collections");
    return {
      success: true,
      message: `Challan ${challan.challanNumber} verified and approved.`,
    };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- REJECT ---
export async function rejectChallan(challanId: string, reason: string) {
  await connectDB();
  const session = await getSession();
  try {
    await DailyChallan.findByIdAndUpdate(challanId, {
      status: "REJECTED",
      adminNotes: reason,
      approvedBy: session.id,
      approvedByName: session.name,
      approvedAt: new Date(),
    });
    revalidatePath("/admin/collections");
    return { success: true, message: "Challan Rejected." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}
