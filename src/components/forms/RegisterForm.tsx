/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState, useEffect } from "react";
import { registerBeneficiary } from "@/app/actions/registerBeneficiary";
import { updateBeneficiary } from "@/app/actions/updateBeneficiary";
import { checkAadharDuplicate } from "@/app/actions/checkAadhar";
import { useBackNavigation } from "@/hooks/useBackNavigation"; 
import NavigationLoader from "@/components/ui/NavigationLoader";
import AadhaarQRScanner from "@/components/AadhaarQRScanner"; 
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Trash2,
  Fingerprint,
  Smartphone,
  Home as HomeIcon,
  ShieldCheck,
  ChevronRight,
  Users,
  X, 
  GraduationCap, 
  Briefcase ,
  QrCode
} from "lucide-react";

// --- Types ---
type FamilyMember = {
  id: string;
  name: string;
  relation: "SON" | "DAUGHTER" | "HUSBAND" | "WIFE" | "FATHER" | "MOTHER";
  age: string;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED";
  livesWithFamily: boolean;
  
  isEarning: boolean;
  occupation: string;
  monthlyIncome: string;

  isStudying: boolean;
  schoolName: string;
  classStandard: string;
  memberNotes: string;
};

const PROBLEM_TAGS = [
  "Widow",
  "No Income",
  "Medical Issue",
  "Disabled Husband",
  "Orphans",
  "Debts",
  "Large Family",
  "Rented House",
];

const generateUniqueId = () => {
  return typeof crypto !== "undefined" && crypto.randomUUID
    ? crypto.randomUUID()
    : `member-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

interface RegisterFormProps {
  initialData?: any;
  isEditMode?: boolean;
}

export default function RegisterForm({
  initialData,
  isEditMode = false,
}: RegisterFormProps) {
  const { isNavigating, handleBack } = useBackNavigation("/");

  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [customProblem, setCustomProblem] = useState("");
  const [aadharStatus, setAadharStatus] = useState<{
    exists: boolean;
    message: string;
    name?: string;
    mobileNumber?: string;
  } | null>(null);

  // --- Form State ---
  const [formData, setFormData] = useState({
    fullName: initialData?.fullName || "",
    aadharNumber: initialData?.aadharNumber || "",
    mobileNumber: initialData?.mobileNumber || "",
    gender: initialData?.gender || "FEMALE",
    husbandStatus: initialData?.husbandStatus || "ALIVE",
    
    // --- NEW: Main Applicant Earning Details ---
    isEarning: initialData?.isEarning || false,
    occupation: initialData?.occupation || "",
    monthlyIncome: initialData?.monthlyIncome || "",

    sons: initialData?.sons || 0,
    daughters: initialData?.daughters || 0,
    otherDependents: initialData?.otherDependents || 0,
    earningMembersCount: initialData?.earningMembersCount || 0,
    totalFamilyIncome: initialData?.totalFamilyIncome || 0,
    housingType: initialData?.housingType || "OWN",
    rentAmount: initialData?.rentAmount || 0,
    currentAddress: initialData?.currentAddress || "",
    
    // --- NEW FIELD: Area ---
    area: initialData?.area || "",

    aadharPincode: initialData?.aadharPincode || "",
    currentPincode: initialData?.currentPincode || "400024",
    isException: isEditMode ? (initialData?.isException || false) : false,
    problems: initialData?.problems || [],
    comments: initialData?.comments || "",
    referencedBy: initialData?.referencedBy || "",
  });

  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>(
    initialData?.familyMembersDetail?.map((m: any) => ({
      ...m,
      id: m.id || m._id || generateUniqueId(),
      isStudying: m.isStudying || false,
      schoolName: m.schoolName || "",
      classStandard: m.classStandard || ""
    })) || [],
  );

  const [isAddingMember, setIsAddingMember] = useState(false);
  
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    relation: "SON",
    livesWithFamily: true,
    isEarning: false,
    maritalStatus: "SINGLE",
    occupation: "",
    monthlyIncome: "",
    isStudying: false,
    schoolName: "",
    classStandard: "",
    memberNotes: ""
  });

  // Scanner State
  const [scanOpen, setScanOpen] = useState(false);

  // The Smart Handler (Talks to your Python API)
  const handleAadhaarScan = async (decodedText: string) => {
    try {
      // 1. Check if it is the new "Secure QR" (Massive string of numbers)
      if (/^\d+$/.test(decodedText) && decodedText.length > 500) {
         
         setMessage({ type: "success", text: "Secure QR Detected. Decrypting data..." });
         setScanOpen(false);
         
         // Call the Python API you created
         const response = await fetch('/api/decode', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ qr_data: decodedText })
         });
         
         const res = await response.json();
         
         if (res.success && res.data) {
            const secureData = res.data;
            
            const fullAddress = [
                secureData.house, secureData.street, secureData.landmark, 
                secureData.location, secureData.district, secureData.state
            ].filter(Boolean).join(", ");

            setFormData((prev) => ({
              ...prev,
              fullName: secureData.name || prev.fullName,
              // Only 4 digits exist! User MUST type the rest.
              aadharNumber: `XXXXXXXX${secureData.adhaar_last_4_digit || ""}`, 
              gender: secureData.gender === "M" ? "MALE" : secureData.gender === "F" ? "FEMALE" : prev.gender,
              currentAddress: fullAddress || prev.currentAddress,
              aadharPincode: secureData.pincode || prev.aadharPincode,
            }));

            alert("Data decrypted! \n\nNOTE: UIDAI hides the first 8 digits of the Aadhaar number in Secure QRs. Please type the full 12 digits manually.");
            setMessage(null);
         } else {
             alert("Failed to decrypt Secure QR: " + res.error);
             setMessage(null);
         }
         return;
      }

      // 2. Check if it's the Standard XML format (Old Cards)
      if (decodedText.includes("<?xml") || decodedText.includes("<PrintLetterBarcodeData")) {
        const parser = new DOMParser();
        const xmlDoc = parser.parseFromString(decodedText, "text/xml");
        const dataNode = xmlDoc.getElementsByTagName("PrintLetterBarcodeData")[0];
        
        if (dataNode) {
          const uid = dataNode.getAttribute("uid") || "";
          const name = dataNode.getAttribute("name") || "";
          const gender = dataNode.getAttribute("gender") || ""; 
          const pincode = dataNode.getAttribute("pc") || "";
          
          const house = dataNode.getAttribute("house") || "";
          const street = dataNode.getAttribute("street") || "";
          const loc = dataNode.getAttribute("loc") || "";
          const dist = dataNode.getAttribute("dist") || "";
          const state = dataNode.getAttribute("state") || "";
          const fullAddress = [house, street, loc, dist, state].filter(Boolean).join(", ");

          setFormData((prev) => ({
            ...prev,
            fullName: name || prev.fullName,
            aadharNumber: uid || prev.aadharNumber,
            gender: gender === "M" ? "MALE" : gender === "F" ? "FEMALE" : prev.gender,
            currentAddress: fullAddress || prev.currentAddress,
            aadharPincode: pincode || prev.aadharPincode,
          }));
          
          setMessage({ type: "success", text: "Aadhaar Scanned Successfully!" });
          setScanOpen(false);
          return;
        }
      } 
      
      alert("Unrecognized Aadhaar format. Please ensure you are scanning a valid Indian Aadhaar card.");
      setScanOpen(false);

    } catch (error) {
      console.error("Failed to parse QR", error);
      alert("Failed to read QR code data.");
      setScanOpen(false);
    }
  };

  // --- Handlers ---
  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    if (name === "aadharNumber" && value.length > 12) return;
    if (name === "mobileNumber" && value.length > 10) return;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  useEffect(() => {
    const checkAadhar = async () => {
      if (formData.aadharNumber.length === 12) {
        if (isEditMode && formData.aadharNumber === initialData?.aadharNumber) return;
        const res = await checkAadharDuplicate(formData.aadharNumber);
        if (res.exists)
          setAadharStatus({ exists: true, message: res.message || "Aadhar number already registered", name: res.name });
        else setAadharStatus(null);
      } else {
        setAadharStatus(null);
      }
    };
    checkAadhar();
  }, [formData.aadharNumber, isEditMode, initialData]);

  // --- Helper Functions ---
  const updateStats = (list: FamilyMember[]) => {
    const sons = list.filter((m) => m.relation === "SON").length;
    const daughters = list.filter((m) => m.relation === "DAUGHTER").length;
    const others = list.filter((m) => ["FATHER", "MOTHER", "HUSBAND"].includes(m.relation)).length;
    
    setFormData((prev) => ({
      ...prev,
      sons,
      daughters,
      otherDependents: others,
    }));
  };

  const addMember = () => {
    if (!newMember.name || !newMember.age) return alert("Please enter Name and Age");
    
    const member: FamilyMember = {
      id: generateUniqueId(),
      name: newMember.name!,
      relation: (newMember.relation as any) || "SON",
      age: newMember.age!,
      isEarning: newMember.isEarning || false,
      occupation: newMember.occupation || "None",
      monthlyIncome: newMember.monthlyIncome || "0",
      livesWithFamily: newMember.livesWithFamily ?? true,
      maritalStatus: (newMember.maritalStatus as any) || "SINGLE",
      isStudying: newMember.isStudying || false,
      schoolName: newMember.schoolName || "",
      classStandard: newMember.classStandard || "",
      memberNotes: newMember.memberNotes || "",
    };

    const updatedList = [...familyMembers, member];
    setFamilyMembers(updatedList);
    updateStats(updatedList);
    setIsAddingMember(false);
    
    setNewMember({
      relation: "SON", livesWithFamily: true, isEarning: false, maritalStatus: "SINGLE",
      occupation: "", monthlyIncome: "", isStudying: false, schoolName: "", classStandard: ""
    });
  };

  const removeMember = (id: string) => {
    const updatedList = familyMembers.filter((m) => m.id !== id);
    setFamilyMembers(updatedList);
    updateStats(updatedList);
  };

  const toggleProblem = (tag: string) => {
    setFormData((prev) => {
      const exists = prev.problems.includes(tag);
      return exists
        ? { ...prev, problems: prev.problems.filter((t: string) => t !== tag) }
        : { ...prev, problems: [...prev.problems, tag] };
    });
  };

  const handleAddCustomProblem = () => {
    const trimmed = customProblem.trim();
    if (!trimmed || formData.problems.includes(trimmed)) return;
    setFormData((prev) => ({ ...prev, problems: [...prev.problems, trimmed] }));
    setCustomProblem("");
  };

  // --- Submit Handler ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formData.aadharNumber.length !== 12 || formData.mobileNumber.length !== 10) return;

    setLoading(true);

    // DYNAMICALLY CALCULATE FINAL TOTALS RIGHT BEFORE SUBMIT
    const familyEarners = familyMembers.filter(m => m.isEarning).length;
    const familyIncome = familyMembers.reduce((sum, m) => sum + Number(m.monthlyIncome || 0), 0);
    
    const totalEarners = familyEarners + (formData.isEarning ? 1 : 0);
    const totalIncome = familyIncome + Number(formData.monthlyIncome || 0);

    const finalData = { 
      ...formData, 
      familyMembersDetail: familyMembers,
      earningMembersCount: totalEarners,
      totalFamilyIncome: totalIncome
    };

    const result = isEditMode && initialData?._id
        ? await updateBeneficiary(initialData._id, finalData)
        : await registerBeneficiary(finalData);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      // --- FIX: FORCE RESET THE EXCEPTION CHECKBOX ---
      if (!isEditMode) {
         setFormData(prev => ({ ...prev, isException: false }));
      }
      // -----------------------------------------------
      setTimeout(() => {
        handleBack(isEditMode ? `/beneficiaries/${initialData._id}` : "/");
      }, 1000);
    } else {
      setMessage({ type: "error", text: result.message });
      setLoading(false);
    }
  };

  if (isNavigating) return <NavigationLoader message="Processing & Redirecting..." />;

  return (
    <form onSubmit={handleSubmit} className="space-y-8 pb-32 max-w-3xl mx-auto font-outfit">
      
      {/* 1. Identity Section */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        
        {/* === UPDATED HEADER WITH SCAN BUTTON === */}
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-green-50 dark:bg-green-900/20 rounded-2xl">
              <Fingerprint className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none">
                Identity
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Verification
              </p>
            </div>
          </div>
          
          <button
            type="button"
            onClick={() => setScanOpen(true)}
            className="flex items-center gap-2 bg-green-100 hover:bg-green-200 dark:bg-green-900/30 dark:hover:bg-green-900/50 text-green-700 dark:text-green-400 px-4 py-2.5 rounded-xl text-xs font-black uppercase tracking-widest transition-colors active:scale-95"
          >
            <QrCode className="w-4 h-4" /> Scan QR
          </button>
        </div>

        <div className="space-y-6">
          <div>
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
              Full Name
            </label>
            <input
              required
              name="fullName"
              value={formData.fullName}
              onChange={handleChange}
              type="text"
              placeholder="e.g. Fatima Shaikh"
              className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-green-500 focus:bg-white dark:focus:bg-gray-900 outline-none transition-all font-bold text-gray-900 dark:text-white"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                  Aadhaar (12 Digits)
                </label>
                <span className={`text-[10px] font-black ${formData.aadharNumber.length === 12 ? "text-green-600" : "text-red-500"}`}>
                  {formData.aadharNumber.length} / 12
                </span>
              </div>
              <input
                required
                name="aadharNumber"
                value={formData.aadharNumber}
                onChange={handleChange}
                type="number"
                placeholder="0000 0000 0000"
                className={`w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 outline-none transition-all font-mono font-bold text-lg ${formData.aadharNumber.length === 12 && !aadharStatus ? "border-green-100 dark:border-green-900/30" : "border-transparent focus:border-green-500"}`}
              />
              {aadharStatus?.exists && (
                <div className="mt-3 p-3 bg-red-50 dark:bg-red-900/10 border border-red-100 dark:border-red-900/30 rounded-2xl flex gap-2 animate-in fade-in zoom-in-95">
                  <AlertTriangle className="w-4 h-4 text-red-600 shrink-0" />
                  <p className="text-[11px] text-red-700 dark:text-red-400 font-bold leading-tight">
                    Duplicate: Registered as {aadharStatus.name}
                  </p>
                  <p className="text-[11px] text-red-700 dark:text-red-400 font-bold leading-tight">
                    Duplicate: Registered as {aadharStatus.mobileNumber}
                  </p>
                </div>
              )}
            </div>

            <div>
              <div className="flex justify-between items-center mb-1.5 px-1">
                <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest leading-none">
                  Mobile (10 Digits)
                </label>
                <span className={`text-[10px] font-black ${formData.mobileNumber.length === 10 ? "text-green-600" : "text-red-500"}`}>
                  {formData.mobileNumber.length} / 10
                </span>
              </div>
              <div className="relative">
                <Smartphone className="absolute left-4 top-4 w-5 h-5 text-gray-400" />
                <input
                  required
                  name="mobileNumber"
                  value={formData.mobileNumber}
                  onChange={handleChange}
                  type="number"
                  placeholder="98XXXXXXXX"
                  className="w-full p-4 pl-12 rounded-2xl bg-gray-50 dark:bg-gray-800 border-2 border-transparent focus:border-green-500 outline-none transition-all font-mono font-bold text-lg"
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
                Gender
              </label>
              <select
                name="gender"
                value={formData.gender}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>
            </div>
            <div>
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
                Status
              </label>
              <select
                name="husbandStatus"
                value={formData.husbandStatus}
                onChange={handleChange}
                className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none outline-none font-bold"
              >
                <option value="ALIVE">Alive</option>
                <option value="WIDOW">Widow</option>
                <option value="DISABLED">Disabled</option>
                <option value="ABANDONED">Abandoned</option>
                <option value="NOT_MARRIED">Not Married</option>
              </select>
            </div>
          </div>

          {/* --- NEW: Primary Applicant Earning Status --- */}
          <div className="flex flex-col gap-3 mt-4 bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700">
            <div className="flex items-center gap-2">
                <input
                    type="checkbox"
                    checked={formData.isEarning}
                    onChange={(e) => {
                      const checked = e.target.checked;
                      setFormData(prev => ({
                        ...prev,
                        isEarning: checked,
                        // Clear income if they uncheck the box
                        occupation: checked ? prev.occupation : "",
                        monthlyIncome: checked ? prev.monthlyIncome : ""
                      }));
                    }}
                    className="w-4 h-4 accent-green-600"
                />
                <span className={`text-sm font-bold ${formData.isEarning ? "text-green-600" : "text-gray-500"}`}>
                    Is the main applicant earning an income?
                </span>
            </div>

            {formData.isEarning && (
                <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2 mt-2">
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <Briefcase className="w-4 h-4 text-gray-400" />
                        <input
                            type="text"
                            name="occupation"
                            placeholder="Occupation (e.g. Tailor)"
                            value={formData.occupation}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-sm font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                    <div className="flex items-center gap-2 bg-white dark:bg-gray-900 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800">
                        <span className="text-gray-400 font-bold">₹</span>
                        <input
                            type="number"
                            name="monthlyIncome"
                            placeholder="Monthly Income"
                            value={formData.monthlyIncome}
                            onChange={handleChange}
                            className="w-full bg-transparent outline-none text-sm font-bold text-gray-900 dark:text-white"
                        />
                    </div>
                </div>
            )}
          </div>
        </div>
      </section>

      {/* 2. Residence Section */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-blue-50 dark:bg-blue-900/20 rounded-2xl">
            <HomeIcon className="w-6 h-6 text-blue-600" />
          </div>
          <div>
            <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none">
              Residence
            </h3>
            <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
              Address Details
            </p>
          </div>
        </div>
        <div className="space-y-6">
          <textarea
            required
            name="currentAddress"
            value={formData.currentAddress}
            onChange={handleChange}
            rows={2}
            placeholder="Building, Room No, Locality..."
            className="w-full p-4 rounded-2xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 text-sm font-bold resize-none"
          />
          
          {/* --- AREA FIELD (FULL ROW) --- */}
          <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
            <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
              Area
            </label>
            <input
              required
              name="area"
              list="area-options"
              value={formData.area}
              onChange={handleChange}
              type="text"
              placeholder="e.g. Kurla-400024"
              className="w-full bg-transparent border-none outline-none font-bold text-gray-900 dark:text-white text-sm"
            />
            <datalist id="area-options">
              <option value="Kurla-400024" />
              <option value="Saki Naka-400072" />
              <option value="Bandra-400050" />
            </datalist>
          </div>

          {/* --- PINCODES (2 COLUMNS) --- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-50 dark:bg-gray-800 p-3 rounded-2xl">
              <label className="text-[9px] font-black text-gray-400 uppercase tracking-widest mb-1 block">
                Aadhar Pincode
              </label>
              <input
                required
                name="aadharPincode"
                value={formData.aadharPincode}
                onChange={handleChange}
                type="number"
                placeholder="4XXXXX"
                className="w-full bg-transparent border-none outline-none font-mono font-bold text-gray-900 dark:text-white"
              />
            </div>
            
            <div className="bg-blue-50 dark:bg-blue-900/10 p-3 rounded-2xl border border-blue-100 dark:border-blue-900/30">
              <label className="text-[9px] font-black text-blue-600 dark:text-blue-400 uppercase tracking-widest mb-1 block">
                Current Pincode
              </label>
              <input
                required
                name="currentPincode"
                value={formData.currentPincode}
                onChange={handleChange}
                type="number"
                className="w-full bg-transparent border-none outline-none font-mono font-black text-blue-700 dark:text-blue-300 text-lg"
              />
            </div>
          </div>
        </div>
      </section>

      {/* 3. Family Members */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-purple-50 dark:bg-purple-900/20 rounded-2xl">
              <Users className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="text-xl font-black text-gray-900 dark:text-white leading-none">
                Family
              </h3>
              <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mt-1">
                Members: {familyMembers.length}
              </p>
            </div>
          </div>
        </div>

        <div className="space-y-3 mb-6">
          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="flex justify-between items-center bg-gray-50 dark:bg-gray-800 p-4 rounded-2xl border border-gray-100 dark:border-gray-700"
            >
              <div>
                <div className="flex items-center gap-2 mb-1">
                  <span className="font-bold text-gray-900 dark:text-white">
                    {member.name}
                  </span>
                  <span className="text-[9px] px-2 py-0.5 rounded-lg bg-purple-100 text-purple-700 font-bold uppercase">
                    {member.relation}
                  </span>
                </div>
                <div className="text-xs text-gray-500 font-medium flex gap-2">
                  <span>{member.age} Yrs</span>
                  <span>•</span>
                  {member.isEarning ? (
                    <span className="text-green-600 font-bold">Earns ₹{member.monthlyIncome}</span>
                  ) : member.isStudying ? (
                    <span className="text-blue-600 font-bold">{member.classStandard} @ {member.schoolName}</span>
                  ) : (
                    <span>Not Earning</span>
                  )}
                </div>
              </div>
              <button
                type="button"
                onClick={() => removeMember(member.id)}
                className="p-2 text-red-400 hover:bg-white dark:hover:bg-gray-700 rounded-xl transition-colors"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {!isAddingMember ? (
          <button
            type="button"
            onClick={() => setIsAddingMember(true)}
            className="w-full py-4 border-2 border-dashed border-gray-200 dark:border-gray-700 rounded-2xl text-gray-400 font-bold flex items-center justify-center gap-2 hover:bg-gray-50 dark:hover:bg-gray-800 transition-all"
          >
            <UserPlus className="w-5 h-5" /> Add Member
          </button>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-5 rounded-3xl border border-purple-100 dark:border-purple-900/30">
            <h4 className="text-xs font-black text-purple-600 uppercase tracking-widest mb-4">
              New Member Details
            </h4>
            
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name"
                value={newMember.name || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
                className="p-3 rounded-xl text-sm font-bold bg-white dark:bg-gray-900 outline-none"
              />
              <input
                type="number"
                placeholder="Age"
                value={newMember.age || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, age: e.target.value })
                }
                className="p-3 rounded-xl text-sm font-bold bg-white dark:bg-gray-900 outline-none"
              />
            </div>

            <div className="grid grid-cols-2 gap-3 mb-3">
              <select
                value={newMember.relation}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    relation: e.target.value as any,
                  })
                }
                className="p-3 rounded-xl text-sm font-bold bg-white dark:bg-gray-900 outline-none"
              >
                <option value="SON">Son</option>
                <option value="DAUGHTER">Daughter</option>
                <option value="HUSBAND">Husband</option>
                <option value="MOTHER">Mother</option>
                <option value="FATHER">Father</option>
              </select>
              <select
                value={newMember.maritalStatus}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    maritalStatus: e.target.value as any,
                  })
                }
                className="p-3 rounded-xl text-sm font-bold bg-white dark:bg-gray-900 outline-none"
              >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
              </select>
            </div>

            {/* Earning Toggle */}
            <div className="flex flex-col gap-3 mb-3 bg-white dark:bg-gray-900 p-3 rounded-xl">
                <div className="flex items-center gap-2">
                    <input
                        type="checkbox"
                        checked={newMember.isEarning}
                        onChange={(e) => {
                            setNewMember({ 
                                ...newMember, 
                                isEarning: e.target.checked,
                                isStudying: e.target.checked ? false : newMember.isStudying 
                            })
                        }}
                        className="w-4 h-4 accent-green-600"
                    />
                    <span className={`text-sm font-bold ${newMember.isEarning ? "text-green-600" : "text-gray-500"}`}>Is Earning?</span>
                </div>

                {newMember.isEarning && (
                    <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                            <Briefcase className="w-4 h-4 text-gray-400" />
                            <input
                                type="text"
                                placeholder="Occupation"
                                value={newMember.occupation || ""}
                                onChange={(e) => setNewMember({ ...newMember, occupation: e.target.value })}
                                className="w-full bg-transparent outline-none text-xs font-bold"
                            />
                        </div>
                        <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                            <span className="text-gray-400 font-bold">₹</span>
                            <input
                                type="number"
                                placeholder="Income"
                                value={newMember.monthlyIncome || ""}
                                onChange={(e) => setNewMember({ ...newMember, monthlyIncome: e.target.value })}
                                className="w-full bg-transparent outline-none text-xs font-bold"
                            />
                        </div>
                    </div>
                )}
            </div>

            {/* Education Toggle */}
            {!newMember.isEarning && (
                <div className="flex flex-col gap-3 mb-4 bg-white dark:bg-gray-900 p-3 rounded-xl">
                    <div className="flex items-center gap-2">
                        <input
                            type="checkbox"
                            checked={newMember.isStudying}
                            onChange={(e) => setNewMember({ ...newMember, isStudying: e.target.checked })}
                            className="w-4 h-4 accent-blue-600"
                        />
                        <span className={`text-sm font-bold ${newMember.isStudying ? "text-blue-600" : "text-gray-500"}`}>Is Studying?</span>
                    </div>

                    {newMember.isStudying && (
                        <div className="grid grid-cols-2 gap-3 animate-in fade-in slide-in-from-top-2">
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <HomeIcon className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="School/College"
                                    value={newMember.schoolName || ""}
                                    onChange={(e) => setNewMember({ ...newMember, schoolName: e.target.value })}
                                    className="w-full bg-transparent outline-none text-xs font-bold"
                                />
                            </div>
                            <div className="flex items-center gap-2 bg-gray-50 dark:bg-gray-800 p-2 rounded-lg">
                                <GraduationCap className="w-4 h-4 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Class (e.g. 5th)"
                                    value={newMember.classStandard || ""}
                                    onChange={(e) => setNewMember({ ...newMember, classStandard: e.target.value })}
                                    className="w-full bg-transparent outline-none text-xs font-bold"
                                />
                            </div>
                        </div>
                    )}
                </div>
            )}

            <div className="mb-4">
              <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1.5 block">
                Member Notes (Living Status / Habits / Alcohol)
              </label>
              <textarea
                placeholder="e.g. Lives in village, Takes alcohol, Chronic illness..."
                value={newMember.memberNotes || ""}
                onChange={(e) => setNewMember({ ...newMember, memberNotes: e.target.value })}
                className="w-full p-3 rounded-xl text-xs font-bold bg-white dark:bg-gray-900 outline-none border border-transparent focus:border-red-400 transition-all resize-none"
                rows={2}
              />
            </div>

            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="flex-1 py-3 text-sm font-bold text-gray-500 bg-white dark:bg-gray-900 rounded-xl"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addMember}
                className="flex-1 py-3 text-sm font-bold text-white bg-purple-600 rounded-xl shadow-lg shadow-purple-200 dark:shadow-none"
              >
                Save Member
              </button>
            </div>
          </div>
        )}
      </section>

      {/* 4. Housing & Problems */}
      <section className="bg-white dark:bg-gray-900 p-6 rounded-[2.5rem] border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-2xl mb-6">
          <button
            type="button"
            onClick={() =>
              setFormData({ ...formData, housingType: "OWN", rentAmount: 0 })
            }
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.housingType === "OWN" ? "bg-white shadow dark:bg-gray-700 text-gray-900 dark:text-white" : "text-gray-400"}`}
          >
            Own House
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, housingType: "RENT" })}
            className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${formData.housingType === "RENT" ? "bg-white shadow dark:bg-gray-700 text-red-500" : "text-gray-400"}`}
          >
            Rented
          </button>
        </div>
        {formData.housingType === "RENT" && (
          <div className="mb-6 animate-in fade-in">
            <label className="text-[10px] font-black text-gray-400 uppercase tracking-widest ml-1 mb-1 block">
              Monthly Rent Amount
            </label>
            <input
              type="number"
              name="rentAmount"
              value={formData.rentAmount}
              onChange={handleChange}
              className="w-full p-4 rounded-2xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 text-red-600 font-black text-lg"
            />
          </div>
        )}
        <div className="flex flex-wrap gap-2 mb-4">
          {PROBLEM_TAGS.map((tag) => (
            <button
              key={tag}
              type="button"
              onClick={() => toggleProblem(tag)}
              className={`px-4 py-2 rounded-full text-xs font-bold border transition-all ${formData.problems.includes(tag) ? "bg-red-500 text-white border-red-500" : "border-gray-200 dark:border-gray-700 text-gray-500"}`}
            >
              {tag}
            </button>
          ))}
        </div>
        <div className="flex gap-2">
          <input
            type="text"
            value={customProblem}
            onChange={(e) => setCustomProblem(e.target.value)}
            placeholder="Other Problem..."
            className="flex-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 text-sm font-bold outline-none"
          />
          <button
            type="button"
            onClick={handleAddCustomProblem}
            className="bg-gray-900 dark:bg-gray-700 text-white px-5 rounded-xl text-sm font-bold"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-2 mt-3">
          {formData.problems
            .filter((p: any) => !PROBLEM_TAGS.includes(p))
            .map((tag: any) => (
              <span
                key={tag}
                className="px-3 py-1 rounded-full bg-blue-50 text-blue-600 text-xs font-bold border border-blue-100 flex items-center gap-2"
              >
                {tag}{" "}
                <button
                  type="button"
                  onClick={() => toggleProblem(tag)}
                  className="text-red-500 font-black"
                >
                  ×
                </button>
              </span>
            ))}
        </div>
      </section>

      {/* 5. Reference */}
      <section className="bg-linear-to-br from-gray-900 to-gray-800 dark:from-gray-800 dark:to-black p-6 rounded-[2.5rem] text-white shadow-xl font-outfit">
        <div className="flex items-center gap-3 mb-4">
          <ShieldCheck className="w-5 h-5 text-green-400" />
          <h3 className="font-bold">Trust Verification</h3>
        </div>
        <input
          name="referencedBy"
          value={formData.referencedBy}
          onChange={handleChange}
          placeholder="Referenced By (Name)"
          className="w-full p-4 bg-white/10 rounded-2xl border border-white/10 focus:bg-white/20 outline-none font-bold placeholder:text-gray-500 text-white transition-all"
        />
        <textarea
          name="comments"
          value={formData.comments}
          onChange={handleChange}
          rows={2}
          placeholder="Additional Admin Notes..."
          className="w-full mt-4 p-4 bg-white/10 rounded-2xl border border-white/10 focus:bg-white/20 outline-none font-medium text-sm placeholder:text-gray-500 text-white transition-all resize-none"
        />

        {/* --- NEW: EXCEPTION CHECKBOX --- */}
        <div className="flex items-center gap-3 mt-4 p-4 bg-red-500/10 border border-red-500/30 rounded-2xl transition-colors hover:bg-red-500/20">
          <input
            type="checkbox"
            checked={formData.isException}
            onChange={(e) => setFormData(prev => ({ ...prev, isException: e.target.checked }))}
            className="w-5 h-5 accent-red-500 cursor-pointer"
          />
          <div className="flex flex-col cursor-pointer" onClick={() => setFormData(prev => ({ ...prev, isException: !prev.isException }))}>
            <span className="text-sm font-bold text-red-400">Special Case Exception</span>
            <span className="text-[10px] text-gray-400 mt-0.5">Bypass pincode area restrictions for this family</span>
          </div>
        </div>
        
      </section>

      {/* --- Floating Action Bar --- */}
      <div className="fixed bottom-0 left-0 right-0 p-6 bg-white/80 dark:bg-[#020617]/80 backdrop-blur-xl border-t border-gray-200 dark:border-gray-800 z-50">
        <div className="max-w-3xl mx-auto flex items-center gap-3">
          <button
            type="button"
            onClick={() => handleBack("/")}
            disabled={loading}
            className="p-5 bg-gray-100 dark:bg-gray-800 rounded-[2rem] text-gray-500 active:scale-95 transition-transform"
          >
            <X className="w-5 h-5" />
          </button>

          <button
            disabled={
              loading ||
              formData.aadharNumber.length !== 12 ||
              formData.mobileNumber.length !== 10 ||
              !!aadharStatus
            }
            className={`flex-1 py-5 rounded-[2rem] font-black shadow-2xl transition-all active:scale-[0.98] flex justify-center items-center gap-3 ${
              loading ||
              formData.aadharNumber.length !== 12 ||
              formData.mobileNumber.length !== 10 ||
              !!aadharStatus
                ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                : "bg-green-600 hover:bg-green-700 text-white shadow-green-200 dark:shadow-none"
            }`}
          >
            {loading ? (
              <Loader2 className="animate-spin" />
            ) : (
              <>
                <span className="tracking-widest uppercase text-xs">
                  {isEditMode ? "UPDATE RECORDS" : "AUTHORIZE REGISTRATION"}
                </span>
                <ChevronRight className="w-4 h-4" />
              </>
            )}
          </button>
        </div>

        {/* Toast */}
        {message && (
          <div
            className={`mt-3 p-3 rounded-xl flex items-center justify-center gap-3 animate-in slide-in-from-bottom-2 ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
          >
            {message.type === "success" ? (
              <CheckCircle className="w-4 h-4" />
            ) : (
              <AlertTriangle className="w-4 h-4" />
            )}
            <span className="text-xs font-bold">{message.text}</span>
          </div>
        )}
      </div>

      {/* === RENDER SCANNER MODAL === */}
      {scanOpen && (
        <AadhaarQRScanner
          onScan={handleAadhaarScan}
          onClose={() => setScanOpen(false)}
        />
      )}
    </form>
  );
}