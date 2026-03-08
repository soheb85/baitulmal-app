/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react";
import { 
  searchForBulkDelete, 
  executeBulkDelete, 
  getTotalBeneficiaryCount, 
  executeWipeAll 
} from "@/app/actions/admin/bulkDeleteActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Trash2, Search, Loader2, 
  AlertOctagon, CheckSquare, Square, XCircle, CheckCircle2,
  ListFilter, Skull
} from "lucide-react";

function BulkDeleteContent() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  // Tabs: SEARCH vs WIPE_ALL
  const [activeTab, setActiveTab] = useState<"SEARCH" | "WIPE_ALL">("SEARCH");

  // --- Tab 1 State (Search & Select) ---
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [selectedIds, setSelectedIds] = useState<string[]>([]);
  
  // --- Tab 2 State (Wipe All) ---
  const [totalCount, setTotalCount] = useState<number | null>(null);
  const [confirmText, setConfirmText] = useState("");

  // --- Global Action State ---
  const [isDeleting, setIsDeleting] = useState(false);
  const [showConfirmModal, setShowConfirmModal] = useState(false);
  const [resultMsg, setResultMsg] = useState<{ count: number; mode: string } | null>(null);

  // Fetch total count when WIPE_ALL tab is clicked
  useEffect(() => {
    if (activeTab === "WIPE_ALL" && totalCount === null) {
      getTotalBeneficiaryCount().then(res => {
        if (res.success) setTotalCount(res.count ?? 0);
      });
    }
  }, [activeTab, totalCount]);

  // --- HANDLERS FOR TAB 1 ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    setIsSearching(true);
    setResultMsg(null);
    const results = await searchForBulkDelete(searchQuery);
    setSearchResults(results);
    setSelectedIds([]);
    setIsSearching(false);
  };

  const toggleSelection = (id: string) => {
    setSelectedIds(prev => prev.includes(id) ? prev.filter(selectedId => selectedId !== id) : [...prev, id]);
  };

  const handleSelectAll = () => {
    if (selectedIds.length === searchResults.length) setSelectedIds([]);
    else setSelectedIds(searchResults.map(user => user._id));
  };

  // --- EXECUTE ACTIONS ---
  const performDelete = async () => {
    setIsDeleting(true);
    
    if (activeTab === "SEARCH") {
      const res = await executeBulkDelete(selectedIds);
      if (res.success) {
        setResultMsg({ count: res.deletedCount ?? 0, mode: "selective" });
        setSearchResults(prev => prev.filter(user => !selectedIds.includes(user._id)));
        setSelectedIds([]);
      } else alert("Error: " + res.message);
    } 
    else if (activeTab === "WIPE_ALL") {
      const res = await executeWipeAll();
      if (res.success) {
        setResultMsg({ count: res.deletedCount ?? 0, mode: "wipe" });
        setTotalCount(0); // Reset local count
        setConfirmText("");
      } else alert("Error: " + res.message);
    }
    
    setShowConfirmModal(false);
    setIsDeleting(false);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  const isAllSelected = searchResults.length > 0 && selectedIds.length === searchResults.length;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative">
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-black text-rose-600 flex items-center gap-2">
              <Trash2 className="w-4 h-4" /> Bulk Delete
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Danger Zone Tool</p>
          </div>
        </div>

        {/* Success Message */}
        {resultMsg && (
          <div className="bg-green-50 dark:bg-green-900/20 p-4 rounded-2xl border border-green-100 dark:border-green-900/30 flex items-center gap-3 mb-6 animate-in fade-in">
            <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" />
            <div>
              <p className="text-sm font-bold text-green-800 dark:text-green-400">Successfully deleted {resultMsg.count} records.</p>
              <p className="text-[10px] text-green-600 font-bold uppercase mt-0.5">{resultMsg.mode === "wipe" ? "Database wiped" : "Selective deletion"}</p>
            </div>
          </div>
        )}

        {/* TABS */}
        <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl mb-6 shadow-inner">
          <button 
            onClick={() => setActiveTab("SEARCH")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "SEARCH" ? "bg-white dark:bg-gray-900 text-rose-600 shadow-sm" : "text-gray-500"}`}
          >
            <ListFilter className="w-4 h-4" /> Search & Select
          </button>
          <button 
            onClick={() => setActiveTab("WIPE_ALL")}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "WIPE_ALL" ? "bg-rose-600 text-white shadow-sm" : "text-gray-500"}`}
          >
            <Skull className="w-4 h-4" /> Wipe Database
          </button>
        </div>

        {/* --- TAB 1: SEARCH & SELECT --- */}
        {activeTab === "SEARCH" && (
          <div className="animate-in slide-in-from-left-4">
            <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-2xl border border-rose-100 dark:border-rose-900/30 flex gap-3 mb-6">
              <AlertOctagon className="w-5 h-5 text-rose-600 shrink-0" />
              <p className="text-[10px] text-rose-800 dark:text-rose-400 leading-relaxed font-bold">
                Search by Name, Mobile, Aadhaar, Area, or Status (e.g. type &quot;BLACKLISTED&quot; to select and delete all rejected users).
              </p>
            </div>

            <form onSubmit={handleSearch} className="relative mb-6">
              <input 
                type="text" 
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search criteria..."
                className="w-full p-4 pl-5 pr-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-bold outline-none focus:border-rose-500 shadow-sm"
              />
              <button type="submit" disabled={isSearching} className="absolute right-2 top-2 bottom-2 px-4 bg-rose-50 dark:bg-rose-900/30 text-rose-600 rounded-xl flex items-center justify-center">
                {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
              </button>
            </form>

            {searchResults.length > 0 && (
              <div className="space-y-4 animate-in fade-in">
                <div className="flex items-center justify-between bg-gray-200 dark:bg-gray-800 p-3 rounded-xl shadow-inner">
                  <button onClick={handleSelectAll} className="flex items-center gap-2 text-sm font-black text-gray-700 dark:text-gray-300 active:scale-95 transition-transform">
                    {isAllSelected ? <CheckSquare className="w-5 h-5 text-rose-600" /> : <Square className="w-5 h-5 text-gray-500" />}
                    {isAllSelected ? "Deselect All" : "Select All"}
                  </button>
                  <span className="text-[10px] font-black uppercase tracking-widest text-gray-500">
                    {selectedIds.length} / {searchResults.length} Selected
                  </span>
                </div>

                <div className="space-y-2">
                  {searchResults.map((user) => {
                    const isSelected = selectedIds.includes(user._id);
                    return (
                      <div 
                        key={user._id}
                        onClick={() => toggleSelection(user._id)}
                        className={`w-full text-left p-4 rounded-2xl border flex items-center justify-between cursor-pointer transition-all ${isSelected ? "bg-rose-50 dark:bg-rose-900/20 border-rose-300 dark:border-rose-700" : "bg-white dark:bg-gray-900 border-gray-100 dark:border-gray-800 hover:border-gray-300"}`}
                      >
                        <div className="flex items-center gap-4 min-w-0 pr-2">
                          {isSelected ? <CheckSquare className="w-5 h-5 text-rose-600 shrink-0" /> : <Square className="w-5 h-5 text-gray-300 dark:text-gray-600 shrink-0" />}
                          <div className="min-w-0">
                            <p className="font-black text-gray-900 dark:text-white text-sm truncate">{user.fullName}</p>
                            <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate">Area: {user.area || user.currentPincode} | Mob: {user.mobileNumber}</p>
                            {user.status !== 'ACTIVE' && (
                               <span className="inline-block mt-1 text-[8px] font-black uppercase px-2 py-0.5 rounded bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400">Status: {user.status}</span>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
            
            {/* Floating Action for Search Mode */}
            {selectedIds.length > 0 && (
              <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-40 flex justify-center">
                <div className="w-full max-w-md">
                  <button onClick={() => setShowConfirmModal(true)} className="w-full py-4 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-2xl shadow-lg shadow-rose-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-center gap-2">
                    <XCircle className="w-5 h-5" /> DELETE {selectedIds.length} RECORDS
                  </button>
                </div>
              </div>
            )}
          </div>
        )}

        {/* --- TAB 2: WIPE DATABASE --- */}
        {activeTab === "WIPE_ALL" && (
          <div className="animate-in slide-in-from-right-4 space-y-6">
            <div className="bg-red-500 text-white p-6 rounded-[2rem] shadow-lg text-center relative overflow-hidden">
              <Skull className="absolute -right-4 -bottom-4 w-32 h-32 text-red-700/30 rotate-12" />
              <div className="relative z-10">
                <h2 className="text-xl font-black mb-1">NUCLEAR OPTION</h2>
                <p className="text-xs text-red-200 font-bold uppercase tracking-widest">Wipe Everything</p>
                
                <div className="mt-6 bg-red-800/40 p-4 rounded-2xl border border-red-400/30">
                  <p className="text-[10px] font-bold text-red-200 uppercase tracking-widest mb-1">Total Users Found</p>
                  {totalCount === null ? (
                    <Loader2 className="w-8 h-8 animate-spin text-white mx-auto" />
                  ) : (
                    <p className="text-5xl font-black">{totalCount}</p>
                  )}
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-red-200 dark:border-red-900/30 shadow-sm text-center">
              <p className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                To prevent accidental deletion, type <strong className="text-red-600">DELETE ALL</strong> below.
              </p>
              <input 
                type="text" 
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                placeholder="Type here..."
                className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 border-2 border-gray-200 dark:border-gray-700 text-center font-black text-rose-600 outline-none focus:border-rose-500 uppercase"
              />
              <button 
                onClick={() => setShowConfirmModal(true)}
                disabled={confirmText !== "DELETE ALL" || totalCount === 0}
                className="w-full mt-4 py-4 bg-red-600 hover:bg-red-700 disabled:bg-gray-200 dark:disabled:bg-gray-800 disabled:text-gray-400 text-white font-black rounded-xl shadow-lg transition-transform active:scale-95 flex items-center justify-center gap-2"
              >
                <AlertOctagon className="w-5 h-5" /> DESTROY ALL {totalCount} RECORDS
              </button>
            </div>
          </div>
        )}

      </div>

      {/* --- MASTER CONFIRM MODAL --- */}
      {showConfirmModal && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-rose-500 animate-in zoom-in-95">
            <AlertOctagon className="w-16 h-16 text-rose-500 mx-auto mb-3" />
            <h2 className="font-black text-xl mb-1 text-gray-900 dark:text-white">Final Warning</h2>
            
            <p className="text-xs text-gray-500 font-bold mb-6 leading-relaxed">
              {activeTab === "SEARCH" 
                ? `You are about to permanently delete ${selectedIds.length} records. This action cannot be undone.` 
                : `You are about to WIPE THE ENTIRE DATABASE (${totalCount} records). This action cannot be undone.`}
            </p>
            
            <div className="flex gap-2">
              <button onClick={() => setShowConfirmModal(false)} disabled={isDeleting} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500">Cancel</button>
              <button onClick={performDelete} disabled={isDeleting} className="flex-1 py-3.5 bg-rose-600 text-white font-black text-sm rounded-xl flex justify-center items-center shadow-md">
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "CONFIRM"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

export default function BulkDeletePage() {
  return (
    <Suspense fallback={<NavigationLoader message="Initializing Security Tools..." />}>
      <BulkDeleteContent />
    </Suspense>
  );
}