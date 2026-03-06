/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import mongoose from "mongoose";
import { logAction } from "@/lib/logger";
import { revalidatePath } from "next/cache";

export async function restoreDatabaseFromExcel(rows: any[]) {
  await connectDB();
  let successCount = 0;
  let errorCount = 0;
  const errors: string[] = [];

  try {
    for (const row of rows) {
      try {
        if (!row["Aadhaar Number"] || !row["Mobile Number"]) continue;

        // 1. REVERSE PARSE FAMILY MEMBERS
        const familyMembers = [];
        const familyStr = row["Detailed Family Members"];
        if (familyStr && familyStr !== "No Family Members") {
          const lines = familyStr.split('\n');
          for (const line of lines) {
            const parts = line.split('|').map((p: string) => p.trim());
            if (parts.length < 5) continue;

            // Example: "[1] Zain (SON, 12y)"
            const nameMatch = parts[0].match(/\]\s+(.*?)\s+\((.*),\s*(.*)y\)/);
            if (nameMatch) {
              const earningStr = parts[2].replace("Earning: ", "");
              const isEarning = earningStr.startsWith("Yes");
              const incomeMatch = earningStr.match(/\((.*?)\)/);

              const studyingStr = parts[3].replace("Studying: ", "");
              const isStudying = studyingStr.startsWith("Yes");
              const classMatch = studyingStr.match(/\((.*?)\)/);

              const notes = parts[4].replace("Notes: ", "");

              familyMembers.push({
                name: nameMatch[1],
                relation: nameMatch[2],
                age: nameMatch[3],
                maritalStatus: parts[1].replace("Marital: ", ""),
                isEarning: isEarning,
                monthlyIncome: isEarning && incomeMatch ? incomeMatch[1] : "0",
                isStudying: isStudying,
                classStandard: isStudying && classMatch ? classMatch[1] : "",
                memberNotes: notes !== 'N/A' ? notes : ""
              });
            }
          }
        }

        // 2. REVERSE PARSE HISTORY LOGS
        const historyLogs = [];
        const historyStr = row["Distribution History Logs"];
        if (historyStr && historyStr !== "No History") {
          const lines = historyStr.split('\n');
          for (const line of lines) {
            const parts = line.split('|').map((p: string) => p.trim());
            if (parts.length < 4) continue;

            const yearStr = parts[0].replace("Year: ", "");
            const tokenStr = parts[2].replace("Token: ", "");
            const dateStr = parts[3].replace("Date: ", "");

            historyLogs.push({
              year: parseInt(yearStr) || new Date().getFullYear(),
              status: "COLLECTED",
              tokenNumber: tokenStr !== "N/A" ? parseInt(tokenStr) : undefined,
              date: dateStr !== "N/A" ? new Date(dateStr) : new Date()
            });
          }
        }

        // 3. MAP THE REST OF THE FIELDS
        const updateData = {
          fullName: row["Full Name"],
          aadharNumber: String(row["Aadhaar Number"]),
          mobileNumber: String(row["Mobile Number"]),
          gender: row["Gender"] === "MALE" ? "MALE" : "FEMALE",
          husbandStatus: row["Marital Status (Husband)"] !== "N/A" ? row["Marital Status (Husband)"] : "ALIVE",
          
          isEarning: row["Main Applicant Earning?"] === "YES",
          occupation: row["Occupation"] || "None",
          monthlyIncome: Number(row["Monthly Income"]) || 0,
          totalFamilyIncome: Number(row["Total Family Income"]) || 0,
          earningMembersCount: Number(row["Earning Members Count"]) || 0,

          aadharPincode: String(row["Aadhaar Pincode"] || ""),
          currentPincode: String(row["Current Pincode"] || ""),
          currentAddress: row["Current Address"] || "",
          area: row["Area"] || "",
          housingType: row["Housing Type"] || "OWN",
          rentAmount: Number(row["Rent Amount"]) || 0,

          sons: Number(row["Sons"]) || 0,
          daughters: Number(row["Daughters"]) || 0,
          otherDependents: Number(row["Other Dependents"]) || 0,

          familyMembersDetail: familyMembers,
          distributionHistory: historyLogs,
          problems: row["Noted Problems"] !== "None" ? row["Noted Problems"].split(", ") : [],

          status: row["Account Status"] || "ACTIVE",
          isException: row["Is Exception Case?"] === "YES",
          rejectionReason: row["Rejection Reason"] || "",
          rejectionBy: row["Rejection By"] || "",
          comments: row["Admin Comments"] || "",
          referencedBy: row["Referred By"] || "",

          verificationCycle: {
            startDate: row["Cycle Start Date"] ? new Date(row["Cycle Start Date"]) : new Date(),
            endDate: row["Cycle End Date"] ? new Date(row["Cycle End Date"]) : undefined,
            isFullyVerified: row["Is Fully Verified?"] === "YES"
          },

          registerDateManual: row["Manual Registration Date"] ? new Date(row["Manual Registration Date"]) : undefined,
        };

        // 4. UPSERT (Update if System ID exists, otherwise Create)
        const sysId = row["System ID"];
        if (sysId && mongoose.Types.ObjectId.isValid(sysId)) {
          await Beneficiary.findByIdAndUpdate(sysId, updateData, { upsert: true, setDefaultsOnInsert: true });
        } else {
          // Fallback if no System ID: try to match by Aadhaar, or just create
          await Beneficiary.findOneAndUpdate(
            { aadharNumber: String(row["Aadhaar Number"]) },
            updateData,
            { upsert: true, setDefaultsOnInsert: true }
          );
        }

        successCount++;
      } catch (err: any) {
        errorCount++;
        errors.push(`Row Error (${row["Full Name"] || "Unknown"}): ${err.message}`);
      }
    }

    await logAction("DATABASE_RESTORE", "SUPER_ADMIN", `Restored/Updated ${successCount} records from Excel Backup.`);
    revalidatePath("/");
    revalidatePath("/beneficiaries");

    return { success: true, successCount, errorCount, errors };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}