/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBeneficiaries } from "@/app/actions/getBeneficiaries";
import { Search, ArrowLeft, ChevronRight, User, Loader2, CreditCard } from "lucide-react";

// --- Helper: Debounce Hook ---
function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function BeneficiariesListPage() {
  // --- State ---
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [loading, setLoading] = useState(false);
  
  // Search & Filter State
  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");
  
  const debouncedSearch = useDebounce(search, 500);

  // --- EFFECT: Search or Filter Changes ---
  useEffect(() => {
    let isActive = true;

    const fetchInitialData = async () => {
      setLoading(true);
      const result = await getBeneficiaries(1, debouncedSearch, filter);
      
      if (isActive && result.success) {
        setList(result.beneficiaries);
        setHasMore(result.hasMore);
        setPage(1);
      }
      if (isActive) setLoading(false);
    };

    fetchInitialData();

    return () => { isActive = false; };
  }, [debouncedSearch, filter]);

  // --- HANDLER: Load More ---
  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    const nextPage = page + 1;
    const result = await getBeneficiaries(nextPage, debouncedSearch, filter);
    
    if (result.success) {
      setList((prev) => [...prev, ...result.beneficiaries]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* --- Sticky Header (Full Width) --- */}
      <div className="sticky top-0 z-10 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 pt-4 pb-2 shadow-sm">
        
        {/* Title Row */}
        <div className="flex items-center gap-2 mb-3">
           <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform">
             <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
           </Link>
           <h1 className="text-xl font-bold font-outfit text-gray-900 dark:text-white">All Beneficiaries</h1>
        </div>

        {/* Search Bar (Full Width) */}
        <div className="relative mb-3">
           <Search className="absolute left-3 top-3 w-4 h-4 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search Name, Mobile..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-400"
           />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar">
           {["ALL", "ACTIVE", "BLACKLISTED"].map(f => (
              <button 
                key={f}
                onClick={() => setFilter(f)}
                className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                   filter === f 
                   ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-gray-900" 
                   : "bg-transparent text-gray-500 border-gray-200 dark:border-gray-800"
                }`}
              >
                {f === "ALL" ? "All" : f}
              </button>
           ))}
        </div>
      </div>

      {/* --- List Content (Max Width Usage) --- */}
      <div className="px-3 py-3 space-y-3 w-full">
         {list.map((item) => (
            <Link href={`/beneficiaries/${item._id}`} key={item._id} className="block w-full">
               <div className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-transform flex items-center justify-between gap-3">
                  
                  {/* Left Side: Avatar & Details (Takes Available Space) */}
                  <div className="flex items-center gap-3 overflow-hidden flex-1">
                     {/* Avatar */}
                     <div className={`w-11 h-11 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${
                        item.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                     }`}>
                        {item.fullName.charAt(0).toUpperCase()}
                     </div>
                     
                     {/* Text Details */}
                     <div className="min-w-0 flex-1">
                        <h3 className="font-bold text-base text-gray-900 dark:text-gray-100 truncate leading-tight">
                            {item.fullName}
                        </h3>
                        
                        <div className="flex items-center gap-2 mt-1 text-xs text-gray-500 font-mono">
                           <span>{item.mobileNumber}</span>
                        </div>
                        
                        {/* Aadhaar Badge */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1.5 bg-gray-50 dark:bg-gray-800 w-fit px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                           <CreditCard className="w-3 h-3" />
                           <span className="truncate">{item.aadharNumber}</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Right Side: Status Badge (Pinned to Right) */}
                  <div className="flex flex-col items-end gap-1 shrink-0">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase tracking-wide border ${
                        item.status === 'ACTIVE' 
                        ? 'bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-900/50' 
                        : 'bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-900/50'
                     }`}>
                        {item.status === 'BLACKLISTED' ? 'BLOCKED' : item.status}
                     </span>
                     <ChevronRight className="w-4 h-4 text-gray-300 mt-1" />
                  </div>
               </div>
            </Link>
         ))}

         {/* Empty State */}
         {!loading && list.length === 0 && (
            <div className="text-center py-20 opacity-60">
               <User className="w-12 h-12 mx-auto mb-2 text-gray-300" />
               <p className="text-sm text-gray-500">No beneficiaries found</p>
            </div>
         )}

         {/* Load More Button */}
         {hasMore && list.length > 0 && (
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-3 mt-4 text-sm font-bold text-gray-500 bg-white border border-gray-200 dark:bg-gray-800 dark:border-gray-700 rounded-xl disabled:opacity-50 active:scale-95 transition-transform uppercase tracking-wide shadow-sm"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : "Load More Results"}
            </button>
         )}
      </div>
    </div>
  );
}