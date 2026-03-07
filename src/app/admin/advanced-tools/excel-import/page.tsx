/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import * as XLSX from "xlsx";
import { bulkImportBeneficiaries } from "@/app/actions/admin/bulkImportAction";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, FileUp, CheckCircle2, X,
  Loader2, Table as TableIcon, FileText, AlertCircle, Download
} from "lucide-react";

export default function ExcelImportPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  
  const [pendingData, setPendingData] = useState<any[] | null>(null);
  const [fileName, setFileName] = useState("");

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setFileName(file.name);
    const reader = new FileReader();

    reader.onload = (evt) => {
      try {
        const arrayBuffer = evt.target?.result;
        if (!arrayBuffer) return;

        const wb = XLSX.read(arrayBuffer, { type: "array" });
        const ws = wb.Sheets[wb.SheetNames[0]];
        const rawData = XLSX.utils.sheet_to_json(ws);

        // Map data to match our schema expectations
        const mapped = rawData.map((row: any) => ({
          name: row["Name"],
          gender: row["Male/Female"],
          mobileNumber: row["Mobile No."],
          aadharNumber: row["Aadhaar No."],
          address: row["Address"],
          area: row["Area"],
          referredBy: row["Reffered by"] || row["Referred by"],
          aidDate: row["Aid Date"],
          remark:row["Remarks"],
        }));

        setPendingData(mapped);
      } catch (err) {
        alert("Error reading file format.");
      }
    };
    reader.readAsArrayBuffer(file);
  };

  const processImport = async () => {
    if (!pendingData) return;
    setLoading(true);
    const res = await bulkImportBeneficiaries(pendingData, fileName);
    setResult(res);
    setPendingData(null);
    setLoading(false);
  };

  // --- NEW: Create and Download Text File ---
  const downloadErrorLog = () => {
    if (!result || !result.errors || result.errors.length === 0) return;

    const logHeader = `Anwarul Quran - Import Error Log\nFile: ${fileName}\nDate: ${new Date().toLocaleString()}\n--------------------------------------------------\n\n`;
    const logContent = result.errors.join('\n\n');
    const fullLog = logHeader + logContent;

    // Create a Blob (Binary Large Object) for the text file
    const blob = new Blob([fullLog], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    
    // Create a hidden link and click it to trigger download
    const a = document.createElement("a");
    a.href = url;
    a.download = `Import_Errors_${fileName.replace('.xlsx', '')}.txt`;
    document.body.appendChild(a);
    a.click();
    
    // Clean up
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit p-6 pb-32">
      <button onClick={() => handleBack()} className="p-2 bg-white dark:bg-gray-900 rounded-xl border mb-6">
        <ArrowLeft className="w-5 h-5" />
      </button>

      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-black text-gray-900 dark:text-white">Excel Import</h1>
          <p className="text-gray-500 font-medium">Bulk register beneficiaries from legacy sheets</p>
        </div>

        {!result && !pendingData && (
          <div className="bg-white dark:bg-gray-900 border-2 border-dashed border-gray-200 dark:border-gray-800 rounded-[2.5rem] p-12 text-center transition-all hover:border-green-500">
            <input type="file" id="excel-up" className="hidden" accept=".xlsx, .xls" onChange={handleFileSelect} />
            <label htmlFor="excel-up" className="cursor-pointer group">
              <div className="bg-gray-50 dark:bg-gray-800 w-20 h-20 rounded-full flex items-center justify-center mx-auto mb-4 group-hover:scale-110 transition-transform">
                <FileUp className="w-10 h-10 text-gray-400 group-hover:text-green-500" />
              </div>
              <p className="text-xl font-black">Click to Upload</p>
              <p className="text-sm text-gray-400 mt-1">.xlsx or .xls files only</p>
            </label>
          </div>
        )}

        {/* --- CONFIRMATION MODAL --- */}
        {pendingData && (
          <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
            <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 w-full max-w-md shadow-2xl animate-in zoom-in-95">
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl flex items-center gap-4 mb-6 border border-green-100 dark:border-green-800">
                <FileText className="w-10 h-10 text-green-600" />
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black text-green-600 uppercase tracking-widest">Ready to Import</p>
                  <p className="text-sm font-bold truncate text-gray-900 dark:text-white">{fileName}</p>
                </div>
              </div>

              <div className="space-y-4 mb-8">
                <div className="flex justify-between items-center">
                  <span className="text-gray-500 font-bold">Total Rows Found:</span>
                  <span className="font-black text-xl">{pendingData.length}</span>
                </div>
                <p className="text-xs text-gray-400 leading-relaxed">
                  System will automatically extract pincodes from the Area field and check for duplicate Aadhaar numbers.
                </p>
              </div>

              <div className="flex gap-3">
                <button onClick={() => setPendingData(null)} className="flex-1 py-4 font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-2xl">
                  Cancel
                </button>
                <button onClick={processImport} disabled={loading} className="flex-1 py-4 font-black bg-green-600 text-white rounded-2xl shadow-lg shadow-green-200 dark:shadow-none">
                  {loading ? <Loader2 className="animate-spin mx-auto" /> : "Confirm & Import"}
                </button>
              </div>
            </div>
          </div>
        )}

        {/* --- RESULT UI --- */}
        {result && (
          <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border shadow-xl">
             <div className="flex items-center gap-3 mb-8">
               <div className="p-3 bg-green-500 rounded-2xl shadow-lg shadow-green-200 dark:shadow-none"><CheckCircle2 className="text-white" /></div>
               <div>
                  <h2 className="text-xl font-black">Import Report</h2>
                  <p className="text-xs text-gray-400 font-bold uppercase tracking-tighter">{fileName}</p>
               </div>
             </div>

             <div className="grid grid-cols-2 gap-4 mb-8">
               <div className="p-5 bg-green-50 dark:bg-green-900/20 rounded-3xl border border-green-100 dark:border-green-800">
                  <p className="text-[10px] font-black text-green-600 uppercase mb-1">New Success</p>
                  <p className="text-4xl font-black">{result.successCount}</p>
               </div>
               <div className="p-5 bg-orange-50 dark:bg-orange-900/20 rounded-3xl border border-orange-100 dark:border-orange-800">
                  <p className="text-[10px] font-black text-orange-600 uppercase mb-1">Skipped/Dupes</p>
                  <p className="text-4xl font-black">{result.skipCount}</p>
               </div>
             </div>

             {result.errors?.length > 0 && (
               <div className="mb-6">
                 <div className="flex items-center justify-between mb-2">
                   <div className="flex items-center gap-2 text-red-600">
                     <AlertCircle className="w-4 h-4" />
                     <span className="text-xs font-bold uppercase tracking-widest">Row Errors ({result.errors.length})</span>
                   </div>
                   {/* NEW: Download Error Log Button */}
                   <button 
                     onClick={downloadErrorLog}
                     className="flex items-center gap-1.5 text-[10px] font-black bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300 px-3 py-1.5 rounded-lg active:scale-95 transition-transform"
                   >
                     <Download className="w-3 h-3" /> Save Log
                   </button>
                 </div>
                 
                 <div className="p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-800 max-h-40 overflow-y-auto">
                   {result.errors.map((err: string, i: number) => (
                     <p key={i} className="text-[10px] text-red-500 font-medium border-b border-red-100 dark:border-red-900/50 py-1 last:border-0">{err}</p>
                   ))}
                 </div>
               </div>
             )}

             <button onClick={() => setResult(null)} className="w-full py-5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-[1.5rem] active:scale-95 transition-transform">
               DONE
             </button>
          </div>
        )}
      </div>
    </div>
  );
}