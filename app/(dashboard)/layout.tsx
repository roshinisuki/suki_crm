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
      className={cn(
        "flex items-center gap-3 px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 group relative",
        active
          ? "bg-[var(--sidebar-active-bg)] text-white font-semibold"
          : "text-white hover:bg-white/[0.06]",
      )}
      title={collapsed ? item.label : undefined}
      aria-label={collapsed ? item.label : undefined}
    >
      {/* Active indicator */}
      {active && (
        <span className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-[var(--primary)] rounded-r-full" />
      )}
      <span className={cn("nav-icon transition-colors shrink-0", active ? "text-[var(--primary)]" : "text-white")}>
        {item.icon}
      </span>
      <span className="nav-label whitespace-nowrap transition-all duration-300 overflow-hidden">{item.label}</span>

      {/* Tooltip for collapsed state */}
      {collapsed && (
        <span className="sidebar-tooltip">{item.label}</span>
      )}
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
}: {
  label: string;
  icon: React.ReactNode;
  subItems: { href: string; label: string }[];
  pathname: string;
  onNavClick?: () => void;
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

  // Auto open if section becomes active
  useEffect(() => {
    if (isSectionActive) setIsOpen(true);
  }, [isSectionActive]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 text-white hover:bg-white/[0.06] group",
          isSectionActive ? "bg-white/[0.04]" : ""
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn("nav-icon transition-colors shrink-0 text-white group-hover:text-[var(--primary)]", isSectionActive ? "text-[var(--primary)]" : "")}>
            {icon}
          </span>
          <span className="nav-label whitespace-nowrap transition-all duration-300 overflow-hidden">{label}</span>
        </div>
        <span className="nav-label text-white/40 group-hover:text-white transition-colors overflow-hidden">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      
      {isOpen && (
        <div className="nav-label overflow-hidden pl-4 pr-1 py-1 space-y-1 border-l border-white/10 ml-5">
          {subItems.map((sub) => {
            const [path, query] = sub.href.split("?");
            const isActive = pathname.startsWith(path) && (!query || searchString.includes(query));
            return (
              <Link
                key={`${sub.href}-${sub.label}`}
                href={sub.href}
                onClick={onNavClick}
                className={cn(
                  "flex items-center py-1.5 px-2 rounded-lg text-[12.5px] font-medium transition-all duration-100",
                  isActive
                    ? "text-[var(--primary)] font-semibold bg-white/[0.04]"
                    : "text-white/70 hover:text-white hover:bg-white/[0.02]"
                )}
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

// ─── NestedGroupSection (Sub-level Accordion) ──────────────────────────────

function NestedGroupSection({
  sec,
  pathname,
  searchString,
  onNavClick,
}: {
  sec: { label: string; subItems: { href: string; label: string }[] };
  pathname: string;
  searchString: string;
  onNavClick?: () => void;
}) {
  const isSecActive = sec.subItems.some((item) => {
    const [path, query] = item.href.split("?");
    if (query) return pathname.startsWith(path) && searchString.includes(query);
    return pathname === path;
  });

  const [isOpen, setIsOpen] = useState(isSecActive);

  useEffect(() => {
    if (isSecActive) setIsOpen(true);
  }, [isSecActive]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between py-1.5 px-2 rounded-lg text-[12.5px] font-semibold text-white/70 hover:text-white hover:bg-white/[0.04] transition-all duration-100 group"
      >
        <span className={isSecActive ? "text-[var(--primary)]" : ""}>{sec.label}</span>
        <span className="text-white/30 group-hover:text-white/50 transition-colors">
          {isOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
        </span>
      </button>

      {isOpen && (
        <div className="nav-label overflow-hidden pl-3 pr-1 py-1 space-y-1 border-l border-white/5 ml-1">
          {sec.subItems.map((sub) => {
            const [path, query] = sub.href.split("?");
            const isActive = pathname.startsWith(path) && (!query || searchString.includes(query));
            return (
              <Link
                key={`${sub.href}-${sub.label}`}
                href={sub.href}
                onClick={onNavClick}
                className={cn(
                  "flex items-center py-1.5 px-2 rounded-md text-[11.5px] font-medium transition-all duration-100",
                  isActive
                    ? "text-[var(--primary)] font-semibold bg-white/[0.02]"
                    : "text-white/50 hover:text-white hover:bg-white/[0.02]"
                )}
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

// ─── ExpandableGroup (Multi-level) ───────────────────────────────────────────

function ExpandableGroup({
  label,
  icon,
  sections,
  pathname,
  onNavClick,
}: {
  label: string;
  icon: React.ReactNode;
  sections: {
    label: string;
    subItems: { href: string; label: string }[];
  }[];
  pathname: string;
  onNavClick?: () => void;
}) {
  const searchParams = useSearchParams();
  const searchString = searchParams ? searchParams.toString() : "";

  const isGroupActive = sections.some(sec => sec.subItems.some((item) => {
    const [path, query] = item.href.split("?");
    if (query) return pathname.startsWith(path) && searchString.includes(query);
    return pathname === path;
  }));

  const [isOpen, setIsOpen] = useState(isGroupActive);

  useEffect(() => {
    if (isGroupActive) setIsOpen(true);
  }, [isGroupActive]);

  return (
    <div className="space-y-1">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className={cn(
          "w-full flex items-center justify-between px-3 py-2.5 rounded-xl text-[13.5px] font-medium transition-all duration-150 text-white hover:bg-white/[0.06] group",
          isGroupActive ? "bg-[var(--sidebar-active-bg)]/60" : ""
        )}
      >
        <div className="flex items-center gap-3">
          <span className={cn("nav-icon transition-colors shrink-0 text-white group-hover:text-[var(--primary)]", isGroupActive ? "text-[var(--primary)]" : "")}>
            {icon}
          </span>
          <span className="nav-label whitespace-nowrap transition-all duration-300 overflow-hidden">{label}</span>
        </div>
        <span className="nav-label text-white/40 group-hover:text-white transition-colors overflow-hidden">
          {isOpen ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
        </span>
      </button>
      
      {isOpen && (
        <div className="nav-label overflow-hidden pl-4 pr-1 py-2 space-y-1 border-l border-white/10 ml-5 mt-1">
          {sections.map((sec, idx) => (
            <NestedGroupSection 
              key={idx} 
              sec={sec} 
              pathname={pathname} 
              searchString={searchString} 
              onNavClick={onNavClick} 
            />
          ))}
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
  isCollapsed,
}: {
  pathname: string;
  user: any;
  loading: boolean;
  handleLogout: () => void;
  onNavClick?: () => void;
  isCollapsed?: boolean;
}) {
  const isActive = (item: NavItem) =>
    item.end ? pathname === item.href : pathname.startsWith(item.href);

  // ── BRD Variant 1 — Navigation sub-item definitions ───────────────────────

  // 2. Leads
  const leadSubItems = [
    { href: "/leads", label: "All Leads" },
    { href: "/leads?status=New", label: "New Leads" },
    { href: "/leads?followUp=due", label: "Follow-up Due" },
    { href: "/leads?status=SQL", label: "Sales Qualified Leads (SQL)" },
    { href: "/leads?status=FollowUpDue", label: "Overdue Leads" },
    { href: "/leads?status=Lost", label: "Lost Leads" },
  ];

  // 3. Accounts
  const accountsSubItems = [
    { href: "/customer-master", label: "All Accounts" },
    { href: "/customer-master?status=ActiveCustomer", label: "Active Accounts" },
    { href: "/customer-master?status=Prospect", label: "Prospect Accounts" },
  ];

  // 4. Contacts
  const contactsSubItems = [
    { href: "/contacts", label: "All Contacts" },
    { href: "/contacts?type=Technical", label: "Technical Contacts" },
    { href: "/contacts?type=Purchase", label: "Purchase Contacts" },
  ];

  // 5. Activities
  const activitySubItems = [
    { href: "/activities/call-logs", label: "Calls" },
    { href: "/activities?type=Meeting", label: "Meetings" },
    { href: "/activities?type=Note", label: "Notes" },
  ];

  // 6. Tasks
  const taskSubItems = [
    { href: "/tasks", label: "All Tasks" },
    { href: "/tasks?status=Pending", label: "Pending" },
    { href: "/tasks?status=Completed", label: "Completed" },
    { href: "/tasks?status=Overdue", label: "Overdue" },
  ];

  // 7. Follow Ups
  const followUpSubItems = [
    { href: "/follow-up", label: "All Follow Ups" },
    { href: "/follow-up?status=Pending", label: "Pending" },
    { href: "/follow-up?status=Completed", label: "Completed" },
    { href: "/follow-up?status=Overdue", label: "Overdue" },
  ];

  // 8. Sales Pipeline — V1 stages only
  const salesPipelineSubItems = [
    { href: "/sales-pipeline", label: "All Opportunities" },
    { href: "/sales-pipeline?stage=SalesOpportunity", label: "Qualified" },
    { href: "/sales-pipeline?stage=RequirementGathering", label: "Requirement Gathering" },
    { href: "/sales-pipeline?stage=MeetingScheduled", label: "Meeting Scheduled" },
  ];

  // 9. Deals
  const dealSubItems = [
    { href: "/deals?status=Active", label: "Active Deals" },
    { href: "/deals?status=Won", label: "Won Deals" },
    { href: "/deals?status=Lost", label: "Lost Deals" },
  ];

  // 10. Reports
  const reportsSubItems = [
    { href: "/reports", label: "All Reports" },
    { href: "/reports?type=lead", label: "Lead Report" },
    { href: "/reports?type=followup", label: "Follow-Up Report" },
  ];

  // User Management (restored exactly as original)
  const userManagementSubItems = [
    { href: "/user-master", label: "Users" },
    { href: "/settings?tab=permissions", label: "Roles & Permissions" },
    { href: "/settings?tab=approval-matrix", label: "Approval Matrix" },
  ];

  // 11. Settings
  const settingsSubItems = [
    { href: "/settings/lead-sources", label: "Lead Sources" },
  ];

  return (
    <div className="flex flex-col h-full">
      {/* ── Logo / Brand ── */}
      <div className={cn("shrink-0 border-b border-white/[0.06] flex items-center", isCollapsed ? "justify-center px-2 py-3" : "px-4 py-3.5")}>
        <div className="flex items-center gap-3">
          {/* Logo image with fallback */}
          <div className="w-9 h-9 rounded-lg bg-[var(--primary)] flex items-center justify-center shrink-0 overflow-hidden">
            <img
              src="/logo.png"
              alt="SUKI CRM"
              className="w-full h-full object-contain"
              onError={(e: any) => {
                e.target.style.display = 'none';
                e.target.parentElement.querySelector('.logo-fallback')?.classList.remove('hidden');
              }}
            />
            <span className="logo-fallback hidden text-white font-black text-sm">S</span>
          </div>

          {/* Brand text — hidden when collapsed */}
          <div className="nav-label transition-all duration-300 overflow-hidden whitespace-nowrap leading-none">
            <p className="text-white text-[14px] font-black tracking-wide leading-tight">SUKI CRM</p>
            <p className="text-white/50 text-[10px] font-medium tracking-wide leading-tight mt-0.5">Customer Relationship</p>
          </div>
        </div>
      </div>

      {/* ── Navigation ── */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-1.5">
        
        {/* ── Dashboard ── */}
        <NavLink item={{ href: "/dashboard", label: "Dashboard", icon: <LayoutDashboard size={17} />, end: true }} active={pathname === "/dashboard"} onClick={onNavClick} collapsed={isCollapsed} />

        {/* ── Internal CRM staff nav — BRD Variant 1 order ── */}
        {!loading && user?.role !== "Customer" && user?.role !== "SuperAdmin" && (
          <>
            {/* 2. Leads */}
            <ExpandableNavSection label="Leads" icon={<Users size={17} />} subItems={leadSubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 3. Accounts */}
            <ExpandableNavSection label="Accounts" icon={<BookUser size={17} />} subItems={accountsSubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 4. Contacts */}
            <ExpandableNavSection label="Contacts" icon={<ContactRound size={17} />} subItems={contactsSubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 5. Activities */}
            <ExpandableNavSection label="Activities" icon={<Activity size={17} />} subItems={activitySubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 6. Tasks */}
            <ExpandableNavSection label="Tasks" icon={<ListTodo size={17} />} subItems={taskSubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 7. Follow Ups */}
            <ExpandableNavSection label="Follow Ups" icon={<CalendarClock size={17} />} subItems={followUpSubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 8. Sales Pipeline — V1 stages only */}
            <ExpandableNavSection label="Sales Pipeline" icon={<TrendingUp size={17} />} subItems={salesPipelineSubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 9. Deals */}
            <ExpandableNavSection label="Deals" icon={<Briefcase size={17} />} subItems={dealSubItems} pathname={pathname} onNavClick={onNavClick} />
            {/* 10. Reports */}
            <ExpandableNavSection label="Reports" icon={<PieChart size={17} />} subItems={reportsSubItems} pathname={pathname} onNavClick={onNavClick} />
          </>
        )}

        {/* ── SuperAdmin platform nav ── */}
        {!loading && user?.role === "SuperAdmin" && (
          <>
            <div className="pt-3 pb-1">
              <p className="nav-label px-3 text-[10px] font-bold text-white/30 uppercase tracking-widest overflow-hidden whitespace-nowrap">Platform Admin</p>
            </div>
            <NavLink item={{ href: "/admin/companies", label: "Companies", icon: <Building2 size={17} /> }} active={pathname.startsWith("/admin/companies")} onClick={onNavClick} collapsed={isCollapsed} />
            <NavLink item={{ href: "/admin/system-configs", label: "System Configs", icon: <Settings size={17} /> }} active={pathname.startsWith("/admin/system-configs")} onClick={onNavClick} collapsed={isCollapsed} />
          </>
        )}

        {/* ── Customer portal nav ── */}
        {!loading && user?.role === "Customer" && (
          <>
            <NavLink item={{ href: "/subscription", label: "My Subscriptions", icon: <Briefcase size={17} /> }} active={pathname.startsWith("/subscription")} onClick={onNavClick} collapsed={isCollapsed} />
            <NavLink item={{ href: "/customer/support", label: "Support Tickets", icon: <CheckSquare size={17} /> }} active={pathname.startsWith("/customer/support")} onClick={onNavClick} collapsed={isCollapsed} />
          </>
        )}

        {/* ── System Management (Admin/SalesManager) ── */}
        {!loading && ["Admin", "SalesManager"].includes(user?.role ?? "") && (
          <>
            <div className="pt-4 pb-2 border-t border-white/[0.06] mt-4">
              <p className="nav-label px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest overflow-hidden whitespace-nowrap">System Management</p>
            </div>
            <ExpandableNavSection label="User Management" icon={<Users size={17} />} subItems={userManagementSubItems} pathname={pathname} onNavClick={onNavClick} />
            <NavLink item={{ href: "/audit-logs", label: "Audit Logs", icon: <ShieldCheck size={17} /> }} active={pathname.startsWith("/audit-logs")} onClick={onNavClick} collapsed={isCollapsed} />
            <ExpandableNavSection label="Settings" icon={<Settings size={17} />} subItems={settingsSubItems} pathname={pathname} onNavClick={onNavClick} />
          </>
        )}

        {/* ── Notifications self-service — SalesExecutive ── */}
        {!loading && user?.role === "SalesExecutive" && (
          <>
            <div className="pt-4 pb-2 border-t border-white/[0.06] mt-4">
              <p className="nav-label px-3 text-[10px] font-bold text-white/40 uppercase tracking-widest overflow-hidden whitespace-nowrap">Settings</p>
            </div>
            <NavLink item={{ href: "/settings?tab=notifications", label: "Notifications", icon: <Settings size={17} /> }} active={pathname.startsWith("/settings")} onClick={onNavClick} collapsed={isCollapsed} />
          </>
        )}
      </nav>
    </div>
  );
}

// ─── Layout ───────────────────────────────────────────────────────────────────

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const [drawerOpen, setDrawerOpen] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);

  useEffect(() => {
    if (!loading && !user) router.push("/login");
  }, [user, loading, router]);

  useEffect(() => {
    const saved = localStorage.getItem("crm-sidebar-collapsed");
    if (saved === "true") setIsCollapsed(true);
  }, []);

  const toggleCollapse = () => {
    const next = !isCollapsed;
    setIsCollapsed(next);
    localStorage.setItem("crm-sidebar-collapsed", String(next));
  };

  useEffect(() => {
    setDrawerOpen(false);
  }, [pathname]);

  const handleLogout = async () => {
    try {
      await logoutAction();
      window.location.href = "/login";
    } catch (err) {
      console.error("Logout failed", err);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[var(--background)]">

      {/* ── Desktop Sidebar ── */}
      <aside
        className={cn("sidebar-container hidden md:flex shrink-0 flex-col h-full z-20 shadow-xl transition-[width] duration-300 ease-in-out group", isCollapsed ? "collapsed" : "")}
        style={{ width: isCollapsed ? "72px" : "240px", background: "var(--sidebar-bg)" }}
        role="navigation"
        aria-label="Main navigation"
      >
        <SidebarContent
          pathname={pathname}
          user={user}
          loading={loading}
          handleLogout={handleLogout}
          isCollapsed={isCollapsed}
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
        style={{ background: "var(--sidebar-bg)" }}
        className={cn(
          "fixed top-0 left-0 h-full w-[260px] flex flex-col z-50 md:hidden transition-transform duration-300 ease-in-out shadow-2xl",
          drawerOpen ? "translate-x-0" : "-translate-x-full",
        )}
      >
        <button
          onClick={() => setDrawerOpen(false)}
          className="absolute top-4 right-4 w-8 h-8 rounded-xl bg-white/10 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/20 transition-colors z-10"
        >
          <X size={16} />
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
        <DashboardHeader pageTitle="" user={user} setDrawerOpen={setDrawerOpen} toggleCollapse={toggleCollapse} isCollapsed={isCollapsed} />

        <div className="flex-1 overflow-auto p-4 md:px-5 lg:px-5 md:py-3 lg:py-3 pb-24 md:pb-6">
          {children}
        </div>

        {user && ["SalesExecutive", "SalesManager"].includes(user.role) && (
          <MobileBottomNav setDrawerOpen={setDrawerOpen} />
        )}
      </main>
    </div>
  );
}
