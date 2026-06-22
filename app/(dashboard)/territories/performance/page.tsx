"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import PageContainer from "@/components/PageContainer";

export default function TerritoryPerformancePage() {
  const toast = useToast();
  const { formatCurrency } = useCurrency();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/territories/performance");
      const data = await res.json();
      if (data.success) setData(data.data);
    } catch {
      toast.error("Failed to load performance data");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const exportCSV = () => {
    const headers = ["Territory", "Assigned User", "Leads", "Visits", "Follow-Ups Done", "Deals Won", "Revenue", "Target", "Achieved", "Target vs Achieved"];
    const rows = data.map(d => [
      d.name,
      d.assignedUser?.name || "—",
      d.leads,
      d.visits,
      d.followUpsDone,
      d.dealsWon,
      d.revenue,
      d.targetAmount,
      d.achievedAmount,
      d.targetVsAchieved,
    ]);
    const csv = [headers, ...rows].map(r => r.map(c => `"${c}"`).join(",")).join("\n");
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "territory-performance.csv";
    a.click();
    URL.revokeObjectURL(url);
  };

  return (
    <PageContainer className="space-y-4 p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Territory Performance</h1>
          <p className="text-sm text-slate-500 mt-0.5">Aggregated performance metrics per territory</p>
        </div>
        <div className="flex gap-2">
          <button onClick={exportCSV} disabled={!data.length} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-50">
            Export CSV
          </button>
          <Link href="/territories" className="text-sm text-blue-600 hover:underline self-center">← Back</Link>
        </div>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">No performance data found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Territory</th>
                <th className="px-4 py-3 font-semibold">Assigned User</th>
                <th className="px-4 py-3 font-semibold text-right">Leads</th>
                <th className="px-4 py-3 font-semibold text-right">Visits</th>
                <th className="px-4 py-3 font-semibold text-right">Follow-Ups</th>
                <th className="px-4 py-3 font-semibold text-right">Deals Won</th>
                <th className="px-4 py-3 font-semibold text-right">Revenue</th>
                <th className="px-4 py-3 font-semibold text-right">Target</th>
                <th className="px-4 py-3 font-semibold text-right">Target vs Achieved</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((d) => (
                <tr key={d.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium"><Link href={`/territories/${d.id}`} className="text-blue-600 hover:underline">{d.name}</Link></td>
                  <td className="px-4 py-3 text-gray-600">{d.assignedUser?.name || "—"}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{d.leads}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{d.visits}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{d.followUpsDone}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{d.dealsWon}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(d.revenue)}</td>
                  <td className="px-4 py-3 text-right text-gray-600">{formatCurrency(d.targetAmount)}</td>
                  <td className="px-4 py-3 text-right">
                    <span className={`px-2 py-0.5 rounded-full text-xs ${d.targetVsAchieved !== "—" && parseInt(d.targetVsAchieved) >= 100 ? "bg-green-50 text-green-700" : d.targetVsAchieved !== "—" && parseInt(d.targetVsAchieved) >= 50 ? "bg-yellow-50 text-yellow-700" : "bg-gray-100 text-gray-600"}`}>
                      {d.targetVsAchieved}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
