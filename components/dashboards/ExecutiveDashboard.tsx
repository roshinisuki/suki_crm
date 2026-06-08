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
  Clock,
  AlertCircle
} from "lucide-react";

import InboundCheckInModal from "@/components/InboundCheckInModal";
import OutboundCheckInModal from "@/components/OutboundCheckInModal";
import CheckOutModal from "@/components/CheckOutModal";

export default function ExecutiveDashboard({ data, user, loadData }: { data: any; user: any; loadData: () => void }) {
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
            <h1 className="text-3xl font-bold mb-2">Executive Overview</h1>
            <p className="text-slate-300 text-sm">
              Welcome back, {user?.name}. Today you have <span className="text-white font-bold">{todayVisits.length} visits</span> and <span className="text-white font-bold">{followUpCount} key follow-ups</span>.
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

      {/* ── MOBILE PERFORMANCE OVERVIEW ── */}
      <div className="md:hidden bg-white p-5 rounded-2xl shadow-sm border border-slate-100 mb-6">
        <h3 className="text-[11px] font-bold text-slate-400 uppercase tracking-widest mb-3">Performance Overview</h3>
        <div className="flex items-end justify-between mb-2">
          <div>
            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider mb-1">Today's Visits</p>
            <p className="text-3xl font-bold text-[#075985]">{data?.stats?.visitsToday || 0}</p>
          </div>
          <div className="px-2 py-1 bg-blue-50 text-blue-600 rounded-lg text-[10px] font-bold flex items-center gap-1">
            <Navigation className="w-3 h-3" /> Field Active
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        
        {/* ── MAIN COLUMN ── */}
        <div className="lg:col-span-2 space-y-6">
          
          {/* Today's Visits */}
          <div>
            <div className="flex items-center justify-between mb-4 px-1">
              <h2 className="text-lg font-bold text-slate-800">Today's Visits</h2>
              <span className="text-xs font-bold text-blue-600 cursor-pointer">View Map</span>
            </div>
            
            <div className="space-y-4">
              {todayVisits.length === 0 ? (
                <div className="bg-white p-8 rounded-2xl border border-slate-100 text-center text-slate-400 font-medium">
                  No visits logged today.
                </div>
              ) : (
                todayVisits.map((v: any) => {
                  const isCheckedIn = v.status === "CHECKED_IN";
                  const dateObj = new Date(v.checkIn || v.checkInTime);
                  
                  return (
                    <div key={v.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm">
                      <div className="p-5 flex gap-4">
                        <div className="bg-slate-100 rounded-xl p-3 flex flex-col items-center justify-center shrink-0 w-16 h-16 text-center">
                          <span className="text-[13px] font-black text-slate-700 leading-tight">
                            {dateObj.toLocaleTimeString("en-US", { hour: "2-digit", minute: "2-digit", hour12: true }).replace(" AM", "").replace(" PM", "")}
                          </span>
                          <span className="text-[9px] font-bold text-slate-500 uppercase mt-0.5">
                            {dateObj.getHours() >= 12 ? "PM" : "AM"}
                          </span>
                        </div>
                        <div className="flex-1">
                          <h3 className="text-base font-bold text-slate-800 leading-tight">{v.customer?.name || v.customerName}</h3>
                          <p className="text-xs text-slate-500 mt-1">{v.purpose || "Field Visit"}</p>
                          <div className="flex gap-2 mt-2">
                            {v.priority && v.priority !== "Normal" && (
                              <span className="px-2 py-0.5 bg-red-50 text-red-600 rounded-full text-[9px] font-bold uppercase">{v.priority}</span>
                            )}
                            <span className="px-2 py-0.5 bg-slate-100 text-slate-600 rounded-full text-[9px] font-bold uppercase">{v.type}</span>
                            {isCheckedIn ? (
                              <span className="px-2 py-0.5 bg-amber-50 text-amber-600 rounded-full text-[9px] font-bold uppercase flex items-center gap-1">
                                <span className="w-1.5 h-1.5 bg-amber-500 rounded-full animate-pulse" /> Active
                              </span>
                            ) : (
                              <span className="px-2 py-0.5 bg-emerald-50 text-emerald-600 rounded-full text-[9px] font-bold uppercase">
                                Completed
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                      
                      {isCheckedIn && (
                        <div className="grid grid-cols-2 border-t border-slate-100 divide-x divide-slate-100">
                          <button className="py-3 text-xs font-bold text-blue-600 hover:bg-blue-50 transition-colors uppercase tracking-wider flex items-center justify-center gap-2">
                            <Map className="w-3.5 h-3.5" /> Directions
                          </button>
                          <button 
                            onClick={() => handleOpenCheckout(v, v.type)}
                            className="py-3 text-xs font-bold text-[#0D2137] hover:bg-slate-50 transition-colors uppercase tracking-wider flex items-center justify-center gap-2"
                          >
                            <CheckCircle2 className="w-3.5 h-3.5" /> Check-Out
                          </button>
                        </div>
                      )}
                    </div>
                  );
                })
              )}
            </div>
          </div>
        </div>

        {/* ── SIDE COLUMN ── */}
        <div className="space-y-6">
          
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

          {/* Recent Activity (Derived) */}
          <div className="hidden md:block">
            <h2 className="text-lg font-bold text-slate-800 mb-4 px-1">Recent Activity</h2>
            <div className="relative pl-3 space-y-6 before:absolute before:inset-0 before:ml-[17px] before:-translate-x-px md:before:mx-auto md:before:translate-x-0 before:h-full before:w-0.5 before:bg-gradient-to-b before:from-transparent before:via-slate-200 before:to-transparent">
              {todayVisits.slice(0, 3).map((v: any, i: number) => (
                <div key={i} className="relative flex items-center justify-between md:justify-normal md:odd:flex-row-reverse group is-active">
                  <div className="flex items-center justify-center w-8 h-8 rounded-full border border-white bg-slate-100 group-[.is-active]:bg-emerald-500 text-slate-500 group-[.is-active]:text-emerald-50 shadow shrink-0 md:order-1 md:group-odd:-translate-x-1/2 md:group-even:translate-x-1/2">
                    <CheckCircle2 className="w-4 h-4" />
                  </div>
                  <div className="w-[calc(100%-4rem)] md:w-[calc(50%-2.5rem)] bg-white p-4 rounded-2xl border border-slate-100 shadow-sm">
                    <div className="flex items-center justify-between space-x-2 mb-1">
                      <div className="font-bold text-slate-800 text-sm">{v.status === "CHECKED_IN" ? "Check-in" : "Completed"} {v.type} Visit</div>
                    </div>
                    <div className="text-xs text-slate-500">at {v.customer?.name}</div>
                  </div>
                </div>
              ))}
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
