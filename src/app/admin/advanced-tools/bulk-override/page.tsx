/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getDistinctOptions, fetchTargets, executeBulkOverride } from "@/app/actions/admin/bulkOverrideAction";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Search, Edit3, CheckCircle2, Loader2, AlertTriangle, 
  X, ListChecks, Filter, Users, CalendarDays, CheckSquare
} from "lucide-react";

// --- STATIC FIELD GROUPS ---
const STATIC_GROUPS = [
  {
    title: "1. Personal Profile", color: "text-blue-600", bg: "bg-blue-50 dark:bg-blue-900/10",
    fields: [
      { label: "Full Name", key: "fullName", type: "text" },
      { label: "Mobile Number", key: "mobileNumber", type: "text" },
      { label: "Aadhaar Number", key: "aadharNumber", type: "text" },
      { label: "Gender", key: "gender", type: "select", options: ["FEMALE", "MALE"] },
      { label: "Marital Status", key: "husbandStatus", type: "select", options: ["ALIVE", "WIDOW", "ABANDONED", "DIVORCED", "DISABLED", "NOT_MARRIED"] },
    ]
  },
  {
    title: "2. Economic & Housing", color: "text-green-600", bg: "bg-green-50 dark:bg-green-900/10",
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
      { label: "Aadhaar Pincode", key: "aadharPincode", type: "text" },
    ]
  },
  {
    title: "3. Family Counts", color: "text-teal-600", bg: "bg-teal-50 dark:bg-teal-900/10",
    fields: [
      { label: "Sons Count", key: "sons", type: "number" },
      { label: "Daughters Count", key: "daughters", type: "number" },
      { label: "Other Dependents", key: "otherDependents", type: "number" },
      { label: "Earning Members Count", key: "earningMembersCount", type: "number" },
    ]
  },
  {
    title: "4. Admin & Settings", color: "text-red-600", bg: "bg-red-50 dark:bg-red-900/10",
    fields: [
      { label: "Account Status", key: "status", type: "select", options: ["ACTIVE", "BLACKLISTED", "ON_HOLD"] },
      { label: "Special Exception Case", key: "isException", type: "boolean" },
      { label: "Referenced By", key: "referencedBy", type: "text" },
      { label: "Rejection Reason", key: "rejectionReason", type: "text" },
      { label: "Rejection By", key: "rejectionBy", type: "text" },
      { label: "Admin Comments", key: "comments", type: "text" },
      { label: "Manual Register Date", key: "registerDateManual", type: "date" },
    ]
  },
  {
    title: "5. Verification Cycle", color: "text-purple-600", bg: "bg-purple-50 dark:bg-purple-900/10",
    fields: [
      { label: "Cycle Start Date", key: "verificationCycle.startDate", type: "date" },
      { label: "Cycle End Date", key: "verificationCycle.endDate", type: "date" },
      { label: "Is Fully Verified?", key: "verificationCycle.isFullyVerified", type: "boolean" },
    ]
  },
  {
    title: "6. Today's Queue Status", color: "text-orange-600", bg: "bg-orange-50 dark:bg-orange-900/10",
    fields: [
      { label: "Queue Status", key: "todayStatus.status", type: "select", options: ["CHECKED_IN", "COLLECTED", "null"] },
      { label: "Token Number", key: "todayStatus.tokenNumber", type: "number" },
      { label: "Queue Date (YYYY-MM-DD)", key: "todayStatus.queueDate", type: "text" },
      { label: "Queue Timestamp", key: "todayStatus.date", type: "date" },
      { label: "Queue Year", key: "todayStatus.year", type: "number" },
    ]
  }
];

// --- MASSIVELY EXPANDED FILTERS ---
const COMMON_FILTERS = [
  { label: "Area / Location", key: "area" },
  { label: "Current Pincode", key: "currentPincode" },
  { label: "Aadhaar Pincode", key: "aadharPincode" },
  { label: "Referenced By", key: "referencedBy" },
  { label: "Account Status", key: "status" },
  { label: "Gender", key: "gender" },
  { label: "Husband/Marital Status", key: "husbandStatus" },
  { label: "Housing Type", key: "housingType" },
  { label: "Queue Status Today", key: "todayStatus.status" },
  { label: "Distributed Year (Contains)", key: "distributedYears" }, // Finds people who collected in X year
  { label: "Is Exception Case", key: "isException", isBool: true },
  { label: "Is Main Earning", key: "isEarning", isBool: true },
  { label: "Is Fully Verified", key: "verificationCycle.isFullyVerified", isBool: true },
];

export default function BulkOverridePage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  // Filtering State
  const [filterField, setFilterField] = useState("area");
  const [filterValue, setFilterValue] = useState("");
  const [filterOptions, setFilterOptions] = useState<string[]>([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  
  // Results State
  const [targets, setTargets] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  
  // Selection State
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [selectAll, setSelectAll] = useState(false);

  // Update Config State
  const [isChoosingUpdate, setIsChoosingUpdate] = useState(false);
  const [updateConfig, setUpdateConfig] = useState<any>(null); 
  const [showConfirm, setShowConfirm] = useState(false);
  const [showSuccess, setShowSuccess] = useState<any>(null);
  const [isSaving, setIsSaving] = useState(false);

  // Load dynamic options when filter field changes
  useEffect(() => {
    async function loadOptions() {
      const selectedDef = COMMON_FILTERS.find(f => f.key === filterField);
      if (selectedDef?.isBool) {
        setFilterOptions(["true", "false"]);
        setFilterValue("");
        return;
      }
      
      setLoadingOptions(true);
      const res = await getDistinctOptions(filterField);
      if (res.success && Array.isArray(res.data)) {
        setFilterOptions(res.data as string[]);
      }
      setFilterValue("");
      setLoadingOptions(false);
    }
    loadOptions();
  }, [filterField]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSearching(true);
    
    let valToSearch: any = filterValue;
    if (filterValue === "true") valToSearch = true;
    if (filterValue === "false") valToSearch = false;
    if (filterField === "distributedYears" && filterValue) valToSearch = Number(filterValue); // Parse year string to int

    const res = await fetchTargets(filterField, valToSearch);
    if (res.success) {
      setTargets(res.data);
      setSelectAll(false);
      setSelectedIds(new Set());
    }
    setIsSearching(false);
  };

  const toggleSelection = (id: string) => {
    const newSet = new Set(selectedIds);
    if (newSet.has(id)) newSet.delete(id);
    else newSet.add(id);
    setSelectedIds(newSet);
    if (newSet.size < targets.length) setSelectAll(false);
  };

  const handleSelectAll = (checked: boolean) => {
    setSelectAll(checked);
    if (checked) {
      setSelectedIds(new Set(targets.map(t => t._id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const executeOverride = async () => {
    setIsSaving(true);
    
    let finalValue = updateConfig.newValue;
    if (finalValue === "null" || finalValue === "") finalValue = null;
    else if (updateConfig.type === "boolean") finalValue = finalValue === "true" || finalValue === true;
    else if (updateConfig.type === "number") finalValue = Number(finalValue);
    else if (updateConfig.type === "date" && finalValue) finalValue = new Date(finalValue);

    let fVal: any = filterValue;
    if (fVal === "true") fVal = true;
    if (fVal === "false") fVal = false;
    if (filterField === "distributedYears" && fVal) fVal = Number(fVal);

    const res = await executeBulkOverride(
      Array.from(selectedIds), 
      selectAll, 
      filterField, 
      fVal, 
      updateConfig.key, 
      finalValue
    );
    
    if (res.success) {
      setShowConfirm(false);
      setShowSuccess(res.count);
      setUpdateConfig(null);
      setIsChoosingUpdate(false);
    } else {
      alert("Error: " + res.message);
    }
    
    setIsSaving(false);
  };

  const getCalculatedEndDate = (dateStr: string) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return "";
    d.setFullYear(d.getFullYear() + 3);
    d.setDate(d.getDate() - 45); // Lunar adjustment preview
    return d.toISOString().split('T')[0];
  };

  if (isNavigating) return <NavigationLoader message="Exiting..." />;

  return (
    <main className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-950 relative font-outfit">
      
      <div className="w-full max-w-2xl mx-auto h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-3 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2 bg-gray-50 dark:bg-gray-800 rounded-xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-black text-indigo-600 flex items-center gap-2">
              <ListChecks className="w-4 h-4" /> Bulk Field Override
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Update Multiple Users Simultaneously</p>
          </div>
        </div>

        {/* STEP 1: Search / Filter */}
        <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6">
          <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2 mb-4">
            <Filter className="w-4 h-4 text-indigo-500" /> 1. Filter Database
          </h2>
          <form onSubmit={handleSearch} className="space-y-4">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Filter By Field</label>
                <select value={filterField} onChange={(e) => setFilterField(e.target.value)} className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500">
                  {COMMON_FILTERS.map(f => <option key={f.key} value={f.key}>{f.label}</option>)}
                </select>
              </div>
              <div>
                <label className="text-[10px] font-bold text-gray-500 uppercase tracking-widest ml-1 mb-1 block">Equals Value</label>
                <div className="relative">
                  <select disabled={loadingOptions} value={filterValue} onChange={(e) => setFilterValue(e.target.value)} className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none focus:ring-2 focus:ring-indigo-500 disabled:opacity-50">
                    <option value="">-- Select Value --</option>
                    {filterOptions.map((opt, i) => <option key={i} value={String(opt)}>{String(opt)}</option>)}
                  </select>
                  {loadingOptions && <Loader2 className="w-4 h-4 absolute right-3 top-3.5 animate-spin text-indigo-500" />}
                </div>
              </div>
            </div>
            <button type="submit" disabled={isSearching || !filterValue} className="w-full py-3.5 bg-indigo-50 dark:bg-indigo-900/20 text-indigo-600 font-black rounded-xl border border-indigo-100 dark:border-indigo-800/50 flex justify-center items-center gap-2 active:scale-95 transition-transform disabled:opacity-50">
              {isSearching ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Search className="w-4 h-4" /> Find Targets</>}
            </button>
          </form>
        </div>

        {/* STEP 2: Results & Selection */}
        {targets.length > 0 && (
          <div className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm animate-in fade-in">
            <div className="flex justify-between items-center mb-4 pb-4 border-b border-gray-100 dark:border-gray-800">
              <h2 className="text-xs font-black uppercase tracking-widest text-gray-400 flex items-center gap-2">
                <Users className="w-4 h-4 text-indigo-500" /> 2. Select Targets
              </h2>
              <span className="text-xs font-bold bg-indigo-100 dark:bg-indigo-900/50 text-indigo-700 dark:text-indigo-300 px-2 py-0.5 rounded-md">
                {targets.length} Found
              </span>
            </div>

            <label className="flex items-center gap-3 p-3 mb-4 bg-gray-50 dark:bg-gray-800 rounded-xl cursor-pointer border border-gray-200 dark:border-gray-700">
              <input type="checkbox" checked={selectAll} onChange={(e) => handleSelectAll(e.target.checked)} className="w-5 h-5 accent-indigo-600" />
              <span className="font-black text-sm text-gray-900 dark:text-white">Select All {targets.length} Records</span>
            </label>

            <div className="space-y-2 max-h-64 overflow-y-auto pr-2">
              {targets.map((user) => (
                <label key={user._id} className="flex items-center gap-3 p-3 bg-gray-50/50 dark:bg-gray-800/50 rounded-xl cursor-pointer border border-transparent hover:border-indigo-200 transition-colors">
                  <input type="checkbox" checked={selectedIds.has(user._id)} onChange={() => toggleSelection(user._id)} className="w-4 h-4 accent-indigo-600" />
                  <div className="min-w-0">
                    <p className="font-bold text-sm text-gray-900 dark:text-white truncate">{user.fullName}</p>
                    <p className="text-[10px] text-gray-500 font-bold truncate">{user.mobileNumber} | {user.area}</p>
                  </div>
                </label>
              ))}
            </div>

            {selectedIds.size > 0 && (
               <div className="mt-6 pt-4 border-t border-gray-100 dark:border-gray-800">
                 <button onClick={() => setIsChoosingUpdate(true)} className="w-full py-4 bg-indigo-600 text-white font-black rounded-xl shadow-lg shadow-indigo-200 dark:shadow-none active:scale-95 transition-transform flex items-center justify-center gap-2">
                   <CheckSquare className="w-5 h-5" /> Proceed with {selectedIds.size} Selected
                 </button>
               </div>
            )}
          </div>
        )}
      </div>

      {/* --- OVERLAY: CHOOSE FIELD TO UPDATE --- */}
      {isChoosingUpdate && !updateConfig && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-end sm:items-center justify-center p-4">
          <div className="bg-gray-50 dark:bg-gray-950 w-full max-w-lg h-[80vh] rounded-t-[2.5rem] sm:rounded-[2.5rem] shadow-2xl animate-in slide-in-from-bottom flex flex-col">
            <div className="p-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 rounded-t-[2.5rem] flex justify-between items-center">
              <div>
                <h3 className="font-black text-lg text-indigo-600">3. Select Field to Override</h3>
                <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest">Choose the value to replace</p>
              </div>
              <button onClick={() => setIsChoosingUpdate(false)} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90"><X className="w-5 h-5" /></button>
            </div>
            
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              {STATIC_GROUPS.map((group, idx) => (
                <div key={idx} className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-2xl overflow-hidden shadow-sm">
                  <div className={`px-4 py-2 ${group.bg} border-b border-gray-200 dark:border-gray-800`}>
                    <h3 className={`text-xs font-black uppercase tracking-widest ${group.color}`}>{group.title}</h3>
                  </div>
                  <div className="divide-y divide-gray-100 dark:divide-gray-800">
                    {group.fields.map((field) => (
                      <button key={field.key} onClick={() => setUpdateConfig({...field, newValue: ""})} className="w-full p-3 flex justify-between items-center hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors text-left group">
                        <div>
                          <p className="text-[10px] font-bold text-gray-500 uppercase tracking-wider">{field.label}</p>
                          <p className="text-[9px] text-gray-400 font-mono mt-0.5">{field.key}</p>
                        </div>
                        <Edit3 className="w-4 h-4 text-gray-300 group-hover:text-indigo-500" />
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* --- OVERLAY: SET NEW VALUE --- */}
      {updateConfig && !showConfirm && !showSuccess && (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-3xl p-5 w-full max-w-xs shadow-2xl animate-in zoom-in-95">
            <h3 className="font-black text-lg text-gray-900 dark:text-white leading-none">Enter New Value</h3>
            <p className="text-[10px] font-bold text-indigo-500 uppercase tracking-widest mt-1 mb-4 truncate">{updateConfig.label}</p>
            
            <div className="space-y-3 mb-5">
              <div>
                {updateConfig.type === "select" ? (
                  <select value={updateConfig.newValue} onChange={(e) => setUpdateConfig({...updateConfig, newValue: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 font-bold text-indigo-600 outline-none border border-gray-200 dark:border-gray-700 focus:border-indigo-500">
                    <option value="">-- Choose Option --</option>
                    {updateConfig.options.map((opt: string) => (<option key={opt} value={opt}>{opt}</option>))}
                  </select>
                ) : updateConfig.type === "boolean" ? (
                  <select value={String(updateConfig.newValue)} onChange={(e) => setUpdateConfig({...updateConfig, newValue: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 font-bold text-indigo-600 outline-none border border-gray-200 dark:border-gray-700 focus:border-indigo-500">
                    <option value="">-- Choose --</option>
                    <option value="true">True (Yes)</option>
                    <option value="false">False (No)</option>
                  </select>
                ) : (
                  <input type={updateConfig.type} value={updateConfig.newValue} onChange={(e) => setUpdateConfig({...updateConfig, newValue: e.target.value})} className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-800 font-bold text-indigo-600 outline-none border border-gray-200 dark:border-gray-700 focus:border-indigo-500" placeholder="Type here..." />
                )}
                
                {updateConfig.key === "verificationCycle.startDate" && updateConfig.newValue && (
                  <div className="mt-3 p-3 bg-purple-50 dark:bg-purple-900/20 rounded-xl border border-purple-200 dark:border-purple-800 flex items-center gap-2">
                    <CalendarDays className="w-5 h-5 text-purple-600 shrink-0" />
                    <div>
                      <p className="text-[9px] font-black uppercase text-purple-600 dark:text-purple-400 tracking-widest leading-none mb-1">System Auto-Set</p>
                      <p className="text-xs font-bold text-purple-800 dark:text-purple-300">End Date: {getCalculatedEndDate(updateConfig.newValue)}</p>
                    </div>
                  </div>
                )}
              </div>
            </div>

            <div className="flex gap-2">
              <button onClick={() => setUpdateConfig(null)} className="flex-1 py-3.5 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500">Cancel</button>
              <button onClick={() => setShowConfirm(true)} disabled={updateConfig.newValue === ""} className="flex-1 py-3.5 bg-indigo-600 text-white font-black text-sm rounded-xl shadow-md disabled:opacity-50">Preview</button>
            </div>
          </div>
        </div>
      )}

      {/* --- CONFIRM MODAL --- */}
      {showConfirm && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-indigo-500 animate-in zoom-in-95">
            <AlertTriangle className="w-12 h-12 text-indigo-500 mx-auto mb-3" />
            <h2 className="font-black text-lg mb-1 text-gray-900 dark:text-white">WARNING: Bulk Update</h2>
            <p className="text-xs text-gray-500 font-medium mb-5 leading-relaxed">
              You are about to change <strong className="text-indigo-600">{updateConfig?.label}</strong> to <strong className="text-indigo-600">{updateConfig?.newValue}</strong> for <strong className="text-red-500">{selectedIds.size} users</strong>. This cannot be undone.
            </p>
            <div className="flex gap-2">
              <button onClick={() => setShowConfirm(false)} disabled={isSaving} className="flex-1 py-3 bg-gray-100 dark:bg-gray-800 font-bold text-sm rounded-xl text-gray-500">Back</button>
              <button onClick={executeOverride} disabled={isSaving} className="flex-1 py-3 bg-red-600 text-white font-black text-sm rounded-xl flex justify-center items-center shadow-lg shadow-red-200 dark:shadow-none">
                {isSaving ? <Loader2 className="w-5 h-5 animate-spin" /> : "EXECUTE"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* --- SUCCESS MODAL --- */}
      {showSuccess !== null && (
        <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white dark:bg-gray-900 rounded-[2rem] p-6 w-full max-w-xs text-center shadow-2xl border-2 border-green-500 animate-in zoom-in-90">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto mb-3" />
            <h2 className="font-black text-2xl mb-1 text-gray-900 dark:text-white">{showSuccess} Records</h2>
            <p className="text-gray-500 text-xs font-bold uppercase tracking-widest mb-6">Successfully Updated</p>
            <button onClick={() => { setShowSuccess(null); setTargets([]); setFilterValue(""); setSelectedIds(new Set()); }} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black text-sm rounded-xl active:scale-95 shadow-md">
              Finish
            </button>
          </div>
        </div>
      )}
    </main>
  );
}