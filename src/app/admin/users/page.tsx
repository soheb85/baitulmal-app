/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getPendingUsers, getAllUsers, approveUser, updateUserRole, deleteUser } from "@/app/actions/userActions"; 
import { ArrowLeft, UserCheck, ShieldAlert, Loader2, CheckCircle2, Clock, Trash2, Shield } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true); // True by default for the first load
  const [activeTab, setActiveTab] = useState<"PENDING" | "ALL">("PENDING");
  const [processingId, setProcessingId] = useState<string | null>(null);
  
  const { isNavigating, handleBack } = useBackNavigation("/");

  // --- Fetch Data (React 18 Safe) ---
  useEffect(() => {
    let isMounted = true;

    async function loadData() {
        // ❌ NO setLoading(true) here! It causes the cascading render warning.
        const data = activeTab === "PENDING" 
            ? await getPendingUsers() 
            : await getAllUsers();
            
        if (isMounted) {
            setUsers(data);
            setLoading(false); // Safe to call after async operation
        }
    }
    
    loadData();

    return () => {
      isMounted = false;
    };
  }, [activeTab]);

  // --- Handle Approve with Role ---
  const handleApprove = async (userId: string, role: "USER" | "ADMIN") => {
      if(!confirm(`Approve this user as ${role}?`)) return;
      
      setProcessingId(userId);
      const res = await approveUser(userId, role);
      
      if (res.success) {
        setUsers(prev => prev.filter(u => u._id !== userId));
      } else {
        alert(res.message);
      }
      setProcessingId(null);
  };

  // --- Handle Role Change ---
  const handleRoleChange = async (userId: string, newRole: "USER" | "ADMIN") => {
      if(!confirm(`Change this user's role to ${newRole}?`)) return;
      
      setProcessingId(userId);
      const res = await updateUserRole(userId, newRole);
      
      if (res.success) {
        setUsers(prev => prev.map(u => u._id === userId ? { ...u, role: newRole } : u));
      } else {
        alert(res.message);
      }
      setProcessingId(null);
  };

  // --- Handle Reject/Delete ---
  const handleDelete = async (userId: string, isApproved: boolean) => {
      const action = isApproved ? "DELETE" : "REJECT";
      if(!confirm(`Are you sure you want to ${action} this user? This cannot be undone.`)) return;

      setProcessingId(userId);
      const res = await deleteUser(userId);
      
      if(res.success) {
          setUsers(prev => prev.filter(u => u._id !== userId));
      } else {
          alert("Failed to remove user.");
      }
      setProcessingId(null);
  };

  if (isNavigating) return <NavigationLoader message="Returning to Dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit transition-colors duration-300 pb-20">
      
      {/* --- Header --- */}
      <div className="flex items-center gap-4 mb-6">
        <button 
          onClick={() => handleBack()} 
          className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300 active:scale-95 transition-transform"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">User Management</h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">Super Admin Portal</p>
        </div>
      </div>

      {/* --- Tabs --- */}
      <div className="flex p-1 bg-gray-200 dark:bg-gray-800 rounded-2xl mb-8 w-fit mx-auto sm:mx-0">
          <button 
            onClick={() => {
              if (activeTab !== "PENDING") {
                setLoading(true); // Triggers loading safely
                setActiveTab("PENDING");
              }
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "PENDING" 
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => {
              if (activeTab !== "ALL") {
                setLoading(true); // Triggers loading safely
                setActiveTab("ALL");
              }
            }}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "ALL" 
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            All Users
          </button>
      </div>

      {/* --- List Content --- */}
      <div className="space-y-4">
        {loading ? (
            <div className="flex flex-col items-center justify-center py-20">
                <Loader2 className="w-8 h-8 animate-spin text-gray-400" />
            </div>
        ) : users.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
             <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" />
             <p className="text-gray-500 dark:text-gray-400 font-medium">
                {activeTab === "PENDING" ? "No pending approvals." : "No users found."}
             </p>
          </div>
        ) : (
          users.map((user: any) => (
            <div 
              key={user._id} 
              className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row justify-between sm:items-center gap-4 shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-4">
                <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-xl shrink-0 ${
                    user.isApproved 
                    ? "bg-blue-50 dark:bg-blue-900/20 text-blue-600" 
                    : "bg-orange-50 dark:bg-orange-900/20 text-orange-600"
                }`}>
                  {user.name?.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-bold text-gray-900 dark:text-white text-lg leading-none truncate flex items-center gap-1.5">
                        {user.name}
                        {user.role === "ADMIN" && <Shield className="w-4 h-4 text-purple-500" />}
                      </p>
                      {/* Status Icon */}
                      {user.isApproved 
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 
                          : <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                      }
                  </div>
                  
                  {/* --- NEW EMAIL LAYOUT HERE --- */}
                  <div className="flex flex-col mt-1">
                      <p className="text-sm text-gray-500 dark:text-gray-400 font-medium font-mono truncate">
                        @{user.username}
                      </p>
                      {user.email && (
                        <p className="text-[11px] text-gray-400 dark:text-gray-500 font-medium truncate mt-0.5">
                          {user.email}
                        </p>
                      )}
                  </div>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2 shrink-0">
                  
                  {/* Approve Buttons (Only if pending) */}
                  {!user.isApproved && (
                      <div className="flex gap-2 w-full sm:w-auto">
                          <button 
                            onClick={() => handleApprove(user._id, "USER")}
                            disabled={processingId === user._id}
                            className="bg-blue-50 hover:bg-blue-600 text-blue-600 hover:text-white dark:bg-blue-900/20 dark:hover:bg-blue-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            {processingId === user._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "VOLUNTEER"}
                          </button>
                          <button 
                            onClick={() => handleApprove(user._id, "ADMIN")}
                            disabled={processingId === user._id}
                            className="bg-purple-50 hover:bg-purple-600 text-purple-600 hover:text-white dark:bg-purple-900/20 dark:hover:bg-purple-600 px-4 py-2.5 rounded-xl text-xs font-bold transition-all active:scale-95 flex items-center gap-1.5"
                          >
                            {processingId === user._id ? <Loader2 className="w-4 h-4 animate-spin" /> : "ADMIN"}
                          </button>
                      </div>
                  )}

                  {/* Role Change Dropdown (Only if approved) */}
                  {user.isApproved && (
                      <select 
                        value={user.role || "USER"}
                        onChange={(e) => handleRoleChange(user._id, e.target.value as "USER" | "ADMIN")}
                        disabled={processingId === user._id}
                        className={`text-xs font-black uppercase tracking-widest p-2.5 rounded-xl border outline-none cursor-pointer transition-colors ${
                          user.role === 'ADMIN' 
                            ? 'bg-purple-50 border-purple-200 text-purple-700 dark:bg-purple-900/20 dark:border-purple-800' 
                            : 'bg-blue-50 border-blue-200 text-blue-700 dark:bg-blue-900/20 dark:border-blue-800'
                        }`}
                      >
                        <option value="USER">Volunteer</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                  )}

                  {/* Reject / Delete Button */}
                  <button 
                    onClick={() => handleDelete(user._id, user.isApproved)}
                    disabled={processingId === user._id}
                    className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95"
                    title={user.isApproved ? "Delete User" : "Reject Request"}
                  >
                    {processingId === user._id ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
                  </button>

              </div>
            </div>
          ))
        )}
      </div>

      {/* Security Tip */}
      <div className="mt-10 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
          <strong>Security Notice:</strong> Admins can view reports and inventory. Only approve users you personally know. Removing a user immediately revokes their access.
        </p>
      </div>
    </div>
  );
}