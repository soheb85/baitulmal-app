/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { resetDailyQueue, resetSingleUserQueue } from "@/app/actions/admin/queueActions";
import { searchForOverride } from "@/app/actions/admin/overrideAction"; // Reusing your search!
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, RotateCcw, AlertTriangle, 
  CalendarDays, Trash2, Loader2, CheckCircle2,
  Users, UserX, Search, X
} from "lucide-react";

export default function ResetQueuePage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  // Tabs
  const [activeTab, setActiveTab] = useState<"BULK" | "SINGLE">("BULK");

  // Bulk State
  const [targetDate, setTargetDate] = useState(() => new Date().toISOString().split('T')[0]);
  const [resetCounter, setResetCounter] = useState(false);
  const [bulkResult, setBulkResult] = useState<{ count: number } | null>(null);

  // Single State
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  const [singleResult, setSingleResult] = useState<{ message: string } | null>(null);

  // Global State
  const [loading, setLoading] = useState(false);
  const [showConfirm, setShowConfirm] = useState(false);

  // --- HANDLERS ---
  const handleBulkExecute = async () => {
    setLoading(true);
    const res = await resetDailyQueue(targetDate, resetCounter);
    if (res.success) {
      setBulkResult({ count: res.clearedCount ?? 0 });
      setShowConfirm(false);
    } else {
      alert("Error: " + res.message);
    }
    setLoading(false);
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSelectedUser(null);
    setSingleResult(null);
    const results = await searchForOverride(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const handleSingleExecute = async () => {
    setLoading(true);
    const res = await resetSingleUserQueue(selectedUser._id);
    if (res.success) {
      setSingleResult({ message: res.message });
      setShowConfirm(false);
      setSelectedUser(null); // Clear selected to show success clearly
    } else {
      alert("Error: " + res.message);
    }
    setLoading(false);
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
            <h1 className="text-lg font-black text-red-600 flex items-center gap-2">
              <RotateCcw className="w-4 h-4" /> Reset Queue
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Emergency Clear Tool</p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl mb-6">
          <button 
            onClick={() => setActiveTab("BULK")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "BULK" ? "bg-white dark:bg-gray-900 text-red-600 shadow-sm" : "text-gray-500"}`}
          >
            <Users className="w-4 h-4" /> Bulk Wipe
          </button>
          <button 
            onClick={() => setActiveTab("SINGLE")}
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-xs font-bold transition-all ${activeTab === "SINGLE" ? "bg-white dark:bg-gray-900 text-orange-600 shadow-sm" : "text-gray-500"}`}
          >
            <UserX className="w-4 h-4" /> Single Profile
          </button>
        </div>

        {/* --- TAB 1: BULK MODE --- */}
        {activeTab === "BULK" && (
          <div className="animate-in fade-in slide-in-from-left-4">
            {!bulkResult ? (
              <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm space-y-6">
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 flex gap-3">
                  <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />
                  <div>
                    <p className="text-xs font-bold text-red-800 dark:text-red-400 uppercase tracking-widest">Bulk Wipe</p>
                    <p className="text-xs text-red-600/80 dark:text-red-400/80 mt-1 leading-relaxed font-medium">
                      Finds everyone stuck in <strong className="font-black">CHECKED_IN</strong> for the selected date and clears their token.
                    </p>
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1">Target Queue Date</label>
                  <div className="relative">
                    <CalendarDays className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                    <input 
                      type="date" 
                      value={targetDate}
                      onChange={(e) => setTargetDate(e.target.value)}
                      className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent outline-none focus:border-red-500 font-bold text-gray-900 dark:text-white"
                    />
                  </div>
                </div>

                <div 
                  onClick={() => setResetCounter(!resetCounter)}
                  className={`p-4 rounded-2xl border-2 cursor-pointer transition-all flex items-center justify-between ${resetCounter ? 'border-red-500 bg-red-50 dark:bg-red-900/20' : 'border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-800'}`}
                >
                  <div>
                    <p className={`font-bold text-sm ${resetCounter ? 'text-red-700 dark:text-red-400' : 'text-gray-700 dark:text-gray-300'}`}>
                      Reset Token Counter to 0
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">Next check-in gets Token #1</p>
                  </div>
                  <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center ${resetCounter ? 'border-red-500 bg-red-500' : 'border-gray-300'}`}>
                    {resetCounter && <div className="w-2.5 h-2.5 bg-white rounded-full" />}
                  </div>
                </div>

                <button 
                  onClick={() => setShowConfirm(true)}
                  className="w-full py-4 bg-red-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                >
                  <Trash2 className="w-5 h-5" /> PREPARE BULK RESET
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-gray-900 rounded-[2.5rem] p-8 border shadow-xl text-center animate-in zoom-in-95">
                 <CheckCircle2 className="w-20 h-20 text-green-500 mx-auto mb-4" />
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white">Queue Cleared</h2>
                 <p className="text-gray-500 text-sm font-medium mt-2">
                   Removed <strong className="text-gray-900 dark:text-white text-lg">{bulkResult.count}</strong> stuck people from {targetDate}.
                 </p>
                 {resetCounter && (
                   <p className="text-xs font-bold text-orange-500 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg mt-4 inline-block">
                     Token Counter Reset to 0
                   </p>
                 )}
                 <button onClick={() => setBulkResult(null)} className="w-full mt-8 py-4 bg-gray-100 dark:bg-gray-800 text-gray-900 dark:text-white font-black rounded-xl active:scale-95 transition-transform">
                   Do another bulk reset
                 </button>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: SINGLE MODE --- */}
        {activeTab === "SINGLE" && (
          <div className="animate-in fade-in slide-in-from-right-4 space-y-6">
            
            {/* Success Message for Single */}
            {singleResult && (
              <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center gap-3">
                <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
                <p className="text-sm font-bold text-green-800 dark:text-green-400">{singleResult.message}</p>
              </div>
            )}

            {/* Search Box */}
            <form onSubmit={handleSearch} className="relative">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search Name, Mobile, Aadhaar..."
                className="w-full p-4 pl-5 pr-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-bold outline-none focus:border-orange-500 shadow-sm"
              />
              <button type="submit" disabled={isSearching} className="absolute right-2 top-2 bottom-2 px-4 bg-orange-50 dark:bg-orange-900/30 text-orange-600 rounded-xl flex items-center justify-center">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </form>

            {/* Search Results Map */}
            {!selectedUser && searchResults.length > 0 && (
              <div className="space-y-3">
                {searchResults.map((user) => {
                  const hasQueueData = user.todayStatus?.status;
                  return (
                    <button 
                      key={user._id}
                      onClick={() => setSelectedUser(user)}
                      className="w-full text-left bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex flex-col active:scale-95 transition-transform shadow-sm"
                    >
                      <p className="font-black text-gray-900 dark:text-white">{user.fullName}</p>
                      <p className="text-[10px] text-gray-500 font-bold mt-1">Mobile: {user.mobileNumber} | Aadhar: {user.aadharNumber}</p>
                      {hasQueueData ? (
                        <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-orange-50 dark:bg-orange-900/20 border border-orange-100 dark:border-orange-900/30 w-fit">
                          <span className="w-2 h-2 rounded-full bg-orange-500 animate-pulse"></span>
                          <p className="text-[10px] font-black text-orange-600 uppercase tracking-widest">In Queue (Token: {user.todayStatus.tokenNumber})</p>
                        </div>
                      ) : (
                        <div className="mt-3 inline-flex items-center gap-2 px-2 py-1 rounded bg-gray-100 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 w-fit">
                           <p className="text-[10px] font-black text-gray-500 uppercase tracking-widest">Not in Queue</p>
                        </div>
                      )}
                    </button>
                  );
                })}
              </div>
            )}

            {/* Selected User View */}
            {selectedUser && (
              <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-md">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{selectedUser.fullName}</h3>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase">Target Profile</p>
                  </div>
                  <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl">
                    <X className="w-4 h-4" />
                  </button>
                </div>

                <div className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl mb-6 space-y-3">
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 font-bold">Queue Status</span>
                    <span className={`text-xs font-black ${selectedUser.todayStatus?.status ? "text-orange-500" : "text-gray-400"}`}>
                      {selectedUser.todayStatus?.status || "NULL"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 font-bold">Token Number</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      {selectedUser.todayStatus?.tokenNumber || "NULL"}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-xs text-gray-500 font-bold">Queue Date</span>
                    <span className="text-xs font-black text-gray-900 dark:text-white">
                      {selectedUser.todayStatus?.queueDate || "NULL"}
                    </span>
                  </div>
                </div>

                {!selectedUser.todayStatus?.status ? (
                  <button disabled className="w-full py-4 bg-gray-200 dark:bg-gray-800 text-gray-400 font-black rounded-xl">
                    Nothing to Clear
                  </button>
                ) : (
                  <button 
                    onClick={() => setShowConfirm(true)}
                    className="w-full py-4 bg-orange-600 text-white font-black rounded-xl shadow-lg active:scale-95 transition-transform flex items-center justify-center gap-2"
                  >
                    <UserX className="w-5 h-5" /> CLEAR QUEUE STATUS
                  </button>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* --- CONFIRM MODAL (Used for both modes) --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-red-500 animate-in zoom-in-95">
            <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-3" />
            <h2 className="font-black text-lg mb-1 text-gray-900 dark:text-white">Confirm Removal</h2>
            
            {activeTab === "BULK" ? (
              <p className="text-[11px] text-gray-500 font-medium mb-5 leading-relaxed">
                Are you sure you want to clear the pending queue for <strong className="text-red-500">{targetDate}</strong>? This cannot be undone.
              </p>
            ) : (
              <p className="text-[11px] text-gray-500 font-medium mb-5 leading-relaxed">
                Clear queue and token data for <strong className="text-red-500">{selectedUser?.fullName}</strong>?
              </p>
            )}

            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} disabled={loading} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500">Cancel</button>
              <button 
                onClick={activeTab === "BULK" ? handleBulkExecute : handleSingleExecute} 
                disabled={loading} 
                className="flex-1 py-3 bg-red-600 text-white font-black text-sm rounded-xl flex justify-center items-center gap-2"
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}