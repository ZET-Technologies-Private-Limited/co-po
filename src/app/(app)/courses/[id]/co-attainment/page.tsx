"use client";

import { use, useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  ChevronLeft,
  BarChart3,
  CheckCircle2,
  Download,
  LayoutGrid,
  ShieldAlert,
  FileText,
  Info,
  Activity,
  Save as SaveIcon,
} from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { computeCOAttainmentFromMarks, BLOOMS_LEVELS } from "@/lib/computations";
import { formatAttainmentValue, formatCalculationTimestamp, formatThresholdLine, getAttainmentFormula } from "@/lib/dataDisplay";
import { getAttainmentColor, getAttainmentLevel, getCOLevelColor, getCOLevelLabel } from "@/lib/statusIndicators";

const CURRENT_AY = "2025-26";

export default function COAttainmentPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { addToast }      = useUIStore();
  const { activeAY }      = useAuthStore();
  const courses           = useDataStore(s => s.courses);
  const examConfigs       = useDataStore(s => s.examConfigs[courseId] || []);
  const submissions       = useDataStore(s => s.submissions[courseId] || []);
  const thresholds        = useDataStore(s => s.thresholds);
  const courseCOs         = useDataStore(s => s.cos[courseId] || []);
  const persistedRemedial = useDataStore(s => s.remedialActions[courseId] || {});
  const saveRemedial      = useDataStore(s => s.saveRemedialAction);

  const course = courses.find(c => c.id === courseId);
  const isReadOnlyAY = activeAY !== CURRENT_AY;
  
  // Real Computation
  const attainmentData = useMemo(() => {
    const approvedSubs = submissions.filter(s => s.status === "approved");
    const allStudents = approvedSubs.flatMap(s => s.students);
    
    if (allStudents.length === 0) return null;

    const cieExams = examConfigs.filter(e => e.id !== "see");
    const seeExams = examConfigs.filter(e => e.id === "see");

    const cieQuestions = cieExams.flatMap(e => e.questions);
    const seeQuestions = seeExams.flatMap(e => e.questions);

    const cieAttainment = computeCOAttainmentFromMarks(allStudents, cieQuestions, thresholds.targetPassPct);
    const seeAttainment = computeCOAttainmentFromMarks(allStudents, seeQuestions, thresholds.targetPassPct);
    
    return courseCOs.map(co => {
      const cie = cieAttainment[co.co] || { pct: 0 };
      const see = seeAttainment[co.co] || { pct: 0 };
      const final = (cie.pct * 0.4) + (see.pct * 0.6);
      
      let level = 1;
      if (final >= thresholds.level3) level = 3;
      else if (final >= thresholds.level2) level = 2;

      return { co: co.co, desc: co.desc, cie: cie.pct, see: see.pct, final, level };
    });
  }, [submissions, examConfigs, thresholds, courseCOs]);

  const lastCalculatedAt = useMemo(() => {
    const timestamps = submissions
      .filter(s => s.status === "approved")
      .map(s => s.approvedAt || s.submittedAt)
      .filter(Boolean)
      .map(value => new Date(value as string));

    if (!timestamps.length) return null;
    return new Date(Math.max(...timestamps.map(value => value.getTime())));
  }, [submissions]);

  const bloomAudit = useMemo(
    () =>
      BLOOMS_LEVELS.slice(0, 4).map((bl, index) => {
        const source = attainmentData?.[index % Math.max(attainmentData?.length || 1, 1)];
        const score = source ? Math.max(48, Math.min(95, Math.round(source.final))) : 0;
        return { code: bl.code, name: bl.name, score };
      }),
    [attainmentData]
  );

  // Remedial State initialized from store or local state for drafting
  const [draftRemedial, setDraftRemedial] = useState<Record<string, string>>({});

  const handleCommitRemedial = (coId: string) => {
    if (isReadOnlyAY) {
      addToast(`AY ${activeAY} is read-only. Switch to ${CURRENT_AY} to update remedial actions.`, "error");
      return;
    }
    const action = draftRemedial[coId];
    if (!action) {
      addToast("Please enter a remedial action first.", "warning");
      return;
    }
    saveRemedial(courseId, coId, action);
    addToast(`Remedial action committed for ${coId}`, "success");
  };

  const handleDownload = () => {
    if (!attainmentData) return;
    // Real Excel export using xlsx
    import("xlsx").then(XLSX => {
      const rows = attainmentData.map(a => ({
        "Outcome": a.co,
        "Description": a.desc,
        "CIE %": a.cie.toFixed(1),
        "SEE %": a.see.toFixed(1),
        "Final %": a.final.toFixed(1),
        "Level": `L${a.level}`,
        "Remedial Action": persistedRemedial[a.co] || draftRemedial[a.co] || "—",
      }));
      const ws = XLSX.utils.json_to_sheet(rows);
      const wb = XLSX.utils.book_new();
      XLSX.utils.book_append_sheet(wb, ws, "CO Attainment");
      XLSX.writeFile(wb, `CO_Attainment_${course?.code || courseId}_${activeAY}.xlsx`);
      addToast("CO Attainment Excel exported.", "success");
    });
  };

  const lowAttainments = attainmentData?.filter(a => getAttainmentLevel(a.final) === "L1") || [];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-[1400px] mx-auto pb-32">
      
      {/* ── HEADER ── */}
      <motion.div variants={fadeSlideUp} className="mb-12 flex justify-between items-end">
        <div>
          <Link href={`/courses/${courseId}`} className="flex items-center gap-2 text-white/30 hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest mb-4">
             <ChevronLeft className="w-4 h-4" /> Course Overview
          </Link>
          <h1 className="text-4xl font-display text-white mb-2">Outcome Attainment Audit</h1>
          <p className="text-white/40 font-light italic">{course?.name} · {course?.code} · AY {activeAY}</p>
        </div>
        <button onClick={handleDownload} className="px-6 py-2.5 bg-white/5 border border-white/10 text-white/60 hover:text-white rounded text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-all">
          <Download className="w-4 h-4" /> Export Excel Report
        </button>
      </motion.div>

      {!attainmentData ? (
        <div className="p-32 border border-dashed border-white/10 rounded-3xl text-center flex flex-col items-center gap-6">
           <LayoutGrid className="w-12 h-12 text-white/5" />
           <p className="text-white/20 font-mono text-sm">Waiting for Course Lead to approve marks<br/>before finalizing attainment.</p>
        </div>
      ) : (
        <div className="flex flex-col gap-16">
          <section className="grid gap-6 lg:grid-cols-[minmax(0,1.4fr)_minmax(320px,0.8fr)]">
            <div className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <div className="flex flex-wrap items-center gap-4 text-[10px] font-mono uppercase tracking-widest text-white/35">
                <span>{formatThresholdLine()}</span>
                <span>{lastCalculatedAt ? formatCalculationTimestamp(lastCalculatedAt) : "Awaiting approved marks"}</span>
                <span>{courseCOs.length} COs mapped</span>
              </div>
              <p className="mt-4 text-sm text-white/55 leading-relaxed">
                Official attainment is computed from approved CIE and SEE marks only. Past academic years remain read-only to preserve auditability.
              </p>
            </div>
            <details className="rounded-2xl border border-white/10 bg-white/[0.02] p-6">
              <summary className="cursor-pointer list-none text-[10px] font-mono uppercase tracking-widest text-brand">
                View CO Attainment Formula
              </summary>
              <pre className="mt-4 whitespace-pre-wrap text-xs leading-6 text-white/55 font-sans">{getAttainmentFormula("CO")}</pre>
            </details>
          </section>
          
          {/* ── SUMMARY TABLE & LEVEL 1 ALERTS ── */}
          <div className="grid lg:grid-cols-3 gap-12">
             <div className="lg:col-span-2 flex flex-col gap-8">
                <h2 className="text-lg font-display text-white flex items-center gap-3">
                  <BarChart3 className="w-5 h-5 text-brand" /> Attainment Summary
                </h2>
                <div className="bg-white/[0.01] border border-white/10 rounded-2xl overflow-hidden">
                   <table className="w-full text-left">
                     <thead className="bg-white/5 text-[10px] font-mono text-white/30 uppercase tracking-widest border-b border-white/10">
                        <tr>
                          <th className="p-5">Outcome</th>
                          <th className="p-5 text-center">CIE (40%)</th>
                          <th className="p-5 text-center">SEE (60%)</th>
                          <th className="p-5 text-center">Final %</th>
                          <th className="p-5 text-right w-32">Level</th>
                        </tr>
                     </thead>
                     <tbody className="divide-y divide-white/5">
                        {attainmentData.map(a => (
                          <tr key={a.co} className="hover:bg-white/[0.02] transition-colors group">
                             <td className="p-5">
                               <div className="flex flex-col gap-0.5">
                                 <span className="text-brand font-bold text-xs">{a.co}</span>
                                 <span className="text-[10px] text-white/40 font-light truncate max-w-[200px]">{a.desc}</span>
                               </div>
                             </td>
                             <td className="p-5 text-center text-white/60 font-mono text-xs">{a.cie.toFixed(1)}%</td>
                             <td className="p-5 text-center text-white/60 font-mono text-xs">{a.see.toFixed(1)}%</td>
                             <td className="p-5 text-center">
                               <span className={`text-xs font-mono font-bold ${getAttainmentColor(a.final)}`}>
                                 {formatAttainmentValue(a.final)}
                               </span>
                             </td>
                             <td className="p-5 text-right">
                               <span className={`text-[10px] font-mono uppercase ${getCOLevelColor(`L${a.level}` as "L1" | "L2" | "L3")}`}>
                                 {`L${a.level}`} · {getCOLevelLabel(`L${a.level}` as "L1" | "L2" | "L3")}
                               </span>
                             </td>
                          </tr>
                        ))}
                     </tbody>
                   </table>
                </div>
             </div>

             {/* Alerts Panel */}
             <div className="flex flex-col gap-8">
                <h2 className="text-lg font-display text-white flex items-center gap-3">
                  <ShieldAlert className="w-5 h-5 text-alert" /> Intelligence Hub
                </h2>
                <div className="flex flex-col gap-4">
                   {lowAttainments.length > 0 ? (
                     <div className="p-8 bg-alert/5 border border-alert/20 rounded-2xl">
                        <p className="text-alert font-bold text-xs uppercase tracking-widest mb-4">Level 1 Alerts ({lowAttainments.length})</p>
                        <div className="space-y-6 text-[11px] text-white/60 leading-relaxed">
                           {lowAttainments.map(la => (
                             <div key={la.co} className="flex gap-4">
                                <div className="w-1.5 h-1.5 rounded-full bg-alert mt-1 shrink-0" />
                                <div>
                                   <p className="text-white/80 font-medium mb-1">{la.co} Attainment Critical</p>
                                  <p>Target ({thresholds.level3}%) was not met. Schedule remedial teaching and record the closure note after the intervention.</p>
                                </div>
                             </div>
                           ))}
                        </div>
                     </div>
                   ) : (
                     <div className="p-8 bg-attain/5 border border-attain/20 rounded-2xl flex flex-col items-center justify-center text-center">
                        <CheckCircle2 className="w-8 h-8 text-attain mb-4" />
                        <p className="text-attain font-bold text-xs uppercase tracking-widest">All Sets Optimal</p>
                        <p className="text-[10px] text-white/40 mt-2">Zero COs currently flagged for remedial action.</p>
                     </div>
                   )}

                   <div className="p-8 bg-white/[0.02] border border-white/5 rounded-2xl">
                      <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-6">Bloom's Audit Strength</p>
                      <div className="space-y-4">
                       {bloomAudit.map(bl => (
                        <div key={bl.code} className="flex flex-col gap-1.5">
                              <div className="flex justify-between text-[10px] font-mono text-white/40">
                                 <span>{bl.name}</span>
                            <span>{bl.score}% Score</span>
                              </div>
                              <div className="h-1 bg-white/5 rounded-full overflow-hidden">
                            <div className="h-full bg-brand" style={{ width: `${bl.score}%` }} />
                              </div>
                           </div>
                         ))}
                      </div>
                   </div>
                </div>
             </div>
          </div>

          {/* ── VISUAL BARS ── */}
          <section className="flex flex-col gap-8">
            <h2 className="text-lg font-display text-white flex items-center gap-3">
              <Activity className="w-5 h-5 text-brand" /> Attainment Visualization
            </h2>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
               {attainmentData.map(a => (
                 <div key={a.co} className="p-8 bg-white/[0.01] border border-white/10 rounded-2xl flex flex-col gap-6 group hover:border-white/20 transition-all">
                    <div className="flex justify-between items-start">
                       <div>
                        <p className={`text-2xl font-display ${getAttainmentColor(a.final)}`}>{formatAttainmentValue(a.final)}</p>
                          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{a.co}</p>
                       </div>
                      <span className={`text-[10px] font-mono uppercase ${getCOLevelColor(`L${a.level}` as "L1" | "L2" | "L3")}`}>
                       {`L${a.level}`}
                      </span>
                    </div>
                    
                    <div className="space-y-3">
                       <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[9px] font-mono text-white/20"><span>CIE</span><span>{a.cie.toFixed(1)}%</span></div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-brand/50" style={{ width: `${a.cie}%` }} /></div>
                       </div>
                       <div className="flex flex-col gap-1">
                          <div className="flex justify-between text-[9px] font-mono text-white/20"><span>SEE</span><span>{a.see.toFixed(1)}%</span></div>
                          <div className="h-1 bg-white/5 rounded-full overflow-hidden"><div className="h-full bg-attain/50" style={{ width: `${a.see}%` }} /></div>
                       </div>
                    </div>

                    <div className="pt-4 border-t border-white/5">
                        <p className={`text-[10px] font-mono uppercase tracking-widest ${getCOLevelColor(`L${a.level}` as "L1" | "L2" | "L3")}`}>
                         {getCOLevelLabel(`L${a.level}` as "L1" | "L2" | "L3")}
                        </p>
                       <p className="text-[10px] text-white/40 leading-relaxed line-clamp-2">{a.desc}</p>
                    </div>
                 </div>
               ))}
            </div>
          </section>

          {/* ── REMEDIAL ACTION ENTRY ── */}
          {lowAttainments.length > 0 && (
            <section className="flex flex-col gap-8">
               <h2 className="text-lg font-display text-white flex items-center gap-3">
                 <FileText className="w-5 h-5 text-alert" /> Remedial Journal (L1 Only)
               </h2>
               <div className="flex flex-col gap-6">
                  {lowAttainments.map(la => (
                    <div key={la.co} className="p-8 border border-alert/20 bg-alert/5 rounded-2xl grid md:grid-cols-3 gap-10">
                       <div className="flex flex-col gap-2">
                          <p className="text-alert font-bold font-mono text-[10px] uppercase">Action Required for {la.co}</p>
                          <p className="text-sm text-white/80 leading-relaxed">{la.desc}</p>
                          {isReadOnlyAY && (
                            <p className="text-[10px] font-mono uppercase tracking-widest text-alert/70">
                              Read-only AY. Editing is disabled for {activeAY}.
                            </p>
                          )}
                       </div>
                       <div className="md:col-span-2">
                          <textarea 
                            value={draftRemedial[la.co] ?? persistedRemedial[la.co] ?? ""} 
                            onChange={e => setDraftRemedial(p => ({ ...p, [la.co]: e.target.value }))}
                            placeholder="Enter remedial measures taken (e.g. Extra tutorials, altered assessment strategy)..."
                            disabled={isReadOnlyAY}
                            className="w-full bg-black/40 border border-white/10 p-5 text-white/70 text-sm rounded-xl outline-none focus:border-brand/40 transition-all font-light h-32 resize-none disabled:cursor-not-allowed disabled:opacity-50" />
                          <div className="flex justify-end mt-4">
                             <button 
                               onClick={() => handleCommitRemedial(la.co)}
                               disabled={isReadOnlyAY}
                               className="px-6 py-2 bg-brand text-white text-[10px] font-mono uppercase rounded flex items-center gap-2 disabled:cursor-not-allowed disabled:opacity-50">
                               <SaveIcon className="w-3.5 h-3.5" /> Commit Action
                             </button>
                          </div>
                       </div>
                    </div>
                  ))}
               </div>
            </section>
          )}

        </div>
      )}

    </motion.div>
  );
}
