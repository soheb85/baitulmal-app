/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { removeArrayElement, getBeneficiaryArrays } from "@/app/actions/admin/arrayOperations";
import { 
  ArrowLeft, Search, Loader2, Scissors, CheckCircle2, 
  AlertTriangle, Trash2, Database, Users, Calendar, Hash, XCircle,
  Fingerprint, Phone, MapPin // Added new icons
} from "lucide-react";

type ArrayType = "distributionHistory" | "familyMembersDetail" | "problems" | "distributedYears";

export default function ArrayEditorPage() {
  const { handleBack } = useBackNavigation("/admin/advanced-tools");
  const [search, setSearch] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [message, setMessage] = useState<{ type: "success" | "error", text: string, detail?: string } | null>(null);
  
  const [userData, setUserData] = useState<any>(null);
  const [activeTab, setActiveTab] = useState<ArrayType>("distributionHistory");

  // Custom Modal State
  const [confirmModal, setConfirmModal] = useState<{
    isOpen: boolean;
    matchKey: string;
    matchValue: any;
    displayLabel: string;
  } | null>(null);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!search.trim()) return;
    setIsSearching(true);
    setMessage(null);
    setUserData(null);
    
    const res = await getBeneficiaryArrays(search.trim());
    if (res.success) {
      setUserData(res.data);
    } else {
      setMessage({ type: "error", text: res.message });
    }
    setIsSearching(false);
  };

  const executeDelete = async () => {
    if (!confirmModal) return;
    setIsDeleting(true);
    setMessage(null);

    const res = await removeArrayElement(userData._id, activeTab, confirmModal.matchKey, confirmModal.matchValue);
    
    if (res.success) {
      setMessage({ type: "success", text: "Successfully deleted item.", detail: `Removed from ${activeTab}` });
      // Refresh data
      const updatedRes = await getBeneficiaryArrays(userData._id.toString());
      if (updatedRes.success) setUserData(updatedRes.data);
    } else {
      setMessage({ type: "error", text: res.message });
    }
    
    setIsDeleting(false);
    setConfirmModal(null);
  };

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative font-outfit">
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-black text-fuchsia-600 flex items-center gap-2">
              <Scissors className="w-4 h-4" /> Array Editor
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Surgical Data Deletion</p>
          </div>
        </div>

        {/* Status Message */}
        {message && (
          <div className={`p-4 rounded-2xl border flex items-center gap-3 mb-6 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 dark:bg-green-900/20 border-green-100 dark:border-green-900/30' : 'bg-red-50 dark:bg-red-900/20 border-red-100 dark:border-red-900/30'}`}>
            {message.type === 'success' ? <CheckCircle2 className="w-6 h-6 text-green-600 shrink-0" /> : <AlertTriangle className="w-6 h-6 text-red-600 shrink-0" />}
            <div>
              <p className={`text-sm font-bold ${message.type === 'success' ? 'text-green-800 dark:text-green-400' : 'text-red-800 dark:text-red-400'}`}>{message.text}</p>
              {message.detail && <p className={`text-[10px] font-bold uppercase mt-0.5 ${message.type === 'success' ? 'text-green-600' : 'text-red-600'}`}>{message.detail}</p>}
            </div>
          </div>
        )}

        {/* Search Form */}
        <div className="bg-fuchsia-50 dark:bg-fuchsia-900/10 p-4 rounded-2xl border border-fuchsia-100 dark:border-fuchsia-900/30 flex gap-3 mb-6">
          <Database className="w-5 h-5 text-fuchsia-600 shrink-0" />
          <p className="text-[10px] text-fuchsia-800 dark:text-fuchsia-400 leading-relaxed font-bold">
            Search to load a family&apos;s hidden arrays. Then carefully select and delete incorrect objects.
          </p>
        </div>

        <form onSubmit={handleSearch} className="relative mb-6">
          <input 
            type="text" 
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Aadhaar, Mobile, or Name..."
            className="w-full p-4 pl-5 pr-14 rounded-2xl bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 font-bold outline-none focus:border-fuchsia-500 shadow-sm text-gray-900 dark:text-white"
          />
          <button type="submit" disabled={isSearching} className="absolute right-2 top-2 bottom-2 px-4 bg-fuchsia-50 dark:bg-fuchsia-900/30 text-fuchsia-600 rounded-xl flex items-center justify-center">
            {isSearching ? <Loader2 className="w-5 h-5 animate-spin" /> : <Search className="w-5 h-5" />}
          </button>
        </form>

        {/* Results Area */}
        {userData && (
          <div className="animate-in slide-in-from-bottom-4">
            
            {/* DETAILED IDENTITY CARD */}
            <div className="bg-white dark:bg-gray-800 p-5 rounded-[2rem] shadow-sm mb-6 border border-gray-100 dark:border-gray-700 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-32 h-32 bg-fuchsia-500/5 dark:bg-fuchsia-500/10 rounded-bl-[100px] -z-0"></div>
              
              <div className="flex justify-between items-start mb-5 relative z-10">
                <div className="pr-4">
                  <h2 className="text-xl font-black text-gray-900 dark:text-white leading-tight">{userData.fullName}</h2>
                  <div className="flex gap-2 items-center mt-2">
                    <span className={`text-[9px] font-black px-2 py-0.5 rounded-md uppercase tracking-widest ${
                      userData.status === 'ACTIVE' ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400' : 
                      userData.status === 'BLACKLISTED' ? 'bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-400' : 
                      'bg-orange-100 text-orange-700 dark:bg-orange-900/30 dark:text-orange-400'
                    }`}>
                      {userData.status || "ACTIVE"}
                    </span>
                    <span className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">{userData.gender}</span>
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3 relative z-10">
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-2">
                  <Fingerprint className="w-4 h-4 text-fuchsia-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Aadhaar</p>
                    <p className="text-xs font-mono font-black text-gray-900 dark:text-white truncate">{userData.aadharNumber}</p>
                  </div>
                </div>
                <div className="bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-2">
                  <Phone className="w-4 h-4 text-blue-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Mobile</p>
                    <p className="text-xs font-mono font-black text-gray-900 dark:text-white truncate">{userData.mobileNumber || "N/A"}</p>
                  </div>
                </div>
                <div className="col-span-2 bg-gray-50 dark:bg-gray-900/50 p-3 rounded-xl border border-gray-100 dark:border-gray-700 flex items-start gap-2">
                  <MapPin className="w-4 h-4 text-emerald-500 mt-0.5 shrink-0" />
                  <div className="min-w-0">
                    <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Area & Pincode</p>
                    <p className="text-xs font-bold text-gray-900 dark:text-white truncate">
                      {userData.area || "Area Not Set"} <span className="text-gray-400 mx-1">•</span> {userData.currentPincode || "No Pin"}
                    </p>
                  </div>
                </div>
              </div>
            </div>

            {/* TABS */}
            <div className="flex bg-gray-200 dark:bg-gray-800 p-1 rounded-2xl mb-6 shadow-inner overflow-x-auto hide-scrollbar">
              <TabButton 
                active={activeTab === "distributionHistory"} 
                onClick={() => setActiveTab("distributionHistory")} 
                icon={<Calendar className="w-4 h-4" />} label="History" count={userData.distributionHistory?.length} 
              />
              <TabButton 
                active={activeTab === "familyMembersDetail"} 
                onClick={() => setActiveTab("familyMembersDetail")} 
                icon={<Users className="w-4 h-4" />} label="Family" count={userData.familyMembersDetail?.length} 
              />
              <TabButton 
                active={activeTab === "distributedYears"} 
                onClick={() => setActiveTab("distributedYears")} 
                icon={<Hash className="w-4 h-4" />} label="Years" count={userData.distributedYears?.length} 
              />
              <TabButton 
                active={activeTab === "problems"} 
                onClick={() => setActiveTab("problems")} 
                icon={<AlertTriangle className="w-4 h-4" />} label="Problems" count={userData.problems?.length} 
              />
            </div>

            {/* Array Items List */}
            <div className="space-y-3">
              {userData[activeTab]?.length === 0 && (
                <div className="text-center p-8 text-gray-400 font-bold text-sm bg-gray-100 dark:bg-gray-800/50 rounded-2xl border border-dashed border-gray-300 dark:border-gray-700">
                  This array is empty.
                </div>
              )}

              {/* 1. History */}
              {activeTab === "distributionHistory" && userData.distributionHistory.map((item: any) => (
                <ListItem 
                  key={item._id}
                  title={`Year: ${item.year}`}
                  subtitle={`Status: ${item.status} | Token: ${item.tokenNumber || "N/A"}`}
                  onDelete={() => setConfirmModal({ isOpen: true, matchKey: "_id", matchValue: item._id, displayLabel: `History Record: ${item.year}` })}
                />
              ))}

              {/* 2. Family */}
              {activeTab === "familyMembersDetail" && userData.familyMembersDetail.map((item: any) => (
                <ListItem 
                  key={item._id}
                  title={item.name}
                  subtitle={`Rel: ${item.relation} | Age: ${item.age}`}
                  onDelete={() => setConfirmModal({ isOpen: true, matchKey: "_id", matchValue: item._id, displayLabel: `Family Member: ${item.name}` })}
                />
              ))}

              {/* 3. Years */}
              {activeTab === "distributedYears" && userData.distributedYears.map((year: number, i: number) => (
                <ListItem 
                  key={i}
                  title={`Distributed Year`}
                  subtitle={year.toString()}
                  onDelete={() => setConfirmModal({ isOpen: true, matchKey: "", matchValue: year, displayLabel: `Distributed Year: ${year}` })}
                />
              ))}

              {/* 4. Problems */}
              {activeTab === "problems" && userData.problems.map((problem: string, i: number) => (
                <ListItem 
                  key={i}
                  title="Problem Tag"
                  subtitle={problem}
                  onDelete={() => setConfirmModal({ isOpen: true, matchKey: "", matchValue: problem, displayLabel: `Problem Tag: ${problem}` })}
                />
              ))}
            </div>

          </div>
        )}
      </div>

      {/* --- MASTER CONFIRM MODAL --- */}
      {confirmModal?.isOpen && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4 animate-in fade-in">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-fuchsia-500 animate-in zoom-in-95">
            <XCircle className="w-16 h-16 text-fuchsia-500 mx-auto mb-3" />
            <h2 className="font-black text-xl mb-1 text-gray-900 dark:text-white">Confirm Deletion</h2>
            
            <p className="text-xs text-gray-500 font-bold mb-4 leading-relaxed">
              You are about to permanently remove:
            </p>
            
            <div className="bg-fuchsia-50 dark:bg-fuchsia-900/20 text-fuchsia-700 dark:text-fuchsia-300 font-black p-3 rounded-xl text-sm mb-6 border border-fuchsia-100 dark:border-fuchsia-900/50">
               {confirmModal.displayLabel}
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={() => setConfirmModal(null)} 
                disabled={isDeleting} 
                className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500 active:scale-95 transition-transform"
              >
                Cancel
              </button>
              <button 
                onClick={executeDelete} 
                disabled={isDeleting} 
                className="flex-1 py-3.5 bg-fuchsia-600 hover:bg-fuchsia-700 text-white font-black text-sm rounded-xl flex justify-center items-center shadow-md active:scale-95 transition-transform"
              >
                {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : "DELETE"}
              </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// --- Small Helper Components for the UI ---

function TabButton({ active, onClick, icon, label, count }: any) {
  return (
    <button 
      onClick={onClick}
      className={`flex-1 min-w-[70px] flex flex-col items-center justify-center gap-1 py-2 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${active ? "bg-white dark:bg-gray-900 text-fuchsia-600 shadow-sm" : "text-gray-500"}`}
    >
      <div className="flex items-center gap-1">
        {icon}
        {count !== undefined && <span className="opacity-60">({count})</span>}
      </div>
      {label}
    </button>
  );
}

function ListItem({ title, subtitle, onDelete }: { title: string, subtitle: string, onDelete: () => void }) {
  return (
    <div className="w-full text-left p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 flex items-center justify-between shadow-sm">
      <div className="min-w-0 pr-4">
        <p className="font-black text-gray-900 dark:text-white text-sm truncate">{title}</p>
        <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate uppercase tracking-widest">{subtitle}</p>
      </div>
      <button 
        onClick={onDelete} 
        className="p-3 bg-red-50 hover:bg-red-100 dark:bg-red-900/20 dark:hover:bg-red-900/40 text-red-600 dark:text-red-400 rounded-xl transition-colors active:scale-90 shrink-0"
      >
        <Trash2 className="w-4 h-4" />
      </button>
    </div>
  );
}