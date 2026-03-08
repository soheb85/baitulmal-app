/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { 
  ArrowLeft, Phone, MapPin, Calendar, ShieldCheck, 
  CalendarDays, History, Home, Wallet, Users, QrCode, 
  AlertTriangle, Briefcase, IndianRupee, GraduationCap, School,
  UserX, ShieldAlert, BadgeCheck, Clock, Map, Fingerprint,CalendarRange,
  Activity
} from "lucide-react";
import BeneficiaryActions from "@/components/BeneficiaryActions";
import LegacySync from "@/components/LegacySync";
import DigitalCardModal from "@/components/DigitalCardModal"; 
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";

export default function BeneficiaryDetailsView({ data, returnUrl, backLabel }: { data: any, returnUrl: string, backLabel: string }) {
  const [showCard, setShowCard] = useState(false);
  const { isNavigating, handleBack } = useBackNavigation(returnUrl);

  const yearsTaken = data.distributedYears?.length || 0;
  const cycleInfo = data.verificationCycle;
  
  const isExpired = cycleInfo?.endDate && new Date() > new Date(cycleInfo.endDate);
  const isFullyVerified = cycleInfo?.isFullyVerified;
  const isBlacklisted = data.status === 'BLACKLISTED';

  if (isNavigating) return <NavigationLoader message="Loading Profile..." />;

  return (
    <div className="w-full overflow-x-hidden bg-gray-50 dark:bg-gray-950 min-h-screen font-outfit">
      
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm px-4 py-3 flex justify-between items-center w-full">
        <div className="flex items-center gap-3 min-w-0">
          <button
            onClick={() => handleBack()}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="min-w-0 flex-1">
             <h1 className="text-base font-black text-gray-900 dark:text-white leading-none truncate">Master Profile</h1>
             <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">Reference: {data._id.slice(-6).toUpperCase()}</p>
          </div>
        </div>
        
        <div className="flex gap-2 shrink-0">
            <button 
                onClick={() => setShowCard(true)}
                className="p-2 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl active:scale-95 transition-transform border border-purple-100 dark:border-purple-800/50"
            >
                <QrCode className="w-5 h-5" />
            </button>
            <BeneficiaryActions id={data._id} />
        </div>
      </div>

      <div className="px-4 pt-5 max-w-2xl mx-auto space-y-5 pb-24 w-full overflow-hidden min-w-0">

        {/* --- 1. FULL ROW: AID TRACKER (Optimized Font) --- */}
        <section className="bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 rounded-[2rem] p-5 shadow-sm w-full min-w-0 relative overflow-hidden">
            <Activity className="absolute -right-2 -top-2 w-20 h-20 text-purple-500/5 -rotate-12" />
            
            <div className="flex justify-between items-end mb-5 relative z-10">
                <div>
                   <h3 className="text-[9px] font-black uppercase tracking-[0.2em] text-purple-600 mb-1">Distribution Tracker</h3>
                   <p className="text-xl font-black text-gray-900 dark:text-white">
                     {yearsTaken} <span className="text-gray-400 text-sm font-bold">/ 3 Years Taken</span>
                   </p>
                </div>
                <div className="text-right">
                   <span className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase ${isFullyVerified ? 'bg-green-500 text-white' : 'bg-orange-500 text-white'}`}>
                      {isFullyVerified ? 'Verified' : 'Pending'}
                   </span>
                </div>
            </div>

            <div className="flex gap-2 w-full h-10 mb-4 relative z-10">
                {[1, 2, 3].map((year) => (
                    <div 
                        key={year} 
                        className={`flex-1 rounded-xl flex items-center justify-center border-2 transition-all ${
                            year <= yearsTaken 
                            ? "bg-purple-600 border-purple-400 shadow-md shadow-purple-100 dark:shadow-none" 
                            : "bg-gray-50 dark:bg-gray-800 border-dashed border-gray-200 dark:border-gray-700"
                        }`}
                    >
                        {year <= yearsTaken ? (
                           <BadgeCheck className="w-5 h-5 text-white" />
                        ) : (
                           <span className="text-[9px] font-black text-gray-300 dark:text-gray-600 uppercase">Year {year}</span>
                        )}
                    </div>
                ))}
            </div>
            
            <div className="flex items-center justify-between text-[9px] font-bold text-gray-400 uppercase tracking-widest px-1">
                <span>Cycle: {cycleInfo?.startDate ? new Date(cycleInfo.startDate).getFullYear() : 'N/A'}</span>
                <span>Renewal: {cycleInfo?.endDate ? new Date(cycleInfo.endDate).toLocaleDateString('en-IN') : 'N/A'}</span>
            </div>
        </section>

        {/* --- 2. FULL ROW: BLACKLIST (Glassmorphism Style) --- */}
{isBlacklisted && (
  <div className="relative group w-full min-w-0 animate-in fade-in slide-in-from-top-4 duration-700">
    {/* Animated background glow to make the glass pop */}
    <div className="absolute -inset-1 bg-gradient-to-r from-red-600 to-rose-600 rounded-[2.2rem] blur opacity-20 group-hover:opacity-40 transition duration-1000 group-hover:duration-200"></div>
    
    <div className="relative bg-white/40 dark:bg-red-950/20 backdrop-blur-xl border border-red-200/50 dark:border-red-500/30 rounded-[2rem] p-5 shadow-xl shadow-red-500/10 w-full overflow-hidden">
      
      {/* Decorative inner circle for depth */}
      <div className="absolute -right-4 -bottom-4 w-24 h-24 bg-red-500/10 rounded-full blur-2xl"></div>

      <div className="flex items-start gap-4 relative z-10">
        {/* Icon Container with Glass Effect */}
        <div className="p-3 bg-gradient-to-br from-red-500 to-rose-600 rounded-2xl shrink-0 shadow-lg shadow-red-500/40 border border-white/20">
          <ShieldAlert className="w-6 h-6 text-white" />
        </div>

        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2 mb-1">
            <h3 className="text-red-700 dark:text-red-400 font-black uppercase text-[10px] tracking-[0.2em]">
              Account Restricted
            </h3>
            <span className="w-1.5 h-1.5 rounded-full bg-red-500 animate-pulse"></span>
          </div>
          
          {/* Reason text with better contrast on glass */}
          <div className="bg-red-50/50 dark:bg-black/20 p-3 rounded-xl border border-red-100/50 dark:border-white/5 mt-2">
            <p className="text-red-900 dark:text-red-200 text-xs font-bold leading-relaxed italic break-words">
              &quot;{data.rejectionReason || "Eligibility or documentation violation detected by system."}&quot;
            </p>
          </div>

          {/* Metadata Footer */}
          <div className="mt-3 flex items-center justify-between text-[8px] font-black text-red-600/60 dark:text-red-400/60 uppercase tracking-widest px-1">
            <span>By: {data.rejectionBy || "System Admin"}</span>
            <span>{data.updatedAt ? new Date(data.updatedAt).toLocaleDateString("en-IN") : ""}</span>
          </div>
        </div>
      </div>
    </div>
  </div>
)}

        {/* --- 3. IDENTITY CARD (Perfect mobile font) --- */}
        <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden w-full min-w-0">
            <div className={`absolute top-0 right-0 px-4 py-1.5 rounded-bl-[1.2rem] text-[9px] font-black uppercase tracking-[0.2em] ${
                data.status === 'ACTIVE' ? 'bg-emerald-500 text-white' : 'bg-red-600 text-white'
            }`}>
                {data.status}
            </div>

            <h2 className="text-[23px] font-black text-gray-900 dark:text-white leading-tight mb-4 pr-10 break-words">
              {data.fullName}
            </h2>
            
            {/* --- Formatted Aadhaar ID & Exception Tag --- */}
{/* --- HORIZONTAL ROW: Aadhaar & Exception --- */}
    <div className="flex flex-row items-center gap-5 mb-6 w-full overflow-x-auto no-scrollbar">
      
      {/* Aadhaar ID Badge */}
      <div className="flex items-center gap-2.5 bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-100 dark:border-indigo-800/50 px-3.5 py-2 rounded-xl shadow-sm shrink-0">
        <Fingerprint className="w-4 h-4 text-indigo-600 dark:text-indigo-400 shrink-0" />
        <div className="flex flex-col gap-1">
          <span className="text-[8px] font-black text-indigo-400 dark:text-indigo-500 uppercase tracking-widest leading-none mb-0.5">Aadhaar ID</span>
          <p className="text-[1.1rem] font-mono text-indigo-700 dark:text-indigo-300 font-black tracking-tight leading-none">
            {data.aadharNumber?.toString().replace(/(\d{4})(?=\d)/g, "$1 ")}
          </p>
        </div>
      </div>

      {/* Exception Tag (Horizontal) */}
      {data.isException && (
        <div className="flex items-center gap-1.5 bg-rose-50 dark:bg-rose-900/30 border border-rose-200 dark:border-rose-800/50 px-3 py-2.5 rounded-xl shrink-0 animate-in fade-in zoom-in duration-500">
          <AlertTriangle className="w-3.5 h-3.5 text-rose-600 dark:text-rose-400" />
          <span className="text-[8px] font-black text-rose-700 dark:text-rose-400 uppercase tracking-widest leading-none">
            Exception
          </span>
        </div>
      )}
    </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-3 w-full">
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 rounded-xl bg-blue-100 dark:bg-blue-900/30 flex items-center justify-center shrink-0 text-blue-600">
                        <Phone className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Mobile</p>
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200 truncate">{data.mobileNumber}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 bg-gray-50 dark:bg-gray-800/50 p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800">
                    <div className="w-9 h-9 rounded-xl bg-orange-100 dark:bg-orange-900/30 flex items-center justify-center shrink-0 text-orange-600">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Joined</p>
                      <p className="text-sm font-black text-gray-800 dark:text-gray-200 truncate">{new Date(data.createdAt).toLocaleDateString("en-IN")}</p>
                    </div>
                </div>
            </div>

            <div className="mt-3 flex items-start gap-3 bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl border border-gray-100 dark:border-gray-800">
                <div className="w-9 h-9 rounded-xl bg-purple-100 dark:bg-purple-900/30 flex items-center justify-center shrink-0 text-purple-600 mt-1">
                    <MapPin className="w-4 h-4" />
                </div>
                <div className="min-w-0 flex-1">
                    <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Address</p>
                    <p className="text-sm font-bold text-gray-700 dark:text-gray-300 leading-snug break-words">
                      {data.currentAddress}
                    </p>
                    <div className="flex items-center gap-4 mt-2">
                       <span className="text-[9px] font-black text-emerald-600 uppercase bg-emerald-50 dark:bg-emerald-900/20 px-2 py-0.5 rounded border border-emerald-100 dark:border-emerald-800/50">
                          {data.area || "N/A"}
                       </span>
                       <span className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Pin : {data.currentPincode}</span>
                    </div>
                </div>
            </div>
        </div>

        {!isBlacklisted && (
          <section className={`p-5 rounded-[2rem] border shadow-sm flex flex-col gap-4 w-full min-w-0 ${
              isExpired ? "bg-red-50 border-red-100 dark:bg-red-900/10" : "bg-teal-50 border-teal-100 dark:bg-teal-900/10"
          }`}>
              <div className="flex justify-between items-center w-full min-w-0 gap-2">
                  <div className="flex items-center gap-2 min-w-0">
                      {isExpired ? <Clock className="w-5 h-5 text-red-600 shrink-0" /> : <ShieldCheck className="w-5 h-5 text-teal-600 shrink-0" />}
                      <h3 className={`text-[10px] font-black uppercase tracking-widest truncate ${isExpired ? "text-red-700" : "text-teal-700"}`}>
                        {isExpired ? "Verification Expired" : "Verification Active"}
                      </h3>
                  </div>
                  <span className={`px-2 py-0.5 rounded-lg text-[9px] font-black uppercase ${isFullyVerified ? 'bg-teal-600 text-white' : 'bg-orange-500 text-white'}`}>
                    {isFullyVerified ? 'Verified' : 'Pending'}
                  </span>
              </div>
              
              <div className="grid grid-cols-2 gap-4 pt-1">
                 <div className="min-w-0">
                    <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1"><CalendarRange className="w-2.5 h-2.5" /> Start Date</p>
                    <p className="text-xs font-black text-gray-700 dark:text-gray-300 truncate">
                      {cycleInfo?.startDate ? new Date(cycleInfo.startDate).toLocaleDateString("en-IN") : "N/A"}
                    </p>
                 </div>
                 <div className="min-w-0">
                    <p className="text-[8px] font-bold text-gray-400 uppercase flex items-center gap-1"><History className="w-2.5 h-2.5" /> Renewal Date</p>
                    <p className={`text-xs font-black truncate ${isExpired ? "text-red-600" : "text-gray-700 dark:text-gray-300"}`}>
                      {cycleInfo?.endDate ? new Date(cycleInfo.endDate).toLocaleDateString("en-IN") : "N/A"}
                    </p>
                 </div>
              </div>
          </section>
        )}

        {/* --- 4. HOUSEHOLD & ECONOMY (Full Row Design) --- */}
        <section className="bg-white dark:bg-gray-900 p-6 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full min-w-0">
            <div className="flex justify-between items-center mb-5">
              <h3 className="text-[10px] font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                  <Users className="w-4 h-4" /> Household & Income
              </h3>
              <span className="text-[9px] font-black bg-gray-100 dark:bg-gray-800 text-gray-500 px-2.5 py-1 rounded-full uppercase">Members: {data.familyMembersDetail?.length || 0}</span>
            </div>

            <div className="grid grid-cols-2 gap-4 mb-5">
                <div className="space-y-1">
                   <p className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><Wallet className="w-3 h-3" /> Monthly Total</p>
                   <p className="text-xl font-black text-emerald-600 truncate">₹{data.totalFamilyIncome}</p>
                </div>
                <div className="space-y-1">
                   <p className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1"><Home className="w-3 h-3" /> Housing</p>
                   <p className="text-sm font-black text-gray-800 dark:text-white uppercase truncate">{data.housingType === 'RENT' ? 'Rented' : 'Own'}</p>
                   {data.housingType === 'RENT' && <p className="text-[9px] font-black text-red-500 tracking-tighter italic">Rent: ₹{data.rentAmount}</p>}
                </div>
            </div>

            {data.isEarning ? (
                <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-2xl flex items-center gap-4">
                    <Briefcase className="w-5 h-5 text-blue-500 shrink-0" />
                    <div className="min-w-0">
                        <p className="text-[8px] font-bold text-gray-400 uppercase">Applicant Job</p>
                        <p className="text-sm font-black text-gray-800 dark:text-white truncate">{data.occupation}</p>
                    </div>
                </div>
            ) : (
                <div className="bg-orange-50 dark:bg-orange-900/10 p-3 rounded-2xl border border-orange-100 dark:border-orange-900/20 flex items-center gap-3">
                   <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                   <p className="text-[10px] font-bold text-orange-700 dark:text-orange-300 italic leading-tight">No individual income recorded for primary applicant.</p>
                </div>
            )}
        </section>

        {/* --- 5. PROBLEMS LIST (Refined Audit Style) --- */}
{data.problems && data.problems.length > 0 && (
  <div className="relative overflow-hidden bg-white dark:bg-gray-900 border border-rose-100 dark:border-rose-900/30 rounded-[2rem] p-5 shadow-sm w-full min-w-0">
    
    {/* Subtle Background Accent */}
    <div className="absolute top-0 right-0 w-32 h-32 bg-rose-500/5 blur-3xl -mr-16 -mt-16 pointer-events-none"></div>

    <div className="flex items-center gap-3 mb-5 relative z-10">
      <div className="p-2.5 bg-rose-50 dark:bg-rose-900/40 rounded-2xl text-rose-600 dark:text-rose-400 border border-rose-100 dark:border-rose-800/50 shadow-sm">
        <AlertTriangle className="w-5 h-5" />
      </div>
      <div className="flex flex-col">
        <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-800 dark:text-rose-400">
          Problem Reported
        </h3>
        <div className="flex items-center gap-2 mt-1 relative z-10">
  {/* The Circle Count */}
  <div className="w-5 h-5 rounded-full bg-rose-500 dark:bg-rose-600 flex items-center justify-center shrink-0 shadow-sm shadow-rose-200 dark:shadow-none">
    <span className="text-[10px] font-black text-white leading-none">
      {data.problems.length}
    </span>
  </div>
  
  {/* The Label Text */}
  <p className="text-[9px] font-bold text-rose-500 dark:text-rose-400/70 uppercase tracking-[0.1em] leading-none">
    Key Concerns Identified
  </p>
</div>
      </div>
    </div>

    <div className="grid grid-cols-1 gap-2.5 relative z-10">
      {data.problems.map((problem: string, index: number) => (
        <div 
          key={index} 
          className="flex items-start gap-3 px-4 py-3 bg-rose-50/30 dark:bg-rose-950/20 border border-rose-100/50 dark:border-rose-900/30 rounded-[1.2rem] transition-all active:scale-[0.98]"
        >
          {/* Custom Checkpoint Bullet */}
          <div className="mt-1.5 shrink-0">
            <div className="w-1.5 h-1.5 rounded-full bg-rose-500 shadow-[0_0_8px_rgba(244,63,94,0.6)]"></div>
          </div>
          
          <span className="text-xs font-bold text-rose-900 dark:text-rose-200 leading-snug break-words capitalize">
            {problem}
          </span>
        </div>
      ))}
    </div>

    {/* Footer indicator */}
    {/* --- Registrar Attribution --- */}
<div className="mt-4 pt-4 border-t border-gray-50 dark:border-gray-800/50 flex items-center justify-between w-full">
    <div className="flex items-center gap-2">
        {/* Small Avatar Initial or Icon */}
        <div className="w-6 h-6 rounded-full bg-emerald-100 dark:bg-emerald-900/30 flex items-center justify-center text-[10px] font-black text-emerald-700 dark:text-emerald-400 border border-emerald-200 dark:border-emerald-800">
            {data.createdBy?.charAt(0).toUpperCase() || 'S'}
        </div>
        <div className="flex flex-col">
            <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest leading-none mb-0.5">Register By</span>
            <p className="text-[11px] font-bold text-gray-700 dark:text-gray-300 leading-none">
                {data.createdBy || "System Generated"}
            </p>
        </div>
    </div>

    {/* Optional: Show Registration Method/Source */}
    <div className="bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-md">
        <span className="text-[8px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-tighter">
            Source: {data.registrationSource || "Web App"}
        </span>
    </div>
</div>
  </div>
)}

        {/* --- 6. Family Details --- */}
        <div className="w-full min-w-0">
            <div className="flex justify-between items-center mb-4 px-1">
              <h3 className="text-xs font-black text-gray-400 uppercase tracking-widest flex items-center gap-2 truncate">
                  <Users className="w-4 h-4 shrink-0" /> Household Members
              </h3>
              <span className="text-[10px] font-black bg-gray-200 dark:bg-gray-800 text-gray-600 dark:text-gray-400 px-2 py-0.5 rounded-full uppercase">Count: {data.familyMembersDetail?.length}</span>
            </div>
            
            <div className="space-y-3 w-full min-w-0">
                {data.familyMembersDetail?.map((m: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-4 w-full min-w-0">
                        <div className="flex justify-between items-start min-w-0 gap-3 w-full">
                            <div className="min-w-0 flex-1">
                                <p className="font-black text-gray-900 dark:text-white text-lg leading-tight break-all max-w-full">{m.name}</p>
                                <div className="flex items-center gap-2 mt-1 flex-wrap">
                                   <span className="text-[9px] font-black text-purple-600 bg-purple-50 dark:bg-purple-900/30 px-2 py-0.5 rounded uppercase tracking-wider">{m.relation}</span>
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">• {m.age} Yrs</span>
                                   <span className="text-[10px] font-bold text-gray-400 uppercase">• {m.maritalStatus}</span>
                                </div>
                            </div>
                            <div className="flex gap-1.5 shrink-0 flex-wrap justify-end max-w-[100px]">
                                {m.isEarning && (
                                    <span className="text-[8px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase shadow-sm">Earner</span>
                                )}
                                {m.isStudying && (
                                    <span className="text-[8px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase shadow-sm">Student</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-4 border-t border-gray-50 dark:border-gray-800 w-full min-w-0">
                            {m.isEarning ? (
                                <div className="flex items-center justify-between bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl min-w-0 w-full border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 min-w-0 flex-1 pr-2">
                                        <Briefcase className="w-4 h-4 text-blue-500 shrink-0" />
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate block">{m.occupation}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-3 py-1 rounded-xl shrink-0 border border-green-100 dark:border-green-900/30">
                                        <IndianRupee className="w-3 h-3 text-green-600 shrink-0" />
                                        <span className="text-xs font-black text-green-700 dark:text-green-400 truncate block">₹{m.monthlyIncome}</span>
                                    </div>
                                </div>
                            ) : m.isStudying ? (
                                <div className="space-y-2 min-w-0 w-full bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-700">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0 w-full">
                                        <School className="w-4 h-4 text-purple-500 shrink-0" />
                                        <span className="text-xs font-bold truncate block">{m.schoolName || "Not Specified"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0 w-full">
                                        <GraduationCap className="w-4 h-4 text-purple-500 shrink-0" />
                                        <span className="text-xs font-black truncate block">Standard: {m.classStandard || "N/A"}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] font-bold text-gray-400 italic px-2 uppercase tracking-widest bg-gray-50 dark:bg-gray-800/50 p-2 rounded-xl text-center">Non-earning / Dependent</p>
                            )}
                            
                            {m.memberNotes && (
                                <div className="flex items-start gap-2 bg-amber-50/50 dark:bg-amber-900/10 p-3 rounded-2xl border border-amber-100/50 dark:border-amber-900/30 mt-1 min-w-0 w-full">
                                  <AlertTriangle className="w-3.5 h-3.5 text-amber-600 mt-0.5 shrink-0" />
                                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-normal break-words max-w-full">
                                    Member Note: {m.memberNotes}
                                  </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- 7. History Section --- */}
        <div className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full min-w-0">
            <h3 className="text-xs font-black text-gray-400 uppercase mb-5 tracking-widest flex items-center gap-2 truncate">
                <History className="w-4 h-4 shrink-0" /> Distribution History
            </h3>
            
            <div className="flex overflow-x-auto gap-3 mb-6 pb-2 w-full min-w-0 no-scrollbar">
                {data.distributedYears?.map((year: number) => (
                    <div key={year} className="px-4 py-2 bg-green-50 dark:bg-green-900/20 text-green-700 dark:text-green-400 rounded-2xl text-xs font-black border border-green-100 dark:border-green-800 flex items-center gap-2 shrink-0 whitespace-nowrap shadow-sm">
                        <CalendarDays className="w-4 h-4" /> Year {year}
                    </div>
                ))}
                {data.distributedYears?.length === 0 && <span className="text-xs text-gray-400 italic bg-gray-50 dark:bg-gray-800 px-4 py-2 rounded-xl border border-dashed border-gray-200 dark:border-gray-700">No collection history recorded yet.</span>}
            </div>
            
            <div className="min-w-0 w-full overflow-hidden bg-gray-50 dark:bg-gray-800/30 p-2 rounded-3xl">
                <LegacySync id={data._id} currentYears={data.distributedYears} />
            </div>
        </div>

        {/* --- 8. Referenced By & Remarks --- */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full min-w-0">
          <div className="bg-blue-50 dark:bg-blue-900/10 p-5 rounded-[2rem] border border-blue-100 dark:border-blue-900/20 w-full min-w-0">
              <p className="text-[10px] font-black text-blue-700 dark:text-blue-500 uppercase tracking-widest mb-1 truncate">Verified / Referenced By</p>
              <p className="text-sm font-black text-blue-900 dark:text-blue-200 truncate">{data.referencedBy || "Direct Walk-in"}</p>
          </div>

          {data.comments && (
              <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-[2rem] border border-amber-100 dark:border-amber-900/20 w-full min-w-0">
                  <p className="text-[10px] font-black text-amber-700 dark:text-amber-500 uppercase tracking-widest mb-1 truncate">Admin Remarks</p>
                  <p className="text-xs text-amber-900 dark:text-amber-100 font-bold leading-relaxed break-words max-w-full italic">&quot;{data.comments}&quot;</p>
              </div>
          )}
        </div>

        {/* --- MODAL: Digital Card --- */}
        {showCard && (
            <DigitalCardModal 
                data={{
                    _id: data._id,
                    fullName: data.fullName,
                    aadharNumber: data.aadharNumber,
                    mobileNumber: data.mobileNumber,
                    familyCount: data.familyMembersDetail?.length || 0,
                }}
                onClose={() => setShowCard(false)}
            />
        )}
      </div>
    </div>
  );
}