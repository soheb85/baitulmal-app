"use client";

import { useState } from "react";
import { loginUser } from "@/app/actions/authActions";
import { Lock, LogIn, Loader2, ShieldCheck, ArrowLeft, KeyRound, Phone } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  
  const { isNavigating, handleBack } = useBackNavigation("/");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    // --- 10-Digit Validation Check ---
    if (formData.username.length !== 10) {
      alert("Please enter a valid 10-digit mobile number.");
      return;
    }

    setLoading(true);
    const res = await loginUser(formData);
    if (res.success) {
      handleBack("/");
    } else {
      alert(res.message);
      setLoading(false);
    }
  };

  if (isNavigating) return <NavigationLoader message="Signing In..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-6 font-outfit relative">
      
      {/* Back Button */}
      <button 
        onClick={() => handleBack("/")}
        className="absolute top-8 left-6 p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-90 transition-transform"
      >
        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center mb-10">
          <div className="bg-blue-100 dark:bg-blue-900/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <ShieldCheck className="w-8 h-8 text-blue-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Member & Trusty Login</h2>
          <p className="text-gray-500 mt-2">Baitulmal Management System</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              required
              type="tel"
              maxLength={10}
              placeholder="10-Digit Mobile Number"
              value={formData.username || ""} // <-- FIX: Forced fallback to empty string
              className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold dark:text-white"
              onChange={(e) => {
                const onlyNumbers = e.target.value.replace(/\D/g, '');
                setFormData({ ...formData, username: onlyNumbers });
              }}
            />
          </div>

          <div className="space-y-2">
            <div className="relative">
                <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                    required
                    type="password"
                    placeholder="Password"
                    value={formData.password || ""} // <-- FIX: Made Password explicitly controlled too
                    className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none font-bold dark:text-white"
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                />
            </div>
            
            {/* Forgot Password Link */}
            <div className="flex justify-end px-1">
                <button 
                    type="button"
                    onClick={() => handleBack("/login/forget-password")}
                    className="text-xs font-bold text-gray-400 hover:text-blue-600 flex items-center gap-1.5 transition-colors"
                >
                    <KeyRound className="w-3 h-3" /> Forgot Password?
                </button>
            </div>
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-black py-4 rounded-2xl shadow-lg shadow-blue-200 dark:shadow-none transition-all active:scale-95 flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
          >
            {loading ? <Loader2 className="animate-spin w-5 h-5" /> : <LogIn className="w-5 h-5" />}
            {loading ? "Verifying..." : "Sign In"}
          </button>
        </form>

        <div className="mt-12 text-center pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500 font-medium">
                New volunteer? 
                <button 
                  onClick={() => handleBack("/register-user")} 
                  className="text-blue-600 font-black ml-1.5 hover:underline"
                >
                  Register here
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}