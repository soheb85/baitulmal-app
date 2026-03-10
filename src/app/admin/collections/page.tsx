/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getCollectionDashboardData, DateFilter } from "@/app/actions/admin/collectionActions";
import { getSession } from "@/app/actions/authActions";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Landmark, TrendingUp, PlusCircle, CheckSquare, 
  Building2, BookOpen, HeartHandshake, Clock, Hash, ShieldCheck, Activity, User
} from "lucide-react";

// --- TYPES ---
interface IStats {
  grandTotal: number;
  totalCash: number;
  totalOnline: number;
  pendingApprovals: number;
  pendingAmount?: number; // Optional in case backend isn't sending it yet
  funds: {
    baitulmal: { cash: number; online: number; total: number };
    madarsa: { cash: number; online: number; total: number };
    fitra: { cash: number; online: number; total: number };
  };
}

interface IDashboardData {
  success: boolean;
  stats: IStats;
  userWise: any[];
  recentChallans: any[];
}

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(amount || 0);
};

export default function CollectionsDashboard() {
  // FIXED: Changed "/ge" to "/dashboard"
  const { isNavigating, handleBack } = useBackNavigation("/");
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [filter, setFilter] = useState<DateFilter>("TODAY");
  const [data, setData] = useState<IDashboardData | null>(null);

  // Safely memoized data loader
  // Safely memoized data loader
  const loadData = useCallback(async (isInitial = false) => {
    if (!isInitial) setLoading(true);
    try {
      const userSession = await getSession();
      setSession(userSession);

      if (userSession?.hasCollectionAccess) {
        const res = await getCollectionDashboardData(filter);
        
        // FIX: Add check for res.stats and cast the type explicitly
        if (res.success && res.stats) {
          setData(res as IDashboardData);
        } else if (!res.success) {
          console.error("Failed to load:", res.message);
        }
      }
    } catch (error) {
      console.error("Dashboard error:", error);
    } finally {
      setLoading(false);
    }
  }, [filter]);

  useEffect(() => {
    loadData(true);
  }, [loadData]);

  if (isNavigating) return <NavigationLoader message="Routing..." />;
  if (loading && !data) return <NavigationLoader message="Loading Financial Data..." />;

  // Security Check
  if (!session?.hasCollectionAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-[#0B1120] font-outfit text-center px-6">
        <div className="bg-white dark:bg-[#151D2C] p-8 rounded-[2rem] border border-red-100 dark:border-red-900/30 shadow-xl max-w-sm w-full">
           <ShieldCheck className="w-16 h-16 text-red-500 mx-auto mb-4" />
           <h2 className="text-xl font-black text-gray-900 dark:text-white uppercase tracking-tight">Access Denied</h2>
           <p className="text-xs font-bold text-gray-500 mt-2">You do not have permission to view the Baitulmal Hub.</p>
           <button onClick={() => handleBack()} className="mt-6 w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl font-black text-[11px] uppercase tracking-widest active:scale-95 transition-transform">Go Back</button>
        </div>
      </div>
    );
  }

  // Safe fallback if data is null but loading finished
  if (!data) return null;

  const { stats, userWise, recentChallans } = data;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-[#0B1120] relative font-outfit">
      <div className="w-full h-full overflow-y-auto px-5 pt-8 pb-32">
        
        {/* Header Block */}
        <div className="mb-6">
          <div className="flex items-center gap-4 mb-6">
            <button onClick={() => handleBack()} className="p-3 bg-white dark:bg-white/5 rounded-2xl shadow-sm active:scale-90 transition-transform border border-gray-100 dark:border-transparent">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-2xl font-black text-gray-900 dark:text-white uppercase tracking-tight leading-none mb-1 flex items-center gap-2">
                <Landmark className="w-6 h-6 text-amber-500" /> Baitulmal
              </h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Hub</p>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="flex gap-3">
            {session.canSubmitCollection && (
              <button 
                onClick={() => handleBack("/admin/collections/submit")}
                className="flex-1 bg-white dark:bg-[#151D2C] text-gray-900 dark:text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-sm border border-gray-100 dark:border-white/5 active:scale-95 transition-transform"
              >
                <PlusCircle className="w-4 h-4 text-emerald-500" /> Challan
              </button>
            )}
            {session.canApproveCollection && (
              <button 
                onClick={() => handleBack("/admin/collections/approve")}
                className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3.5 rounded-2xl flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest shadow-lg shadow-amber-500/20 active:scale-95 transition-transform relative"
              >
                <CheckSquare className="w-4 h-4" /> Approve 
                {stats.pendingApprovals > 0 && (
                  <span className="absolute -top-2 -right-2 bg-rose-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-[#0B1120] font-black animate-pulse">
                    {stats.pendingApprovals}
                  </span>
                )}
              </button>
            )}
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="flex bg-gray-200 dark:bg-black/40 p-1.5 rounded-2xl border border-gray-100 dark:border-white/5 mb-6">
          {(["TODAY", "WEEK", "MONTH", "ALL"] as DateFilter[]).map((f) => (
            <button
              key={f}
              disabled={loading}
              onClick={() => setFilter(f)}
              className={`flex-1 py-2.5 text-[10px] font-black uppercase tracking-widest rounded-xl transition-all ${filter === f ? "bg-white dark:bg-white text-amber-600 dark:text-gray-900 shadow-sm" : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grand Total Card */}
        <div className="bg-gradient-to-br from-amber-500 to-amber-700 rounded-[2.5rem] p-7 text-white shadow-xl relative overflow-hidden mb-6">
          <TrendingUp className="absolute -right-6 -top-6 w-40 h-40 text-white/10 -rotate-12" />
          <div className="relative z-10">
            <p className="text-[10px] font-black text-amber-100 uppercase tracking-widest flex items-center gap-1.5 mb-1 opacity-90">
               Total Verified Collection
            </p>
            <h2 className="text-4xl font-black tracking-tight">{formatMoney(stats.grandTotal)}</h2>
            
            <div className="flex gap-3 mt-6">
              <div className="flex-1 bg-black/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/10">
                <p className="text-[9px] text-amber-200 uppercase font-black tracking-widest mb-1">Cash In Hand</p>
                <p className="text-base font-black">{formatMoney(stats.totalCash)}</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-md p-3.5 rounded-2xl border border-white/20 shadow-inner">
                <p className="text-[9px] text-white uppercase font-black tracking-widest mb-1">Online Tfr</p>
                <p className="text-base font-black">{formatMoney(stats.totalOnline)}</p>
              </div>
            </div>

            {/* Pending Amount Warning (If data exists) */}
            {(stats.pendingAmount || 0) > 0 && (
               <div className="mt-4 bg-red-500/80 backdrop-blur-md border border-red-300/50 p-3 rounded-xl flex items-center justify-between shadow-inner">
                  <span className="text-[9px] font-black uppercase tracking-widest text-red-100 flex items-center gap-1.5"><Clock className="w-3 h-3"/> Pending Verification</span>
                  <span className="font-black text-sm text-white">{formatMoney(stats.pendingAmount || 0)}</span>
               </div>
            )}
          </div>
        </div>

        {/* Fund Breakdown List */}
        <div className="space-y-3 mb-8">
          <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><Activity className="w-3 h-3"/> Account Breakdown</h3>
          <FundCard icon={<Building2 className="w-5 h-5"/>} title="Baitulmal Fund" cash={stats.funds.baitulmal.cash} online={stats.funds.baitulmal.online} total={stats.funds.baitulmal.total} color="emerald" />
          <FundCard icon={<BookOpen className="w-5 h-5"/>} title="Madarsa Fund" cash={stats.funds.madarsa.cash} online={stats.funds.madarsa.online} total={stats.funds.madarsa.total} color="blue" />
          <FundCard icon={<HeartHandshake className="w-5 h-5"/>} title="Fitra Tokens" cash={stats.funds.fitra.cash} online={stats.funds.fitra.online} total={stats.funds.fitra.total} color="purple" />
        </div>

        {/* Recent Activity */}
        <div className="space-y-4 mb-8">
          <div className="flex items-center justify-between ml-1">
             <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Recent Activity</h3>
             <span className="text-[9px] font-bold text-gray-400 bg-gray-200 dark:bg-white/5 px-2 py-0.5 rounded-md uppercase">Last 15</span>
          </div>

          {recentChallans.length === 0 ? (
            <div className="text-center py-10 opacity-40 bg-white dark:bg-[#151D2C] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
               <ShieldCheck className="w-10 h-10 mx-auto mb-2 text-gray-400" />
               <p className="text-[10px] font-black uppercase tracking-widest">No activity found</p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentChallans.map((ch: any) => (
                <div key={ch._id} className="bg-white dark:bg-[#151D2C] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm transition-transform hover:scale-[1.01]">
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-1.5">
                      <span className="text-[8px] font-black text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-900/20 px-2 py-1 rounded-md uppercase tracking-widest border border-blue-100 dark:border-transparent">
                        {ch.challanNumber}
                      </span>
                      <p className="text-sm mt-1.5 ml-1 font-black text-gray-900 dark:text-white leading-tight">{ch.submittedByName}</p>
                    </div>
                    <span className={`text-[8px] font-black px-2.5 py-1 rounded-full uppercase tracking-widest ${ch.status === 'APPROVED' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400' : ch.status === 'REJECTED' ? 'bg-rose-50 text-rose-600 dark:bg-rose-900/20 dark:text-rose-400' : 'bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 animate-pulse'}`}>
                      {ch.status}
                    </span>
                  </div>

                  {/* DYNAMIC BOOK BADGES */}
                  <div className="flex flex-wrap gap-2 mb-4">
                     {ch.baitulmalReceiptBookNumber && (
                       <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                          <Hash className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase">B: {ch.baitulmalReceiptBookNumber}</span>
                       </div>
                     )}
                     {ch.madarsaReceiptBookNumber && (
                       <div className="flex items-center gap-1.5 bg-gray-50 dark:bg-black/20 text-gray-600 dark:text-gray-300 px-2.5 py-1 rounded-lg border border-gray-200 dark:border-white/5">
                          <Hash className="w-3 h-3" />
                          <span className="text-[9px] font-black uppercase">M: {ch.madarsaReceiptBookNumber}</span>
                       </div>
                     )}
                  </div>

                  <div className="flex justify-between items-center pt-3 border-t border-gray-100 dark:border-white/5">
                    <div className="flex items-center gap-1.5 text-gray-400">
                      <Clock className="w-3 h-3" />
                      <span className="text-[9px] font-bold uppercase tracking-wider">{new Date(ch.collectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                    </div>
                    <p className="text-sm font-black text-gray-900 dark:text-white">{formatMoney(ch.grandTotal)}</p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Top Collectors Leaderboard */}
        {userWise.length > 0 && (
          <div className="space-y-4 pt-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1.5"><User className="w-3 h-3"/> Top Collectors</h3>
            <div className="bg-white dark:bg-[#151D2C] rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm divide-y divide-gray-50 dark:divide-white/5 overflow-hidden">
              {userWise.map((user: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-white/5 transition-colors">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-black/20 flex items-center justify-center text-gray-500 font-black text-sm border border-gray-100 dark:border-transparent">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-900 dark:text-white leading-tight">{user.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase tracking-wider mt-0.5">{user.challanCount} Approved</p>
                    </div>
                  </div>
                  <p className="font-black text-amber-600 dark:text-amber-500 text-sm">{formatMoney(user.total)}</p>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </main>
  );
}

// --- HELPER COMPONENTS ---

function FundCard({ icon, title, cash, online, total, color }: any) {
  const colorStyles: any = {
    emerald: "bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-transparent",
    blue: "bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-transparent",
    purple: "bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400 border-purple-100 dark:border-transparent"
  };

  return (
    <div className="bg-white dark:bg-[#151D2C] p-4 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm flex items-center gap-4 transition-transform hover:scale-[1.01]">
      <div className={`p-3.5 rounded-[1.25rem] border ${colorStyles[color]} shrink-0`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0 pr-2">
        <p className="font-black text-gray-900 dark:text-white text-sm truncate leading-tight">{title}</p>
        <div className="flex gap-3 mt-1.5 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
          <span>Cash: <span className="text-gray-800 dark:text-gray-300 font-black">{formatMoney(cash)}</span></span>
          <span>Online: <span className="text-gray-800 dark:text-gray-300 font-black">{formatMoney(online)}</span></span>
        </div>
      </div>
      <p className="font-black text-sm text-gray-900 dark:text-white shrink-0">{formatMoney(total)}</p>
    </div>
  );
}