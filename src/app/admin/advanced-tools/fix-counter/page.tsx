"use client";

import { useState, useEffect } from "react";
import { getDailyCounter, setDailyCounter } from "@/app/actions/admin/queueActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Zap, AlertTriangle, 
  CalendarDays, Loader2, CheckCircle2, Hash
} from "lucide-react";

export default function FixCounterPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  // Default to today
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [currentSeq, setCurrentSeq] = useState<number | null>(null);
  const [newSeq, setNewSeq] = useState<string>("");
  
  const [isLoadingVal, setIsLoadingVal] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  // Fetch the current counter whenever the date changes
  useEffect(() => {
    async function fetchCounter() {
      setIsLoadingVal(true);
      setSuccessMessage(null);
      const res = await getDailyCounter(targetDate);
      if (res.success) {
        setCurrentSeq(res.seq ?? null);
        setNewSeq(String(res.seq ?? "")); // Pre-fill the input with the current value
      } else {
        alert("Failed to fetch counter: " + res.message);
      }
      setIsLoadingVal(false);
    }
    fetchCounter();
  }, [targetDate]);

  const handleExecute = async () => {
    setIsSaving(true);
    const numericSeq = parseInt(newSeq, 10);
    
    if (isNaN(numericSeq) || numericSeq < 0) {
      alert("Please enter a valid positive number.");
      setIsSaving(false);
      return;
    }

    const res = await setDailyCounter(targetDate, numericSeq);
    
    if (res.success) {
      setSuccessMessage(res.message);
      setCurrentSeq(numericSeq);
      setShowConfirm(false);
    } else {
      alert("Error: " + res.message);
    }
    setIsSaving(false);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative">
      <div className="w-full h-full p-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-black text-blue-600 flex items-center gap-2">
              <Zap className="w-4 h-4" /> Counter Fixer
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Adjust Token Sequence</p>
          </div>
        </div>

        {/* Warning Banner */}
        <div className="bg-blue-50 dark:bg-blue-900/10 p-4 rounded-2xl border border-blue-100 dark:border-blue-900/30 flex gap-3 mb-6">
          <AlertTriangle className="w-6 h-6 text-blue-600 shrink-0" />
          <div>
            <p className="text-xs font-bold text-blue-800 dark:text-blue-400 uppercase tracking-widest">How it works</p>
            <p className="text-[11px] text-blue-600/80 dark:text-blue-400/80 mt-1 leading-relaxed font-medium">
              If you set the sequence to <strong className="font-black">10</strong>, the next person checked in will receive Token <strong className="font-black">11</strong>.
            </p>
          </div>
        </div>

        {/* Success Message */}
        {successMessage && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center gap-3 mb-6 animate-in fade-in zoom-in-95">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            <p className="text-xs font-bold text-green-800 dark:text-green-400">{successMessage}</p>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
          
          {/* Date Selector */}
          <div className="space-y-2">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Date</label>
            <div className="relative">
              <CalendarDays className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input 
                type="date" 
                value={targetDate}
                onChange={(e) => setTargetDate(e.target.value)}
                className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent outline-none focus:border-blue-500 font-bold text-gray-900 dark:text-white transition-all"
              />
            </div>
          </div>

          {/* Current & New Sequence Block */}
          <div className="grid grid-cols-2 gap-4 pt-2">
            
            {/* Current Value Display */}
            <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700 flex flex-col justify-center items-center text-center">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Current Seq</p>
              {isLoadingVal ? (
                <Loader2 className="w-8 h-8 animate-spin text-blue-500" />
              ) : (
                <p className="text-3xl font-black text-gray-900 dark:text-white">
                  {currentSeq !== null ? currentSeq : "-"}
                </p>
              )}
            </div>

            {/* New Value Input */}
            <div className="space-y-2">
              <p className="text-[10px] font-black text-blue-500 uppercase tracking-widest ml-1 text-center">Set New Seq</p>
              <div className="relative">
                <Hash className="absolute left-3 top-3 w-5 h-5 text-blue-400" />
                <input 
                  type="number" 
                  value={newSeq}
                  onChange={(e) => setNewSeq(e.target.value)}
                  placeholder="0"
                  className="w-full p-3 pl-10 rounded-2xl bg-blue-50 dark:bg-blue-900/10 border-2 border-blue-100 dark:border-blue-900/30 outline-none focus:border-blue-500 font-black text-xl text-blue-700 dark:text-blue-400 text-center transition-all"
                />
              </div>
            </div>

          </div>

          <button 
            onClick={() => setShowConfirm(true)}
            disabled={isLoadingVal || newSeq === "" || parseInt(newSeq) === currentSeq}
            className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-300 disabled:dark:bg-gray-800 text-white disabled:text-gray-500 font-black rounded-xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            <Zap className="w-5 h-5" /> OVERWRITE SEQUENCE
          </button>
        </div>
      </div>

      {/* --- CONFIRM MODAL --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-blue-500 animate-in zoom-in-95">
            <AlertTriangle className="w-12 h-12 text-blue-500 mx-auto mb-3" />
            <h2 className="font-black text-lg mb-1 text-gray-900 dark:text-white">Confirm Overwrite</h2>
            <p className="text-[11px] text-gray-500 font-medium mb-5 leading-relaxed">
              You are forcing the counter for <strong className="text-blue-600">{targetDate}</strong> to jump from {currentSeq} to <strong className="text-blue-600">{newSeq}</strong>.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} disabled={isSaving} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500">Cancel</button>
              <button onClick={handleExecute} disabled={isSaving} className="flex-1 py-3 bg-blue-600 text-white font-black text-sm rounded-xl flex justify-center items-center gap-2 shadow-md">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Apply Fix"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}