"use client";
import { useState, useEffect, useCallback, use } from "react";
import { useRouter } from "next/navigation";
import { getLeadByIdAction, convertLeadToDealAction, updateLeadAction } from "@/app/actions/leads";
import { createFollowUpAction } from "@/app/actions/followUps";
import { getNotesAction, createNoteAction } from "@/app/actions/notes";
import { getUsersAction } from "@/app/actions/users";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import { StatusBadge } from "@/components/ui/StatusBadge";
import { Modal } from "@/components/ui/Modal";
import { FormField, Input } from "@/components/ui/FormField";
import { getInitials, getAvatarColor, formatDate, formatDateTime, cn } from "@/lib/ui-utils";
import {
  ArrowLeft, Briefcase, Phone, Mail, MapPin, Building2,
  CalendarClock, User, Plus, CheckCircle2, PhoneCall,
  MessageSquare, FileText, XCircle,
} from "lucide-react";

type Tab = "overview" | "followups" | "activities";

export default function LeadDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const resolvedParams = use(params);
  const leadId = resolvedParams.id;
  const router    = useRouter();
  const toast     = useToast();
  const { user }  = useAuth();

  const [lead,     setLead]     = useState<any>(null);
  const [followups, setFollowups] = useState<any[]>([]);
  const [notes,     setNotes]     = useState<any[]>([]);

  // Executives list for assignment dropdown
  const [executives, setExecutives] = useState<any[]>([]);

  // Follow-up add modal
  const [fuModal,      setFuModal]      = useState(false);
  const [fuDate,       setFuDate]       = useState("");
  const [fuType,       setFuType]       = useState<"Call" | "Meeting">("Call");
  const [fuNotes,      setFuNotes]      = useState("");
  const [fuAssignedTo, setFuAssignedTo] = useState("");
  const [fuPriority,   setFuPriority]   = useState<"High" | "Medium" | "Low">("Medium");
  const [fuSaving,     setFuSaving]     = useState(false);

  // Note / activity add modal
  const [noteModal, setNoteModal] = useState(false);
  const [noteType,  setNoteType]  = useState<"Note" | "Call" | "Meeting">("Note");
  const [noteText,  setNoteText]  = useState("");
  const [noteSaving,setNoteSaving]= useState(false);
  const [loading,   setLoading]   = useState(true);
  const [tab,       setTab]       = useState<Tab>("overview");

  const [convertModal,       setConvertModal]       = useState(false);
  const [dealName,           setDealName]           = useState("");
  const [dealValue,          setDealValue]          = useState("");
  const [expectedCloseDate,  setExpectedCloseDate]  = useState("");
  const [converting,  setConverting]  = useState(false);
  const [markingLost, setMarkingLost] = useState(false);

  // Load executives for assignment
  useEffect(() => {
    if (!user) return;
    if (user.role === "Admin" || user.role === "SalesManager") {
      getUsersAction().then(res => {
        if (res.success && res.data) {
          setExecutives((res.data as any[]).filter(
            (u: any) => u.role === "SalesExecutive" || u.role === "SalesManager"
          ));
        }
      });
    }
  }, [user]);

  const openConvertModal = () => {
    if (!lead) return;
    setDealName(`${lead.name} - Initial Deal`);
    setDealValue("150000");
    const d = new Date();
    d.setDate(d.getDate() + 30);
    setExpectedCloseDate(d.toISOString().substring(0, 10));
    setConvertModal(true);
  };

  const handleConvert = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!dealName || !dealValue || !expectedCloseDate) { toast.error("Please fill in all fields"); return; }
    const val = parseFloat(dealValue);
    if (isNaN(val) || val <= 0) { toast.error("Deal value must be positive"); return; }
    setConverting(true);
    const res = await convertLeadToDealAction(lead.id, dealName, val, expectedCloseDate);
    if (res.success && res.dealId) {
      toast.success("Lead converted to Deal successfully!");
      router.push(`/deals/${res.dealId}`);
    } else {
      toast.error(res.message || "Failed to convert lead.");
      setConverting(false);
    }
  };

  const handleMarkLost = async () => {
    if (!lead || markingLost) return;
    setMarkingLost(true);
    const res = await updateLeadAction(lead.id, { status: "Lost" });
    if (res.success) { toast.success("Lead marked as lost."); load(); }
    else { toast.error(res.message || "Failed to update lead."); setMarkingLost(false); }
  };

  const handleAddFollowUp = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fuDate) { toast.error("Please select a date"); return; }
    setFuSaving(true);
    const res = await createFollowUpAction({
      leadId: lead.id,
      nextMeetingDate: fuDate,
      remarks: `${fuType}: ${fuNotes}`.trim(),
      notes: fuNotes || null,
      priority: fuPriority,
      assignedUserId: fuAssignedTo || lead.assignedUserId || undefined,
      sourceType: "MANUAL",
    });
    if (res.success) {
      toast.success("Follow-up added!");
      setFuModal(false); setFuDate(""); setFuType("Call"); setFuNotes(""); setFuPriority("Medium");
      load();
    } else {
      toast.error(res.message || "Failed to add follow-up.");
      setFuSaving(false);
    }
  };

  const handleAddNote = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteText.trim()) { toast.error("Note cannot be empty"); return; }
    setNoteSaving(true);
    const prefix = noteType !== "Note" ? `[${noteType}] ` : "";
    const res = await createNoteAction("LEAD", lead.id, `${prefix}${noteText}`);
    if (res.success) {
      toast.success("Activity added!");
      setNoteModal(false); setNoteText(""); setNoteType("Note");
      setNotes(prev => [res.data, ...prev]);
    } else {
      toast.error(res.message || "Failed to add note.");
      setNoteSaving(false);
    }
  };

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [res, notesRes] = await Promise.all([
        getLeadByIdAction(leadId),
        getNotesAction("LEAD", leadId),
      ]);
      if (res.success && res.data) {
        setLead(res.data);
        setFollowups((res.data as any).followUps || []);
        setNotes(notesRes.success ? (notesRes.data || []) : []);
      } else {
        toast.error("Lead not found.");
        router.push("/leads");
      }
    } finally {
      setLoading(false);
    }
  }, [leadId]);

  useEffect(() => { load(); }, [load]);

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="flex flex-col items-center gap-3 text-slate-400">
          <div className="spinner-brand" />
          <p className="text-sm font-medium">Loading lead details...</p>
        </div>
      </div>
    );
  }

  if (!lead) return null;

  const initials    = getInitials(lead.name);
  const avatarColor = getAvatarColor(lead.name);
  const isConverted = lead.status === "Converted";
  const isLost      = lead.status === "Lost";

  const TABS: { key: Tab; label: string }[] = [
    { key: "overview",   label: "Overview" },
    { key: "followups",  label: `Follow Ups (${followups.length})` },
    { key: "activities", label: `Activities (${notes.length})` },
  ];

  return (
    <div className="page-shell max-w-4xl mx-auto space-y-5">

      {/* ── Header ── */}
      <div className="flex items-center justify-between gap-4">
        <button
          onClick={() => router.push("/leads")}
          className="flex items-center gap-2 text-sm text-slate-500 hover:text-slate-800 font-medium transition-colors"
        >
          <ArrowLeft size={16} /> Back to Leads
        </button>
        <div className="flex items-center gap-2">
          {!isConverted && !isLost && (
            <button
              onClick={handleMarkLost}
              disabled={markingLost}
              className="flex items-center gap-1.5 px-3 py-2 text-sm font-semibold rounded-xl border border-red-200 text-red-600 hover:bg-red-50 transition-colors disabled:opacity-50"
            >
              <XCircle size={14} />
              {markingLost ? "Marking..." : "Mark Lost"}
            </button>
          )}
          {!isConverted && (
            <button onClick={openConvertModal} className="btn-primary text-sm flex items-center gap-1.5">
              <Briefcase size={14} /> Convert to Deal
            </button>
          )}
          {isConverted && (
            <span className="text-sm bg-emerald-50 text-emerald-700 px-3 py-2 rounded-xl font-bold border border-emerald-100 flex items-center gap-1.5">
              <CheckCircle2 size={14} /> Converted
            </span>
          )}
        </div>
      </div>

      {/* ── Lead Summary Card ── */}
      <div className="crm-card p-6">
        <div className="flex items-start gap-4">
          <div className={cn("w-14 h-14 rounded-2xl flex items-center justify-center text-lg font-black shrink-0", avatarColor)}>
            {initials}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex flex-wrap items-center gap-3">
              <h1 className="text-xl font-extrabold text-slate-900">{lead.name}</h1>
              <StatusBadge status={lead.status} showDot size="md" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-2.5 mt-4">
              {lead.email && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Mail size={13} className="text-slate-400 shrink-0" />
                  <span className="truncate">{lead.email}</span>
                </div>
              )}
              {lead.phone && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Phone size={13} className="text-slate-400 shrink-0" />
                  {lead.phone}
                </div>
              )}
              {lead.leadSource && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <Building2 size={13} className="text-slate-400 shrink-0" />
                  {lead.leadSource}
                </div>
              )}
              {lead.city && (
                <div className="flex items-center gap-2 text-sm text-slate-600">
                  <MapPin size={13} className="text-slate-400 shrink-0" />
                  {lead.city}
                </div>
              )}
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <User size={13} className="text-slate-400 shrink-0" />
                Assigned to{" "}
                <span className="font-semibold">{lead.assignedUser?.name || "Unassigned"}</span>
              </div>
              <div className="flex items-center gap-2 text-sm text-slate-600">
                <CalendarClock size={13} className="text-slate-400 shrink-0" />
                Created {formatDate(lead.createdAt)}
              </div>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex items-center gap-6 mt-6 border-t border-slate-100 pt-4">
          {TABS.map(({ key, label }) => (
            <button
              key={key}
              onClick={() => setTab(key)}
              className={cn(
                "text-sm font-semibold pb-2 border-b-2 transition-colors whitespace-nowrap",
                tab === key
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-400 hover:text-slate-700"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Overview Tab ── */}
      {tab === "overview" && (
        <div className="crm-card p-6">
          <h3 className="text-sm font-bold text-slate-700 mb-5">Lead Information</h3>
          <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-10 gap-y-5">
            {[
              { label: "Full Name",   value: lead.name },
              { label: "Email",       value: lead.email || "—" },
              { label: "Phone",       value: lead.phone || "—" },
              { label: "Lead Source", value: lead.leadSource || "—" },
              { label: "Location",    value: lead.city || "—" },
              { label: "Assigned To", value: lead.assignedUser?.name || "Unassigned" },
              { label: "Created",     value: formatDate(lead.createdAt) },
              { label: "Status",      value: <StatusBadge status={lead.status} /> },
            ].map(({ label, value }) => (
              <div key={label}>
                <dt className="text-xs font-semibold text-slate-400 mb-1">{label}</dt>
                <dd className="text-sm font-semibold text-slate-700">{value}</dd>
              </div>
            ))}
          </dl>

          {lead.notes && (
            <div className="mt-6 pt-5 border-t border-slate-100">
              <h4 className="text-xs font-bold text-slate-400 uppercase tracking-wide mb-3">Notes</h4>
              <p className="text-sm text-slate-600 bg-slate-50 rounded-xl p-4 border border-slate-100 leading-relaxed">
                {lead.notes}
              </p>
            </div>
          )}
        </div>
      )}

      {/* ── Follow Ups Tab ── */}
      {tab === "followups" && (
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-700">Follow Ups</h3>
            <button
              onClick={() => { setFuDate(""); setFuType("Call"); setFuNotes(""); setFuPriority("Medium"); setFuAssignedTo(lead.assignedUserId || ""); setFuSaving(false); setFuModal(true); }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus size={13} /> Add Follow-up
            </button>
          </div>
          {followups.length === 0 ? (
            <div className="text-center py-12">
              <CalendarClock size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No follow-ups scheduled</p>
              <p className="text-xs text-slate-300 mt-1">Schedule a follow-up to keep this lead warm</p>
            </div>
          ) : (
            <div className="space-y-3">
              {followups.map((f: any) => (
                <div
                  key={f.id}
                  className={cn(
                    "flex items-start gap-3 p-4 rounded-xl border text-sm",
                    f.status === "Completed" ? "bg-emerald-50 border-emerald-100" :
                    f.status === "Overdue"   ? "bg-red-50 border-red-100" :
                    "bg-slate-50 border-slate-100"
                  )}
                >
                  <div className={cn(
                    "w-2 h-2 rounded-full mt-1.5 shrink-0",
                    f.status === "Completed" ? "bg-emerald-400" :
                    f.status === "Overdue"   ? "bg-red-400" : "bg-amber-400"
                  )} />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-2">
                      <span className="font-semibold text-slate-700">{f.status}</span>
                      <span className="text-xs text-slate-400 shrink-0">{formatDate(f.nextMeetingDate)}</span>
                    </div>
                    {(f.remarks || f.notes) && (
                      <p className="text-xs text-slate-500 mt-1">{f.remarks || f.notes}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ── Activities Tab ── */}
      {tab === "activities" && (
        <div className="crm-card p-5">
          <div className="flex items-center justify-between mb-5">
            <h3 className="text-sm font-bold text-slate-700">Notes &amp; Activities</h3>
            <button
              onClick={() => { setNoteText(""); setNoteType("Note"); setNoteSaving(false); setNoteModal(true); }}
              className="btn-primary text-xs flex items-center gap-1.5"
            >
              <Plus size={13} /> Add Activity
            </button>
          </div>
          {notes.length === 0 ? (
            <div className="text-center py-12">
              <FileText size={36} className="text-slate-200 mx-auto mb-3" />
              <p className="text-sm font-semibold text-slate-400">No activities recorded</p>
              <p className="text-xs text-slate-300 mt-1">Log a call, meeting, or note to track interactions</p>
            </div>
          ) : (
            <div className="space-y-3">
              {notes.map((n: any) => {
                const isCall    = n.content?.startsWith("[Call]");
                const isMeeting = n.content?.startsWith("[Meeting]");
                return (
                  <div key={n.id} className="flex items-start gap-3 p-4 rounded-xl bg-slate-50 border border-slate-100">
                    {isCall ? (
                      <PhoneCall size={14} className="text-blue-400 mt-0.5 shrink-0" />
                    ) : isMeeting ? (
                      <MessageSquare size={14} className="text-emerald-400 mt-0.5 shrink-0" />
                    ) : (
                      <FileText size={14} className="text-slate-400 mt-0.5 shrink-0" />
                    )}
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-slate-700 leading-relaxed">{n.content}</p>
                      <p className="text-xs text-slate-400 mt-1.5">
                        {n.createdBy?.name || "System"} &middot; {formatDate(n.createdAt)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* ── Add Follow-up Modal ── */}
      <Modal
        open={fuModal}
        onClose={() => setFuModal(false)}
        title="Add Follow-up"
        subtitle="Schedule a call or meeting follow-up for this lead."
        footer={
          <>
            <button type="button" onClick={() => setFuModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" form="add-followup-form" disabled={fuSaving} className="btn-primary text-sm">
              {fuSaving ? <><span className="spinner-brand" /> Saving...</> : "Save Follow-up"}
            </button>
          </>
        }
      >
        <form id="add-followup-form" onSubmit={handleAddFollowUp} className="p-6 space-y-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Date & Time" required>
              <Input type="datetime-local" value={fuDate} onChange={e => setFuDate(e.target.value)} required />
            </FormField>
            <FormField label="Type" required>
              <select
                value={fuType}
                onChange={e => setFuType(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="Call">Call</option>
                <option value="Meeting">Meeting</option>
              </select>
            </FormField>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <FormField label="Assign To" required>
              {user?.role === "SalesExecutive" ? (
                <Input
                  value={user.name || "You (default)"}
                  disabled
                  className="bg-slate-50 text-slate-500"
                />
              ) : (
                <select
                  value={fuAssignedTo}
                  onChange={e => setFuAssignedTo(e.target.value)}
                  className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
                >
                  <option value="">Lead owner (default)</option>
                  {executives.map(ex => (
                    <option key={ex.id} value={ex.id}>{ex.name} — {ex.role}</option>
                  ))}
                </select>
              )}
            </FormField>
            <FormField label="Priority">
              <select
                value={fuPriority}
                onChange={e => setFuPriority(e.target.value as any)}
                className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              >
                <option value="High">🔴 High</option>
                <option value="Medium">🟡 Medium</option>
                <option value="Low">🟢 Low</option>
              </select>
            </FormField>
          </div>
          <FormField label="Notes">
            <textarea
              value={fuNotes}
              onChange={e => setFuNotes(e.target.value)}
              placeholder="What should be discussed or planned..."
              rows={3}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
            />
          </FormField>
        </form>
      </Modal>

      {/* ── Add Activity / Note Modal ── */}
      <Modal
        open={noteModal}
        onClose={() => setNoteModal(false)}
        title="Log Activity"
        subtitle="Add a call log, meeting note, or general note for this lead."
        footer={
          <>
            <button type="button" onClick={() => setNoteModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" form="add-note-form" disabled={noteSaving} className="btn-primary text-sm">
              {noteSaving ? <><span className="spinner-brand" /> Saving...</> : "Save Activity"}
            </button>
          </>
        }
      >
        <form id="add-note-form" onSubmit={handleAddNote} className="p-6 space-y-4">
          <FormField label="Type" required>
            <select
              value={noteType}
              onChange={e => setNoteType(e.target.value as any)}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
            >
              <option value="Note">Note</option>
              <option value="Call">Call Log</option>
              <option value="Meeting">Meeting</option>
            </select>
          </FormField>
          <FormField label="Details" required>
            <textarea
              value={noteText}
              onChange={e => setNoteText(e.target.value)}
              placeholder={noteType === "Call" ? "e.g. Called to discuss delivery timeline. Follow-up needed." : noteType === "Meeting" ? "e.g. Plant visit at Pune facility — discussed requirements." : "Add your note here..."}
              rows={4}
              className="w-full border border-slate-200 rounded-xl px-3 py-2 text-sm text-slate-700 focus:outline-none focus:ring-2 focus:ring-[var(--primary)] resize-none"
              required
            />
          </FormField>
        </form>
      </Modal>

      {/* ── Convert to Deal Modal ── */}
      <Modal
        open={convertModal}
        onClose={() => setConvertModal(false)}
        title="Convert Lead to Deal"
        subtitle="This will promote the lead to an active customer and create a new deal."
        footer={
          <>
            <button type="button" onClick={() => setConvertModal(false)} className="btn-secondary text-sm">Cancel</button>
            <button type="submit" form="convert-lead-form" disabled={converting} className="btn-primary text-sm">
              {converting ? <><span className="spinner-brand" /> Converting...</> : "Convert & Create Deal"}
            </button>
          </>
        }
      >
        <form id="convert-lead-form" onSubmit={handleConvert} className="p-6 space-y-4">
          <FormField label="Deal Name" required>
            <Input value={dealName} onChange={e => setDealName(e.target.value)} placeholder="e.g. Acme Corp - Initial Deal" required />
          </FormField>
          <FormField label="Deal Value (INR)" required>
            <div className="relative">
              <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm font-bold">₹</span>
              <Input type="number" value={dealValue} onChange={e => setDealValue(e.target.value)} placeholder="0.00" className="pl-7" required />
            </div>
          </FormField>
          <FormField label="Expected Close Date" required>
            <Input type="date" value={expectedCloseDate} onChange={e => setExpectedCloseDate(e.target.value)} required />
          </FormField>
        </form>
      </Modal>
    </div>
  );
}
