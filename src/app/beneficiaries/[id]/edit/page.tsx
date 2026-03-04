import Link from "next/link";
import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import RegisterForm from "@/components/forms/RegisterForm";
import { ArrowLeft } from "lucide-react";

// Fetch data logic
async function getBeneficiaryForEdit(id: string) {
  await connectDB();
  const b = await Beneficiary.findById(id).lean();
  if (!b) return null;
  return JSON.parse(JSON.stringify(b));
}

type Props = {
  params: Promise<{ id: string }>;
};

export default async function EditBeneficiaryPage({ params }: Props) {
  const resolvedParams = await params;
  const data = await getBeneficiaryForEdit(resolvedParams.id);

  if (!data) return <div className="p-10 text-center">Not Found</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-6 pt-8">
      
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/beneficiaries/${data._id}`} className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm">
           <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="font-outfit text-2xl font-bold text-gray-900 dark:text-white">
          Edit Beneficiary
        </h1>
      </div>

      {/* Render Form with Data in Edit Mode */}
      <RegisterForm initialData={data} isEditMode={true} />
      
    </div>
  );
}