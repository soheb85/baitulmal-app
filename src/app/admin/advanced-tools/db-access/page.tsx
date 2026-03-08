/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { executeRawQuery } from "@/app/actions/admin/dbConsoleActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { ArrowLeft, Terminal, Play, AlertTriangle, Loader2 } from "lucide-react";

export default function DatabaseConsolePage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");

  const [collection, setCollection] = useState("Beneficiary");
  const [operation, setOperation] = useState<"find" | "findOne" | "countDocuments" | "updateMany" | "deleteMany">("find");
  
  // Cleaned up default JSON spacing
  const [filterStr, setFilterStr] = useState('{\n  "status": "ACTIVE"\n}');
  const [updateStr, setUpdateStr] = useState('{\n  "$set": { "isException": true }\n}');
  
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);

  const handleExecute = async () => {
    setLoading(true);
    setResult(null);
    
    try {
      if (filterStr.trim()) JSON.parse(filterStr);
      if (operation === "updateMany" && updateStr.trim()) JSON.parse(updateStr);
    } catch (e: any) {
      setResult({ error: "Invalid JSON format: " + e.message });
      setLoading(false);
      return;
    }

    if (operation === "deleteMany" && !confirm("WARNING: You are about to permanently delete records. Are you absolutely sure?")) {
      setLoading(false);
      return;
    }

    const res = await executeRawQuery(collection, operation, filterStr, updateStr);
    
    if (res.success) {
      setResult(res.data);
    } else {
      setResult({ error: res.message });
    }
    
    setLoading(false);
  };

  if (isNavigating) return <NavigationLoader message="Exiting Console..." />;

  return (
    <main className="min-h-screen flex flex-col w-full bg-slate-950 text-slate-300 font-mono relative overflow-x-hidden">
      
      {/* Header */}
      <header className="px-4 py-4 bg-slate-900 border-b border-slate-800 flex items-center gap-3 shrink-0 w-full min-w-0">
        <button onClick={() => handleBack()} className="p-2 bg-slate-800 hover:bg-slate-700 rounded-lg active:scale-90 transition-transform text-white shrink-0">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div className="flex items-center gap-2 min-w-0 flex-1">
          <Terminal className="w-5 h-5 text-emerald-400 shrink-0" />
          <h1 className="text-lg font-bold text-white tracking-tight truncate">Root DB Console</h1>
        </div>
      </header>

      {/* Warning Banner */}
      <div className="bg-rose-950/40 border-b border-rose-900/50 p-4 flex gap-3 text-rose-400 shrink-0 w-full">
        <AlertTriangle className="w-6 h-6 shrink-0 mt-0.5" />
        <p className="text-xs leading-relaxed max-w-full">
          <strong>DANGER ZONE:</strong> Direct database interaction. Malformed updates or deletes will cause permanent data loss.
        </p>
      </div>

      <div className="flex-1 flex flex-col lg:flex-row overflow-hidden w-full pb-10 lg:pb-0">
        
        {/* LEFT PANEL: Query Editor */}
        <div className="flex-1 flex flex-col border-r border-slate-800 overflow-y-auto w-full min-w-0">
          <div className="p-4 sm:p-6 space-y-6 w-full min-w-0">
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full min-w-0">
              <div className="space-y-2 w-full min-w-0">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block truncate">Collection</label>
                {/* Increased padding, fixed dropdown color cutting */}
                <select value={collection} onChange={e => setCollection(e.target.value)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 min-w-0 appearance-none">
                  <option value="Beneficiary">Beneficiary</option>
                  <option value="User">User (Admins)</option>
                  <option value="WebConfig">WebConfig</option>
                  <option value="AuditLog">AuditLog</option>
                </select>
              </div>
              <div className="space-y-2 w-full min-w-0">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block truncate">Operation</label>
                <select value={operation} onChange={e => setOperation(e.target.value as any)} className="w-full bg-slate-900 border border-slate-700 rounded-xl p-3.5 text-sm text-white outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 min-w-0 appearance-none">
                  <option value="find">find (Limit 50)</option>
                  <option value="findOne">findOne</option>
                  <option value="countDocuments">countDocuments</option>
                  <option value="updateMany">updateMany</option>
                  <option value="deleteMany">deleteMany</option>
                </select>
              </div>
            </div>

            <div className="space-y-2 w-full min-w-0">
              <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold flex flex-wrap justify-between gap-2 w-full min-w-0">
                <span className="shrink-0">Filter Query (JSON)</span>
                <span className="text-slate-600 truncate">db.{collection}.{operation}(...)</span>
              </label>
              {/* Increased height, fixed placeholder contrast */}
              <textarea 
                value={filterStr}
                onChange={e => setFilterStr(e.target.value)}
                className="w-full h-40 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-emerald-400 outline-none focus:border-emerald-500 focus:ring-1 focus:ring-emerald-500/50 font-mono resize-y min-w-0 placeholder:text-slate-700"
                placeholder='{&#10;  "status": "ACTIVE"&#10;}'
              />
            </div>

            {operation === "updateMany" && (
              <div className="space-y-2 animate-in fade-in slide-in-from-top-2 w-full min-w-0">
                <label className="text-[10px] uppercase tracking-widest text-slate-500 font-bold block truncate">Update Payload (JSON)</label>
                <textarea 
                  value={updateStr}
                  onChange={e => setUpdateStr(e.target.value)}
                  className="w-full h-32 bg-slate-900 border border-slate-700 rounded-xl p-4 text-sm text-blue-400 outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500/50 font-mono resize-y min-w-0 placeholder:text-slate-700"
                  placeholder='{&#10;  "$set": { "status": "ON_HOLD" }&#10;}'
                />
              </div>
            )}

            <div className="pt-2">
              <button 
                onClick={handleExecute}
                disabled={loading}
                className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold py-4 rounded-xl flex items-center justify-center gap-2 transition-colors active:scale-95 shadow-lg shadow-emerald-900/20"
              >
                {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5 fill-current" />}
                EXECUTE QUERY
              </button>
            </div>

          </div>
        </div>

        {/* RIGHT PANEL: Output Viewer */}
        <div className="flex-1 bg-slate-950 flex flex-col min-h-[400px] lg:min-h-0 w-full min-w-0 border-t lg:border-t-0 border-slate-800">
          <div className="bg-slate-900 px-4 py-3 border-b border-slate-800 flex justify-between items-center shrink-0 w-full min-w-0">
            <span className="text-[10px] uppercase tracking-widest text-slate-500 font-bold truncate">Output / Result JSON</span>
          </div>
          <div className="flex-1 p-4 sm:p-6 overflow-auto w-full min-w-0">
            {result ? (
              <pre className={`text-xs sm:text-sm font-medium whitespace-pre-wrap break-all min-w-0 max-w-full ${result.error ? "text-rose-400" : "text-slate-300"}`}>
                {JSON.stringify(result, null, 2)}
              </pre>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-700 text-sm font-medium">
                Awaiting execution...
              </div>
            )}
          </div>
        </div>

      </div>
    </main>
  );
}