import mongoose, { Schema, Document, Model } from "mongoose";

export interface ISchemaField extends Document {
  category: string;
  colorTheme: string;
  fieldKey: string;
  fieldType: string;
  hint?: string;
}

const SchemaFieldSchema = new Schema<ISchemaField>(
  {
    category: { type: String, required: true, trim: true },
    colorTheme: { type: String, default: "indigo", trim: true },
    fieldKey: { type: String, required: true, trim: true, unique: true },
    fieldType: { type: String, default: "String", trim: true },
    hint: { type: String, default: "", trim: true },
  },
  { timestamps: true }
);

const SchemaField =
  (mongoose.models.SchemaField as Model<ISchemaField>) ||
  mongoose.model<ISchemaField>("SchemaField", SchemaFieldSchema);

export default SchemaField;