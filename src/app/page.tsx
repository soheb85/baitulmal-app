import Link from "next/link";
import { UserPlus, Search, Users, AlertCircle, LayoutDashboard } from "lucide-react";
import { ThemeToggle } from "@/components/ThemeToggle";
import { getDashboardStats } from "@/app/actions/getDashboardStats";

// This makes the page dynamic so it fetches fresh data on every reload
export const dynamic = "force-dynamic";

export default async function Home() {
  // Fetch data from Server Action
  const stats = await getDashboardStats();

  return (
    <div className="flex flex-col min-h-screen w-full bg-gray-50 dark:bg-gray-950 transition-colors duration-300">
      
      {/* --- Header --- */}
      <header className="px-6 pt-8 pb-4 flex justify-between items-start sticky top-0 bg-gray-50/80 dark:bg-gray-950/80 backdrop-blur-md z-10">
        <div>
          <h1 className="font-outfit text-3xl font-bold text-green-700 dark:text-green-500 tracking-tight">
            Madarsa Anwarul Quran Baitulmal
          </h1>
          <p className="font-inter text-sm text-gray-500 dark:text-gray-400 font-medium">
            Bilali Masjid Group
          </p>
        </div>
        <ThemeToggle />
      </header>

      {/* --- Scrollable Content --- */}
      <main className="flex-1 px-6 pb-6 space-y-6 overflow-y-auto">
        
        {/* 1. Stats Grid */}
        <section className="grid grid-cols-2 gap-4">
          {/* Card: Total Registered */}
          <div className="col-span-2 bg-linear-to-br from-green-600 to-green-700 dark:from-green-800 dark:to-green-900 rounded-2xl p-5 text-white shadow-lg shadow-green-200 dark:shadow-none">
            <div className="flex justify-between items-start">
              <div>
                <p className="font-inter text-green-100 text-sm font-medium">Total Families</p>
                <h2 className="font-outfit text-4xl font-bold mt-1">{stats.total}</h2>
              </div>
              <div className="bg-white/20 p-2 rounded-lg backdrop-blur-sm">
                <Users className="w-6 h-6 text-white" />
              </div>
            </div>
            <div className="mt-4 flex items-center gap-2 text-xs font-medium text-green-100 bg-white/10 w-fit px-2 py-1 rounded-full">
              <span>+{stats.newToday} New Today</span>
            </div>
          </div>

          {/* Card: Rejected/Blacklisted */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="font-inter text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Rejected</span>
              <AlertCircle className="w-5 h-5 text-red-500" />
            </div>
            <span className="font-outfit text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.blacklisted}
            </span>
          </div>

          {/* Card: Distributed (Placeholder for now) */}
          <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col justify-between">
            <div className="flex justify-between items-start mb-2">
              <span className="font-inter text-xs text-gray-500 dark:text-gray-400 uppercase tracking-wider font-semibold">Distributed</span>
              <LayoutDashboard className="w-5 h-5 text-blue-500" />
            </div>
            <span className="font-outfit text-3xl font-bold text-gray-800 dark:text-gray-100">
              {stats.distributedToday}
            </span>
          </div>
        </section>

        {/* 2. Action Buttons (Big & Tappable) */}
        <nav className="space-y-4 pt-2">
          
          {/* Register Button */}
          <Link href="/register" className="block group">
            <div className="flex items-center p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 active:scale-[0.98] transition-transform duration-100">
              <div className="bg-green-50 dark:bg-green-900/30 p-4 rounded-xl mr-5 group-hover:bg-green-100 dark:group-hover:bg-green-900/50 transition-colors">
                <UserPlus className="w-7 h-7 text-green-600 dark:text-green-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-outfit font-semibold text-lg text-gray-900 dark:text-gray-100">
                  Register Beneficiary
                </h3>
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Add new family & upload docs
                </p>
              </div>
            </div>
          </Link>

          {/* Verify Button */}
          <Link href="/verify" className="block group">
            <div className="flex items-center p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 active:scale-[0.98] transition-transform duration-100">
              <div className="bg-blue-50 dark:bg-blue-900/30 p-4 rounded-xl mr-5 group-hover:bg-blue-100 dark:group-hover:bg-blue-900/50 transition-colors">
                <Search className="w-7 h-7 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-outfit font-semibold text-lg text-gray-900 dark:text-gray-100">
                  Verify / Search
                </h3>
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Check eligibility by Aadhar
                </p>
              </div>
            </div>
          </Link>

          {/* View All Button (NEW) */}
          <Link href="/beneficiaries" className="block group">
            <div className="flex items-center p-5 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-200 dark:border-gray-800 active:scale-[0.98] transition-transform duration-100">
              <div className="bg-purple-50 dark:bg-purple-900/30 p-4 rounded-xl mr-5 group-hover:bg-purple-100 dark:group-hover:bg-purple-900/50 transition-colors">
                <Users className="w-7 h-7 text-purple-600 dark:text-purple-400" />
              </div>
              <div className="flex-1">
                <h3 className="font-outfit font-semibold text-lg text-gray-900 dark:text-gray-100">
                  View All Beneficiaries
                </h3>
                <p className="font-inter text-xs text-gray-500 dark:text-gray-400 mt-1">
                  Master list, Search & Filter
                </p>
              </div>
            </div>
          </Link>

        </nav>
      </main>
    </div>
  );
}