/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { getBeneficiaries } from "@/app/actions/getBeneficiaries";
import { Search, ArrowLeft, ChevronRight, User, Loader2, CreditCard } from "lucide-react";

// --- Helper: Debounce Hook (Prevents searching on every single keystroke) ---
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
  
  // Use the debounced value for the Effect (wait 500ms after typing)
  const debouncedSearch = useDebounce(search, 500);

  // --- EFFECT: Search or Filter Changes (Reset List) ---
  useEffect(() => {
    let isActive = true; // Prevents race conditions

    const fetchInitialData = async () => {
      setLoading(true);
      
      // Always fetch Page 1 when search/filter changes
      const result = await getBeneficiaries(1, debouncedSearch, filter);
      
      if (isActive && result.success) {
        setList(result.beneficiaries); // Overwrite list
        setHasMore(result.hasMore);
        setPage(1); // Reset page count
      }
      if (isActive) setLoading(false);
    };

    fetchInitialData();

    return () => { isActive = false; };
  }, [debouncedSearch, filter]); // Only run when these change

  // --- HANDLER: Load More Button (Append List) ---
  const handleLoadMore = async () => {
    if (loading || !hasMore) return;
    
    setLoading(true);
    const nextPage = page + 1;
    const result = await getBeneficiaries(nextPage, debouncedSearch, filter);
    
    if (result.success) {
      setList((prev) => [...prev, ...result.beneficiaries]); // Append to list
      setHasMore(result.hasMore);
      setPage(nextPage);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-20">
      
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-10 bg-white/90 dark:bg-gray-950/90 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-3">
           <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800">
             <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
           </Link>
           <h1 className="text-xl font-bold font-outfit text-gray-900 dark:text-white">All Beneficiaries</h1>
        </div>

        {/* Search Bar */}
        <div className="relative mb-3">
           <Search className="absolute left-3 top-3.5 w-4 h-4 text-gray-400" />
           <input 
             type="text" 
             placeholder="Search Name, Mobile, Aadhaar..." 
             value={search}
             onChange={(e) => setSearch(e.target.value)}
             className="w-full pl-10 pr-4 py-3 bg-gray-100 dark:bg-gray-900 rounded-xl text-sm font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
           />
        </div>

        {/* Filter Chips */}
        <div className="flex gap-2 overflow-x-auto pb-2 no-scrollbar">
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

      {/* --- List Content --- */}
      <div className="px-4 py-4 space-y-3">
         {list.map((item) => (
            <Link href={`/beneficiaries/${item._id}`} key={item._id}>
               <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-transform flex items-center justify-between">
                  
                  {/* Left Side: Avatar & Details */}
                  <div className="flex items-center gap-3 overflow-hidden">
                     <div className={`w-10 h-10 shrink-0 rounded-full flex items-center justify-center font-bold text-lg ${
                        item.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400'
                     }`}>
                        {item.fullName.charAt(0).toUpperCase()}
                     </div>
                     <div className="min-w-0">
                        <h3 className="font-bold text-gray-900 dark:text-gray-100 truncate">{item.fullName}</h3>
                        
                        <div className="flex items-center gap-2 text-xs text-gray-500 font-mono mt-0.5">
                           <span>{item.mobileNumber}</span>
                        </div>
                        
                        {/* Aadhaar Badge */}
                        <div className="flex items-center gap-1 text-[10px] text-gray-400 mt-1 bg-gray-50 dark:bg-gray-800 w-fit px-1.5 py-0.5 rounded border border-gray-100 dark:border-gray-700">
                           <CreditCard className="w-3 h-3" />
                           <span>{item.aadharNumber}</span>
                        </div>
                     </div>
                  </div>
                  
                  {/* Right Side: Status & Chevron */}
                  <div className="flex items-center gap-2 pl-2">
                     <span className={`text-[10px] font-bold px-2 py-1 rounded-md uppercase ${
                        item.status === 'ACTIVE' ? 'bg-green-50 text-green-600 dark:bg-green-900/20' : 'bg-red-50 text-red-600 dark:bg-red-900/20'
                     }`}>
                        {item.status === 'BLACKLISTED' ? 'BLOCKED' : item.status}
                     </span>
                     <ChevronRight className="w-4 h-4 text-gray-300" />
                  </div>
               </div>
            </Link>
         ))}

         {/* Empty State */}
         {!loading && list.length === 0 && (
            <div className="text-center py-20 opacity-50">
               <User className="w-12 h-12 mx-auto mb-2 text-gray-400" />
               <p>No beneficiaries found</p>
            </div>
         )}

         {/* Load More Button */}
         {hasMore && list.length > 0 && (
            <button 
              onClick={handleLoadMore}
              disabled={loading}
              className="w-full py-3 mt-4 text-sm font-semibold text-gray-500 bg-gray-100 dark:bg-gray-800 rounded-xl disabled:opacity-50 active:scale-95 transition-transform"
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin mx-auto"/> : "Load More"}
            </button>
         )}
      </div>
    </div>
  );
}