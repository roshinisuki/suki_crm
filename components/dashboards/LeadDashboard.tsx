"use client";

import { useState } from "react";
import { 
  MapPin, 
  Map, 
  PhoneCall, 
  Mail,
  ChevronRight,
  Navigation,
  Building,
  CheckCircle2,
  TrendingUp,
  Users,
  Target,
  AlertCircle
} from "lucide-react";

import InboundCheckInModal from "@/components/InboundCheckInModal";
import OutboundCheckInModal from "@/components/OutboundCheckInModal";
import CheckOutModal from "@/components/CheckOutModal";

export default function LeadDashboard({ data, user, loadData }: { data: any; user: any; loadData: () => void }) {
  // Modal States
  const [isInboundOpen, setIsInboundOpen] = useState(false);
  const [isOutboundOpen, setIsOutboundOpen] = useState(false);
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);
  const [activeCheckoutVisit, setActiveCheckoutVisit] = useState<any>(null);

  const handleOpenCheckout = (visitItem: any, type: "Inbound" | "Outbound") => {
    setActiveCheckoutVisit({
      id: visitItem.id,
      customerId: visitItem.customerId || visitItem.customer?.id,
      customerName: visitItem.customerName || visitItem.customer?.name || "Unknown",
      customerCode: visitItem.customerCode || visitItem.customer?.customerCode || "—",
      visitType: type,
      purpose: visitItem.purpose || "Meeting",
      checkInTime: visitItem.checkInTime || visitItem.checkIn,
    });
    setIsCheckoutOpen(true);
  };

  const todayVisits = [
    ...(data?.inboundVisits || []).map((v: any) => ({ ...v, type: "Inbound" as const })),
    ...(data?.outboundVisits || []).map((v: any) => ({ ...v, type: "Outbound" as const }))
  ].sort((a, b) => new Date(b.checkIn || b.checkInTime).getTime() - new Date(a.checkIn || a.checkInTime).getTime());

  const followUps = [...(data?.overdueFollowUps || []), ...(data?.upcomingFollowUps || [])];

  const pendingCount = data?.pendingApprovals?.length || 0;
  const followUpCount = followUps.length;

  // Block new check-in if user already has an active visit
  const activeVisit = todayVisits.find(v => v.status === "CHECKED_IN");
  const hasActiveVisit = !!activeVisit;

  return (
    <div className="max-w-[1200px] mx-auto pb-6">
      
      {/* ── DESKTOP HERO SECTION ── */}
      <div className="hidden md:block bg-[#0D2137] rounded-3xl p-8 mb-8 text-white shadow-xl relative overflow-hidden">
        <div className="absolute top-0 right-0 w-[400px] h-[400px] bg-blue-500/10 rounded-full blur-3xl -z-10 translate-x-1/2 -translate-y-1/2" />
        
        <div className="flex justify-between items-center z-10">
          <div className="max-w-xl">
            <h1 className="text-3xl font-bold mb-2">Lead Overview</h1>
            <p className="text-slate-300 text-sm">
              Welcome back, {user?.name}. Your team has <span className="text-white font-bold">{todayVisits.length} visits today</span> and <span className="text-white font-bold">{pendingCount} pending approvals</span>.
            </p>
          </div>
          
          <div className="flex gap-4">
            {hasActiveVisit ? (
              <div className="px-5 py-3 bg-amber-500/20 border border-amber-400/40 rounded-xl text-amber-300 text-xs font-bold flex items-center gap-2">
                <span className="w-2 h-2 bg-amber-400 rounded-full animate-pulse" />
                Active visit in progress — check out first
              </div>
            ) : (
              <>
                <button 
                  onClick={() => setIsInboundOpen(true)}
                  className="px-6 py-3 bg-white text-[#0D2137] rounded-xl font-bold text-sm hover:bg-slate-100 transition-colors shadow-sm flex items-center gap-2"
                >
                  <Building className="w-4 h-4" />
                  + Office Visit
                </button>
                <button 
                  onClick={() => setIsOutboundOpen(true)}
                  className="px-6 py-3 bg-[#0D2137] text-white border border-white/20 rounded-xl font-bold text-sm hover:bg-white/10 transition-colors shadow-sm flex items-center gap-2"
                >
                  <MapPin className="w-4 h-4" />
                  + Field Check-In
                </button>
              </>
            )}
          </div>
        </div>
      </div>

      {/* ── MOBILE QUICK ACTIONS ── */}
      {hasActiveVisit ? (
        <div className="md:hidden bg-amber-50 border-2 border-amber-300 rounded-2xl px-4 py-3.5 mb-4 flex items-center gap-3">
          <span className="w-2.5 h-2.5 bg-amber-500 rounded-full animate-pulse shrink-0" />
          <div className="flex-1 min-w-0">
            <p className="text-xs font-black text-amber-800">Active visit in progress</p>
            <p className="text-[10px] text-amber-700 font-medium mt-0.5 truncate">
              {activeVisit?.customer?.name || activeVisit?.customerName} — check out to start a new visit
            </p>
          </div>
        </div>
      ) : (
        <div className="md:hidden grid grid-cols-2 gap-4 mb-6">
          <button 
            onClick={() => setIsInboundOpen(true)}
            className="flex flex-col items-center justify-center bg-[#0D2137] text-white p-6 rounded-2xl shadow-sm active:scale-95 transition-transform"
          >
            <Building className="w-8 h-8 mb-3 opacity-90" />
            <span className="text-sm font-bold tracking-wide">+ Office Visit</span>
          </button>
          <button 
            onClick={() => setIsOutboundOpen(true)}
            className="flex flex-col items-center justify-center bg-[#475569] text-white p-6 rounded-2xl shadow-sm active:scale-95 transition-transform"
          >
            <MapPin className="w-8 h-8 mb-3 opacity-90" />
            <span className="text-sm font-bold tracking-wide">+ Log Field</span>
          </button>
        </div>
      )}

      {/* ── MOBILE ACTIVE VISITS (with Check-Out) ── */}
      {todayVisits.some(v => v.status === "CHECKED_IN") && (
        <div className="md:hidden mb-4">
          <p className="text-[10px] font-black text-amber-600 uppercase tracking-widest mb-2 px-1 flex items-center gap-1.5">
            <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse inline-block" />
            Active Visit — Check-Out Required
          </p>
          <div className="space-y-3">
            {todayVisits.filter(v => v.status === "CHECKED_IN").map(v => {
              const dateObj = new Date(v.checkIn || v.checkInTime);
              const timeStr = dateObj.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={v.id} className="bg-white rounded-2xl border-2 border-amber-400 shadow-sm overflow-hidden">
                  <div className="bg-amber-50 px-4 py-2 border-b border-amber-200 flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 bg-amber-500 rounded-full animate-pulse" />
                      <span className="text-[10px] font-black text-amber-700 uppercase tracking-widest">In Progress</span>
                    </div>
                    <span className={`px-2 py-0.5 rounded-md font-bold text-[9px] ${
                      v.type === "Inbound" ? "bg-amber-100 text-amber-800" : "bg-indigo-100 text-indigo-800"
                    }`}>{v.type}</span>
                  </div>
                  <div className="p-4 flex items-center gap-4">
                    <div className="bg-slate-100 rounded-xl px-3 py-2 text-center shrink-0">
                      <p className="text-sm font-black text-slate-700">{timeStr}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">Check-In</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 truncate">{v.customer?.name || v.customerName}</p>
                      <p className="text-xs text-slate-500 mt-0.5">{v.purpose || "Field Visit"}</p>
                      {(v.host?.name || v.executive?.name) && (
                        <p className="text-[10px] text-slate-400 mt-0.5">by {v.host?.name || v.executive?.name}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleOpenCheckout(v, v.type)}
                      className="shrink-0 flex items-center gap-1.5 px-4 py-3 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-xs rounded-xl transition-all shadow-sm uppercase tracking-wide"
                    >
                      <CheckCircle2 className="w-4 h-4" />
                      Check-Out
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ── PERFORMANCE SNAPSHOT CARDS ── */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-blue-50 text-blue-600 rounded-lg"><Target className="w-4 h-4" /></div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Active Engagements</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{data?.stats?.activeEngagement || 0}%</p>
        </div>
        <div className="bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-emerald-50 text-emerald-600 rounded-lg"><TrendingUp className="w-4 h-4" /></div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Team Visits (M)</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{data?.stats?.monthlyVisits?.toLocaleString("en-IN") || 0}</p>
        </div>
        <div className="hidden lg:flex bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-purple-50 text-purple-600 rounded-lg"><Users className="w-4 h-4" /></div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Total Accounts</p>
          </div>
          <p className="text-2xl font-black text-slate-800">{data?.stats?.totalCustomers?.toLocaleString("en-IN") || 0}</p>
        </div>
        <div className="hidden lg:flex bg-white p-5 rounded-2xl border border-slate-100 shadow-sm flex-col justify-center">
          <div className="flex items-center gap-2 mb-2">
            <div className="p-1.5 bg-amber-50 text-amber-600 rounded-lg"><CheckCircle2 className="w-4 h-4" /></div>
            <p className="text-[11px] font-bold text-slate-400 uppercase tracking-widest">Pending Approvals</p>
          </div>
          <p className="text-2xl font-black text-amber-600">{pendingCount}</p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── MAIN COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Recent Office Visits ─ MOBILE cards */}
          <div className="md:hidden space-y-3">
            <div className="flex items-center justify-between px-1">
              <h2 className="text-base font-bold text-slate-800">Recent Visits</h2>
              <a href="/marketing-log" className="text-xs font-bold text-blue-600">View All</a>
            </div>
            {!todayVisits?.length ? (
              <div className="bg-white rounded-2xl border border-slate-100 shadow-sm p-8 text-center text-slate-400 font-medium text-sm">
                No visits logged today.
              </div>
            ) : todayVisits.slice(0, 5).map((v: any) => {
              const isCheckedIn = v.status === "CHECKED_IN";
              const timeStr = new Date(v.checkIn || v.checkInTime).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" });
              return (
                <div key={v.id} className={`bg-white rounded-2xl border shadow-sm overflow-hidden ${
                  isCheckedIn ? "border-amber-300" : "border-slate-200/60"
                }`}>
                  <div className="p-4 flex items-center gap-3">
                    <div className="bg-slate-100 rounded-xl w-12 h-12 flex flex-col items-center justify-center shrink-0">
                      <p className="text-xs font-black text-slate-700">{timeStr.split(" ")[0]}</p>
                      <p className="text-[9px] font-bold text-slate-400 uppercase">{timeStr.split(" ")[1] || ""}</p>
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="font-bold text-slate-800 text-sm truncate">{v.customer?.name ?? v.customerName}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{v.purpose}</p>
                      <div className="flex gap-2 mt-1.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[9px] ${isCheckedIn ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {isCheckedIn ? "IN PROGRESS" : "COMPLETED"}
                        </span>
                        <span className="text-[10px] text-slate-400 font-medium">{v.host?.name || v.executive?.name || "You"}</span>
                      </div>
                    </div>
                    {isCheckedIn && (
                      <button
                        onClick={() => handleOpenCheckout(v, v.type)}
                        className="shrink-0 flex items-center gap-1.5 px-3 py-2.5 bg-amber-500 hover:bg-amber-600 active:scale-95 text-white font-black text-[11px] rounded-xl transition-all shadow-sm uppercase"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" />
                        Check-Out
                      </button>
                    )}
                  </div>
                </div>
              );
            })}
          </div>

          {/* Recent Office Visits ─ DESKTOP table */}
          <div className="hidden md:block bg-white rounded-3xl border border-slate-200/60 shadow-sm overflow-hidden flex flex-col">
            <div className="px-6 py-5 flex items-center justify-between border-b border-slate-100">
              <h2 className="text-base font-bold text-slate-800">Recent Office Visits</h2>
              <a href="/visitor-management" className="text-xs font-bold text-blue-600">View All</a>
            </div>
            
            <div className="overflow-x-auto">
              <table className="w-full text-left">
                <thead>
                  <tr className="bg-slate-50/50 text-[10px] font-bold text-slate-400 uppercase tracking-widest border-b border-slate-100">
                    <th className="px-6 py-3">Company / Contact</th>
                    <th className="px-4 py-3">Date</th>
                    <th className="px-4 py-3">Status</th>
                    <th className="px-6 py-3 text-right">Agent</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-50 text-xs">
                  {!todayVisits?.length ? (
                    <tr><td colSpan={4} className="text-center py-8 text-slate-400">No recent visits</td></tr>
                  ) : todayVisits.slice(0, 5).map((v: any) => (
                    <tr key={v.id} className="hover:bg-slate-50/40 transition-colors">
                      <td className="px-6 py-3.5 flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-slate-100 flex items-center justify-center text-[10px] font-bold text-slate-600 shrink-0">
                          {(v.customer?.name || "UN").substring(0, 2).toUpperCase()}
                        </div>
                        <div>
                          <p className="font-bold text-slate-800">{v.customer?.name ?? v.customerName}</p>
                          <p className="text-[10px] text-slate-500">{v.purpose}</p>
                        </div>
                      </td>
                      <td className="px-4 py-3.5 font-semibold text-slate-600">
                        {new Date(v.checkIn || v.checkInTime).toLocaleDateString("en-IN", { month: "short", day: "numeric", year: "numeric" })}
                      </td>
                      <td className="px-4 py-3.5">
                        <span className={`inline-flex px-2 py-0.5 rounded-md font-bold text-[9px] ${v.status === "CHECKED_IN" ? "bg-amber-100 text-amber-800" : "bg-emerald-100 text-emerald-800"}`}>
                          {v.status === "CHECKED_IN" ? "IN PROGRESS" : "COMPLETED"}
                        </span>
                      </td>
                      <td className="px-6 py-3.5 text-right font-medium text-slate-600">
                        {v.host?.name || v.executive?.name || "You"}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
          
          {/* Approvals (Lead Only) */}
          {pendingCount > 0 && (
            <div className="bg-amber-50 rounded-3xl border border-amber-200/60 p-6 flex items-center justify-between shadow-sm">
              <div>
                <h3 className="text-amber-800 font-bold flex items-center gap-2">
                  <AlertCircle className="w-5 h-5" />
                  Action Required
                </h3>
                <p className="text-amber-700/80 text-sm mt-1">You have {pendingCount} visit record{pendingCount > 1 ? 's' : ''} awaiting your approval.</p>
              </div>
              <a href="/dashboard" className="px-4 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl text-sm transition-colors shadow-sm">
                Review Approvals
              </a>
            </div>
          )}

        </div>

        {/* ── SIDE COLUMN ── */}
        <div className="space-y-6">
          
          {/* Visit Trend Chart */}
          <div className="bg-white p-6 rounded-3xl border border-slate-100 shadow-sm">
            <div className="flex items-center justify-between mb-6">
              <h3 className="font-bold text-slate-800">Visit Trend</h3>
              <span className="text-[10px] font-bold text-slate-400 bg-slate-50 px-2 py-1 rounded">This Month</span>
            </div>
            
            <div className="flex items-end justify-between h-32 gap-2 mb-4">
              {[
                { label: "W1", height: "40%", active: false },
                { label: "W2", height: "65%", active: false },
                { label: "W3", height: "100%", active: true },
                { label: "W4", height: "80%", active: false }
              ].map((bar, i) => (
                <div key={i} className="flex-1 flex flex-col justify-end items-center gap-2 h-full">
                  <div className={`w-full max-w-[24px] rounded-t-sm transition-all ${bar.active ? 'bg-[#0D2137]' : 'bg-slate-200'}`} style={{ height: bar.height }} />
                  <span className="text-[10px] font-bold text-slate-400">{bar.label}</span>
                </div>
              ))}
            </div>
            
            <div className="pt-4 border-t border-slate-100 flex items-center justify-between">
              <div>
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Total Visits</p>
                <p className="text-xl font-black text-slate-800">{data?.stats?.monthlyVisits}</p>
              </div>
              <div className="text-right">
                <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">Growth</p>
                <p className="text-sm font-black text-emerald-500">+12.4%</p>
              </div>
            </div>
          </div>
          
          {/* Pending Follow-ups */}
          <div>
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Pending Follow-ups</h2>
            <div className="bg-white rounded-2xl border border-slate-100 shadow-sm overflow-hidden">
              {followUps.length === 0 ? (
                <div className="p-6 text-center text-sm text-slate-400">All caught up!</div>
              ) : (
                <div className="divide-y divide-slate-100">
                  {followUps.slice(0, 4).map((f: any) => {
                    const isOverdue = f.nextMeetingDate ? new Date(f.nextMeetingDate) < new Date() : false;
                    return (
                      <div key={f.id} className="p-4 flex items-center gap-4 hover:bg-slate-50 transition-colors cursor-pointer group">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${isOverdue ? 'bg-red-100 text-red-600' : 'bg-blue-100 text-blue-600'}`}>
                          {f.followUpType === "Call" ? <PhoneCall className="w-4 h-4" /> : <Mail className="w-4 h-4" />}
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="text-sm font-bold text-slate-800 truncate">{f.followUpType} {f.customer?.name}</h4>
                          <p className="text-xs text-slate-500 truncate mt-0.5">{f.remarks || "No additional notes"}</p>
                          {isOverdue && <p className="text-[10px] text-red-500 font-bold mt-1 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> Overdue</p>}
                        </div>
                        <ChevronRight className="w-4 h-4 text-slate-300 group-hover:text-slate-600 transition-colors" />
                      </div>
                    );
                  })}
                </div>
              )}
              {followUps.length > 4 && (
                <a href="/follow-up" className="block text-center p-3 border-t border-slate-100 text-xs font-bold text-blue-600 hover:bg-slate-50">
                  See All Follow-ups
                </a>
              )}
            </div>
          </div>

        </div>
      </div>

      <InboundCheckInModal isOpen={isInboundOpen} onClose={() => setIsInboundOpen(false)} onSuccess={loadData} loggedInUser={user ? { name: user.name, id: user.id } : null} />
      <OutboundCheckInModal isOpen={isOutboundOpen} onClose={() => setIsOutboundOpen(false)} onSuccess={loadData} loggedInUser={user ? { name: user.name, id: user.id } : null} />
      <CheckOutModal
        isOpen={isCheckoutOpen}
        onClose={() => { setIsCheckoutOpen(false); setActiveCheckoutVisit(null); }}
        onSuccess={loadData}
        onCheckInNext={(type) => {
          setIsCheckoutOpen(false);
          setActiveCheckoutVisit(null);
          if (type === "Inbound") setIsInboundOpen(true);
          else setIsOutboundOpen(true);
        }}
        visit={activeCheckoutVisit}
      />
    </div>
  );
}
