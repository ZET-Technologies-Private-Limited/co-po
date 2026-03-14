"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { AlertTriangle, MessageSquare, CheckCircle2, Clock, ChevronRight } from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore } from "@/lib/dataStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// Extract a short revision topic from a CO description
// e.g. "Formulate SQL queries using relational algebra" → "SQL queries and relational algebra"
function revisionTopic(desc: string): string {
  // Strip leading verb (first word) and return the rest, capped at 60 chars
  const words = desc.trim().split(" ");
  const topic = words.slice(1).join(" ");
  return topic.length > 60 ? topic.slice(0, 57) + "…" : topic;
}

// Compute score for a student row in an exam, respecting either-or choices
function computeExamScore(
  marks: Record<string, number | "">,
  eitherOrChoices: Record<string, "a" | "b">,
  questions: { qno: string; isEitherOr?: boolean; eitherOrGroup?: string }[]
): number {
  if (questions.length === 0) {
    // No question breakdown (T3 Assignment, T4 Quiz) — sum all marks directly
    return Object.values(marks).reduce(
      (acc: number, v) => acc + (v === "" || v === undefined ? 0 : Number(v)),
      0
    );
  }
  return questions.reduce((acc, q) => {
    if (q.isEitherOr && q.eitherOrGroup) {
      const choice = eitherOrChoices[q.eitherOrGroup];
      const suffix = q.qno.slice(-1);
      if (choice && suffix !== choice) return acc; // skip unchosen
    }
    const v = marks[q.qno];
    return acc + (v === "" || v === undefined ? 0 : Number(v));
  }, 0);
}

export default function StudentDashboardPage() {
  const router      = useRouter();
  const { user }    = useAuthStore();
  const courses     = useDataStore(s => s.courses);
  const submissions = useDataStore(s => s.submissions);
  const examConfigs = useDataStore(s => s.examConfigs);
  const cosMap      = useDataStore(s => s.cos);
  const users       = useDataStore(s => s.users);
  const ay          = useDataStore(s => s.ay);
  const grievances  = useDataStore(s => s.grievances);
  const thresholds  = useDataStore(s => s.thresholds);

  const myRoll = user?.employeeId || "";

  // Enrolled courses via studentRolls
  const enrolledCourses = useMemo(
    () => courses.filter(c => c.studentRolls?.includes(myRoll)),
    [courses, myRoll]
  );

  // Derive current semester from enrolled courses
  const currentSemester = useMemo(
    () => enrolledCourses.length ? Math.max(...enrolledCourses.map(c => c.semester)) : 0,
    [enrolledCourses]
  );

  // Per-course computed data
  const courseData = useMemo(() => {
    return enrolledCourses.map(course => {
      const approvedSubs = (submissions[course.id] || []).filter(s => s.status === "approved");
      const allExams     = examConfigs[course.id] || [];
      const allQs        = allExams.flatMap(e => e.questions);
      const courseCOs    = cosMap[course.id] || [];
      const faculty      = users.find(u => u.id === course.facultyId);

      // Merge this student's marks from all approved exams
      const mergedMarks: Record<string, number | ""> = {};
      const mergedChoices: Record<string, "a" | "b"> = {};
      approvedSubs.forEach(sub => {
        const myRow = sub.students.find(s => s.roll === myRoll);
        if (myRow) {
          Object.assign(mergedMarks, myRow.marks);
          Object.assign(mergedChoices, myRow.eitherOrChoices ?? {});
        }
      });
      const hasMarks = Object.keys(mergedMarks).length > 0;

      // Per-CO % for this student (respecting either-or)
      const myScores: Record<string, number> = {};
      if (hasMarks && allQs.length) {
        const coQs: Record<string, typeof allQs> = {};
        allQs.forEach(q => { if (!coQs[q.co]) coQs[q.co] = []; coQs[q.co].push(q); });
        Object.entries(coQs).forEach(([co, qs]) => {
          let totalMax = 0, scored = 0;
          qs.forEach(q => {
            if (q.isEitherOr && q.eitherOrGroup) {
              const choice = mergedChoices[q.eitherOrGroup];
              const suffix = q.qno.slice(-1);
              if (choice && suffix !== choice) return;
            }
            totalMax += q.maxMarks;
            const v = mergedMarks[q.qno];
            scored += v === "" || v === undefined ? 0 : Number(v);
          });
          myScores[co] = totalMax > 0 ? Math.round((scored / totalMax) * 100) : 0;
        });
      }

      // Marks per exam — T1,T2,T3,T4,SEE only (spec S2-05)
      const EXAM_COLS = ["t1", "t2", "t3", "t4", "see"];
      const examSummary: Record<string, { score: number | null; max: number; status: string }> = {};
      EXAM_COLS.forEach(examId => {
        const examCfg     = allExams.find(e => e.id === examId);
        if (!examCfg) return;
        const approvedSub = approvedSubs.find(s => s.examId === examId);
        const myRow       = approvedSub?.students.find(s => s.roll === myRoll);
        if (myRow) {
          // Use helper that handles both question-mapped and flat exams (T3/T4)
          const score = computeExamScore(
            myRow.marks,
            myRow.eitherOrChoices ?? {},
            examCfg.questions
          );
          examSummary[examId] = { score, max: examCfg.maxMarks, status: "approved" };
        } else {
          const anySub = (submissions[course.id] || []).find(s => s.examId === examId);
          examSummary[examId] = {
            score: null,
            max: examCfg.maxMarks,
            status: anySub?.status || "not_submitted",
          };
        }
      });

      // A CO is "not attained" only if we have a score for it AND it's below threshold
      const notAttained = courseCOs.filter(co => {
        const s = myScores[co.co];
        return s !== undefined && s < thresholds.targetPassPct;
      });
      // "All Attained" only when every CO has a score AND all are above threshold
      const scoredCOs = courseCOs.filter(co => myScores[co.co] !== undefined);
      const allAttained = hasMarks && scoredCOs.length === courseCOs.length && notAttained.length === 0;

      return { course, faculty, courseCOs, myScores, examSummary, notAttained, allAttained, hasMarks };
    });
  }, [enrolledCourses, submissions, examConfigs, cosMap, users, myRoll, thresholds]);

  // S2-06 Areas to improve — one line per non-attained CO
  const areasToImprove = useMemo(() => {
    const items: {
      courseCode: string; courseId: string;
      co: string; desc: string; topic: string;
      myPct: number; gap: number;
    }[] = [];
    courseData.forEach(({ course, courseCOs, myScores }) => {
      courseCOs.forEach(coDef => {
        const pct = myScores[coDef.co];
        if (pct !== undefined && pct < thresholds.targetPassPct) {
          items.push({
            courseCode: course.code,
            courseId:   course.id,
            co:         coDef.co,
            desc:       coDef.desc,
            topic:      revisionTopic(coDef.desc),
            myPct:      pct,
            gap:        thresholds.targetPassPct - pct,
          });
        }
      });
    });
    return items.sort((a, b) => a.myPct - b.myPct);
  }, [courseData, thresholds]);

  // S2-07 Open grievances — pending OR under_review
  const openGrievances = useMemo(
    () => grievances.filter(g => g.studentRoll === myRoll && (g.status === "pending" || g.status === "under_review")),
    [grievances, myRoll]
  );

  const EXAM_COLS   = ["t1", "t2", "t3", "t4", "see"];
  const EXAM_LABELS: Record<string, string> = { t1: "T1", t2: "T2", t3: "T3", t4: "T4", see: "SEE" };

  return (
    <AccessGate feature="dashboard" deny="lock">
      <motion.div
        variants={staggerContainer} initial="hidden" animate="visible"
        className="max-w-5xl mx-auto pb-32 flex flex-col"
      >
        {/* ── S2-01 HEADER — exact spec format ── */}
        <motion.div variants={fadeSlideUp} className="pb-8 border-b border-white/5">
          <div className="flex items-center gap-2 text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-3">
            <span className="w-8 h-[1px] bg-cyan-400" /> Student Dashboard
          </div>
          <h1 className="text-3xl font-display text-white">
            Welcome, {user?.name}
            {" — "}
            <span className="text-white/50 text-2xl font-light">
              Roll No: {myRoll}
              {currentSemester > 0 && ` | Semester ${currentSemester}`}
              {` | AY ${ay.ay}`}
            </span>
          </h1>
        </motion.div>

        {/* ── S2-07 GRIEVANCE STATUS LINE ── */}
        {openGrievances.length > 0 && (
          <motion.div variants={fadeSlideUp}
            className="flex items-center gap-3 py-3 mt-4 border border-amber-400/20 bg-amber-400/5 px-4">
            <MessageSquare className="w-3.5 h-3.5 text-amber-400 shrink-0" />
            <p className="text-xs font-mono text-amber-400 flex-1">
              {openGrievances.length === 1
                ? `Marks grievance for ${
                    courses.find(c => c.id === openGrievances[0].courseId)?.code ?? openGrievances[0].courseId
                  } ${openGrievances[0].qno} is pending review.`
                : `${openGrievances.length} marks grievances are pending review.`}
            </p>
            <Link href="/student/grievance"
              className="text-[9px] font-mono uppercase tracking-widest text-amber-400/60 hover:text-amber-400 transition-colors flex items-center gap-1 shrink-0">
              View <ChevronRight className="w-3 h-3" />
            </Link>
          </motion.div>
        )}

        {/* ── S2-02/03/04 ENROLLED COURSES TABLE ── */}
        <motion.div variants={fadeSlideUp} className="pt-10 pb-10 border-b border-white/5">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Enrolled Courses</p>

          {enrolledCourses.length === 0 ? (
            <p className="text-white/20 text-sm font-mono italic py-8 text-center">
              No courses enrolled for AY {ay.ay}.
            </p>
          ) : (
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-white/10">
                  {["Course Code", "Course Name", "Faculty", "CO Attainment Status", "Marks Available"].map(h => (
                    <th key={h} className="pb-3 pr-6 text-[9px] font-mono text-white/30 uppercase tracking-widest font-normal">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {courseData.map(({ course, faculty, notAttained, allAttained, hasMarks, examSummary }) => {
                  const approvedCount = Object.values(examSummary).filter(e => e.score !== null).length;
                  return (
                    // S2-04: entire row clickable
                    <tr
                      key={course.id}
                      onClick={() => router.push(`/student/course/${course.id}/co-attainment`)}
                      className="hover:bg-white/[0.02] transition-colors cursor-pointer group"
                    >
                      <td className="py-4 pr-6 font-mono text-xs text-cyan-400">{course.code}</td>
                      <td className="py-4 pr-6">
                        <p className="text-sm text-white group-hover:text-cyan-400 transition-colors">{course.name}</p>
                        <p className="text-[10px] font-mono text-white/30 mt-0.5">Sem {course.semester} · {course.credits} Cr</p>
                      </td>
                      <td className="py-4 pr-6 text-xs font-mono text-white/40 whitespace-nowrap">
                        {faculty?.name ?? "—"}
                      </td>
                      {/* S2-03 */}
                      <td className="py-4 pr-6">
                        {!hasMarks ? (
                          <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Pending</span>
                        ) : allAttained ? (
                          <span className="flex items-center gap-1.5 text-[10px] font-mono text-emerald-400 uppercase tracking-widest">
                            <CheckCircle2 className="w-3 h-3" /> All Attained
                          </span>
                        ) : (
                          <span className="flex items-center gap-1.5 text-[10px] font-mono text-amber-400 uppercase tracking-widest">
                            <AlertTriangle className="w-3 h-3" />
                            {notAttained.length} CO{notAttained.length !== 1 ? "s" : ""} Not Attained
                          </span>
                        )}
                      </td>
                      <td className="py-4">
                        {approvedCount > 0 ? (
                          <span className="text-[10px] font-mono text-white/40">
                            {approvedCount} exam{approvedCount !== 1 ? "s" : ""} available
                          </span>
                        ) : (
                          <span className="flex items-center gap-1 text-[10px] font-mono text-white/20">
                            <Clock className="w-3 h-3" /> Awaiting approval
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </motion.div>

        {/* ── S2-05 MARKS SUMMARY TABLE — T1|T2|T3|T4|SEE|Total ── */}
        {courseData.some(d => d.hasMarks) && (
          <motion.div variants={fadeSlideUp} className="pt-10 pb-10 border-b border-white/5">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Marks Summary</p>
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse min-w-[560px]">
                <thead>
                  <tr className="border-b border-white/10">
                    <th className="pb-3 pr-8 text-[9px] font-mono text-white/30 uppercase tracking-widest font-normal">Course</th>
                    {EXAM_COLS.map(id => (
                      <th key={id} className="pb-3 pr-6 text-[9px] font-mono text-white/30 uppercase tracking-widest font-normal text-center">
                        {EXAM_LABELS[id]}
                      </th>
                    ))}
                    <th className="pb-3 text-[9px] font-mono text-white/30 uppercase tracking-widest font-normal text-center">Total</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-white/5">
                  {courseData.filter(d => d.hasMarks).map(({ course, examSummary }) => {
                    const total = EXAM_COLS.reduce((acc, id) => acc + (examSummary[id]?.score ?? 0), 0);
                    return (
                      <tr key={course.id}
                        onClick={() => router.push(`/student/course/${course.id}/co-attainment`)}
                        className="hover:bg-white/[0.02] transition-colors cursor-pointer">
                        <td className="py-4 pr-8">
                          <p className="text-xs font-mono text-cyan-400">{course.code}</p>
                          <p className="text-[10px] text-white/30 font-mono mt-0.5 truncate max-w-[160px]">{course.name}</p>
                        </td>
                        {EXAM_COLS.map(id => {
                          const e = examSummary[id];
                          return (
                            <td key={id} className="py-4 pr-6 text-center">
                              {e?.score !== null && e?.score !== undefined ? (
                                <span className="font-mono text-sm text-white">
                                  {e.score}
                                  <span className="text-white/20 text-[10px]">/{e.max}</span>
                                </span>
                              ) : (
                                <span className="text-white/20 text-[10px] font-mono">
                                  {e?.status === "pending" ? "Pend." : "—"}
                                </span>
                              )}
                            </td>
                          );
                        })}
                        <td className="py-4 text-center">
                          <span className="font-mono text-sm text-cyan-400 font-medium">{total}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
            <p className="text-[9px] font-mono text-white/20 mt-3 uppercase tracking-widest">
              Values shown once faculty submits and Lead approves · T5 (Model Exam) excluded from summary
            </p>
          </motion.div>
        )}

        {/* ── S2-06 AREAS TO IMPROVE ── */}
        {areasToImprove.length > 0 && (
          <motion.div variants={fadeSlideUp} className="pt-10 pb-10 border-b border-white/5">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-5">Areas to Improve</p>
            <div className="flex flex-col divide-y divide-white/5">
              {areasToImprove.map((item, i) => (
                <div key={i} className="py-3 flex items-start gap-3">
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-400 shrink-0 mt-0.5" />
                  {/* Spec format: "CO3 in CS301: Revise [topic] — improve by X%" */}
                  <p className="text-sm font-mono text-white/70 flex-1">
                    <span className="text-cyan-400">{item.co}</span>
                    {" in "}
                    <span className="text-white">{item.courseCode}</span>
                    {": Revise "}
                    <span className="text-white/50 font-light">{item.topic}</span>
                    <span className="text-white/30 ml-2 text-xs">— improve by {item.gap}%</span>
                  </p>
                  <Link
                    href={`/student/course/${item.courseId}/co-attainment`}
                    onClick={e => e.stopPropagation()}
                    className="text-[9px] font-mono uppercase tracking-widest text-white/20 hover:text-cyan-400 transition-colors shrink-0"
                  >
                    Details →
                  </Link>
                </div>
              ))}
            </div>
          </motion.div>
        )}

        {/* ── QUICK NAV ── */}
        <motion.div variants={fadeSlideUp} className="pt-8 flex items-center gap-8 text-[10px] font-mono uppercase tracking-widest">
          <Link href="/student/courses" className="text-white/30 hover:text-cyan-400 transition-colors flex items-center gap-1">
            All Courses <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/student/marks" className="text-white/30 hover:text-cyan-400 transition-colors flex items-center gap-1">
            Full Marks <ChevronRight className="w-3 h-3" />
          </Link>
          <Link href="/student/grievance" className="text-white/30 hover:text-cyan-400 transition-colors flex items-center gap-1">
            Grievances <ChevronRight className="w-3 h-3" />
          </Link>
        </motion.div>

      </motion.div>
    </AccessGate>
  );
}
