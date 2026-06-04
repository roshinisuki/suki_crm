"use client";

import { useState, useEffect, useCallback } from "react";
import { getCustomersAction } from "@/app/actions/customers";
import { checkInOutboundAction } from "@/app/actions/visits";

interface OutboundCheckInModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess: () => void;
  loggedInUser: { name: string; id: string } | null;
}

const PURPOSE_OPTIONS = [
  { value: "New Enquiry",            label: "🔍 New Enquiry",            desc: "First-time prospect outreach" },
  { value: "Product Demo",           label: "🎯 Product Demo",           desc: "Software/product demonstration" },
  { value: "Pricing Discussion",     label: "💰 Pricing Discussion",     desc: "Quotation & deal negotiation" },
  { value: "Complaint Resolution",   label: "⚠️ Complaint Resolution",   desc: "Resolving customer issues onsite" },
  { value: "Subscription Renewal",   label: "🔄 Subscription Renewal",  desc: "Renew or upgrade existing plan" },
  { value: "Sales Pitch",            label: "🤝 Sales Pitch",            desc: "Direct sales outreach" },
  { value: "Follow-up Meeting",      label: "📅 Follow-up Meeting",      desc: "Follow up on previous interaction" },
  { value: "Support Visit",          label: "🛠️ Support Visit",          desc: "Technical or service support" },
  { value: "Other",                  label: "📋 Other",                  desc: "Any other purpose" },
];



// Shared dynamic fields (same as Inbound)
function DynamicFields({ purpose, meta, setMeta }: { purpose: string; meta: Record<string, any>; setMeta: (m: Record<string, any>) => void }) {
  const set = (key: string, val: any) => setMeta({ ...meta, [key]: val });
  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-white border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

  if (purpose === "New Enquiry") {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div>
          <label className={labelCls}>Requirement Summary <span className="text-red-400">*</span></label>
          <textarea rows={2} required value={meta.requirement || ""} onChange={e => set("requirement", e.target.value)} placeholder="What is the prospect looking for?" className={inputCls + " resize-none"} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Expected Deal Size</label>
            <select value={meta.dealSize || ""} onChange={e => set("dealSize", e.target.value)} className={inputCls}>
              <option value="">Select range...</option>
              <option>Under ₹1 Lakh</option>
              <option>₹1L – ₹5L</option>
              <option>₹5L – ₹20L</option>
              <option>₹20L+</option>
            </select>
          </div>
          <div>
            <label className={labelCls}>Industry Segment</label>
            <select value={meta.industry || ""} onChange={e => set("industry", e.target.value)} className={inputCls}>
              <option value="">Select...</option>
              <option>Manufacturing</option>
              <option>Retail</option>
              <option>Healthcare</option>
              <option>Education</option>
              <option>Technology</option>
              <option>Finance</option>
              <option>Logistics</option>
              <option>Other</option>
            </select>
          </div>
        </div>
      </div>
    );
  }

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
          <input type="checkbox" id="demoMaterials2" checked={meta.materialsReady || false} onChange={e => set("materialsReady", e.target.checked)} className="w-4 h-4 rounded text-blue-600" />
          <label htmlFor="demoMaterials2" className="text-xs font-semibold text-slate-600">Demo materials / slides prepared</label>
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
        <div>
          <label className={labelCls}>Competitor Mentioned</label>
          <input type="text" placeholder="Any competitor name mentioned (optional)..." value={meta.competitor || ""} onChange={e => set("competitor", e.target.value)} className={inputCls} />
        </div>
      </div>
    );
  }

  if (purpose === "Complaint Resolution") {
    return (
      <div className="space-y-3 animate-in fade-in slide-in-from-top-2 duration-200">
        <div>
          <label className={labelCls}>Complaint Summary <span className="text-red-400">*</span></label>
          <textarea rows={2} required value={meta.complaintSummary || ""} onChange={e => set("complaintSummary", e.target.value)} placeholder="Describe the issue reported by the customer..." className={inputCls + " resize-none"} />
        </div>
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className={labelCls}>Complaint Category</label>
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
        <div>
          <label className={labelCls}>Renewal Probability</label>
          <select value={meta.renewalProbability || ""} onChange={e => set("renewalProbability", e.target.value)} className={inputCls}>
            <option value="">Select...</option>
            <option>🔥 Hot — Very Likely</option>
            <option>♨️ Warm — Considering</option>
            <option>❄️ Cold — At Risk</option>
          </select>
        </div>
      </div>
    );
  }

  return null;
}

export default function OutboundCheckInModal({
  isOpen,
  onClose,
  onSuccess,
  loggedInUser,
}: OutboundCheckInModalProps) {
  const [customers, setCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [formLoading, setFormLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  // Section 1 — Target
  const [selectedCustomerId, setSelectedCustomerId] = useState("");
  const [contactPerson, setContactPerson] = useState("");
  const [visitLocation, setVisitLocation] = useState("");

  // Section 2 — Executive
  const [requiresApproval, setRequiresApproval] = useState(false);

  // Section 3 — Purpose + Dynamic
  const [purpose, setPurpose] = useState("Sales Pitch");
  const [visitMetadata, setVisitMetadata] = useState<Record<string, any>>({});



  // Section 5 — GPS
  const [location, setLocation] = useState<{ lat: number; lng: number } | null>(null);
  const [locLoading, setLocLoading] = useState(false);
  const [locError, setLocError] = useState("");

  // Section 6 — Notes
  const [notes, setNotes] = useState("");

  const fetchGPS = useCallback(() => {
    setLocation(null);
    setLocError("");
    setLocLoading(true);
    if ("geolocation" in navigator) {
      navigator.geolocation.getCurrentPosition(
        pos => { setLocation({ lat: pos.coords.latitude, lng: pos.coords.longitude }); setLocLoading(false); },
        err => { setLocError("GPS is required for field check-in. Please allow location access."); setLocLoading(false); },
        { enableHighAccuracy: true, timeout: 8000 }
      );
    } else {
      setLocError("Geolocation not supported by this browser.");
      setLocLoading(false);
    }
  }, []);

  const reset = useCallback(() => {
    setSelectedCustomerId("");
    setContactPerson("");
    setVisitLocation("");
    setRequiresApproval(false);
    setPurpose("Sales Pitch");
    setVisitMetadata({});

    setNotes("");
    setErrorMsg("");
  }, []);

  useEffect(() => {
    if (isOpen) {
      reset();
      fetchGPS();
      setLoading(true);
      getCustomersAction().then(res => {
        if (res.success && res.data) setCustomers(res.data);
        setLoading(false);
      });
    }
  }, [isOpen, reset, fetchGPS]);

  const handlePurposeChange = (val: string) => {
    setPurpose(val);
    setVisitMetadata({});
  };

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCustomerId) { setErrorMsg("Please select a target customer."); return; }
    if (!location) { setErrorMsg("Location is required for Field Check-In. Please allow location access or retry GPS."); return; }
    setFormLoading(true);
    setErrorMsg("");

    // Merge travel + location context into metadata
    const fullMetadata = {
      ...visitMetadata,
      ...(visitLocation ? { visitLocation } : {}),
      ...(contactPerson ? { contactPerson } : {}),
    };

    try {
      const res = await checkInOutboundAction({
        customerId: selectedCustomerId,
        purpose,
        notes: notes.trim() || undefined,
        checkInLat: location?.lat,
        checkInLng: location?.lng,

        requiresApproval,
        visitMetadata: Object.keys(fullMetadata).length > 0 ? fullMetadata : undefined,
      });

      if (res.success) {
        onSuccess();
        onClose();
      } else {
        setErrorMsg(res.message || "Failed to register field visit.");
      }
    } catch {
      setErrorMsg("Something went wrong. Please try again.");
    } finally {
      setFormLoading(false);
    }
  };

  const inputCls = "w-full px-3.5 py-2.5 rounded-xl bg-slate-50 border border-slate-200/80 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500/20 text-slate-700 font-medium";
  const labelCls = "block text-[10px] font-bold text-slate-500 uppercase tracking-wider mb-1";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
      <div className="bg-white rounded-2xl w-full max-w-xl shadow-2xl overflow-hidden flex flex-col max-h-[92vh] animate-in fade-in zoom-in-95 duration-200">

        {/* Header */}
        <div className="px-6 py-4 border-b border-slate-100 flex items-center justify-between bg-gradient-to-r from-blue-50 to-slate-50 shrink-0">
          <div>
            <h2 className="text-base font-bold text-slate-800">📍 Field Check-In</h2>
            <p className="text-[11px] text-slate-400 mt-0.5">Record an outbound customer visit with GPS verification</p>
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

            {/* ── Section 1: Visit Target ── */}
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2.5">1 · Visit Target</p>
              <div>
                <label className={labelCls}>Target Customer <span className="text-red-400">*</span></label>
                <select value={selectedCustomerId} onChange={e => setSelectedCustomerId(e.target.value)} disabled={loading} required className={inputCls}>
                  <option value="">-- Select customer from master list --</option>
                  {customers.map(c => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.customerCode}){c.city ? ` · ${c.city}` : ""}
                    </option>
                  ))}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3 mt-3">
                <div>
                  <label className={labelCls}>Contact Person (Optional)</label>
                  <input type="text" placeholder="Name of person at customer site..." value={contactPerson} onChange={e => setContactPerson(e.target.value)} className={inputCls} />
                </div>
                <div>
                  <label className={labelCls}>Visit Location / Address</label>
                  <input type="text" placeholder="Area, landmark or address..." value={visitLocation} onChange={e => setVisitLocation(e.target.value)} className={inputCls} />
                </div>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Section 2: Executive + Time ── */}
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2.5">2 · Executive & Timing</p>
              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className={labelCls}>Executive</label>
                  <input type="text" readOnly value={loggedInUser?.name || "Loading..."} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-sm text-slate-500 font-semibold cursor-not-allowed" />
                </div>
                <div>
                  <label className={labelCls}>Check-In Time</label>
                  <input type="text" readOnly value={new Date().toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-sm text-slate-500 font-semibold cursor-not-allowed" />
                </div>
                <div>
                  <label className={labelCls}>Visit Date</label>
                  <input type="text" readOnly value={new Date().toLocaleDateString("en-IN")} className="w-full px-3.5 py-2.5 rounded-xl bg-slate-100 border border-slate-200/60 text-sm text-slate-500 font-semibold cursor-not-allowed" />
                </div>
              </div>

              <div className="mt-3">
                <label className="flex items-center gap-3 cursor-pointer select-none">
                  <div onClick={() => setRequiresApproval(!requiresApproval)}
                    className={`relative w-10 h-5 rounded-full transition-colors ${requiresApproval ? "bg-amber-500" : "bg-slate-200"}`}>
                    <div className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-all ${requiresApproval ? "left-5" : "left-0.5"}`} />
                  </div>
                  <div>
                    <p className="text-xs font-bold text-slate-700">Requires Manager Approval</p>
                    <p className="text-[10px] text-slate-400">Flag this visit for review by Marketing Lead or Admin</p>
                  </div>
                </label>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Section 3: Purpose + Dynamic Fields ── */}
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2.5">3 · Purpose of Visit</p>
              <div className="mb-3">
                <select
                  value={purpose}
                  onChange={e => handlePurposeChange(e.target.value)}
                  required
                  className={inputCls}
                >
                  {PURPOSE_OPTIONS.map(opt => (
                    <option key={opt.value} value={opt.value}>{opt.label} — {opt.desc}</option>
                  ))}
                </select>
              </div>

              {["New Enquiry", "Product Demo", "Pricing Discussion", "Complaint Resolution", "Subscription Renewal"].includes(purpose) && (
                <div className="mt-3 p-3.5 bg-blue-50/50 border border-blue-100 rounded-2xl">
                  <p className="text-[10px] font-black text-blue-700 uppercase tracking-wider mb-2">{purpose} Details</p>
                  <DynamicFields purpose={purpose} meta={visitMetadata} setMeta={setVisitMetadata} />
                </div>
              )}
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Section 4: GPS Verification ── */}
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2.5">4 · GPS Verification</p>
              <div className="p-3.5 border rounded-2xl bg-slate-50 border-slate-200/80 flex items-center justify-between gap-3">
                <div className="flex-1">
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-0.5">Coordinates</p>
                  {locLoading && (
                    <p className="text-xs text-slate-600 flex items-center gap-2">
                      <span className="w-3.5 h-3.5 rounded-full border-2 border-slate-400 border-t-transparent animate-spin shrink-0" />
                      Capturing GPS coordinates...
                    </p>
                  )}
                  {location && (
                    <p className="text-xs font-semibold text-emerald-600 flex items-center gap-1.5">
                      <span className="w-2.5 h-2.5 bg-emerald-500 rounded-full animate-ping shrink-0" />
                      Locked: {location.lat.toFixed(5)}°N, {location.lng.toFixed(5)}°E
                    </p>
                  )}
                  {locError && <p className="text-xs font-medium text-amber-600">⚠️ {locError}</p>}
                </div>
                <button type="button" onClick={fetchGPS} className="px-3 py-1.5 rounded-lg bg-slate-200 hover:bg-slate-300 text-[10px] font-bold text-slate-700 transition-colors shrink-0">
                  Retry GPS
                </button>
              </div>
            </div>

            <div className="border-t border-slate-100" />

            {/* ── Section 5: Notes ── */}
            <div>
              <p className="text-[10px] font-black text-blue-600 uppercase tracking-widest mb-2.5">5 · Initial Notes</p>
              <textarea rows={3} placeholder="Meeting objectives, agenda, any relevant pre-visit context..." value={notes} onChange={e => setNotes(e.target.value)}
                className={inputCls + " resize-none"} />
            </div>
          </div>

          {/* Footer */}
          <div className="px-6 py-4 border-t border-slate-100 bg-slate-50 flex justify-end gap-3 shrink-0">
            <button type="button" onClick={onClose} className="px-5 py-2.5 rounded-xl text-xs font-bold text-slate-500 hover:text-slate-800 hover:bg-slate-200/80 transition-colors">
              Cancel
            </button>
            <button type="submit" disabled={formLoading || !location || locLoading} className="px-7 py-2.5 rounded-xl text-xs font-bold text-white bg-[#0D2137] hover:bg-slate-800 transition-colors shadow-sm disabled:opacity-75 flex items-center gap-2">
              {formLoading ? (
                <><span className="w-3.5 h-3.5 rounded-full border-2 border-white border-t-transparent animate-spin" />Recording...</>
              ) : "📍 Field Check-In"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
