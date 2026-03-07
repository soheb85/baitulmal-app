/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { 
  ArrowLeft, Phone, MapPin, Calendar, ShieldCheck, 
  CalendarDays, History, Home, Wallet, Users, QrCode, 
  AlertTriangle, Briefcase, IndianRupee, GraduationCap, School,
  UserX, ShieldAlert
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
  const isExpired = data.verificationCycle?.endDate && new Date() > new Date(data.verificationCycle.endDate);
  const isBlacklisted = data.status === 'BLACKLISTED';

  if (isNavigating) return <NavigationLoader message="Loading..." />;

  return (
    <div className="w-full">
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm px-4 py-3 flex justify-between items-center w-full">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleBack()}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform shrink-0"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div className="min-w-0">
             <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none truncate">Profile</h1>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5 truncate">Back to {backLabel}</p>
          </div>
        </div>
        
        <div className="flex gap-2 shrink-0">
            <button 
                onClick={() => setShowCard(true)}
                className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl active:scale-95 transition-transform"
                title="View Digital Card"
            >
                <QrCode className="w-5 h-5" />
            </button>
            <BeneficiaryActions id={data._id} />
        </div>
      </div>

      <div className="px-4 pt-6 max-w-3xl mx-auto space-y-5 pb-20 w-full overflow-hidden">

        {/* --- Prominent Blacklist Warning --- */}
        {isBlacklisted && (
            <div className="bg-red-50 dark:bg-red-900/20 border-2 border-red-100 dark:border-red-900/50 p-5 rounded-[2rem] animate-in zoom-in-95 duration-300 w-full">
                <div className="flex items-center gap-3 mb-3">
                    <div className="p-2 bg-red-600 rounded-xl shadow-lg shadow-red-200 dark:shadow-none shrink-0">
                        <UserX className="w-5 h-5 text-white" />
                    </div>
                    <div className="min-w-0">
                        <h3 className="text-red-700 dark:text-red-400 font-black uppercase text-xs tracking-widest truncate">Account Blocked</h3>
                        <p className="text-[10px] text-red-500 font-bold uppercase truncate">Distribution Suspended</p>
                    </div>
                </div>
                
                <div className="space-y-3">
                    <div className="bg-white/60 dark:bg-gray-900/60 p-3 rounded-2xl border border-red-100 dark:border-red-900/30">
                        <p className="text-[10px] text-gray-400 font-black uppercase mb-1">Reason for Blocking</p>
                        <p className="text-sm font-bold text-red-700 dark:text-red-300 italic break-words">
                            &quot;{data.rejectionReason || "No reason specified"}&quot;
                        </p>
                    </div>

                    <div className="flex items-center justify-between px-1">
                        <div className="flex items-center gap-2 min-w-0 pr-2">
                            <ShieldAlert className="w-3.5 h-3.5 text-red-400 shrink-0" />
                            <span className="text-[10px] font-bold text-gray-500 uppercase tracking-tight truncate">
                                Blocked By: <span className="text-red-600 dark:text-red-400 font-black">{data.rejectionBy || "System Admin"}</span>
                            </span>
                        </div>
                        <span className="text-[10px] font-bold text-gray-400 shrink-0">
                            {data.updatedAt ? new Date(data.updatedAt).toLocaleDateString() : ""}
                        </span>
                    </div>
                </div>
            </div>
        )}

        {/* --- 1. Compact Cycle Card --- */}
        {!isBlacklisted && (
            <div className={`p-4 rounded-2xl border shadow-sm flex flex-col gap-3 w-full ${
                isExpired ? "bg-red-50 border-red-100 dark:bg-red-900/10" : "bg-purple-50 border-purple-100 dark:bg-purple-900/10"
            }`}>
                <div className="flex justify-between items-center w-full">
                    <div className="flex items-center gap-2 min-w-0 pr-2">
                        <ShieldCheck className={`w-5 h-5 shrink-0 ${isExpired ? "text-red-600" : "text-purple-600"}`} />
                        <span className={`text-[10px] font-black uppercase tracking-widest truncate ${isExpired ? "text-red-700" : "text-purple-700"}`}>
                        {isExpired ? "Cycle Expired" : "Active Cycle"}
                        </span>
                    </div>
                    <span className="text-xs font-bold text-purple-900 dark:text-purple-200 shrink-0">{yearsTaken}/3 Years</span>
                </div>
                {/* Applied w-full and min-w-0 to fix Flex stretch */}
                <div className="flex gap-1.5 w-full">
                    {[1, 2, 3].map((step) => (
                        <div key={step} className={`h-1.5 flex-1 min-w-0 rounded-full ${step <= yearsTaken ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-700"}`} />
                    ))}
                </div>
            </div>
        )}

        {/* --- 2. Identity Card --- */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden w-full">
            <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl text-[10px] font-black uppercase tracking-widest ${
                data.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {data.status}
            </div>

            {/* Added break-words to handle long names */}
            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight pr-12 break-all max-w-full line-clamp-3">{data.fullName}</h2>
            <p className="text-xs font-mono text-gray-400 font-bold mt-1 tracking-wider">{data.aadharNumber}</p>

            <div className="mt-4 space-y-3 w-full">
                <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-blue-600">
                        <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200 truncate">{data.mobileNumber}</span>
                </div>
                <div className="flex items-start gap-3 w-full min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 text-purple-600 mt-0.5">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                        {/* Added break-words to Address to prevent pushing the screen */}
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug break-words">{data.currentAddress}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5 truncate">Pin: {data.currentPincode}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3 w-full min-w-0">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 text-orange-600">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-500 truncate">Reg: {new Date(data.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
            </div>

            {/* --- Economic Status --- */}
            <div className="mt-5 p-4 bg-gray-50 dark:bg-gray-800/50 rounded-2xl border border-gray-100 dark:border-gray-700 w-full min-w-0">
                <h4 className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-3 truncate">
                    Primary Applicant Economic Status
                </h4>
                
                {data.isEarning ? (
                    <div className="flex items-center gap-4 min-w-0">
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <Briefcase className="w-4 h-4 text-green-600 shrink-0" />
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Occupation</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{data.occupation}</p>
                            </div>
                        </div>
                        <div className="w-px h-8 bg-gray-200 dark:bg-gray-700 shrink-0"></div>
                        <div className="flex items-center gap-2 min-w-0 flex-1">
                            <span className="text-green-600 font-black text-lg shrink-0">₹</span>
                            <div className="min-w-0">
                                <p className="text-[10px] text-gray-500 font-bold uppercase truncate">Monthly Income</p>
                                <p className="text-sm font-black text-gray-900 dark:text-white truncate">{data.monthlyIncome}</p>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="flex items-center gap-2 text-gray-500">
                        <AlertTriangle className="w-4 h-4 text-orange-500 shrink-0" />
                        <p className="text-sm font-bold italic truncate">Main applicant is not earning</p>
                    </div>
                )}
            </div>
        </div>

        {/* --- 3. Financial & Housing Details --- */}
        <div className="grid grid-cols-2 gap-3 w-full">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1 truncate">
                    <Wallet className="w-3 h-3 shrink-0" /> Total Income
                </p>
                <div className="flex flex-col min-w-0">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400 truncate">₹{data.totalFamilyIncome}</span>
                    <span className="text-[10px] text-gray-400 font-medium truncate">Per Month</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm min-w-0">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1 truncate">
                    <Home className="w-3 h-3 shrink-0" /> Housing
                </p>
                <div className="flex flex-col min-w-0">
                    <span className="text-lg font-bold text-gray-900 dark:text-white truncate uppercase">
                        {data.housingType === 'RENT' ? 'Rented' : 'Own House'}
                    </span>
                    {data.housingType === 'RENT' && (
                        <span className="text-[11px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 rounded w-fit mt-0.5 truncate max-w-full">
                            Rent: ₹{data.rentAmount}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* --- 4. Problems List --- */}
        {data.problems && data.problems.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20 w-full">
                <h3 className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4 shrink-0" /> Problems Identified
                </h3>
                <div className="flex flex-wrap gap-2">
                    {data.problems.map((problem: string, index: number) => (
                        <span key={index} className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg shadow-sm max-w-full break-words">
                            {problem}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* --- 5. Family Details --- */}
        <div className="w-full">
            <h3 className="text-xs font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4 shrink-0" /> Family Details ({data.familyMembersDetail?.length})
            </h3>
            <div className="space-y-3 w-full">
                {data.familyMembersDetail?.map((m: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3 min-w-0 w-full">
                        <div className="flex justify-between items-start min-w-0 gap-2">
                            <div className="min-w-0">
                                {/* Added break-words for long family names */}
                                <p className="font-bold text-gray-900 dark:text-white text-base leading-none break-words">{m.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1.5 tracking-wider truncate">
                                    {m.relation} • {m.age} Yrs • {m.maritalStatus}
                                </p>
                            </div>
                            <div className="flex gap-1.5 shrink-0 flex-wrap justify-end">
                                {m.isEarning && (
                                    <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Earner</span>
                                )}
                                {m.isStudying && (
                                    <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Student</span>
                                )}
                            </div>
                        </div>

                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-50 dark:border-gray-800 min-w-0 w-full">
                            {m.isEarning ? (
                                <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 p-2 rounded-xl min-w-0">
                                    <div className="flex items-center gap-2 min-w-0 pr-2">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300 truncate">{m.occupation}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg shrink-0">
                                        <IndianRupee className="w-3 h-3 text-green-600" />
                                        <span className="text-xs font-black text-green-700 dark:text-green-400">₹{m.monthlyIncome}</span>
                                    </div>
                                </div>
                            ) : m.isStudying ? (
                                <div className="space-y-2 min-w-0">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0">
                                        <School className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                        <span className="text-xs font-bold truncate">{m.schoolName || "Not Specified"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400 min-w-0">
                                        <GraduationCap className="w-3.5 h-3.5 text-purple-500 shrink-0" />
                                        <span className="text-xs font-bold truncate">Class: {m.classStandard || "N/A"}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] font-bold text-gray-400 italic px-1 uppercase truncate">Non-earning / Not Studying</p>
                            )}
                            
                            {m.memberNotes && (
                                <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30 mt-1 min-w-0">
                                  <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5 shrink-0" />
                                  <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-tight break-words">
                                    Note: {m.memberNotes}
                                  </p>
                                </div>
                            )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- History --- */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm w-full min-w-0">
            <h3 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                <History className="w-4 h-4 shrink-0" /> History
            </h3>
            
            {/* FIXED: Horizontal Scroller for History Tags */}
            <div className="flex overflow-x-auto gap-2 mb-4 pb-2 w-full min-w-0" style={{ scrollbarWidth: 'none' }}>
                {data.distributedYears?.map((year: number) => (
                    <span key={year} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-xs font-bold border border-green-200 dark:border-green-800 flex items-center gap-1.5 shrink-0 whitespace-nowrap">
                        <CalendarDays className="w-3.5 h-3.5" /> {year}
                    </span>
                ))}
                {data.distributedYears?.length === 0 && <span className="text-xs text-gray-400 italic">No history yet.</span>}
            </div>
            
            {/* Wrapper to protect screen width from LegacySync */}
            <div className="min-w-0 w-full overflow-hidden">
                <LegacySync id={data._id} currentYears={data.distributedYears} />
            </div>
        </div>

        {/* --- Admin Notes --- */}
        {data.comments && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 mt-6 w-full min-w-0">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase mb-1">Admin Remarks</p>
                <p className="text-sm text-amber-900 dark:text-amber-100 italic break-words">&quot;{data.comments}&quot;</p>
            </div>
        )}

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