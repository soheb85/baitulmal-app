/* eslint-disable @typescript-eslint/no-explicit-any */
import { connectDB } from "@/lib/mongoose";
import Beneficiary from "@/models/Beneficiary";
import BeneficiaryDetailsView from "@/components/BeneficiaryDetailsView";
import RegisterForm from "@/components/forms/RegisterForm"; 
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

async function getBeneficiaryDetail(id: string) {
  await connectDB();
  const b = await Beneficiary.findById(id).lean() as any;
  if (!b) return null;
  return JSON.parse(JSON.stringify(b));
}

type Props = {
  params: Promise<{ id: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
};

export default async function BeneficiaryDetailPage({ params, searchParams }: Props) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;
  
  const id = resolvedParams.id;
  const data = await getBeneficiaryDetail(id);

  const returnUrl = typeof resolvedSearchParams.returnTo === 'string' ? resolvedSearchParams.returnTo : "/beneficiaries";
  const backLabel = returnUrl.includes("live-queue") ? "Queue" : "List";
  
  // Logic to determine if we are in edit mode
  // Note: Make sure your route for editing is either /[id]?edit=true or handled via /[id]/edit
  const isEditMode = resolvedSearchParams.edit === "true";

  if (!data) return <div className="p-10 text-center text-gray-500 font-outfit">Not Found</div>;

  if (isEditMode) {
    return (
        <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit w-full overflow-x-hidden">
            <div className="sticky top-0 z-30 bg-white/95 dark:bg-gray-950/95 backdrop-blur-md border-b border-gray-100 dark:border-gray-800 p-4 w-full">
                <div className="flex items-center gap-3">
                    <Link href={`/beneficiaries/${id}?returnTo=${returnUrl}`} className="p-2 rounded-full hover:bg-gray-100 dark:hover:bg-gray-800 shrink-0">
                        <ArrowLeft className="w-5 h-5" />
                    </Link>
                    <h1 className="text-lg font-bold truncate">Edit Profile</h1>
                </div>
            </div>
            <div className="p-4 max-w-3xl mx-auto w-full">
                <RegisterForm initialData={data} isEditMode={true} />
            </div>
        </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 font-outfit w-full overflow-x-hidden">
        <BeneficiaryDetailsView 
            data={data} 
            returnUrl={returnUrl} 
            backLabel={backLabel} 
        />
    </div>
  );
}