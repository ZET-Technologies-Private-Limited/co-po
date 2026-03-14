"use client";

import { motion, AnimatePresence } from "framer-motion";
import { useState } from "react";
import Link from "next/link";
import {
  BookOpen, BarChart3, AlertTriangle, CheckCircle2, Clock, ChevronRight,
  ArrowRight, Upload, FileCheck, Loader2, Bell, Target
} from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useAuthStore } from "@/lib/authStore";
import { useUIStore } from "@/lib/uiStore";
import { COURSE_COS, getAttainmentLevel, getCurricularGaps } from "@/lib/appData";

// ─── MOCK DATA (spec-aligned) ────────────────────────────────────────────
const MY_COURSES = [
  {
    id: "cs301", code: "CS301", name: "Database Management Systems",
    semester: 5, students: 60, dept: "Computer Science",
    cosGenerated: 6, cosPending: 0,
  },
  {
    id: "ec201", code: "EC201", name: "Digital Signal Processing",
    semester: 4, students: 55, dept: "Electronics",
    cosGenerated: 4, cosPending: 2,
  },
];

type MarkStatus = "Not Started" | "In Progress" | "Submitted" | "Approved";
const MARKS_STATUS: Record<string, Record<string, MarkStatus>> = {
  cs301: { T1: "Approved", T2: "Submitted", T3: "In Progress", T4: "Not Started", T5: "Not Started", SEE: "Not Started" },
  ec201: { T1: "Approved", T2: "Not Started", T3: "Not Started", T4: "Not Started", T5: "Not Started", SEE: "Not Started" },
};

const PENDING_ACTIONS = [
  { id: 1, text: "T2 marks not yet submitted for CS301", href: "/courses/cs301/exams/t2/marks", priority: "high" },
  { id: 2, text: "T3 marks still In Progress for CS301 — submit for Lead approval", href: "/courses/cs301/exams/t3/marks", priority: "medium" },
  { id: 3, text: "CO3 (CS301) is Level 1 — log remedial action before year-end", href: "/courses/cs301/co-attainment", priority: "high" },
  { id: 4, text: "EC201: CO5 & CO6 not yet generated — complete syllabus upload", href: "/courses/ec201/generate-co", priority: "medium" },
];

const STATUS_COLOR: Record<MarkStatus, string> = {
  "Not Started": "text-white/30 bg-white/5",
  "In Progress": "text-aurora bg-aurora/10",
  "Submitted":   "text-brand bg-brand/10",
  "Approved":    "text-attain bg-attain/10",
};

const AY_OPTIONS = ["2024-25", "2023-24", "2022-23"];

export function FacultyDashboardView() {
  const { user, activeAY, setActiveAY } = useAuthStore();
  const { addToast } = useUIStore();
  const isPastAY = activeAY !== "2024-25";

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-16 pb-32 pt-4">

      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest">
          <span className="w-8 h-[1px] bg-brand" /> Faculty Hub
        </div>
        <div className="flex items-end justify-between flex-wrap gap-6">
          <div>
            <h1 className="text-5xl font-display text-white">
              Good morning, <span className="text-white/40">{user?.name?.split(" ")[0] ?? "Professor"}</span>
            </h1>
            <p className="text-white/40 font-light mt-3">
              {MY_COURSES.length} courses assigned · AY {activeAY}
              {isPastAY && <span className="ml-3 text-xs font-mono text-alert bg-alert/10 px-2 py-0.5 uppercase tracking-widest">Read-Only</span>}
            </p>
          </div>

          {/* AY Selector (spec item) */}
          <div className="flex items-center gap-3">
            <span className="text-xs font-mono text-white/30 uppercase tracking-widest">AY</span>
            <div className="flex gap-2">
              {AY_OPTIONS.map(ay => (
                <button key={ay} onClick={() => { setActiveAY(ay); addToast(`Switched to Academic Year ${ay}`, 'info'); }}
                  className={`px-4 py-2 text-xs font-mono uppercase tracking-widest transition-all border ${
                    activeAY === ay ? "border-brand text-brand bg-brand/10" : "border-white/10 text-white/30 hover:text-white hover:border-white/30"
                  }`}>
                  {ay}
                  {ay !== "2024-25" && <span className="ml-1.5 opacity-50">🔒</span>}
                </button>
              ))}
            </div>
          </div>
        </div>
      </motion.section>

      {/* ── PENDING ACTIONS (spec: action items panel) ── */}
      {PENDING_ACTIONS.length > 0 && !isPastAY && (
        <motion.section variants={fadeSlideUp}>
          <h2 className="text-lg font-display text-white mb-6 flex items-center gap-3">
            <AlertTriangle className="w-4 h-4 text-alert" />
            Pending Actions
            <span className="text-xs font-mono text-alert bg-alert/10 px-2 py-0.5">{PENDING_ACTIONS.length}</span>
          </h2>
          <div className="flex flex-col divide-y divide-white/5">
            {PENDING_ACTIONS.map(action => (
              <Link key={action.id} href={action.href}
                className="flex items-center gap-6 py-5 group hover:pl-3 transition-all"
              >
                <span className={`w-2 h-2 rounded-full shrink-0 ${action.priority === "high" ? "bg-alert animate-pulse" : "bg-aurora"}`} />
                <span className="text-white/70 text-sm font-light flex-1 group-hover:text-white transition-colors">{action.text}</span>
                <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-white/60 shrink-0 transition-colors" />
              </Link>
            ))}
          </div>
        </motion.section>
      )}

      {/* ── MY COURSES + CO STATUS + MARKS STATUS (spec items 1,2,3) ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-6">
        <h2 className="text-lg font-display text-white">My Courses — AY {activeAY}</h2>
        {MY_COURSES.map(course => {
          const cos = COURSE_COS[course.id] || [];
          const marksStatus = MARKS_STATUS[course.id] || {};
          const gaps = getCurricularGaps(course.id);
          const level1COs = cos.filter(c => getAttainmentLevel(c.pct).level === 1);

          return (
            <div key={course.id} className="border border-white/10 hover:border-white/20 transition-all group">
              {/* Course header */}
              <div className="flex items-center justify-between p-8 border-b border-white/5">
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-mono text-sm text-white/40">{course.code}</span>
                    <span className="text-xs font-mono text-white/20">{course.dept} · Sem {course.semester}</span>
                    {level1COs.length > 0 && (
                      <span className="text-[10px] font-mono text-alert bg-alert/10 px-2 py-0.5 uppercase tracking-widest animate-pulse">
                        ⚠ {level1COs.length} Level 1
                      </span>
                    )}
                  </div>
                  <h3 className="text-xl font-display text-white group-hover:text-brand transition-colors">{course.name}</h3>
                  <p className="text-sm text-white/40 font-light mt-2">{course.students} students enrolled</p>
                </div>
                <Link href={`/courses/${course.id}`}
                  className="flex items-center gap-2 px-5 py-3 border border-white/10 text-white/40 text-xs font-mono uppercase tracking-widest hover:border-brand hover:text-brand transition-all"
                >
                  Open <ChevronRight className="w-3 h-3" />
                </Link>
              </div>

              <div className="grid md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-white/5">
                {/* CO Status (spec item 2) */}
                <div className="p-6">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">CO Status</p>
                  <div className="flex items-center gap-6">
                    <div className="text-center">
                      <span className="text-3xl font-mono font-light text-attain">{course.cosGenerated}</span>
                      <p className="text-[10px] font-mono text-white/30 uppercase mt-1">Generated</p>
                    </div>
                    {course.cosPending > 0 && (
                      <div className="text-center">
                        <span className="text-3xl font-mono font-light text-alert">{course.cosPending}</span>
                        <p className="text-[10px] font-mono text-alert/60 uppercase mt-1">Pending</p>
                      </div>
                    )}
                    {course.cosPending === 0 && (
                      <span className="flex items-center gap-2 text-attain text-xs font-mono">
                        <CheckCircle2 className="w-4 h-4" /> All COs complete
                      </span>
                    )}
                  </div>
                  {course.cosPending > 0 && (
                    <Link href={`/courses/${course.id}/generate-co`}
                      className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-brand hover:text-white transition-colors"
                    >
                      Generate missing COs <ArrowRight className="w-3 h-3" />
                    </Link>
                  )}
                </div>

                {/* Marks Upload Status (spec item 3) */}
                <div className="p-6">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Marks Upload Status</p>
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(marksStatus).map(([exam, status]) => (
                      <Link key={exam} href={`/courses/${course.id}/exams/${exam.toLowerCase()}/marks`}
                        className={`px-3 py-1.5 text-[10px] font-mono uppercase tracking-widest transition-all hover:opacity-80 ${STATUS_COLOR[status]}`}
                      >
                        <span className="text-inherit">{exam}</span>
                        <span className="ml-1.5 opacity-60">{status}</span>
                      </Link>
                    ))}
                  </div>
                </div>
              </div>

              {/* CO Attainment Quick-View (spec item 4) */}
              {cos.length > 0 && (
                <div className="p-6 border-t border-white/5">
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-4">Attainment Quick-View</p>
                  <div className="flex items-end gap-3">
                    {cos.map(c => {
                      const level = getAttainmentLevel(c.pct);
                      return (
                        <div key={c.co} className="flex flex-col items-center gap-2 flex-1 min-w-0">
                          <div className="w-full bg-white/5 h-20 flex items-end relative rounded-sm overflow-hidden">
                            <motion.div
                              className={level.level === 1 ? "bg-alert w-full" : level.level === 2 ? "bg-brand w-full" : "bg-attain w-full"}
                              initial={{ height: 0 }}
                              animate={{ height: `${c.pct}%` }}
                              transition={{ duration: 1, ease: "easeOut" }}
                            />
                          </div>
                          <span className="text-[10px] font-mono text-white/40">{c.co}</span>
                          <span className={`text-[10px] font-mono font-medium ${level.color}`}>{c.pct}%</span>
                        </div>
                      );
                    })}
                  </div>
                  <Link href={`/courses/${course.id}/co-attainment`}
                    className="mt-4 inline-flex items-center gap-2 text-xs font-mono text-white/40 hover:text-white transition-colors"
                  >
                    Full attainment report <ArrowRight className="w-3 h-3" />
                  </Link>
                </div>
              )}
            </div>
          );
        })}
      </motion.section>

      {/* ── QUICK ACTIONS ── */}
      <motion.section variants={fadeSlideUp} className="grid md:grid-cols-3 gap-4">
        {[
          { href: "/courses/cs301/generate-co", icon: Target, label: "Generate COs", sub: "CS301" },
          { href: "/courses/cs301/exams/t2/marks", icon: Upload, label: "Upload T2 Marks", sub: "CS301" },
          { href: "/courses/cs301/co-attainment", icon: BarChart3, label: "View Attainment", sub: "CS301" },
        ].map(({ href, icon: Icon, label, sub }) => (
          <Link key={href} href={href}
            className="flex items-center gap-5 p-6 border border-white/10 hover:border-brand hover:bg-brand/5 transition-all group"
          >
            <Icon className="w-5 h-5 text-white/30 group-hover:text-brand transition-colors shrink-0" />
            <div>
              <p className="text-sm font-medium text-white group-hover:text-brand transition-colors">{label}</p>
              <p className="text-xs font-mono text-white/30 mt-0.5">{sub}</p>
            </div>
            <ChevronRight className="w-4 h-4 text-white/20 group-hover:text-brand ml-auto transition-colors" />
          </Link>
        ))}
      </motion.section>
    </motion.div>
  );
}
