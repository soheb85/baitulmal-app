/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";
import User from "@/models/User";
import Beneficiary from "@/models/Beneficiary";
import { getSession } from "./authActions";
import { revalidatePath } from "next/cache";

const MODEL_MAP: Record<string, mongoose.Model<any>> = {
  User: User,
  Beneficiary: Beneficiary,
};

/**
 * FETCH ALL BACKUPS FOR A MODEL
 */
export async function getBackups(modelName: string) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");
  
  await connectDB();
  const Model = MODEL_MAP[modelName];
  if (!Model) return [];

  const db = mongoose.connection.db;
  if (!db) throw new Error("Database not connected");

  const collections = await db.listCollections().toArray();
  const baseName = Model.collection.name;
  
  // Find collections starting with original name + _backup_
  return collections
    .filter(c => c.name.startsWith(`${baseName}_backup_`))
    .map(c => c.name)
    .sort()
    .reverse(); // Show newest first
}

/**
 * RESTORE A COLLECTION FROM A BACKUP
 */
export async function restoreBackup(modelName: string, backupCollectionName: string) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await connectDB();
  const Model = MODEL_MAP[modelName];
  const targetName = Model.collection.name;

  try {
    // 1. Delete current data (destructive)
    await Model.deleteMany({});
    
    // 2. Use aggregation to push data from backup to the main collection
    await mongoose.connection.db?.collection(backupCollectionName).aggregate([
        { $match: {} },
        { $out: targetName }
    ]).toArray();

    revalidatePath("/");
    return { success: true, message: `Successfully restored ${modelName}s from ${backupCollectionName}` };
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
 * RUN DYNAMIC MIGRATION
 */
// Update the executeDynamicMigration function signature and logic:
export async function executeDynamicMigration(formData: {
  modelName: string;
  fieldName: string;
  defaultValue: any;
  valueType: "string" | "number" | "boolean" | "json";
  isNested: boolean;
  shouldBackup: boolean;
  operationType: "add" | "remove";
}) {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") throw new Error("Unauthorized");

  await connectDB();
  const Model = MODEL_MAP[formData.modelName];
  if (!Model) return { success: false, message: "Model mapping not found" };

  // Use the raw collection to bypass Mongoose Schema validation/strictness
  const rawCollection = Model.collection;
  const collectionName = rawCollection.name;

  try {
    // --- STEP 1: BACKUP ---
    if (formData.shouldBackup) {
      const timestamp = new Date().toISOString().replace(/[:.]/g, "-");
      const backupCollectionName = `${collectionName}_backup_${timestamp}`;
      await rawCollection.aggregate([{ $match: {} }, { $out: backupCollectionName }]).toArray();
    }

    let result;

    // --- STEP 2: MIGRATION LOGIC ---
    if (formData.operationType === "remove") {
      if (formData.isNested) {
        const [arrayName, nestedField] = formData.fieldName.split(".");
        // Raw MongoDB syntax for unsetting inside every array element
        result = await rawCollection.updateMany(
          {}, 
          { $unset: { [`${arrayName}.$[].${nestedField}`]: "" } } as any
        );
      } else {
        result = await rawCollection.updateMany({}, { $unset: { [formData.fieldName]: "" } });
      }
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
          throw new Error("Invalid JSON format."); 
        }
      }

      if (formData.isNested) {
        const [arrayName, nestedField] = formData.fieldName.split(".");
        if (!nestedField) throw new Error("Use format: arrayName.fieldName");
        
        // Use raw collection to force update array elements
        result = await rawCollection.updateMany(
          {}, 
          { $set: { [`${arrayName}.$[].${nestedField}`]: finalValue } } as any
        );
      } else {
        // FORCE UPDATE using raw collection (This bypasses Mongoose schema checks)
        result = await rawCollection.updateMany(
          {}, 
          { $set: { [formData.fieldName]: finalValue } }
        );
      }
    }

    // Clear caches
    revalidatePath("/", "layout"); 
    
    return { 
      success: true, 
      message: `Success! Modified ${result.modifiedCount} docs in ${collectionName} using Raw Collection Access.` 
    };
  } catch (error: any) {
    console.error("Migration Error:", error);
    return { success: false, message: error.message };
  }
}