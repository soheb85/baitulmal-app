/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import { getSession } from "./authActions";
import { revalidatePath } from "next/cache";
import bcrypt from "bcryptjs";

// --- LIVE AVAILABILITY CHECK ---
export async function checkAvailability(type: "username" | "email", value: string) {
  await connectDB();
  const exists = await User.findOne({ [type]: value }).select("_id").lean();
  return { available: !exists };
}

export async function getPendingUsersCount() {
  await connectDB();
  try {
    // Replace "PENDING" with whatever exact string you use for unapproved users in your User schema
    const count = await User.countDocuments({ isApproved: false }); 
    return { success: true, count };
  } catch (error) {
    console.error("Failed to get pending users count:", error);
    return { success: false, count: 0 };
  }
}

// --- 1. Register User (For Volunteers) ---
export async function registerUser(formData: any) {
  await connectDB();
  
  try {
    const { name, username, email, password } = formData;

    const existingUser = await User.findOne({ username });
    if (existingUser) return { success: false, message: "This mobile number is already registered." };

    const existingEmail = await User.findOne({ email });
    if (existingEmail) return { success: false, message: "This email is already registered." };

    const hashedPassword = await bcrypt.hash(password, 10);

    await User.create({
      name,
      username: username, 
      email: email.toLowerCase(),
      password: hashedPassword,
      role: "USER", // Default role
      isApproved: false 
    });

    return { success: true, message: "Registration successful! Please ask the Super Admin to approve your account." };
  } catch (error: any) {
    return { success: false, message: "Error: " + error.message };
  }
}

// --- 2. Fetch Pending Users ---
export async function getPendingUsers() {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") return [];

  await connectDB();
  const users = await User.find({ isApproved: false }).lean();
  return users.map((u: any) => ({ ...u, _id: u._id.toString() }));
}

// --- 3. UPDATED: Approve a User (With Role Selection) ---
export async function approveUser(userId: string, assignedRole: "USER" | "ADMIN" = "USER") {
  const session = await getSession();
  
  if (session?.role !== "SUPER_ADMIN") {
    return { success: false, message: "Unauthorized: Only Super Admin can approve users." };
  }

  await connectDB();
  
  try {
    // Approve the user AND set their chosen role
    await User.findByIdAndUpdate(userId, { 
        isApproved: true,
        role: assignedRole 
    });
    
    revalidatePath("/admin/users");
    return { success: true, message: `User approved successfully as ${assignedRole}!` };
  } catch (error: any) {
    return { success: false, message: "Approval failed: " + error.message };
  }
}

// --- 4. NEW: Change an Existing User's Role ---
export async function updateUserRole(userId: string, newRole: "USER" | "ADMIN") {
  const session = await getSession();
  if (session?.role !== "SUPER_ADMIN") return { success: false, message: "Unauthorized" };

  await connectDB();
  try {
    await User.findByIdAndUpdate(userId, { role: newRole });
    revalidatePath("/admin/users");
    return { success: true, message: `User role updated to ${newRole}!` };
  } catch (error: any) {
    return { success: false, message: "Update failed: " + error.message };
  }
}

// --- 5. UPDATED: Get All Users (Now fetching 'role') ---
export async function getAllUsers() {
  await connectDB();
  const users = await User.find({ role: { $ne: "SUPER_ADMIN" } }) 
    .select("name username email isApproved role _id") // Fetch role
    .sort({ createdAt: -1 })
    .lean();

  return JSON.parse(JSON.stringify(users));
}

// --- 6. Delete a User ---
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