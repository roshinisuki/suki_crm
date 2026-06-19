"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useAuth } from "@/components/AuthProvider";
import { useToast } from "@/components/ToastProvider";
import PageContainer from "@/components/PageContainer";

const Ico = ({ d, size = 16, className }: { d: string; size?: number; className?: string }) => (
  <svg width={size} height={size} fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round" className={className}>
    <path d={d} />
  </svg>
);

const icons = {
  search: "M21 21l-4.35-4.35 M11 19a8 8 0 100-16 8 8 0 000 16z",
};

export default function AllCompetitorProductsPage() {
  const { user } = useAuth();
  const toast = useToast();
  const [competitors, setCompetitors] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [q, setQ] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/competitors");
      const data = await res.json();
      if (data.success) setCompetitors(data.data);
    } catch {
      toast.error("Failed to load");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // Flatten products across competitors and filter
  const allProducts = competitors.flatMap((c) =>
    (c.products ?? []).map((p: any) => ({ ...p, competitorName: c.name, competitorId: c.id }))
  );
  // Note: list endpoint doesn't include products; fetch detail per competitor lazily is overkill.
  // Instead, fetch all competitors with products via the list endpoint which already includes _count only.
  // For a true all-products view we re-fetch each competitor's products.
  const [products, setProducts] = useState<any[]>([]);

  useEffect(() => {
    if (!competitors.length) { setProducts([]); return; }
    let cancelled = false;
    (async () => {
      const results = await Promise.all(
        competitors.map(async (c) => {
          const res = await fetch(`/api/competitors/${c.id}`);
          const data = await res.json();
          return data.success ? (data.data.products ?? []).map((p: any) => ({ ...p, competitorName: c.name, competitorId: c.id })) : [];
        })
      );
      if (!cancelled) setProducts(results.flat());
    })();
    return () => { cancelled = true; };
  }, [competitors]);

  const filtered = q
    ? products.filter((p) => p.name.toLowerCase().includes(q.toLowerCase()) || p.competitorName.toLowerCase().includes(q.toLowerCase()))
    : products;

  return (
    <PageContainer className="space-y-4 p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Competitor Products</h1>
        <p className="text-sm text-slate-500 mt-0.5">All products across competitors</p>
      </div>
      <div className="flex flex-wrap items-center gap-3 mb-5">
        <div className="relative flex-1 min-w-[220px] max-w-md">
          <Ico d={icons.search} size={16} className="absolute left-3 top-2.5 text-gray-400" />
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            placeholder="Search by product or competitor..."
            className="w-full pl-9 pr-3 py-2 text-sm border rounded-lg outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>
        <Link href="/competitors" className="text-sm text-blue-600 hover:underline">Manage competitors →</Link>
      </div>

      {loading ? (
        <div className="py-12 text-center text-sm text-gray-500">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">No competitor products found.</div>
      ) : (
        <div className="overflow-x-auto rounded-lg border">
          <table className="min-w-full text-sm">
            <thead className="bg-gray-50 text-left text-xs uppercase tracking-wider text-gray-500">
              <tr>
                <th className="px-4 py-3 font-semibold">Product</th>
                <th className="px-4 py-3 font-semibold">Competitor</th>
                <th className="px-4 py-3 font-semibold">Price Range</th>
                <th className="px-4 py-3 font-semibold">Our Advantage</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {filtered.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium">{p.name}<div className="text-xs text-gray-500 mt-0.5 line-clamp-1">{p.description}</div></td>
                  <td className="px-4 py-3"><Link href={`/competitors/${p.competitorId}`} className="text-blue-600 hover:underline">{p.competitorName}</Link></td>
                  <td className="px-4 py-3 text-gray-600">{p.priceRange || "—"}</td>
                  <td className="px-4 py-3 text-gray-600 max-w-xs"><div className="line-clamp-2">{p.ourAdvantage || "—"}</div></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </PageContainer>
  );
}
