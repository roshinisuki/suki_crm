"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import PageContainer from "@/components/PageContainer";

export default function TerritoryAccountsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [territories, setTerritories] = useState<any[]>([]);
  const [accounts, setAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterTerritory, setFilterTerritory] = useState("");

  const loadTerritories = async () => {
    try {
      const res = await fetch("/api/territories?isActive=true");
      const data = await res.json();
      if (data.success) setTerritories(data.data);
    } catch { /* ignore */ }
  };

  const loadAccounts = async () => {
    setLoading(true);
    try {
      const promises = territories.map(t => fetch(`/api/territories/${t.id}/accounts`).then(r => r.json()));
      const results = await Promise.all(promises);
      const all: any[] = [];
      results.forEach((res, i) => {
        if (res.success) {
          res.data.forEach((a: any) => {
            const revenue = a.customer.deals?.reduce((s: number, d: any) => s + d.dealValue, 0) ?? 0;
            all.push({
              id: a.id,
              customerName: a.customer.name,
              customerCode: a.customer.customerCode,
              city: a.customer.city,
              assignedExec: a.customer.assignedUser?.name || "—",
              revenue,
              territoryId: territories[i].id,
              territoryName: territories[i].name,
            });
          });
        }
      });
      setAccounts(all);
    } catch {
      toast.error("Failed to load accounts");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { loadTerritories(); }, []);
  useEffect(() => { if (territories.length) loadAccounts(); }, [territories]);

  const filtered = filterTerritory ? accounts.filter(a => a.territoryId === filterTerritory) : accounts;

  return (
    <PageContainer className="space-y-4 p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Territory Accounts</h1>
        <p className="text-sm text-slate-500 mt-0.5">All customer accounts assigned to territories</p>
      </div>

      <div className="flex flex-wrap items-center gap-3 mb-5">
        <select value={filterTerritory} onChange={(e) => setFilterTerritory(e.target.value)} className="px-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500">
          <option value="">All Territories</option>
          {territories.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
        </select>
        <Link href="/territories" className="text-sm text-blue-600 hover:underline ml-auto">← Back to territories</Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">No territory accounts found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Customer Name</th>
                <th className="px-4 py-3 font-semibold">Territory</th>
                <th className="px-4 py-3 font-semibold">Assigned Sales Exec</th>
                <th className="px-4 py-3 font-semibold">City</th>
                <th className="px-4 py-3 font-semibold">Revenue</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((a) => (
                <tr key={a.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{a.customerName} <span className="text-gray-400 text-xs">({a.customerCode})</span></td>
                  <td className="px-4 py-3"><Link href={`/territories/${a.territoryId}`} className="text-blue-600 hover:underline">{a.territoryName}</Link></td>
                  <td className="px-4 py-3 text-gray-600">{a.assignedExec}</td>
                  <td className="px-4 py-3 text-gray-600">{a.city || "—"}</td>
                  <td className="px-4 py-3 text-gray-600">₹{a.revenue.toLocaleString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
