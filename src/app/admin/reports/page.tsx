/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { getReportData } from "@/app/actions/reportActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { ArrowLeft, FileText, Download, Loader2, Users, LayoutDashboard, Shield, FileSearch, X, AlertTriangle, CheckSquare } from "lucide-react";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";

export default function ReportsPage() {
  const [generating, setGenerating] = useState(false);
  const [reportType, setReportType] = useState<"distribution" | "master">("distribution");
  
  // Base Filters
  const todayFormatted = new Date().toISOString().split('T')[0];
  const [startDate, setStartDate] = useState(todayFormatted);
  const [endDate, setEndDate] = useState(todayFormatted);
  const [statusFilter, setStatusFilter] = useState("ALL");
  
  // Extended Filters
  const [genderFilter, setGenderFilter] = useState("ALL");
  const [housingFilter, setHousingFilter] = useState("ALL");
  const [areaFilter, setAreaFilter] = useState("");

  // Privacy Toggles
  const [hideName, setHideName] = useState(false);
  const [maskMobile, setMaskMobile] = useState(true);
  const [maskAadhar, setMaskAadhar] = useState(true);
  
  // Preview Modal States
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [previewData, setPreviewData] = useState<any>(null);
  
  // Checkbox Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  const { isNavigating, handleBack } = useBackNavigation("/");

  // Helper formatting
  const formatAadhar = (aadhar: string, mask: boolean) => {
    if (!aadhar || aadhar === "N/A") return "N/A";
    const clean = aadhar.replace(/\D/g, '');
    if (clean.length !== 12) return aadhar; 
    if (mask) return `xxxx-xxxx-${clean.slice(-4)}`;
    return `${clean.slice(0,4)}-${clean.slice(4,8)}-${clean.slice(8,12)}`;
  };

  const formatMobile = (mobile: string, mask: boolean) => {
    if (!mobile || mobile === "N/A") return "N/A";
    const clean = mobile.replace(/\D/g, '');
    if (clean.length < 4) return mobile;
    if (mask) return `******${clean.slice(-4)}`;
    return clean;
  };

  // --- 1. FETCH PREVIEW DATA & SELECT ALL ---
  const handleGeneratePreview = async () => {
      setGenerating(true);
      const res = await getReportData({
        type: reportType,
        startDate: reportType === "distribution" ? startDate : undefined,
        endDate: reportType === "distribution" ? endDate : undefined,
        statusFilter: reportType === "master" ? statusFilter : undefined,
        genderFilter,
        housingFilter,
        areaFilter
      });
      
      setPreviewData(res);
      // By default, select all records when modal opens
      if (res.data) {
        setSelectedIds(new Set(res.data.map((item: any) => item.id)));
      }
      
      setGenerating(false);
      setIsPreviewOpen(true);
  };

  // --- CHECKBOX TOGGLE LOGIC ---
  const handleToggleAll = () => {
    if (selectedIds.size === previewData.data.length) {
      setSelectedIds(new Set()); // Deselect all
    } else {
      setSelectedIds(new Set(previewData.data.map((item: any) => item.id))); // Select all
    }
  };

  const handleToggleRow = (id: string) => {
    const newSelected = new Set(selectedIds);
    if (newSelected.has(id)) newSelected.delete(id);
    else newSelected.add(id);
    setSelectedIds(newSelected);
  };

  // --- 2. DOWNLOAD PDF (Uses only SELECTED preview data) ---
  const handleDownloadPDF = () => {
      if (!previewData || selectedIds.size === 0) return;

      const doc = new jsPDF({ orientation: "landscape" });
      
      // Filter data to only include selected checkboxes
      const selectedData = previewData.data.filter((item: any) => selectedIds.has(item.id));

      // Header
      doc.setFillColor(22, 163, 74); 
      doc.rect(0, 0, 297, 40, "F"); 
      
      doc.setTextColor(255, 255, 255);
      doc.setFontSize(24);
      doc.setFont("helvetica", "bold");
      doc.text("Anwarul Quran Baitulmal Distribution", 14, 20);
      
      doc.setFontSize(12);
      doc.setFont("helvetica", "normal");
      doc.text(`${previewData.title} • Data Export`, 14, 30);

      // Summary
      doc.setTextColor(0, 0, 0);
      doc.setFontSize(12);
      doc.setFont("helvetica", "bold");
      doc.text(`Date / Period: ${previewData.date}`, 14, 52);
      
      doc.setTextColor(22, 163, 74);
      doc.text(`Total Records Included: ${selectedData.length}`, 14, 60);

      // Transform Selected Data
      const tableBody = selectedData.map((item: any) => [
          item.token,
          hideName ? "******" : item.fullName, 
          item.gender,
          formatMobile(item.mobileNumber, maskMobile),
          formatAadhar(item.aadharNumber, maskAadhar), 
          item.familyCount,
          item.problems,
          item.timeOrHistory
      ]);

      const lastColHeader = reportType === "distribution" ? "Time" : "Ration History";
      const lastColWidth = reportType === "distribution" ? 20 : 38;

      autoTable(doc, {
          startY: 68,
          head: [['Token', 'Beneficiary Name', 'Sex', 'Mobile', 'Aadhar Card', 'Members', 'Problems/Notes', lastColHeader]],
          body: tableBody,
          theme: 'grid',
          headStyles: { fillColor: [22, 163, 74], textColor: 255, fontStyle: 'bold', halign: 'center', fontSize: 10 },
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

      // Footer
      const pageCount = doc.getNumberOfPages();
      for(let i = 1; i <= pageCount; i++) {
          doc.setPage(i);
          doc.setFontSize(8);
          doc.setTextColor(150);
          doc.text(`Page ${i} of ${pageCount}`, 283, 200, { align: 'right' });
      }

      doc.save(`Baitulmal_${reportType}_${new Date().toISOString().split('T')[0]}.pdf`);
      setIsPreviewOpen(false);
  };

  if (isNavigating) return <NavigationLoader message="Returning..." />;

  const isAllSelected = previewData?.data && selectedIds.size === previewData.data.length && previewData.data.length > 0;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-4 sm:p-6 font-outfit pb-20">
        
        {/* 🌟 PERFECT MOBILE-OPTIMIZED MODAL 🌟 */}
        {isPreviewOpen && previewData && (
          <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-3 sm:p-4 animate-in fade-in">
            <div className="bg-white dark:bg-gray-900 rounded-3xl w-full max-w-4xl max-h-[92vh] sm:max-h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-gray-200 dark:border-gray-800">
               
               {/* Modal Header */}
               <div className="p-4 sm:p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-start bg-gray-50 dark:bg-gray-800/50 shrink-0">
                 <div className="min-w-0 pr-2">
                   <h3 className="text-base sm:text-lg font-black text-gray-900 dark:text-white leading-tight truncate">{previewData.title}</h3>
                   <p className="text-[10px] sm:text-xs font-bold text-gray-500 mt-1 truncate">Found {previewData.total} matching records</p>
                 </div>
                 <button onClick={() => setIsPreviewOpen(false)} className="p-2 bg-gray-200 dark:bg-gray-700 rounded-full hover:bg-gray-300 dark:hover:bg-gray-600 transition shrink-0 active:scale-95">
                   <X className="w-4 h-4 sm:w-5 sm:h-5 text-gray-600 dark:text-gray-300" />
                 </button>
               </div>

               {/* Modal Body (Scrollable Area) */}
               <div className="p-4 sm:p-5 overflow-hidden flex flex-col flex-1 min-h-0">
                 <div className="flex items-center justify-between mb-3 shrink-0">
                   <div className={`px-3 py-1.5 rounded-lg text-[10px] sm:text-xs font-black uppercase tracking-widest flex items-center gap-2 transition-colors ${selectedIds.size > 0 ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'}`}>
                     <CheckSquare className="w-3 h-3 sm:w-4 sm:h-4" /> Selected: {selectedIds.size} / {previewData.total}
                   </div>
                 </div>

                 {previewData.total === 0 ? (
                   <div className="text-center py-12 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                     <AlertTriangle className="w-10 h-10 text-orange-500 mx-auto mb-3" />
                     <p className="text-sm sm:text-base text-gray-900 dark:text-white font-bold">No records found!</p>
                     <p className="text-xs text-gray-500 mt-1">Try changing your filters.</p>
                   </div>
                 ) : (
                   /* 🌟 HORIZONTAL SCROLL WRAPPER FOR MOBILE 🌟 */
                   <div className="border border-gray-200 dark:border-gray-700 rounded-xl flex-1 overflow-x-auto overflow-y-auto bg-white dark:bg-gray-900">
                     <table className="w-full text-left border-collapse text-[10px] sm:text-xs min-w-[400px]">
                       <thead className="sticky top-0 z-20 bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400 font-bold uppercase tracking-wider shadow-sm">
                         <tr>
                           <th className="p-3 border-b border-gray-200 dark:border-gray-700 w-10 text-center">
                             <input 
                               type="checkbox" 
                               checked={isAllSelected}
                               onChange={handleToggleAll}
                               className="w-4 h-4 accent-green-600 cursor-pointer"
                             />
                           </th>
                           <th className="p-3 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">Name</th>
                           <th className="p-3 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">Aadhaar</th>
                           <th className="p-3 border-b border-gray-200 dark:border-gray-700 whitespace-nowrap">Mobile</th>
                         </tr>
                       </thead>
                       <tbody className="divide-y divide-gray-100 dark:divide-gray-800/50">
                         {previewData.data.map((item: any) => (
                           // 🌟 ENTIRE ROW IS CLICKABLE FOR EASY MOBILE TAPPING 🌟
                           <tr 
                             key={item.id} 
                             onClick={() => handleToggleRow(item.id)}
                             className={`font-medium cursor-pointer transition-colors active:bg-gray-200 dark:active:bg-gray-700 ${selectedIds.has(item.id) ? 'bg-green-50/50 dark:bg-green-900/10' : 'hover:bg-gray-50 dark:hover:bg-gray-800'} text-gray-900 dark:text-gray-200`}
                           >
                             <td className="p-3 text-center">
                               <input 
                                 type="checkbox" 
                                 checked={selectedIds.has(item.id)}
                                 onChange={() => handleToggleRow(item.id)}
                                 onClick={(e) => e.stopPropagation()} 
                                 className="w-4 h-4 accent-green-600 cursor-pointer"
                               />
                             </td>
                             <td className="p-3 truncate max-w-[120px] sm:max-w-none">{hideName ? "******" : item.fullName}</td>
                             <td className="p-3 font-mono tracking-tight">{formatAadhar(item.aadharNumber, maskAadhar)}</td>
                             <td className="p-3 font-mono tracking-tight">{formatMobile(item.mobileNumber, maskMobile)}</td>
                           </tr>
                         ))}
                       </tbody>
                     </table>
                   </div>
                 )}
               </div>

               {/* Modal Footer (Stacks vertically on very small screens, side-by-side on larger) */}
               <div className="p-4 sm:p-5 border-t border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row gap-2 sm:gap-3 bg-gray-50 dark:bg-gray-800/50 shrink-0">
                  <button onClick={() => setIsPreviewOpen(false)} className="w-full sm:flex-1 py-3.5 bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-xl font-bold text-gray-600 dark:text-gray-300 shadow-sm active:scale-95 transition-transform text-xs sm:text-sm">
                    Cancel
                  </button>
                  <button 
                    onClick={handleDownloadPDF} 
                    disabled={selectedIds.size === 0}
                    className="w-full sm:flex-[2] py-3.5 bg-green-600 hover:bg-green-700 text-white rounded-xl font-black shadow-md flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed transition-all active:scale-95 text-xs sm:text-sm"
                  >
                    <Download className="w-4 h-4" /> GENERATE PDF ({selectedIds.size})
                  </button>
               </div>
            </div>
          </div>
        )}

        {/* --- MAIN PAGE UI --- */}
        <div className="flex items-center gap-4 mb-6 sm:mb-8">
          <button onClick={() => handleBack()} className="p-2.5 sm:p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform">
             <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl sm:text-2xl font-black text-gray-900 dark:text-white leading-none">Report Center</h1>
            <p className="text-xs sm:text-sm font-medium text-gray-500 mt-1">Filter, Preview & Export</p>
          </div>
       </div>

       <div className="max-w-md mx-auto bg-white dark:bg-gray-900 p-5 sm:p-6 rounded-[2rem] sm:rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 flex flex-col items-center relative overflow-hidden animate-in fade-in slide-in-from-bottom-4">
           <div className="absolute top-0 w-full h-1.5 bg-gradient-to-r from-green-400 to-green-600" />

           <div className="w-16 h-16 sm:w-20 sm:h-20 bg-green-50 dark:bg-green-900/20 rounded-2xl sm:rounded-[1.5rem] flex items-center justify-center mb-4 sm:mb-5 shadow-inner mx-auto">
               <FileText className="w-8 h-8 sm:w-10 sm:h-10 text-green-600" />
           </div>
           
           {/* --- Report Type Selector --- */}
           <div className="w-full grid grid-cols-2 gap-2 bg-gray-100 dark:bg-gray-800 p-1.5 rounded-xl sm:rounded-2xl mb-5 sm:mb-6">
              <button 
                onClick={() => setReportType("distribution")}
                className={`py-2.5 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all ${reportType === "distribution" ? "bg-white dark:bg-gray-900 text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <LayoutDashboard className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Distribution Log
              </button>
              <button 
                onClick={() => setReportType("master")}
                className={`py-2.5 sm:py-3 flex items-center justify-center gap-1.5 sm:gap-2 rounded-lg sm:rounded-xl text-[10px] sm:text-xs font-bold transition-all ${reportType === "master" ? "bg-white dark:bg-gray-900 text-green-600 shadow-sm" : "text-gray-500 hover:text-gray-700"}`}
              >
                <Users className="w-3.5 h-3.5 sm:w-4 sm:h-4" /> Master List
              </button>
           </div>

           {/* --- EXTENDED FILTERS SECTION --- */}
           <div className="w-full bg-blue-50/50 dark:bg-blue-900/10 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 border border-blue-100 dark:border-blue-900/30">
              <h3 className="text-[9px] sm:text-[10px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-3 flex items-center gap-1.5">
                <FileSearch className="w-3 h-3" /> Data Filters
              </h3>
              
              <div className="space-y-3">
                {reportType === "distribution" ? (
                  <div className="grid grid-cols-2 gap-2 sm:gap-3">
                    <div>
                      <label className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Start Date</label>
                      <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] sm:text-xs font-bold outline-none" />
                    </div>
                    <div>
                      <label className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">End Date</label>
                      <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] sm:text-xs font-bold outline-none" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Status Filter</label>
                    <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className="w-full p-2.5 sm:p-3 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-xs sm:text-sm font-bold outline-none">
                      <option value="ALL">All Beneficiaries</option>
                      <option value="ACTIVE">Active Only</option>
                      <option value="ON_HOLD">On Hold</option>
                      <option value="BLACKLISTED">Blacklisted</option>
                    </select>
                  </div>
                )}

                <div className="grid grid-cols-2 gap-2 sm:gap-3">
                  <div>
                    <label className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Gender</label>
                    <select value={genderFilter} onChange={e => setGenderFilter(e.target.value)} className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] sm:text-xs font-bold outline-none">
                      <option value="ALL">Any Gender</option>
                      <option value="MALE">Male</option>
                      <option value="FEMALE">Female</option>
                    </select>
                  </div>
                  <div>
                    <label className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Housing Type</label>
                    <select value={housingFilter} onChange={e => setHousingFilter(e.target.value)} className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] sm:text-xs font-bold outline-none">
                      <option value="ALL">Any Housing</option>
                      <option value="OWN">Owned</option>
                      <option value="RENT">Rented</option>
                    </select>
                  </div>
                </div>

                <div>
                  <label className="text-[8px] sm:text-[9px] font-bold text-gray-500 uppercase tracking-wider mb-1 block">Area / Locality Search</label>
                  <input 
                    type="text" 
                    value={areaFilter} 
                    onChange={e => setAreaFilter(e.target.value)} 
                    placeholder="e.g. Bandra, Shivaji Nagar..."
                    className="w-full p-2 sm:p-2.5 rounded-lg sm:rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 text-[10px] sm:text-xs font-bold outline-none placeholder:text-gray-400" 
                  />
                </div>
              </div>
           </div>

           {/* --- Configuration Panel --- */}
           <div className="w-full bg-gray-50 dark:bg-gray-800/50 p-3 sm:p-4 rounded-xl sm:rounded-2xl mb-5 sm:mb-6 border border-gray-100 dark:border-gray-800 space-y-3 sm:space-y-4">
               <div className="flex items-center gap-2 text-gray-500 dark:text-gray-400 pb-1">
                  <Shield className="w-3.5 h-3.5 sm:w-4 sm:h-4" />
                  <span className="text-[9px] sm:text-[10px] font-black uppercase tracking-wider">Privacy & Masking</span>
               </div>

               <div onClick={() => setHideName(!hideName)} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Hide Names</span>
                   <div className={`w-9 sm:w-10 h-4 sm:h-5 rounded-full relative transition-colors ${hideName ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`absolute top-0.5 sm:top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${hideName ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
                   </div>
               </div>

               <div onClick={() => setMaskMobile(!maskMobile)} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Hide Mobile Number</span>
                   <div className={`w-9 sm:w-10 h-4 sm:h-5 rounded-full relative transition-colors ${maskMobile ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`absolute top-0.5 sm:top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${maskMobile ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
                   </div>
               </div>

               <div onClick={() => setMaskAadhar(!maskAadhar)} className="flex items-center justify-between cursor-pointer group">
                   <span className="text-xs sm:text-sm font-bold text-gray-700 dark:text-gray-300 group-hover:text-gray-900 transition-colors">Hide Aadhar Number</span>
                   <div className={`w-9 sm:w-10 h-4 sm:h-5 rounded-full relative transition-colors ${maskAadhar ? 'bg-green-500' : 'bg-gray-300 dark:bg-gray-600'}`}>
                       <div className={`absolute top-0.5 sm:top-1 left-1 w-3 h-3 bg-white rounded-full transition-transform ${maskAadhar ? 'translate-x-4 sm:translate-x-5' : 'translate-x-0'}`} />
                   </div>
               </div>
           </div>

           <button 
             onClick={handleGeneratePreview}
             disabled={generating}
             className="w-full py-3.5 sm:py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-xl sm:rounded-2xl shadow-xl flex items-center justify-center gap-2 sm:gap-3 transition-all active:scale-95 disabled:opacity-70 disabled:cursor-not-allowed text-xs sm:text-sm"
           >
             {generating ? <Loader2 className="animate-spin w-4 h-4 sm:w-5 sm:h-5" /> : <FileSearch className="w-4 h-4 sm:w-5 sm:h-5" />}
             {generating ? "Fetching Data..." : "GENERATE PREVIEW"}
           </button>
       </div>
    </div>
  );
}