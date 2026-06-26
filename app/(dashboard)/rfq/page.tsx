"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { ConfirmModal } from "@/components/ConfirmModal";
import { useToast } from "@/components/ToastProvider";
import PageContainer from "@/components/PageContainer";
import { PageShell } from "@/components/ui/PageShell";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { CRMSpinner } from "@/components/CRMSpinner";
import { AlertTriangle, Clock, FileText, TrendingUp, AlertCircle, Trash2 } from "lucide-react";

const statusColors: Record<string, string> = {
  New: "bg-blue-100 text-blue-700",
  UnderReview: "bg-amber-100 text-amber-700",
  CostingPending: "bg-orange-100 text-orange-700",
  QuotationCreated: "bg-green-100 text-green-700",
  Closed: "bg-gray-100 text-gray-600",
};

const statusOptions = ["New", "UnderReview", "CostingPending", "QuotationCreated", "Closed"];

export default function RFQListPage() {
  const [rfqs, setRfqs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [stats, setStats] = useState<any>(null);
  const searchParams = useSearchParams();
  const { user } = useAuth();
  const router = useRouter();
  const toast = useToast();
  const [confirmState, setConfirmState] = useState<{ isOpen: boolean; title: string; message: string; action: () => void }>({ isOpen: false, title: "", message: "", action: () => {} });

  const statusFilter = searchParams.get("status") || "";

  const loadRFQs = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await fetch(`/api/rfq?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (data.success) {
        setRfqs(data.data);
      }
    } catch (err) {
      toast.error("Failed to load RFQs");
    } finally {
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const res = await fetch("/api/rfq/stats");
      const data = await res.json();
      if (data.success) setStats(data.data);
    } catch {}
  };

  useEffect(() => {
    loadRFQs();
    loadStats();
  }, [statusFilter]);

  const filtered = rfqs.filter((r: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return r.rfqCode?.toLowerCase().includes(q) || r.customer?.name?.toLowerCase().includes(q);
  });

  const handleDelete = (id: string) => {
    setConfirmState({
      isOpen: true,
      title: "Delete RFQ",
      message: "Are you sure you want to delete this RFQ? This action cannot be undone.",
      action: async () => {
        try {
          const res = await fetch(`/api/rfq/${id}`, { method: "DELETE" });
          const data = await res.json();
          if (data.success) {
            toast.success("RFQ deleted");
            loadRFQs();
            loadStats();
          } else {
            toast.error(data.message || "Failed to delete");
          }
        } catch {
          toast.error("Failed to delete");
        }
        setConfirmState({ isOpen: false, title: "", message: "", action: () => {} });
      },
    });
  };

  const now = new Date();

  const getAgingRowClass = (rfq: any) => {
    if (rfq.status !== "CostingPending") return "";
    const days = Math.floor((now.getTime() - new Date(rfq.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    if (days > 5) return "bg-red-50";
    if (days >= 3) return "bg-orange-50";
    return "";
  };

  const getDaysPending = (rfq: any) => {
    if (rfq.status !== "CostingPending") return "—";
    const days = Math.floor((now.getTime() - new Date(rfq.createdAt).getTime()) / (1000 * 60 * 60 * 24));
    return `${days}d`;
  };

  const isOverdue = (rfq: any) => {
    if (!rfq.customerDueDate) return false;
    return new Date(rfq.customerDueDate) < now && !["QuotationCreated", "Closed"].includes(rfq.status);
  };

  return (
    <PageShell
      title="RFQ Management"
      subtitle="Manage Request for Quotations"
      action={
        <button
          onClick={() => router.push("/rfq/new")}
          className="flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium text-white bg-[var(--primary)] hover:bg-[var(--primary-hover)] transition-colors cursor-pointer"
        >
          + New RFQ
        </button>
      }
    >
      <div className="space-y-4">
        {/* Stats Cards */}
        {stats && (
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-6 gap-3">
            <SummaryCard label="Pending Costing" value={stats.pending_costing} icon={<Clock size={18} />} variant="amber" />
            <SummaryCard label="Aging 0-2d" value={stats.aging_0_2} icon={<Clock size={18} />} variant="green" />
            <SummaryCard label="Aging 3-5d" value={stats.aging_3_5} icon={<AlertTriangle size={18} />} variant="amber" />
            <SummaryCard label="Aging 5+d" value={stats.aging_5_plus} icon={<AlertTriangle size={18} />} variant="red" />
            <SummaryCard label="Overdue Due Date" value={stats.overdue_customer_due} icon={<AlertCircle size={18} />} variant="red" />
            <SummaryCard label="RFQ→Quote Rate" value={`${stats.rfq_to_quotation_rate}%`} icon={<TrendingUp size={18} />} variant="blue" />
          </div>
        )}

        {/* Status Tabs */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => router.push("/rfq")}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${!statusFilter ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
          >
            All
          </button>
          {statusOptions.map((s) => (
            <button
              key={s}
              onClick={() => router.push(`/rfq?status=${s}`)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors cursor-pointer ${statusFilter === s ? "bg-[var(--primary)] text-white" : "bg-slate-100 text-slate-700 hover:bg-slate-200"}`}
            >
              {s.replace(/([A-Z])/g, " $1").trim()}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative">
          <input
            type="text"
            placeholder="Search by RFQ code or customer name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full px-4 py-2 rounded-xl bg-slate-50 border border-slate-200 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--primary)]/20 focus:border-[var(--primary)] transition-all"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-2xl border border-slate-200/60 shadow-sm overflow-hidden">
          <table className="w-full">
            <thead>
              <tr className="bg-slate-50 border-b border-slate-200">
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">RFQ Code</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Account</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Priority</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Customer Due</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Status</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Assigned To</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Costing Owner</th>
                <th className="text-left px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Days Pending</th>
                <th className="text-right px-4 py-3 text-xs font-semibold text-slate-600 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={9} className="py-12 text-center">
                    <div className="flex justify-center">
                      <CRMSpinner size={36} label="Loading RFQs..." />
                    </div>
                  </td>
                </tr>
              ) : filtered.length === 0 ? (
                <tr><td colSpan={9} className="text-center py-8 text-slate-400">No RFQs found</td></tr>
              ) : (
                filtered.map((rfq: any) => {
                  const overdue = isOverdue(rfq);
                  const rowClass = getAgingRowClass(rfq);
                  return (
                    <tr
                      key={rfq.id}
                      className={`border-b border-slate-100 hover:bg-slate-50/50 transition-colors table-row-clickable ${rowClass}`}
                      onClick={() => router.push(`/rfq/${rfq.id}`)}
                    >
                      <td className="px-4 py-3 text-sm font-medium text-slate-800">{rfq.rfqCode}</td>
                      <td className="px-4 py-3 text-sm">
                        <span className="row-primary-link">{rfq.customer?.name || "—"}</span>
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs font-medium ${rfq.priority === "Urgent" ? "bg-red-100 text-red-700" : "bg-gray-100 text-gray-600"}`}>
                          {rfq.priority || "Normal"}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm">
                        {rfq.customerDueDate ? (
                          <span className={overdue ? "text-red-600 font-medium" : "text-slate-700"}>
                            {new Date(rfq.customerDueDate).toLocaleDateString()}
                            {overdue && <span className="ml-1 text-xs">⚠</span>}
                          </span>
                        ) : "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span className={`inline-block px-2.5 py-0.5 rounded-full text-xs font-medium ${statusColors[rfq.status] || "bg-gray-100 text-gray-600"}`}>
                          {rfq.status.replace(/([A-Z])/g, " $1").trim()}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700">{rfq.assignedUser?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{rfq.costingOwner?.name || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{getDaysPending(rfq)}</td>
                      <td className="px-4 py-3" onClick={e => e.stopPropagation()}>
                        <div className="flex items-center justify-end gap-1.5">
                          <button onClick={() => handleDelete(rfq.id)} className="row-action-btn row-action-btn-danger" title="Delete">
                            <Trash2 size={15} />
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

      <ConfirmModal
        isOpen={confirmState.isOpen}
        title={confirmState.title}
        message={confirmState.message}
        onConfirm={confirmState.action}
        onCancel={() => setConfirmState({ isOpen: false, title: "", message: "", action: () => {} })}
        isDestructive={true}
      />
    </PageShell>
  );
}
