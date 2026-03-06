/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getFilterMetadata, fetchFilteredBeneficiaries } from "@/app/actions/admin/advancedFilterActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Filter, Users, X, ChevronRight, Loader2,
  MapPin, Map, Tag, CalendarDays, ShieldCheck, UserCog, Edit3, Search
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function SmartExplorerPage() {
  const { isNavigating, handleBack } = useBackNavigation("/");
  const router = useRouter();

  // --- States ---
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  
const [metadata, setMetadata] = useState<{
  pincodes: string[];
  areas: string[];
  references: string[];
}>({ pincodes: [], areas: [], references: [] });
  
  // Selected Filters
  const [filters, setFilters] = useState({
    pincode: "",
    area: "",
    referencedBy: "",
    yearCount: null as number | null, // null = All, 0 = New, 1 = 1 Year, etc.
  });

  // Results & Modal
  const [results, setResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);

  // --- Initialization ---
  useEffect(() => {
    async function loadInitialData() {
      setIsLoading(true);
      const metaRes = await getFilterMetadata();
      if (metaRes.success && metaRes.data) setMetadata(metaRes.data);
      
      // Auto-fetch initial unfiltered data
      await applyFilters();
      setIsLoading(false);
    }
    loadInitialData();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // --- Handlers ---
  const applyFilters = async () => {
    setIsFetchingData(true);
    setIsFilterOpen(false); // Close the menu when applying
    
    const res = await fetchFilteredBeneficiaries(filters);
    if (res.success) setResults(res.data);
    else alert("Error fetching data");
    
    setIsFetchingData(false);
  };

  const clearFilters = async () => {
    setFilters({ pincode: "", area: "", referencedBy: "", yearCount: null });
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  // --- The Action Modal ---
  const ActionModal = () => {
    if (!selectedUser) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 animate-in fade-in">
        <div className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 mb-4 border border-gray-100 dark:border-gray-800">
          <div className="flex justify-between items-start mb-6">
            <div>
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Select Action</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{selectedUser.fullName}</h3>
              <p className="text-xs font-bold text-gray-500 mt-1">Mob: {selectedUser.mobileNumber} | Area: {selectedUser.area || selectedUser.currentPincode}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="space-y-3">
            {/* Standard Profile View */}
            <button 
              onClick={() => handleBack(`/beneficiaries/${selectedUser._id}`)}
              className="w-full flex items-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30 active:scale-95 transition-transform text-left"
            >
              <div className="bg-purple-100 dark:bg-purple-900/50 p-2.5 rounded-xl mr-4"><UserCog className="w-5 h-5 text-purple-600" /></div>
              <div className="flex-1">
                <p className="font-black text-gray-900 dark:text-white text-sm">View Master Profile</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Edit all details</p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300" />
            </button>

            {/* Route to Verify with Mobile Number Pre-filled */}
            <button 
              onClick={() => router.push(`/verify?search=${selectedUser.aadharNumber || selectedUser.mobileNumber}`)}
              className="w-full flex items-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 active:scale-95 transition-transform text-left"
            >
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl mr-4"><Search className="w-5 h-5 text-blue-600" /></div>
              <div className="flex-1">
                <p className="font-black text-gray-900 dark:text-white text-sm">Verify Details</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Public Verification Scanner</p>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-300" />
            </button>

            {/* Route to Check-In with Mobile Number Pre-filled */}
            <button 
              onClick={() => router.push(`/distribution/check-in?search=${selectedUser.aadharNumber || selectedUser.mobileNumber}`)}
              className="w-full flex items-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 active:scale-95 transition-transform text-left"
            >
              <div className="bg-orange-100 dark:bg-orange-900/50 p-2.5 rounded-xl mr-4"><ShieldCheck className="w-5 h-5 text-orange-600" /></div>
              <div className="flex-1">
                <p className="font-black text-gray-900 dark:text-white text-sm">Send to Check-In</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5">Station 1 Queue</p>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-300" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-950 font-outfit relative">
      
      {/* Sticky Header with Burger Menu Trigger */}
      <header className="px-4 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 shadow-sm flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition-transform">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-xl font-black text-indigo-600">Smart Explorer</h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none">Advanced Filtering</p>
          </div>
        </div>
        
        {/* The Burger Filter Button */}
        <button 
          onClick={() => setIsFilterOpen(true)}
          className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2 active:scale-95 transition-transform"
        >
          <Filter className="w-5 h-5" />
          <span className="text-xs font-black uppercase tracking-widest hidden sm:inline">Filters</span>
        </button>
      </header>

      {/* Main Results View */}
      <div className="flex-1 p-4 pb-32 max-w-md mx-auto w-full">
        {isLoading || isFetchingData ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50">
             <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Loading Data...</p>
           </div>
        ) : (
          <div className="space-y-4">
            <p className="text-xs font-bold text-gray-500 ml-1">Showing top {results.length} results</p>
            {results.length === 0 ? (
              <div className="text-center bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-gray-100 dark:border-gray-800">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-500">No beneficiaries match these filters.</p>
              </div>
            ) : (
              results.map((user) => (
                <button 
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between text-left active:scale-[0.98] transition-transform"
                >
                  <div className="min-w-0 pr-4">
                    <h4 className="font-black text-gray-900 dark:text-white truncate text-base">{user.fullName}</h4>
                    <p className="text-[10px] font-bold text-gray-400 mt-1 uppercase tracking-wider truncate">
                      Area: <span className="text-gray-600 dark:text-gray-300">{user.area || "N/A"}</span> | 
                      Pin: <span className="text-gray-600 dark:text-gray-300">{user.currentPincode}</span>
                    </p>
                    <div className="flex items-center gap-2 mt-2">
                       <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                         History: {user.distributedYears?.length || 0} Years
                       </span>
                       {user.status !== "ACTIVE" && (
                         <span className="bg-red-50 dark:bg-red-900/30 text-red-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase">
                           {user.status}
                         </span>
                       )}
                    </div>
                  </div>
                  <div className="p-2 bg-gray-50 dark:bg-gray-800 rounded-full shrink-0">
                    <ChevronRight className="w-4 h-4 text-gray-400" />
                  </div>
                </button>
              ))
            )}
          </div>
        )}
      </div>

      {/* --- Filter Slide-Out Drawer (Burger Menu Content) --- */}
      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          {/* Dimmed Background */}
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          
          {/* Drawer Panel */}
          <div className="relative w-[85%] max-w-sm bg-white dark:bg-gray-900 h-full shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10">
              <h2 className="font-black text-xl text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <Filter className="w-5 h-5 text-indigo-600" /> Filter Data
              </h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-8">
              
              {/* 1. History Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <CalendarDays className="w-4 h-4" /> Distribution History
                </label>
                <div className="grid grid-cols-2 gap-2">
                  {[
                    { label: "All Years", val: null }, 
                    { label: "New (0 Yrs)", val: 0 }, 
                    { label: "1 Year", val: 1 }, 
                    { label: "2 Years", val: 2 }, 
                    { label: "3+ Years", val: 3 }
                  ].map((btn) => (
                    <button 
                      key={String(btn.val)}
                      onClick={() => setFilters({...filters, yearCount: btn.val})}
                      className={`py-3 px-2 rounded-xl text-xs font-black transition-all border ${filters.yearCount === btn.val ? "bg-indigo-600 text-white border-indigo-600 shadow-md" : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border-transparent hover:border-indigo-300"}`}
                    >
                      {btn.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* 2. Pincode Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <MapPin className="w-4 h-4" /> Pincode
                </label>
                <select 
                  value={filters.pincode}
                  onChange={(e) => setFilters({...filters, pincode: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                >
                  <option value="">All Pincodes</option>
                  {metadata.pincodes.map(p => <option key={p} value={p}>{p}</option>)}
                </select>
              </div>

              {/* 3. Area Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <Map className="w-4 h-4" /> Local Area
                </label>
                <select 
                  value={filters.area}
                  onChange={(e) => setFilters({...filters, area: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                >
                  <option value="">All Areas</option>
                  {metadata.areas.map(a => <option key={a} value={a}>{a}</option>)}
                </select>
              </div>

              {/* 4. Reference Filter */}
              <div className="space-y-3">
                <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400">
                  <Tag className="w-4 h-4" /> Referenced By
                </label>
                <select 
                  value={filters.referencedBy}
                  onChange={(e) => setFilters({...filters, referencedBy: e.target.value})}
                  className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 font-bold text-sm outline-none focus:ring-2 ring-indigo-500"
                >
                  <option value="">Everyone</option>
                  {metadata.references.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>

            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
               <button 
                 onClick={clearFilters}
                 className="py-4 px-6 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform text-sm"
               >
                 Clear
               </button>
               <button 
                 onClick={applyFilters}
                 className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform text-sm"
               >
                 APPLY FILTERS
               </button>
            </div>
          </div>
        </div>
      )}

      {/* Render the selected user action modal */}
      <ActionModal />

    </main>
  );
}