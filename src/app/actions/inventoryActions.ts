"use server";

import { connectDB } from "@/lib/mongoose";
import Inventory from "@/models/Inventory";
import { revalidatePath } from "next/cache";
import { logAction } from "@/lib/logger"; // Use existing audit log

export async function getStock() {
  await connectDB();
  const item = await Inventory.findOne({ type: "RATION_KIT" });
  return item ? item.count : 0;
}

export async function updateStock(newCount: number, username: string) {
  try {
    await connectDB();
    await Inventory.findOneAndUpdate(
      { type: "RATION_KIT" },
      { count: newCount, lastUpdatedBy: username },
      { upsert: true, new: true }
    );
    
    // Log it
    await logAction("STOCK_UPDATE", username, `Updated stock to ${newCount}`);
    
    revalidatePath("/admin/inventory");
    return { success: true, message: "Stock updated" };
  } catch (error) {
    return { success: false, message: "Failed to update stock" };
  }
}