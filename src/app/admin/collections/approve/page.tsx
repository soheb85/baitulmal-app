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
  Clock, Hash, ShieldCheck, Loader2, FileWarning, RotateCcw
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
  baitulmalCash: number | string;
  baitulmalOnline: number | string;

  madarsaReceiptBookNumber?: string;
  madarsaFrom?: string;
  madarsaTo?: string;
  madarsaCash: number | string;
  madarsaOnline: number | string;

  fitraCash: number | string;
  fitraOnline: number | string;

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
  
  // Custom Modal States
  const [submitting, setSubmitting] = useState<boolean>(false);
  const [approveModalOpen, setApproveModalOpen] = useState(false);
  const [rejectModalOpen, setRejectModalOpen] = useState(false);
  const [rejectReason, setRejectReason] = useState("");

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

  // --- DISCREPANCY TRACKER ---
  const getDiscrepancies = (orig: IChallan | null, edited: IChallan | null) => {
    if (!orig || !edited) return [];
    const diffs: string[] = [];
    const checkFields = [
      { k: 'baitulmalCash', n: 'Baitulmal Cash', isNum: true }, { k: 'baitulmalOnline', n: 'Baitulmal Online', isNum: true },
      { k: 'madarsaCash', n: 'Madarsa Cash', isNum: true }, { k: 'madarsaOnline', n: 'Madarsa Online', isNum: true },
      { k: 'fitraCash', n: 'Fitra Cash', isNum: true }, { k: 'fitraOnline', n: 'Fitra Online', isNum: true },
      { k: 'baitulmalFrom', n: 'Baitulmal From #', isNum: false }, { k: 'baitulmalTo', n: 'Baitulmal To #', isNum: false },
      { k: 'madarsaFrom', n: 'Madarsa From #', isNum: false }, { k: 'madarsaTo', n: 'Madarsa To #', isNum: false },
    ];
    
    checkFields.forEach(f => {
      const oVal = orig[f.k as keyof IChallan];
      const eVal = edited[f.k as keyof IChallan];

      if (f.isNum) {
        if (Number(oVal || 0) !== Number(eVal || 0)) {
          diffs.push(`${f.n}: ${Number(oVal || 0)} -> ${Number(eVal || 0)}`);
        }
      } else {
        if (String(oVal || '') !== String(eVal || '')) {
          diffs.push(`${f.n}: ${oVal || 'N/A'} -> ${eVal || 'N/A'}`);
        }
      }
    });
    return diffs;
  };

  const currentOriginal = pending.find(p => p._id === editingId) || null;
  const discrepancies = getDiscrepancies(currentOriginal, editForm);
  const hasChanges = discrepancies.length > 0;

  // --- ACTION HANDLERS ---
  const handleRevertChanges = () => {
    if (window.confirm("Revert all edited values back to the user's original submission?")) {
      setEditForm({ ...currentOriginal } as IChallan);
    }
  };

  const handleApproveConfirm = async () => {
    if (!editForm || !editingId) return;

    if (hasChanges && (!editForm.adminNotes || editForm.adminNotes.trim().length < 3)) {
       alert("Discrepancies detected. You must enter an Admin Audit Note explaining the changes.");
       setApproveModalOpen(false);
       return;
    }

    setSubmitting(true);
    
    let finalNoteToSave = editForm.adminNotes || "";
    if (hasChanges) {
       const systemLog = `[SYSTEM DETECTED CORRECTIONS]\n${discrepancies.join('\n')}\n\n[ADMIN REMARK]\n${editForm.adminNotes}`;
       finalNoteToSave = systemLog;
    }

    const res = await updateAndApproveChallan(editingId, { ...editForm, adminNotes: finalNoteToSave });
    if (res.success) {
      setApproveModalOpen(false);
      setEditingId(null);
      setEditForm(null);
      await loadPending();
    } else {
      alert(res.message);
    }
    setSubmitting(false);
  };

  const handleRejectConfirm = async () => {
    if (!editingId || !rejectReason.trim()) return;
    setSubmitting(true);
    const res = await rejectChallan(editingId, rejectReason);
    if (res.success) {
      setRejectModalOpen(false);
      setEditingId(null);
      setRejectReason("");
      await loadPending();
    } else {
      alert(res.message);
    }
    setSubmitting(false);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;
  if (loading) return <NavigationLoader message="Securing Vault Data..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-[#0B1120] relative font-outfit text-gray-900 dark:text-white">
      <div className="w-full h-full overflow-y-auto px-5 pt-8 pb-32 custom-scrollbar">
        
        {/* Header */}
        <div className="flex items-center justify-between mb-8 bg-white dark:bg-[#151D2C] p-4 rounded-3xl border border-gray-100 dark:border-white/5 shadow-sm">
          <div className="flex items-center gap-3">
            <button onClick={() => handleBack()} className="p-2.5 bg-gray-50 dark:bg-white/5 rounded-2xl active:scale-90 transition-transform">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white flex items-center gap-2">
                <ShieldCheck className="w-5 h-5 text-amber-500" /> Approvals
              </h1>
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest">{pending.length} Pending</p>
            </div>
          </div>
        </div>

        {/* Empty State */}
        {pending.length === 0 && (
          <div className="flex flex-col items-center justify-center py-24 opacity-40 text-center animate-in fade-in zoom-in-95">
            <div className="p-6 bg-gray-200 dark:bg-white/5 rounded-full mb-4">
               <CheckCircle2 className="w-12 h-12 text-emerald-500" />
            </div>
            <p className="font-black uppercase tracking-widest text-xs">All Verified</p>
            <p className="text-[10px] font-bold mt-1 text-gray-500">No collections pending verification.</p>
          </div>
        )}

        {/* Pending List */}
        <div className="space-y-4">
          {pending.map((ch) => {
            const isEditing = editingId === ch._id;
            return (
              <div key={ch._id} className={`bg-white dark:bg-[#151D2C] rounded-[2.5rem] border transition-all duration-500 overflow-hidden ${isEditing ? 'border-amber-500 shadow-xl ring-4 ring-amber-500/10' : 'border-gray-100 dark:border-white/5 shadow-sm'}`}>
                
                {/* Summary Header */}
                <div className="p-6 cursor-pointer select-none" onClick={() => handleEditClick(ch)}>
                  <div className="flex justify-between items-start mb-4">
                    <div className="space-y-2">
                      <span className="text-[9px] font-black bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 px-2.5 py-1.5 rounded-lg uppercase tracking-widest border border-blue-100 dark:border-transparent">
                        {ch.challanNumber}
                      </span>
                      <div className="flex items-center gap-3 mt-2">
                        <div className="w-10 h-10 rounded-2xl bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/5 flex items-center justify-center text-gray-600 dark:text-gray-300 font-black text-sm">
                          {ch.submittedByName[0]}
                        </div>
                        <div>
                           <p className="text-sm font-black leading-tight">{ch.submittedByName}</p>
                           <p className="text-[9px] font-bold text-gray-400 uppercase flex items-center gap-1 mt-0.5">
                             <Clock className="w-2.5 h-2.5" /> {new Date(ch.collectionDate).toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })}
                           </p>
                        </div>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-xl font-black text-amber-600 dark:text-amber-500">₹{ch.grandTotal.toLocaleString()}</p>
                      <span className="inline-flex items-center px-2 py-0.5 text-[9px] font-black text-amber-700 bg-amber-100 dark:bg-amber-900/30 dark:text-amber-400 rounded-md border border-amber-200 dark:border-amber-800 uppercase tracking-wide animate-pulse">
                      Verify Details
                      </span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-2 mt-4">
                     <SummaryMetric label="Cash Handover" amount={ch.totalCashSubmitted} color="emerald" icon={<Wallet className="w-3 h-3" />} />
                     <SummaryMetric label="Online Tfr" amount={ch.totalOnlineSubmitted} color="blue" icon={<Landmark className="w-3 h-3" />} />
                  </div>
                  
                  <div className={`mt-5 flex items-center justify-center gap-2 text-[10px] font-black uppercase tracking-widest transition-colors ${isEditing ? 'text-amber-500' : 'text-gray-400'}`}>
                     {isEditing ? <><ChevronUp className="w-4 h-4" /> Close Panel</> : <><ChevronDown className="w-4 h-4" /> Review Entry</>}
                  </div>
                </div>

                {/* Verification Body */}
                {isEditing && editForm && (
                  <div className="p-6 bg-gray-50/50 dark:bg-black/20 border-t border-gray-100 dark:border-white/5 space-y-8 animate-in slide-in-from-top-4 duration-300">
                    
                    {/* INSTRUCTIONS & RESET ROW */}
                    <div className="flex gap-2">
                      <div className="bg-white dark:bg-white/5 p-4 rounded-[1.5rem] border border-gray-100 dark:border-white/5 flex gap-3 shadow-sm flex-1">
                        <AlertTriangle className="w-5 h-5 text-amber-500 shrink-0" />
                        <p className="text-[10px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed">
                          Cross-check physical receipts and cash bag. If you edit any value, an audit note will be required.
                        </p>
                      </div>
                      
                      {/* APPEARS ONLY WHEN EDITED */}
                      {hasChanges && (
                         <button 
                           onClick={handleRevertChanges}
                           className="bg-rose-50 dark:bg-rose-500/10 p-4 rounded-[1.5rem] border border-rose-100 dark:border-rose-500/20 flex flex-col items-center justify-center text-rose-500 hover:bg-rose-100 dark:hover:bg-rose-500/20 active:scale-95 transition-all shadow-sm shrink-0 animate-in zoom-in-95"
                           title="Revert to Original"
                         >
                           <RotateCcw className="w-5 h-5 mb-1" />
                           <span className="text-[8px] font-black uppercase tracking-widest">Reset</span>
                         </button>
                      )}
                    </div>

                    <VerificationSection 
                      icon={<Building2 />} title="Baitulmal Verification" color="emerald"
                      bookVal={editForm.baitulmalReceiptBookNumber} onBookChange={(v: any) => setEditForm({...editForm, baitulmalReceiptBookNumber: v})}
                      fromVal={editForm.baitulmalFrom} onFromChange={(v: any) => setEditForm({...editForm, baitulmalFrom: v})}
                      toVal={editForm.baitulmalTo} onToChange={(v: any) => setEditForm({...editForm, baitulmalTo: v})}
                      cashVal={editForm.baitulmalCash} onCashChange={(v: any) => setEditForm({...editForm, baitulmalCash: v})}
                      onlineVal={editForm.baitulmalOnline} onOnlineChange={(v: any) => setEditForm({...editForm, baitulmalOnline: v})}
                    />

                    <VerificationSection 
                      icon={<BookOpen />} title="Madarsa Verification" color="blue"
                      bookVal={editForm.madarsaReceiptBookNumber} onBookChange={(v: any) => setEditForm({...editForm, madarsaReceiptBookNumber: v})}
                      fromVal={editForm.madarsaFrom} onFromChange={(v: any) => setEditForm({...editForm, madarsaFrom: v})}
                      toVal={editForm.madarsaTo} onToChange={(v: any) => setEditForm({...editForm, madarsaTo: v})}
                      cashVal={editForm.madarsaCash} onCashChange={(v: any) => setEditForm({...editForm, madarsaCash: v})}
                      onlineVal={editForm.madarsaOnline} onOnlineChange={(v: any) => setEditForm({...editForm, madarsaOnline: v})}
                    />

                    <div className="space-y-4">
                        <SectionTitle icon={<HeartHandshake />} title="Fitra Verification" color="purple" />
                        <div className="grid grid-cols-2 gap-3">
                            <InputField label="Fitra Cash" type="number" value={editForm.fitraCash} onChange={(v: any) => setEditForm({...editForm, fitraCash: v})} icon={<Wallet className="w-3 h-3" />} />
                            <InputField label="Fitra Online" type="number" value={editForm.fitraOnline} onChange={(v: any) => setEditForm({...editForm, fitraOnline: v})} icon={<Landmark className="w-3 h-3" />} />
                        </div>
                    </div>

                    {/* Discrepancy Tracking & Notes Area */}
                    <div className="space-y-4">
                      <NoteBox label="Submitter Comments" content={ch.notes} icon={<MessageSquare className="w-3 h-3" />} />
                      
                      {hasChanges && (
                         <div className="bg-rose-50 dark:bg-rose-500/10 border border-rose-200 dark:border-rose-500/20 p-4 rounded-2xl animate-in fade-in zoom-in-95">
                            <div className="flex gap-2 items-center mb-2">
                               <FileWarning className="w-4 h-4 text-rose-500" />
                               <span className="text-[10px] font-black uppercase text-rose-600 dark:text-rose-400 tracking-widest">Modifications Detected</span>
                            </div>
                            <ul className="text-[9px] font-bold text-rose-700 dark:text-rose-300 space-y-1 list-disc list-inside ml-4">
                               {discrepancies.map((d, i) => <li key={i}>{d}</li>)}
                            </ul>
                         </div>
                      )}

                      <div className="space-y-1.5 px-1">
                        <label className={`text-[10px] font-black uppercase tracking-widest flex items-center gap-1.5 ml-1 ${hasChanges ? 'text-rose-500' : 'text-gray-400'}`}>
                          <Edit3 className="w-3 h-3" /> {hasChanges ? 'Required Audit Note' : 'Internal Admin Note'}
                        </label>
                        <textarea 
                          rows={3} 
                          placeholder={hasChanges ? "Explain why you changed the amounts..." : "Optional internal remarks..."}
                          value={editForm.adminNotes || ""}
                          onChange={(e) => setEditForm({...editForm, adminNotes: e.target.value})}
                          className={`w-full p-4 rounded-2xl bg-white dark:bg-[#151D2C] border text-[11px] font-bold outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 ${hasChanges ? 'border-rose-300 dark:border-rose-500/50 focus:border-rose-500 focus:ring-4 focus:ring-rose-500/10' : 'border-gray-100 dark:border-white/5 focus:border-amber-500 focus:ring-4 focus:ring-amber-500/10'}`}
                        />
                      </div>
                    </div>

                    {/* Actions */}
                    <div className="flex gap-3 pt-4">
                      <button 
                        onClick={() => setRejectModalOpen(true)} 
                        className="flex-1 py-4 bg-rose-50 dark:bg-rose-500/10 text-rose-600 dark:text-rose-400 font-black rounded-[1.5rem] text-[10px] uppercase tracking-widest border border-rose-100 dark:border-rose-500/20 active:scale-95 transition-transform"
                      >
                        Reject
                      </button>
                      <button 
                        onClick={() => setApproveModalOpen(true)} 
                        className="flex-[2] py-4 bg-emerald-500 hover:bg-emerald-600 text-white font-black rounded-[1.5rem] text-[10px] uppercase tracking-widest shadow-xl shadow-emerald-500/20 active:scale-95 transition-transform flex items-center justify-center gap-2"
                      >
                        <CheckCircle2 className="w-4 h-4" /> Verify & Approve
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* --- CUSTOM APPROVE MODAL --- */}
      {approveModalOpen && editForm && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151D2C] rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl border border-gray-100 dark:border-white/5 animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-emerald-50 dark:bg-emerald-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-emerald-100 dark:border-emerald-500/20">
                <CheckCircle2 className="w-8 h-8 text-emerald-500" />
             </div>
             <h2 className="text-xl font-black uppercase tracking-tight mb-2">Confirm Approval</h2>
             <p className="text-[11px] font-bold text-gray-500 mb-6">
               You are about to lock this record into the ledger.
             </p>
             <div className="bg-gray-50 dark:bg-black/20 p-4 rounded-2xl mb-6 border border-gray-100 dark:border-white/5">
                <p className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-1">Final Verified Total</p>
                <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400">
                   ₹{(
                     (Number(editForm.baitulmalCash)||0) + (Number(editForm.madarsaCash)||0) + (Number(editForm.fitraCash)||0) + 
                     (Number(editForm.baitulmalOnline)||0) + (Number(editForm.madarsaOnline)||0) + (Number(editForm.fitraOnline)||0)
                   ).toLocaleString()}
                </p>
             </div>
             <div className="flex gap-2">
               <button onClick={() => setApproveModalOpen(false)} disabled={submitting} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black rounded-xl text-[10px] uppercase tracking-widest">Cancel</button>
               <button onClick={handleApproveConfirm} disabled={submitting} className="flex-[2] py-3.5 bg-emerald-500 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2">
                 {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Confirm"}
               </button>
             </div>
          </div>
        </div>
      )}

      {/* --- CUSTOM REJECT MODAL --- */}
      {rejectModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4 animate-in fade-in">
          <div className="bg-white dark:bg-[#151D2C] rounded-[2.5rem] p-8 w-full max-w-sm text-center shadow-2xl border border-rose-100 dark:border-rose-900/30 animate-in zoom-in-95 duration-200">
             <div className="w-16 h-16 bg-rose-50 dark:bg-rose-500/10 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100 dark:border-rose-500/20">
                <XCircle className="w-8 h-8 text-rose-500" />
             </div>
             <h2 className="text-xl font-black uppercase tracking-tight text-rose-600 mb-2">Reject Challan</h2>
             <p className="text-[11px] font-bold text-gray-500 mb-4">
               This will send the collection back to the submitter. Please provide a reason.
             </p>
             <textarea 
                rows={3} 
                placeholder="Reason for rejection (e.g. Missing ₹500 in bag)..."
                value={rejectReason}
                onChange={e => setRejectReason(e.target.value)}
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-200 dark:border-white/5 text-xs font-bold outline-none focus:border-rose-500 mb-6"
             />
             <div className="flex gap-2">
               <button onClick={() => setRejectModalOpen(false)} disabled={submitting} className="flex-1 py-3.5 bg-gray-100 dark:bg-white/5 text-gray-600 dark:text-gray-300 font-black rounded-xl text-[10px] uppercase tracking-widest">Cancel</button>
               <button onClick={handleRejectConfirm} disabled={submitting || !rejectReason.trim()} className="flex-[2] py-3.5 bg-rose-600 text-white font-black rounded-xl text-[10px] uppercase tracking-widest shadow-lg flex items-center justify-center gap-2 disabled:opacity-50">
                 {submitting ? <Loader2 className="w-4 h-4 animate-spin"/> : "Reject Entry"}
               </button>
             </div>
          </div>
        </div>
      )}
    </main>
  );
}

// --- HELPER UI COMPONENTS ---

function SummaryMetric({ label, amount, color, icon }: { label: string, amount: number, color: 'emerald' | 'blue', icon: React.ReactNode }) {
  const styles = color === 'emerald' ? 'bg-emerald-50 dark:bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-100 dark:border-emerald-500/20' : 'bg-blue-50 dark:bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-100 dark:border-blue-500/20';
  return (
    <div className={`flex-1 ${styles} p-3.5 rounded-2xl border shadow-sm`}>
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
    emerald: "text-emerald-600 bg-emerald-50 dark:bg-emerald-500/10",
    blue: "text-blue-600 bg-blue-50 dark:bg-blue-500/10",
    purple: "text-purple-600 bg-purple-50 dark:bg-purple-500/10",
  };
  return (
    <div className="flex items-center gap-2.5 mb-3 px-1">
      <div className={`p-2.5 rounded-xl ${colorMap[color]}`}>{icon}</div>
      <h3 className="text-xs font-black text-gray-900 dark:text-white uppercase tracking-tight">{title}</h3>
    </div>
  );
}

function InputField({ label, type = "text", value, onChange, icon }: any) {
  return (
    <div className="space-y-1.5">
      <label className="text-[9px] font-black text-gray-500 dark:text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-1">{icon && icon} {label}</label>
      <input 
        type={type}
        value={value ?? ""}
        onChange={e => onChange(e.target.value)}
        className="w-full p-3.5 rounded-2xl bg-white dark:bg-black/20 border border-gray-100 dark:border-white/5 text-[11px] font-black text-gray-900 dark:text-white outline-none focus:border-amber-500 transition-all shadow-sm focus:ring-2 focus:ring-amber-500/20"
      />
    </div>
  );
}

function NoteBox({ label, content, icon }: { label: string, content?: string, icon: React.ReactNode }) {
  return (
    <div className="space-y-1.5 px-1">
      <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest flex items-center gap-1.5 ml-1">{icon} {label}</label>
      <div className="p-4 rounded-2xl bg-gray-50 dark:bg-black/20 border border-gray-100 dark:border-white/5 text-[11px] font-bold text-gray-500 dark:text-gray-400 leading-relaxed whitespace-pre-line shadow-sm">
        {content || "No comments provided by submitter."}
      </div>
    </div>
  );
}