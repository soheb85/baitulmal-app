/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getAuditLogs } from "@/app/actions/auditActions";
import { 
  ArrowLeft, Activity, User, ShieldCheck, 
  Calendar, Clock, CheckCircle2, UserCircle2, Loader2 
} from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation"; 
import NavigationLoader from "@/components/ui/NavigationLoader"; 

export default function AuditPage() {
  const [logs, setLogs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const { isNavigating, handleBack } = useBackNavigation("/");

  useEffect(() => {
    async function fetchData() {
        setLoading(true);
        const data = await getAuditLogs();
        setLogs(data);
        setLoading(false);
    }
    fetchData();
  }, []);

  if (isNavigating) return <NavigationLoader message="Returning to Dashboard..." />;

  return (
    <div className="min-h-screen bg-[#F8FAFC] dark:bg-[#020617] transition-colors duration-500 font-outfit w-full overflow-x-hidden">
      
      {/* --- Sticky Glassmorphic Header --- */}
      <header className="sticky top-0 z-20 bg-[#F8FAFC]/80 dark:bg-[#020617]/80 backdrop-blur-md border-b border-gray-200 dark:border-gray-800 px-6 py-5 w-full">
        <div className="max-w-3xl mx-auto flex items-center justify-between gap-3">
          <div className="flex items-center gap-4 min-w-0">
            <button 
              onClick={() => handleBack()} 
              className="group p-2.5 bg-white dark:bg-gray-900 rounded-xl shadow-sm border border-gray-200 dark:border-gray-800 hover:border-green-500 transition-all active:scale-95 shrink-0"
            >
              <ArrowLeft className="w-5 h-5 text-gray-500 group-hover:text-green-600" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-gray-900 dark:text-white tracking-tight truncate">System Audit</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">Live Operations Feed</p>
            </div>
          </div>
          <div className="hidden sm:flex items-center gap-2 px-3 py-1.5 bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800 rounded-full shrink-0">
            <div className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
            <span className="text-[10px] font-black text-green-700 dark:text-green-400 uppercase">System Secure</span>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10 w-full">
        
        {/* --- Stats Summary --- */}
        <div className="grid grid-cols-2 gap-4 mb-10 w-full">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Total Logs</p>
                <p className="text-2xl font-black text-gray-900 dark:text-white truncate">
                    {loading ? "..." : logs.length}
                </p>
            </div>
            <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm min-w-0">
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest truncate">Retention</p>
                <p className="text-2xl font-black text-green-600 truncate">10 Days</p>
            </div>
        </div>

        {/* --- Log Timeline --- */}
        <div className="relative space-y-6 before:absolute before:inset-0 before:ml-5 before:-translate-x-px before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-gray-200 dark:before:via-gray-800 before:to-transparent w-full">
          
          {loading ? (
             // Loading State
             <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 text-gray-300 animate-spin mb-2" />
                <p className="text-xs font-bold text-gray-400 uppercase tracking-widest">Fetching Activity...</p>
             </div>
          ) : logs.length === 0 ? (
            // Empty State
            <div className="relative flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-[2.5rem] border border-dashed border-gray-200 dark:border-gray-800">
               <Activity className="w-12 h-12 text-gray-200 dark:text-gray-700 mb-4" />
               <p className="text-gray-400 font-medium">No activity data found in this cycle.</p>
            </div>
          ) : (
            // Data List
            logs.map((log: any) => (
              <div key={log._id} className="relative flex items-start gap-4 sm:gap-6 group w-full">
                
                {/* Timeline Icon */}
                <div className={`z-10 flex items-center justify-center w-10 h-10 rounded-2xl shrink-0 shadow-sm border-2 border-[#F8FAFC] dark:border-[#020617] transition-transform group-hover:scale-110 ${
                    log.action === 'DISTRIBUTION' ? 'bg-blue-600 text-white' : 
                    log.action === 'REGISTRATION' ? 'bg-emerald-600 text-white' : 
                    'bg-gray-600 text-white'
                }`}>
                  {log.action === 'DISTRIBUTION' ? <CheckCircle2 className="w-5 h-5" /> : 
                   log.action === 'REGISTRATION' ? <UserCircle2 className="w-5 h-5" /> : 
                   <Activity className="w-5 h-5" />}
                </div>

                {/* Content Card - ADDED min-w-0 here */}
                <div className="flex-1 min-w-0 bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm hover:shadow-md transition-all duration-300">
                  
                  <div className="flex justify-between items-center mb-3 gap-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-tighter shrink-0 ${
                        log.action === 'DISTRIBUTION' ? 'bg-blue-50 text-blue-600 dark:bg-blue-900/20' : 
                        log.action === 'REGISTRATION' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 
                        'bg-gray-50 text-gray-600 dark:bg-gray-800'
                    }`}>
                      {log.action}
                    </span>
                    <div className="flex items-center gap-1.5 text-gray-400 shrink-0">
                        <Clock className="w-3 h-3" />
                        <span className="text-[10px] font-bold font-mono">
                            {new Date(log.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                    </div>
                  </div>

                  {/* ADDED break-all and max-w-full to handle long names/admin names */}
                  <div className="space-y-1 w-full min-w-0">
                    <h3 className="text-sm font-bold text-gray-900 dark:text-white leading-snug break-all max-w-full">
                      <span className="text-green-600 dark:text-green-500 font-black">{log.performedBy}</span> 
                      <span className="text-gray-400 dark:text-gray-500 font-medium leading-tight"> acted on </span> 
                      {log.beneficiaryName}
                    </h3>
                    
                    {/* ADDED break-words here for the detailed log payload */}
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-inter leading-relaxed bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl mt-2 border border-gray-100 dark:border-gray-800 italic break-words max-w-full">
                      &quot;{log.details}&quot;
                    </p>
                  </div>

                  <div className="mt-4 flex items-center justify-between w-full">
                      <div className="flex items-center gap-1.5 min-w-0 pr-2">
                        <Calendar className="w-3 h-3 text-gray-300 shrink-0" />
                        <span className="text-[9px] font-black text-gray-400 uppercase tracking-widest truncate">
                            {new Date(log.timestamp).toLocaleDateString('en-IN', { day: '2-digit', month: 'long', year: 'numeric' })}
                        </span>
                      </div>
                      <ShieldCheck className="w-4 h-4 text-green-500/30 shrink-0" />
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        <footer className="mt-20 text-center space-y-2">
            <p className="text-[10px] font-black text-gray-300 dark:text-gray-700 uppercase tracking-[0.3em]">
                End of Transmission
            </p>
            <div className="h-px w-20 bg-gray-200 dark:bg-gray-800 mx-auto" />
        </footer>
      </main>
    </div>
  );
}