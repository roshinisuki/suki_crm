"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useToast } from "@/components/ToastProvider";
import { PageShell } from "@/components/ui/PageShell";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { Modal } from "@/components/ui/Modal";
import { FormField, Input, Textarea, Select } from "@/components/ui/FormField";
import { formatDate, formatDateTime, cn } from "@/lib/ui-utils";
import {
  Plus, Eye, MapPin, CheckCircle, Clock, CalendarClock,
  AlertTriangle, Briefcase, TrendingUp, X, ChevronRight,
} from "lucide-react";

const STATUS_TABS = [
  { key: "PLANNED", label: "Planned" },
  { key: "CHECKED_IN", label: "Checked In" },
  { key: "COMPLETED", label: "Completed" },
  { key: "MISSED", label: "Missed" },
  { key: "", label: "All Visits" },
];

const STATUS_PILLS: Record<string, string> = {
  PLANNED: "bg-blue-50 text-blue-700 border-blue-200",
  CHECKED_IN: "bg-amber-50 text-amber-700 border-amber-200",
  CHECKED_OUT: "bg-teal-50 text-teal-700 border-teal-200",
  COMPLETED: "bg-emerald-50 text-emerald-700 border-emerald-200",
  MISSED: "bg-rose-50 text-rose-700 border-rose-200",
};

const STATUS_LABELS: Record<string, string> = {
  PLANNED: "Planned",
  CHECKED_IN: "Checked In",
  CHECKED_OUT: "Checked Out",
  COMPLETED: "Completed",
  MISSED: "Missed",
};

const PURPOSE_OPTIONS = [
  "Demo", "Technical Discussion", "Commercial Meeting",
  "Relationship Visit", "Complaint Resolution",
];

export default function VisitsListPage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const toast = useToast();

  const initialTab = searchParams.get("status") || "";
  const [activeTab, setActiveTab] = useState(initialTab);
  const [visits, setVisits] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCompliance, setShowCompliance] = useState(false);
  const [complianceData, setComplianceData] = useState<any[]>([]);
  const [complianceLoading, setComplianceLoading] = useState(false);

  const fetchVisits = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (activeTab) params.set("status", activeTab);
    const res = await fetch(`/api/visits?${params.toString()}`);
    if (res.ok) {
      const json = await res.json();
      setVisits(json.data || []);
    } else {
      toast.error("Failed to load visits");
    }
    setLoading(false);
  }, [activeTab]);

  useEffect(() => {
    fetchVisits();
  }, [fetchVisits]);

  const handleTabChange = (tab: string) => {
    setActiveTab(tab);
    router.push(`/visits${tab ? `?status=${tab}` : ""}`);
  };

  const handleCheckIn = async (id: string) => {
    if (!navigator.geolocation) {
      toast.error("Geolocation is not supported by this browser");
      return;
    }
    toast.info("Capturing your location...");
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        const res = await fetch(`/api/visits/${id}/checkin`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ gps_lat: latitude, gps_lng: longitude }),
        });
        const json = await res.json();
        if (json.success) {
          toast.success("Checked in successfully");
          if (json.warning) toast.warning(json.warning);
          fetchVisits();
        } else {
          toast.error(json.message || "Check-in failed");
        }
      },
      (err) => {
        toast.error(`Failed to get location: ${err.message}`);
      },
      { enableHighAccuracy: true, timeout: 10000 }
    );
  };

  const fetchCompliance = useCallback(async () => {
    setComplianceLoading(true);
    const res = await fetch(`/api/visits/key-account-compliance`);
    if (res.ok) {
      const json = await res.json();
      setComplianceData(json.data || []);
    } else {
      toast.error("Failed to load compliance data");
    }
    setComplianceLoading(false);
  }, []);

  const handleOpenCompliance = () => {
    setShowCompliance(true);
    fetchCompliance();
  };

  const kpiPlanned = visits.filter((v) => v.status === "PLANNED").length;
  const kpiCompleted = visits.filter((v) => v.status === "COMPLETED").length;
  const kpiMissed = visits.filter((v) => v.status === "MISSED").length;
  const kpiCheckedIn = visits.filter((v) => v.status === "CHECKED_IN").length;

  const today = new Date();
  today.setHours(0, 0, 0, 0);

  const getComplianceColor = (days: number | null) => {
    if (days == null) return "bg-rose-50";
    if (days > 90) return "bg-rose-50";
    if (days > 60) return "bg-orange-50";
    if (days > 30) return "bg-amber-50";
    return "bg-emerald-50";
  };

  return (
    <PageShell
      title="Customer Visits"
      subtitle="Field sales tracking with GPS check-in and visit compliance."
      action={
        <div className="flex items-center gap-2">
          <button
            onClick={handleOpenCompliance}
            className="px-3 py-2 text-sm font-bold text-slate-600 border border-slate-200 rounded-lg hover:bg-slate-50 flex items-center gap-1.5"
          >
            <AlertTriangle size={15} /> Key Account Compliance
          </button>
          <button
            onClick={() => router.push("/visits/new")}
            className="px-4 py-2 bg-[var(--primary)] text-white font-bold text-sm rounded-lg hover:bg-[var(--primary-hover)] flex items-center gap-1.5"
          >
            <Plus size={15} /> Plan Visit
          </button>
        </div>
      }
    >
      <div className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <SummaryCard label="Planned" value={kpiPlanned.toString()} icon={<CalendarClock size={20} />} variant="indigo" />
          <SummaryCard label="Checked In" value={kpiCheckedIn.toString()} icon={<MapPin size={20} />} variant="light" />
          <SummaryCard label="Completed" value={kpiCompleted.toString()} icon={<CheckCircle size={20} />} variant="dark" />
          <SummaryCard label="Missed" value={kpiMissed.toString()} icon={<AlertTriangle size={20} />} variant="orange" />
        </div>

        {/* Status Tabs */}
        <div className="flex items-center gap-1 border-b border-slate-200 overflow-x-auto">
          {STATUS_TABS.map((tab) => (
            <button
              key={tab.key || "all"}
              onClick={() => handleTabChange(tab.key)}
              className={cn(
                "px-4 py-2.5 text-sm font-bold border-b-2 transition-all whitespace-nowrap",
                activeTab === tab.key
                  ? "border-[var(--primary)] text-[var(--primary)]"
                  : "border-transparent text-slate-400 hover:text-slate-600"
              )}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Visits Table */}
        <div className="crm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="crm-table">
              <thead>
                <tr className="crm-tr border-b border-slate-200/60">
                  <th className="crm-th">Account</th>
                  <th className="crm-th">Plant Location</th>
                  <th className="crm-th">Purpose</th>
                  <th className="crm-th">Date &amp; Time</th>
                  <th className="crm-th">Assigned To</th>
                  <th className="crm-th">Status</th>
                  <th className="crm-th">GPS</th>
                  <th className="crm-th text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {loading ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">Loading visits...</td>
                  </tr>
                ) : visits.length === 0 ? (
                  <tr>
                    <td colSpan={8} className="px-5 py-12 text-center text-slate-400">No visits found for the selected criteria.</td>
                  </tr>
                ) : (
                  visits.map((v) => {
                    const isPlannedToday =
                      v.status === "PLANNED" &&
                      v.plannedDate &&
                      new Date(v.plannedDate).toDateString() === today.toDateString();
                    return (
                      <tr key={v.id} className="crm-tr hover:bg-slate-50/80 transition-colors">
                        <td className="crm-td">
                          <p className="font-bold text-slate-800 text-sm">{v.customer?.name || "—"}</p>
                          <p className="text-[11px] text-slate-400">{v.customer?.customerCode}</p>
                        </td>
                        <td className="crm-td">
                          <p className="text-sm text-slate-600">{v.plantLocation?.locationName || "—"}</p>
                          <p className="text-[11px] text-slate-400">{v.plantLocation?.city}</p>
                        </td>
                        <td className="crm-td">
                          <span className="px-2 py-0.5 bg-indigo-50 text-indigo-700 text-xs font-bold rounded-md border border-indigo-100">
                            {v.purpose}
                          </span>
                        </td>
                        <td className="crm-td">
                          {v.plannedDate ? (
                            <div>
                              <p className="text-sm font-medium text-slate-700">{formatDate(v.plannedDate)}</p>
                              <p className="text-[11px] text-slate-400">{v.plannedTime}</p>
                            </div>
                          ) : (
                            <span className="text-slate-400 text-sm">—</span>
                          )}
                        </td>
                        <td className="crm-td">
                          <span className="text-sm text-slate-600">{v.host?.name || "—"}</span>
                        </td>
                        <td className="crm-td">
                          <span className={cn("px-2.5 py-1 text-xs font-bold rounded-lg border", STATUS_PILLS[v.status] || "bg-slate-50 text-slate-600 border-slate-200")}>
                            {STATUS_LABELS[v.status] || v.status}
                          </span>
                        </td>
                        <td className="crm-td">
                          {v.gpsLat != null ? (
                            <MapPin size={15} className={v.gpsAnomaly ? "text-amber-500" : "text-emerald-500"} />
                          ) : (
                            <span className="text-slate-300">—</span>
                          )}
                        </td>
                        <td className="crm-td text-right">
                          <div className="flex items-center justify-end gap-1">
                            {isPlannedToday && (
                              <button
                                onClick={() => handleCheckIn(v.id)}
                                className="px-2.5 py-1 bg-amber-600 text-white font-bold text-xs rounded-lg hover:bg-amber-700 flex items-center gap-1"
                              >
                                <MapPin size={12} /> Check In
                              </button>
                            )}
                            {v.status === "CHECKED_IN" && (
                              <button
                                onClick={() => router.push(`/visits/${v.id}`)}
                                className="px-2.5 py-1 bg-[var(--primary)] text-white font-bold text-xs rounded-lg hover:bg-[var(--primary-hover)]"
                              >
                                Complete
                              </button>
                            )}
                            {(v.status === "PLANNED" || v.status === "MISSED") && (
                              <button
                                onClick={() => router.push(`/visits/${v.id}`)}
                                className="px-2.5 py-1 bg-slate-50 text-slate-700 font-bold text-xs rounded-lg hover:bg-slate-100 border border-slate-200"
                              >
                                Reschedule
                              </button>
                            )}
                            <button
                              onClick={() => router.push(`/visits/${v.id}`)}
                              className="p-1.5 text-slate-400 hover:text-[var(--primary)] hover:bg-slate-50 rounded-lg transition-all"
                              title="View"
                            >
                              <Eye size={15} />
                            </button>
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
      </div>

      {/* Key Account Compliance Modal */}
      <Modal
        open={showCompliance}
        onClose={() => setShowCompliance(false)}
        title="Key Account Visit Compliance"
        subtitle="Key accounts not visited in 30+ days"
        size="lg"
        footer={
          <button onClick={() => setShowCompliance(false)} className="px-4 py-2 text-sm font-bold text-slate-500 hover:text-slate-700">Close</button>
        }
      >
        <div className="p-4">
          {complianceLoading ? (
            <div className="text-center py-8 text-slate-400">Loading compliance data...</div>
          ) : complianceData.length === 0 ? (
            <div className="text-center py-8 text-slate-400">No key accounts found.</div>
          ) : (
            <table className="w-full">
              <thead>
                <tr className="border-b border-slate-200">
                  <th className="text-left px-3 py-2 text-xs font-bold text-slate-600 uppercase">Account</th>
                  <th className="text-left px-3 py-2 text-xs font-bold text-slate-600 uppercase">City</th>
                  <th className="text-left px-3 py-2 text-xs font-bold text-slate-600 uppercase">Sales Owner</th>
                  <th className="text-left px-3 py-2 text-xs font-bold text-slate-600 uppercase">Last Visit</th>
                  <th className="text-right px-3 py-2 text-xs font-bold text-slate-600 uppercase">Days Since</th>
                </tr>
              </thead>
              <tbody>
                {complianceData.map((c) => (
                  <tr key={c.accountId} className={cn("border-b border-slate-100", getComplianceColor(c.daysSinceVisit))}>
                    <td className="px-3 py-2.5 text-sm font-bold text-slate-800">{c.accountName}</td>
                    <td className="px-3 py-2.5 text-sm text-slate-600">{c.city || "—"}</td>
                    <td className="px-3 py-2.5 text-sm text-slate-600">{c.salesOwner}</td>
                    <td className="px-3 py-2.5 text-sm text-slate-600">{c.lastVisitDate ? formatDate(c.lastVisitDate) : "Never"}</td>
                    <td className="px-3 py-2.5 text-right">
                      <span className={cn(
                        "text-sm font-bold",
                        c.daysSinceVisit == null ? "text-rose-600" :
                        c.daysSinceVisit > 90 ? "text-rose-600" :
                        c.daysSinceVisit > 60 ? "text-orange-600" :
                        c.daysSinceVisit > 30 ? "text-amber-600" :
                        "text-emerald-600"
                      )}>
                        {c.daysSinceVisit == null ? "Never" : `${c.daysSinceVisit}d`}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </Modal>
    </PageShell>
  );
}
