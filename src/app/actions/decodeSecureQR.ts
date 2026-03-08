"use server";

import { spawn } from "child_process";
import path from "path";

export async function decodeSecureQR(qrData: string) {
  return new Promise((resolve) => {
    // Locate the Python script in your project root
    const scriptPath = path.join(process.cwd(), "scripts", "decode_aadhaar.py");

    // Spawn a Python child process. 
    // Note: Use "python3" or "python" depending on your OS setup.
    const pythonProcess = spawn("python", [scriptPath, qrData]);

    let outputData = "";
    let errorData = "";

    // Collect data from Python's print() statements
    pythonProcess.stdout.on("data", (data) => {
      outputData += data.toString();
    });

    pythonProcess.stderr.on("data", (data) => {
      errorData += data.toString();
    });

    pythonProcess.on("close", (code) => {
      if (code !== 0 || errorData) {
        console.error("Python Error:", errorData);
        resolve({ success: false, message: "Failed to run decryption engine." });
        return;
      }

      try {
        const result = JSON.parse(outputData);
        resolve(result);
      } catch (err) {
        resolve({ success: false, message: "Failed to parse Python output." });
      }
    });
  });
}