/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { scanForDuplicates, resolveDuplicate } from "@/app/actions/admin/duplicateActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Users, Smartphone, Fingerprint, Home as HomeIcon,
  Loader2, Trash2, Ban, ShieldAlert, CheckCircle2, UserSearch
} from "lucide-react";

export default function FindDuplicatesPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  // ADDED "NAMES" TO TAB STATE
  const [activeTab, setActiveTab] = useState<"MOBILE" | "AADHAAR" | "ADDRESS" | "NAMES">("ADDRESS");
  const [isLoading, setIsLoading] = useState(false);
  const [duplicateGroups, setDuplicateGroups] = useState<any[]>([]);
  const [actionLoading, setActionLoading] = useState<string | null>(null);

  useEffect(() => {
    fetchDuplicates();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [activeTab]);

  const fetchDuplicates = async () => {
    setIsLoading(true);
    const res = await scanForDuplicates(activeTab);
    if (res.success) {
      setDuplicateGroups(res.data);
    } else {
      alert("Failed to scan: " + res.message);
    }
    setIsLoading(false);
  };

  const handleResolve = async (id: string, action: "DELETE" | "BLACKLIST") => {
    if (!confirm(`Are you sure you want to ${action} this record?`)) return;
    
    setActionLoading(id);
    const res = await resolveDuplicate(id, action);
    if (res.success) {
      await fetchDuplicates();
    } else {
      alert("Error: " + res.message);
    }
    setActionLoading(null);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative font-outfit">
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="min-w-0">
            <h1 className="text-lg font-black text-cyan-600 flex items-center gap-2 truncate">
              <Users className="w-4 h-4 shrink-0" /> Duplicate Finder
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest truncate">Household Cleanup Tool</p>
          </div>
        </div>

        {/* Info Banner */}
        <div className="bg-cyan-50 dark:bg-cyan-900/10 p-4 rounded-2xl border border-cyan-100 dark:border-cyan-900/30 flex gap-3 mb-6 w-full">
          <ShieldAlert className="w-5 h-5 text-cyan-600 shrink-0" />
          <p className="text-[11px] text-cyan-800 dark:text-cyan-400 leading-relaxed font-medium">
            Find families cheating the &quot;One Home, One Kit&quot; rule. Cross-check family members to confirm if two accounts belong to the same household.
          </p>
        </div>

        {/* TABS - Updated with overflow-x-auto to prevent squeezing on small screens */}
        <div className="flex overflow-x-auto bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl mb-6 shadow-inner w-full" style={{ scrollbarWidth: 'none' }}>
          <button 
            onClick={() => setActiveTab("ADDRESS")}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "ADDRESS" ? "bg-white dark:bg-gray-900 text-cyan-600 shadow-sm" : "text-gray-500"}`}
          >
            <HomeIcon className="w-4 h-4" /> Address
          </button>
          <button 
            onClick={() => setActiveTab("MOBILE")}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "MOBILE" ? "bg-white dark:bg-gray-900 text-cyan-600 shadow-sm" : "text-gray-500"}`}
          >
            <Smartphone className="w-4 h-4" /> Mobile
          </button>
          <button 
            onClick={() => setActiveTab("AADHAAR")}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "AADHAAR" ? "bg-white dark:bg-gray-900 text-cyan-600 shadow-sm" : "text-gray-500"}`}
          >
            <Fingerprint className="w-4 h-4" /> Aadhaar
          </button>
          <button 
            onClick={() => setActiveTab("NAMES")}
            className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "NAMES" ? "bg-white dark:bg-gray-900 text-cyan-600 shadow-sm" : "text-gray-500"}`}
          >
            <UserSearch className="w-4 h-4" /> Names
          </button>
        </div>

        {/* Results Area */}
        {isLoading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-50">
            <Loader2 className="w-10 h-10 animate-spin text-cyan-600 mb-4" />
            <p className="text-sm font-bold tracking-widest uppercase text-cyan-600">Scanning Database...</p>
          </div>
        ) : duplicateGroups.length === 0 ? (
          <div className="bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-gray-100 dark:border-gray-800 text-center shadow-sm w-full">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <h3 className="font-black text-xl text-gray-900 dark:text-white">Clean Database</h3>
            <p className="text-xs text-gray-500 font-medium mt-1">No shared {activeTab.toLowerCase()} conflicts found.</p>
          </div>
        ) : (
          <div className="space-y-6 w-full">
            {duplicateGroups.map((group, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-red-100 dark:border-red-900/30 overflow-hidden shadow-sm w-full">
                
                {/* Group Header */}
                <div className="bg-red-50 dark:bg-red-900/20 p-4 border-b border-red-100 dark:border-red-900/30 flex justify-between items-center w-full">
                  <div className="flex-1 min-w-0 pr-2">
                    <p className="text-[9px] font-black uppercase tracking-widest text-red-600 mb-0.5 truncate">
                      Conflict: Shared {activeTab}
                    </p>
                    <p className="font-mono text-sm font-black text-red-700 dark:text-red-400 uppercase break-all max-w-full line-clamp-5">
                      {group.sharedValue}
                    </p>
                  </div>
                  <div className="bg-red-200 dark:bg-red-900/50 text-red-700 dark:text-red-300 px-3 py-1 rounded-full text-xs font-black shrink-0">
                    {group.count} Found
                  </div>
                </div>

                {/* Conflicting Profiles */}
                <div className="p-3 space-y-3 w-full">
                  {group.profiles.map((profile: any) => (
                    <div key={profile._id} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700 flex flex-col gap-3 w-full min-w-0">
                      
                      <div className="flex justify-between items-start border-b border-gray-200 dark:border-gray-700 pb-3 gap-2 w-full">
                        <div className="min-w-0 flex-1">
                          <h4 className="font-black text-gray-900 dark:text-white text-base break-words">
                            {profile.fullName}
                          </h4>
                          <p className="text-[10px] text-gray-500 font-bold mt-1 truncate">
                            Aadhaar: {profile.aadharNumber} | Mob: {profile.mobileNumber}
                          </p>
                        </div>
                        <span className={`text-[9px] font-black uppercase px-2 py-1 rounded-md shrink-0 ${profile.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                          {profile.status}
                        </span>
                      </div>

                      {/* FAMILY CROSS-CHECK SECTION */}
                      <div className="space-y-1 w-full min-w-0">
                        <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 truncate">Cross-check Family:</p>
                        {profile.familyMembersDetail?.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {profile.familyMembersDetail.map((m: any, i: number) => (
                              <span key={i} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 text-[10px] px-2 py-1 rounded-lg font-bold text-gray-600 dark:text-gray-300 break-words max-w-full">
                                <span className="text-cyan-600 dark:text-cyan-400">{m.relation}:</span> {m.name}
                              </span>
                            ))}
                          </div>
                        ) : (
                          <p className="text-[10px] text-gray-400 italic truncate">No family members listed.</p>
                        )}
                      </div>

                      {/* Action Buttons */}
                      <div className="grid grid-cols-2 gap-2 pt-2 mt-1 w-full">
                        <button 
                          onClick={() => handleResolve(profile._id, "BLACKLIST")}
                          disabled={actionLoading === profile._id || profile.status === "BLACKLISTED"}
                          className="py-2.5 bg-orange-100 hover:bg-orange-200 disabled:bg-gray-100 dark:bg-orange-900/30 dark:disabled:bg-gray-800 text-orange-700 disabled:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex justify-center items-center gap-1 transition-colors min-w-0"
                        >
                          {actionLoading === profile._id ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Ban className="w-4 h-4 shrink-0" />}
                          <span className="truncate">Blacklist</span>
                        </button>
                        <button 
                          onClick={() => handleResolve(profile._id, "DELETE")}
                          disabled={actionLoading === profile._id}
                          className="py-2.5 bg-red-100 hover:bg-red-200 disabled:bg-gray-100 dark:bg-red-900/30 dark:disabled:bg-gray-800 text-red-700 disabled:text-gray-400 text-[10px] font-black uppercase tracking-widest rounded-xl flex justify-center items-center gap-1 transition-colors min-w-0"
                        >
                          {actionLoading === profile._id ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <Trash2 className="w-4 h-4 shrink-0" />}
                          <span className="truncate">Delete</span>
                        </button>
                      </div>

                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}