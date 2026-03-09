/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { cookies } from "next/headers";
import nodemailer from "nodemailer";

// LOGIN
export async function loginUser(formData: any) {
  await connectDB();
  const { username, password } = formData;

  const user = await User.findOne({ username });
  if (!user) return { success: false, message: "User not found" };
  if (!user.isApproved) return { success: false, message: "Admin approval pending" };

  const isMatch = await bcrypt.compare(password, user.password);
  if (!isMatch) return { success: false, message: "Invalid password" };

  // --- CALCULATION ---
  // 60 seconds * 60 minutes * 6 hours = 21,600 seconds
  const SIX_HOURS = 60 * 60 * 6;

  // Set the session cookie (NOW INCLUDES NEW PERMISSIONS)
  (await cookies()).set("session_user", JSON.stringify({
    id: user._id,
    name: user.name,
    role: user.role,
    username: user.username,
    hasCollectionAccess: user.hasCollectionAccess || false,   // <-- ADDED THIS
    canSubmitCollection: user.canSubmitCollection || false,   // <-- ADDED THIS
    canApproveCollection: user.canApproveCollection || false  // <-- ADDED THIS
  }), { 
    httpOnly: true, 
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax", 
    maxAge: SIX_HOURS
  });

  return { success: true };
}

// LOGOUT
export async function logoutUser() {
  (await cookies()).delete("session_user");
}

// CHECK SESSION
export async function getSession() {
  const session = (await cookies()).get("session_user")?.value;
  // console.log("Session Cookie Value:", session); // Debugging line
  return session ? JSON.parse(session) : null;
}

export async function checkAvailability(type: "username" | "email", value: string) {
  await connectDB();
  const exists = await User.findOne({ [type]: value }).select("_id").lean();
  return { available: !exists };
}


// 1. Email Transporter Configuration
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS,
  },
});

// 2. Request Password Reset (Updated with Email)
export async function requestPasswordReset(username: string) {
  await connectDB();
  const user = await User.findOne({ username });
  
  if (!user || !user.email) {
    return { success: false, message: "User or registered email not found." };
  }

  // Generate 6-digit PIN
  const pin = Math.floor(100000 + Math.random() * 900000).toString();
  
  user.resetToken = pin;
  user.resetTokenExpiry = new Date(Date.now() + 15 * 60000); // 15 Minute expiry
  await user.save();

  try {
    await transporter.sendMail({
      from: `"Baitulmal System" <${process.env.EMAIL_USER}>`,
      to: user.email,
      subject: "Password Reset PIN - Baitulmal",
      html: `
        <div style="font-family: sans-serif; padding: 20px; border: 1px solid #eee; border-radius: 10px;">
          <h2 style="color: #2563eb;">Password Reset Request</h2>
          <p>Hello <b>${user.name}</b>,</p>
          <p>You requested a password reset. Use the following 6-digit PIN to proceed:</p>
          <div style="font-size: 32px; font-weight: bold; letter-spacing: 5px; color: #1e293b; padding: 10px 0;">
            ${pin}
          </div>
          <p style="color: #ef4444; font-size: 12px;">This PIN will expire in 15 minutes.</p>
          <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;">
          <p style="font-size: 11px; color: #94a3b8;">If you didn't request this, please ignore this email.</p>
        </div>
      `,
    });

    return { success: true, message: "Reset PIN sent to your registered email." };
  } catch (error) {
    console.error("Email Error:", error);
    return { success: false, message: "Failed to send email. Contact Admin." };
  }
}

// 3. Complete Password Reset
export async function resetPassword(formData: any) {
  await connectDB();
  const { username, pin, newPassword } = formData;

  const user = await User.findOne({ 
    username, 
    resetToken: pin,
    resetTokenExpiry: { $gt: new Date() } 
  });

  if (!user) return { success: false, message: "Invalid or expired PIN" };

  // Hash new password
  const salt = await bcrypt.genSalt(10);
  user.password = await bcrypt.hash(newPassword, salt);
  
  // Clear token
  user.resetToken = null;
  user.resetTokenExpiry = null;
  
  await user.save();
  return { success: true, message: "Password updated successfully!" };
}