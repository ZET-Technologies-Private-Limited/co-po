"use client";

import { motion } from "framer-motion";
import { 
  FileText, ArrowDownRight, Sparkles, 
  Target, BarChart, Download, ArrowRight,
  ShieldCheck, AlertTriangle
} from "lucide-react";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

export default function HODDepartmentReportPage() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end border-b border-white/10 pb-12">
        <div>
          <h1 className="text-5xl font-display text-white italic">Compliance <span className="text-white/40">Narrative</span></h1>
          <p className="text-white/40 font-light mt-4 uppercase tracking-[0.3em] text-xs">Curricular Gap Analysis · AY 2024-25</p>
        </div>
        <div className="flex gap-4">
           <button className="px-6 py-3 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-all flex items-center gap-2">
             <Download className="w-3.5 h-3.5" /> PDF Narrative
           </button>
        </div>
      </motion.div>

      <div className="flex flex-col gap-16">
        
        {/* SECTION 1: EXECUTIVE SUMMARY */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-6">
           <h3 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
             <FileText className="w-4 h-4" /> 01 Executive Summary
           </h3>
           <div className="p-10 border border-white/10 bg-white/[0.01] text-white/70 font-light leading-relaxed text-sm">
             The attainment data for the Academic Year 2024-25 shows an average Departmental CO Attainment of <span className="text-brand font-medium">72.4%</span>, a marginal increase of 0.4% from the previous year. While Core Subjects like DBMS and Algorithms show stable Level 3 attainment, persistent gaps are identified in Operating Systems (CS303) across the last three cohorts.
           </div>
        </motion.section>

        {/* SECTION 2: CURRICULAR GAPS (Spec: HOD Page 5) */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
           <h3 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
             <AlertTriangle className="w-4 h-4 text-alert" /> 02 Critical Attainment Gaps
           </h3>
           
           <div className="flex flex-col gap-4">
              <div className="border border-white/10 bg-white/[0.02] p-8">
                 <div className="flex justify-between items-start mb-6">
                    <div>
                      <p className="text-[10px] font-mono text-alert mb-1 uppercase">Persistent Level 1 Alert</p>
                      <h4 className="text-xl font-display text-white">CS303: Operating Systems</h4>
                    </div>
                    <span className="px-3 py-1 bg-alert/10 border border-alert/30 text-alert text-[9px] font-mono uppercase">Critical</span>
                 </div>
                 <div className="grid md:grid-cols-2 gap-8 text-sm text-white/50 leading-relaxed font-light">
                    <div>
                       <p className="text-white/30 uppercase font-mono text-[9px] mb-3">Gap Identification</p>
                       CO2 (CPU Scheduling) has attained Level 1 for 3 consecutive years. 
                       <span className="text-white/70 block mt-2">Historical Attainment: 35% → 32% → 30%</span>
                    </div>
                    <div>
                       <p className="text-white/30 uppercase font-mono text-[9px] mb-3">AI Deep Analysis</p>
                       <div className="p-4 bg-brand/5 border border-brand/20 italic text-xs leading-relaxed">
                          "Correlation analysis indicates a mismatch between L4-Analyse questions and student preparation. Remedial tutorials focused only on foundational definitions (L1) while SEE questions required complex scheduling simulation."
                       </div>
                    </div>
                 </div>
              </div>
           </div>
        </motion.section>

        {/* SECTION 3: RECOMMENDATIONS (Spec: HOD Page 5 AI Recommendations) */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-6">
           <h3 className="text-xs font-mono text-white/30 uppercase tracking-[0.2em] flex items-center gap-2">
             <Sparkles className="w-4 h-4 text-cyan-400" /> 03 Strategic Recommendations
           </h3>
           <div className="grid md:grid-cols-3 gap-4">
              {[
                "Revise Assessment Patterns for OS: Introduce more simulation-based internal tests.",
                "Syllabus Content Refresh: Update CO3 descriptors in DBMS to include modern NoSQL paradigms.",
                "Faculty Upskilling: Conduct Bloom's Taxonomy workshop for new visiting faculty."
              ].map((rec, i) => (
                <div key={i} className="p-6 border border-white/5 bg-white/[0.01]">
                   <p className="text-[10px] font-mono text-white/20 mb-4 italic">Actionable #{i+1}</p>
                   <p className="text-xs text-white/70 leading-relaxed italic">{rec}</p>
                </div>
              ))}
           </div>
        </motion.section>

        {/* FOOTER: SIGN OFF */}
        <motion.section variants={fadeSlideUp} className="mt-16 pt-12 border-t border-white/10 flex justify-between">
           <div className="flex flex-col gap-1">
             <p className="text-[10px] font-mono text-white/20 uppercase">Generated On</p>
             <p className="text-xs text-white/50 font-mono">14 March 2026 · 10:55 AM</p>
           </div>
           <div className="flex flex-col gap-1 text-right">
             <p className="text-[10px] font-mono text-white/20 uppercase">Authorized Signature</p>
             <div className="mt-2 text-white/60 font-display italic">Digital Lock Verified</div>
           </div>
        </motion.section>

      </div>
    </motion.div>
  );
}
