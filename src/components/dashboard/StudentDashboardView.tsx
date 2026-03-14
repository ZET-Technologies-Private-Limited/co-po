"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { 
  BookOpen, ChartBar, CheckCircle2, XCircle, ChevronRight, 
  ArrowRight, Award, History, TrendingUp, Clock
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// ─── MOCK STUDENT DATA (Spec-aligned) ───────────────────────────────────
const ENROLLED_COURSES = [
  { 
    id: "cs301", code: "CS301", name: "Database Management Systems", 
    faculty: "Prof. Anita Nair",
    cos: [
      { id: "CO1", status: "attained", score: 85 },
      { id: "CO2", status: "attained", score: 72 },
      { id: "CO3", status: "not_attained", score: 45 },
      { id: "CO4", status: "pending", score: 0 },
      { id: "CO5", status: "pending", score: 0 },
    ]
  },
  { 
    id: "cs302", code: "CS302", name: "Design & Analysis of Algorithms", 
    faculty: "Dr. Ramesh Iyer",
    cos: [
      { id: "CO1", status: "attained", score: 90 },
      { id: "CO2", status: "attained", score: 65 },
      { id: "CO3", status: "attained", score: 62 },
      { id: "CO4", status: "not_attained", score: 38 },
    ]
  }
];

const RECENT_MARKS = [
  { course: "CS301", exam: "T1", score: 18, max: 20, pct: 90 },
  { course: "CS302", exam: "T1", score: 14, max: 20, pct: 70 },
  { course: "CS301", exam: "T2", score: 12, max: 20, pct: 60 },
];

export function StudentDashboardView() {
  const { user } = useAuthStore();

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-16 pb-32">
      
      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm font-mono text-cyan-400 uppercase tracking-widest">
          <span className="w-8 h-[1px] bg-cyan-400" /> Student Portal
        </div>
        <div>
          <h1 className="text-5xl font-display text-white">
            Hello, <span className="text-white/40">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-white/40 font-light mt-3">
            {user?.employeeId} · {user?.designation} · Computer Science & Engineering
          </p>
        </div>
      </motion.section>

      {/* ── STATS OVERVIEW ── */}
      <motion.section variants={fadeSlideUp} className="grid md:grid-cols-3 gap-4">
        <div className="p-6 border border-white/10 bg-white/[0.02]">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Average Attainment</p>
          <p className="text-3xl font-mono text-cyan-400">76.4<span className="text-sm opacity-50 ml-1">%</span></p>
        </div>
        <div className="p-6 border border-white/10 bg-white/[0.02]">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">COs Attained</p>
          <p className="text-3xl font-mono text-attain">12<span className="text-sm opacity-50 text-white/20 ml-1">/ 15</span></p>
        </div>
        <div className="p-6 border border-white/10 bg-white/[0.02]">
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">Current Ranking</p>
          <p className="text-3xl font-mono text-white/60">Top 15<span className="text-sm opacity-50 ml-1">%</span></p>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-2 gap-16">
        
        {/* ── MY COURSES (Spec: My courses this semester widget) ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <h2 className="text-lg font-display text-white flex items-center gap-3">
            <BookOpen className="w-4 h-4 text-cyan-400" /> My Courses
          </h2>
          <div className="flex flex-col gap-4">
            {ENROLLED_COURSES.map(course => (
              <div key={course.id} className="p-8 border border-white/10 hover:border-cyan-400/30 transition-all group relative overflow-hidden">
                <div className="flex justify-between items-start mb-6">
                  <div>
                    <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">{course.code}</p>
                    <h3 className="text-xl font-display text-white group-hover:text-cyan-400 transition-colors uppercase pr-8 tracking-tight">{course.name}</h3>
                    <p className="text-sm text-white/40 font-light mt-1 italic">{course.faculty}</p>
                  </div>
                  <Link href={`/student/course/${course.id}/co-attainment`} className="text-white/20 group-hover:text-white transition-colors">
                    <ChevronRight className="w-5 h-5" />
                  </Link>
                </div>

                {/* CO Icons (Spec: mini status icons) */}
                <div className="flex gap-2">
                  {course.cos.map(co => (
                    <div key={co.id} className="flex flex-col items-center gap-1.5">
                      <div className={`p-1.5 rounded-sm ${
                        co.status === "attained" ? "bg-attain/10 text-attain" : 
                        co.status === "not_attained" ? "bg-alert/10 text-alert" : 
                        "bg-white/5 text-white/20"
                      }`}>
                        {co.status === "attained" ? <CheckCircle2 className="w-3.5 h-3.5" /> : 
                         co.status === "not_attained" ? <XCircle className="w-3.5 h-3.5" /> : 
                         <Clock className="w-3.5 h-3.5" />}
                      </div>
                      <span className="text-[9px] font-mono text-white/30">{co.id}</span>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </motion.section>

        {/* ── MY MARKS (Spec: My marks summary widget) ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <h2 className="text-lg font-display text-white flex items-center gap-3">
            <TrendingUp className="w-4 h-4 text-cyan-400" /> Result Summary
          </h2>
          <div className="border border-white/10 overflow-hidden">
            <table className="w-full text-left font-mono text-xs">
              <thead className="bg-white/[0.03] border-b border-white/10">
                <tr>
                  <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Exam</th>
                  <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Score</th>
                  <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal font-bold">Percentage</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {RECENT_MARKS.map((mark, i) => (
                  <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                    <td className="px-6 py-5">
                      <p className="text-white/70">{mark.course}</p>
                      <p className="text-[10px] text-white/20 mt-0.5">{mark.exam}</p>
                    </td>
                    <td className="px-6 py-5">
                      <span className="text-white">{mark.score}</span>
                      <span className="text-white/20"> / {mark.max}</span>
                    </td>
                    <td className="px-6 py-5">
                      <div className="flex items-center gap-3">
                        <div className="flex-1 h-1 bg-white/5 rounded-full overflow-hidden">
                          <div className="h-full bg-cyan-400/50" style={{ width: `${mark.pct}%` }} />
                        </div>
                        <span className="text-cyan-400">{mark.pct}%</span>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="p-6 bg-white/[0.01] flex justify-center">
              <Link href="/student/marks" className="text-[10px] font-mono uppercase tracking-widest text-white/40 hover:text-white transition-colors flex items-center gap-2">
                View All Results <ArrowRight className="w-3 h-3" />
              </Link>
            </div>
          </div>

          {/* AREAS TO IMPROVE (Spec widget) */}
          <div className="p-8 border border-alert/20 bg-alert/[0.02]">
            <h3 className="text-sm font-display text-alert mb-4 flex items-center gap-2 uppercase tracking-widest">
              <History className="w-4 h-4" /> Focus Areas
            </h3>
            <ul className="flex flex-col gap-3">
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-alert mt-1.5" />
                <div>
                  <p className="text-xs text-white/70">Join Performance (CS301 CO3)</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Focus on Hash Joins and Indexing strategies.</p>
                </div>
              </li>
              <li className="flex gap-3 items-start">
                <span className="w-1.5 h-1.5 rounded-full bg-alert mt-1.5" />
                <div>
                  <p className="text-xs text-white/70">Dynamic Programming (CS302 CO4)</p>
                  <p className="text-[10px] text-white/30 mt-0.5">Revise memoization vs tabulation.</p>
                </div>
              </li>
            </ul>
          </div>
        </motion.section>
      </div>
    </motion.div>
  );
}
