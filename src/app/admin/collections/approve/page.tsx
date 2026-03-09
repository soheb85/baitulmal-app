/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect, useCallback } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getPendingChallans, updateAndApproveChallan, rejectChallan } from "@/app/actions/admin/collectionActions";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, CheckCircle2, XCircle, User, 
  Building2, BookOpen, HeartHandshake, 
  AlertTriangle, ChevronDown, ChevronUp, Calendar,
  Receipt, Wallet, Landmark, MessageSquare, Edit3,
  Clock, Hash, ShieldCheck
} from "lucide-react";

// --- TYPES ---
interface IReceiptDetail {
  receiptBookNumber?: string;
  receiptNumber: string;
  fundCategory: string;
  paymentMode: string;
  amount: number;
}

interface IChallan {
  _id: string;
  challanNumber: string;
  collectionDate: string | Date;
  submittedBy: string;
  submittedByName: string;
  grandTotal: number;
  totalCashSubmitted: number;
  totalOnlineSubmitted: number;
  
  baitulmalReceiptBookNumber?: string;
  baitulmalFrom?: string;
  baitulmalTo?: string;
  baitulmalCash: number;
  baitulmalOnline: number;

  madarsaReceiptBookNumber?: string;
  madarsaFrom?: string;
  madarsaTo?: string;
  madarsaCash: number;
  madarsaOnline: number;

  fitraCash: number;
  fitraOnline: number;

  receiptBreakdown: IReceiptDetail[];
  notes?: string;
  adminNotes?: string;
}

export default function ApprovalPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/collections");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [pending, setPending] = useState<IChallan[]>([]);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState<IChallan | null>(null);
  const [submitting, setSubmitting] = useState<boolean>(false);

  const loadPending = useCallback(async () => {
    try {
      const res = await getPendingChallans();
      if (res.success && res.challans) {
        setPending(res.challans);
      }
    } catch (error) {
      console.error("Failed to load challans:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadPending();
  }, [loadPending]);

  const handleEditClick = (ch: IChallan) => {
    if (editingId === ch._id) {
      setEditingId(null);
      setEditForm(null);
    } else {
      setEditingId(ch._id);
      setEditForm({ ...ch });
    }
  };

  const handleApprove = async (id: string) => {
    if (!editForm) return;
    const confirmMsg = `Confirm verification for ${editForm.challanNumber}?\nTotal: ₹${editForm.grandTotal.toLocaleString()}`;
    if (!window.confirm(confirmMsg)) return;

    setSubmitting(true);
    const res = await updateAndApproveChallan(id, editForm);
    if (res.success) {
      setEditingId(null);
      setEditForm(null);
      await loadPending();
    } else {
      alert(res.message);
    }
    setSubmitting(false);
  };

  const handleReject = async (id: string) => {
    const reason = prompt("Reason for rejection (visible to user):");
    if (!reason) return;
    setSubmitting(true);
    const res = await rejectChallan(id, reason);
    if (res.success) await loadPending();
    setSubmitting(false);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;
  if (loading) return <NavigationLoader message="Securing Vault Data..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative font-outfit">
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header */}
        <div className="flex items-center gap-3 mb-6 bg-white dark:bg-gray-900 p-4 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
          <button onClick={() => handleBack()} className="p-2.5 bg-gray-100 dark:bg-gray-800 rounded-2xl active:scale-90 transition">
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
          <div>
            <h1 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
              <ShieldCheck className="w-5 h-5 text-amber-600" /> Verify Collection
            </h1>
            <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">Awaiting Admin Signature</p>
          </div>
        </div>

        {/* Empty State */}
        {pending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 opacity-30 text-center animate-in fade-in zoom-in-95">
            <div className="p-6 bg-gray-200 dark:bg-gray-800 rounded-full mb-4">
               <CheckCircle2 className="w-12 h-12 text-gray-500" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs">All Collections Verified</p>
            <p className="text-[10px] font-bold mt-1">No pending challans found.</p>
          </div>
        )}

        {/* Pending List */}
        <div className="space-y-4">
          {pending.map((ch) => {
            const isEditing = editingId === ch._id;
            return (
              <div key={ch._id} className={`bg-white dark:bg-gray-900 rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isEditing ? 'border-amber-500 shadow-xl ring-8 ring-amber-500/5' : 'border-gray-100 dark:border-gray-800 shadow-sm'}`}>
                
                {/* Summary Header */}
                <div className="p-6 cursor-pointer select-none" onClick={() => handleEditClick(ch)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-900/30 text-blue-600 dark:text-blue-400 px-2.5 py-2 rounded-lg uppercase tracking-widest border border-blue-100 dark:border-blue-800">
                        {ch.challanNumber}
                      </span>
                      <div className="flex items-center gap-2 mt-2">
                        <div className="w-9 h-9 rounded-2xl bg-amber-50 dark:bg-amber-900/20 flex items-center justify-center text-amber-600 font-black text-sm">
                          {ch.submittedByName[0]}
                        </div>
                        <div>
                           <p className="text-sm font-black text-gray-900 dark:text-white leading-tight">{ch.submittedByName}</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1 mt-0.5">
                             <Clock className="w-2.5 h-2.5" /> {new Date(ch.collectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-gray-900 dark:text-white">₹{ch.grandTotal.toLocaleString()}</p>
                      <span className="inline-block text-[8px] font-black bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-400 px-2 py-0.5 rounded-full uppercase mt-1 animate-pulse">
                        Waiting for Approval
                      </span>
                    </div>
                  </div>

                  {/* Top level metrics */}
                  <div className="grid grid-cols-2 gap-2 mt-4">
                     <SummaryMetric label="Cash Handover" amount={ch.totalCashSubmitted} color="emerald" icon={<Wallet className="w-3 h-3" />} />
                     <SummaryMetric label="Online Tfr" amount={ch.totalOnlineSubmitted} color="blue" icon={<Landmark className="w-3 h-3" />} />
                  </div>
                  
                  <div className={`mt-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isEditing ? 'text-amber-600' : 'text-gray-400'}`}>
                     {isEditing ? <><ChevronUp className="w-4 h-4" /> Close Panel</> : <><ChevronDown className="w-4 h-4" /> Verify Details</>}
                  </div>
                </div>

                {/* Verification Body */}
                {isEditing && editForm && (
                  <div className="p-6 bg-gray-50/50 dark:bg-gray-800/20 border-t border-gray-100 dark:border-gray-800 space-y-8 animate-in slide-in-from-top-4 duration-300">
                    
                    {/* Instructions */}
                    <div className="bg-amber-50 dark:bg-amber-900/10 p-4 rounded-[1.5rem] border border-amber-200/50 dark:border-amber-800/50 flex gap-3">
                      <AlertTriangle className="w-5 h-5 text-amber-600 shrink-0" />
                      <p className="text-[10px] font-bold text-amber-700 dark:text-amber-400 leading-relaxed">
                        Cross-check physical receipts and cash bag. Correct any discrepancies below.
                      </p>
                    </div>

                    {/* Sections */}
                    <VerificationSection 
                      icon={<Building2 />} title="Baitulmal Correction" color="emerald"
                      bookVal={editForm.baitulmalReceiptBookNumber} onBookChange={(v: any) => setEditForm({...editForm, baitulmalReceiptBookNumber: v})}
                      fromVal={editForm.baitulmalFrom} onFromChange={(v: any) => setEditForm({...editForm, baitulmalFrom: v})}
                      toVal={editForm.baitulmalTo} onToChange={(v: any) => setEditForm({...editForm, baitulmalTo: v})}
                      cashVal={editForm.baitulmalCash} onCashChange={(v: any) => setEditForm({...editForm, baitulmalCash: Number(v)})}
                      onlineVal={editForm.baitulmalOnline} onOnlineChange={(v: any) => setEditForm({...editForm, baitulmalOnline: Number(v)})}
                    />

                    <VerificationSection 
                      icon={<BookOpen />} title="Madarsa Correction" color="blue"
                      bookVal={editForm.madarsaReceiptBookNumber} onBookChange={(v: any) => setEditForm({...editForm, madarsaReceiptBookNumber: v})}
                      fromVal={editForm.madarsaFrom} onFromChange={(v: any) => setEditForm({...editForm, madarsaFrom: v})}
                      toVal={editForm.madarsaTo} onToChange={(v: any) => setEditForm({...editForm, madarsaTo: v})}
                      cashVal={editForm.madarsaCash} onCashChange={(v: any) => setEditForm({...editForm, madarsaCash: Number(v)})}
                      onlineVal={editForm.madarsaOnline} onOnlineChange={(v: any) => setEditForm({...editForm, madarsaOnline: Number(v)})}
                    />

                    <div className="space-y-4">
                        <SectionTitle icon={<HeartHandshake />} title="Fitra Verification" color="purple" />
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Fitra Cash" type="number" value={editForm.fitraCash} onChange={(v: any) => setEditForm({...editForm, fitraCash: Number(v)})} icon={<Wallet className="w-3 h-3" />} />
                            <InputField label="Fitra Online" type="number" value={editForm.fitraOnline} onChange={(v: any) => setEditForm({...editForm, fitraOnline: Number(v)})} icon={<Landmark className="w-3 h-3" />} />
                        </div>
                    </div>

                    {/* Notes Area */}
                    <div className="space-y-4">
                      <NoteBox label="User Final Remarks" content={ch.notes} icon={<MessageSquare className="w-3 h-3" />} />
                      
                      <div className="space-y-1.5 px-1">
                        <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5 ml-1">
                          <Edit3 className="w-3 h-3" /> Internal Admin Audit Note
                        </label>
                        <textarea 
                          rows={2} 
                          placeholder="Log any cash shortfalls or corrections here..."
                          value={editForm.adminNotes || ""}
                          onChange={(e) => setEditForm({...editForm, adminNotes: e.target.value})}
                          className="w-full p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[11px] font-bold outline-none focus:border-amber-500 transition-all placeholder:text-gray-300"
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => handleReject(ch._id)} 
                        disabled={submitting} 
                        className="flex-1 py-4 bg-rose-50 dark:bg-rose-900/20 text-rose-600 font-black rounded-3xl text-[10px] uppercase tracking-widest border border-rose-100 dark:border-rose-900/30 active:scale-95 disabled:opacity-50"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => handleApprove(ch._id)} 
                        disabled={submitting} 
                        className="flex-[2] py-4 bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-black rounded-3xl text-[10px] uppercase tracking-widest shadow-xl active:scale-95 disabled:opacity-50 flex items-center justify-center gap-2"
                      >
                        {submitting ? "Approving..." : <><CheckCircle2 className="w-4 h-4" /> Verify & Approve</>}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </main>
  );
}

// --- HELPER UI COMPONENTS ---

function SummaryMetric({ label, amount, color, icon }: { label: string, amount: number, color: 'emerald' | 'blue', icon: React.ReactNode }) {
  const styles = color === 'emerald' ? 'bg-emerald-50/50 text-emerald-600 border-emerald-100/50' : 'bg-blue-50/50 text-blue-600 border-blue-100/50';
  return (
    <div className={`flex-1 ${styles} p-3 rounded-2xl border`}>
      <p className="text-[8px] font-black uppercase tracking-widest mb-1 flex items-center gap-1 opacity-70">{icon} {label}</p>
      <p className="text-sm font-black">₹{amount.toLocaleString()}</p>
    </div>
  );
}

function VerificationSection({ icon, title, color, bookVal, onBookChange, fromVal, onFromChange, toVal, onToChange, cashVal, onCashChange, onlineVal, onOnlineChange }: any) {
  return (
    <div className="space-y-4">
      <SectionTitle icon={icon} title={title} color={color} />
      <div className="grid grid-cols-3 gap-2">
        <InputField label="Book #" value={bookVal} onChange={onBookChange} />
        <InputField label="From #" value={fromVal} onChange={onFromChange} />
        <InputField label="To #" value={toVal} onChange={onToChange} />
      </div>
      <div className="grid grid-cols-2 gap-3">
        <InputField label="Cash Amount" type="number" value={cashVal} onChange={onCashChange} icon={<Wallet className="w-3 h-3" />} />
        <InputField label="Online Tfr" type="number" value={onlineVal} onChange={onOnlineChange} icon={<Landmark className="w-3 h-3" />} />
      </div>
    </div>
  );
}

function SectionTitle({ icon, title, color }: any) {
  const colorMap: any = {
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-900/20",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-900/20",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-900/20",
  };
  return (
    <div className="flex items-center gap-2 mb-2 px-1">
      <div className={`p-2 rounded-xl ${colorMap[color]}`}>{icon}</div>
      <h3 className="text-[11px] font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h3>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-gray-400 uppercase ml-1 flex items-center gap-1">{icon && icon} {label}</label>
      <input 
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full p-3.5 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[11px] font-black text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-sm"
      />
    </div>
  );
}

function NoteBox({ label, content, icon }: { label: string, content?: string, icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5 px-1">
      <label className="text-[10px] font-black text-gray-400 uppercase flex items-center gap-1.5 ml-1">{icon} {label}</label>
      <div className="p-4 rounded-2xl bg-white dark:bg-gray-900 border border-gray-100 dark:border-gray-800 text-[11px] font-bold text-gray-500 leading-relaxed whitespace-pre-line shadow-sm">
        {content || "No comments provided."}
      </div>
    </div>
  );
}