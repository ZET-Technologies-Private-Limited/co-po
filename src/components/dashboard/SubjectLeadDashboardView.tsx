"use client";

import { useMemo } from "react";
import { motion } from "framer-motion";
import Link from "next/link";
import { 
  Layers, CheckCircle, Clock, AlertTriangle, 
  ChevronRight, ArrowUpRight, BarChart3, Users, 
  CheckCircle2, AlertCircle, Info, FileText
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore } from "@/lib/dataStore";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

// No more mock constants — data comes from dataStore

export function LeadDashboardView() {
  const { user }      = useAuthStore();
  const courses       = useDataStore(s => s.courses);
  const submissions   = useDataStore(s => s.submissions);
  const examConfigs   = useDataStore(s => s.examConfigs);
  const thresholds    = useDataStore(s => s.thresholds);

  // Build the real approval queue from pending submissions
  const approvalQueue = useMemo(() => {
    const items: { course: string; exam: string; courseId: string; submittedAt?: string }[] = [];
    for (const c of courses) {
      const subs = submissions[c.id] || [];
      const exams = examConfigs[c.id] || [];
      for (const sub of subs) {
        if (sub.status === "pending") {
          const exam = exams.find(e => e.id === sub.examId);
          items.push({ course: c.code, exam: exam?.name || sub.examId.toUpperCase(), courseId: c.id, submittedAt: sub.submittedAt?.substring(0, 10) });
        }
      }
    }
    return items;
  }, [submissions, courses, examConfigs]);

  const poSummary = [
    { label: "Courses Assigned", val: String(courses.length), icon: BarChart3, color: "text-brand" },
    { label: "Pending Approvals", val: String(approvalQueue.length), icon: Clock, color: approvalQueue.length > 0 ? "text-amber-400" : "text-attain" },
    { label: "Approved Exams",   val: String(Object.values(submissions).flat().filter(s => s.status === "approved").length), icon: CheckCircle2, color: "text-attain" },
    { label: "Level 3 Threshold", val: `${thresholds.level3}%`, icon: AlertCircle, color: "text-brand" },
  ];

  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-16 pb-32">
      
      {/* ── HEADER ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-col gap-4">
        <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest">
          <span className="w-8 h-[1px] bg-brand" /> Coordinator Hub
        </div>
        <div>
          <h1 className="text-5xl font-display text-white">
            Lead Overview: <span className="text-white/40">{user?.name?.split(" ")[0]}</span>
          </h1>
          <p className="text-white/40 font-light mt-3">
             Computer Science · Course Coordinator Portfolio
          </p>
        </div>
      </motion.section>

      {/* ── PO/PSO SUMMARY CARDS (Spec: Page 1) ── */}
      <motion.section variants={fadeSlideUp} className="grid md:grid-cols-4 gap-4">
        {poSummary.map((stat, i) => (
          <div key={i} className="p-6 border border-white/10 bg-white/[0.02] flex flex-col gap-1">
            <div className="flex justify-between items-start mb-2">
              <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">{stat.label}</p>
              <stat.icon className={`w-3.5 h-3.5 ${stat.color}`} />
            </div>
            <p className={`text-2xl font-mono ${stat.color}`}>{stat.val}</p>
          </div>
        ))}
      </motion.section>

      <div className="grid lg:grid-cols-2 gap-16">
        
        {/* ── ASSIGNED COURSES (Spec: Panel with Green/Amber/Red status) ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <h2 className="text-lg font-display text-white flex items-center gap-3">
            <Layers className="w-4 h-4 text-brand" /> Course Portfolio
          </h2>
          <div className="flex flex-col gap-4">
            {courses.map(course => (
              <Link key={course.id} href={`/courses/${course.id}`} 
                className="p-8 border border-white/10 hover:border-white/20 transition-all group flex items-center justify-between"
              >
                <div className="flex items-center gap-6">
                  <div className="w-2 h-12 bg-brand/70" />
                  <div>
                    <p className="text-[10px] font-mono text-white/20 uppercase tracking-widest mb-1">{course.code}</p>
                    <h3 className="text-xl font-display text-white group-hover:text-brand transition-colors">{course.name}</h3>
                    <p className="text-[10px] text-white/30 font-mono mt-2 italic">{course.dept} &nbsp;·&nbsp; {course.credits} credits</p>
                  </div>
                </div>
                <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
              </Link>
            ))}
          </div>
        </motion.section>

        {/* ── MARKS APPROVAL QUEUE (Spec: Marks approval queue widget) ── */}
        <motion.section variants={fadeSlideUp} className="flex flex-col gap-8">
          <h2 className="text-lg font-display text-white flex items-center gap-3">
            <Clock className="w-4 h-4 text-brand" /> Approval Queue
          </h2>
          <div className="flex flex-col gap-4">
            {approvalQueue.length === 0 ? (
              <div className="py-12 text-center text-white/20 italic text-xs font-mono">No pending approvals.</div>
            ) : approvalQueue.map((item, i) => (
              <div key={i} className="p-6 border border-white/10 bg-white/[0.01] flex items-center justify-between group">
                <div className="flex items-center gap-4">
                   <div className="w-10 h-10 rounded bg-brand/10 border border-brand/20 flex items-center justify-center text-brand">
                     <FileText className="w-5 h-5" />
                   </div>
                   <div>
                     <p className="text-sm text-white font-medium">{item.course} — {item.exam}</p>
                     <p className="text-[10px] text-white/40 font-mono mt-1">Submitted {item.submittedAt || "recently"}</p>
                   </div>
                </div>
                <Link href="/lead/marks-approval" className="px-4 py-2 border border-brand/30 text-brand text-[10px] font-mono uppercase tracking-widest hover:bg-brand hover:text-white transition-all">
                  Review
                </Link>
              </div>
            ))}
            
            {/* LOW ATTAINMENT ALERTS (Spec widget) */}
            <div className="mt-8 p-8 border border-alert/20 bg-alert/[0.02]">
              <h3 className="text-sm font-display text-alert mb-4 flex items-center gap-2 uppercase tracking-widest">
                <AlertCircle className="w-4 h-4" /> Attainment Alerts
              </h3>
              <div className="flex flex-col gap-4">
                <div className="flex items-start gap-4">
                  <div className="w-1.5 h-1.5 rounded-full bg-alert mt-1.5" />
                  <div>
                    <p className="text-xs text-white/80">CS303 (OS) — CO2 is Level 1 (32%)</p>
                    <p className="text-[10px] text-white/40 mt-1 italic">Faculty remedial action pending.</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </motion.section>
      </div>

    </motion.div>
  );
}
