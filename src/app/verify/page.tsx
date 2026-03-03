/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { 
  Search, ArrowLeft, Loader2, CheckCircle2, 
  XCircle, AlertTriangle, MapPin, Users, Phone, User, SlidersHorizontal 
} from "lucide-react";

// --- Types ---
type BeneficiaryData = {
  _id: string;
  fullName: string;
  aadharNumber: string;
  mobileNumber: string;
  status: "ACTIVE" | "BLACKLISTED" | "ON_HOLD";
  rejectionReason?: string;
  husbandStatus: string;
  currentAddress: string;
  currentPincode: string;
  familyMembersDetail: any[];
  totalFamilyIncome: number;
  referencedBy?: string;
  comments?: string;
};

export default function VerifyPage() {
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BeneficiaryData | null>(null);
  const [error, setError] = useState("");
  
  // UI State for Filters (Visual only for now since search is direct)
  const [activeFilter, setActiveFilter] = useState<"ALL" | "ACTIVE" | "BLACKLISTED">("ALL");

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;

    setLoading(true);
    setError("");
    setData(null);

    // Simulate network delay for smooth UI feel if needed, or just call directly
    const result = await searchBeneficiary(query);

    if (result.success && result.data) {
      setData(result.data as BeneficiaryData);
    } else {
      setError(result.message || "No beneficiary found with this number.");
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      
      {/* --- 1. Sticky Header & Search --- */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800">
        <div className="px-4 pt-4 pb-2">
            <div className="flex items-center gap-3 mb-4">
                <Link href="/" className="p-2 -ml-2 hover:bg-gray-100 dark:hover:bg-gray-900 rounded-full transition-colors">
                    <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
                </Link>
                <h1 className="font-outfit text-xl font-bold text-gray-900 dark:text-white">
                    Verification
                </h1>
            </div>

            <form onSubmit={handleSearch} className="relative shadow-sm rounded-2xl">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                    <Search className="h-5 w-5 text-gray-400" />
                </div>
                <input 
                    type="tel" 
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    placeholder="Search Aadhaar or Mobile..." 
                    className="block w-full pl-11 pr-12 py-3.5 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl text-gray-900 dark:text-gray-100 placeholder-gray-500 focus:ring-2 focus:ring-blue-500/50 text-lg font-medium outline-none transition-all"
                />
                <button 
                    type="submit"
                    disabled={loading || !query}
                    className="absolute inset-y-1 right-1 px-4 bg-white dark:bg-gray-800 rounded-xl flex items-center justify-center text-blue-600 disabled:text-gray-400 font-bold shadow-sm transition-all active:scale-95"
                >
                    {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Go"}
                </button>
            </form>

            {/* Quick Filters (Optional Visual Cue) */}
            <div className="flex gap-2 mt-3 pb-2 overflow-x-auto no-scrollbar">
                {(["ALL", "ACTIVE", "BLACKLISTED"] as const).map((filter) => (
                    <button
                        key={filter}
                        onClick={() => setActiveFilter(filter)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all whitespace-nowrap ${
                            activeFilter === filter 
                            ? "bg-gray-900 text-white border-gray-900 dark:bg-white dark:text-gray-900" 
                            : "bg-transparent text-gray-500 border-gray-200 dark:border-gray-800"
                        }`}
                    >
                        {filter === "ALL" ? "All Status" : filter}
                    </button>
                ))}
            </div>
        </div>
      </div>

      {/* --- 2. Main Content Area --- */}
      <div className="px-4 pt-6">

        {/* State: Idle (No Search) */}
        {!data && !loading && !error && (
            <div className="flex flex-col items-center justify-center mt-20 opacity-50">
                <Search className="w-16 h-16 text-gray-300 dark:text-gray-700 mb-4" />
                <p className="text-gray-500 font-medium">Enter details to verify beneficiary</p>
            </div>
        )}

        {/* State: Loading Skeleton */}
        {loading && (
            <div className="space-y-4 animate-pulse">
                <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
                <div className="h-40 bg-gray-200 dark:bg-gray-800 rounded-2xl w-full"></div>
                <div className="grid grid-cols-2 gap-4">
                    <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                    <div className="h-24 bg-gray-200 dark:bg-gray-800 rounded-2xl"></div>
                </div>
            </div>
        )}

        {/* State: Error */}
        {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex flex-col items-center text-center animate-in fade-in zoom-in-95">
                <div className="w-12 h-12 bg-red-100 dark:bg-red-900/30 rounded-full flex items-center justify-center mb-3">
                    <AlertTriangle className="w-6 h-6 text-red-600 dark:text-red-400" />
                </div>
                <h3 className="text-red-900 dark:text-red-200 font-bold text-lg mb-1">Not Found</h3>
                <p className="text-red-600 dark:text-red-300/80 text-sm">{error}</p>
                <Link href="/register" className="mt-4 px-6 py-2 bg-red-600 text-white rounded-lg text-sm font-bold shadow-md">
                    Register New Family
                </Link>
            </div>
        )}

        {/* State: Result Data */}
        {data && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-5">
                
                {/* Status Card */}
                <div className={`relative overflow-hidden p-6 rounded-3xl border shadow-sm ${
                    data.status === 'ACTIVE' 
                    ? 'bg-gradient-to-br from-green-500 to-green-600 border-transparent text-white' 
                    : 'bg-white dark:bg-gray-900 border-red-100 dark:border-red-900'
                }`}>
                    <div className="relative z-10 flex justify-between items-start">
                        <div>
                            <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${data.status === 'ACTIVE' ? 'text-green-100' : 'text-gray-500'}`}>
                                Current Status
                            </p>
                            <h2 className={`text-3xl font-outfit font-bold ${data.status === 'ACTIVE' ? 'text-white' : 'text-red-600'}`}>
                                {data.status}
                            </h2>
                            {data.status === 'BLACKLISTED' && (
                                <div className="mt-3 bg-red-50 dark:bg-red-900/30 px-3 py-2 rounded-lg border border-red-100 dark:border-red-800">
                                    <p className="text-xs text-red-800 dark:text-red-200 font-semibold">
                                        Reason: {data.rejectionReason}
                                    </p>
                                </div>
                            )}
                        </div>
                        <div className={`p-3 rounded-full ${data.status === 'ACTIVE' ? 'bg-white/20 backdrop-blur-sm' : 'bg-red-100 dark:bg-red-900/30'}`}>
                            {data.status === 'ACTIVE' 
                                ? <CheckCircle2 className="w-8 h-8 text-white" /> 
                                : <XCircle className="w-8 h-8 text-red-500" />
                            }
                        </div>
                    </div>
                </div>

                {/* Main Details Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm overflow-hidden">
                    <div className="p-6 border-b border-gray-100 dark:border-gray-800">
                        <h3 className="text-2xl font-outfit font-bold text-gray-900 dark:text-white mb-1">
                            {data.fullName}
                        </h3>
                        <div className="flex items-center gap-2">
                            <span className="px-2 py-1 bg-gray-100 dark:bg-gray-800 text-xs font-mono font-medium rounded text-gray-600 dark:text-gray-400">
                                {data.aadharNumber}
                            </span>
                            <span className="w-1 h-1 bg-gray-300 rounded-full"></span>
                            <span className="text-sm font-semibold text-blue-600 dark:text-blue-400">
                                {data.husbandStatus}
                            </span>
                        </div>
                    </div>
                    
                    <div className="p-6 space-y-4 bg-gray-50/50 dark:bg-gray-900/50">
                         <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-blue-50 dark:bg-blue-900/20 flex items-center justify-center flex-shrink-0">
                                <Phone className="w-4 h-4 text-blue-600 dark:text-blue-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Mobile Number</p>
                                <p className="text-gray-900 dark:text-gray-200 font-medium">{data.mobileNumber}</p>
                            </div>
                         </div>

                         <div className="flex items-start gap-4">
                            <div className="w-8 h-8 rounded-full bg-purple-50 dark:bg-purple-900/20 flex items-center justify-center flex-shrink-0">
                                <MapPin className="w-4 h-4 text-purple-600 dark:text-purple-400" />
                            </div>
                            <div>
                                <p className="text-xs text-gray-500 font-bold uppercase">Address</p>
                                <p className="text-gray-900 dark:text-gray-200 font-medium leading-snug">
                                    {data.currentAddress}
                                </p>
                                <p className="text-xs text-gray-500 mt-0.5">Pincode: {data.currentPincode}</p>
                            </div>
                         </div>

                         {data.referencedBy && (
                            <div className="flex items-start gap-4">
                                <div className="w-8 h-8 rounded-full bg-orange-50 dark:bg-orange-900/20 flex items-center justify-center flex-shrink-0">
                                    <User className="w-4 h-4 text-orange-600 dark:text-orange-400" />
                                </div>
                                <div>
                                    <p className="text-xs text-gray-500 font-bold uppercase">Reference</p>
                                    <p className="text-orange-700 dark:text-orange-300 font-bold">
                                        {data.referencedBy}
                                    </p>
                                </div>
                            </div>
                         )}
                    </div>
                </div>

                {/* Statistics Row */}
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center items-center text-center">
                        <Users className="w-6 h-6 text-gray-400 mb-2" />
                        <span className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">
                            {data.familyMembersDetail?.length || 0}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Members</span>
                    </div>
                    <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm flex flex-col justify-center items-center text-center">
                        <span className="text-lg font-bold text-green-600 mb-1">₹</span>
                        <span className="text-3xl font-outfit font-bold text-gray-900 dark:text-white">
                            {data.totalFamilyIncome}
                        </span>
                        <span className="text-xs font-bold text-gray-400 uppercase tracking-wide">Monthly Income</span>
                    </div>
                </div>

                {/* Notes Section */}
                {data.comments && (
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-3xl border border-amber-100 dark:border-amber-900/20">
                        <p className="text-xs text-amber-600 dark:text-amber-500 font-bold uppercase mb-2 flex items-center gap-2">
                            <SlidersHorizontal className="w-3 h-3" />
                            Internal Notes
                        </p>
                        <p className="text-sm text-amber-900 dark:text-amber-100 italic leading-relaxed">
                            &quot;{data.comments}&quot;
                        </p>
                    </div>
                )}

                {/* Action Button */}
                <div className="pt-4 pb-8">
                    <button 
                        disabled={data.status !== 'ACTIVE'} 
                        className={`w-full py-4 rounded-2xl font-bold text-lg shadow-lg transition-transform active:scale-[0.98] ${
                            data.status === 'ACTIVE'
                            ? 'bg-green-600 text-white shadow-green-200 dark:shadow-none hover:bg-green-700'
                            : 'bg-gray-200 text-gray-400 cursor-not-allowed dark:bg-gray-800 dark:text-gray-600 shadow-none'
                        }`}
                    >
                        {data.status === 'ACTIVE' ? 'Issue Ration Kit' : 'Distribution Blocked'}
                    </button>
                </div>

            </div>
        )}
      </div>
    </div>
  );
}