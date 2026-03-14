"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { Award, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { AccessGate } from "@/components/auth/AccessGate";

export default function StudentMarksPage() {
  const { user } = useAuthStore();
  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const myRoll      = user?.employeeId;

  const markRows = useMemo(() => {
    const rows: Array<{ courseId: string; courseCode: string; courseName: string; examName: string; examId: string; score: number; max: number; pct: number }> = [];
    courses.forEach(c => {
      const subs  = (submissions[c.id] || []).filter(s => s.status === "approved");
      const exams = examConfigs[c.id] || [];
      subs.forEach(sub => {
        const myRow = sub.students.find(s => s.roll === myRoll);
        if (!myRow) return;
        const exam  = exams.find(e => e.id === sub.examId);
        const score = Object.values(myRow.marks).reduce((acc: number, m) => acc + Number(m === "" ? 0 : m), 0);
        const max   = exam?.maxMarks || 0;
        rows.push({
          courseId: c.id, courseCode: c.code, courseName: c.name,
          examName: exam?.name || sub.examId.toUpperCase(), examId: sub.examId,
          score, max, pct: max > 0 ? Math.round((score / max) * 100) : 0,
        });
      });
    });
    return rows;
  }, [courses, submissions, examConfigs, myRoll]);

  return (
    <AccessGate feature="student_marks_view" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">

        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-cyan-400" /> Academic Performance
          </div>
          <h1 className="text-4xl font-display text-white flex items-center gap-4">
            <Award className="w-8 h-8 text-cyan-400" /> My Results
          </h1>
          <p className="text-white/40 font-light mt-1">Academic Year 2024-25 · Roll: {myRoll}</p>
        </motion.div>

        {markRows.length === 0 ? (
          <div className="py-24 text-center text-white/20">
            <p className="text-sm italic">No approved marks available yet.</p>
          </div>
        ) : (
          <motion.div variants={fadeSlideUp} className="border border-white/10 overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-white/[0.02] border-b border-white/10">
                <tr>
                  {["Exam / Course", "Score", "Performance", "Detail"].map(h => (
                    <th key={h} className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal text-[9px]">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {markRows.map((mark, i) => (
                  <tr key={i} className="hover:bg-white/[0.01] transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-white font-medium">{mark.examName}</p>
                      <p className="text-[10px] text-white/30 mt-0.5">{mark.courseCode} — {mark.courseName}</p>
                    </td>
                    <td className="px-6 py-5 text-white text-lg">
                      {mark.score} <span className="text-white/20">/ {mark.max}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="w-28 h-0.5 bg-white/5">
                          <div className={`h-full ${mark.pct >= 60 ? "bg-attain" : mark.pct >= 40 ? "bg-amber-400" : "bg-alert"}`}
                            style={{ width: `${mark.pct}%` }} />
                        </div>
                        <span className={`${mark.pct >= 60 ? "text-attain" : mark.pct >= 40 ? "text-amber-400" : "text-alert"}`}>
                          {mark.pct}%
                        </span>
                      </div>
                    </td>
                    <td className="px-6 py-5 text-right">
                      <Link href={`/student/course/${mark.courseId}/marks`}
                        className="inline-flex items-center gap-1.5 text-white/20 group-hover:text-white transition-colors uppercase tracking-widest text-[9px]">
                        View <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.div>
        )}

      </motion.div>
    </AccessGate>
  );
}
