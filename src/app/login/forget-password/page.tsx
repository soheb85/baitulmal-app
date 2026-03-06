"use client";

import { useState } from "react";
import { requestPasswordReset, resetPassword } from "@/app/actions/authActions";
import { useRouter } from "next/navigation";
import { Loader2, Smartphone, ShieldCheck, ArrowLeft, CheckCircle2 } from "lucide-react";

export default function ForgotPasswordPage() {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [mobileNumber, setMobileNumber] = useState("");
  const [formData, setFormData] = useState({ pin: "", newPassword: "" });
  const router = useRouter();

  // Ensure only numbers are typed
  const handleMobileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/\D/g, ""); // Remove non-digits
    if (value.length <= 10) {
      setMobileNumber(value);
    }
  };

  const handleRequest = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend Validation
    if (mobileNumber.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    // Send mobile number to request the PIN
    const res = await requestPasswordReset(mobileNumber);
    if (res.success) {
      setStep(2);
    } else {
      alert(res.message);
    }
    setLoading(false);
  };

  const handleReset = async (e: React.FormEvent) => {
    e.preventDefault();
    
    // Frontend Validation
    if (formData.pin.length !== 6) {
      alert("Please enter the complete 6-digit PIN.");
      return;
    }
    if (formData.newPassword.length < 6) {
      alert("Your new password must be at least 6 characters long.");
      return;
    }

    setLoading(true);
    // Passing mobileNumber (mapped to username for backend compatibility) along with PIN and new password
    const res = await resetPassword({ username: mobileNumber, ...formData });
    
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
                {step === 1 ? <Smartphone className="w-8 h-8 text-blue-600" /> : <ShieldCheck className="w-8 h-8 text-green-600" />}
            </div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white">
                {step === 1 ? "Forgot Password?" : "Verify Reset PIN"}
            </h1>
            <p className="text-sm text-gray-500 mt-1">
                {step === 1 
                    ? "Enter your registered mobile number to receive a 6-digit reset PIN." 
                    : "Check your messages/email for the PIN we just sent you."}
            </p>
        </div>

        {step === 1 ? (
          <form onSubmit={handleRequest} className="space-y-5">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1.5 block">
                Mobile Number
              </label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-gray-400 font-bold">+91</span>
                <input 
                  required
                  type="tel"
                  value={mobileNumber}
                  onChange={handleMobileChange}
                  className="w-full p-4 pl-12 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-blue-500 font-bold dark:text-white tracking-wider"
                  placeholder="00000 00000"
                />
              </div>
            </div>
            <button disabled={loading || mobileNumber.length !== 10} className="w-full py-4 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-blue-200 dark:shadow-none">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Send Reset PIN"}
            </button>
          </form>
        ) : (
          <form onSubmit={handleReset} className="space-y-5 animate-in fade-in slide-in-from-right-4">
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1.5 block">
                6-Digit PIN
              </label>
              <input 
                required
                type="text"
                maxLength={6}
                value={formData.pin}
                onChange={(e) => setFormData({...formData, pin: e.target.value.replace(/\D/g, "")})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 font-mono text-center text-2xl font-black tracking-[0.5em] dark:text-white"
                placeholder="000000"
              />
            </div>
            <div>
              <label className="text-[10px] font-black uppercase text-gray-400 tracking-widest ml-1 mb-1.5 block">
                New Secure Password
              </label>
              <input 
                required
                type="password"
                value={formData.newPassword}
                onChange={(e) => setFormData({...formData, newPassword: e.target.value})}
                className="w-full p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border-none outline-none focus:ring-2 focus:ring-green-500 font-bold dark:text-white"
                placeholder="••••••••"
              />
            </div>
            <button disabled={loading || formData.pin.length !== 6 || formData.newPassword.length < 6} className="w-full py-4 bg-green-600 hover:bg-green-700 disabled:bg-green-400 dark:disabled:bg-green-800 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all active:scale-95 shadow-lg shadow-green-200 dark:shadow-none">
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <><CheckCircle2 className="w-5 h-5"/> Update Password</>}
            </button>
          </form>
        )}

        <button type="button" onClick={() => router.push("/login")} className="w-full mt-8 flex items-center justify-center gap-2 text-xs font-black text-gray-400 hover:text-gray-600 dark:hover:text-gray-300 transition-colors uppercase tracking-widest">
            <ArrowLeft className="w-4 h-4" /> Back to Login
        </button>
      </div>
    </div>
  );
}