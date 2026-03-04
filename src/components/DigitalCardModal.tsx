"use client";

import QRCode from "react-qr-code";
import { X, Printer, ShieldCheck, CheckCircle2 } from "lucide-react";

interface DigitalCardProps {
  data: {
    _id: string;
    fullName: string;
    aadharNumber: string;
    mobileNumber: string;
    familyCount: number;
  };
  onClose: () => void;
}

export default function DigitalCardModal({ data, onClose }: DigitalCardProps) {
  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200 print:bg-transparent print:p-0 print:absolute print:inset-0">

      {/* Printable Card */}
      <div
        id="printable-card"
        className="bg-white rounded-[2rem] w-full max-w-sm relative shadow-2xl overflow-y-auto max-h-[90vh] flex flex-col"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >

        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-gray-100 rounded-full hover:bg-gray-200 print:hidden z-20"
        >
          <X className="w-5 h-5 text-gray-500" />
        </button>

        {/* Header */}
        <div className="bg-green-600 p-4 text-center text-white relative">
          <div className="relative z-10 flex flex-col items-center">
            <div className="bg-white/20 p-2 rounded-2xl mb-2 backdrop-blur-sm border border-white/20">
              <ShieldCheck className="w-7 h-7 text-white" />
            </div>
            <h2 className="text-lg font-black uppercase tracking-widest leading-none">
              Ration Card
            </h2>
            <p className="text-[10px] opacity-90 font-medium uppercase tracking-wider mt-1">
              Anwarul Quran Baitulmal
            </p>
          </div>
        </div>

        {/* QR Section */}
        <div className="p-4 pb-2 text-center bg-white">
          <div className="flex justify-center mb-3">
            <div className="p-2 bg-white border-4 border-double border-gray-200 rounded-xl print:border-black">
              <QRCode
                value={data._id}
                size={110}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>

          <h3 className="text-xl font-black text-gray-900 leading-tight uppercase print:text-black">
            {data.fullName}
          </h3>

          <p className="text-sm font-mono text-gray-500 font-bold tracking-wider print:text-gray-700">
            {data.mobileNumber}
          </p>
        </div>

        {/* Details Grid */}
        <div className="px-5 py-3">
          <div className="grid grid-cols-2 gap-4 border-t border-b border-gray-100 py-3 print:border-gray-400">

            <div className="text-center">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest print:text-black">
                Family Members
              </p>
              <p className="text-xl font-black text-gray-800 print:text-black">
                {data.familyCount}
              </p>
            </div>

            <div className="text-center border-l border-gray-100 print:border-gray-400">
              <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest print:text-black">
                Aadhaar (Last 4)
              </p>
              <p className="text-xl font-black text-gray-800 print:text-black">
                {data.aadharNumber.slice(-4)}
              </p>
            </div>

          </div>
        </div>

        {/* Valid Section */}
        <div className="px-6 pb-5 bg-gray-50 print:bg-transparent">

          <p className="text-[9px] font-bold text-gray-400 uppercase tracking-widest text-center mb-3 print:text-black">
            Card Valid For
          </p>

          <div className="space-y-2">

            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 print:text-black">
              <CheckCircle2 className="w-4 h-4 text-green-600 print:text-black" />
              <span>Station 1: Identity Verification</span>
            </div>

            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 print:text-black">
              <CheckCircle2 className="w-4 h-4 text-green-600 print:text-black" />
              <span>Station 2: Ration Kit Collection</span>
            </div>

            <div className="flex items-center gap-3 text-sm font-medium text-gray-700 print:text-black">
              <CheckCircle2 className="w-4 h-4 text-green-600 print:text-black" />
              <span>Emergency Aid & Support</span>
            </div>

          </div>
        </div>

        {/* Footer */}
        <div className="text-center pb-3 pt-1">
          <p className="text-[8px] text-gray-400 print:text-black">
            Authorized by Bilali Masjid Trust • Non-Transferable
          </p>
        </div>

        {/* Print Button */}
        <div className="p-4 bg-white print:hidden">
          <button
            onClick={handlePrint}
            className="w-full py-4 bg-gray-900 text-white font-bold rounded-2xl flex items-center justify-center gap-2 hover:bg-black transition-all active:scale-95 shadow-lg"
          >
            <Printer className="w-5 h-5" />
            Print Card
          </button>
        </div>

      </div>

      {/* Print CSS */}
      <style jsx global>{`
        @media print {

          @page {
            size: A4 portrait;
            margin: 10mm;
          }

          body * {
            visibility: hidden;
          }

          #printable-card,
          #printable-card * {
            visibility: visible;
          }

          #printable-card {
            position: absolute;
            left: 50%;
            top: 40%;
            transform: translate(-50%, -40%);
            width: 320px !important;
            max-height: none !important;
            border: 2px solid black;
            box-shadow: none;
            page-break-inside: avoid;
            break-inside: avoid;
          }

          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
          }

        }
      `}</style>

    </div>
  );
}