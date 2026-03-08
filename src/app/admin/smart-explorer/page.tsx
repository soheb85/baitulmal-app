/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getFilterMetadata, fetchFilteredBeneficiaries } from "@/app/actions/admin/advancedFilterActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Filter, Users, X, ChevronRight, Loader2,
  MapPin, Map, Tag, CalendarDays, ShieldCheck, UserCog, Edit3, Search, HomeIcon, Briefcase, IndianRupee, Trash2,
  Fingerprint, Copy, CheckCircle2 // <-- Added new icons here
} from "lucide-react";
import { useRouter } from "next/navigation";

// Added new filters to defaults
const DEFAULT_FILTERS = {
  pincode: "", area: "", referencedBy: "", yearCount: null as number | null,
  gender: "", husbandStatus: "", isEarning: "", housingType: "", status: "",
  isException: "", hasProblems: "", todayStatus: "", isFullyVerified: ""
};

export default function SmartExplorerPage() {
  const { isNavigating, handleBack } = useBackNavigation("/");
  const router = useRouter();

  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetchingData, setIsFetchingData] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  
  const [metadata, setMetadata] = useState<{ pincodes: string[]; areas: string[]; references: string[]; }>({ pincodes: [], areas: [], references: [] });
  const [filters, setFilters] = useState(DEFAULT_FILTERS);
  const [results, setResults] = useState<any[]>([]);
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  // NEW: State to track which Aadhaar is currently copied
  const [copiedId, setCopiedId] = useState<string | null>(null);

  useEffect(() => {
    async function init() {
      setIsLoading(true);
      
      const metaRes = await getFilterMetadata();
      if (metaRes.success && metaRes.data) setMetadata(metaRes.data);

      const savedState = sessionStorage.getItem("smartExplorerState");
      let initialFilters = DEFAULT_FILTERS;
      let initialSearch = "";

      if (savedState) {
        const parsed = JSON.parse(savedState);
        initialFilters = { ...DEFAULT_FILTERS, ...parsed.filters }; 
        initialSearch = parsed.searchQuery || "";
        setFilters(initialFilters);
        setSearchQuery(initialSearch);
      }

      await performSearch(initialFilters, initialSearch);
      setIsLoading(false);
    }
    init();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (!isLoading) {
      sessionStorage.setItem("smartExplorerState", JSON.stringify({ filters, searchQuery }));
    }
  }, [filters, searchQuery, isLoading]);

  const performSearch = async (currentFilters: any, currentSearch: string) => {
    setIsFetchingData(true);
    const res = await fetchFilteredBeneficiaries(currentFilters, currentSearch);
    if (res.success) setResults(res.data);
    else alert("Error fetching data");
    setIsFetchingData(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(filters, searchQuery);
  };

  const applyFilters = () => {
    setIsFilterOpen(false); 
    performSearch(filters, searchQuery);
  };

  const clearAll = () => {
    setFilters(DEFAULT_FILTERS);
    setSearchQuery("");
    performSearch(DEFAULT_FILTERS, "");
    setIsFilterOpen(false);
  };

  // NEW: Handler to copy Aadhaar without opening the modal
  const handleCopyAadhaar = (e: React.MouseEvent, aadhar: string, id: string) => {
    e.stopPropagation(); // Prevents the parent <button> from triggering Action Modal
    if (aadhar) {
      navigator.clipboard.writeText(aadhar.toString());
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000); // Reset icon after 2 seconds
    }
  };

  const hasActiveFilters = Object.values(filters).some(val => val !== "" && val !== null) || searchQuery.trim() !== "";

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  // --- The Action Modal ---
  const ActionModal = () => {
    if (!selectedUser) return null;
    return (
      <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex flex-col justify-end p-4 animate-in fade-in">
        <div className="bg-white dark:bg-gray-900 w-full max-w-md mx-auto rounded-[2.5rem] p-6 shadow-2xl animate-in slide-in-from-bottom-10 mb-4 border border-gray-100 dark:border-gray-800 overflow-hidden min-w-0">
          
          <div className="flex justify-between items-start mb-6 gap-3 w-full min-w-0">
            <div className="min-w-0 flex-1 pr-2">
              <p className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-1">Select Action</p>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight break-all max-w-full line-clamp-2">{selectedUser.fullName}</h3>
              <p className="text-xs font-bold text-gray-500 mt-1 truncate">Mob: {selectedUser.mobileNumber} | Pin: {selectedUser.currentPincode}</p>
            </div>
            <button onClick={() => setSelectedUser(null)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform shrink-0">
              <X className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
          </div>

          <div className="space-y-3 w-full min-w-0">
            <button onClick={() => handleBack(`/beneficiaries/${selectedUser._id}`)} className="w-full flex items-center p-4 bg-purple-50 dark:bg-purple-900/10 rounded-2xl border border-purple-100 dark:border-purple-900/30 active:scale-95 transition-transform text-left min-w-0">
              <div className="bg-purple-100 dark:bg-purple-900/50 p-2.5 rounded-xl mr-4 shrink-0"><UserCog className="w-5 h-5 text-purple-600" /></div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-black text-gray-900 dark:text-white text-sm truncate">View Master Profile</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate">Read-only Details</p>
              </div>
              <ChevronRight className="w-4 h-4 text-purple-300 shrink-0" />
            </button>

            <button onClick={() => handleBack(`/beneficiaries/${selectedUser._id}/edit`)} className="w-full flex items-center p-4 bg-emerald-50 dark:bg-emerald-900/10 rounded-2xl border border-emerald-100 dark:border-emerald-900/30 active:scale-95 transition-transform text-left min-w-0">
              <div className="bg-emerald-100 dark:bg-emerald-900/50 p-2.5 rounded-xl mr-4 shrink-0"><Edit3 className="w-5 h-5 text-emerald-600" /></div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-black text-gray-900 dark:text-white text-sm truncate">Edit Profile</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate">Directly modify data</p>
              </div>
              <ChevronRight className="w-4 h-4 text-emerald-300 shrink-0" />
            </button>

            <button onClick={() => router.push(`/verify?search=${selectedUser.aadharNumber}`)} className="w-full flex items-center p-4 bg-blue-50 dark:bg-blue-900/10 rounded-2xl border border-blue-100 dark:border-blue-900/30 active:scale-95 transition-transform text-left min-w-0">
              <div className="bg-blue-100 dark:bg-blue-900/50 p-2.5 rounded-xl mr-4 shrink-0"><Search className="w-5 h-5 text-blue-600" /></div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-black text-gray-900 dark:text-white text-sm truncate">Verify Details</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate">Secure Aadhaar Search</p>
              </div>
              <ChevronRight className="w-4 h-4 text-blue-300 shrink-0" />
            </button>

            <button onClick={() => router.push(`/distribution/check-in?search=${selectedUser.aadharNumber}`)} className="w-full flex items-center p-4 bg-orange-50 dark:bg-orange-900/10 rounded-2xl border border-orange-100 dark:border-orange-900/30 active:scale-95 transition-transform text-left min-w-0">
              <div className="bg-orange-100 dark:bg-orange-900/50 p-2.5 rounded-xl mr-4 shrink-0"><ShieldCheck className="w-5 h-5 text-orange-600" /></div>
              <div className="flex-1 min-w-0 pr-2">
                <p className="font-black text-gray-900 dark:text-white text-sm truncate">Send to Check-In</p>
                <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest mt-0.5 truncate">Station 1 Queue</p>
              </div>
              <ChevronRight className="w-4 h-4 text-orange-300 shrink-0" />
            </button>
          </div>
        </div>
      </div>
    );
  };

  return (
    <main className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-950 font-outfit relative overflow-x-hidden">
      
      <header className="px-4 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 shadow-sm w-full min-w-0">
        <div className="flex items-center justify-between mb-4 w-full min-w-0">
          <div className="flex items-center gap-3 min-w-0">
            <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition-transform shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </button>
            <div className="min-w-0">
              <h1 className="text-xl font-black text-indigo-600 truncate">Smart Explorer</h1>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none truncate">Advanced Database Search</p>
            </div>
          </div>
          
          <div className="flex gap-2 shrink-0">
            {hasActiveFilters && (
               <button onClick={clearAll} className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-xl active:scale-95 transition-transform" title="Clear All Filters">
                 <Trash2 className="w-5 h-5" />
               </button>
            )}
            <button onClick={() => setIsFilterOpen(true)} className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 p-2.5 rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex items-center gap-2 active:scale-95 transition-transform relative">
              <Filter className="w-5 h-5" />
              {hasActiveFilters && <span className="absolute -top-1 -right-1 w-3 h-3 bg-red-500 rounded-full border-2 border-white dark:border-gray-900"></span>}
            </button>
          </div>
        </div>

        <form onSubmit={handleSearchSubmit} className="relative w-full shadow-sm min-w-0">
            <Search className="absolute left-4 top-3.5 w-5 h-5 text-gray-400 shrink-0" />
            <input 
              type="text" 
              value={searchQuery} 
              onChange={e => setSearchQuery(e.target.value)} 
              placeholder="Search Name, Aadhaar or Mobile..." 
              className="w-full pl-11 pr-4 py-3 rounded-2xl bg-gray-50 dark:bg-gray-800 border border-gray-200 dark:border-gray-700 outline-none focus:ring-2 focus:ring-indigo-500 text-sm font-bold min-w-0"
            />
        </form>
      </header>

      <div className="flex-1 p-4 pb-32 max-w-md mx-auto w-full min-w-0">
        {isLoading || isFetchingData ? (
           <div className="flex flex-col items-center justify-center py-20 opacity-50 w-full">
             <Loader2 className="w-10 h-10 animate-spin text-indigo-500 mb-4" />
             <p className="text-xs font-black uppercase tracking-widest text-indigo-600">Loading Data...</p>
           </div>
        ) : (
          <div className="space-y-4 w-full min-w-0">
            <div className="flex justify-between items-center ml-1">
               <p className="text-xs font-bold text-gray-500">Showing {results.length} results</p>
               {hasActiveFilters && <span className="text-[9px] bg-indigo-100 text-indigo-700 px-2 py-0.5 rounded-full font-black uppercase tracking-widest">Filters Active</span>}
            </div>

            {results.length === 0 ? (
              <div className="text-center bg-white dark:bg-gray-900 p-10 rounded-[2rem] border border-gray-100 dark:border-gray-800 w-full">
                <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
                <p className="font-bold text-gray-500">No beneficiaries match these filters.</p>
              </div>
            ) : (
              results.map((user) => (
                <button 
                  key={user._id}
                  onClick={() => setSelectedUser(user)}
                  className="w-full bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex items-center justify-between text-left active:scale-[0.98] transition-transform min-w-0 gap-2"
                >
                  <div className="min-w-0 flex-1 pr-2">
                    <div className="flex items-center gap-2 mb-0.5">
                      <h4 className="font-black text-gray-900 dark:text-white break-all max-w-full line-clamp-1 text-base">{user.fullName}</h4>
                      {user.isException && <span title="Special Exception" className="w-2 h-2 bg-red-500 rounded-full shrink-0"></span>}
                    </div>
                    
                    <div className="flex items-center gap-2 mt-1 text-[10px] font-bold text-gray-500 uppercase tracking-wider w-full min-w-0">
                       <MapPin className="w-3 h-3 shrink-0" />
                       <span className="truncate">{user.area || user.currentPincode}</span>
                    </div>

                    {/* NEW: Aadhaar Copy Badge */}
                    <div 
                      onClick={(e) => handleCopyAadhaar(e, user.aadharNumber, user._id)}
                      className="flex items-center gap-2 mt-2 bg-indigo-50/50 dark:bg-indigo-900/20 border border-indigo-100/50 dark:border-indigo-800/30 px-2.5 py-1.5 rounded-lg w-fit hover:bg-indigo-100 dark:hover:bg-indigo-900/40 transition-colors"
                      title="Click to copy Aadhaar"
                    >
                      <Fingerprint className="w-3.5 h-3.5 text-indigo-500 shrink-0" />
                      <span className="text-[11px] font-mono font-bold text-indigo-700 dark:text-indigo-300">
                        {user.aadharNumber
                        ?.toString()
                        .replace(/(\d{4})(?=\d)/g, "$1 ") || "N/A"}
                      </span>
                      {copiedId === user._id ? (
                        <CheckCircle2 className="w-3.5 h-3.5 text-green-500 shrink-0" />
                      ) : (
                        <Copy className="w-3 h-3 text-indigo-400 shrink-0" />
                      )}
                    </div>

                    <div className="flex flex-wrap gap-1.5 mt-3">
                       <span className="bg-indigo-50 dark:bg-indigo-900/30 text-indigo-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-indigo-100 dark:border-indigo-800 shrink-0">
                         {user.distributedYears?.length || 0} Yrs Hist
                       </span>
                       {user.isEarning ? (
                         <span className="bg-green-50 dark:bg-green-900/30 text-green-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-green-100 dark:border-green-800 shrink-0">
                           Earns ₹{user.totalFamilyIncome}
                         </span>
                       ) : (
                         <span className="bg-orange-50 dark:bg-orange-900/30 text-orange-700 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-orange-100 dark:border-orange-800 shrink-0">
                           No Income
                         </span>
                       )}
                       {user.status !== "ACTIVE" && (
                         <span className="bg-red-50 dark:bg-red-900/30 text-red-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-red-100 dark:border-red-800 shrink-0">
                           {user.status}
                         </span>
                       )}
                       {user.distributedYears?.includes(new Date().getFullYear()) && (
                        <span className="bg-blue-50 dark:bg-green-900/30 text-green-600 text-[9px] font-black px-2 py-0.5 rounded-md uppercase border border-blue-100 dark:border-green-800 shrink-0">
                          Collected
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

      {isFilterOpen && (
        <div className="fixed inset-0 z-50 flex justify-end">
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" onClick={() => setIsFilterOpen(false)} />
          
          <div className="relative w-[85%] max-w-sm bg-white dark:bg-gray-900 h-full shadow-2xl animate-in slide-in-from-right flex flex-col">
            <div className="p-5 border-b border-gray-100 dark:border-gray-800 flex justify-between items-center bg-indigo-50/50 dark:bg-indigo-900/10">
              <h2 className="font-black text-xl text-indigo-900 dark:text-indigo-100 flex items-center gap-2">
                <Filter className="w-5 h-5 text-indigo-600" /> Advanced Filters
              </h2>
              <button onClick={() => setIsFilterOpen(false)} className="p-1.5 bg-white dark:bg-gray-800 rounded-full shadow-sm active:scale-90">
                <X className="w-5 h-5 text-gray-500" />
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-5 space-y-6">
              
              {/* Core Location */}
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-indigo-500 mb-2">Location</h3>
                <div className="space-y-3">
                  <select value={filters.pincode} onChange={(e) => setFilters({...filters, pincode: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Pincode</option>
                    {metadata.pincodes.map(p => <option key={p} value={p}>{p}</option>)}
                  </select>
                  <select value={filters.area} onChange={(e) => setFilters({...filters, area: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Area</option>
                    {metadata.areas.map(a => <option key={a} value={a}>{a}</option>)}
                  </select>
                </div>
              </div>

              {/* Economic & Housing */}
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-green-600 mb-2">Economic & Issues</h3>
                <div className="space-y-3">
                  <select value={filters.isEarning} onChange={(e) => setFilters({...filters, isEarning: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Income Status</option>
                    <option value="true">Applicant is Earning</option>
                    <option value="false">Applicant has NO Income</option>
                  </select>
                  <select value={filters.housingType} onChange={(e) => setFilters({...filters, housingType: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Housing Type</option>
                    <option value="OWN">Own House</option>
                    <option value="RENT">Rented House</option>
                  </select>
                  <select value={filters.hasProblems} onChange={(e) => setFilters({...filters, hasProblems: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Problem Status</option>
                    <option value="true">Has Reported Problems</option>
                    <option value="false">No Problems</option>
                  </select>
                </div>
              </div>

              {/* Demographics */}
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-purple-500 mb-2">Demographics</h3>
                <div className="grid grid-cols-2 gap-2">
                  <select value={filters.gender} onChange={(e) => setFilters({...filters, gender: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Gender</option>
                    <option value="FEMALE">Female</option>
                    <option value="MALE">Male</option>
                  </select>
                  <select value={filters.husbandStatus} onChange={(e) => setFilters({...filters, husbandStatus: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Status</option>
                    <option value="ALIVE">Alive</option>
                    <option value="WIDOW">Widow</option>
                    <option value="ABANDONED">Abandoned</option>
                    <option value="DIVORCED">Divorced</option>
                    <option value="DISABLED">Disabled</option>
                  </select>
                </div>
              </div>

              {/* System Data */}
              <div className="space-y-4 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <h3 className="text-[10px] font-black uppercase tracking-widest text-orange-500 mb-2">System Logs</h3>
                <div className="space-y-3">
                  <select value={filters.status} onChange={(e) => setFilters({...filters, status: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Account Status</option>
                    <option value="ACTIVE">Active Only</option>
                    <option value="BLACKLISTED">Blacklisted Only</option>
                    <option value="ON_HOLD">On Hold Only</option>
                  </select>

                  <select value={filters.isFullyVerified} onChange={(e) => setFilters({...filters, isFullyVerified: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Verification Status</option>
                    <option value="true">Fully Verified</option>
                    <option value="false">Pending / Expired</option>
                  </select>

                  <select value={filters.isException} onChange={(e) => setFilters({...filters, isException: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Exception Status</option>
                    <option value="true">Is Exception Case</option>
                    <option value="false">Standard Case</option>
                  </select>

                  <select value={filters.yearCount === null ? "" : filters.yearCount} onChange={(e) => setFilters({...filters, yearCount: e.target.value === "" ? null : Number(e.target.value)})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any History Count</option>
                    <option value="0">New (0 Years History)</option>
                    <option value="1">1 Year History</option>
                    <option value="2">2 Years History</option>
                    <option value="3">3+ Years History</option>
                  </select>

                  <select value={filters.todayStatus} onChange={(e) => setFilters({...filters, todayStatus: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Queue Status</option>
                    <option value="CHECKED_IN">Currently In Queue</option>
                    <option value="COLLECTED">Collected Today</option>
                  </select>

                  <select value={filters.referencedBy} onChange={(e) => setFilters({...filters, referencedBy: e.target.value})} className="w-full p-3 rounded-xl bg-white dark:bg-gray-900 font-bold text-sm outline-none border border-gray-200 dark:border-gray-700">
                    <option value="">Any Reference</option>
                    {metadata.references.map(r => <option key={r} value={r}>{r}</option>)}
                  </select>
                </div>
              </div>
            </div>

            {/* Bottom Actions */}
            <div className="p-5 border-t border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 flex gap-3">
               <button onClick={clearAll} className="py-4 px-6 rounded-xl font-bold text-gray-500 bg-gray-100 dark:bg-gray-800 active:scale-95 transition-transform text-sm shrink-0">
                 Clear
               </button>
               <button onClick={applyFilters} className="flex-1 py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform text-sm min-w-0">
                 <span className="truncate">APPLY FILTERS</span>
               </button>
            </div>
          </div>
        </div>
      )}

      <ActionModal />
    </main>
  );
}