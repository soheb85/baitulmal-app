/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  getLiveQueue,
  markDistributed,
} from "@/app/actions/distributionActions";
import {
  Loader2,
  CheckCircle2,
  RefreshCw,
  User,
  Phone,
  MapPin,
  ArrowLeft,
  CreditCard,
  ExternalLink,
  Users,
} from "lucide-react";

// --- Helper to format Aadhaar (1234 5678 9012) ---
const formatAadhaar = (num: string) => {
  if (!num) return "N/A";
  return num.toString().replace(/(\d{4})(?=\d)/g, "$1 ");
};

// --- Skeleton Component ---
const QueueSkeleton = () => (
  <div className="space-y-6">
    {[1, 2].map((i) => (
      <div
        key={i}
        className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse"
      >
        <div className="flex justify-between items-start mb-4">
          <div className="space-y-2 w-2/3">
            <div className="h-8 bg-gray-200 dark:bg-gray-800 rounded-full w-3/4" />
            <div className="h-4 bg-gray-100 dark:bg-gray-900 rounded-full w-1/2" />
          </div>
          <div className="h-12 w-12 bg-purple-100 dark:bg-purple-900/30 rounded-2xl" />
        </div>
        <div className="h-20 bg-gray-50 dark:bg-gray-800 rounded-2xl mb-4" />
        <div className="h-14 bg-gray-200 dark:bg-gray-800 rounded-xl" />
      </div>
    ))}
  </div>
);

export default function LiveQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [isNavigating, setIsNavigating] = useState(false); // NEW STATE FOR BACK NAV
  const router = useRouter();

  // --- Handle Back Navigation with Loader ---
  const handleBack = () => {
    setIsNavigating(true);
    router.push("/");
  };

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

  // --- IF NAVIGATING AWAY: SHOW FULL SCREEN LOADER ---
  if (isNavigating) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex flex-col items-center justify-center animate-in fade-in zoom-in-95">
        <Loader2 className="w-12 h-12 text-purple-600 animate-spin mb-4" />
        <p className="text-gray-500 font-bold animate-pulse">
          Returning to Dashboard...
        </p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit p-4 pb-24">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-xl py-2 mb-6">
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-3">
            <button
              onClick={handleBack} // UPDATED HANDLER
              className="p-2.5 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 active:scale-95 transition"
            >
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-xl font-black text-purple-700 dark:text-purple-400 leading-none">
                Station 2
              </h1>
              <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">
                Ration Queue
              </p>
            </div>
          </div>

          <button
            onClick={() => fetchQueue(false)}
            disabled={loading}
            className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 active:scale-95 transition-transform"
          >
            <RefreshCw
              className={`w-5 h-5 text-gray-600 dark:text-gray-300 ${loading ? "animate-spin" : ""}`}
            />
          </button>
        </div>
      </div>

      {/* --- Content --- */}
      {loading && queue.length === 0 ? (
        <QueueSkeleton />
      ) : queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50">
          <div className="w-20 h-20 bg-gray-200 dark:bg-gray-800 rounded-full flex items-center justify-center mb-4">
            <User className="w-10 h-10 text-gray-400" />
          </div>
          <p className="text-xl font-bold text-gray-600 dark:text-gray-400">
            Queue is Empty
          </p>
          <p className="text-sm text-gray-400">
            Waiting for Verification Station...
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {queue.map((person) => (
            <div
              key={person._id}
              className="relative bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-lg border border-purple-100 dark:border-purple-900/30 animate-in slide-in-from-right-5 duration-300"
            >
              {/* 1. Header: Name & Token */}
              <div className="flex justify-between items-start mb-6">
                <div className="flex-1 min-w-0 pr-4">
                  <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight truncate">
                    {person.fullName}
                  </h2>
                  <div className="flex items-center gap-1.5 mt-1 text-gray-500 dark:text-gray-400">
                    <MapPin className="w-3.5 h-3.5 shrink-0" />
                    <span className="text-xs font-medium truncate">
                      {person.currentAddress}
                    </span>
                  </div>
                </div>

                <div className="flex flex-col items-center justify-center bg-purple-50 dark:bg-purple-900/20 text-purple-700 dark:text-purple-300 px-3 py-2 rounded-2xl border border-purple-100 dark:border-purple-800 shrink-0">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-60">
                    Token
                  </span>
                  <span className="text-3xl font-black leading-none">
                    #{person.todayStatus?.tokenNumber}
                  </span>
                </div>
              </div>

              {/* 2. Identity Verification Box (Aadhaar & Mobile) */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 mb-6 space-y-3">
                {/* Aadhaar Row */}
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2">
                    <CreditCard className="w-4 h-4 text-gray-400" />
                    <span className="text-xs font-bold text-gray-400 uppercase tracking-wider">
                      Aadhaar
                    </span>
                  </div>
                  <span className="font-mono text-lg font-bold text-gray-900 dark:text-white tracking-wide">
                    {formatAadhaar(person.aadharNumber)}
                  </span>
                </div>

                <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" />

                {/* Mobile & Family Row */}
                <div className="flex justify-between items-center">
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2">
                      <Phone className="w-4 h-4 text-blue-500" />
                      <span className="font-mono font-bold text-gray-700 dark:text-gray-300">
                        {person.mobileNumber}
                      </span>
                    </div>
                  </div>
                  <div className="flex items-center gap-1.5 bg-white dark:bg-gray-700 px-2 py-1 rounded-lg border border-gray-100 dark:border-gray-600">
                    <Users className="w-3.5 h-3.5 text-orange-500" />
                    <span className="text-xs font-bold text-gray-700 dark:text-gray-200">
                      {person.familyMembersDetail?.length || 0} Members
                    </span>
                  </div>
                </div>
              </div>

              {/* 3. Action Buttons */}
              <div className="space-y-3">
                <button
                  onClick={() => handleDistribute(person._id, person.fullName)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-green-200 dark:shadow-none flex items-center justify-center gap-2 text-lg active:scale-95 transition-all"
                >
                  <CheckCircle2 className="w-6 h-6" />
                  MARK GIVEN
                </button>

                <Link
                  href={`/beneficiaries/${person._id}?returnTo=/distribution/live-queue`}
                  className="flex items-center justify-center gap-2 w-full py-3 text-sm font-bold text-gray-500 hover:text-purple-600 dark:text-gray-400 dark:hover:text-purple-400 transition-colors"
                >
                  View Full Details <ExternalLink className="w-3.5 h-3.5" />
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
