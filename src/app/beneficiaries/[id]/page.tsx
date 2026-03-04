/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";
import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import {
  ArrowLeft,
  Phone,
  MapPin,
  Calendar,
  ShieldCheck,
  CalendarDays,
  History,
  Home,
  Banknote,
} from "lucide-react";
import BeneficiaryActions from "@/components/BeneficiaryActions";
import LegacySync from "@/components/LegacySync";

// --- FIXED: Server Component Helper with Deep Serialization ---
async function getBeneficiaryDetail(id: string) {
  await connectDB();
  const b = await Beneficiary.findById(id).lean();
  if (!b) return null;

  // Convert MongoDB objects to plain JSON strings to avoid serialization errors
  return {
    ...b,
    _id: b._id.toString(),
    createdAt: b.createdAt ? new Date(b.createdAt).toISOString() : null,
    updatedAt: b.updatedAt ? new Date(b.updatedAt).toISOString() : null,

    // Serialize Cycle Data
    distributedYears: b.distributedYears || [],
    verificationCycle: b.verificationCycle ? {
      ...b.verificationCycle,
      startDate: b.verificationCycle.startDate?.toISOString(),
      endDate: b.verificationCycle.endDate?.toISOString(),
    } : null,

    // Deeply serialize nested arrays
    familyMembersDetail: b.familyMembersDetail?.map((m: any) => ({
      ...m,
      _id: m._id ? m._id.toString() : undefined,
    })) || [],

    distributionHistory: b.distributionHistory?.map((h: any) => ({
      ...h,
      _id: h._id ? h._id.toString() : undefined,
      date: h.date ? new Date(h.date).toISOString() : null,
      year: h.year || new Date(h.date).getFullYear()
    })) || [],
  };
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function BeneficiaryDetailPage({ params }: Props) {
  const resolvedParams = await params;
  const id = resolvedParams.id;
  const data = await getBeneficiaryDetail(id);

  if (!data)
    return (
      <div className="p-10 text-center text-gray-500 font-outfit">
        Beneficiary Not Found
      </div>
    );

  const yearsTaken = data.distributedYears?.length || 0;
  const isExpired = data.verificationCycle?.endDate && new Date() > new Date(data.verificationCycle.endDate);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-5 pt-8 pb-10 font-outfit">
      
      {/* --- Header --- */}
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <Link
            href="/beneficiaries"
            className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm"
          >
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </Link>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">
            Profile Details
          </h1>
        </div>
        <BeneficiaryActions id={data._id} />
      </div>

      {/* --- 1. 3-Year Cycle Progress Card --- */}
      <div className={`mb-6 p-5 rounded-3xl border shadow-sm flex flex-col gap-3 animate-in fade-in slide-in-from-top-4 ${
        isExpired 
        ? "bg-red-50 border-red-100 dark:bg-red-900/10 dark:border-red-900/30" 
        : "bg-purple-50 border-purple-100 dark:bg-purple-900/10 dark:border-purple-900/30"
      }`}>
        <div className="flex justify-between items-center">
          <div className="flex items-center gap-2">
            <ShieldCheck className={isExpired ? "text-red-600" : "text-purple-600"} />
            <span className={`text-xs font-bold uppercase tracking-widest ${isExpired ? "text-red-700" : "text-purple-700"}`}>
              {isExpired ? "Verification Expired" : "Active 3-Year Cycle"}
            </span>
          </div>
          <span className="text-sm font-black text-purple-800 dark:text-purple-200">
            {yearsTaken} / 3 Years Collected
          </span>
        </div>

        {/* Progress Bar Segments */}
        <div className="flex gap-2">
          {[1, 2, 3].map((step) => (
            <div 
              key={step} 
              className={`h-2 flex-1 rounded-full transition-all duration-700 ${
                step <= yearsTaken ? "bg-purple-600" : "bg-gray-200 dark:bg-gray-800"
              }`} 
            />
          ))}
        </div>
        
        <div className="flex justify-between items-center mt-1">
          <p className="text-[10px] font-bold text-gray-500 uppercase">
            Valid Until: {data.verificationCycle?.endDate 
              ? new Date(data.verificationCycle.endDate).toLocaleDateString('en-IN', { month: 'long', year: 'numeric'}) 
              : 'N/A'}
          </p>
          {isExpired && <span className="text-[10px] font-black text-red-600 uppercase animate-pulse">Action Required</span>}
        </div>
      </div>

      {/* --- 2. Main Identity Card --- */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-6">
        <div className="flex justify-between items-start mb-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white leading-tight">
              {data.fullName}
            </h2>
            <p className="text-sm text-gray-500 font-mono mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded w-fit">
              {data.aadharNumber}
            </p>
          </div>
          <span
            className={`px-3 py-1 rounded-lg text-xs font-bold uppercase border ${
              data.status === "ACTIVE"
                ? "bg-green-50 text-green-700 border-green-100 dark:bg-green-900/20 dark:border-green-800"
                : "bg-red-50 text-red-700 border-red-100 dark:bg-red-900/20 dark:border-red-800"
            }`}
          >
            {data.status}
          </span>
        </div>

        <div className="space-y-4 pt-2">
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center shrink-0">
              <Phone className="w-4 h-4 text-blue-600" />
            </div>
            <span className="font-medium">{data.mobileNumber}</span>
          </div>
          <div className="flex items-start gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center shrink-0">
              <MapPin className="w-4 h-4 text-purple-600" />
            </div>
            <div>
              <p className="leading-tight">{data.currentAddress}</p>
              <p className="text-xs text-gray-500 mt-0.5">Pincode: {data.currentPincode}</p>
            </div>
          </div>
          <div className="flex items-center gap-3 text-sm text-gray-700 dark:text-gray-300">
            <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center shrink-0">
              <Calendar className="w-4 h-4 text-orange-600" />
            </div>
            <span>Reg: {data.createdAt ? new Date(data.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "N/A"}</span>
          </div>
        </div>
      </div>

      {/* --- 3. Collection Summary & Timeline --- */}
      <div className="mb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 ml-1 tracking-widest flex items-center gap-2">
          <History className="w-4 h-4" />
          Collection Summary
        </h3>

        {/* Annual Badges */}
        <div className="flex flex-wrap gap-2 mb-4">
          {data.distributedYears?.length > 0 ? (
            data.distributedYears.map((year: number) => (
              <span key={year} className="px-3 py-1.5 bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400 rounded-xl text-xs font-bold border border-green-200 dark:border-green-800 flex items-center gap-1.5 shadow-sm">
                <CalendarDays className="w-3.5 h-3.5" /> Ramzan {year}
              </span>
            ))
          ) : (
            <div className="bg-gray-100 dark:bg-gray-800/50 p-3 rounded-xl w-full text-center">
               <p className="text-xs text-gray-500 italic">No annual collections recorded yet.</p>
            </div>
          )}
        </div>

        {/* Timeline */}
        <div className="space-y-3">
          {data.distributionHistory?.length > 0 ? (
            [...data.distributionHistory]
              .reverse()
              .map((record: any, i: number) => (
                <div
                  key={i}
                  className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm hover:border-green-200 dark:hover:border-green-900 transition-colors"
                >
                  <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">Ration Distributed</p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(record.date).toLocaleDateString("en-IN", {
                        day: "2-digit",
                        month: "long",
                        year: "numeric",
                      })}
                    </p>
                  </div>
                  <div className="text-right">
                    <span className="text-[10px] font-extrabold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-100 dark:bg-green-900/20 dark:text-green-400 dark:border-green-800">
                      RAMZAN {record.year}
                    </span>
                  </div>
                </div>
              ))
          ) : null}
        </div>
      </div>

      <LegacySync id={data._id} currentYears={data.distributedYears} />

      {/* --- 4. Family Members --- */}
      <div className="mt-4 mb-8">
        <h3 className="text-xs font-bold text-gray-400 uppercase mb-4 ml-1 tracking-widest">
          Family Members ({data.familyMembersDetail?.length || 0})
        </h3>
        <div className="space-y-3">
          {data.familyMembersDetail?.map((m: any, i: number) => (
            <div
              key={i}
              className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm"
            >
              <div>
                <p className="font-bold text-gray-800 dark:text-gray-200">{m.name}</p>
                <div className="flex gap-2 text-[10px] text-gray-500 mt-0.5 uppercase font-bold">
                  <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{m.relation}</span>
                  <span className="bg-gray-100 dark:bg-gray-800 px-1.5 py-0.5 rounded">{m.age} Yrs</span>
                </div>
              </div>
              {m.isEarning && (
                <div className="text-right">
                  <span className="text-[9px] font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-full border border-blue-100 dark:bg-blue-900/20 dark:text-blue-400">EARNING</span>
                  <p className="text-xs text-blue-600 dark:text-blue-300 font-bold mt-1">₹{m.monthlyIncome}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>

      {/* --- 5. Volunteer Notes --- */}
      {data.comments && (
        <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/20 mb-20">
          <h4 className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase mb-2 tracking-widest">
            Volunteer Notes
          </h4>
          <p className="text-sm text-amber-900 dark:text-amber-100 italic leading-relaxed">
            &quot;{data.comments}&quot;
          </p>
        </div>
      )}
    </div>
  );
}