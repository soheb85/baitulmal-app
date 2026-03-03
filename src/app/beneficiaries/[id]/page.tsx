/* eslint-disable @typescript-eslint/no-explicit-any */
import Link from "next/link";

import Beneficiary from "@/models/Beneficiary";
import { ArrowLeft, Phone, MapPin, Calendar, AlertTriangle, Edit } from "lucide-react";
import { connectDB } from "@/lib/mongoose";

// Server Component Helper
async function getBeneficiaryDetail(id: string) {
  await connectDB();
  const b = await Beneficiary.findById(id).lean();
  if (!b) return null;
  // Convert _id and Dates to strings
  return JSON.parse(JSON.stringify(b));
}

// FIX: Type 'params' as a Promise and await it inside the component
type Props = {
  params: Promise<{ id: string }>;
};

export default async function BeneficiaryDetailPage({ params }: Props) {
  // 1. Unwrap the params Promise
  const resolvedParams = await params;
  const id = resolvedParams.id;

  // 2. Fetch Data
  const data = await getBeneficiaryDetail(id);

  if (!data) return <div className="p-10 text-center text-gray-500">Beneficiary Not Found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-5 pt-8 pb-10">
      
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
         <div className="flex items-center gap-3">
            <Link href="/beneficiaries" className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm">
                <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
            </Link>
            <h1 className="text-xl font-bold font-outfit text-gray-900 dark:text-white">Profile Details</h1>
         </div>
         {/* Edit Button (Placeholder) */}
         <button className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full">
            <Edit className="w-5 h-5" />
         </button>
      </div>

      {/* Main Card */}
      <div className="bg-white dark:bg-gray-900 rounded-3xl p-6 shadow-sm border border-gray-100 dark:border-gray-800 mb-4">
         <div className="flex justify-between items-start mb-4">
            <div>
               <h2 className="text-2xl font-bold font-outfit text-gray-900 dark:text-white">{data.fullName}</h2>
               <p className="text-sm text-gray-500 font-mono mt-1 px-2 py-0.5 bg-gray-100 dark:bg-gray-800 rounded w-fit">
                 {data.aadharNumber}
               </p>
            </div>
            <span className={`px-3 py-1 rounded-lg text-xs font-bold uppercase ${
               data.status === 'ACTIVE' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
            }`}>
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
               <span>Reg: {new Date(data.createdAt).toLocaleDateString()}</span>
            </div>
         </div>
      </div>

      {/* Blacklist Warning */}
      {data.status === 'BLACKLISTED' && (
         <div className="bg-red-50 dark:bg-red-900/20 p-4 rounded-2xl border border-red-100 dark:border-red-800 mb-6 flex gap-3 animate-in fade-in">
            <AlertTriangle className="w-5 h-5 text-red-600 shrink-0 mt-0.5" />
            <div>
               <h4 className="font-bold text-red-700 dark:text-red-300 text-sm">Blacklisted Reason</h4>
               <p className="text-sm text-red-600 dark:text-red-400 mt-1">{data.rejectionReason}</p>
            </div>
         </div>
      )}

      {/* Family List */}
      <div className="mb-6">
         <h3 className="text-xs font-bold text-gray-400 uppercase mb-3 ml-1 tracking-wider">
            Family Members ({data.familyMembersDetail?.length || 0})
         </h3>
         <div className="space-y-2">
            {data.familyMembersDetail?.map((m: any, i: number) => (
                <div key={i} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm">
                <div>
                    <p className="font-bold text-gray-800 dark:text-gray-200">{m.name}</p>
                    <div className="flex gap-2 text-xs text-gray-500 mt-0.5">
                        <span className="bg-gray-100 dark:bg-gray-800 px-1.5 rounded">{m.relation}</span>
                        <span>•</span>
                        <span>{m.age} Yrs</span>
                    </div>
                </div>
                {m.isEarning && (
                    <div className="text-right">
                        <span className="text-[10px] font-bold text-green-700 bg-green-50 px-2 py-1 rounded-full border border-green-100">
                            EARNING
                        </span>
                        <p className="text-xs text-green-600 font-semibold mt-1">₹{m.monthlyIncome}</p>
                    </div>
                )}
                </div>
            ))}
            {(!data.familyMembersDetail || data.familyMembersDetail.length === 0) && (
                <p className="text-sm text-gray-400 italic text-center py-4">No family members listed.</p>
            )}
         </div>
      </div>

      {/* Notes */}
      {data.comments && (
         <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/20 mb-20">
            <h4 className="text-xs font-bold text-amber-700 dark:text-amber-500 uppercase mb-2">Volunteer Notes</h4>
            <p className="text-sm text-amber-900 dark:text-amber-100 italic leading-relaxed">&quot;{data.comments}&quot;</p>
         </div>
      )}
    </div>
  );
}