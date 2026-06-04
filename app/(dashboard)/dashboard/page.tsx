"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDashboardDataAction } from "@/app/actions/visits";

import AdminDashboard from "@/components/dashboards/AdminDashboard";
import ExecutiveDashboard from "@/components/dashboards/ExecutiveDashboard";
import LeadDashboard from "@/components/dashboards/LeadDashboard";

export default function DashboardRouter() {
  const { user, loading: authLoading } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  const loadData = async () => {
    setLoading(true);
    try {
      const res = await getDashboardDataAction();
      if (res.success && res.data) {
        setDashboardData(res.data);
      }
    } catch (err) {
      console.error("Failed to load dashboard data", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && user.role !== "Admin") {
      loadData();
    } else if (!authLoading && user && user.role === "Admin") {
      setLoading(false); // AdminDashboard fetches its own data
    }
  }, [authLoading, user]);

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <div className="flex flex-col items-center gap-3">
          <span className="w-8 h-8 rounded-full border-4 border-blue-500 border-t-transparent animate-spin" />
          <p className="text-sm font-bold text-slate-500">Loading your workspace...</p>
        </div>
      </div>
    );
  }

  if (user?.role === "MarketingExecutive") {
    return <ExecutiveDashboard data={dashboardData} user={user} loadData={loadData} />;
  }

  if (user?.role === "MarketingLead") {
    return <LeadDashboard data={dashboardData} user={user} loadData={loadData} />;
  }

  // Fallback to Admin Dashboard for Admin or unrecognized roles
  return <AdminDashboard />;
}
