/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";

// LOGIN
export async function loginUser(formData: any) {
  await connectDB();
  const { username, password } = formData;

  const user = await User.findOne({ username });
  if (!user) return { success: false, message: "User not found" };
  if (!user.isApproved) return { success: false, message: "Admin approval pending" };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, message: "Invalid password" };

  // Set a simple cookie (valid for 7 days)
  (await cookies()).set("session_user", JSON.stringify({
    id: user._id,
    name: user.name,
    role: user.role
  }), { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    maxAge: 60 * 60 * 24 * 7 
  });

  return { success: true };
}

// LOGOUT
export async function logoutUser() {
  (await cookies()).delete("session_user");
}

// CHECK SESSION (Lightweight helper)
export async function getSession() {
  const session = (await cookies()).get("session_user")?.value;
  return session ? JSON.parse(session) : null;
}