"use client";

import { motion } from "framer-motion";
import { BookOpen, ChevronRight, User } from "lucide-react";
import Link from "next/link";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";

const ENROLLED_COURSES = [
  { id: "cs301", code: "CS301", name: "Database Management Systems", faculty: "Prof. Anita Nair", semester: 5 },
  { id: "cs302", code: "CS302", name: "Design & Analysis of Algorithms", faculty: "Dr. Ramesh Iyer", semester: 5 },
];

export default function StudentCoursesPage() {
  return (
    <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-5xl mx-auto pb-32">
      <motion.div variants={fadeSlideUp} className="mb-12">
        <h1 className="text-4xl font-display text-white mb-2">My Courses</h1>
        <p className="text-white/40 font-light">Academic Year 2024-25 · Semester 5</p>
      </motion.div>

      <div className="grid gap-4">
        {ENROLLED_COURSES.map(course => (
          <Link key={course.id} href={`/student/course/${course.id}/co-attainment`} 
            className="p-8 border border-white/10 bg-white/[0.02] hover:border-cyan-400/30 transition-all flex items-center justify-between group"
          >
            <div>
              <p className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest mb-1">{course.code}</p>
              <h3 className="text-xl font-display text-white group-hover:text-cyan-400 transition-colors">{course.name}</h3>
              <div className="flex items-center gap-2 mt-4 text-white/30 text-xs font-mono">
                <User className="w-3 h-3" /> {course.faculty}
              </div>
            </div>
            <ChevronRight className="w-5 h-5 text-white/10 group-hover:text-white transition-colors" />
          </Link>
        ))}
      </div>
    </motion.div>
  );
}
