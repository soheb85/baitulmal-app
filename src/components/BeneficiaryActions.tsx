"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { deleteBeneficiary } from "@/app/actions/deleteBeneficiary";
import { Edit, Trash2, Loader2 } from "lucide-react";

export default function BeneficiaryActions({ id }: { id: string }) {
  const router = useRouter();
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    // 1. Confirm First
    const confirmed = window.confirm("Are you sure you want to PERMANENTLY DELETE this beneficiary? This cannot be undone.");
    if (!confirmed) return;

    setIsDeleting(true);

    // 2. Call Server Action
    const result = await deleteBeneficiary(id);

    if (result.success) {
      alert("Beneficiary deleted.");
      router.push("/beneficiaries"); // Redirect to list
      router.refresh(); // Ensure list is fresh
    } else {
      alert(result.message);
      setIsDeleting(false);
    }
  };

  return (
    <div className="flex items-center gap-2">
      {/* Edit Button */}
      <Link 
        href={`/beneficiaries/${id}/edit`}
        className="p-2 bg-blue-50 dark:bg-blue-900/20 text-blue-600 rounded-full hover:bg-blue-100 transition-colors"
        title="Edit Details"
      >
        <Edit className="w-5 h-5" />
      </Link>

      {/* Delete Button */}
      <button 
        onClick={handleDelete}
        disabled={isDeleting}
        className="p-2 bg-red-50 dark:bg-red-900/20 text-red-600 rounded-full hover:bg-red-100 transition-colors disabled:opacity-50"
        title="Delete Beneficiary"
      >
        {isDeleting ? <Loader2 className="w-5 h-5 animate-spin" /> : <Trash2 className="w-5 h-5" />}
      </button>
    </div>
  );
}