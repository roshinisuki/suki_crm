"use client";

import { useState, useEffect } from "react";
import { useToast } from "@/components/ToastProvider";
import PageContainer from "@/components/PageContainer";

const Ico = ({ d, size = 16, className }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  download: "M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4 M7 10l5 5 5-5 M12 15V3",
};

export default function WinLossPage() {
  const toast = useToast();
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [from, setFrom] = useState("");
  const [to, setTo] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const params: any = {};
      if (from) params.from = from;
      if (to) params.to = to;
      const res = await fetch(`/api/competitors/win-loss?${new URLSearchParams(params)}`);
      const d = await res.json();
      if (d.success) setData(d.data);
      else toast.error("Failed to load");
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, [from, to]);

  const exportCsv = () => {
    if (!data) return;
    const rows: string[] = [];
    rows.push("Section,Label,Value");
    rows.push(`Summary,Won Count,${data.summary.wonCount}`);
    rows.push(`Summary,Lost Count,${data.summary.lostCount}`);
    rows.push(`Summary,Won Value,${data.summary.wonValue}`);
    rows.push(`Summary,Lost Value,${data.summary.lostValue}`);
    rows.push(`Summary,Win Rate %,${data.summary.winRate}`);
    rows.push(`Summary,Total,${data.summary.total}`);
    rows.push("");
    rows.push("By Competitor,Competitor,Lost Count");
    data.byCompetitor.forEach((c: any) => rows.push(`Competitor,${escape(c.competitorName)},${c.lostCount}`));
    rows.push("");
    rows.push("By Loss Reason,Reason,Lost Count");
    data.byLossReason.forEach((r: any) => rows.push(`Loss Reason,${escape(r.lossReasonName)},${r.lostCount}`));

    const blob = new Blob([rows.join("\n")], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `win-loss-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const escape = (s: string) => `"${s.replace(/"/g, '""')}"`;

  const s = data?.summary;
  const maxCompetitor = data ? Math.max(1, ...data.byCompetitor.map((c: any) => c.lostCount)) : 1;
  const maxReason = data ? Math.max(1, ...data.byLossReason.map((r: any) => r.lostCount)) : 1;

  return (
    <PageContainer className="space-y-4 p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Win/Loss Analysis</h1>
        <p className="text-sm text-slate-500 mt-0.5">Aggregate win/loss performance with competitor and reason breakdowns</p>
      </div>
      <div className="flex flex-wrap items-end gap-3 mb-5">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">From</label>
          <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">To</label>
          <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500" />
        </div>
        <button onClick={exportCsv} disabled={!data} className="inline-flex items-center gap-1.5 px-3.5 py-2 text-sm font-medium border rounded-lg hover:bg-gray-50 disabled:opacity-50 ml-auto">
          <Ico d={icons.download} size={16} /> Export CSV
        </button>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : !data ? (
        <div className="py-12 text-center text-sm text-gray-500">No data.</div>
      ) : (
        <div className="space-y-5">
          {/* Summary cards */}
          <div className="grid grid-cols-2 md:grid-cols-5 gap-3">
            <Stat label="Won" value={s.wonCount} color="bg-green-50 text-green-700" />
            <Stat label="Lost" value={s.lostCount} color="bg-red-50 text-red-700" />
            <Stat label="Win Rate" value={`${s.winRate}%`} color="bg-blue-50 text-blue-700" />
            <Stat label="Won Value" value={`$${(s.wonValue || 0).toLocaleString()}`} color="bg-emerald-50 text-emerald-700" />
            <Stat label="Lost Value" value={`$${(s.lostValue || 0).toLocaleString()}`} color="bg-rose-50 text-rose-700" />
          </div>

          {/* Win/Loss bar */}
          <div className="rounded-lg border bg-white p-4">
            <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Won vs Lost</h4>
            <div className="space-y-2">
              <BarRow label="Won" value={s.wonCount} total={s.total} color="bg-green-500" />
              <BarRow label="Lost" value={s.lostCount} total={s.total} color="bg-red-500" />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            {/* By competitor */}
            <div className="rounded-lg border bg-white p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Losses by Competitor</h4>
              {data.byCompetitor.length === 0 ? (
                <p className="text-sm text-gray-500">No data.</p>
              ) : (
                <div className="space-y-2">
                  {data.byCompetitor.map((c: any) => (
                    <div key={c.competitorId}>
                      <div className="flex justify-between text-xs mb-0.5"><span>{c.competitorName}</span><span className="text-gray-500">{c.lostCount}</span></div>
                      <div className="h-2 bg-gray-100 rounded"><div className="h-2 bg-amber-500 rounded" style={{ width: `${(c.lostCount / maxCompetitor) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* By loss reason */}
            <div className="rounded-lg border bg-white p-4">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-gray-500 mb-3">Losses by Reason</h4>
              {data.byLossReason.length === 0 ? (
                <p className="text-sm text-gray-500">No data.</p>
              ) : (
                <div className="space-y-2">
                  {data.byLossReason.map((r: any) => (
                    <div key={r.lossReasonId}>
                      <div className="flex justify-between text-xs mb-0.5"><span>{r.lossReasonName}</span><span className="text-gray-500">{r.lostCount}</span></div>
                      <div className="h-2 bg-gray-100 rounded"><div className="h-2 bg-purple-500 rounded" style={{ width: `${(r.lostCount / maxReason) * 100}%` }} /></div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </PageContainer>
  );
}

function Stat({ label, value, color }: { label: string; value: React.ReactNode; color: string }) {
  return (
    <div className={`rounded-lg p-4 ${color}`}>
      <div className="text-xs font-medium opacity-80">{label}</div>
      <div className="text-xl font-bold mt-1">{value}</div>
    </div>
  );
}

function BarRow({ label, value, total, color }: { label: string; value: number; total: number; color: string }) {
  const pct = total > 0 ? (value / total) * 100 : 0;
  return (
    <div>
      <div className="flex justify-between text-xs mb-0.5"><span>{label}</span><span className="text-gray-500">{value} ({Math.round(pct)}%)</span></div>
      <div className="h-3 bg-gray-100 rounded"><div className={`h-3 ${color} rounded`} style={{ width: `${pct}%` }} /></div>
    </div>
  );
}
