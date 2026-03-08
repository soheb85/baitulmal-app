/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { BookOpen, X, Plus, Loader2, Save, Trash2 } from "lucide-react";
import React, { useState, useEffect } from "react";
import { fetchSchemaFields, addSchemaField, deleteSchemaField } from "@/app/actions/admin/schemaGuideActions";

type ColorTheme = "indigo" | "green" | "purple" | "orange" | "rose" | "blue" | "teal";

const COLOR_STYLES: Record<string, string> = {
  indigo: "text-indigo-500 border-indigo-100 dark:border-indigo-900",
  green: "text-green-500 border-green-100 dark:border-green-900",
  purple: "text-purple-500 border-purple-100 dark:border-purple-900",
  orange: "text-orange-500 border-orange-100 dark:border-orange-900",
  rose: "text-rose-500 border-rose-100 dark:border-rose-900",
  blue: "text-blue-500 border-blue-100 dark:border-blue-900",
  teal: "text-teal-500 border-teal-100 dark:border-teal-900",
};

interface SchemaGuideModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function SchemaGuideModal({ isOpen, onClose }: SchemaGuideModalProps) {
  const [fields, setFields] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [isAdding, setIsAdding] = useState(false);

  // New Field Form State
  const [newField, setNewField] = useState({
    category: "Custom Added Fields",
    colorTheme: "indigo",
    fieldKey: "",
    fieldType: "String",
    hint: ""
  });

  // 1. Pure fetch function (No loading state side-effects)
  const fetchLatestData = async () => {
    const res = await fetchSchemaFields();
    if (res.success) setFields(res.data);
  };

  // 2. Safe Effect for Opening Modal
  useEffect(() => {
    if (isOpen && fields.length === 0) {
      // Use setTimeout to push the state update slightly out of the sync cycle, 
      // preventing the "cascading renders" error.
      setTimeout(() => setLoading(true), 0);
      
      fetchLatestData().finally(() => {
        setLoading(false);
      });
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  // 3. User Actions (Safe to set state synchronously inside event handlers)
  const handleSaveField = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newField.fieldKey.trim()) return alert("Field Key is required.");
    
    setLoading(true);
    const res = await addSchemaField(newField);
    if (res.success) {
      await fetchLatestData();
      setIsAdding(false);
      setNewField({ ...newField, fieldKey: "", hint: "" }); // reset
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  const handleDelete = async (id: string) => {
    if(!confirm("Remove this field from the guide?")) return;
    setLoading(true);
    await deleteSchemaField(id);
    await fetchLatestData();
    setLoading(false);
  };

  // Group fields dynamically by Category
  const groupedFields = fields.reduce((acc: any, field) => {
    if (!acc[field.category]) {
      acc[field.category] = { colorTheme: field.colorTheme, items: [] };
    }
    acc[field.category].items.push(field);
    return acc;
  }, {});

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-[60] bg-black/60 backdrop-blur-sm flex justify-end">
      <div className="absolute inset-0" onClick={onClose} />

      <div className="bg-white dark:bg-gray-900 w-[85%] max-w-sm h-full shadow-2xl animate-in slide-in-from-right flex flex-col relative z-10">
        
        {/* Header */}
        <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10 shrink-0">
          <h2 className="font-black text-lg text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-indigo-600" /> Schema Guide
          </h2>
          <div className="flex items-center gap-2">
            <button onClick={() => setIsAdding(!isAdding)} className="p-1.5 bg-indigo-100 dark:bg-indigo-900/50 text-indigo-600 rounded-full shadow-sm active:scale-90 transition-transform">
              <Plus className={`w-5 h-5 transition-transform ${isAdding ? "rotate-45" : ""}`} />
            </button>
            <button onClick={onClose} className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm active:scale-90 transition-transform">
              <X className="w-5 h-5 text-gray-500" />
            </button>
          </div>
        </div>

        {/* ADD NEW FIELD FORM (Toggled via Plus Button) */}
        {isAdding && (
          <div className="p-5 bg-indigo-50 dark:bg-indigo-900/20 border-b border-indigo-100 dark:border-indigo-900/50 shrink-0">
            <h3 className="text-xs font-black text-indigo-600 uppercase tracking-widest mb-3">Add Custom Field</h3>
            <form onSubmit={handleSaveField} className="space-y-3">
              <input value={newField.fieldKey} onChange={e => setNewField({...newField, fieldKey: e.target.value})} placeholder="Database Key (e.g. bloodGroup)" className="w-full p-2.5 rounded-lg text-xs font-bold font-mono outline-none border border-indigo-100 dark:border-indigo-800/50 dark:bg-gray-900" />
              
              <div className="grid grid-cols-2 gap-2">
                <select value={newField.fieldType} onChange={e => setNewField({...newField, fieldType: e.target.value})} className="w-full p-2.5 rounded-lg text-xs font-bold outline-none border border-indigo-100 dark:border-indigo-800/50 dark:bg-gray-900">
                  <option value="String">String</option>
                  <option value="Number">Number</option>
                  <option value="Boolean">Boolean</option>
                  <option value="Date">Date</option>
                  <option value="Array">Array</option>
                  <option value="Enum">Enum</option>
                </select>
                <select value={newField.colorTheme} onChange={e => setNewField({...newField, colorTheme: e.target.value})} className="w-full p-2.5 rounded-lg text-xs font-bold outline-none border border-indigo-100 dark:border-indigo-800/50 dark:bg-gray-900">
                  <option value="indigo">Indigo</option>
                  <option value="green">Green</option>
                  <option value="orange">Orange</option>
                  <option value="rose">Rose</option>
                  <option value="purple">Purple</option>
                  <option value="teal">Teal</option>
                </select>
              </div>

              <input value={newField.category} onChange={e => setNewField({...newField, category: e.target.value})} placeholder="Category Heading" className="w-full p-2.5 rounded-lg text-xs font-bold outline-none border border-indigo-100 dark:border-indigo-800/50 dark:bg-gray-900" />
              <input value={newField.hint} onChange={e => setNewField({...newField, hint: e.target.value})} placeholder="Hint (optional)..." className="w-full p-2.5 rounded-lg text-xs font-bold outline-none border border-indigo-100 dark:border-indigo-800/50 dark:bg-gray-900" />
              
              <button type="submit" disabled={loading} className="w-full py-2.5 bg-indigo-600 text-white text-xs font-black rounded-lg flex items-center justify-center gap-2 active:scale-95 transition-transform">
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4"/> Save to DB</>}
              </button>
            </form>
          </div>
        )}

        {/* Dynamic Content List */}
        <div className="flex-1 overflow-y-auto p-5 space-y-6 bg-gray-50/50 dark:bg-gray-950 relative">
          {loading && Object.keys(groupedFields).length === 0 ? (
             <div className="flex flex-col items-center justify-center py-10 opacity-50">
               <Loader2 className="w-8 h-8 animate-spin text-indigo-500 mb-2" />
               <p className="text-[10px] font-black uppercase tracking-widest">Loading Guide...</p>
             </div>
          ) : Object.keys(groupedFields).length === 0 ? (
             <div className="text-center py-10 opacity-50">
               <p className="text-xs font-bold text-gray-500">Database is empty.<br/>Click the + icon to add fields.</p>
             </div>
          ) : (
            Object.entries(groupedFields).map(([category, data]: any) => (
              <div key={category} className="space-y-2">
                <h3 className={`text-[10px] font-black uppercase tracking-widest border-b pb-1 mb-2 ${COLOR_STYLES[data.colorTheme] || COLOR_STYLES.indigo}`}>
                  {category}
                </h3>
                
                <div className="space-y-2">
                  {data.items.map((item: any) => (
                    <div key={item._id} className="bg-white dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 shadow-sm flex flex-col gap-1 group relative">
                      
                      {/* Delete Button (Hover) */}
                      <button onClick={() => handleDelete(item._id)} className="absolute -top-2 -right-2 bg-red-100 text-red-600 p-1.5 rounded-full opacity-0 group-hover:opacity-100 transition-opacity shadow-sm">
                         <Trash2 className="w-3 h-3" />
                      </button>

                      <div className="flex justify-between items-center gap-3">
                        <span className="font-mono text-xs font-bold text-gray-800 dark:text-gray-200 break-all pr-4">
                          {item.fieldKey}
                        </span>
                        {item.fieldType && (
                          <span className="text-[9px] font-bold text-gray-400 uppercase shrink-0">
                            {item.fieldType}
                          </span>
                        )}
                      </div>
                      {item.hint && (
                        <p className="text-[10px] text-gray-500 leading-tight font-medium">
                          {item.hint}
                        </p>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  );
}