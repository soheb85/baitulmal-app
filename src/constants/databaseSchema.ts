/* eslint-disable @typescript-eslint/no-explicit-any */
// 1. A static list of all your collection (table) names
export const DATABASE_COLLECTIONS = [
  "beneficiaries",
  "users",
  "dailychallans", 
  "counters",
  "inventories",
  "webconfigs",
  "auditlogs",
] as const;

// 2. The deeply mapped static schema for your collections
export const COLLECTION_SCHEMAS = {
  beneficiaries: {
    // Standard flat fields (Strings, Numbers, Booleans, Dates)
    flatFields: [
      "_id",
      "fullName",
      "aadharNumber",
      "mobileNumber",
      "gender",
      "husbandStatus",
      "isEarning",
      "occupation",
      "monthlyIncome",
      "aadharPincode",
      "currentPincode",
      "currentAddress",
      "area",
      "registerDateManual",
      "isException",
      "sons",
      "daughters",
      "otherDependents",
      "earningMembersCount",
      "totalFamilyIncome",
      "housingType",
      "rentAmount",
      "status",
      "rejectionReason",
      "rejectionBy",
      "comments",
      "referencedBy",
      "createdBy",
      "createdAt",
      "updatedAt",
    ],

    // Simple arrays (Array of Strings/Numbers)
    flatArrays: [
      "problems",
      "distributedYears"
    ],

    // Nested Objects (A single object containing fields)
    objects: {
      todayStatus: ["date", "queueDate", "year", "status", "tokenNumber", "tempNote"],
      verificationCycle: ["startDate", "endDate", "isFullyVerified"],
    },

    // Arrays of Objects (Lists containing sub-documents)
    arrayOfObjects: {
      familyMembersDetail: [
        "_id",
        "name",
        "relation",
        "age",
        "maritalStatus",
        "livesWithFamily",
        "isEarning",
        "occupation",
        "monthlyIncome",
        "isStudying",
        "schoolName",
        "classStandard",
        "memberNotes"
      ],
      distributionHistory: [
        "_id",
        "date",
        "year",
        "status",
        "tokenNumber"
      ],
      // 🌟 NEW: Added the pastCycles archive structure here
      pastCycles: [
        "_id",
        "startDate",
        "endDate",
        "distributedYears"
      ],
    },
  },

  // --- NEWly UPDATED: DAILY CHALLANS SCHEMA ---
  dailychallans: {
    flatFields: [
      "_id", 
      "challanNumber", 
      "collectionDate",
      "baitulmalReceiptBookNumber", 
      "baitulmalFrom", 
      "baitulmalTo",   
      "baitulmalCash", 
      "baitulmalOnline",
      "madarsaReceiptBookNumber", 
      "madarsaFrom",   
      "madarsaTo",     
      "madarsaCash", 
      "madarsaOnline",
      "fitraCash", 
      "fitraOnline",
      "totalCashSubmitted", 
      "totalOnlineSubmitted", 
      "grandTotal",
      "status", 
      "submittedBy", 
      "submittedByName", 
      "submittedAt",
      "approvedBy",  
      "approvedAt", 
      "adminNotes",
      "createdAt",
      "updatedAt"
    ],
    flatArrays: [],
    objects: {},
    arrayOfObjects: {
      receiptBreakdown: [
        "_id", 
        "receiptBookNumber", 
        "receiptNumber", 
        "fundCategory", 
        "paymentMode", 
        "amount", 
        "donorName"
      ]
    },
  },

  users: {
    flatFields: [
      "_id", "name", "email", "role", "createdAt", "isApproved", 
      "resetToken", "resetTokenExpiry",
      "hasCollectionAccess", 
      "canSubmitCollection", 
      "canApproveCollection"
    ],
    flatArrays: [],
    objects: {},
    arrayOfObjects: {},
  },
  
  auditlogs: {
    flatFields: ["_id", "action", "performedBy", "details", "timestamp"],
    flatArrays: [],
    objects: {},
    arrayOfObjects: {},
  }
} as const;

/**
 * HELPER UTILITY: 
 * This instantly generates a flat list of ALL dot-notation paths for a collection.
 * Perfect for Dropdowns! (e.g., "todayStatus.status" or "fullName")
 */
export function getFlatPathsForCollection(collectionName: keyof typeof COLLECTION_SCHEMAS) {
  const schema = COLLECTION_SCHEMAS[collectionName];
  if (!schema) return [];

  const paths: string[] = [...schema.flatFields, ...schema.flatArrays];

  // Add Object paths (e.g., todayStatus.status)
  Object.entries(schema.objects).forEach(([objName, fields]) => {
    fields.forEach((field) => paths.push(`${objName}.${field}`));
  });

  // Add Array of Object paths (e.g., familyMembersDetail.name)
  Object.entries(schema.arrayOfObjects).forEach(([arrName, fields]) => {
    fields.forEach((field : any) => paths.push(`${arrName}.${field}`));
  });

  return paths.sort(); 
}