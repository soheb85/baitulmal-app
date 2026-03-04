"use client";

import { useState } from "react";
import { loginUser } from "@/app/actions/authActions";
import { Lock, LogIn, Loader2, ShieldCheck, ArrowLeft } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation"; // Import Hook
import NavigationLoader from "@/components/ui/NavigationLoader"; // Import Loader

export default function LoginPage() {
  const [formData, setFormData] = useState({ username: "", password: "" });
  const [loading, setLoading] = useState(false);
  
  // Initialize Navigation Hook
  const { isNavigating, handleBack } = useBackNavigation("/");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await loginUser(formData);
    
    if (res.success) {
      // Use handleBack to show loader while directing to Dashboard
      handleBack("/");
    } else {
      alert(res.message);
      setLoading(false);
    }
  };

  // Show Full Screen Loader if navigating away
  if (isNavigating) return <NavigationLoader message="Signing In..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-6 font-outfit relative">
      
      {/* --- Back Button (Using handleBack) --- */}
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
          <h2 className="text-3xl font-black text-gray-900 dark:text-white">Member Or Trusty Login</h2>
          <p className="text-gray-500 mt-2">Enter your credentials to continue</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div className="relative">
            <span className="absolute left-4 top-4 font-bold text-gray-400">@</span>
            <input
              required
              placeholder="username"
              className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              required
              type="password"
              placeholder="Password"
              className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-blue-500 outline-none"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : <LogIn className="w-5 h-5" />}
            Sign In
          </button>
        </form>

        <div className="mt-12 text-center pt-6 border-t border-gray-100 dark:border-gray-800">
            <p className="text-sm text-gray-500">
                New volunteer? 
                <button 
                  onClick={() => handleBack("/register-user")} 
                  className="text-blue-600 font-bold ml-1 hover:underline"
                >
                  Register here
                </button>
            </p>
        </div>
      </div>
    </div>
  );
}