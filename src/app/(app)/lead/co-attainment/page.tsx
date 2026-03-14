"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  AlertTriangle,
  ChevronDown,
  ChevronUp,
  FileDown,
  SplitSquareHorizontal,
} from "lucide-react";
import * as XLSX from "xlsx";
import { useDataStore } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useAuthStore } from "@/lib/authStore";

type CORow = {
  co: string;
  statement: string;
  cie: number;
  see: number;
  final: number;
  level: number;
  attained: number;
  total: number;
};

type CourseSummary = {
  rows: CORow[];
  avgLevel: number;
  marksStatus: string;
};

export default function LeadCOAttainmentPage() {
  const { user } = useAuthStore();
  const courses = useDataStore(s => s.courses);
  const users = useDataStore(s => s.users);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const thresholds = useDataStore(s => s.thresholds);
  const cos = useDataStore(s => s.cos);
  const remedialActions = useDataStore(s => s.remedialActions);
  const coOverrides = useDataStore(s => s.coOverrides || {});
  const setCOOverride = useDataStore(s => s.setCOOverride);
  const addAuditEntry = useDataStore(s => s.addAuditEntry);
  const addFacultyNotification = useDataStore(s => s.addFacultyNotification);
  const auditLog = useDataStore(s => s.auditLog);

  const [filterCourse, setFilterCourse] = useState("all");
  const [filterSemester, setFilterSemester] = useState("all");
  const [filterStatus, setFilterStatus] = useState<"all" | "normal" | "alert" | "pending">("all");

  const [expandedCourses, setExpandedCourses] = useState<string[]>([]);

  const [compareMode, setCompareMode] = useState(false);
  const [compareA, setCompareA] = useState<string>(courses[0]?.id || "");
  const [compareB, setCompareB] = useState<string>(courses[1]?.id || courses[0]?.id || "");

  const [overrideTarget, setOverrideTarget] = useState<{ courseId: string; co: string; fromLevel: number } | null>(null);
  const [overrideLevel, setOverrideLevel] = useState<number>(2);
  const [justification, setJustification] = useState("");
  const [drilldownKey, setDrilldownKey] = useState<string | null>(null);

  const courseData = useMemo(() => {
    const out: Record<string, CourseSummary> = {};

    courses.forEach(course => {
      const subs = submissions[course.id] || [];
      const exams = examConfigs[course.id] || [];
      const coDefs = cos[course.id] || [];

      const cieExams = exams.filter(e => e.group === "CIE");
      const seeExams = exams.filter(e => e.group === "SEE");

      const cieMarks = subs
        .filter(s => s.status === "approved" && cieExams.some(e => e.id === s.examId))
        .flatMap(s => s.students);
      const seeMarks = subs
        .filter(s => s.status === "approved" && seeExams.some(e => e.id === s.examId))
        .flatMap(s => s.students);
      const allMarks = subs.filter(s => s.status === "approved").flatMap(s => s.students);

      const cieQs = cieExams.flatMap(e => e.questions);
      const seeQs = seeExams.flatMap(e => e.questions);
      const allQs = exams.flatMap(e => e.questions);

      const marksStatus = subs.some(s => s.status === "pending")
        ? "Pending approval"
        : allMarks.length > 0
        ? "Approved marks available"
        : "No approved marks";

      if (!allMarks.length || !allQs.length) {
        const emptyRows: CORow[] = coDefs.map(cd => ({
          co: cd.co,
          statement: cd.desc,
          cie: 0,
          see: 0,
          final: 0,
          level: 1,
          attained: 0,
          total: 0,
        }));

        out[course.id] = {
          rows: emptyRows,
          avgLevel: 0,
          marksStatus,
        };
        return;
      }

      const cieAtt = cieMarks.length && cieQs.length
        ? computeCOAttainmentFromMarks(cieMarks, cieQs, thresholds.targetPassPct)
        : {};
      const seeAtt = seeMarks.length && seeQs.length
        ? computeCOAttainmentFromMarks(seeMarks, seeQs, thresholds.targetPassPct)
        : {};
      const finalAtt = computeCOAttainmentFromMarks(allMarks, allQs, thresholds.targetPassPct);

      const rows: CORow[] = coDefs.map(cd => {
        const final = finalAtt[cd.co] || { attained: 0, total: 0, pct: 0 };
        const lvl = getAttainmentLevel(final.pct, thresholds);
        return {
          co: cd.co,
          statement: cd.desc,
          cie: cieAtt[cd.co]?.pct ?? 0,
          see: seeAtt[cd.co]?.pct ?? 0,
          final: final.pct,
          level: lvl.level,
          attained: final.attained,
          total: final.total,
        };
      });

      const avgLevel = rows.length
        ? Math.round((rows.reduce((sum, row) => sum + row.level, 0) / rows.length) * 10) / 10
        : 0;

      out[course.id] = {
        rows,
        avgLevel,
        marksStatus,
      };
    });

    return out;
  }, [courses, submissions, examConfigs, thresholds, cos]);

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      if (filterCourse !== "all" && c.id !== filterCourse) return false;
      if (filterSemester !== "all" && String(c.semester) !== filterSemester) return false;

      if (filterStatus !== "all") {
        const info = courseData[c.id];
        const hasAlert = (info?.rows || []).some(r => r.level === 1 || r.level === 2);
        const isPending = info?.marksStatus === "Pending approval";

        if (filterStatus === "alert" && !hasAlert) return false;
        if (filterStatus === "normal" && hasAlert) return false;
        if (filterStatus === "pending" && !isPending) return false;
      }

      return true;
    });
  }, [courses, filterCourse, filterSemester, filterStatus, courseData]);

  const toggleCourse = (courseId: string) => {
    setExpandedCourses(prev =>
      prev.includes(courseId) ? prev.filter(id => id !== courseId) : [...prev, courseId],
    );
  };

  const expandAll = () => setExpandedCourses(filteredCourses.map(c => c.id));
  const collapseAll = () => setExpandedCourses([]);

  const exportAll = () => {
    const rows = filteredCourses.flatMap(c => {
      const info = courseData[c.id];
      return (info?.rows || []).map(r => ({
        CourseCode: c.code,
        CourseName: c.name,
        COCode: r.co,
        Statement: r.statement,
        CIE: r.cie,
        SEE: r.see,
        Final: r.final,
        Level: `L${r.level}`,
        RemedialStatus:
          remedialActions[c.id]?.[r.co]
            ? "Filed"
            : r.level === 1
            ? "Pending"
            : "N/A",
      }));
    });

    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, XLSX.utils.json_to_sheet(rows), "Lead CO Attainment");
    XLSX.writeFile(wb, "lead-co-attainment-all-courses.xlsx");
  };

  const getOverrideHistory = (courseId: string, co: string) => {
    return auditLog
      .filter(
        a =>
          a.type === "override" &&
          a.action.includes(`course=${courseId}`) &&
          a.action.includes(`co=${co}`),
      )
      .slice(0, 10);
  };

  const saveOverride = () => {
    if (!overrideTarget || !justification.trim() || !user) return;

    setCOOverride(overrideTarget.courseId, overrideTarget.co, {
      original: overrideTarget.fromLevel,
      overridden: overrideLevel,
      by: user.name,
      at: new Date().toISOString(),
      reason: justification.trim(),
    });

    addAuditEntry({
      type: "override",
      userId: user.id,
      role: "subject_lead",
      action: `CO override | course=${overrideTarget.courseId} | co=${overrideTarget.co} | from=${overrideTarget.fromLevel} | to=${overrideLevel} | reason=${justification.trim()}`,
      ip: "127.0.0.1",
      result: "success",
    });

    users
      .filter(u => u.roles.includes("department_head"))
      .forEach(hod => {
        addFacultyNotification({
          userId: hod.id,
          type: "critical",
          title: "Lead CO Override Submitted",
          message: `${user.name} overridden ${overrideTarget.co} in ${overrideTarget.courseId.toUpperCase()} to Level ${overrideLevel}.`,
          link: "/hod/co-attainment",
        });
      });

    setOverrideTarget(null);
    setJustification("");
  };

  const renderComparison = () => {
    const courseA = courses.find(c => c.id === compareA);
    const courseB = courses.find(c => c.id === compareB);
    const rowsA = courseData[compareA]?.rows || [];
    const rowsB = courseData[compareB]?.rows || [];
    const coSet = Array.from(new Set([...rowsA.map(r => r.co), ...rowsB.map(r => r.co)]));

    return (
      <div className="border border-white/10 mt-6">
        <div className="grid grid-cols-2 divide-x divide-white/10">
          <div className="p-4 border-b border-white/10 bg-white/[0.02]">
            <p className="text-xs font-mono text-brand uppercase tracking-widest">Course A</p>
            <p className="text-sm text-white mt-1">{courseA?.code} - {courseA?.name}</p>
          </div>
          <div className="p-4 border-b border-white/10 bg-white/[0.02]">
            <p className="text-xs font-mono text-brand uppercase tracking-widest">Course B</p>
            <p className="text-sm text-white mt-1">{courseB?.code} - {courseB?.name}</p>
          </div>
        </div>

        <table className="w-full border-collapse text-xs">
          <thead className="bg-white/[0.02] border-b border-white/10">
            <tr>
              <th className="px-3 py-2 text-left text-[10px] font-mono text-white/30 uppercase">CO</th>
              <th className="px-3 py-2 text-left text-[10px] font-mono text-white/30 uppercase">Statement</th>
              <th className="px-3 py-2 text-left text-[10px] font-mono text-white/30 uppercase">A Final %</th>
              <th className="px-3 py-2 text-left text-[10px] font-mono text-white/30 uppercase">B Final %</th>
            </tr>
          </thead>
          <tbody>
            {coSet.map(co => {
              const a = rowsA.find(r => r.co === co);
              const b = rowsB.find(r => r.co === co);
              return (
                <tr key={co} className="border-b border-white/5">
                  <td className="px-3 py-2 font-mono text-brand">{co}</td>
                  <td className="px-3 py-2 text-white/60">{a?.statement || b?.statement || "-"}</td>
                  <td className="px-3 py-2 text-white">{a ? `${a.final}%` : "-"}</td>
                  <td className="px-3 py-2 text-white">{b ? `${b.final}%` : "-"}</td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    );
  };

  return (
    <AccessGate feature="co_attainment" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Attainment Analytics
            </div>
            <h1 className="text-4xl font-display text-white">Course Outcome Tracking</h1>
            <p className="text-white/40 font-light mt-1">Portfolio-wide CO attainment from approved marks.</p>
          </div>
          <div className="flex items-center gap-4">
            <button
              onClick={() => setCompareMode(v => !v)}
              className="text-[11px] font-mono uppercase tracking-widest text-brand hover:text-white inline-flex items-center gap-2"
            >
              <SplitSquareHorizontal className="w-3.5 h-3.5" /> Compare two courses
            </button>
            <button
              onClick={exportAll}
              className="text-[11px] font-mono uppercase tracking-widest text-white/60 hover:text-white inline-flex items-center gap-2"
            >
              <FileDown className="w-3.5 h-3.5" /> Export all courses to Excel
            </button>
          </div>
        </motion.div>

        <div className="grid gap-3 py-5 border-b border-white/5 md:grid-cols-3">
          <select value={filterCourse} onChange={e => setFilterCourse(e.target.value)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
            <option value="all" className="bg-[#0a0a0f]">Course: All</option>
            {courses.map(c => (
              <option key={c.id} value={c.id} className="bg-[#0a0a0f]">{c.code} - {c.name}</option>
            ))}
          </select>

          <select value={filterSemester} onChange={e => setFilterSemester(e.target.value)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
            <option value="all" className="bg-[#0a0a0f]">Semester: All</option>
            {Array.from(new Set(courses.map(c => c.semester))).sort((a, b) => a - b).map(sem => (
              <option key={sem} value={String(sem)} className="bg-[#0a0a0f]">Semester {sem}</option>
            ))}
          </select>

          <select value={filterStatus} onChange={e => setFilterStatus(e.target.value as "all" | "normal" | "alert" | "pending")} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
            <option value="all" className="bg-[#0a0a0f]">Status: All</option>
            <option value="normal" className="bg-[#0a0a0f]">Normal</option>
            <option value="alert" className="bg-[#0a0a0f]">Needs attention</option>
            <option value="pending" className="bg-[#0a0a0f]">Pending approval</option>
          </select>
        </div>

        <div className="py-3 border-b border-white/5 flex items-center gap-4">
          <button onClick={expandAll} className="text-[11px] font-mono uppercase tracking-widest text-brand hover:text-white">Expand all</button>
          <button onClick={collapseAll} className="text-[11px] font-mono uppercase tracking-widest text-white/50 hover:text-white">Collapse all</button>
        </div>

        {compareMode && (
          <div className="grid gap-3 py-5 border-b border-white/5 md:grid-cols-2">
            <select value={compareA} onChange={e => setCompareA(e.target.value)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
              {courses.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0f]">Course A: {c.code} - {c.name}</option>
              ))}
            </select>
            <select value={compareB} onChange={e => setCompareB(e.target.value)} className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white/70 outline-none">
              {courses.map(c => (
                <option key={c.id} value={c.id} className="bg-[#0a0a0f]">Course B: {c.code} - {c.name}</option>
              ))}
            </select>
          </div>
        )}

        {compareMode && renderComparison()}

        {!compareMode && (
          <motion.div variants={fadeSlideUp} className="flex flex-col gap-0">
            <table className="w-full border-collapse text-xs">
              <thead>
                <tr className="border-b border-white/10 bg-white/[0.02]">
                  {["Code", "Name", "Faculty", "COs Generated", "Avg Level", "Marks Status", "Expand"].map(h => (
                    <th key={h} className="px-4 py-3 text-left text-[9px] font-mono text-white/30 uppercase tracking-widest">{h}</th>
                  ))}
                </tr>
              </thead>

              <tbody>
                {filteredCourses.map(course => {
                  const info = courseData[course.id];
                  const faculty = users.find(u => u.id === course.facultyId);
                  const hasAlert = (info?.rows || []).some(r => r.level === 1 || r.level === 2);
                  const expanded = expandedCourses.includes(course.id);

                  return (
                    <>
                      <tr key={course.id} className={`border-b border-white/5 ${hasAlert ? "bg-alert/5" : ""}`}>
                        <td className="px-4 py-3 font-mono text-brand">{course.code}</td>
                        <td className="px-4 py-3 text-white/75">{course.name}</td>
                        <td className="px-4 py-3 text-white/55">{faculty?.name || "-"}</td>
                        <td className="px-4 py-3 text-white/55">{(cos[course.id] || []).length}</td>
                        <td className="px-4 py-3 text-white/55">{info?.avgLevel || 0}</td>
                        <td className="px-4 py-3 text-white/55">{info?.marksStatus || "No data"}</td>
                        <td className="px-4 py-3">
                          <button onClick={() => toggleCourse(course.id)} className="text-white/50 hover:text-white">
                            {expanded ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                          </button>
                        </td>
                      </tr>

                      {expanded && (
                        <tr>
                          <td colSpan={7} className="px-0 py-0 border-b border-white/10">
                            <div className="p-4 bg-white/[0.01]">
                              <table className="w-full border-collapse text-xs">
                                <thead>
                                  <tr className="border-b border-white/10">
                                    {[
                                      "CO Code",
                                      "Statement",
                                      "CIE%",
                                      "SEE%",
                                      "Final%",
                                      "Level",
                                      "Remedial Status",
                                      "Override",
                                    ].map(h => (
                                      <th key={h} className="px-3 py-2 text-left text-[9px] font-mono text-white/30 uppercase tracking-widest">{h}</th>
                                    ))}
                                  </tr>
                                </thead>

                                <tbody>
                                  {(info?.rows || []).map(row => {
                                    const override = (coOverrides[course.id] || {})[row.co] as
                                      | { original: number; overridden: number; by: string; at: string; reason?: string }
                                      | undefined;
                                    const effectiveLevel = override?.overridden || row.level;
                                    const remedial = remedialActions[course.id]?.[row.co]
                                      ? "Filed"
                                      : effectiveLevel === 1
                                      ? "Pending"
                                      : "N/A";
                                    const drillId = `${course.id}-${row.co}`;
                                    const history = getOverrideHistory(course.id, row.co);

                                    return (
                                      <>
                                        <tr key={`${course.id}-${row.co}`} className="border-b border-white/5">
                                          <td className="px-3 py-2 font-mono text-brand">{row.co}</td>
                                          <td className="px-3 py-2 text-white/65">{row.statement}</td>
                                          <td className="px-3 py-2 text-white/65">{row.cie}%</td>
                                          <td className="px-3 py-2 text-white/65">{row.see}%</td>
                                          <td className="px-3 py-2">
                                            <button
                                              onClick={() => setDrilldownKey(prev => (prev === drillId ? null : drillId))}
                                              className="font-mono text-white hover:text-brand"
                                            >
                                              {row.final}%
                                            </button>
                                          </td>
                                          <td className="px-3 py-2 text-white/65">L{effectiveLevel}</td>
                                          <td className={`px-3 py-2 ${remedial === "Pending" ? "text-alert" : "text-white/65"}`}>{remedial}</td>
                                          <td className="px-3 py-2">
                                            <button
                                              onClick={() => {
                                                setOverrideTarget({ courseId: course.id, co: row.co, fromLevel: effectiveLevel });
                                                setOverrideLevel(effectiveLevel);
                                                setJustification("");
                                              }}
                                              className="text-[10px] font-mono uppercase tracking-widest text-brand hover:text-white"
                                            >
                                              Override
                                            </button>
                                          </td>
                                        </tr>

                                        {drilldownKey === drillId && (
                                          <tr>
                                            <td colSpan={8} className="px-3 py-2 text-[11px] text-white/60 bg-white/[0.02]">
                                              {row.attained} of {row.total} students attained. {Math.max(row.total - row.attained, 0)} failed.
                                            </td>
                                          </tr>
                                        )}

                                        {overrideTarget?.courseId === course.id && overrideTarget?.co === row.co && (
                                          <tr>
                                            <td colSpan={8} className="px-3 py-3 bg-brand/[0.06] border-y border-brand/20">
                                              <div className="grid gap-2 md:grid-cols-[140px_1fr_160px]">
                                                <select
                                                  value={overrideLevel}
                                                  onChange={e => setOverrideLevel(Number(e.target.value))}
                                                  className="bg-transparent border border-white/15 px-2 py-2 text-xs text-white/70 outline-none"
                                                >
                                                  <option value={1} className="bg-[#0a0a0f]">Level 1</option>
                                                  <option value={2} className="bg-[#0a0a0f]">Level 2</option>
                                                  <option value={3} className="bg-[#0a0a0f]">Level 3</option>
                                                </select>

                                                <input
                                                  value={justification}
                                                  onChange={e => setJustification(e.target.value)}
                                                  placeholder="Justification (required)"
                                                  className="bg-transparent border border-white/15 px-3 py-2 text-xs text-white outline-none"
                                                />

                                                <div className="flex items-center gap-2">
                                                  <button
                                                    onClick={saveOverride}
                                                    disabled={!justification.trim()}
                                                    className="px-3 py-2 bg-brand text-white text-[10px] font-mono uppercase tracking-widest disabled:opacity-40"
                                                  >
                                                    Save Override
                                                  </button>
                                                  <button
                                                    onClick={() => setOverrideTarget(null)}
                                                    className="px-3 py-2 border border-white/15 text-white/50 text-[10px] font-mono uppercase tracking-widest"
                                                  >
                                                    Cancel
                                                  </button>
                                                </div>
                                              </div>

                                              <div className="mt-2">
                                                <p className="text-[10px] font-mono text-white/40 uppercase tracking-widest mb-1">Override history</p>
                                                {history.length === 0 ? (
                                                  <p className="text-[10px] text-white/35 italic">No override history for this CO.</p>
                                                ) : (
                                                  <div className="space-y-1">
                                                    {history.map(h => (
                                                      <p key={h.id} className="text-[10px] text-white/50">{h.timestamp} - {h.action}</p>
                                                    ))}
                                                  </div>
                                                )}
                                              </div>
                                            </td>
                                          </tr>
                                        )}
                                      </>
                                    );
                                  })}
                                </tbody>
                              </table>
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}

                {filteredCourses.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-4 py-8 text-center text-white/35">No courses match the selected filters.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </motion.div>
        )}
      </motion.div>
    </AccessGate>
  );
}
