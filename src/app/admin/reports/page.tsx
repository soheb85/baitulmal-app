"use client";

import { useState } from "react";
import { getReportData } from "@/app/actions/reportActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { ArrowLeft, FileText, Download, Loader2, CalendarCheck, EyeOff, Eye, Users, LayoutDashboard, Shield } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<"daily" | "all">("daily");
  
  // Privacy Toggles
  const [hideName, setHideName] = useState(false);
  const [maskMobile, setMaskMobile] = useState(true);
  const [maskAadhar, setMaskAadhar] = useState(true);
  
  const { isNavigating, handleBack } = useBackNavigation("/");

  // Helper to format Aadhar
  const formatAadhar = (aadhar: string, mask: boolean) => {
    if (!aadhar || aadhar === "N/A") return "N/A";
    const clean = aadhar.replace(/\D/g, ''); // Remove existing non-digits
    if (clean.length !== 12) return aadhar; // Return as-is if not exactly 12 digits
    
    if (mask) {
      return `xxxx-xxxx-${clean.slice(-4)}`;
    }
    // Return full formatted with hyphens
    return `${clean.slice(0,4)}-${clean.slice(4,8)}-${clean.slice(8,12)}`;
  };

  // Helper to format Mobile
  const formatMobile = (mobile: string, mask: boolean) => {
    if (!mobile || mobile === "N/A") return "N/A";
    const clean = mobile.replace(/\D/g, '');
    if (clean.length < 4) return mobile;

    if (mask) {
      return `******${clean.slice(-4)}`;
    }
    return clean;
  };

  const generatePDF = async () => {
      setGenerating(true);
      
      const { title, date, total, data } = await getReportData(reportType);

      // Using Landscape to fit everything comfortably
      const doc = new jsPDF({ orientation: "landscape" });
      
      // --- Header ---
      doc.setFillColor(22, 163, 74); // Green Header
      doc.rect(0, 0, 297, 40, "F"); // 297 is landscape width
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Anwarul Quran Baitulmal Distribution List", 14, 20);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${title} • Data Export`, 14, 30);

      // --- Summary ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Generated On: ${date}`, 14, 52);
      
      doc.setTextColor(22, 163, 74);
      doc.text(`Total Records: ${total}`, 14, 60);

      // --- Transform Data for Table ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableBody = data.map((item: any) => [
          item.token,
          hideName ? "******" : item.fullName, 
          item.gender,
          formatMobile(item.mobileNumber, maskMobile),
          formatAadhar(item.aadharNumber, maskAadhar), 
          item.familyCount,
          item.problems,
          item.timeOrHistory
      ]);

      const lastColHeader = reportType === "daily" ? "Time" : "Ration History";
      const lastColWidth = reportType === "daily" ? 20 : 38;

      // --- Detailed Table ---
      autoTable(doc, {
          startY: 68,
          head: [['Token', 'Beneficiary Name', 'Sex', 'Mobile', 'Aadhar Card', 'Members', 'Problems/Notes', lastColHeader]],
          body: tableBody,
          theme: 'grid',
          headStyles: { 
              fillColor: [22, 163, 74], 
              textColor: 255, 
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 10
          },
          columnStyles: {
              0: { halign: 'center', cellWidth: 15, fontStyle: 'bold' },
              1: { cellWidth: 45 }, 
              2: { halign: 'center', cellWidth: 12 }, 
              3: { halign: 'center', cellWidth: 30 }, 
              4: { halign: 'center', cellWidth: 35 }, 
              5: { halign: 'center', cellWidth: 18 }, 
              6: { cellWidth: 'auto' }, 
              7: { halign: 'center', cellWidth: lastColWidth } 
          },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          styles: { fontSize: 9, cellPadding: 3, overflow: 'linebreak' }, 
      });

      // --- Footer ---
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Page ${i} of ${pageCount}`, 283, 200, { align: 'right' });
      }

      doc.save(`Anwarul_Quran_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      setGenerating(false);
  };

  if (isNavigating) return <NavigationLoader message="Returning..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit pb-20">
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => handleBack()} className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform">
             <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Report Center</h1>
            <p className="text-sm font-medium text-gray-500 mt-1">Export database records</p>
          </div>
       </div>

       <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
           
           <div className="absolute top-0 w-full h-1.5 bg-linear-to-r from-green-400 to-green-600" />

           <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-inner mx-auto">
               <FileText className="w-12 h-12 text-green-600" />
           </div>
           
           <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2 text-center w-full">Export Data</h2>
           <p className="text-gray-500 text-sm mb-6 max-w-xs font-medium text-center mx-auto">
             Select the type of report you want to generate. PDFs are formatted in landscape.
           </p>

           {/* --- Report Type Selector --- */}
           <div className="w-full grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-2xl mb-6">
              <button 
                onClick={() => setReportType("daily")}
                className={`py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all ${reportType === "daily" ? "bg-white dark:bg-gray-900 text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutDashboard className="w-4 h-4" /> Today&apos;s Log
              </button>
              <button 
                onClick={() => setReportType("all")}
                className={`py-3 flex items-center justify-center gap-2 rounded-xl text-xs font-bold transition-all ${reportType === "all" ? "bg-white dark:bg-gray-900 text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Users className="w-4 h-4" /> Master List
              </button>
           </div>

           {/* --- Configuration Panel --- */}
           <div className="w-full bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-gray-800 space-y-4">
               <div className="flex items-center justify-between pb-3 border-b border-gray-200 dark:border-gray-700">
                   <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                       <CalendarCheck className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                   </div>
                   <span className="text-sm font-bold text-gray-900 dark:text-white">
                       {new Date().toLocaleDateString('en-IN')}
                   </span>
               </div>
               
               <div className="flex items-center gap-2 text-blue-600 dark:text-blue-400 pb-1">
                  <Shield className="w-4 h-4" />
                  <span className="text-[10px] font-black uppercase tracking-wider">Privacy & Masking</span>
               </div>

               {/* Privacy Toggle: Names */}
               <div onClick={() => setHideName(!hideName)} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Hide Names</span>
                   <div className={`w-10 h-5 rounded-full relative transition-colors ${hideName ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${hideName ? 'translate-x-5' : 'translate-x-0'}`} />
                   </div>
               </div>

               {/* Privacy Toggle: Mobile */}
               <div onClick={() => setMaskMobile(!maskMobile)} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Hide Mobile Number</span>
                   <div className={`w-10 h-5 rounded-full relative transition-colors ${maskMobile ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${maskMobile ? 'translate-x-5' : 'translate-x-0'}`} />
                   </div>
               </div>

               {/* Privacy Toggle: Aadhar */}
               <div onClick={() => setMaskAadhar(!maskAadhar)} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Hide Aadhar Number</span>
                   <div className={`w-10 h-5 rounded-full relative transition-colors ${maskAadhar ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${maskAadhar ? 'translate-x-5' : 'translate-x-0'}`} />
                   </div>
               </div>
           </div>

           <button 
             onClick={generatePDF}
             disabled={generating}
             className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-xl shadow-green-200/50 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {generating ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
             {generating ? "Processing Data..." : `Download ${reportType === "daily" ? "Daily" : "Master"} PDF`}
           </button>
       </div>
    </div>
  );
}