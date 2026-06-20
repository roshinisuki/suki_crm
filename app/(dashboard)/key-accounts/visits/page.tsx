"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import PageContainer from "@/components/PageContainer";

export default function KeyAccountVisitsPage() {
  const toast = useToast();
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/key-accounts/visits");
      const data = await res.json();
      if (data.success) setData(data.data);
    } catch {
      toast.error("Failed to load visit schedule");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const today = new Date();

  return (
    <PageContainer className="space-y-4 p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Upcoming Visit Schedule</h1>
          <p className="text-sm text-slate-500 mt-0.5">Key accounts with upcoming reviews and visits</p>
        </div>
        <Link href="/key-accounts" className="text-sm text-blue-600 hover:underline">← Back to key accounts</Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : data.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">No upcoming visits or reviews found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer</th>
                <th className="px-4 py-3 font-semibold">Account Manager</th>
                <th className="px-4 py-3 font-semibold">Next Review Date</th>
                <th className="px-4 py-3 font-semibold">Last Visit Date</th>
                <th className="px-4 py-3 font-semibold">Last Outcome</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {data.map((v) => (
                <tr key={v.id} className={`hover:bg-gray-50 ${v.isOverdue ? "bg-red-50/30" : ""}`}>
                  <td className="px-4 py-3">
                    <Link href={`/key-accounts/${v.id}`} className="font-medium text-blue-600 hover:underline">{v.customerName}</Link>
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.accountManager}</td>
                  <td className="px-4 py-3">
                    {v.nextReviewDate ? (
                      <span className={v.isOverdue ? "text-red-600 font-medium" : "text-gray-600"}>
                        {new Date(v.nextReviewDate).toLocaleDateString()}
                        {v.isOverdue && <span className="ml-1 text-xs">⚠ Overdue</span>}
                      </span>
                    ) : "—"}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{v.lastVisitDate ? new Date(v.lastVisitDate).toLocaleDateString() : "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{v.lastOutcome}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
