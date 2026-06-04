"use client";

import { useState, useEffect, useCallback } from "react";
import { getCustomersAction, createCustomerAction } from "@/app/actions/customers";
import { checkInInboundAction } from "@/app/actions/visits";

interface InboundCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loggedInUser: { name: string; id: string } | null;
}

// ── Purpose configuration ──────────────────────────────────────
const PURPOSE_OPTIONS = [
  { value: "New Enquiry",            label: "🔍 New Enquiry",            desc: "First-time prospect inquiry" },
  { value: "Product Demo",           label: "🎯 Product Demo",           desc: "Software/product demonstration" },
  { value: "Pricing Discussion",     label: "💰 Pricing Discussion",     desc: "Quotation, budgets & deals" },
  { value: "Complaint Resolution",   label: "⚠️ Complaint Resolution",   desc: "Issue resolution or support" },
  { value: "Subscription Renewal",   label: "🔄 Subscription Renewal",  desc: "Renew or upgrade existing plan" },
  { value: "Sales Meeting",          label: "🤝 Sales Meeting",          desc: "General sales interaction" },
  { value: "Demo",                   label: "📊 Demo",                   desc: "Product showcase" },
  { value: "Support",                label: "🛠️ Support",                desc: "Technical or service support" },
  { value: "Other",                  label: "📋 Other",                  desc: "Any other purpose" },
];

// Purposes that show the customer portal decision
const PORTAL_DECISION_PURPOSES = ["New Enquiry", "Sales Meeting", "Product Demo", "Demo", "Other"];

const PRIORITY_OPTIONS = ["Low", "Normal", "High", "Urgent"];
const MEETING_TYPE_OPTIONS = ["Walk-in", "Scheduled", "Virtual"];
const DEPARTMENT_OPTIONS = ["Sales", "Support", "Management", "Finance", "Technical"];
const SOURCE_OPTIONS = ["Walk-in", "Referral", "Cold Call", "Social Media", "Email Campaign", "Website"];
const DURATION_OPTIONS = [
  { value: 30, label: "30 min" },
  { value: 60, label: "1 hour" },
  { value: 90, label: "1.5 hours" },
  { value: 120, label: "2 hours" },
  { value: 180, label: "3 hours" },
];

// Purpose-specific dynamic fields — rendered per purpose
function DynamicFields({
  purpose,
  meta,
  setMeta,
}: {
  purpose: string;
  meta: Record<string, any>;
  setMeta: (m: Record<string, any>) => void;
}) {
  const set = (key: string, val: any) => setMeta({ ...meta, [key]: val });

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";


  if (purpose === "Product Demo") {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Product / Module <span className="text-red-400">*</span></label>
            <select required value={meta.product || ""} onChange={e => set("product", e.target.value)} className={inputCls}>
              <option value="">Select product...</option>
              <option>Billing Module</option>
              <option>CRM Module</option>
              <option>ERP Suite</option>
              <option>HR & Payroll</option>
              <option>Inventory</option>
              <option>Custom Solution</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Demo Owner</label>
            <input type="text" placeholder="Presenter name..." value={meta.demoOwner || ""} onChange={e => set("demoOwner", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input type="checkbox" id="demoMaterials" checked={meta.materialsReady || false} onChange={e => set("materialsReady", e.target.checked)} className="w-4 h-4 rounded text-indigo-600" />
          <label htmlFor="demoMaterials" className="text-xs font-semibold text-slate-600">Demo materials / slides prepared</label>
        </div>
      </div>
    );
  }

  if (purpose === "Pricing Discussion") {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Budget Range</label>
            <select value={meta.budget || ""} onChange={e => set("budget", e.target.value)} className={inputCls}>
              <option value="">Select range...</option>
              <option>Under ₹1 Lakh</option>
              <option>₹1L – ₹5L</option>
              <option>₹5L – ₹20L</option>
              <option>₹20L+</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Decision Timeline</label>
            <select value={meta.decisionTimeline || ""} onChange={e => set("decisionTimeline", e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              <option>Immediate</option>
              <option>Within 1 Month</option>
              <option>1–3 Months</option>
              <option>6+ Months</option>
            </select>
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Quotation Required?</label>
            <select value={meta.quotationRequired || ""} onChange={e => set("quotationRequired", e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              <option value="Yes">Yes — prepare quote</option>
              <option value="No">No — verbal only</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Competitor Mentioned</label>
            <input type="text" placeholder="Competitor name (optional)..." value={meta.competitor || ""} onChange={e => set("competitor", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>
    );
  }

  if (purpose === "Complaint Resolution") {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div>
          <label className={labelCls}>Complaint Summary <span className="text-red-400">*</span></label>
          <textarea rows={2} required value={meta.complaintSummary || ""} onChange={e => set("complaintSummary", e.target.value)} placeholder="Describe the issue raised..." className={inputCls + " resize-none"} />
        </div>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className={labelCls}>Category</label>
            <select value={meta.complaintCategory || ""} onChange={e => set("complaintCategory", e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              <option>Billing</option>
              <option>Technical</option>
              <option>Service</option>
              <option>Delivery</option>
              <option>Other</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Severity</label>
            <select value={meta.severity || ""} onChange={e => set("severity", e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              <option>Low</option>
              <option>Medium</option>
              <option>High</option>
              <option>Critical</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Escalation Level</label>
            <select value={meta.escalation || ""} onChange={e => set("escalation", e.target.value)} className={inputCls}>
              <option value="None">None</option>
              <option>L1</option>
              <option>L2</option>
              <option>Management</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

  if (purpose === "Subscription Renewal") {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Current Plan <span className="text-red-400">*</span></label>
            <input type="text" required placeholder="e.g. Suki ERP Pro Annual..." value={meta.currentPlan || ""} onChange={e => set("currentPlan", e.target.value)} className={inputCls} />
          </div>
          <div>
            <label className={labelCls}>Plan Expiry Date</label>
            <input type="date" value={meta.expiryDate || ""} onChange={e => set("expiryDate", e.target.value)} className={inputCls} />
          </div>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Renewal Probability</label>
            <select value={meta.renewalProbability || ""} onChange={e => set("renewalProbability", e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              <option>🔥 Hot — Very Likely</option>
              <option>♨️ Warm — Considering</option>
              <option>❄️ Cold — At Risk</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Revised Offer / Discount</label>
            <input type="text" placeholder="Any special offer or discount..." value={meta.revisedOffer || ""} onChange={e => set("revisedOffer", e.target.value)} className={inputCls} />
          </div>
        </div>
      </div>
    );
  }

  return null; // No dynamic fields for Sales Meeting, Support, Demo, Other
}

export default function InboundCheckInModal({
  isOpen,
  onClose,
  onSuccess,
  loggedInUser,
}: InboundCheckInModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Section 1 — Visitor Identity
  const [mode, setMode] = useState<"select" | "create">("select");
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [newCustCode, setNewCustCode] = useState("");
  const [newCustName, setNewCustName] = useState("");
  const [newCustEmail, setNewCustEmail] = useState("");
  const [newCustPhone, setNewCustPhone] = useState("");
  const [newCustCity, setNewCustCity] = useState("");

  // Section 2 — Visit Details
  const [priority, setPriority] = useState("Normal");
  const [meetingType, setMeetingType] = useState("Walk-in");
  const [source, setSource] = useState("Walk-in");
  const [department, setDepartment] = useState("");
  const [expectedDuration, setExpectedDuration] = useState<number | "">(60);
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Section 3 — Purpose + Dynamic
  const [purpose, setPurpose] = useState("New Enquiry");
  const [visitMetadata, setVisitMetadata] = useState<Record<string, any>>({});

  // Section 4 — Agenda & Notes
  const [agenda, setAgenda] = useState("");
  const [notes, setNotes] = useState("");

  const reset = useCallback(() => {
    setMode("select");
    setSelectedCustomerId("");
    setPriority("Normal");
    setMeetingType("Walk-in");
    setSource("Walk-in");
    setDepartment("");
    setExpectedDuration(60);
    setRequiresApproval(false);
    setPurpose("New Enquiry");
    setVisitMetadata({});
    setAgenda("");
    setNotes("");
    setNewCustCode(`CST-${Math.floor(1000 + Math.random() * 9000)}`);
    setNewCustName("");
    setNewCustEmail("");
    setNewCustPhone("");
    setNewCustCity("");
    setErrorMsg("");
  }, []);

  useEffect(() => {
    if (isOpen) {
      reset();
      setLoading(true);
      getCustomersAction().then(res => {
        if (res.success && res.data) setCustomers(res.data);
        setLoading(false);
      });
    }
  }, [isOpen, reset]);

  // When purpose changes, clear all dynamic metadata (prevent stale values)
  const handlePurposeChange = (newPurpose: string) => {
    setPurpose(newPurpose);
    setVisitMetadata({});
  };

  if (!isOpen) return null;

  const selectedCustomer = customers.find(c => c.id === selectedCustomerId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormLoading(true);
    setErrorMsg("");

    try {
      let finalCustomerId = selectedCustomerId;

      if (mode === "create") {
        if (!newCustCode || !newCustName) {
          setErrorMsg("Customer Code and Name are required.");
          setFormLoading(false);
          return;
        }
        const createRes = await createCustomerAction({
          customerCode: newCustCode.trim(),
          name: newCustName.trim(),
          email: newCustEmail.trim() || null,
          phone: newCustPhone.trim() || null,
          city: newCustCity.trim() || null,
          status: "Prospect",
        });
        if (!createRes.success) {
          setErrorMsg(createRes.message || "Failed to create new customer.");
          setFormLoading(false);
          return;
        }
        finalCustomerId = createRes.data?.id || "";
      }

      if (!finalCustomerId) {
        setErrorMsg("Please select or create a customer.");
        setFormLoading(false);
        return;
      }

      const res = await checkInInboundAction({
        customerId: finalCustomerId,
        purpose,
        notes: notes.trim() || undefined,
        priority,
        meetingType,
        source,
        agenda: agenda.trim() || undefined,
        expectedDuration: expectedDuration ? Number(expectedDuration) : undefined,
        department: department || undefined,
        requiresApproval,
        visitMetadata: Object.keys(visitMetadata).length > 0 ? visitMetadata : undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to register check-in.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/20 text-slate-700 font-medium transition-all";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">🏢 Office Visit Check-In</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Register a customer's inbound office visit</p>
          </div>
          <button onClick={onClose} className="w-8 h-8 rounded-xl bg-white/80 border border-slate-200 flex items-center justify-center text-slate-400 hover:text-slate-700 transition-all">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col flex-1 overflow-hidden">
          <div className="p-5 overflow-y-auto flex-1 space-y-5">

            {errorMsg && (
              <div className="p-3 rounded-xl bg-red-50 border border-red-100 text-xs font-semibold text-red-600 text-center">
                {errorMsg}
              </div>
            )}

            {/* ── Section 1: Visitor Identity ── */}
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2.5">1 · Visitor Identity</p>
              <div className="flex gap-2 p-1 bg-slate-100 rounded-xl mb-3">
                <button type="button" onClick={() => { setMode("select"); setErrorMsg(""); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "select" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  Existing Customer
                </button>
                <button type="button" onClick={() => { setMode("create"); setErrorMsg(""); }}
                  className={`flex-1 py-1.5 rounded-lg text-xs font-bold transition-all ${mode === "create" ? "bg-white text-slate-800 shadow-sm" : "text-slate-500 hover:text-slate-700"}`}>
                  + New Walk-In Lead
                </button>
              </div>

              {mode === "select" ? (
                <div>
                  <label className={labelCls}>Select Customer <span className="text-red-400">*</span></label>
                  <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} disabled={loading} required
                    className={inputCls}>
                    <option value="">-- Choose from customer master list --</option>
                    {customers.map(c => (
                      <option key={c.id} value={c.id}>
                        {c.name} ({c.customerCode}){c.status ? ` · ${c.status}` : ""}{c.city ? ` · ${c.city}` : ""}
                      </option>
                    ))}
                  </select>
                  {selectedCustomer && (
                    <div className="mt-2 flex items-center gap-2 text-[10px] font-semibold text-slate-500">
                      <span className={`px-2 py-0.5 rounded-full text-[9px] font-black ${selectedCustomer.status === "Active" ? "bg-emerald-100 text-emerald-700" : "bg-slate-100 text-slate-600"}`}>
                        {selectedCustomer.status}
                      </span>
                      {selectedCustomer.phone && <span>📞 {selectedCustomer.phone}</span>}
                      {selectedCustomer.city && <span>📍 {selectedCustomer.city}</span>}
                    </div>
                  )}
                </div>
              ) : (
                <div className="bg-indigo-50/40 border border-indigo-100 rounded-2xl p-4 space-y-3">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider">New Customer Details</p>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Customer Code <span className="text-red-400">*</span></label>
                      <input type="text" value={newCustCode} onChange={e => setNewCustCode(e.target.value)} required={mode === "create"} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Full Name <span className="text-red-400">*</span></label>
                      <input type="text" placeholder="John Doe" value={newCustName} onChange={e => setNewCustName(e.target.value)} required={mode === "create"} className={inputCls} />
                    </div>
                  </div>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className={labelCls}>Email</label>
                      <input type="email" placeholder="john@co.com" value={newCustEmail} onChange={e => setNewCustEmail(e.target.value)} className={inputCls} />
                    </div>
                    <div>
                      <label className={labelCls}>Phone</label>
                      <input type="text" placeholder="9876543210" value={newCustPhone} onChange={e => setNewCustPhone(e.target.value)} className={inputCls} />
                    </div>
                  </div>
                  <div>
                    <label className={labelCls}>City</label>
                    <input type="text" placeholder="Chennai" value={newCustCity} onChange={e => setNewCustCity(e.target.value)} className={inputCls} />
                  </div>
                </div>
              )}
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Section 2: Visit Details ── */}
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2.5">2 · Visit Details</p>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className={labelCls}>Priority</label>
                  <select value={priority} onChange={e => setPriority(e.target.value)} className={inputCls}>
                    {PRIORITY_OPTIONS.map(p => <option key={p}>{p}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Meeting Type</label>
                  <select value={meetingType} onChange={e => setMeetingType(e.target.value)} className={inputCls}>
                    {MEETING_TYPE_OPTIONS.map(m => <option key={m}>{m}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)} className={inputCls}>
                    <option value="">-- Not specified --</option>
                    {DEPARTMENT_OPTIONS.map(d => <option key={d}>{d}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Expected Duration</label>
                  <select value={expectedDuration} onChange={e => setExpectedDuration(Number(e.target.value))} className={inputCls}>
                    {DURATION_OPTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Source</label>
                  <select value={source} onChange={e => setSource(e.target.value)} className={inputCls}>
                    {SOURCE_OPTIONS.map(s => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <div>
                  <label className={labelCls}>Host Name</label>
                  <input type="text" readOnly value={loggedInUser?.name || "Loading..."} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-sm text-slate-500 font-semibold focus:outline-none cursor-not-allowed" />
                </div>
              </div>

              {/* System Auto-fields */}
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelCls}>Check-In Time</label>
                  <input type="text" readOnly value={new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-sm text-slate-500 font-semibold focus:outline-none cursor-not-allowed" />
                </div>
                <div>
                  <label className={labelCls}>Visit Date</label>
                  <input type="text" readOnly value={new Date().toLocaleDateString("en-IN")} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-sm text-slate-500 font-semibold focus:outline-none cursor-not-allowed" />
                </div>
              </div>

              {/* Approval toggle */}
              <div className="mt-3">
                <label className="flex items-center gap-3 cursor-pointer select-none group">
                  <div
                    onClick={() => setRequiresApproval(!requiresApproval)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${requiresApproval ? "bg-amber-500" : "bg-slate-200"}`}
                  >
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${requiresApproval ? "left-5" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Requires Manager Approval</p>
                    <p className="text-[10px] text-slate-400">This visit will be sent for approval before finalizing</p>
                  </div>
                </label>
                {requiresApproval && (
                  <div className="mt-2 p-3 bg-amber-50 border border-amber-100 rounded-xl text-xs text-amber-700 font-semibold flex items-center gap-2">
                    <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
                    This visit will be reviewed by a Marketing Lead or Admin before being finalized.
                  </div>
                )}
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Section 3: Purpose + Dynamic Fields ── */}
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2.5">3 · Purpose of Visit</p>
              <div className="mb-3">
                <select
                  value={purpose}
                  onChange={e => handlePurposeChange(e.target.value)}
                  required
                  className={inputCls}
                >
                  {PURPOSE_OPTIONS
                    .filter(opt => mode === "create" ? opt.value !== "Subscription Renewal" : true)
                    .map(opt => (
                      <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
                    ))}
                </select>
              </div>

              {/* Dynamic purpose-specific fields */}
              {["Product Demo", "Pricing Discussion", "Complaint Resolution", "Subscription Renewal"].includes(purpose) && (
                <div className="mt-3 p-3.5 bg-indigo-50/50 border border-indigo-100 rounded-2xl">
                  <p className="text-[10px] font-black text-indigo-600 uppercase tracking-wider mb-2">
                    {purpose} Details
                  </p>
                  <DynamicFields purpose={purpose} meta={visitMetadata} setMeta={setVisitMetadata} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Section 4: Agenda & Notes ── */}
            <div>
              <p className="text-[10px] font-black text-indigo-600 uppercase tracking-widest mb-2.5">4 · Agenda & Notes</p>
              <div className="space-y-3">
                <div>
                  <label className={labelCls}>Meeting Agenda / Objectives</label>
                  <textarea rows={2} placeholder="What is the key goal of this visit? Main topics to cover..." value={agenda} onChange={e => setAgenda(e.target.value)} className={inputCls + " resize-none"} />
                </div>
                <div>
                  <label className={labelCls}>Initial Notes / Remarks (Optional)</label>
                  <textarea rows={2} placeholder="Any additional observations or preparation notes..." value={notes} onChange={e => setNotes(e.target.value)} className={inputCls + " resize-none"} />
                </div>
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={formLoading} className="px-7 py-2.5 rounded-xl text-xs font-bold text-white bg-indigo-600 hover:bg-indigo-700 transition-colors shadow-sm disabled:opacity-75 flex items-center gap-2">
              {formLoading ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Saving Visit...</>
              ) : "✓ Start Visit"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
