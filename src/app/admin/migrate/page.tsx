/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { executeDynamicMigration, getBackups, restoreBackup, deleteBackup } from "@/app/actions/migrationActions";
import { 
  Database, Zap, AlertTriangle, CheckCircle2, ChevronRight, 
  Info, ShieldCheck, RotateCcw, History, HardDriveDownload, Trash2, ArrowLeft 
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation"; // Import Back Hook
import NavigationLoader from "@/components/ui/NavigationLoader"; // Import Loader

export default function MigrationPage() {
  const [activeTab, setActiveTab] = useState<"migrate" | "restore">("migrate");
  const [loading, setLoading] = useState(false);
  const [status, setStatus] = useState<{ success: boolean; message: string } | null>(null);
  const [backups, setBackups] = useState<string[]>([]);

  // Initialize Back Navigation
  const { isNavigating, handleBack } = useBackNavigation("/");

  const [form, setForm] = useState({
    modelName: "Beneficiary",
    operationType: "add" as "add" | "remove",
    fieldName: "",
    defaultValue: "",
    valueType: "string" as "string" | "number" | "boolean" | "json",
    isNested: false,
    shouldBackup: true,
  });

  // Fetching logic mapped to useCallback
  const refreshBackupsList = useCallback(async () => {
    try {
        const list = await getBackups(form.modelName);
        setBackups(list || []);
    } catch (err) {
        console.error("Failed to fetch backups", err);
    }
  }, [form.modelName]);

  // Effect for fetching data strictly when tab changes
  useEffect(() => {
    let isMounted = true;

    if (activeTab === "restore") {
      const fetchData = async () => {
        const list = await getBackups(form.modelName);
        if (isMounted) {
          setBackups(list || []);
        }
      };
      fetchData();
    }

    return () => { isMounted = false; };
  }, [activeTab, form.modelName]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const msg = form.shouldBackup 
      ? `Run ${form.operationType} migration? A backup collection will be created first.` 
      : `⚠️ NO BACKUP: This will modify live data directly. Are you sure?`;
    
    if (!confirm(msg)) return;

    setLoading(true);
    setStatus(null);
    const res = await executeDynamicMigration(form);
    setStatus(res);
    
    // Clear fields on success
    if (res.success) {
      setForm(prev => ({
        ...prev,
        fieldName: "",
        defaultValue: "",
        isNested: false,
      }));
    }
    
    setLoading(false);
  };

  const handleRestore = async (backupName: string) => {
    if (!confirm(`🚨 CRITICAL: This will DELETE current ${form.modelName} data and replace it with ${backupName}. Proceed?`)) return;
    
    setLoading(true);
    setStatus(null);
    const res = await restoreBackup(form.modelName, backupName);
    setStatus(res);
    
    if (res.success) {
        refreshBackupsList();
    }
    setLoading(false);
  };

  const handleDelete = async (backupName: string) => {
    if (!confirm(`Are you sure you want to permanently delete the backup: ${backupName}?`)) return;
    
    setLoading(true);
    setStatus(null);
    const res = await deleteBackup(backupName);
    setStatus(res);
    
    if (res.success) {
        refreshBackupsList();
    }
    setLoading(false);
  };

  // Show Full Screen Loader if navigating away
  if (isNavigating) return <NavigationLoader message="Returning to Dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit pb-20">
      <div className="max-w-2xl mx-auto">
        
        {/* Header with Back Button */}
        <div className="flex items-center gap-4 mb-8">
          <button 
            onClick={() => handleBack("/")}
            className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-90 transition-transform shrink-0"
            title="Go Back"
          >
            <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
          </button>
          
          <div className="p-3 bg-orange-100 dark:bg-orange-900/30 rounded-2xl shrink-0">
            <Database className="w-8 h-8 text-orange-600" />
          </div>
          
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">Database Sync</h1>
            <p className="text-sm text-gray-500 font-medium mt-1">Maintenance & Schema Updates</p>
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

        {/* Collection Selector */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 mb-6 flex items-center justify-between shadow-sm">
          <span className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-2">Target Collection:</span>
          <div className="flex gap-2">
            {["User", "Beneficiary"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => setForm({ ...form, modelName: m })}
                className={`px-6 py-2 rounded-xl text-xs font-bold border-2 transition-all ${form.modelName === m ? "border-orange-500 bg-orange-50 dark:bg-orange-900/20 text-orange-700" : "border-transparent text-gray-400"}`}
              >
                {m}s
              </button>
            ))}
          </div>
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

            {/* --- Action Selector --- */}
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

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className={form.operationType === "remove" ? "col-span-2" : ""}>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 mb-2 block">Field Name</label>
                <input
                  required
                  value={form.fieldName}
                  placeholder="e.g. email or todayStatus"
                  className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none focus:ring-2 focus:ring-orange-500 font-bold dark:text-white"
                  onChange={(e) => setForm({ ...form, fieldName: e.target.value })}
                />
              </div>
              
              {/* Only show Data Type if adding a field */}
              {form.operationType === "add" && (
                <div>
                  <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 mb-2 block">Data Type</label>
                  <select
                    value={form.valueType}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white"
                    onChange={(e) => setForm({ ...form, valueType: e.target.value as any })}
                  >
                    <option value="string">String</option>
                    <option value="number">Number</option>
                    <option value="boolean">Boolean</option>
                    <option value="json">JSON (Object)</option>
                  </select>
                </div>
              )}
            </div>

            <div className="flex items-center gap-3 p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-800">
              <input
                type="checkbox"
                id="nested"
                checked={form.isNested}
                onChange={(e) => setForm({ ...form, isNested: e.target.checked })}
                className="w-5 h-5 accent-blue-600"
              />
              <label htmlFor="nested" className="text-sm font-bold text-blue-800 dark:text-blue-300">
                Inside &quot;familyMembersDetail&quot;?
              </label>
              <Info className="w-4 h-4 text-blue-400 ml-auto" />
            </div>

            {/* Only show Default Value if adding a field */}
            {form.operationType === "add" && (
              <div>
                <label className="text-[10px] font-black uppercase text-gray-400 tracking-[0.2em] ml-1 mb-2 block">Default Value</label>
                {form.valueType === "boolean" ? (
                  <select
                    value={form.defaultValue}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl font-bold dark:text-white"
                    onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                  >
                    <option value="false">False</option>
                    <option value="true">True</option>
                  </select>
                ) : (
                  <input
                    // required={form.operationType === "add"}
                    value={form.defaultValue}
                    placeholder={form.valueType === "number" ? "0" : form.valueType === "json" ? "{}" : "Enter text"}
                    className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl outline-none font-bold dark:text-white"
                    onChange={(e) => setForm({ ...form, defaultValue: e.target.value })}
                  />
                )}
              </div>
            )}

            <button
              disabled={loading || !form.fieldName}
              className={`w-full py-5 text-white font-black rounded-3xl shadow-xl transition-all active:scale-95 flex items-center justify-center gap-3 ${
                form.operationType === "remove" 
                  ? "bg-red-600 hover:bg-red-700 shadow-red-200 dark:shadow-none" 
                  : "bg-blue-600 hover:bg-blue-700 shadow-blue-200 dark:shadow-none"
              } disabled:bg-gray-200 disabled:shadow-none`}
            >
              {loading ? <Zap className="animate-pulse w-6 h-6" /> : (
                <>
                  {form.operationType === "remove" ? <Trash2 className="w-5 h-5" /> : <ChevronRight className="w-5 h-5" />} 
                  {form.operationType === "remove" ? "PERMANENTLY REMOVE FIELD" : "ADD FIELD TO ALL"}
                </>
              )}
            </button>
          </form>
        ) : (
          <div className="space-y-4 animate-in fade-in slide-in-from-right-4">
            {backups.length === 0 ? (
              <div className="text-center p-12 bg-white dark:bg-gray-900 rounded-[2.5rem] border-2 border-dashed border-gray-200 dark:border-gray-800">
                <History className="w-12 h-12 text-gray-200 dark:text-gray-700 mx-auto mb-3" />
                <p className="text-gray-400 font-bold">No backups found</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-3">
                {backups.map((name) => (
                  <div key={name} className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
                    <div className="min-w-0 pr-4">
                      <p className="text-xs font-black text-gray-900 dark:text-white truncate">{name}</p>
                      <p className="text-[10px] text-gray-400 font-bold uppercase mt-1">Ready to Restore</p>
                    </div>
                    
                    {/* Action Buttons */}
                    <div className="flex items-center gap-2 shrink-0">
                      <button 
                        onClick={() => handleDelete(name)}
                        disabled={loading}
                        className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl hover:bg-red-600 hover:text-white active:scale-90 transition-all"
                        title="Delete Backup"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                      <button 
                        onClick={() => handleRestore(name)}
                        disabled={loading}
                        className="px-4 py-3 bg-blue-600 text-white rounded-xl text-xs font-black flex items-center gap-2 hover:bg-blue-700 active:scale-90 transition-all"
                      >
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

        <div className="mt-8 p-6 bg-gray-100 dark:bg-gray-900 rounded-3xl border-2 border-dashed border-gray-200 dark:border-gray-800">
           <h4 className="text-[10px] font-black uppercase text-gray-400 mb-3 tracking-widest flex items-center gap-2">
            <HardDriveDownload className="w-3 h-3"/> Instructions
           </h4>
           <ul className="text-xs text-gray-500 space-y-2 font-medium">
             <li>• Top-level: use name (e.g. <code className="text-orange-600 font-bold">email</code>)</li>
             <li>• Family: use dot notation (e.g. <code className="text-orange-600 font-bold">familyMembersDetail.memberNotes</code>)</li>
             <li>• Deleting a backup frees up database storage but prevents future rollbacks to that state.</li>
           </ul>
        </div>
      </div>
    </div>
  );
}