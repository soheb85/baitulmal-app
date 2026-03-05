"use client";

import { useEffect } from "react";
import QRCode from "react-qr-code";
import { X, Printer, ShieldCheck, Info, ArrowLeft } from "lucide-react";

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
  
  // Lock background scroll when modal is open to prevent background scrolling
  useEffect(() => {
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, []);

  const handlePrint = () => {
    window.print();
  };

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/90 backdrop-blur-sm p-4 overflow-y-auto animate-in fade-in duration-200 print:bg-white print:p-0 print:block font-outfit">

      {/* Printable Card (Scrolls inside the viewport if screen is small) */}
      <div
        id="printable-card"
        className="bg-white rounded-[2rem] w-full max-w-sm relative shadow-2xl flex flex-col font-outfit print:rounded-2xl print:shadow-none print:w-[330px] print:mx-auto"
        style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
      >

        {/* Close Button - Hidden on Print (Top Right) */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 p-2 bg-white/20 rounded-full hover:bg-white/40 print:hidden z-20 transition-colors"
        >
          <X className="w-5 h-5 text-white" />
        </button>

        {/* --- Header --- */}
        <div className="bg-green-600 p-4 text-center text-white relative rounded-t-[2rem] print:rounded-t-2xl print:bg-green-700">
          <div className="relative z-10 flex flex-col items-center">
            {/* Logo Wrapper with forced print styling */}
            <div 
              className="bg-white p-2.5 rounded-2xl mb-2.5 shadow-sm border-2 border-green-500/50 print:border-black print:bg-white"
              style={{ printColorAdjust: "exact", WebkitPrintColorAdjust: "exact" }}
            >
              <ShieldCheck className="w-7 h-7 text-green-600 print:text-black" />
            </div>
            
            <h1 className="text-xl font-black uppercase tracking-widest leading-none mb-1 print:text-white">
              Anwarul Quran
            </h1>
            <h2 className="text-sm font-bold uppercase tracking-[0.3em] opacity-90 print:text-white leading-none mb-2">
              Baitulmal
            </h2>
            <div className="w-12 h-0.5 bg-white/30 my-1.5 rounded-full" />
            <p className="text-[10px] font-bold uppercase tracking-widest bg-white/20 px-3 py-1 rounded-full print:bg-transparent print:border print:border-white print:text-white">
              Official Ration Card
            </p>
          </div>
        </div>

        {/* --- QR Section & Primary Details --- */}
        <div className="p-4 pb-2 text-center bg-white">
          <div className="flex justify-center mb-3">
            <div className="p-2 bg-white border-4 border-dashed border-gray-300 rounded-xl print:border-black">
              <QRCode
                value={data._id}
                size={100}
                style={{ height: "auto", maxWidth: "100%", width: "100%" }}
                viewBox={`0 0 256 256`}
              />
            </div>
          </div>

          <h3 className="text-2xl font-black text-gray-900 leading-tight uppercase print:text-black tracking-tight">
            {data.fullName}
          </h3>

          <p className="text-xl font-black text-gray-800 print:text-black leading-none mt-1">
                {data.aadharNumber}
              </p>

          <p className="text-sm font-bold text-gray-500 tracking-widest mt-1 print:text-gray-800">
            {data.mobileNumber}
          </p>
        </div>

        {/* --- Grid Details --- */}
        <div className="px-5 py-2 bg-white">
          <div className="grid grid-cols-2 gap-4 bg-gray-50 rounded-2xl p-3 border border-gray-100 print:bg-transparent print:border-2 print:border-black print:p-2">
            <div className="text-center">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest print:text-black leading-tight">
                Family Members
              </p>
              <p className="text-xl font-black text-gray-800 print:text-black leading-none mt-1">
                {data.familyCount}
              </p>
            </div>
            <div className="text-center border-l border-gray-200 print:border-black">
              <p className="text-[8px] font-black text-gray-400 uppercase tracking-widest print:text-black leading-tight">
                Aadhaar (Last 4)
              </p>
              <p className="text-xl font-black text-gray-800 print:text-black leading-none mt-1">
                {data.aadharNumber.slice(-4)}
              </p>
            </div>
          </div>
        </div>

        {/* --- 3-Year Distribution Tracker --- */}
        <div className="px-5 py-3 border-t-2 border-dashed border-gray-200 bg-white print:border-black">
          <div className="flex items-center justify-center gap-1.5 mb-3">
             <Info className="w-3 h-3 text-gray-400 print:text-black" />
             <p className="text-[9px] font-black text-gray-500 uppercase tracking-widest print:text-black">
               3-Year Distribution Tracker
             </p>
          </div>

          <div className="flex justify-between items-start gap-2.5">
            {[1, 2, 3].map((year) => (
              <div key={year} className="flex flex-col items-center flex-1">
                {/* Checkbox */}
                <div className="w-12 h-12 border-2 border-gray-300 rounded-xl flex items-center justify-center bg-gray-50 shadow-inner print:border-black print:bg-white print:border-[1.5px] relative">
                    <span className="text-[7px] font-bold text-gray-300 absolute bottom-1 right-1 print:text-gray-400">MARK</span>
                </div>
                
                {/* Label */}
                <p className="text-[10px] font-black text-gray-800 mt-1.5 uppercase tracking-wider print:text-black leading-none">
                  Year {year}
                </p>
                
                {/* Date Line */}
                <div className="w-full border-b border-gray-300 mt-2.5 print:border-black relative">
                    <span className="absolute -top-3 left-1/2 -translate-x-1/2 text-[5px] font-bold text-gray-400 uppercase print:text-black bg-white px-1">
                        Date/Year
                    </span>
                </div>
              </div>
            ))}
          </div>

          <p className="text-[7px] text-center text-gray-400 mt-4 font-black uppercase tracking-widest print:text-black leading-tight">
            ⚠ Do not mark. For authorized personnel use only.
          </p>
        </div>

        {/* --- Authorized Signatures Section --- */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50 print:bg-white print:border-t-2 print:border-black print:border-dashed">
          <div className="grid grid-cols-2 gap-x-4 gap-y-6 text-center">
            {/* Sadar Signature */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-full h-6 border-b-2 border-dotted border-gray-300 print:border-black" />
              <p className="text-[8px] font-black text-gray-900 uppercase tracking-widest print:text-black leading-tight">
                Mohammad Hanif Khan
              </p>
              <p className="text-[6px] font-bold text-gray-500 uppercase tracking-wider print:text-black leading-tight">
                Authorized Signature • Sadar
              </p>
            </div>
            {/* Treasure Signature */}
            <div className="space-y-1.5 flex flex-col items-center">
              <div className="w-full h-6 border-b-2 border-dotted border-gray-300 print:border-black" />
              <p className="text-[8px] font-black text-gray-900 uppercase tracking-widest print:text-black leading-tight">
                Yunus Khan
              </p>
              <p className="text-[6px] font-bold text-gray-500 uppercase tracking-wider print:text-black leading-tight">
                Authorized Signature • Treasure
              </p>
            </div>
          </div>
        </div>

        {/* --- Footer (Dark Band) --- */}
        <div className="text-center pb-3 pt-2 bg-gray-900 print:bg-white print:border-t-2 print:border-black print:rounded-b-[14px]">
          <p className="text-[8px] font-medium text-gray-400 tracking-wider print:text-black leading-tight">
            Authorized by Bilali Masjid Trust • Non-Transferable
          </p>
        </div>

        {/* --- Action Buttons - Hidden on Print --- */}
        <div className="p-4 bg-white print:hidden border-t border-gray-100 rounded-b-[2rem] space-y-3">
          <button
            onClick={handlePrint}
            className="w-full py-4 bg-green-600 text-white font-black uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-green-700 transition-all active:scale-95 shadow-xl shadow-green-200"
          >
            <Printer className="w-5 h-5" />
            Print Lamination Card
          </button>
          
          <button
            onClick={onClose}
            className="w-full py-3.5 bg-gray-100 text-gray-700 font-bold uppercase tracking-widest rounded-2xl flex items-center justify-center gap-2 hover:bg-gray-200 transition-all active:scale-95"
          >
            <ArrowLeft className="w-4 h-4" />
            Go Back
          </button>
        </div>

      </div>

      {/* --- Print CSS (Fixes Blank Pages & Missing Logo) --- */}
      <style jsx global>{`
        @media print {
          @page {
            size: A4 portrait;
            margin: 0;
          }

          /* 1. Lock the body tightly so background pages physically cannot exist */
          html, body {
            width: 100vw !important;
            height: 100vh !important;
            margin: 0 !important;
            padding: 0 !important;
            overflow: hidden !important; 
            background-color: white !important;
          }

          /* 2. Hide everything in the document initially */
          body * {
            visibility: hidden;
          }

          /* 3. Force exact colors for logos and backgrounds */
          * {
            -webkit-print-color-adjust: exact !important;
            print-color-adjust: exact !important;
            font-family: 'Outfit', sans-serif !important;
          }

          /* 4. Fix the overlay container to the top-center. Position Fixed removes it from the document flow, killing the 2nd page bug. */
          .fixed.inset-0 {
            position: fixed !important;
            visibility: visible !important;
            display: flex !important;
            align-items: flex-start !important;
            justify-content: center !important;
            top: 0 !important;
            left: 0 !important;
            width: 100vw !important;
            height: 100vh !important;
            padding-top: 15mm !important;
            background-color: white !important;
            z-index: 999999 !important;
          }

          /* 5. Make the card and its contents visible */
          #printable-card,
          #printable-card * {
            visibility: visible !important;
          }

          /* 6. Style the card for paper */
          #printable-card {
            position: relative !important;
            transform: none !important;
            margin: 0 auto !important; 
            width: 330px !important; 
            border: 2px solid black !important;
            box-sizing: border-box !important;
            height: auto !important;
            max-height: none !important;
            page-break-after: avoid !important;
            page-break-inside: avoid !important;
          }
        }
      `}</style>
    </div>
  );
}