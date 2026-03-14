"use client";

import { useMemo } from "react";
import { useParams } from "next/navigation";
import { motion } from "framer-motion";
import { FileSpreadsheet } from "lucide-react";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function StudentCourseMarksPage() {
  const { id } = useParams();
  const courseId = id as string;
  const { user } = useAuthStore();

  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);

  const course = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const myRoll = user?.employeeId;

  const examRows = useMemo(() => {
    const exams = examConfigs[courseId] || [];
    const subs  = submissions[courseId] || [];
    return exams.map(exam => {
      const sub    = subs.find(s => s.examId === exam.id && s.status === "approved");
      const myRow  = sub?.students.find(s => s.roll === myRoll);
      const total  = myRow
        ? Object.values(myRow.marks).reduce((acc: number, m) => acc + Number(m === "" ? 0 : m), 0)
        : null;
      return { exam, myRow, total };
    }).filter(r => r.myRow); // only show exams where student has marks
  }, [examConfigs, submissions, courseId, myRoll]);

  return (
    <AccessGate feature="student_marks_view" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">

        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-cyan-400" /> My Marks
          </div>
          <h1 className="text-4xl font-display text-white flex items-center gap-4">
            <FileSpreadsheet className="w-8 h-8 text-cyan-400" /> Marks Detail
          </h1>
          <p className="text-white/40 font-light mt-1">{course?.name} · {course?.code} · Roll: {myRoll}</p>
        </motion.div>

        {examRows.length === 0 ? (
          <div className="py-24 text-center text-white/20">
            <p className="text-sm italic">No approved marks available yet for this course.</p>
          </div>
        ) : (
          <motion.div variants={fadeSlideUp} className="flex flex-col divide-y divide-white/5">
            {examRows.map(({ exam, myRow, total }) => (
              <div key={exam.id} className="py-6">
                <div className="flex items-center justify-between mb-4">
                  <div>
                    <p className="text-sm font-display text-white">{exam.name}</p>
                    <p className="text-[10px] font-mono text-white/30 uppercase mt-0.5">{exam.group} · Max: {exam.maxMarks}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-display text-cyan-400">{total}</p>
                    <p className="text-[10px] font-mono text-white/30">/ {exam.maxMarks}</p>
                  </div>
                </div>

                {exam.questions.length > 0 && myRow && (
                  <div className="overflow-x-auto">
                    <table className="text-left border-collapse">
                      <thead>
                        <tr className="border-b border-white/10">
                          {exam.questions.map(q => (
                            <th key={q.qno} className="px-4 py-2 text-center border-l border-white/5">
                              <p className="text-[9px] font-mono text-brand uppercase">{q.qno}</p>
                              <p className="text-[8px] font-mono text-white/20">/{q.maxMarks}</p>
                            </th>
                          ))}
                        </tr>
                      </thead>
                      <tbody>
                        <tr>
                          {exam.questions.map(q => {
                            const val = myRow.marks[q.qno];
                            const num = val === "" || val === undefined ? null : Number(val);
                            const pct = num !== null ? (num / q.maxMarks) * 100 : null;
                            return (
                              <td key={q.qno} className="px-4 py-3 text-center border-l border-white/5">
                                <span className={`font-mono text-sm ${
                                  num === null ? "text-white/20" :
                                  pct! >= 60 ? "text-attain" : pct! >= 40 ? "text-amber-400" : "text-alert"
                                }`}>
                                  {num === null ? "—" : num}
                                </span>
                              </td>
                            );
                          })}
                        </tr>
                      </tbody>
                    </table>
                  </div>
                )}

                {/* Progress bar */}
                <div className="mt-3 flex items-center gap-3">
                  <div className="flex-1 h-0.5 bg-white/5">
                    <div className="h-full bg-cyan-400/60 transition-all"
                      style={{ width: `${exam.maxMarks > 0 ? ((total || 0) / exam.maxMarks) * 100 : 0}%` }} />
                  </div>
                  <span className="text-[10px] font-mono text-white/30">
                    {exam.maxMarks > 0 ? Math.round(((total || 0) / exam.maxMarks) * 100) : 0}%
                  </span>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </motion.div>
    </AccessGate>
  );
}
