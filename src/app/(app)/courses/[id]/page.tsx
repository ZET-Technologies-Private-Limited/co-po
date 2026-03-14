"use client";

import { use } from "react";
import { motion } from "framer-motion";
import { 
  Users, BookOpen, Clock, BrainCircuit, ArrowRight, 
  ChevronRight, Target, ShieldCheck, Sparkles 
} from "lucide-react";
import { COURSES, COURSE_COS, getCourseHealth, getAttainmentLevel } from "@/lib/appData";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import Link from "next/link";
import { useAuthStore } from "@/lib/authStore";

export default function CourseOverviewPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: courseId } = use(params);
  const { activeRole } = useAuthStore();
  const course = COURSES.find(c => c.id === courseId);
  const cos = COURSE_COS[courseId] || [];
  const health = getCourseHealth(cos.map(c => ({ pct: c.pct })));

  if (!course) return null;

  return (
    <motion.div 
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="w-full flex flex-col gap-16 py-8"
    >
      {/* ── METADATA STRIP ── */}
      <motion.section variants={fadeSlideUp} className="flex flex-wrap items-center gap-12 border-b border-white/10 pb-12">
        <div className="flex flex-col gap-1">
           <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Credits</span>
           <span className="text-xl text-white font-display">{course.credits} Units</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
        <div className="flex flex-col gap-1">
           <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Semester</span>
           <span className="text-xl text-white font-display">{course.semester} - Autumn</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
        <div className="flex flex-col gap-1">
           <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Instruction</span>
           <span className="text-xl text-white font-display">{course.examType}</span>
        </div>
        <div className="w-[1px] h-8 bg-white/10 hidden md:block" />
        <div className="flex flex-col gap-1 text-right ml-auto">
           <span className="text-[10px] font-mono text-white/30 uppercase tracking-[0.3em]">Aggregate</span>
           <span className={`text-xl font-mono ${health >= 75 ? 'text-attain' : 'text-brand'}`}>{health}%</span>
        </div>
      </motion.section>

      {/* ── OUTCOME SNAPSHOT ── */}
      <motion.section variants={fadeSlideUp}>
         <div className="flex items-center justify-between mb-10">
            <h2 className="text-2xl font-display text-white">Curriculum Integrity</h2>
            <Link href={`/courses/${courseId}/co-attainment`} className="text-xs font-mono text-white/30 hover:text-white transition-colors uppercase tracking-widest flex items-center gap-2">
               Full Attainment Audit <ChevronRight className="w-3 h-3" />
            </Link>
         </div>
         <div className="flex flex-col gap-0 divide-y divide-white/5">
            {cos.slice(0, 4).map((co, i) => {
              const lvl = getAttainmentLevel(co.pct);
              return (
                <div key={co.co} className="py-6 flex items-center gap-8 group">
                   <span className="w-12 font-mono text-sm text-white/20 group-hover:text-white/40 transition-colors uppercase tracking-widest">{co.co}</span>
                   <p className="flex-1 text-white/60 text-sm font-light truncate">{co.desc}</p>
                   <div className="w-48 h-[2px] bg-white/5 relative hidden sm:block">
                      <motion.div 
                        className={`absolute h-full left-0 ${lvl.color.replace('text-', 'bg-')}`}
                        initial={{ width: 0 }}
                        whileInView={{ width: `${co.pct}%` }}
                        viewport={{ once: true }}
                        transition={{ duration: 1, delay: i * 0.1 }}
                      />
                   </div>
                   <span className={`w-12 text-right font-mono text-sm ${lvl.color}`}>{co.pct}%</span>
                </div>
              );
            })}
         </div>
      </motion.section>

      {/* ── AI DIAGNOSTIC PANEL ── */}
      <motion.section variants={fadeSlideUp} className="bg-white/[0.02] border border-white/5 p-10 relative overflow-hidden">
         <div className="absolute top-0 right-0 p-8 opacity-20">
            <BrainCircuit className="w-12 h-12 text-brand" />
         </div>
         <div className="relative z-10">
            <div className="flex items-center gap-3 text-brand text-[10px] font-mono uppercase tracking-[0.3em] mb-6">
               <Sparkles className="w-3 h-3" /> Predictive Insights
            </div>
            <p className="text-xl font-light text-white/80 leading-relaxed max-w-3xl">
               Current data indicates <span className="text-white font-medium">high fidelity</span> in student engagement for {course.code.toUpperCase()}. 
               However, CO3 shows a <span className="text-alert">12% variance</span> compared to {course.dept} averages. 
               Recommend focusing on relational algebra optimization in the upcoming T3 sessions.
            </p>
            <div className="mt-8 flex gap-8">
               <div className="flex items-center gap-2">
                  <ShieldCheck className="w-4 h-4 text-attain" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Syllabus Unified</span>
               </div>
               <div className="flex items-center gap-2">
                  <Target className="w-4 h-4 text-brand" />
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">OBE Compliant</span>
               </div>
            </div>
         </div>
      </motion.section>

      {/* ── QUICK WORKFLOW ACCESS ── */}
      {["admin", "faculty", "subject_lead"].includes(activeRole || "") && (
        <motion.section variants={fadeSlideUp} className="grid grid-cols-1 md:grid-cols-2 gap-12">
           {[
             { label: "AI Question Scans", count: "12 Assets", href: `/courses/${courseId}/exams`, icon: Sparkles },
             { label: "Mapping Topology", count: "36 Nodes", href: `/courses/${courseId}/mapping`, icon: Target },
             activeRole === "faculty" || activeRole === "admin" ? { label: "Generate COs", count: "Neural Draft", href: `/courses/${courseId}/generate-co`, icon: BrainCircuit } : null,
           ].filter(Boolean).map((item: any) => (
             <Link key={item.label} href={item.href} className="group border-b border-white/10 pb-8 flex items-end justify-between transition-all hover:pl-2">
                <div>
                   <p className="text-[10px] font-mono text-white/20 uppercase tracking-[0.4em] mb-4">{item.count}</p>
                   <h3 className="text-3xl font-display text-white group-hover:text-brand transition-colors">{item.label}</h3>
                </div>
                <ArrowRight className="w-6 h-6 text-white/10 group-hover:text-white transition-all transform group-hover:translate-x-2" />
             </Link>
           ))}
        </motion.section>
      )}
    </motion.div>
  );
}
