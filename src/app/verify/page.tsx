/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react"; 
import { useSearchParams } from "next/navigation"; 
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { updateBeneficiaryStatus } from "@/app/actions/updateStatus";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import {
  Search,
  ArrowLeft,
  Loader2,
  CheckCircle2,
  XCircle,
  AlertTriangle,
  MapPin,
  Users,
  Phone,
  ShieldAlert,
  RotateCcw,
  UserX,
  Home,
  Wallet,
  ChevronDown,
  ChevronUp,
  QrCode,
  X,
  GraduationCap,
  School,
  Briefcase,
  IndianRupee,
  StickyNote,
  Banknote,
  CalendarDays 
} from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

// --- Updated Types ---
type BeneficiaryData = {
  _id: string;
  fullName: string;
  aadharNumber: string;
  mobileNumber: string;
  status: "ACTIVE" | "BLACKLISTED" | "ON_HOLD";
  rejectionReason?: string;
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
  referencedBy?: string;
  comments?: string;
  distributedYears?: number[];
  verificationCycle?: { endDate: string | Date };
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
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockReason, setBlockReason] = useState("");
  const [expandFamily, setExpandFamily] = useState(false);
  const [isScanning, setIsScanning] = useState(false);

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
    setShowBlockForm(false);
    setExpandFamily(false);

    const result = await searchBeneficiary(searchValue);

    if (result.success && result.data) {
      setData(result.data as BeneficiaryData);
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

  const handleStatusChange = async (newStatus: "ACTIVE" | "BLACKLISTED") => {
    if (!data?._id) return;
    if (newStatus === "BLACKLISTED" && !blockReason.trim()) {
      alert("Please provide a reason.");
      return;
    }
    if (!confirm(`Mark as ${newStatus}?`)) return;

    setIsUpdating(true);
    const result = await updateBeneficiaryStatus(data._id, newStatus, blockReason);

    if (result.success) {
      setData((prev) => prev ? { ...prev, status: newStatus, rejectionReason: blockReason } : null);
      setShowBlockForm(false);
      setBlockReason("");
    } else {
      alert(result.message);
    }
    setIsUpdating(false);
  };

  if (isNavigating) return <NavigationLoader message="Returning to Home..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit pb-10 w-full overflow-x-hidden">
      
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm w-full">
        <div className="px-4 py-2">
          <div className="flex items-center gap-2 mb-2">
            <button onClick={() => handleBack()} className="p-1.5 -ml-1.5 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 active:scale-95 transition-transform shrink-0">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <h1 className="text-base font-bold text-gray-900 dark:text-white truncate">Verify Beneficiary</h1>
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
            <div className={`p-4 rounded-2xl shadow-sm flex items-center justify-between w-full min-w-0 ${data.status === "ACTIVE" ? "bg-green-600 text-white" : "bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900"}`}>
              <div className="min-w-0 flex-1 pr-2">
                <p className={`text-[10px] font-bold uppercase tracking-wider opacity-80 ${data.status === "ACTIVE" ? "text-green-50" : "text-gray-500"}`}>Status</p>
                <h2 className={`text-xl font-bold truncate ${data.status === "ACTIVE" ? "text-white" : "text-red-600"}`}>{data.status}</h2>
                {data.status === "BLACKLISTED" && <p className="text-xs text-red-600 dark:text-red-400 mt-1 font-medium bg-red-50 dark:bg-red-900/20 px-2 py-0.5 rounded w-fit max-w-full break-words">{data.rejectionReason}</p>}
              </div>
              {data.status === "ACTIVE" ? <CheckCircle2 className="w-8 h-8 text-white/80 shrink-0" /> : <XCircle className="w-8 h-8 text-red-500 shrink-0" />}
            </div>

            {/* Core Identity Details */}
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm space-y-3 w-full min-w-0">
              <div className="min-w-0">
                <h3 className="text-xl font-black text-gray-900 dark:text-white leading-tight break-all max-w-full line-clamp-3">{data.fullName}</h3>
                <div className="flex flex-wrap items-center gap-2 mt-1">
                  <span className="text-xs font-mono bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded text-gray-600 dark:text-gray-300">{data.aadharNumber}</span>
                  <span className="text-xs font-medium text-blue-600 dark:text-blue-400 flex items-center gap-1 min-w-0"><Phone className="w-3 h-3 shrink-0" /> <span className="truncate">{data.mobileNumber}</span></span>
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
                  <div className="flex items-center gap-1.5 text-sm font-bold text-green-600 dark:text-green-400 min-w-0"><IndianRupee className="w-3.5 h-3.5 shrink-0" /> <span className="truncate">₹{data.totalFamilyIncome}</span></div>
                </div>
                <div className="space-y-0.5 min-w-0">
                  <p className="text-[10px] text-gray-400 font-bold uppercase truncate">Housing</p>
                  <div className="flex flex-col min-w-0">
                    <div className="flex items-center gap-1.5 text-sm font-semibold text-gray-800 dark:text-gray-200 min-w-0"><Home className="w-3.5 h-3.5 text-blue-500 shrink-0" /> <span className="truncate">{data.housingType}</span></div>
                    {data.housingType === 'RENT' && <span className="text-[11px] font-bold text-red-500 truncate">Rent: ₹{data.rentAmount}</span>}
                  </div>
                </div>
              </div>

              {data.problems && data.problems.length > 0 && (
                <div className="flex flex-wrap gap-1.5 pt-1 w-full">
                  {data.problems.map((p, i) => (
                    <span key={i} className="text-[10px] px-2 py-0.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold rounded-lg border border-red-100 dark:border-red-900/30 uppercase break-words max-w-full">{p}</span>
                  ))}
                </div>
              )}

              <div className="flex items-start gap-2 pt-1 w-full min-w-0">
                <MapPin className="w-3.5 h-3.5 text-gray-400 mt-0.5 shrink-0" />
                <p className="text-xs text-gray-600 dark:text-gray-400 leading-snug break-all min-w-0 flex-1">{data.currentAddress} - {data.currentPincode}</p>
              </div>
            </div>

            {/* 3-YEAR CYCLE PROGRESS & HISTORY BAR */}
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

              {/* NEW: COLLECTION HISTORY */}
              <div className="mt-3 pt-3 border-t border-purple-200/50 dark:border-purple-800/50">
                <p className="text-[10px] text-purple-500 font-bold uppercase mb-2 tracking-widest">Collected Years</p>
                <div className="flex flex-wrap gap-1.5">
                  {data.distributedYears && data.distributedYears.length > 0 ? (
                    data.distributedYears.map((year, i) => (
                      <span key={i} className="bg-purple-600 text-white text-[10px] font-black px-2 py-1 rounded shadow-sm">
                        {year}
                      </span>
                    ))
                  ) : (
                    <span className="text-[11px] font-medium text-purple-400 dark:text-purple-500 italic">No previous collections.</span>
                  )}
                </div>
              </div>
            </div>

            {/* Expandable Family Details */}
            <div className="bg-white dark:bg-gray-900 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden w-full min-w-0">
              <button onClick={() => setExpandFamily(!expandFamily)} className="w-full flex items-center justify-between p-4 bg-gray-50/50 dark:bg-gray-800/30 transition-colors min-w-0">
                <div className="flex items-center gap-2 min-w-0 pr-2">
                  <Users className="w-4 h-4 text-purple-500 shrink-0" />
                  <span className="text-sm font-bold text-gray-800 dark:text-gray-200 truncate">Family Members ({data.familyMembersDetail?.length || 0})</span>
                </div>
                {expandFamily ? <ChevronUp className="w-4 h-4 text-gray-400 shrink-0" /> : <ChevronDown className="w-4 h-4 text-gray-400 shrink-0" />}
              </button>

              {expandFamily && (
                <div className="p-3 space-y-3 border-t border-gray-100 dark:border-gray-800 w-full min-w-0">
                  {data.familyMembersDetail?.map((m: any, idx: number) => (
                    <div key={idx} className="p-3 bg-gray-50 dark:bg-gray-800 rounded-xl space-y-2 border border-gray-100 dark:border-gray-700 min-w-0 w-full">
                      <div className="flex justify-between items-start gap-2 min-w-0 w-full">
                        <div className="min-w-0 flex-1">
                          <span className="text-sm font-bold text-gray-800 dark:text-gray-200 block break-all">{m.name}</span>
                          <span className="text-[10px] text-gray-400 uppercase font-black truncate block">{m.relation} • {m.age} Yrs</span>
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

            {/* Action Bar */}
            <div className="space-y-3 pb-6 w-full min-w-0">
              {data.status === "ACTIVE" && !showBlockForm && (
                <div className="flex gap-3">
                  <button className="flex-1 bg-green-600 hover:bg-green-700 text-white font-bold py-3 rounded-xl shadow-md text-sm active:scale-95 transition-transform flex items-center justify-center gap-2">
                    <CheckCircle2 className="w-4 h-4" /> Issue Ration
                  </button>
                  <button onClick={() => setShowBlockForm(true)} className="px-4 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 text-red-600 dark:text-red-400 font-bold rounded-xl text-sm hover:bg-red-50 dark:hover:bg-red-900/20 active:scale-95 transition-transform flex items-center justify-center shrink-0">
                    <ShieldAlert className="w-4 h-4" />
                  </button>
                </div>
              )}

              {showBlockForm && (
                <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/30 animate-in zoom-in-95 w-full min-w-0">
                  <h4 className="font-bold text-red-800 dark:text-red-200 mb-2 text-xs uppercase truncate">Reason for Blocking</h4>
                  <textarea value={blockReason} onChange={(e) => setBlockReason(e.target.value)} placeholder="Write reason..." className="w-full p-2.5 rounded-xl border-none bg-white dark:bg-gray-900 text-gray-900 dark:text-white text-sm font-medium focus:ring-1 focus:ring-red-500 outline-none mb-3" rows={2} />
                  <div className="flex gap-2">
                    <button onClick={() => setShowBlockForm(false)} className="flex-1 py-2.5 bg-white dark:bg-gray-800 text-gray-500 font-bold rounded-xl text-xs border border-gray-200 dark:border-gray-700">Cancel</button>
                    <button onClick={() => handleStatusChange("BLACKLISTED")} disabled={isUpdating} className="flex-1 py-2.5 bg-red-600 text-white font-bold rounded-xl text-xs shadow-sm active:scale-95">{isUpdating ? <Loader2 className="w-3 h-3 animate-spin mx-auto" /> : "Confirm Block"}</button>
                  </div>
                </div>
              )}

              {data.status === "BLACKLISTED" && (
                <button onClick={() => handleStatusChange("ACTIVE")} disabled={isUpdating} className="w-full bg-white dark:bg-gray-900 border border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-300 font-bold py-3 rounded-xl active:scale-95 transition-transform flex items-center justify-center gap-2 text-sm min-w-0">
                  {isUpdating ? <Loader2 className="w-4 h-4 animate-spin shrink-0" /> : <><RotateCcw className="w-4 h-4 shrink-0" /> <span className="truncate">Re-Activate Beneficiary</span></>}
                </button>
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