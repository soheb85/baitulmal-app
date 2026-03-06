/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import * as XLSX from "xlsx";
import { getExportCount, fetchAllDataForExport } from "@/app/actions/admin/exportActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Download, Database, 
  Loader2, CheckCircle2, FileSpreadsheet, ShieldCheck
} from "lucide-react";

export default function ExportDataPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [isExporting, setIsExporting] = useState(false);
  const [downloadSuccess, setDownloadSuccess] = useState(false);

  // Fetch the count when the page loads
  useEffect(() => {
    async function init() {
      const res = await getExportCount();
      if (res.success) {
        setTotalCount(res.count ?? null);
      }
    }
    init();
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setDownloadSuccess(false);

    // 1. Fetch flat data from server
    const res = await fetchAllDataForExport();
    
    if (res.success && res.data) {
      try {
        // 2. Convert JSON to Excel Worksheet
        const worksheet = XLSX.utils.json_to_sheet(res.data);
        
        // 3. Create a new Workbook and append the sheet
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Beneficiaries Backup");
        
        // 4. Generate filename with today's date
        const dateStr = new Date().toISOString().split('T')[0];
        const fileName = `Anwarul_Quran_Backup_${dateStr}.xlsx`;
        
        // 5. Trigger the download using XLSX
        XLSX.writeFile(workbook, fileName);
        
        setDownloadSuccess(true);
      } catch (err: any) {
        alert("Error generating Excel file: " + err.message);
      }
    } else {
      alert("Error fetching data: " + res.message);
    }

    setIsExporting(false);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative">
      <div className="w-full h-full p-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-8 bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-black text-emerald-600 flex items-center gap-2">
              <Download className="w-5 h-5" /> Database Export
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Full Excel Backup</p>
          </div>
        </div>

        {/* Success Alert */}
        {downloadSuccess && (
          <div className="bg-emerald-50 dark:bg-emerald-900/20 p-4 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 flex items-center gap-3 mb-6 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-emerald-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-emerald-800 dark:text-emerald-400">Download Complete</p>
              <p className="text-[10px] text-emerald-600 font-bold uppercase mt-0.5">Check your downloads folder</p>
            </div>
          </div>
        )}

        {/* Main Content Box */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-8 text-center">
          
          <div className="bg-emerald-100 dark:bg-emerald-900/30 w-24 h-24 rounded-full flex items-center justify-center mx-auto shadow-inner border border-emerald-200 dark:border-emerald-800/50">
            <Database className="w-10 h-10 text-emerald-600 dark:text-emerald-400" />
          </div>

          <div>
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Total Records Found</p>
            {totalCount === null ? (
              <Loader2 className="w-8 h-8 animate-spin text-emerald-500 mx-auto" />
            ) : (
              <h2 className="text-5xl font-black text-gray-900 dark:text-white">
                {totalCount}
              </h2>
            )}
          </div>

          <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex gap-3 text-left">
            <ShieldCheck className="w-5 h-5 text-emerald-600 shrink-0 mt-0.5" />
            <p className="text-[11px] text-gray-600 dark:text-gray-400 font-medium leading-relaxed">
              This will generate an offline <strong className="text-gray-900 dark:text-white">.xlsx spreadsheet</strong> containing the full profile data of all beneficiaries. 
              Always perform this backup before using bulk delete tools.
            </p>
          </div>

          <button 
            onClick={handleExport}
            disabled={isExporting || totalCount === 0 || totalCount === null}
            className="w-full py-5 bg-emerald-600 hover:bg-emerald-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-black rounded-2xl shadow-lg shadow-emerald-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-center gap-2"
          >
            {isExporting ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin" />
                <span>GENERATING EXCEL...</span>
              </>
            ) : (
              <>
                <FileSpreadsheet className="w-5 h-5" />
                <span>DOWNLOAD EXCEL BACKUP</span>
              </>
            )}
          </button>
        </div>

      </div>
    </main>
  );
}