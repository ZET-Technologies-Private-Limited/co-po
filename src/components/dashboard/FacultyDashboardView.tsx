"use client";

import { useMemo, useState, useCallback } from "react";
import React from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import {
  ChevronDown, ChevronUp, ChevronRight, ArrowUpRight,
  AlertCircle, CheckCircle2, Clock, Search, ArrowUp, ArrowDown,
  Minus, Bell
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks, getAttainmentLevel } from "@/lib/computations";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// ── helpers ──────────────────────────────────────────────────────────────────

function greeting() {
  const h = new Date().getHours();
  if (h < 12) return "Good morning";
  if (h < 17) return "Good afternoon";
  return "Good evening";
}

function fullDate() {
  return new Date().toLocaleDateString("en-IN", { weekday: "long", year: "numeric", month: "long", day: "numeric" });
}

function timeAgo(ts: string): string {
  const diff = Date.now() - new Date(ts).getTime();
  const mins  = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days  = Math.floor(diff / 86400000);
  if (mins  < 1)   return "just now";
  if (mins  < 60)  return `${mins} minute${mins !== 1 ? "s" : ""} ago`;
  if (hours < 24)  return `${hours} hour${hours !== 1 ? "s" : ""} ago`;
  if (days  < 30)  return `${days} day${days !== 1 ? "s" : ""} ago`;
  return new Date(ts).toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" });
}

function daysUntil(dateStr: string): number {
  return Math.ceil((new Date(dateStr).getTime() - Date.now()) / 86400000);
}

function semesterLabel(startDate: string): string {
  const month = new Date(startDate).getMonth() + 1; // 1-12
  return month >= 6 && month <= 11 ? "Odd Semester" : "Even Semester";
}

const EXAM_ORDER = ["t1", "t2", "t3", "t4", "t5", "see"];

const STATUS_COLOR: Record<string, string> = {
  approved: "text-attain",
  pending:  "text-amber-400",
  returned: "text-alert",
  draft:    "text-white/25",
};
const STATUS_LABEL: Record<string, string> = {
  approved: "Approved",
  pending:  "Pending Approval",
  returned: "Returned",
  draft:    "Not Uploaded",
};

const LEVEL_COLOR: Record<number, string> = { 3: "text-attain", 2: "text-amber-400", 1: "text-alert" };
const LEVEL_LABEL: Record<number, string>  = { 3: "L3", 2: "L2", 1: "L1" };

type SortKey = "code" | "name" | "semester" | "students" | "coStatus" | "marksStatus";
type SortDir = "asc" | "desc";

// ── component ────────────────────────────────────────────────────────────────

export function FacultyDashboardView() {
  const { user, activeAY } = useAuthStore();
  const courses       = useDataStore(s => s.courses);
  const submissions   = useDataStore(s => s.submissions);
  const examConfigs   = useDataStore(s => s.examConfigs);
  const cos           = useDataStore(s => s.cos);
  const thresholds    = useDataStore(s => s.thresholds);
  const ay            = useDataStore(s => s.ay);
  const auditLog      = useDataStore(s => s.auditLog);
  const facultyNotifs = useDataStore(s => s.facultyNotifications);

  const [expandedRows, setExpandedRows] = useState<Set<string>>(new Set());
  const [search, setSearch]             = useState("");
  const [sortKey, setSortKey]           = useState<SortKey>("marksStatus");
  const [sortDir, setSortDir]           = useState<SortDir>("desc");
  const [showCompleted, setShowCompleted] = useState(false);

  const myCourses = useMemo(
    () => courses.filter(c => c.facultyId === user?.id),
    [courses, user]
  );

  const myNotifs = useMemo(
    () => facultyNotifs.filter(n => n.userId === user?.id),
    [facultyNotifs, user]
  );

  // Per-course derived data
  const courseData = useMemo(() => myCourses.map(course => {
    const courseCOs  = cos[course.id] || [];
    const subList    = submissions[course.id] || [];
    const exams      = examConfigs[course.id] || [];
    const approved   = subList.filter(s => s.status === "approved").flatMap(s => s.students);
    const questions  = exams.flatMap(e => e.questions);
    const attainment = approved.length > 0
      ? computeCOAttainmentFromMarks(approved, questions, thresholds.targetPassPct)
      : {};

    const pendingDeadlines = subList.filter(s => s.status === "draft" || s.status === "returned").length;
    const level1Count = Object.values(attainment).filter(v => v.pct < thresholds.level2).length;

    return { course, courseCOs, subList, exams, attainment, pendingDeadlines, level1Count };
  }), [myCourses, cos, submissions, examConfigs, thresholds]);

  // Summary stats for status line
  const stats = useMemo(() => {
    const pendingCOs    = courseData.filter(d => d.courseCOs.length === 0).length;
    const marksDeadline = courseData.reduce((a, d) => a + d.pendingDeadlines, 0);
    const level1Total   = courseData.reduce((a, d) => a + d.level1Count, 0);
    return { pendingCOs, marksDeadline, level1Total };
  }, [courseData]);

  // AY near-lock warning
  const ayNearLock = useMemo(() => {
    if (!ay.coLockDeadline) return false;
    const diff = (new Date(ay.coLockDeadline).getTime() - Date.now()) / 86400000;
    return diff >= 0 && diff <= 14;
  }, [ay]);

  // Actions (pending + completed)
  const pendingActions = useMemo(() => {
    const actions: { id: string; priority: number; text: string; course: string; due: string; href: string; done: boolean }[] = [];

    courseData.forEach(({ course, courseCOs, subList, exams }) => {
      const coDone = courseCOs.length > 0;
      actions.push({
        id: `co-${course.id}`,
        priority: coDone ? 4 : 1,
        text: coDone ? "CO generation completed" : "Generate Course Outcomes",
        course: course.code,
        due: ay.coLockDeadline || "—",
        href: `/faculty/course/${course.id}/co-generation`,
        done: coDone,
      });

      exams.forEach(exam => {
        if (!exam.questions.length) return;
        const sub = subList.find(s => s.examId === exam.id);
        const done = sub?.status === "pending" || sub?.status === "approved";
        const returned = sub?.status === "returned";
        const text = returned
          ? `Re-submit returned marks (${exam.id.toUpperCase()})`
          : done
          ? `Marks submitted (${exam.id.toUpperCase()})`
          : `Upload marks for ${exam.id.toUpperCase()}`;

        actions.push({
          id: `mk-${course.id}-${exam.id}`,
          priority: returned ? 1 : done ? 4 : 2,
          text,
          course: course.code,
          due: ay.marksDeadline || "—",
          href: `/faculty/course/${course.id}/marks/${exam.id}`,
          done,
        });
      });
    });

    return actions.sort((a, b) => {
      if (a.done !== b.done) return Number(a.done) - Number(b.done);
      return a.priority - b.priority;
    });
  }, [courseData, ay]);
  const visibleActions = showCompleted ? pendingActions : pendingActions.filter(a => !a.done);

  // Recent activity from audit log
  const recentActivity = useMemo(() =>
    auditLog
      .filter(e => e.userId === user?.id)
      .slice(0, 10),
    [auditLog, user]
  );

  // Sort + filter courses
  const handleSort = useCallback((key: SortKey) => {
    if (sortKey === key) setSortDir(d => d === "asc" ? "desc" : "asc");
    else { setSortKey(key); setSortDir("asc"); }
  }, [sortKey]);

  const filteredData = useMemo(() => {
    let data = courseData.filter(({ course }) =>
      course.name.toLowerCase().includes(search.toLowerCase()) ||
      course.code.toLowerCase().includes(search.toLowerCase())
    );
    data = [...data].sort((a, b) => {
      let av: any, bv: any;
      switch (sortKey) {
        case "code":       av = a.course.code;       bv = b.course.code;       break;
        case "name":       av = a.course.name;       bv = b.course.name;       break;
        case "semester":   av = a.course.semester;   bv = b.course.semester;   break;
        case "students":   av = a.course.students;   bv = b.course.students;   break;
        case "coStatus":   av = a.courseCOs.length;  bv = b.courseCOs.length;  break;
        case "marksStatus":av = a.pendingDeadlines;  bv = b.pendingDeadlines;  break;
        default:           av = 0; bv = 0;
      }
      if (av < bv) return sortDir === "asc" ? -1 : 1;
      if (av > bv) return sortDir === "asc" ? 1 : -1;
      return 0;
    });
    return data;
  }, [courseData, search, sortKey, sortDir]);

  function SortIcon({ col }: { col: SortKey }) {
    if (sortKey !== col) return <Minus className="w-3 h-3 text-white/20" />;
    return sortDir === "asc" ? <ArrowUp className="w-3 h-3 text-brand" /> : <ArrowDown className="w-3 h-3 text-brand" />;
  }

  const thCol = "text-[10px] font-mono text-white/30 uppercase tracking-widest py-3 px-4 text-left cursor-pointer hover:text-white transition-colors select-none";
  const tdCol = "py-3 px-4 text-sm align-top";

  // CO attainment summary across all courses
  const coSummaryRows = useMemo(() => courseData.map(({ course, attainment, courseCOs }) => {
    const coKeys = courseCOs.map(c => c.co);
    const hasData = Object.keys(attainment).length > 0;
    return { course, coKeys, attainment, hasData };
  }), [courseData]);

  const totalLevel1 = courseData.reduce((a, d) => a + d.level1Count, 0);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">

      {/* ── PAGE HEADER ── */}
      <motion.section variants={fadeSlideUp} className="pb-10 border-b border-white/5">
        <p className="text-3xl font-display text-white mb-1">
          {greeting()}, <span className="text-white/50">{user?.name?.split(" ")[0]}</span>
        </p>
        <p className="text-sm text-white/30 font-mono mb-5">{fullDate()}</p>

        {/* F2-02 — status summary line with | separators and "in X days" */}
        <p className="text-sm text-white/50 font-mono mb-3">
          You have{" "}
          <span className="text-white">{myCourses.length} course{myCourses.length !== 1 ? "s" : ""}</span>
          {" | "}
          <span className={stats.pendingCOs > 0 ? "text-alert" : "text-white/30"}>
            {stats.pendingCOs} CO{stats.pendingCOs !== 1 ? "s" : ""} pending
          </span>
          {" | "}
          <span className={stats.marksDeadline > 0 ? "text-amber-400" : "text-white/30"}>
            {stats.marksDeadline} marks deadline
            {stats.marksDeadline > 0 && ay.marksDeadline && (() => {
              const d = daysUntil(ay.marksDeadline);
              return d >= 0 ? ` in ${d} day${d !== 1 ? "s" : ""}` : " (overdue)";
            })()}
          </span>
          {" | "}
          <span className={stats.level1Total > 0 ? "text-alert font-medium" : "text-white/30"}>
            {stats.level1Total} Level 1 alert{stats.level1Total !== 1 ? "s" : ""}
          </span>
        </p>

        {/* F2-03 — AY context line with semester */}
        <p className={`text-xs font-mono ${ayNearLock ? "text-amber-400" : "text-white/25"}`}>
          Viewing: Academic Year {activeAY}
          {" | "}{semesterLabel(ay.startDate)}
          {" | "}{ay.status === "active" ? "Active" : ay.status === "locked" ? "Locked" : "Archived"}
          {ayNearLock && " | ⚠ Near lock date"}
        </p>
      </motion.section>

      {/* ── COURSES TABLE ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-6">
            <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Courses Summary</h2>
            <div className="flex gap-4">
              <button 
                onClick={() => setExpandedRows(new Set(filteredData.map(d => d.course.id)))}
                className="text-[10px] font-mono text-brand hover:underline uppercase tracking-widest"
              >
                Expand All
              </button>
              <button 
                onClick={() => setExpandedRows(new Set())}
                className="text-[10px] font-mono text-white/20 hover:text-white uppercase tracking-widest"
              >
                Collapse All
              </button>
            </div>
          </div>
          {/* Search */}
          <div className="flex items-center gap-2 border-b border-white/10 pb-1">
            <Search className="w-3.5 h-3.5 text-white/30" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by code or name..."
              className="bg-transparent text-white text-sm placeholder-white/20 outline-none w-48"
            />
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/5">
                <th className={thCol} onClick={() => handleSort("code")}>
                  <span className="flex items-center gap-1">Code <SortIcon col="code" /></span>
                </th>
                <th className={thCol} onClick={() => handleSort("name")}>
                  <span className="flex items-center gap-1">Course Name <SortIcon col="name" /></span>
                </th>
                <th className={thCol} onClick={() => handleSort("semester")}>
                  <span className="flex items-center gap-1">Sem <SortIcon col="semester" /></span>
                </th>
                <th className={thCol} onClick={() => handleSort("students")}>
                  <span className="flex items-center gap-1">Enrolled Students <SortIcon col="students" /></span>
                </th>
                <th className={thCol} onClick={() => handleSort("coStatus")}>
                  <span className="flex items-center gap-1">CO Status <SortIcon col="coStatus" /></span>
                </th>
                <th className={thCol} onClick={() => handleSort("marksStatus")}>
                  <span className="flex items-center gap-1">Marks Status <SortIcon col="marksStatus" /></span>
                </th>
                <th className={thCol}>Action</th>
              </tr>
            </thead>
            <tbody>
              {filteredData.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-20 text-center">
                    <p className="text-sm text-white/20 italic">No courses found matching your search</p>
                  </td>
                </tr>
              ) : (
                filteredData.map(({ course, courseCOs, subList, exams }) => {
                  const isExpanded = expandedRows.has(course.id);
                  const toggleRow = () => {
                    const next = new Set(expandedRows);
                    if (next.has(course.id)) next.delete(course.id);
                    else next.add(course.id);
                    setExpandedRows(next);
                  };
                  const coGenerated = courseCOs.length > 0;
                  // F2-05: coTotal = actual defined COs, not a hardcoded floor
                  const coTotal = courseCOs.length;

                  // F2-07: build ordered action links (most urgent first)
                  const noCOs       = !coGenerated;
                  const hasReturned = subList.some(s => s.status === "returned");
                  const hasDraftWithQs = subList.some(s => s.status === "draft" && exams.find(e => e.id === s.examId)?.questions.length);
                  const actionLinks: { label: string; href: string }[] = [];
                  if (noCOs)       actionLinks.push({ label: "Generate COs",  href: `/faculty/course/${course.id}/co-generation` });
                  if (hasReturned) actionLinks.push({ label: "Upload Marks",  href: `/faculty/course/${course.id}/marks/${subList.find(s => s.status === "returned")?.examId}` });
                  if (hasDraftWithQs && !hasReturned) actionLinks.push({ label: "Upload Marks", href: `/faculty/course/${course.id}/marks/${subList.find(s => s.status === "draft" && exams.find(e => e.id === s.examId)?.questions.length)?.examId}` });
                  actionLinks.push({ label: "Open Course", href: `/faculty/course/${course.id}/co-attainment` });

                  return (
                    <React.Fragment key={course.id}>
                      <tr
                        onClick={toggleRow}
                        className="border-b border-white/5 hover:bg-white/[0.02] cursor-pointer transition-colors"
                      >
                        <td className={`${tdCol} font-mono text-white/50 text-xs`}>{course.code}</td>
                        <td className={`${tdCol} text-white font-light`}>{course.name}</td>
                        <td className={`${tdCol} text-white/40 font-mono text-xs`}>{course.semester}</td>
                        <td className={`${tdCol} text-white/40 font-mono text-xs`}>{course.students}</td>
                        <td className={tdCol}>
                          {coGenerated
                            ? <span className="text-attain text-xs font-mono">Generated ({coTotal}/{coTotal})</span>
                            : <span className="text-alert text-xs font-mono">Pending — 0 COs</span>
                          }
                        </td>
                        <td className={tdCol}>
                          <div className="flex flex-wrap gap-x-3 gap-y-1">
                            {EXAM_ORDER.map(examId => {
                              const exam = exams.find(e => e.id === examId);
                              if (!exam) return null;
                              const sub = subList.find(s => s.examId === examId);
                              // F2-06: distinguish configured-not-uploaded vs not-configured
                              const hasQs = exam.questions.length > 0;
                              const st: string = sub?.status || (hasQs ? "draft" : "not_configured");
                              const label = st === "not_configured" ? "Not Configured"
                                : st === "draft"    ? "Pending Upload"
                                : STATUS_LABEL[st] ?? st;
                              const color = st === "not_configured" ? "text-white/20"
                                : STATUS_COLOR[st] ?? "text-white/30";
                              return (
                                <span key={examId} className="text-[10px] font-mono">
                                  <span className="text-white/25">{exam.name.split("—")[0].trim()}: </span>
                                  <span className={color}>{label}</span>
                                </span>
                              );
                            })}
                          </div>
                        </td>
                        <td className={tdCol}>
                          <div className="flex items-center gap-2 flex-wrap">
                            {/* F2-07: multiple action links, most urgent first, separated by | */}
                            {actionLinks.slice(0, 3).map((a, ai) => (
                              <span key={a.label} className="flex items-center gap-2">
                                {ai > 0 && <span className="text-white/10 text-xs">|</span>}
                                <Link
                                  href={a.href}
                                  onClick={e => e.stopPropagation()}
                                  className="text-xs font-mono text-brand hover:text-white transition-colors uppercase tracking-widest"
                                >
                                  {a.label}
                                </Link>
                              </span>
                            ))}
                            <button onClick={e => { e.stopPropagation(); toggleRow(); }} className="ml-1">
                              {isExpanded
                                ? <ChevronUp className="w-3.5 h-3.5 text-white/20" />
                                : <ChevronDown className="w-3.5 h-3.5 text-white/20" />
                              }
                            </button>
                          </div>
                        </td>
                      </tr>

                      {/* Inline accordion */}
                      {isExpanded && (
                        <tr className="bg-white/[0.015]">
                          <td colSpan={7} className="px-6 py-5">
                            <AnimatePresence>
                              <motion.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: "auto" }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden"
                              >
                                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">All Exam Statuses — {course.code}</p>
                                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                                  {EXAM_ORDER.map(examId => {
                                    const exam = exams.find(e => e.id === examId);
                                    if (!exam) return null;
                                    const sub = subList.find(s => s.examId === examId);
                                    const st  = sub?.status || "draft";
                                    return (
                                      <Link
                                        key={examId}
                                        href={`/faculty/course/${course.id}/marks/${examId}`}
                                        className="flex items-center justify-between px-4 py-3 border border-white/5 hover:border-white/20 transition-colors"
                                      >
                                        <div>
                                          <p className="text-xs text-white font-light">{exam.name}</p>
                                          <p className="text-[10px] font-mono text-white/30 mt-0.5">Max: {exam.maxMarks} marks</p>
                                        </div>
                                        <span className={`text-[10px] font-mono uppercase ${STATUS_COLOR[st]}`}>{STATUS_LABEL[st]}</span>
                                      </Link>
                                    );
                                  })}
                                </div>
                                <div className="flex gap-4 mt-4">
                                  <Link href={`/faculty/course/${course.id}/co-generation`}
                                    className="text-xs font-mono text-brand hover:text-white transition-colors uppercase tracking-widest">
                                    Generate COs →
                                  </Link>
                                  <Link href={`/faculty/course/${course.id}/co-attainment`}
                                    className="text-xs font-mono text-aurora hover:text-white transition-colors uppercase tracking-widest">
                                    CO Attainment →
                                  </Link>
                                </div>
                              </motion.div>
                            </AnimatePresence>
                          </td>
                        </tr>
                      )}
                    </React.Fragment>
                  );
                })
              )}
            </tbody>
          </table>

          {filteredData.length === 0 && (
            <p className="text-white/20 text-sm italic py-8 text-center">No courses match your search.</p>
          )}
        </div>
      </motion.section>

      {/* ── PENDING ACTIONS ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Pending Actions</h2>

        {visibleActions.length === 0 ? (
          <div className="flex items-center gap-3 py-4">
            <CheckCircle2 className="w-4 h-4 text-attain" />
            <p className="text-sm text-white/40 italic">No pending actions. All tasks are complete.</p>
          </div>
        ) : (
          <ol className="flex flex-col gap-0 divide-y divide-white/5">
            {visibleActions.map((action, i) => {
              const isOverdue = !action.done && action.due !== "—" && new Date(action.due) < new Date();
              return (
                <li key={action.id} className="flex items-center justify-between py-3 gap-4">
                  <div className="flex items-center gap-4 min-w-0">
                    <span className={`text-xs font-mono w-5 shrink-0 ${action.done ? "text-attain" : isOverdue ? "text-alert" : "text-white/20"}`}>{i + 1}.</span>
                    <div className="min-w-0">
                      <span className={`text-sm ${action.done ? "text-attain" : isOverdue ? "text-alert" : "text-white/70"}`}>
                        {action.text}
                      </span>
                      <span className="text-white/30 text-xs font-mono ml-2">— {action.course}</span>
                      {action.done ? (
                        <span className="text-xs font-mono ml-2 text-attain">· Completed</span>
                      ) : action.due !== "—" ? (
                        <span className={`text-xs font-mono ml-2 ${isOverdue ? "text-alert" : "text-white/20"}`}>
                          · Due {action.due}
                          {isOverdue && " (Overdue)"}
                        </span>
                      ) : null}
                    </div>
                  </div>
                  <Link href={action.href}
                    className="text-xs font-mono text-brand hover:text-white transition-colors uppercase tracking-widest shrink-0 flex items-center gap-1">
                    Go <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </li>
              );
            })}
          </ol>
        )}

        {/* F2-13: toggle to reveal completed items (kept up to 24h in memory) */}
        <button
          onClick={() => setShowCompleted(s => !s)}
          className="mt-4 text-xs font-mono text-white/30 hover:text-white transition-colors"
        >
          {showCompleted ? "Hide completed" : "Show completed"}
        </button>
      </motion.section>

      {/* ── CO ATTAINMENT SUMMARY ── */}
      <motion.section variants={fadeSlideUp} className="py-8 border-b border-white/5">
        <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-3">CO Attainment Summary</h2>

        {totalLevel1 > 0 && (
          <div className="flex items-center gap-2 mb-4">
            <AlertCircle className="w-4 h-4 text-alert shrink-0" />
            <p className="text-alert text-sm font-mono">
              {totalLevel1} Course Outcome{totalLevel1 !== 1 ? "s" : ""} require remedial action
            </p>
          </div>
        )}

        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-white/5">
                <th className="text-[10px] font-mono text-white/30 uppercase tracking-widest py-3 px-4 text-left">Course</th>
                {["CO1","CO2","CO3","CO4","CO5","CO6"].map(co => (
                  <th key={co} className="text-[10px] font-mono text-white/30 uppercase tracking-widest py-3 px-3 text-center">{co}</th>
                ))}
                <th className="text-[10px] font-mono text-white/30 uppercase tracking-widest py-3 px-4 text-center">Overall</th>
              </tr>
            </thead>
            <tbody>
              {coSummaryRows.map(({ course, attainment, hasData }) => {
                const allPcts = Object.values(attainment).map(v => v.pct);
                const overall = allPcts.length ? Math.round(allPcts.reduce((a, b) => a + b, 0) / allPcts.length) : null;
                const overallLvl = overall !== null ? getAttainmentLevel(overall, { level3: 60, level2: 40 }) : null;

                return (
                  <tr key={course.id} className="border-b border-white/5 hover:bg-white/[0.02] transition-colors">
                    <td className="py-3 px-4 font-mono text-xs text-white/50">{course.code}</td>
                    {["CO1","CO2","CO3","CO4","CO5","CO6"].map(co => {
                      const data = attainment[co];
                      if (!hasData || !data) {
                        return (
                          // F2-18: — with italic note per cell
                          <td key={co} className="py-3 px-3 text-center">
                            <span className="text-white/20 text-xs font-mono">—</span>
                          </td>
                        );
                      }
                      const lvl = getAttainmentLevel(data.pct, { level3: 60, level2: 40 });
                      return (
                        // F2-19: click navigates to CO attainment page
                        <td key={co} className="py-3 px-3 text-center">
                          <Link href={`/faculty/course/${course.id}/co-attainment`}
                            className="flex flex-col items-center gap-0.5 hover:opacity-80 transition-opacity">
                            <span className={`text-xs font-mono ${LEVEL_COLOR[lvl.level]} ${lvl.level === 1 ? "font-bold" : ""}`}>
                              {data.pct}%
                            </span>
                            <span className={`text-[9px] font-mono ${LEVEL_COLOR[lvl.level]}`}>{LEVEL_LABEL[lvl.level]}</span>
                          </Link>
                        </td>
                      );
                    })}
                    <td className="py-3 px-4 text-center">
                      {overall !== null && overallLvl ? (
                        <span className={`text-xs font-mono ${LEVEL_COLOR[overallLvl.level]}`}>{overall}%</span>
                      ) : (
                        // F2-18: italic note in overall column when no data
                        <span className="text-white/20 text-xs italic font-mono">Pending marks approval</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </motion.section>

      {/* ── RECENT ACTIVITY ── */}
      <motion.section variants={fadeSlideUp} className="py-8">
        <h2 className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Recent Activity</h2>

        {recentActivity.length === 0 ? (
          <p className="text-white/20 text-sm italic">No recent activity recorded.</p>
        ) : (
          <ol className="flex flex-col gap-0 divide-y divide-white/5">
            {recentActivity.map((entry, i) => (
              <li key={entry.id} className="flex items-center gap-4 py-3">
                <span className="text-[10px] font-mono text-white/20 w-5 shrink-0">{i + 1}.</span>
                <p className="text-sm text-white/50 flex-1 font-light">
                  {/* F2-20: [Action] for [Course] — [time ago] */}
                  {entry.action}
                  <span className="text-white/20 font-mono text-xs ml-2">— {timeAgo(entry.timestamp)}</span>
                </p>
              </li>
            ))}
          </ol>
        )}

        {/* F2-21: exact label */}
        <Link href="/audit-trail"
          className="mt-4 inline-flex items-center gap-1.5 text-xs font-mono text-brand hover:text-white transition-colors uppercase tracking-widest">
          View full activity log <ChevronRight className="w-3 h-3" />
        </Link>
      </motion.section>

    </motion.div>
  );
}
