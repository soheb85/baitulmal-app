/* eslint-disable @typescript-eslint/no-explicit-any */
import mongoose, { Schema, Document, Model } from "mongoose";

// --- Sub-schema for individual receipts ---
const ReceiptDetailSchema = new Schema(
  {
    receiptBookNumber: { type: String, trim: true },
    receiptNumber: { type: String, required: true, trim: true },
    fundCategory: {
      type: String,
      enum: ["BAITULMAL", "MADARSA", "FITRA"],
      required: true,
    },
    paymentMode: {
      type: String,
      enum: ["CASH", "ONLINE"],
      required: true,
    },
    amount: { type: Number, required: true, min: 1 },
    donorName: { type: String, default: "Anonymous", trim: true },
  },
  { _id: false }
);

export interface IDailyChallan extends Document {
  challanNumber: string; 
  collectionDate: Date;

  // Baitulmal Range & Totals
  baitulmalReceiptBookNumber?: string; 
  baitulmalFrom?: string; // NEW
  baitulmalTo?: string;   // NEW
  baitulmalCash: number;
  baitulmalOnline: number;

  // Madarsa Range & Totals
  madarsaReceiptBookNumber?: string;
  madarsaFrom?: string;   // NEW
  madarsaTo?: string;     // NEW
  madarsaCash: number;
  madarsaOnline: number;

  // Fitra
  fitraCash: number;
  fitraOnline: number;

  // Master Totals
  totalCashSubmitted: number;
  totalOnlineSubmitted: number;
  grandTotal: number;

  // Detailed Breakdown (Optional)
  receiptBreakdown: Array<{
    receiptBookNumber?: string;
    receiptNumber: string;
    fundCategory: "BAITULMAL" | "MADARSA" | "FITRA";
    paymentMode: "CASH" | "ONLINE";
    amount: number;
    donorName?: string;
  }>;

  // Maker (Submitter)
  submittedBy: mongoose.Types.ObjectId | string;
  submittedByName: string;
  submittedAt: Date;

  // Checker (Approver)
  status: "PENDING" | "APPROVED" | "REJECTED";
  approvedBy?: mongoose.Types.ObjectId | string;
  approvedByName?: string;
  approvedAt?: Date;

  adminNotes?: string; 
  
  createdAt: Date;
  updatedAt: Date;
}

const DailyChallanSchema = new Schema<IDailyChallan, Model<IDailyChallan>>(
  {
    challanNumber: { type: String, required: true, unique: true },
    collectionDate: { type: Date, required: true },

    // Baitulmal Fields
    baitulmalReceiptBookNumber: { type: String, trim: true },
    baitulmalFrom: { type: String, trim: true }, // NEW
    baitulmalTo: { type: String, trim: true },   // NEW
    baitulmalCash: { type: Number, default: 0 },
    baitulmalOnline: { type: Number, default: 0 },
    
    // Madarsa Fields
    madarsaReceiptBookNumber: { type: String, trim: true },
    madarsaFrom: { type: String, trim: true },   // NEW
    madarsaTo: { type: String, trim: true },     // NEW
    madarsaCash: { type: Number, default: 0 },
    madarsaOnline: { type: Number, default: 0 },
    
    // Fitra Fields
    fitraCash: { type: Number, default: 0 },
    fitraOnline: { type: Number, default: 0 },

    // Aggregates
    totalCashSubmitted: { type: Number, default: 0 },
    totalOnlineSubmitted: { type: Number, default: 0 },
    grandTotal: { type: Number, default: 0 },

    receiptBreakdown: [ReceiptDetailSchema],

    // Submitter
    submittedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
    submittedByName: { type: String, required: true },
    submittedAt: { type: Date, default: Date.now },

    // Approval
    status: { type: String, enum: ["PENDING", "APPROVED", "REJECTED"], default: "PENDING" },
    approvedBy: { type: Schema.Types.ObjectId, ref: "User" },
    approvedByName: { type: String },
    approvedAt: { type: Date },

    adminNotes: { type: String, trim: true },
  },
  { timestamps: true }
);

// Calculation Hook (Typed correctly to prevent "next is not a function")
// DailyChallanSchema.pre("save", function (this: IDailyChallan) {
//   const bCash = Number(this.baitulmalCash) || 0;
//   const mCash = Number(this.madarsaCash) || 0;
//   const fCash = Number(this.fitraCash) || 0;

//   const bOnline = Number(this.baitulmalOnline) || 0;
//   const mOnline = Number(this.madarsaOnline) || 0;
//   const fOnline = Number(this.fitraOnline) || 0;

//   this.totalCashSubmitted = bCash + mCash + fCash;
//   this.totalOnlineSubmitted = bOnline + mOnline + fOnline;
//   this.grandTotal = this.totalCashSubmitted + this.totalOnlineSubmitted;
// });

// INDEXES
DailyChallanSchema.index({ collectionDate: -1 });
DailyChallanSchema.index({ status: 1 });
DailyChallanSchema.index({ submittedBy: 1 });

const DailyChallan =
  (mongoose.models.DailyChallan as Model<IDailyChallan>) ||
  mongoose.model<IDailyChallan>("DailyChallan", DailyChallanSchema);

export default DailyChallan;