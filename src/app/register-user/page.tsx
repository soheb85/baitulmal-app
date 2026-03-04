"use client";

import { useState } from "react";
import { registerUser } from "@/app/actions/userActions";
import { UserPlus, Lock, User, Loader2, ArrowLeft } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation"; // Import Hook
import NavigationLoader from "@/components/ui/NavigationLoader"; // Import Loader

export default function RegisterUserPage() {
  const [formData, setFormData] = useState({ name: "", username: "", password: "" });
  const [loading, setLoading] = useState(false);
  
  // Initialize Navigation Hook
  const { isNavigating, handleBack } = useBackNavigation("/");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    const res = await registerUser(formData);
    
    if (res.success) {
      alert(res.message);
      // Use handleBack to show loader while redirecting to login
      handleBack("/login");
    } else {
      alert(res.message);
      setLoading(false);
    }
  };

  // Show Full Screen Loader if navigating away
  if (isNavigating) return <NavigationLoader message="Redirecting..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-6 font-outfit relative">
      
      {/* --- Back Button (Using handleBack) --- */}
      <button 
        onClick={() => handleBack("/")}
        className="absolute top-8 left-6 p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-90 transition-transform"
      >
        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="max-w-md w-full mx-auto space-y-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="text-center">
          <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Register Member</h2>
          <p className="text-gray-500 mt-2">Create an account to manage distributions</p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="relative">
            <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              required
              placeholder="Your Full Name"
              className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
            />
          </div>

          <div className="relative">
            <span className="absolute left-4 top-4 font-bold text-gray-400">@</span>
            <input
              required
              placeholder="username"
              className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
              onChange={(e) => setFormData({ ...formData, username: e.target.value.toLowerCase() })}
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
            <input
              required
              type="password"
              placeholder="Create Password"
              className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-green-500 outline-none"
              onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            />
          </div>

          <button
            disabled={loading}
            className="w-full bg-green-600 hover:bg-green-700 text-white font-bold py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2"
          >
            {loading ? <Loader2 className="animate-spin" /> : "Request Access"}
          </button>
        </form>

        <p className="text-center text-sm text-gray-500">
          Already have an account? 
          <button 
            onClick={() => handleBack("/login")} 
            className="text-green-600 font-bold ml-1 hover:underline"
          >
            Login
          </button>
        </p>
      </div>
    </div>
  );
}