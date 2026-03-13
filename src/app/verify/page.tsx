/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react"; 
import { useSearchParams } from "next/navigation"; 
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { updateBeneficiaryStatus } from "@/app/actions/updateStatus";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import {
  Search, ArrowLeft, Loader2, CheckCircle2, XCircle, AlertTriangle, 
  MapPin, Users, Phone, ShieldAlert, RotateCcw, UserX, Home, 
  ChevronDown, ChevronUp, QrCode, X, School, Briefcase, IndianRupee, 
  StickyNote, Banknote, CalendarDays, ShieldCheck, FileEdit
} from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

// --- Hardcoded Constants ---
const VERIFICATION_AUTHORITIES = [
  "Bilali Masjid Trust",
  "Local Masjid Committee",
  "Area Corporator",
  "Field Volunteer",
  "Direct Admin",
  "Custom / Manual Entry"
];

// --- Updated Types ---
type BeneficiaryData = {
  _id: string;
  fullName: string;
  aadharNumber: string;
  mobileNumber: string;
  status: "ACTIVE" | "BLACKLISTED" | "ON_HOLD";
  rejectionReason?: string;
  rejectionBy?: string; 
  approvedBy?: string;
  approvedAt?: Date;
  husbandStatus: string;
  gender: string;
  currentAddress: string;
  currentPincode: string;
  familyMembersDetail: any[];
  isEarning: boolean;
  occupation: string;
  monthlyIncome: number;
  totalFamilyIncome: number;
  housingType: string;
  rentAmount?: number;
  problems?: string[];
  comments?: string;
  distributedYears?: number[];
  verificationCycle?: { endDate: string | Date };
  updatedAt?: Date;
};

const VerificationSkeleton = () => (
  <div className="animate-pulse space-y-4 pt-4 px-4">
    <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full" />
    <div className="h-40 bg-gray-100 dark:bg-gray-900 rounded-2xl w-full" />
    <div className="h-10 bg-gray-200 dark:bg-gray-800 rounded-xl w-full" />
  </div>
);

function VerifyContent() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BeneficiaryData | null>(null);
  const [error, setError] = useState("");
  const [isUpdating, setIsUpdating] = useState(false);
  const [expandFamily, setExpandFamily] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

  // Modal States
  const [activeModal, setActiveModal] = useState<"APPROVE" | "REJECT" | null>(null);
  const [selectedAuthority, setSelectedAuthority] = useState(VERIFICATION_AUTHORITIES[0]);
  const [customAuthority, setCustomAuthority] = useState("");
  const [blockReason, setBlockReason] = useState("");
  
  // Date Picker
  const todayFormatted = new Date().toISOString().split('T')[0];
  const [actionDate, setActionDate] = useState(todayFormatted);

  const { isNavigating, handleBack } = useBackNavigation("/");
  const searchParams = useSearchParams();

  useEffect(() => {
    const autoSearchQuery = searchParams.get("search");
    if (autoSearchQuery) {
      setQuery(autoSearchQuery);
      performSearch(autoSearchQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = async (searchValue: string) => {
    if (!searchValue) return;
    setLoading(true);
    setError("");
    setData(null);
    setQuery(searchValue);
    setActiveModal(null);
    setExpandFamily(false);

    const result = await searchBeneficiary(searchValue);

    if (result.success && result.data) {
      setData(result.data as unknown as BeneficiaryData);
      setIsScanning(false);
    } else {
      setError(result.message || "Beneficiary not found.");
    }
    setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    performSearch(query);
  };

  const handleScan = (detectedCodes: any[]) => {
    if (detectedCodes && detectedCodes.length > 0) {
        const rawValue = detectedCodes[0].rawValue;
        if (rawValue) performSearch(rawValue);
    }
  };

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
      performSearch(data.aadharNumber); 
      setActiveModal(null);
      setBlockReason("");
      setCustomAuthority("");
    } else {
      alert(result.message);
    }
    setIsUpdating(false);
  };

  if (isNavigating) return <NavigationLoader message="Returning to Home..." />;

  const todayString = new Date().toLocaleDateString('en-IN');

  // 🌟 STRICT DYNAMIC BOOLEANS BASED ON STRING LENGTH 🌟
  const hasApproval = Boolean(data?.approvedBy && data.approvedBy.trim().length > 0);
  const hasRejection = Boolean(data?.rejectionBy && data.rejectionBy.trim().length > 0);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit pb-10 w-full overflow-x-hidden">
      
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm w-full">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => handleBack()} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-base font-black text-gray-900 dark:text-white truncate">Verification Desk</h1>
          </div>

          <div className="flex gap-2 w-full">
            <form onSubmit={handleSearchSubmit} className="relative flex-1 flex items-center min-w-0">
                <Search className="absolute left-3 w-4 h-4 text-gray-400 shrink-0" />
                <input type="tel" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Mobile or Aadhaar" className="w-full pl-9 pr-12 py-2.5 bg-gray-100 dark:bg-gray-900 rounded-xl text-sm font-semibold outline-none focus:ring-2 focus:ring-blue-500/50 transition-all" />
                <button type="submit" disabled={loading || !query} className="absolute right-1 px-3 py-1.5 bg-white dark:bg-gray-800 rounded-lg text-blue-600 text-xs font-bold shadow-sm disabled:opacity-50 shrink-0">
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : "GO"}
                </button>
            </form>
            <button onClick={() => setIsScanning(true)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-2.5 rounded-xl shadow-sm active:scale-95 transition-transform shrink-0">
                <QrCode className="w-5 h-5" />
            </button>
          </div>
        </div>
      </div>

      {isScanning && (
          <div className="fixed inset-0 z-50 bg-black/95 flex flex-col items-center justify-center p-4">
              <button onClick={() => setIsScanning(false)} className="absolute top-6 right-6 p-4 bg-white/20 rounded-full text-white backdrop-blur-md z-50"><X className="w-6 h-6" /></button>
              <div className="w-full max-w-sm rounded-[2.5rem] overflow-hidden border-4 border-white/20 shadow-2xl relative aspect-square">
                  <Scanner onScan={handleScan} allowMultiple={true} scanDelay={2000} components={{ torch: true, onOff: false }} />
                  <div className="absolute inset-0 border-[40px] border-black/60 pointer-events-none flex items-center justify-center">
                      <div className="w-48 h-48 border-2 border-white/50 rounded-2xl relative animate-pulse">
                          <div className="absolute top-0 left-0 w-6 h-6 border-t-4 border-l-4 border-green-500 -mt-1 -ml-1 rounded-tl-lg" />
                          <div className="absolute top-0 right-0 w-6 h-6 border-t-4 border-r-4 border-green-500 -mt-1 -mr-1 rounded-tr-lg" />
                          <div className="absolute bottom-0 left-0 w-6 h-6 border-b-4 border-l-4 border-green-500 -mb-1 -ml-1 rounded-bl-lg" />
                          <div className="absolute bottom-0 right-0 w-6 h-6 border-b-4 border-r-4 border-green-500 -mb-1 -mr-1 rounded-br-lg" />
                      </div>
                  </div>
              </div>
          </div>
      )}

      <div className="px-4 w-full">
        {loading && <VerificationSkeleton />}

        {!loading && error && (
          <div className="mt-8 flex flex-col items-center justify-center text-center opacity-70">
            <UserX className="w-10 h-10 text-gray-400 mb-2" />
            <p className="text-sm font-medium text-gray-500">{error}</p>
          </div>
        )}

        {!loading && data && (
          <div className="mt-4 space-y-4 animate-in slide-in-from-bottom-2 fade-in duration-300 w-full min-w-0">
            
            {/* Status Banner */}
            <div className={`p-4 rounded-2xl shadow-sm flex items-center justify-between w-full min-w-0 ${data.status === "ACTIVE" ? "bg-green-600 text-white" : data.status === "ON_HOLD" ? "bg-amber-500 text-white" : "bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-900"}`}>
              <div className="min-w-0 flex-1 pr-2">
                <p className={`text-[10px] font-black uppercase tracking-widest opacity-80 ${data.status === "ACTIVE" ? "text-green-50" : data.status === "ON_HOLD" ? "text-amber-100" : "text-gray-500"}`}>Status</p>
                <h2 className={`text-2xl font-black truncate ${data.status === "ACTIVE" || data.status === "ON_HOLD" ? "text-white" : "text-red-600"}`}>{data.status}</h2>
              </div>
              {data.status === "ACTIVE" ? <CheckCircle2 className="w-10 h-10 text-white/80 shrink-0" /> : <XCircle className="w-10 h-10 text-red-500 shrink-0" />}
            </div>

            {/* Core Identity Details */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3 w-full min-w-0">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight break-all max-w-full line-clamp-3">{data.fullName}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300 font-bold">{data.aadharNumber}</span>
                  <span className="text-xs font-black text-blue-600 dark:text-blue-400 flex items-center gap-1 min-w-0"><Phone className="w-3 h-3 shrink-0" /> <span className="truncate">{data.mobileNumber}</span></span>
                </div>
              </div>

              {/* Economic Status */}
              <div className="p-3 bg-gray-50 dark:bg-gray-800/50 rounded-xl border border-gray-100 dark:border-gray-800 min-w-0">
                <h4 className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5 truncate">
                    <Banknote className="w-3 h-3 shrink-0" /> Economic Status
                </h4>
                {data.isEarning ? (
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Briefcase className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[8px] text-gray-500 font-bold uppercase truncate">Occupation</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">{data.occupation}</p>
                            </div>
                        </div>
                        <div className="w-px h-6 bg-gray-200 dark:bg-gray-700 shrink-0" />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <IndianRupee className="w-3.5 h-3.5 text-green-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[8px] text-gray-500 font-bold uppercase truncate">Income</p>
                                <p className="text-xs font-bold text-gray-900 dark:text-white truncate">₹{data.monthlyIncome}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500 min-w-0">
                        <AlertTriangle className="w-3.5 h-3.5 text-orange-500 shrink-0" />
                        <p className="text-xs font-bold italic text-gray-400 truncate">Applicant is not earning</p>
                    </div>
                )}
              </div>

              <div className="grid grid-cols-2 gap-3 pt-1 w-full min-w-0">
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Family Income</p>
                  <div className="flex items-center gap-1.5 text-sm font-black text-green-600 dark:text-green-400 min-w-0"><IndianRupee className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">₹{data.totalFamilyIncome}</span></div>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Housing</p>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-black text-gray-800 dark:text-gray-200 min-w-0"><Home className="w-3.5 h-3.5 text-blue-500 shrink-0" /> <span className="truncate">{data.housingType}</span></div>
                    {data.housingType === 'RENT' && <span className="text-[10px] font-bold text-red-500 truncate">Rent: ₹{data.rentAmount}</span>}
                  </div>
                </div>
              </div>

              {data.problems && data.problems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 w-full">
                  {data.problems.map((p, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-black rounded-lg border border-red-100 dark:border-red-900/30 uppercase break-words max-w-full">{p}</span>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 pt-1 w-full min-w-0">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug break-all min-w-0 flex-1">{data.currentAddress} - {data.currentPincode}</p>
              </div>
            </div>

            {/* 🌟 DISPLAY VERIFICATION RECORD & ADMIN NOTES 🌟 */}
            <div className="grid grid-cols-1 gap-4 w-full min-w-0">
              
              {/* Dynamic Verification Card */}
              {(hasApproval || hasRejection) && (
                <div className={`relative p-5 rounded-[2rem] border shadow-sm w-full overflow-hidden ${
                  hasApproval
                    ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50' 
                    : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
                }`}>
                  <div className="flex items-start gap-4 relative z-10">
                    <div className={`p-3 rounded-2xl shrink-0 shadow-sm ${
                      hasApproval 
                        ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white'
                        : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                    }`}>
                      {hasApproval ? <ShieldCheck className="w-6 h-6" /> : <ShieldAlert className="w-6 h-6" />}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h3 className={`font-black uppercase text-[10px] tracking-[0.2em] mb-1 ${
                        hasApproval ? 'text-teal-700 dark:text-teal-400' : 'text-rose-700 dark:text-rose-400'
                      }`}>
                        {hasApproval ? 'Officially Verified' : 'Account Restricted'}
                      </h3>
                      
                      <div className={`p-3 rounded-xl border mt-2 ${
                        hasApproval 
                          ? 'bg-teal-100/50 dark:bg-black/20 border-teal-200/50 dark:border-white/5'
                          : 'bg-rose-100/50 dark:bg-black/20 border-rose-200/50 dark:border-white/5'
                      }`}>
                        <p className={`text-xs font-bold leading-relaxed ${
                          hasApproval ? 'text-teal-900 dark:text-teal-200' : 'text-rose-900 dark:text-rose-200'
                        }`}>
                          {hasApproval 
                            ? `Approved by: ${data.approvedBy}` 
                            : `Rejected by: ${data.rejectionBy || 'System Admin'}`
                          }
                        </p>
                        {hasRejection && data.rejectionReason && (
                          <p className="text-[11px] font-black text-rose-800 dark:text-rose-300 mt-1 italic break-words border-t border-rose-200/50 pt-1">
                            &quot;{data.rejectionReason}&quot;
                          </p>
                        )}
                      </div>
                      
                      {(data.approvedAt || data.updatedAt) && (
                        <p className={`text-[8px] font-black uppercase tracking-widest mt-2 opacity-60 ${
                          hasApproval ? 'text-teal-800 dark:text-teal-200' : 'text-rose-800 dark:text-rose-200'
                        }`}>
                          Date of Decision: {new Date(data.approvedAt || data.updatedAt!).toLocaleDateString("en-IN")}
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

            {/* Expandable Family Details */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden w-full min-w-0">
              <button onClick={() => setExpandFamily(!expandFamily)} className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 transition-colors min-w-0">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <Users className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-sm font-black text-gray-800 dark:text-gray-200 truncate">Family Details ({data.familyMembersDetail?.length || 0})</span>
                </div>
                {expandFamily ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>

              {expandFamily && (
                <div className="p-3 space-y-3 border-t border-gray-100 dark:border-gray-800 w-full min-w-0">
                  {data.familyMembersDetail?.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 border border-gray-100 dark:border-gray-700 min-w-0 w-full">
                      <div className="flex justify-between items-start gap-2 min-w-0 w-full">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-black text-gray-800 dark:text-gray-200 block break-all">{m.name}</span>
                          <span className="text-[10px] text-gray-500 uppercase font-bold truncate block">{m.relation} • {m.age} Yrs</span>
                        </div>
                        <div className="flex flex-wrap gap-1 justify-end shrink-0 max-w-[80px]">
                          {m.isEarning && (
                            <span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Earner</span>
                          )}
                          {m.isStudying && (
                            <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Student</span>
                          )}
                        </div>
                      </div>
                      
                      {(m.isEarning || m.isStudying) && (
                        <div className="flex flex-col gap-1.5 pt-1 text-[10px] border-t border-gray-200 dark:border-gray-700 mt-1 min-w-0">
                          {m.isEarning && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0">
                                <Briefcase className="w-3 h-3 text-green-600 shrink-0" /> 
                                <span className="truncate">{m.occupation} (₹{m.monthlyIncome})</span>
                            </div>
                          )}
                          {m.isStudying && (
                            <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0">
                                <School className="w-3 h-3 text-blue-600 shrink-0" /> 
                                <span className="truncate">{m.schoolName || "N/A"} • Class: {m.classStandard || "N/A"}</span>
                            </div>
                          )}
                        </div>
                      )}

                      {m.memberNotes && (
                        <div className="mt-2 p-2 bg-amber-50 dark:bg-amber-900/20 border border-amber-100 dark:border-amber-900/30 rounded-lg flex items-start gap-2 min-w-0">
                           <StickyNote className="w-3 h-3 text-amber-600 dark:text-amber-400 mt-0.5 shrink-0" />
                           <p className="text-[10px] font-bold text-amber-800 dark:text-amber-200 leading-tight break-words max-w-full">
                             {m.memberNotes}
                           </p>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* 3-YEAR CYCLE PROGRESS BAR */}
            <div className="bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30 shadow-sm w-full min-w-0">
              <div className="flex justify-between items-center mb-2 w-full gap-2 min-w-0">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 min-w-0">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider truncate">3-Year Cycle</span>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 shrink-0">
                  Year {Math.min((data.distributedYears?.length || 0) + 1, 3)} of 3
                </span>
              </div>
              <div className="h-2 w-full bg-purple-100 dark:bg-purple-900/50 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${((data.distributedYears?.length || 0) / 3) * 100}%` }} 
                  className="bg-purple-600 h-full transition-all duration-500" 
                />
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-2 font-medium truncate">
                Valid until: {data.verificationCycle?.endDate ? new Date(data.verificationCycle.endDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
            </div>

            {/* 🌟 ACTION DESK 🌟 */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-full">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 flex items-center gap-2">
                <ShieldCheck className="w-4 h-4 text-gray-500" /> Verification Decision
              </h3>

              {/* 🌟 DYNAMIC BUTTONS 🌟 */}
              {activeModal === null && (
                <div className="flex gap-2">
                  
                  {/* Show Approve Button ONLY if they are NOT currently approved */}
                  {!hasApproval && (
                    <button 
                      onClick={() => setActiveModal("APPROVE")}
                      className="flex-1 bg-teal-50 hover:bg-teal-100 dark:bg-teal-900/20 dark:hover:bg-teal-900/40 text-teal-700 dark:text-teal-400 border border-teal-200 dark:border-teal-800 font-black py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    >
                      <CheckCircle2 className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider">{hasRejection ? "Remove Block & Approve" : "Approve"}</span>
                    </button>
                  )}

                  {/* Show Reject Button ONLY if they are NOT currently rejected */}
                  {!hasRejection && (
                    <button 
                      onClick={() => setActiveModal("REJECT")}
                      className="flex-1 bg-rose-50 hover:bg-rose-100 dark:bg-rose-900/20 dark:hover:bg-rose-900/40 text-rose-700 dark:text-rose-400 border border-rose-200 dark:border-rose-800 font-black py-4 rounded-xl flex flex-col items-center justify-center gap-1 transition-all active:scale-95 shadow-sm"
                    >
                      <XCircle className="w-6 h-6 mb-1" />
                      <span className="text-[10px] uppercase tracking-wider">{hasApproval ? "Revoke & Block" : "Reject / Block"}</span>
                    </button>
                  )}
                </div>
              )}

              {/* MODAL: APPROVAL */}
              {activeModal === "APPROVE" && (
                <div className="bg-teal-50 dark:bg-teal-900/10 p-4 rounded-xl border border-teal-200 dark:border-teal-800/50 animate-in fade-in zoom-in-95">
                  <h4 className="text-teal-800 dark:text-teal-400 font-black text-sm mb-3">Mark as Verified</h4>
                  
                  <label className="text-[9px] font-bold uppercase text-teal-600 dark:text-teal-500 tracking-wider mb-1 block">Approved By Authority</label>
                  <select 
                    value={selectedAuthority} 
                    onChange={e => setSelectedAuthority(e.target.value)}
                    className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-teal-500 mb-3 shadow-sm"
                  >
                    {VERIFICATION_AUTHORITIES.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                  </select>

                  {/* CUSTOM AUTHORITY TEXT BOX */}
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

                  {/* CUSTOM DATE BOX */}
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

              {/* MODAL: REJECTION */}
              {activeModal === "REJECT" && (
                <div className="bg-rose-50 dark:bg-rose-900/10 p-4 rounded-xl border border-rose-200 dark:border-rose-800/50 animate-in fade-in zoom-in-95">
                  <h4 className="text-rose-800 dark:text-rose-400 font-black text-sm mb-3">Reject / Block Beneficiary</h4>
                  
                  <label className="text-[9px] font-bold uppercase text-rose-600 dark:text-rose-500 tracking-wider mb-1 block">Rejected By Authority</label>
                  <select 
                    value={selectedAuthority} 
                    onChange={e => setSelectedAuthority(e.target.value)}
                    className="w-full p-3 rounded-xl border-none bg-white dark:bg-gray-800 text-sm font-bold text-gray-900 dark:text-white outline-none focus:ring-2 focus:ring-rose-500 mb-3 shadow-sm"
                  >
                    {VERIFICATION_AUTHORITIES.map(auth => <option key={auth} value={auth}>{auth}</option>)}
                  </select>

                  {/* CUSTOM AUTHORITY TEXT BOX */}
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

                  {/* CUSTOM DATE BOX */}
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

          </div>
        )}
      </div>
    </div>
  );
}

export default function VerifyPage() {
  return (
    <Suspense fallback={<NavigationLoader message="Loading Search..." />}>
      <VerifyContent />
    </Suspense>
  );
}