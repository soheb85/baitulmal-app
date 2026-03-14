/* eslint-disable @typescript-eslint/no-explicit-any */
"use server";

import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";

type ReportFilters = {
  type: "distribution" | "master";
  startDate?: string;
  endDate?: string;
  statusFilter?: string;
  genderFilter?: string;
  housingFilter?: string;
  areaFilter?: string;
};

export async function getReportData(filters: ReportFilters) {
  await connectDB();
  
  let beneficiaries;
  let reportData;
  let titleText;
  let dateString;

  // --- DYNAMIC BASE QUERY FOR ALL FILTERS ---
  const baseQuery: any = {};
  if (filters.genderFilter && filters.genderFilter !== 'ALL') {
      baseQuery.gender = filters.genderFilter;
  }
  if (filters.housingFilter && filters.housingFilter !== 'ALL') {
      baseQuery.housingType = filters.housingFilter;
  }
  if (filters.areaFilter && filters.areaFilter.trim() !== '') {
      baseQuery.area = { $regex: filters.areaFilter.trim(), $options: "i" }; // Case-insensitive search
  }

  if (filters.type === "distribution") {
      // --- DISTRIBUTION LOG LOGIC (Filtered by Date Range & Base Query) ---
      const start = filters.startDate ? new Date(filters.startDate) : new Date();
      start.setHours(0, 0, 0, 0);
      
      const end = filters.endDate ? new Date(filters.endDate) : new Date();
      end.setHours(23, 59, 59, 999);

      dateString = `${start.toLocaleDateString('en-IN')} to ${end.toLocaleDateString('en-IN')}`;
      titleText = "Distribution Log Report";

      // Add the date logic to the base filters
      const query = {
          ...baseQuery,
          "distributionHistory.date": { $gte: start, $lte: end }
      };

      beneficiaries = await Beneficiary.find(query).lean();

      reportData = beneficiaries.map((b: any) => {
          const log = b.distributionHistory.find((h: any) => 
              new Date(h.date) >= start && new Date(h.date) <= end
          );
          const tokenNum = log?.tokenNumber ? parseInt(log.tokenNumber) : 0;

          return {
              id: b._id.toString(), // Unique ID for selection
              rawToken: tokenNum,
              token: log ? `#${log.tokenNumber || 'N/A'}` : "-",
              fullName: b.fullName,
              gender: b.gender ? b.gender.charAt(0).toUpperCase() : "-",
              mobileNumber: b.mobileNumber || "N/A", 
              aadharNumber: b.aadharNumber || "N/A", 
              familyCount: b.familyMembersDetail?.length || 0,
              problems: b.problems && b.problems.length > 0 ? b.problems.join(", ") : "-",
              timeOrHistory: log ? new Date(log.date).toLocaleTimeString('en-IN', { hour: '2-digit', minute:'2-digit' }) : "N/A"
          };
      });

      // Sort by Token Number 
      reportData.sort((a, b) => a.rawToken - b.rawToken);

  } else {
      // --- MASTER LIST LOGIC (Filtered by Status & Base Query) ---
      const query = { ...baseQuery };
      if (filters.statusFilter && filters.statusFilter !== 'ALL') {
          query.status = filters.statusFilter;
      }

      beneficiaries = await Beneficiary.find(query).lean();
      
      dateString = new Date().toLocaleDateString('en-IN', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
      titleText = `Master Beneficiary List ${filters.statusFilter !== 'ALL' ? `(${filters.statusFilter})` : ''}`;
      
      reportData = beneficiaries.map((b: any) => {
          const history = b.distributionHistory || [];
          const count = history.length;
          
          const uniqueYears = Array.from(new Set(history.map((h: any) => new Date(h.date).getFullYear()))).sort();
          const historyString = count > 0 
            ? `${count} time${count > 1 ? 's' : ''} (${uniqueYears.join(', ')})` 
            : "Never";

          return {
              id: b._id.toString(), // Unique ID for selection
              rawToken: 0,
              token: "-", 
              fullName: b.fullName,
              gender: b.gender ? b.gender.charAt(0).toUpperCase() : "-",
              mobileNumber: b.mobileNumber || "N/A", 
              aadharNumber: b.aadharNumber || "N/A", 
              familyCount: b.familyMembersDetail?.length || 0,
              problems: b.problems && b.problems.length > 0 ? b.problems.join(", ") : "-",
              timeOrHistory: historyString
          };
      });

      // Sort alphabetically by Name
      reportData.sort((a, b) => a.fullName.localeCompare(b.fullName));
  }

  return { 
      title: titleText,
      date: dateString, 
      total: reportData.length, 
      data: reportData 
  };
}