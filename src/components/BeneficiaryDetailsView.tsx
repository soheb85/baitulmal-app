/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { 
  ArrowLeft, Phone, MapPin, Calendar, ShieldCheck, 
  CalendarDays, History, Home, Wallet, Users, Edit, QrCode, 
  AlertTriangle, Briefcase, IndianRupee, GraduationCap, School
} from "lucide-react";
import BeneficiaryActions from "@/components/BeneficiaryActions";
import LegacySync from "@/components/LegacySync";
import DigitalCardModal from "@/components/DigitalCardModal"; 
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default function BeneficiaryDetailsView({ data, returnUrl, backLabel }: { data: any, returnUrl: string, backLabel: string }) {
  const [showCard, setShowCard] = useState(false);
  const { isNavigating, handleBack } = useBackNavigation(returnUrl);

  const yearsTaken = data.distributedYears?.length || 0;
  const isExpired = data.verificationCycle?.endDate && new Date() > new Date(data.verificationCycle.endDate);

  if (isNavigating) return <NavigationLoader message="Loading..." />;

  return (
    <>
      {/* --- Sticky Header --- */}
      <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 shadow-sm px-4 py-3 flex justify-between items-center">
        <div className="flex items-center gap-3">
          <button
            onClick={() => handleBack()}
            className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform"
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
             <h1 className="text-lg font-bold text-gray-900 dark:text-white leading-none">Profile</h1>
             <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-0.5">Back to {backLabel}</p>
          </div>
        </div>
        
        <div className="flex gap-2">
            <button 
                onClick={() => setShowCard(true)}
                className="p-2.5 bg-purple-50 dark:bg-purple-900/20 text-purple-600 dark:text-purple-400 rounded-xl active:scale-95 transition-transform"
                title="View Digital Card"
            >
                <QrCode className="w-5 h-5" />
            </button>

            {/* <Link 
               href={`/beneficiaries/${data._id}?edit=true&returnTo=${returnUrl}`} 
               className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl active:scale-95 transition-transform"
            >
                <Edit className="w-5 h-5" />
            </Link> */}
            
            <BeneficiaryActions id={data._id} />
        </div>
      </div>

      <div className="px-4 pt-6 max-w-3xl mx-auto space-y-5 pb-20">

        {/* --- 1. Compact Cycle Card --- */}
        <div className={`p-4 rounded-2xl border shadow-sm flex flex-col gap-3 ${
            isExpired ? "bg-red-50 border-red-100 dark:bg-red-900/10" : "bg-purple-50 border-purple-100 dark:bg-purple-900/10"
        }`}>
            <div className="flex justify-between items-center">
                <div className="flex items-center gap-2">
                    <ShieldCheck className={`w-5 h-5 ${isExpired ? "text-red-600" : "text-purple-600"}`} />
                    <span className={`text-[10px] font-black uppercase tracking-widest ${isExpired ? "text-red-700" : "text-purple-700"}`}>
                    {isExpired ? "Cycle Expired" : "Active Cycle"}
                    </span>
                </div>
                <span className="text-xs font-bold text-purple-900 dark:text-purple-200">{yearsTaken}/3 Years</span>
            </div>
            <div className="flex gap-1.5">
                {[1, 2, 3].map((step) => (
                    <div key={step} className={`h-1.5 flex-1 rounded-full ${step <= yearsTaken ? "bg-purple-600" : "bg-gray-300 dark:bg-gray-700"}`} />
                ))}
            </div>
        </div>

        {/* --- 2. Identity Card --- */}
        <div className="bg-white dark:bg-gray-900 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-800 relative overflow-hidden">
            <div className={`absolute top-0 right-0 px-3 py-1.5 rounded-bl-xl text-[10px] font-black uppercase tracking-widest ${
                data.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}>
                {data.status}
            </div>

            <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight pr-12">{data.fullName}</h2>
            <p className="text-xs font-mono text-gray-400 font-bold mt-1 tracking-wider">{data.aadharNumber}</p>

            <div className="mt-4 space-y-3">
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0 text-blue-600">
                        <Phone className="w-4 h-4" />
                    </div>
                    <span className="font-bold text-gray-800 dark:text-gray-200">{data.mobileNumber}</span>
                </div>
                <div className="flex items-start gap-3">
                    <div className="w-8 h-8 rounded-xl bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0 text-purple-600 mt-0.5">
                        <MapPin className="w-4 h-4" />
                    </div>
                    <div>
                        <p className="text-sm font-medium text-gray-700 dark:text-gray-300 leading-snug">{data.currentAddress}</p>
                        <p className="text-[10px] font-bold text-gray-400 uppercase mt-0.5">Pin: {data.currentPincode}</p>
                    </div>
                </div>
                <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-xl bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0 text-orange-600">
                        <Calendar className="w-4 h-4" />
                    </div>
                    <span className="text-xs font-bold text-gray-500">Reg: {new Date(data.createdAt).toLocaleDateString("en-IN")}</span>
                </div>
            </div>
        </div>

        {/* --- 3. Financial & Housing Details --- */}
        <div className="grid grid-cols-2 gap-3">
            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Wallet className="w-3 h-3" /> Total Income
                </p>
                <div className="flex flex-col">
                    <span className="text-xl font-bold text-green-600 dark:text-green-400">₹{data.totalFamilyIncome}</span>
                    <span className="text-[10px] text-gray-400 font-medium">Per Month</span>
                </div>
            </div>

            <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
                <p className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 flex items-center gap-1">
                    <Home className="w-3 h-3" /> Housing
                </p>
                <div className="flex flex-col">
                    <span className="text-lg font-bold text-gray-900 dark:text-white truncate uppercase">
                        {data.housingType === 'RENT' ? 'Rented' : 'Own House'}
                    </span>
                    {data.housingType === 'RENT' && (
                        <span className="text-[11px] text-red-500 font-bold bg-red-50 dark:bg-red-900/20 px-1.5 rounded w-fit mt-0.5">
                            Rent: ₹{data.rentAmount}
                        </span>
                    )}
                </div>
            </div>
        </div>

        {/* --- 4. Problems List --- */}
        {data.problems && data.problems.length > 0 && (
            <div className="bg-red-50 dark:bg-red-900/10 p-4 rounded-2xl border border-red-100 dark:border-red-900/20">
                <h3 className="text-xs font-black text-red-800 dark:text-red-400 uppercase tracking-widest mb-2 flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" /> Problems Identified
                </h3>
                <div className="flex flex-wrap gap-2">
                    {data.problems.map((problem: string, index: number) => (
                        <span key={index} className="px-2.5 py-1 bg-white dark:bg-gray-900 border border-red-200 dark:border-red-800 text-red-700 dark:text-red-400 text-xs font-bold rounded-lg shadow-sm">
                            {problem}
                        </span>
                    ))}
                </div>
            </div>
        )}

        {/* --- 5. Detailed Family List (Updated with Education & Income) --- */}
        <div>
            <h3 className="text-xs font-black text-gray-400 uppercase mb-3 ml-1 tracking-widest flex items-center gap-2">
                <Users className="w-4 h-4" /> Family Details ({data.familyMembersDetail?.length})
            </h3>
            <div className="space-y-3">
                {data.familyMembersDetail?.map((m: any, i: number) => (
                    <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col gap-3">
                        <div className="flex justify-between items-start">
                            <div>
                                <p className="font-bold text-gray-900 dark:text-white text-base leading-none">{m.name}</p>
                                <p className="text-[10px] font-bold text-gray-400 uppercase mt-1.5 tracking-wider">
                                    {m.relation} • {m.age} Yrs • {m.maritalStatus}
                                </p>
                            </div>
                            <div className="flex gap-1.5">
                                {m.isEarning && (
                                    <span className="text-[9px] bg-green-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Earner</span>
                                )}
                                {m.isStudying && (
                                    <span className="text-[9px] bg-blue-500 text-white px-2 py-0.5 rounded-full font-black uppercase">Student</span>
                                )}
                            </div>
                        </div>

                        {/* Details Grid for Member */}
                        <div className="grid grid-cols-1 gap-2 pt-2 border-t border-gray-50 dark:border-gray-800">
                            {m.isEarning ? (
                                <div className="flex items-center justify-between bg-gray-50/50 dark:bg-gray-800/50 p-2 rounded-xl">
                                    <div className="flex items-center gap-2">
                                        <Briefcase className="w-3.5 h-3.5 text-blue-500" />
                                        <span className="text-xs font-bold text-gray-700 dark:text-gray-300">{m.occupation}</span>
                                    </div>
                                    <div className="flex items-center gap-1 bg-green-50 dark:bg-green-900/20 px-2 py-1 rounded-lg">
                                        <IndianRupee className="w-3 h-3 text-green-600" />
                                        <span className="text-xs font-black text-green-700 dark:text-green-400">₹{m.monthlyIncome}</span>
                                    </div>
                                </div>
                            ) : m.isStudying ? (
                                <div className="space-y-2">
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <School className="w-3.5 h-3.5 text-purple-500" />
                                        <span className="text-xs font-bold">{m.schoolName || "Not Specified"}</span>
                                    </div>
                                    <div className="flex items-center gap-2 text-gray-600 dark:text-gray-400">
                                        <GraduationCap className="w-3.5 h-3.5 text-purple-500" />
                                        <span className="text-xs font-bold">Class: {m.classStandard || "N/A"}</span>
                                    </div>
                                </div>
                            ) : (
                                <p className="text-[10px] font-bold text-gray-400 italic px-1 uppercase">Non-earning / Not Studying</p>
                            )}
                            
                            {m.memberNotes && (
    <div className="flex items-start gap-1.5 bg-amber-50 dark:bg-amber-900/20 p-2 rounded-lg border border-amber-100 dark:border-amber-900/30">
      <AlertTriangle className="w-3 h-3 text-amber-600 mt-0.5" />
      <p className="text-[11px] font-bold text-amber-800 dark:text-amber-200 leading-tight">
        Note: {m.memberNotes}
      </p>
    </div>
  )}
                        </div>
                    </div>
                ))}
            </div>
        </div>

        {/* --- 6. History --- */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
            <h3 className="text-xs font-black text-gray-400 uppercase mb-4 tracking-widest flex items-center gap-2">
                <History className="w-4 h-4" /> History
            </h3>
            <div className="flex flex-wrap gap-2 mb-4">
                {data.distributedYears?.map((year: number) => (
                    <span key={year} className="px-2.5 py-1 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-lg text-[10px] font-bold border border-green-200 dark:border-green-800 flex items-center gap-1">
                        <CalendarDays className="w-3 h-3" /> {year}
                    </span>
                ))}
                {data.distributedYears?.length === 0 && <span className="text-xs text-gray-400 italic">No history yet.</span>}
            </div>
            <LegacySync id={data._id} currentYears={data.distributedYears} />
        </div>

        {/* --- 7. Notes --- */}
        {data.comments && (
            <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-2xl border border-amber-100 dark:border-amber-900/20 mt-6">
                <p className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase mb-1">Notes</p>
                <p className="text-sm text-amber-900 dark:text-amber-100 italic">&quot;{data.comments}&quot;</p>
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
    </>
  );
}