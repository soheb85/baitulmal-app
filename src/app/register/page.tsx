import RegisterForm from "@/components/forms/RegisterForm";
import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function RegisterPage() {
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 px-6 pt-8">
      
      {/* Header with Back Button */}
      <div className="flex items-center gap-4 mb-6">
        <Link href="/" className="p-2 bg-white dark:bg-gray-900 rounded-full shadow-sm">
           <ArrowLeft className="w-5 h-5 text-gray-600 dark:text-gray-300" />
        </Link>
        <h1 className="font-outfit text-2xl font-bold text-gray-900 dark:text-gray-100">
          New Registration
        </h1>
      </div>

      {/* The Form Component */}
      <RegisterForm />
      
    </div>
  );
}