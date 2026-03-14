"use client";

import { use, useState } from "react";
import { motion } from "framer-motion";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, 
  ResponsiveContainer, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend
} from "recharts";
import { 
  ChevronLeft, Target, Award, Info, AlertCircle, 
  CheckCircle2, HelpCircle, Download, FileText, ArrowRight
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

// ─── MOCK DATA ───────────────────────────────────────────────────────────
const COURSE_STREAK = {
  id: "cs301", code: "CS301", name: "Database Management Systems",
  faculty: "Prof. Anita Nair",
  cos: [
    { co: "CO1", desc: "Design ER models and normalization", myScore: 85, max: 100, attained: true },
    { co: "CO2", desc: "Write complex SQL queries", myScore: 72, max: 100, attained: true },
    { co: "CO3", desc: "Internal storage & indexing", myScore: 45, max: 100, attained: false },
    { co: "CO4", desc: "Concurrency & Recovery", myScore: 68, max: 100, attained: true },
    { co: "CO5", desc: "NoSQL paradigms", myScore: 84, max: 100, attained: true },
  ]
};

const RADAR_DATA = COURSE_STREAK.cos.map(c => ({
  subject: c.co,
  full: 100,
  mine: c.myScore
}));

export default function StudentCOAttainmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-6xl mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12">
        <Link href="/dashboard" className="flex items-center gap-2 text-white/40 hover:text-white transition-colors text-xs font-mono uppercase tracking-widest mb-8">
          <ChevronLeft className="w-4 h-4" /> Back to Journey
        </Link>
        <div className="flex items-end justify-between">
          <div>
            <div className="flex items-center gap-3 text-sm font-mono text-cyan-400 uppercase tracking-widest mb-2">
              <Target className="w-4 h-4" /> My Learning Outcome
            </div>
            <h1 className="text-4xl font-display text-white">{COURSE_STREAK.name}</h1>
            <p className="text-white/40 font-light mt-2">{COURSE_STREAK.code} · {COURSE_STREAK.faculty}</p>
          </div>
          <div className="flex gap-3">
             <button className="px-6 py-3 border border-white/10 text-white/40 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-all flex items-center gap-2">
               <Download className="w-3.5 h-3.5" /> PDF Report
             </button>
          </div>
        </div>
      </motion.div>

      <div className="grid lg:grid-cols-3 gap-8 mb-16">
        {/* Radar Chart Panel (Spec: Student Page 3) */}
        <motion.div variants={fadeSlideUp} className="lg:col-span-2 border border-white/10 bg-white/[0.02] p-8 min-h-[450px] flex flex-col">
          <h3 className="text-sm font-mono text-white/30 uppercase tracking-widest mb-8 flex items-center gap-2">
            Outcome Radar
            <HelpCircle className="w-3 h-3 text-white/10" />
          </h3>
          <div className="flex-1 w-full h-full min-h-[300px]">
            <ResponsiveContainer width="100%" height="100%">
              <RadarChart cx="50%" cy="50%" outerRadius="80%" data={RADAR_DATA}>
                <PolarGrid stroke="#ffffff10" />
                <PolarAngleAxis dataKey="subject" tick={{ fill: '#ffffff40', fontSize: 12, fontFamily: 'monospace' }} />
                <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} stroke="#ffffff05" />
                <Radar
                  name="My Score"
                  dataKey="mine"
                  stroke="#22d3ee"
                  fill="#22d3ee"
                  fillOpacity={0.4}
                />
              </RadarChart>
            </ResponsiveContainer>
          </div>
        </motion.div>

        {/* Improvement Summary */}
        <motion.div variants={fadeSlideUp} className="border border-white/10 bg-white/[0.02] p-8">
           <h3 className="text-sm font-mono text-white/30 uppercase tracking-widest mb-8">Performance Summary</h3>
           <div className="flex flex-col gap-8">
             <div>
               <p className="text-4xl font-mono text-white">4 <span className="text-sm text-white/20">/ 5</span></p>
               <p className="text-[10px] font-mono text-attain uppercase tracking-widest mt-1">COs Attained</p>
             </div>
             <div>
               <p className="text-4xl font-mono text-white">70.8<span className="text-sm text-white/20">%</span></p>
               <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mt-1">Aggregate Score</p>
             </div>
             
             <div className="pt-8 border-t border-white/5">
                <p className="text-xs font-mono text-alert uppercase tracking-widest mb-4 flex items-center gap-2">
                  <AlertCircle className="w-3 h-3" /> Improvement Areas
                </p>
                {COURSE_STREAK.cos.filter(c => !c.attained).map(c => (
                  <div key={c.co} className="p-4 bg-alert/5 border border-alert/10">
                    <p className="text-xs text-white/80 font-medium">{c.co}: {c.desc}</p>
                    <p className="text-[10px] text-white/40 mt-2 leading-relaxed">
                      Your score (45%) is below the 60% attainment threshold. 
                      Focus on: B+ Trees, Hashing and Indexing mechanisms.
                    </p>
                  </div>
                ))}
             </div>
           </div>
        </motion.div>
      </div>

      {/* CO Attainment Table (Spec: Student Page 3) */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-6">
        <h3 className="text-sm font-mono text-white/30 uppercase tracking-widest">Outcome Breakdown</h3>
        <div className="border border-white/10 overflow-hidden">
          <table className="w-full text-left font-mono text-xs">
            <thead className="bg-white/[0.03] border-b border-white/10">
              <tr>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">CO</th>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Statement</th>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Score %</th>
                <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal text-right">Attained?</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {COURSE_STREAK.cos.map((c, i) => (
                <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                  <td className="px-6 py-5 text-white font-medium">{c.co}</td>
                  <td className="px-6 py-5 text-white/50 font-light leading-relaxed max-w-md">{c.desc}</td>
                  <td className="px-6 py-5">
                    <div className="flex items-center gap-4">
                      <div className="w-24 h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <div 
                          className={`h-full ${c.attained ? 'bg-attain' : 'bg-alert'}`}
                          style={{ width: `${c.myScore}%` }}
                        />
                      </div>
                      <span className={c.attained ? "text-attain" : "text-alert"}>{c.myScore}%</span>
                    </div>
                  </td>
                  <td className="px-6 py-5 text-right">
                    {c.attained ? (
                      <span className="inline-flex items-center gap-1.5 text-attain">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Yes
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-alert">
                        <AlertCircle className="w-3.5 h-3.5" /> No
                      </span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* EXAM-WISE BREAKUP (Spec item) */}
      <motion.section variants={fadeSlideUp} className="mt-16 flex flex-col gap-6">
        <div className="flex items-center justify-between">
           <h3 className="text-sm font-mono text-white/30 uppercase tracking-widest">Exam-wise contribution</h3>
           <Link href={`/student/course/${id}/marks`} className="text-[10px] font-mono text-cyan-400 hover:text-white transition-colors flex items-center gap-2 uppercase tracking-widest">
             Detailed Question-wise Analysis <ArrowRight className="w-3 h-3" />
           </Link>
        </div>
        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          {["T1", "T2", "T3", "T4", "SEE"].map((exam) => (
            <div key={exam} className="p-4 border border-white/10 bg-white/[0.02] flex flex-col gap-2">
              <span className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{exam}</span>
              <div className="flex items-end justify-between">
                <span className="text-lg font-mono text-white">
                  {exam === "T1" ? "18/20" : exam === "T2" ? "12/20" : "—"}
                </span>
                <span className="text-[10px] font-mono text-attain">{exam === "T1" ? "90%" : exam === "T2" ? "60%" : ""}</span>
              </div>
            </div>
          ))}
        </div>
      </motion.section>

    </motion.div>
  );
}
