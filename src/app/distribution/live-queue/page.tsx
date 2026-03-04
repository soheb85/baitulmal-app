/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import { getLiveQueue, markDistributed } from "@/app/actions/distributionActions";
import { Loader2, CheckCircle2, RefreshCw, User, Phone, MapPin, ArrowLeft } from "lucide-react";

export default function LiveQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();

  // --- Fetch Logic ---
  const fetchQueue = useCallback(async (isBackground = false) => {
    if (!isBackground) setLoading(true);
    
    try {
      const data = await getLiveQueue();
      setQueue(data);
    } catch (error) {
      console.error("Queue fetch error:", error);
    } finally {
      if (!isBackground) setLoading(false);
    }
  }, []);

  // --- Auto Refresh (Every 10s) ---
  useEffect(() => {
    fetchQueue(false);
    const interval = setInterval(() => fetchQueue(true), 10000);
    return () => clearInterval(interval);
  }, [fetchQueue]);

  // --- Handle Distribution ---
  const handleDistribute = async (id: string, name: string) => {
    if (!confirm(`Confirm Ration Given to: ${name}?`)) return;
    
    // Optimistic Update (Remove from UI immediately)
    setQueue((prev) => prev.filter((p) => p._id !== id));
    
    const res = await markDistributed(id);
    if (!res.success) {
       alert("Error: " + res.message);
       fetchQueue(false); // Revert on error
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      
      {/* --- Header --- */}
      {/* --- Header --- */}
<div className="flex justify-between items-center mb-8">

   <div className="flex items-center gap-3">
      <button
        onClick={() => router.back()}
        className="p-2 bg-white dark:bg-gray-800 rounded-xl shadow border border-gray-200 dark:border-gray-700 active:scale-95 transition"
      >
         <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
      </button>

      <h1 className="text-2xl font-bold font-outfit text-purple-700 dark:text-purple-400">
         Station 2: Live Queue
      </h1>
   </div>

   <button 
     onClick={() => fetchQueue(false)} 
     className="p-3 bg-white dark:bg-gray-800 rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 active:scale-95 transition-transform"
   >
      <RefreshCw className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? 'animate-spin' : ''}`} />
   </button>

</div>

      {/* --- Loading State --- */}
      {loading && queue.length === 0 ? (
         <div className="flex flex-col items-center justify-center py-20">
            <Loader2 className="w-8 h-8 animate-spin text-purple-600 mb-2" />
            <p className="text-sm text-gray-500">Loading queue...</p>
         </div>
      ) : queue.length === 0 ? (
         <div className="text-center py-20 opacity-50">
            <div className="w-16 h-16 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mx-auto mb-4">
               <User className="w-8 h-8 text-gray-400" />
            </div>
            <p className="text-lg font-bold text-gray-600 dark:text-gray-400">Queue is empty</p>
            <p className="text-sm text-gray-400">Waiting for check-ins...</p>
         </div>
      ) : (
         <div className="space-y-6 pb-20">
            {queue.map((person) => (
               <div key={person._id} className="bg-white dark:bg-gray-900 p-6 rounded-3xl shadow-lg border-2 border-purple-50 dark:border-purple-900 animate-in slide-in-from-right-5 duration-300">
                  
                  {/* Top Row: Token & Name */}
                  <div className="flex justify-between items-start mb-4">
                     <div>
                        <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
                           {person.fullName}
                        </h2>
                        <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                           <Phone className="w-4 h-4" />
                           <span className="font-mono text-base">{person.mobileNumber}</span>
                        </div>
                     </div>
                     
                     {/* Token Badge */}
                     <div className="flex flex-col items-center justify-center bg-purple-100 dark:bg-purple-900/50 text-purple-700 dark:text-purple-300 px-4 py-2 rounded-xl border border-purple-200 dark:border-purple-800">
                        <span className="text-[10px] font-bold uppercase tracking-wider opacity-70">Token</span>
                        <span className="text-2xl font-black">#{person.todayStatus?.tokenNumber}</span>
                     </div>
                  </div>

                  {/* Info Section */}
                  <div className="space-y-3 mb-6 bg-gray-50 dark:bg-gray-800 p-4 rounded-xl">
                     <div className="flex gap-2 text-gray-700 dark:text-gray-300 font-medium">
                        <User className="w-5 h-5 text-purple-500" /> 
                        {person.familyMembersDetail?.length || 0} Family Members
                     </div>
                     <div className="flex gap-2 text-gray-700 dark:text-gray-300">
                        <MapPin className="w-5 h-5 text-purple-500 shrink-0" />
                        <span className="line-clamp-1">{person.currentAddress}</span>
                     </div>
                  </div>

                  {/* Action Button */}
                  <button 
                    onClick={() => handleDistribute(person._id, person.fullName)}
                    className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-xl shadow-lg shadow-green-200 dark:shadow-none flex items-center justify-center gap-2 text-lg active:scale-95 transition-all"
                  >
                    <CheckCircle2 className="w-6 h-6" />
                    MARK RATION GIVEN
                  </button>

               </div>
            ))}
         </div>
      )}
    </div>
  );
}