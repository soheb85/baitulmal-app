"use client";

import { useState } from "react";
import { syncLegacyData } from "@/app/actions/legacyActions";
import { History, Loader2, Check } from "lucide-react";

export default function LegacySync({ id, currentYears }: { id: string, currentYears: number[] }) {
  const [loading, setLoading] = useState(false);
  const availableYears = [2022,2023,2024, 2025]; // Add previous years here

  const handleSync = async (year: number) => {
    setLoading(true);
    const res = await syncLegacyData(id, [year]);
    if (res.success) {
      alert(`Year ${year} added to history.`);
    }
    setLoading(false);
  };

  return (
    <div className="mt-6 p-4 bg-gray-100 dark:bg-gray-800 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
      <h4 className="text-xs font-bold text-gray-500 uppercase mb-3 flex items-center gap-2">
        <History className="w-4 h-4" /> Import Past Records
      </h4>
      <div className="flex gap-2">
        {availableYears.map(year => {
          const alreadyExists = currentYears.includes(year);
          return (
            <button
              key={year}
              disabled={loading || alreadyExists}
              onClick={() => handleSync(year)}
              className={`flex-1 py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-2 transition-all ${
                alreadyExists 
                ? "bg-green-100 text-green-700 border border-green-200 cursor-not-allowed" 
                : "bg-white dark:bg-gray-700 text-gray-700 dark:text-gray-200 border shadow-sm active:scale-95"
              }`}
            >
              {alreadyExists ? <Check className="w-3 h-3" /> : null}
              Ramzan {year}
            </button>
          );
        })}
      </div>
      <p className="text-[10px] text-gray-400 mt-3 italic">
        * Use this to update records from years before this app was launched.
      </p>
    </div>
  );
}