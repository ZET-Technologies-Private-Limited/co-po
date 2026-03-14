"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { RadarChart, PolarGrid, PolarAngleAxis, Radar, ResponsiveContainer, Tooltip, Legend } from "recharts";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { Network, ArrowRight, Info, CheckCircle2, TrendingUp, Sparkles } from "lucide-react";

const PO_DATA = [
  { po: "PO1", name: "Engineering Knowledge", current: 78, prev: 71, status: "Met" },
  { po: "PO2", name: "Problem Analysis", current: 65, prev: 60, status: "Met" },
  { po: "PO3", name: "Design / Dev of Solutions", current: 80, prev: 74, status: "Exceeded" },
  { po: "PO4", name: "Conduct Investigations", current: 58, prev: 52, status: "Below" },
  { po: "PO5", name: "Modern Tool Usage", current: 82, prev: 78, status: "Exceeded" },
  { po: "PO6", name: "The Engineer & Society", current: 70, prev: 65, status: "Met" },
  { po: "PO7", name: "Ethics", current: 55, prev: 50, status: "Below" },
  { po: "PO8", name: "Communication", current: 73, prev: 68, status: "Met" },
];

const PSO_DATA = [
  { pso: "PSO1", name: "Applied Computing", value: 74, contributions: ["CO1 (35%)", "CO2 (40%)", "CO3 (25%)"] },
  { pso: "PSO2", name: "System Design", value: 68, contributions: ["CO3 (30%)", "CO4 (40%)", "CO5 (30%)"] },
  { pso: "PSO3", name: "Professional Practice", value: 81, contributions: ["CO5 (50%)", "CO6 (50%)"] },
];

const THRESHOLD = 60;

export default function POAttainmentPage({ params }: { params: { id: string } }) {
  const [tab, setTab] = useState<"po" | "pso">("po");

  return (
    <div className="w-full min-h-screen pb-32 pt-4">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto flex flex-col gap-20">
        
        {/* ── HERO SECTION ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <div className="flex items-center gap-3 text-sm font-mono text-aurora uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-aurora" /> Outcome Linkage
          </div>
          <div className="flex items-end justify-between flex-wrap gap-8">
            <div className="flex-1 min-w-[300px]">
              <h1 className="text-6xl md:text-7xl font-display font-medium text-white leading-tight tracking-tight">
                Program<br />
                <span className="text-white/30">Attainment.</span>
              </h1>
              <p className="text-xl text-white/50 font-light mt-6 max-w-xl">
                 Mapping course contributions to <span className="text-white">POs and PSOs</span> for graduation qualification.
              </p>
            </div>
            <div className="shrink-0 flex items-center gap-8 bg-white/[0.03] border border-white/10 px-8 py-6">
               <div className="text-right">
                  <p className="text-3xl font-mono text-white">88%</p>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Correlation Index</p>
               </div>
               <div className="w-[1px] h-10 bg-white/10" />
               <div className="text-right">
                  <p className="text-3xl font-mono text-attain">85%</p>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Goal Alignment</p>
               </div>
            </div>
          </div>
        </motion.section>

        {/* ── TAB BAR ── */}
        <motion.section variants={fadeSlideUp} className="flex border-b border-white/10">
          {[["po", "Program Outcomes"], ["pso", "Program Specific"]].map(([id, label]) => (
            <button key={id} onClick={() => setTab(id as any)}
              className={`px-8 py-5 text-xs font-mono uppercase tracking-widest transition-all ${tab === id ? "border-b-2 border-white text-white" : "text-white/30 hover:text-white/60"}`}>
              {label}
            </button>
          ))}
        </motion.section>

        <AnimatePresence mode="wait">
          {tab === "po" && (
            <motion.section key="po" initial={{ opacity: 0, scale: 0.98 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.98 }}
              className="flex flex-col gap-24">
              
              <div className="flex flex-col lg:flex-row gap-24 items-center">
                {/* RADAR CHART (Heroic size) */}
                <div className="flex-1 w-full min-h-[450px] relative">
                   <div className="absolute inset-0 bg-gradient-to-tr from-brand/5 via-transparent to-aurora/5 pointer-events-none" />
                   <ResponsiveContainer width="100%" height={450}>
                     <RadarChart data={PO_DATA.map(d => ({ subject: d.po, current: d.current, previous: d.prev }))}>
                       <PolarGrid stroke="rgba(255,255,255,0.05)" />
                       <PolarAngleAxis dataKey="subject" tick={{ fill: "rgba(255,255,255,0.3)", fontSize: 13, fontFamily: "Geist Mono" }} />
                       <Radar name="Current Period" dataKey="current" stroke="#06B6D4" fill="#06B6D4" fillOpacity={0.15} />
                       <Radar name="Benchmark Period" dataKey="previous" stroke="rgba(255,255,255,0.2)" fill="transparent" strokeDasharray="6 4" />
                       <Tooltip contentStyle={{ background: '#0D1829', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '4px', fontFamily: "Geist Mono" }} />
                       <Legend wrapperStyle={{ paddingTop: "40px", fontSize: "11px", textTransform: "uppercase", letterSpacing: "0.1em", color: "#64748b" }} />
                     </RadarChart>
                   </ResponsiveContainer>
                </div>

                {/* AI SUMMARY BOX */}
                <div className="flex-1 flex flex-col gap-8 bg-white/[0.02] border border-white/10 p-12">
                   <Sparkles className="w-5 h-5 text-brand" />
                   <h3 className="text-xl font-display text-white">Aggregated Correlation Insight</h3>
                   <p className="text-white/50 font-light leading-relaxed">
                      The current cohort demonstrates a <span className="text-brand">significant escalation</span> in <span className="text-white">PO3 (Solution Design)</span> attainment, increasing by 6 percentage points. 
                      However, mapping to <span className="text-alert font-medium underline underline-offset-4 decoration-alert/30">PO7 (Ethics)</span> remains consistently below target threshold across the three primary assessment instances. 
                      Automated remediation of CO6 alignment is suggested to bridge this diagnostic gap.
                   </p>
                   <div className="pt-6 border-t border-white/5 flex gap-8">
                      <div>
                         <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest block mb-2">Primary Driver</span>
                         <span className="text-sm font-mono text-white/70">CO5 Implementation</span>
                      </div>
                      <div>
                         <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest block mb-2">Secondary Deficit</span>
                         <span className="text-sm font-mono text-white/70">CO6 Evaluation</span>
                      </div>
                   </div>
                </div>
              </div>

              {/* PO DETAILED TITLES LIST */}
              <div className="flex flex-col border-t border-white/10">
                {PO_DATA.map((po, i) => (
                  <motion.div key={po.id} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.04 }}
                    className="flex flex-col md:flex-row md:items-center py-10 border-b border-white/10 group hover:pl-4 transition-all gap-8 md:gap-20">
                    <div className="w-16 shrink-0">
                       <span className="text-4xl font-mono font-light text-white/10 group-hover:text-white/30 transition-colors">{po.po}</span>
                    </div>
                    <div className="flex-1 flex flex-col gap-1">
                       <h3 className="text-2xl font-display text-white group-hover:text-brand transition-colors">{po.name}</h3>
                       <div className="flex items-center gap-4 text-[10px] font-mono text-white/20 uppercase tracking-widest">
                          <span>Benchmark: {po.prev}%</span>
                          <span>·</span>
                          <span className={`${po.current >= THRESHOLD ? "text-attain" : "text-alert"}`}>
                            {po.status} Threshold
                          </span>
                       </div>
                    </div>
                    <div className="w-full md:w-64 flex items-center gap-6 shrink-0">
                      <div className="flex-1 h-[2px] bg-white/5 relative">
                        <motion.div className={`h-full ${po.current >= THRESHOLD ? "bg-brand" : "bg-alert"}`}
                          initial={{ width: 0 }} whileInView={{ width: `${po.current}%` }} transition={{ duration: 1.2, delay: i * 0.05 }} />
                      </div>
                      <div className="flex items-center gap-4 shrink-0">
                         <span className={`text-2xl font-mono font-light w-16 text-right ${po.current >= THRESHOLD ? "text-brand" : "text-alert"}`}>{po.current}%</span>
                         <div className={`flex items-center gap-1 text-[10px] font-mono ${po.current >= po.prev ? "text-attain" : "text-alert"}`}>
                            {po.current >= po.prev ? "+" : ""}{po.current - po.prev}%
                         </div>
                      </div>
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.section>
          )}

          {tab === "pso" && (
            <motion.section key="pso" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              className="flex flex-col divide-y divide-white/10">
              {PSO_DATA.map((pso, i) => (
                <motion.div key={pso.pso} initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} transition={{ delay: i * 0.1 }}
                  className="py-16 first:pt-0 flex flex-col md:flex-row md:items-start gap-12 group hover:pl-4 transition-all">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 text-xs font-mono text-white/30 uppercase tracking-widest mb-4">
                       Structured Specific Outcome {i+1}
                    </div>
                    <h3 className="text-4xl font-display text-white mb-6 group-hover:text-brand transition-colors">{pso.name}</h3>
                    <div className="flex flex-wrap gap-4">
                       <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">CO Weighted Contributions:</span>
                       {pso.contributions.map(c => (
                         <span key={c} className="px-3 py-1 bg-white/[0.03] border border-white/10 text-white/50 font-mono text-[10px] uppercase tracking-widest hover:text-white hover:border-white transition-all">
                           {c}
                         </span>
                      ))}
                    </div>
                  </div>
                  <div className="md:w-64 shrink-0 flex flex-col items-end gap-2">
                     <span className={`text-6xl font-mono font-light ${pso.value >= THRESHOLD ? "text-brand" : "text-alert"}`}>{pso.value}%</span>
                     <div className="w-full h-[1px] bg-white/10 relative overflow-hidden">
                        <motion.div className={`h-full ${pso.value >= THRESHOLD ? "bg-brand" : "bg-alert"}`}
                          initial={{ width: 0 }} whileInView={{ width: `${pso.value}%` }} transition={{ duration: 1.5 }} />
                     </div>
                     <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mt-2">{pso.value >= THRESHOLD ? "Threshold Met" : "Requires Attention"}</p>
                  </div>
                </motion.div>
              ))}
            </motion.section>
          )}
        </AnimatePresence>

        {/* BOTTOM ACTION BUTTON */}
        <motion.section variants={fadeSlideUp} className="flex justify-center pt-20">
           <Link href="/reports" className="group flex items-center gap-10 px-16 py-8 bg-white text-black font-medium text-sm hover:bg-white/95 transition-all uppercase tracking-[0.2em] font-mono shadow-[0_20px_50px_rgba(255,255,255,0.05)]">
              Export Attainment Profile <ArrowRight className="w-5 h-5 group-hover:translate-x-3 transition-transform" />
           </Link>
        </motion.section>

      </motion.div>
    </div>
  );
}
