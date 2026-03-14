"use client";

import Link from "next/link";
import { useEffect } from "react";
import { AIOrb } from "@/components/ai/AIOrb";
import { DemoPanel } from "@/components/demo/DemoPanel";
import { ToastContainer } from "@/components/ui/ToastContainer";
import { NotificationsPanel } from "@/components/ui/NotificationsPanel";
import { GlobalSearch } from "@/components/ui/GlobalSearch";
import { useUIStore } from "@/lib/uiStore";
import { useAuthStore, Role } from "@/lib/authStore";
import {
  LayoutDashboard, BookOpen, BarChart3, FileText, Bot, Users, Settings, Bell, Search, Presentation, Layers, Award
} from "lucide-react";

// Define specific navbar items for each role to ensure distinct experiences
const ROLE_NAV_CONFIG: Record<Role, { href: string; label: string; icon: any }[]> = {
  admin: [
    { href: "/dashboard", label: "System Hub", icon: LayoutDashboard },
    { href: "/admin/academic-year", label: "AY Config", icon: Settings },
    { href: "/admin/thresholds", label: "Thresholds", icon: BarChart3 },
    { href: "/admin/co-library", label: "CO Library", icon: BookOpen },
    { href: "/admin/users", label: "Users", icon: Users },
    { href: "/admin/audit-log", label: "Audit Trail", icon: FileText },
  ],
  department_head: [
    { href: "/dashboard", label: "Dept Hub", icon: LayoutDashboard },
    { href: "/hod/co-attainment", label: "Dept Attainment", icon: BarChart3 },
    { href: "/hod/po-pso-attainment", label: "PO/PSO Matrix", icon: Layers },
    { href: "/hod/ay-history", label: "AY History", icon: FileText },
  ],
  subject_lead: [
    { href: "/dashboard", label: "Coordinator Hub", icon: LayoutDashboard },
    { href: "/lead/marks-approval", label: "Queue", icon: BookOpen },
    { href: "/lead/co-attainment", label: "CO Tracking", icon: BarChart3 },
    { href: "/lead/po-attainment", label: "PO Tracking", icon: Layers },
  ],
  faculty: [
    { href: "/dashboard", label: "My Hub", icon: LayoutDashboard },
    { href: "/chatbot", label: "AI Generator", icon: Bot },
  ],
  student: [
    { href: "/dashboard", label: "My Hub", icon: LayoutDashboard },
  ]
};

function GlobalKeyBindings() {
  const { openSearch, openNotif } = useUIStore();

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") { e.preventDefault(); openSearch(); }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [openSearch]);

  return null;
}

export default function AppLayout({ children }: { children: React.ReactNode }) {
  const { openNotif, notifications, openSearch } = useUIStore();
  const { activeRole, user } = useAuthStore();
  const unread = notifications.filter(n => !n.read).length;

  // Retrieve distinct navigation items based on the active role
  const visibleNavItems = activeRole ? ROLE_NAV_CONFIG[activeRole] : ROLE_NAV_CONFIG["faculty"];

  return (
    <div className="min-h-screen bg-cosmic text-white flex flex-col">
      <GlobalKeyBindings />
      <AIOrb />
      <DemoPanel />
      <ToastContainer />
      <NotificationsPanel />
      <GlobalSearch />

      {/* Top Navigation */}
      <header className="sticky top-0 z-40 bg-cosmic/95 backdrop-blur-xl border-b border-white/5 h-16 flex items-center px-8 justify-between">
        <Link href="/dashboard" className="font-display font-bold text-xl tracking-wide flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-aurora flex items-center justify-center">
            <span className="text-white text-xs font-bold">N</span>
          </div>
          Nexus<span className="text-white/40">Engine</span>
        </Link>

        {/* Dynamic Role-Based Navigation */}
        <nav className="hidden md:flex gap-0 text-sm font-mono flex-1 ml-10">
          {visibleNavItems.map(item => (
            <Link key={item.href} href={item.href}
              className="flex items-center gap-1.5 px-3 py-5 text-white/50 hover:text-white transition-colors border-b-2 border-transparent hover:border-white/30 uppercase tracking-widest">
              <item.icon className="w-3.5 h-3.5" />
              {item.label}
            </Link>
          ))}
        </nav>

        <div className="flex items-center gap-2">
          {/* CMD+K Search */}
          <button onClick={openSearch}
            className="hidden sm:flex items-center gap-2 px-3 py-1.5 border border-white/10 text-white/30 hover:text-white hover:border-white/30 transition-colors font-mono text-xs">
            <Search className="w-3 h-3" />
            Search
            <kbd className="text-[9px] border border-white/10 px-1.5 py-0.5">⌘K</kbd>
          </button>

          {/* Notifications */}
          <button onClick={openNotif}
            className="relative p-2 text-white/40 hover:text-white transition-colors">
            <Bell className="w-5 h-5" />
            {unread > 0 && (
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-brand" />
            )}
          </button>

          {/* Live badge */}
          <Link href="/presentation"
            className="px-3 py-1.5 rounded-full bg-brand/10 border border-brand/30 text-brand text-xs font-mono uppercase flex items-center gap-1 hover:bg-brand/20 transition-colors">
            <span className="w-1.5 h-1.5 rounded-full bg-brand animate-pulse" />
            Live
          </Link>

          {/* Unified Identity Profile */}
          <div className="flex items-center gap-3 ml-4 pl-4 border-l border-white/10">
             <div className="flex flex-col text-right hidden sm:flex">
                <span className="text-sm font-medium text-white">{user?.name || "Anonymous"}</span>
                <span className="text-[9px] font-mono uppercase tracking-widest text-brand">{activeRole?.replace('_', ' ')}</span>
             </div>
             <div className="w-8 h-8 rounded bg-white/5 border border-white/10 flex items-center justify-center text-white/80 text-sm font-display cursor-pointer hover:border-brand hover:bg-brand/10 transition-colors">
               {user?.name?.[0] || "?"}
             </div>
          </div>
        </div>
      </header>

      <main className="flex-1 w-full px-8 py-8">
        {children}
      </main>
    </div>
  );
}
