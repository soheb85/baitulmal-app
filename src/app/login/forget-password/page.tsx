"use client";

import { useState } from "react";
import { requestPasswordReset, resetPassword } from "@/app/actions/authActions";
import { useRouter } from "next/navigation";
import { Loader2, Mail, KeyRound, ArrowLeft, CheckCircle2, ShieldCheck } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [username, setUsername] = useState("");
  const [formData, setFormData] = useState({ pin: "", newPassword: "" });
  const router = useRouter();

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await requestPasswordReset(username);
    if (res.success) {
      setStep(2);
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    const res = await resetPassword({ username, ...formData });
    if (res.success) {
      alert("Password changed successfully!");
      router.push("/login");
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center p-6 font-outfit">
      <div className="w-full max-w-md bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-xl border border-gray-100 dark:border-gray-800">
        
        <div className="flex flex-col items-center mb-8 text-center">
            <div className="w-16 h-16 bg-blue-50 dark:bg-blue-900/20 rounded-2xl flex items-center justify-center mb-4">
                {step === 1 ? <Mail className="w-8 h-8 text-blue-600" /> : <ShieldCheck className="w-8 h-8 text-green-600" />}
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                {step === 1 ? "Forgot Password?" : "Verify Reset PIN"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                {step === 1 
                    ? "Enter your username to receive a 6-digit reset PIN on your email." 
                    : "Check your email for the PIN we just sent you."}
            </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1.5 block">Username</label>
              <input 
                required
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white"
                placeholder="Enter your username"
              />
            </div>
            <button disabled={loading} className="w-full py-4 bg-blue-600 hover:bg-blue-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Reset PIN"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1.5 block">6-Digit PIN from Email</label>
              <input 
                required
                type="text"
                maxLength={6}
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-2xl font-black tracking-[0.5em] dark:text-white"
                placeholder="000000"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1.5 block">New Secure Password</label>
              <input 
                required
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 font-bold dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <button disabled={loading} className="w-full py-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-200 dark:shadow-none">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5"/> Update Password</>}
            </button>
          </form>
        )}

        <button onClick={() => router.push("/login")} className="w-full mt-8 flex items-center justify-center gap-2 text-xs font-black text-gray-400 hover:text-gray-600 transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>
      </div>
    </div>
  );
}