/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react"; // Added useEffect
import { useSearchParams } from "next/navigation"; // Added useSearchParams
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { checkInBeneficiary, renewVerificationCycle } from "@/app/actions/distributionActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  Search, Loader2, ShieldCheck, MapPin, 
  CreditCard, Phone, ArrowLeft, CheckCircle2, AlertTriangle, Clock, 
  Home, Banknote, RefreshCw, QrCode, X,
  Briefcase, IndianRupee, School, CalendarDays
} from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

function CheckInContent() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false); 
  
  const { isNavigating, handleBack } = useBackNavigation("/");
  const searchParams = useSearchParams();

  // --- NEW: Auto-Search Logic ---
  useEffect(() => {
    const autoSearchQuery = searchParams.get("search");
    if (autoSearchQuery) {
      setQuery(autoSearchQuery);
      performSearch(autoSearchQuery);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  const performSearch = async (searchValue: string) => {
      setLoading(true);
      setData(null);
      setQuery(searchValue); 
      
      const res = await searchBeneficiary(searchValue);
      if (res.success) {
          setData(res.data);
          setIsScanning(false); 
      } else {
          alert(res.message);
      }
      setLoading(false);
  };

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    performSearch(query);
  };

  const handleScan = (detectedCodes: any[]) => {
      if (detectedCodes && detectedCodes.length > 0) {
          const rawValue = detectedCodes[0].rawValue;
          if (rawValue) performSearch(rawValue);
      }
  };

  const handleCheckIn = async () => {
    if (!data?._id) return;
    setProcessing(true);
    
    const res = await checkInBeneficiary(data._id);
    
    if (res.success) {
      // reload latest beneficiary state
      const updatedRes = await searchBeneficiary(data.mobileNumber || data.aadharNumber);
      if (updatedRes.success) {
        setData(updatedRes.data);
      }
    } else {
      alert(res.message);
    }
    
    setProcessing(false);
  };

  const renderActionSection = () => {
      const currentYear = new Date().getFullYear();
      
      // 1. Bulletproof Checks
      const isBlacklisted = data.status === 'BLACKLISTED';
      const isExpired = data.verificationCycle?.endDate && new Date() > new Date(data.verificationCycle.endDate);
      const hasCollectedThisYear = data.distributedYears?.includes(currentYear);
      
      // 2. Queue lock (Does not care about date, handles midnight rollover naturally)
      const isCheckedIn = data.todayStatus?.status === 'CHECKED_IN';

      if (isBlacklisted) {
          return (
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800 text-center mb-6">
                  <p className="text-red-800 dark:text-red-200 font-bold flex items-center justify-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Distribution Blocked
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{data.rejectionReason}</p>
              </div>
          );
      }

      // If they collected THIS YEAR, block them.
      if (hasCollectedThisYear) {
          return (
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800 flex items-center justify-center gap-3 text-green-800 dark:text-green-200 font-bold mb-6">
                  <CheckCircle2 className="w-6 h-6" /> Ration Collected for {currentYear}
              </div>
          );
      }

      // If they are in the queue right now, show their token.
      if (isCheckedIn) {
          return (
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800 flex flex-col items-center gap-1 text-purple-800 dark:text-purple-200 font-bold mb-6">
                  <div className="flex items-center gap-2"><Clock className="w-5 h-5" /> Already in Queue</div>
                  <div className="text-2xl">Token #{data.todayStatus.tokenNumber}</div>
              </div>
          );
      }

      if (isExpired) {
        return (
          <div className="space-y-4 mb-6">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-800 text-center">
              <p className="text-orange-800 dark:text-orange-200 font-bold flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5" /> Cycle Expired
              </p>
              <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">Last verified 3 years ago.</p>
            </div>
            <button 
              onClick={async () => {
                if(confirm("Confirm re-verification for 3 years?")) {
                  setProcessing(true);
                  const res = await renewVerificationCycle(data._id);
                  if(res.success) {
                     const updated = await searchBeneficiary(query);
                     if(updated.success) setData(updated.data);
                  }
                  setProcessing(false);
                }
              }}
              disabled={processing}
              className="w-full bg-orange-600 hover:bg-orange-700 text-white font-bold py-4 rounded-2xl shadow-lg flex items-center justify-center gap-2 transition-all"
            >
              {processing ? <Loader2 className="animate-spin" /> : <RefreshCw className="w-5 h-5" />}
              RE-VERIFY & RENEW (3 YEARS)
            </button>
          </div>
        );
      }

      // If none of the above, they are clear to generate a token.
      return (
          <div className="sticky bottom-4 z-10 pt-2">
            <button 
                onClick={handleCheckIn}
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-lg active:scale-95 transition-all"
            >
                {processing ? <Loader2 className="animate-spin w-6 h-6" /> : (
                <>
                    <ShieldCheck className="w-6 h-6" />
                    VERIFY & GENERATE TOKEN
                </>
                )}
            </button>
          </div>
      );
  };

  if (isNavigating) return <NavigationLoader message="Returning..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-5 pb-32 font-outfit">
      
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button onClick={() => handleBack("/")} className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 active:scale-95 transition">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">Station 1</p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">Check-In</h1>
        </div>
      </div>
      
      {/* Search & Scan */}
      <div className="flex gap-2 mb-6">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 shadow-sm">
            <input 
              type="text" value={query} onChange={e => setQuery(e.target.value)} 
              placeholder="Mobile, Aadhaar or Scan..." 
              className="w-full p-4 pl-5 pr-14 rounded-2xl border-none bg-white dark:bg-gray-800 text-lg font-medium outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
            />
            <button type="submit" disabled={loading} className="absolute right-2 top-2 bottom-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 rounded-xl flex items-center justify-center">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </form>
          <button onClick={() => setIsScanning(true)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-2xl shadow-lg active:scale-95 transition-transform">
            <QrCode className="w-6 h-6" />
          </button>
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

      {data && (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-6">
           <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
             <div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{data.fullName}</h2>
                 <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase font-bold">{data.gender}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase font-bold">{data.husbandStatus}</span>
                 </div>
             </div>
             <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${data.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{data.status}</span>
           </div>

           {/* Economic Status */}
           <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2">
                    <Banknote className="w-3 h-3" /> Applicant Economic Status
                </h4>
                {data.isEarning ? (
                    <div className="flex items-center gap-4">
                        <div className="flex items-center gap-2">
                            <Briefcase className="w-4 h-4 text-green-600" />
                            <div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Occupation</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">{data.occupation}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700" />
                        <div className="flex items-center gap-2">
                            <IndianRupee className="w-4 h-4 text-green-600" />
                            <div>
                                <p className="text-[9px] text-gray-500 font-bold uppercase">Monthly</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white">₹{data.monthlyIncome}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                        <AlertTriangle className="w-4 h-4 text-orange-500" />
                        <p className="text-sm font-bold italic text-gray-400">Main applicant is not earning</p>
                    </div>
                )}
           </div>

           <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">3-Year Cycle</span>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">Year {Math.min((data.distributedYears?.length || 0) + 1, 3)} of 3</span>
              </div>
              <div className="h-2 w-full bg-purple-100 dark:bg-purple-900/50 rounded-full overflow-hidden flex">
                <div style={{ width: `${((data.distributedYears?.length || 0) / 3) * 100}%` }} className="bg-purple-600 h-full transition-all duration-500" />
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-2 font-medium">Valid until: {data.verificationCycle?.endDate ? new Date(data.verificationCycle.endDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
           </div>

           <div className="grid grid-cols-1 gap-3 mb-6">
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                 <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border shrink-0"><CreditCard className="w-5 h-5 text-gray-500" /></div>
                 <div><p className="text-[10px] font-bold text-gray-400 uppercase">Aadhaar Number</p><p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider">{data.aadharNumber}</p></div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                 <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border shrink-0"><Phone className="w-5 h-5 text-gray-500" /></div>
                 <div><p className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</p><p className="text-lg font-mono font-medium text-gray-900 dark:text-gray-100">{data.mobileNumber}</p></div>
              </div>
           </div>

           <div className="mb-6 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Housing & Address</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-300"><Home className="w-4 h-4" /><span className="text-xs font-bold uppercase">{data.housingType}</span></div>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400"><span className="text-xs">Rent:</span><span className="font-bold">₹{data.rentAmount || 0}</span></div>
                 </div>
                 <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-2 mb-1 text-green-700 dark:text-green-300"><Banknote className="w-4 h-4" /><span className="text-xs font-bold uppercase">Family Total</span></div>
                    <span className="font-bold text-green-600 dark:text-green-400">₹{data.totalFamilyIncome}</span>
                 </div>
              </div>
              <div className="flex gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl"><MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" /><div><p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{data.currentAddress}</p><p className="text-xs text-gray-500 mt-1 font-mono">Pin: {data.currentPincode}</p></div></div>
           </div>

           <div className="mb-6">
              <div className="flex justify-between items-end mb-2 ml-1">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Family Members ({data.familyMembersDetail?.length || 0})</h3>
              </div>
              <div className="space-y-2">
                 {data.familyMembersDetail?.map((m: any, i: number) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                       <div className="flex justify-between items-center">
                          <div className="flex items-center gap-3">
                             <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 border dark:border-gray-600">{m.name.charAt(0)}</div>
                             <div>
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.name}</p>
                                <div className="flex gap-2 text-[10px] text-gray-500 uppercase font-bold"><span>{m.relation}</span> • <span>{m.age} Yrs</span></div>
                             </div>
                          </div>
                          <div className="flex gap-1">
                             {m.isEarning && <span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Earner</span>}
                             {m.isStudying && <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Student</span>}
                          </div>
                       </div>
                       
                       {/* Sub-details for member */}
                       {(m.isEarning || m.isStudying) && (
                         <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1">
                            {m.isEarning && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                                    <Briefcase className="w-3 h-3" /> <span>{m.occupation} (₹{m.monthlyIncome})</span>
                                </div>
                            )}
                            {m.isStudying && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400">
                                    <School className="w-3 h-3" /> <span>{m.classStandard} @ {m.schoolName}</span>
                                </div>
                            )}
                         </div>
                       )}
                    </div>
                 ))}
              </div>
           </div>

           {renderActionSection()}
        </div>
      )}
    </div>
  );
}

export default function CheckInPage() {
  return (
    <Suspense fallback={<NavigationLoader message="Loading Check-In Station..." />}>
      <CheckInContent />
    </Suspense>
  );
}