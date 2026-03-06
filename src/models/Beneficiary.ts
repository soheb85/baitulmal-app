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
  occupation: string; 
  monthlyIncome: string;

  // --- Education Details (New) ---
  isStudying: boolean;
  schoolName?: string; 
  classStandard?: string; 

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
    | "NOT_MARRIED"
    | "OTHERS";

  // --- NEW: Primary Applicant Economic Status ---
  isEarning: boolean;
  occupation: string;
  monthlyIncome: number;

  aadharPincode: string;
  currentPincode: string;
  currentAddress: string;
  area: string;
  registerDateManual?: Date;
  isException: boolean; 

  // Family Counts 
  sons: number;
  daughters: number;
  otherDependents: number;
  earningMembersCount: number;
  totalFamilyIncome: number;

  familyMembersDetail: IFamilyMember[]; 

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

// --- Updated Sub-Schema with strict Enums ---
const FamilyMemberSchema = new Schema({
  name: { type: String, required: true, trim: true },
  relation: { 
    type: String, 
    required: true,
    enum: ["SON", "DAUGHTER", "HUSBAND", "WIFE", "FATHER", "MOTHER"] 
  },
  age: { type: String, required: true },
  maritalStatus: { 
    type: String, 
    enum: ["SINGLE", "MARRIED", "DIVORCED"],
    default: "SINGLE" 
  },
  livesWithFamily: { type: Boolean, default: true },

  // Earning
  isEarning: { type: Boolean, default: false },
  occupation: { type: String, default: "None", trim: true },
  monthlyIncome: { type: String, default: "0", trim: true },

  // Education
  isStudying: { type: Boolean, default: false },
  schoolName: { type: String, default: "", trim: true },
  classStandard: { type: String, default: "", trim: true },

  memberNotes: { type: String, default: "", trim: true },
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
      required: [true, "Aadhaar number is required"],
      unique: true,
      index: true,
      trim: true,
      match: [/^\d{12}$/, "Aadhaar number must be exactly 12 digits"],
    },
    mobileNumber: { 
      type: String, 
      required: [true, "Mobile number is required"], 
      unique: true, 
      trim: true,
      match: [/^\d{10}$/, "Mobile number must be exactly 10 digits"],
    },
    gender: { 
      type: String, 
      enum: ["MALE", "FEMALE"], 
      required: true 
    },
    husbandStatus: { 
      type: String, 
      enum: ["ALIVE", "WIDOW", "ABANDONED", "DIVORCED", "DISABLED", "NOT_MARRIED", "OTHERS"],
      default: "ALIVE" 
    },

    // --- ECONOMIC STATUS ---
    isEarning: { type: Boolean, default: false },
    occupation: { type: String, default: "None", trim: true },
    monthlyIncome: { type: Number, default: 0, min: [0, "Income cannot be negative"] },

    // --- ADDRESS & PINCODES ---
    aadharPincode: { 
      type: String, 
      required: true,
      match: [/^\d{6}$/, "Pincode must be exactly 6 digits"],
    },
    currentPincode: { 
      type: String, 
      required: true,
      match: [/^\d{6}$/, "Pincode must be exactly 6 digits"],
    },
    currentAddress: { type: String, required: true, trim: true },
    area: { type: String, default: "", trim: true },
    registerDateManual: { type: Date },
    isException: { type: Boolean, default: false },

    // --- FAMILY ---
    familyMembersDetail: { type: [FamilyMemberSchema], default: [] },
    sons: { type: Number, default: 0, min: 0 },
    daughters: { type: Number, default: 0, min: 0 },
    otherDependents: { type: Number, default: 0, min: 0 },
    earningMembersCount: { type: Number, default: 0, min: 0 },
    totalFamilyIncome: { type: Number, default: 0, min: 0 },
    
    // --- HOUSING ---
    housingType: { type: String, enum: ["OWN", "RENT"], default: "OWN" },
    rentAmount: { type: Number, default: 0, min: 0 },
    
    // --- ADMIN STATUS ---
    problems: { type: [String], default: [] },
    status: {
      type: String,
      enum: ["ACTIVE", "BLACKLISTED", "ON_HOLD"],
      default: "ACTIVE",
    },
    rejectionReason: { type: String, trim: true },
    rejectionBy: { type: String, default: "", trim: true },
    comments: { type: String, trim: true },
    referencedBy: { type: String, trim: true },

    // --- CYCLES & QUEUE ---
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
        status: { type: String, enum: ["COLLECTED"], default: "COLLECTED" },
        tokenNumber: { type: Number, min: 1 },
      },
    ],

    todayStatus: {
      date: { type: Date },
      queueDate: { type: String }, 
      year: { type: Number },
      status: {
        type: String,
        enum: ["CHECKED_IN", "COLLECTED", null],
        default: null,
      },
      tokenNumber: { type: Number, min: 1 },
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
  seq: { type: Number, default: 0, min: 0 }
});

// 3. Counter Model Export
export const Counter = 
  (mongoose.models.Counter as Model<ICounter>) || 
  mongoose.model<ICounter>("Counter", CounterSchema);

export default Beneficiary;