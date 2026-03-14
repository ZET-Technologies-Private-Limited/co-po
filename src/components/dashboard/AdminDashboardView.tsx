"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Shield, Users, Calendar, Settings, 
  Activity, Database, AlertCircle,
  CheckCircle2, Clock, BarChart3, Lock
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// ─── MOCK ADMIN DATA (Spec-aligned) ──────────────────────────────────────
const SYSTEM_STATS = [
  { label: "Active Users", val: "142", sub: "12 Online Now", icon: Users },
  { label: "Pending Approvals", val: "11", sub: "Across 4 Departments", icon: Clock },
  { label: "AY 2024-25", val: "Active", sub: "Lock Date: 30 June", icon: Calendar, color: "text-brand" },
  { label: "System Health", val: "99.9%", sub: "Last Backup: 4h ago", icon: Shield, color: "text-attain" },
];

const DEPT_OVERVIEW = [
  { dept: "Computer Science", coGen: 98, marksAppr: 88, poAvg: 72 },
  { dept: "Electronics", coGen: 85, marksAppr: 72, poAvg: 68 },
  { dept: "Mechanical", coGen: 92, marksAppr: 95, poAvg: 75 },
];

export function AdminDashboardView() {
  const { user } = useAuthStore();

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-16 pb-32">
      
      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm font-mono text-alert uppercase tracking-widest">
          <span className="w-8 h-[1px] bg-alert" /> System Administrator
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-display text-white">
              Admin Hub: <span className="text-white/40">{user?.name?.split(" ")[0]}</span>
            </h1>
            <p className="text-white/40 font-light mt-3">
               University Edition · All Departments Portfolio
            </p>
          </div>
          <div className="flex gap-4">
             <Link href="/admin/thresholds" className="px-6 py-3 border border-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest hover:border-brand hover:text-brand transition-all flex items-center gap-2">
               <Settings className="w-3.5 h-3.5" /> Thresholds
             </Link>
          </div>
        </div>
      </motion.section>

      {/* ── SYSTEM STATUS CARDS (Spec: Admin Page 1) ── */}
      <motion.section variants={fadeSlideUp} className="grid md:grid-cols-4 gap-4">
        {SYSTEM_STATS.map((stat, i) => (
          <div key={i} className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{stat.label}</p>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color || 'text-alert'}`} />
            </div>
            <p className={`text-2xl font-mono ${stat.color || 'text-white'}`}>{stat.val}</p>
            <p className="text-[9px] text-white/20 font-mono mt-1">{stat.sub}</p>
          </div>
        ))}
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-16">
        
        {/* ── DEPARTMENT OVERVIEW (Spec: Admin Page 1 table) ── */}
        <motion.section variants={fadeSlideUp} className="lg:col-span-2 flex flex-col gap-8">
           <h2 className="text-lg font-display text-white flex items-center gap-3">
             <Database className="w-4 h-4 text-alert" /> Institutional Data Overview
           </h2>
           <div className="border border-white/10 overflow-hidden">
             <table className="w-full text-left font-mono text-[10px]">
               <thead className="bg-white/[0.03] border-b border-white/10">
                 <tr>
                   <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Department</th>
                   <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">CO Gen %</th>
                   <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Marks Appr %</th>
                   <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Avg PO %</th>
                 </tr>
               </thead>
               <tbody className="divide-y divide-white/5">
                 {DEPT_OVERVIEW.map((d, i) => (
                   <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                     <td className="px-6 py-5 text-white/70 font-display text-sm">{d.dept}</td>
                     <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-alert" style={{ width: `${d.coGen}%` }} />
                           </div>
                           <span className="text-white/40">{d.coGen}%</span>
                        </div>
                     </td>
                     <td className="px-6 py-5">
                        <div className="flex items-center gap-3">
                           <div className="w-12 h-1 bg-white/5 rounded-full overflow-hidden">
                              <div className="h-full bg-attain" style={{ width: `${d.marksAppr}%` }} />
                           </div>
                           <span className="text-white/40">{d.marksAppr}%</span>
                        </div>
                     </td>
                     <td className="px-6 py-5 font-bold text-white">{d.poAvg}%</td>
                   </tr>
                 ))}
               </tbody>
             </table>
           </div>
        </motion.section>

        {/* ── AUDIT FEED (Spec widget) ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
           <h2 className="text-[10px] font-mono text-white/20 uppercase tracking-[0.2em] flex items-center gap-2">
             <Activity className="w-4 h-4" /> Activity Log
           </h2>
           <div className="flex flex-col gap-4">
              {[
                { event: "AY Roll-over simulation", time: "10 mins ago", user: "Admin (Self)" },
                { event: "HOD Sign-off: CSE 2024-25", time: "1h ago", user: "Dr. K. Sharma" },
                { event: "Security Audit: Marks override detected", time: "4h ago", user: "System" },
                { event: "New Lead Provisioned: CS Sub Group", time: "yesterday", user: "Admin (Self)" }
              ].map((ev, i) => (
                <div key={i} className="p-4 bg-white/[0.01] border-l-2 border-alert flex flex-col gap-1">
                  <p className="text-xs text-white/70">{ev.event}</p>
                  <p className="text-[9px] font-mono text-white/20 uppercase">{ev.time} · {ev.user}</p>
                </div>
              ))}
              <button className="text-[9px] font-mono text-white/20 mt-4 uppercase tracking-widest hover:text-white transition-colors">View Institutional Audit Trail →</button>
           </div>
        </motion.section>
      </div>

    </motion.div>
  );
}
