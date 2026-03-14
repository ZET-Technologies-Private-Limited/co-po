"use client";

import { useState, use } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Sparkles, Download, ArrowRight, AlertTriangle, CheckCircle2, TrendingUp, TrendingDown, Minus, Info, Lock, Target } from "lucide-react";
import { AttainmentBarChart } from "@/components/courses/AttainmentBarChart";
import { AttainmentTrendChart } from "@/components/courses/AttainmentTrendChart";
import Confetti from "react-dom-confetti";
import { spring, fadeSlideUp, staggerContainer } from "@/lib/animations";
import {
  COURSE_COS, AY_HISTORY, getTrend, getCurricularGaps,
  getAttainmentLevel, getCourseHealth, computePOAttainment, CO_PO_MAPPING
} from "@/lib/appData";
import Link from "next/link";
import { useAuthStore } from "@/lib/authStore";

export default function AttainmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { activeRole } = useAuthStore();
  const [exportState, setExportState] = useState<"idle" | "generating" | "complete">("idle");
  const [exportProgress, setExportProgress] = useState(0);
  const [activeTab, setActiveTab] = useState<"co" | "po" | "history">("co");

  const courseCOs = COURSE_COS[courseId] || [];
  const health = getCourseHealth(courseCOs.map(c => ({ pct: c.pct })));
  const ayHistory = AY_HISTORY[courseId] || [];
  const curricularGaps = getCurricularGaps(courseId);
  
  // Level 1 COs — auto-flagged per spec
  const level1COs = courseCOs.filter(c => getAttainmentLevel(c.pct).level === 1);

  // PO attainment from COs
  const poAttainment = computePOAttainment(courseCOs.map(c => ({ co: c.co, pct: c.pct })));

  // Trend chart data from AY history
  const trendChartData = ayHistory.map(ay => {
    const row: Record<string, string | number> = { year: `AY ${ay.ay}${ay.locked ? " 🔒" : " (Live)"}` };
    courseCOs.forEach(co => { row[co.co] = ay.cos[co.co] ?? 0; });
    return row;
  });

  const handleExport = () => {
    setExportState("generating");
    setExportProgress(10);
    setTimeout(() => setExportProgress(45), 800);
    setTimeout(() => setExportProgress(80), 1600);
    setTimeout(() => {
      setExportProgress(100);
      setExportState("complete");
      setTimeout(() => setExportState("idle"), 3000);
    }, 2400);
  };

  const confettiConfig = {
    angle: 90, spread: 360, startVelocity: 40, elementCount: 70, dragFriction: 0.12,
    duration: 3000, stagger: 3, width: "10px", height: "10px",
    colors: ["#0F172A", "#1D4ED8", "#06B6D4", "#7C3AED", "#059669"]
  };

  return (
    <div className="w-full min-h-screen pb-32 pt-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto flex flex-col gap-16">
        
        {/* ── HERO ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-brand" /> Analysis Mode
          </div>
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-6xl md:text-7xl font-display font-medium text-white leading-tight tracking-tight">
                CO Attainment<br />
                <span className="text-white/30">Dashboard.</span>
              </h1>
              <p className="text-xl text-white/50 font-light mt-6 max-w-xl">
                CIE × 0.40 + SEE × 0.60 · <span className="text-white font-medium">{courseId.toUpperCase()}</span>
              </p>
            </div>
            <div className="flex flex-col items-end gap-4 shrink-0">
              <div className="text-right">
                <span className="text-6xl font-mono font-light text-white">{health}%</span>
                <p className="text-xs font-mono text-white/30 uppercase tracking-widest mt-2">Aggregate Health</p>
              </div>
              <div className="relative">
                <motion.button
                  whileHover={exportState === "idle" ? { scale: 1.02 } : {}}
                  onClick={exportState === "idle" ? handleExport : undefined}
                  className={`relative overflow-hidden px-8 py-4 font-mono text-xs uppercase tracking-widest transition-all border ${
                    exportState === "complete" ? "border-attain text-attain" :
                    exportState === "generating" ? "border-white/10 text-white/40 cursor-wait" :
                    "border-white text-white hover:bg-white hover:text-black"
                  }`}
                >
                  {exportState === "idle" && <span className="flex items-center gap-2"><Download className="w-3 h-3" /> Export Report</span>}
                  {exportState === "generating" && (
                    <>
                      <div className="absolute inset-0 bg-white/5" style={{ width: `${exportProgress}%`, transition: "width 0.5s ease-out" }} />
                      <span className="relative z-10">Generating {exportProgress}%</span>
                    </>
                  )}
                  {exportState === "complete" && <span className="flex items-center gap-2"><CheckCircle2 className="w-3 h-3" /> Ready</span>}
                </motion.button>
                <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 pointer-events-none">
                  <Confetti active={exportState === "complete"} config={confettiConfig} />
                </div>
              </div>
            </div>
          </div>
        </motion.section>

        {/* ── LEVEL 1 ALERT STRIP ── */}
        <AnimatePresence>
          {level1COs.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex items-start gap-6 p-8 bg-alert/5 border border-alert/30"
            >
              <AlertTriangle className="w-5 h-5 text-alert mt-0.5 shrink-0 animate-pulse" />
              <div className="flex-1">
                <p className="text-alert font-mono text-xs uppercase tracking-widest mb-2">⚠ Critical: Level 1 Attainment Detected</p>
                <p className="text-white/70 font-light">
                  {level1COs.map(c => c.co).join(", ")} {level1COs.length === 1 ? "has" : "have"} fallen below 40%. 
                  University policy mandates a <strong className="text-white">Remedial Action Record</strong> before year-end locking.
                  Notification sent to Course Lead and HOD.
                </p>
              </div>
              <button className="shrink-0 px-6 py-3 border border-alert/40 text-alert text-xs font-mono uppercase tracking-widest hover:bg-alert hover:text-black transition-all">
                Log Remedial Action
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── CURRICULAR GAP ALERT ── */}
        <AnimatePresence>
          {curricularGaps.length > 0 && (
            <motion.div
              initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
              className="flex items-start gap-6 p-8 bg-white/[0.03] border border-brand/20"
            >
              <Info className="w-5 h-5 text-brand mt-0.5 shrink-0" />
              <div>
                <p className="text-brand font-mono text-xs uppercase tracking-widest mb-2">Curricular Gap Alert — Programme Committee Advisory</p>
                <p className="text-white/60 font-light text-sm leading-relaxed">
                  <strong className="text-white">{curricularGaps.join(", ")}</strong> {curricularGaps.length === 1 ? "has" : "have"} remained 
                  below the 60% threshold for 2 or more consecutive academic years. A structured curriculum review is recommended.
                </p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {/* ── TABS ── */}
        <motion.div variants={fadeSlideUp} className="flex border-b border-white/10">
          {[
            { id: "co", label: "CO Breakdown" },
            { id: "po", label: "PO / PSO Attainment", access: ["subject_lead", "department_head", "admin"] },
            { id: "history", label: "AY History & Trends" },
          ].filter(t => !t.access || !activeRole || t.access.includes(activeRole)).map(tab => (
            <button key={tab.id} onClick={() => setActiveTab(tab.id as any)}
              className={`px-8 py-5 text-xs font-mono uppercase tracking-widest transition-all ${
                activeTab === tab.id ? "border-b-2 border-white text-white" : "text-white/30 hover:text-white/60"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </motion.div>

        <AnimatePresence mode="wait">
          {/* ─── CO BREAKDOWN TAB ─── */}
          {activeTab === "co" && (
            <motion.div key="co" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-16">
              
              {/* CO List */}
              <div className="flex flex-col divide-y divide-white/10">
                {courseCOs.map((c, i) => {
                  const level = getAttainmentLevel(c.pct);
                  const isLevel1 = level.level === 1;
                  return (
                    <motion.div key={c.co} variants={fadeSlideUp}
                      className={`py-10 group transition-all flex flex-col gap-6 ${isLevel1 ? "pl-4 border-l-2 border-alert" : "hover:pl-4"}`}>
                      {/* Header row */}
                      <div className="flex flex-col md:flex-row md:items-center gap-8 md:gap-16">
                        <div className="w-16 shrink-0">
                          <span className="text-4xl font-mono font-light text-white/20 group-hover:text-white/40 transition-colors">{c.co}</span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <h3 className="text-xl font-display text-white mb-2 group-hover:text-brand transition-colors">{c.desc}</h3>
                          <div className="flex items-center gap-4 text-xs font-mono uppercase tracking-widest">
                            <span className="text-white/30">{c.bloomCode} – {c.bloom}</span>
                            <span className="text-white/20">·</span>
                            <span className={`px-2 py-1 ${level.bg} ${level.color} border border-current/20`}>{level.label}</span>
                            {isLevel1 && <span className="text-alert animate-pulse">⚠ Remedial Required</span>}
                          </div>
                        </div>
                        <div className="shrink-0 text-right">
                          <span className={`font-mono text-3xl font-light ${level.color}`}>{c.pct}%</span>
                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Final Attainment</p>
                        </div>
                      </div>
                      
                      {/* CIE + SEE split bars */}
                      <div className="flex flex-col gap-3 ml-20">
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-white/30 uppercase w-20 text-right">CIE 40%</span>
                          <div className="flex-1 h-[3px] bg-white/5 relative">
                            <motion.div className="absolute h-full left-0 bg-aurora" initial={{ width: 0 }}
                              whileInView={{ width: `${c.ciePct}%` }} viewport={{ once: true }} transition={{ duration: 1.2, delay: i * 0.05 }} />
                          </div>
                          <span className="text-xs font-mono text-white/40 w-12 text-right">{c.ciePct}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-white/30 uppercase w-20 text-right">SEE 60%</span>
                          <div className="flex-1 h-[3px] bg-white/5 relative">
                            <motion.div className={`absolute h-full left-0 ${c.seePct >= 60 ? "bg-attain" : c.seePct >= 40 ? "bg-brand" : "bg-alert"}`}
                              initial={{ width: 0 }} whileInView={{ width: `${c.seePct}%` }} viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: i * 0.05 + 0.2 }} />
                          </div>
                          <span className="text-xs font-mono text-white/40 w-12 text-right">{c.seePct}%</span>
                        </div>
                        <div className="flex items-center gap-4">
                          <span className="text-[10px] font-mono text-brand uppercase w-20 text-right">Final</span>
                          <div className="flex-1 h-[3px] bg-white/5 relative">
                            <motion.div className={`absolute h-full left-0 ${level.color.replace("text-", "bg-")}`}
                              initial={{ width: 0 }} whileInView={{ width: `${c.pct}%` }} viewport={{ once: true }}
                              transition={{ duration: 1.2, delay: i * 0.05 + 0.4 }} />
                          </div>
                          <span className={`text-sm font-mono font-medium w-12 text-right ${level.color}`}>{c.pct}%</span>
                        </div>
                      </div>
                    </motion.div>
                  );
                })}
              </div>

              {/* AI Narrative */}
              <div className="flex items-start gap-8 py-10 px-10 bg-white/[0.03] border border-white/10">
                <Sparkles className="w-6 h-6 text-brand shrink-0 mt-1" />
                <div>
                  <p className="text-xs font-mono text-brand uppercase tracking-widest mb-3">AI Narrative</p>
                  <p className="text-xl font-light text-white/80 leading-relaxed max-w-4xl">
                    {level1COs.length > 0
                      ? `${level1COs.map(c => c.co).join(" and ")} require immediate intervention — currently below the 40% attainment floor. CO2 remains the strongest performer at ${courseCOs.find(c => c.co === "CO2")?.pct ?? "–"}%. CIE performance is consistently 7–10% ahead of SEE, suggesting strong internal preparation but exam-hall challenges.`
                      : `All Course Outcomes are above the 40% minimum threshold. CO3 is the weakest performer — consider additional practice sessions for SQL and relational algebra before the next assessment cycle.`
                    }
                  </p>
                </div>
              </div>
            </motion.div>
          )}

          {/* ─── PO/PSO TAB ─── */}
          {activeTab === "po" && (
            <motion.div key="po" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-12">
              <div>
                <h2 className="text-3xl font-display text-white mb-2">Program Outcome Attainment</h2>
                <p className="text-white/40 font-light">Computed via: PO % = Σ(CO_att × weight) / Σ(weights)</p>
              </div>
              <div className="flex flex-col divide-y divide-white/10">
                {Object.entries(poAttainment)
                  .sort(([a], [b]) => a.localeCompare(b))
                  .map(([po, data]) => {
                    const level = getAttainmentLevel(data.pct);
                    return (
                      <div key={po} className="py-8 group hover:pl-2 transition-all">
                        <div className="flex items-center justify-between gap-8 mb-4">
                          <div className="flex items-center gap-6">
                            <span className="text-2xl font-mono font-light text-white/30 w-16">{po}</span>
                            <span className={`px-2 py-1 text-[10px] font-mono uppercase tracking-widest ${level.bg} ${level.color} border border-current/20`}>{level.label}</span>
                          </div>
                          <span className={`font-mono text-2xl font-light ${level.color}`}>{data.pct}%</span>
                        </div>
                        {/* CO contribution breakdown */}
                        <div className="ml-22 flex flex-wrap gap-3">
                          {data.contributions.map(contrib => (
                            <span key={contrib.co} className="text-[10px] font-mono text-white/30 bg-white/5 px-3 py-1.5">
                              {contrib.co} × {contrib.weight} = <span className="text-white/60">{Math.round(contrib.coAtt * contrib.weight)}</span>
                            </span>
                          ))}
                        </div>
                      </div>
                    );
                  })
                }
              </div>
            </motion.div>
          )}

          {/* ─── AY HISTORY TAB ─── */}
          {activeTab === "history" && (
            <motion.div key="history" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex flex-col gap-12">
              <div>
                <h2 className="text-3xl font-display text-white mb-2">Academic Year History</h2>
                <p className="text-white/40 font-light flex items-center gap-2">
                  <Lock className="w-3.5 h-3.5" /> AY-1 and AY-2 are locked and read-only. Current AY updates live as marks are committed.
                </p>
              </div>

              {/* 3-year CO trend table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-white/10">
                      <th className="text-left py-4 text-xs font-mono text-white/40 uppercase tracking-widest pr-8">CO</th>
                      {ayHistory.map(ay => (
                        <th key={ay.ay} className={`text-center py-4 text-xs font-mono uppercase tracking-widest px-6 ${ay.locked ? "text-white/30" : "text-brand"}`}>
                          {ay.ay} {ay.locked ? "🔒" : "● Live"}
                        </th>
                      ))}
                      <th className="text-center py-4 text-xs font-mono text-white/40 uppercase tracking-widest px-6">Trend</th>
                    </tr>
                  </thead>
                  <tbody>
                    {courseCOs.map(co => {
                      const vals = ayHistory.map(ay => ay.cos[co.co] ?? 0);
                      const trend = vals.length >= 2 ? getTrend(vals[vals.length - 1], vals[vals.length - 2]) : null;
                      const isGap = curricularGaps.includes(co.co);
                      return (
                        <tr key={co.co} className={`border-b border-white/5 ${isGap ? "bg-brand/5" : "hover:bg-white/[0.02]"} transition-colors`}>
                          <td className="py-5 pr-8">
                            <span className="font-mono text-white/60 text-sm">{co.co}</span>
                            {isGap && <span className="ml-3 text-[10px] font-mono text-brand uppercase tracking-widest">Gap Alert</span>}
                          </td>
                          {vals.map((v, i) => {
                            const l = getAttainmentLevel(v);
                            const ay = ayHistory[i];
                            return (
                              <td key={i} className={`py-5 px-6 text-center ${ay.locked ? "opacity-60" : ""}`}>
                                <span className={`font-mono text-lg ${l.color}`}>{v}%</span>
                                <br />
                                <span className={`text-[10px] font-mono uppercase ${l.color}`}>{l.label}</span>
                              </td>
                            );
                          })}
                          <td className="py-5 px-6 text-center">
                            {trend && (
                              <span className={`text-xl font-mono ${trend.color}`} title={trend.label}>
                                {trend.arrow}
                              </span>
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Trend chart */}
              <div className="pt-8 border-t border-white/10">
                <h3 className="text-xl font-display text-white mb-4">Multi-Year CO Trajectory</h3>
                <div className="h-[320px]">
                  <AttainmentTrendChart data={trendChartData as any} />
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
