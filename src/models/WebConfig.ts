import mongoose, { Schema, Document, Model } from "mongoose";

// Add <string> right after Document
export interface IWebConfig extends Document<string> {
  _id: string; // Now TypeScript knows this is allowed!
  isQueueOpen: boolean;
  maxDailyTokens: number;
  activeDistributionYear: number;
  maintenanceMode: boolean;
  systemAnnouncement: string;
  allowNewRegistrations: boolean;
  updatedAt: Date;
}

const WebConfigSchema = new Schema<IWebConfig>(
  {
    _id: { type: String, default: "GLOBAL_CONFIG" },
    isQueueOpen: { type: Boolean, default: true },
    maxDailyTokens: { type: Number, default: 300 },
    activeDistributionYear: { type: Number, default: new Date().getFullYear() },
    maintenanceMode: { type: Boolean, default: false },
    systemAnnouncement: { type: String, default: "" },
    allowNewRegistrations: { type: Boolean, default: true },
  },
  { timestamps: true }
);

const WebConfig =
  (mongoose.models.WebConfig as Model<IWebConfig>) ||
  mongoose.model<IWebConfig>("WebConfig", WebConfigSchema);

export default WebConfig;