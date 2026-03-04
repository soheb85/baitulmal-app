/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
// 1. Remove Link import
// import Link from "next/link";
import { getBeneficiaries } from "@/app/actions/getBeneficiaries";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  User,
  Loader2,
  CreditCard,
  Filter,
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation"; // <--- Import Hook
import NavigationLoader from "@/components/ui/NavigationLoader"; // <--- Import Component

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

// --- Component: Skeleton Card ---
const SkeletonCard = () => (
  <div className="w-full bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm animate-pulse flex items-center justify-between gap-4">
    <div className="w-14 h-14 bg-gray-200 dark:bg-gray-800 rounded-2xl shrink-0" />
    <div className="flex-1 min-w-0 py-1 space-y-3">
      <div className="h-4 bg-gray-200 dark:bg-gray-800 rounded-full w-3/4" />
      <div className="h-3 bg-gray-100 dark:bg-gray-800/50 rounded-full w-1/2" />
    </div>
    <div className="w-8 h-8 bg-gray-100 dark:bg-gray-800 rounded-full shrink-0" />
  </div>
);

export default function BeneficiariesListPage() {
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  // Loading States
  const [initialLoading, setInitialLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const debouncedSearch = useDebounce(search, 500);

  // 2. Initialize Navigation Hook
  const { isNavigating, handleBack } = useBackNavigation("/");

  // --- Effect: Fetch Data ---
  useEffect(() => {
    let isActive = true;
    const fetchInitialData = async () => {
      setInitialLoading(true);
      const result = await getBeneficiaries(1, debouncedSearch, filter);

      if (isActive && result.success) {
        setList(result.beneficiaries);
        setHasMore(result.hasMore);
        setPage(1);
      }
      if (isActive) setInitialLoading(false);
    };

    fetchInitialData();
    return () => {
      isActive = false;
    };
  }, [debouncedSearch, filter]);

  // --- Handler: Load More ---
  const handleLoadMore = async () => {
    if (moreLoading || !hasMore) return;
    setMoreLoading(true);
    const nextPage = page + 1;
    const result = await getBeneficiaries(nextPage, debouncedSearch, filter);
    if (result.success) {
      setList((prev) => [...prev, ...result.beneficiaries]);
      setHasMore(result.hasMore);
      setPage(nextPage);
    }
    setMoreLoading(false);
  };

  // 3. Show Loader if navigating
  if (isNavigating) return <NavigationLoader message="Loading Profile..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col font-outfit">
      {/* --- Native-Like Header --- */}
      <div className="sticky top-0 z-20 bg-white/95 dark:bg-gray-950/95 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800 shadow-sm transition-all">
        <div className="px-4 pt-4 pb-3 flex items-center gap-3">
          {/* 4. Use handleBack for Back Button */}
          <button
            onClick={() => handleBack("/")}
            className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-6 h-6 text-gray-800 dark:text-gray-100" />
          </button>
          <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight">
            Beneficiary List
          </h1>
        </div>

        {/* Search & Filter Row */}
        <div className="px-4 pb-4 space-y-3">
          <div className="relative group">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 group-focus-within:text-blue-500 transition-colors" />
            <input
              type="text"
              placeholder="Search by Name, Mobile, Aadhaar..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-12 pr-4 py-3.5 bg-gray-100 dark:bg-gray-900 rounded-2xl text-base font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all placeholder:text-gray-400"
            />
          </div>

          <div className="flex gap-2 overflow-x-auto pb-1 no-scrollbar items-center">
            <Filter className="w-4 h-4 text-gray-400 mr-1 shrink-0" />
            {["ALL", "ACTIVE", "BLACKLISTED"].map((f) => (
              <button
                key={f}
                onClick={() => setFilter(f)}
                className={`px-5 py-2 rounded-full text-xs font-bold border transition-all whitespace-nowrap active:scale-95 ${
                  filter === f
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900 border-transparent shadow-lg"
                    : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800"
                }`}
              >
                {f === "ALL" ? "All" : f}
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* --- Full Width List Content --- */}
      <div className="flex-1 px-4 py-4 space-y-4">
        {initialLoading ? (
          <>
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
            <SkeletonCard />
          </>
        ) : (
          <>
            {list.map((item) => (
              // 5. Use handleBack to navigate to details page with loader
              <div
                key={item._id}
                onClick={() => handleBack(`/beneficiaries/${item._id}`)}
                className="block group cursor-pointer"
              >
                <div className="w-full bg-white dark:bg-gray-900 p-5 rounded-[1.5rem] border border-gray-100 dark:border-gray-800 shadow-sm active:scale-[0.98] transition-all flex items-center justify-between gap-4">
                  <div className="relative shrink-0">
                    <div
                      className={`w-14 h-14 rounded-2xl flex items-center justify-center font-black text-xl shadow-inner ${
                        item.status === "ACTIVE"
                          ? "bg-gradient-to-br from-green-50 to-green-100 text-green-700 dark:from-green-900/30 dark:to-green-900/10 dark:text-green-400"
                          : "bg-gradient-to-br from-red-50 to-red-100 text-red-700 dark:from-red-900/30 dark:to-red-900/10 dark:text-red-400"
                      }`}
                    >
                      {item.fullName.charAt(0).toUpperCase()}
                    </div>
                    <div
                      className={`absolute -bottom-1 -right-1 w-4 h-4 rounded-full border-2 border-white dark:border-gray-900 ${
                        item.status === "ACTIVE" ? "bg-green-500" : "bg-red-500"
                      }`}
                    />
                  </div>

                  <div className="flex-1 min-w-0 py-1">
                    <h3 className="font-bold text-lg text-gray-900 dark:text-white truncate leading-tight mb-1">
                      {item.fullName}
                    </h3>

                    <div className="flex items-center gap-3 text-sm text-gray-500 dark:text-gray-400 font-medium">
                      <span className="font-mono tracking-wide">
                        {item.mobileNumber}
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 mt-2">
                      <CreditCard className="w-3.5 h-3.5 text-gray-400" />
                      <span className="text-xs font-mono text-gray-400 font-medium tracking-wide">
                        •••{" "}
                        {item.aadharNumber
                          ? String(item.aadharNumber).slice(-4)
                          : "XXXX"}
                      </span>
                    </div>
                  </div>

                  <div className="shrink-0 flex items-center justify-center w-8 h-8 rounded-full bg-gray-50 dark:bg-gray-800 text-gray-400 group-hover:bg-blue-50 group-hover:text-blue-500 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </div>
                </div>
              </div>
            ))}

            {list.length === 0 && (
              <div className="flex flex-col items-center justify-center py-24 opacity-50">
                <div className="bg-gray-100 dark:bg-gray-800 p-6 rounded-full mb-4">
                  <User className="w-10 h-10 text-gray-400" />
                </div>
                <p className="text-base font-medium text-gray-500">
                  No beneficiaries found
                </p>
                <p className="text-xs text-gray-400 mt-1">
                  Try searching for a different name
                </p>
              </div>
            )}

            {hasMore && list.length > 0 && (
              <button
                onClick={handleLoadMore}
                disabled={moreLoading}
                className="w-full py-4 mt-6 text-sm font-black text-gray-500 bg-white border border-gray-200 dark:bg-gray-900 dark:border-gray-800 rounded-2xl disabled:opacity-50 active:scale-95 transition-all uppercase tracking-widest shadow-sm hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                {moreLoading ? (
                  <Loader2 className="w-5 h-5 animate-spin mx-auto" />
                ) : (
                  "Load More"
                )}
              </button>
            )}
          </>
        )}
      </div>
    </div>
  );
}