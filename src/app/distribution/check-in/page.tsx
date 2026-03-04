/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { checkInBeneficiary, renewVerificationCycle } from "@/app/actions/distributionActions";
import { 
  Search, Loader2, ShieldCheck, MapPin, 
  CreditCard, Phone, ArrowLeft, CheckCircle2, AlertTriangle, Clock, 
  Home, Banknote, RefreshCw, Tag, User, CalendarDays
} from "lucide-react";
import { useRouter } from "next/navigation";

export default function CheckInPage() {
  const [query, setQuery] = useState("");
  const [data, setData] = useState<any>(null);
  const [loading, setLoading] = useState(false);
  const [processing, setProcessing] = useState(false);
  const router = useRouter();

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    setData(null);
    
    const res = await searchBeneficiary(query);
    if (res.success) {
        setData(res.data);
    } else {
        alert(res.message);
    }
    setLoading(false);
  };

  const handleCheckIn = async () => {
    setProcessing(true);
    const res = await checkInBeneficiary(data._id);
    
    if (res.success) {
      const updatedRes = await searchBeneficiary(query);
      if(updatedRes.success) setData(updatedRes.data);
    } else {
      alert(res.message);
    }
    setProcessing(false);
  };

  const isToday = (dateString: string) => {
      if(!dateString) return false;
      const date = new Date(dateString);
      const today = new Date();
      return date.getDate() === today.getDate() &&
             date.getMonth() === today.getMonth() &&
             date.getFullYear() === today.getFullYear();
  };

  // --- Dynamic Action Button / Status ---
  const renderActionSection = () => {
      const status = data.todayStatus?.status;
      const statusDate = data.todayStatus?.date;
      const isExpired = data.verificationCycle?.endDate && new Date() > new Date(data.verificationCycle.endDate);

      if (status === 'COLLECTED' && isToday(statusDate)) {
          return (
              <div className="bg-green-100 dark:bg-green-900/30 p-4 rounded-xl border border-green-200 dark:border-green-800 flex items-center justify-center gap-3 text-green-800 dark:text-green-200 font-bold mb-6">
                  <CheckCircle2 className="w-6 h-6" /> Ration Collected Today
              </div>
          );
      }

      if (status === 'CHECKED_IN' && isToday(statusDate)) {
          return (
              <div className="bg-purple-100 dark:bg-purple-900/30 p-4 rounded-xl border border-purple-200 dark:border-purple-800 flex flex-col items-center gap-1 text-purple-800 dark:text-purple-200 font-bold mb-6">
                  <div className="flex items-center gap-2"><Clock className="w-5 h-5" /> Already in Queue</div>
                  <div className="text-2xl">Token #{data.todayStatus.tokenNumber}</div>
              </div>
          );
      }

      if (data.status === 'BLACKLISTED') {
          return (
              <div className="bg-red-100 dark:bg-red-900/30 p-4 rounded-xl border border-red-200 dark:border-red-800 text-center mb-6">
                  <p className="text-red-800 dark:text-red-200 font-bold flex items-center justify-center gap-2">
                      <AlertTriangle className="w-5 h-5" /> Distribution Blocked
                  </p>
                  <p className="text-sm text-red-700 dark:text-red-300 mt-1">{data.rejectionReason}</p>
              </div>
          );
      }

      // Inside renderActionSection...
if (isExpired) {
  return (
    <div className="space-y-4 mb-6">
      <div className="bg-orange-100 dark:bg-orange-900/30 p-4 rounded-xl border border-orange-200 dark:border-orange-800 text-center">
        <p className="text-orange-800 dark:text-orange-200 font-bold flex items-center justify-center gap-2">
          <AlertTriangle className="w-5 h-5" /> Cycle Expired
        </p>
        <p className="text-sm text-orange-700 dark:text-orange-300 mt-1">
          This family was last verified 3 years ago.
        </p>
      </div>
      
      <button 
        onClick={async () => {
          if(confirm("Confirm that you have checked their documents and want to renew for 3 years?")) {
            setProcessing(true);
            const res = await renewVerificationCycle(data._id);
            if(res.success) {
               // Refresh data to show the new "Verify" button
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

      return (
          <div className="sticky bottom-4 z-10 pt-2">
            <button 
                onClick={handleCheckIn}
                disabled={processing}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-xl shadow-blue-200 dark:shadow-none flex items-center justify-center gap-3 text-lg active:scale-95 transition-all"
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

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-5 pb-32 font-outfit">
      
      {/* Header */}
      <div className="mb-6 flex items-center gap-3">
        <button
          onClick={() => router.back()}
          className="p-2 rounded-xl bg-white dark:bg-gray-800 shadow border border-gray-200 dark:border-gray-700 active:scale-95 transition"
        >
          <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>

        <div>
          <p className="text-xs font-bold text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1">
            Station 1
          </p>
          <h1 className="text-3xl font-extrabold text-gray-900 dark:text-white">
            Check-In
          </h1>
        </div>
      </div>
      
      {/* Search */}
      <form onSubmit={handleSearch} className="relative mb-6 shadow-sm">
        <input 
          type="tel" value={query} onChange={e => setQuery(e.target.value)} placeholder="Search Mobile or Aadhaar..." 
          className="w-full p-4 pl-5 pr-14 rounded-2xl border-none bg-white dark:bg-gray-800 text-lg font-medium outline-none ring-1 ring-gray-200 dark:ring-gray-700 focus:ring-2 focus:ring-blue-500 transition-all"
        />
        <button type="submit" disabled={loading} className="absolute right-2 top-2 bottom-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 px-4 rounded-xl flex items-center justify-center">
          {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <Search className="w-5 h-5" />}
        </button>
      </form>

      {data && (
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl shadow-lg border border-gray-100 dark:border-gray-800 animate-in slide-in-from-bottom-6">
           
           {/* 1. Identity Header */}
           <div className="flex justify-between items-start mb-6 border-b border-gray-100 dark:border-gray-800 pb-4">
              <div>
                 <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">{data.fullName}</h2>
                 <div className="flex items-center gap-2 mt-1 text-gray-500 dark:text-gray-400">
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase font-bold">{data.gender}</span>
                    <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded uppercase font-bold">{data.husbandStatus}</span>
                 </div>
              </div>
              <span className={`px-2.5 py-1 rounded text-[10px] font-bold uppercase border ${
                  data.status === 'ACTIVE' ? 'bg-green-50 text-green-700 border-green-200' : 'bg-red-50 text-red-700 border-red-200'
              }`}>
                  {data.status}
              </span>
           </div>

           {/* --- Cycle Progress (New) --- */}
           <div className="mb-6 bg-purple-50 dark:bg-purple-900/10 p-4 rounded-2xl border border-purple-100 dark:border-purple-900/30">
              <div className="flex justify-between items-center mb-2">
                <div className="flex items-center gap-2 text-purple-700 dark:text-purple-300">
                  <CalendarDays className="w-4 h-4" />
                  <span className="text-xs font-bold uppercase tracking-wider">3-Year Cycle Progress</span>
                </div>
                <span className="text-xs font-bold text-purple-700 dark:text-purple-300">
                  Year {Math.min((data.distributedYears?.length || 0) + 1, 3)} of 3
                </span>
              </div>
              <div className="h-2 w-full bg-purple-100 dark:bg-purple-900/50 rounded-full overflow-hidden flex">
                <div 
                  style={{ width: `${((data.distributedYears?.length || 0) / 3) * 100}%` }} 
                  className="bg-purple-600 h-full transition-all duration-500"
                />
              </div>
              <p className="text-[10px] text-purple-600 dark:text-purple-400 mt-2 font-medium">
                Valid until: {data.verificationCycle?.endDate ? new Date(data.verificationCycle.endDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric' }) : 'N/A'}
              </p>
           </div>

           {/* 2. Key ID & Contact */}
           <div className="grid grid-cols-1 gap-3 mb-6">
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                 <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border shrink-0">
                    <CreditCard className="w-5 h-5 text-gray-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Aadhaar Number</p>
                    <p className="text-lg font-mono font-bold text-gray-900 dark:text-gray-100 tracking-wider">{data.aadharNumber}</p>
                 </div>
              </div>
              <div className="flex items-center gap-4 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                 <div className="h-10 w-10 bg-white dark:bg-gray-800 rounded-full flex items-center justify-center border shrink-0">
                    <Phone className="w-5 h-5 text-gray-500" />
                 </div>
                 <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase">Mobile Number</p>
                    <p className="text-lg font-mono font-medium text-gray-900 dark:text-gray-100">{data.mobileNumber}</p>
                 </div>
              </div>
           </div>

           {/* 3. Housing & Address */}
           <div className="mb-6 space-y-3">
              <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1">Housing & Address</h3>
              <div className="grid grid-cols-2 gap-3">
                 <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-xl border border-blue-100 dark:border-blue-900/30">
                    <div className="flex items-center gap-2 mb-1 text-blue-700 dark:text-blue-300">
                       <Home className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase">{data.housingType}</span>
                    </div>
                    <div className="flex items-center gap-1 text-blue-600 dark:text-blue-400">
                       <span className="text-xs">Rent:</span>
                       <span className="font-bold">₹{data.rentAmount || 0}</span>
                    </div>
                 </div>
                 <div className="bg-green-50 dark:bg-green-900/10 p-3 rounded-xl border border-green-100 dark:border-green-900/30">
                    <div className="flex items-center gap-2 mb-1 text-green-700 dark:text-green-300">
                       <Banknote className="w-4 h-4" />
                       <span className="text-xs font-bold uppercase">Income</span>
                    </div>
                    <span className="font-bold text-green-600 dark:text-green-400">₹{data.totalFamilyIncome}</span>
                 </div>
              </div>
              <div className="flex gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-xl">
                 <MapPin className="w-5 h-5 text-gray-400 shrink-0 mt-0.5" />
                 <div>
                    <p className="text-sm font-medium text-gray-800 dark:text-gray-200 leading-snug">{data.currentAddress}</p>
                    <p className="text-xs text-gray-500 mt-1 font-mono">Pin: {data.currentPincode}</p>
                 </div>
              </div>
           </div>

           {/* 4. Problems Tags */}
           {data.problems && data.problems.length > 0 && (
              <div className="mb-6">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest ml-1 mb-2">Problems</h3>
                 <div className="flex flex-wrap gap-2">
                    {data.problems.map((tag: string, i: number) => (
                       <span key={i} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-600 border border-red-100 text-xs font-bold flex items-center gap-1">
                          <Tag className="w-3 h-3" /> {tag}
                       </span>
                    ))}
                 </div>
              </div>
           )}

           {/* 5. Family Members */}
           <div className="mb-6">
              <div className="flex justify-between items-end mb-2 ml-1">
                 <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest">Family Members</h3>
                 <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-0.5 rounded font-bold">{data.familyMembersDetail?.length || 0}</span>
              </div>
              <div className="space-y-2">
                 {data.familyMembersDetail?.map((m: any, i: number) => (
                    <div key={i} className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700">
                       <div className="flex items-center gap-3">
                          <div className="w-8 h-8 bg-white dark:bg-gray-700 rounded-full flex items-center justify-center text-xs font-bold text-gray-500 border dark:border-gray-600">
                             {m.name.charAt(0)}
                          </div>
                          <div>
                             <p className="text-sm font-bold text-gray-900 dark:text-gray-100">{m.name}</p>
                             <div className="flex gap-2 text-[10px] text-gray-500 uppercase font-bold">
                                <span>{m.relation}</span> • <span>{m.age} Yrs</span>
                             </div>
                          </div>
                       </div>
                       {m.isEarning && (
                          <span className="text-[10px] bg-green-100 text-green-700 px-2 py-1 rounded font-bold">Earns</span>
                       )}
                    </div>
                 ))}
              </div>
           </div>

           {/* Action Button */}
           {renderActionSection()}

        </div>
      )}
    </div>
  );
}