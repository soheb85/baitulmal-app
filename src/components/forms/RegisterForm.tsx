/* eslint-disable @typescript-eslint/no-explicit-any */
"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { registerBeneficiary } from "@/app/actions/registerBeneficiary";
import {
  Loader2,
  CheckCircle,
  AlertTriangle,
  UserPlus,
  Trash2,
} from "lucide-react";

// --- Types ---
type FamilyMember = {
  id: string;
  name: string;
  relation: "SON" | "DAUGHTER" | "HUSBAND" | "WIFE" | "FATHER" | "MOTHER";
  age: string;
  isEarning: boolean;
  occupation: string;
  monthlyIncome: string;
  livesWithFamily: boolean;
  maritalStatus: "SINGLE" | "MARRIED" | "DIVORCED";
};

// Common Problems for Tags
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

// --- HELPER FUNCTION: Defined OUTSIDE the component ---
// This prevents the "impure function during render" error
const generateUniqueId = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  // Fallback for older browsers
  return `member-${Date.now()}-${Math.floor(Math.random() * 10000)}`;
};

export default function RegisterForm() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{
    type: "success" | "error";
    text: string;
  } | null>(null);
  const [customProblem, setCustomProblem] = useState("");

  // --- State: Main Form Data ---
  const [formData, setFormData] = useState({
    fullName: "",
    aadharNumber: "",
    mobileNumber: "",
    gender: "FEMALE",
    husbandStatus: "ALIVE",

    // These will be auto-calculated from familyMembers list
    sons: 0,
    daughters: 0,
    otherDependents: 0,
    earningMembersCount: 0,
    totalFamilyIncome: 0,

    housingType: "OWN",
    rentAmount: 0,

    currentAddress: "",
    aadharPincode: "",
    currentPincode: "400024",

    problems: [] as string[],
    comments: "",
    referencedBy: "",
  });

  // --- State: Family Members List ---
  const [familyMembers, setFamilyMembers] = useState<FamilyMember[]>([]);
  const [isAddingMember, setIsAddingMember] = useState(false);

  // Temporary state for the "Add New Member" input fields
  const [newMember, setNewMember] = useState<Partial<FamilyMember>>({
    relation: "SON",
    livesWithFamily: true,
    isEarning: false,
    maritalStatus: "SINGLE",
    occupation: "",
    monthlyIncome: "",
  });

  // --- Handlers ---

  const handleChange = (
    e: React.ChangeEvent<
      HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement
    >,
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const toggleProblem = (tag: string) => {
    setFormData((prev) => {
      const exists = prev.problems.includes(tag);
      if (exists)
        return { ...prev, problems: prev.problems.filter((t) => t !== tag) };
      return { ...prev, problems: [...prev.problems, tag] };
    });
  };

  // --- Logic: Add Family Member ---
  const addMember = () => {
    if (!newMember.name || !newMember.age) {
      alert("Please enter Name and Age");
      return;
    }

    // Call the helper function here
    const memberId = generateUniqueId();

    const member: FamilyMember = {
      id: memberId,
      name: newMember.name!,
      relation: (newMember.relation as any) || "SON",
      age: newMember.age!,
      isEarning: newMember.isEarning || false,
      occupation: newMember.occupation || "Unemployed",
      monthlyIncome: newMember.monthlyIncome || "0",
      livesWithFamily: newMember.livesWithFamily ?? true,
      maritalStatus: (newMember.maritalStatus as any) || "SINGLE",
    };

    const updatedList = [...familyMembers, member];
    updateStats(updatedList);
    setFamilyMembers(updatedList);

    // Reset inputs
    setNewMember({
      relation: "SON",
      livesWithFamily: true,
      isEarning: false,
      maritalStatus: "SINGLE",
      occupation: "",
      monthlyIncome: "",
    });
    setIsAddingMember(false);
  };

  // --- Logic: Remove Family Member ---
  const removeMember = (id: string) => {
    const updatedList = familyMembers.filter((m) => m.id !== id);
    updateStats(updatedList);
    setFamilyMembers(updatedList);
  };

  // --- Logic: Auto-Calculate Stats ---
  const updateStats = (list: FamilyMember[]) => {
    const sons = list.filter((m) => m.relation === "SON").length;
    const daughters = list.filter((m) => m.relation === "DAUGHTER").length;
    const others = list.filter((m) =>
      ["FATHER", "MOTHER", "HUSBAND"].includes(m.relation),
    ).length;
    const earners = list.filter((m) => m.isEarning).length;
    const income = list.reduce(
      (sum, m) => sum + Number(m.monthlyIncome || 0),
      0,
    );

    setFormData((prev) => ({
      ...prev,
      sons,
      daughters,
      otherDependents: others,
      earningMembersCount: earners,
      totalFamilyIncome: income,
    }));
  };

  const handleAddCustomProblem = (e: React.MouseEvent | React.KeyboardEvent) => {
    e.preventDefault();
    const trimmed = customProblem.trim();
    
    if (!trimmed) return; // Don't add empty
    if (formData.problems.includes(trimmed)) {
      setCustomProblem(""); // Already exists, just clear input
      return;
    }

    setFormData(prev => ({
      ...prev,
      problems: [...prev.problems, trimmed]
    }));
    setCustomProblem("");
  };

  // NEW HANDLER: Remove specific problem (for custom tags)
  const removeProblem = (tag: string) => {
     setFormData(prev => ({
       ...prev,
       problems: prev.problems.filter(t => t !== tag)
     }));
  };

  // --- Logic: Submit Form ---
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    // Combine standard data with the detailed list
    const finalData = {
      ...formData,
      familyMembersDetail: familyMembers,
    };

    const result = await registerBeneficiary(finalData);

    if (result.success) {
      setMessage({ type: "success", text: result.message });
      setTimeout(() => router.push("/"), 2000);
    } else {
      setMessage({ type: "error", text: result.message });
    }
    setLoading(false);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 pb-24">
      {/* --- Section 1: Personal Details --- */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-lg font-outfit font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-100 dark:border-gray-800">
          Personal Details
        </h3>

        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Full Name
            </label>
            <input
              required
              name="fullName"
              onChange={handleChange}
              type="text"
              placeholder="e.g. Fatima Shaikh"
              className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-green-500 font-inter"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Aadhaar No.
              </label>
              <input
                required
                name="aadharNumber"
                onChange={handleChange}
                type="number"
                placeholder="12 Digit No"
                className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-green-500 font-inter"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Mobile
              </label>
              <input
                required
                name="mobileNumber"
                onChange={handleChange}
                type="tel"
                placeholder="9876..."
                className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-green-500 font-inter"
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Gender
              </label>
              <select
                name="gender"
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none"
              >
                <option value="FEMALE">Female</option>
                <option value="MALE">Male</option>
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Husband Status
              </label>
              <select
                name="husbandStatus"
                onChange={handleChange}
                className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none"
              >
                <option value="ALIVE">Alive</option>
                <option value="WIDOW">Widow</option>
                <option value="DISABLED">Disabled</option>
                <option value="ABANDONED">Abandoned</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* --- Section 2: Address --- */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-lg font-outfit font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-100 dark:border-gray-800">
          Address
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Current Address
            </label>
            <textarea
              required
              name="currentAddress"
              onChange={handleChange}
              rows={2}
              placeholder="Room No, Building Name..."
              className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-green-500 font-inter"
            />
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Aadhaar Pincode
              </label>
              <input
                required
                name="aadharPincode"
                onChange={handleChange}
                type="number"
                placeholder="xxxxxx"
                className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-green-500 font-inter"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-gray-500 uppercase text-green-600">
                Current Pincode
              </label>
              <input
                required
                name="currentPincode"
                value={formData.currentPincode}
                onChange={handleChange}
                type="number"
                className="w-full mt-1 p-3 rounded-xl bg-green-50 dark:bg-green-900/30 border border-green-200 dark:border-green-800 focus:ring-2 focus:ring-green-500 font-inter font-bold"
              />
            </div>
          </div>
        </div>
      </div>

      {/* --- Section 3: Family Members (Dynamic List) --- */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <div className="flex justify-between items-center mb-4 border-b pb-2 border-gray-100 dark:border-gray-800">
          <h3 className="text-lg font-outfit font-bold text-gray-800 dark:text-gray-100">
            Family Members
          </h3>
          <span className="text-xs bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded text-gray-500 font-medium">
            Total: {familyMembers.length}
          </span>
        </div>

        {/* List of Added Members */}
        <div className="space-y-3 mb-6">
          {familyMembers.length === 0 && (
            <p className="text-center text-sm text-gray-400 italic py-4">
              No members added yet.
            </p>
          )}

          {familyMembers.map((member) => (
            <div
              key={member.id}
              className="flex justify-between items-start bg-gray-50 dark:bg-gray-800 p-3 rounded-xl border border-gray-100 dark:border-gray-700"
            >
              <div>
                <div className="flex items-center gap-2 flex-wrap">
                  <span className="font-bold font-outfit text-gray-800 dark:text-gray-200">
                    {member.name}
                  </span>
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-bold uppercase">
                    {member.relation}
                  </span>
                  {!member.livesWithFamily && (
                    <span className="text-[10px] px-2 py-0.5 rounded-full bg-red-100 text-red-700 font-bold">
                      SEPARATE
                    </span>
                  )}
                </div>
                <div className="text-xs text-gray-500 mt-1 flex gap-2 items-center">
                  <span>Age: {member.age}</span>
                  <span className="w-1 h-1 rounded-full bg-gray-300"></span>
                  <span>{member.maritalStatus}</span>
                </div>
                {member.isEarning ? (
                  <div className="text-xs text-green-600 font-semibold mt-1">
                    Earns ₹{member.monthlyIncome} ({member.occupation})
                  </div>
                ) : (
                  <div className="text-xs text-gray-400 mt-1">Not Earning</div>
                )}
              </div>
              <button
                onClick={() => removeMember(member.id)}
                type="button"
                className="text-red-400 hover:text-red-600 p-2 bg-white dark:bg-gray-700 rounded-lg shadow-sm"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          ))}
        </div>

        {/* Add New Member Button or Form */}
        {!isAddingMember ? (
          <button
            type="button"
            onClick={() => setIsAddingMember(true)}
            className="w-full py-3 border-2 border-dashed border-gray-300 dark:border-gray-700 rounded-xl text-gray-500 font-semibold hover:bg-gray-50 dark:hover:bg-gray-800 transition-all flex items-center justify-center gap-2"
          >
            <UserPlus className="w-5 h-5" />
            Add Son / Daughter / Parent
          </button>
        ) : (
          <div className="bg-gray-50 dark:bg-gray-800/50 p-4 rounded-xl border border-green-200 dark:border-green-900 shadow-inner">
            <h4 className="text-sm font-bold text-green-700 mb-3 uppercase tracking-wide">
              New Member Details
            </h4>

            {/* Row 1 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="text"
                placeholder="Name"
                value={newMember.name || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, name: e.target.value })
                }
                className="p-2 rounded-lg text-sm border font-inter bg-white dark:bg-gray-900"
              />
              <select
                value={newMember.relation}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    relation: e.target.value as any,
                  })
                }
                className="p-2 rounded-lg text-sm border bg-white dark:bg-gray-900"
              >
                <option value="SON">Son</option>
                <option value="DAUGHTER">Daughter</option>
                <option value="HUSBAND">Husband</option>
                <option value="MOTHER">Mother</option>
                <option value="FATHER">Father</option>
              </select>
            </div>

            {/* Row 2 */}
            <div className="grid grid-cols-2 gap-3 mb-3">
              <input
                type="number"
                placeholder="Age"
                value={newMember.age || ""}
                onChange={(e) =>
                  setNewMember({ ...newMember, age: e.target.value })
                }
                className="p-2 rounded-lg text-sm border font-inter bg-white dark:bg-gray-900"
              />
              <select
                value={newMember.maritalStatus}
                onChange={(e) =>
                  setNewMember({
                    ...newMember,
                    maritalStatus: e.target.value as any,
                  })
                }
                className="p-2 rounded-lg text-sm border bg-white dark:bg-gray-900"
              >
                <option value="SINGLE">Single</option>
                <option value="MARRIED">Married</option>
                <option value="DIVORCED">Divorced</option>
              </select>
            </div>

            {/* Row 3: Income */}
            <div className="mb-3 bg-white dark:bg-gray-900 p-3 rounded-lg border border-gray-200 dark:border-gray-700">
              <label className="flex items-center gap-2 mb-2 cursor-pointer select-none">
                <input
                  type="checkbox"
                  checked={newMember.isEarning}
                  onChange={(e) =>
                    setNewMember({
                      ...newMember,
                      isEarning: e.target.checked,
                    })
                  }
                  className="w-4 h-4 accent-green-600 rounded"
                />
                <span className="text-sm font-semibold text-gray-700 dark:text-gray-300">
                  Is this person earning?
                </span>
              </label>

              {newMember.isEarning && (
                <div className="grid grid-cols-2 gap-3 mt-2 animate-in fade-in slide-in-from-top-1">
                  <input
                    type="text"
                    placeholder="Job (e.g. Driver)"
                    value={newMember.occupation || ""}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        occupation: e.target.value,
                      })
                    }
                    className="p-2 rounded-lg text-xs border bg-gray-50 dark:bg-gray-800"
                  />
                  <input
                    type="number"
                    placeholder="Income (₹)"
                    value={newMember.monthlyIncome || ""}
                    onChange={(e) =>
                      setNewMember({
                        ...newMember,
                        monthlyIncome: e.target.value,
                      })
                    }
                    className="p-2 rounded-lg text-xs border bg-gray-50 dark:bg-gray-800"
                  />
                </div>
              )}
            </div>

            {/* Row 4: Lives with family? */}
            <div className="flex items-center gap-3 mb-4">
              <label className="text-xs font-semibold text-gray-500 uppercase">
                Lives here?
              </label>
              <div className="flex bg-white dark:bg-gray-900 rounded-lg p-1 border">
                <button
                  type="button"
                  onClick={() =>
                    setNewMember({ ...newMember, livesWithFamily: true })
                  }
                  className={`px-3 py-1 text-xs rounded transition-all ${newMember.livesWithFamily ? "bg-green-100 text-green-700 font-bold" : "text-gray-400"}`}
                >
                  Yes
                </button>
                <button
                  type="button"
                  onClick={() =>
                    setNewMember({ ...newMember, livesWithFamily: false })
                  }
                  className={`px-3 py-1 text-xs rounded transition-all ${!newMember.livesWithFamily ? "bg-red-100 text-red-700 font-bold" : "text-gray-400"}`}
                >
                  No
                </button>
              </div>
            </div>

            {/* Sub-form Actions */}
            <div className="flex gap-3">
              <button
                type="button"
                onClick={() => setIsAddingMember(false)}
                className="flex-1 py-2 text-sm text-gray-500 bg-white dark:bg-gray-900 border rounded-lg hover:bg-gray-50 dark:hover:bg-gray-800"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={addMember}
                className="flex-1 py-2 text-sm text-white bg-green-600 rounded-lg font-bold shadow-md hover:bg-green-700"
              >
                Save Member
              </button>
            </div>
          </div>
        )}
      </div>

      {/* --- Section 4: Housing & Problems --- */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-lg font-outfit font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-100 dark:border-gray-800">
          Housing & Problems
        </h3>

        {/* Housing Toggle */}
        <div className="flex bg-gray-100 dark:bg-gray-800 p-1 rounded-xl mb-4">
          <button
            type="button"
            onClick={() =>
              setFormData({ ...formData, housingType: "OWN", rentAmount: 0 })
            }
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.housingType === "OWN" ? "bg-white shadow dark:bg-gray-700 text-gray-800 dark:text-white" : "text-gray-500"}`}
          >
            Own House
          </button>
          <button
            type="button"
            onClick={() => setFormData({ ...formData, housingType: "RENT" })}
            className={`flex-1 py-2 rounded-lg text-sm font-medium transition-all ${formData.housingType === "RENT" ? "bg-white shadow dark:bg-gray-700 text-red-500 font-bold" : "text-gray-500"}`}
          >
            Rented
          </button>
        </div>

        {formData.housingType === "RENT" && (
          <div className="mb-6 animate-in fade-in slide-in-from-top-2">
            <label className="text-xs font-semibold text-gray-500 uppercase">
              Monthly Rent
            </label>
            <div className="relative mt-1">
              <span className="absolute left-4 top-3 text-gray-400">₹</span>
              <input
                type="number"
                name="rentAmount"
                onChange={handleChange}
                className="w-full p-3 pl-8 rounded-xl bg-red-50 dark:bg-red-900/20 border border-red-100 dark:border-red-900 focus:ring-2 focus:ring-red-500"
                placeholder="Amount"
              />
            </div>
          </div>
        )}

        {/* Problem Tags Section */}
        <div className="space-y-3">
          <label className="text-xs font-semibold text-gray-500 uppercase">
            Select Major Problems
          </label>
          
          {/* 1. Predefined Tags (Red/Gray) */}
          <div className="flex flex-wrap gap-2">
            {PROBLEM_TAGS.map((tag) => (
              <button
                key={tag}
                type="button"
                onClick={() => toggleProblem(tag)}
                className={`px-3 py-2 rounded-full text-sm border transition-all ${
                  formData.problems.includes(tag)
                    ? "bg-red-500 text-white border-red-500 font-medium"
                    : "bg-transparent border-gray-300 dark:border-gray-700 text-gray-600 dark:text-gray-400"
                }`}
              >
                {tag}
              </button>
            ))}
          </div>

          {/* 2. Custom Problem Input */}
          <div className="mt-4 pt-4 border-t border-dashed border-gray-200 dark:border-gray-800">
             <label className="text-xs font-semibold text-gray-500 uppercase mb-2 block">
                Other Problem? (Type & Add)
             </label>
             <div className="flex gap-2">
                <input 
                  type="text" 
                  value={customProblem}
                  onChange={(e) => setCustomProblem(e.target.value)}
                  onKeyDown={(e) => e.key === 'Enter' && handleAddCustomProblem(e)}
                  placeholder="e.g. Flood Victim"
                  className="flex-1 p-3 rounded-xl text-sm border bg-gray-50 dark:bg-gray-800 border-gray-200 dark:border-gray-700 focus:ring-2 focus:ring-green-500 outline-none"
                />
                <button 
                  type="button"
                  onClick={handleAddCustomProblem}
                  className="bg-gray-900 dark:bg-gray-700 text-white px-5 rounded-xl text-sm font-bold active:scale-95 transition-transform"
                >
                  Add
                </button>
             </div>
          </div>

          {/* 3. Display Custom Added Tags (Blue) */}
          {/* We filter out tags that are already in the PROBLEM_TAGS list so we only show the new custom ones here */}
          {formData.problems.filter(p => !PROBLEM_TAGS.includes(p)).length > 0 && (
             <div className="flex flex-wrap gap-2 mt-2 animate-in fade-in">
                {formData.problems.filter(p => !PROBLEM_TAGS.includes(p)).map(customTag => (
                   <span key={customTag} className="flex items-center gap-2 px-3 py-1.5 rounded-full text-sm bg-blue-50 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300 font-medium border border-blue-200 dark:border-blue-800">
                      {customTag}
                      <button 
                        type="button" 
                        onClick={() => removeProblem(customTag)}
                        className="w-4 h-4 flex items-center justify-center rounded-full hover:bg-red-500 hover:text-white transition-colors text-xs"
                      >
                        ✕
                      </button>
                   </span>
                ))}
             </div>
          )}
        </div>
      </div>

      {/* --- Section 5: Reference & Notes --- */}
      <div className="bg-white dark:bg-gray-900 p-5 rounded-2xl border border-gray-100 dark:border-gray-800 shadow-sm">
        <h3 className="text-lg font-outfit font-bold text-gray-800 dark:text-gray-100 mb-4 border-b pb-2 border-gray-100 dark:border-gray-800">
          Reference & Verification
        </h3>

        <div className="space-y-5">
          {/* Reference Input */}
          <div className="bg-blue-50 dark:bg-blue-900/20 p-4 rounded-xl border border-blue-100 dark:border-blue-800">
             <label className="text-xs font-bold text-blue-800 dark:text-blue-300 uppercase flex items-center gap-2 mb-1">
               <UserPlus className="w-4 h-4" />
               Referred By
             </label>
             <input 
               type="text" 
               name="referencedBy"
               onChange={handleChange}
               placeholder="e.g. Shoaib Khan / Trust Member Name"
               className="w-full mt-1 p-3 rounded-lg bg-white dark:bg-gray-800 border-none focus:ring-2 focus:ring-blue-500 font-inter shadow-sm"
             />
             <p className="text-[11px] text-blue-600 dark:text-blue-400 mt-2 leading-tight">
               * If a trusted member refers this family, strict verification might be waived.
             </p>
          </div>

          {/* Comments Area */}
          <div>
             <label className="text-xs font-semibold text-gray-500 uppercase ml-1">
               Additional Notes
             </label>
             <textarea
               name="comments"
               onChange={handleChange}
               rows={3}
               placeholder="Write any extra details here (e.g. 'Needs urgent medical help', 'Documents pending')..."
               className="w-full mt-1 p-3 rounded-xl bg-gray-50 dark:bg-gray-800 border-none focus:ring-2 focus:ring-green-500 font-inter text-sm resize-none"
             />
          </div>
        </div>
      </div>

      {/* --- Error / Success Messages --- */}
      {message && (
        <div
          className={`p-4 rounded-xl flex items-center gap-3 animate-in slide-in-from-bottom-5 ${message.type === "success" ? "bg-green-100 text-green-800" : "bg-red-100 text-red-800"}`}
        >
          {message.type === "success" ? (
            <CheckCircle className="w-5 h-5 shrink-0" />
          ) : (
            <AlertTriangle className="w-5 h-5 shrink-0" />
          )}
          <span className="text-sm font-medium">{message.text}</span>
        </div>
      )}

      {/* --- Submit Button --- */}
      <button
        disabled={loading}
        className="w-full bg-green-600 hover:bg-green-700 disabled:bg-gray-400 text-white font-outfit font-bold text-lg py-4 rounded-2xl shadow-xl shadow-green-200 dark:shadow-none flex justify-center items-center gap-2 transition-all active:scale-[0.98]"
      >
        {loading ? <Loader2 className="animate-spin" /> : "Register Family"}
      </button>
    </form>
  );
}