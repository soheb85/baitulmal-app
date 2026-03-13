/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { updateBeneficiaryStatus } from "@/app/actions/updateStatus"; // 🌟 ADDED IMPORT
import { 
  ArrowLeft, Search, Loader2, Fingerprint, AlertTriangle, Phone, 
  MapPin, ShieldCheck, Clock, CalendarRange, History, 
  Users, Wallet, Home, Briefcase, IndianRupee, School, GraduationCap, 
  Activity, BadgeCheck, ShieldAlert, UserPlus, FileEdit, Info, Archive,
  CheckCircle2, XCircle, RotateCcw // 🌟 ADDED ACTION ICONS
} from "lucide-react";

// 🌟 CONSTANTS FOR DROPDOWN
const VERIFICATION_AUTHORITIES = [
  "Bilali Masjid Trust",
  "Local Masjid Committee",
  "Area Corporator",
  "Field Volunteer",
  "Direct Admin",
  "Custom / Manual Entry" // <-- Triggers the manual input box
];

export default function MasterSearchPage() {
  const router = useRouter();
  const { handleBack } = useBackNavigation("/");
  
  const [query, setQuery] = useState("");
  const [debouncedQuery, setDebouncedQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<any>(null);
  
  // Toggle States
  const [expandFamily, setExpandFamily] = useState(false);
  const [expandPastCycles, setExpandPastCycles] = useState(false); 

  // 🌟 NEW: ACTION DESK STATES
  const [activeModal, setActiveModal] = useState<"APPROVE" | "REJECT" | null>(null);
  const [selectedAuthority, setSelectedAuthority] = useState(VERIFICATION_AUTHORITIES[0]);
  const [customAuthority, setCustomAuthority] = useState("");
  const [blockReason, setBlockReason] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  
  // Default action date to today (YYYY-MM-DD format for input type="date")
  const todayFormatted = new Date().toISOString().split('T')[0];
  const [actionDate, setActionDate] = useState(todayFormatted);

  // --- Debounce Logic ---
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedQuery(query);
    }, 600);
    return () => clearTimeout(handler);
  }, [query]);

  // --- Auto-Search Logic ---
  useEffect(() => {
    if (!debouncedQuery.trim()) return; 

    const fetchProfile = async () => {
      setLoading(true);
      const result = await searchBeneficiary(debouncedQuery);
      if (result.success && result.data) {
        setData(result.data);
      } else {
        setData(null);
      }
      setLoading(false);
    };
    fetchProfile();
  }, [debouncedQuery]);

  // 🌟 NEW: SUBMIT STATUS HANDLER
  const submitStatusChange = async (newStatus: "ACTIVE" | "BLACKLISTED") => {
    if (!data?._id) return;
    if (newStatus === "BLACKLISTED" && !blockReason.trim()) {
      alert("Please provide a reason for rejection.");
      return;
    }

    const finalAuthority = selectedAuthority === "Custom / Manual Entry" ? customAuthority : selectedAuthority;
    if (!finalAuthority.trim()) {
      alert("Please specify the approving/rejecting authority.");
      return;
    }

    setIsUpdating(true);
    const result = await updateBeneficiaryStatus(data._id, newStatus, finalAuthority, blockReason, actionDate);

    if (result.success) {
      // Re-fetch to get perfectly formatted string from backend
      const refreshed = await searchBeneficiary(data.aadharNumber);
      if (refreshed.success) setData(refreshed.data);
      
      setActiveModal(null);
      setBlockReason("");
      setCustomAuthority("");
    } else {
      alert(result.message);
    }
    setIsUpdating(false);
  };

  // --- Helper Variables ---
  const yearsTaken = data?.distributedYears?.length || 0;
  const cycleInfo = data?.verificationCycle;
  const isExpired = cycleInfo?.endDate && new Date() > new Date(cycleInfo.endDate);
  const isFullyVerified = cycleInfo?.isFullyVerified;
  const isBlacklisted = data?.status === 'BLACKLISTED';
  const hasAddressMismatch = data?.aadharPincode !== data?.currentPincode;
  const hasPastCycles = data?.pastCycles && data.pastCycles.length > 0;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative font-outfit">
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* --- Header --- */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-black text-violet-600 flex items-center gap-2">
              <Search className="w-4 h-4" /> Master Search
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Global Database Query</p>
          </div>
        </div>

        {/* --- Search Input Box --- */}
        <div className="relative mb-6 shadow-sm w-full animate-in fade-in">
          <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
            <Search className="w-5 h-5 text-gray-400" />
          </div>
          <input 
            type="text" 
            value={query}
            onChange={(e) => {
              const val = e.target.value;
              setQuery(val);
              if (!val.trim()) {
                setData(null);
                setExpandPastCycles(false);
                setExpandFamily(false); 
                setActiveModal(null); // Reset modal
              }
            }}
            placeholder="Name, Aadhaar, Mobile, Notes..." 
            className="w-full pl-11 pr-12 py-4 bg-white dark:bg-gray-900 rounded-[2rem] border border-gray-200 dark:border-gray-800 text-sm font-bold outline-none focus:ring-4 focus:ring-violet-500/10 focus:border-violet-500 transition-all text-gray-900 dark:text-white placeholder:text-gray-400 shadow-sm"
          />
          {loading && (
            <div className="absolute inset-y-0 right-0 pr-4 flex items-center">
              <Loader2 className="w-5 h-5 text-violet-500 animate-spin" />
            </div>
          )}
        </div>

        {/* --- NOT FOUND STATE & QUICK REGISTER --- */}
        {query.trim() && !loading && !data && (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-[2rem] border border-dashed border-gray-300 dark:border-gray-700 text-center shadow-sm animate-in fade-in">
            <div className="bg-gray-100 dark:bg-gray-800 w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4">
               <Search className="w-8 h-8 text-gray-400" />
            </div>
            <h3 className="text-lg font-black text-gray-900 dark:text-white mb-1">No Record Found</h3>
            <p className="text-xs text-gray-500 mb-6 font-medium leading-relaxed">
              We couldn&apos;t find any details matching &quot;{query}&quot;. Please check the number, or register them as a new family.
            </p>
            
            <button 
              onClick={() => router.push(`/register?auto=${encodeURIComponent(query)}`)} 
              className="w-full py-4 bg-violet-600 hover:bg-violet-700 text-white font-black rounded-2xl shadow-lg shadow-violet-200 dark:shadow-none transition-transform active:scale-95 flex items-center justify-center gap-2"
            >
              <UserPlus className="w-5 h-5" /> CLICK TO REGISTER !!
            </button>
          </div>
        )}

        {/* --- RENDER MASTER PROFILE --- */}
        {data && !loading && (
          <div className="space-y-4 animate-in slide-in-from-bottom-6 fade-in duration-500">
            
            {/* 0. LIVE QUEUE STATUS */}
            {data.todayStatus?.status && (
              <div className={`p-4 rounded-2xl border shadow-sm flex items-center justify-between ${data.todayStatus.status === 'COLLECTED' ? 'bg-green-50 border-green-200 text-green-800' : 'bg-blue-50 border-blue-200 text-blue-800'}`}>
                 <div className="flex items-center gap-3">
                   <div className="relative">
                      <span className={`flex h-3 w-3 rounded-full ${data.todayStatus.status === 'COLLECTED' ? 'bg-green-500' : 'bg-blue-500 animate-ping'}`}></span>
                   </div>
                   <div>
                     <p className="text-[10px] font-black uppercase tracking-widest opacity-70">Live Status</p>
                     <p className="text-sm font-bold">
                       {data.todayStatus.status === 'CHECKED_IN' ? 'Currently in Queue' : `Ration Collected ${data.distributionHistory && data.distributionHistory.length > 0 ? `on ${new Date(data.distributionHistory.slice(-1)[0].date).toLocaleDateString("en-IN")}` : ''}`}
                     </p>
                     {data.todayStatus.tempNote && <p className="text-xs mt-0.5 italic">&quot;{data.todayStatus.tempNote}&quot;</p>}
                   </div>
                 </div>
                 {data.todayStatus.tokenNumber && (
                   <div className="text-center bg-white/50 px-3 py-1 rounded-xl">
                     <p className="text-[9px] font-black uppercase">Token</p>
                     <p className="text-xl font-black">#{data.todayStatus.tokenNumber}</p>
                   </div>
                 )}
              </div>
            )}

            {/* 1. Identity Card & Demographics */}
            <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden w-full min-w-0">
                <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-[1.2rem] text-[9px] font-black uppercase tracking-[0.2em] ${
                    data.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : data.status === 'ON_HOLD' ? 'bg-amber-500 text-white' : 'bg-red-600 text-white'
                }`}>
                    {data.status}
                </div>

                <h2 className="text-[23px] font-black text-gray-900 dark:text-white leading-tight mb-2 pr-10 break-words">
                  {data.fullName}
                </h2>
                
                {/* Demographic Badges */}
                <div className="flex flex-wrap gap-2 mb-4">
                   <span className="text-[9px] font-black uppercase tracking-widest bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 px-2 py-1 rounded-lg">
                     {data.gender}
                   </span>
                   {data.husbandStatus && data.husbandStatus !== 'ALIVE' && (
                     <span className="text-[9px] font-black uppercase tracking-widest bg-purple-50 dark:bg-purple-900/30 text-purple-600 dark:text-purple-400 px-2 py-1 rounded-lg">
                       {data.husbandStatus.replace('_', ' ')}
                     </span>
                   )}
                   {data.isException && (
                     <span className="text-[9px] font-black uppercase tracking-widest bg-rose-50 dark:bg-rose-900/30 text-rose-600 dark:text-rose-400 px-2 py-1 rounded-lg flex items-center gap-1">
                       <AlertTriangle className="w-3 h-3" /> Exception
                     </span>
                   )}
                </div>
                
                {/* Aadhaar & Mobile */}
                <div className="flex flex-col gap-3 w-full mb-4">
                  <div className="flex items-center justify-between bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Fingerprint className="w-5 h-5 text-indigo-600 dark:text-indigo-400" />
                      <div>
                        <p className="text-[9px] font-bold text-indigo-400 uppercase tracking-widest">Aadhaar Number</p>
                        <p className="text-sm font-mono text-indigo-700 dark:text-indigo-300 font-black tracking-tight">{data.aadharNumber?.toString().replace(/(\d{4})(?=\d)/g, "$1 ")}</p>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/20 border border-blue-100 dark:border-blue-800/50 p-3 rounded-xl">
                    <div className="flex items-center gap-3">
                      <Phone className="w-5 h-5 text-blue-600 dark:text-blue-400" />
                      <div>
                        <p className="text-[9px] font-bold text-blue-400 uppercase tracking-widest">Mobile Number</p>
                        <p className="text-sm font-black text-blue-700 dark:text-blue-300">{data.mobileNumber}</p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* Address & Pincode Warning */}
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 relative">
                    <div className="flex gap-3">
                      <MapPin className="w-5 h-5 text-purple-600 shrink-0 mt-0.5" />
                      <div className="min-w-0 flex-1">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Current Address</p>
                          <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug break-words">
                            {data.currentAddress}
                          </p>
                          <div className="flex items-center gap-2 mt-2">
                            <span className="text-[10px] font-black text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                                {data.area || "N/A"}
                            </span>
                            <span className="text-[10px] font-black text-gray-500 uppercase">Pin: {data.currentPincode}</span>
                          </div>
                          
                          {/* Address Mismatch Warning */}
                          {hasAddressMismatch && (
                            <div className="mt-3 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-200 flex items-start gap-2">
                              <Info className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                              <p className="text-[10px] text-amber-800 dark:text-amber-200 font-bold leading-tight">
                                Aadhaar Pincode ({data.aadharPincode}) does not match Current Pincode ({data.currentPincode}). May be a migrant.
                              </p>
                            </div>
                          )}
                      </div>
                    </div>
                </div>
            </div>

            {/* 🌟 2. DISPLAY RECORD: VERIFICATION & NOTES 🌟 */}
            <div className="grid grid-cols-1 gap-4 w-full min-w-0">
              
              {/* Dynamic Verification Card (Green for Approved, Red for Rejected) */}
              {(data.approvedBy || data.rejectionBy) && (
                <div className={`relative p-5 rounded-[2rem] border shadow-sm w-full overflow-hidden ${
                  data.status === 'ACTIVE' 
                    ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50' 
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                }`}>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`p-3 rounded-2xl shrink-0 shadow-sm ${
                      data.status === 'ACTIVE' 
                        ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white'
                        : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                    }`}>
                      {data.status === 'ACTIVE' ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-black uppercase text-[10px] tracking-[0.2em] mb-1 ${
                        data.status === 'ACTIVE' ? 'text-teal-700 dark:text-teal-400' : 'text-rose-700 dark:text-rose-400'
                      }`}>
                        {data.status === 'ACTIVE' ? 'Officially Verified' : 'Account Restricted'}
                      </h3>
                      
                      <div className={`p-3 rounded-xl border mt-2 ${
                        data.status === 'ACTIVE' 
                          ? 'bg-teal-100/50 dark:bg-black/20 border-teal-200/50 dark:border-white/5'
                          : 'bg-rose-100/50 dark:bg-black/20 border-rose-200/50 dark:border-white/5'
                      }`}>
                        <p className={`text-xs font-bold leading-relaxed ${
                          data.status === 'ACTIVE' ? 'text-teal-900 dark:text-teal-200' : 'text-rose-900 dark:text-rose-200'
                        }`}>
                          {data.status === 'ACTIVE' 
                            ? `Approved by: ${data.approvedBy}` 
                            : `Rejected by: ${data.rejectionBy || 'System Admin'}`
                          }
                        </p>
                        {/* Show rejection reason clearly inside the red box */}
                        {data.status === 'BLACKLISTED' && data.rejectionReason && (
                          <p className="text-[11px] font-black text-rose-800 dark:text-rose-300 mt-1 italic break-words border-t border-rose-200/50 pt-1">
                            &quot;{data.rejectionReason}&quot;
                          </p>
                        )}
                      </div>
                      
                      {(data.approvedAt || data.updatedAt) && (
                        <p className={`text-[8px] font-black uppercase tracking-widest mt-2 opacity-60 ${
                          data.status === 'ACTIVE' ? 'text-teal-800 dark:text-teal-200' : 'text-rose-800 dark:text-rose-200'
                        }`}>
                          Date of Decision: {new Date(data.approvedAt || data.updatedAt).toLocaleDateString("en-IN")}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Admin Notes / Remarks Card */}
              {data.comments && (
                  <div className="bg-amber-50 dark:bg-amber-900/20 p-5 rounded-[2rem] border border-amber-200 dark:border-amber-900/50 shadow-sm w-full flex gap-3 items-start">
                      <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl shrink-0">
                        <FileEdit className="w-5 h-5 text-amber-600 dark:text-amber-400" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <h3 className="text-[10px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Admin Remarks</h3>
                        <p className="text-sm text-amber-900 dark:text-amber-100 font-bold leading-relaxed break-words italic">&quot;{data.comments}&quot;</p>
                      </div>
                  </div>
              )}
            </div>

            {/* 🌟 3. NEW ACTION DESK (Approve/Reject directly from Search) 🌟 */}
            <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-500" /> Take Action
              </h3>

              {activeModal === null && (
                <div className="flex gap-2">
                  <button 
                    onClick={() => setActiveModal("APPROVE")}
                    className="flex-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 font-black py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <CheckCircle2 className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-wider">Approve</span>
                  </button>
                  <button 
                    onClick={() => setActiveModal("REJECT")}
                    className="flex-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-black py-3 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95"
                  >
                    <XCircle className="w-5 h-5" />
                    <span className="text-[10px] uppercase tracking-wider">Reject / Block</span>
                  </button>
                </div>
              )}

              {/* APPROVAL UI */}
              {activeModal === "APPROVE" && (
                <div className="bg-teal-50 dark:bg-teal-900/10 p-4 rounded-xl border border-teal-200 dark:border-teal-800/50 animate-in fade-in zoom-in-95">
                  <h4 className="text-teal-800 dark:text-teal-400 font-black text-sm mb-3">Mark as Verified</h4>
                  
                  <label className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-500 tracking-wider mb-1 block">Approved By</label>
                  <select 
                    value={selectedAuthority} 
                    onChange={e => setSelectedAuthority(e.target.value)}
                    className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 mb-3 shadow-sm"
                  >
                    {VERIFICATION_AUTHORITIES.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                  </select>

                  {/* Manual Type Box */}
                  {selectedAuthority === "Custom / Manual Entry" && (
                    <div className="mb-3 animate-in slide-in-from-top-2">
                      <label className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-500 tracking-wider mb-1 block">Type Authority Name</label>
                      <input 
                        type="text" 
                        value={customAuthority} 
                        onChange={(e) => setCustomAuthority(e.target.value)}
                        placeholder="e.g., Ward President XYZ"
                        className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 shadow-sm"
                      />
                    </div>
                  )}

                  {/* Custom Date Box */}
                  <label className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-500 tracking-wider mb-1 block">Date of Approval</label>
                  <input 
                    type="date"
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 mb-4 shadow-sm"
                  />

                  <div className="flex gap-2">
                    <button onClick={() => setActiveModal(null)} className="flex-[1] py-3.5 bg-white dark:bg-gray-800 text-gray-500 font-bold rounded-xl text-xs shadow-sm active:scale-95">Cancel</button>
                    <button onClick={() => submitStatusChange("ACTIVE")} disabled={isUpdating} className="flex-[2] py-3.5 bg-teal-600 hover:bg-teal-700 text-white font-black rounded-xl text-xs shadow-md active:scale-95 flex justify-center items-center">
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONFIRM APPROVAL"}
                    </button>
                  </div>
                </div>
              )}

              {/* REJECTION UI */}
              {activeModal === "REJECT" && (
                <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-200 dark:border-rose-800/50 animate-in fade-in zoom-in-95">
                  <h4 className="text-rose-800 dark:text-rose-400 font-black text-sm mb-3">Reject / Block</h4>
                  
                  <label className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-500 tracking-wider mb-1 block">Rejected By</label>
                  <select 
                    value={selectedAuthority} 
                    onChange={e => setSelectedAuthority(e.target.value)}
                    className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 mb-3 shadow-sm"
                  >
                    {VERIFICATION_AUTHORITIES.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                  </select>

                  {/* Manual Type Box */}
                  {selectedAuthority === "Custom / Manual Entry" && (
                    <div className="mb-3 animate-in slide-in-from-top-2">
                      <label className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-500 tracking-wider mb-1 block">Type Authority Name</label>
                      <input 
                        type="text" 
                        value={customAuthority} 
                        onChange={(e) => setCustomAuthority(e.target.value)}
                        placeholder="e.g., Fraud Checking Team"
                        className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 shadow-sm"
                      />
                    </div>
                  )}

                  {/* Custom Date Box */}
                  <label className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-500 tracking-wider mb-1 block">Date of Rejection</label>
                  <input 
                    type="date"
                    value={actionDate}
                    onChange={(e) => setActionDate(e.target.value)}
                    className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 mb-3 shadow-sm"
                  />

                  <label className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-500 tracking-wider mb-1 block">Detailed Reason</label>
                  <textarea 
                    value={blockReason} 
                    onChange={(e) => setBlockReason(e.target.value)} 
                    placeholder="e.g. Moved out of area, Fake documents..." 
                    className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-gray-900 dark:text-white text-sm font-bold focus:ring-2 focus:ring-rose-500 outline-none mb-4 shadow-sm" 
                    rows={2} 
                  />

                  <div className="flex gap-2">
                    <button onClick={() => setActiveModal(null)} className="flex-[1] py-3.5 bg-white dark:bg-gray-800 text-gray-500 font-bold rounded-xl text-xs shadow-sm active:scale-95">Cancel</button>
                    <button onClick={() => submitStatusChange("BLACKLISTED")} disabled={isUpdating} className="flex-[2] py-3.5 bg-rose-600 hover:bg-rose-700 text-white font-black rounded-xl text-xs shadow-md active:scale-95 flex justify-center items-center">
                      {isUpdating ? <Loader2 className="w-4 h-4 animate-spin" /> : "CONFIRM REJECTION"}
                    </button>
                  </div>
                </div>
              )}
            </div>

            {/* Quick Restore if Blacklisted */}
            {data.status === "BLACKLISTED" && activeModal === null && (
               <button onClick={() => submitStatusChange("ACTIVE")} disabled={isUpdating} className="w-full mt-2 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-gray-700 dark:text-gray-300 font-black py-4 rounded-2xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-xs shadow-sm">
                 {isUpdating ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <><RotateCcw className="w-4 h-4 shrink-0" /> Remove Block & Restore</>}
               </button>
            )}

            {/* 4. 3-YEAR CYCLE VERIFICATION & ARCHIVE */}
            {!isBlacklisted && (
              <section className={`p-5 rounded-[2rem] border shadow-sm flex flex-col gap-4 w-full min-w-0 ${
                  isExpired ? "bg-red-50 border-red-100 dark:bg-red-900/10" : "bg-teal-50 border-teal-100 dark:bg-teal-900/10"
              }`}>
                  <div className="flex justify-between items-center w-full min-w-0 gap-2">
                      <div className="flex items-center gap-2 min-w-0">
                          {isExpired ? <Clock className="w-5 h-5 text-red-600 shrink-0" /> : <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />}
                          <h3 className={`text-xs font-black uppercase tracking-widest truncate ${isExpired ? "text-red-700" : "text-teal-700"}`}>
                            {isExpired ? "Cycle Expired" : "Cycle Active"}
                          </h3>
                      </div>
                      <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase shadow-sm ${isFullyVerified ? 'bg-teal-600 text-white' : 'bg-orange-500 text-white'}`}>
                        {isFullyVerified ? 'Verified' : 'Pending'}
                      </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 bg-white/50 dark:bg-black/20 p-3 rounded-xl">
                    <div className="min-w-0">
                        <p className="text-[8px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><CalendarRange className="w-3 h-3" /> Start Date</p>
                        <p className="text-sm font-black text-gray-800 dark:text-gray-200 truncate">
                          {cycleInfo?.startDate ? new Date(cycleInfo.startDate).toLocaleDateString("en-IN") : "N/A"}
                        </p>
                    </div>
                    <div className="min-w-0">
                        <p className="text-[8px] font-bold text-gray-500 uppercase flex items-center gap-1 mb-1"><History className="w-3 h-3" /> Renewal Date</p>
                        <p className={`text-sm font-black truncate ${isExpired ? "text-red-600" : "text-gray-800 dark:text-gray-200"}`}>
                          {cycleInfo?.endDate ? new Date(cycleInfo.endDate).toLocaleDateString("en-IN") : "N/A"}
                        </p>
                    </div>
                  </div>

                  {/* 🌟 PAST CYCLES ARCHIVE TOGGLE 🌟 */}
                  {hasPastCycles && (
                    <>
                      <button 
                        onClick={() => setExpandPastCycles(!expandPastCycles)}
                        className="w-full py-2 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest text-teal-700 dark:text-teal-400 bg-teal-100/50 dark:bg-teal-900/30 rounded-xl hover:bg-teal-200/50 transition-colors"
                      >
                        <Archive className="w-3.5 h-3.5" /> 
                        {expandPastCycles ? "Hide Historical Cycles" : `View Past Cycles (${data.pastCycles.length})`}
                      </button>

                      {expandPastCycles && (
                        <div className="space-y-3 pt-2 animate-in fade-in">
                          {data.pastCycles.slice().reverse().map((past: any, index: number) => (
                            <div key={index} className="bg-white dark:bg-gray-800 p-3 rounded-xl border border-teal-100 dark:border-teal-900/50 shadow-sm relative overflow-hidden">
                              <div className="absolute top-0 right-0 px-2 py-0.5 bg-gray-200 dark:bg-gray-700 text-[8px] font-black text-gray-500 rounded-bl-lg">ARCHIVED</div>
                              <p className="text-[10px] font-bold text-gray-500 uppercase mb-1">Cycle Range</p>
                              <p className="text-xs font-black text-gray-800 dark:text-gray-200 mb-2">
                                {new Date(past.startDate).getFullYear()} - {new Date(past.endDate).getFullYear()}
                              </p>
                              <div className="flex flex-wrap gap-1.5">
                                {past.distributedYears && past.distributedYears.length > 0 ? (
                                  past.distributedYears.map((yr: number) => (
                                    <span key={yr} className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded text-[9px] font-black tracking-widest uppercase">
                                      Took Ration: {yr}
                                    </span>
                                  ))
                                ) : (
                                  <span className="text-[9px] font-bold text-gray-400 italic">No ration taken during this cycle.</span>
                                )}
                              </div>
                            </div>
                          ))}
                        </div>
                      )}
                    </>
                  )}
              </section>
            )}

            {/* 5. DISTRIBUTION HISTORY (Detailed Tracker) */}
            <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm w-full min-w-0 relative overflow-hidden">
                <Activity className="absolute -right-2 -top-2 w-20 h-20 text-purple-500/5 -rotate-12" />
                <div className="flex justify-between items-end mb-4 relative z-10">
                    <div>
                      <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-purple-600 mb-1">Active Cycle Aid</h3>
                      <p className="text-xl font-black text-gray-900 dark:text-white">
                        {yearsTaken} <span className="text-gray-400 text-sm font-bold">/ 3 Years Taken</span>
                      </p>
                    </div>
                </div>

                {/* Progress Bar */}
                <div className="flex gap-2 w-full h-8 mb-6 relative z-10">
                    {[1, 2, 3].map((year) => (
                        <div key={year} className={`flex-1 rounded-xl flex items-center justify-center border-2 transition-all ${
                            year <= yearsTaken ? "bg-purple-600 border-purple-400 shadow-md shadow-purple-100 dark:shadow-none" : "bg-gray-50 dark:bg-gray-800 border-dashed border-gray-200 dark:border-gray-700"
                        }`}>
                            {year <= yearsTaken ? <BadgeCheck className="w-4 h-4 text-white" /> : null}
                        </div>
                    ))}
                </div>
                
                {/* Detailed Lifetime Logs */}
                <div className="border-t border-gray-100 dark:border-gray-800 pt-4">
                  <h4 className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-3">Lifetime Event Log</h4>
                  {data.distributionHistory && data.distributionHistory.length > 0 ? (
                    <div className="space-y-2">
                      {data.distributionHistory.slice().reverse().map((log: any, i: number) => (
                        <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800/50 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                          <div className="flex items-center gap-2">
                             <div className="bg-purple-100 dark:bg-purple-900/30 p-1.5 rounded-lg">
                               <BadgeCheck className="w-3.5 h-3.5 text-purple-600" />
                             </div>
                             <div>
                               <p className="text-[10px] font-bold text-gray-500 uppercase">Year {log.year}</p>
                               <p className="text-xs font-black text-gray-800 dark:text-gray-200">{new Date(log.date).toLocaleDateString("en-IN")}</p>
                             </div>
                          </div>
                          {log.tokenNumber && (
                            <span className="text-[10px] font-black bg-white dark:bg-gray-700 px-2 py-1 rounded shadow-sm border border-gray-200 dark:border-gray-600">
                              Token #{log.tokenNumber}
                            </span>
                          )}
                        </div>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs font-bold text-gray-400 italic bg-gray-50 dark:bg-gray-800 p-3 rounded-xl text-center border border-dashed border-gray-200 dark:border-gray-700">No collection records found.</p>
                  )}
                </div>
            </section>

            {/* 6. HOUSEHOLD & ECONOMY */}
            <section className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full min-w-0">
                <div className="flex justify-between items-center mb-4">
                  <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                      <Users className="w-4 h-4" /> Household Stats
                  </h3>
                  <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-1 rounded-full uppercase">Members: {data.familyMembersDetail?.length || 0}</span>
                </div>

                {/* Family Demographic Count */}
                <div className="flex items-center justify-between bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 mb-4 text-[10px] font-black uppercase tracking-wider text-blue-800 dark:text-blue-300">
                   <span className="flex flex-col items-center">👦 <span className="mt-0.5">{data.sons || 0} Sons</span></span>
                   <span className="flex flex-col items-center">👧 <span className="mt-0.5">{data.daughters || 0} Dtrs</span></span>
                   <span className="flex flex-col items-center">👴 <span className="mt-0.5">{data.otherDependents || 0} Dep.</span></span>
                   <span className="flex flex-col items-center text-emerald-600">💼 <span className="mt-0.5">{data.earningMembersCount || 0} Earning</span></span>
                </div>

                <div className="grid grid-cols-2 gap-3 mb-4">
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><Wallet className="w-3 h-3" /> Income</p>
                      <p className="text-sm font-black text-emerald-600 truncate">₹{data.totalFamilyIncome}</p>
                    </div>
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                      <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1 mb-1"><Home className="w-3 h-3" /> Housing</p>
                      <p className="text-sm font-black text-gray-800 dark:text-white uppercase truncate">{data.housingType}</p>
                      {data.housingType === 'RENT' && <p className="text-[9px] font-black text-red-500 tracking-tighter italic">Rent: ₹{data.rentAmount}</p>}
                    </div>
                </div>

                {/* Main Applicant Job */}
                {data.isEarning ? (
                    <div className="bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-center gap-3 mb-4">
                        <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                        <div>
                            <p className="text-[8px] font-bold text-gray-400 uppercase">Applicant Job</p>
                            <p className="text-xs font-black text-gray-800 dark:text-white">{data.occupation} (₹{data.monthlyIncome})</p>
                        </div>
                    </div>
                ) : (
                    <p className="text-[10px] font-bold text-orange-600 bg-orange-50 dark:bg-orange-900/20 p-2 rounded-lg italic text-center mb-4">Applicant is non-earning</p>
                )}

                {/* Expandable Family Logic */}
                {data.familyMembersDetail && data.familyMembersDetail.length > 0 && (
                  <>
                    <button onClick={() => setExpandFamily(!expandFamily)} className="w-full py-3 bg-gray-100 dark:bg-gray-800 rounded-xl text-xs font-bold text-gray-600 dark:text-gray-300 hover:bg-gray-200 transition-colors">
                      {expandFamily ? "Hide Individual Members" : "View Individual Members"}
                    </button>

                    {expandFamily && (
                        <div className="mt-3 space-y-3">
                            {data.familyMembersDetail.map((m: any, i: number) => (
                                <div key={i} className="bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-200 dark:border-gray-700">
                                    <div className="flex justify-between items-start mb-2">
                                        <div>
                                          <p className="font-black text-gray-900 dark:text-white text-sm break-all">{m.name}</p>
                                          <p className="text-[10px] text-gray-500 uppercase font-bold mt-0.5">{m.relation} • {m.age} Yrs • {m.maritalStatus}</p>
                                        </div>
                                        <div className="flex flex-col gap-1 shrink-0">
                                            {m.isEarning && <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded uppercase font-black text-center">Earner</span>}
                                            {m.isStudying && <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded uppercase font-black text-center">Student</span>}
                                        </div>
                                    </div>
                                    {(m.isEarning || m.isStudying) && (
                                      <div className="border-t border-gray-200 dark:border-gray-700 pt-2 mt-2 space-y-1">
                                        {m.isEarning && <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">💼 {m.occupation} (₹{m.monthlyIncome})</p>}
                                        {m.isStudying && <p className="text-[10px] font-bold text-gray-600 dark:text-gray-400">🎓 {m.schoolName} ({m.classStandard})</p>}
                                      </div>
                                    )}
                                </div>
                            ))}
                        </div>
                    )}
                  </>
                )}
            </section>
            
            {/* 7. AUDIT FOOTER */}
            <div className="text-center pb-8 pt-4">
               <p className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-1">System Audit Record</p>
               <p className="text-[9px] font-bold text-gray-500">Registered By: <span className="text-gray-700 dark:text-gray-300">{data.createdBy || 'System'}</span></p>
               <p className="text-[9px] font-bold text-gray-500">Last Updated: <span className="text-gray-700 dark:text-gray-300">{new Date(data.updatedAt).toLocaleString('en-IN')}</span></p>
            </div>

          </div>
        )}
      </div>
    </main>
  );
}