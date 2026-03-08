/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import ExcelJS from "exceljs";

// --- Helper to extract nested DB fields (e.g. "todayStatus.tokenNumber") ---
const getNestedValue = (obj: any, path: string) => {
  if (!path || path === "index") return "";
  return path.split('.').reduce((acc, part) => (acc && acc[part] !== undefined) ? acc[part] : "", obj);
};

// --- The Dynamic Blueprint Interface ---
export interface ExcelBlueprint {
  fileName: string;
  headerTitle: string;
  headerRowsCount: number; 
  columnRowIndex: number;  
  dataStartRowIndex: number; 
  columns: {
    header: string;      
    dbField: string;     
    width: number;       
    format?: "uppercase" | "aadhar" | "currency" | "date"; 
    bold?: boolean;
    color?: string;      // Hex color (e.g., "FF0000")
  }[];
  rowConditions?: {
    dbField: string;     
    operator: "equals" | "not_equals" | "greater_than";
    value: any;          
    bgColor: string;     // Hex color (e.g., "FFFFE4E6")
    textColor: string;   
  }[];
  dbFilter: any;         
}

export async function generateDynamicExcel(blueprint: ExcelBlueprint) {
  await connectDB();

  try {
    // 1. Fetch Data
    const beneficiaries = await Beneficiary.find(blueprint.dbFilter).lean();

    // 2. Initialize Workbook
    const workbook = new ExcelJS.Workbook();
    const sheet = workbook.addWorksheet("Report", {
      views: [{ state: 'frozen', xSplit: 0, ySplit: blueprint.columnRowIndex }] 
    });

    // ==========================================
    // ROW 1 to X: CUSTOM HEADER BLOCK
    // ==========================================
    if (blueprint.headerRowsCount > 0) {
      const lastColLetter = sheet.getColumn(blueprint.columns.length).letter;
      sheet.mergeCells(`A1:${lastColLetter}${blueprint.headerRowsCount}`);
      
      const headerCell = sheet.getCell('A1');
      headerCell.value = blueprint.headerTitle;
      headerCell.font = { name: 'Arial', size: 16, bold: true, color: { argb: 'FFFFFFFF' } };
      headerCell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF1E3A8A' } };
      headerCell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
    }

    // ==========================================
    // COLUMN HEADERS
    // ==========================================
    const headerRow = sheet.getRow(blueprint.columnRowIndex);
    headerRow.values = blueprint.columns.map(col => col.header);
    
    headerRow.eachCell((cell, colNumber) => {
      cell.font = { bold: true, color: { argb: 'FFFFFFFF' } };
      cell.fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF4F46E5' } };
      cell.alignment = { vertical: 'middle', horizontal: 'center' };
      sheet.getColumn(colNumber).width = blueprint.columns[colNumber - 1].width;
    });

    // ==========================================
    // DATA INJECTION (Row Start Index+)
    // ==========================================
    const errors: any[] = [];
    let currentRowIndex = blueprint.dataStartRowIndex;

    // FIX: Added 'index' to the forEach arguments
    beneficiaries.forEach((record: any, index: number) => {
      try {
        const rowValues = blueprint.columns.map(colConfig => {
          // Handle the Serial Number / Index column
          if (colConfig.dbField === "index") return index + 1;

          // Fetch raw data
          let rawValue = getNestedValue(record, colConfig.dbField);

          // Data Manipulation
          if (colConfig.format === "uppercase" && typeof rawValue === "string") {
            rawValue = rawValue.toUpperCase();
          } else if (colConfig.format === "aadhar" && rawValue) {
            rawValue = String(rawValue).replace(/(\d{4})(?=\d)/g, "$1 ");
          } else if (colConfig.format === "currency" && (rawValue || rawValue === 0)) {
            rawValue = `₹ ${rawValue}`;
          } else if (colConfig.format === "date" && rawValue) {
            rawValue = new Date(rawValue).toLocaleDateString('en-IN');
          }

          return rawValue;
        });

        const excelRow = sheet.getRow(currentRowIndex);
        excelRow.values = rowValues;

        // Apply Styling to the Row
        excelRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
          const colConfig = blueprint.columns[colNumber - 1];
          cell.alignment = { vertical: 'middle', horizontal: 'left', wrapText: true };
          cell.border = { 
            top: { style: 'thin', color: { argb: 'FFDDDDDD' } }, 
            bottom: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            left: { style: 'thin', color: { argb: 'FFDDDDDD' } },
            right: { style: 'thin', color: { argb: 'FFDDDDDD' } }
          };
          
          if (colConfig.bold) cell.font = { ...cell.font, bold: true };
          if (colConfig.color) cell.font = { ...cell.font, color: { argb: `FF${colConfig.color.replace('#', '')}` } };

          // Row-Level Conditional Formatting
          if (blueprint.rowConditions) {
            blueprint.rowConditions.forEach(rule => {
              const ruleFieldValue = getNestedValue(record, rule.dbField);
              let conditionMet = false;

              if (rule.operator === "equals" && ruleFieldValue === rule.value) conditionMet = true;
              if (rule.operator === "not_equals" && ruleFieldValue !== rule.value) conditionMet = true;

              if (conditionMet) {
                cell.fill = { 
                  type: 'pattern', 
                  pattern: 'solid', 
                  fgColor: { argb: `FF${rule.bgColor.replace('#', '')}` } 
                };
                cell.font = { 
                  ...cell.font, 
                  color: { argb: `FF${rule.textColor.replace('#', '')}` }, 
                  bold: true 
                };
              }
            });
          }
        });

        currentRowIndex++;

      } catch (err: any) {
        errors.push({ id: record._id, error: err.message });
      }
    });

    const buffer = await workbook.xlsx.writeBuffer();
    return { 
      success: true, 
      fileBase64: Buffer.from(buffer).toString('base64'), 
      fileName: `${blueprint.fileName || 'Report'}_${new Date().toISOString().split('T')[0]}.xlsx`,
      errors 
    };

  } catch (error: any) {
    console.error("Excel Generation Error:", error);
    return { success: false, message: error.message };
  }
}