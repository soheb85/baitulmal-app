/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, Suspense } from "react"; 
import { useSearchParams } from "next/navigation"; 
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { checkInBeneficiary, renewVerificationCycle } from "@/app/actions/distributionActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  Search, Loader2, ShieldCheck, MapPin, 
  CreditCard, Phone, ArrowLeft, CheckCircle2, AlertTriangle, Clock, 
  Home, Banknote, RefreshCw, QrCode, X,
  Briefcase, IndianRupee, School, CalendarDays, ShieldAlert, FileEdit
} from "lucide-react";
import { Scanner } from '@yudiel/react-qr-scanner';

function CheckInContent() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const [isScanning, setIsScanning] = useState(false); 
  const [tempNote, setTempNote] = useState("");
  
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
    
    const res = await checkInBeneficiary(data._id, tempNote);
    
    if (res.success) {
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
      
      const isBlacklisted = data.status === 'BLACKLISTED';
      const isExpired = data.verificationCycle?.endDate && new Date() > new Date(data.verificationCycle.endDate);
      const hasCollectedThisYear = data.distributedYears?.includes(currentYear);
      
      const isCheckedIn = data.todayStatus?.status === 'CHECKED_IN';

      if (isBlacklisted) {
          return (
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800 text-center mb-6 w-full min-w-0">
                  <p className="text-red-800 dark:text-red-200 font-bold flex items-center justify-center gap-2">
                      <AlertTriangle className="w-5 h-5 shrink-0" /> Distribution Blocked
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1 break-words max-w-full">{data.rejectionReason}</p>
              </div>
          );
      }

      if (hasCollectedThisYear) {
          return (
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800 flex items-center justify-center gap-3 text-green-800 dark:text-green-200 font-bold mb-6 w-full">
                  <CheckCircle2 className="w-6 h-6 shrink-0" /> Ration Collected for {currentYear}
              </div>
          );
      }

      if (isCheckedIn) {
          return (
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800 flex flex-col items-center gap-1 text-purple-800 dark:text-purple-200 font-bold mb-6 w-full">
                  <div className="flex items-center gap-2"><Clock className="w-5 h-5 shrink-0" /> Already in Queue</div>
                  <div className="text-2xl truncate">Token #{data.todayStatus.tokenNumber}</div>
              </div>
          );
      }

      if (isExpired) {
        return (
          <div className="space-y-4 mb-6 w-full">
            <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-800 text-center w-full">
              <p className="text-orange-800 dark:text-orange-200 font-bold flex items-center justify-center gap-2">
                <AlertTriangle className="w-5 h-5 shrink-0" /> Cycle Expired
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
              {processing ? <Loader2 className="animate-spin shrink-0" /> : <RefreshCw className="w-5 h-5 shrink-0" />}
              <span className="truncate">RE-VERIFY & RENEW (3 YEARS)</span>
            </button>
          </div>
        );
      }

      return (
        <div className="sticky bottom-4 z-10 pt-2 w-full space-y-3">
          {/* NEW: Temporary Note Input */}
          <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl border border-blue-100 dark:border-blue-900 shadow-sm flex items-center gap-2">
            <div className="bg-blue-50 dark:bg-blue-900/40 p-2 rounded-xl shrink-0">
              <RefreshCw className="w-4 h-4 text-blue-600" />
            </div>
            <input 
              type="text"
              value={tempNote}
              onChange={(e) => setTempNote(e.target.value)}
              placeholder="Excel Row / Note (Optional)"
              className="flex-1 bg-transparent border-none outline-none text-sm font-bold text-gray-700 dark:text-gray-200 placeholder:text-gray-400 placeholder:font-normal"
            />
          </div>

          <button 
              onClick={handleCheckIn}
              disabled={processing}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl flex items-center justify-center gap-3 text-lg active:scale-95 transition-all"
          >
              {processing ? <Loader2 className="animate-spin w-6 h-6 shrink-0" /> : (
              <>
                  <ShieldCheck className="w-6 h-6 shrink-0" />
                  <span className="truncate">VERIFY & GENERATE TOKEN</span>
              </>
              )}
          </button>
        </div>
      );
  };

  if (isNavigating) return <NavigationLoader message="Returning..." />;

  // 🌟 LOGIC FLAGS FOR VERIFICATION CARD 🌟
  const hasApproval = Boolean(data?.approvedBy && data.approvedBy.trim().length > 0 && data?.status === 'ACTIVE');
  const hasRejection = Boolean(data?.status === "BLACKLISTED" || (data?.rejectionBy && data.rejectionBy.trim().length > 0));

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-5 pb-32 font-outfit w-full overflow-x-hidden">
      
      {/* Header */}
      <div className="mb-6 flex items-center gap-3 w-full min-w-0">
        <button onClick={() => handleBack("/")} className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 active:scale-95 transition shrink-0">
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
        <div className="min-w-0 flex-1">
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 truncate">Station 1</p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white truncate">Check-In</h1>
        </div>
      </div>
      
      {/* Search & Scan */}
      <div className="flex gap-2 mb-6 w-full min-w-0">
          <form onSubmit={handleSearchSubmit} className="relative flex-1 shadow-sm min-w-0">
            <input 
              type="text" value={query} onChange={e => setQuery(e.target.value)} 
              placeholder="Mobile, Aadhaar or Scan..." 
              className="w-full p-4 pl-5 pr-14 rounded-2xl border-none bg-white dark:bg-gray-800 text-lg font-medium outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all min-w-0"
            />
            <button type="submit" disabled={loading} className="absolute right-2 top-2 bottom-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 rounded-xl flex items-center justify-center shrink-0">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
            </button>
          </form>
          <button onClick={() => setIsScanning(true)} className="bg-gray-900 dark:bg-white text-white dark:text-gray-900 p-4 rounded-2xl shadow-lg active:scale-95 transition-transform shrink-0">
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
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-6 w-full overflow-hidden min-w-0">
           
           <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4 gap-3 w-full min-w-0">
             <div className="flex-1 min-w-0">
                 <h2 className="text-2xl font-black text-gray-900 dark:text-white leading-tight break-all max-w-full line-clamp-3">{data.fullName}</h2>
                 <div className="flex flex-wrap items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase font-bold shrink-0">{data.gender}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase font-bold shrink-0">{data.husbandStatus}</span>
                 </div>
             </div>
             <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border shrink-0 ${data.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'}`}>{data.status}</span>
           </div>

           {/* 🌟 NEW: DISPLAY VERIFICATION RECORD & ADMIN NOTES 🌟 */}
           <div className="grid grid-cols-1 gap-4 mb-6 w-full min-w-0">
             
             {/* Dynamic Verification Card */}
             {(hasApproval || hasRejection) && (
               <div className={`relative p-4 rounded-2xl border shadow-sm w-full overflow-hidden ${
                 hasApproval
                   ? 'bg-teal-50 dark:bg-teal-950/20 border-teal-200 dark:border-teal-900/50' 
                   : 'bg-rose-50 dark:bg-rose-950/20 border-rose-200 dark:border-rose-900/50'
               }`}>
                 <div className="flex items-start gap-4 relative z-10">
                   <div className={`p-2.5 rounded-xl shrink-0 shadow-sm ${
                     hasApproval 
                       ? 'bg-gradient-to-br from-teal-400 to-teal-600 text-white'
                       : 'bg-gradient-to-br from-rose-500 to-rose-600 text-white'
                   }`}>
                     {hasApproval ? <ShieldCheck className="w-5 h-5" /> : <ShieldAlert className="w-5 h-5" />}
                   </div>
                   <div className="min-w-0 flex-1">
                     <h3 className={`font-black uppercase text-[10px] tracking-[0.2em] mb-1 ${
                       hasApproval ? 'text-teal-700 dark:text-teal-400' : 'text-rose-700 dark:text-rose-400'
                     }`}>
                       {hasApproval ? 'Officially Verified' : 'Account Restricted'}
                     </h3>
                     
                     <div className={`p-2.5 rounded-xl border mt-1.5 ${
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
                         <p className="text-[10px] font-black text-rose-800 dark:text-rose-300 mt-1 italic break-words border-t border-rose-200/50 pt-1">
                           &quot;{data.rejectionReason}&quot;
                         </p>
                       )}
                     </div>
                     
                     {(data.approvedAt || data.updatedAt) && (
                       <p className={`text-[8px] font-black uppercase tracking-widest mt-1.5 opacity-60 ${
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
                 <div className="bg-amber-50 dark:bg-amber-900/20 p-4 rounded-2xl border border-amber-200 dark:border-amber-900/50 shadow-sm w-full flex gap-3 items-start">
                     <div className="p-2 bg-amber-100 dark:bg-amber-900/50 rounded-xl shrink-0">
                       <FileEdit className="w-4 h-4 text-amber-600 dark:text-amber-400" />
                     </div>
                     <div className="min-w-0 flex-1">
                       <h3 className="text-[9px] font-black text-amber-600 dark:text-amber-500 uppercase tracking-widest mb-1">Admin Remarks</h3>
                       <p className="text-xs text-amber-900 dark:text-amber-100 font-bold leading-relaxed break-words italic">&quot;{data.comments}&quot;</p>
                     </div>
                 </div>
             )}
           </div>

           {/* Economic Status */}
           <div className="mb-6 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 w-full min-w-0">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 flex items-center gap-2 truncate">
                    <Banknote className="w-3 h-3 shrink-0" /> Applicant Economic Status
                </h4>
                {data.isEarning ? (
                    <div className="flex items-center gap-4 min-w-0 w-full">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Briefcase className="w-4 h-4 text-green-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[9px] text-gray-500 font-bold uppercase truncate">Occupation</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{data.occupation}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0" />
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <IndianRupee className="w-4 h-4 text-green-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[9px] text-gray-500 font-bold uppercase truncate">Monthly</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">₹{data.monthlyIncome}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500 min-w-0">
                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                        <p className="text-sm font-bold italic text-gray-400 truncate">Main applicant is not earning</p>
                    </div>
                )}
           </div>

           <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30 w-full min-w-0">
              <div className="flex justify-between items-center mb-2 w-full gap-2 min-w-0">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300 min-w-0">
                  <CalendarDays className="w-4 h-4 shrink-0" />
                  <span className="text-xs font-bold uppercase tracking-wider truncate">3-Year Cycle</span>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300 shrink-0">Year {Math.min((data.distributedYears?.length || 0) + 1, 3)} of 3</span>
              </div>
              <div className="h-2 w-full bg-purple-100 dark:bg-purple-900/50 rounded-full overflow-hidden flex">
                <div style={{ width: `${((data.distributedYears?.length || 0) / 3) * 100}%` }} className="bg-purple-600 h-full transition-all duration-500" />
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-2 font-medium truncate">Valid until: {data.verificationCycle?.endDate ? new Date(data.verificationCycle.endDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}</p>
           </div>

           <div className="grid grid-cols-1 gap-3 mb-6 w-full min-w-0">
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl min-w-0 w-full">
                 <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border shrink-0"><CreditCard className="w-5 h-5 text-gray-500" /></div>
                 <div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-gray-400 uppercase truncate">Aadhaar Number</p><p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider truncate">{data.aadharNumber}</p></div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl min-w-0 w-full">
                 <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border shrink-0"><Phone className="w-5 h-5 text-gray-500" /></div>
                 <div className="min-w-0 flex-1"><p className="text-[10px] font-bold text-gray-400 uppercase truncate">Mobile Number</p><p className="text-lg font-mono font-medium text-gray-900 dark:text-gray-100 truncate">{data.mobileNumber}</p></div>
              </div>
           </div>

           <div className="mb-6 space-y-3 w-full min-w-0">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 truncate">Housing & Address</h3>
              <div className="grid grid-cols-2 gap-3 w-full min-w-0">
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-300 min-w-0"><Home className="w-4 h-4 shrink-0" /><span className="text-xs font-bold uppercase truncate">{data.housingType}</span></div>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400 min-w-0"><span className="text-xs shrink-0">Rent:</span><span className="font-bold truncate">₹{data.rentAmount || 0}</span></div>
                 </div>
                 <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30 min-w-0 w-full">
                    <div className="flex items-center gap-2 mb-1 text-green-700 dark:text-green-300 min-w-0"><Banknote className="w-4 h-4 shrink-0" /><span className="text-xs font-bold uppercase truncate">Family Total</span></div>
                    <span className="font-bold text-green-600 dark:text-green-400 truncate block">₹{data.totalFamilyIncome}</span>
                 </div>
              </div>
              
              <div className="flex gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl w-full min-w-0">
                 <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                 <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug break-all max-w-full">{data.currentAddress}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono truncate">Pin: {data.currentPincode}</p>
                 </div>
              </div>
           </div>

           <div className="mb-6 w-full min-w-0">
              <div className="flex justify-between items-end mb-2 ml-1 w-full min-w-0">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest truncate">Family Members ({data.familyMembersDetail?.length || 0})</h3>
              </div>
              <div className="space-y-2 w-full min-w-0">
                 {data.familyMembersDetail?.map((m: any, i: number) => (
                    <div key={i} className="bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700 w-full min-w-0">
                       <div className="flex justify-between items-center gap-2 w-full min-w-0">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                             <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 border dark:border-gray-600 shrink-0">{m.name.charAt(0)}</div>
                             <div className="min-w-0 flex-1">
                                <p className="text-sm font-bold text-gray-900 dark:text-gray-100 break-all max-w-full">{m.name}</p>
                                <div className="flex gap-2 text-[10px] text-gray-500 uppercase font-bold min-w-0"><span className="truncate">{m.relation}</span> <span className="shrink-0">• {m.age} Yrs</span></div>
                             </div>
                          </div>
                          <div className="flex flex-wrap gap-1 shrink-0 max-w-[80px] justify-end">
                             {m.isEarning && <span className="text-[8px] bg-green-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Earner</span>}
                             {m.isStudying && <span className="text-[8px] bg-blue-500 text-white px-1.5 py-0.5 rounded-full font-black uppercase">Student</span>}
                          </div>
                       </div>
                       
                       {(m.isEarning || m.isStudying) && (
                         <div className="mt-2 pt-2 border-t border-gray-200 dark:border-gray-700 flex flex-col gap-1 w-full min-w-0">
                            {m.isEarning && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400 min-w-0">
                                    <Briefcase className="w-3 h-3 shrink-0" /> 
                                    <span className="truncate">{m.occupation} (₹{m.monthlyIncome})</span>
                                </div>
                            )}
                            {m.isStudying && (
                                <div className="flex items-center gap-2 text-[10px] text-gray-600 dark:text-gray-400 min-w-0">
                                    <School className="w-3 h-3 shrink-0" /> 
                                    <span className="truncate">{m.classStandard} @ {m.schoolName}</span>
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