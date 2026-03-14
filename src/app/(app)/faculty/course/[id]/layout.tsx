"use client";

import { useMemo } from "react";
import { useParams, usePathname } from "next/navigation";
import Link from "next/link";
import { useDataStore } from "@/lib/dataStore";
import { ChevronLeft, Sparkles, Settings, BrainCircuit, FileSpreadsheet, BarChart2 } from "lucide-react";

const NAV = [
  { href: "co-generation",   label: "CO Generation",      icon: Sparkles },
  { href: "exam-config",     label: "Exam Configuration", icon: Settings },
  { href: "question-mapping",label: "AI Question Analyser",icon: BrainCircuit },
  { href: "marks",           label: "Marks Upload",       icon: FileSpreadsheet },
  { href: "co-attainment",   label: "CO Attainment",      icon: BarChart2 },
];

export default function FacultyCourseLayout({ children }: { children: React.ReactNode }) {
  const { id } = useParams();
  const pathname = usePathname();
  const courseId = id as string;

  const courses = useDataStore(s => s.courses);
  const course  = useMemo(() => courses.find(c => c.id === courseId), [courses, courseId]);
  const submissions = useDataStore(s => s.submissions[courseId] || []);
  const examConfigs = useDataStore(s => s.examConfigs[courseId] || []);
  const cos         = useDataStore(s => s.cos[courseId] || []);

  const firstExamId = examConfigs[0]?.id || "t1";

  const getHref = (seg: string) => {
    if (seg === "marks") return `/faculty/course/${courseId}/marks/${firstExamId}`;
    return `/faculty/course/${courseId}/${seg}`;
  };

  const isActive = (seg: string) => {
    if (seg === "marks") return pathname.includes("/marks/");
    return pathname.includes(`/${seg}`);
  };

  return (
    <div className="flex min-h-[calc(100vh-64px)]">

      {/* ── SIDEBAR ── */}
      <aside className="w-56 shrink-0 border-r border-white/5 flex flex-col">

        {/* Course info */}
        <div className="p-5 border-b border-white/5">
          <Link href="/faculty/dashboard"
            className="flex items-center gap-1.5 text-[9px] font-mono text-white/20 uppercase tracking-widest hover:text-white transition-colors mb-4">
            <ChevronLeft className="w-3 h-3" /> Dashboard
          </Link>
          <p className="text-[9px] font-mono text-brand uppercase tracking-widest">{course?.code}</p>
          <p className="text-sm font-display text-white mt-0.5 leading-tight">{course?.name}</p>
          <p className="text-[9px] font-mono text-white/20 mt-1">Sem {course?.semester} · {course?.students} Students</p>
        </div>

        {/* CO status pill */}
        <div className="px-5 py-3 border-b border-white/5">
          <div className="flex items-center justify-between">
            <span className="text-[9px] font-mono text-white/20 uppercase tracking-widest">COs</span>
            <span className={`text-[9px] font-mono uppercase ${cos.length > 0 ? "text-attain" : "text-alert"}`}>
              {cos.length > 0 ? `${cos.length} Generated` : "Not Generated"}
            </span>
          </div>
        </div>

        {/* Nav links */}
        <nav className="flex flex-col divide-y divide-white/5 flex-1">
          {NAV.map(({ href, label, icon: Icon }) => {
            const active = isActive(href);
            return (
              <Link key={href} href={getHref(href)}
                className={`flex items-center gap-3 px-5 py-4 text-[10px] font-mono uppercase tracking-widest transition-colors ${
                  active
                    ? "text-brand bg-brand/5 border-l-2 border-brand"
                    : "text-white/30 hover:text-white hover:bg-white/[0.02] border-l-2 border-transparent"
                }`}>
                <Icon className="w-3.5 h-3.5 shrink-0" />
                {label}
              </Link>
            );
          })}
        </nav>

        {/* Marks status summary */}
        <div className="p-5 border-t border-white/5 flex flex-col gap-2">
          <p className="text-[9px] font-mono text-white/20 uppercase tracking-widest mb-1">Marks Status</p>
          {examConfigs.slice(0, 6).map(exam => {
            const sub = submissions.find(s => s.examId === exam.id);
            const st  = sub?.status || "draft";
            const color = st === "approved" ? "text-attain" : st === "pending" ? "text-amber-400" : st === "returned" ? "text-alert" : "text-white/20";
            return (
              <div key={exam.id} className="flex items-center justify-between">
                <span className="text-[9px] font-mono text-white/30">{exam.name.split("—")[0].trim()}</span>
                <span className={`text-[9px] font-mono uppercase ${color}`}>{st}</span>
              </div>
            );
          })}
        </div>
      </aside>

      {/* ── MAIN CONTENT ── */}
      <main className="flex-1 overflow-auto p-8">
        {children}
      </main>
    </div>
  );
}
