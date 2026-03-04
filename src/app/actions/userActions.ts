/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getSession } from "./authActions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs"; // Added for password encryption

// --- 1. NEW: Register User (For Volunteers) ---
export async function registerUser(formData: any) {
  await connectDB();
  
  try {
    const { name, username, password } = formData;

    // Check if username already exists
    const existing = await User.findOne({ username });
    if (existing) {
      return { success: false, message: "This username is already taken." };
    }

    // Hash the password (Lightweight encryption)
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create the user (isApproved defaults to false via Model)
    await User.create({
      name,
      username: username.toLowerCase(),
      password: hashedPassword,
      role: "USER", // Default role
      isApproved: false // Must be approved by Super Admin
    });

    return { 
      success: true, 
      message: "Registration successful! Please ask the Super Admin to approve your account." 
    };
  } catch (error: any) {
    return { success: false, message: "Error: " + error.message };
  }
}

// --- 2. Fetch Pending Users (Only for Super Admin) ---
export async function getPendingUsers() {
  const session = await getSession();
  
  // Security check: Only Super Admin can see the list
  if (session?.role !== "SUPER_ADMIN") return [];

  await connectDB();
  // Return plain objects for the Server Component
  const users = await User.find({ isApproved: false }).lean();
  return users.map((u: any) => ({
    ...u,
    _id: u._id.toString()
  }));
}

// --- 3. Approve a User (Only for Super Admin) ---
export async function approveUser(userId: string) {
  const session = await getSession();
  
  // Security check: Only Super Admin can perform approval
  if (session?.role !== "SUPER_ADMIN") {
    return { success: false, message: "Unauthorized: Only Super Admin can approve users." };
  }

  await connectDB();
  
  try {
    await User.findByIdAndUpdate(userId, { isApproved: true });
    
    // Refresh the admin page data
    revalidatePath("/admin/users");
    return { success: true, message: "User has been approved and can now login!" };
  } catch (error: any) {
    return { success: false, message: "Approval failed: " + error.message };
  }
}
export async function getAllUsers() {
  await connectDB();
  const users = await User.find({ role: { $ne: "SUPER_ADMIN" } }) // Exclude Super Admin from list if desired
    .select("name username isApproved _id")
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(users));
}

export async function deleteUser(userId: string) {
  try {
    await connectDB();
    await User.findByIdAndDelete(userId);
    revalidatePath("/admin/users");
    return { success: true, message: "User removed successfully" };
  } catch (error) {
    return { success: false, message: "Failed to remove user" };
  }
}