/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { fetchSuperData, executeSuperOperation, SuperFilter } from "@/app/actions/admin/superActions";
import { DATABASE_COLLECTIONS, getFlatPathsForCollection } from "@/constants/databaseSchema";
import { 
  ArrowLeft, Filter, Plus, Trash2, Search, Loader2, Database, 
  CheckSquare, Square, Zap, ShieldAlert, BookOpen, AlertOctagon, 
  XCircle, CheckCircle2, ListFilter, Play, Eye, ArrowRight, Copy, RotateCcw
} from "lucide-react";

type TabState = "QUERY" | "SELECT" | "EXECUTE";

// --- HELPER TO GET NESTED VALUES LIKE "todayStatus.status" ---
const getNestedValue = (obj: any, path: string) => {
  try {
    return path.split('.').reduce((acc, part) => acc && acc[part], obj);
  } catch (e) {
    return undefined;
  }
};

export default function SuperCenterPage() {
  const { handleBack } = useBackNavigation("/admin/advanced-tools");
  
  const [activeTab, setActiveTab] = useState<TabState>("QUERY");
  const [collection, setCollection] = useState<string>("beneficiaries");

  // Dynamically load fields based on selected collection
  const availableFields = useMemo(() => getFlatPathsForCollection(collection as any) || [], [collection]);

  // Query State
  const [filters, setFilters] = useState<SuperFilter[]>([{ field: "", operator: "equals", value: "" }]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "success"|"error"|"warning", text: string, details?: string } | null>(null);

  // Results State
  const [results, setResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // Action State
  const [actionType, setActionType] = useState<"OVERRIDE"|"DELETE_DOCS"|"PULL_ARRAY">("OVERRIDE");
  const [overrideData, setOverrideData] = useState({ field: "", value: "" });
  const [pullData, setPullData] = useState({ arrayField: "", matchKey: "", matchValue: "" });
  const [actionLoading, setActionLoading] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [showSchema, setShowSchema] = useState(false);

  // Copy State
  const [copiedId, setCopiedId] = useState<string | null>(null);

  // --- HANDLERS ---
  const handleSearch = async () => {
    setLoading(true);
    setMessage(null);
    setSelectedIds([]);
    const res = await fetchSuperData(collection, filters);
    
    if (res.success) {
      setResults(res.data);
      if (res.count === 0) {
        setMessage({ type: "warning", text: res.message || "No records found.", details: res.queryDump });
      } else {
        setMessage({ type: "success", text: `Found ${res.count} documents.` });
        setActiveTab("SELECT"); // Auto-switch to results
      }
    } else {
      setResults([]);
      setMessage({ type: "error", text: res.message || "An error occurred.", details: res.queryDump });
    }
    setLoading(false);
  };

  const handleExecute = async () => {
    setActionLoading(true);
    let payload = {};
    if (actionType === "OVERRIDE") payload = overrideData;
    if (actionType === "PULL_ARRAY") payload = pullData;

    const res = await executeSuperOperation(collection, actionType, selectedIds, payload);
    
    if (res.success) {
      setMessage({ type: "success", text: res.message || "Operation successful." });
      setShowConfirmModal(false);
      handleClearAction(); // Reset fields after success
      handleSearch(); // Refresh list
    } else {
      alert("Error: " + (res.message || "Unknown error occurred."));
    }
    setActionLoading(false);
  };

  // --- NEW: CLEAR QUERY ---
  const handleClearQuery = () => {
    setFilters([{ field: "", operator: "equals", value: "" }]);
    setResults([]);
    setSelectedIds([]);
    setMessage(null);
  };

  // --- CLEAR ACTION FIELDS ---
  const handleClearAction = () => {
    setOverrideData({ field: "", value: "" });
    setPullData({ arrayField: "", matchKey: "", matchValue: "" });
  };

  const handleCopy = (val: string, id: string) => {
    if (val === "Empty / Null" || val === "undefined") return;
    navigator.clipboard.writeText(val);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative font-outfit">
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="flex-1">
            <h1 className="text-lg font-black text-violet-600 flex items-center gap-2">
              <Zap className="w-4 h-4" /> God Mode
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Multi-Condition Studio</p>
          </div>
          <button onClick={() => setShowSchema(true)} className="p-2 bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 rounded-xl active:scale-90 transition" title="Schema Guide">
            <BookOpen className="w-5 h-5" />
          </button>
        </div>

        {/* Database Selector */}
        <div className="mb-6">
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-500 ml-1">Target Collection</label>
          <select value={collection} onChange={e => {setCollection(e.target.value); setResults([]);}} className="w-full mt-1 p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-900 dark:text-white font-bold outline-none focus:border-violet-500 shadow-sm">
            {DATABASE_COLLECTIONS.map(col => <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" key={col} value={col}>{col}</option>)}
          </select>
        </div>

        {/* Messages */}
        {message && (
          <div className={`p-4 rounded-2xl border flex flex-col gap-2 mb-6 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-200 dark:border-green-900/50 text-green-800 dark:text-green-400' : message.type === 'warning' ? 'bg-amber-50 dark:bg-amber-900/20 border-amber-200 dark:border-amber-900/50 text-amber-800 dark:text-amber-400' : 'bg-red-50 dark:bg-red-900/20 border-red-200 dark:border-red-900/50 text-red-800 dark:text-red-400'}`}>
            <div className="flex items-center gap-2">
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertOctagon className="w-5 h-5 shrink-0" />}
              <span className="text-sm font-bold">{message.text}</span>
            </div>
            {message.details && (
              <div className="bg-white/50 dark:bg-black/20 p-2 rounded-lg text-[10px] font-mono break-all border border-black/10 dark:border-white/10">
                DB Query: {message.details}
              </div>
            )}
          </div>
        )}

        {/* TABS */}
        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl mb-6 shadow-inner">
          <button onClick={() => setActiveTab("QUERY")} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "QUERY" ? "bg-white dark:bg-gray-900 text-violet-600 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            <Filter className="w-4 h-4" /> 1. Query
          </button>
          <button onClick={() => setActiveTab("SELECT")} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "SELECT" ? "bg-white dark:bg-gray-900 text-violet-600 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            <ListFilter className="w-4 h-4" /> 2. Select
          </button>
          <button onClick={() => setActiveTab("EXECUTE")} className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "EXECUTE" ? "bg-rose-600 text-white shadow-sm" : "text-gray-500 dark:text-gray-400"}`}>
            <Play className="w-4 h-4" /> 3. Action
          </button>
        </div>

        {/* --- TAB 1: QUERY BUILDER --- */}
        {activeTab === "QUERY" && (
          <div className="animate-in slide-in-from-left-4 space-y-3">
            {filters.map((f, i) => (
              <div key={i} className="flex flex-col gap-2 p-4 bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm relative">
                
                {/* ALWAYS VISIBLE X BUTTON: Removes if > 1, resets if only 1 */}
                <button 
                  onClick={() => filters.length === 1 ? setFilters([{ field: "", operator: "equals", value: "" }]) : setFilters(filters.filter((_, idx) => idx !== i))} 
                  className="absolute top-3 right-3 text-red-400 hover:text-red-600 transition-colors"
                >
                  <XCircle className="w-5 h-5"/>
                </button>
                
                <select value={f.field} onChange={e => {const n=[...filters]; n[i].field=e.target.value; setFilters(n);}} className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold border-none outline-none">
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="">-- Select Field --</option>
                  {availableFields.map(field => <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" key={field} value={field}>{field}</option>)}
                </select>
                
                <select value={f.operator} onChange={e => {const n=[...filters]; n[i].operator=e.target.value; setFilters(n);}} className="w-full p-2.5 rounded-xl bg-violet-50 dark:bg-violet-900/30 text-violet-700 dark:text-violet-300 text-sm font-bold border-none outline-none">
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="equals">Equals (==)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="not_equals">Not Equals (!=)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="like">Like (Contains Text)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="not_like">Not Like</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="greater_than">Greater Than (&gt;)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="less_than">Less Than (&lt;)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="greater_than_equal">Greater/Equal (&gt;=)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="less_than_equal">Less/Equal (&lt;=)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="in">In List (A, B, C)</option>
                  <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="between">Between (Min, Max)</option>
                </select>
                
                <input 
                  type="text" value={f.value} onChange={e => {const n=[...filters]; n[i].value=e.target.value; setFilters(n);}} 
                  placeholder="Value (Dates: DD/MM/YYYY)" 
                  className="w-full p-2.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 text-sm font-bold border-none outline-none"
                />
              </div>
            ))}
            
            {/* BUTTON ROW FOR QUERIES */}
            <div className="flex gap-2 pt-2">
              <button onClick={handleClearQuery} className="flex-[1] py-4 border-2 border-dashed border-red-200 dark:border-red-900/40 text-red-500 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-red-50 dark:hover:bg-red-900/20 transition-colors">
                <RotateCcw className="w-4 h-4" /> CLEAR
              </button>
              <button onClick={() => setFilters([...filters, { field: "", operator: "equals", value: "" }])} className="flex-[2] py-4 border-2 border-dashed border-gray-200 dark:border-gray-800 text-gray-500 dark:text-gray-400 font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors">
                <Plus className="w-4 h-4" /> ADD CONDITION
              </button>
            </div>
            
            <button onClick={handleSearch} disabled={loading} className="w-full py-4 mt-2 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl flex items-center justify-center gap-2 shadow-lg shadow-violet-200 dark:shadow-none transition-transform active:scale-95">
              {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Search className="w-5 h-5" /> RUN QUERY</>}
            </button>
          </div>
        )}

        {/* --- TAB 2: SELECT RESULTS --- */}
        {activeTab === "SELECT" && (
          <div className="animate-in fade-in space-y-4">
            <div className="flex items-center justify-between bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
              <button onClick={() => setSelectedIds(selectedIds.length === results.length ? [] : results.map(r => r._id))} className="flex items-center gap-2 text-sm font-black text-gray-700 dark:text-gray-300">
                {selectedIds.length === results.length && results.length > 0 ? <CheckSquare className="w-5 h-5 text-violet-600" /> : <Square className="w-5 h-5 text-gray-500" />} Select All
              </button>
              <span className="text-xs font-black uppercase tracking-widest text-violet-600 dark:text-violet-400">{selectedIds.length} / {results.length} Selected</span>
            </div>

            <div className="space-y-2">
              {results.length === 0 && <p className="text-center text-gray-400 py-10 font-bold text-sm">No results to display.</p>}
              {results.map((doc) => (
                <div key={doc._id} onClick={() => setSelectedIds(prev => prev.includes(doc._id) ? prev.filter(i => i !== doc._id) : [...prev, doc._id])} className={`w-full text-left p-4 rounded-2xl border flex items-start gap-3 cursor-pointer transition-all ${selectedIds.includes(doc._id) ? "bg-violet-50 dark:bg-violet-900/20 border-violet-300 dark:border-violet-700" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800"}`}>
                  {selectedIds.includes(doc._id) ? <CheckSquare className="w-5 h-5 text-violet-600 shrink-0 mt-0.5" /> : <Square className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0 mt-0.5" />}
                  <div className="min-w-0 flex-1">
                    <p className="font-black text-gray-900 dark:text-white text-sm truncate">{doc.fullName || doc.name || `Document ${doc._id}`}</p>
                    <p className="text-[10px] text-gray-500 font-bold mt-1 break-all">ID: {doc._id}</p>
                  </div>
                </div>
              ))}
            </div>
            
            {selectedIds.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-40 flex justify-center">
                <button onClick={() => setActiveTab("EXECUTE")} className="w-full max-w-md py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl shadow-lg transition-transform active:scale-95">
                  PROCEED TO ACTIONS ({selectedIds.length})
                </button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 3: EXECUTE --- */}
        {activeTab === "EXECUTE" && (
          <div className="animate-in slide-in-from-right-4 space-y-6">
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm p-4">
               
               <div className="flex justify-between items-center mb-4">
                 <h3 className="font-black text-gray-900 dark:text-white">Select Operation</h3>
                 <button onClick={handleClearAction} className="flex items-center gap-1 text-[10px] font-black uppercase tracking-widest text-gray-400 hover:text-rose-500 transition-colors">
                   <RotateCcw className="w-3 h-3" /> Clear Form
                 </button>
               </div>

               <div className="flex flex-col gap-2 mb-6">
                 <button onClick={() => setActionType("OVERRIDE")} className={`p-3 text-sm font-bold rounded-xl border-2 text-left transition-colors ${actionType === "OVERRIDE" ? "border-violet-500 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400" : "border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Field Override (Update Value)</button>
                 <button onClick={() => setActionType("PULL_ARRAY")} className={`p-3 text-sm font-bold rounded-xl border-2 text-left transition-colors ${actionType === "PULL_ARRAY" ? "border-amber-500 bg-amber-50 dark:bg-amber-900/20 text-amber-700 dark:text-amber-400" : "border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Array Surgery (Delete Item)</button>
                 <button onClick={() => setActionType("DELETE_DOCS")} className={`p-3 text-sm font-bold rounded-xl border-2 text-left transition-colors ${actionType === "DELETE_DOCS" ? "border-rose-500 bg-rose-50 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400" : "border-gray-100 dark:border-gray-800 text-gray-700 dark:text-gray-400 hover:bg-gray-50 dark:hover:bg-gray-800"}`}>Nuke Documents (Permanent Delete)</button>
               </div>

               {/* FIELD OVERRIDE + PREVIEW */}
               {actionType === "OVERRIDE" && (
                 <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                   <select value={overrideData.field} onChange={e => setOverrideData({...overrideData, field: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none font-bold text-sm">
                     <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="">Select Field to Override...</option>
                     {availableFields.map(f => <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" key={f} value={f}>{f}</option>)}
                   </select>
                   <input type="text" value={overrideData.value} onChange={e => setOverrideData({...overrideData, value: e.target.value})} placeholder="New Value (true/false/number/text)" className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none font-bold text-sm" />
                   
                   {/* LIVE PREVIEW BOX */}
                   {overrideData.field && selectedIds.length > 0 && (
                      <div className="mt-4 p-3 bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-700 max-h-56 overflow-y-auto shadow-inner">
                        <p className="text-[9px] font-black uppercase text-gray-500 tracking-widest mb-3 flex items-center gap-1.5">
                          <Eye className="w-3 h-3 text-violet-500" /> Value Preview
                        </p>
                        <div className="space-y-2">
                          {results.filter(r => selectedIds.includes(r._id)).map(r => {
                            const currentVal = getNestedValue(r, overrideData.field);
                            let displayVal = "Empty / Null";
                            if (currentVal !== undefined && currentVal !== null && currentVal !== "") {
                              displayVal = typeof currentVal === 'object' ? JSON.stringify(currentVal) : String(currentVal);
                            }
                            return (
                              <div key={r._id} className="text-xs bg-gray-50 dark:bg-gray-800/80 p-2.5 rounded-lg border border-gray-100 dark:border-gray-700 shadow-sm flex flex-col gap-1">
                                <span className="font-black text-gray-900 dark:text-white truncate">{r.fullName || r.name || `ID: ${r._id}`}</span>
                                <div className="flex items-center justify-between gap-2 mt-1">
                                  
                                  {/* CURRENT VALUE WITH COPY BUTTON */}
                                  <div className="flex items-center flex-1 min-w-0 bg-red-50 dark:bg-red-900/30 border border-red-100 dark:border-red-900/50 rounded pr-1">
                                    <span className="font-mono text-[10px] text-red-600 dark:text-red-400 px-1.5 py-0.5 truncate flex-1 text-center">
                                      {displayVal}
                                    </span>
                                    <button 
                                      onClick={() => handleCopy(displayVal, r._id)}
                                      className="p-1 hover:bg-red-100 dark:hover:bg-red-800/50 rounded transition-colors text-red-400 dark:text-red-500"
                                      title="Copy to clipboard"
                                    >
                                      {copiedId === r._id ? <CheckCircle2 className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                                    </button>
                                  </div>

                                  <ArrowRight className="w-3 h-3 text-gray-400 shrink-0" />
                                  
                                  {/* NEW VALUE */}
                                  <span className="font-mono text-[10px] bg-green-50 text-green-600 dark:bg-green-900/30 dark:text-green-400 px-1.5 py-0.5 rounded truncate flex-1 text-center border border-green-100 dark:border-green-900/50">
                                    {overrideData.value || "???"}
                                  </span>
                                </div>
                              </div>
                            )
                          })}
                        </div>
                      </div>
                   )}
                 </div>
               )}

               {actionType === "PULL_ARRAY" && (
                 <div className="space-y-3 p-4 bg-gray-50 dark:bg-gray-800 rounded-xl border border-gray-100 dark:border-gray-700">
                   <select value={pullData.arrayField} onChange={e => setPullData({...pullData, arrayField: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white outline-none font-bold text-sm">
                     <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" value="">Target Array Field...</option>
                     {availableFields.filter(f => !f.includes(".")).map(f => <option className="bg-white dark:bg-gray-900 text-gray-900 dark:text-white" key={f} value={f}>{f}</option>)}
                   </select>
                   <input type="text" value={pullData.matchKey} onChange={e => setPullData({...pullData, matchKey: e.target.value})} placeholder="Match Key (e.g. year, _id) - Blank if flat array" className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none font-bold text-sm" />
                   <input type="text" value={pullData.matchValue} onChange={e => setPullData({...pullData, matchValue: e.target.value})} placeholder="Match Value (e.g. 2025)" className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-gray-900 dark:text-white placeholder:text-gray-400 dark:placeholder:text-gray-500 outline-none font-bold text-sm" />
                 </div>
               )}
            </div>

            <button disabled={selectedIds.length === 0} onClick={() => setShowConfirmModal(true)} className={`w-full py-4 font-black rounded-2xl text-white shadow-lg active:scale-95 transition-transform flex justify-center items-center gap-2 ${actionType === "DELETE_DOCS" ? "bg-red-600 shadow-red-200 dark:shadow-none" : "bg-rose-600 shadow-rose-200 dark:shadow-none"}`}>
              <AlertOctagon className="w-5 h-5" /> APPLY TO {selectedIds.length} RECORDS
            </button>
          </div>
        )}
      </div>

      {/* --- MASTER CONFIRM MODAL --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-rose-500 animate-in zoom-in-95">
            <AlertOctagon className="w-16 h-16 text-rose-500 mx-auto mb-3" />
            <h2 className="font-black text-xl mb-1 text-gray-900 dark:text-white">Final Warning</h2>
            <p className="text-xs text-gray-500 font-bold mb-6">Executing {actionType} on {selectedIds.length} records. This bypasses validations and cannot be undone.</p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmModal(false)} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500 active:scale-95 transition-transform">Cancel</button>
              <button onClick={handleExecute} disabled={actionLoading} className="flex-1 py-3.5 bg-rose-600 text-white font-black text-sm rounded-xl flex justify-center items-center active:scale-95 transition-transform">
                {actionLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SCHEMA GUIDE MODAL */}
      {showSchema && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2rem] p-6 shadow-2xl max-h-[80vh] flex flex-col relative">
            <button onClick={() => setShowSchema(false)} className="absolute top-4 right-4 p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform"><XCircle className="w-5 h-5 text-gray-500"/></button>
            <h2 className="text-xl font-black mb-1 flex items-center gap-2 text-blue-600"><BookOpen className="w-5 h-5"/> {collection} Schema</h2>
            <p className="text-xs font-bold text-gray-500 mb-4">Values mapped from static constants.</p>
            
            <div className="flex-1 overflow-y-auto space-y-4 pr-2 text-sm font-medium">
              <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-200 dark:border-gray-700 text-gray-700 dark:text-gray-300">
                <p className="font-black text-xs text-gray-400 uppercase mb-1">Status Enums</p>
                <p><strong>status:</strong> ACTIVE, BLACKLISTED, ON_HOLD</p>
                <p><strong>gender:</strong> MALE, FEMALE</p>
                <p><strong>housingType:</strong> OWN, RENT</p>
              </div>
              <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-xl border border-blue-200 dark:border-blue-900/50 text-blue-800 dark:text-blue-300">
                <p className="font-black text-xs text-blue-500 uppercase mb-1">Dates & Regex</p>
                <p>Enter dates exactly as <strong>DD/MM/YYYY</strong>. Use the <strong>Like</strong> operator for case-insensitive partial searches.</p>
              </div>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}