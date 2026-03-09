/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useMemo } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { submitDailyChallan } from "@/app/actions/admin/collectionActions";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Save, Building2, BookOpen, HeartHandshake, 
  Loader2, AlertOctagon, CheckCircle2, CalendarDays,
  Hash, ListOrdered, Calculator, Plus, Trash2, RotateCcw
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
    collectionDate: getISTDateString(), // Correctly shows 10/03/2026 now
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
    <main className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit pb-40 text-gray-900 dark:text-white">
      <header className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 py-6 sticky top-0 z-30 shadow-sm">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition"><ArrowLeft className="w-5 h-5" /></button>
            <h1 className="text-xl font-black">Create Challan</h1>
          </div>
          <button onClick={resetFullForm} className="flex items-center gap-1.5 px-3 py-1.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 text-[10px] font-black rounded-lg border border-red-100 dark:border-red-900/30 active:scale-95 transition-all">
            <RotateCcw className="w-3.5 h-3.5" /> RESET ALL
          </button>
        </div>

        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl shadow-inner">
          <button onClick={() => setActiveTab("SUMMARY")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "SUMMARY" ? "bg-white dark:bg-gray-900 text-amber-600 shadow-sm" : "text-gray-400"}`}><Calculator className="w-4 h-4" /> Summary Entry</button>
          <button onClick={() => setActiveTab("RECEIPT_WISE")} className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-wider transition-all ${activeTab === "RECEIPT_WISE" ? "bg-white dark:bg-gray-900 text-amber-600 shadow-sm" : "text-gray-400"}`}><ListOrdered className="w-4 h-4" /> Receipt Wise</button>
        </div>
      </header>

      <div className="p-6 max-w-lg mx-auto space-y-6">
        {message && <div className={`p-4 rounded-2xl border flex items-center gap-3 animate-in fade-in ${message.type === 'success' ? 'bg-green-50 border-green-200 text-green-800 dark:bg-green-900/20 dark:text-green-400' : 'bg-red-50 border-red-200 text-red-800 dark:bg-red-900/20 dark:text-red-400'}`}>{message.type === 'success' ? <CheckCircle2 className="w-5 h-5" /> : <AlertOctagon className="w-5 h-5" />}<span className="text-sm font-bold">{message.text}</span></div>}

        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <label className="flex items-center gap-2 text-[10px] font-black uppercase tracking-widest text-gray-400 mb-3"><CalendarDays className="w-4 h-4 text-blue-500" /> Collection Date</label>
          <input type="date" required value={summaryData.collectionDate} onChange={e => setSummaryData({...summaryData, collectionDate: e.target.value})} className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 font-black text-gray-900 dark:text-white outline-none border-2 border-transparent focus:border-blue-500 transition-all" />
        </div>

        {activeTab === "SUMMARY" && (
          <div className="animate-in slide-in-from-left-4 space-y-6">
            <SummarySection icon={<Building2 />} title="Anwarul Baitulmal" color="emerald" bookVal={summaryData.baitulmalReceiptBookNumber} onBookChange={(v: string) => setSummaryData({...summaryData, baitulmalReceiptBookNumber: v})} fromVal={summaryData.baitulmalFrom} onFromChange={(v: string) => setSummaryData({...summaryData, baitulmalFrom: v})} toVal={summaryData.baitulmalTo} onToChange={(v: string) => setSummaryData({...summaryData, baitulmalTo: v})} cashVal={summaryData.baitulmalCash} onCashChange={(v: string) => setSummaryData({...summaryData, baitulmalCash: v})} onlineVal={summaryData.baitulmalOnline} onOnlineChange={(v: string) => setSummaryData({...summaryData, baitulmalOnline: v})} onClear={() => clearSection('bait')} />
            <SummarySection icon={<BookOpen />} title="Madarsa Anwarul Quran" color="blue" bookVal={summaryData.madarsaReceiptBookNumber} onBookChange={(v: string) => setSummaryData({...summaryData, madarsaReceiptBookNumber: v})} fromVal={summaryData.madarsaFrom} onFromChange={(v: string) => setSummaryData({...summaryData, madarsaFrom: v})} toVal={summaryData.madarsaTo} onToChange={(v: string) => setSummaryData({...summaryData, madarsaTo: v})} cashVal={summaryData.madarsaCash} onCashChange={(v: string) => setSummaryData({...summaryData, madarsaCash: v})} onlineVal={summaryData.madarsaOnline} onOnlineChange={(v: string) => setSummaryData({...summaryData, madarsaOnline: v})} onClear={() => clearSection('mad')} />
            <section className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-purple-100 dark:border-purple-900/30 shadow-sm relative">
               <button onClick={() => clearSection('fitra')} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
               <div className="flex items-center gap-2 mb-4"><HeartHandshake className="w-5 h-5 text-purple-600" /><h3 className="font-black">Fitra Tokens</h3></div>
               <div className="grid grid-cols-2 gap-4">
                 <InputField label="Cash" type="number" value={summaryData.fitraCash} onChange={(v: string) => setSummaryData({...summaryData, fitraCash: v})} />
                 <InputField label="Online" type="number" value={summaryData.fitraOnline} onChange={(v: string) => setSummaryData({...summaryData, fitraOnline: v})} />
               </div>
            </section>
          </div>
        )}

        {activeTab === "RECEIPT_WISE" && (
          <div className="animate-in slide-in-from-right-4 space-y-6">
             <div className="bg-amber-50 dark:bg-amber-900/10 p-5 rounded-[2rem] border border-amber-100 dark:border-amber-900/30 space-y-4">
               <div className="flex items-center gap-2 mb-2"><Plus className="w-5 h-5 text-amber-600" /><h3 className="font-black text-amber-900 dark:text-amber-100 text-sm uppercase">Add New Receipt</h3></div>
               <div className="grid grid-cols-2 gap-3">
                 <InputField label="Book #" placeholder="BK-01" value={newReceipt.receiptBookNumber} onChange={(v: string) => setNewReceipt({...newReceipt, receiptBookNumber: v})} />
                 <InputField label="Receipt #" placeholder="101" value={newReceipt.receiptNumber} onChange={(v: string) => setNewReceipt({...newReceipt, receiptNumber: v})} />
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Fund</label>
                   <select value={newReceipt.fundCategory} onChange={e => setNewReceipt({...newReceipt, fundCategory: e.target.value})} className="w-full p-3.5 rounded-xl bg-white dark:bg-gray-800 text-sm font-black border-none outline-none">
                     <option value="BAITULMAL">Baitulmal</option>
                     <option value="MADARSA">Madarsa</option>
                     <option value="FITRA">Fitra Token</option>
                   </select>
                 </div>
                 <div className="space-y-1">
                   <label className="text-[9px] font-bold text-gray-500 uppercase ml-1">Mode</label>
                   <select value={newReceipt.paymentMode} onChange={e => setNewReceipt({...newReceipt, paymentMode: e.target.value})} className="w-full p-3.5 rounded-xl bg-white dark:bg-gray-800 text-sm font-black border-none outline-none"><option value="CASH">Cash</option><option value="ONLINE">Online</option></select>
                 </div>
               </div>
               <div className="grid grid-cols-2 gap-3">
                 <InputField label="Amount" type="number" placeholder="₹" value={newReceipt.amount} onChange={(v: string) => setNewReceipt({...newReceipt, amount: v})} />
                 <InputField label="Donor Name" placeholder="Optional" value={newReceipt.donorName} onChange={(v: string) => setNewReceipt({...newReceipt, donorName: v})} />
               </div>
               <button onClick={addReceiptToList} className="w-full py-4 bg-amber-600 text-white font-black rounded-2xl flex items-center justify-center gap-2 active:scale-95 transition-all"><Plus className="w-4 h-4" /> ADD TO LIST</button>
             </div>

             <div className="space-y-3">
               <div className="flex justify-between items-center px-1">
                <h4 className="text-[10px] font-black uppercase text-gray-400">Current Entry List ({receiptList.length})</h4>
                {receiptList.length > 0 && <button onClick={() => { if(confirm("Clear current list?")) setReceiptList([]) }} className="text-[10px] font-black text-red-500 uppercase flex items-center gap-1"><RotateCcw className="w-3 h-3"/> Clear List</button>}
               </div>
               {receiptList.length === 0 && <p className="text-center text-gray-400 py-10 font-medium text-xs bg-white dark:bg-gray-900 rounded-[2rem] border-2 border-dashed">No receipts added yet.</p>}
               {receiptList.map((r) => (
                 <div key={r.id} className="bg-white dark:bg-gray-900 p-4 rounded-2xl border border-gray-100 dark:border-gray-800 flex justify-between items-center animate-in fade-in">
                   <div className="flex items-center gap-3">
                     <div className={`w-8 h-8 rounded-full flex items-center justify-center font-black text-[10px] ${r.fundCategory === 'BAITULMAL' ? 'bg-emerald-100 text-emerald-600' : r.fundCategory === 'MADARSA' ? 'bg-blue-100 text-blue-600' : 'bg-purple-100 text-purple-600'}`}>{r.fundCategory === 'FITRA' ? 'FT' : r.fundCategory[0]}</div>
                     <div>
                        <p className="text-xs font-black">#{r.receiptNumber} <span className="text-gray-400 font-bold ml-1">({r.receiptBookNumber})</span></p>
                        <p className="text-[9px] font-bold text-gray-500 uppercase">{r.fundCategory === 'FITRA' ? 'Fitra Token' : r.fundCategory} • {r.paymentMode} • {r.donorName || 'No Name'}</p>
                     </div>
                   </div>
                   <div className="flex items-center gap-3">
                     <p className="text-sm font-black">₹{r.amount}</p>
                     <button onClick={() => setReceiptList(receiptList.filter(item => item.id !== r.id))} className="text-red-400"><Trash2 className="w-4 h-4" /></button>
                   </div>
                 </div>
               ))}
             </div>
          </div>
        )}

        <div className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm relative">
          <button onClick={() => setSummaryData(prev => ({...prev, notes: ""}))} className="absolute top-5 right-5 text-gray-400 hover:text-red-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
          <label className="text-[10px] font-black uppercase tracking-widest text-gray-400 mb-2 block">Final Remarks</label>
          <textarea rows={2} value={summaryData.notes} onChange={e => setSummaryData({...summaryData, notes: e.target.value})} placeholder="Any overall notes for the approver..." className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-medium text-sm dark:text-white resize-none" />
        </div>
      </div>

      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/90 dark:bg-gray-950/90 backdrop-blur-xl border-t z-50 flex justify-center shadow-2xl">
        <div className="w-full max-w-lg">
          <div className="flex justify-between items-end mb-4 px-2">
            <div className="space-y-1">
              <p className="text-[10px] font-black text-gray-400 uppercase tracking-tighter">Physical Cash in Hand</p>
              <p className="text-2xl font-black">₹{totals.cash.toLocaleString()}</p>
            </div>
            <div className="text-right">
              <p className="text-[9px] font-bold text-blue-500 uppercase">Online: ₹{totals.online.toLocaleString()}</p>
              <p className="text-xs font-black text-emerald-600 uppercase">Grand Total: ₹{totals.total.toLocaleString()}</p>
            </div>
          </div>
          <button onClick={handleSubmit} disabled={loading || totals.total === 0} className="w-full py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-2xl shadow-xl active:scale-95 transition-all flex items-center justify-center gap-2 disabled:opacity-50">
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> SUBMIT CHALLAN</>}
          </button>
        </div>
      </div>
    </main>
  );
}

function SummarySection({ icon, title, color, bookVal, onBookChange, fromVal, onFromChange, toVal, onToChange, cashVal, onCashChange, onlineVal, onOnlineChange, onClear }: any) {
  const colorMap: any = { 
    emerald: "border-emerald-100 dark:border-emerald-900/30 text-emerald-600 bg-emerald-50 dark:bg-emerald-900/30", 
    blue: "border-blue-100 dark:border-blue-900/30 text-blue-600 bg-blue-50 dark:bg-blue-900/30" 
  };

  return (
    <section className={`bg-white dark:bg-gray-900 p-5 rounded-[2rem] border shadow-sm space-y-4 relative ${colorMap[color].split(' ')[0]}`}>
      <button onClick={onClear} className="absolute top-6 right-6 text-gray-400 hover:text-red-500 transition-colors"><RotateCcw className="w-4 h-4" /></button>
      <div className="flex items-center gap-2 mb-2"><div className={`p-2 rounded-lg ${colorMap[color].split(' ').slice(2).join(' ')}`}>{icon}</div><h3 className="font-black">{title}</h3></div>
      <InputField label="Receipt Book #" icon={<Hash />} placeholder="BK-100" value={bookVal} onChange={onBookChange} />
      <div className="grid grid-cols-2 gap-3 bg-gray-50 dark:bg-gray-800/50 p-3 rounded-2xl border border-gray-100 dark:border-gray-800">
        <InputField label="From Receipt #" placeholder="101" value={fromVal} onChange={onFromChange} />
        <InputField label="To Receipt #" placeholder="200" value={toVal} onChange={onToChange} />
      </div>
      <div className="grid grid-cols-2 gap-4 pt-1">
        <InputField label="Cash Amount" type="number" placeholder="0" value={cashVal} onChange={onCashChange} />
        <InputField label="Online Amount" type="number" placeholder="0" value={onlineVal} onChange={onOnlineChange} />
      </div>
    </section>
  );
}

function InputField({ label, type = "text", placeholder, value, onChange, icon }: { label: string, type?: string, placeholder?: string, value: string, onChange: (v: string) => void, icon?: React.ReactNode }) {
  return (
    <div className="space-y-1">
      <label className="text-[10px] font-bold text-gray-500 uppercase ml-1 flex items-center gap-1">{icon && <span className="text-gray-400">{icon}</span>}{label}</label>
      <input type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} className="w-full p-3.5 rounded-xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 text-sm font-black text-gray-900 dark:text-white placeholder:text-gray-300 dark:placeholder:text-gray-600 outline-none focus:border-amber-500 transition-all" />
    </div>
  );
}