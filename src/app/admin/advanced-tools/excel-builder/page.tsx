/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { generateDynamicExcel, ExcelBlueprint } from "@/app/actions/admin/advancedExportActions";
import { 
  ArrowLeft, FileSpreadsheet, Plus, Trash2, Download, 
  Settings, Type, Database, Palette, CheckCircle2, Loader2 
} from "lucide-react";

export default function ExcelBuilderPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools/reports");

  const [loading, setLoading] = useState(false);
  const [blueprint, setBlueprint] = useState<ExcelBlueprint>({
    fileName: "Custom_Report",
    headerTitle: "ANWARUL QURAN - OFFICIAL REPORT",
    headerRowsCount: 4,
    columnRowIndex: 5,
    dataStartRowIndex: 6,
    dbFilter: {}, // Start with all
    columns: [
      { header: "Sr No.", dbField: "index", width: 8, bold: true },
      { header: "Full Name", dbField: "fullName", width: 30, format: "uppercase" },
      { header: "Aadhaar", dbField: "aadharNumber", width: 20, format: "aadhar" },
      { header: "Mobile", dbField: "mobileNumber", width: 15 },
    ]
  });

  const addColumn = () => {
    setBlueprint({
      ...blueprint,
      columns: [...blueprint.columns, { header: "New Column", dbField: "", width: 15 }]
    });
  };

  const removeColumn = (index: number) => {
    const updated = blueprint.columns.filter((_, i) => i !== index);
    setBlueprint({ ...blueprint, columns: updated });
  };

  const updateColumn = (index: number, key: string, value: any) => {
    const updated = [...blueprint.columns];
    updated[index] = { ...updated[index], [key]: value };
    setBlueprint({ ...blueprint, columns: updated });
  };

  const handleDownload = async () => {
    setLoading(true);
    try {
      const res = await generateDynamicExcel(blueprint);
      if (res.success && res.fileBase64) {
        const link = document.createElement("a");
        link.href = `data:application/vnd.openxmlformats-officedocument.spreadsheetml.sheet;base64,${res.fileBase64}`;
        link.download = res.fileName;
        link.click();
      } else {
        alert("Export failed: " + res.message);
      }
    } catch (e) {
      alert("System Error");
    }
    setLoading(false);
  };

  if (isNavigating) return <NavigationLoader message="Exiting Builder..." />;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit pb-40 overflow-x-hidden">
      {/* Header */}
      <header className="px-4 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-30 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-xl font-black text-emerald-600">Excel Engine v2</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Template Builder</p>
          </div>
        </div>
        <button 
          onClick={handleDownload}
          disabled={loading}
          className="bg-emerald-600 text-white px-5 py-2.5 rounded-xl font-black text-xs uppercase tracking-widest flex items-center gap-2 active:scale-95 transition-all shadow-lg shadow-emerald-200 dark:shadow-none disabled:opacity-50"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          Export
        </button>
      </header>

      <div className="p-4 max-w-4xl mx-auto space-y-6">
        
        {/* SECTION 1: Sheet Layout */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-4">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
            <Settings className="w-4 h-4" /> Layout Configuration
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-gray-500 uppercase ml-1">Main Header Title (Rows 1-4)</label>
              <input 
                type="text" 
                value={blueprint.headerTitle}
                onChange={(e) => setBlueprint({...blueprint, headerTitle: e.target.value})}
                className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold text-sm outline-none border border-transparent focus:border-emerald-500"
              />
            </div>
            <div className="grid grid-cols-3 gap-2">
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Hdr Rows</label>
                <input type="number" value={blueprint.headerRowsCount} onChange={(e)=>setBlueprint({...blueprint, headerRowsCount: Number(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Col Index</label>
                <input type="number" value={blueprint.columnRowIndex} onChange={(e)=>setBlueprint({...blueprint, columnRowIndex: Number(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold text-sm" />
              </div>
              <div className="space-y-1.5">
                <label className="text-[10px] font-bold text-gray-500 uppercase">Data Start</label>
                <input type="number" value={blueprint.dataStartRowIndex} onChange={(e)=>setBlueprint({...blueprint, dataStartRowIndex: Number(e.target.value)})} className="w-full p-3 bg-gray-50 dark:bg-gray-800 rounded-xl font-bold text-sm" />
              </div>
            </div>
          </div>
        </section>

        {/* SECTION 2: Column Mapping */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <div className="flex justify-between items-center mb-6">
             <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
               <Database className="w-4 h-4" /> Column Data Mapping
             </h2>
             <button onClick={addColumn} className="p-2 bg-emerald-50 text-emerald-600 rounded-lg active:scale-90 transition-all">
                <Plus className="w-5 h-5" />
             </button>
          </div>

          <div className="space-y-4">
            {blueprint.columns.map((col, idx) => (
              <div key={idx} className="p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col md:flex-row gap-4 items-end animate-in slide-in-from-right-4 duration-300">
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Excel Header</label>
                  <input 
                    type="text" 
                    value={col.header} 
                    onChange={(e) => updateColumn(idx, 'header', e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-gray-900 rounded-lg text-sm font-bold border-none outline-none"
                  />
                </div>
                <div className="flex-1 w-full space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase">DB Field (Dot Notation)</label>
                  <input 
                    type="text" 
                    value={col.dbField} 
                    placeholder="e.g. todayStatus.tokenNumber"
                    onChange={(e) => updateColumn(idx, 'dbField', e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-gray-900 rounded-lg text-sm font-bold border-none outline-none text-blue-500"
                  />
                </div>
                <div className="w-full md:w-32 space-y-1.5">
                  <label className="text-[9px] font-black text-gray-400 uppercase">Format</label>
                  <select 
                    value={col.format || ""} 
                    onChange={(e) => updateColumn(idx, 'format', e.target.value)}
                    className="w-full p-2.5 bg-white dark:bg-gray-900 rounded-lg text-sm font-bold"
                  >
                    <option value="">None</option>
                    <option value="uppercase">UPPERCASE</option>
                    <option value="aadhar">Aadhaar (1234 5678)</option>
                    <option value="currency">Currency (₹)</option>
                    <option value="date">Date (DD/MM/YY)</option>
                  </select>
                </div>
                <button onClick={() => removeColumn(idx)} className="p-2.5 text-rose-500 bg-rose-50 dark:bg-rose-900/20 rounded-lg shrink-0">
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </section>

        {/* SECTION 3: Conditional Styling Example */}
        <div className="p-5 bg-amber-50 dark:bg-amber-900/10 rounded-2xl border border-amber-100 dark:border-amber-800/30 flex gap-3">
           <Palette className="w-5 h-5 text-amber-600 shrink-0" />
           <p className="text-xs text-amber-800 dark:text-amber-400 font-medium">
             <strong>Developer Note:</strong> This engine automatically formats blacklisted users in <span className="text-rose-600 font-bold">Red</span> and exceptions in <span className="text-amber-600 font-bold">Yellow</span> based on pre-defined server-side logic.
           </p>
        </div>
      </div>
    </main>
  );
}