/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger";

export async function bulkImportBeneficiaries(data: any[], fileName: string) {
  await connectDB();
  let successCount = 0;
  let skipCount = 0;
  const errors: string[] = [];

  try {
    for (const row of data) {
      try {
        if (!row.aadharNumber) {
          skipCount++;
          continue;
        }

        const exists = await Beneficiary.findOne({ aadharNumber: String(row.aadharNumber) });
        if (exists) {
          skipCount++;
          continue;
        }

        // Logic: Extract last 6 digits from Area string for pincode
        const areaStr = String(row.area || "");
        const extractedPincode = areaStr.match(/\d{6}$/)?.[0] || "400024";

        const manualDate = row.aidDate ? new Date(row.aidDate) : new Date();

        await Beneficiary.create({
          fullName: row.name,
          gender: String(row.gender).toUpperCase() === 'MALE' ? 'MALE' : 'FEMALE',
          mobileNumber: String(row.mobileNumber),
          aadharNumber: String(row.aadharNumber),
          currentAddress: row.address,
          area: row.area || "",
          referencedBy: row.referredBy || "", // <--- Mapped from Excel Column
          registerDateManual: manualDate,
          currentPincode: extractedPincode,
          aadharPincode: extractedPincode,
          status: "ACTIVE",
          isException: true, 
          verificationCycle: {
            startDate: new Date(),
            isFullyVerified: true
          }
        });

        successCount++;
      } catch (e: any) {
        errors.push(`Error in row ${row.name || 'Unknown'}: ${e.message}`);
      }
    }

    await logAction(
      "BULK_IMPORT", 
      "SUPER_ADMIN", 
      `Imported ${successCount} from file: ${fileName}`
    );

    revalidatePath("/beneficiaries");
    revalidatePath("/dashboard");
    
    return { success: true, successCount, skipCount, errors };
  } catch (error: any) {
    console.error("Bulk Import Error:", error);
    return { success: false, message: error.message };
  }
}