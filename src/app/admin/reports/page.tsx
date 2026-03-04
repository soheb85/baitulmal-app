"use client";

import { useState } from "react";
import { getDailyReportData } from "@/app/actions/reportActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { ArrowLeft, FileText, Download, Loader2, CalendarCheck, EyeOff, Eye } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [hideName, setHideName] = useState(false); // State for Name Masking
  
  const { isNavigating, handleBack } = useBackNavigation("/");

  const generatePDF = async () => {
      setGenerating(true);
      const { date, total, data } = await getDailyReportData();

      const doc = new jsPDF();
      // Set to Landscape if there are many problems to display, but Portrait is usually fine for lists
      // const doc = new jsPDF({ orientation: "landscape" });
      
      // --- Header ---
      doc.setFillColor(22, 163, 74);
      doc.rect(0, 0, 210, 40, "F");
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(22);
      doc.setFont("helvetica", "bold");
      doc.text("Daily Distribution Report", 14, 20);
      
      doc.setFontSize(10);
      doc.setFont("helvetica", "normal");
      doc.text(`Anwarul Quran Baitulmal • ${hideName ? "Confidential Mode" : "Standard Report"}`, 14, 30);

      // --- Summary ---
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Date: ${date}`, 14, 55);
      
      doc.setTextColor(22, 163, 74);
      doc.text(`Total Kits: ${total}`, 14, 62);

      // --- Transform Data for Table ---
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const tableBody = data.map((item: any) => [
          item.token,
          hideName ? "******" : item.fullName, // Logic to hide name
          item.gender,
          item.mobileNumber,
          item.familyCount,
          item.problems,
          item.time
      ]);

      // --- Detailed Table ---
      autoTable(doc, {
          startY: 70,
          head: [['Sr.No', 'Name', 'Sex', 'Mobile', 'U-No', 'Problems', 'Time']],
          body: tableBody,
          theme: 'grid',
          headStyles: { 
              fillColor: [22, 163, 74], 
              textColor: 255, 
              fontStyle: 'bold',
              halign: 'center',
              fontSize: 9
          },
          columnStyles: {
              0: { halign: 'center', cellWidth: 12, fontStyle: 'bold' }, // Token
              1: { cellWidth: 35 }, // Name
              2: { halign: 'center', cellWidth: 13 }, // Gender
              4: { halign: 'center', cellWidth: 13 }, // Member
              6: { halign: 'center', cellWidth: 20 }  // Time
          },
          alternateRowStyles: { fillColor: [240, 253, 244] },
          styles: { fontSize: 8, cellPadding: 2, overflow: 'linebreak' }, // Smaller font to fit columns
      });

      // --- Footer ---
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Page ${i} of ${pageCount}`, 196, 285, { align: 'right' });
      }

      doc.save(`Ration_Report_${hideName ? 'Privacy_' : ''}${new Date().toISOString().split('T')[0]}.pdf`);
      setGenerating(false);
  };

  if (isNavigating) return <NavigationLoader message="Returning..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit">
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => handleBack()} className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform">
             <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">Reports</h1>
       </div>

       <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center text-center relative overflow-hidden">
           
           <div className="absolute top-0 w-full h-1.5 bg-linear-to-r from-green-400 to-green-600" />

           <div className="w-24 h-24 bg-green-50 dark:bg-green-900/20 rounded-3xl flex items-center justify-center mb-6 shadow-inner">
               <FileText className="w-12 h-12 text-green-600" />
           </div>
           
           <h2 className="text-xl font-black text-gray-900 dark:text-white mb-2">Daily Summary</h2>
           <p className="text-gray-500 text-sm mb-6 max-w-xs font-medium">
             Generate a detailed PDF report including Token, Gender, Problems & Time.
           </p>

           <div className="w-full bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-gray-800">
               <div className="flex items-center justify-between mb-3">
                   <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                       <CalendarCheck className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase tracking-wider">Date</span>
                   </div>
                   <span className="text-sm font-bold text-gray-900 dark:text-white">
                       {new Date().toLocaleDateString('en-IN')}
                   </span>
               </div>
               
               {/* --- Privacy Toggle --- */}
               <div 
                 onClick={() => setHideName(!hideName)}
                 className="flex items-center justify-between cursor-pointer p-2 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-colors select-none"
               >
                   <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400">
                       {hideName ? <EyeOff className="w-4 h-4 text-orange-500" /> : <Eye className="w-4 h-4" />}
                       <span className="text-xs font-bold uppercase tracking-wider">Hide Names</span>
                   </div>
                   <div className={`w-10 h-5 rounded-full relative transition-colors ${hideName ? 'bg-orange-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`absolute top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${hideName ? 'translate-x-5' : 'translate-x-0'}`} />
                   </div>
               </div>
           </div>

           <button 
             onClick={generatePDF}
             disabled={generating}
             className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl shadow-xl shadow-green-200/50 dark:shadow-none flex items-center justify-center gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed"
           >
             {generating ? <Loader2 className="animate-spin w-5 h-5" /> : <Download className="w-5 h-5" />}
             {generating ? "Processing..." : "Download PDF"}
           </button>
       </div>
    </div>
  );
}