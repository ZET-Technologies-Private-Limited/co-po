"use client";

import { useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { 
  Layers, CheckCircle, Clock, AlertTriangle, 
  ChevronRight, BarChart3, Users, BookOpen, 
  CheckCircle2, AlertCircle, Calendar, Plus,
  FileSpreadsheet, ArrowUpRight
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore } from "@/lib/dataStore";
import { computeCOAttainmentFromMarks } from "@/lib/computations";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export function FacultyDashboardView() {
  const { user }         = useAuthStore();
  const courses          = useDataStore(s => s.courses);
  const submissions      = useDataStore(s => s.submissions);
  const examConfigs      = useDataStore(s => s.examConfigs);
  const cos              = useDataStore(s => s.cos);
  const thresholds       = useDataStore(s => s.thresholds);
  const ay               = useDataStore(s => s.ay);

  // Filter courses for this faculty
  const myCourses = useMemo(() => 
    courses.filter(c => c.facultyId === user?.id || !c.facultyId), 
    [courses, user]);

  // Aggregate stats across all my courses
  const stats = useMemo(() => {
    let totalCOs = 0;
    let generatedCOs = 0;
    let pendingApprovals = 0;
    let lowAttainmentCount = 0;

    for (const course of myCourses) {
      const courseCOs = cos[course.id] || [];
      totalCOs += courseCOs.length;
      if (courseCOs.length > 0) generatedCOs++;

      const subs = submissions[course.id] || [];
      pendingApprovals += subs.filter(s => s.status === "pending").length;

      // Quick attainment check for low COs
      const allMarks = subs.filter(s => s.status === "approved").flatMap(s => s.students);
      if (allMarks.length > 0) {
        const exams = examConfigs[course.id] || [];
        const questions = exams.flatMap(e => e.questions);
        const attainment = computeCOAttainmentFromMarks(allMarks, questions, thresholds.targetPassPct);
        lowAttainmentCount += Object.values(attainment).filter(v => v.pct < thresholds.level3).length;
      }
    }

    return { totalCOs, generatedCOs, pendingApprovals, lowAttainmentCount };
  }, [myCourses, cos, submissions, examConfigs, thresholds]);

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-12 pb-32">
      
      {/* ── HEADER & AY SELECTOR ── */}
      <motion.section variants={fadeSlideUp} className="flex justify-between items-end flex-wrap gap-6">
        <div className="flex flex-col gap-4">
          <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest">
            <span className="w-8 h-[1px] bg-brand" /> Faculty Portal
          </div>
          <div>
            <h1 className="text-5xl font-display text-white">
              Welcome back, <span className="text-white/40">{user?.name?.split(" ")[0]}</span>
            </h1>
            <p className="text-white/40 font-light mt-3">
               Computer Science · Department of Engineering
            </p>
          </div>
        </div>
        
        <div className="flex items-center gap-4 bg-white/[0.03] border border-white/10 px-5 py-3 rounded-lg">
          <Calendar className="w-4 h-4 text-brand" />
          <div className="flex flex-col">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Academic Year</span>
            <span className="text-sm font-display text-white">{ay.ay} {ay.status === 'locked' ? '🔒' : '●'}</span>
          </div>
          <select className="bg-transparent border-none text-white/0 w-4 cursor-pointer outline-none">
            <option value="24-25">2024-25</option>
          </select>
        </div>
      </motion.section>

      {/* ── KEY METRICS (Spec: Page 2 Dashboard Components) ── */}
      <motion.section variants={fadeSlideUp} className="grid md:grid-cols-4 gap-4">
        <div className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">My Courses</p>
            <Layers className="w-3.5 h-3.5 text-brand" />
          </div>
          <p className="text-2xl font-mono text-white">{myCourses.length}</p>
        </div>
        <div className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">CO Status</p>
            <BookOpen className={`w-3.5 h-3.5 ${stats.generatedCOs < myCourses.length ? "text-alert" : "text-attain"}`} />
          </div>
          <p className="text-2xl font-mono text-white">{stats.generatedCOs}/{myCourses.length} <span className="text-[10px] text-white/20 font-light">Generated</span></p>
        </div>
        <div className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Pending Appr.</p>
            <Clock className={`w-3.5 h-3.5 ${stats.pendingApprovals > 0 ? "text-amber-400" : "text-white/20"}`} />
          </div>
          <p className="text-2xl font-mono text-white">{stats.pendingApprovals}</p>
        </div>
        <div className="p-6 border border-white/10 bg-alert/5 flex flex-col gap-1">
          <div className="flex justify-between items-start mb-2">
            <p className="text-[10px] font-mono text-alert/50 uppercase tracking-widest">Attainment Alerts</p>
            <AlertTriangle className={`w-3.5 h-3.5 ${stats.lowAttainmentCount > 0 ? "text-alert" : "text-white/10"}`} />
          </div>
          <p className={`text-2xl font-mono ${stats.lowAttainmentCount > 0 ? "text-alert" : "text-white/20"}`}>{stats.lowAttainmentCount}</p>
        </div>
      </motion.section>

      <div className="grid lg:grid-cols-3 gap-12">
        
        {/* ── COURSE LIST (Spec Component 1) ── */}
        <div className="lg:col-span-2 flex flex-col gap-8">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-display text-white flex items-center gap-3">
              <Layers className="w-4 h-4 text-brand" /> My Teaching Portfolio
            </h2>
          </div>
          <div className="flex flex-col gap-4">
            {myCourses.map(course => {
              const courseCOs = cos[course.id] || [];
              const subList = Array.isArray(submissions[course.id]) ? submissions[course.id] : [];
              const hasPending = subList.some(s => s.status === "pending");
              return (
                <Link key={course.id} href={`/courses/${course.id}`} 
                  className="p-8 border border-white/10 hover:border-white/20 transition-all bg-white/[0.01] hover:bg-white/[0.02] group flex items-center justify-between rounded-xl"
                >
                  <div className="flex items-center gap-6">
                    <div className={`w-1.5 h-12 rounded-full ${courseCOs.length === 0 ? "bg-alert" : "bg-attain"}`} />
                    <div>
                      <div className="flex items-center gap-3 mb-1">
                        <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest">{course.code}</p>
                        {hasPending && <span className="text-[8px] font-mono bg-amber-400/10 text-amber-400 px-1.5 py-0.5 rounded border border-amber-400/20 uppercase">Awaiting Approval</span>}
                      </div>
                      <h3 className="text-xl font-display text-white group-hover:text-brand transition-colors">{course.name}</h3>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-[10px] text-white/30 font-mono">Sem {course.semester}</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] text-white/30 font-mono">{course.credits} Credits</span>
                        <span className="w-1 h-1 rounded-full bg-white/10" />
                        <span className="text-[10px] text-white/30 font-mono flex items-center gap-1">
                          <BookOpen className="w-3 h-3" /> {courseCOs.length} COs
                        </span>
                      </div>
                    </div>
                  </div>
                  <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
                </Link>
              );
            })}
          </div>
        </div>

        {/* ── PENDING ACTIONS & QUICK LINKS (Spec Component 5) ── */}
        <div className="flex flex-col gap-8">
          <h2 className="text-lg font-display text-white flex items-center gap-3">
            <Clock className="w-4 h-4 text-brand" /> Action Items
          </h2>
          <div className="flex flex-col gap-4">
            {myCourses.filter(c => (cos[c.id] || []).length === 0).map(c => (
              <Link key={c.id} href={`/courses/${c.id}/generate-co`} className="p-5 border border-alert/20 bg-alert/5 flex items-center justify-between group rounded-lg">
                <div className="flex items-center gap-4">
                  <AlertCircle className="w-5 h-5 text-alert" />
                  <div>
                    <p className="text-xs text-white font-medium">COs Not Generated</p>
                    <p className="text-[10px] text-white/40 font-mono mt-1">{c.code} · Action Required</p>
                  </div>
                </div>
                <ArrowUpRight className="w-4 h-4 text-white/20 group-hover:text-alert transition-colors" />
              </Link>
            ))}
            
            {/* Quick Actions */}
            <div className="mt-4 flex flex-col gap-3">
              <h3 className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">Quick Workflows</h3>
              <Link href="/courses/new" className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors rounded-lg text-sm">
                <Plus className="w-4 h-4 text-brand" /> Create New Course
              </Link>
              <Link href="/notifications" className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors rounded-lg text-sm">
                <CheckCircle2 className="w-4 h-4 text-attain" /> Review Deadlines
              </Link>
              <div onClick={() => window.open('/template.xlsx')} className="flex items-center gap-3 p-4 bg-white/5 border border-white/10 text-white/80 hover:bg-white/10 transition-colors rounded-lg text-sm cursor-pointer">
                <FileSpreadsheet className="w-4 h-4 text-brand" /> Download Marks Template
              </div>
            </div>

            {/* Notification Summary Widget */}
            <div className="mt-8 p-6 bg-brand/5 border border-brand/20 rounded-xl">
               <h3 className="text-xs font-display text-brand mb-4 flex items-center gap-2 uppercase tracking-widest">
                 System Alerts
               </h3>
               <div className="space-y-4">
                  <div className="flex gap-3">
                    <div className="w-1 h-1 rounded-full bg-brand mt-1.5" />
                    <p className="text-[11px] text-white/60 leading-relaxed">Admin has set the T2 marks deadline to **25th March 2026**.</p>
                  </div>
                  <div className="flex gap-3">
                    <div className="w-1 h-1 rounded-full bg-brand mt-1.5" />
                    <p className="text-[11px] text-white/60 leading-relaxed">SY2024-25 Curriculum Gaps report has been published.</p>
                  </div>
               </div>
            </div>
          </div>
        </div>

      </div>

    </motion.div>
  );
}
