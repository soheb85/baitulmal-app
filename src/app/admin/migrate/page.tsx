/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { executeDynamicMigration, getBackups, restoreBackup, deleteBackup } from "@/app/actions/migrationActions";
import { DATABASE_COLLECTIONS, COLLECTION_SCHEMAS } from "@/constants/databaseSchema";
import { 
  Database, Zap, AlertTriangle, CheckCircle2, ChevronRight, 
  Info, ShieldCheck, RotateCcw, History, HardDriveDownload, Trash2, ArrowLeft, Braces, ListOrdered, Eye, CalendarClock
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation"; 
import NavigationLoader from "@/components/ui/NavigationLoader"; 

export default function MigrationPage() {
  const [activeTab, setActiveTab] = useState<"migrate" | "restore">("migrate");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [backups, setBackups] = useState<string[]>([]);

  // 🌟 NEW: Track Date Input Mode
  const [dateMode, setDateMode] = useState<"null" | "current" | "custom">("current");

  const { isNavigating, handleBack } = useBackNavigation("/");

  const [form, setForm] = useState({
    collectionName: "beneficiaries",
    operationType: "add" as "add" | "remove",
    fieldName: "",
    defaultValue: "",
    valueType: "string" as "string" | "number" | "boolean" | "json" | "date",
    shouldBackup: true,
  });

  const refreshBackupsList = useCallback(async () => {
    try {
        const list = await getBackups(form.collectionName);
        setBackups(list || []);
    } catch (err) {
        console.error("Failed to fetch backups", err);
    }
  }, [form.collectionName]);

  useEffect(() => {
    let isMounted = true;
    if (activeTab === "restore") {
      const fetchData = async () => {
        const list = await getBackups(form.collectionName);
        if (isMounted) setBackups(list || []);
      };
      fetchData();
    }
    return () => { isMounted = false; };
  }, [activeTab, form.collectionName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = form.shouldBackup 
      ? `Run ${form.operationType} migration? A backup collection will be created first.` 
      : `⚠️ NO BACKUP: This will modify live data directly. Are you sure?`;
    
    if (!confirm(msg)) return;

    setLoading(true);
    setStatus(null);
    const res = await executeDynamicMigration(form as any);
    setStatus(res);
    
    if (res.success) {
      setForm(prev => ({ ...prev, fieldName: "", defaultValue: prev.valueType === 'date' ? '__CURRENT__' : '' }));
      if (form.valueType === 'date') setDateMode('current');
    }
    setLoading(false);
  };

  const handleRestore = async (backupName: string) => {
    if (!confirm(`🚨 CRITICAL: This will DELETE current ${form.collectionName} data and replace it with ${backupName}. Proceed?`)) return;
    setLoading(true);
    setStatus(null);
    const res = await restoreBackup(form.collectionName, backupName);
    setStatus(res);
    if (res.success) refreshBackupsList();
    setLoading(false);
  };

  const handleDelete = async (backupName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the backup: ${backupName}?`)) return;
    setLoading(true);
    setStatus(null);
    const res = await deleteBackup(backupName);
    setStatus(res);
    if (res.success) refreshBackupsList();
    setLoading(false);
  };

  if (isNavigating) return <NavigationLoader message="Returning to Dashboard..." />;

  const currentSchema = (COLLECTION_SCHEMAS as any)[form.collectionName];
  const arrayObjectKeys = currentSchema?.arrayOfObjects ? Object.keys(currentSchema.arrayOfObjects) : [];
  const standardObjectKeys = currentSchema?.objects ? Object.keys(currentSchema.objects) : [];

  // --- 🌟 LIVE PREVIEW RENDERER 🌟 ---
  const renderPreviewBox = () => {
    if (!form.fieldName.trim()) return null;

    const parts = form.fieldName.split('.');
    const root = parts[0];
    const sub = parts.slice(1).join('.');
    const isArray = arrayObjectKeys.includes(root);
    
    let valStr = form.defaultValue;
    if (form.valueType === "string") valStr = `"${form.defaultValue}"`;
    if (form.valueType === "number") valStr = form.defaultValue || "0";
    if (form.valueType === "boolean") valStr = form.defaultValue || "false";
    if (form.valueType === "json") valStr = form.defaultValue || "{}";
    
    // 🌟 FORMAT PREVIEW FOR ADVANCED DATE OPTIONS 🌟
    if (form.valueType === "date") {
      if (form.defaultValue === "__NULL__") {
        valStr = "null";
      } else if (form.defaultValue === "__CURRENT__") {
        valStr = `ISODate("${new Date().toISOString()}")`;
      } else {
        const datePreview = form.defaultValue ? new Date(form.defaultValue) : new Date();
        valStr = `ISODate("${datePreview.toISOString()}")`;
      }
    }

    const OpHighlight = ({ children }: {children: React.ReactNode}) => (
      form.operationType === 'add' 
        ? <span className="text-emerald-400 bg-emerald-400/10 px-1 rounded font-bold">{children}</span>
        : <span className="text-rose-400 bg-rose-400/10 px-1 rounded line-through opacity-80">{children}</span>
    );

    return (
      <div className="bg-[#0a0a0a] text-gray-300 font-mono text-xs p-5 rounded-2xl overflow-x-auto mt-2 border border-gray-800 shadow-inner w-full">
         <div className="flex items-center gap-2 mb-3 pb-3 border-b border-gray-800 text-gray-500 font-sans tracking-widest uppercase text-[9px] font-black">
           <Eye className="w-3 h-3 text-blue-500" /> Database Document Preview
         </div>
         <pre className="leading-relaxed">
           {"{\n"}
           <span className="text-blue-300">  &quot;_id&quot;</span>: <span className="text-orange-300">&quot;65a2b3c...&quot;</span>,{"\n"}
           <span className="text-blue-300">  &quot;existingField&quot;</span>: <span className="text-orange-300">&quot;...&quot;</span>,{"\n"}
           
           {parts.length === 1 && (
             <>
               {"  "}<OpHighlight>&quot;{form.fieldName}&quot;</OpHighlight>
               {form.operationType === 'add' && <>: <OpHighlight>{valStr}</OpHighlight></>}
               {"\n"}
             </>
           )}

           {parts.length > 1 && isArray && (
             <>
               {"  "}<span className="text-blue-300">&quot;{root}&quot;</span>: {"[ \n"}
               {"    {\n"}
               {"      "}<span className="text-blue-300">&quot;existingNested&quot;</span>: <span className="text-orange-300">&quot;...&quot;</span>,{"\n"}
               {"      "}<OpHighlight>&quot;{sub}&quot;</OpHighlight>
               {form.operationType === 'add' && <>: <OpHighlight>{valStr}</OpHighlight></>}
               {"\n"}
               {"    }\n"}
               {"  ]\n"}
             </>
           )}

           {parts.length > 1 && !isArray && (
             <>
               {"  "}<span className="text-blue-300">&quot;{root}&quot;</span>: {"{\n"}
               {"    "}<span className="text-blue-300">&quot;existingNested&quot;</span>: <span className="text-orange-300">&quot;...&quot;</span>,{"\n"}
               {"    "}<OpHighlight>&quot;{sub}&quot;</OpHighlight>
               {form.operationType === 'add' && <>: <OpHighlight>{valStr}</OpHighlight></>}
               {"\n"}
               {"  }\n"}
             </>
           )}

           {"}"}
         </pre>
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit pb-20">
      <div className="max-w-2xl mx-auto">
        
        {/* Header */}
        <div className="flex items-center gap-4 mb-8">
          <button onClick={() => handleBack()} className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-90 transition-transform shrink-0">
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl shrink-0">
            <Database className="w-8 h-8 text-orange-600" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Database Sync</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Smart Schema Operations</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex bg-gray-200 dark:bg-gray-900 p-1 rounded-2xl mb-6">
          <button 
            type="button"
            onClick={() => { setActiveTab("migrate"); setStatus(null); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'migrate' ? 'bg-white dark:bg-gray-800 text-orange-600 shadow-sm' : 'text-gray-500'}`}
          >
            New Migration
          </button>
          <button 
            type="button"
            onClick={() => { setActiveTab("restore"); setStatus(null); }}
            className={`flex-1 py-3 rounded-xl text-xs font-black uppercase tracking-widest transition-all ${activeTab === 'restore' ? 'bg-white dark:bg-gray-800 text-blue-600 shadow-sm' : 'text-gray-500'}`}
          >
            Restore Backup
          </button>
        </div>

        {/* Dynamic Collection Selector */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 mb-6 flex items-center justify-between shadow-sm">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Target Collection:</span>
          <select 
            value={form.collectionName} 
            onChange={(e) => setForm({ ...form, collectionName: e.target.value })}
            className="p-2 rounded-xl bg-gray-50 dark:bg-gray-800 border-none font-bold text-sm outline-none text-orange-600"
          >
            {DATABASE_COLLECTIONS.map(col => (
              <option key={col} value={col}>{col}</option>
            ))}
          </select>
        </div>

        {activeTab === "migrate" ? (
          <form onSubmit={handleSubmit} className="space-y-6 bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 animate-in fade-in slide-in-from-left-4">
            
            <div className={`p-4 rounded-2xl border flex items-center justify-between transition-all ${form.shouldBackup ? "bg-green-50 border-green-100 dark:bg-green-900/10" : "bg-red-50 border-red-100 dark:bg-red-900/10"}`}>
              <div className="flex items-center gap-3">
                <ShieldCheck className={`w-5 h-5 ${form.shouldBackup ? "text-green-600" : "text-red-600"}`} />
                <span className="text-xs font-black uppercase tracking-wider">Create Safety Backup First</span>
              </div>
              <input 
                type="checkbox" 
                checked={form.shouldBackup} 
                onChange={e => setForm({...form, shouldBackup: e.target.checked})} 
                className="w-5 h-5 accent-green-600 cursor-pointer" 
              />
            </div>

            {/* Action Selector */}
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 mb-2 block">Action to Perform</label>
              <div className="grid grid-cols-2 gap-2 bg-gray-50 dark:bg-gray-800 p-1 rounded-2xl">
                <button
                  type="button"
                  onClick={() => { setForm({ ...form, operationType: "add" }); setStatus(null); }}
                  className={`py-3 rounded-xl text-xs font-bold transition-all ${form.operationType === "add" ? "bg-white dark:bg-gray-900 text-blue-600 shadow-sm" : "text-gray-500"}`}
                >
                  ➕ Add New Field
                </button>
                <button
                  type="button"
                  onClick={() => { setForm({ ...form, operationType: "remove" }); setStatus(null); }}
                  className={`py-3 rounded-xl text-xs font-bold transition-all ${form.operationType === "remove" ? "bg-white dark:bg-gray-900 text-red-600 shadow-sm" : "text-gray-500"}`}
                >
                  🗑️ Remove Field
                </button>
              </div>
            </div>

            {/* SMART HINT BOX */}
            <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <h4 className="text-[10px] font-black text-blue-800 dark:text-blue-400 uppercase tracking-widest mb-2 flex items-center gap-1.5"><Info className="w-3 h-3"/> Smart Path Routing is Active</h4>
              <p className="text-xs text-blue-700 dark:text-blue-300 font-medium leading-relaxed mb-3">
                Type the field name normally. The engine will read the schema and auto-apply array operators if needed.
              </p>
              
              <div className="flex flex-col gap-1 text-[10px] font-bold">
                {arrayObjectKeys.length > 0 && (
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <ListOrdered className="w-3 h-3 text-orange-500"/> Known Arrays: <span className="text-blue-600">{arrayObjectKeys.join(", ")}</span> (e.g. <i>pastCycles.newField</i>)
                  </p>
                )}
                {standardObjectKeys.length > 0 && (
                  <p className="text-gray-600 dark:text-gray-400 flex items-center gap-1.5">
                    <Braces className="w-3 h-3 text-purple-500"/> Known Objects: <span className="text-blue-600">{standardObjectKeys.join(", ")}</span> (e.g. <i>todayStatus.newField</i>)
                  </p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={form.operationType === "remove" ? "col-span-2" : ""}>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 mb-2 block">Field Path</label>
                <input
                  required
                  value={form.fieldName}
                  placeholder="e.g. approvedAt"
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold dark:text-white"
                  onChange={(e) => setForm({ ...form, fieldName: e.target.value })}
                />
              </div>
              
              {form.operationType === "add" && (
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 mb-2 block">Data Type</label>
                  <select
                    value={form.valueType}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white"
                    onChange={(e) => {
                      const newType = e.target.value as any;
                      let defaultVal = form.defaultValue;
                      
                      // Auto-switch defaults when changing type
                      if (newType === "date") {
                        setDateMode("current");
                        defaultVal = "__CURRENT__";
                      } else if (newType === "boolean") {
                        defaultVal = "false";
                      } else if (newType === "json") {
                        defaultVal = "{}";
                      } else if (newType === "string" || newType === "number") {
                        defaultVal = "";
                      }

                      setForm({ ...form, valueType: newType, defaultValue: defaultVal });
                    }}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="json">JSON (Object/Array)</option>
                    <option value="date">Date / Timestamp</option>
                  </select>
                </div>
              )}
            </div>

            {/* 🌟 CONDITIONAL DEFAULT VALUE INPUTS 🌟 */}
            {form.operationType === "add" && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 mb-2 flex items-center gap-1">
                  Default Value
                </label>

                {form.valueType === "date" ? (
                  <div className="bg-gray-50 dark:bg-gray-800 p-2 rounded-2xl border border-gray-200 dark:border-gray-700">
                    <div className="flex gap-2 mb-2">
                      <button 
                        type="button"
                        onClick={() => { setDateMode('null'); setForm({...form, defaultValue: '__NULL__'}); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${dateMode === 'null' ? 'bg-red-100 text-red-700 dark:bg-red-900/30' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      >Empty (Null)</button>
                      <button 
                        type="button"
                        onClick={() => { setDateMode('current'); setForm({...form, defaultValue: '__CURRENT__'}); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all flex items-center justify-center gap-1 ${dateMode === 'current' ? 'bg-blue-100 text-blue-700 dark:bg-blue-900/30' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      >
                        <CalendarClock className="w-3 h-3"/> Current Time
                      </button>
                      <button 
                        type="button"
                        onClick={() => { setDateMode('custom'); setForm({...form, defaultValue: ''}); }}
                        className={`flex-1 py-2 text-xs font-bold rounded-xl transition-all ${dateMode === 'custom' ? 'bg-orange-100 text-orange-700 dark:bg-orange-900/30' : 'text-gray-500 hover:bg-gray-200 dark:hover:bg-gray-700'}`}
                      >Custom Date</button>
                    </div>
                    {dateMode === "custom" && (
                      <input
                        type="datetime-local"
                        value={form.defaultValue}
                        className="w-full p-3 bg-white dark:bg-gray-900 rounded-xl outline-none font-bold dark:text-white border-none"
                        onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                      />
                    )}
                  </div>
                ) : form.valueType === "boolean" ? (
                  <select
                    value={form.defaultValue}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold dark:text-white outline-none"
                    onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                ) : (
                  <input
                    value={form.defaultValue}
                    placeholder={form.valueType === "number" ? "0" : form.valueType === "json" ? '{"key": "value"}' : "Enter text"}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white"
                    onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                  />
                )}
              </div>
            )}

            {renderPreviewBox()}

            <button
              disabled={loading || !form.fieldName}
              className={`w-full py-5 text-white font-black rounded-3xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 mt-4 ${
                form.operationType === "remove" 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none"
              } disabled:bg-gray-200 disabled:shadow-none`}
            >
              {loading ? <Zap className="animate-pulse w-6 h-6" /> : (
                <>
                  {form.operationType === "remove" ? <Trash2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />} 
                  {form.operationType === "remove" ? "PERMANENTLY REMOVE FIELD" : "APPLY TO ALL DOCUMENTS"}
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            {backups.length === 0 ? (
              <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                <History className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">No backups found for {form.collectionName}</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {backups.map((name) => (
                  <div key={name} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{name}</p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <button onClick={() => handleDelete(name)} disabled={loading} className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white">
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button onClick={() => handleRestore(name)} disabled={loading} className="px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-700">
                        <RotateCcw className="w-3 h-3" /> RESTORE
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {status && (
          <div className={`mt-6 p-4 rounded-2xl flex items-center gap-3 animate-in slide-in-from-bottom-2 ${status.success ? "bg-green-50 text-green-700 border border-green-100" : "bg-red-50 text-red-700 border border-red-100"}`}>
            {status.success ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertTriangle className="w-5 h-5 shrink-0" />}
            <span className="text-sm font-bold leading-tight">{status.message}</span>
          </div>
        )}
      </div>
    </div>
  );
}