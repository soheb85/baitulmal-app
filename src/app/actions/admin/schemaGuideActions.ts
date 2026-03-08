/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import SchemaField from "@/models/SchemaField";

// --- THE SEED DATA ---
const DEFAULT_FIELDS = [
  { category: "1. Personal & Identity", colorTheme: "blue", fieldKey: "fullName", fieldType: "String", hint: "" },
  { category: "1. Personal & Identity", colorTheme: "blue", fieldKey: "aadharNumber", fieldType: "String", hint: "Exactly 12 digits" },
  { category: "1. Personal & Identity", colorTheme: "blue", fieldKey: "mobileNumber", fieldType: "String", hint: "Exactly 10 digits" },
  { category: "1. Personal & Identity", colorTheme: "blue", fieldKey: "gender", fieldType: "Enum", hint: '"MALE" or "FEMALE"' },
  { category: "1. Personal & Identity", colorTheme: "blue", fieldKey: "husbandStatus", fieldType: "Enum", hint: '"ALIVE", "WIDOW", "ABANDONED", "DIVORCED", "DISABLED", "NOT_MARRIED", "OTHERS"' },

  { category: "2. Address & Location", colorTheme: "indigo", fieldKey: "currentAddress", fieldType: "String", hint: "" },
  { category: "2. Address & Location", colorTheme: "indigo", fieldKey: "area", fieldType: "String", hint: "" },
  { category: "2. Address & Location", colorTheme: "indigo", fieldKey: "currentPincode", fieldType: "String", hint: "" },
  { category: "2. Address & Location", colorTheme: "indigo", fieldKey: "aadharPincode", fieldType: "String", hint: "" },

  { category: "3. Economic & Housing", colorTheme: "green", fieldKey: "isEarning", fieldType: "Boolean", hint: "true or false" },
  { category: "3. Economic & Housing", colorTheme: "green", fieldKey: "occupation", fieldType: "String", hint: "" },
  { category: "3. Economic & Housing", colorTheme: "green", fieldKey: "monthlyIncome", fieldType: "Number", hint: "" },
  { category: "3. Economic & Housing", colorTheme: "green", fieldKey: "totalFamilyIncome", fieldType: "Number", hint: "" },
  { category: "3. Economic & Housing", colorTheme: "green", fieldKey: "housingType", fieldType: "Enum", hint: '"OWN" or "RENT"' },
  { category: "3. Economic & Housing", colorTheme: "green", fieldKey: "rentAmount", fieldType: "Number", hint: "" },

  { category: "4. Family & Dependents", colorTheme: "teal", fieldKey: "sons", fieldType: "Number", hint: "" },
  { category: "4. Family & Dependents", colorTheme: "teal", fieldKey: "daughters", fieldType: "Number", hint: "" },
  { category: "4. Family & Dependents", colorTheme: "teal", fieldKey: "otherDependents", fieldType: "Number", hint: "" },
  { category: "4. Family & Dependents", colorTheme: "teal", fieldKey: "earningMembersCount", fieldType: "Number", hint: "" },
  { category: "4. Family & Dependents", colorTheme: "teal", fieldKey: "familyMembersDetail", fieldType: "Array", hint: "Query nested: familyMembersDetail.0.age" },

  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "status", fieldType: "Enum", hint: '"ACTIVE", "BLACKLISTED", "ON_HOLD"' },
  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "isException", fieldType: "Boolean", hint: "true or false" },
  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "problems", fieldType: "Array", hint: "e.g. contains Poor Health" },
  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "rejectionReason", fieldType: "String", hint: "" },
  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "rejectionBy", fieldType: "String", hint: "" },
  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "comments", fieldType: "String", hint: "" },
  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "referencedBy", fieldType: "String", hint: "" },
  { category: "5. Admin & Workflow", colorTheme: "rose", fieldKey: "createdBy", fieldType: "String", hint: "Admin who registered this profile" },

  { category: "6. Verification & History", colorTheme: "purple", fieldKey: "verificationCycle.startDate", fieldType: "Date", hint: "Format: DD/MM/YYYY" },
  { category: "6. Verification & History", colorTheme: "purple", fieldKey: "verificationCycle.endDate", fieldType: "Date", hint: "Format: DD/MM/YYYY" },
  { category: "6. Verification & History", colorTheme: "purple", fieldKey: "verificationCycle.isFullyVerified", fieldType: "Boolean", hint: "true or false" },
  { category: "6. Verification & History", colorTheme: "purple", fieldKey: "distributedYears", fieldType: "Array", hint: "e.g. contains 2026" },
  { category: "6. Verification & History", colorTheme: "purple", fieldKey: "distributionHistory", fieldType: "Array", hint: "Query nested: distributionHistory.0.year" },

  { category: "7. Today's Queue Status", colorTheme: "orange", fieldKey: "todayStatus.date", fieldType: "Date", hint: "Timestamp of check-in" },
  { category: "7. Today's Queue Status", colorTheme: "orange", fieldKey: "todayStatus.queueDate", fieldType: "String", hint: 'Format: "YYYY-MM-DD"' },
  { category: "7. Today's Queue Status", colorTheme: "orange", fieldKey: "todayStatus.year", fieldType: "Number", hint: "" },
  { category: "7. Today's Queue Status", colorTheme: "orange", fieldKey: "todayStatus.status", fieldType: "Enum", hint: '"CHECKED_IN", "COLLECTED", or null' },
  { category: "7. Today's Queue Status", colorTheme: "orange", fieldKey: "todayStatus.tokenNumber", fieldType: "Number", hint: "" },
  { category: "7. Today's Queue Status", colorTheme: "orange", fieldKey: "todayStatus.tempNote", fieldType: "String", hint: "" },

  { category: "8. System Dates", colorTheme: "indigo", fieldKey: "createdAt", fieldType: "Date", hint: "System creation (DD/MM/YYYY)" },
  { category: "8. System Dates", colorTheme: "indigo", fieldKey: "updatedAt", fieldType: "Date", hint: "Last modified (DD/MM/YYYY)" },
  { category: "8. System Dates", colorTheme: "indigo", fieldKey: "registerDateManual", fieldType: "Date", hint: "Admin entered date (DD/MM/YYYY)" }
];

// 1. Fetch all fields (With Auto-Seed logic)
export async function fetchSchemaFields() {
  await connectDB();
  try {
    // Check how many items exist
    const count = await SchemaField.countDocuments();
    
    // AUTO-SEED: If the database is completely empty, insert the defaults!
    if (count === 0) {
      await SchemaField.insertMany(DEFAULT_FIELDS);
    }

    // Now fetch whatever is in the database (either the freshly seeded data, or your custom data)
    const fields = await SchemaField.find({}).sort({ category: 1, fieldKey: 1 }).lean();
    return { success: true, data: JSON.parse(JSON.stringify(fields)) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 2. Add a new field dynamically from the UI
export async function addSchemaField(data: { category: string; colorTheme: string; fieldKey: string; fieldType: string; hint?: string }) {
  await connectDB();
  try {
    const existing = await SchemaField.findOne({ fieldKey: data.fieldKey });
    if (existing) return { success: false, message: "Field Key already exists in the guide." };

    await SchemaField.create(data);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// 3. Delete a field if you make a mistake
export async function deleteSchemaField(id: string) {
  await connectDB();
  try {
    await SchemaField.findByIdAndDelete(id);
    return { success: true };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}