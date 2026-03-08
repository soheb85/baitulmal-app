"use client";

import { useBackNavigation } from "@/hooks/useBackNavigation";
import NavigationLoader from "@/components/ui/NavigationLoader";
import {
  ArrowLeft,
  Wrench,
  FileUp,
  UserCog,
  ChevronRight,
  ShieldAlert,
  History,
  Trash2,
  AlertOctagon,
  DatabaseBackup,
  ListChecks,
  RotateCcw,
  Users,
  Layers,
  Zap,
  Settings2, // For Web Config
  FileText, // For Reports
  Terminal, // For Database Access
  FileSpreadsheet,
} from "lucide-react";

export default function AdvancedToolsPage() {
  const { isNavigating, handleBack } = useBackNavigation("/");

  if (isNavigating) return <NavigationLoader message="Opening Tool..." />;

  const toolSections = [
    {
      group: "System Configuration",
      tools: [
        {
          title: "Global Web Config",
          desc: "Manage global application variables, toggle features, queue limits, and active distribution years.",
          icon: <Settings2 className="w-6 h-6 text-teal-600" />,
          route: "/admin/advanced-tools/web-config",
          color: "bg-teal-50 dark:bg-teal-900/20",
          borderColor: "border-teal-100 dark:border-teal-800",
        },
      ],
    },
    {
      group: "Analytics & Exports",
      tools: [
        {
        title: "Excel Engine Builder", // NEW TOOL ENTRY
        desc: "Build highly customized Excel reports with dynamic headers, column mapping, and row styling.",
        icon: <FileSpreadsheet className="w-6 h-6 text-emerald-600" />,
        route: "/admin/advanced-tools/excel-builder",
        color: "bg-emerald-50 dark:bg-emerald-900/20",
        borderColor: "border-emerald-100 dark:border-emerald-800",
      },
      {
        title: "Standard PDF Reports",
        desc: "Generate and download official PDF documents for distribution audits.",
        icon: <FileText className="w-6 h-6 text-pink-600" />,
        route: "/admin/advanced-tools/reports",
        color: "bg-pink-50 dark:bg-pink-900/20",
        borderColor: "border-pink-100 dark:border-pink-800",
      },
      ],
    },
    {
      group: "Data Operations",
      tools: [
        {
          title: "Bulk Excel Import",
          desc: "Upload legacy Excel sheets to create or sync multiple beneficiaries at once.",
          icon: <FileUp className="w-6 h-6 text-green-600" />,
          route: "/admin/advanced-tools/excel-import",
          color: "bg-green-50 dark:bg-green-900/20",
          borderColor: "border-green-100 dark:border-green-800",
        },
        {
          title: "Restore Backup",
          desc: "Upload a generated Database Export file to safely restore or bulk-update records.",
          icon: <DatabaseBackup className="w-6 h-6 text-amber-600" />,
          route: "/admin/advanced-tools/restore-data",
          color: "bg-amber-50 dark:bg-amber-900/20",
          borderColor: "border-amber-100 dark:border-amber-800",
        },
        {
          title: "Direct Field Override",
          desc: "Update any specific field using Beneficiary ID. Use for manual data corrections.",
          icon: <UserCog className="w-6 h-6 text-orange-600" />,
          route: "/admin/advanced-tools/direct-override",
          color: "bg-orange-50 dark:bg-orange-900/20",
          borderColor: "border-orange-100 dark:border-orange-800",
        },
        {
          title: "Bulk Field Override",
          desc: "Update a specific field for multiple selected users or the entire database at once.",
          icon: <ListChecks className="w-6 h-6 text-indigo-600" />,
          route: "/admin/advanced-tools/bulk-override",
          color: "bg-indigo-50 dark:bg-indigo-900/20",
          borderColor: "border-indigo-100 dark:border-indigo-800",
        },
      ],
    },
    {
      group: "Queue & Distribution Management",
      tools: [
        {
          title: "Reset Daily Queue",
          desc: "Emergency tool to clear all current CHECKED_IN tokens for a specific date.",
          icon: <RotateCcw className="w-6 h-6 text-red-600" />,
          route: "/admin/advanced-tools/reset-queue",
          color: "bg-red-50 dark:bg-red-900/20",
          borderColor: "border-red-100 dark:border-red-800",
        },
        {
          title: "Counter Sequence Fixer",
          desc: "Adjust the Atomic Counter sequence number if tokens are generated incorrectly.",
          icon: <Zap className="w-6 h-6 text-blue-600" />,
          route: "/admin/advanced-tools/fix-counter",
          color: "bg-blue-50 dark:bg-blue-900/20",
          borderColor: "border-blue-100 dark:border-blue-800",
        },
      ],
    },
    {
      group: "System Maintenance",
      tools: [
        {
          title: "Bulk Area Actions",
          desc: "Blacklist or Activate all families in a specific area (e.g. Kurla) at once.",
          icon: <Layers className="w-6 h-6 text-purple-600" />,
          route: "/admin/advanced-tools/bulk-area",
          color: "bg-purple-50 dark:bg-purple-900/20",
          borderColor: "border-purple-100 dark:border-purple-800",
        },
        {
          title: "Duplicate Finder",
          desc: "Scan the database for families with identical Aadhaar, Mobile, or Address.",
          icon: <Users className="w-6 h-6 text-cyan-600" />,
          route: "/admin/advanced-tools/find-duplicates",
          color: "bg-cyan-50 dark:bg-cyan-900/20",
          borderColor: "border-cyan-100 dark:border-cyan-800",
        },
      ],
    },
    {
      group: "Danger Zone",
      tools: [
        {
          title: "Raw Database Console",
          desc: "Execute raw MongoDB queries directly against the database. Super Admins only.",
          icon: <Terminal className="w-6 h-6 text-slate-600 dark:text-slate-400" />,
          route: "/admin/advanced-tools/db-access",
          color: "bg-slate-100 dark:bg-slate-900/40",
          borderColor: "border-slate-300 dark:border-slate-700",
        },
        {
          title: "Bulk Record Deletion",
          desc: "Multi-select search results to permanently delete them. (Requires backup first).",
          icon: <Trash2 className="w-6 h-6 text-rose-600" />,
          route: "/admin/advanced-tools/bulk-delete",
          color: "bg-rose-50 dark:bg-rose-900/20",
          borderColor: "border-rose-200 dark:border-rose-800",
        },
      ],
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit pb-20">
      {/* Header */}
      <div className="bg-white dark:bg-gray-900 border-b border-gray-100 dark:border-gray-800 px-6 pt-12 pb-6 sticky top-0 z-20">
        <button
          onClick={() => handleBack()}
          className="p-2 bg-gray-100 dark:bg-gray-800 rounded-xl mb-4 active:scale-90 transition-transform"
        >
          <ArrowLeft className="w-5 h-5 text-gray-600" />
        </button>
        <div className="flex items-center gap-3">
          <div className="p-3 bg-indigo-600 rounded-2xl shadow-lg">
            <Wrench className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-2xl font-black text-gray-900 dark:text-white leading-none">
              Advanced Tools
            </h1>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-[0.2em] mt-1.5">
              Super Admin Control Center
            </p>
          </div>
        </div>
      </div>

      <main className="p-6 space-y-10 max-w-2xl mx-auto">
        {/* Warning Banner */}
        <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 p-5 rounded-[2rem] flex gap-4 shadow-sm">
          <div className="p-2 bg-amber-100 dark:bg-amber-800/50 rounded-xl h-fit">
            <ShieldAlert className="w-5 h-5 text-amber-600" />
          </div>
          <div>
            <p className="text-sm font-black text-amber-800 dark:text-amber-400 uppercase tracking-tight">
              System Integrity Warning
            </p>
            <p className="text-xs text-amber-700/80 dark:text-amber-500/80 mt-1 leading-relaxed font-medium">
              Actions taken here bypass standard validation. Changes are
              permanent and affect live distribution logic.
            </p>
          </div>
        </div>

        {/* Tools by Section */}
        {toolSections.map((section, sIdx) => (
          <div key={sIdx} className="space-y-4">
            <div className="flex items-center gap-2 ml-2">
              {section.group === "Danger Zone" && (
                <AlertOctagon className="w-4 h-4 text-rose-500" />
              )}
              <h3
                className={`text-[10px] font-black uppercase tracking-[0.25em] ${section.group === "Danger Zone" ? "text-rose-500" : "text-gray-400 dark:text-gray-500"}`}
              >
                {section.group}
              </h3>
            </div>

            <div className="grid grid-cols-1 gap-4">
              {section.tools.map((tool, idx) => (
                <button
                  key={idx}
                  onClick={() => handleBack(tool.route)}
                  className={`flex items-start gap-4 p-5 ${tool.color} border ${tool.borderColor} rounded-[2.5rem] text-left active:scale-[0.98] transition-all group shadow-sm`}
                >
                  <div className="bg-white dark:bg-gray-900 p-4 rounded-2xl shadow-sm group-hover:rotate-6 transition-transform shrink-0">
                    {tool.icon}
                  </div>
                  <div className="flex-1 min-w-0">
                    <h3 className="font-black text-gray-900 dark:text-white text-lg leading-none mb-1.5 truncate">
                      {tool.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 font-medium leading-relaxed line-clamp-2">
                      {tool.desc}
                    </p>
                  </div>
                  <ChevronRight className="w-5 h-5 text-gray-300 self-center group-hover:translate-x-1 transition-transform shrink-0" />
                </button>
              ))}
            </div>
          </div>
        ))}

        {/* Helper Footer */}
        <div className="mt-12 flex flex-col items-center gap-2 opacity-40">
          <div className="flex items-center gap-2">
            <History className="w-4 h-4" />
            <p className="text-[10px] font-bold uppercase tracking-widest text-center">
              Audit Trails are automatically generated
            </p>
          </div>
        </div>
      </main>
    </div>
  );
}