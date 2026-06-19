"use client";

import { useState, useEffect } from "react";
import { PageShell } from "@/components/ui/PageShell";
import PageContainer from "@/components/PageContainer";
import { SummaryCard } from "@/components/ui/SummaryCard";
import { useToast } from "@/components/ToastProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import { Handshake, Clock, CheckCircle, Percent, Download, Search } from "lucide-react";
import { ReportFilterLayout, FilterField, filterInputClass } from "@/components/reports/ReportFilterLayout";

const statusColors: Record<string, string> = {
  Open: "bg-blue-50 text-blue-600",
  InProgress: "bg-amber-50 text-amber-600",
  Closed: "bg-emerald-50 text-emerald-600",
  OnHold: "bg-slate-100 text-slate-600",
};

export default function NegotiationReportPage() {
  const toast = useToast();
  const { formatCurrency } = useCurrency();
  const [negotiations, setNegotiations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (statusFilter) params.status = statusFilter;
      const res = await fetch(`/api/negotiations?${new URLSearchParams(params)}`);
      const data = await res.json();
      if (data.success) setNegotiations(data.data || []);
    } catch {
      toast.error("Failed to load negotiations");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [statusFilter]);

  const filtered = negotiations.filter((n: any) => {
    if (!search) return true;
    const q = search.toLowerCase();
    return n.negoCode?.toLowerCase().includes(q) || n.deal?.dealName?.toLowerCase().includes(q) || n.customer?.name?.toLowerCase().includes(q);
  });

  const totalNegotiations = filtered.length;
  const closedCount = filtered.filter(n => n.status === "Closed").length;
  const inProgressCount = filtered.filter(n => n.status === "InProgress").length;
  const avgDiscount = filtered.length > 0
    ? (filtered.reduce((sum, n) => sum + (n.finalDiscountPercent || 0), 0) / filtered.length).toFixed(1)
    : "0";

  const exportCSV = () => {
    if (filtered.length === 0) { toast.error("No data to export"); return; }
    const headers = ["Code", "Deal", "Customer", "Status", "Initial Price", "Final Price", "Discount %", "Created Date", "Closed Date"];
    const rows = filtered.map(n => [
      n.negoCode || "",
      n.deal?.dealName || "",
      n.customer?.name || "",
      n.status || "",
      n.initialPrice || 0,
      n.finalPrice || 0,
      n.finalDiscountPercent || 0,
      n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "",
      n.closedAt ? new Date(n.closedAt).toLocaleDateString() : "",
    ]);
    const csv = "\uFEFF" + [headers, ...rows].map(r => r.map(c => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `negotiations_report_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("CSV exported");
  };

  return (
    <PageShell
      title="Negotiation Report"
      subtitle="Analyze negotiation outcomes and discount trends"
      breadcrumb={[{ label: "Reports", href: "/reports" }, { label: "Negotiation Report" }]}
      action={
        <button onClick={exportCSV} disabled={filtered.length === 0} className="flex items-center gap-2 px-5 py-2.5 bg-emerald-600 text-white rounded-xl text-xs font-bold hover:bg-emerald-700 transition-colors shadow-md cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed">
          <Download size={14} /> Export to CSV
        </button>
      }
    >
      <PageContainer className="space-y-6">
        {/* KPI Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <SummaryCard label="Total Negotiations" value={totalNegotiations} icon={<Handshake size={20} />} variant="orange" subtitle="All negotiations" />
          <SummaryCard label="In Progress" value={inProgressCount} icon={<Clock size={20} />} variant="amber" subtitle="Active negotiations" />
          <SummaryCard label="Closed" value={closedCount} icon={<CheckCircle size={20} />} variant="green" subtitle="Completed" />
          <SummaryCard label="Avg Discount" value={`${avgDiscount}%`} icon={<Percent size={20} />} variant="blue" subtitle="Across all deals" />
        </div>

        {/* Filters Panel */}
        <ReportFilterLayout
          title="Filter Negotiations"
          stages={["Open", "InProgress", "Closed", "OnHold"]}
          activeStages={statusFilter ? [statusFilter] : []}
          onToggleStage={(s) => setStatusFilter(statusFilter === s ? "" : s)}
          stageLabel="Status"
          onApply={load}
          onReset={() => { setStatusFilter(""); setSearch(""); }}
          onRefresh={load}
          filters={[
            <FilterField label="Search" key="search">
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"><Search size={14} /></div>
                <input type="text" placeholder="Search by code, deal, or customer..." value={search} onChange={e => setSearch(e.target.value)} className={`${filterInputClass} pl-9`} />
              </div>
            </FilterField>,
          ]}
        />

        {/* Data Table */}
        <div className="crm-card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-slate-50 border-b border-slate-200">
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Code</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Deal</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Customer</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Status</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Initial Price</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Final Price</th>
                  <th className="text-right px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Discount %</th>
                  <th className="text-left px-4 py-3 text-[10px] font-bold text-slate-500 uppercase tracking-wider">Created</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {loading ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">Loading...</td></tr>
                ) : filtered.length === 0 ? (
                  <tr><td colSpan={8} className="text-center py-12 text-slate-400 text-sm">No negotiations found</td></tr>
                ) : (
                  filtered.map(n => (
                    <tr key={n.id} className="hover:bg-slate-50/50">
                      <td className="px-4 py-3 font-mono text-xs text-slate-600">{n.negoCode}</td>
                      <td className="px-4 py-3 text-sm text-slate-900">{n.deal?.dealName || "—"}</td>
                      <td className="px-4 py-3 text-sm text-slate-700">{n.customer?.name || "—"}</td>
                      <td className="px-4 py-3">
                        <span className={`inline-flex px-2 py-0.5 rounded-full text-xs font-medium ${statusColors[n.status] || "bg-slate-100 text-slate-600"}`}>{n.status}</span>
                      </td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(Number(n.initialPrice || 0))}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{formatCurrency(Number(n.finalPrice || 0))}</td>
                      <td className="px-4 py-3 text-sm text-slate-700 text-right">{n.finalDiscountPercent || 0}%</td>
                      <td className="px-4 py-3 text-sm text-slate-500">{n.createdAt ? new Date(n.createdAt).toLocaleDateString() : "—"}</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </PageContainer>
    </PageShell>
  );
}
