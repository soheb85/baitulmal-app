/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useEffect, useState } from "react";
import { Html5Qrcode, Html5QrcodeSupportedFormats } from "html5-qrcode";
import { Loader2, CameraOff } from "lucide-react";

export default function AadhaarQRScanner({ onScan, onClose }: { onScan: (text: string) => void, onClose: () => void }) {
  const [isStarting, setIsStarting] = useState(true);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    let html5QrCode: Html5Qrcode | null = null;
    let isMounted = true;

    async function startScanner() {
      try {
        const devices = await Html5Qrcode.getCameras();
        
        if (devices && devices.length > 0) {
          html5QrCode = new Html5Qrcode("qr-reader", {
            formatsToSupport: [Html5QrcodeSupportedFormats.QR_CODE],
            verbose: false 
          });

          if (isMounted) {
            await html5QrCode.start(
              { facingMode: "environment" }, // Forces rear camera
              {
                fps: 20, 
                qrbox: (viewfinderWidth, viewfinderHeight) => {
                  const minEdge = Math.min(viewfinderWidth, viewfinderHeight);
                  return { width: minEdge * 0.7, height: minEdge * 0.7 };
                },
                videoConstraints: {
                  width: { ideal: 1920 },
                  height: { ideal: 1080 },
                  advanced: [{ focusMode: "continuous" } as any] 
                }
              },
              (decodedText) => {
                if (html5QrCode?.isScanning) {
                  html5QrCode.stop().then(() => {
                    onScan(decodedText);
                  }).catch(console.error);
                }
              },
              (errorMessage) => {
                // Ignore empty frames
              }
            );
            setIsStarting(false);
          }
        } else {
          setErrorMsg("No cameras found on your device.");
          setIsStarting(false);
        }
      } catch (err: any) {
        console.error("Camera access error:", err);
        setErrorMsg("Camera permission denied. Please allow camera access in your browser settings.");
        setIsStarting(false);
      }
    }

    startScanner();

    return () => {
      isMounted = false;
      if (html5QrCode && html5QrCode.isScanning) {
        html5QrCode.stop().catch(console.error);
      }
    };
  }, [onScan]);

  return (
    <div className="fixed inset-0 bg-black/95 backdrop-blur-md flex items-center justify-center z-[100] p-4 animate-in fade-in">
      <div className="relative w-full max-w-sm flex flex-col items-center">
        
        <div className="text-center mb-6">
          <h3 className="text-white font-black text-2xl tracking-tight">Scan Aadhaar</h3>
          <p className="text-gray-400 text-xs font-bold uppercase tracking-widest mt-1">
            {errorMsg ? "Action Required" : "Align QR inside the frame"}
          </p>
        </div>
        
        <div className="relative w-full aspect-square rounded-[2rem] overflow-hidden bg-gray-900 border-4 border-green-500 shadow-[0_0_40px_rgba(34,197,94,0.3)] flex items-center justify-center">
          {errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 p-6 text-center z-20">
              <div className="w-16 h-16 bg-red-500/20 rounded-full flex items-center justify-center mb-4">
                <CameraOff className="w-8 h-8 text-red-500" />
              </div>
              <p className="text-sm font-bold text-white leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {isStarting && !errorMsg && (
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-gray-900 z-10">
               <Loader2 className="w-8 h-8 text-green-500 animate-spin mb-3" />
               <p className="text-[10px] text-gray-400 font-bold uppercase tracking-widest">Activating Rear Camera...</p>
            </div>
          )}

          <div id="qr-reader" className="w-full h-full object-cover"></div>
        </div>

        <button
          onClick={onClose}
          className="mt-8 px-8 py-4 bg-white/10 hover:bg-white/20 text-white font-black rounded-2xl active:scale-95 transition-all w-full max-w-[200px]"
        >
          {errorMsg ? "GO BACK" : "CANCEL SCAN"}
        </button>
      </div>
    </div>
  );
}