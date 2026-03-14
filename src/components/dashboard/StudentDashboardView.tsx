"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BookOpen, CheckCircle2, XCircle, ChevronRight, 
  Calendar, Target, Activity, Clock
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore, ExamQuestion, StudentMark } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks } from "@/lib/computations";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export function StudentDashboardView() {
  const { user }         = useAuthStore();
  const courses          = useDataStore(s => s.courses);
  const submissions      = useDataStore(s => s.submissions);
  const examConfigs      = useDataStore(s => s.examConfigs);
  const cosMap           = useDataStore(s => s.cos);
  const ay               = useDataStore(s => s.ay);

  // Filter courses where student is enrolled
  const myEnrolledCourses = useMemo(() => {
    return courses.filter(c => c.studentRolls?.includes(user?.employeeId || ""));
  }, [courses, user]);

  // Compute stats for the specific student
  const studentStats = useMemo(() => {
    let totalAttainmentSum = 0;
    let coCount = 0;
    let attainedCount = 0;
    const summaries: any[] = [];

    for (const course of myEnrolledCourses) {
      const allSubmissions = submissions[course.id] || [];
      const approved = allSubmissions.filter(s => s.status === "approved");
      
      // Get only THIS student's marks from all approved exams
      const myMarks: StudentMark[] = approved.map(sub => {
        return sub.students.find((s: StudentMark) => s.roll === user?.employeeId);
      }).filter((m): m is StudentMark => !!m);

      const allExams: any[] = examConfigs[course.id] || [];
      const questions = allExams.flatMap((e: any) => e.questions);
      const attainment = computeCOAttainmentFromMarks(myMarks, questions, 60);

      const courseCOs = cosMap[course.id] || [];
      const coSummary = courseCOs.map(co => {
        const data = attainment[co.co] || { pct: 0 };
        const val = data.pct;
        coCount++;
        totalAttainmentSum += val;
        if (val >= 60) attainedCount++;
        return { id: co.co, score: val, status: val >= 60 ? "attained" : val > 0 ? "not_attained" : "pending" };
      });

      summaries.push({
        ...course,
        cos: coSummary
      });
    }

    const avg = coCount > 0 ? totalAttainmentSum / coCount : 0;
    return { avg, attainedCount, coCount, summaries };
  }, [myEnrolledCourses, submissions, examConfigs, cosMap, user]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-12 pb-32">
      
      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex justify-between items-end flex-wrap gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm font-mono text-cyan-400 uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-cyan-400" /> Student Persona
          </div>
          <div>
            <h1 className="text-5xl font-display text-white">
              Hi, <span className="text-white/40">{user?.name?.split(" ")[0]}</span>
            </h1>
            <p className="text-white/40 font-light mt-3">
              {user?.employeeId} · Year III · Computer Science & Engineering
            </p>
          </div>
        </div>
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-5 py-3 rounded-lg">
          <Calendar className="w-4 h-4 text-cyan-400" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Enrollment Status</span>
            <span className="text-sm font-display text-white">AY {ay.ay} · {myEnrolledCourses.length} Courses</span>
          </div>
        </div>
      </motion.section>

      {/* ── KEY METRICS ── */}
      <motion.section variants={fadeSlideUp} className="grid md:grid-cols-3 gap-4">
        <div className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Average Attainment</p>
          <p className="text-3xl font-mono text-cyan-400">{studentStats.avg.toFixed(1)}<span className="text-sm opacity-50 ml-1">%</span></p>
        </div>
        <div className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">COs Achieved</p>
          <p className="text-3xl font-mono text-attain">{studentStats.attainedCount}<span className="text-sm opacity-50 text-white/20 ml-1">/ {studentStats.coCount}</span></p>
        </div>
        <div className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Syllabus Progress</p>
          <p className="text-3xl font-mono text-white/60">Stage 4<span className="text-sm opacity-50 ml-1">/ 5</span></p>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-2 gap-12">
        
        {/* ── COURSE ENROLLMENTS ── */}
        <div className="flex flex-col gap-8">
          <h2 className="text-lg font-display text-white flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-cyan-400" /> Academic Portfolio
          </h2>
          <div className="flex flex-col gap-4">
            {studentStats.summaries.map(course => (
              <div key={course.id} className="p-8 border border-white/10 hover:border-cyan-400/30 transition-all group relative overflow-hidden bg-white/[0.01]">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">{course.code}</p>
                    <h3 className="text-xl font-display text-white group-hover:text-cyan-400 transition-colors uppercase pr-8 tracking-tight">{course.name}</h3>
                    <p className="text-[10px] text-white/40 font-mono mt-1 uppercase tracking-tighter">Credits: {course.credits}.0 · Dept: {course.dept}</p>
                  </div>
                  <Link href={`/student/course/${course.id}/co-attainment`} className="text-white/10 group-hover:text-cyan-400 transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                <div className="flex gap-2">
                  {course.cos.map((co: any) => (
                    <div key={co.id} className="flex flex-col items-center gap-1.5">
                      <div className={`p-1.5 rounded-sm border ${
                        co.status === "attained" ? "bg-attain/10 border-attain/20 text-attain" : 
                        co.status === "not_attained" ? "bg-alert/10 border-alert/20 text-alert" : 
                        "bg-white/5 border-white/10 text-white/10"
                      }`}>
                        {co.status === "attained" ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                         co.status === "not_attained" ? <XCircle className="w-3.5 h-3.5" /> : 
                         <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[9px] font-mono text-white/20">{co.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
            {studentStats.summaries.length === 0 && (
              <div className="p-16 border border-dashed border-white/10 text-center rounded-2xl text-white/20 font-mono text-xs uppercase tracking-widest">
                No active enrollments for {ay.ay}
              </div>
            )}
          </div>
        </div>

        {/* ── FOCUS AREAS & ANALYTICS ── */}
        <div className="flex flex-col gap-10">
           <div className="flex flex-col gap-8">
              <h2 className="text-lg font-display text-white flex items-center gap-3">
                <Target className="w-4 h-4 text-cyan-400" /> Intelligence Insights
              </h2>
              <div className="p-8 border border-alert/20 bg-alert/[0.02] rounded-2xl">
                <h3 className="text-[10px] font-mono text-alert mb-5 flex items-center gap-2 uppercase tracking-widest">
                  <Activity className="w-4 h-4" /> Focus Deficits
                </h3>
                <div className="flex flex-col gap-6">
                   <div className="flex gap-4 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-alert mt-1.5 shrink-0" />
                      <div>
                         <p className="text-xs text-white/80 font-medium">Cognitive Gap in CO3 (DBMS)</p>
                         <p className="text-[10px] text-white/30 mt-1 leading-relaxed">Your performance in SQL Optimization questions suggests a need for extra practice in Query Plan analysis.</p>
                      </div>
                   </div>
                   <div className="flex gap-4 items-start">
                      <div className="w-1.5 h-1.5 rounded-full bg-alert mt-1.5 shrink-0" />
                      <div>
                         <p className="text-xs text-white/80 font-medium">L3 Application Skill (Algorithms)</p>
                         <p className="text-[10px] text-white/30 mt-1 leading-relaxed">CO4 attainment is currently below 40%. Remedial tutorial on Greedy Strategies recommended.</p>
                      </div>
                   </div>
                </div>
              </div>
           </div>

           <div className="p-8 bg-white/[0.01] border border-white/10 rounded-2xl">
              <h3 className="text-[10px] font-mono text-white/40 mb-6 uppercase tracking-widest">Cumulative Growth</h3>
              <div className="space-y-6">
                 {['Knowledge', 'Analysis', 'Ethics', 'Design'].map(skill => (
                   <div key={skill} className="flex flex-col gap-2">
                     <div className="flex justify-between text-[10px] font-mono text-white/30 uppercase">
                        <span>{skill}</span>
                        <span>{Math.floor(Math.random()*30 + 60)}%</span>
                     </div>
                     <div className="h-0.5 bg-white/5 rounded-full overflow-hidden">
                        <div className="h-full bg-cyan-400" style={{ width: `${Math.random()*30 + 60}%` }} />
                     </div>
                   </div>
                 ))}
              </div>
           </div>
        </div>

      </div>

    </motion.div>
  );
}
