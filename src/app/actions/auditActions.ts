/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import AuditLog from "@/models/AuditLog";
import { getSession } from "./authActions";

export async function getAuditLogs() {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") return [];

  await connectDB();
  // Get latest logs first
  const logs = await AuditLog.find().sort({ timestamp: -1 }).limit(100).lean();
  
  return logs.map((l: any) => ({
    ...l,
    _id: l._id.toString(),
    timestamp: l.timestamp.toISOString(),
  }));
}