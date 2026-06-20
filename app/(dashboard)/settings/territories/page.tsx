"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import PageContainer from "@/components/PageContainer";

export default function TerritoriesSettingsPage() {
  const router = useRouter();
  useEffect(() => { router.replace("/territories"); }, [router]);
  return (
    <PageContainer className="space-y-4 p-0">
      <div>
        <h1 className="text-2xl font-bold text-slate-800">Territories</h1>
        <p className="text-sm text-slate-500 mt-0.5">Redirecting...</p>
      </div>
      <div className="py-12 text-center text-sm text-gray-500">Redirecting to Territories...</div>
    </PageContainer>
  );
}
