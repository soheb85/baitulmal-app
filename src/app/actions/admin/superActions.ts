/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import mongoose from "mongoose";

export interface SuperFilter {
  field: string;
  operator: string;
  value: string;
}

// --- 1. THE ADVANCED QUERY BUILDER ---
function buildAdvancedQuery(filters: SuperFilter[]) {
  const query: any = {};
  const andConditions: any[] = [];

  filters.forEach(f => {
    if (!f.field || f.field.trim() === "") return;
    if (f.value === undefined || f.value === null || f.value === "") return;

    let finalValue: any = f.value;
    let isDate = false;
    let startDate: Date | null = null;
    let endDate: Date | null = null;

    // A. Parse Booleans
    if (f.value === "true") finalValue = true;
    else if (f.value === "false") finalValue = false;
    
    // B. Parse Numbers
    else if (!isNaN(Number(f.value)) && !["in", "between", "like", "not_like"].includes(f.operator)) {
      finalValue = Number(f.value);
    }

    // C. Parse Dates (DD/MM/YYYY to MongoDB Range)
    else if (/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/.test(String(f.value))) {
      const match = String(f.value).match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/);
      if (match) {
        isDate = true;
        const day = parseInt(match[1], 10);
        const month = parseInt(match[2], 10) - 1; 
        const year = parseInt(match[3], 10);
        startDate = new Date(year, month, day, 0, 0, 0, 0);
        endDate = new Date(year, month, day, 23, 59, 59, 999);
      }
    }

    const field = f.field;

    // --- APPLY RELATIONAL OPERATORS ---
    switch (f.operator) {
      case "equals":
        if (isDate) andConditions.push({ [field]: { $gte: startDate, $lte: endDate } });
        else andConditions.push({ [field]: finalValue });
        break;
      case "not_equals":
        if (isDate) andConditions.push({ [field]: { $not: { $gte: startDate, $lte: endDate } } });
        else andConditions.push({ [field]: { $ne: finalValue } });
        break;
      case "greater_than":
        if (isDate) andConditions.push({ [field]: { $gt: endDate } });
        else andConditions.push({ [field]: { $gt: finalValue } });
        break;
      case "less_than":
        if (isDate) andConditions.push({ [field]: { $lt: startDate } });
        else andConditions.push({ [field]: { $lt: finalValue } });
        break;
      case "greater_than_equal":
        if (isDate) andConditions.push({ [field]: { $gte: startDate } });
        else andConditions.push({ [field]: { $gte: finalValue } });
        break;
      case "less_than_equal":
        if (isDate) andConditions.push({ [field]: { $lte: endDate } });
        else andConditions.push({ [field]: { $lte: finalValue } });
        break;
      case "like": // Case-insensitive string matching
        andConditions.push({ [field]: { $regex: String(finalValue).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: "i" } });
        break;
      case "not_like":
        andConditions.push({ [field]: { $not: { $regex: String(finalValue).replace(/[-[\]{}()*+?.,\\^$|#\s]/g, '\\$&'), $options: "i" } } });
        break;
      case "in":
        const inArr = String(f.value).split(',').map(v => v.trim()).filter(v => v);
        const parsedInArr = inArr.map(v => !isNaN(Number(v)) ? Number(v) : v);
        andConditions.push({ [field]: { $in: parsedInArr } });
        break;
      case "between":
        const parts = String(f.value).split(',').map(v => v.trim());
        if (parts.length === 2) {
          const min = !isNaN(Number(parts[0])) ? Number(parts[0]) : parts[0];
          const max = !isNaN(Number(parts[1])) ? Number(parts[1]) : parts[1];
          andConditions.push({ [field]: { $gte: min, $lte: max } });
        }
        break;
    }
  });

  if (andConditions.length > 0) {
    query.$and = andConditions;
  }
  return query;
}

// --- 2. FETCH DATA ACTION ---
export async function fetchSuperData(collectionName: string, filters: SuperFilter[]) {
  await connectDB();
  try {
    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected.");

    const query = buildAdvancedQuery(filters);
    
    if (Object.keys(query).length === 0) {
      return { success: false, message: "Please add at least one filter.", queryDump: JSON.stringify(query) };
    }

    const results = await db.collection(collectionName).find(query).limit(1000).toArray();
    
    if (results.length === 0) {
      return { 
        success: true, 
        count: 0, 
        data: [], 
        message: "No records found. Check if dates are DD/MM/YYYY, strings match exactly (unless using 'Like'), and numeric fields don't contain letters.",
        queryDump: JSON.stringify(query) 
      };
    }

    return { success: true, count: results.length, data: JSON.parse(JSON.stringify(results)) };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}

// --- 3. EXECUTE BULK OPERATIONS ---
export async function executeSuperOperation(
  collectionName: string,
  actionType: "OVERRIDE" | "DELETE_DOCS" | "PULL_ARRAY",
  targetIds: string[],
  payload: any
) {
  await connectDB();
  try {
    if (!targetIds || targetIds.length === 0) return { success: false, message: "No targets selected." };

    const db = mongoose.connection.db;
    if (!db) throw new Error("Database not connected.");

    // Convert string IDs to MongoDB ObjectIds
    const objectIds = targetIds.map(id => new mongoose.Types.ObjectId(id));
    const query = { _id: { $in: objectIds } };
    let result: any;

    if (actionType === "DELETE_DOCS") {
      result = await db.collection(collectionName).deleteMany(query);
      return { success: true, message: `Deleted ${result.deletedCount} documents permanently.` };
    } 
    
    else if (actionType === "OVERRIDE") {
      const { field, value } = payload;
      let finalVal: any = value;
      if (value === "true") finalVal = true;
      if (value === "false") finalVal = false;
      if (!isNaN(Number(value)) && value.trim() !== "") finalVal = Number(value);

      result = await db.collection(collectionName).updateMany(query, { $set: { [field]: finalVal } });
      return { success: true, message: `Overwrote [${field}] for ${result.modifiedCount} documents.` };
    } 
    
    else if (actionType === "PULL_ARRAY") {
      const { arrayField, matchKey, matchValue } = payload;
      let finalMatchVal: any = matchValue;
      if (!isNaN(Number(matchValue))) finalMatchVal = Number(matchValue);

      const pullQuery = matchKey ? { [arrayField]: { [matchKey]: finalMatchVal } } : { [arrayField]: finalMatchVal };
      result = await db.collection(collectionName).updateMany(query, { $pull: pullQuery });
      return { success: true, message: `Pulled items from [${arrayField}] in ${result.modifiedCount} documents.` };
    }

    return { success: false, message: "Invalid action type." };
  } catch (error: any) {
    return { success: false, message: error.message };
  }
}