/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";
import { getSession } from "./authActions";
import { revalidatePath } from "next/cache";
import { COLLECTION_SCHEMAS } from "@/constants/databaseSchema";

/**
 * FETCH ALL BACKUPS FOR A COLLECTION
 */
export async function getBackups(collectionName: string) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  
  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const collections = await db.listCollections().toArray();
  
  // Find collections starting with original name + _backup_
  return collections
    .filter(c => c.name.startsWith(`${collectionName}_backup_`))
    .map(c => c.name)
    .sort()
    .reverse(); // Show newest first
}

/**
 * RESTORE A COLLECTION FROM A BACKUP
 */
export async function restoreBackup(collectionName: string, backupCollectionName: string) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  try {
    // 1. Delete current data (destructive)
    await db.collection(collectionName).deleteMany({});
    
    // 2. Use aggregation to push data from backup to the main collection
    await db.collection(backupCollectionName).aggregate([
        { $match: {} },
        { $out: collectionName }
    ]).toArray();

    revalidatePath("/", "layout");
    return { success: true, message: `Successfully restored ${collectionName} from ${backupCollectionName}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * DELETE A BACKUP COLLECTION
 */
export async function deleteBackup(backupCollectionName: string) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  try {
    await db.collection(backupCollectionName).drop();
    return { success: true, message: `Backup deleted: ${backupCollectionName}` };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

/**
 * 🌟 SMART DYNAMIC MIGRATION ENGINE 🌟
 */
export async function executeDynamicMigration(formData: {
  collectionName: string;
  fieldName: string;
  defaultValue: any;
  valueType: "string" | "number" | "boolean" | "json";
  shouldBackup: boolean;
  operationType: "add" | "remove";
}) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await connectDB();
  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const rawCollection = db.collection(formData.collectionName);
  const schemaDef = (COLLECTION_SCHEMAS as any)[formData.collectionName];

  try {
    // --- STEP 1: BACKUP ---
    if (formData.shouldBackup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupCollectionName = `${formData.collectionName}_backup_${timestamp}`;
      await rawCollection.aggregate([{ $match: {} }, { $out: backupCollectionName }]).toArray();
    }

    // --- STEP 2: SMART PATH RESOLUTION ---
    let mongoUpdatePath = formData.fieldName;

    // If the path has a dot, we need to check if the root is an Array of Objects
    if (formData.fieldName.includes(".") && schemaDef) {
      const parts = formData.fieldName.split(".");
      const rootKey = parts[0];

      // Check the schema! Is this root key an Array of Objects? (e.g. pastCycles or familyMembersDetail)
      if (schemaDef.arrayOfObjects && schemaDef.arrayOfObjects[rootKey]) {
        // Automatically inject the MongoDB Array Positional Operator: $[]
        // Converts "pastCycles.newField" into "pastCycles.$[].newField"
        parts.splice(1, 0, "$[]");
        mongoUpdatePath = parts.join(".");
      }
      // If it is just a normal object (like todayStatus.newField), we leave it exactly as typed!
    }

    let result;

    // --- STEP 3: MIGRATION LOGIC ---
    if (formData.operationType === "remove") {
      result = await rawCollection.updateMany({}, { $unset: { [mongoUpdatePath]: "" } } as any);
    } else {
      // --- SANITIZE VALUE ---
      let finalValue: any = formData.defaultValue;

      if (formData.valueType === "string") {
        finalValue = (finalValue === undefined || finalValue === null || finalValue === "") ? "" : String(finalValue);
      } else if (formData.valueType === "number") {
        finalValue = (finalValue === "" || finalValue === undefined) ? 0 : Number(finalValue);
      } else if (formData.valueType === "boolean") {
        finalValue = String(formData.defaultValue).toLowerCase() === "true";
      } else if (formData.valueType === "json") {
        try { 
          finalValue = finalValue ? JSON.parse(finalValue) : {}; 
        } catch (e) { 
          throw new Error("Invalid JSON format. Make sure to use double quotes around keys."); 
        }
      } else if (formData.valueType === "date") {
        // 🌟 NEW: SMART DATE HANDLING 🌟
        if (formData.defaultValue === "__NULL__") {
          finalValue = null; // Explicitly set to MongoDB Null
        } else if (formData.defaultValue === "__CURRENT__") {
          finalValue = new Date(); // Set to exactly right now
        } else {
          finalValue = new Date(formData.defaultValue); // Parse the custom user date
        }
      }

      result = await rawCollection.updateMany({}, { $set: { [mongoUpdatePath]: finalValue } } as any);
    }

    revalidatePath("/", "layout"); 
    
    return { 
      success: true, 
      message: `Success! Modified ${result.modifiedCount} docs. Target Path used: [${mongoUpdatePath}]` 
    };
  } catch (error: any) {
    console.error("Migration Error:", error);
    return { success: false, message: error.message };
  }
}