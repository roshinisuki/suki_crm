"use client";

import { useState, useEffect } from "react";
import { getUnifiedOfficeVisitsAction, createVisitorAction, checkoutVisitorAction, deleteVisitorAction } from "@/app/actions/visitors";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
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
      <span className="inline-flex items-center justify-center w-32 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider bg-amber-50 text-amber-700 border border-amber-200 truncate animate-pulse">
        In Premises
      </span>
    );
  }

  let badge = null;
  const p = purpose ? purpose.toLowerCase() : "";
  const o = outcome || "";

  if (p.includes("support")) {
    if (o.toLowerCase().includes("resolved")) badge = { text: "Resolved", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    else if (o.toLowerCase().includes("resolving")) badge = { text: "Resolving", color: "bg-amber-50 text-amber-700 border-amber-200" };
    else badge = { text: "Enquired to IT", color: "bg-blue-50 text-blue-700 border-blue-200" };
  } else if (p.includes("subscription") || p.includes("renewal")) {
    if (o.toLowerCase().includes("renewed")) badge = { text: "Renewed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    else if (o.toLowerCase().includes("processing")) badge = { text: "Renewal Processing", color: "bg-amber-50 text-amber-700 border-amber-200" };
    else badge = { text: "Renewal Requested", color: "bg-blue-50 text-blue-700 border-blue-200" };
  } else if (p.includes("sales") || p.includes("follow-up")) {
    if (o === "Converted") badge = { text: "Converted", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    else if (o === "Not Interested") badge = { text: "Not Interested", color: "bg-red-50 text-red-700 border-red-200" };
    else badge = { text: o || "Interested", color: "bg-blue-50 text-blue-700 border-blue-200" };
  } else if (p.includes("demo")) {
    if (o.toLowerCase().includes("completed")) badge = { text: "Demo Completed", color: "bg-emerald-50 text-emerald-700 border-emerald-200" };
    else badge = { text: "Demo Scheduled", color: "bg-blue-50 text-blue-700 border-blue-200" };
  } else if (o.includes("Walk-in Guest")) {
    badge = { text: "Walk-in Guest", color: "bg-slate-100 text-slate-600 border-slate-200" };
  } else if (o) {
    badge = { text: o, color: "bg-slate-100 text-slate-600 border-slate-200" };
  }

  if (!badge) return null;

  return (
    <span className={`inline-flex items-center justify-center w-32 px-2 py-1 rounded-full text-[9px] font-bold uppercase tracking-wider border ${badge.color} truncate`}>
      {badge.text}
    </span>
  );
}

export default function OfficeVisitsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [activeTab, setActiveTab] = useState<"all" | "premises" | "out">("all");
  
  // Inbound Customer check-in modal
  const [isCustomerModalOpen, setIsCustomerModalOpen] = useState(false);

  // Customer Checkout Modal
  const [isCheckoutModalOpen, setIsCheckoutModalOpen] = useState(false);
  const [activeCheckoutVisit, setActiveCheckoutVisit] = useState<any>(null);

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
    setIsCustomerModalOpen(true);
  };

  const handleCheckoutGuest = async (id: string) => {
    try {
      const res = await checkoutVisitorAction({ id });
      if (res.success) {
        toast.success("Guest checked out successfully.");
        loadVisits();
      } else {
        toast.error(res.message || "Failed to checkout guest");
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
        toast.success("Visit record deleted.");
        loadVisits();
      } else {
        toast.error(res.message || "Failed to delete record");
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
                <th className="px-6 py-4 whitespace-nowrap">Visitor / Client</th>
                <th className="px-4 py-4 whitespace-nowrap">Type</th>
                <th className="px-4 py-4 whitespace-nowrap">Purpose</th>
                <th className="px-4 py-4 whitespace-nowrap">Host Name</th>
                <th className="px-4 py-4 whitespace-nowrap">Start / End Visit</th>
                <th className="px-4 py-4 whitespace-nowrap">Outcome Status</th>
                <th className="px-6 py-4 text-right whitespace-nowrap">Actions</th>
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
                      <td className="px-6 py-4 whitespace-nowrap">
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
                      <td className="px-4 py-4 whitespace-nowrap">
                        <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${v.type === "Customer" ? "bg-blue-50 text-blue-700 border border-blue-100" : "bg-slate-100 text-slate-600 border border-slate-200"}`}>
                          {v.type}
                        </span>
                      </td>
                      <td className="px-4 py-4 font-semibold text-slate-600 whitespace-nowrap">{v.purpose}</td>
                      <td className="px-4 py-4 font-medium text-slate-600 whitespace-nowrap">{v.hostName}</td>
                      <td className="px-4 py-4 font-semibold text-slate-500 whitespace-nowrap">
                        <p>Started: {checkInText}</p>
                        <p className={`text-[10px] font-bold mt-0.5 ${!v.checkOutTime ? "text-amber-500 animate-pulse" : "text-slate-400"}`}>
                          {!v.checkOutTime ? "● Active In Office" : `Ended: ${checkOutText}`}
                        </p>
                      </td>
                      <td className="px-4 py-4 whitespace-nowrap">
                        <PurposeStatusBadge purpose={v.purpose} status={v.status} outcome={v.outcome} />
                      </td>
                      <td className="px-6 py-4 text-right whitespace-nowrap">
                        <div className="flex items-center justify-end gap-2">
                          {v.followUpStatus && (
                            <span className={`px-2 py-1 rounded-md text-[9px] font-bold uppercase tracking-wider border ${
                              v.followUpStatus === "Completed" ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-amber-50 text-amber-700 border-amber-200"
                            }`}>
                              Follow-up: {v.followUpStatus}
                            </span>
                          )}
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



      {/* ── 2. CRM CUSTOMER INBOUND MODAL ── */}
      <InboundCheckInModal
        isOpen={isCustomerModalOpen}
        onClose={() => setIsCustomerModalOpen(false)}
        onSuccess={loadVisits}
        loggedInUser={user ? { name: user.name, id: user.id } : null}
      />



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
