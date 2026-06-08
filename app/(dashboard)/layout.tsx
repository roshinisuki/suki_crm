"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { logoutAction } from "@/app/actions/auth";
import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import MobileBottomNav from "@/components/MobileBottomNav";

type NavItem = { href: string; label: string; icon: React.ReactNode };

const Icon = ({ d, d2 }: { d: string; d2?: string }) => (
  <svg className="w-[18px] h-[18px]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8} strokeLinecap="round" strokeLinejoin="round">
    <path d={d} />{d2 && <path d={d2} />}
  </svg>
);

const icons = {
  dashboard:    <Icon d="M4 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2V6zM14 6a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2V6zM4 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2H6a2 2 0 01-2-2v-2zM14 16a2 2 0 012-2h2a2 2 0 012 2v2a2 2 0 01-2 2h-2a2 2 0 01-2-2v-2z" />,
  customers:    <Icon d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" />,
  subscription: <Icon d="M3 10h18M7 15h1m4 0h1m-7 4h12a3 3 0 003-3V8a3 3 0 00-3-3H6a3 3 0 00-3 3v8a3 3 0 003 3z" />,
  visits:       <Icon d="M11 5.882V19.24a1.76 1.76 0 01-3.417.592l-2.147-6.15M18 13a3 3 0 100-6M5.436 13.683A4.001 4.001 0 017 6h1.832c4.1 0 7.625-1.234 9.168-3v14c-1.543-1.766-5.067-3-9.168-3H7a3.988 3.988 0 01-1.564-.317z" />,
  visitors:     <Icon d="M5.121 17.804A13.937 13.937 0 0112 16c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0zm6 2a9 9 0 11-18 0 9 9 0 0118 0z" />,
  followup:     <Icon d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />,
  audit:        <Icon d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />,
  users:        <Icon d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197M13 7a4 4 0 11-8 0 4 4 0 018 0z" />,
  settings:     <Icon d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" d2="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />,
  search:       <Icon d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />,
  bell:         <Icon d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />,
  logout:       <Icon d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />,
  menu:         <Icon d="M4 6h16M4 12h16M4 18h16" />,
  close:        <Icon d="M6 18L18 6M6 6l12 12" />,
};

const mainNav: NavItem[]  = [
  { href: "/dashboard",          label: "Dashboard",     icon: icons.dashboard },
  { href: "/customer-master",    label: "Leads",         icon: icons.customers }
];
const crmNav: NavItem[]   = [
  { href: "/subscription",       label: "Subscriptions",     icon: icons.subscription },
  { href: "/marketing-log",      label: "Marketing Visits",  icon: icons.visits },
  { href: "/visitor-management", label: "Office Visits",     icon: icons.visitors },
  { href: "/follow-up",          label: "Follow-ups",        icon: icons.followup },
  { href: "/decision-summary",   label: "Decision Summary",  icon: icons.audit },
];
const adminNav: NavItem[] = [
  { href: "/audit-logs",   label: "Audit Log", icon: icons.audit },
  { href: "/user-master",  label: "Users",     icon: icons.users },
  { href: "/settings",     label: "Settings",  icon: icons.settings },
];

function NavLink({ item, active, onClick }: { item: NavItem; active: boolean; onClick?: () => void }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-all duration-200 group
        ${active ? "bg-indigo-600/10 text-indigo-400 shadow-sm shadow-indigo-500/5 ring-1 ring-indigo-500/20" : "text-slate-400 hover:text-white hover:bg-white/5"}`}
    >
      <span className={`transition-colors ${active ? "text-indigo-400" : "text-slate-500 group-hover:text-slate-300"}`}>
        {item.icon}
      </span>
      {item.label}
    </Link>
  );
}

// Sidebar content shared between desktop and mobile drawer
function SidebarContent({ pathname, user, loading, handleLogout, onNavClick }: {
  pathname: string;
  user: any;
  loading: boolean;
  handleLogout: () => void;
  onNavClick?: () => void;
}) {
  return (
    <>
      {/* Logo */}
      <div className="px-5 pt-6 pb-5 shrink-0 flex flex-col gap-1 border-b border-slate-800/60">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="SUKI CRM" className="w-full h-full object-contain" />
          </div>
          <div>
            <p className="text-white text-lg font-bold leading-tight tracking-wide">SUKI CRM</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {!loading && user?.role !== "Customer" && mainNav.map(item =>
          <NavLink key={item.href} item={item} active={pathname === item.href} onClick={onNavClick} />
        )}

        {!loading && user?.role !== "Customer" && (
          <>
            <div className="pt-5 pb-1.5">
              <p className="px-3.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">CRM</p>
            </div>
            {crmNav.map(item => {
              if (user?.role === "MarketingExecutive" && (item.href === "/visitor-management" || item.href === "/decision-summary")) return null;
              return <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} onClick={onNavClick} />;
            })}
          </>
        )}

        {!loading && user?.role === "Customer" && (
          <>
            <div className="pt-5 pb-1.5">
              <p className="px-3.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">Portal</p>
            </div>
            <NavLink item={{ href: "/subscription", label: "My Subscriptions", icon: icons.subscription }} active={pathname.startsWith("/subscription")} onClick={onNavClick} />
            <NavLink item={{ href: "/customer/support", label: "My Requests/Tickets", icon: icons.visitors }} active={pathname.startsWith("/customer/support")} onClick={onNavClick} />
          </>
        )}

        {!loading && (user?.role === "Admin" || user?.role === "MarketingLead") && (
          <>
            <div className="pt-5 pb-1.5">
              <p className="px-3.5 text-[10px] font-semibold text-white/25 uppercase tracking-widest">Admin</p>
            </div>
            {adminNav.map(item => {
              if (user?.role === "MarketingLead" && (item.href === "/settings" || item.href === "/user-master")) return null;
              return <NavLink key={item.href} item={item} active={pathname.startsWith(item.href)} onClick={onNavClick} />;
            })}
          </>
        )}
      </nav>

      {/* User / Logout */}
      <div className="p-3 border-t border-white/[0.07] shrink-0">
        <div onClick={handleLogout} className="flex items-center gap-3 px-3 py-2.5 rounded-lg hover:bg-white/5 cursor-pointer transition-colors group">
          <div className="w-8 h-8 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-black tracking-wider border border-slate-700 shrink-0 shadow-sm">
            {(() => {
              const name = user?.name || "System Admin";
              const cleanName = name.replace(/[^a-zA-Z\s]/g, " ").trim();
              const parts = cleanName.split(/\s+/);
              if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
              return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
            })()}
          </div>
          <div className="flex-1 overflow-hidden">
            <p className="text-slate-200 text-xs font-semibold leading-tight truncate">{user?.name || "Loading..."}</p>
            <p className="text-slate-500 text-[10px] leading-tight truncate">{user?.role || "..."}</p>
          </div>
          <span className="text-slate-500 group-hover:text-slate-300 transition-colors shrink-0">{icons.logout}</span>
        </div>
      </div>
    </>
  );
}

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);

  useEffect(() => {
    if (!loading && !user) {
      router.push("/login");
    }
  }, [user, loading, router]);

  // Close drawer on route change
  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = "/login";
    } catch (err) {
      console.error('Logout failed', err);
    }
  };

  const pageTitle = pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden bg-[#F0F2F5]">

      {/* ── Desktop Sidebar ── */}
      <aside className="hidden md:flex w-[260px] shrink-0 bg-[#0F172A] border-r border-slate-800/60 flex-col h-full z-20 shadow-xl shadow-slate-900/10">
        <SidebarContent
          pathname={pathname}
          user={user}
          loading={loading}
          handleLogout={handleLogout}
        />
      </aside>

      {/* ── Mobile Drawer Overlay ── */}
      {drawerOpen && (
        <div
          className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
          onClick={() => setDrawerOpen(false)}
        />
      )}

      {/* ── Mobile Drawer Panel ── */}
      <aside
        className={`fixed top-0 left-0 h-full w-[280px] bg-[#0F172A] flex flex-col z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl
          ${drawerOpen ? "translate-x-0" : "-translate-x-full"}`}
      >
        {/* Close button */}
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10"
        >
          {icons.close}
        </button>
        <SidebarContent
          pathname={pathname}
          user={user}
          loading={loading}
          handleLogout={handleLogout}
          onNavClick={() => setDrawerOpen(false)}
        />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">

        {/* Topbar */}
        <DashboardHeader pageTitle={pageTitle} user={user} setDrawerOpen={setDrawerOpen} />

        {/* Page content */}
        <div className="flex-1 overflow-auto p-4 md:p-5 lg:p-7 pb-24 md:pb-8">
          {children}
        </div>
        
        {/* Mobile Bottom Navigation for Executives and Leads */}
        {user && ["MarketingExecutive", "MarketingLead"].includes(user.role) && (
          <MobileBottomNav setDrawerOpen={setDrawerOpen} />
        )}
      </main>
    </div>
  );
}
