/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";

/**
 * Utility function to fetch ALL Collection (Table) names inside the current Database.
 */
export async function fetchAllCollectionNames() {
  await connectDB();
  
  try {
    // 1. Get the raw MongoDB database instance from the Mongoose connection
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not fully established yet.");
    }

    // 2. Ask MongoDB to list all collections in this specific database
    const collections = await db.listCollections().toArray();

    // 3. Extract just the names into a simple array of strings
    const collectionNames = collections.map((col) => col.name);

    // 4. PRINT TO TERMINAL
    console.log(`\n✅ CONNECTED TO DATABASE: [${db.databaseName}]`);
    console.log(`📂 FOUND ${collectionNames.length} COLLECTIONS (TABLES):`);
    console.dir(collectionNames, { colors: true });

    return { 
        success: true, 
        databaseName: db.databaseName,
        count: collectionNames.length,
        collections: collectionNames 
    };

  } catch (error: any) {
    console.error("❌ Failed to fetch collection names:", error);
    return { 
        success: false, 
        message: error.message || "Failed to fetch collections." 
    };
  }
}

/**
 * Utility function to fetch all Field Names ("columns") from a specific Collection ("table").
 * @param collectionName The name of the collection (e.g., "beneficiaries")
 */
export async function fetchCollectionFields(collectionName: string) {
  await connectDB();
  
  try {
    const db = mongoose.connection.db;

    if (!db) {
      throw new Error("Database connection is not fully established yet.");
    }

    // 1. Access the specific collection
    const collection = db.collection(collectionName);

    // 2. Fetch exactly ONE document to see its structure
    const sampleDocument = await collection.findOne({});

    if (!sampleDocument) {
      console.log(`\n⚠️ COLLECTION [${collectionName}] IS EMPTY. Cannot determine fields.`);
      return { success: true, collectionName, fields: [] };
    }

    // 3. Extract all the Keys (Field/Column names) from the document
    const fieldNames = Object.keys(sampleDocument);

    // 4. PRINT TO TERMINAL
    console.log(`\n✅ FOUND FIELDS FOR COLLECTION: [${collectionName}]`);
    console.log(`📋 TOTAL COLUMNS: ${fieldNames.length}`);
    console.dir(fieldNames, { colors: true });

    return { 
        success: true, 
        collectionName,
        count: fieldNames.length,
        fields: fieldNames 
    };

  } catch (error: any) {
    console.error(`❌ Failed to fetch fields for ${collectionName}:`, error);
    return { 
        success: false, 
        message: error.message || "Failed to fetch fields." 
    };
  }
}

/**
 * Helper function to deeply analyze the type of any MongoDB value.
 */
function analyzeValue(value: any): any {
  // 1. Handle Null/Undefined
  if (value === null || value === undefined) return "Unknown / Null";
  
  // 2. Handle MongoDB Native Types
  if (value instanceof Date) return "Date";
  if (value instanceof mongoose.Types.ObjectId) return "ObjectId";

  // 3. Handle Arrays
  if (Array.isArray(value)) {
    if (value.length === 0) return "Array (Empty)";
    
    const firstItem = value[0];
    // Check if it's an Array of Objects (and not an array of Dates/ObjectIds)
    if (
      typeof firstItem === "object" && 
      firstItem !== null && 
      !(firstItem instanceof Date) && 
      !(firstItem instanceof mongoose.Types.ObjectId)
    ) {
      return {
        type: "Array of Objects",
        fields: analyzeDocument(firstItem) // Recursively scan the nested object
      };
    } else {
      // It's a flat array (e.g., Array of Strings/Numbers like `distributedYears` or `problems`)
      return `Array of ${analyzeValue(firstItem)}s`;
    }
  }

  // 4. Handle Nested Objects (like `todayStatus` or `verificationCycle`)
  if (typeof value === "object") {
    return {
      type: "Object",
      fields: analyzeDocument(value) // Recursively scan the nested object
    };
  }

  // 5. Handle Primitives (String, Number, Boolean)
  return typeof value; 
}

/**
 * Helper function to loop through a document and map its schema.
 */
function analyzeDocument(doc: any) {
  const schema: any = {};
  for (const key of Object.keys(doc)) {
    schema[key] = analyzeValue(doc[key]);
  }
  return schema;
}

/**
 * Utility function to deeply map the Schema of any Collection based on a real document.
 */
export async function fetchDeepCollectionSchema(collectionName: string) {
  await connectDB();
  
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database connection is not fully established yet.");

    const collection = db.collection(collectionName);

    // Fetch the most recently added document to get the richest, most complete data
    const sampleDocument = await collection.findOne({}, { sort: { $natural: -1 } });

    if (!sampleDocument) {
      console.log(`\n⚠️ COLLECTION [${collectionName}] IS EMPTY.`);
      return { success: true, collectionName, schema: {} };
    }

    // Pass the document into our recursive analyzer
    const deepSchema = analyzeDocument(sampleDocument);

    // PRINT TO TERMINAL
    console.log(`\n✅ DEEP SCHEMA MAPPED FOR: [${collectionName}]`);
    console.dir(deepSchema, { depth: null, colors: true }); // depth: null ensures nested objects aren't hidden

    return { 
        success: true, 
        collectionName,
        schema: deepSchema 
    };

  } catch (error: any) {
    console.error(`❌ Failed to map schema for ${collectionName}:`, error);
    return { success: false, message: error.message };
  }
}