/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { searchForOverride, overrideField } from "@/app/actions/admin/overrideAction";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Search, UserCog, Edit3, 
  CheckCircle2, Loader2, AlertTriangle, X, ShieldAlert
} from "lucide-react";

// --- STATIC FIELD GROUPS ---
const STATIC_GROUPS = [
  {
    title: "1. Personal Profile",
    color: "text-blue-600",
    bg: "bg-blue-50 dark:bg-blue-900/10",
    fields: [
      { label: "Full Name", key: "fullName", type: "text" },
      { label: "Mobile Number", key: "mobileNumber", type: "text" },
      { label: "Aadhaar Number", key: "aadharNumber", type: "text" },
      { label: "Gender", key: "gender", type: "select", options: ["FEMALE", "MALE"] },
      { label: "Marital Status", key: "husbandStatus", type: "select", options: ["ALIVE", "WIDOW", "ABANDONED", "DIVORCED", "DISABLED", "NOT_MARRIED"] },
    ]
  },
  {
    title: "2. Economic & Housing",
    color: "text-green-600",
    bg: "bg-green-50 dark:bg-green-900/10",
    fields: [
      { label: "Is Main Earning?", key: "isEarning", type: "boolean" },
      { label: "Occupation", key: "occupation", type: "text" },
      { label: "Monthly Income", key: "monthlyIncome", type: "number" },
      { label: "Total Family Income", key: "totalFamilyIncome", type: "number" },
      { label: "Housing Type", key: "housingType", type: "select", options: ["OWN", "RENT"] },
      { label: "Rent Amount", key: "rentAmount", type: "number" },
      { label: "Current Address", key: "currentAddress", type: "text" },
      { label: "Area", key: "area", type: "text" },
      { label: "Current Pincode", key: "currentPincode", type: "text" },
    ]
  },
  {
    title: "3. Family Counts", // <--- ADDED THIS BACK IN!
    color: "text-teal-600",
    bg: "bg-teal-50 dark:bg-teal-900/10",
    fields: [
      { label: "Sons Count", key: "sons", type: "number" },
      { label: "Daughters Count", key: "daughters", type: "number" },
      { label: "Other Dependents", key: "otherDependents", type: "number" },
      { label: "Earning Members Count", key: "earningMembersCount", type: "number" },
    ]
  },
  {
    title: "4. Admin & Settings",
    color: "text-red-600",
    bg: "bg-red-50 dark:bg-red-900/10",
    fields: [
      { label: "Account Status", key: "status", type: "select", options: ["ACTIVE", "BLACKLISTED", "ON_HOLD"] },
      { label: "Special Exception Case", key: "isException", type: "boolean" },
      { label: "Rejection Reason", key: "rejectionReason", type: "text" },
      { label: "Admin Comments", key: "comments", type: "text" },
      { label: "Manual Register Date", key: "registerDateManual", type: "date" },
    ]
  },
  {
    title: "5. Verification Cycle",
    color: "text-purple-600",
    bg: "bg-purple-50 dark:bg-purple-900/10",
    fields: [
      { label: "Cycle Start Date", key: "verificationCycle.startDate", type: "date" },
      { label: "Cycle End Date", key: "verificationCycle.endDate", type: "date" },
      { label: "Is Fully Verified?", key: "verificationCycle.isFullyVerified", type: "boolean" },
    ]
  },
  {
    title: "6. Today's Queue Status",
    color: "text-orange-600",
    bg: "bg-orange-50 dark:bg-orange-900/10",
    fields: [
      { label: "Queue Status", key: "todayStatus.status", type: "select", options: ["CHECKED_IN", "COLLECTED", "null"] },
      { label: "Token Number", key: "todayStatus.tokenNumber", type: "number" },
      { label: "Queue Date (YYYY-MM-DD)", key: "todayStatus.queueDate", type: "text" },
      { label: "Queue Timestamp", key: "todayStatus.date", type: "date" },
      { label: "Queue Year", key: "todayStatus.year", type: "number" },
    ]
  }
];

// Helper to safely read nested object and array properties
const getNestedValue = (obj: any, path: string) => {
  return path.split('.').reduce((acc, part) => acc && acc[part] !== undefined ? acc[part] : undefined, obj);
};

export default function DirectOverridePage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  const [searchQuery, setSearchQuery] = useState("");
  const [isSearching, setIsSearching] = useState(false);
  const [searchResults, setSearchResults] = useState<any[]>([]);
  
  const [selectedUser, setSelectedUser] = useState<any>(null);
  
  const [editConfig, setEditConfig] = useState<any>(null); 
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setSelectedUser(null);
    const results = await searchForOverride(searchQuery);
    setSearchResults(results);
    setIsSearching(false);
  };

  const openEditModal = (fieldConfig: any) => {
    let currentValue = getNestedValue(selectedUser, fieldConfig.key);
    
    if (fieldConfig.type === "date" && currentValue) {
      currentValue = new Date(currentValue).toISOString().split('T')[0];
    }

    setEditConfig({
      ...fieldConfig,
      oldValue: currentValue,
      newValue: currentValue === null || currentValue === undefined ? "" : currentValue
    });
  };

  const executeOverride = async () => {
    setIsSaving(true);
    
    let finalValue = editConfig.newValue;
    
    if (finalValue === "null" || finalValue === "") finalValue = null;
    else if (editConfig.type === "boolean") finalValue = finalValue === "true" || finalValue === true;
    else if (editConfig.type === "number") finalValue = Number(finalValue);
    else if (editConfig.type === "date" && finalValue) finalValue = new Date(finalValue);

    // Call the server action. It ONLY updates the exact fieldPath sent.
    const res = await overrideField(selectedUser._id, editConfig.key, finalValue);
    
    if (res.success) {
      setSelectedUser(res.data);
      setShowConfirm(false);
      setShowSuccess(true);
      setEditConfig(null);
    } else {
      alert("Error overriding field: " + res.message);
    }
    
    setIsSaving(false);
  };

  if (isNavigating) return <NavigationLoader message="Exiting..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-white dark:bg-gray-950 relative">
      
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-gray-50 dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
          <button onClick={() => handleBack()} className="p-2 bg-white dark:bg-gray-800 rounded-xl active:scale-90 transition shadow-sm">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-black text-orange-600 flex items-center gap-2">
              <UserCog className="w-4 h-4" /> Field Override
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Surgical Database Edits</p>
          </div>
        </div>

        {/* Search Box */}
        <form onSubmit={handleSearch} className="relative mb-6">
          <input 
            type="text" 
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search Name, Mobile, Aadhaar..."
            className="w-full p-3 pl-4 pr-12 rounded-xl bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-800 text-sm font-bold outline-none focus:border-orange-500"
          />
          <button type="submit" disabled={isSearching} className="absolute right-1 top-1 bottom-1 px-3 bg-orange-100 dark:bg-orange-900/30 text-orange-600 rounded-lg flex items-center justify-center">
            {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <Search className="w-4 h-4" />}
          </button>
        </form>

        {/* Search Results */}
        {!selectedUser && searchResults.length > 0 && (
          <div className="space-y-2 animate-in fade-in">
            {searchResults.map((user) => (
              <button 
                key={user._id}
                onClick={() => setSelectedUser(user)}
                className="w-full text-left bg-gray-50 dark:bg-gray-900 p-3 rounded-xl border border-gray-200 dark:border-gray-800 flex items-center justify-between active:scale-95 transition-transform"
              >
                <div className="min-w-0 pr-2">
                  <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{user.fullName}</p>
                  <p className="text-[10px] text-gray-500 font-bold mt-0.5 truncate">{user.mobileNumber} | {user.aadharNumber}</p>
                </div>
                <Edit3 className="w-4 h-4 text-orange-500 shrink-0" />
              </button>
            ))}
          </div>
        )}

        {/* --- SELECTED USER DATA CARDS --- */}
        {selectedUser && (
          <div className="space-y-4 animate-in slide-in-from-right-4">
            
            {/* Target Banner */}
            <div className="bg-orange-500 text-white p-4 rounded-2xl flex justify-between items-center shadow-md">
              <div className="min-w-0">
                <p className="text-[9px] font-black uppercase tracking-widest text-orange-200">Target Profile</p>
                <h2 className="text-lg font-black truncate">{selectedUser.fullName}</h2>
              </div>
              <button onClick={() => setSelectedUser(null)} className="p-1.5 bg-white/20 rounded-lg shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Static Groups Map */}
            {STATIC_GROUPS.map((group, idx) => (
              <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className={`px-4 py-2 ${group.bg} border-b border-gray-200 dark:border-gray-800`}>
                  <h3 className={`text-xs font-black uppercase tracking-widest ${group.color}`}>{group.title}</h3>
                </div>
                <div className="divide-y divide-gray-100 dark:divide-gray-800">
                  {group.fields.map((field) => {
                    const val = getNestedValue(selectedUser, field.key);
                    return (
                      <div key={field.key} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                        <div className="min-w-0 flex-1 pr-3">
                          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</p>
                          <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                            {val === null || val === undefined ? <span className="text-gray-300 italic">null</span> : String(val)}
                          </p>
                          <p className="text-[9px] text-orange-400/80 font-mono mt-0.5">{field.key}</p>
                        </div>
                        <button onClick={() => openEditModal(field)} className="p-2 bg-gray-100 dark:bg-gray-800 text-orange-600 rounded-lg shrink-0">
                          <Edit3 className="w-3.5 h-3.5" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}

            {/* --- DYNAMIC GROUP: FAMILY MEMBERS --- */}
            {/* This is handled dynamically because the array length changes per user! */}
            {selectedUser.familyMembersDetail?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-teal-50 dark:bg-teal-900/10 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-xs font-black uppercase tracking-widest text-teal-600">7. Family Members (Array)</h3>
                </div>
                {selectedUser.familyMembersDetail.map((member: any, mIdx: number) => {
                  
                  const memberFields = [
                    { label: "Name", key: "name", type: "text" },
                    { label: "Relation", key: "relation", type: "select", options: ["SON", "DAUGHTER", "HUSBAND", "WIFE", "FATHER", "MOTHER"] },
                    { label: "Age", key: "age", type: "text" },
                    { label: "Marital Status", key: "maritalStatus", type: "select", options: ["SINGLE", "MARRIED", "DIVORCED"] },
                    { label: "Lives With Family?", key: "livesWithFamily", type: "boolean" },
                    { label: "Is Earning?", key: "isEarning", type: "boolean" },
                    { label: "Occupation", key: "occupation", type: "text" },
                    { label: "Monthly Income", key: "monthlyIncome", type: "text" },
                    { label: "Is Studying?", key: "isStudying", type: "boolean" },
                    { label: "School Name", key: "schoolName", type: "text" },
                    { label: "Class Standard", key: "classStandard", type: "text" },
                    { label: "Member Notes", key: "memberNotes", type: "text" },
                  ];

                  return (
                    <div key={mIdx} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                      <div className="bg-gray-50/80 dark:bg-gray-900/80 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-teal-500 uppercase">Member #{mIdx + 1} ({member.name})</p>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {memberFields.map((field) => {
                          // Crucial: This builds the exact MongoDB path for the array item! 
                          // Example: familyMembersDetail.0.occupation
                          const dbKey = `familyMembersDetail.${mIdx}.${field.key}`;
                          const val = getNestedValue(selectedUser, dbKey);
                          
                          return (
                            <div key={dbKey} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                  {val === null || val === undefined ? <span className="text-gray-300 italic">null</span> : String(val)}
                                </p>
                                <p className="text-[9px] text-teal-400/80 font-mono mt-0.5">{dbKey}</p>
                              </div>
                              <button onClick={() => openEditModal({ ...field, label: `M${mIdx+1} ${field.label}`, key: dbKey })} className="p-2 bg-gray-100 dark:bg-gray-800 text-orange-600 rounded-lg shrink-0">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

            {/* --- DYNAMIC GROUP: DISTRIBUTION HISTORY --- */}
            {selectedUser.distributionHistory?.length > 0 && (
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                <div className="px-4 py-2 bg-indigo-50 dark:bg-indigo-900/10 border-b border-gray-200 dark:border-gray-800">
                  <h3 className="text-xs font-black uppercase tracking-widest text-indigo-600">8. History Logs (Array)</h3>
                </div>
                {selectedUser.distributionHistory.map((hist: any, hIdx: number) => {
                  const histFields = [
                    { label: "Year", key: "year", type: "number" },
                    { label: "Status", key: "status", type: "text" },
                    { label: "Token Number", key: "tokenNumber", type: "number" },
                    { label: "Date", key: "date", type: "date" },
                  ];

                  return (
                    <div key={hIdx} className="border-b border-gray-200 dark:border-gray-800 last:border-0">
                      <div className="bg-gray-50/80 dark:bg-gray-900/80 px-3 py-2 border-b border-gray-100 dark:border-gray-800">
                        <p className="text-[10px] font-black text-indigo-500 uppercase">Record #{hIdx + 1} ({hist.year})</p>
                      </div>
                      <div className="divide-y divide-gray-100 dark:divide-gray-800">
                        {histFields.map((field) => {
                          const dbKey = `distributionHistory.${hIdx}.${field.key}`;
                          const val = getNestedValue(selectedUser, dbKey);
                          
                          return (
                            <div key={dbKey} className="p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors">
                              <div className="min-w-0 flex-1 pr-3">
                                <p className="text-[9px] font-bold text-gray-400 uppercase tracking-wider">{field.label}</p>
                                <p className="text-sm font-bold text-gray-900 dark:text-white truncate">
                                  {field.type === "date" && val ? new Date(val).toLocaleDateString() : String(val ?? "null")}
                                </p>
                                <p className="text-[9px] text-indigo-400/80 font-mono mt-0.5">{dbKey}</p>
                              </div>
                              <button onClick={() => openEditModal({ ...field, label: `H${hIdx+1} ${field.label}`, key: dbKey })} className="p-2 bg-gray-100 dark:bg-gray-800 text-orange-600 rounded-lg shrink-0">
                                <Edit3 className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}

          </div>
        )}
      </div>

      {/* --- EDIT MODAL (Overlays on top) --- */}
      {editConfig && !showConfirm && !showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-lg text-gray-900 dark:text-white leading-none">Override Field</h3>
            <p className="text-[10px] font-bold text-orange-500 uppercase tracking-widest mt-1 mb-4 truncate">{editConfig.label}</p>
            
            <div className="space-y-3 mb-5">
              <div className="bg-gray-50 dark:bg-gray-800 p-2.5 rounded-xl border border-gray-100 dark:border-gray-700">
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-0.5">Current</p>
                <p className="font-mono text-xs opacity-60 line-through truncate">
                  {editConfig.oldValue === null ? "null" : String(editConfig.oldValue)}
                </p>
              </div>

              <div>
                <p className="text-[9px] text-gray-400 font-bold uppercase tracking-widest mb-1 ml-1">New Value</p>
                {editConfig.type === "select" ? (
                  <select value={editConfig.newValue} onChange={(e) => setEditConfig({...editConfig, newValue: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 font-mono text-sm font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-500">
                    {editConfig.options.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                ) : editConfig.type === "boolean" ? (
                  <select value={String(editConfig.newValue)} onChange={(e) => setEditConfig({...editConfig, newValue: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 font-mono text-sm font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-500">
                    <option value="true">True</option>
                    <option value="false">False</option>
                  </select>
                ) : (
                  <input type={editConfig.type} value={editConfig.newValue} onChange={(e) => setEditConfig({...editConfig, newValue: e.target.value})} className="w-full p-3 rounded-xl bg-gray-50 dark:bg-gray-800 font-mono text-sm font-bold text-orange-600 outline-none focus:ring-2 focus:ring-orange-500" placeholder="New value..." />
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setEditConfig(null)} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500">Cancel</button>
              <button onClick={() => setShowConfirm(true)} className="flex-1 py-3 bg-orange-600 text-white font-black text-sm rounded-xl shadow-md">Apply</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM MODAL --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-orange-500 animate-in zoom-in-95">
            <AlertTriangle className="w-12 h-12 text-orange-500 mx-auto mb-3" />
            <h2 className="font-black text-lg mb-1 text-gray-900 dark:text-white">Confirm Override</h2>
            <p className="text-[11px] text-gray-500 font-medium mb-5 leading-relaxed">
              Changing <strong className="text-gray-900 dark:text-white">{editConfig?.label}</strong>. This bypasses normal checks.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} disabled={isSaving} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500">Back</button>
              <button onClick={executeOverride} disabled={isSaving} className="flex-1 py-3 bg-orange-600 text-white font-black text-sm rounded-xl flex justify-center items-center">
                {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Confirm"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS MODAL --- */}
      {showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-green-500 animate-in zoom-in-90">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <h2 className="font-black text-xl mb-1 text-gray-900 dark:text-white">Updated</h2>
            <p className="text-gray-500 text-xs font-medium mb-6">Database has been surgically updated.</p>
            <button onClick={() => setShowSuccess(false)} className="w-full py-3.5 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm rounded-xl active:scale-95 shadow-md">
              Close
            </button>
          </div>
        </div>
      )}
    </main>
  );
}