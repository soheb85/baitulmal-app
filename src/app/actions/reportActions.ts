/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

export async function getReportData(type: "daily" | "all") {
  await connectDB();
  
  let beneficiaries;
  let reportData;
  let titleText;

  const today = new Date();
  const dateString = today.toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (type === "daily") {
      // --- DAILY DISTRIBUTION LOGIC ---
      const start = new Date();
      start.setHours(0, 0, 0, 0);
      const end = new Date();
      end.setHours(23, 59, 59, 999);

      beneficiaries = await Beneficiary.find({
        "distributionHistory.date": { $gte: start, $lte: end }
      }).lean();

      reportData = beneficiaries.map((b: any) => {
          const log = b.distributionHistory.find((h: any) => 
              new Date(h.date) >= start && new Date(h.date) <= end
          );
          const tokenNum = log?.tokenNumber ? parseInt(log.tokenNumber) : 0;

          return {
              rawToken: tokenNum,
              token: log ? `#${log.tokenNumber || 'N/A'}` : "-",
              fullName: b.fullName,
              gender: b.gender ? b.gender.charAt(0).toUpperCase() : "-",
              mobileNumber: b.mobileNumber || "N/A", // Sending raw number
              aadharNumber: b.aadharNumber || "N/A", // Sending raw number
              familyCount: b.familyMembersDetail?.length || 0,
              problems: b.problems && b.problems.length > 0 ? b.problems.join(", ") : "-",
              timeOrHistory: log ? new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' }) : "N/A"
          };
      });

      // Sort by Token Number for daily distribution
      reportData.sort((a, b) => a.rawToken - b.rawToken);
      titleText = "Daily Distribution Report";

  } else {
      // --- ALL BENEFICIARIES (MASTER LIST) LOGIC ---
      beneficiaries = await Beneficiary.find().lean();
      
      reportData = beneficiaries.map((b: any) => {
          const history = b.distributionHistory || [];
          const count = history.length;
          
          // Extract unique years from the distribution dates
          const uniqueYears = Array.from(new Set(history.map((h: any) => new Date(h.date).getFullYear()))).sort();
          
          // Format as "3 times (2024, 2025, 2026)" or "Never"
          const historyString = count > 0 
            ? `${count} time${count > 1 ? 's' : ''} (${uniqueYears.join(', ')})` 
            : "Never";

          return {
              rawToken: 0,
              token: "-", 
              fullName: b.fullName,
              gender: b.gender ? b.gender.charAt(0).toUpperCase() : "-",
              mobileNumber: b.mobileNumber || "N/A", // Sending raw number
              aadharNumber: b.aadharNumber || "N/A", // Sending raw number
              familyCount: b.familyMembersDetail?.length || 0,
              problems: b.problems && b.problems.length > 0 ? b.problems.join(", ") : "-",
              timeOrHistory: historyString
          };
      });

      // Sort alphabetically by Name for master list
      reportData.sort((a, b) => a.fullName.localeCompare(b.fullName));
      titleText = "Master Beneficiary List";
  }

  return { 
      title: titleText,
      date: dateString, 
      total: reportData.length, 
      data: reportData 
  };
}