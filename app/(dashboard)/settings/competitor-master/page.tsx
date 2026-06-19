"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";

export default function CompetitorMasterPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/competitors"); }, [router]);
  return (
    <PageContainer className="space-y-4 p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Competitor Master</h1>
        <p className="text-sm text-slate-500 mt-0.5">Redirecting...</p>
      </div>
      <div className="py-12 text-center text-sm text-gray-500">Redirecting to Competitors...</div>
    </PageContainer>
  );
}
