/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { getWebConfig, updateWebConfig } from "@/app/actions/admin/webConfigActions";
import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import { 
  ArrowLeft, Settings2, Save, Loader2, CalendarDays, 
  Ticket, AlertOctagon, Megaphone, Power
} from "lucide-react";

export default function WebConfigPage() {
  const { isNavigating, handleBack } = useBackNavigation("/admin/advanced-tools");
  
  const [config, setConfig] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    async function loadConfig() {
      const res = await getWebConfig();
      if (res.success) {
        setConfig(res.data);
      }
      setLoading(false);
    }
    loadConfig();
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    
    if (type === 'checkbox') {
      const checked = (e.target as HTMLInputElement).checked;
      setConfig({ ...config, [name]: checked });
    } else if (type === 'number') {
      setConfig({ ...config, [name]: Number(value) });
    } else {
      setConfig({ ...config, [name]: value });
    }
  };

  const handleSave = async () => {
    setSaving(true);
    const res = await updateWebConfig(config);
    if (res.success) {
      alert("Global Configuration updated successfully!");
    } else {
      alert("Error: " + res.message);
    }
    setSaving(false);
  };

  if (isNavigating) return <NavigationLoader message="Routing..." />;

  if (loading) return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex flex-col items-center justify-center">
      <Loader2 className="w-10 h-10 animate-spin text-teal-600 mb-4" />
      <p className="font-bold text-gray-500 uppercase tracking-widest text-sm">Loading Config...</p>
    </div>
  );

  return (
    <main className="min-h-screen flex flex-col w-full bg-gray-50 dark:bg-gray-950 font-outfit relative overflow-x-hidden">
      
      {/* Header */}
      <header className="px-4 py-5 bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-20 shadow-sm w-full min-w-0">
        <div className="flex items-center gap-3 min-w-0">
          <button onClick={() => handleBack()} className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl active:scale-90 transition-transform shrink-0">
            <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
          </button>
          <div className="min-w-0 flex-1">
            <h1 className="text-xl font-black text-teal-600 flex items-center gap-2 truncate">
              <Settings2 className="w-5 h-5 shrink-0" /> Global Web Config
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest leading-none mt-1 truncate">App-Wide Settings</p>
          </div>
        </div>
      </header>

      <div className="flex-1 p-4 pb-32 max-w-2xl mx-auto w-full min-w-0 space-y-6">

        {/* 1. Queue Controls */}
        <section className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full min-w-0">
          <h2 className="text-xs font-black uppercase tracking-widest text-blue-500 mb-4 flex items-center gap-2">
             <Power className="w-4 h-4" /> Daily Queue Controls
          </h2>
          
          <div className="space-y-4 w-full min-w-0">
            {/* Toggle Switch */}
            <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform">
               <div>
                  <p className="font-bold text-gray-900 dark:text-white">Allow Check-Ins (Queue Open)</p>
                  <p className="text-[10px] text-gray-500 mt-0.5">Turn off to prevent new tokens from being generated.</p>
               </div>
               <div className="relative shrink-0">
                 <input type="checkbox" name="isQueueOpen" checked={config.isQueueOpen} onChange={handleChange} className="sr-only peer" />
                 <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
               </div>
            </label>

            <div className="flex flex-col bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl w-full min-w-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <Ticket className="w-3.5 h-3.5" /> Max Daily Tokens
              </label>
              <input 
                type="number" 
                name="maxDailyTokens" 
                value={config.maxDailyTokens} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl font-bold text-lg outline-none border border-transparent focus:border-blue-500"
              />
            </div>
          </div>
        </section>

        {/* 2. System Variables */}
        <section className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full min-w-0">
          <h2 className="text-xs font-black uppercase tracking-widest text-purple-500 mb-4 flex items-center gap-2">
             <CalendarDays className="w-4 h-4" /> Distribution Variables
          </h2>
          
          <div className="flex flex-col bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl w-full min-w-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 Active Distribution Year
              </label>
              <input 
                type="number" 
                name="activeDistributionYear" 
                value={config.activeDistributionYear} 
                onChange={handleChange} 
                className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl font-bold text-lg outline-none border border-transparent focus:border-purple-500"
              />
              <p className="text-[10px] text-gray-500 mt-2 leading-tight">This represents the current Ramzan year. Used globally to calculate if someone has taken ration &quot;this year&quot;.</p>
          </div>
        </section>

        {/* 3. Global App Status */}
        <section className="bg-white dark:bg-gray-900 p-5 rounded-[2rem] border border-gray-100 dark:border-gray-800 shadow-sm w-full min-w-0">
          <h2 className="text-xs font-black uppercase tracking-widest text-red-500 mb-4 flex items-center gap-2">
             <AlertOctagon className="w-4 h-4" /> Emergency Controls
          </h2>
          
          <div className="space-y-4 w-full min-w-0">
            <label className="flex items-center justify-between p-4 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl cursor-pointer active:scale-[0.98] transition-transform">
               <div>
                  <p className="font-bold text-red-700 dark:text-red-400">Maintenance Mode</p>
                  <p className="text-[10px] text-red-500 mt-0.5">Locks out all users except Super Admins.</p>
               </div>
               <div className="relative shrink-0">
                 <input type="checkbox" name="maintenanceMode" checked={config.maintenanceMode} onChange={handleChange} className="sr-only peer" />
                 <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-red-600"></div>
               </div>
            </label>

            <div className="flex flex-col bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl w-full min-w-0">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest mb-2 flex items-center gap-1.5">
                 <Megaphone className="w-3.5 h-3.5" /> Global Announcement
              </label>
              <textarea 
                name="systemAnnouncement" 
                value={config.systemAnnouncement} 
                onChange={handleChange} 
                rows={3}
                placeholder="Message to display at the top of the dashboard..."
                className="w-full bg-white dark:bg-gray-900 p-3 rounded-xl font-medium text-sm outline-none border border-transparent focus:border-red-500 resize-none"
              />
            </div>
          </div>
        </section>

        <label className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-800 rounded-2xl cursor-pointer">
   <div>
      <p className="font-bold text-gray-900 dark:text-white">Allow New Registrations</p>
      <p className="text-[10px] text-gray-500 mt-0.5">Turn off to stop volunteers from adding new families.</p>
   </div>
   <div className="relative shrink-0">
     <input 
        type="checkbox" 
        name="allowNewRegistrations" // <-- MUST MATCH EXACTLY WITH THE MODEL NAME
        checked={config.allowNewRegistrations} 
        onChange={handleChange} 
        className="sr-only peer" 
     />
     <div className="w-11 h-6 bg-gray-300 dark:bg-gray-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-500"></div>
   </div>
</label>

      </div>

      {/* Floating Save Button */}
      <div className="fixed bottom-0 left-0 right-0 p-5 bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-t border-gray-200 dark:border-gray-800 z-30">
         <div className="max-w-2xl mx-auto w-full">
            <button 
              onClick={handleSave}
              disabled={saving}
              className="w-full py-4 bg-teal-600 text-white font-black rounded-2xl shadow-lg shadow-teal-200 dark:shadow-none flex items-center justify-center gap-2 active:scale-95 transition-transform"
            >
              {saving ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Save className="w-5 h-5" /> Save Configuration</>}
            </button>
         </div>
      </div>
    </main>
  );
}