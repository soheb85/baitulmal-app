"use client";

import { useState, useEffect } from "react";
import { getStock, updateStock } from "@/app/actions/inventoryActions";
import { getSession } from "@/app/actions/authActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Package, Save, AlertTriangle, 
  History, RotateCcw, CheckCircle2 
} from "lucide-react";

export default function InventoryPage() {
  const [count, setCount] = useState(0);
  const [initialCount, setInitialCount] = useState(0); // To track changes
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [user, setUser] = useState<any>(null);
  
  const { isNavigating, handleBack } = useBackNavigation("/");

  useEffect(() => {
    async function init() {
        setLoading(true);
        const [stock, session] = await Promise.all([getStock(), getSession()]);
        setCount(stock);
        setInitialCount(stock);
        setUser(session);
        setLoading(false);
    }
    init();
  }, []);

  const handleSave = async () => {
      if (count === initialCount) return; // No changes
      
      setSaving(true);
      const res = await updateStock(count, user?.username || "Admin");
      
      if (res.success) {
          setInitialCount(count); // Update baseline
          alert("Stock updated successfully!");
      } else {
          alert("Failed to update stock. Please try again.");
      }
      setSaving(false);
  };

  const handleReset = () => {
      setCount(initialCount);
  };

  if (isNavigating) return <NavigationLoader message="Returning..." />;

  // Permission Check
  const canEdit = user?.role === "SUPER_ADMIN";
  const hasChanges = count !== initialCount;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit">
       
       {/* --- Header --- */}
       <div className="flex items-center gap-4 mb-10">
          <button 
            onClick={() => handleBack()} 
            className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-95 transition-transform"
          >
             <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">Inventory</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Live Stock Management</p>
          </div>
       </div>

       <div className="max-w-md mx-auto">
           
           {/* --- Main Card --- */}
           <div className="bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800 text-center relative overflow-hidden">
               
               {/* Background Decoration */}
               <div className="absolute top-0 left-0 w-full h-1.5 bg-gradient-to-r from-blue-500 via-purple-500 to-pink-500" />

               <div className="w-20 h-20 bg-blue-50 dark:bg-blue-900/20 rounded-full flex items-center justify-center mx-auto mb-6 transition-transform hover:scale-110 duration-300">
                   <Package className="w-10 h-10 text-blue-600" />
               </div>
               
               <h2 className="text-xs font-black text-gray-400 uppercase tracking-[0.2em] mb-6">Total Ration Kits Available</h2>
               
               {/* Counter Section */}
               <div className="flex items-center justify-center gap-6 mb-8">
                   <button 
                     disabled={!canEdit || loading}
                     onClick={() => setCount(c => Math.max(0, c - 1))}
                     className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 font-black text-3xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95"
                   >
                     -
                   </button>
                   
                   <div className="text-7xl font-black text-gray-900 dark:text-white tabular-nums tracking-tighter min-w-[140px] select-none">
                       {loading ? <span className="text-4xl text-gray-300 animate-pulse">...</span> : count}
                   </div>
                   
                   <button 
                     disabled={!canEdit || loading}
                     onClick={() => setCount(c => c + 1)}
                     className="w-14 h-14 rounded-2xl bg-gray-100 dark:bg-gray-800 font-black text-3xl text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700 transition disabled:opacity-30 disabled:cursor-not-allowed shadow-sm active:scale-95"
                   >
                     +
                   </button>
               </div>

               {/* Low Stock Warning */}
               {!loading && count < 50 && (
                   <div className="mb-8 p-4 bg-red-50 dark:bg-red-900/20 rounded-2xl border border-red-100 dark:border-red-900/50 text-red-600 text-sm font-bold flex items-center justify-center gap-2 animate-pulse">
                       <AlertTriangle className="w-5 h-5" /> Low Stock Warning!
                   </div>
               )}

               {/* Action Buttons */}
               {canEdit ? (
                   <div className="space-y-3">
                       <button 
                         onClick={handleSave}
                         disabled={saving || !hasChanges}
                         className={`w-full py-4 font-bold rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all active:scale-95 ${
                             hasChanges 
                             ? "bg-gray-900 dark:bg-white text-white dark:text-gray-900 hover:opacity-90" 
                             : "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                         }`}
                       >
                         {saving ? <div className="w-5 h-5 border-2 border-current border-t-transparent rounded-full animate-spin" /> : <Save className="w-5 h-5" />}
                         {saving ? "Saving..." : "Update Stock"}
                       </button>

                       {hasChanges && (
                           <button 
                             onClick={handleReset}
                             className="w-full py-3 text-sm font-bold text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200 flex items-center justify-center gap-2 transition-colors"
                           >
                             <RotateCcw className="w-4 h-4" /> Reset Changes
                           </button>
                       )}
                   </div>
               ) : (
                   <div className="p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                       <p className="text-xs text-gray-500 font-medium flex items-center justify-center gap-2">
                           <CheckCircle2 className="w-4 h-4 text-green-500" />
                           View Only Mode
                       </p>
                   </div>
               )}
           </div>

           {/* --- Footer Info --- */}
           <div className="mt-8 text-center space-y-2">
                <p className="text-[10px] text-gray-400 uppercase font-bold flex items-center justify-center gap-2">
                    <History className="w-3 h-3" />
                    Auto-decrements on distribution
                </p>
                <p className="text-xs text-gray-300 dark:text-gray-700 font-medium">
                    Stock helps track physical availability.
                </p>
           </div>
       </div>
    </div>
  );
}