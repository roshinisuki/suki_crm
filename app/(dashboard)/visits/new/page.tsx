"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { PageShell } from "@/components/ui/PageShell";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { cn } from "@/lib/ui-utils";
import { getCustomersAction } from "@/app/actions/customers";
import { Search, X, Check } from "lucide-react";

const PURPOSE_OPTIONS = [
  "Demo", "Technical Discussion", "Commercial Meeting",
  "Relationship Visit", "Complaint Resolution",
];

export default function NewVisitPage() {
  const router = useRouter();
  const toast = useToast();

  const [customers, setCustomers] = useState<any[]>([]);
  const [plantLocations, setPlantLocations] = useState<any[]>([]);
  const [contacts, setContacts] = useState<any[]>([]);
  const [opportunities, setOpportunities] = useState<any[]>([]);
  const [users, setUsers] = useState<any[]>([]);
  const [saving, setSaving] = useState(false);
  const [customerSearch, setCustomerSearch] = useState("");
  const [plantLocationSearch, setPlantLocationSearch] = useState("");

  const [form, setForm] = useState({
    customerId: "",
    plantLocationId: "",
    purpose: "",
    plannedDate: "",
    plannedTime: "09:00",
    assignedTo: "",
    linkedOpportunityId: "",
    agenda: "",
    attendeeContactIds: [] as string[],
  });

  // Fetch customers
  useEffect(() => {
    getCustomersAction().then((res) => {
      if (res.success && res.data) setCustomers(res.data as any[]);
    });
    fetch("/api/users").then((res) => res.json()).then((data) => {
      if (data.success) setUsers(data.data || []);
    });
  }, []);

  // Fetch plant locations and contacts when customer is selected
  const loadCustomerData = useCallback(async (customerId: string) => {
    if (!customerId) {
      setPlantLocations([]);
      setContacts([]);
      setOpportunities([]);
      return;
    }
    const [locRes, contactRes, oppRes] = await Promise.all([
      fetch(`/api/plant-locations?customerId=${customerId}`),
      fetch(`/api/contacts?customerId=${customerId}`),
      fetch(`/api/opportunities?search=&customerId=${customerId}`),
    ]);
    if (locRes.ok) {
      const locData = await locRes.json();
      setPlantLocations(locData.data || []);
    }
    if (contactRes.ok) {
      const contactData = await contactRes.json();
      setContacts(contactData.data || []);
    }
    if (oppRes.ok) {
      const oppData = await oppRes.json();
      setOpportunities(oppData.data || []);
    }
  }, []);

  const handleCustomerSelect = (customerId: string) => {
    setForm((prev) => ({
      ...prev,
      customerId,
      plantLocationId: "",
      attendeeContactIds: [],
      linkedOpportunityId: "",
    }));
    setPlantLocationSearch("");
    loadCustomerData(customerId);
  };

  const toggleAttendee = (contactId: string) => {
    setForm((prev) => ({
      ...prev,
      attendeeContactIds: prev.attendeeContactIds.includes(contactId)
        ? prev.attendeeContactIds.filter((id) => id !== contactId)
        : [...prev.attendeeContactIds, contactId],
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.customerId) { toast.error("Please select an account"); return; }
    if (!form.purpose) { toast.error("Purpose is required"); return; }
    if (!form.plannedDate) { toast.error("Planned date is required"); return; }
    setSaving(true);
    try {
      const res = await fetch("/api/visits", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          customerId: form.customerId,
          plantLocationId: form.plantLocationId || undefined,
          purpose: form.purpose,
          plannedDate: form.plannedDate,
          plannedTime: form.plannedTime,
          assignedTo: form.assignedTo || undefined,
          attendeeContactIds: form.attendeeContactIds,
          linkedOpportunityId: form.linkedOpportunityId || undefined,
          agenda: form.agenda,
        }),
      });
      const data = await res.json();
      if (data.success) {
        toast.success("Visit planned successfully");
        router.push(`/visits/${data.data.id}`);
      } else {
        toast.error(data.message || "Failed to plan visit");
      }
    } catch {
      toast.error("Failed to plan visit");
    } finally {
      setSaving(false);
    }
  };

  const filteredCustomers = customers.filter((c: any) => {
    if (!customerSearch) return true;
    const q = customerSearch.toLowerCase();
    return c.name?.toLowerCase().includes(q) || c.customerCode?.toLowerCase().includes(q);
  });

  const selectedCustomer = customers.find((c) => c.id === form.customerId);

  return (
    <PageShell
      title="Plan Visit"
      subtitle="Schedule a customer visit with attendees and plant location"
      breadcrumb={[{ label: "Visits", href: "/visits" }]}
    >
      <form onSubmit={handleSubmit} className="space-y-6 max-w-3xl">
        {/* Account Search */}
        <div className="crm-card p-6 space-y-4">
          <h3 className="text-sm font-bold text-slate-800">Account</h3>
          <FormField label="Search Account" required>
            <div className="relative">
              <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <Input
                type="text"
                placeholder="Search by name or code..."
                value={customerSearch}
                onChange={(e) => setCustomerSearch(e.target.value)}
                className="pl-9"
              />
            </div>
          </FormField>
          {form.customerId ? (
            <div className="flex items-center justify-between p-3 bg-[var(--primary)]/5 border border-[var(--primary)]/20 rounded-lg">
              <div>
                <p className="text-sm font-bold text-slate-800">{selectedCustomer?.name}</p>
                <p className="text-xs text-slate-500">{selectedCustomer?.customerCode} — {selectedCustomer?.city}</p>
              </div>
              <button
                type="button"
                onClick={() => { setForm({ ...form, customerId: "" }); setPlantLocations([]); setContacts([]); }}
                className="text-slate-400 hover:text-rose-500"
              >
                <X size={16} />
              </button>
            </div>
          ) : (
            <div className="max-h-48 overflow-y-auto border border-slate-200 rounded-lg divide-y divide-slate-100">
              {filteredCustomers.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No accounts found</p>
              ) : (
                filteredCustomers.slice(0, 20).map((c) => (
                  <button
                    key={c.id}
                    type="button"
                    onClick={() => handleCustomerSelect(c.id)}
                    className="w-full text-left px-3 py-2 hover:bg-slate-50 transition-colors"
                  >
                    <p className="text-sm font-bold text-slate-700">{c.name}</p>
                    <p className="text-xs text-slate-400">{c.customerCode} — {c.city}</p>
                  </button>
                ))
              )}
            </div>
          )}
        </div>

        {/* Visit Details */}
        {form.customerId && (
          <>
            <div className="crm-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Visit Details</h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField label="Plant Location">
                  <div className="relative mb-2">
                    <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                    <input
                      type="text"
                      placeholder="Search plant locations..."
                      value={plantLocationSearch}
                      onChange={(e) => setPlantLocationSearch(e.target.value)}
                      className="w-full pl-9 pr-3 py-2 text-sm rounded-lg bg-slate-50 border border-slate-200 focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)]"
                    />
                  </div>
                  <Select
                    value={form.plantLocationId}
                    onChange={(e) => setForm({ ...form, plantLocationId: e.target.value })}
                  >
                    <option value="">-- Select Plant Location --</option>
                    {plantLocations
                      .filter((loc) => {
                        if (!plantLocationSearch) return true;
                        const q = plantLocationSearch.toLowerCase();
                        return (
                          loc.locationName?.toLowerCase().includes(q) ||
                          loc.city?.toLowerCase().includes(q) ||
                          loc.address?.toLowerCase().includes(q)
                        );
                      })
                      .map((loc) => (
                        <option key={loc.id} value={loc.id}>
                          {loc.locationName} — {loc.city || "N/A"}
                          {loc.isPrimary ? " (Primary)" : ""}
                        </option>
                      ))}
                  </Select>
                  {form.plantLocationId && (
                    <button
                      type="button"
                      onClick={() => setForm({ ...form, plantLocationId: "" })}
                      className="mt-2 text-xs text-slate-500 hover:text-rose-500 flex items-center gap-1"
                    >
                      <X size={12} /> Clear selection
                    </button>
                  )}
                </FormField>
                <FormField label="Purpose" required>
                  <Select
                    value={form.purpose}
                    onChange={(e) => setForm({ ...form, purpose: e.target.value })}
                  >
                    <option value="">Select purpose...</option>
                    {PURPOSE_OPTIONS.map((p) => (
                      <option key={p} value={p}>{p}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Planned Date" required>
                  <Input
                    type="date"
                    value={form.plannedDate}
                    onChange={(e) => setForm({ ...form, plannedDate: e.target.value })}
                    min={new Date().toISOString().split("T")[0]}
                  />
                </FormField>
                <FormField label="Planned Time">
                  <Input
                    type="time"
                    value={form.plannedTime}
                    onChange={(e) => setForm({ ...form, plannedTime: e.target.value })}
                  />
                </FormField>
                <FormField label="Assigned To">
                  <Select
                    value={form.assignedTo}
                    onChange={(e) => setForm({ ...form, assignedTo: e.target.value })}
                  >
                    <option value="">Yourself (default)</option>
                    {users.filter((u) => u.role !== "Customer").map((u) => (
                      <option key={u.id} value={u.id}>{u.name}</option>
                    ))}
                  </Select>
                </FormField>
                <FormField label="Link Opportunity (optional)">
                  <Select
                    value={form.linkedOpportunityId}
                    onChange={(e) => setForm({ ...form, linkedOpportunityId: e.target.value })}
                  >
                    <option value="">None</option>
                    {opportunities.map((opp) => (
                      <option key={opp.id} value={opp.id}>{opp.dealName} ({opp.opportunityCode})</option>
                    ))}
                  </Select>
                </FormField>
              </div>
              <FormField label="Agenda">
                <Textarea
                  rows={3}
                  value={form.agenda}
                  onChange={(e) => setForm({ ...form, agenda: e.target.value })}
                  placeholder="Visit agenda and discussion points..."
                />
              </FormField>
            </div>

            {/* Attendees Multi-Select */}
            <div className="crm-card p-6 space-y-4">
              <h3 className="text-sm font-bold text-slate-800">Attendees</h3>
              <p className="text-xs text-slate-500">Select contacts from this account to attend the visit.</p>
              {contacts.length === 0 ? (
                <p className="text-sm text-slate-400 text-center py-4">No contacts found for this account.</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {contacts.map((c) => {
                    const isSelected = form.attendeeContactIds.includes(c.id);
                    return (
                      <button
                        key={c.id}
                        type="button"
                        onClick={() => toggleAttendee(c.id)}
                        className={cn(
                          "flex items-center justify-between p-3 rounded-lg border transition-all text-left",
                          isSelected
                            ? "border-[var(--primary)] bg-[var(--primary)]/5"
                            : "border-slate-200 bg-slate-50 hover:bg-slate-100"
                        )}
                      >
                        <div>
                          <p className="text-sm font-bold text-slate-800">{c.name}</p>
                          <p className="text-xs text-slate-500">{c.designation || c.contactType}</p>
                        </div>
                        {isSelected && <Check size={16} className="text-[var(--primary)]" />}
                      </button>
                    );
                  })}
                </div>
              )}
              {form.attendeeContactIds.length > 0 && (
                <p className="text-xs font-bold text-slate-600">
                  {form.attendeeContactIds.length} attendee{form.attendeeContactIds.length !== 1 ? "s" : ""} selected
                </p>
              )}
            </div>

            {/* Submit */}
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-6 py-2.5 bg-[var(--primary)] text-white font-bold text-sm rounded-xl hover:bg-[var(--primary-hover)] disabled:opacity-70"
              >
                {saving ? "Planning..." : "Plan Visit"}
              </button>
              <button
                type="button"
                onClick={() => router.push("/visits")}
                className="px-6 py-2.5 text-slate-700 font-bold text-sm rounded-xl bg-slate-100 hover:bg-slate-200"
              >
                Cancel
              </button>
            </div>
          </>
        )}
      </form>
    </PageShell>
  );
}
