/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import mongoose from "mongoose";
import { connectDB } from "@/lib/mongoose";
// Import all your models so Mongoose knows about them
import Beneficiary from "@/models/Beneficiary";
import User from "@/models/User";
import WebConfig from "@/models/WebConfig";
import { logAction } from "@/lib/logger";

export async function executeRawQuery(
  collectionName: string,
  operation: "find" | "findOne" | "countDocuments" | "updateMany" | "deleteMany",
  filterString: string,
  updateString?: string
) {
  await connectDB();

  try {
    // 1. Ensure the model exists
    const Model = mongoose.models[collectionName];
    if (!Model) {
      return { success: false, message: `Collection '${collectionName}' not found.` };
    }

    // 2. Parse the JSON strings into actual JavaScript objects
    const filterQuery = filterString.trim() ? JSON.parse(filterString) : {};
    const updateQuery = updateString?.trim() ? JSON.parse(updateString) : undefined;

    let result;

    // 3. Execute the requested operation
    if (operation === "find") {
      result = await Model.find(filterQuery).limit(50).lean(); // Limit to 50 to prevent freezing
    } else if (operation === "findOne") {
      result = await Model.findOne(filterQuery).lean();
    } else if (operation === "countDocuments") {
      result = await Model.countDocuments(filterQuery);
    } else if (operation === "updateMany") {
      if (!updateQuery) throw new Error("Update operation requires an update payload.");
      result = await Model.updateMany(filterQuery, updateQuery);
      await logAction("DB_CONSOLE", "SUPER_ADMIN", `Ran updateMany on ${collectionName}`);
    } else if (operation === "deleteMany") {
      // Safety check: Prevent accidental full database wipe
      if (Object.keys(filterQuery).length === 0) {
        throw new Error("DANGER: Cannot run deleteMany with an empty filter!");
      }
      result = await Model.deleteMany(filterQuery);
      await logAction("DB_CONSOLE", "SUPER_ADMIN", `Ran deleteMany on ${collectionName}`);
    } else {
      throw new Error("Unsupported operation");
    }

    return { success: true, data: JSON.parse(JSON.stringify(result)) };

  } catch (error: any) {
    console.error("DB Console Error:", error);
    return { success: false, message: error.message };
  }
}