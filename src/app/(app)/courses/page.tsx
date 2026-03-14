"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { Search, Plus, Filter, ChevronRight, BookOpen, Users, BarChart3, Clock, Trash2, Edit3 } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { useAuthStore } from "@/lib/authStore";

const COURSES = [
  { id: "cs301", code: "CS301", name: "Database Management Systems", dept: "Computer Science", semester: 5, students: 62, cos: 6, health: 82 },
  { id: "cs401", code: "CS401", name: "Machine Learning", dept: "Computer Science", semester: 7, students: 48, cos: 5, health: 91 },
  { id: "ec201", code: "EC201", name: "Digital Signal Processing", dept: "Electronics", semester: 4, students: 55, cos: 6, health: 67 },
  { id: "me301", code: "ME301", name: "Thermodynamics", dept: "Mechanical", semester: 5, students: 71, cos: 5, health: 74 },
  { id: "cs501", code: "CS501", name: "Compiler Design", dept: "Computer Science", semester: 6, students: 43, cos: 6, health: 88 },
];

const DEPTS = ["All", "Computer Science", "Electronics", "Mechanical"];

export default function CoursesPage() {
  const [search, setSearch] = useState("");
  const [dept, setDept] = useState("All");

  const { activeRole } = useAuthStore();

  const filtered = COURSES.filter(c => {
    // 1. Role-based visibility
    if (activeRole === "department_head" && c.dept !== "Computer Science") return false;
    if (activeRole === "subject_lead" && !["cs301", "cs501"].includes(c.id)) return false;
    if (activeRole === "faculty" && c.id !== "cs301") return false;

    // 2. User-driven filters
    if (dept !== "All" && c.dept !== dept) return false;
    if (!c.name.toLowerCase().includes(search.toLowerCase()) && !c.code.toLowerCase().includes(search.toLowerCase())) return false;
    
    return true;
  });

  return (
    <div className="w-full min-h-screen pb-24">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="w-full px-8 pt-12">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex items-end justify-between mb-16">
          <div>
            <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest mb-4">
              <span className="w-8 h-[1px] bg-brand"></span>
              Course Catalogue
            </div>
            <h1 className="text-5xl font-display text-white">Your Courses</h1>
          </div>
          {activeRole === "admin" && (
            <Link href="/courses/new" className="flex items-center gap-2 px-6 py-3 bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors">
              <Plus className="w-4 h-4" /> New Course
            </Link>
          )}
        </motion.div>

        {/* Search & Filter - flat design */}
        <motion.div variants={fadeSlideUp} className="flex flex-col md:flex-row gap-6 mb-12 pb-8 border-b border-white/10">
          <div className="flex items-center gap-3 flex-1 border-b border-white/20 pb-3">
            <Search className="w-4 h-4 text-white/40 shrink-0" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              placeholder="Search by name or code..."
              className="bg-transparent text-white placeholder-white/30 outline-none flex-1 text-lg"
            />
          </div>
          <div className="flex items-center gap-2 text-sm font-mono">
            <Filter className="w-4 h-4 text-white/40" />
            {DEPTS.map(d => (
              <button key={d} onClick={() => setDept(d)}
                className={`px-4 py-2 uppercase tracking-wider transition-colors ${dept === d ? "text-white border-b border-white" : "text-white/40 hover:text-white/70"}`}>
                {d}
              </button>
            ))}
          </div>
        </motion.div>

        {/* Stats Row (Text, No cards) */}
        <motion.div variants={fadeSlideUp} className="flex gap-16 mb-16 text-sm font-mono">
          <div><span className="text-3xl font-light text-white">{filtered.length}</span><br /><span className="text-white/40 uppercase tracking-widest">Courses</span></div>
          <div><span className="text-3xl font-light text-white">{filtered.reduce((a, c) => a + c.students, 0)}</span><br /><span className="text-white/40 uppercase tracking-widest">Students</span></div>
          <div><span className="text-3xl font-light text-white">{filtered.reduce((a, c) => a + c.cos, 0)}</span><br /><span className="text-white/40 uppercase tracking-widest">COs Mapped</span></div>
        </motion.div>

        {/* Course List */}
        <AnimatePresence>
          <motion.div variants={staggerContainer} className="flex flex-col divide-y divide-white/10">
            {filtered.map((course, i) => (
              <motion.div key={course.id} variants={fadeSlideUp} layout
                className="flex items-center justify-between py-8 group hover:pl-2 transition-all"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-4 mb-2">
                    <span className="font-mono text-sm text-white/40">{course.code}</span>
                    <span className="text-xs font-mono text-white/30">{course.dept}</span>
                    <span className="text-xs font-mono text-white/30">Sem {course.semester}</span>
                  </div>
                  <h2 className="text-2xl font-display text-white group-hover:text-aurora transition-colors">{course.name}</h2>
                  <div className="flex items-center gap-6 mt-3 text-sm text-white/40 font-mono">
                    <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{course.students}</span>
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{course.cos} COs</span>
                  </div>
                </div>

                <div className="flex items-center gap-8">
                  {/* Health bar */}
                  <div className="text-right">
                    <div className={`text-2xl font-mono font-light ${course.health >= 80 ? "text-attain" : course.health >= 70 ? "text-aurora" : "text-alert"}`}>
                      {course.health}%
                    </div>
                    <div className="text-xs text-white/40 font-mono uppercase tracking-wider">Health</div>
                  </div>

                  <div className="flex items-center gap-3 opacity-0 group-hover:opacity-100 transition-opacity">
                    <Link href={`/courses/${course.id}`} className="p-2 hover:text-white text-white/40 transition-colors" title="View Details">
                      <ChevronRight className="w-5 h-5" />
                    </Link>
                    {activeRole === "admin" && (
                      <>
                        <button className="p-2 hover:text-aurora text-white/40 transition-colors" title="Edit Course"><Edit3 className="w-4 h-4" /></button>
                        <button className="p-2 hover:text-alert text-white/40 transition-colors" title="Delete Course"><Trash2 className="w-4 h-4" /></button>
                      </>
                    )}
                  </div>
                </div>
              </motion.div>
            ))}
          </motion.div>
        </AnimatePresence>

        {filtered.length === 0 && (
          <div className="py-24 text-center text-white/30 font-mono">No courses match your filter.</div>
        )}
      </motion.div>
    </div>
  );
}
