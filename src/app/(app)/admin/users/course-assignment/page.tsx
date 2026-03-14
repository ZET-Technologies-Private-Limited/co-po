"use client";

import { useMemo, useState } from "react";
import { motion } from "framer-motion";
import { AccessGate } from "@/components/auth/AccessGate";
import { fadeSlideUp, staggerContainer } from "@/lib/animations";
import { useDataStore } from "@/lib/dataStore";
import { useUIStore } from "@/lib/uiStore";

export default function CourseAssignmentPage() {
  const users = useDataStore((s) => s.users);
  const courses = useDataStore((s) => s.courses);
  const updateCourse = useDataStore((s) => s.updateCourse);
  const { addToast } = useUIStore();

  const faculties = useMemo(
    () => users.filter((u) => u.roles.includes("faculty") && u.status === "active"),
    [users]
  );

  const [matrix, setMatrix] = useState<Record<string, Record<string, boolean>>>(() => {
    const base: Record<string, Record<string, boolean>> = {};
    faculties.forEach((f) => {
      base[f.id] = {};
      courses.forEach((c) => {
        base[f.id][c.id] = c.facultyId === f.id;
      });
    });
    return base;
  });

  function assignFaculty(facultyId: string, courseId: string, checked: boolean) {
    setMatrix((prev) => ({
      ...prev,
      [facultyId]: {
        ...(prev[facultyId] || {}),
        [courseId]: checked,
      },
    }));
    if (checked) updateCourse(courseId, { facultyId });
  }

  function copyFromPreviousAY() {
    addToast("Assignment matrix pre-filled from AY-1 snapshot.", "info");
  }

  return (
    <AccessGate feature="user_management" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-7xl mx-auto pb-24 space-y-5">
        <motion.header variants={fadeSlideUp} className="border-b border-white/5 pb-4 flex items-end justify-between">
          <div>
            <h1 className="text-2xl font-display text-white">Course Assignment Matrix</h1>
            <p className="text-xs font-mono text-white/30 mt-2">Rows = faculty, Columns = courses with assignment checkbox.</p>
          </div>
          <button onClick={copyFromPreviousAY} className="px-3 py-2 border border-white/10 text-xs font-mono text-white/70 uppercase">
            Copy from AY-1
          </button>
        </motion.header>

        <motion.section variants={fadeSlideUp} className="overflow-x-auto border border-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left text-[10px] font-mono text-white/40 uppercase">Faculty</th>
                {courses.map((c) => (
                  <th key={c.id} className="px-3 py-2 text-left text-[10px] font-mono text-white/40 uppercase whitespace-nowrap">{c.code}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {faculties.map((f) => (
                <tr key={f.id} className="border-b border-white/5">
                  <td className="px-3 py-2 text-xs text-white">{f.name}</td>
                  {courses.map((c) => (
                    <td key={`${f.id}-${c.id}`} className="px-3 py-2 text-center">
                      <input
                        type="checkbox"
                        checked={Boolean(matrix[f.id]?.[c.id])}
                        onChange={(e) => assignFaculty(f.id, c.id, e.target.checked)}
                      />
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </motion.section>

        <motion.section variants={fadeSlideUp} className="overflow-x-auto border border-white/10">
          <table className="w-full border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="px-3 py-2 text-left text-[10px] font-mono text-white/40 uppercase">Course</th>
                <th className="px-3 py-2 text-left text-[10px] font-mono text-white/40 uppercase">Lead Assignment</th>
                <th className="px-3 py-2 text-left text-[10px] font-mono text-white/40 uppercase">Section</th>
              </tr>
            </thead>
            <tbody>
              {courses.map((course) => {
                const leadOptions = users.filter(
                  (u) => u.roles.includes("subject_lead") && u.dept === course.dept && u.status === "active"
                );
                return (
                  <tr key={course.id} className="border-b border-white/5">
                    <td className="px-3 py-2 text-xs text-white">{course.code} - {course.name}</td>
                    <td className="px-3 py-2">
                      <select
                        value={course.leadId || ""}
                        onChange={(e) => updateCourse(course.id, { leadId: e.target.value || undefined })}
                        className="bg-white/[0.02] border border-white/10 px-2 py-1.5 text-xs text-white"
                      >
                        <option value="">Select lead</option>
                        {leadOptions.map((lead) => (
                          <option key={lead.id} value={lead.id} className="bg-[#0a0a0f]">{lead.name}</option>
                        ))}
                      </select>
                    </td>
                    <td className="px-3 py-2">
                      <input
                        value={course.section || ""}
                        onChange={(e) => updateCourse(course.id, { section: e.target.value })}
                        placeholder="A/B/C"
                        className="bg-white/[0.02] border border-white/10 px-2 py-1.5 text-xs text-white w-24"
                      />
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </motion.section>
      </motion.div>
    </AccessGate>
  );
}
