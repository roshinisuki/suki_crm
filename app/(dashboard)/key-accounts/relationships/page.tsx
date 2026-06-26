"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useToast } from "@/components/ToastProvider";
import { useCurrency } from "@/components/CurrencyProvider";
import PageContainer from "@/components/PageContainer";
import { CRMSpinner } from "@/components/CRMSpinner";

const statusColors: Record<string, string> = {
  Active: "bg-green-50 text-green-700",
  "At Risk": "bg-red-50 text-red-700",
  Growing: "bg-blue-50 text-blue-700",
  Dormant: "bg-gray-100 text-gray-600",
};

const contactTypeColors: Record<string, string> = {
  Technical: "bg-purple-50 text-purple-700",
  Purchase: "bg-blue-50 text-blue-700",
  Finance: "bg-green-50 text-green-700",
  Management: "bg-orange-50 text-orange-700",
};

export default function KeyAccountRelationshipsPage() {
  const toast = useToast();
  const { formatCurrency } = useCurrency();
  const [keyAccounts, setKeyAccounts] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/key-accounts");
      const data = await res.json();
      if (data.success) {
        // Fetch detail for each to get contacts
        const detailPromises = data.data.map((ka: any) => fetch(`/api/key-accounts/${ka.id}`).then(r => r.json()));
        const details = await Promise.all(detailPromises);
        const enriched = details
          .filter(d => d.success)
          .map(d => d.data);
        setKeyAccounts(enriched);
      }
    } catch {
      toast.error("Failed to load relationships");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  return (
    <PageContainer className="space-y-4 p-0">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-slate-800">Relationship Mapping</h1>
          <p className="text-sm text-slate-500 mt-0.5">Key account contacts by role and relationship status</p>
        </div>
        <Link href="/key-accounts" className="text-sm text-blue-600 hover:underline">← Back to key accounts</Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <CRMSpinner size={36} label="Loading..." />
        </div>
      ) : keyAccounts.length === 0 ? (
        <div className="py-12 text-center text-sm text-gray-500">No key accounts found.</div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {keyAccounts.map((ka) => {
            const contacts = ka.customer?.contacts ?? [];
            const byType: Record<string, any[]> = {};
            contacts.forEach((c: any) => {
              const type = c.contactType || "Technical";
              if (!byType[type]) byType[type] = [];
              byType[type].push(c);
            });
            return (
              <div key={ka.id} className="rounded-lg border bg-white p-5">
                <div className="mb-3">
                  <Link href={`/key-accounts/${ka.id}`} className="text-lg font-semibold text-slate-800 hover:underline">{ka.customer?.name}</Link>
                  <p className="text-sm text-gray-500 mt-0.5">Manager: {ka.accountManager?.name || "—"}</p>
                </div>
                <div className="flex items-center gap-2 mb-3">
                  {ka.relationshipStatus && (
                    <span className={`px-2 py-0.5 rounded-full text-xs ${statusColors[ka.relationshipStatus] || ""}`}>{ka.relationshipStatus}</span>
                  )}
                  <span className="text-sm text-gray-600">{formatCurrency(ka.revenuePotential ?? 0)}</span>
                </div>
                <div className="space-y-2">
                  {["Technical", "Purchase", "Finance", "Management"].map(type => (
                    byType[type]?.length ? (
                      <div key={type} className="text-sm">
                        <span className={`inline-block px-2 py-0.5 rounded-full text-xs mb-1 ${contactTypeColors[type] || ""}`}>{type}</span>
                        <div className="ml-2 text-gray-600">
                          {byType[type].map((c: any) => (
                            <div key={c.id} className="py-0.5">
                              {c.name}{c.designation ? <span className="text-gray-400"> — {c.designation}</span> : null}
                              {c.isPrimary && <span className="ml-1 text-xs text-blue-600">★ Primary</span>}
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : null
                  ))}
                  {contacts.length === 0 && <p className="text-sm text-gray-400">No contacts mapped.</p>}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageContainer>
  );
}
