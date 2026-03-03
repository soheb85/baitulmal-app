import mongoose, { Schema, Document, Model } from "mongoose";

// --- 1. Define Interface for TypeScript ---
export interface IFamilyMember {
  name: string;
  relation: "SON" | "DAUGHTER" | "HUSBAND" | "WIFE" | "FATHER" | "MOTHER";
  age: string;
  isEarning: boolean;
  occupation: string;
  monthlyIncome: string; 
  livesWithFamily: boolean;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED";
}

export interface IBeneficiary extends Document {
  // Personal
  fullName: string;
  aadharNumber: string;
  mobileNumber: string;
  gender: "MALE" | "FEMALE";
  husbandStatus?: "ALIVE" | "WIDOW" | "ABANDONED" | "DIVORCED" | "DISABLED";

  // Address
  aadharPincode: string;
  currentPincode: string;
  currentAddress: string;

  // Stats (Auto-calculated)
  sons: number;
  daughters: number;
  otherDependents: number;
  earningMembersCount: number;
  totalFamilyIncome: number;

  // The Detailed List (NEW)
  familyMembersDetail: IFamilyMember[];

  // Housing & Problems
  housingType: "OWN" | "RENT";
  rentAmount: number;
  problems: string[];

  // Status
  status: "ACTIVE" | "BLACKLISTED" | "ON_HOLD";
  rejectionReason?: string;
  comments?: string;
  referencedBy?: string;
  
  createdAt: Date;
  updatedAt: Date;
}

// --- 2. Define Schema for MongoDB ---

// Sub-schema for the list items
const FamilyMemberSchema = new Schema({
  name: { type: String, required: true },
  relation: { type: String, required: true },
  age: { type: String, required: true },
  isEarning: { type: Boolean, default: false },
  occupation: { type: String, default: "None" },
  monthlyIncome: { type: String, default: "0" },
  livesWithFamily: { type: Boolean, default: true },
  maritalStatus: { type: String, default: "SINGLE" }
});

// Main Schema
const BeneficiarySchema = new Schema<IBeneficiary>(
  {
    fullName: { type: String, required: true, trim: true },
    aadharNumber: { type: String, required: true, unique: true, index: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE"], required: true },
    husbandStatus: { 
      type: String, 
      enum: ["ALIVE", "WIDOW", "ABANDONED", "DIVORCED", "DISABLED"],
      default: "ALIVE" 
    },

    // Address
    aadharPincode: { type: String, required: true },
    currentPincode: { type: String, required: true },
    currentAddress: { type: String, required: true },

    // The List of People
    familyMembersDetail: {
      type: [FamilyMemberSchema], // <--- This stores the array
      default: []
    },

    // Summary Stats (Kept for easy querying later)
    sons: { type: Number, default: 0 },
    daughters: { type: Number, default: 0 },
    otherDependents: { type: Number, default: 0 },
    earningMembersCount: { type: Number, default: 0 },
    totalFamilyIncome: { type: Number, default: 0 },

    // Financials
    housingType: { type: String, enum: ["OWN", "RENT"], default: "OWN" },
    rentAmount: { type: Number, default: 0 },
    problems: { type: [String], default: [] },

    // Admin Status
    status: { 
      type: String, 
      enum: ["ACTIVE", "BLACKLISTED", "ON_HOLD"], 
      default: "ACTIVE" 
    },
    rejectionReason: { type: String },
    comments: { type: String, trim: true },
    referencedBy: { type: String, trim: true },
  },
  { timestamps: true }
);

// Prevent model overwrite in Next.js hot reload
const Beneficiary: Model<IBeneficiary> =
  mongoose.models.Beneficiary || mongoose.model<IBeneficiary>("Beneficiary", BeneficiarySchema);

export default Beneficiary;