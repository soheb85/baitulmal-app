/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import WebConfig from "@/models/WebConfig";
import { logAction } from "@/lib/logger";
import { revalidatePath } from "next/cache";

// 1. Get Config (Auto-creates if missing)
export async function getWebConfig() {
  await connectDB();
  try {
    let config = await WebConfig.findById("GLOBAL_CONFIG").lean();
    
    // Auto-initialize the singleton document if it doesn't exist
    if (!config) {
      const newConfig = await WebConfig.create({ _id: "GLOBAL_CONFIG" });
      config = newConfig.toObject();
    }
    
    return { success: true, data: JSON.parse(JSON.stringify(config)) };
  } catch (error: any) {
    console.error("Failed to get config:", error);
    return { success: false, message: error.message };
  }
}

// 2. Update Config
export async function updateWebConfig(updates: any) {
  await connectDB();
  try {
    const updated = await WebConfig.findByIdAndUpdate(
      "GLOBAL_CONFIG",
      { $set: updates },
      { new: true, runValidators: true }
    ).lean();

    await logAction(
      "UPDATE_WEB_CONFIG",
      "SUPER_ADMIN",
      `Updated Global Web Configuration.`
    );

    // Revalidate everything since these are global settings
    revalidatePath("/", "layout");

    return { success: true, data: JSON.parse(JSON.stringify(updated)) };
  } catch (error: any) {
    console.error("Failed to update config:", error);
    return { success: false, message: error.message };
  }
}