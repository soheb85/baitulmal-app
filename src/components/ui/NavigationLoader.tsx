import { Loader2 } from "lucide-react";

export default function NavigationLoader({ message = "Just a moment..." }: { message?: string }) {
  return (
    // 1. Backdrop: High blur to hide the page behind it, giving "busy" context
    <div className="fixed inset-0 z-[100] bg-white/60 dark:bg-[#020617]/80 backdrop-blur-xl flex items-center justify-center p-4 animate-in fade-in duration-300">
      
      {/* 2. The HUD Card: Floating, rounded, and premium */}
      <div className="relative bg-white dark:bg-gray-900 p-8 rounded-[2.5rem] shadow-2xl shadow-gray-200/50 dark:shadow-black/50 border border-gray-100 dark:border-gray-800 flex flex-col items-center gap-6 min-w-[240px] transform animate-in zoom-in-95 duration-300">
        
        {/* Icon Container with Glow */}
        <div className="relative">
            {/* Soft Glow behind the spinner */}
            <div className="absolute inset-0 bg-green-500/30 blur-xl rounded-full animate-pulse" />
            
            {/* The Spinner Wrapper */}
            <div className="relative bg-gray-50 dark:bg-gray-800 p-5 rounded-full border border-gray-100 dark:border-gray-700">
                <Loader2 className="w-8 h-8 text-green-600 dark:text-green-400 animate-spin" strokeWidth={3} />
            </div>
        </div>

        {/* Text Hierarchy */}
        <div className="text-center space-y-1.5">
            <h3 className="text-lg font-black text-gray-900 dark:text-white tracking-tight font-outfit">
                {message}
            </h3>
            <p className="text-[10px] font-bold text-gray-400 dark:text-gray-500 uppercase tracking-[0.2em]">
                Processing Request
            </p>
        </div>

        {/* Optional: Bottom Progress Bar Indication */}
        <div className="w-16 h-1 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div className="h-full bg-green-500 w-1/2 animate-[shimmer_1s_infinite_linear] rounded-full" />
        </div>

      </div>
    </div>
  );
}