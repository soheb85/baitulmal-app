/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import Link from "next/link";
import { searchBeneficiary } from "@/app/actions/searchBeneficiary";
import { updateBeneficiaryStatus } from "@/app/actions/updateStatus"; // Import the new action
import { 
  Search, ArrowLeft, Loader2, CheckCircle2, 
  XCircle, AlertTriangle, MapPin, Users, Phone, User, SlidersHorizontal, ShieldAlert 
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
  // Search State
  const [query, setQuery] = useState("");
  const [loading, setLoading] = useState(false);
  const [data, setData] = useState<BeneficiaryData | null>(null);
  const [error, setError] = useState("");
  
  // Status Update State
  const [isUpdating, setIsUpdating] = useState(false);
  const [showBlockForm, setShowBlockForm] = useState(false);
  const [blockReason, setBlockReason] = useState("");

  // --- Search Handler ---
  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query) return;
    setLoading(true);
    setError("");
    setData(null);
    setShowBlockForm(false); // Reset form

    const result = await searchBeneficiary(query);

    if (result.success && result.data) {
      setData(result.data as BeneficiaryData);
    } else {
      setError(result.message || "Not found");
    }
    setLoading(false);
  };

  // --- Status Change Handler ---
  const handleStatusChange = async (newStatus: "ACTIVE" | "BLACKLISTED" | "ON_HOLD") => {
    if (!data?._id) return;
    
    // Validation
    if (newStatus === "BLACKLISTED" && !blockReason.trim()) {
        alert("Please write a reason for blacklisting.");
        return;
    }

    if(!confirm(`Are you sure you want to mark this person as ${newStatus}?`)) return;

    setIsUpdating(true);
    
    const result = await updateBeneficiaryStatus(data._id, newStatus, blockReason);

    if (result.success) {
        // Manually update local state to reflect change immediately
        setData(prev => prev ? ({ ...prev, status: newStatus, rejectionReason: blockReason }) : null);
        setShowBlockForm(false);
        setBlockReason("");
    } else {
        alert(result.message);
    }
    setIsUpdating(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 pb-24">
      
      {/* Header & Search (Same as before) */}
      <div className="sticky top-0 z-20 bg-white/80 dark:bg-gray-950/80 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 px-4 pt-4 pb-2">
        <div className="flex items-center gap-3 mb-4">
            <Link href="/" className="p-2 -ml-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-900">
                <ArrowLeft className="w-6 h-6 text-gray-700 dark:text-gray-200" />
            </Link>
            <h1 className="font-outfit text-xl font-bold text-gray-900 dark:text-white">Verification</h1>
        </div>
        <form onSubmit={handleSearch} className="relative shadow-sm rounded-2xl">
            <Search className="absolute left-4 top-3.5 h-5 w-5 text-gray-400" />
            <input 
                type="tel" value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search Mobile/Aadhaar..." 
                className="block w-full pl-11 pr-12 py-3.5 bg-gray-100 dark:bg-gray-900 border-none rounded-2xl font-medium outline-none focus:ring-2 focus:ring-blue-500/50 transition-all"
            />
            <button type="submit" disabled={loading || !query} className="absolute inset-y-1 right-1 px-4 bg-white dark:bg-gray-800 rounded-xl text-blue-600 font-bold shadow-sm">
                {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Go"}
            </button>
        </form>
      </div>

      {/* Main Content */}
      <div className="px-4 pt-6">
        {error && (
            <div className="p-6 bg-red-50 dark:bg-red-900/10 text-center rounded-2xl border border-red-100 dark:border-red-900/30">
                <AlertTriangle className="w-8 h-8 text-red-500 mx-auto mb-2" />
                <p className="text-red-700 dark:text-red-300 font-medium">{error}</p>
            </div>
        )}

        {data && (
            <div className="animate-in slide-in-from-bottom-4 fade-in duration-500 space-y-5">
                
                {/* 1. Status Banner */}
                <div className={`p-6 rounded-3xl border shadow-sm flex justify-between items-start ${
                    data.status === 'ACTIVE' 
                    ? 'bg-green-600 text-white border-transparent' 
                    : 'bg-white dark:bg-gray-900 border-red-100 dark:border-red-900'
                }`}>
                    <div>
                        <p className={`text-xs font-bold tracking-widest uppercase mb-1 ${data.status === 'ACTIVE' ? 'text-green-100' : 'text-gray-500'}`}>Status</p>
                        <h2 className={`text-3xl font-outfit font-bold ${data.status === 'ACTIVE' ? 'text-white' : 'text-red-600'}`}>{data.status}</h2>
                        {data.status === 'BLACKLISTED' && <p className="text-xs text-red-800 dark:text-red-200 mt-2 font-semibold bg-red-50 dark:bg-red-900/30 px-2 py-1 rounded">Reason: {data.rejectionReason}</p>}
                    </div>
                    {data.status === 'ACTIVE' ? <CheckCircle2 className="w-10 h-10 text-white/80" /> : <XCircle className="w-10 h-10 text-red-500" />}
                </div>

                {/* 2. Personal Info Card */}
                <div className="bg-white dark:bg-gray-900 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm p-6 space-y-4">
                    <div>
                        <h3 className="text-2xl font-bold font-outfit">{data.fullName}</h3>
                        <p className="font-mono text-gray-500 text-sm mt-1">{data.aadharNumber}</p>
                    </div>
                    <div className="space-y-3 pt-2">
                        <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-300"><Phone className="w-4 h-4" /> {data.mobileNumber}</div>
                        <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-300"><MapPin className="w-4 h-4" /> {data.currentAddress}</div>
                        <div className="flex gap-3 text-sm text-gray-600 dark:text-gray-300"><Users className="w-4 h-4" /> {data.familyMembersDetail?.length || 0} Members</div>
                    </div>
                </div>

                {/* 3. Action Buttons Area */}
                <div className="space-y-3 pb-10">
                    
                    {/* A) If Active: Show Issue Ration OR Block Option */}
                    {data.status === 'ACTIVE' && !showBlockForm && (
                        <>
                            <button className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95">
                                Issue Ration Kit (Give Food)
                            </button>
                            
                            <button 
                                onClick={() => setShowBlockForm(true)}
                                className="w-full bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 font-bold py-3 rounded-2xl border border-red-100 dark:border-red-900 hover:bg-red-100 transition-all flex items-center justify-center gap-2"
                            >
                                <ShieldAlert className="w-5 h-5" />
                                Report Issue / Block Person
                            </button>
                        </>
                    )}

                    {/* B) Block/Hold Form (Shows when 'Report Issue' is clicked) */}
                    {showBlockForm && (
                        <div className="bg-gray-100 dark:bg-gray-800 p-5 rounded-3xl border border-gray-200 dark:border-gray-700 animate-in zoom-in-95">
                            <h4 className="font-bold text-gray-900 dark:text-white mb-3">Why are you blocking them?</h4>
                            <textarea 
                                value={blockReason}
                                onChange={(e) => setBlockReason(e.target.value)}
                                placeholder="e.g. Found they have a government job, Owns a car, etc..."
                                className="w-full p-3 rounded-xl border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm mb-3 focus:ring-2 focus:ring-red-500 outline-none"
                                rows={2}
                            />
                            <div className="grid grid-cols-2 gap-3">
                                <button 
                                    onClick={() => handleStatusChange("BLACKLISTED")}
                                    disabled={isUpdating}
                                    className="bg-red-600 text-white font-bold py-3 rounded-xl shadow-md active:scale-95"
                                >
                                    {isUpdating ? "Saving..." : "Confirm Blacklist"}
                                </button>
                                <button 
                                    onClick={() => setShowBlockForm(false)}
                                    disabled={isUpdating}
                                    className="bg-white dark:bg-gray-700 text-gray-600 dark:text-gray-200 font-bold py-3 rounded-xl border"
                                >
                                    Cancel
                                </button>
                            </div>
                        </div>
                    )}

                    {/* C) If Blacklisted: Show Option to Re-Activate */}
                    {data.status === 'BLACKLISTED' && (
                        <div className="bg-red-50 dark:bg-red-900/20 p-5 rounded-3xl border border-red-100 dark:border-red-800 text-center">
                            <p className="text-red-800 dark:text-red-200 font-medium text-sm mb-3">
                                This person cannot receive ration because they are Blacklisted.
                            </p>
                            <button 
                                onClick={() => handleStatusChange("ACTIVE")}
                                disabled={isUpdating}
                                className="px-6 py-2 bg-white dark:bg-gray-800 border border-gray-300 dark:border-gray-600 rounded-xl text-sm font-bold text-gray-700 dark:text-gray-300 active:scale-95"
                            >
                                {isUpdating ? "Updating..." : "Mistake? Re-Activate"}
                            </button>
                        </div>
                    )}

                </div>
            </div>
        )}
      </div>
    </div>
  );
}