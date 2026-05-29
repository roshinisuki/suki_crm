"use client";

import { useState, useEffect } from "react";
import { getUnifiedOfficeVisitsAction, createVisitorAction, checkoutVisitorAction, deleteVisitorAction } from "@/app/actions/visitors";
import { useAuth } from "@/components/AuthProvider";
import InboundCheckInModal from "@/components/InboundCheckInModal";
import CheckOutModal from "@/components/CheckOutModal";

const Ico = ({ d, size = 16, className }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  plus: "M12 4v16m8-8H4",
  search: "M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z",
  x: "M6 18L18 6M6 6l12 12",
  users: "M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z",
  clock: "M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z",
};

// Purpose-based custom badge styling helper
function PurposeStatusBadge({ purpose, status, outcome }: { purpose: string; status: string; outcome: string }) {
  const isCheckedIn = status === "CHECKED_IN";
  
  if (isCheckedIn) {
    return (
      <span className="inline-flex items-center px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">
        In Premises
      </span>
    );
  }

  // Support Tailored Pipeline
  if (purpose === "Support" || purpose === "Support Visit") {
    if (outcome === "Resolved" || outcome === "resolved") {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Resolved</span>;
    } else if (outcome === "Resolving" || outcome === "resolving") {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Resolving</span>;
    } else {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Enquired to IT</span>;
    }
  }

  // Renewal Tailored Pipeline
  if (purpose === "Subscription Discussion" || purpose === "Subscription Renewal") {
    if (outcome === "Renewed" || outcome === "renewed") {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Renewed</span>;
    } else if (outcome === "Renewal Processing" || outcome === "Renewal Processing") {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-amber-50 text-amber-700 border border-amber-200">Renewal Processing</span>;
    } else {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Renewal Requested</span>;
    }
  }

  // Sales Meeting Tailored Pipeline
  if (purpose === "Sales Meeting" || purpose === "Sales Pitch" || purpose === "Follow-up Meeting") {
    if (outcome === "Converted") {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Converted</span>;
    } else if (outcome === "Not Interested") {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-red-50 text-red-700 border border-red-200">Not Interested</span>;
    } else {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Interested</span>;
    }
  }

  // Demo Tailored Pipeline
  if (purpose === "Demo" || purpose === "Demo / Presentation") {
    if (outcome === "Demo Completed") {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-emerald-50 text-emerald-700 border border-emerald-200">Demo Completed</span>;
    } else {
      return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-blue-50 text-blue-700 border border-blue-200">Demo Scheduled</span>;
    }
  }

  // Guest walk-ins
  if (outcome === "Walk-in Guest") {
    return <span className="inline-flex px-2 py-0.5 rounded-md text-[10px] font-bold bg-slate-100 text-slate-600 border border-slate-200">Walk-in Guest</span>;
  }

  // Others do not show any outcome badge
  return null;
}

export default function OfficeVisitsPage() {
  const { user } = useAuth();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "premises" | "out">("all");
  
  // Custom Selection Prompt Modal
  const [isTypePromptOpen, setIsTypePromptOpen] = useState(false);

  // Inbound Customer check-in modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Guest Walk-In modal
  const [isGuestModalOpen, setIsGuestModalOpen] = useState(false);

  // Customer Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeCheckoutVisit, setActiveCheckoutVisit] = useState<any>(null);

  const [errorMsg, setErrorMsg] = useState("");
  const [fieldErrors, setFieldErrors] = useState<Record<string, string>>({});
  const [formLoading, setFormLoading] = useState(false);

  // Guest registration form state
  const [guestData, setGuestData] = useState({
    name: "",
    email: "",
    phone: "",
    company: "",
    purpose: "Interview",
    hostName: "",
  });

  const loadVisits = async () => {
    setLoading(true);
    try {
      const res = await getUnifiedOfficeVisitsAction();
      if (res.success && res.data) {
        setVisits(res.data);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadVisits();
  }, []);

  const handleOpenRegisterPrompt = () => {
    setIsTypePromptOpen(true);
  };

  const handleSelectCustomerVisit = () => {
    setIsTypePromptOpen(false);
    setIsCustomerModalOpen(true);
  };

  const handleSelectGuestVisit = () => {
    setIsTypePromptOpen(false);
    setGuestData({
      name: "",
      email: "",
      phone: "",
      company: "",
      purpose: "Interview",
      hostName: "",
    });
    setErrorMsg("");
    setFieldErrors({});
    setIsGuestModalOpen(true);
  };

  const handleGuestSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg("");
    setFieldErrors({});

    let errors: Record<string, string> = {};
    if (!guestData.name.trim()) errors.name = "Name is required.";
    if (!guestData.purpose.trim()) errors.purpose = "Purpose is required.";
    if (!guestData.hostName.trim()) errors.hostName = "Host Name is required.";
    
    if (!guestData.phone.trim()) {
      errors.phone = "Phone is required.";
    } else if (!/^\d{10}$/.test(guestData.phone.trim())) {
      errors.phone = "Phone must be exactly 10 digits.";
    }

    if (guestData.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(guestData.email.trim())) {
      errors.email = "Invalid email format.";
    }

    if (Object.keys(errors).length > 0) {
      setFieldErrors(errors);
      setFormLoading(false);
      return;
    }

    const res = await createVisitorAction(guestData);

    if (res.success) {
      setIsGuestModalOpen(false);
      loadVisits();
    } else {
      setErrorMsg(res.message || "Operation failed");
    }
    setFormLoading(false);
  };

  const handleCheckoutGuest = async (id: string) => {
    try {
      const res = await checkoutVisitorAction({ id });
      if (res.success) {
        loadVisits();
      } else {
        alert(res.message || "Failed to checkout guest");
      }
    } catch (err) {
      console.error(err);
    }
  };

  const handleOpenCheckoutCustomer = (v: any) => {
    setActiveCheckoutVisit({
      id: v.id,
      customerId: v.customerId,
      customerName: v.name,
      customerCode: v.customerCode || "—",
      visitType: "Inbound",
      purpose: v.purpose,
      checkInTime: v.checkInTime,
    });
    setIsCheckoutModalOpen(true);
  };

  const handleDeleteVisit = async (v: any) => {
    if (!confirm("Are you sure you want to delete this office visit record?")) return;
    try {
      let res;
      if (v.type === "Guest") {
        res = await deleteVisitorAction(v.id);
      } else {
        // Customer visits deleted via Admin action
        const { deleteVisitAction } = await import("@/app/actions/visits");
        res = await deleteVisitAction(v.id, "Inbound");
      }

      if (res.success) {
        loadVisits();
      } else {
        alert(res.message || "Failed to delete record");
      }
    } catch (err) {
      console.error(err);
    }
  };

  // Filter & Search Logic
  const filtered = visits.filter((v) => {
    // 1. Search term
    const term = search.toLowerCase();
    const matchesSearch = 
      v.name.toLowerCase().includes(term) ||
      (v.company && v.company.toLowerCase().includes(term)) ||
      (v.customerCode && v.customerCode.toLowerCase().includes(term)) ||
      (v.contact && v.contact.includes(term)) ||
      v.purpose.toLowerCase().includes(term);

    // 2. Status Tab
    let matchesTab = true;
    if (activeTab === "premises") {
      matchesTab = !v.checkOutTime;
    } else if (activeTab === "out") {
      matchesTab = !!v.checkOutTime;
    }

    return matchesSearch && matchesTab;
  });

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      
      {/* Page Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Office Visits</h1>
          <p className="text-sm text-slate-500 mt-1">Manage office walk-ins, CRM customers arrival queue, and guest entries.</p>
        </div>
        <button 
          onClick={handleOpenRegisterPrompt}
          className="flex items-center gap-2 px-4 py-2 bg-[#0D2137] text-white rounded-xl text-sm font-medium hover:bg-[#1a365d] transition-colors shadow-sm"
        >
          <Ico d={icons.plus} size={16} />
          Register Office Visit
        </button>
      </div>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-blue-50 flex items-center justify-center shrink-0">
            <Ico d={icons.users} size={20} className="text-blue-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">{visits.length}</p>
            <p className="text-xs font-semibold text-slate-500">Total Entries Today</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-amber-50 flex items-center justify-center shrink-0">
            <Ico d={icons.clock} size={20} className="text-amber-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {visits.filter((v) => !v.checkOutTime).length}
            </p>
            <p className="text-xs font-semibold text-slate-500">Currently in Premises</p>
          </div>
        </div>
        <div className="bg-white rounded-2xl p-5 border border-slate-200/60 shadow-sm flex items-center gap-4">
          <div className="w-12 h-12 rounded-xl bg-emerald-50 flex items-center justify-center shrink-0">
            <Ico d={icons.users} size={20} className="text-emerald-600" />
          </div>
          <div>
            <p className="text-2xl font-bold text-slate-800 tracking-tight">
              {visits.filter((v) => v.checkOutTime).length}
            </p>
            <p className="text-xs font-semibold text-slate-500">Total Checked Out</p>
          </div>
        </div>
      </div>

      {/* Main Workspace Card */}
      <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
        
        {/* Table Filters Header */}
        <div className="p-5 border-b border-slate-100 flex flex-col md:flex-row md:items-center justify-between gap-4 bg-slate-50/40">
          
          {/* Tabs */}
          <div className="flex p-1 bg-slate-100 rounded-xl w-fit shrink-0">
            <button
              onClick={() => setActiveTab("all")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "all" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
            >
              All Logs ({visits.length})
            </button>
            <button
              onClick={() => setActiveTab("premises")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "premises" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
            >
              In Premises ({visits.filter(v => !v.checkOutTime).length})
            </button>
            <button
              onClick={() => setActiveTab("out")}
              className={`px-4 py-2 rounded-lg text-xs font-bold transition-all ${activeTab === "out" ? "bg-white text-slate-800 shadow-xs" : "text-slate-500 hover:text-slate-700"}`}
            >
              Checked Out ({visits.filter(v => v.checkOutTime).length})
            </button>
          </div>

          {/* Search bar */}
          <div className="relative max-w-md w-full">
            <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">
              <Ico d={icons.search} size={16} />
            </span>
            <input 
              type="text" 
              placeholder="Search by name, contact, company, purpose..." 
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full pl-10 pr-4 py-2 rounded-xl bg-white border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/30 transition-shadow"
            />
          </div>

        </div>

        {/* Data Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left">
            <thead>
              <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-200/60">
                <th className="px-6 py-4">Visitor / Client</th>
                <th className="px-4 py-4">Type</th>
                <th className="px-4 py-4">Purpose</th>
                <th className="px-4 py-4">Host Name</th>
                <th className="px-4 py-4">Start / End Visit</th>
                <th className="px-4 py-4">Outcome Status</th>
                <th className="px-6 py-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-xs">
              {loading ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-500 font-medium">
                    Loading unified office logs...
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr>
                  <td colSpan={7} className="text-center py-12 text-sm text-slate-500 font-semibold">
                    No entries logged matching selection criteria.
                  </td>
                </tr>
              ) : (
                filtered.map((v) => {
                  const checkInText = new Date(v.checkInTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
                  const checkOutText = v.checkOutTime 
                    ? new Date(v.checkOutTime).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) 
                    : "Still inside";

                  return (
                    <tr key={v.id} className="hover:bg-slate-50/40 transition-colors group">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-xs shrink-0 ${v.type === "Customer" ? "bg-blue-100 text-blue-700" : "bg-slate-100 text-slate-700"}`}>
                            {v.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="text-sm font-bold text-slate-800">{v.name}</p>
                            <p className="text-[10px] text-slate-500 font-bold mt-0.5">
                              {v.contact} {v.company ? `| ${v.company}` : ""} {v.customerCode ? `(${v.customerCode})` : ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${v.type === "Customer" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                          {v.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600">{v.purpose}</td>
                      <td className="px-4 py-4 font-medium text-slate-600">{v.hostName}</td>
                      <td className="px-4 py-4 font-semibold text-slate-500">
                        <p>Started: {checkInText}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${!v.checkOutTime ? "text-amber-500 animate-pulse" : "text-slate-400"}`}>
                          {!v.checkOutTime ? "● Active In Office" : `Ended: ${checkOutText}`}
                        </p>
                      </td>
                      <td className="px-4 py-4">
                        <PurposeStatusBadge purpose={v.purpose} status={v.status} outcome={v.outcome} />
                      </td>
                      <td className="px-6 py-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          {!v.checkOutTime && (
                            <button
                              onClick={() => {
                                if (v.type === "Customer") {
                                  handleOpenCheckoutCustomer(v);
                                } else {
                                  handleCheckoutGuest(v.id);
                                }
                              }}
                              className="text-[10px] font-extrabold text-white bg-[#0D2137] hover:bg-[#1a3a5f] px-3 py-1.5 rounded-lg transition-colors uppercase tracking-wider shadow-sm"
                            >
                              End Visit
                            </button>
                          )}
                          {user?.role === "Admin" && (
                            <button
                              onClick={() => handleDeleteVisit(v)}
                              className="text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded-lg transition-colors shadow-sm border border-red-100"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>

      </div>

      {/* ── 1. SELECT VISIT TYPE MODAL (Prompt) ── */}
      {isTypePromptOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-3xl w-full max-w-md shadow-2xl p-6 overflow-hidden flex flex-col text-center relative border border-slate-100">
            <button 
              onClick={() => setIsTypePromptOpen(false)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-700 transition-colors"
            >
              <Ico d={icons.x} size={18} />
            </button>

            <h2 className="text-lg font-bold text-slate-800 mb-1 mt-2">Register Inbound Office Visit</h2>
            <p className="text-xs text-slate-400 font-semibold mb-6">Select the visit category to start visit</p>

            <div className="grid grid-cols-2 gap-4">
              
              {/* Card 1: CRM Customer */}
              <div 
                onClick={handleSelectCustomerVisit}
                className="p-5 border border-slate-200 hover:border-blue-400 hover:bg-blue-50/20 rounded-2xl cursor-pointer text-center space-y-3 transition-all group hover:shadow-md"
              >
                <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">CRM Customer</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold">Sales Pitch, renewals, demos, and support meetings.</p>
                </div>
              </div>

              {/* Card 2: General Guest */}
              <div 
                onClick={handleSelectGuestVisit}
                className="p-5 border border-slate-200 hover:border-slate-400 hover:bg-slate-50 rounded-2xl cursor-pointer text-center space-y-3 transition-all group hover:shadow-md"
              >
                <div className="w-12 h-12 bg-slate-50 text-slate-600 rounded-full flex items-center justify-center mx-auto group-hover:scale-105 transition-transform">
                  <svg className="w-6 h-6" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                </div>
                <div>
                  <p className="text-sm font-bold text-slate-800">General Walk-in</p>
                  <p className="text-[10px] text-slate-400 mt-1 leading-normal font-semibold">Interviewees, couriers, vendors, and office guests.</p>
                </div>
              </div>

            </div>
          </div>
        </div>
      )}

      {/* ── 2. CRM CUSTOMER INBOUND MODAL ── */}
      <InboundCheckInModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={loadVisits}
        loggedInUser={user ? { name: user.name, id: user.id } : null}
      />

      {/* ── 3. GENERAL GUEST WALK-IN REGISTER MODAL ── */}
      {isGuestModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/50 backdrop-blur-sm">
          <div className="bg-white rounded-2xl w-full max-w-lg shadow-xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-150">
            <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-slate-50 shrink-0">
              <div>
                <h2 className="text-base font-bold text-slate-800">Register General Guest Walk-In</h2>
                <p className="text-[11px] text-slate-400 mt-0.5">Capturing standard guest and visitor arrivals</p>
              </div>
              <button 
                onClick={() => setIsGuestModalOpen(false)} 
                className="w-8 h-8 rounded-xl bg-slate-100 flex items-center justify-center text-slate-400 hover:text-slate-700"
              >
                <Ico d={icons.x} size={18} />
              </button>
            </div>

            <form onSubmit={handleGuestSubmit}>
              <div className="p-6 overflow-y-auto space-y-4 text-xs font-semibold text-slate-600">
                {errorMsg && (
                  <div className="p-3.5 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 text-center">
                    {errorMsg}
                  </div>
                )}
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                    Visitor Full Name <span className="text-red-500">*</span>
                  </label>
                  <input 
                    type="text" 
                    value={guestData.name}
                    onChange={(e) => {
                      setGuestData({ ...guestData, name: e.target.value });
                      if (fieldErrors.name) setFieldErrors({ ...fieldErrors, name: "" });
                    }}
                    placeholder="e.g. Rahul Sharma" 
                    className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.name ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} 
                  />
                  {fieldErrors.name && <p className="text-xs text-red-500 font-bold mt-1">{fieldErrors.name}</p>}
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Email (Optional)</label>
                    <input 
                      type="email" 
                      value={guestData.email}
                      onChange={(e) => {
                        setGuestData({ ...guestData, email: e.target.value });
                        if (fieldErrors.email) setFieldErrors({ ...fieldErrors, email: "" });
                      }}
                      placeholder="Email address" 
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.email ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} 
                    />
                    {fieldErrors.email && <p className="text-xs text-red-500 font-bold mt-1">{fieldErrors.email}</p>}
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Phone Number <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="tel" 
                      value={guestData.phone}
                      onChange={(e) => {
                        setGuestData({ ...guestData, phone: e.target.value });
                        if (fieldErrors.phone) setFieldErrors({ ...fieldErrors, phone: "" });
                      }}
                      placeholder="e.g. 9876543210" 
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.phone ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} 
                    />
                    {fieldErrors.phone && <p className="text-xs text-red-500 font-bold mt-1">{fieldErrors.phone}</p>}
                  </div>
                </div>
                <div>
                  <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">Company Name</label>
                  <input 
                    type="text" 
                    value={guestData.company}
                    onChange={(e) => setGuestData({ ...guestData, company: e.target.value })}
                    placeholder="Enter guest company name" 
                    className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-medium focus:outline-none" 
                  />
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Purpose of Visit <span className="text-red-500">*</span>
                    </label>
                    <select
                      value={guestData.purpose}
                      onChange={(e) => setGuestData({ ...guestData, purpose: e.target.value })}
                      className="w-full px-4 py-2.5 rounded-xl bg-slate-50 border border-slate-200 text-sm font-semibold focus:outline-none text-slate-700"
                    >
                      <option value="Interview">Interview</option>
                      <option value="Deliveries">Deliveries</option>
                      <option value="Maintenance">Maintenance</option>
                      <option value="General Walk-in">General Walk-in</option>
                      <option value="Other">Other</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1.5">
                      Suki S/W Host <span className="text-red-500">*</span>
                    </label>
                    <input 
                      type="text" 
                      value={guestData.hostName}
                      onChange={(e) => {
                        setGuestData({ ...guestData, hostName: e.target.value });
                        if (fieldErrors.hostName) setFieldErrors({ ...fieldErrors, hostName: "" });
                      }}
                      placeholder="e.g. Priya Sharma" 
                      className={`w-full px-4 py-2.5 rounded-xl bg-slate-50 border text-sm font-medium focus:outline-none focus:ring-2 focus:ring-blue-500/20 ${fieldErrors.hostName ? "border-red-300 bg-red-50/30" : "border-slate-200"}`} 
                    />
                    {fieldErrors.hostName && <p className="text-xs text-red-500 font-bold mt-1">{fieldErrors.hostName}</p>}
                  </div>
                </div>
              </div>

              <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
                <button 
                  type="button" 
                  onClick={() => setIsGuestModalOpen(false)} 
                  className="px-5 py-2 rounded-xl text-xs font-bold text-slate-500 hover:bg-slate-200 transition-colors"
                >
                  Cancel
                </button>
                <button 
                  type="submit" 
                  disabled={formLoading}
                  className="px-5 py-2 rounded-xl text-xs font-bold text-white bg-[#0D2137] hover:bg-[#1a365d] transition-colors shadow-sm disabled:opacity-75"
                >
                  {formLoading ? "Registering..." : "Start Visit"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ── 4. CRM CUSTOMER CHECK-OUT MODAL ── */}
      <CheckOutModal
        isOpen={isCheckoutModalOpen}
        onClose={() => {
          setIsCheckoutModalOpen(false);
          setActiveCheckoutVisit(null);
        }}
        onSuccess={loadVisits}
        visit={activeCheckoutVisit}
      />

    </div>
  );
}
