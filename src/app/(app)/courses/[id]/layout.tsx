import { ReactNode } from "react";
import { CourseSidebar } from "@/components/courses/CourseSidebar";
import { CourseTabs } from "@/components/courses/CourseTabs";

export default async function CourseLayout({
  children,
  params,
}: {
  children: ReactNode;
  params: Promise<{ id: string }>;
}) {
  const resolvedParams = await params;
  const courseId = resolvedParams.id;

  return (
    <div className="flex gap-12 w-full min-h-full items-start relative">
      <CourseSidebar courseId={courseId} />
      
      <div className="flex-1 w-full flex flex-col pt-2 pr-8">
         <CourseTabs courseId={courseId} />
         <div className="relative flex-1 w-full">
            {children}
         </div>
      </div>
    </div>
  );
}
