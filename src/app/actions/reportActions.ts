/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function getDailyReportData() {
  await connectDB();
  
  const start = new Date();
  start.setHours(0, 0, 0, 0);
  const end = new Date();
  end.setHours(23, 59, 59, 999);

  const beneficiaries = await Beneficiary.find({
    "distributionHistory.date": { $gte: start, $lte: end }
  }).lean();

  // Return raw objects instead of arrays so we can format on client side
  const reportData = beneficiaries.map((b: any) => {
      const log = b.distributionHistory.find((h: any) => 
          new Date(h.date) >= start && new Date(h.date) <= end
      );
      
      const tokenNum = log?.tokenNumber ? parseInt(log.tokenNumber) : 0;

      return {
          rawToken: tokenNum, // For sorting
          token: log ? `#${log.tokenNumber || 'N/A'}` : "-",
          fullName: b.fullName,
          gender: b.gender ? b.gender.charAt(0).toUpperCase() : "-", // M/F
          mobileNumber: b.mobileNumber ? `*****${b.mobileNumber.slice(-5)}` : "N/A",
          aadharNumber: b.aadharNumber ? `xxxx-${b.aadharNumber.slice(-4)}` : "N/A",
          familyCount: b.familyMembersDetail?.length || 0,
          problems: b.problems && b.problems.length > 0 ? b.problems.join(", ") : "-",
          time: log ? new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' }) : "N/A"
      };
  });

  // Sort by Token Number
  reportData.sort((a, b) => a.rawToken - b.rawToken);

  return { 
      date: start.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' }), 
      total: reportData.length, 
      data: reportData 
  };
}