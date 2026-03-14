"use client";

import { motion } from "framer-motion";
import { Award, ChevronRight, ArrowUpRight } from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

const RECENT_MARKS = [
  { id: "cs301", course: "DBMS", code: "CS301", exam: "T1", score: 18, max: 20, pct: 90 },
  { id: "cs301", course: "DBMS", code: "CS301", exam: "T2", score: 12, max: 20, pct: 60 },
  { id: "cs302", course: "Algorithms", code: "CS302", exam: "T1", score: 14, max: 20, pct: 70 },
];

export default function StudentMarksPage() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">
      <motion.div variants={fadeSlideUp} className="mb-12">
        <h1 className="text-4xl font-display text-white mb-2">My Results</h1>
        <p className="text-white/40 font-light">Academic Year 2024-25 Performance</p>
      </motion.div>

      <div className="border border-white/10 overflow-hidden">
        <table className="w-full text-left font-mono text-xs">
          <thead className="bg-white/[0.03] border-b border-white/10">
            <tr>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Exam / Course</th>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Score</th>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal">Performance</th>
              <th className="px-6 py-4 text-white/30 uppercase tracking-widest font-normal text-right">Analysis</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {RECENT_MARKS.map((mark, i) => (
              <tr key={i} className="hover:bg-white/[0.02] transition-colors group">
                <td className="px-6 py-6">
                   <p className="text-white font-medium">{mark.exam}</p>
                   <p className="text-[10px] text-white/30 mt-1">{mark.code} — {mark.course}</p>
                </td>
                <td className="px-6 py-6 text-white text-lg">
                  {mark.score} <span className="text-white/20">/ {mark.max}</span>
                </td>
                <td className="px-6 py-6">
                  <div className="flex items-center gap-4">
                    <div className="w-32 h-1 bg-white/5 rounded-full overflow-hidden">
                       <div className="h-full bg-cyan-400" style={{ width: `${mark.pct}%` }} />
                    </div>
                    <span className="text-cyan-400">{mark.pct}%</span>
                  </div>
                </td>
                <td className="px-6 py-6 text-right">
                  <Link href={`/student/course/${mark.id}/marks`} className="inline-flex items-center gap-1.5 text-white/30 group-hover:text-white transition-colors uppercase tracking-widest text-[9px]">
                    Questions <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </motion.div>
  );
}
