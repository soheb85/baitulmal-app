/* eslint-disable @typescript-eslint/no-explicit-any */
import { getPendingUsers, approveUser } from "@/app/actions/userActions";
import { getSession } from "@/app/actions/authActions";
import { redirect } from "next/navigation";
import { ArrowLeft, UserCheck, ShieldAlert } from "lucide-react";
import Link from "next/link";

export default async function AdminUsersPage() {
  const session = await getSession();
  
  // Security: Only Super Admin can access this page
  if (session?.role !== "SUPER_ADMIN") redirect("/");

  const pendingUsers = await getPendingUsers();

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 font-outfit transition-colors duration-300">
      
      {/* --- Header --- */}
      <div className="flex items-center gap-4 mb-8">
        <Link 
          href="/" 
          className="p-3 bg-white dark:bg-gray-900 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-800 text-gray-600 dark:text-gray-300"
        >
          <ArrowLeft className="w-5 h-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-black text-gray-900 dark:text-white">User Approvals</h1>
          <p className="text-xs font-medium text-gray-500 dark:text-gray-400 uppercase tracking-widest">Super Admin Portal</p>
        </div>
      </div>

      <div className="space-y-4">
        {pendingUsers.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-20 bg-white dark:bg-gray-900 rounded-3xl border border-dashed border-gray-200 dark:border-gray-800">
             <UserCheck className="w-12 h-12 text-gray-300 dark:text-gray-700 mb-2" />
             <p className="text-gray-500 dark:text-gray-400 font-medium">No pending approvals at the moment.</p>
          </div>
        ) : (
          pendingUsers.map((user: any) => (
            <div 
              key={user._id} 
              className="bg-white dark:bg-gray-900 p-5 rounded-3xl border border-gray-100 dark:border-gray-800 flex justify-between items-center shadow-sm"
            >
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-green-50 dark:bg-green-900/20 rounded-2xl flex items-center justify-center text-green-600 font-bold text-xl">
                  {user.name.charAt(0)}
                </div>
                <div>
                  <p className="font-bold text-gray-900 dark:text-white text-lg leading-none">
                    {user.name}
                  </p>
                  <p className="text-sm text-gray-500 dark:text-gray-400 mt-1 font-medium">
                    @{user.username}
                  </p>
                </div>
              </div>

              <form action={async () => {
                "use server";
                await approveUser(user._id.toString());
              }}>
                <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-2xl text-sm font-bold shadow-lg shadow-green-200 dark:shadow-none transition-all active:scale-95">
                  Approve
                </button>
              </form>
            </div>
          ))
        )}
      </div>

      {/* Security Tip */}
      <div className="mt-10 p-4 bg-amber-50 dark:bg-amber-900/10 border border-amber-100 dark:border-amber-900/30 rounded-2xl flex gap-3 items-start">
        <ShieldAlert className="w-5 h-5 text-amber-600 shrink-0 mt-0.5" />
        <p className="text-[11px] text-amber-800 dark:text-amber-200 leading-relaxed font-medium">
          <strong>Security Notice:</strong> Approving a user grants them full access to register families and distribute ration. Please verify the identity of the volunteer before clicking approve.
        </p>
      </div>
    </div>
  );
}