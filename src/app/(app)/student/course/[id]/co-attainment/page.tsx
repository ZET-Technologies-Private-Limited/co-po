"use client";

import { useMemo, useState, useEffect, Fragment } from "react";
import { useParams } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { CheckCircle2, AlertTriangle, ChevronLeft, Eye, EyeOff } from "lucide-react";
import {
  Radar, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, ResponsiveContainer, Tooltip, Legend,
} from "recharts";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { computeCOAttainmentFromMarks } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import Link from "next/link";

const BLOOMS_NAMES: Record<string, string> = {
  L1: "L1 — Remember", L2: "L2 — Understand", L3: "L3 — Apply",
  L4: "L4 — Analyse",  L5: "L5 — Evaluate",  L6: "L6 — Create",
};

// Derive a short revision topic from CO desc by stripping the leading verb
// e.g. "Formulate SQL queries using relational algebra" → "SQL queries using relational algebra"
function revisionTopic(desc: string): string {
  const words = desc.trim().split(" ");
  const topic = words.slice(1).join(" ");
  return topic.length > 70 ? topic.slice(0, 67) + "…" : topic;
}

export default function StudentCOAttainmentPage() {
  const { id }     = useParams();
  const courseId   = (Array.isArray(id) ? id[0] : id) ?? "";
  const { user }   = useAuthStore();
  const myRoll     = user?.employeeId ?? "";

  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const cosMap      = useDataStore(s => s.cos);
  const users       = useDataStore(s => s.users);
  const thresholds  = useDataStore(s => s.thresholds);

  const course  = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const faculty = useMemo(() => users.find(u => u.id === course?.facultyId), [users, course]);
  const courseCOs = useMemo(() => cosMap[courseId] ?? [], [cosMap, courseId]);

  // Active exam tab (S3-07) — init after tabExams is computed via useEffect
  const allExams    = useMemo(() => examConfigs[courseId] ?? [], [examConfigs, courseId]);
  const tabExams    = useMemo(() => allExams.filter(e => ["t1","t2","t3","t4","see"].includes(e.id)), [allExams]);
  const [activeTab, setActiveTab] = useState<string>("t1");
  useEffect(() => {
    if (tabExams.length > 0 && !tabExams.find(e => e.id === activeTab)) {
      setActiveTab(tabExams[0].id);
    }
  }, [tabExams]); // eslint-disable-line react-hooks/exhaustive-deps

  // Class compare toggle (S3-06)
  const [showClassAvg, setShowClassAvg] = useState(false);

  // Approved submissions
  const approvedSubs = useMemo(
    () => (submissions[courseId] ?? []).filter(s => s.status === "approved"),
    [submissions, courseId]
  );

  // All questions across all exams
  const allQs = useMemo(() => allExams.flatMap(e => e.questions), [allExams]);

  // Class-level CO attainment — merge marks per student across all approved exams
  // (flatMap would duplicate the same student from T1 + T2 submissions)
  const classAttainment = useMemo(() => {
    if (!approvedSubs.length || !allQs.length)
      return {} as Record<string, { attained: number; total: number; pct: number }>;
    // Build a merged mark row per unique roll
    const byRoll = new Map<string, { roll: string; name: string; marks: Record<string, number | "">; eitherOrChoices: Record<string, "a" | "b"> }>();
    approvedSubs.forEach(sub => {
      sub.students.forEach(s => {
        if (!byRoll.has(s.roll)) {
          byRoll.set(s.roll, { roll: s.roll, name: s.name, marks: {}, eitherOrChoices: {} });
        }
        const entry = byRoll.get(s.roll)!;
        Object.assign(entry.marks, s.marks);
        Object.assign(entry.eitherOrChoices, s.eitherOrChoices ?? {});
      });
    });
    const uniqueStudents = Array.from(byRoll.values());
    return computeCOAttainmentFromMarks(uniqueStudents, allQs, thresholds.targetPassPct);
  }, [approvedSubs, allQs, thresholds]);

  // This student's per-CO score and per-question marks
  const { myScores } = useMemo(() => {
    const mergedMarks: Record<string, number | ""> = {};
    const mergedChoices: Record<string, "a" | "b"> = {};
    approvedSubs.forEach(sub => {
      const row = sub.students.find(s => s.roll === myRoll);
      if (row) {
        Object.assign(mergedMarks, row.marks);
        Object.assign(mergedChoices, row.eitherOrChoices ?? {});
      }
    });

    const scores: Record<string, { scored: number; max: number; pct: number }> = {};
    const coQs: Record<string, typeof allQs> = {};
    allQs.forEach(q => { if (!coQs[q.co]) coQs[q.co] = []; coQs[q.co].push(q); });

    Object.entries(coQs).forEach(([co, qs]) => {
      let totalMax = 0, scored = 0;
      qs.forEach(q => {
        // For either-or: only count chosen question
        if (q.isEitherOr && q.eitherOrGroup) {
          const choice = mergedChoices[q.eitherOrGroup];
          const suffix = q.qno.slice(-1);
          if (choice && suffix !== choice) return; // skip unchosen
        }
        totalMax += q.maxMarks;
        const v = mergedMarks[q.qno];
        scored += v === "" || v === undefined ? 0 : Number(v);
      });
      scores[co] = {
        scored,
        max: totalMax,
        pct: totalMax > 0 ? Math.round((scored / totalMax) * 100) : 0,
      };
    });

    return { myScores: scores };
  }, [approvedSubs, allQs, myRoll]);

  // Radar chart data (S3-05/06)
  const radarData = useMemo(() => {
    return courseCOs.map(coDef => ({
      co: coDef.co,
      "My Score": myScores[coDef.co]?.pct ?? 0,
      "Class Avg": classAttainment[coDef.co]?.pct ?? 0,
    }));
  }, [courseCOs, myScores, classAttainment]);

  // Active exam data for marks sub-tab (S3-07–S3-11)
  const activeExam = useMemo(() => allExams.find(e => e.id === activeTab), [allExams, activeTab]);
  const activeApprovedSub = useMemo(
    () => approvedSubs.find(s => s.examId === activeTab),
    [approvedSubs, activeTab]
  );
  const myActiveRow = useMemo(
    () => activeApprovedSub?.students.find(s => s.roll === myRoll),
    [activeApprovedSub, myRoll]
  );

  const hasAnyData = Object.keys(myScores).length > 0;

  return (
    <AccessGate feature="student_co_view" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible"
        className="max-w-5xl mx-auto pb-32 flex flex-col">

        {/* ── BACK ── */}
        <motion.div variants={fadeSlideUp} className="pt-2 pb-6">
          <Link href="/student/dashboard"
            className="flex items-center gap-1.5 text-[10px] font-mono text-white/30 hover:text-cyan-400 transition-colors uppercase tracking-widest">
            <ChevronLeft className="w-3 h-3" /> Dashboard
          </Link>
        </motion.div>

        {/* ── S3-01 COURSE CONTEXT ── */}
        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-cyan-400" /> My CO Attainment
          </div>
          <h1 className="text-4xl font-display text-white">{course?.name}</h1>
          <p className="text-white/40 font-mono text-sm mt-1">
            {course?.code} &nbsp;·&nbsp; Semester {course?.semester}
            &nbsp;·&nbsp; Faculty: {faculty?.name ?? "—"}
            &nbsp;·&nbsp; Roll: {myRoll}
          </p>
        </motion.div>

        {!hasAnyData ? (
          <motion.div variants={fadeSlideUp} className="py-24 text-center text-white/20">
            <p className="text-sm font-mono italic">
              Results not yet published. Check back after marks are approved.
            </p>
          </motion.div>
        ) : (
          <>
            {/* ── S3-02/03/04 CO ATTAINMENT TABLE ── */}
            <motion.div variants={fadeSlideUp} className="pt-8 pb-8 border-b border-white/5">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">CO Attainment Summary</p>
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-white/10">
                    {["CO No", "CO Statement", "My Score", "Max Score", "My %", "Attained"].map(h => (
                      <th key={h} className="pb-3 pr-6 text-[9px] font-mono text-white/30 uppercase tracking-widest font-normal">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {courseCOs.map(coDef => {
                    const data    = myScores[coDef.co];
                    const pct     = data?.pct ?? 0;
                    const scored  = data?.scored ?? 0;
                    const max     = data?.max ?? 0;
                    const attained = pct >= thresholds.targetPassPct;
                    const gap      = thresholds.targetPassPct - pct;

                    return (
                      <Fragment key={coDef.co}>
                        <tr className="hover:bg-white/[0.01] transition-colors">
                          <td className="py-4 pr-6 font-mono text-sm text-cyan-400 align-top">{coDef.co}</td>
                          <td className="py-4 pr-6 align-top">
                            <p className="text-sm text-white/80 font-light">{coDef.desc}</p>
                            <p className="text-[10px] font-mono text-white/30 mt-0.5">{coDef.bloom} · {coDef.bloomCode}</p>
                          </td>
                          <td className="py-4 pr-6 font-mono text-sm text-white align-top">{max > 0 ? scored : "—"}</td>
                          <td className="py-4 pr-6 font-mono text-sm text-white/40 align-top">{max > 0 ? max : "—"}</td>
                          <td className="py-4 pr-6 align-top">
                            {max > 0 ? (
                              <div className="flex items-center gap-2">
                                <span className={`font-mono text-sm ${attained ? "text-emerald-400" : "text-amber-400"}`}>
                                  {pct}%
                                </span>
                                <div className="w-16 h-0.5 bg-white/5">
                                  <div
                                    className={`h-full ${attained ? "bg-emerald-400" : "bg-amber-400"}`}
                                    style={{ width: `${Math.min(pct, 100)}%` }}
                                  />
                                </div>
                              </div>
                            ) : (
                              <span className="text-white/20 font-mono text-sm">—</span>
                            )}
                          </td>
                          {/* S3-03 Attained column */}
                          <td className="py-4 align-top">
                            {max === 0 ? (
                              <span className="text-white/20 text-[10px] font-mono">N/A</span>
                            ) : attained ? (
                              <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                                <CheckCircle2 className="w-3 h-3" /> Yes
                              </span>
                            ) : (
                              <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                                <AlertTriangle className="w-3 h-3" /> No — improve by {gap}%
                              </span>
                            )}
                          </td>
                        </tr>
                        {/* S3-04 Improvement suggestion for non-attained COs */}
                        {!attained && max > 0 && (
                          <tr className="border-b-0">
                            <td />
                            <td colSpan={5} className="pb-4 pt-0">
                              <p className="text-[11px] text-white/30 font-light italic">
                                Suggested revision: {revisionTopic(coDef.desc)}
                              </p>
                            </td>
                          </tr>
                        )}
                      </Fragment>
                    );
                  })}
                </tbody>
              </table>
            </motion.div>

            {/* ── S3-05/06 RADAR CHART ── */}
            <motion.div variants={fadeSlideUp} className="pt-8 pb-8 border-b border-white/5">
              <div className="flex items-center justify-between mb-6">
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Visual Overview</p>
                {/* S3-06 Class compare toggle */}
                <button
                  onClick={() => setShowClassAvg(v => !v)}
                  className="flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-white/30 hover:text-cyan-400 transition-colors"
                >
                  {showClassAvg ? <EyeOff className="w-3 h-3" /> : <Eye className="w-3 h-3" />}
                  {showClassAvg ? "Hide class average" : "Compare with class average (anonymous)"}
                </button>
              </div>

              {radarData.length >= 3 ? (
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <RadarChart data={radarData}>
                      <PolarGrid stroke="rgba(255,255,255,0.08)" />
                      <PolarAngleAxis
                        dataKey="co"
                        tick={{ fill: "rgba(255,255,255,0.5)", fontSize: 11, fontFamily: "monospace" }}
                      />
                      <PolarRadiusAxis angle={30} domain={[0, 100]} tick={{ fill: "rgba(255,255,255,0.2)", fontSize: 9 }} />
                      <Radar
                        name="My Score"
                        dataKey="My Score"
                        stroke="#22d3ee"
                        fill="#22d3ee"
                        fillOpacity={0.25}
                        isAnimationActive
                        animationDuration={1200}
                      />
                      <AnimatePresence>
                        {showClassAvg && (
                          <Radar
                            name="Class Avg"
                            dataKey="Class Avg"
                            stroke="rgba(255,255,255,0.3)"
                            fill="rgba(255,255,255,0.05)"
                            fillOpacity={0.3}
                            isAnimationActive
                            animationDuration={800}
                          />
                        )}
                      </AnimatePresence>
                      <Tooltip
                        contentStyle={{ backgroundColor: "#0D1829", borderColor: "rgba(255,255,255,0.1)", borderRadius: 0, fontFamily: "monospace", fontSize: 11 }}
                        itemStyle={{ color: "#f8fafc" }}
                        formatter={(val: unknown) => [`${val}%`]}
                      />
                      {showClassAvg && (
                        <Legend
                          wrapperStyle={{ fontSize: 10, fontFamily: "monospace", opacity: 0.6, textTransform: "uppercase", letterSpacing: "0.1em" }}
                        />
                      )}
                    </RadarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                // Fallback bar chart when < 3 COs (radar needs ≥3 axes)
                <div className="h-32 flex items-end gap-4 px-4">
                  {courseCOs.map(coDef => {
                    const pct = myScores[coDef.co]?.pct ?? 0;
                    const attained = pct >= thresholds.targetPassPct;
                    return (
                      <div key={coDef.co} className="flex-1 flex flex-col items-center gap-2">
                        <div className="w-full flex justify-center items-end gap-0.5" style={{ height: "96px" }}>
                          <motion.div
                            initial={{ height: 0 }}
                            animate={{ height: `${Math.min(pct * 0.96, 96)}px` }}
                            className={`w-6 ${attained ? "bg-emerald-400/60" : "bg-amber-400/60"}`}
                          />
                        </div>
                        <span className="text-[10px] font-mono text-white/40">{coDef.co}</span>
                      </div>
                    );
                  })}
                </div>
              )}
            </motion.div>

            {/* ── S3-07 EXAM SELECTOR TABS ── */}
            <motion.div variants={fadeSlideUp} className="pt-8">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Exam-wise Marks</p>

              {/* Tabs */}
              <div className="flex border-b border-white/10 mb-6">
                {tabExams.map(exam => (
                  <button
                    key={exam.id}
                    onClick={() => setActiveTab(exam.id)}
                    className={`px-5 py-3 text-[10px] font-mono uppercase tracking-widest transition-colors border-b-2 -mb-px ${
                      activeTab === exam.id
                        ? "text-cyan-400 border-cyan-400"
                        : "text-white/30 border-transparent hover:text-white/60"
                    }`}
                  >
                    {exam.id === "see" ? "SEE" : exam.id.toUpperCase()}
                  </button>
                ))}
              </div>

              {/* S3-08/09/10/11 Marks table for active exam */}
              {activeExam && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <p className="text-sm font-display text-white">{activeExam.name}</p>
                      <p className="text-[10px] font-mono text-white/30 mt-0.5 uppercase">
                        {activeExam.group} · Max: {activeExam.maxMarks}
                      </p>
                    </div>
                    {myActiveRow && (
                      <div className="text-right">
                        {(() => {
                          const choices = myActiveRow.eitherOrChoices ?? {};
                          const total = activeExam.questions.reduce((acc, q) => {
                            if (q.isEitherOr && q.eitherOrGroup) {
                              const choice = choices[q.eitherOrGroup];
                              if (choice && q.qno.slice(-1) !== choice) return acc;
                            }
                            const v = myActiveRow.marks[q.qno];
                            return acc + (v === "" || v === undefined ? 0 : Number(v));
                          }, 0);
                          return (
                            <>
                              <p className="text-2xl font-display text-cyan-400">{total}</p>
                              <p className="text-[10px] font-mono text-white/30">/ {activeExam.maxMarks}</p>
                            </>
                          );
                        })()}
                      </div>
                    )}
                  </div>

                  {!activeApprovedSub ? (
                    <p className="text-white/20 text-sm font-mono italic py-6">
                      Marks not yet approved for this exam.
                    </p>
                  ) : !myActiveRow ? (
                    <p className="text-white/20 text-sm font-mono italic py-6">
                      You were not found in this exam&apos;s submission.
                    </p>
                  ) : activeExam.questions.length === 0 ? (
                    <p className="text-white/20 text-sm font-mono italic py-6">
                      No question-level breakdown available for this exam.
                    </p>
                  ) : (
                    <div className="overflow-x-auto">
                      <table className="w-full text-left border-collapse">
                        <thead>
                          <tr className="border-b border-white/10">
                            {["Q Code", "CO", "BT Level", "Max Marks", "My Marks", "Either-Or Note"].map(h => (
                              <th key={h} className="pb-3 pr-6 text-[9px] font-mono text-white/30 uppercase tracking-widest font-normal">{h}</th>
                            ))}
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {activeExam.questions.map(q => {
                            const choices = myActiveRow.eitherOrChoices ?? {};
                            const isEitherOr = q.isEitherOr && q.eitherOrGroup;
                            const suffix     = q.qno.slice(-1); // "a" or "b"
                            const choice     = isEitherOr ? choices[q.eitherOrGroup!] : undefined;
                            const attempted  = !isEitherOr || !choice || suffix === choice;

                            const rawVal = myActiveRow.marks[q.qno];
                            const num    = attempted && rawVal !== "" && rawVal !== undefined ? Number(rawVal) : null;
                            const pct    = num !== null && q.maxMarks > 0 ? (num / q.maxMarks) * 100 : null;

                            // S3-09 Either-Or note
                            let eitherOrNote = "—";
                            if (isEitherOr) {
                              eitherOrNote = attempted ? "Attempted" : "Not Attempted — N/A";
                            }

                            return (
                              <tr key={q.qno} className={`hover:bg-white/[0.01] transition-colors ${!attempted ? "opacity-40" : ""}`}>
                                {/* S3-08 Q Code */}
                                <td className="py-3 pr-6 font-mono text-xs text-cyan-400">{q.qno}</td>
                                <td className="py-3 pr-6 font-mono text-xs text-white/60">{q.co}</td>
                                {/* S3-10 BT Level */}
                                <td className="py-3 pr-6 font-mono text-[10px] text-white/40">
                                  {q.bloomCode ? BLOOMS_NAMES[q.bloomCode] ?? q.bloomCode : "—"}
                                </td>
                                <td className="py-3 pr-6 font-mono text-xs text-white/40">{q.maxMarks}</td>
                                {/* My Marks */}
                                <td className="py-3 pr-6">
                                  {num !== null ? (
                                    <span className={`font-mono text-sm ${
                                      pct! >= 60 ? "text-emerald-400" : pct! >= 40 ? "text-amber-400" : "text-red-400"
                                    }`}>
                                      {num}
                                    </span>
                                  ) : (
                                    <span className="text-white/20 font-mono text-sm">—</span>
                                  )}
                                </td>
                                {/* S3-09 Either-Or Note */}
                                <td className="py-3 font-mono text-[10px]">
                                  {isEitherOr ? (
                                    <span className={attempted ? "text-emerald-400/70" : "text-white/20"}>
                                      {eitherOrNote}
                                    </span>
                                  ) : (
                                    <span className="text-white/20">—</span>
                                  )}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                        {/* S3-11 Exam total footer row: Total: X / Max: Y */}
                        <tfoot>
                          <tr className="border-t border-white/10">
                            <td colSpan={4} className="pt-3 font-mono text-[10px] text-white/30 uppercase tracking-widest">
                              {(() => {
                                const choices = myActiveRow.eitherOrChoices ?? {};
                                const total = activeExam.questions.reduce((acc, q) => {
                                  if (q.isEitherOr && q.eitherOrGroup) {
                                    const choice = choices[q.eitherOrGroup];
                                    if (choice && q.qno.slice(-1) !== choice) return acc;
                                  }
                                  const v = myActiveRow.marks[q.qno];
                                  return acc + (v === "" || v === undefined ? 0 : Number(v));
                                }, 0);
                                return (
                                  <span className="text-cyan-400 text-sm font-medium">
                                    Total: {total}
                                    <span className="text-white/30 font-normal"> / Max: {activeExam.maxMarks}</span>
                                  </span>
                                );
                              })()}
                            </td>
                            <td /><td />
                          </tr>
                        </tfoot>
                      </table>
                    </div>
                  )}
                </div>
              )}
            </motion.div>
          </>
        )}

      </motion.div>
    </AccessGate>
  );
}
