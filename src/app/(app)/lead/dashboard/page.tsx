"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { useDataStore, CO_PO_MAPPING, PROGRAM_OUTCOMES, PROGRAM_SPECIFIC_OUTCOMES } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { computeCOAttainmentFromMarks, computePOAttainment, getAttainmentLevel } from "@/lib/computations";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// ── helpers ──────────────────────────────────────────────────

function waitDays(submittedAt?: string) {
  if (!submittedAt) return 0;
  return Math.floor((Date.now() - new Date(submittedAt).getTime()) / 86_400_000);
}

function waitColor(days: number) {
  if (days < 1) return "text-attain";
  if (days <= 3) return "text-amber-400";
  return "text-alert";
}

function urgencyLabel(days: number) {
  if (days < 1) return "Normal";
  if (days <= 3) return "High";
  return "Critical";
}

function urgencyColor(days: number) {
  if (days < 1) return "text-white/50";
  if (days <= 3) return "text-amber-400";
  return "text-alert font-bold";
}

function levelText(pct: number, thresholds: { level3: number; level2: number }) {
  if (pct >= thresholds.level3) return "L3";
  if (pct >= thresholds.level2) return "L2";
  return "L1";
}

// ─────────────────────────────────────────────────────────────

export default function LeadDashboardPage() {
  const { user, activeAY } = useAuthStore();
  const courses      = useDataStore(s => s.courses);
  const submissions  = useDataStore(s => s.submissions);
  const examConfigs  = useDataStore(s => s.examConfigs);
  const cos          = useDataStore(s => s.cos);
  const thresholds   = useDataStore(s => s.thresholds);
  const coPOMappings = useDataStore(s => s.coPOMappings);
  const auditLog     = useDataStore(s => s.auditLog);
  const remedialActions = useDataStore(s => s.remedialActions);

  const dept = user?.department || "CSE";

  // ── L1-03: Approval queue ────────────────────────────────
  const approvalQueue = useMemo(() => {
    const rows: {
      courseCode: string; courseName: string; courseId: string;
      examName: string; examId: string;
      submittedAt?: string; days: number;
    }[] = [];
    for (const c of courses) {
      const exams = examConfigs[c.id] || [];
      for (const sub of (submissions[c.id] || [])) {
        if (sub.status !== "pending") continue;
        const exam = exams.find(e => e.id === sub.examId);
        const days = waitDays(sub.submittedAt);
        rows.push({
          courseCode: c.code, courseName: c.name, courseId: c.id,
          examName: exam?.name || sub.examId.toUpperCase(), examId: sub.examId,
          submittedAt: sub.submittedAt?.substring(0, 10), days,
        });
      }
    }
    return rows.sort((a, b) => b.days - a.days);
  }, [courses, submissions, examConfigs]);

  // ── L1-06: CO health per course ──────────────────────────
  const coHealth = useMemo(() => {
    return courses.map(c => {
      const subs   = (submissions[c.id] || []).filter(s => s.status === "approved");
      const exams  = examConfigs[c.id] || [];
      const marks  = subs.flatMap(s => s.students);
      const qs     = exams.flatMap(e => e.questions);
      const coList = cos[c.id] || [];
      const att    = marks.length && qs.length
        ? computeCOAttainmentFromMarks(marks, qs, thresholds.targetPassPct)
        : {};
      const faculty = "Mr. Sanjay Kapoor"; // from seed; real app would join users
      return { course: c, coList, att, faculty };
    });
  }, [courses, submissions, examConfigs, cos, thresholds]);

  // ── L1-07: Alert counts ──────────────────────────────────
  const { l1COCount, l1CourseCount } = useMemo(() => {
    let coCount = 0; const courseSet = new Set<string>();
    for (const { course, coList, att } of coHealth) {
      for (const co of coList) {
        const pct = att[co.co]?.pct ?? 0;
        if (levelText(pct, thresholds) === "L1") {
          coCount++;
          courseSet.add(course.id);
        }
      }
    }
    return { l1COCount: coCount, l1CourseCount: courseSet.size };
  }, [coHealth, thresholds]);

  // ── L1-08/09: PO/PSO attainment ─────────────────────────
  const { poResults, psoResults } = useMemo(() => {
    const allCOPcts: { co: string; pct: number }[] = [];
    for (const { coList, att } of coHealth) {
      for (const co of coList) {
        allCOPcts.push({ co: co.co, pct: att[co.co]?.pct ?? 0 });
      }
    }
    const mapping = Object.keys(coPOMappings).length
      ? Object.values(coPOMappings).reduce((a, m) => ({ ...a, ...m }), {})
      : CO_PO_MAPPING;
    const po = allCOPcts.length ? computePOAttainment(allCOPcts, mapping) : {};
    const pso: Record<string, { pct: number }> = {};
    PROGRAM_SPECIFIC_OUTCOMES.forEach(p => { if (po[p.id]) pso[p.id] = po[p.id]; });
    return { poResults: po, psoResults: pso };
  }, [coHealth, coPOMappings]);

  // ── L1-02: Status summary ────────────────────────────────
  const pendingCount  = approvalQueue.length;
  const remedialOverdue = useMemo(() => {
    let count = 0;
    for (const { course, coList, att } of coHealth) {
      for (const co of coList) {
        const pct = att[co.co]?.pct ?? 0;
        if (levelText(pct, thresholds) === "L1") {
          const saved = remedialActions[course.id]?.[co.co];
          if (!saved) count++;
        }
      }
    }
    return count;
  }, [coHealth, thresholds, remedialActions]);

  // ── L1-10: Recent actions ────────────────────────────────
  const recentActions = useMemo(() =>
    [...auditLog]
      .sort((a, b) => b.timestamp.localeCompare(a.timestamp))
      .slice(0, 10),
    [auditLog]
  );

  // All unique COs across courses (for CO health table header)
  const maxCOs = useMemo(() =>
    Math.max(0, ...coHealth.map(r => r.coList.length)),
    [coHealth]
  );

  return (
    <AccessGate feature="marks_approval" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible"
        className="flex flex-col gap-0 pb-32">

        {/* ── L1-01: Header ── */}
        <motion.div variants={fadeSlideUp} className="pb-6 border-b border-white/5">
          <p className="text-xs font-mono text-white/50">
            Course Lead Dashboard — {dept} | AY {activeAY}
          </p>
        </motion.div>

        {/* ── L1-02: Status summary ── */}
        <motion.div variants={fadeSlideUp} className="py-4 border-b border-white/5">
          <p className="text-sm font-mono text-white/70">
            {courses.length} courses
            {" | "}
            <span className={pendingCount > 0 ? "text-amber-400" : ""}>{pendingCount} pending approval</span>
            {" | "}
            <span className={l1COCount > 0 ? "text-alert" : ""}>{l1COCount} Level 1 CO alert{l1COCount !== 1 ? "s" : ""}</span>
            {" | "}
            <span className={remedialOverdue > 0 ? "text-alert" : ""}>{remedialOverdue} remedial overdue</span>
          </p>
        </motion.div>

        {/* ── L1-03/04/05: Approval queue table ── */}
        <motion.div variants={fadeSlideUp} className="py-8 border-b border-white/5 flex flex-col gap-4">
          <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Approval Queue</h2>
          {approvalQueue.length === 0 ? (
            <p className="text-sm font-mono text-white/20 italic">No pending submissions.</p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {["Course", "Faculty", "Exam", "Submitted", "Wait Time", "Urgency", "Action"].map(h => (
                    <th key={h} className="px-4 py-3 text-[9px] font-mono text-white/30 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {approvalQueue.map((row, i) => (
                  <tr key={i} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-3 text-xs font-mono text-white">{row.courseCode}</td>
                    <td className="px-4 py-3 text-xs text-white/50">Mr. Sanjay Kapoor</td>
                    <td className="px-4 py-3 text-xs text-white/70">{row.examName}</td>
                    <td className="px-4 py-3 text-xs font-mono text-white/40">{row.submittedAt || "—"}</td>
                    {/* L1-04: wait time colour */}
                    <td className={`px-4 py-3 text-xs font-mono ${waitColor(row.days)}`}>
                      {row.days < 1 ? "< 1 day" : `${row.days} day${row.days !== 1 ? "s" : ""}`}
                    </td>
                    {/* L1-03: urgency text */}
                    <td className={`px-4 py-3 text-xs font-mono ${urgencyColor(row.days)}`}>
                      {urgencyLabel(row.days)}
                    </td>
                    {/* L1-05: right-aligned Review link */}
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/lead/marks-approval`}
                        className="text-xs font-mono text-brand hover:underline"
                      >
                        Review →
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* ── L1-06/07: CO health table ── */}
        <motion.div variants={fadeSlideUp} className="py-8 border-b border-white/5 flex flex-col gap-4">
          <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">CO Health</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                <th className="px-4 py-3 text-[9px] font-mono text-white/30 uppercase tracking-widest">Course</th>
                {Array.from({ length: maxCOs }, (_, i) => (
                  <th key={i} className="px-4 py-3 text-[9px] font-mono text-white/30 uppercase tracking-widest text-center">
                    CO{i + 1}
                  </th>
                ))}
                <th className="px-4 py-3 text-[9px] font-mono text-white/30 uppercase tracking-widest">Faculty</th>
              </tr>
            </thead>
            <tbody>
              {coHealth.map(({ course, coList, att, faculty }) => (
                <tr key={course.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                  <td className="px-4 py-3 text-xs font-mono text-white">{course.code}</td>
                  {Array.from({ length: maxCOs }, (_, i) => {
                    const co = coList[i];
                    if (!co) return <td key={i} className="px-4 py-3 text-center text-white/20 text-xs">—</td>;
                    const pct = att[co.co]?.pct ?? 0;
                    const lvl = levelText(pct, thresholds);
                    return (
                      <td key={i} className={`px-4 py-3 text-center text-xs font-mono ${lvl === "L1" ? "text-alert font-bold" : "text-white/60"}`}>
                        {lvl}
                      </td>
                    );
                  })}
                  <td className="px-4 py-3 text-xs text-white/40">{faculty}</td>
                </tr>
              ))}
            </tbody>
          </table>
          {/* L1-07: Alert summary */}
          {l1COCount > 0 && (
            <p className="text-sm font-mono text-alert">
              {l1COCount} CO{l1COCount !== 1 ? "s" : ""} at Level 1 across {l1CourseCount} course{l1CourseCount !== 1 ? "s" : ""} require remedial action
            </p>
          )}
        </motion.div>

        {/* ── L1-08: PO summary table ── */}
        <motion.div variants={fadeSlideUp} className="py-8 border-b border-white/5 flex flex-col gap-4">
          <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">PO Attainment</h2>
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10 bg-white/[0.02]">
                {["PO Code", "Attainment %", "Level", "Target Met"].map(h => (
                  <th key={h} className="px-4 py-3 text-[9px] font-mono text-white/30 uppercase tracking-widest">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {PROGRAM_OUTCOMES.map(po => {
                const pct = poResults[po.id]?.pct ?? 0;
                const lvl = levelText(pct, thresholds);
                const met = lvl === "L3";
                return (
                  <tr key={po.id} className="border-b border-white/5 hover:bg-white/[0.01] transition-colors">
                    <td className="px-4 py-2 text-xs font-mono text-white">{po.id}</td>
                    <td className="px-4 py-2 text-xs font-mono text-white/70">{pct > 0 ? `${pct}%` : "—"}</td>
                    <td className={`px-4 py-2 text-xs font-mono ${lvl === "L1" ? "text-alert" : lvl === "L2" ? "text-amber-400" : "text-attain"}`}>{pct > 0 ? lvl : "—"}</td>
                    <td className={`px-4 py-2 text-xs font-mono ${met ? "text-attain" : pct > 0 ? "text-alert" : "text-white/20"}`}>
                      {pct > 0 ? (met ? "Yes" : "No") : "—"}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>

          {/* L1-09: PSO summary lines */}
          <p className="text-sm font-mono text-white/60">
            {PROGRAM_SPECIFIC_OUTCOMES.map((pso, i) => {
              const pct = psoResults[pso.id]?.pct ?? 0;
              const lvl = levelText(pct, thresholds);
              const met = lvl === "L3" ? "Met" : lvl === "L2" ? "Partial" : "Not Met";
              return (
                <span key={pso.id}>
                  {i > 0 && " | "}
                  {pso.id}: {pct > 0 ? `${pct}% (${lvl === "L3" ? "Level 3" : lvl === "L2" ? "Level 2" : "Level 1"} — ${met})` : "No data"}
                </span>
              );
            })}
          </p>
        </motion.div>

        {/* ── L1-10: Recent actions ── */}
        <motion.div variants={fadeSlideUp} className="py-8 flex flex-col gap-4">
          <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Recent Actions</h2>
          <ol className="flex flex-col gap-2 list-decimal list-inside">
            {recentActions.map((entry, i) => (
              <li key={entry.id} className="text-xs font-mono text-white/50">
                <span className="text-white/30 mr-2">{entry.timestamp}</span>
                {entry.action}
              </li>
            ))}
            {recentActions.length === 0 && (
              <li className="text-xs font-mono text-white/20 italic list-none">No recent actions.</li>
            )}
          </ol>
        </motion.div>

      </motion.div>
    </AccessGate>
  );
}
