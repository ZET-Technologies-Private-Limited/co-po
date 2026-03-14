"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { BarChart2, FileSpreadsheet, MessageSquare, CheckCircle2, AlertTriangle } from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { AccessGate } from "@/components/auth/AccessGate";

export default function StudentCoursesPage() {
  const { user }    = useAuthStore();
  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const cosMap      = useDataStore(s => s.cos);
  const users       = useDataStore(s => s.users);
  const thresholds  = useDataStore(s => s.thresholds);
  const ay          = useDataStore(s => s.ay);

  const myRoll = user?.employeeId ?? "";

  // Enrolled courses via studentRolls (fixed seed data)
  const enrolledCourses = useMemo(
    () => courses.filter(c => c.studentRolls?.includes(myRoll)),
    [courses, myRoll]
  );

  const courseData = useMemo(() => {
    return enrolledCourses.map(course => {
      const approvedSubs = (submissions[course.id] ?? []).filter(s => s.status === "approved");
      const allExams     = examConfigs[course.id] ?? [];
      const allQs        = allExams.flatMap(e => e.questions);
      const courseCOs    = cosMap[course.id] ?? [];
      const faculty      = users.find(u => u.id === course.facultyId);

      const mergedMarks: Record<string, number | ""> = {};
      approvedSubs.forEach(sub => {
        const row = sub.students.find(s => s.roll === myRoll);
        if (row) Object.assign(mergedMarks, row.marks);
      });
      const hasMarks = Object.keys(mergedMarks).length > 0;

      const myScores: Record<string, number> = {};
      if (hasMarks && allQs.length) {
        const coQs: Record<string, typeof allQs> = {};
        allQs.forEach(q => { if (!coQs[q.co]) coQs[q.co] = []; coQs[q.co].push(q); });
        Object.entries(coQs).forEach(([co, qs]) => {
          const totalMax = qs.reduce((s, q) => s + q.maxMarks, 0);
          const scored   = qs.reduce((s, q) => {
            const v = mergedMarks[q.qno];
            return s + (v === "" || v === undefined ? 0 : Number(v));
          }, 0);
          myScores[co] = totalMax > 0 ? Math.round((scored / totalMax) * 100) : 0;
        });
      }

      const notAttained = courseCOs.filter(co => {
        const s = myScores[co.co];
        return s !== undefined && s < thresholds.targetPassPct;
      });
      const allAttained = courseCOs.length > 0 && notAttained.length === 0 && hasMarks;

      return { course, faculty, notAttained, allAttained, hasMarks };
    });
  }, [enrolledCourses, submissions, examConfigs, cosMap, users, myRoll, thresholds]);

  return (
    <AccessGate feature="dashboard" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">

        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-cyan-400" /> Enrolled Courses
          </div>
          <h1 className="text-4xl font-display text-white">My Courses</h1>
          <p className="text-white/40 font-light mt-1 text-sm font-mono">
            AY {ay.ay} · {enrolledCourses.length} course{enrolledCourses.length !== 1 ? "s" : ""}
          </p>
        </motion.div>

        {enrolledCourses.length === 0 ? (
          <motion.div variants={fadeSlideUp} className="py-24 text-center text-white/20">
            <p className="text-sm font-mono italic">No courses enrolled for AY {ay.ay}.</p>
          </motion.div>
        ) : (
          <motion.div variants={fadeSlideUp} className="flex flex-col divide-y divide-white/5">
            {courseData.map(({ course, faculty, notAttained, allAttained, hasMarks }) => (
              <div key={course.id} className="py-7 flex items-center justify-between group">
                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">{course.code}</p>
                  <h3 className="text-xl font-display text-white">{course.name}</h3>
                  <div className="flex items-center gap-4 mt-2 text-white/30 text-xs font-mono flex-wrap">
                    <span>Sem {course.semester}</span>
                    <span>{course.credits} Credits</span>
                    {faculty && <span>{faculty.name}</span>}
                    {hasMarks ? (
                      allAttained ? (
                        <span className="flex items-center gap-1 text-emerald-400">
                          <CheckCircle2 className="w-3 h-3" /> All COs Attained
                        </span>
                      ) : (
                        <span className="flex items-center gap-1 text-amber-400">
                          <AlertTriangle className="w-3 h-3" />
                          {notAttained.length} CO{notAttained.length !== 1 ? "s" : ""} Not Attained
                        </span>
                      )
                    ) : (
                      <span className="text-white/20">Marks pending</span>
                    )}
                  </div>
                </div>
                <div className="flex items-center gap-2 ml-4 shrink-0">
                  <Link
                    href={`/student/course/${course.id}/co-attainment`}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:border-cyan-400/30 hover:text-cyan-400 transition-colors"
                  >
                    <BarChart2 className="w-3.5 h-3.5" /> CO Attainment
                  </Link>
                  <Link
                    href={`/student/grievance`}
                    className="flex items-center gap-2 px-4 py-2 border border-white/10 text-[10px] font-mono uppercase tracking-widest text-white/40 hover:border-cyan-400/30 hover:text-cyan-400 transition-colors"
                  >
                    <MessageSquare className="w-3.5 h-3.5" /> Grievance
                  </Link>
                </div>
              </div>
            ))}
          </motion.div>
        )}

      </motion.div>
    </AccessGate>
  );
}
