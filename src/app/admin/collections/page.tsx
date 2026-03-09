/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getCollectionDashboardData, DateFilter } from "@/app/actions/admin/collectionActions";
import { getSession } from "@/app/actions/authActions";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Landmark, TrendingUp, PlusCircle, CheckSquare, 
  Building2, BookOpen, HeartHandshake, User, Clock, Hash
} from "lucide-react";

const formatMoney = (amount: number) => {
  return new Intl.NumberFormat('en-IN', { 
    style: 'currency', 
    currency: 'INR', 
    maximumFractionDigits: 0 
  }).format(amount);
};

export default function CollectionsDashboard() {
  const { isNavigating, handleBack } = useBackNavigation("/dashboard");
  
  const [session, setSession] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<DateFilter>("TODAY");
  
  const [data, setData] = useState<any>(null);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const userSession = await getSession();
      setSession(userSession);

      if (userSession?.hasCollectionAccess) {
        const res = await getCollectionDashboardData(filter);
        if (res.success) setData(res);
      }
      setLoading(false);
    }
    load();
  }, [filter]);

  if (isNavigating) return <NavigationLoader message="Routing..." />;
  if (loading && !data) return <NavigationLoader message="Loading Financial Data..." />;

  // Security Check
  if (!session?.hasCollectionAccess) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <p className="text-red-500 font-bold">Unauthorized Access.</p>
      </div>
    );
  }

  const { stats, userWise, recentChallans } = data;

  return (
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit pb-24">
      {/* Header */}
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-6 sticky top-0 z-30">
        <div className="flex items-center gap-4 mb-4">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-black text-gray-900 dark:text-white flex items-center gap-2">
              <Landmark className="w-5 h-5 text-amber-600" /> Baitulmal Hub
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Financial Oversight</p>
          </div>
        </div>

        <div className="flex gap-3">
          {session.canSubmitCollection && (
            <button 
              onClick={() => handleBack("/admin/collections/submit")}
              className="flex-1 bg-gray-900 dark:bg-white text-white dark:text-gray-900 py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-md active:scale-95 transition-transform"
            >
              <PlusCircle className="w-4 h-4" /> CREATE CHALLAN
            </button>
          )}
          {session.canApproveCollection && (
            <button 
              onClick={() => handleBack("/admin/collections/approve")}
              className="flex-1 bg-amber-600 hover:bg-amber-700 text-white py-3 rounded-xl flex items-center justify-center gap-2 text-xs font-black shadow-md active:scale-95 transition-transform relative"
            >
              <CheckSquare className="w-4 h-4" /> APPROVE 
              {stats.pendingApprovals > 0 && (
                <span className="absolute -top-2 -right-2 bg-red-500 text-white text-[10px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-white dark:border-gray-900 animate-pulse">
                  {stats.pendingApprovals}
                </span>
              )}
            </button>
          )}
        </div>
      </header>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        
        {/* Filter */}
        <div className="flex bg-white dark:bg-gray-900 p-1 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
          {["TODAY", "WEEK", "MONTH", "ALL"].map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f as DateFilter)}
              className={`flex-1 py-2 text-[10px] font-black uppercase tracking-widest rounded-lg transition-all ${filter === f ? "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-400 shadow-sm" : "text-gray-400"}`}
            >
              {f}
            </button>
          ))}
        </div>

        {/* Grand Total */}
        <div className="bg-gradient-to-br from-amber-600 to-yellow-600 dark:from-amber-800 dark:to-yellow-900 rounded-[2rem] p-6 text-white shadow-xl relative overflow-hidden">
          <Landmark className="absolute -right-4 -bottom-4 w-32 h-32 text-white/10 rotate-12" />
          <div className="relative z-10">
            <p className="text-xs font-bold text-amber-100 uppercase tracking-widest flex items-center gap-1.5 mb-1">
              <TrendingUp className="w-4 h-4" /> Total Approved
            </p>
            <h2 className="text-4xl font-black tracking-tight">{formatMoney(stats.grandTotal)}</h2>
            
            <div className="flex gap-4 mt-6">
              <div className="flex-1 bg-black/20 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-amber-200 uppercase font-bold tracking-wider mb-1">Cash In Hand</p>
                <p className="text-lg font-black">{formatMoney(stats.totalCash)}</p>
              </div>
              <div className="flex-1 bg-white/10 backdrop-blur-md p-3 rounded-2xl border border-white/10">
                <p className="text-[10px] text-amber-50 uppercase font-bold tracking-wider mb-1">Online Transferred</p>
                <p className="text-lg font-black">{formatMoney(stats.totalOnline)}</p>
              </div>
            </div>
          </div>
        </div>

        {/* Fund List */}
        <div className="space-y-3">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Account Breakdown</h3>
          
          <FundCard icon={<Building2 />} title="Baitulmal Fund" cash={stats.funds.baitulmal.cash} online={stats.funds.baitulmal.online} total={stats.funds.baitulmal.total} color="emerald" />
          <FundCard icon={<BookOpen />} title="Madarsa Fund" cash={stats.funds.madarsa.cash} online={stats.funds.madarsa.online} total={stats.funds.madarsa.total} color="blue" />
          <FundCard icon={<HeartHandshake />} title="Fitra Tokens" cash={stats.funds.fitra.cash} online={stats.funds.fitra.online} total={stats.funds.fitra.total} color="purple" />
        </div>

        {/* RECENT ACTIVITY WITH BOOK NUMBERS */}
        <div className="space-y-3 pt-2">
          <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Recent Activity</h3>
          <div className="space-y-3">
            {recentChallans.map((ch: any) => (
              <div key={ch._id} className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <span className="text-[9px] font-black text-blue-600 bg-blue-50 dark:bg-blue-900/30 px-2 py-0.5 rounded uppercase">{ch.challanNumber}</span>
                    <p className="text-xs font-black text-gray-900 dark:text-white mt-1.5">{ch.submittedByName}</p>
                  </div>
                  <span className={`text-[8px] font-black px-2 py-1 rounded-lg uppercase ${ch.status === 'APPROVED' ? 'bg-green-100 text-green-700' : ch.status === 'REJECTED' ? 'bg-red-100 text-red-700' : 'bg-amber-100 text-amber-700'}`}>
                    {ch.status}
                  </span>
                </div>

                {/* DYNAMIC BOOK BADGES */}
                <div className="flex flex-wrap gap-2 mb-3">
                   {ch.baitulmalReceiptBookNumber && (
                     <div className="flex items-center gap-1.5 bg-emerald-50 dark:bg-emerald-900/20 text-emerald-700 dark:text-emerald-400 px-2 py-1 rounded-md border border-emerald-100 dark:border-emerald-800/50">
                        <Hash className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-black uppercase">Bait: {ch.baitulmalReceiptBookNumber}</span>
                     </div>
                   )}
                   {ch.madarsaReceiptBookNumber && (
                     <div className="flex items-center gap-1.5 bg-blue-50 dark:bg-blue-900/20 text-blue-700 dark:text-blue-400 px-2 py-1 rounded-md border border-blue-100 dark:border-blue-800/50">
                        <Hash className="w-2.5 h-2.5" />
                        <span className="text-[9px] font-black uppercase">Mad: {ch.madarsaReceiptBookNumber}</span>
                     </div>
                   )}
                </div>

                <div className="flex justify-between items-center pt-3 border-t border-gray-50 dark:border-gray-800/50">
                  <div className="flex items-center gap-1.5 text-gray-400">
                    <Clock className="w-3 h-3" />
                    <span className="text-[10px] font-bold">{new Date(ch.collectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short' })}</span>
                  </div>
                  <p className="text-sm font-black text-gray-900 dark:text-white">{formatMoney(ch.grandTotal)}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* User Leaderboard */}
        {userWise.length > 0 && (
          <div className="space-y-3 pt-2 pb-10">
            <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest ml-1">Top Collectors</h3>
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm divide-y divide-gray-50 dark:divide-gray-800 overflow-hidden">
              {userWise.map((user: any, idx: number) => (
                <div key={idx} className="p-4 flex items-center justify-between hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center text-gray-500 font-black text-xs">
                      {idx + 1}
                    </div>
                    <div>
                      <p className="font-black text-sm text-gray-900 dark:text-white">{user.name}</p>
                      <p className="text-[10px] font-bold text-gray-400 uppercase">{user.challanCount} Challans</p>
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

// Sub-component for individual fund cards
function FundCard({ icon, title, cash, online, total, color }: any) {
  const colorClasses: any = {
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400",
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400",
    purple: "bg-purple-50 text-purple-600 dark:bg-purple-900/20 dark:text-purple-400"
  };

  return (
    <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl shadow-sm border border-gray-100 dark:border-gray-800 flex items-center gap-4">
      <div className={`p-3 rounded-2xl ${colorClasses[color]}`}>
        {icon}
      </div>
      <div className="flex-1 min-w-0">
        <p className="font-black text-gray-900 dark:text-white text-sm">{title}</p>
        <div className="flex gap-3 mt-1 text-[9px] font-bold text-gray-400 uppercase tracking-tighter">
          <span>Cash: <span className="text-gray-700 dark:text-gray-300">{formatMoney(cash)}</span></span>
          <span>Online: <span className="text-gray-700 dark:text-gray-300">{formatMoney(online)}</span></span>
        </div>
      </div>
      <p className="font-black text-sm text-gray-900 dark:text-white">{formatMoney(total)}</p>
    </div>
  );
}