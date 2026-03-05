/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document, Model } from "mongoose";

export interface IFamilyMember {
  name: string;
  relation: "SON" | "DAUGHTER" | "HUSBAND" | "WIFE" | "FATHER" | "MOTHER";
  age: string;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED";
  livesWithFamily: boolean;

  // --- Economic Status ---
  isEarning: boolean;
  occupation: string; // e.g. "Labour", "Driver", "None"
  monthlyIncome: string;

  // --- Education Details (New) ---
  isStudying: boolean;
  schoolName?: string; // e.g. "Anjuman High School"
  classStandard?: string; // e.g. "9th Std", "B.Sc 1st Year"

  memberNotes?: string;
}

export interface IBeneficiary extends Document {
  fullName: string;
  aadharNumber: string;
  mobileNumber: string;
  gender: "MALE" | "FEMALE";
  husbandStatus?:
    | "ALIVE"
    | "WIDOW"
    | "ABANDONED"
    | "DIVORCED"
    | "DISABLED"
    | "NOT_MARRIED";

  // --- NEW: Primary Applicant Economic Status ---
  isEarning: boolean;
  occupation: string;
  monthlyIncome: number;

  aadharPincode: string;
  currentPincode: string;
  currentAddress: string;

  // Family Counts (Auto-calculated usually)
  sons: number;
  daughters: number;
  otherDependents: number;
  earningMembersCount: number;
  totalFamilyIncome: number;

  familyMembersDetail: IFamilyMember[]; // <--- Uses updated interface

  housingType: "OWN" | "RENT";
  rentAmount: number;
  problems: string[];
  status: "ACTIVE" | "BLACKLISTED" | "ON_HOLD";
  rejectionReason?: string;
  rejectionBy?: string;
  comments?: string;
  referencedBy?: string;

  // 3-Year Cycle Logic
  verificationCycle: {
    startDate: Date;
    endDate: Date;
    isFullyVerified: boolean;
  };

  distributedYears: number[];

  distributionHistory: {
    date: Date;
    year: number;
    status: "COLLECTED";
    tokenNumber?: number;
  }[];

  todayStatus: {
    date: Date;
    queueDate: string;
    year: number;
    status: "CHECKED_IN" | "COLLECTED" | null;
    tokenNumber?: number;
  };

  createdAt: Date;
  updatedAt: Date;
}

// --- Updated Sub-Schema ---
const FamilyMemberSchema = new Schema({
  name: { type: String, required: true },
  relation: { type: String, required: true },
  age: { type: String, required: true },
  maritalStatus: { type: String, default: "SINGLE" },
  livesWithFamily: { type: Boolean, default: true },

  // Earning
  isEarning: { type: Boolean, default: false },
  occupation: { type: String, default: "None" },
  monthlyIncome: { type: String, default: "0" },

  // Education (New Fields)
  isStudying: { type: Boolean, default: false },
  schoolName: { type: String, default: "" },
  classStandard: { type: String, default: "" },

  memberNotes: { type: String, default: "" },
});

const BeneficiarySchema = new Schema<
  IBeneficiary,
  Model<IBeneficiary>,
  IBeneficiary
>(
  {
    fullName: { type: String, required: true, trim: true },
    aadharNumber: {
      type: String,
      required: true,
      unique: true,
      index: true,
      trim: true,
    },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE"], required: true },
    husbandStatus: { type: String, default: "ALIVE" },

    // --- NEW FIELDS ---
    isEarning: { type: Boolean, default: false },
    occupation: { type: String, default: "None" },
    monthlyIncome: { type: Number, default: 0 },

    aadharPincode: { type: String, required: true },
    currentPincode: { type: String, required: true },
    currentAddress: { type: String, required: true },

    familyMembersDetail: { type: [FamilyMemberSchema], default: [] },

    sons: { type: Number, default: 0 },
    daughters: { type: Number, default: 0 },
    otherDependents: { type: Number, default: 0 },
    earningMembersCount: { type: Number, default: 0 },
    totalFamilyIncome: { type: Number, default: 0 },
    housingType: { type: String, enum: ["OWN", "RENT"], default: "OWN" },
    rentAmount: { type: Number, default: 0 },
    problems: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["ACTIVE", "BLACKLISTED", "ON_HOLD"],
      default: "ACTIVE",
    },
    rejectionReason: { type: String },
    rejectionBy: { type: String, default: "" },
    comments: { type: String, trim: true },
    referencedBy: { type: String, trim: true },

    verificationCycle: {
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date },
      isFullyVerified: { type: Boolean, default: true },
    },

    distributedYears: { type: [Number], default: [] },

    distributionHistory: [
      {
        date: { type: Date, required: true },
        year: { type: Number, required: true },
        status: { type: String, default: "COLLECTED" },
        tokenNumber: { type: Number },
      },
    ],

    todayStatus: {
      date: { type: Date },
      queueDate: { type: String }, // Used to keep tokens visible past midnight
      year: { type: Number },
      status: {
        type: String,
        enum: ["CHECKED_IN", "COLLECTED"],
        default: null,
      },
      tokenNumber: { type: Number },
    },
  },
  { timestamps: true },
);

// Middleware for 3-Year Expiry
BeneficiarySchema.pre("save", function (this: IBeneficiary) {
  if (this.isNew || !this.verificationCycle?.endDate) {
    const start = this.verificationCycle?.startDate || new Date();
    const expiryDate = new Date(start);
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    if (!this.verificationCycle) {
      this.verificationCycle = {
        startDate: start,
        endDate: expiryDate,
        isFullyVerified: true,
      };
    } else {
      this.verificationCycle.endDate = expiryDate;
    }
  }
});

const Beneficiary =
  (mongoose.models.Beneficiary as Model<IBeneficiary>) ||
  mongoose.model<IBeneficiary>("Beneficiary", BeneficiarySchema);

  export interface ICounter {
  _id: string; // e.g., "tokens-2026-03-08"
  seq: number;
}

// 2. Counter Schema
const CounterSchema = new Schema<ICounter>({
  _id: { type: String, required: true }, 
  seq: { type: Number, default: 0 }
});

// 3. Counter Model Export
// We use named export for Counter and keep Beneficiary as default export
export const Counter = 
  (mongoose.models.Counter as Model<ICounter>) || 
  mongoose.model<ICounter>("Counter", CounterSchema);

export default Beneficiary;
