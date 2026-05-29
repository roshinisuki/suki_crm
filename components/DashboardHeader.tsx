"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";

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
  const [toast, setToast] = useState<{ visible: boolean; title: string; message: string } | null>(null);

  const showToast = (title: string, message: string) => {
    setToast({ visible: true, title, message });
    // Auto-hide toast after 5.5 seconds
    setTimeout(() => {
      setToast(prev => prev ? { ...prev, visible: false } : null);
    }, 5500);
  };

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

    const fetchNotifs = () => {
      fetch("/api/notifications")
        .then(res => res.json())
        .then(data => {
          if (data.success) {
            setNotifications(prev => {
              const newUnreads = data.data.filter((n: any) => !n.isRead);
              
              // Only consider it "new" for toasting if we've never seen this ID before
              const trulyNewForToast = newUnreads.filter((n: any) => !seenToastIds.current.has(n.id));

              if (trulyNewForToast.length > 0 && !isFirstLoad) {
                // Toast the first newly seen notification
                const latest = trulyNewForToast[0];
                showToast(latest?.title || "Notification Received", latest?.message || "New activity logged.");
              }
              
              // Mark all currently fetched unreads as "seen" so they don't toast again
              newUnreads.forEach((n: any) => seenToastIds.current.add(n.id));

              return data.data;
            });
            isFirstLoad = false;
          }
        })
        .catch(console.error);
    };

    fetchNotifs();
    const interval = setInterval(fetchNotifs, 8000); // Check every 8 seconds
    return () => clearInterval(interval);
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
      // Filter out non-virtual notifications from state instantly
      setNotifications(prev => prev.filter(n => n.id.startsWith("virtual-")));
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
            <div className="absolute top-full mt-2 w-72 md:w-80 right-0 bg-white border border-slate-200 shadow-xl rounded-3xl overflow-hidden z-50 flex flex-col">
              <div className="p-4 border-b border-slate-100 flex items-center justify-between bg-slate-50">
                <h3 className="text-sm font-bold text-slate-800">Notifications</h3>
                <div className="flex items-center gap-2.5">
                  {unreadCount > 0 && (
                    <button onClick={markAllRead} className="text-[10px] font-bold text-[#1a6bff] hover:text-blue-800 flex items-center gap-1 transition-colors shrink-0">
                      {icons.check} Mark read
                    </button>
                  )}
                  {notifications.filter(n => !n.id.startsWith("virtual-")).length > 0 && (
                    <button onClick={clearAll} className="text-[10px] font-bold text-red-500 hover:text-red-750 flex items-center gap-1 transition-colors shrink-0">
                      ✕ Clear all
                    </button>
                  )}
                </div>
              </div>
              <div className="max-h-80 overflow-y-auto">
                {notifications.length === 0 ? (
                  <div className="p-8 text-center text-slate-400 text-xs font-semibold">No notifications</div>
                ) : (
                  <div className="divide-y divide-slate-100">
                    {notifications.map(n => (
                      <div 
                        key={n.id} 
                        onClick={() => {
                          if (n.id.startsWith("virtual-pending-sub-")) {
                            router.push("/subscription");
                          } else if (n.id.startsWith("virtual-inbound-visit-") || n.id.startsWith("virtual-outbound-visit-")) {
                            router.push("/dashboard");
                          } else {
                            markAsRead(n.id);
                          }
                          setIsNotifOpen(false);
                        }}
                        className={`p-4 hover:bg-slate-50 cursor-pointer transition-colors ${n.isRead ? "opacity-60" : "bg-blue-50/20"}`}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <p className={`text-xs truncate ${n.isRead ? "font-semibold text-slate-600" : "font-bold text-slate-800"}`}>
                              {n.title}
                            </p>
                            <p className="text-[10px] text-slate-500 mt-0.5 line-clamp-2 leading-relaxed">{n.message}</p>
                            <p className="text-[9px] font-bold text-slate-400 mt-2 uppercase tracking-widest">
                              {new Date(n.createdAt).toLocaleDateString()}
                            </p>
                          </div>
                          {!n.isRead && <span className="w-2 h-2 rounded-full bg-blue-500 shrink-0 mt-1" />}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
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
      {/* 🔔 Beautiful Modern Notification Toast Popup */}
      {toast?.visible && (
        <div 
          onClick={() => {
            setIsNotifOpen(true);
            setToast(prev => prev ? { ...prev, visible: false } : null);
          }}
          className="fixed top-4 left-4 right-4 md:left-auto md:w-96 z-[9999] bg-slate-900 text-white rounded-3xl p-4 shadow-[0_12px_40px_rgba(0,0,0,0.3)] border border-slate-800 flex items-start gap-3.5 animate-toast-slide-in cursor-pointer hover:bg-slate-850 hover:translate-y-[-2px] active:scale-95 transition-all duration-300"
        >
          <div className="w-10 h-10 rounded-2xl bg-gradient-to-tr from-purple-500 to-indigo-500 flex items-center justify-center shrink-0 shadow-md">
            <svg className="w-5 h-5 text-white animate-bounce" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
            </svg>
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between gap-2">
              <h4 className="text-[10px] font-black tracking-widest text-indigo-400 uppercase">One message arrived</h4>
              <button 
                onClick={(e) => {
                  e.stopPropagation();
                  setToast(prev => prev ? { ...prev, visible: false } : null);
                }}
                className="text-slate-400 hover:text-white transition-colors text-xs font-bold leading-none p-1 rounded-full hover:bg-white/10"
              >
                ✕
              </button>
            </div>
            <p className="text-xs font-bold text-white mt-1.5 truncate">{toast.title}</p>
            <p className="text-[10px] text-slate-300 mt-0.5 line-clamp-2 leading-relaxed">{toast.message}</p>
          </div>
        </div>
      )}

      <style>{`
        @keyframes toastSlideIn {
          0% { transform: translateY(-40px) scale(0.95); opacity: 0; }
          100% { transform: translateY(0) scale(1); opacity: 1; }
        }
        .animate-toast-slide-in {
          animation: toastSlideIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards;
        }
      `}</style>
    </header>
  );
}
