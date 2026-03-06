/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getBeneficiaries } from "@/app/actions/getBeneficiaries";
import {
  Search,
  ArrowLeft,
  ChevronRight,
  User,
  Loader2,
  CreditCard,
  Phone,
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";

function useDebounce(value: any, delay: number) {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => clearTimeout(handler);
  }, [value, delay]);

  return debouncedValue;
}

const formatAadhaar = (num: string) => {
  if (!num) return "";
  return num.replace(/(\d{4})(?=\d)/g, "$1 ");
};

const formatQueueDate = (date: string) => {
  if (!date) return "";

  const today = new Date().toISOString().split("T")[0];

  if (date === today) return "Today";

  return new Date(date).toLocaleDateString("en-IN", {
    day: "numeric",
    month: "short",
  });
};

export default function BeneficiariesListPage() {
  const [list, setList] = useState<any[]>([]);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  const [initialLoading, setInitialLoading] = useState(true);
  const [moreLoading, setMoreLoading] = useState(false);

  const [search, setSearch] = useState("");
  const [filter, setFilter] = useState("ALL");

  const debouncedSearch = useDebounce(search, 400);

  const { isNavigating, handleBack } = useBackNavigation("/");

  useEffect(() => {
    let active = true;

    const load = async () => {
      setInitialLoading(true);

      const result = await getBeneficiaries(1, debouncedSearch, filter);

      if (active && result.success) {
        setList(result.beneficiaries);
        setHasMore(result.hasMore);
        setPage(1);
      }

      setInitialLoading(false);
    };

    load();

    return () => {
      active = false;
    };
  }, [debouncedSearch, filter]);

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

  if (isNavigating) return <NavigationLoader message="Opening profile..." />;

  const today = new Date().toISOString().split("T")[0];

  const total = list.length;
  const active = list.filter((x) => x.status === "ACTIVE").length;
  const blocked = list.filter((x) => x.status === "BLACKLISTED").length;
  const inQueue = list.filter(
    (x) => x.todayStatus?.status === "CHECKED_IN",
  ).length;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit">
      {/* HEADER */}
      <div className="sticky top-0 z-20 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-b border-gray-100 dark:border-gray-800">
        <div className="px-3 pt-4 pb-2 flex items-center gap-3">
          <button
            onClick={() => handleBack("/")}
            className="p-2 rounded-xl bg-gray-100 dark:bg-gray-900 active:scale-90 transition"
          >
            <ArrowLeft className="w-5 h-5" />
          </button>

          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white">
              Beneficiaries
            </h1>
            <p className="text-xs text-gray-400">Manage registered families</p>
          </div>
        </div>

        {/* SEARCH */}
        <div className="px-3 pb-3">
          <div className="relative">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400" />

            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search name, mobile or Aadhaar..."
              className="w-full pl-12 pr-4 py-3 rounded-2xl bg-gray-100 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 outline-none focus:ring-2 focus:ring-blue-500"
            />
          </div>
        </div>

        {/* FILTER */}
        <div className="px-3 pb-4 flex gap-2 overflow-x-auto">
          {["ALL", "ACTIVE", "BLACKLISTED"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition
              
              ${
                filter === f
                  ? "bg-blue-600 text-white border-transparent"
                  : "bg-white dark:bg-gray-900 text-gray-500 border-gray-200 dark:border-gray-800"
              }`}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* STATS */}
      <div className="grid grid-cols-4 gap-2 px-3 py-3">
        <div className="bg-white dark:bg-gray-900 rounded-xl p-3 text-center border">
          <p className="text-xs text-gray-400">Total</p>
          <p className="font-bold text-lg">{total}</p>
        </div>

        <div className="bg-green-50 dark:bg-green-900/20 rounded-xl p-3 text-center border">
          <p className="text-xs text-green-500">Active</p>
          <p className="font-bold text-lg">{active}</p>
        </div>

        <div className="bg-red-50 dark:bg-red-900/20 rounded-xl p-3 text-center border">
          <p className="text-xs text-red-500">Blocked</p>
          <p className="font-bold text-lg">{blocked}</p>
        </div>

        <div className="bg-purple-50 dark:bg-purple-900/20 rounded-xl p-3 text-center border">
          <p className="text-xs text-purple-500">In Queue</p>
          <p className="font-bold text-lg">{inQueue}</p>
        </div>
      </div>

      {/* LIST */}
      <div className="px-2 space-y-3 pb-10">
        {list.map((item) => {
          const token = item.todayStatus?.tokenNumber;
          const queueDate = item.todayStatus?.queueDate;
          const status = item.todayStatus?.status; // Check the status
          const isToday = queueDate === today;

          return (
            <div
              key={item._id}
              onClick={() => handleBack(`/beneficiaries/${item._id}`)}
              className="bg-white dark:bg-gray-900 rounded-2xl p-4 shadow-sm border flex items-center gap-3"
            >
              {/* AVATAR */}
              <div
                className={`w-12 h-12 rounded-xl flex items-center justify-center text-lg font-black
                ${
                  item.status === "ACTIVE"
                    ? "bg-green-100 text-green-700"
                    : "bg-red-100 text-red-700"
                }`}
              >
                {item.fullName.charAt(0)}
              </div>

              {/* INFO */}
              <div className="flex-1 min-w-0">
                <h3 className="font-bold text-gray-900 dark:text-white">
                  {item.fullName}
                </h3>

                {token && status && (
                  <div className="mt-1">
                    {/* CONDITION ADDED HERE */}
                    {status === "COLLECTED" ? (
                      <span className="text-xs font-bold px-2 py-1 rounded-lg bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400">
                        Ration Collected
                      </span>
                    ) : (
                      <span
                        className={`text-xs font-bold px-2 py-1 rounded-lg
                        ${
                          isToday
                            ? "bg-purple-600 text-white"
                            : "bg-gray-200 text-gray-600 dark:bg-gray-800 dark:text-gray-400"
                        }`}
                      >
                        Token #{token} • {formatQueueDate(queueDate)}
                      </span>
                    )}
                  </div>
                )}

                <div className="flex items-center gap-2 text-sm text-gray-500 mt-1">
                  <Phone className="w-3.5 h-3.5" />
                  {item.mobileNumber}
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-500">
                  <CreditCard className="w-3.5 h-3.5" />
                  {formatAadhaar(item.aadharNumber)}
                </div>
              </div>

              <ChevronRight className="w-5 h-5 text-gray-400" />
            </div>
          );
        })}

        {hasMore && (
          <button
            onClick={handleLoadMore}
            className="w-full py-3 mt-4 bg-white dark:bg-gray-900 border rounded-xl font-semibold"
          >
            {moreLoading ? (
              <Loader2 className="w-5 h-5 animate-spin mx-auto" />
            ) : (
              "Load More"
            )}
          </button>
        )}
      </div>
    </div>
  );
}