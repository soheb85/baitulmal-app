"use client";

import { useState } from "react";
import { syncLegacyData } from "@/app/actions/legacyActions";
import { History, Loader2, CheckCircle2, DownloadCloud, X } from "lucide-react";

export default function LegacySync({ id, currentYears }: { id: string, currentYears: number[] }) {
  const [showModal, setShowModal] = useState(false);
  const [loadingYear, setLoadingYear] = useState<number | null>(null);
  const [successYear, setSuccessYear] = useState<number | null>(null);
  
  const availableYears = [2022, 2023, 2024, 2025]; // Your specific years

  const handleSync = async (year: number) => {
    // 1. Ask for confirmation before updating the database
    if (!confirm(`Are you sure you want to add Ramzan ${year} to this family's history?`)) {
      return;
    }

    // 2. Show loading spinner on the specific button
    setLoadingYear(year);
    
    // 3. Call your existing server action
    const res = await syncLegacyData(id, [year]);
    
    if (res.success) {
      setSuccessYear(year);
      // Clear the success animation after 2 seconds
      setTimeout(() => {
        setSuccessYear(null);
      }, 2000);
    } else {
      alert(res.message || "Failed to sync data.");
    }
    
    setLoadingYear(null);
  };

  return (
    <>
      {/* TRIGGER BUTTON: This replaces the big inline box to prevent UI stretching */}
      <button 
        onClick={() => setShowModal(true)}
        className="w-full py-3.5 mt-2 bg-gray-50 dark:bg-gray-800 hover:bg-gray-100 dark:hover:bg-gray-700 text-gray-700 dark:text-gray-300 font-bold rounded-xl text-xs flex items-center justify-center gap-2 active:scale-95 transition-all border border-gray-200 dark:border-gray-700 shadow-sm"
      >
        <DownloadCloud className="w-4 h-4" /> Import Past Records
      </button>

      {/* THE POP-UP MODAL */}
      {showModal && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-sm shadow-2xl animate-in zoom-in-95 relative">
            
            {/* Header */}
            <div className="flex justify-between items-start mb-5">
              <div className="flex items-center gap-2 text-indigo-600">
                <History className="w-5 h-5" />
                <h3 className="font-black text-lg leading-none">Legacy Sync</h3>
              </div>
              <button 
                onClick={() => setShowModal(false)} 
                disabled={loadingYear !== null}
                className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 disabled:opacity-50"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            <p className="text-xs text-gray-500 font-medium mb-6 leading-relaxed">
              Use this to update records from years before the digital system was launched.
            </p>

            {/* Grid of Years */}
            <div className="grid grid-cols-2 gap-3 mb-6">
              {availableYears.map(year => {
                const alreadyExists = currentYears.includes(year) || successYear === year;
                const isLoading = loadingYear === year;

                return (
                  <button
                    key={year}
                    disabled={isLoading || alreadyExists || loadingYear !== null}
                    onClick={() => handleSync(year)}
                    className={`py-3 px-2 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                      alreadyExists 
                      ? "bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 border border-green-200 dark:border-green-800 cursor-not-allowed" 
                      : "bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-200 border border-gray-200 dark:border-gray-700 shadow-sm hover:border-indigo-300 active:scale-95"
                    }`}
                  >
                    {isLoading ? (
                      <Loader2 className="w-4 h-4 animate-spin text-indigo-500" />
                    ) : alreadyExists ? (
                      <CheckCircle2 className="w-4 h-4" />
                    ) : null}
                    Ramzan {year}
                  </button>
                );
              })}
            </div>

            <button 
              onClick={() => setShowModal(false)} 
              disabled={loadingYear !== null}
              className="w-full py-3.5 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500 active:scale-95 transition-transform disabled:opacity-50"
            >
              Done
            </button>
          </div>
        </div>
      )}
    </>
  );
}