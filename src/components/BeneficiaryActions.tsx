"use client";

import { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { deleteBeneficiary } from "@/app/actions/deleteBeneficiary";
import { Edit, Trash2, Loader2 } from "lucide-react";

export default function BeneficiaryActions({ id }: { id: string }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  
  const [isDeleting, setIsDeleting] = useState(false);
  
  // FIX: useTransition is the professional way to handle navigation loaders.
  // It automatically resets when the navigation is finished or reversed.
  const [isPending, startTransition] = useTransition();

  const handleEdit = () => {
    // We wrap the navigation in startTransition to trigger the 'isPending' state
    // Inside BeneficiaryActions handleEdit:
startTransition(() => {
  const params = new URLSearchParams(searchParams.toString());
  params.set("edit", "true");
  router.push(`${pathname}?${params.toString()}`);
});
  };

  const handleDelete = async () => {
    const confirmed = window.confirm("Are you sure you want to PERMANENTLY DELETE this beneficiary? This cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);
    const result = await deleteBeneficiary(id);

    if (result.success) {
      alert("Beneficiary deleted.");
      router.push("/beneficiaries");
      router.refresh();
    } else {
      alert(result.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button with Automatic Transition Loader */}
      <button 
        onClick={handleEdit}
        disabled={isPending || isDeleting}
        className="p-2.5 bg-blue-50 dark:bg-blue-900/20 text-blue-600 dark:text-blue-400 rounded-xl hover:bg-blue-100 dark:hover:bg-blue-800/40 transition-all disabled:opacity-50 active:scale-95 border border-blue-100 dark:border-blue-800/50"
        title="Edit Details"
      >
        {isPending ? (
          <Loader2 className="w-5 h-5 animate-spin" />
        ) : (
          <Edit className="w-5 h-5" />
        )}
      </button>

      {/* Delete Button */}
      <button 
        onClick={handleDelete}
        disabled={isDeleting || isPending}
        className="p-2.5 bg-red-50 dark:bg-red-900/20 text-red-600 dark:text-red-400 rounded-xl hover:bg-red-100 dark:hover:bg-red-800/40 transition-all disabled:opacity-50 active:scale-95 border border-red-100 dark:border-red-800/50"
        title="Delete Beneficiary"
      >
        {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
      </button>
    </div>
  );
}