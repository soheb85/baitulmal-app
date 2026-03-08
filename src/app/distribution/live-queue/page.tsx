/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect, useCallback } from "react";
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
  Clock,
  Briefcase,
  IndianRupee,
  Search,
} from "lucide-react";

// --- Helper to format Aadhaar (1234 5678 9012) ---
const formatAadhaar = (num: string) => {
  if (!num) return "N/A";
  return num.toString().replace(/(\d{4})(?=\d)/g, "$1 ");
};

export default function LiveQueuePage() {
  const [queue, setQueue] = useState<any[]>([]);
  const [distributedCount, setDistributedCount] = useState(0); 
  
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [isNavigating, setIsNavigating] = useState(false);
  
  // NEW: State to track which specific profile button was clicked
  const [viewingProfileId, setViewingProfileId] = useState<string | null>(null);

  const [selectedPerson, setSelectedPerson] = useState<any>(null);
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);

  const router = useRouter();

  const handleBack = () => {
    setIsNavigating(true);
    router.push("/");
  };

  // NEW: Function to handle viewing profile with a loading state
  const handleViewProfile = (personId: string) => {
    setViewingProfileId(personId);
    router.push(`/beneficiaries/${personId}?returnTo=/distribution/live-queue`);
  };

  const fetchQueue = useCallback(async (bg = false) => {
    if (!bg) setLoading(true);

    const data = await getLiveQueue();
    
    if (data && data.queue) {
        setQueue(data.queue);
        setDistributedCount(data.distributedToday);
    } else {
        setQueue(data as any); 
    }

    if (!bg) setLoading(false);
  }, []);

  useEffect(() => {
    let mounted = true;

    const loadQueue = async () => {
      if (!mounted) return;
      await fetchQueue(false);
    };

    loadQueue();

    const interval = setInterval(() => {
      if (mounted) fetchQueue(true);
    }, 10000);

    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, [fetchQueue]);

  const isFromYesterday = (dateString: string) => {
    if (!dateString) return false;
    const tokenDate = new Date(dateString);
    const today = new Date();
    return tokenDate.getDate() !== today.getDate() || tokenDate.getMonth() !== today.getMonth();
  };

  const handleDistribute = (person: any) => {
    setSelectedPerson(person);
    setShowConfirm(true);
  };

  const confirmDistribution = async () => {
    if (!selectedPerson) return;

    setProcessing(true);

    const res = await markDistributed(selectedPerson._id);

    if (res.success) {
      setShowConfirm(false);
      setShowSuccess(true);

      setQueue((prev) => prev.filter((p) => p._id !== selectedPerson._id));
      setDistributedCount((prev) => prev + 1); 
    } else {
      alert(res.message);
    }

    setProcessing(false);
  };

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
    // FIX 1: overflow-x-hidden on the root container
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit px-3 pb-24 w-full overflow-x-hidden">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-gray-50/95 dark:bg-gray-950/95 backdrop-blur-xl py-3 mb-4 flex justify-between items-center w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={handleBack}
            className="p-2.5 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 active:scale-95 transition shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          <div className="min-w-0">
            <h1 className="text-xl font-black text-purple-600 leading-none truncate">Station 2</h1>
            <p className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">Ration Queue</p>
          </div>
        </div>

        <button
          onClick={() => fetchQueue(false)}
          className="p-3 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 active:scale-95 transition-transform shrink-0"
        >
          <RefreshCw className={`w-5 h-5 ${loading ? "animate-spin text-purple-500" : "text-gray-600 dark:text-gray-300"}`} />
        </button>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-2 gap-3 mb-5 w-full">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 text-center shadow-sm min-w-0">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 truncate">In Queue</p>
          <p className="text-3xl font-black text-purple-600 truncate">{queue.length}</p>
        </div>

        <div className="bg-white dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800 text-center shadow-sm min-w-0">
          <p className="text-xs text-gray-400 font-bold uppercase tracking-widest mb-1 truncate">Distributed</p>
          <p className="text-3xl font-black text-green-600 truncate">
            {distributedCount}
          </p>
        </div>
      </div>

      {/* QUEUE LIST */}
      {loading && queue.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-32 opacity-50 w-full">
          <Loader2 className="w-10 h-10 animate-spin text-purple-500 mb-4" />
          <p className="font-bold text-gray-500 truncate">Loading queue...</p>
        </div>
      ) : queue.length === 0 ? (
        <div className="flex flex-col items-center py-32 opacity-50 w-full">
          <User className="w-16 h-16 mb-4 text-gray-300 dark:text-gray-700" />
          <p className="text-lg font-bold text-gray-500 truncate">Queue is empty</p>
        </div>
      ) : (
        <div className="space-y-4 w-full min-w-0">
          {queue.map((person) => {
            const displayNote = person.todayStatus?.tempNote || "Excel Row: 452 (Test)";
            // FIX 2: min-w-0 on the card wrapper
            return (
            <div
              key={person._id}
              className="relative bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-md animate-in slide-in-from-right-4 duration-300 w-full min-w-0"
            >
              {/* Overnight Indicator */}
              {isFromYesterday(person.todayStatus.date) && (
                <div className="absolute -top-3 left-6 bg-orange-500 text-white px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-tighter flex items-center gap-1 shadow-lg z-10">
                  <Clock className="w-3 h-3 shrink-0" /> <span className="truncate">Waiting Since Yesterday</span>
                </div>
              )}

              {/* --- FIXED HEADER --- */}
              <div className="flex justify-between items-start mb-5 gap-3 w-full min-w-0">
                <div className="flex-1 min-w-0">
                  {/* FIX 3: break-all line-clamp-2 on Name */}
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight break-all max-w-full line-clamp-2">
                    {person.fullName}
                  </h2>
                  <div className="flex items-start gap-1.5 text-gray-500 text-xs mt-1 w-full min-w-0">
                    <MapPin className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                    {/* FIX 4: break-all on Address */}
                    <span className="line-clamp-2 leading-snug break-all min-w-0 flex-1">
                      {person.currentAddress}
                    </span>
                  </div>
                </div>

                <div className="bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 px-3 py-1.5 rounded-2xl flex flex-col items-center justify-center shrink-0 border border-purple-200 dark:border-purple-800">
                  <span className="text-[9px] font-black uppercase tracking-widest opacity-70">Token</span>
                  <span className="font-black text-2xl leading-none">#{person.todayStatus?.tokenNumber}</span>
                </div>
              </div>

              {/* USE THE TEST VARIABLE HERE */}
       {displayNote && (
          <div className="mb-4 bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800/50 p-3 rounded-2xl flex items-center gap-3 animate-pulse">
            <div className="bg-amber-500 text-white p-1.5 rounded-lg shrink-0">
              <Search className="w-4 h-4" />
            </div>
            <div className="min-w-0">
              <p className="text-[10px] font-black text-amber-600 dark:text-amber-400 uppercase tracking-widest leading-none mb-1">Notes</p>
              <p className="text-sm font-black text-amber-900 dark:text-amber-100 truncate">
                {displayNote}
              </p>
            </div>
          </div>
       )}

              {/* Economic Status Grid */}
              <div className="grid grid-cols-2 gap-2 mb-4 w-full min-w-0">
                  <div className="bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl border border-gray-100 dark:border-gray-800 flex items-center gap-2 min-w-0">
                    <Briefcase className="w-3 h-3 text-gray-400 shrink-0" />
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-300 truncate">{person.isEarning ? person.occupation : "No Income"}</span>
                  </div>
                  <div className="bg-green-50/50 dark:bg-green-900/10 p-2 rounded-xl border border-green-100 dark:border-green-900/20 flex items-center gap-2 min-w-0">
                    <IndianRupee className="w-3 h-3 text-green-600 shrink-0" />
                    <span className="text-[10px] font-bold text-green-700 dark:text-green-400 truncate">₹{person.totalFamilyIncome}/Mo</span>
                  </div>
               </div>

              {/* DETAILS */}
              <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl space-y-3 mb-5 border border-gray-100 dark:border-gray-800 w-full min-w-0">
                <div className="flex justify-between items-center gap-3 w-full min-w-0">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
                    <CreditCard className="w-4 h-4 shrink-0" />
                    Aadhaar
                  </span>
                  <span className="font-mono text-sm font-bold text-gray-900 dark:text-gray-100 truncate">
                    {formatAadhaar(person.aadharNumber)}
                  </span>
                </div>
                
                <div className="h-px bg-gray-200 dark:bg-gray-700 w-full" />

                <div className="flex justify-between items-center gap-3 w-full min-w-0">
                  <span className="flex items-center gap-2 text-xs font-bold text-gray-500 uppercase tracking-wider shrink-0">
                    <Phone className="w-4 h-4 text-blue-500 shrink-0" />
                    Mobile
                  </span>
                  <span className="font-bold text-gray-900 dark:text-gray-100 truncate">{person.mobileNumber}</span>
                </div>   
              </div>

              {/* ACTIONS */}
              <div className="space-y-3 w-full">
                <button
                  onClick={() => handleDistribute(person)}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-4 rounded-2xl font-black flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-lg shadow-green-200 dark:shadow-none text-lg min-w-0"
                >
                  <CheckCircle2 className="w-6 h-6 shrink-0" />
                  <span className="truncate">MARK GIVEN</span>
                </button>

                <button
                  onClick={() => handleViewProfile(person._id)}
                  disabled={viewingProfileId === person._id}
                  className="flex items-center justify-center gap-2 w-full py-2 text-sm font-bold text-gray-400 hover:text-purple-600 transition-colors disabled:opacity-50 min-w-0"
                >
                  {viewingProfileId === person._id ? (
                    <>
                      <span className="truncate">Opening Profile</span> <Loader2 className="w-3.5 h-3.5 animate-spin shrink-0" />
                    </>
                  ) : (
                    <>
                      <span className="truncate">View Full Profile</span> <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                    </>
                  )}
                </button>
              </div>
            </div>
            );
          })}
        </div>
      )}

      {/* CONFIRM MODAL */}
      {showConfirm && selectedPerson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-sm space-y-6 shadow-2xl animate-in zoom-in-95 duration-200 min-w-0">
            <h2 className="font-black text-xl text-center text-gray-900 dark:text-white truncate">
              Confirm Distribution
            </h2>

            <div className="bg-gray-50 dark:bg-gray-800 rounded-2xl p-4 text-sm space-y-3 border border-gray-100 dark:border-gray-700 w-full min-w-0">
              <div className="flex justify-between border-b border-gray-200 dark:border-gray-700 pb-2 gap-3 w-full min-w-0">
                <span className="text-gray-500 font-bold shrink-0">Token</span>
                <span className="font-black text-purple-600 text-lg leading-none truncate">#{selectedPerson.todayStatus?.tokenNumber}</span>
              </div>
              {/* FIX 5: break-all inside Modal */}
              <div className="flex justify-between gap-3 w-full min-w-0 items-start">
                <span className="text-gray-500 font-bold shrink-0 mt-0.5">Name</span>
                <span className="font-bold text-right dark:text-white min-w-0 break-all max-w-[70%]">{selectedPerson.fullName}</span>
              </div>
              <div className="flex justify-between gap-3 w-full min-w-0 items-center">
                <span className="text-gray-500 font-bold shrink-0">Aadhar</span>
                <span className="font-bold font-mono text-right dark:text-white truncate">{formatAadhaar(selectedPerson.aadharNumber)}</span>
              </div>
              <div className="flex justify-between gap-3 w-full min-w-0 items-center">
                <span className="text-gray-500 font-bold shrink-0">Mobile</span>
                <span className="font-bold font-mono text-right dark:text-white truncate">{selectedPerson.mobileNumber}</span>
              </div>
            </div>

            <div className="flex gap-3 w-full">
              <button
                onClick={() => setShowConfirm(false)}
                disabled={processing}
                className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 font-bold rounded-xl active:scale-95 transition-transform border border-gray-200 dark:border-gray-700 min-w-0"
              >
                <span className="truncate">Cancel</span>
              </button>
              <button
                onClick={confirmDistribution}
                disabled={processing}
                className="flex-1 py-3.5 bg-green-600 text-white font-black rounded-xl flex items-center justify-center gap-2 active:scale-95 transition-transform shadow-md min-w-0"
              >
                {processing ? <Loader2 className="animate-spin w-5 h-5 shrink-0" /> : <span className="truncate">Confirm</span>}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* SUCCESS MODAL */}
      {showSuccess && selectedPerson && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-8 w-full max-w-sm text-center space-y-4 shadow-2xl animate-in zoom-in-90 duration-300 border-4 border-green-500 min-w-0">
            <div className="w-20 h-20 bg-green-100 dark:bg-green-900/30 rounded-full flex items-center justify-center mx-auto mb-2 shrink-0">
                <CheckCircle2 className="w-10 h-10 text-green-500 shrink-0" />
            </div>

            <h2 className="font-black text-2xl text-gray-900 dark:text-white truncate">Success!</h2>
            
            <div className="text-gray-500 w-full min-w-0">
                {/* FIX 6: break-all on success name */}
                <p className="font-bold text-gray-800 dark:text-gray-200 break-all line-clamp-2 max-w-full">{selectedPerson.fullName}</p>
                <p className="text-sm mt-1 font-bold truncate">Token #{selectedPerson.todayStatus?.tokenNumber} completed.</p>
            </div>

            <button
              onClick={() => setShowSuccess(false)}
              className="w-full py-4 mt-2 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl active:scale-95 transition-transform shadow-md min-w-0"
            >
              <span className="truncate">Continue Next</span>
            </button>
          </div>
        </div>
      )}
    </div>
  );
}