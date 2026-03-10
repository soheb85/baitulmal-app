/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { submitDailyChallan } from "@/app/actions/admin/collectionActions";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Save, Building2, BookOpen, HeartHandshake, 
  Loader2, AlertOctagon, CheckCircle2, CalendarDays,
  Hash, ListOrdered, Calculator, Plus, Trash2, RotateCcw, Wallet, Landmark
} from "lucide-react";

type EntryMode = "SUMMARY" | "RECEIPT_WISE";

export default function SubmitCollectionPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/collections");
  
  const [loading, setLoading] = useState(false);
  const [activeTab, setActiveTab] = useState<EntryMode>("SUMMARY");
  const [message, setMessage] = useState<{ type: "success"|"error", text: string } | null>(null);

  // --- HELPER: GET CURRENT DATE IN IST (YYYY-MM-DD) ---
  const getISTDateString = () => {
    const now = new Date();
    // Add 5 hours and 30 minutes to get India Time
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istDate = new Date(now.getTime() + istOffset);
    return istDate.toISOString().split('T')[0];
  };

  const initialSummaryState = {
    collectionDate: getISTDateString(), // Correctly shows IST today
    baitulmalReceiptBookNumber: "", baitulmalFrom: "", baitulmalTo: "", baitulmalCash: "", baitulmalOnline: "",
    madarsaReceiptBookNumber: "", madarsaFrom: "", madarsaTo: "", madarsaCash: "", madarsaOnline: "",
    fitraCash: "", fitraOnline: "",
    notes: ""
  };

  const [summaryData, setSummaryData] = useState(initialSummaryState);
  const [receiptList, setReceiptList] = useState<any[]>([]);
  const [newReceipt, setNewReceipt] = useState({
    receiptBookNumber: "", receiptNumber: "", fundCategory: "BAITULMAL", paymentMode: "CASH", amount: "", donorName: ""
  });

  // --- HELPERS TO CLEAR DATA ---
  const resetFullForm = () => {
    if (window.confirm("Are you sure you want to clear the entire form?")) {
      setSummaryData(initialSummaryState);
      setReceiptList([]);
    }
  };

  const clearSection = (section: 'bait' | 'mad' | 'fitra') => {
    if (section === 'bait') {
      setSummaryData(prev => ({ ...prev, baitulmalReceiptBookNumber: "", baitulmalFrom: "", baitulmalTo: "", baitulmalCash: "", baitulmalOnline: "" }));
    } else if (section === 'mad') {
      setSummaryData(prev => ({ ...prev, madarsaReceiptBookNumber: "", madarsaFrom: "", madarsaTo: "", madarsaCash: "", madarsaOnline: "" }));
    } else {
      setSummaryData(prev => ({ ...prev, fitraCash: "", fitraOnline: "" }));
    }
  };

  // --- MATH ---
  const totals = useMemo(() => {
    if (activeTab === "SUMMARY") {
      const bC = Number(summaryData.baitulmalCash) || 0;
      const bO = Number(summaryData.baitulmalOnline) || 0;
      const mC = Number(summaryData.madarsaCash) || 0;
      const mO = Number(summaryData.madarsaOnline) || 0;
      const fC = Number(summaryData.fitraCash) || 0;
      const fO = Number(summaryData.fitraOnline) || 0;
      return { cash: bC + mC + fC, online: bO + mO + fO, total: bC + bO + mC + mO + fC + fO, bC, bO, mC, mO, fC, fO };
    } else {
      return receiptList.reduce((acc, r) => {
        const amt = Number(r.amount) || 0;
        if (r.paymentMode === "CASH") acc.cash += amt; else acc.online += amt;
        if (r.fundCategory === "BAITULMAL") { if (r.paymentMode === "CASH") acc.bC += amt; else acc.bO += amt; }
        else if (r.fundCategory === "MADARSA") { if (r.paymentMode === "CASH") acc.mC += amt; else acc.mO += amt; }
        else { if (r.paymentMode === "CASH") acc.fC += amt; else acc.fO += amt; }
        acc.total += amt; return acc;
      }, { cash: 0, online: 0, total: 0, bC: 0, bO: 0, mC: 0, mO: 0, fC: 0, fO: 0 });
    }
  }, [activeTab, summaryData, receiptList]);

  const addReceiptToList = () => {
    if (!newReceipt.receiptNumber || !newReceipt.amount) return alert("Fill receipt details");
    setReceiptList([...receiptList, { ...newReceipt, id: Date.now() }]);
    setNewReceipt({ ...newReceipt, receiptNumber: "", amount: "", donorName: "" }); 
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (totals.total <= 0) return alert("Total collection amount cannot be zero.");

    const confirmMsg = `Submit ₹${totals.total.toLocaleString()} for approval?\n\n` + 
                       `Cash: ₹${totals.cash.toLocaleString()}\n` + 
                       `Online: ₹${totals.online.toLocaleString()}`;

    if (!window.confirm(confirmMsg)) return;
    setLoading(true);

    const payload = {
      ...summaryData, 
      baitulmalCash: totals.bC,
      baitulmalOnline: totals.bO,
      madarsaCash: totals.mC,
      madarsaOnline: totals.mO,
      fitraCash: totals.fC,
      fitraOnline: totals.fO,
      receiptBreakdown: activeTab === "RECEIPT_WISE" ? receiptList : []
    };

    try {
      const res = await submitDailyChallan(payload);
      if (res.success) {
        setMessage({ type: "success", text: res.message });
        setTimeout(() => handleBack(), 2000);
      } else {
        setMessage({ type: "error", text: res.message });
        setLoading(false);
      }
    } catch (error: any) {
      setMessage({ type: "error", text: "A connection error occurred." });
      setLoading(false);
    }
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-[#0B1120] relative font-outfit text-gray-900 dark:text-white">
      <div className="w-full h-full overflow-y-auto px-5 pt-8 pb-40 custom-scrollbar">
        
        {/* Header Block */}
        <div className="flex items-center justify-between mb-6 bg-white dark:bg-[#151D2C] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => handleBack()} className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-2xl active:scale-90 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
               <h1 className="text-lg font-black uppercase tracking-tight">Create Challan</h1>
               <p className="text-[9px] font-bold text-amber-600 uppercase tracking-widest">New Submission</p>
            </div>
          </div>
          <button onClick={resetFullForm} className="flex items-center gap-1.5 px-3 py-2 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 text-[10px] font-black rounded-xl border border-rose-100 dark:border-rose-500/20 active:scale-95 transition-all">
            <RotateCcw className="w-3 h-3" /> RESET
          </button>
        </div>

        {/* Tab Selection */}
        <div className="flex bg-gray-200 dark:bg-black/40 p-1.5 rounded-2xl mb-6 border border-gray-100 dark:border-white/5">
          <button 
            onClick={() => setActiveTab("SUMMARY")} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "SUMMARY" ? "bg-white dark:bg-white text-amber-600 dark:text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
          >
            <Calculator className="w-4 h-4" /> Summary
          </button>
          <button 
            onClick={() => setActiveTab("RECEIPT_WISE")} 
            className={`flex-1 flex items-center justify-center gap-2 py-3 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${activeTab === "RECEIPT_WISE" ? "bg-white dark:bg-white text-amber-600 dark:text-gray-900 shadow-sm" : "text-gray-500 dark:text-gray-400"}`}
          >
            <ListOrdered className="w-4 h-4" /> Receipts
          </button>
        </div>

        <div className="space-y-5">
          {message && (
            <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in shadow-sm ${message.type === 'success' ? 'bg-emerald-50 border-emerald-200 text-emerald-800 dark:bg-emerald-900/20 dark:border-emerald-800/30 dark:text-emerald-400' : 'bg-rose-50 border-rose-200 text-rose-800 dark:bg-rose-900/20 dark:border-rose-800/30 dark:text-rose-400'}`}>
              {message.type === 'success' ? <CheckCircle2 className="w-5 h-5 shrink-0" /> : <AlertOctagon className="w-5 h-5 shrink-0" />}
              <span className="text-xs font-black">{message.text}</span>
            </div>
          )}

          {/* Date Picker */}
          <div className="bg-white dark:bg-[#151D2C] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm">
            <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3"><CalendarDays className="w-4 h-4 text-amber-500" /> Collection Date</label>
            <input 
              type="date" 
              required 
              value={summaryData.collectionDate} 
              onChange={e => setSummaryData({...summaryData, collectionDate: e.target.value})} 
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black/20 font-black text-gray-900 dark:text-white outline-none border border-gray-200 dark:border-white/5 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10 transition-all" 
            />
          </div>

          {activeTab === "SUMMARY" && (
            <div className="animate-in slide-in-from-left-4 space-y-5">
              <SummarySection icon={<Building2 className="w-5 h-5" />} title="Baitulmal Fund" color="emerald" bookVal={summaryData.baitulmalReceiptBookNumber} onBookChange={(v: string) => setSummaryData({...summaryData, baitulmalReceiptBookNumber: v})} fromVal={summaryData.baitulmalFrom} onFromChange={(v: string) => setSummaryData({...summaryData, baitulmalFrom: v})} toVal={summaryData.baitulmalTo} onToChange={(v: string) => setSummaryData({...summaryData, baitulmalTo: v})} cashVal={summaryData.baitulmalCash} onCashChange={(v: string) => setSummaryData({...summaryData, baitulmalCash: v})} onlineVal={summaryData.baitulmalOnline} onOnlineChange={(v: string) => setSummaryData({...summaryData, baitulmalOnline: v})} onClear={() => clearSection('bait')} />
              <SummarySection icon={<BookOpen className="w-5 h-5" />} title="Madarsa Fund" color="blue" bookVal={summaryData.madarsaReceiptBookNumber} onBookChange={(v: string) => setSummaryData({...summaryData, madarsaReceiptBookNumber: v})} fromVal={summaryData.madarsaFrom} onFromChange={(v: string) => setSummaryData({...summaryData, madarsaFrom: v})} toVal={summaryData.madarsaTo} onToChange={(v: string) => setSummaryData({...summaryData, madarsaTo: v})} cashVal={summaryData.madarsaCash} onCashChange={(v: string) => setSummaryData({...summaryData, madarsaCash: v})} onlineVal={summaryData.madarsaOnline} onOnlineChange={(v: string) => setSummaryData({...summaryData, madarsaOnline: v})} onClear={() => clearSection('mad')} />
              
              <section className="bg-white dark:bg-[#151D2C] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm relative">
                 <button onClick={() => clearSection('fitra')} className="absolute top-5 right-5 p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 hover:text-rose-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
                 <div className="flex items-center gap-2 mb-4">
                    <div className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-500/10 text-purple-600 dark:text-purple-400">
                      <HeartHandshake className="w-5 h-5" />
                    </div>
                    <h3 className="text-sm font-black uppercase tracking-tight">Fitra Tokens</h3>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <InputField label="Cash" icon={<Wallet className="w-3 h-3"/>} type="number" value={summaryData.fitraCash} onChange={(v: string) => setSummaryData({...summaryData, fitraCash: v})} />
                   <InputField label="Online" icon={<Landmark className="w-3 h-3"/>} type="number" value={summaryData.fitraOnline} onChange={(v: string) => setSummaryData({...summaryData, fitraOnline: v})} />
                 </div>
              </section>
            </div>
          )}

          {activeTab === "RECEIPT_WISE" && (
            <div className="animate-in slide-in-from-right-4 space-y-5">
               <div className="bg-amber-50 dark:bg-[#151D2C] p-5 rounded-[2rem] border border-amber-100 dark:border-amber-500/20 space-y-4">
                 <div className="flex items-center gap-2 mb-2">
                    <div className="p-2 bg-amber-100 dark:bg-amber-500/20 rounded-xl text-amber-600 dark:text-amber-500"><Plus className="w-4 h-4" /></div>
                    <h3 className="font-black text-amber-900 dark:text-white text-sm uppercase">Add Receipt</h3>
                 </div>
                 
                 <div className="grid grid-cols-2 gap-3">
                   <InputField label="Book #" placeholder="BK-01" value={newReceipt.receiptBookNumber} onChange={(v: string) => setNewReceipt({...newReceipt, receiptBookNumber: v})} />
                   <InputField label="Receipt #" placeholder="101" value={newReceipt.receiptNumber} onChange={(v: string) => setNewReceipt({...newReceipt, receiptNumber: v})} />
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Fund Type</label>
                     <select value={newReceipt.fundCategory} onChange={e => setNewReceipt({...newReceipt, fundCategory: e.target.value})} className="w-full p-3.5 rounded-2xl bg-white dark:bg-black/40 text-xs font-black border border-gray-100 dark:border-white/5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20">
                       <option value="BAITULMAL">Baitulmal</option>
                       <option value="MADARSA">Madarsa</option>
                       <option value="FITRA">Fitra Token</option>
                     </select>
                   </div>
                   <div className="space-y-1.5">
                     <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1">Mode</label>
                     <select value={newReceipt.paymentMode} onChange={e => setNewReceipt({...newReceipt, paymentMode: e.target.value})} className="w-full p-3.5 rounded-2xl bg-white dark:bg-black/40 text-xs font-black border border-gray-100 dark:border-white/5 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20">
                        <option value="CASH">Cash</option>
                        <option value="ONLINE">Online</option>
                     </select>
                   </div>
                 </div>
                 <div className="grid grid-cols-2 gap-3">
                   <InputField label="Amount" type="number" placeholder="₹" value={newReceipt.amount} onChange={(v: string) => setNewReceipt({...newReceipt, amount: v})} />
                   <InputField label="Donor Name" placeholder="Optional" value={newReceipt.donorName} onChange={(v: string) => setNewReceipt({...newReceipt, donorName: v})} />
                 </div>
                 <button onClick={addReceiptToList} className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black text-[11px] uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all shadow-md">
                   <Plus className="w-4 h-4" /> ADD TO LIST
                 </button>
               </div>

               <div className="space-y-3 pt-2">
                 <div className="flex justify-between items-center px-1">
                  <h4 className="text-[10px] font-black uppercase text-gray-400 tracking-widest">Entry List ({receiptList.length})</h4>
                  {receiptList.length > 0 && (
                     <button onClick={() => { if(confirm("Clear list?")) setReceiptList([]) }} className="text-[9px] font-black text-rose-500 uppercase flex items-center gap-1 bg-rose-50 dark:bg-rose-500/10 px-2 py-1 rounded-lg">
                        <RotateCcw className="w-3 h-3"/> Clear
                     </button>
                  )}
                 </div>

                 {receiptList.length === 0 && (
                    <div className="text-center py-10 bg-white dark:bg-[#151D2C] rounded-[2rem] border border-dashed border-gray-200 dark:border-white/10 shadow-sm">
                       <ListOrdered className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
                       <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest">No receipts added yet</p>
                    </div>
                 )}

                 {receiptList.map((r) => (
                   <div key={r.id} className="bg-white dark:bg-[#151D2C] p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 shadow-sm flex justify-between items-center animate-in slide-in-from-bottom-2">
                     <div className="flex items-center gap-3">
                       <div className={`w-10 h-10 rounded-xl flex items-center justify-center font-black text-xs ${r.fundCategory === 'BAITULMAL' ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-500/10 dark:text-emerald-400' : r.fundCategory === 'MADARSA' ? 'bg-blue-50 text-blue-600 dark:bg-blue-500/10 dark:text-blue-400' : 'bg-purple-50 text-purple-600 dark:bg-purple-500/10 dark:text-purple-400'}`}>
                          {r.fundCategory === 'FITRA' ? 'FT' : r.fundCategory[0]}
                       </div>
                       <div>
                          <p className="text-sm font-black">#{r.receiptNumber} <span className="text-[10px] text-gray-400 font-bold ml-1">({r.receiptBookNumber || 'No Bk'})</span></p>
                          <p className="text-[9px] font-bold text-gray-500 dark:text-gray-400 uppercase mt-0.5 tracking-wider">{r.fundCategory === 'FITRA' ? 'Fitra Token' : r.fundCategory} • {r.paymentMode}</p>
                       </div>
                     </div>
                     <div className="flex items-center gap-4">
                       <p className="text-sm font-black">₹{r.amount}</p>
                       <button onClick={() => setReceiptList(receiptList.filter(item => item.id !== r.id))} className="p-2 bg-rose-50 dark:bg-rose-500/10 text-rose-500 rounded-xl active:scale-90 transition-transform">
                          <Trash2 className="w-4 h-4" />
                       </button>
                     </div>
                   </div>
                 ))}
               </div>
            </div>
          )}

          <div className="bg-white dark:bg-[#151D2C] p-5 rounded-[2rem] border border-gray-100 dark:border-white/5 shadow-sm relative">
            <button onClick={() => setSummaryData(prev => ({...prev, notes: ""}))} className="absolute top-2 right-5 p-2 bg-gray-50 dark:bg-white/5 rounded-full text-gray-400 hover:text-rose-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
            <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3 block ml-1">Final Remarks</label>
            <textarea 
               rows={2} 
               value={summaryData.notes} 
               onChange={e => setSummaryData({...summaryData, notes: e.target.value})} 
               placeholder="Any notes for the approver..." 
               className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 outline-none font-bold text-xs focus:border-amber-500 transition-all resize-none" 
            />
          </div>
        </div>
      </div>

      {/* Fixed Bottom Submit Bar constrained to max-w-md */}
      <div className="fixed bottom-0 w-full max-w-md p-5 pb-6 bg-white/90 dark:bg-[#0B1120]/90 backdrop-blur-xl border-t border-gray-200 dark:border-white/10 z-40 sm:rounded-b-[2rem]">
        <div className="flex justify-between items-end mb-4 px-2">
          <div className="space-y-1">
            <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5"><Wallet className="w-3 h-3"/> Cash in Bag</p>
            <p className="text-2xl font-black text-emerald-600 dark:text-emerald-400">₹{totals.cash.toLocaleString()}</p>
          </div>
          <div className="text-right space-y-1">
            <p className="text-[9px] font-black text-blue-500 uppercase tracking-widest flex items-center justify-end gap-1"><Landmark className="w-3 h-3"/> Online: ₹{totals.online.toLocaleString()}</p>
            <p className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">Total: ₹{totals.total.toLocaleString()}</p>
          </div>
        </div>
        <button 
          onClick={handleSubmit} 
          disabled={loading || totals.total === 0} 
          className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl shadow-xl active:scale-[0.98] transition-transform flex items-center justify-center gap-2 disabled:opacity-50 text-xs uppercase tracking-widest"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Submit For Approval</>}
        </button>
      </div>
    </main>
  );
}

// --- HELPER COMPONENTS ---

function SummarySection({ icon, title, color, bookVal, onBookChange, fromVal, onFromChange, toVal, onToChange, cashVal, onCashChange, onlineVal, onOnlineChange, onClear }: any) {
  const colorMap: any = { 
    emerald: "border-emerald-100 dark:border-emerald-500/20 text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-500/10", 
    blue: "border-blue-100 dark:border-blue-500/20 text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-500/10" 
  };

  return (
    <section className={`bg-white dark:bg-[#151D2C] p-5 rounded-[2rem] border shadow-sm space-y-5 relative ${colorMap[color].split(' ').slice(0, 2).join(' ')}`}>
      <button onClick={onClear} className="absolute top-5 right-5 p-2 bg-white dark:bg-white/5 shadow-sm rounded-full text-gray-400 hover:text-rose-500 transition-colors">
        <RotateCcw className="w-4 h-4" />
      </button>
      
      <div className="flex items-center gap-3 mb-2">
        <div className={`p-2.5 rounded-xl ${colorMap[color].split(' ').slice(2).join(' ')}`}>{icon}</div>
        <h3 className="text-sm font-black uppercase tracking-tight">{title}</h3>
      </div>
      
      <div className="grid grid-cols-3 gap-2">
        <InputField label="Book #" icon={<Hash className="w-3 h-3"/>} placeholder="100" value={bookVal} onChange={onBookChange} />
        <InputField label="From #" placeholder="101" value={fromVal} onChange={onFromChange} />
        <InputField label="To #" placeholder="200" value={toVal} onChange={onToChange} />
      </div>

      <div className="grid grid-cols-2 gap-3 pt-2 border-t border-gray-100 dark:border-white/5">
        <InputField label="Cash Total" icon={<Wallet className="w-3 h-3"/>} type="number" placeholder="0" value={cashVal} onChange={onCashChange} />
        <InputField label="Online Total" icon={<Landmark className="w-3 h-3"/>} type="number" placeholder="0" value={onlineVal} onChange={onOnlineChange} />
      </div>
    </section>
  );
}

function InputField({ label, type = "text", placeholder, value, onChange, icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">
        {icon && icon} {label}
      </label>
      <input 
        type={type} 
        value={value} 
        onChange={e => onChange(e.target.value)} 
        placeholder={placeholder} 
        className="w-full p-3.5 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 text-xs font-black text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none focus:border-amber-500 focus:ring-2 focus:ring-amber-500/20 transition-all" 
      />
    </div>
  );
}