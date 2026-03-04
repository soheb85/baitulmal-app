/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
// Make sure deleteUser is imported
import { getPendingUsers, getAllUsers, approveUser, deleteUser } from "@/app/actions/userActions"; 
import { ArrowLeft, UserCheck, ShieldAlert, Loader2, CheckCircle2, Clock, Trash2 } from "lucide-react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"PENDING" | "ALL">("PENDING");
  
  const { isNavigating, handleBack } = useBackNavigation("/");

  // Fetch Data based on active tab
  useEffect(() => {
    async function loadData() {
        setLoading(true);
        const data = activeTab === "PENDING" 
            ? await getPendingUsers() 
            : await getAllUsers();
        setUsers(data);
        setLoading(false);
    }
    loadData();
  }, [activeTab]);

  const handleApprove = async (userId: string) => {
      if(!confirm("Approve this user?")) return;
      await approveUser(userId);
      
      // Optimistic Update
      setUsers(prev => 
        activeTab === "PENDING" 
            ? prev.filter(u => u._id !== userId)
            : prev.map(u => u._id === userId ? {...u, isApproved: true} : u)
      );
  };

  // --- NEW: Handle Reject/Delete ---
  const handleDelete = async (userId: string, isApproved: boolean) => {
      const action = isApproved ? "DELETE" : "REJECT";
      if(!confirm(`Are you sure you want to ${action} this user? This cannot be undone.`)) return;

      const res = await deleteUser(userId);
      
      if(res.success) {
          // Remove from list immediately
          setUsers(prev => prev.filter(u => u._id !== userId));
      } else {
          alert("Failed to remove user.");
      }
  };

  if (isNavigating) return <NavigationLoader message="Returning to Dashboard..." />;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit transition-colors duration-300">
      
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
            onClick={() => setActiveTab("PENDING")}
            className={`px-6 py-2.5 rounded-xl text-xs font-bold uppercase tracking-wider transition-all ${
                activeTab === "PENDING" 
                ? "bg-white dark:bg-gray-700 text-gray-900 dark:text-white shadow-sm" 
                : "text-gray-500 hover:text-gray-700 dark:hover:text-gray-300"
            }`}
          >
            Pending
          </button>
          <button 
            onClick={() => setActiveTab("ALL")}
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
              className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm hover:shadow-md transition-shadow"
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
                      <p className="font-bold text-gray-900 dark:text-white text-lg leading-none truncate">
                        {user.name}
                      </p>
                      {/* Status Icon */}
                      {user.isApproved 
                          ? <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" /> 
                          : <Clock className="w-4 h-4 text-orange-500 shrink-0" />
                      }
                  </div>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium font-mono truncate">
                    @{user.username}
                  </p>
                </div>
              </div>

              {/* Action Buttons Row */}
              <div className="flex items-center gap-2">
                  
                  {/* Approve Button (Only if pending) */}
                  {!user.isApproved && (
                      <button 
                        onClick={() => handleApprove(user._id)}
                        className="bg-green-600 hover:bg-green-700 text-white px-5 py-2.5 rounded-xl text-xs font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95"
                      >
                        Approve
                      </button>
                  )}

                  {/* Reject / Delete Button */}
                  <button 
                    onClick={() => handleDelete(user._id, user.isApproved)}
                    className="p-3 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-900/40 transition-colors active:scale-95"
                    title={user.isApproved ? "Delete User" : "Reject Request"}
                  >
                    <Trash2 className="w-5 h-5" />
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
          <strong>Security Notice:</strong> Only approve users you personally know. Removing a user immediately revokes their access.
        </p>
      </div>
    </div>
  );
}