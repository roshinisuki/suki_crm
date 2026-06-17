"use client";

import Link from "next/link";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { logoutAction } from "@/app/actions/auth";
import { useEffect, useState } from "react";
import DashboardHeader from "@/components/DashboardHeader";
import MobileBottomNav from "@/components/MobileBottomNav";
import { cn } from "@/lib/ui-utils";
import {
  LayoutDashboard, Users, CalendarClock, Briefcase, BookUser,
  CheckSquare, Settings, LogOut, Menu, X, TrendingUp, Building,
  ChevronDown, ChevronUp, Building2, ShieldCheck, PieChart, Activity, ContactRound, ListTodo
} from "lucide-react";

// ─── Nav definitions ─────────────────────────────────────────────────────────

type NavItem = { href: string; label: string; icon: React.ReactNode; end?: boolean };

// ─── NavLink ──────────────────────────────────────────────────────────────────

function NavLink({ item, active, onClick, collapsed }: { item: NavItem; active: boolean; onClick?: () => void; collapsed?: boolean }) {
  return (
    <Link
      href={item.href}
      onClick={onClick}
      title={collapsed ? item.label : undefined}
      className={cn(
        "relative rounded-lg text-sm font-medium transition-colors group",
        active
          ? "font-semibold"
          : "hover:bg-white/5",
        collapsed ? "flex items-center justify-center px-2 py-2.5" : "flex items-center gap-3 px-3.5 py-2.5",
      )}
      style={active ? { background: "var(--sidebar-active-bg)", color: "var(--sidebar-text-act)" } : { color: "var(--sidebar-text)" }}
      onMouseEnter={e => { if (!active) { e.currentTarget.style.color = "var(--sidebar-text-act)"; } }}
      onMouseLeave={e => { if (!active) { e.currentTarget.style.color = "var(--sidebar-text)"; } }}
    >
      <span className={cn("transition-colors shrink-0")} style={{ color: active ? "var(--sidebar-active)" : "var(--sidebar-heading)" }}>
        {item.icon}
      </span>
      {!collapsed && <span className="whitespace-nowrap overflow-hidden">{item.label}</span>}
    </Link>
  );
}

// ─── ExpandableNavSection ─────────────────────────────────────────────────────

function ExpandableNavSection({
  label,
  icon,
  subItems,
  pathname,
  onNavClick,
  collapsed,
}: {
  label: string;
  icon: React.ReactNode;
  subItems: { href: string; label: string }[];
  pathname: string;
  onNavClick?: () => void;
  collapsed?: boolean;
}) {
  const searchParams = useSearchParams();
  const searchString = searchParams ? searchParams.toString() : "";

  const isSectionActive = subItems.some((item) => {
    const [path, query] = item.href.split("?");
    if (query) {
      return pathname.startsWith(path) && searchString.includes(query);
    }
    return pathname === path;
  });

  const [isOpen, setIsOpen] = useState(isSectionActive);

  useEffect(() => {
    if (isSectionActive) setIsOpen(true);
  }, [isSectionActive]);

  if (collapsed) {
    return (
      <div className="relative group">
        <button
          title={label}
          className="w-full flex items-center justify-center px-2 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5"
          style={{ color: isSectionActive ? "var(--sidebar-text-act)" : "var(--sidebar-text)" }}
        >
          <span style={{ color: isSectionActive ? "var(--sidebar-active)" : "var(--sidebar-heading)" }}>{icon}</span>
        </button>
        <div className="absolute left-full top-0 ml-2 w-48 py-1.5 rounded-xl shadow-2xl border border-white/10 opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all z-50"
             style={{ background: "var(--sidebar-bg)" }}>
          <p className="px-3 py-1.5 text-[10px] font-bold uppercase tracking-wider" style={{ color: "var(--sidebar-heading)" }}>{label}</p>
          {subItems.map((sub) => {
            const [path, query] = sub.href.split("?");
            const isActive = pathname.startsWith(path) && (!query || searchString.includes(query));
            return (
              <Link key={sub.href} href={sub.href} onClick={onNavClick}
                className="block px-3 py-1.5 text-[12px] rounded-md mx-1 transition-colors"
                style={isActive ? { color: "var(--sidebar-active)", fontWeight: 600, background: "rgba(255,255,255,0.04)" } : { color: "var(--sidebar-text)" }}
                onMouseEnter={e => { if (!isActive) e.currentTarget.style.color = "var(--sidebar-text-act)"; }}
                onMouseLeave={e => { if (!isActive) e.currentTarget.style.color = "var(--sidebar-text)"; }}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3.5 py-2.5 rounded-lg text-sm font-medium transition-colors hover:bg-white/5 group",
        )}
        style={{ color: isSectionActive ? "var(--sidebar-text-act)" : "var(--sidebar-text)" }}
      >
        <div className="flex items-center gap-3">
          <span className={cn("transition-colors shrink-0")} style={{ color: isSectionActive ? "var(--sidebar-active)" : "var(--sidebar-heading)" }}>
            {icon}
          </span>
          <span className="whitespace-nowrap overflow-hidden">{label}</span>
        </div>
        <span className="transition-colors overflow-hidden" style={{ color: "var(--sidebar-heading)" }}>
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      
      {isOpen && (
        <div className="overflow-hidden pl-4 pr-1 py-1 space-y-1 border-l border-white/10 ml-5">
          {subItems.map((sub) => {
            const [path, query] = sub.href.split("?");
            const isActive = pathname.startsWith(path) && (!query || searchString.includes(query));
            return (
              <Link
                key={`${sub.href}-${sub.label}`}
                href={sub.href}
                onClick={onNavClick}
                className={cn(
                  "flex items-center py-1.5 px-2 rounded-md text-[12.5px] font-medium transition-colors",
                )}
                style={isActive
                  ? { color: "var(--sidebar-active)", fontWeight: 600, background: "rgba(255,255,255,0.04)" }
                  : { color: "var(--sidebar-text)" }
                }
                onMouseEnter={e => { if (!isActive) { e.currentTarget.style.color = "var(--sidebar-text-act)"; } }}
                onMouseLeave={e => { if (!isActive) { e.currentTarget.style.color = "var(--sidebar-text)"; } }}
              >
                {sub.label}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ─── Sidebar content ─────────────────────────────────────────────────────────

function SidebarContent({
  pathname,
  user,
  loading,
  handleLogout,
  onNavClick,
  collapsed,
}: {
  pathname: string;
  user: any;
  loading: boolean;
  handleLogout: () => void;
  onNavClick?: () => void;
  collapsed?: boolean;
}) {
  const leadSubItems = [
    { href: "/leads", label: "All Leads" },
    { href: "/leads?status=New", label: "New Leads" },
    { href: "/leads?followUp=due", label: "Follow-up Due" },
    { href: "/leads?status=SQL", label: "Sales Qualified Leads (SQL)" },
    { href: "/leads?status=FollowUpDue", label: "Overdue Leads" },
    { href: "/leads?status=Lost", label: "Lost Leads" },
  ];

  const accountsSubItems = [
    { href: "/customer-master", label: "All Accounts" },
    { href: "/customer-master?status=ActiveCustomer", label: "Active Accounts" },
    { href: "/customer-master?status=Prospect", label: "Prospect Accounts" },
  ];

  const contactsSubItems = [
    { href: "/contacts", label: "All Contacts" },
    { href: "/contacts?type=Technical", label: "Technical Contacts" },
    { href: "/contacts?type=Purchase", label: "Purchase Contacts" },
  ];

  const activitySubItems = [
    { href: "/activities?type=Call", label: "Calls" },
    { href: "/activities?type=Meeting", label: "Meetings" },
    { href: "/activities?type=Note", label: "Notes" },
  ];

  const taskSubItems = [
    { href: "/tasks", label: "All Tasks" },
    { href: "/tasks?status=Pending", label: "Pending" },
    { href: "/tasks?status=Completed", label: "Completed" },
    { href: "/tasks?status=Overdue", label: "Overdue" },
  ];

  const followUpSubItems = [
    { href: "/follow-up", label: "All Follow Ups" },
    { href: "/follow-up?status=Pending", label: "Pending" },
    { href: "/follow-up?status=Completed", label: "Completed" },
    { href: "/follow-up?status=Overdue", label: "Overdue" },
  ];

  const salesPipelineSubItems = [
    { href: "/sales-pipeline", label: "All Opportunities" },
    { href: "/sales-pipeline?stage=SalesOpportunity", label: "Qualified" },
    { href: "/sales-pipeline?stage=RequirementGathering", label: "Requirement Gathering" },
    { href: "/sales-pipeline?stage=MeetingScheduled", label: "Meeting Scheduled" },
  ];

  const dealSubItems = [
    { href: "/deals?status=Active", label: "Active Deals" },
    { href: "/deals?status=Won", label: "Won Deals" },
    { href: "/deals?status=Lost", label: "Lost Deals" },
  ];

  const reportsSubItems = [
    { href: "/reports", label: "All Reports" },
    { href: "/reports?type=lead", label: "Lead Report" },
    { href: "/reports?type=followup", label: "Follow-Up Report" },
  ];

  const userManagementSubItems = [
    { href: "/user-master", label: "Users" },
    { href: "/settings?tab=permissions", label: "Roles & Permissions" },
    { href: "/settings?tab=approval-matrix", label: "Approval Matrix" },
  ];

  const settingsSubItems = [
    { href: "/settings/lead-sources", label: "Lead Sources" },
  ];

  return (
    <>
      {/* ── Logo / Brand ── */}
      <div className={cn("shrink-0 flex flex-col gap-1 border-b border-white/[0.07]", collapsed ? "px-2 pt-5 pb-4 items-center" : "px-5 pt-6 pb-5")}>
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 flex items-center justify-center shrink-0">
            <img src="/logo.png" alt="SUKI CRM" className="w-full h-full object-contain" />
          </div>
          {!collapsed && (
            <div>
              <p className="text-white text-lg font-bold leading-tight tracking-wide">SUKI CRM</p>
            </div>
          )}
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className={cn("flex-1 overflow-y-auto py-4 space-y-0.5", collapsed ? "px-1.5" : "px-3")}>
        <NavLink item={{ href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} />, end: true }} active={pathname === "/dashboard"} onClick={onNavClick} collapsed={collapsed} />

        {!loading && user?.role !== "Customer" && user?.role !== "SuperAdmin" && (
          <>
            {!collapsed && (
              <div className="pt-5 pb-1.5">
                <p className="px-3.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-heading)" }}>CRM</p>
              </div>
            )}
            <ExpandableNavSection label="Leads" icon={<Users size={17} />} subItems={leadSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Accounts" icon={<BookUser size={17} />} subItems={accountsSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Contacts" icon={<ContactRound size={17} />} subItems={contactsSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Activities" icon={<Activity size={17} />} subItems={activitySubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Tasks" icon={<ListTodo size={17} />} subItems={taskSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Follow Ups" icon={<CalendarClock size={17} />} subItems={followUpSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Sales Pipeline" icon={<TrendingUp size={17} />} subItems={salesPipelineSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Deals" icon={<Briefcase size={17} />} subItems={dealSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Reports" icon={<PieChart size={17} />} subItems={reportsSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
          </>
        )}

        {!loading && user?.role === "SuperAdmin" && (
          <>
            {!collapsed && (
              <div className="pt-3 pb-1">
                <p className="px-3.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-heading)" }}>Platform Admin</p>
              </div>
            )}
            <NavLink item={{ href: "/admin/companies", label: "Companies", icon: <Building2 size={17} /> }} active={pathname.startsWith("/admin/companies")} onClick={onNavClick} collapsed={collapsed} />
            <NavLink item={{ href: "/admin/system-configs", label: "System Configs", icon: <Settings size={17} /> }} active={pathname.startsWith("/admin/system-configs")} onClick={onNavClick} collapsed={collapsed} />
          </>
        )}

        {!loading && user?.role === "Customer" && (
          <>
            {!collapsed && (
              <div className="pt-5 pb-1.5">
                <p className="px-3.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-heading)" }}>Portal</p>
              </div>
            )}
            <NavLink item={{ href: "/subscription", label: "My Subscriptions", icon: <Briefcase size={17} /> }} active={pathname.startsWith("/subscription")} onClick={onNavClick} collapsed={collapsed} />
            <NavLink item={{ href: "/customer/support", label: "Support Tickets", icon: <CheckSquare size={17} /> }} active={pathname.startsWith("/customer/support")} onClick={onNavClick} collapsed={collapsed} />
          </>
        )}

        {!loading && ["Admin", "SalesManager"].includes(user?.role ?? "") && (
          <>
            {!collapsed && (
              <div className="pt-5 pb-1.5">
                <p className="px-3.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-heading)" }}>System Management</p>
              </div>
            )}
            <ExpandableNavSection label="User Management" icon={<Users size={17} />} subItems={userManagementSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
            <NavLink item={{ href: "/audit-logs", label: "Audit Logs", icon: <ShieldCheck size={17} /> }} active={pathname.startsWith("/audit-logs")} onClick={onNavClick} collapsed={collapsed} />
            <ExpandableNavSection label="Settings" icon={<Settings size={17} />} subItems={settingsSubItems} pathname={pathname} onNavClick={onNavClick} collapsed={collapsed} />
          </>
        )}

        {!loading && user?.role === "SalesExecutive" && (
          <>
            {!collapsed && (
              <div className="pt-4 pb-2 border-t border-white/[0.07] mt-4">
                <p className="px-3.5 text-[10px] font-semibold uppercase tracking-widest" style={{ color: "var(--sidebar-heading)" }}>Settings</p>
              </div>
            )}
            <NavLink item={{ href: "/settings?tab=notifications", label: "Notifications", icon: <Settings size={17} /> }} active={pathname.startsWith("/settings")} onClick={onNavClick} collapsed={collapsed} />
          </>
        )}
      </nav>

      {/* ── User / Logout ── */}
      <div className="p-3 border-t border-white/[0.07] shrink-0">
        <div onClick={handleLogout} className={cn("flex items-center rounded-lg hover:bg-white/5 cursor-pointer transition-colors group", collapsed ? "justify-center px-2 py-2.5" : "gap-3 px-3 py-2.5")}>
          <div className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-black tracking-wider border shrink-0 shadow-sm" style={{ background: "rgba(255,255,255,0.08)", color: "var(--sidebar-text)", borderColor: "rgba(255,255,255,0.12)" }}>
            {(() => {
              const name = user?.name || "System Admin";
              const cleanName = name.replace(/[^a-zA-Z\s]/g, " ").trim();
              const parts = cleanName.split(/\s+/);
              if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
              return (parts[0][0] + (parts[parts.length - 1][0] || "")).toUpperCase();
            })()}
          </div>
          {!collapsed && (
            <>
              <div className="flex-1 overflow-hidden">
                <p className="text-xs font-semibold leading-tight truncate" style={{ color: "var(--sidebar-text-act)" }}>{user?.name || "Loading..."}</p>
                <p className="text-[10px] leading-tight truncate" style={{ color: "var(--sidebar-heading)" }}>{user?.role || "..."}</p>
              </div>
              <LogOut size={16} className="transition-colors shrink-0" style={{ color: "var(--sidebar-heading)" }} />
            </>
          )}
        </div>
      </div>
    </>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  const toggleSidebar = () => setIsCollapsed(prev => !prev);
  const pageTitle = pathname.split("/").filter(Boolean).pop()?.replace(/-/g, " ") || "Dashboard";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "var(--bg)" }}>

      {/* ── Sidebar ── */}
      <aside
        className={cn(
          "shrink-0 flex flex-col h-full z-20 shadow-xl border-r border-white/[0.07] transition-all duration-300 ease-in-out overflow-hidden",
          isCollapsed ? "w-[72px]" : "w-[260px]"
        )}
        style={{ background: "var(--sidebar-bg)" }}
      >
        <SidebarContent
          pathname={pathname}
          user={user}
          loading={loading}
          handleLogout={handleLogout}
          collapsed={isCollapsed}
        />
      </aside>

      {/* ── Main Content ── */}
      <main className="flex-1 flex flex-col min-w-0 overflow-hidden">
        <DashboardHeader pageTitle={pageTitle} user={user} toggleSidebar={toggleSidebar} />

        <div className="flex-1 overflow-auto p-4 md:p-5 lg:p-7 pb-24 md:pb-8">
          {children}
        </div>

        {user && ["SalesExecutive", "SalesManager"].includes(user.role) && (
          <MobileBottomNav setDrawerOpen={toggleSidebar} />
        )}
      </main>
    </div>
  );
}
