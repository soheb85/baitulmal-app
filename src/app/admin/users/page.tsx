"use client";

import { useState, useEffect, useCallback } from "react";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import { getAllUsers, updateUserAdmin, deleteUser } from "@/app/actions/userActions";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, ShieldCheck, Trash2, Edit3, CheckCircle2, 
  XCircle, Search, Lock, Unlock, Landmark, PenTool, Database, Clock
} from "lucide-react";

// --- TYPES ---
interface IUser {
  _id: string;
  name: string;
  username: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'USER';
  isApproved: boolean;
  hasCollectionAccess: boolean;
  canSubmitCollection: boolean;
  canApproveCollection: boolean;
}

interface PermissionBadgeProps {
  icon: React.ReactNode;
  text: string;
  color: 'blue' | 'emerald' | 'amber' | 'gray';
}

interface PermissionToggleProps {
  title: string;
  desc: string;
  active: boolean;
  onClick: () => void;
}

export default function UserManagementPage() {
  const { isNavigating, handleBack } = useBackNavigation("/");
  
  const [loading, setLoading] = useState<boolean>(true);
  const [users, setUsers] = useState<IUser[]>([]);
  const [search, setSearch] = useState<string>("");
  
  // States for Editing
  const [editingUser, setEditingUser] = useState<IUser | null>(null);
  const [isUpdating, setIsUpdating] = useState<boolean>(false);

  const loadUsers = useCallback(async () => {
    try {
      const data = await getAllUsers();
      setUsers(data);
    } catch (error) {
      console.error("Failed to load users:", error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadUsers();
  }, [loadUsers]);

  const handleUpdate = async () => {
    if (!editingUser) return;
    setIsUpdating(true);
    
    const res = await updateUserAdmin(editingUser._id, editingUser);
    if (res.success) {
      setEditingUser(null);
      await loadUsers(); 
    } else {
      alert(res.message);
    }
    setIsUpdating(false);
  };

  const handleDelete = async (id: string) => {
    if (!window.confirm("Are you sure? This user will be permanently removed.")) return;
    setLoading(true); 
    const res = await deleteUser(id);
    if (res.success) {
      await loadUsers();
    } else {
      alert(res.message);
      setLoading(false);
    }
  };

  const filteredUsers = users.filter(u => 
    u.name.toLowerCase().includes(search.toLowerCase()) || 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  if (isNavigating) return <NavigationLoader message="Routing..." />;
  if (loading) return <NavigationLoader message="Securing Personnel Data..." />;

  return (
    <main className="min-h-screen flex flex-col items-center w-full max-w-md mx-auto shadow-2xl bg-gray-50 dark:bg-gray-950 relative font-outfit">
      <div className="w-full h-full overflow-y-auto px-4 pt-6 pb-32">
        
        {/* Header Block */}
        <div className="bg-white dark:bg-gray-900 p-4 rounded-3xl border border-gray-100 dark:border-gray-800 shadow-sm mb-6 space-y-4">
          <div className="flex items-center gap-3">
            <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition">
              <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-300" />
            </button>
            <div>
              <h1 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight">Staff Registry</h1>
              <p className="text-[10px] font-bold text-amber-600 uppercase tracking-widest">{users.length} Registered Volunteers</p>
            </div>
          </div>

          <div className="relative">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
            <input 
              type="text" 
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-11 pr-4 py-3.5 rounded-2xl bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-800 outline-none font-bold text-sm text-gray-900 dark:text-white focus:border-amber-500 transition-all"
            />
          </div>
        </div>

        {/* User List */}
        <div className="space-y-4">
          {filteredUsers.map((user) => (
            <div key={user._id} className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm">
              <div className="flex justify-between items-start mb-4">
                <div className="flex items-center gap-3">
                  <div className={`w-12 h-12 rounded-2xl flex items-center justify-center font-black text-lg ${user.isApproved ? 'bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20' : 'bg-rose-50 text-rose-600 dark:bg-rose-900/20'}`}>
                    {user.name[0]}
                  </div>
                  <div>
                    <h3 className="font-black text-gray-900 dark:text-white leading-tight">{user.name}</h3>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-tighter">@{user.username}</p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1">
                  <span className={`text-[8px] font-black px-2 py-0.5 rounded-full uppercase tracking-widest ${user.role === 'ADMIN' ? 'bg-purple-100 text-purple-700 dark:bg-purple-900/30 dark:text-purple-400' : 'bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400'}`}>
                    {user.role}
                  </span>
                  {user.isApproved ? 
                    <span className="text-[8px] font-black text-emerald-600 uppercase flex items-center gap-1"><CheckCircle2 className="w-2.5 h-2.5"/> Active</span> :
                    <span className="text-[8px] font-black text-rose-500 uppercase flex items-center gap-1"><Clock className="w-2.5 h-2.5"/> Pending</span>
                  }
                </div>
              </div>

              {/* Permission Badges Preview */}
              <div className="flex flex-wrap gap-1.5 mb-5">
                 {user.hasCollectionAccess && <PermissionBadge icon={<Landmark className="w-2.5 h-2.5"/>} text="Hub Access" color="blue"/>}
                 {user.canSubmitCollection && <PermissionBadge icon={<PenTool className="w-2.5 h-2.5"/>} text="Submitter" color="emerald"/>}
                 {user.canApproveCollection && <PermissionBadge icon={<ShieldCheck className="w-2.5 h-2.5"/>} text="Approver" color="amber"/>}
              </div>

              <div className="flex gap-2 pt-4 border-t border-gray-50 dark:border-gray-800">
                <button 
                  onClick={() => setEditingUser({...user})}
                  className="flex-1 py-3 bg-gray-900 dark:bg-white text-white dark:text-gray-900 rounded-xl text-[10px] font-black uppercase tracking-widest flex items-center justify-center gap-2 active:scale-95 transition-transform"
                >
                  <Edit3 className="w-3.5 h-3.5" /> Edit Permissions
                </button>
                <button 
                  onClick={() => handleDelete(user._id)}
                  className="p-3 bg-rose-50 dark:bg-rose-900/20 text-rose-600 rounded-xl active:scale-90 transition-transform border border-rose-100 dark:border-rose-900/30"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            </div>
          ))}

          {filteredUsers.length === 0 && (
            <div className="text-center py-10 opacity-50">
               <p className="text-xs font-black uppercase tracking-widest">No users found</p>
            </div>
          )}
        </div>
      </div>

      {/* --- EDIT MODAL (Centered to match max-w-md container) --- */}
      {editingUser && (
        <div className="fixed inset-0 z-50 flex items-end sm:items-center justify-center bg-black/60 backdrop-blur-sm p-4 animate-in fade-in">
          {/* Constrain width to match main app layout */}
          <div className="bg-white dark:bg-gray-900 w-full max-w-md rounded-[2.5rem] shadow-2xl p-6 sm:p-8 animate-in slide-in-from-bottom-10 sm:zoom-in-95 duration-300">
            <div className="flex justify-between items-start mb-6">
               <div>
                  <h2 className="text-lg font-black text-gray-900 dark:text-white uppercase tracking-tight flex items-center gap-2">
                    <ShieldCheck className="w-5 h-5 text-amber-600" /> Access Control
                  </h2>
                  <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">Target: {editingUser.name}</p>
               </div>
               <button onClick={() => setEditingUser(null)} className="p-1.5 bg-gray-100 dark:bg-gray-800 rounded-full active:scale-90 transition-transform"><XCircle className="w-5 h-5 text-gray-400" /></button>
            </div>

            <div className="space-y-5">
               {/* Account Status */}
               <div className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl border border-gray-100 dark:border-gray-700">
                  <div className="flex items-center gap-3">
                     <div className={`p-2 rounded-lg ${editingUser.isApproved ? 'bg-emerald-100 text-emerald-600' : 'bg-rose-100 text-rose-600'}`}>
                        {editingUser.isApproved ? <Unlock className="w-4 h-4"/> : <Lock className="w-4 h-4"/>}
                     </div>
                     <p className="text-[10px] font-black uppercase tracking-widest">System Access</p>
                  </div>
                  <Toggle active={editingUser.isApproved} onClick={() => setEditingUser({...editingUser, isApproved: !editingUser.isApproved})} />
               </div>

               {/* Role Selection */}
               <div className="space-y-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1">Account Role</label>
                  <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl">
                     {(['USER', 'ADMIN'] as const).map(r => (
                        <button 
                          key={r}
                          onClick={() => setEditingUser({...editingUser, role: r})}
                          className={`flex-1 py-2.5 rounded-lg text-[10px] font-black transition-all ${editingUser.role === r ? 'bg-white dark:bg-gray-900 text-amber-600 shadow-sm' : 'text-gray-400'}`}
                        >
                          {r}
                        </button>
                     ))}
                  </div>
               </div>

               {/* Collection Permissions */}
               <div className="space-y-2.5 pt-2">
                  <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest ml-1 flex items-center gap-2"><Database className="w-3 h-3"/> Financial Permissions</label>
                  
                  <PermissionToggle 
                    title="View Collection Hub" 
                    desc="Allows user to see the collections card"
                    active={editingUser.hasCollectionAccess}
                    onClick={() => setEditingUser({...editingUser, hasCollectionAccess: !editingUser.hasCollectionAccess})}
                  />
                  <PermissionToggle 
                    title="Submit Challans" 
                    desc="Allows user to create new collections"
                    active={editingUser.canSubmitCollection}
                    onClick={() => setEditingUser({...editingUser, canSubmitCollection: !editingUser.canSubmitCollection})}
                  />
                  <PermissionToggle 
                    title="Verify & Approve" 
                    desc="Control over other's submissions"
                    active={editingUser.canApproveCollection}
                    onClick={() => setEditingUser({...editingUser, canApproveCollection: !editingUser.canApproveCollection})}
                  />
               </div>

               <button 
                onClick={handleUpdate}
                disabled={isUpdating}
                className="w-full py-4 bg-amber-600 hover:bg-amber-700 text-white font-black rounded-2xl shadow-lg shadow-amber-500/20 active:scale-95 transition-all mt-4 flex items-center justify-center gap-2 disabled:opacity-50 text-[11px] uppercase tracking-widest"
               >
                 {isUpdating ? <span className="animate-pulse">Saving Changes...</span> : <><CheckCircle2 className="w-4 h-4"/> Confirm & Update</>}
               </button>
            </div>
          </div>
        </div>
      )}
    </main>
  );
}

// --- HELPER UI COMPONENTS ---

function PermissionBadge({ icon, text, color }: PermissionBadgeProps) {
  const colors = {
    blue: "bg-blue-50 text-blue-600 dark:bg-blue-900/20 dark:text-blue-400 border-blue-100 dark:border-blue-900/50",
    emerald: "bg-emerald-50 text-emerald-600 dark:bg-emerald-900/20 dark:text-emerald-400 border-emerald-100 dark:border-emerald-900/50",
    amber: "bg-amber-50 text-amber-600 dark:bg-amber-900/20 dark:text-amber-400 border-amber-100 dark:border-amber-900/50",
    gray: "bg-gray-50 text-gray-500 dark:bg-gray-800 dark:text-gray-400 border-gray-200 dark:border-gray-700"
  };
  
  return (
    <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[8px] font-black uppercase tracking-widest ${colors[color]}`}>
      {icon} {text}
    </div>
  );
}

function PermissionToggle({ title, desc, active, onClick }: PermissionToggleProps) {
  return (
    <div className="flex items-center justify-between p-3.5 rounded-2xl border border-gray-100 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm">
       <div>
          <p className="text-[10px] font-black uppercase tracking-tight text-gray-900 dark:text-white">{title}</p>
          <p className="text-[8px] font-bold text-gray-400 mt-0.5">{desc}</p>
       </div>
       <Toggle active={active} onClick={onClick} />
    </div>
  );
}

function Toggle({ active, onClick }: { active: boolean, onClick: () => void }) {
  return (
    <button 
      onClick={onClick}
      className={`w-10 h-5 rounded-full relative transition-colors duration-300 shrink-0 ${active ? 'bg-emerald-500' : 'bg-gray-200 dark:bg-gray-700'}`}
    >
      <div className={`absolute top-1 w-3 h-3 rounded-full bg-white transition-all duration-300 shadow-sm ${active ? 'left-6' : 'left-1'}`} />
    </button>
  );
}