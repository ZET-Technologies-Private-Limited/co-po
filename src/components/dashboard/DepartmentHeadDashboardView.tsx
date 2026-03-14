"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Building2, Activity, PieChart, TrendingUp, 
  ChevronRight, AlertTriangle, FileText, Lock,
  CheckCircle2, AlertCircle, BarChart3
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// ─── MOCK HOD DATA (Spec-aligned) ──────────────────────────────────────
const DEPT_STATS = [
  { label: "Total Courses", val: "24", sub: "118/120 COs Gen.", icon: Building2 },
  { label: "Marks Approved", val: "85%", sub: "11 Courses Pending", icon: CheckCircle2 },
  { label: "Level 1 COs", val: "6", sub: "Action Required", icon: AlertCircle, color: "text-alert" },
  { label: "Avg PO Attain", val: "72%", sub: "Target: 70%", icon: BarChart3 },
];

const HEAT_MAP_DATA = [
  { course: "CS301", cos: ["L3", "L3", "L1", "L3", "L3"] },
  { course: "CS302", cos: ["L3", "L2", "L3", "L1", "—"] },
  { course: "CS303", cos: ["L2", "L1", "L2", "L3", "L2"] },
  { course: "CS304", cos: ["L3", "L3", "L3", "L2", "L3"] },
  { course: "CS305", cos: ["L2", "L2", "L1", "L3", "L2"] },
  { course: "CS306", cos: ["L3", "L3", "L3", "L3", "L3"] },
];

export function DepartmentHeadDashboardView() {
  const { user } = useAuthStore();

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-16 pb-32">
      
      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm font-mono text-orange-400 uppercase tracking-widest">
          <span className="w-8 h-[1px] bg-orange-400" /> Department Administration
        </div>
        <div className="flex justify-between items-end">
          <div>
            <h1 className="text-5xl font-display text-white">
              HOD Overview: <span className="text-white/40">{user?.name?.split(" ")[0]}</span>
            </h1>
            <p className="text-white/40 font-light mt-3">
               Head of Department · Computer Science & Engineering
            </p>
          </div>
          <Link href="/hod/year-end-lock" 
            className="px-6 py-3 border border-orange-400/30 text-orange-400 text-[10px] font-mono uppercase tracking-widest hover:bg-orange-400 hover:text-white transition-all flex items-center gap-2"
          >
            <Lock className="w-3.5 h-3.5" /> Year-End Lock
          </Link>
        </div>
      </motion.section>

      {/* ── DEPT SUMMARY CARDS (Spec: Page 1) ── */}
      <motion.section variants={fadeSlideUp} className="grid md:grid-cols-4 gap-4">
        {DEPT_STATS.map((stat, i) => (
          <div key={i} className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{stat.label}</p>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color || 'text-orange-400'}`} />
            </div>
            <p className={`text-2xl font-mono ${stat.color || 'text-white'}`}>{stat.val}</p>
            <p className="text-[9px] text-white/20 font-mono mt-1">{stat.sub}</p>
          </div>
        ))}
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-16">
        
        {/* ── CO HEALTH HEAT MAP (Spec: HOD Page 1 Heat Map) ── */}
        <motion.section variants={fadeSlideUp} className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex justify-between items-center">
            <h2 className="text-lg font-display text-white flex items-center gap-3">
              <Activity className="w-4 h-4 text-orange-400" /> CO Health heatmap
            </h2>
            <div className="flex gap-4">
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/20">
                <div className="w-2 h-2 bg-attain" /> L3
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/20">
                <div className="w-2 h-2 bg-amber-500" /> L2
              </div>
              <div className="flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-widest text-white/20">
                <div className="w-2 h-2 bg-alert" /> L1
              </div>
            </div>
          </div>

          <div className="border border-white/10 p-8 overflow-x-auto">
             <div className="min-w-[500px] flex flex-col gap-2">
                <div className="flex border-b border-white/10 pb-4 mb-2">
                   <div className="w-24 shrink-0 font-mono text-[10px] text-white/20 uppercase">Course</div>
                   <div className="flex-1 flex justify-around">
                      {["CO1", "CO2", "CO3", "CO4", "CO5"].map(c => (
                        <div key={c} className="w-10 text-center font-mono text-[10px] text-white/20">{c}</div>
                      ))}
                   </div>
                </div>
                {HEAT_MAP_DATA.map(row => (
                  <div key={row.course} className="flex items-center group">
                     <div className="w-24 shrink-0 font-mono text-xs text-white/50 group-hover:text-white transition-colors">{row.course}</div>
                     <div className="flex-1 flex justify-around">
                        {row.cos.map((level, i) => (
                          <div 
                            key={i} 
                            className={`w-10 h-10 border border-white/5 flex items-center justify-center text-[10px] font-mono transition-all transform hover:scale-105 cursor-pointer ${
                              level === 'L3' ? 'bg-attain/20 text-attain border-attain/30' :
                              level === 'L2' ? 'bg-amber-500/20 text-amber-500 border-amber-500/30' :
                              level === 'L1' ? 'bg-alert/20 text-alert border-alert/30' :
                              'text-white/10 bg-white/[0.02]'
                            }`}
                          >
                            {level}
                          </div>
                        ))}
                     </div>
                  </div>
                ))}
             </div>
          </div>
        </motion.section>

        {/* ── CURRICULAR GAPS & FACULTY PROGRESS (Spec widgets) ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-12">
          
          {/* Curricular Gaps */}
          <div>
            <h3 className="text-sm font-display text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
              <AlertTriangle className="w-4 h-4 text-alert" /> Curricular Gaps
            </h3>
            <div className="flex flex-col gap-3">
              <div className="p-4 border border-alert/20 bg-alert/[0.02]">
                <p className="text-[10px] font-mono text-alert uppercase tracking-widest mb-1">Persistent L1 Outcome</p>
                <p className="text-xs text-white/70">CS303 (OS) CO2 has been Level 1 for 2 consecutive years.</p>
                <Link href="/hod/ay-history" className="text-[9px] font-mono text-white/20 uppercase mt-3 block hover:text-white">Trend Analysis →</Link>
              </div>
              <div className="p-4 border border-white/5 bg-white/[0.01]">
                <p className="text-xs text-white/40 italic">No other critical gaps detected.</p>
              </div>
            </div>
          </div>

          {/* AY Progress Mini Chart */}
          <div>
            <h3 className="text-sm font-display text-white mb-6 uppercase tracking-[0.2em] flex items-center gap-2">
              <TrendingUp className="w-4 h-4 text-orange-400" /> Dept attainment trend
            </h3>
            <div className="h-40 border border-white/10 bg-white/[0.02] flex items-end p-6 gap-4">
              <div className="flex-1 flex flex-col gap-2 items-center">
                 <div className="w-full bg-white/10 h-24 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-orange-400/40 h-[68%]" />
                 </div>
                 <span className="text-[9px] font-mono text-white/30 uppercase">AY 22-23</span>
              </div>
              <div className="flex-1 flex flex-col gap-2 items-center">
                 <div className="w-full bg-white/10 h-24 relative overflow-hidden">
                    <div className="absolute bottom-0 w-full bg-orange-400/40 h-[72%]" />
                 </div>
                 <span className="text-[9px] font-mono text-white/30 uppercase">AY 23-24</span>
              </div>
              <div className="flex-1 flex flex-col gap-2 items-center animate-pulse">
                 <div className="w-full bg-orange-400/10 h-24 relative overflow-hidden ring-1 ring-orange-400/30">
                    <div className="absolute bottom-0 w-full bg-orange-400/80 h-[75%]" />
                 </div>
                 <span className="text-[9px] font-mono text-orange-400 uppercase">AY 24-25</span>
              </div>
            </div>
          </div>

        </motion.section>
      </div>

    </motion.div>
  );
}
