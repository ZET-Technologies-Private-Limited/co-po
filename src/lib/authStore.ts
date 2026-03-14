// ============================================================
// Auth Store — Real login validation against dataStore users
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Role = "admin" | "department_head" | "subject_lead" | "faculty" | "student";

export type PermissionLevel = "yes" | "view" | "own" | "no";

export const PERMISSIONS: Record<string, Record<Role, PermissionLevel>> = {
  login:                    { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "yes"  },
  dashboard:                { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "view" },
  co_generation:            { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  co_library_view:          { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  co_edit:                  { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  co_po_matrix:             { faculty: "yes",  subject_lead: "view", department_head: "yes",  admin: "yes",  student: "no"   },
  exam_config:              { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  question_upload:          { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  ai_question_mapping:      { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  question_mapping_override: { faculty: "yes", subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  marks_upload:             { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  marks_manual_entry:       { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  marks_validation:         { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  marks_lock_submit:        { faculty: "yes",  subject_lead: "no",   department_head: "no",   admin: "no",   student: "no"   },
  co_attainment:            { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  marks_approval:           { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  po_attainment:            { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  pso_attainment:           { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  ay_trend:                 { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  low_co_alerts:            { faculty: "view", subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  remedial_entry:           { faculty: "yes",  subject_lead: "view", department_head: "yes",  admin: "yes",  student: "no"   },
  student_report:           { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "own"  },
  co_attainment_chart:      { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "view" },
  po_pso_chart:             { faculty: "no",   subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  dept_summary:             { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  export_pdf:               { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  export_excel:             { faculty: "own",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "no"   },
  nba_export:               { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  user_management:          { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "yes",  student: "no"   },
  ay_setup:                 { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "yes",  student: "no"   },
  threshold_config:         { faculty: "no",   subject_lead: "no",   department_head: "view", admin: "yes",  student: "no"   },
  co_library_manage:        { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "yes",  student: "no"   },
  audit_trail:              { faculty: "no",   subject_lead: "view", department_head: "view", admin: "yes",  student: "no"   },
  notifications:            { faculty: "yes",  subject_lead: "yes",  department_head: "yes",  admin: "yes",  student: "yes"  },
  year_end_lock:            { faculty: "no",   subject_lead: "no",   department_head: "yes",  admin: "yes",  student: "no"   },
  student_co_view:          { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "no",   student: "yes"  },
  student_marks_view:       { faculty: "no",   subject_lead: "no",   department_head: "no",   admin: "no",   student: "yes"  },
};

export function can(role: Role | null, feature: string): PermissionLevel {
  if (!role) return "no";
  return PERMISSIONS[feature]?.[role] ?? "no";
}

export function canAccess(role: Role | null, feature: string): boolean {
  const level = can(role, feature);
  return level === "yes" || level === "view" || level === "own";
}

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
  loginError: string | null;
  login: (email: string, password: string) => boolean;
  logout: () => void;
  setActiveRole: (role: Role) => void;
  setActiveAY: (ay: string) => void;
  hasRole: (role: Role) => boolean;
  can: (feature: string) => PermissionLevel;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      user: null,
      activeRole: null,
      activeAY: "2024-25",
      isAuthenticated: false,
      loginError: null,

      login: (email, password) => {
        // Dynamically import data store to avoid circular deps at module level
        // We read from localStorage directly if store isn't initialized yet
        let users: any[] = [];
        try {
          const stored = localStorage.getItem("obe-ai-data-store");
          if (stored) {
            const parsed = JSON.parse(stored);
            users = parsed?.state?.users || [];
          }
        } catch {}

        // Fall back to seed users if store is empty
        if (!users.length) {
          users = [
            { id: "u1", name: "Dr. System Admin",  email: "admin@nexus.edu",   password: "Admin@123",  employeeId: "ADM001", roles: ["admin"],           dept: "Administration", designation: "System Administrator" },
            { id: "u2", name: "Prof. Ravi Kumar",   email: "hod@nexus.edu",     password: "Hod@1234",   employeeId: "HOD001", roles: ["department_head"], dept: "CSE",            designation: "Head of Department"   },
            { id: "u3", name: "Dr. Anita Nair",     email: "lead@nexus.edu",    password: "Lead@123",   employeeId: "FAC001", roles: ["subject_lead"],   dept: "CSE",            designation: "Associate Professor"  },
            { id: "u4", name: "Mr. Sanjay Kapoor",  email: "faculty@nexus.edu", password: "Faculty@1",  employeeId: "FAC002", roles: ["faculty"],         dept: "CSE",            designation: "Assistant Professor"  },
            { id: "u5", name: "Aarav Sharma",       email: "student@nexus.edu", password: "Student@1",  employeeId: "21CS001",roles: ["student"],         dept: "CSE",            designation: "B.Tech Student"       },
          ];
        }

        const found = users.find((u: any) => u.email === email && u.password === password);
        if (!found) {
          set({ loginError: "Invalid email or password." });
          return false;
        }
        const user: User = {
          id: found.id, name: found.name, email: found.email,
          employeeId: found.employeeId, roles: found.roles,
          department: found.dept, designation: found.designation,
        };
        set({ user, activeRole: found.roles[0] as Role, isAuthenticated: true, loginError: null });
        return true;
      },

      logout: () => set({ user: null, activeRole: null, isAuthenticated: false, loginError: null }),

      setActiveRole: (role) => set({ activeRole: role }),

      setActiveAY: (ay) => set({ activeAY: ay }),

      hasRole: (role) => {
        const { user, activeRole } = get();
        if (!user) return false;
        return activeRole === role || user.roles.includes(role);
      },

      can: (feature) => can(get().activeRole, feature),
    }),
    { name: "obe-ai-auth" }
  )
);
