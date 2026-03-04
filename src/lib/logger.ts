import AuditLog from "@/models/AuditLog";
import { getSession } from "@/app/actions/authActions";
import { connectDB } from "./mongoose";

export async function logAction(action: string, beneficiaryName: string, details: string) {
  const session = await getSession();
  if (!session) return; // Don't log if not logged in

  await connectDB();
  await AuditLog.create({
    action,
    performedBy: session.name,
    beneficiaryName,
    details
  });
}