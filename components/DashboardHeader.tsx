"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { useToast } from "@/components/ToastProvider";

const icons = {
  search: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /></svg>,
  bell: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" /></svg>,
  menu: <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 6h16M4 12h16M4 18h16" /></svg>,
  check: <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" /></svg>,
};

export default function DashboardHeader({
  pageTitle,
  user,
  setDrawerOpen
}: {
  pageTitle: string;
  user: any;
  setDrawerOpen: (v: boolean) => void;
}) {
  const router = useRouter();

  // Search State
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState<{ customers: any[], visits: any[], visitors: any[] } | null>(null);
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  // Notification State
  const [notifications, setNotifications] = useState<any[]>([]);
  const [isNotifOpen, setIsNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const toast = useToast();

  const unreadCount = notifications.filter(n => !n.isRead).length;

  useEffect(() => {
    // Close dropdowns on click outside
    const handleClickOutside = (e: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(e.target as Node)) {
        setIsSearchOpen(false);
      }
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setIsNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);



  // Fetch Notifications periodically and trigger toast alert popups
  // Use a ref to track which notification IDs have already triggered a toast in this session
  const seenToastIds = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!user) return;

    let isFirstLoad = true;
    const eventSource = new EventSource("/api/notifications/sse");

    eventSource.onmessage = (event) => {
      try {
        const data = JSON.parse(event.data);
        if (data.success) {
          const fetchedNotifications = data.data;
          const newUnreads = fetchedNotifications.filter((n: any) => !n.isRead);
          const trulyNewForToast = newUnreads.filter((n: any) => !seenToastIds.current.has(n.id));

          if (trulyNewForToast.length > 0 && !isFirstLoad) {
            const latest = trulyNewForToast[0];
            
            let toastType: "success" | "error" | "warning" | "info" = "info";
            const t = latest.title?.toLowerCase() || "";
            if (t.includes("reject") || t.includes("fail") || t.includes("error")) toastType = "error";
            else if (t.includes("approve") || t.includes("success") || t.includes("complete")) toastType = "success";
            else if (t.includes("due") || t.includes("warning") || t.includes("overdue") || latest.type === "follow_up") toastType = "warning";
            
            toast[toastType](latest?.message || "New activity logged.", latest?.title || "Notification Received");
          }
          
          newUnreads.forEach((n: any) => seenToastIds.current.add(n.id));
          setNotifications(fetchedNotifications);
          isFirstLoad = false;
        }
      } catch (e) {
        console.error("Error parsing SSE data", e);
      }
    };

    eventSource.onerror = (error) => {
      console.error("SSE Error", error);
      eventSource.close();
    };

    return () => eventSource.close();
  }, [user]);

  // Handle Search Debounce
  useEffect(() => {
    if (searchQuery.length < 2) {
      setSearchResults(null);
      return;
    }
    const timer = setTimeout(() => {
      fetch(`/api/search?q=${encodeURIComponent(searchQuery)}`)
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setSearchResults(data.data);
            setIsSearchOpen(true);
          }
        })
        .catch(console.error);
    }, 300);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const markAllRead = async () => {
    try {
      await fetch("/api/notifications", { method: "PATCH" });
      setNotifications(prev => prev.map(n => ({ ...n, isRead: true })));
    } catch (e) {
      console.error(e);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch(`/api/notifications/${id}`, { method: "PATCH" });
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, isRead: true } : n));
    } catch (e) {
      console.error(e);
    }
  };

  const clearAll = async () => {
    try {
      await fetch("/api/notifications", { method: "DELETE" });
      setNotifications([]);
    } catch (e) {
      console.error(e);
    }
  };

  return (
    <header className="h-14 md:h-16 bg-white border-b border-slate-200/80 flex items-center justify-between px-4 md:px-6 lg:px-8 shrink-0 z-10 relative">
      <div className="flex items-center gap-3">
        <button
          onClick={() => setDrawerOpen(true)}
          className="md:hidden w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-600 transition-colors border border-slate-200/60"
        >
          {icons.menu}
        </button>
        <h1 className="text-base md:text-lg font-bold text-slate-800 capitalize">{pageTitle}</h1>
      </div>

      <div className="flex items-center gap-2 md:gap-3">
        {/* Global Search */}
        <div className="relative hidden sm:block" ref={searchRef}>
          <span className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400">{icons.search}</span>
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => {
              setSearchQuery(e.target.value);
              setIsSearchOpen(true);
            }}
            placeholder="Search customers, visits..."
            className="w-44 md:w-64 pl-10 pr-4 py-2 rounded-xl bg-slate-100 text-sm text-slate-700 placeholder:text-slate-400 border border-slate-200/60 focus:outline-none focus:ring-2 focus:ring-[#0D2137] transition"
          />

          {isSearchOpen && searchResults && (
            <div className="absolute top-full mt-2 w-full lg:w-80 right-0 bg-white border border-slate-200 shadow-xl rounded-2xl overflow-hidden z-50">
              <div className="max-h-80 overflow-y-auto">
                {searchResults.customers.length === 0 && searchResults.visits.length === 0 && searchResults.visitors.length === 0 ? (
                  <div className="p-4 text-center text-xs text-slate-500 font-semibold">No results found.</div>
                ) : (
                  <>
                    {searchResults.customers.length > 0 && (
                      <div className="p-2">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Customers</h4>
                        {searchResults.customers.map((c: any) => (
                          <div 
                            key={c.id} 
                            onClick={() => { router.push("/customer-master"); setIsSearchOpen(false); }}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <p className="text-xs font-bold text-slate-800 truncate">{c.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">{c.customerCode} • {c.email || c.phone}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.visits.length > 0 && (
                      <div className="p-2 border-t border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Visits</h4>
                        {searchResults.visits.map((v: any) => (
                          <div 
                            key={v.id} 
                            onClick={() => { router.push("/marketing-log"); setIsSearchOpen(false); }}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <p className="text-xs font-bold text-slate-800 truncate">{v.customer?.name}</p>
                            <p className="text-[10px] text-slate-500 truncate">Rep: {v.executive?.name}</p>
                          </div>
                        ))}
                      </div>
                    )}
                    {searchResults.visitors.length > 0 && (
                      <div className="p-2 border-t border-slate-100">
                        <h4 className="text-[10px] font-bold text-slate-400 uppercase tracking-wider px-2 mb-1">Visitors</h4>
                        {searchResults.visitors.map((v: any) => (
                          <div 
                            key={v.id} 
                            onClick={() => { router.push("/visitor-management"); setIsSearchOpen(false); }}
                            className="p-2 hover:bg-slate-50 rounded-lg cursor-pointer transition-colors"
                          >
                            <p className="text-xs font-bold text-slate-800 truncate">{v.visitorName}</p>
                            <p className="text-[10px] text-slate-500 truncate">{v.company}</p>
                          </div>
                        ))}
                      </div>
                    )}
                  </>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Notifications Dropdown */}
        <div className="relative" ref={notifRef}>
          <button 
            onClick={() => setIsNotifOpen(!isNotifOpen)}
            className="relative w-9 h-9 rounded-xl bg-slate-100 hover:bg-slate-200 flex items-center justify-center text-slate-500 transition-colors border border-slate-200/60"
          >
            {icons.bell}
            {unreadCount > 0 && (
              <span className="absolute top-1 right-1 w-2.5 h-2.5 rounded-full bg-red-500 border-2 border-white animate-pulse" />
            )}
          </button>

          {isNotifOpen && (
            <div className="absolute top-full mt-3 w-[340px] md:w-[400px] right-0 bg-white shadow-[0_8px_30px_rgb(0,0,0,0.12)] rounded-2xl overflow-hidden z-50 flex flex-col border border-slate-200">
              {/* Header */}
              <div className="bg-[#0D2137] text-white p-4">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <h3 className="text-lg font-bold tracking-wide">Notifications</h3>
                    <div className="flex items-center gap-1.5 mt-1">
                      <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
                      <span className="text-[10px] text-indigo-100 uppercase tracking-widest font-semibold">Live - Real-time connected</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <button className="w-7 h-7 rounded bg-white/10 hover:bg-white/20 flex items-center justify-center transition-colors">
                      <svg className="w-3.5 h-3.5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>
                    </button>
                    {unreadCount > 0 && (
                      <button onClick={markAllRead} className="px-2.5 py-1.5 rounded bg-white/10 hover:bg-white/20 text-[10px] font-bold text-white flex items-center gap-1.5 transition-colors border border-white/10">
                        {icons.check} MARK ALL READ
                      </button>
                    )}
                    {notifications.length > 0 && (
                      <button onClick={clearAll} className="px-2.5 py-1.5 rounded bg-red-500/20 hover:bg-red-500/30 text-[10px] font-bold text-red-200 flex items-center gap-1.5 transition-colors border border-red-500/20">
                        <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg> CLEAR ALL
                      </button>
                    )}
                  </div>
                </div>
                
                {/* Tabs */}
                <div className="flex items-center gap-6 text-xs font-bold uppercase tracking-wider">
                  <div className="relative pb-2 cursor-pointer">
                    <span className="text-white">ALL ({notifications.length})</span>
                    <div className="absolute bottom-0 left-0 right-0 h-0.5 bg-white rounded-t-full"></div>
                  </div>
                  <div className="relative pb-2 cursor-pointer text-indigo-200 hover:text-white transition-colors">
                    UNREAD ({unreadCount})
                  </div>
                </div>
              </div>

              {/* List */}
              <div className="max-h-[380px] overflow-y-auto bg-slate-50">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">No notifications</div>
                ) : (
                  <div className="divide-y divide-slate-100 bg-white">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          markAsRead(n.id);
                          setIsNotifOpen(false);
                          if (n.link) router.push(n.link);
                        }}
                        className="p-4 hover:bg-slate-50 cursor-pointer transition-colors group relative"
                      >
                        <div className="flex gap-4">
                          {/* Icon logic: choose icon based on title */}
                          <div className="w-10 h-10 rounded-full bg-indigo-50 flex items-center justify-center shrink-0">
                            {n.title.toLowerCase().includes("renewal") ? (
                              <svg className="w-5 h-5 text-indigo-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                            ) : n.title.toLowerCase().includes("ticket") || n.title.toLowerCase().includes("support") ? (
                              <svg className="w-5 h-5 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                            ) : (
                              <svg className="w-5 h-5 text-purple-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}><path strokeLinecap="round" strokeLinejoin="round" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /></svg>
                            )}
                          </div>
                          
                          <div className="flex-1 min-w-0 pt-0.5">
                            <p className={`text-[13px] truncate ${n.isRead ? "font-semibold text-slate-700" : "font-bold text-slate-900"}`}>
                              {n.title}
                            </p>
                            <p className="text-[11px] text-slate-500 mt-1 line-clamp-2 leading-snug">
                              {n.message}
                            </p>
                            <div className="flex items-center gap-1.5 mt-2">
                              <svg className="w-3 h-3 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}><path strokeLinecap="round" strokeLinejoin="round" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /></svg>
                              <p className="text-[10px] font-semibold text-slate-400 uppercase tracking-wide">
                                {new Date(n.createdAt).toLocaleDateString()}
                              </p>
                            </div>
                          </div>

                          {/* Unread indicator */}
                          {!n.isRead && (
                            <div className="flex flex-col items-end gap-2 shrink-0 mt-1">
                              <span className="w-2 h-2 rounded-full bg-[#3b82f6]" />
                            </div>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Footer */}
              <div className="p-3 border-t border-slate-100 bg-slate-50 flex items-center justify-between">
                <button 
                  onClick={() => { router.push("/subscription"); setIsNotifOpen(false); }}
                  className="text-[10px] font-bold text-[#4F46E5] hover:text-indigo-800 uppercase tracking-wider flex items-center gap-1"
                >
                  View Renewals <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}><path strokeLinecap="round" strokeLinejoin="round" d="M14 5l7 7m0 0l-7 7m7-7H3" /></svg>
                </button>
                <div className="text-[9px] font-bold text-slate-300 uppercase tracking-widest">
                  Suki CRM System
                </div>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Initials Avatar */}
        <div 
          onClick={() => router.push("/profile")}
          className="w-8 h-8 md:w-9 md:h-9 rounded-xl bg-gradient-to-br from-[#0D2137] to-[#1E3A5F] text-white flex items-center justify-center text-xs md:text-sm font-black tracking-wider cursor-pointer border border-slate-200 hover:scale-105 active:scale-95 transition-all shadow-sm shrink-0"
          title={user?.name || "User Profile"}
        >
          {(() => {
            const name = user?.name || "System Admin";
            const cleanName = name.replace(/[^a-zA-Z\s]/g, " ").trim();
            const parts = cleanName.split(/\s+/);
            if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
            return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
          })()}
        </div>
      </div>
    </header>
  );
}
