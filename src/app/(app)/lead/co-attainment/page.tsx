"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LayoutGrid, Layers, AlertTriangle, Download, Settings, Info } from "lucide-react";
import { useDataStore } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

type AttainmentData = { co: string; cie: number; see: number; final: number; level: number };

export default function LeadCOAttainmentPage() {
  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const thresholds  = useDataStore(s => s.thresholds);

  const [selectedCourseIds, setSelectedCourseIds] = useState<string[]>(courses.slice(0, 1).map(c => c.id));
  const [viewMode, setViewMode] = useState<"table" | "comparison">("table");
  const [overrideTarget, setOverrideTarget] = useState<{ courseId: string; co: string } | null>(null);
  const [justification, setJustification] = useState("");

  const courseData = useMemo(() => {
    const results: Record<string, AttainmentData[]> = {};
    courses.forEach(c => {
      const subs     = submissions[c.id] || [];
      const exams    = examConfigs[c.id] || [];
      const cieExams = exams.filter(e => e.group === "CIE");
      const seeExams = exams.filter(e => e.group === "SEE");
      const cieMarks = subs.filter(s => s.status === "approved" && cieExams.some(e => e.id === s.examId)).flatMap(s => s.students);
      const seeMarks = subs.filter(s => s.status === "approved" && seeExams.some(e => e.id === s.examId)).flatMap(s => s.students);
      const allMarks = subs.filter(s => s.status === "approved").flatMap(s => s.students);
      const cieQs    = cieExams.flatMap(e => e.questions);
      const seeQs    = seeExams.flatMap(e => e.questions);
      const allQs    = exams.flatMap(e => e.questions);
      if (!allMarks.length || !allQs.length) { results[c.id] = []; return; }
      const cieAtt   = cieMarks.length && cieQs.length ? computeCOAttainmentFromMarks(cieMarks, cieQs, thresholds.targetPassPct) : {};
      const seeAtt   = seeMarks.length && seeQs.length ? computeCOAttainmentFromMarks(seeMarks, seeQs, thresholds.targetPassPct) : {};
      const finalAtt = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);
      results[c.id] = Object.entries(finalAtt).map(([co, d]) => {
        const lvl = getAttainmentLevel(d.pct, thresholds);
        return { co, cie: cieAtt[co]?.pct ?? 0, see: seeAtt[co]?.pct ?? 0, final: d.pct, level: lvl.level };
      });
    });
    return results;
  }, [courses, submissions, examConfigs, thresholds]);

  return (
    <AccessGate feature="co_attainment" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Attainment Analytics
            </div>
            <h1 className="text-4xl font-display text-white">Course Outcome Tracking</h1>
            <p className="text-white/40 font-light mt-1">Portfolio-wide CO attainment from approved marks.</p>
          </div>
          <div className="flex gap-3">
            <div className="flex border border-white/10">
              <button onClick={() => setViewMode("table")}
                className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === "table" ? "bg-brand text-white" : "text-white/40 hover:text-white"}`}>
                <LayoutGrid className="w-3.5 h-3.5" /> Table
              </button>
              <button onClick={() => setViewMode("comparison")}
                className={`px-4 py-2 text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 transition-all ${viewMode === "comparison" ? "bg-brand text-white" : "text-white/40 hover:text-white"}`}>
                <Layers className="w-3.5 h-3.5" /> Compare
              </button>
            </div>
            <button onClick={async () => {
              const XLSX = await import("xlsx");
              const rows = selectedCourseIds.flatMap(id =>
                (courseData[id] || []).map(r => ({
                  Course: courses.find(c => c.id === id)?.code || id,
                  CO: r.co, "CIE %": r.cie, "SEE %": r.see, "Final %": r.final, Level: `Level ${r.level}`,
                }))
              );
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "CO Attainment");
              XLSX.writeFile(wb, "CO_Attainment_Lead_Report.xlsx");
            }} className="px-5 py-2.5 border border-white/10 text-white/60 text-[10px] font-mono uppercase tracking-widest hover:border-white/30 hover:text-white transition-colors flex items-center gap-2">
              <Download className="w-3.5 h-3.5" /> Export
            </button>
          </div>
        </motion.div>

        {/* Course selector */}
        <div className="flex flex-wrap gap-2 py-5 border-b border-white/5">
          {courses.map(course => (
            <button key={course.id} onClick={() => {
              if (viewMode === "comparison") {
                setSelectedCourseIds(prev => prev.includes(course.id) ? prev.filter(id => id !== course.id) : [...prev, course.id]);
              } else {
                setSelectedCourseIds([course.id]);
              }
            }}
            className={`px-4 py-1.5 border text-[10px] font-mono uppercase tracking-widest transition-colors ${
              selectedCourseIds.includes(course.id) ? "border-brand text-brand bg-brand/5" : "border-white/10 text-white/30 hover:border-white/30"
            }`}>
              {course.code}
            </button>
          ))}
        </div>

        {viewMode === "table" ? (
          <motion.div variants={fadeSlideUp} className="flex flex-col gap-0">
            {selectedCourseIds.map(id => {
              const data = courseData[id] || [];
              const courseName = courses.find(c => c.id === id)?.name;
              return (
                <div key={id} className="border-b border-white/5">
                  <div className="flex justify-between items-center px-0 py-5 border-b border-white/5">
                    <h2 className="text-sm font-display text-white">{courseName}</h2>
                    {data.length === 0 && <span className="text-[10px] font-mono text-white/20 italic">No approved marks yet</span>}
                  </div>
                  {data.length > 0 && (
                    <table className="w-full text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10 bg-white/[0.02]">
                          {["CO", "CIE %", "SEE %", "Final %", "Level", "Bar", "Override"].map(h => (
                            <th key={h} className="px-6 py-4 text-[9px] font-mono text-white/30 uppercase tracking-widest">{h}</th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        {data.map(row => {
                          const lvl = getAttainmentLevel(row.final, thresholds);
                          return (
                            <tr key={row.co} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                              <td className="px-6 py-4 font-mono text-sm text-brand">{row.co}</td>
                              <td className="px-6 py-4 font-mono text-xs text-white/50">{row.cie}%</td>
                              <td className="px-6 py-4 font-mono text-xs text-white/50">{row.see}%</td>
                              <td className="px-6 py-4 font-mono text-sm text-white font-bold">{row.final}%</td>
                              <td className="px-6 py-4">
                                <span className={`text-[9px] font-mono uppercase px-2 py-0.5 border ${lvl.badgeColor}`}>{lvl.label}</span>
                              </td>
                              <td className="px-6 py-4 w-32">
                                <div className="h-0.5 bg-white/5">
                                  <motion.div initial={{ width: 0 }} animate={{ width: `${row.final}%` }}
                                    className={`h-full ${row.level === 3 ? "bg-attain" : row.level === 2 ? "bg-amber-400" : "bg-alert"}`} />
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <button onClick={() => setOverrideTarget({ courseId: id, co: row.co })}
                                  className="p-1.5 text-white/10 hover:text-brand transition-colors">
                                  <Settings className="w-3.5 h-3.5" />
                                </button>
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  )}
                </div>
              );
            })}
          </motion.div>
        ) : (
          <motion.div variants={fadeSlideUp} className="py-8 border-b border-white/5">
            <div className="h-64 flex items-end gap-8 px-4">
              {selectedCourseIds.map(id => (
                <div key={id} className="flex-1 flex flex-col gap-4">
                  <div className="flex-1 flex items-end gap-1">
                    {(courseData[id] || []).map(row => (
                      <div key={row.co} className="flex-1 flex flex-col items-center gap-1">
                        <span className="text-[9px] font-mono text-white/30">{row.final}%</span>
                        <motion.div initial={{ height: 0 }} animate={{ height: `${row.final * 1.6}px` }}
                          className={`w-full ${row.level === 3 ? "bg-attain/60" : row.level === 2 ? "bg-amber-400/60" : "bg-alert/60"}`} />
                        <span className="text-[9px] font-mono text-white/30">{row.co}</span>
                      </div>
                    ))}
                    {(courseData[id] || []).length === 0 && (
                      <p className="text-[10px] font-mono text-white/20 italic self-center w-full text-center">No data</p>
                    )}
                  </div>
                  <p className="text-center text-[10px] font-mono text-brand uppercase tracking-widest border-t border-white/5 pt-2">
                    {courses.find(c => c.id === id)?.code}
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* Override modal — flat style */}
        <AnimatePresence>
          {overrideTarget && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-6 bg-black/80">
              <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
                className="max-w-md w-full p-8 bg-[#0a0a0f] border border-white/10 flex flex-col gap-6">
                <div className="flex items-center gap-3">
                  <AlertTriangle className="w-5 h-5 text-amber-400" />
                  <div>
                    <h3 className="text-lg font-display text-white">Manual Level Override</h3>
                    <p className="text-[10px] font-mono text-white/30 uppercase">{overrideTarget.co} · {overrideTarget.courseId.toUpperCase()}</p>
                  </div>
                </div>
                <div className="flex gap-3">
                  {[1, 2, 3].map(l => (
                    <button key={l} className="flex-1 py-2.5 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:border-brand hover:text-white transition-colors">
                      Level {l}
                    </button>
                  ))}
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[9px] font-mono text-white/20 uppercase tracking-widest">Academic Justification *</label>
                  <textarea value={justification} onChange={e => setJustification(e.target.value)}
                    placeholder="Describe moderation logic or unforeseen circumstances..."
                    className="w-full bg-white/[0.02] border border-white/10 p-3 text-xs text-white outline-none focus:border-brand h-20 resize-none" />
                </div>
                <div className="flex items-start gap-2 text-[10px] text-brand/60 font-mono">
                  <Info className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                  HOD will be notified. Justification is mandatory for NBA audit.
                </div>
                <div className="flex gap-3 pt-2 border-t border-white/5">
                  <button onClick={() => setOverrideTarget(null)}
                    className="flex-1 py-2.5 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors">
                    Cancel
                  </button>
                  <button onClick={() => { setOverrideTarget(null); setJustification(""); }}
                    disabled={!justification.trim()}
                    className="flex-1 py-2.5 bg-brand text-white text-[10px] font-mono uppercase tracking-widest hover:bg-brand/90 transition-colors disabled:opacity-40">
                    Commit Override
                  </button>
                </div>
              </motion.div>
            </motion.div>
          )}
        </AnimatePresence>

      </motion.div>
    </AccessGate>
  );
}
