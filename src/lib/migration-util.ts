/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from "./mongoose";
import mongoose from "mongoose";

interface MigrationConfig {
  model: mongoose.Model<any>;
  fieldName: string;      // e.g., 'email' or 'familyMembersDetail.isStudying'
  defaultValue: any;      // e.g., "" or false
  isNestedArray: boolean; // true if the field is inside an array like familyMembersDetail
}

export async function runMigration({ model, fieldName, defaultValue, isNestedArray }: MigrationConfig) {
  await connectDB();
  console.log(`🚀 Starting migration for field: "${fieldName}" on collection: ${model.collection.name}`);

  try {
    let result;

    if (isNestedArray) {
      // Logic for Sub-documents (Arrays)
      // We find documents where the array exists but the specific field inside the array doesn't exist
      const arrayName = fieldName.split('.')[0];
      const nestedField = fieldName.split('.')[1];

      // Use updateMany with a filter that checks if any element in array is missing the field
      result = await model.updateMany(
        { [`${arrayName}.${nestedField}`]: { $exists: false } },
        { $set: { [`${arrayName}.$[].${nestedField}`]: defaultValue } }
      );
    } else {
      // Logic for Top-level fields
      result = await model.updateMany(
        { [fieldName]: { $exists: false } }, // Only update if field doesn't exist
        { $set: { [fieldName]: defaultValue } }
      );
    }

    console.log(`✅ Migration Complete!`);
    console.log(`📊 Matched: ${result.matchedCount} | Modified: ${result.modifiedCount}`);
    
    return { success: true, ...result };
  } catch (error: any) {
    console.error(`❌ Migration Failed:`, error.message);
    return { success: false, error: error.message };
  }
}