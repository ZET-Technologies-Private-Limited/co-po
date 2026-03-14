import { create } from 'zustand';

// ─── ROLES ─────────────────────────────────────────────────────────────────
export type Role = "admin" | "department_head" | "subject_lead" | "faculty" | "student";

// ─── PERMISSION LEVELS ────────────────────────────────────────────────────
// yes = full access | view = read-only | own = own data only | no = blocked
export type PermissionLevel = "yes" | "view" | "own" | "no";

// ─── MASTER FEATURE-ACCESS MATRIX (Spec Section 1 — 37 features) ──────────
export const PERMISSIONS: Record<string, Record<Role, PermissionLevel>> = {
  // 1. Login & profile management
  login:                    { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "yes"  },
  // 2. Dashboard home page
  dashboard:                { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "view" },
  // 3. CO generation (AI chatbot)
  co_generation:            { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 4. View default CO library
  co_library_view:          { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 5. Edit/override AI-generated COs
  co_edit:                  { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 6. CO-PO-PSO correlation matrix
  co_po_matrix:             { faculty: "yes",  subject_lead: "view", department_head: "yes",  admin: "yes",  student: "no"   },
  // 7. Exam configuration (T1-T5, SEE)
  exam_config:              { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 8. Question paper upload
  question_upload:          { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 9. AI question-CO-BT mapping
  ai_question_mapping:      { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 10. Override AI question mapping
  question_mapping_override: { faculty: "yes", subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 11. Student marks upload (Excel)
  marks_upload:             { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 12. Manual marks entry portal
  marks_manual_entry:       { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 13. Marks validation & error flags
  marks_validation:         { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 14. Marks lock & submit for approval
  marks_lock_submit:        { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  // 15. CO attainment results (own course)
  co_attainment:            { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 16. Marks approval workflow
  marks_approval:           { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 17. PO attainment dashboard
  po_attainment:            { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 18. PSO attainment dashboard
  pso_attainment:           { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 19. 3-year AY trend comparison
  ay_trend:                 { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  // 20. Low-CO alert management
  low_co_alerts:            { faculty: "view", subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 21. Remedial action entry
  remedial_entry:           { faculty: "yes",  subject_lead: "view", department_head: "yes",  admin: "yes",  student: "no"   },
  // 22. Student performance report
  student_report:           { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "own"  },
  // 23. CO attainment bar chart
  co_attainment_chart:      { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "view" },
  // 24. PO/PSO attainment chart
  po_pso_chart:             { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 25. Department summary report
  dept_summary:             { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  // 26. Export PDF report
  export_pdf:               { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 27. Export Excel report
  export_excel:             { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  // 28. NBA/NAAC export
  nba_export:               { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  // 29. User management
  user_management:          { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "yes",  student: "no"   },
  // 30. Academic year setup & locking
  ay_setup:                 { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "yes",  student: "no"   },
  // 31. Threshold configuration
  threshold_config:         { faculty: "no",   subject_lead: "no",   department_head: "view", admin: "yes",  student: "no"   },
  // 32. Default CO library management
  co_library_manage:        { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "yes",  student: "no"   },
  // 33. Audit trail / activity log
  audit_trail:              { faculty: "no",   subject_lead: "view", department_head: "view", admin: "yes",  student: "no"   },
  // 34. Notification centre
  notifications:            { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "yes"  },
  // 35. Year-end lock & sign-off
  year_end_lock:            { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  // 36. Student own CO attainment view
  student_co_view:          { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "no",   student: "yes"  },
  // 37. Student own marks view
  student_marks_view:       { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "no",   student: "yes"  },
};

// ─── PERMISSION HELPER ────────────────────────────────────────────────────
export function can(role: Role | null, feature: string): PermissionLevel {
  if (!role) return "no";
  const featurePerms = PERMISSIONS[feature];
  if (!featurePerms) return "no";
  return featurePerms[role] ?? "no";
}

export function canAccess(role: Role | null, feature: string): boolean {
  const level = can(role, feature);
  return level === "yes" || level === "view" || level === "own";
}

// ─── USER TYPE ────────────────────────────────────────────────────────────
export interface User {
  id: string;
  name: string;
  email: string;
  employeeId?: string;
  roles: Role[];
  department?: string;
  designation?: string;
}

interface AuthState {
  user: User | null;
  activeRole: Role | null;
  activeAY: string;
  isAuthenticated: boolean;
  login: (user: User) => void;
  logout: () => void;
  setActiveRole: (role: Role) => void;
  setActiveAY: (ay: string) => void;
  hasRole: (role: Role) => boolean;
  can: (feature: string) => PermissionLevel;
}

// ── DEMO USERS ─────────────────────────────────────────────────────────────
const MOCK_ADMIN: User = {
  id: "sys_admin_1", name: "Dr. System Admin", email: "admin@nexus.edu",
  employeeId: "ADM2024001", roles: ["admin"], department: "Administration",
  designation: "System Administrator"
};

// ─── STORE ────────────────────────────────────────────────────────────────
export const useAuthStore = create<AuthState>((set, get) => ({
  user: MOCK_ADMIN,
  activeRole: "admin",
  activeAY: "2024-25",
  isAuthenticated: true,

  login: (user) => set({
    user, activeRole: user.roles[0] || null, isAuthenticated: true
  }),

  logout: () => set({ user: null, activeRole: null, isAuthenticated: false }),

  setActiveRole: (role) => set({ activeRole: role }),

  setActiveAY: (ay) => set({ activeAY: ay }),

  hasRole: (role) => {
    const { user, activeRole } = get();
    if (!user) return false;
    return activeRole === role || user.roles.includes(role);
  },

  can: (feature) => {
    const { activeRole } = get();
    return can(activeRole, feature);
  },
}));
