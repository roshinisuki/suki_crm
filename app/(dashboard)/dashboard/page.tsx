"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/components/AuthProvider";
import { getDashboardDataAction } from "@/app/actions/visits";

// Modals
import InboundCheckInModal from "@/components/InboundCheckInModal";
import OutboundCheckInModal from "@/components/OutboundCheckInModal";
import CheckOutModal from "@/components/CheckOutModal";

const icons = {
  trending: <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /></svg>,
  users: <svg className="w-5 h-5 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" /></svg>,
  building: <svg className="w-5 h-5 text-[#8B5CF6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" /></svg>,
  tag: <svg className="w-5 h-5 text-[#3B82F6]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M7 7h.01M6 20h12a2 2 0 002-2V8a2 2 0 00-2-2H6a2 2 0 00-2 2v10a2 2 0 002 2z" /></svg>,
  lightning: <svg className="w-5 h-5 text-[#EC4899]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>,
};

function Skeleton({ className }: { className?: string }) {
  return <div className={`animate-pulse bg-slate-200 rounded-lg ${className ?? ""}`} />;
}

export default function DashboardPage() {
  const { user } = useAuth();
  const [loading, setLoading] = useState(true);
  const [dashboardData, setDashboardData] = useState<any>(null);

  // Modal Open States
  const [isInboundOpen, setIsInboundOpen] = useState(false);
  const [isOutboundOpen, setIsOutboundOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeCheckoutVisit, setActiveCheckoutVisit] = useState<any>(null);

  // Active Tab for Left Console Table
  const [activeConsoleTab, setActiveConsoleTab] = useState<"inbound" | "outbound" | "pending">("inbound");

  // Stacked chart toggle
  const [chartToggle, setChartToggle] = useState<"monthly" | "weekly">("monthly");

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
    loadData();
  }, []);

  const handleOpenCheckout = (visitItem: any, type: "Inbound" | "Outbound") => {
    setActiveCheckoutVisit({
      id: visitItem.id,
      customerId: visitItem.customerId,
      customerName: visitItem.customer?.name || "Unknown",
      customerCode: visitItem.customer?.customerCode || "—",
      visitType: type,
      purpose: visitItem.purpose || "Meeting",
      checkInTime: visitItem.checkInTime || visitItem.checkIn,
    });
    setIsCheckoutOpen(true);
  };

  // Dynamic Metrics computed
  const inProgressInbound = dashboardData?.inboundVisits?.filter((v: any) => v.status === "CHECKED_IN") || [];
  const inProgressOutbound = dashboardData?.outboundVisits?.filter((v: any) => v.status === "CHECKED_IN") || [];
  const totalLiveVisitors = inProgressInbound.length + inProgressOutbound.length;

  const activeSubsVal = dashboardData?.stats?.activeSubs || 0;
  const pendingPlansVal = dashboardData?.stats?.pendingPlans || 0;
  const expiredPlansVal = dashboardData?.stats?.expiredPlans || 0;
  const totalPlansVal = activeSubsVal + pendingPlansVal + expiredPlansVal || 0;

  const r = 50;
  const c = 2 * Math.PI * r;

  const activePercent = totalPlansVal > 0 ? activeSubsVal / totalPlansVal : 0;
  const pendingPercent = totalPlansVal > 0 ? pendingPlansVal / totalPlansVal : 0;
  const expiredPercent = totalPlansVal > 0 ? expiredPlansVal / totalPlansVal : 0;

  const activeStroke = c * activePercent;
  const pendingStroke = c * pendingPercent;
  const expiredStroke = c * expiredPercent;

  const activeOffset = 0;
  const pendingOffset = -activeStroke;
  const expiredOffset = -(activeStroke + pendingStroke);

  return (
    <div className="space-y-6 max-w-[1400px] mx-auto">
      
      {/* ── 1. Top Performance Banner (Marketing Engagement Overview) ── */}
      <div className="relative bg-gradient-to-br from-[#0B1528] to-[#122442] rounded-3xl p-6 lg:p-8 border border-[#1e3458] shadow-2xl overflow-hidden flex flex-col md:flex-row md:items-center justify-between gap-6">
        
        {/* Glow Highlights */}
        <div className="absolute top-0 right-0 w-80 h-80 bg-blue-500/10 rounded-full blur-3xl -z-10" />
        <div className="absolute bottom-0 left-10 w-60 h-60 bg-indigo-500/10 rounded-full blur-3xl -z-10" />

        {/* Text Area */}
        <div className="flex-1 space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/[0.08] border border-white/[0.05] text-[10px] font-bold text-slate-300 uppercase tracking-widest leading-none">
            {icons.trending}
            Performance Overview
          </div>
          <div className="space-y-2">
            <h1 className="text-2xl lg:text-3xl font-extrabold text-white tracking-tight leading-none">
              Marketing Engagement Overview
            </h1>
            <p className="text-xs lg:text-sm text-slate-400 max-w-xl font-medium leading-relaxed">
              Real-time breakdown of your global marketing reach and active engagement metrics for the current billing cycle.
            </p>
          </div>

          {/* Banner Horizontal KPIs */}
          <div className="pt-4 flex flex-wrap gap-x-8 gap-y-6 max-w-2xl border-t border-white/[0.08]">
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Engagement</p>
              {loading ? <Skeleton className="h-6 w-16 bg-white/10" /> : <p className="text-xl lg:text-2xl font-black text-[#5C8FFF]">{dashboardData?.stats?.activeEngagement}%</p>}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Visits Month</p>
              {loading ? <Skeleton className="h-6 w-16 bg-white/10" /> : <p className="text-xl lg:text-2xl font-black text-white">{dashboardData?.stats?.monthlyVisits?.toLocaleString("en-IN")}</p>}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Active Subs</p>
              {loading ? <Skeleton className="h-6 w-16 bg-white/10" /> : <p className="text-xl lg:text-2xl font-black text-white">{dashboardData?.stats?.activeSubs?.toLocaleString("en-IN")}</p>}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Accounts</p>
              {loading ? <Skeleton className="h-6 w-16 bg-white/10" /> : <p className="text-xl lg:text-2xl font-black text-white">{dashboardData?.stats?.totalCustomers?.toLocaleString("en-IN")}</p>}
            </div>
            <div className="space-y-1">
              <p className="text-[10px] font-extrabold text-slate-400 uppercase tracking-widest">Visits Today</p>
              {loading ? <Skeleton className="h-6 w-16 bg-white/10" /> : <p className="text-xl lg:text-2xl font-black text-white">{dashboardData?.stats?.visitsToday}</p>}
            </div>
          </div>
        </div>

        {/* Vertical Glowing Bar Chart & Action Buttons */}
        <div className="flex flex-col items-end gap-3.5 shrink-0 self-end md:self-center">
          {/* Vertical Glowing Bar Chart */}
          <div className="flex items-end justify-end gap-1.5 md:w-[220px] h-20 shrink-0">
            {[
              { h: "40%", glow: false },
              { h: "55%", glow: false },
              { h: "75%", glow: true }, // glowing bar
              { h: "50%", glow: false },
              { h: "82%", glow: false },
              { h: "45%", glow: false },
            ].map((bar, idx) => (
              <div key={idx} className="flex flex-col items-center gap-1.5 w-7 h-full justify-end">
                <div 
                  className={`w-full rounded-t-md transition-all duration-300 ${bar.glow ? "bg-gradient-to-t from-blue-600 to-indigo-500 shadow-[0_0_15px_rgba(79,70,229,0.6)]" : "bg-[#1E2E4A] hover:bg-[#283C5C]"}`} 
                  style={{ height: bar.h }} 
                />
              </div>
            ))}
          </div>

          {/* Action Buttons */}
          <div className="flex gap-2">
            <button
              onClick={() => setIsInboundOpen(true)}
              className="px-4 py-2 bg-white text-slate-900 hover:bg-slate-100 font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all shadow-sm flex items-center gap-1 shrink-0"
            >
              + Office Visit
            </button>
            <button
              onClick={() => setIsOutboundOpen(true)}
              className="px-4 py-2 bg-white/10 hover:bg-white/20 text-white font-extrabold text-[10px] uppercase tracking-wider rounded-xl transition-all border border-white/10 flex items-center gap-1 shrink-0"
            >
              + Log Field
            </button>
          </div>
        </div>
      </div>



      {/* ── 3. Main Multi-Column Workspace ── */}
      <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">

        {/* ── LEFT COLUMN (WIDE): Stacked Chart & Log Lists ── */}
        <div className="xl:col-span-2 space-y-6">

          {/* Marketing Visit Activity Line Chart Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-6 relative overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 z-10">
              <div>
                <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Marketing Visit Activity</h2>
                <p className="text-xs font-semibold text-slate-400 mt-0.5">Total visits logged over the last 6 months</p>
              </div>
              <select className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-lg text-xs font-bold text-slate-700 outline-none cursor-pointer hover:bg-slate-100 transition-colors">
                <option>Last 6 months</option>
                <option>30 days</option>
              </select>
            </div>

            <div className="flex w-full h-64 mt-2 gap-4">
              {(() => {
                const visitData = dashboardData?.stats?.monthlyVisitActivity || [];
                if (visitData.length === 0) {
                  return (
                    <div className="w-full h-full flex items-center justify-center text-slate-400 font-bold text-sm">
                      No visit activity data available
                    </div>
                  );
                }

                const maxVisit = Math.max(...visitData.map((d: any) => d.count), 5);
                const stepX = 800 / (visitData.length - 1 || 1);
                const points = visitData.map((d: any, i: number) => ({
                  x: i * stepX,
                  y: 175 - ((d.count / maxVisit) * 150)
                }));

                let path = `M ${points[0].x},${points[0].y}`;
                for (let i = 0; i < points.length - 1; i++) {
                  const p1 = points[i];
                  const p2 = points[i + 1];
                  const midX = (p1.x + p2.x) / 2;
                  path += ` C ${midX},${p1.y} ${midX},${p2.y} ${p2.x},${p2.y}`;
                }

                const fillPath = `${path} L 800,200 L 0,200 Z`;

                const lastPoint = points[points.length - 1];
                const lastMonthLabel = visitData[visitData.length - 1]?.month;
                const lastCount = visitData[visitData.length - 1]?.count;
                const tooltipTx = lastPoint.x > 700 ? -95 : lastPoint.x < 100 ? 5 : -45;

                return (
                  <>
                    {/* Y-Axis Labels */}
                    <div className="flex flex-col justify-between items-end text-[10px] font-bold text-slate-400 h-[calc(100%-24px)] pb-2 shrink-0 w-8">
                      <span>{maxVisit}</span>
                      <span>{Math.round((maxVisit * 3) / 4)}</span>
                      <span>{Math.round(maxVisit / 2)}</span>
                      <span>{Math.round(maxVisit / 4)}</span>
                      <span>0</span>
                    </div>
                    
                    {/* Chart Area */}
                    <div className="relative w-full h-full flex flex-col">
                      <div className="relative w-full flex-1">
                        <svg viewBox="0 0 800 200" className="w-full h-full overflow-visible" preserveAspectRatio="none">
                          <defs>
                            <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="0%" stopColor="#818CF8" stopOpacity="0.5" />
                              <stop offset="100%" stopColor="#818CF8" stopOpacity="0.05" />
                            </linearGradient>
                          </defs>
                          
                          {/* Horizontal Grid Lines */}
                          {[0, 50, 100, 150, 200].map(y => (
                            <line key={y} x1="0" y1={y} x2="800" y2={y} stroke="#F1F5F9" strokeWidth="1" strokeDasharray="4 4" />
                          ))}

                          {/* Dynamic smooth path */}
                          <path d={fillPath} fill="url(#salesGrad)" />
                          <path d={path} fill="none" stroke="#6366F1" strokeWidth="4" strokeLinecap="round" className="drop-shadow-sm" />

                          {/* Tooltip on last element */}
                          <g transform={`translate(${lastPoint.x}, ${lastPoint.y})`}>
                            <circle cx="0" cy="0" r="5" fill="#fff" stroke="#6366F1" strokeWidth="3" className="drop-shadow-md" />
                            <line x1="0" y1="5" x2="0" y2={200 - lastPoint.y} stroke="#6366F1" strokeWidth="1" strokeDasharray="4 4" />
                            <g transform={`translate(${tooltipTx}, -55)`}>
                              <rect x="0" y="0" width="90" height="40" rx="8" fill="#0D2137" className="drop-shadow-lg" />
                              <text x="45" y="17" fill="#94A3B8" fontSize="10" fontWeight="600" textAnchor="middle">{lastMonthLabel}</text>
                              <text x="45" y="32" fill="#fff" fontSize="11" fontWeight="800" textAnchor="middle">{lastCount} visits</text>
                            </g>
                          </g>

                          {/* Data points */}
                          {points.map((p: any, i: number) => (
                            <circle key={i} cx={p.x} cy={p.y} r="4" fill="#fff" stroke="#6366F1" strokeWidth="2.5" className="hover:r-6 cursor-pointer transition-all" />
                          ))}
                        </svg>
                      </div>
                      
                      {/* X-Axis Labels */}
                      <div className="flex justify-between items-center text-[10px] font-bold text-slate-400 mt-2 px-1">
                        {visitData.map((d: any, i: number) => (
                          <span key={i}>{d.month}</span>
                        ))}
                      </div>
                    </div>
                  </>
                );
              })()}
            </div>
          </div>

          {/* Today's Visits & Approvals Dynamic Console */}
          <div className="bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 pt-5 pb-0 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Visit & Approvals Center</h2>
                <p className="text-xs text-slate-400 font-semibold mt-0.5">Real-time check-ins and customer queues</p>
              </div>
              
              {/* Table Tabs */}
              <div className="flex gap-1.5 p-1 bg-slate-100 rounded-2xl shrink-0">
                <button
                  onClick={() => setActiveConsoleTab("inbound")}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${activeConsoleTab === "inbound" ? "bg-white text-slate-800 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Inbound (Walk-ins)
                </button>
                <button
                  onClick={() => setActiveConsoleTab("outbound")}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${activeConsoleTab === "outbound" ? "bg-white text-slate-800 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Outbound (Field)
                </button>
                <button
                  onClick={() => setActiveConsoleTab("pending")}
                  className={`px-4 py-1.5 rounded-xl text-[10px] font-bold transition-all ${activeConsoleTab === "pending" ? "bg-white text-slate-800 shadow-xs" : "text-slate-400 hover:text-slate-600"}`}
                >
                  Pending Approvals
                </button>
              </div>
            </div>

            {/* List Contents */}
            <div className="overflow-x-auto mt-4">
              {activeConsoleTab === "inbound" && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Visit Started</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-6 text-slate-400">Loading walk-ins...</td></tr>
                    ) : !dashboardData?.inboundVisits?.length ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-400">No inbound walk-in visitors today</td></tr>
                    ) : dashboardData.inboundVisits.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{v.customer?.name}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-semibold">{v.purpose}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[9px] ${v.status === "CHECKED_IN" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {v.status === "CHECKED_IN" ? "Active" : "Completed"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-600">
                          {new Date(v.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {v.status === "CHECKED_IN" ? (
                            <button
                              onClick={() => handleOpenCheckout(v, "Inbound")}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[10px]"
                            >
                              End Visit
                            </button>
                          ) : (
                            <span className="text-slate-400 font-bold">Visit ended</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeConsoleTab === "outbound" && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-4 py-3">Purpose</th>
                      <th className="px-4 py-3">Status</th>
                      <th className="px-4 py-3">Checked In</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-6 text-slate-400">Loading field visits...</td></tr>
                    ) : !dashboardData?.outboundVisits?.length ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-400">No field visits logged today</td></tr>
                    ) : dashboardData.outboundVisits.map((v: any) => (
                      <tr key={v.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{v.customer?.name}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-semibold">{v.purpose || "Field Visit"}</td>
                        <td className="px-4 py-3.5">
                          <span className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[9px] ${v.status === "CHECKED_IN" ? "bg-indigo-100 text-indigo-800" : "bg-emerald-100 text-emerald-800"}`}>
                            {v.status === "CHECKED_IN" ? "Onsite" : "Completed"}
                          </span>
                        </td>
                        <td className="px-4 py-3.5 font-semibold text-slate-600">
                          {new Date(v.checkIn).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="px-6 py-3.5 text-right">
                          {v.status === "CHECKED_IN" ? (
                            <button
                              onClick={() => handleOpenCheckout(v, "Outbound")}
                              className="px-3 py-1.5 bg-slate-800 hover:bg-slate-900 text-white rounded-lg font-bold text-[10px]"
                            >
                              Check-Out
                            </button>
                          ) : (
                            <span className="text-slate-400 font-bold">Checked out</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}

              {activeConsoleTab === "pending" && (
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                      <th className="px-6 py-3">Customer</th>
                      <th className="px-4 py-3">Code</th>
                      <th className="px-4 py-3">Email</th>
                      <th className="px-4 py-3">City</th>
                      <th className="px-6 py-3 text-right">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-50 text-xs">
                    {loading ? (
                      <tr><td colSpan={5} className="text-center py-6 text-slate-400">Loading queue...</td></tr>
                    ) : !dashboardData?.pendingApprovals?.length ? (
                      <tr><td colSpan={5} className="text-center py-8 text-slate-400">No customers waiting for approval decision</td></tr>
                    ) : dashboardData.pendingApprovals.map((c: any) => (
                      <tr key={c.id} className="hover:bg-slate-50/40 transition-colors">
                        <td className="px-6 py-3.5 font-bold text-slate-800">{c.name}</td>
                        <td className="px-4 py-3.5 font-semibold text-slate-600">{c.customerCode}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-medium">{c.email || "—"}</td>
                        <td className="px-4 py-3.5 text-slate-500 font-semibold">{c.city || "—"}</td>
                        <td className="px-6 py-3.5 text-right">
                          <a href="/decision-summary" className="px-3.5 py-1.5 bg-[#0D2137] text-white hover:bg-slate-800 rounded-xl font-bold text-[10px]">
                            Review Queue
                          </a>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </div>

        {/* ── RIGHT COLUMN (SIDEBAR): KPI Cards, Overdues, Snapshot ── */}
        <div className="space-y-6">

          {/* Top Selling Products / Subscription Pie Chart Section */}
          <div className="bg-white rounded-3xl p-6 border border-slate-200/60 shadow-sm flex flex-col gap-6">
            <h2 className="text-xl font-extrabold text-slate-800 tracking-tight">Subscriptions</h2>

            <div className="flex flex-col items-center justify-center pt-4 pb-2 w-full">
              {/* Donut Chart with External Percentages */}
              <div className="relative w-48 h-48 flex items-center justify-center">
                {(() => {
                  const total = (activeSubsVal || 0) + (pendingPlansVal || 0) + (expiredPlansVal || 0);
                  if (total === 0) return <div className="text-slate-400 font-bold text-sm">No data</div>;

                  const pActive = activeSubsVal / total;
                  const pPending = pendingPlansVal / total;
                  const pExpired = expiredPlansVal / total;

                  const c = 2 * Math.PI * 50;
                  const activeStroke = pActive * c;
                  const pendingStroke = pPending * c;
                  const expiredStroke = pExpired * c;

                  const activeOffset = 0;
                  const pendingOffset = -activeStroke;
                  const expiredOffset = pendingOffset - pendingStroke;

                  return (
                    <>
                      <svg width="200" height="200" className="transform -rotate-90 overflow-visible">
                        {activeSubsVal > 0 && (
                          <circle cx="100" cy="100" r="50" fill="transparent" stroke="#A855F7" strokeWidth="16" strokeDasharray={`${activeStroke} ${c}`} strokeDashoffset={activeOffset} strokeLinecap="butt" />
                        )}
                        {pendingPlansVal > 0 && (
                          <circle cx="100" cy="100" r="50" fill="transparent" stroke="#FBBF24" strokeWidth="16" strokeDasharray={`${pendingStroke} ${c}`} strokeDashoffset={pendingOffset} strokeLinecap="butt" />
                        )}
                        {expiredPlansVal > 0 && (
                          <circle cx="100" cy="100" r="50" fill="transparent" stroke="#38BDF8" strokeWidth="16" strokeDasharray={`${expiredStroke} ${c}`} strokeDashoffset={expiredOffset} strokeLinecap="butt" />
                        )}
                      </svg>
                      
                      {/* Floating Percentages (Mock positions for visual fidelity to image) */}
                      {pActive > 0 && (
                        <span className="absolute top-2 right-4 text-[10px] font-bold text-slate-500">{(pActive * 100).toFixed(1)}%</span>
                      )}
                      {pPending > 0 && (
                        <span className="absolute bottom-6 right-2 text-[10px] font-bold text-slate-500">{(pPending * 100).toFixed(1)}%</span>
                      )}
                      {pExpired > 0 && (
                        <span className="absolute bottom-10 left-0 text-[10px] font-bold text-slate-500">{(pExpired * 100).toFixed(1)}%</span>
                      )}
                    </>
                  );
                })()}
              </div>

              {/* 2-Column Grid Legend */}
              <div className="grid grid-cols-2 gap-x-8 gap-y-3 w-full mt-8 px-4">
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#A855F7]" />
                  <span className="text-[10px] font-bold text-slate-500 lowercase">active subs</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#FBBF24]" />
                  <span className="text-[10px] font-bold text-slate-500 lowercase">pending</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#38BDF8]" />
                  <span className="text-[10px] font-bold text-slate-500 lowercase">expired</span>
                </div>
                <div className="flex items-center gap-2">
                  <span className="w-1.5 h-1.5 rounded-full bg-[#4ADE80]" />
                  <span className="text-[10px] font-bold text-slate-500 lowercase">others</span>
                </div>
              </div>
            </div>
          </div>

          {/* Overdue Follow-ups */}
          <div className="bg-white rounded-3xl p-5 border border-slate-200/60 shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-sm font-bold text-slate-800">Overdue Follow-ups</h2>
                <p className="text-[10px] text-slate-400 font-bold mt-0.5 uppercase tracking-wide">Next meeting dates missed</p>
              </div>
              <span className="text-[9px] font-extrabold text-red-600 bg-red-50 px-2 py-0.5 rounded-md uppercase tracking-wider">
                High Priority
              </span>
            </div>

            <div className="space-y-3">
              {loading ? (
                Array.from({ length: 3 }).map((_, i) => <Skeleton key={i} className="h-14 w-full" />)
              ) : !dashboardData?.overdueFollowUps?.length ? (
                <p className="text-xs text-slate-400 text-center py-4">Great! No overdue follow-ups</p>
              ) : (
                dashboardData.overdueFollowUps.slice(0, 3).map((f: any) => (
                  <div key={f.id} className="p-3 bg-slate-50/70 border-l-4 border-red-500 rounded-r-xl flex items-start justify-between">
                    <div>
                      <p className="text-xs font-bold text-slate-800">{f.remarks || "No Agenda notes added"}</p>
                      <p className="text-[10px] text-slate-400 font-semibold mt-0.5">
                        Client: <strong className="text-slate-600">{f.customer?.name}</strong> (Overdue)
                      </p>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Launch CRM Dialer Action Button */}
            <a href="/follow-up" className="w-full py-2.5 rounded-xl border border-blue-500/30 text-[#1a6bff] hover:bg-blue-50 font-extrabold text-[10px] uppercase tracking-wider text-center block transition-all shadow-xs">
              Launch CRM Dialer
            </a>
          </div>



        </div>
      </div>

      {/* ── Check-In & Check-Out Modal Instances ── */}
      <InboundCheckInModal
        isOpen={isInboundOpen}
        onClose={() => setIsInboundOpen(false)}
        onSuccess={loadData}
        loggedInUser={user ? { name: user.name, id: user.id } : null}
      />

      <OutboundCheckInModal
        isOpen={isOutboundOpen}
        onClose={() => setIsOutboundOpen(false)}
        onSuccess={loadData}
        loggedInUser={user ? { name: user.name, id: user.id } : null}
      />

      <CheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => {
          setIsCheckoutOpen(false);
          setActiveCheckoutVisit(null);
        }}
        onSuccess={loadData}
        visit={activeCheckoutVisit}
      />

    </div>
  );
}
