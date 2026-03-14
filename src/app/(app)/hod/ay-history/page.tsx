"use client";

import { motion } from "framer-motion";
import { 
  TrendingUp, TrendingDown, Minus, 
  History, BarChart2, Filter, Download,
  ChevronRight, AlertCircle
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK HISTORY DATA (Spec-aligned) ───────────────────────────────────
const TREND_DATA = [
  { co: "CS301-CO1", name: "ER Modeling", ay22: 82, ay23: 84, ay24: 85, trend: "up" },
  { co: "CS301-CO2", name: "SQL Queries", ay22: 65, ay23: 68, ay24: 72, trend: "up" },
  { co: "CS301-CO3", name: "Indexing", ay22: 38, ay23: 42, ay24: 45, trend: "stagnant" },
  { co: "CS303-CO2", name: "CPU Scheduling", ay22: 35, ay23: 32, ay24: 30, trend: "down" },
];

export default function HODAYHistoryPage() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <h1 className="text-4xl font-display text-white mb-2">3-Year Academic History</h1>
        <p className="text-white/40 font-light">Departmental Trend Analysis & Attainment Continuity</p>
      </motion.div>

      {/* ── FILTERS ── */}
      <motion.div variants={fadeSlideUp} className="flex gap-4 mb-12">
        <div className="flex-1 flex gap-2">
           <button className="px-4 py-2 border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40">Semester 5</button>
           <button className="px-4 py-2 border border-white/10 bg-white/5 text-[10px] font-mono uppercase tracking-widest text-white/40">Regulation 2021</button>
        </div>
        <button className="px-6 py-2 border border-brand/30 text-brand text-[10px] font-mono uppercase tracking-widest hover:bg-brand hover:text-white transition-all flex items-center gap-2">
          <Download className="w-3.5 h-3.5" /> Export Trend XLSX
        </button>
      </motion.div>

      {/* ── TREND TABLE (Spec: HOD Page 4) ── */}
      <motion.section variants={fadeSlideUp} className="border border-white/10 overflow-hidden">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-white/[0.03] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Course Outcome</th>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">AY 2022-23</th>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">AY 2023-24</th>
              <th className="px-6 py-4 text-white/40 uppercase tracking-widest font-bold">AY 2024-25 (Live)</th>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal text-right">Trend</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5 font-light">
            {TREND_DATA.map((row, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-6">
                  <p className="text-white font-medium">{row.co}</p>
                  <p className="text-[10px] text-white/20 mt-1">{row.name}</p>
                </td>
                <td className="px-6 py-6 text-white/40">{row.ay22}%</td>
                <td className="px-6 py-6 text-white/40">{row.ay23}%</td>
                <td className="px-6 py-6">
                   <div className="flex items-center gap-3">
                      <span className={`font-bold ${row.ay24 < 40 ? 'text-alert' : 'text-white'}`}>{row.ay24}%</span>
                      {row.ay24 < 40 && <AlertCircle className="w-3 h-3 text-alert" />}
                   </div>
                </td>
                <td className="px-6 py-6 text-right">
                   <div className="flex items-center justify-end gap-2">
                      {row.trend === 'up' ? (
                        <>
                          <span className="text-attain text-[10px] uppercase">Improving</span>
                          <TrendingUp className="w-4 h-4 text-attain" />
                        </>
                      ) : row.trend === 'down' ? (
                        <>
                          <span className="text-alert text-[10px] uppercase">Declining</span>
                          <TrendingDown className="w-4 h-4 text-alert" />
                        </>
                      ) : (
                        <>
                          <span className="text-white/20 text-[10px] uppercase">Stable</span>
                          <Minus className="w-4 h-4 text-white/20" />
                        </>
                      )}
                   </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </motion.section>

      {/* ── CONSECUTIVE LEVEL 1 FLAG (Spec: Page 4) ── */}
      <motion.section variants={fadeSlideUp} className="mt-16 p-8 border border-alert/20 bg-alert/[0.02] flex flex-col gap-6">
         <div className="flex justify-between items-start">
            <div>
              <h3 className="text-sm font-display text-alert uppercase tracking-widest mb-2 flex items-center gap-2">
                <AlertCircle className="w-4 h-4" /> Consecutive Level 1 Flag
              </h3>
              <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.2em]">Target: Courses showing L1 attainment for 2+ years</p>
            </div>
            <Link href="/hod/department-report" className="px-4 py-2 bg-alert/10 border border-alert/30 text-alert text-[10px] font-mono uppercase tracking-widest hover:bg-alert hover:text-white transition-all">
               Generate Gap Analysis Report
            </Link>
         </div>
         
         <div className="grid md:grid-cols-2 gap-4">
            <div className="p-6 border border-white/5 bg-white/[0.02] flex flex-col gap-2">
               <p className="text-white/70 text-sm italic font-medium">CS303 (OS) — CO2: CPU Scheduling</p>
               <p className="text-[10px] font-mono text-white/30">Failed to meet threshold for <span className="text-alert">3 years</span></p>
               <div className="mt-4 flex gap-4 text-[9px] font-mono text-white/20">
                  <span>22-23: 35%</span>
                  <span>23-24: 32%</span>
                  <span>24-25: 30%</span>
               </div>
            </div>
            <div className="p-6 border border-white/5 bg-white/[0.02] flex flex-col gap-2">
               <p className="text-white/70 text-sm italic font-medium">CS301 (DBMS) — CO3: Indexing</p>
               <p className="text-[10px] font-mono text-white/30">Persistent L1/L2 borderline (<span className="text-amber-500">2 years</span>)</p>
               <div className="mt-4 flex gap-4 text-[9px] font-mono text-white/20">
                  <span>23-24: 42%</span>
                  <span>24-25: 45%</span>
               </div>
            </div>
         </div>
      </motion.section>

    </motion.div>
  );
}
