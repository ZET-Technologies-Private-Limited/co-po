"use client";

import { useAuthStore } from "@/lib/authStore";
import { DepartmentHeadDashboardView } from "@/components/dashboard/DepartmentHeadDashboardView";
import { AccessGate } from "@/components/auth/AccessGate";

export default function HODDashboardPage() {
  return (
    <AccessGate feature="dashboard" deny="lock">
      <div className="w-full min-h-screen pb-32">
        <DepartmentHeadDashboardView />
      </div>
    </AccessGate>
  );
}
