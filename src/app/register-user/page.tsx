"use client";

import { useState, useEffect, useRef } from "react";
import { registerUser, checkAvailability } from "@/app/actions/userActions";
import { UserPlus, Lock, User, Loader2, ArrowLeft, Phone, Mail, CheckCircle2, ShieldAlert } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation"; 
import NavigationLoader from "@/components/ui/NavigationLoader"; 

export default function RegisterUserPage() {
  const [formData, setFormData] = useState({ name: "", username: "", email: "", password: "" });
  const [loading, setLoading] = useState(false);
  const [statusMsg, setStatusMsg] = useState<{ success: boolean; message: string } | null>(null);

  // Live checking states
  const [userStatus, setUserStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");
  const [emailStatus, setEmailStatus] = useState<"idle" | "checking" | "available" | "taken">("idle");

  const { isNavigating, handleBack } = useBackNavigation("/");
  
  // Separate refs so they don't cancel each other out
  const usernameTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const emailTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  // --- Live Validation for Username (Mobile Number) ---
  useEffect(() => {
    const mobile = formData.username;

    if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);

    // Everything wrapped inside setTimeout to prevent synchronous cascading renders
    usernameTimeoutRef.current = setTimeout(async () => {
      if (mobile.length !== 10) {
        setUserStatus(prev => prev !== "idle" ? "idle" : prev); // Only update if needed
        return;
      }

      setUserStatus("checking");
      const res = await checkAvailability("username", mobile);
      setUserStatus(res.available ? "available" : "taken");
    }, 500);

    return () => {
      if (usernameTimeoutRef.current) clearTimeout(usernameTimeoutRef.current);
    };
  }, [formData.username]);

  // --- Live Validation for Email ---
  useEffect(() => {
    const email = formData.email;

    if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);

    emailTimeoutRef.current = setTimeout(async () => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(email)) {
        setEmailStatus(prev => prev !== "idle" ? "idle" : prev);
        return;
      }

      setEmailStatus("checking");
      const res = await checkAvailability("email", email);
      setEmailStatus(res.available ? "available" : "taken");
    }, 500);

    return () => {
      if (emailTimeoutRef.current) clearTimeout(emailTimeoutRef.current);
    };
  }, [formData.email]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (userStatus === "taken") return alert("This mobile number is already registered.");
    if (emailStatus === "taken") return alert("This email is already registered.");
    if (formData.username.length !== 10) return alert("Mobile number must be exactly 10 digits.");

    setLoading(true);
    setStatusMsg(null);
    
    const res = await registerUser(formData);
    
    if (res.success) {
      setStatusMsg({ success: true, message: res.message });
      setFormData({ name: "", username: "", email: "", password: "" });
      setUserStatus("idle");
      setEmailStatus("idle");
    } else {
      setStatusMsg({ success: false, message: res.message });
      setLoading(false);
    }
  };

  if (isNavigating) return <NavigationLoader message="Redirecting..." />;

  const isFormValid = 
    formData.name.trim().length > 2 &&
    formData.password.length >= 6 &&
    userStatus === "available" &&
    emailStatus === "available";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col justify-center px-6 font-outfit relative py-12">
      
      {/* --- Back Button --- */}
      <button 
        onClick={() => handleBack("/login")}
        className="absolute top-8 left-6 p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 active:scale-90 transition-transform"
      >
        <ArrowLeft className="w-6 h-6 text-gray-600 dark:text-gray-300" />
      </button>

      <div className="max-w-md w-full mx-auto animate-in fade-in slide-in-from-bottom-4 duration-500">
        
        <div className="text-center mb-10">
          <div className="bg-green-100 dark:bg-green-900/30 w-16 h-16 rounded-3xl flex items-center justify-center mx-auto mb-4">
            <UserPlus className="w-8 h-8 text-green-600" />
          </div>
          <h2 className="text-3xl font-black text-gray-900 dark:text-white leading-tight">Register Member</h2>
          <p className="text-gray-500 mt-2">Create an account to manage distributions</p>
        </div>

        {statusMsg && statusMsg.success ? (
          <div className="bg-white dark:bg-gray-900 p-8 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-xl text-center space-y-4">
            <CheckCircle2 className="w-16 h-16 text-green-500 mx-auto animate-bounce" />
            <h3 className="text-xl font-black text-gray-900 dark:text-white">Account Created!</h3>
            <p className="text-sm font-medium text-gray-500">Your account is pending Super Admin approval. You will not be able to log in until approved.</p>
            <button onClick={() => handleBack("/login")} className="w-full py-4 mt-4 bg-green-600 hover:bg-green-700 text-white font-bold rounded-2xl transition-colors">
              Return to Login
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-4">
            
            {/* Full Name */}
            <div className="relative">
              <User className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                required
                placeholder="Your Full Name"
                className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-green-500 outline-none font-bold dark:text-white"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />
            </div>

            {/* Mobile Number */}
            <div>
              <div className="relative">
                <Phone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="tel"
                  maxLength={10}
                  placeholder="10-Digit Mobile Number"
                  value={formData.username}
                  onChange={(e) => setFormData({ ...formData, username: e.target.value.replace(/\D/g, '') })}
                  className={`w-full p-4 pl-12 pr-12 rounded-2xl border-2 outline-none font-bold dark:text-white transition-all bg-white dark:bg-gray-900 shadow-sm ${
                    userStatus === "taken" ? "border-red-400 focus:ring-red-500" : 
                    userStatus === "available" ? "border-green-400 focus:ring-green-500" : "border-transparent focus:ring-green-500"
                  }`}
                />
                <div className="absolute right-4 top-4">
                  {userStatus === "checking" && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                  {userStatus === "available" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {userStatus === "taken" && <ShieldAlert className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {userStatus === "taken" && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">Number already registered</p>}
            </div>

            {/* Email Address */}
            <div>
              <div className="relative">
                <Mail className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  required
                  type="email"
                  placeholder="Email Address"
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value.toLowerCase() })}
                  className={`w-full p-4 pl-12 pr-12 rounded-2xl border-2 outline-none font-bold dark:text-white transition-all bg-white dark:bg-gray-900 shadow-sm ${
                    emailStatus === "taken" ? "border-red-400 focus:ring-red-500" : 
                    emailStatus === "available" ? "border-green-400 focus:ring-green-500" : "border-transparent focus:ring-green-500"
                  }`}
                />
                <div className="absolute right-4 top-4">
                  {emailStatus === "checking" && <Loader2 className="w-5 h-5 text-gray-400 animate-spin" />}
                  {emailStatus === "available" && <CheckCircle2 className="w-5 h-5 text-green-500" />}
                  {emailStatus === "taken" && <ShieldAlert className="w-5 h-5 text-red-500" />}
                </div>
              </div>
              {emailStatus === "taken" && <p className="text-[10px] text-red-500 font-bold mt-1 ml-2">Email already in use</p>}
            </div>

            {/* Password */}
            <div className="relative">
              <Lock className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
              <input
                required
                type="password"
                placeholder="Create Password (Min 6)"
                className="w-full p-4 pl-12 rounded-2xl border-none bg-white dark:bg-gray-900 shadow-sm focus:ring-2 focus:ring-green-500 outline-none font-bold dark:text-white"
                value={formData.password}
                onChange={(e) => setFormData({ ...formData, password: e.target.value })}
              />
            </div>

            {statusMsg && !statusMsg.success && (
              <div className="p-3 bg-red-50 text-red-600 rounded-xl text-sm font-bold text-center border border-red-100">
                {statusMsg.message}
              </div>
            )}

            <button
              disabled={loading || !isFormValid}
              className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-300 text-white font-black py-4 rounded-2xl shadow-lg transition-all active:scale-95 flex items-center justify-center gap-2 mt-4"
            >
              {loading ? <Loader2 className="animate-spin w-5 h-5" /> : "Request Access"}
            </button>
          </form>
        )}

        {!statusMsg?.success && (
          <p className="text-center text-sm text-gray-500 mt-8">
            Already have an account? 
            <button 
              onClick={() => handleBack("/login")} 
              className="text-green-600 font-bold ml-1 hover:underline"
            >
              Login
            </button>
          </p>
        )}
      </div>
    </div>
  );
}