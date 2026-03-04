/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document, Model, CallbackError } from "mongoose";

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
  fullName: string;
  aadharNumber: string;
  mobileNumber: string;
  gender: "MALE" | "FEMALE";
  husbandStatus?: "ALIVE" | "WIDOW" | "ABANDONED" | "DIVORCED" | "DISABLED";
  aadharPincode: string;
  currentPincode: string;
  currentAddress: string;
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
  comments?: string;
  referencedBy?: string;

  // 3-Year Cycle Logic
  verificationCycle: {
    startDate: Date;
    endDate: Date; 
    isFullyVerified: boolean;
  };

  distributedYears: number[]; // e.g., [2025, 2026]

  distributionHistory: {
    date: Date;
    year: number; 
    status: "COLLECTED";
  }[];

  todayStatus: {
    date: Date;
    year: number; 
    status: "CHECKED_IN" | "COLLECTED" | null;
    tokenNumber?: number;
  };
  
  createdAt: Date;
  updatedAt: Date;
}

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

const BeneficiarySchema = new Schema<IBeneficiary, Model<IBeneficiary>, IBeneficiary>(
  {
    fullName: { type: String, required: true, trim: true },
    aadharNumber: { type: String, required: true, unique: true, index: true, trim: true },
    mobileNumber: { type: String, required: true, unique: true, trim: true },
    gender: { type: String, enum: ["MALE", "FEMALE"], required: true },
    husbandStatus: { type: String, default: "ALIVE" },
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
    status: { type: String, enum: ["ACTIVE", "BLACKLISTED", "ON_HOLD"], default: "ACTIVE" },
    rejectionReason: { type: String },
    comments: { type: String, trim: true },
    referencedBy: { type: String, trim: true },
    verificationCycle: {
      startDate: { type: Date, default: Date.now },
      endDate: { type: Date }, 
      isFullyVerified: { type: Boolean, default: true }
    },
    distributedYears: { type: [Number], default: [] },
    distributionHistory: [{
        date: { type: Date, required: true },
        year: { type: Number, required: true },
        status: { type: String, default: "COLLECTED" }
    }],
    todayStatus: {
      date: { type: Date },
      year: { type: Number },
      status: { type: String, enum: ["CHECKED_IN", "COLLECTED"], default: null },
      tokenNumber: { type: Number }
    },
  },
  { timestamps: true }
);

// Middleware for 3-Year Expiry
BeneficiarySchema.pre('save', function (this: IBeneficiary) {
  if (this.isNew || !this.verificationCycle?.endDate) {
    const start = this.verificationCycle?.startDate || new Date();
    const expiryDate = new Date(start);
    expiryDate.setFullYear(expiryDate.getFullYear() + 3);

    if (!this.verificationCycle) {
      this.verificationCycle = {
        startDate: start,
        endDate: expiryDate,
        isFullyVerified: true
      };
    } else {
      this.verificationCycle.endDate = expiryDate;
    }
  }
});

const Beneficiary = (mongoose.models.Beneficiary as Model<IBeneficiary>) || 
                    mongoose.model<IBeneficiary>("Beneficiary", BeneficiarySchema);

export default Beneficiary;