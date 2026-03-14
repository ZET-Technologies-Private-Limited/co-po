"use client";

import { use, useMemo } from "react";
import { motion } from "framer-motion";
import { 
  ChevronLeft, Radar as RadarIcon, 
  Download, Grid3X3, Info
} from "lucide-react";
import Link from "next/link";
import { 
  Radar, RadarChart, PolarGrid, PolarAngleAxis, 
  PolarRadiusAxis, ResponsiveContainer, Tooltip 
} from "recharts";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useUIStore } from "@/lib/uiStore";
import { computeCOAttainmentFromMarks, computePOAttainment } from "@/lib/computations";

export default function POAttainmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast }      = useUIStore();
  const courses           = useDataStore(s => s.courses);
  const examConfigs       = useDataStore(s => s.examConfigs[courseId] || []);
  const submissions       = useDataStore(s => s.submissions[courseId] || []);
  const thresholds        = useDataStore(s => s.thresholds);
  const courseCOs         = useDataStore(s => s.cos[courseId] || []);

  const course = courses.find(c => c.id === courseId);

  // Compute PO Attainment based on real CO results
  const poData = useMemo(() => {
    const approvedSubs = submissions.filter(s => s.status === "approved");
    const allStudents = approvedSubs.flatMap(s => s.students);
    
    if (allStudents.length === 0 || courseCOs.length === 0 || !course) return null;

    // 1. Get CO Attainments
    const allQuestions = examConfigs.flatMap(e => e.questions);
    const coAttainmentsRecord = computeCOAttainmentFromMarks(allStudents, allQuestions, thresholds.targetPassPct);
    
    // 2. Convert record to array for computePOAttainment
    const coAttArray = Object.entries(coAttainmentsRecord).map(([co, data]) => ({
      co,
      pct: data.pct
    }));
    
    // 3. Compute PO Attainment using the correlation matrix
    const results = computePOAttainment(coAttArray, course.mappings || {});
    
    // Format for Recharts Radar
    const radarData = Object.entries(results).map(([key, val]) => ({
      subject: key,
      A: val.pct,
      fullMark: 3
    }));

    return { results, radarData };
  }, [submissions, examConfigs, thresholds, courseCOs, course]);

  if (!course) return null;

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-[1400px] mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end">
        <div>
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
             <ChevronLeft className="w-4 h-4" /> Course Overview
          </Link>
          <h1 className="text-4xl font-display text-white mb-2">Institutional Mapping (PO / PSO)</h1>
          <p className="text-white/40 font-light italic">{course.name} · Direct Attainment Contribution</p>
        </div>
        <button onClick={() => addToast("Exporting Mapping Report...", "info")}
          className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-all">
          <Download className="w-4 h-4" /> Export Correlation Excel
        </button>
      </motion.div>

      {!poData ? (
        <div className="p-32 border border-dashed border-white/10 rounded-3xl text-center flex flex-col items-center gap-6">
           <RadarIcon className="w-12 h-12 text-white/5" />
           <p className="text-white/20 font-mono text-sm">CO Attainment must be finalized<br/>to calculate PO/PSO reach.</p>
        </div>
      ) : (
        <div className="grid lg:grid-cols-2 gap-16">
          
          {/* ── RADAR CHART ── */}
          <div className="flex flex-col gap-10">
             <h2 className="text-lg font-display text-white flex items-center gap-3">
               <RadarIcon className="w-5 h-5 text-brand" /> Attainment Profile
             </h2>
             <div className="h-[500px] bg-white/[0.01] border border-white/10 rounded-3xl p-10 flex items-center justify-center relative overflow-hidden">
                <div className="absolute inset-0 bg-brand/5 blur-[100px] opacity-20" />
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="80%" data={poData.radarData}>
                    <PolarGrid stroke="#ffffff10" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: "#ffffff40", fontSize: 10, fontFamily: "monospace" }} />
                    <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
                    <Radar
                      name="Attainment %"
                      dataKey="A"
                      stroke="#1e9adb"
                      fill="#1e9adb"
                      fillOpacity={0.3}
                    />
                    <Tooltip 
                      contentStyle={{ backgroundColor: "#0a0a0f", border: "1px solid #ffffff10", borderRadius: "10px", fontSize: "12px" }} 
                      itemStyle={{ color: "#1e9adb" }}
                    />
                  </RadarChart>
                </ResponsiveContainer>
             </div>
             
             <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl flex gap-6 items-start">
                <Info className="w-6 h-6 text-brand shrink-0" />
                <p className="text-xs text-white/40 leading-relaxed font-light">
                   The Radar Profile reflects normalized attainment percentages. Institutional mapping correlates Course Outcomes (COs) to Program Outcomes (POs) and Program Specific Outcomes (PSOs) at specified weights (1: Low to 3: High).
                </p>
             </div>
          </div>

          {/* ── MAPPING GRID ── */}
          <div className="flex flex-col gap-10">
             <h2 className="text-lg font-display text-white flex items-center gap-3">
               <Grid3X3 className="w-5 h-5 text-brand" /> Attainment Breakdown
             </h2>
             <div className="space-y-4">
                {Object.entries(poData.results).map(([id, data]) => (
                  <div key={id} className="p-6 bg-white/[0.02] border border-white/10 rounded-xl flex items-center justify-between group hover:bg-white/[0.04] transition-all">
                    <div className="flex items-center gap-6">
                       <span className="w-12 h-12 bg-brand/10 border border-brand/20 rounded-lg flex items-center justify-center text-brand font-bold text-xs">{id}</span>
                       <div>
                          <p className="text-sm text-white font-medium">{id.startsWith('PO') ? `Program Outcome ${id.slice(2)}` : `PSO ${id.slice(3)}`}</p>
                          <p className="text-[10px] font-mono text-white/20 uppercase mt-1 tracking-widest">Target Reach: 100%</p>
                       </div>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                       <span className="text-xl font-mono text-white">{data.pct.toFixed(1)}%</span>
                       <div className="w-32 h-1.5 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-brand" style={{ width: `${data.pct}%` }} />
                       </div>
                    </div>
                  </div>
                ))}
             </div>

             <div className="mt-6 p-8 bg-brand/5 border border-brand/20 rounded-2xl">
                <h4 className="text-[10px] font-mono text-brand uppercase tracking-widest mb-4">Attainment Analysis</h4>
                <div className="space-y-4 text-[11px] text-white/60 leading-relaxed">
                   <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                      <p>Institutional Outcomes are heavily correlated with technical proficiency and problem analysis.</p>
                   </div>
                   <div className="flex gap-4">
                      <div className="w-1.5 h-1.5 rounded-full bg-brand mt-1.5 shrink-0" />
                      <p>Current results indicate a strong alignment with **PO1 (Engineering Knowledge)** and **PO3 (Design/Development)**.</p>
                   </div>
                </div>
             </div>
          </div>

        </div>
      )}

    </motion.div>
  );
}
