"use client";

import { useState, useEffect } from "react";
// Remove Link since we use handleBack
// import Link from "next/link"; 
import { 
  UserPlus, Search, Users, AlertCircle, LayoutDashboard, 
  ShieldCheck, ListOrdered, BarChart3, PackageCheck, 
  LogOut, UserCheck, Activity, Lock, Package, FileText, ChevronRight,
  Database // <-- Added Database Icon
} from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getDashboardStats } from "@/app/actions/getDashboardStats";
import { getCycleStats } from "@/app/actions/getCycleStats";
import { getSession, logoutUser } from "@/app/actions/authActions";
import { useBackNavigation } from "@/hooks/useBackNavigation"; // Import Hook
import NavigationLoader from "@/components/ui/NavigationLoader"; // Import Loader

export default function DashboardPage() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [stats, setStats] = useState<any>({ total: 0, blacklisted: 0, newToday: 0, totalKitsAllTime: 0, distributedToday: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [cycle, setCycle] = useState<any>({ year1: 0, year2: 0, year3: 0, newlyVerified: 0 });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const [session, setSession] = useState<any>(null);
  
  const { isNavigating, handleBack } = useBackNavigation();

  useEffect(() => {
    async function init() {
      // Parallel data fetching for speed
      const [statsData, cycleData, sessionData] = await Promise.all([
        getDashboardStats(),
        getCycleStats(),
        getSession()
      ]);
      
      setStats(statsData);
      setCycle(cycleData.stats);
      setSession(sessionData);
    }
    init();
  }, []);

  const handleLogout = async () => {
    await logoutUser();
    window.location.href = "/login"; // Hard refresh
  };

  // Progress Bar Calculation
  const totalActive = (stats.total || 0) - (stats.blacklisted || 0);
  const getWidth = (count: number) => (totalActive > 0 ? (count / totalActive) * 100 : 0);

  // Role Checks
  const isSuperAdmin = session?.role === "SUPER_ADMIN";
  const isAdmin = session?.role === "ADMIN";
  const hasAdminAccess = isSuperAdmin || isAdmin;

  // Show Loader if navigating
  if (isNavigating) return <NavigationLoader message="Loading..." />;

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-gray-950 transition-colors duration-300 font-outfit">
      
      {/* --- Header --- */}
      <header className="px-6 pt-8 pb-4 sticky top-0 bg-gray-50/90 dark:bg-gray-950/90 backdrop-blur-md z-10 border-b border-gray-100 dark:border-gray-800/50">
        <div className="flex justify-between items-start">
          <div>
            <h1 className="text-2xl font-black text-green-700 dark:text-green-500 tracking-tight leading-tight">
              Anwarul Quran
            </h1>
            <p className="font-inter text-xs text-gray-500 dark:text-gray-400 font-medium">
              {session ? `Welcome, ${session.name}` : "Public View"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            
            {session ? (
              <button 
                onClick={handleLogout}
                className="p-2.5 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 text-red-500 active:scale-90 transition-transform"
                title="Logout"
              >
                <LogOut className="w-5 h-5" />
              </button>
            ) : (
              <button 
                onClick={() => handleBack("/login")}
                className="px-4 py-2 bg-green-600 text-white text-xs font-bold rounded-xl shadow-md active:scale-95 transition-all"
              >
                Login
              </button>
            )}
          </div>
        </div>
      </header>

      {/* --- Scrollable Content --- */}
      <main className="flex-1 px-6 pb-6 space-y-8 overflow-y-auto pt-4">
        
        {/* 1. Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          <div className="col-span-2 bg-gradient-to-br from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 rounded-[2rem] p-5 text-white shadow-lg relative overflow-hidden">
            <div className="flex justify-between items-start relative z-10">
              <div>
                <p className="font-inter text-green-100 text-sm font-medium">Total Families</p>
                <h2 className="font-outfit text-4xl font-black mt-1">{stats.total}</h2>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-100 bg-white/10 w-fit px-2 py-1 rounded-full relative z-10">
              <span>+{stats.newToday} New Today</span>
            </div>
            {/* Decor */}
            <Users className="absolute -right-6 -bottom-6 w-32 h-32 text-white/5 rotate-12" />
          </div>

          <div className="col-span-2 bg-white dark:bg-gray-900 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex justify-between items-center">
             <div>
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Total Kits (All Time)</p>
                <h2 className="text-3xl font-black text-gray-900 dark:text-white mt-1">
                    {stats.totalKitsAllTime} <span className="text-sm font-medium text-gray-400">Kits</span>
                </h2>
             </div>
             <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-2xl">
                <PackageCheck className="w-8 h-8 text-blue-600" />
             </div>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Rejected</span>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <span className="text-3xl font-black text-gray-800 dark:text-gray-100">{stats.blacklisted}</span>
          </div>

          <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="text-xs text-gray-500 uppercase tracking-wider font-semibold">Today</span>
              <LayoutDashboard className="w-5 h-5 text-blue-500" />
            </div>
            <span className="text-3xl font-black text-gray-800 dark:text-gray-100">{stats.distributedToday}</span>
          </div>
        </section>

        {/* 2. Cycle Progress */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center gap-2 mb-4">
            <BarChart3 className="w-5 h-5 text-purple-600" />
            <h3 className="font-bold text-gray-900 dark:text-white uppercase tracking-wider text-xs">
              3-Year Cycle
            </h3>
          </div>

          <div className="h-4 w-full bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden flex mb-4">
            <div style={{ width: `${getWidth(cycle.year1)}%` }} className="bg-green-500 h-full" />
            <div style={{ width: `${getWidth(cycle.year2)}%` }} className="bg-blue-500 h-full" />
            <div style={{ width: `${getWidth(cycle.year3)}%` }} className="bg-purple-600 h-full" />
            <div style={{ width: `${getWidth(cycle.newlyVerified)}%` }} className="bg-gray-300 h-full" />
          </div>

          <div className="grid grid-cols-2 gap-y-3 gap-x-6">
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-green-500" />
              <span className="text-[11px] font-medium text-gray-500">Year 1: <strong>{cycle.year1}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-blue-500" />
              <span className="text-[11px] font-medium text-gray-500">Year 2: <strong>{cycle.year2}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-purple-600" />
              <span className="text-[11px] font-medium text-gray-500">Year 3: <strong>{cycle.year3}</strong></span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-2 h-2 rounded-full bg-gray-300" />
              <span className="text-[11px] font-medium text-gray-500">New: <strong>{cycle.newlyVerified}</strong></span>
            </div>
          </div>
        </section>

        {/* 3. Admin / Super Admin Console */}
        {hasAdminAccess && (
          <section className="animate-in fade-in slide-in-from-bottom-4">
            <div className="flex items-center gap-2 mb-3 ml-1">
               <Lock className="w-4 h-4 text-blue-600" />
               <h3 className="text-sm font-bold text-blue-600 dark:text-blue-400 uppercase tracking-wider">
                 {isSuperAdmin ? "Super Admin Console" : "Admin Console"}
               </h3>
            </div>
            <div className="grid grid-cols-2 gap-3">
              
              {/* Only Super Admin sees Users */}
              {isSuperAdmin && (
                <button onClick={() => handleBack("/admin/users")} className="flex flex-col p-4 bg-white dark:bg-gray-900 rounded-[2rem] border border-blue-100 dark:border-blue-900/30 shadow-sm active:scale-95 transition-all text-left">
                  <div className="bg-blue-50 dark:bg-blue-900/50 p-3 rounded-2xl w-fit mb-3">
                    <UserCheck className="w-6 h-6 text-blue-600" />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">Users</h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Approvals</p>
                </button>
              )}

              {/* Both Super Admin and Admin see Stock */}
              <button onClick={() => handleBack("/admin/inventory")} className="flex flex-col p-4 bg-white dark:bg-gray-900 rounded-[2rem] border border-orange-100 dark:border-orange-900/30 shadow-sm active:scale-95 transition-all text-left">
                 <div className="bg-orange-50 dark:bg-orange-900/50 p-3 rounded-2xl w-fit mb-3">
                   <Package className="w-6 h-6 text-orange-600" />
                 </div>
                 <h3 className="font-black text-gray-900 dark:text-white text-sm">Stock</h3>
                 <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Inventory</p>
              </button>

              {/* Both Super Admin and Admin see Reports */}
              <button onClick={() => handleBack("/admin/reports")} className="flex flex-col p-4 bg-white dark:bg-gray-900 rounded-[2rem] border border-green-100 dark:border-green-900/30 shadow-sm active:scale-95 transition-all text-left">
                 <div className="bg-green-50 dark:bg-green-900/50 p-3 rounded-2xl w-fit mb-3">
                   <FileText className="w-6 h-6 text-green-600" />
                 </div>
                 <h3 className="font-black text-gray-900 dark:text-white text-sm">Reports</h3>
                 <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Export PDF</p>
              </button>

              {/* Only Super Admin sees Audit Logs */}
              {isSuperAdmin && (
                <button onClick={() => handleBack("/admin/audit")} className="flex flex-col p-4 bg-white dark:bg-gray-900 rounded-[2rem] border border-purple-100 dark:border-purple-900/30 shadow-sm active:scale-95 transition-all text-left">
                  <div className="bg-purple-50 dark:bg-purple-900/50 p-3 rounded-2xl w-fit mb-3">
                    <Activity className="w-6 h-6 text-purple-600" />
                  </div>
                  <h3 className="font-black text-gray-900 dark:text-white text-sm">Audit Logs</h3>
                  <p className="text-[10px] text-gray-500 mt-1 uppercase font-bold tracking-tighter">Activity</p>
                </button>
              )}

              {/* Only Super Admin sees Database Sync */}
              {isSuperAdmin && (
                <button onClick={() => handleBack("/admin/migrate")} className="col-span-2 flex flex-col p-4 bg-gradient-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black rounded-[2rem] shadow-md active:scale-95 transition-all text-left border border-gray-700">
                  <div className="bg-white/10 p-3 rounded-2xl w-fit mb-3">
                    <Database className="w-6 h-6 text-white" />
                  </div>
                  <h3 className="font-black text-white text-sm">Database Sync</h3>
                  <p className="text-[10px] text-gray-400 mt-1 uppercase font-bold tracking-tighter">Migrations & Backups</p>
                </button>
              )}
            </div>
          </section>
        )}

        {/* 4. Volunteer Tools */}
        <section>
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Authorized Person Tools</h3>
            <div className="space-y-3">
                <button onClick={() => handleBack("/register")} className="w-full flex items-center p-4 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-transform duration-100 group text-left">
                   <div className="bg-green-50 dark:bg-green-900/30 p-3 rounded-xl mr-4 group-hover:bg-green-100 transition-colors">
                       <UserPlus className="w-6 h-6 text-green-600 dark:text-green-400" />
                   </div>
                   <div className="flex-1">
                       <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Register Beneficiary</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Add new family</p>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>

                <button onClick={() => handleBack("/verify")} className="w-full flex items-center p-4 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-transform duration-100 group text-left">
                   <div className="bg-blue-50 dark:bg-blue-900/30 p-3 rounded-xl mr-4 group-hover:bg-blue-100 transition-colors">
                       <Search className="w-6 h-6 text-blue-600 dark:text-blue-400" />
                   </div>
                   <div className="flex-1">
                       <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">Verify / Search</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Check status & details</p>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>

                <button onClick={() => handleBack("/beneficiaries")} className="w-full flex items-center p-4 bg-white dark:bg-gray-900 rounded-[2rem] shadow-sm border border-gray-100 dark:border-gray-800 active:scale-[0.98] transition-transform duration-100 group text-left">
                   <div className="bg-purple-50 dark:bg-purple-900/30 p-3 rounded-xl mr-4 group-hover:bg-purple-100 transition-colors">
                       <Users className="w-6 h-6 text-purple-600 dark:text-purple-400" />
                   </div>
                   <div className="flex-1">
                       <h3 className="font-bold text-base text-gray-900 dark:text-gray-100">View All Beneficiaries</h3>
                       <p className="text-xs text-gray-500 dark:text-gray-400">Master list & edits</p>
                   </div>
                   <ChevronRight className="w-5 h-5 text-gray-300" />
                </button>
            </div>
        </section>

        {/* 5. Distribution Section */}
        <section className="pb-10">
            <h3 className="text-sm font-bold text-gray-400 uppercase tracking-wider mb-3 ml-1">Ration Distribution</h3>
            <div className="grid grid-cols-2 gap-3">
                <button onClick={() => handleBack("/distribution/check-in")} className="flex flex-col h-full p-4 bg-orange-50 dark:bg-orange-900/10 rounded-[2rem] border border-orange-100 dark:border-orange-900/30 active:scale-[0.98] transition-transform text-left">
                    <div className="bg-white dark:bg-orange-900/30 p-3 rounded-xl w-fit mb-3 shadow-sm">
                        <ShieldCheck className="w-6 h-6 text-orange-600 dark:text-orange-400" />
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-gray-100">Station 1: Verification</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-bold uppercase">Check-In</p>
                </button>

                <button onClick={() => handleBack("/distribution/live-queue")} className="flex flex-col h-full p-4 bg-teal-50 dark:bg-teal-900/10 rounded-[2rem] border border-teal-100 dark:border-teal-900/30 active:scale-[0.98] transition-transform text-left">
                    <div className="bg-white dark:bg-teal-900/30 p-3 rounded-xl w-fit mb-3 shadow-sm">
                        <ListOrdered className="w-6 h-6 text-teal-600 dark:text-teal-400" />
                    </div>
                    <h3 className="font-black text-gray-900 dark:text-gray-100">Station 2: Ration Queue</h3>
                    <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-1 font-bold uppercase">Distribution</p>
                </button>
            </div>
        </section>

      </main>
    </div>
  );
}