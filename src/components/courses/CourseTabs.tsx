"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuthStore } from "@/lib/authStore";

export function CourseTabs({ courseId }: { courseId: string }) {
  const pathname = usePathname();
  const { activeRole } = useAuthStore();
  
  const allTabs = [
    { id: "overview", label: "Overview", path: `/courses/${courseId}`, roles: ["admin", "department_head", "subject_lead", "faculty"] },
    { id: "generate", label: "Generate COs", path: `/courses/${courseId}/generate-co`, roles: ["admin", "faculty"] },
    { id: "mapping", label: "Mapping Matrix", path: `/courses/${courseId}/mapping`, roles: ["admin", "faculty"] },
    { id: "exams", label: "Exams & Marks", path: `/courses/${courseId}/exams`, roles: ["admin", "faculty"] },
    { id: "attainment", label: "Attainment", path: `/courses/${courseId}/co-attainment`, roles: ["admin", "department_head", "subject_lead", "faculty"] },
  ];

  const tabs = allTabs.filter(t => activeRole && t.roles.includes(activeRole));

  return (
    <div className="flex items-center gap-8 border-b border-white/10 mb-8 relative">
      {tabs.map((tab) => {
        const isActive = pathname === tab.path || (tab.id === 'overview' && pathname === `/courses/${courseId}`);
        
        return (
          <Link
            key={tab.id}
            href={tab.path}
            className={`relative pb-4 text-sm font-medium transition-colors ${
              isActive ? "text-white" : "text-white/40 hover:text-white/70"
            }`}
          >
            {tab.label}
            {isActive && (
              <motion.div
                layoutId="active-tab-indicator"
                className="absolute bottom-0 left-0 right-0 h-0.5 bg-brand shadow-[0_0_10px_rgba(29,78,216,0.5)]"
                transition={{ type: "spring", stiffness: 400, damping: 30 }}
              />
            )}
          </Link>
        );
      })}
    </div>
  );
}
