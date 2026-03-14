// ============================================================
// OBE AI System — Master Data Store (Frontend-only, persisted)
// Uses Zustand + localStorage. No backend needed.
// ============================================================
import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { Role } from './authStore';

// ─── TYPE DEFINITIONS ────────────────────────────────────────

export type CourseRecord = {
  id: string;
  code: string;
  name: string;
  dept: string;
  semester: number;
  credits: number;
  students: number;
  studentRolls?: string[];
  examType: string;
  facultyId: string;
  leadId?: string;
  section?: string;     // A/B/C for multi-section courses
  mappings?: Record<string, Record<string, number>>;
};

export type CODefinition = {
  co: string;            // "CO1", "CO2"…
  desc: string;
  bloom: string;         // "Apply"
  bloomCode: string;     // "L3"
};

export type QuestionDef = {
  qno: string;           // "Q1", "Q3a"
  co: string;
  maxMarks: number;
  text?: string;
  bloomCode?: string;
  isEitherOr?: boolean;
  eitherOrGroup?: string;
  type?: "compulsory" | "either-or" | "optional";
  pairId?: string;
};

export type StudentMarkRow = {
  roll: string;
  name: string;
  marks: Record<string, number | "">;           // qno → mark
  eitherOrChoices?: Record<string, "a" | "b">;  // group → choice
};

export type ExamConfig = {
  id: string;   // "t1", "t2", "see"
  name: string;
  maxMarks: number;
  date?: string;
  weightage?: number;
  group: "CIE" | "SEE";
  questions: QuestionDef[];
  status: "draft" | "locked";
};

export type ExamQuestion = QuestionDef;
export type StudentMark = StudentMarkRow;

export type MarksSubmission = {
  courseId: string;
  examId: string;
  students: StudentMark[];
  status: "draft" | "pending" | "approved" | "returned";
  submittedAt?: string;
  approvedBy?: string;
  approvedAt?: string;   // ISO timestamp when lead approved — used for grievance deadline
  returnReason?: string;
  leadComment?: string;
  overrideReason?: string;
  history?: {
    id: string;
    action: "submitted" | "approved" | "returned" | "override";
    by: string;
    role: string;
    at: string;
    comment?: string;
  }[];
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;
  employeeId: string;
  roles: Role[];
  dept: string;
  designation: string;
  status: "active" | "inactive";
  joinedAt: string;
  lastLogin?: string;   // ISO timestamp
  firstLogin?: boolean;
  phone?: string;
  alsoLead?: boolean;   // dual-role: faculty who is also a lead
};

export type AYConfig = {
  ay: string;           // "2024-25"
  status: "active" | "locked" | "archived";
  startDate: string;
  endDate: string;
  marksDeadline: string;
  coLockDeadline: string;
  poDeadline: string;
  lockedBy?: string;
  lockedOn?: string;
};

export type AYHistoryRecord = AYConfig;

export type ThresholdConfig = {
  level3: number;      // ≥ this → Level 3
  level2: number;      // ≥ this → Level 2
  level1: number;      // < level2 → Level 1
  targetPassPct: number;
  cieWeight: number;
  seeWeight: number;
  absentPolicy: "include" | "exclude";
  minCOs: number;
  maxCOs: number;
};

export type COLibrarySet = {
  id: string;
  name: string;
  dept: string;
  courseCode: string;
  regulation: string;
  bloomCode: string;
  cos: { co: string; desc: string; bloomCode: string; poMaps?: string }[];
  version: number;
  status: "active" | "archived";
  createdAt: string;
  updatedAt: string;
};

export type PODefinition = {
  id: string;       // "PO1"…"PO12"
  name: string;
  statement: string;
  category: "Technical" | "Professional" | "Social";
  regulation: string;
  version: number;
};

export type PSODefinition = {
  id: string;       // "PSO1"…
  dept: string;
  name: string;
  statement: string;
  regulation: string;
  version: number;
};

export type FacultyNotification = {
  id: string;
  type: "critical" | "success" | "reminder" | "system";
  title: string;
  message: string;
  timestamp: string;
  link: string;
  read: boolean;
  userId: string;
};

export type AuditEntry = {
  id: string;
  type: "login" | "login_fail" | "co_generate" | "marks" | "approval" | "override" | "system" | "user" | "ay_lock" | "error";
  userId: string;
  role: string;
  action: string;
  ip: string;
  timestamp: string;
  result?: "success" | "failure";
  errorType?: string;
};

export type Grievance = {
  id: string;
  studentRoll: string;
  courseId: string;
  examId: string;
  qno: string;
  text: string;
  status: "pending" | "under_review" | "resolved_unchanged" | "resolved_updated" | "rejected";
  submittedAt: string;
  resolution?: string;
  evidenceFileName?: string;
  updatedMarks?: number;
};

// ─── DEFAULT SEED DATA ────────────────────────────────────────

const DEFAULT_AY_HISTORY: AYHistoryRecord[] = [
  { ay: "2023-24", status: "archived", startDate: "2023-07-01", endDate: "2024-04-30", marksDeadline: "2023-11-30", coLockDeadline: "2023-12-10", poDeadline: "2023-12-20", lockedBy: "Prof. Ravi Kumar", lockedOn: "2024-05-02" },
  { ay: "2022-23", status: "archived", startDate: "2022-07-01", endDate: "2023-04-30", marksDeadline: "2022-11-30", coLockDeadline: "2022-12-10", poDeadline: "2022-12-20", lockedBy: "Prof. Ravi Kumar", lockedOn: "2023-05-01" },
];

const DEFAULT_SEED_AUDIT: AuditEntry[] = [
  { id: "sa1",  type: "login",       userId: "u4", role: "faculty",         action: "Faculty login: Mr. Sanjay Kapoor",                    ip: "192.168.1.10", timestamp: "2024-11-01 09:12:00", result: "success" },
  { id: "sa2",  type: "co_generate", userId: "u4", role: "faculty",         action: "Generated 6 COs for CS301 — DBMS",                    ip: "192.168.1.10", timestamp: "2024-11-01 09:45:00", result: "success" },
  { id: "sa3",  type: "marks",       userId: "u4", role: "faculty",         action: "Submitted T1 marks for CS301 (10 students)",          ip: "192.168.1.10", timestamp: "2024-11-02 11:00:00", result: "success" },
  { id: "sa4",  type: "approval",    userId: "u3", role: "subject_lead",    action: "Approved T1 marks for CS301 — DBMS",                  ip: "192.168.1.11", timestamp: "2024-11-03 14:30:00", result: "success" },
  { id: "sa5",  type: "login",       userId: "u2", role: "department_head", action: "HOD login: Prof. Ravi Kumar",                         ip: "192.168.1.12", timestamp: "2024-11-04 08:55:00", result: "success" },
  { id: "sa6",  type: "marks",       userId: "u4", role: "faculty",         action: "Submitted T2 marks for CS301 (10 students)",          ip: "192.168.1.10", timestamp: "2024-11-05 10:20:00", result: "success" },
  { id: "sa7",  type: "login_fail",  userId: "unknown", role: "unknown",    action: "Failed login attempt for email: test@nexus.edu",      ip: "10.0.0.55",    timestamp: "2024-11-06 02:14:00", result: "failure" },
  { id: "sa8",  type: "user",        userId: "u1", role: "admin",           action: "Provisioned new user: Dr. Anita Nair (FAC001)",       ip: "127.0.0.1",    timestamp: "2024-11-07 09:00:00", result: "success" },
  { id: "sa9",  type: "system",      userId: "system", role: "system",      action: "Scheduled backup completed successfully",             ip: "127.0.0.1",    timestamp: "2024-11-08 03:00:00", result: "success" },
  { id: "sa10", type: "co_generate", userId: "u4", role: "faculty",         action: "Generated 5 COs for CS401 — Machine Learning",        ip: "192.168.1.10", timestamp: "2024-11-09 11:30:00", result: "success" },
  { id: "sa11", type: "login",       userId: "u5", role: "student",         action: "Student login: Aarav Sharma (21CS001)",               ip: "192.168.1.20", timestamp: "2024-11-10 08:00:00", result: "success" },
  { id: "sa12", type: "override",    userId: "u1", role: "admin",           action: "Admin override: reset password for u4",              ip: "127.0.0.1",    timestamp: "2024-11-11 15:45:00", result: "success" },
  { id: "sa13", type: "error",       userId: "system", role: "system",      action: "PDF parse error: invalid file format uploaded",       ip: "192.168.1.10", timestamp: "2024-11-12 10:05:00", result: "failure", errorType: "ParseError" },
  { id: "sa14", type: "marks",       userId: "u4", role: "faculty",         action: "Draft saved: T3 marks for CS301",                    ip: "192.168.1.10", timestamp: "2024-11-13 14:00:00", result: "success" },
  { id: "sa15", type: "approval",    userId: "u3", role: "subject_lead",    action: "Returned T2 marks for CS301 — reason: data mismatch", ip: "192.168.1.11", timestamp: "2024-11-14 16:20:00", result: "success" },
  { id: "sa16", type: "login",       userId: "u3", role: "subject_lead",    action: "Subject Lead login: Dr. Anita Nair",                 ip: "192.168.1.11", timestamp: "2024-11-15 09:10:00", result: "success" },
  { id: "sa17", type: "system",      userId: "system", role: "system",      action: "AY 2024-25 threshold config updated by admin",        ip: "127.0.0.1",    timestamp: "2024-11-16 11:00:00", result: "success" },
  { id: "sa18", type: "error",       userId: "system", role: "system",      action: "Marks validation error: total exceeds max for Q3a",   ip: "192.168.1.10", timestamp: "2024-11-17 13:30:00", result: "failure", errorType: "ValidationError" },
  { id: "sa19", type: "co_generate", userId: "u4", role: "faculty",         action: "Generated 4 COs for ME301 — Thermodynamics",          ip: "192.168.1.10", timestamp: "2024-11-18 10:00:00", result: "success" },
  { id: "sa20", type: "login",       userId: "u1", role: "admin",           action: "Admin login: Dr. System Admin",                      ip: "127.0.0.1",    timestamp: "2024-11-19 08:30:00", result: "success" },
];

const DEFAULT_USERS: UserRecord[] = [
  { id: "u1", name: "Dr. System Admin",  email: "admin@nexus.edu",   password: "Admin@123",  employeeId: "ADM001", roles: ["admin"],           dept: "Administration", designation: "System Administrator", status: "active", joinedAt: "2022-07-01", lastLogin: "2024-11-19 08:30:00" },
  { id: "u2", name: "Prof. Ravi Kumar",   email: "hod@nexus.edu",     password: "Hod@1234",   employeeId: "HOD001", roles: ["department_head"], dept: "CSE",            designation: "Head of Department",   status: "active", joinedAt: "2019-06-01", lastLogin: "2024-11-04 08:55:00" },
  { id: "u3", name: "Dr. Anita Nair",     email: "lead@nexus.edu",    password: "Lead@123",   employeeId: "FAC001", roles: ["subject_lead"],   dept: "CSE",            designation: "Associate Professor",  status: "active", joinedAt: "2020-08-01", lastLogin: "2024-11-15 09:10:00" },
  { id: "u4", name: "Mr. Sanjay Kapoor",  email: "faculty@nexus.edu", password: "Faculty@1",  employeeId: "FAC002", roles: ["faculty"],         dept: "CSE",            designation: "Assistant Professor",  status: "active", joinedAt: "2021-07-01", lastLogin: "2024-11-19 10:00:00" },
  { id: "u5", name: "Aarav Sharma",       email: "student@nexus.edu", password: "Student@1",  employeeId: "21CS001", roles: ["student"],        dept: "CSE",            designation: "B.Tech Student",       status: "active", joinedAt: "2021-08-01", lastLogin: "2024-11-10 08:00:00", firstLogin: false },
];

const DEFAULT_COURSES: CourseRecord[] = [
  { id: "cs301", code: "CS301", name: "Database Management Systems", dept: "CSE", semester: 5, credits: 4, students: 60, examType: "Theory",              facultyId: "u4", leadId: "u3", studentRolls: ["21CS001","21CS002","21CS003","21CS004","21CS005","21CS006","21CS007","21CS008","21CS009","21CS010"] },
  { id: "cs401", code: "CS401", name: "Machine Learning",           dept: "CSE", semester: 7, credits: 4, students: 48, examType: "Theory",              facultyId: "u4", leadId: "u3", studentRolls: ["21CS001","21CS002","21CS003"] },
  { id: "ec201", code: "EC201", name: "Digital Signal Processing",  dept: "ECE", semester: 4, credits: 3, students: 55, examType: "Theory + Practical",  facultyId: "u4", leadId: "u3", studentRolls: [] },
  { id: "me301", code: "ME301", name: "Thermodynamics",             dept: "MECH",semester: 5, credits: 4, students: 71, examType: "Theory",              facultyId: "u4", leadId: "u3", studentRolls: [] },
];

const DEFAULT_COS: Record<string, CODefinition[]> = {
  cs301: [
    { co: "CO1", desc: "Design ER diagrams and relational schemas",           bloom: "Create",   bloomCode: "L6" },
    { co: "CO2", desc: "Apply normalization to eliminate data redundancy",     bloom: "Apply",    bloomCode: "L3" },
    { co: "CO3", desc: "Formulate SQL queries using relational algebra",       bloom: "Apply",    bloomCode: "L3" },
    { co: "CO4", desc: "Analyze indexing strategies and query optimization",   bloom: "Analyse",  bloomCode: "L4" },
    { co: "CO5", desc: "Implement transaction management and ACID properties", bloom: "Apply",    bloomCode: "L3" },
    { co: "CO6", desc: "Evaluate concurrency control and recovery mechanisms", bloom: "Evaluate", bloomCode: "L5" },
  ],
  cs401: [
    { co: "CO1", desc: "Understand ML algorithms and mathematical foundations", bloom: "Understand", bloomCode: "L2" },
    { co: "CO2", desc: "Apply supervised learning algorithms",                  bloom: "Apply",      bloomCode: "L3" },
    { co: "CO3", desc: "Analyse model performance and apply regularization",    bloom: "Analyse",    bloomCode: "L4" },
    { co: "CO4", desc: "Implement neural networks for classification tasks",    bloom: "Create",     bloomCode: "L6" },
    { co: "CO5", desc: "Evaluate ensemble methods and boosting techniques",     bloom: "Evaluate",   bloomCode: "L5" },
  ],
  ec201: [
    { co: "CO1", desc: "Recall fundamental DSP concepts and transforms",   bloom: "Remember", bloomCode: "L1" },
    { co: "CO2", desc: "Apply DFT and FFT for signal processing",          bloom: "Apply",    bloomCode: "L3" },
    { co: "CO3", desc: "Design FIR and IIR digital filters",               bloom: "Create",   bloomCode: "L6" },
    { co: "CO4", desc: "Analyse spectral characteristics of signals",      bloom: "Analyse",  bloomCode: "L4" },
    { co: "CO5", desc: "Implement real-time DSP systems",                  bloom: "Apply",    bloomCode: "L3" },
    { co: "CO6", desc: "Evaluate filter design techniques comparatively",  bloom: "Evaluate", bloomCode: "L5" },
  ],
  me301: [
    { co: "CO1", desc: "Define fundamental thermodynamic laws and concepts",          bloom: "Remember",  bloomCode: "L1" },
    { co: "CO2", desc: "Apply first and second law to heat engine problems",          bloom: "Apply",     bloomCode: "L3" },
    { co: "CO3", desc: "Analyse thermodynamic cycles such as Carnot and Rankine",     bloom: "Analyse",   bloomCode: "L4" },
    { co: "CO4", desc: "Design efficient thermodynamic systems for given constraints", bloom: "Create",    bloomCode: "L6" },
  ],
};

const DEFAULT_EXAM_CONFIGS: Record<string, ExamConfig[]> = {
  cs301: [
    {
      id: "t1", name: "T1 — Unit Test 1", maxMarks: 20, group: "CIE", status: "draft",
      questions: [
        { qno: "Q1",  co: "CO1", maxMarks: 5,  bloomCode: "L2", text: "Define the three-schema architecture of DBMS." },
        { qno: "Q2",  co: "CO1", maxMarks: 5,  bloomCode: "L1", text: "Explain the concept of data independence." },
        { qno: "Q3a", co: "CO2", maxMarks: 10, bloomCode: "L3", text: "Apply normalization up to BCNF for a given schema.", isEitherOr: true, eitherOrGroup: "Q3" },
        { qno: "Q3b", co: "CO2", maxMarks: 10, bloomCode: "L3", text: "Apply normalization up to 3NF for a given relation.", isEitherOr: true, eitherOrGroup: "Q3" },
      ]
    },
    {
      id: "t2", name: "T2 — Unit Test 2", maxMarks: 20, group: "CIE", status: "draft",
      questions: [
        { qno: "Q1",  co: "CO3", maxMarks: 5,  bloomCode: "L2", text: "Explain relational algebra operations." },
        { qno: "Q2",  co: "CO3", maxMarks: 5,  bloomCode: "L3", text: "Formulate SQL queries for given problems." },
        { qno: "Q3a", co: "CO4", maxMarks: 10, bloomCode: "L4", text: "Analyse B+ tree indexing strategy.",  isEitherOr: true, eitherOrGroup: "Q3" },
        { qno: "Q3b", co: "CO4", maxMarks: 10, bloomCode: "L4", text: "Analyse hash indexing strategies.",   isEitherOr: true, eitherOrGroup: "Q3" },
      ]
    },
    { id: "t3", name: "T3 — Assignment", maxMarks: 10, group: "CIE", status: "draft", questions: [] },
    { id: "t4", name: "T4 — Quiz/Viva",  maxMarks: 10, group: "CIE", status: "draft", questions: [] },
    {
      id: "t5", name: "T5 — Model Exam", maxMarks: 100, group: "CIE", status: "draft",
      questions: [
        { qno: "Q1", co: "CO1", maxMarks: 20, bloomCode: "L2", text: "Discuss ER-to-relational mapping." },
        { qno: "Q2", co: "CO2", maxMarks: 20, bloomCode: "L3", text: "Normalization: find all anomalies." },
        { qno: "Q3", co: "CO3", maxMarks: 20, bloomCode: "L3", text: "Complex SQL queries and joins." },
        { qno: "Q4", co: "CO4", maxMarks: 20, bloomCode: "L4", text: "Query optimization techniques." },
        { qno: "Q5", co: "CO5", maxMarks: 20, bloomCode: "L3", text: "Transaction management and ACID." },
      ]
    },
    {
      id: "see", name: "SEE — End Semester", maxMarks: 100, group: "SEE", status: "draft",
      questions: [
        { qno: "Q1", co: "CO1", maxMarks: 16, bloomCode: "L2", text: "ER Diagram and schema design." },
        { qno: "Q2", co: "CO2", maxMarks: 16, bloomCode: "L3", text: "Normalization problems." },
        { qno: "Q3", co: "CO3", maxMarks: 16, bloomCode: "L3", text: "SQL queries — advanced." },
        { qno: "Q4", co: "CO4", maxMarks: 16, bloomCode: "L4", text: "Indexing and query plans." },
        { qno: "Q5", co: "CO5", maxMarks: 16, bloomCode: "L3", text: "Transactions and concurrency." },
        { qno: "Q6", co: "CO6", maxMarks: 20, bloomCode: "L5", text: "Evaluate concurrency control methods." },
      ]
    },
  ],
};

const DEFAULT_MARKS: Record<string, MarksSubmission[]> = {
  cs301: [
    {
      courseId: "cs301", examId: "t1", status: "approved",
      submittedAt: "2024-09-10T10:00:00Z", approvedBy: "u3", approvedAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
      students: [
        { roll: "21CS001", name: "Aarav Sharma",  marks: { Q1: 4, Q2: 4, Q3a: 8,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS002", name: "Priya Verma",   marks: { Q1: 5, Q2: 3, Q3a: 0,  Q3b: 7  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS003", name: "Rahul Nair",    marks: { Q1: 3, Q2: 2, Q3a: 5,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS004", name: "Sneha Patel",   marks: { Q1: 5, Q2: 5, Q3a: 9,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS005", name: "Karan Mehta",   marks: { Q1: 3, Q2: 3, Q3a: 0,  Q3b: 6  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS006", name: "Divya Rao",     marks: { Q1: 4, Q2: 4, Q3a: 6,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS007", name: "Arjun Singh",   marks: { Q1: 2, Q2: 2, Q3a: 0,  Q3b: 4  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS008", name: "Neha Gupta",    marks: { Q1: 4, Q2: 5, Q3a: 7,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS009", name: "Vikram Iyer",   marks: { Q1: 3, Q2: 3, Q3a: 0,  Q3b: 5  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS010", name: "Pooja Desai",   marks: { Q1: 5, Q2: 4, Q3a: 8,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
      ]
    },
    {
      courseId: "cs301", examId: "t2", status: "pending",
      submittedAt: "2024-10-15T10:00:00Z",
      students: [
        { roll: "21CS001", name: "Aarav Sharma",  marks: { Q1: 4, Q2: 5, Q3a: 9,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS002", name: "Priya Verma",   marks: { Q1: 4, Q2: 4, Q3a: 0,  Q3b: 8  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS003", name: "Rahul Nair",    marks: { Q1: 2, Q2: 3, Q3a: 6,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS004", name: "Sneha Patel",   marks: { Q1: 5, Q2: 5, Q3a: 10, Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS005", name: "Karan Mehta",   marks: { Q1: 3, Q2: 4, Q3a: 0,  Q3b: 7  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS006", name: "Divya Rao",     marks: { Q1: 3, Q2: 3, Q3a: 7,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS007", name: "Arjun Singh",   marks: { Q1: 1, Q2: 2, Q3a: 0,  Q3b: 3  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS008", name: "Neha Gupta",    marks: { Q1: 4, Q2: 5, Q3a: 8,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
        { roll: "21CS009", name: "Vikram Iyer",   marks: { Q1: 3, Q2: 3, Q3a: 0,  Q3b: 6  }, eitherOrChoices: { Q3: "b" } },
        { roll: "21CS010", name: "Pooja Desai",   marks: { Q1: 5, Q2: 4, Q3a: 9,  Q3b: 0  }, eitherOrChoices: { Q3: "a" } },
      ]
    },
    { courseId: "cs301", examId: "t3", status: "draft", students: [] },
    { courseId: "cs301", examId: "t4", status: "draft", students: [] },
    { courseId: "cs301", examId: "t5", status: "draft", students: [] },
    { courseId: "cs301", examId: "see", status: "draft", students: [] },
  ],
};

const DEFAULT_AY: AYConfig = {
  ay: "2024-25",
  status: "active",
  startDate: "2024-07-15",
  endDate: "2025-04-30",
  marksDeadline: "2024-11-30",
  coLockDeadline: "2024-12-10",
  poDeadline: "2024-12-20",
};

const DEFAULT_THRESHOLDS: ThresholdConfig = {
  level3: 60,
  level2: 40,
  level1: 0,
  targetPassPct: 50,
  cieWeight: 40,
  seeWeight: 60,
  absentPolicy: "include",
  minCOs: 4,
  maxCOs: 6,
};

const DEFAULT_CO_LIBRARY: COLibrarySet[] = [
  {
    id: "lib1", name: "Database Systems — Standard Set", dept: "CSE", courseCode: "CS301",
    regulation: "R21", bloomCode: "L3", version: 2, status: "active",
    createdAt: "2023-06-01", updatedAt: "2024-10-12",
    cos: [
      { co: "CO1", desc: "Design ER diagrams and relational models",    bloomCode: "L6", poMaps: "PO1, PO2" },
      { co: "CO2", desc: "Apply normalization techniques up to BCNF",   bloomCode: "L3", poMaps: "PO1, PO3" },
      { co: "CO3", desc: "Formulate complex SQL queries",               bloomCode: "L3", poMaps: "PO1" },
      { co: "CO4", desc: "Analyse indexing and query optimization",     bloomCode: "L4", poMaps: "PO2, PO4" },
      { co: "CO5", desc: "Implement ACID-compliant transaction systems", bloomCode: "L3", poMaps: "PO3, PO5" },
    ]
  },
  {
    id: "lib2", name: "Machine Learning — Core Set", dept: "CSE", courseCode: "CS401",
    regulation: "R21", bloomCode: "L3", version: 1, status: "active",
    createdAt: "2023-06-01", updatedAt: "2024-09-05",
    cos: [
      { co: "CO1", desc: "Understand supervised and unsupervised ML methods", bloomCode: "L2", poMaps: "PO1" },
      { co: "CO2", desc: "Apply regression and classification algorithms",    bloomCode: "L3", poMaps: "PO2" },
      { co: "CO3", desc: "Analyse model overfitting and regularization",     bloomCode: "L4", poMaps: "PO3, PSO1" },
      { co: "CO4", desc: "Design neural network architectures",              bloomCode: "L6", poMaps: "PO4" },
    ]
  },
  {
    id: "lib3", name: "Database Systems — Legacy Set", dept: "CSE", courseCode: "CS301",
    regulation: "R18", bloomCode: "L3", version: 1, status: "archived",
    createdAt: "2021-06-01", updatedAt: "2021-08-10",
    cos: [
      { co: "CO1", desc: "Design ER models",          bloomCode: "L3", poMaps: "PO1" },
      { co: "CO2", desc: "Write SQL queries",          bloomCode: "L3", poMaps: "PO1" },
      { co: "CO3", desc: "Explain storage structures", bloomCode: "L2", poMaps: "PO1" },
      { co: "CO4", desc: "List concurrency issues",    bloomCode: "L1", poMaps: "PO2" },
    ]
  },
];

const DEFAULT_PO_DEFINITIONS: PODefinition[] = [
  { id: "PO1",  name: "Engineering Knowledge",        regulation: "R21", version: 1, category: "Technical",     statement: "Apply the knowledge of mathematics, science, engineering fundamentals, and an engineering specialization to the solution of complex engineering problems." },
  { id: "PO2",  name: "Problem Analysis",             regulation: "R21", version: 1, category: "Technical",     statement: "Identify, formulate, review research literature, and analyze complex engineering problems reaching substantiated conclusions using first principles of mathematics, natural sciences, and engineering sciences." },
  { id: "PO3",  name: "Design/Development of Solutions", regulation: "R21", version: 1, category: "Technical", statement: "Design solutions for complex engineering problems and design system components or processes that meet the specified needs with appropriate consideration for the public health and safety, and the cultural, societal, and environmental considerations." },
  { id: "PO4",  name: "Conduct Investigations",       regulation: "R21", version: 1, category: "Technical",     statement: "Use research-based knowledge and research methods including design of experiments, analysis and interpretation of data, and synthesis of the information to provide valid conclusions." },
  { id: "PO5",  name: "Modern Tool Usage",            regulation: "R21", version: 1, category: "Technical",     statement: "Create, select, and apply appropriate techniques, resources, and modern engineering and IT tools including prediction and modeling to complex engineering activities with an understanding of the limitations." },
  { id: "PO6",  name: "Engineer & Society",           regulation: "R21", version: 1, category: "Social",        statement: "Apply reasoning informed by the contextual knowledge to assess societal, health, safety, legal and cultural issues and the consequent responsibilities relevant to the professional engineering practice." },
  { id: "PO7",  name: "Environment & Sustainability", regulation: "R21", version: 1, category: "Social",        statement: "Understand the impact of the professional engineering solutions in societal and environmental contexts, and demonstrate the knowledge of, and need for sustainable development." },
  { id: "PO8",  name: "Ethics",                       regulation: "R21", version: 1, category: "Professional",  statement: "Apply ethical principles and commit to professional ethics and responsibilities and norms of the engineering practice." },
  { id: "PO9",  name: "Individual & Teamwork",        regulation: "R21", version: 1, category: "Professional",  statement: "Function effectively as an individual, and as a member or leader in diverse teams, and in multidisciplinary settings." },
  { id: "PO10", name: "Communication",                regulation: "R21", version: 1, category: "Professional",  statement: "Communicate effectively on complex engineering activities with the engineering community and with society at large, such as, being able to comprehend and write effective reports and design documentation." },
  { id: "PO11", name: "Project Management",           regulation: "R21", version: 1, category: "Professional",  statement: "Demonstrate knowledge and understanding of the engineering and management principles and apply these to one's own work, as a member and leader in a team, to manage projects and in multidisciplinary environments." },
  { id: "PO12", name: "Lifelong Learning",            regulation: "R21", version: 1, category: "Professional",  statement: "Recognize the need for, and have the preparation and ability to engage in independent and life-long learning in the broadest context of technological change." },
];

const DEFAULT_PSO_DEFINITIONS: PSODefinition[] = [
  { id: "PSO1", dept: "CSE", name: "Algorithm Design",      regulation: "R21", version: 1, statement: "Specify, design, develop, test and maintain usable software systems using modern software engineering principles." },
  { id: "PSO2", dept: "CSE", name: "Software Development",  regulation: "R21", version: 1, statement: "Use modern network and security engineering techniques for business-scale IT infrastructure and AI/ML solutions." },
  { id: "PSO3", dept: "CSE", name: "Professional Practice", regulation: "R21", version: 1, statement: "Apply professional ethics and contribute to society through computing innovations and research." },
];

export const CO_PO_MAPPING: Record<string, Record<string, number>> = {
  CO1: { PO1: 3, PO2: 2, PSO2: 3 },
  CO2: { PO1: 3, PO2: 3, PO3: 2, PSO1: 3, PSO2: 1 },
  CO3: { PO1: 2, PO2: 3, PO3: 3, PO4: 2, PSO1: 3, PSO2: 2 },
  CO4: { PO2: 2, PO3: 3, PO4: 3, PO5: 2, PSO1: 2, PSO2: 3 },
  CO5: { PO3: 2, PO4: 3, PO5: 3, PSO1: 1, PSO2: 3 },
  CO6: { PO2: 3, PO4: 2, PO7: 1, PSO3: 2 },
};

export const PROGRAM_OUTCOMES = [
  { id: "PO1",  name: "Engineering Knowledge" },
  { id: "PO2",  name: "Problem Analysis" },
  { id: "PO3",  name: "Design / Dev of Solutions" },
  { id: "PO4",  name: "Conduct Investigations" },
  { id: "PO5",  name: "Modern Tool Usage" },
  { id: "PO6",  name: "Engineer & Society" },
  { id: "PO7",  name: "Ethics" },
  { id: "PO8",  name: "Communication" },
  { id: "PO9",  name: "Individual & Teamwork" },
  { id: "PO10", name: "Project Management" },
  { id: "PO11", name: "Lifelong Learning" },
  { id: "PO12", name: "Environment & Sustainability" },
];

export const PROGRAM_SPECIFIC_OUTCOMES = [
  { id: "PSO1", name: "Algorithm Design" },
  { id: "PSO2", name: "Software Development" },
  { id: "PSO3", name: "Professional Practice" },
];

// ─── STORE INTERFACE ─────────────────────────────────────────

interface DataState {
  // Data
  users: UserRecord[];
  courses: CourseRecord[];
  cos: Record<string, CODefinition[]>;           // courseId → CO[]
  coPOMappings: Record<string, Record<string, Record<string, number>>>; // courseId → CO → PO/PSO → weight
  examConfigs: Record<string, ExamConfig[]>;     // courseId → ExamConfig[]
  submissions: Record<string, MarksSubmission[]>;// courseId → MarksSubmission[]
  ay: AYConfig;
  thresholds: ThresholdConfig;
  coLibrary: COLibrarySet[];
  auditLog: AuditEntry[];
  ayHistory: AYHistoryRecord[];
  grievances: Grievance[];
  remedialActions: Record<string, Record<string, string>>;
  facultyNotifications: FacultyNotification[];
  poDefinitions: PODefinition[];
  psoDefinitions: PSODefinition[];

  // Optional: CO attainment overrides per course/CO (used by faculty view)
  coOverrides?: Record<
    string,
    Record<
      string,
      {
        original: number;
        overridden: number;
        by: string;
        at: string;
      }
    >
  >;

  // User CRUD
  addUser: (user: Omit<UserRecord, "id" | "joinedAt">) => void;
  updateUser: (id: string, patch: Partial<UserRecord>) => void;
  deleteUser: (id: string) => void;

  // Course CRUD
  addCourse: (course: Omit<CourseRecord, "id">) => void;
  updateCourse: (id: string, patch: Partial<CourseRecord>) => void;

  // CO Management
  setCOs: (courseId: string, cos: CODefinition[]) => void;
  addCO: (courseId: string, co: CODefinition) => void;
  updateCO: (courseId: string, coId: string, patch: Partial<CODefinition>) => void;
  deleteCO: (courseId: string, coId: string) => void;
  setCOPOMapping: (courseId: string, mapping: Record<string, Record<string, number>>) => void;
  setCOOverride: (
    courseId: string,
    coId: string,
    override: { original: number; overridden: number; by: string; at: string; reason?: string },
  ) => void;

  // Exam Config
  addExamConfig: (courseId: string, exam: ExamConfig) => void;
  setExamConfig: (courseId: string, examId: string, patch: Partial<ExamConfig>) => void;
  setQuestions: (courseId: string, examId: string, questions: QuestionDef[]) => void;
  deleteExamConfig: (courseId: string, examId: string) => void;

  // Marks
  setSubmission: (courseId: string, submission: MarksSubmission) => void;
  saveSubmission: (submission: MarksSubmission) => void;
  approveSubmission: (courseId: string, examId: string, approvedBy: string) => void;
  returnSubmission: (courseId: string, examId: string, reason: string) => void;
  getSubmission: (courseId: string, examId: string) => MarksSubmission | undefined;

  // AY Config
  setAY: (config: Partial<AYConfig>) => void;
  lockAY: (signedBy: string) => void;
  addAYHistory: (record: AYHistoryRecord) => void;

  // Thresholds
  setThresholds: (t: Partial<ThresholdConfig>) => void;

  // CO Library
  addCOLibrarySet: (set: Omit<COLibrarySet, "id" | "createdAt" | "updatedAt">) => void;
  updateCOLibrarySet: (id: string, patch: Partial<COLibrarySet>) => void;
  archiveCOLibrarySet: (id: string) => void;
  restoreCOLibrarySet: (id: string) => void;

  // PO/PSO Master actions
  updatePODefinition: (id: string, patch: Partial<PODefinition>) => void;
  addPSODefinition: (pso: Omit<PSODefinition, "version">) => void;
  updatePSODefinition: (id: string, patch: Partial<PSODefinition>) => void;
  deletePSODefinition: (id: string) => void;

  // Audit
  addAuditEntry: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;

  // Grievances
  addGrievance: (g: Omit<Grievance, "id" | "submittedAt">) => void;
  resolveGrievance: (id: string, resolution: string) => void;
  updateGrievanceStatus: (id: string, status: Grievance["status"], resolution?: string, updatedMarks?: number) => void;

  // Remedial Actions
  saveRemedialAction: (courseId: string, coId: string, action: string) => void;

  // Submission status update (used by lead approval)
  updateSubmissionStatus: (
    courseId: string,
    examId: string,
    status: MarksSubmission["status"],
    meta?: { by?: string; comment?: string; returnReason?: string; overrideReason?: string; students?: StudentMark[] }
  ) => void;

  // Faculty Notifications
  addFacultyNotification: (n: Omit<FacultyNotification, "id" | "timestamp" | "read">) => void;
  markFacultyNotifRead: (id: string) => void;
  deleteFacultyNotif: (id: string) => void;
  markAllFacultyNotifsRead: (userId: string) => void;
}

function uid() {
  return Math.random().toString(36).substr(2, 9);
}

function now() {
  return new Date().toISOString().replace("T", " ").substring(0, 19);
}

// ─── STORE ───────────────────────────────────────────────────

export const useDataStore = create<DataState>()(
  persist(
    (set, get) => ({
      users: DEFAULT_USERS,
      courses: DEFAULT_COURSES,
      cos: DEFAULT_COS,
      coPOMappings: {},
      examConfigs: DEFAULT_EXAM_CONFIGS,
      submissions: DEFAULT_MARKS,
      coOverrides: {},
      ay: DEFAULT_AY,
      thresholds: DEFAULT_THRESHOLDS,
      coLibrary: DEFAULT_CO_LIBRARY,
      poDefinitions: DEFAULT_PO_DEFINITIONS,
      psoDefinitions: DEFAULT_PSO_DEFINITIONS,
      auditLog: DEFAULT_SEED_AUDIT,
      ayHistory: DEFAULT_AY_HISTORY,
      grievances: [],
      remedialActions: {},
      facultyNotifications: [
        { id: "fn1", type: "reminder", title: "CO Generation Pending", message: "Course 'Database Management Systems' assigned but COs not yet generated after 7 days.", timestamp: "3 days ago", link: "/faculty/course/cs301/co-generation", read: false, userId: "u4" },
        { id: "fn2", type: "reminder", title: "Deadline Reminder", message: "T2 marks upload deadline is in 3 days (Nov 30th). CS301 marks not yet submitted.", timestamp: "1 day ago", link: "/faculty/course/cs301/marks/t2", read: false, userId: "u4" },
        { id: "fn3", type: "success", title: "Marks Approved", message: "Course Lead Dr. Anita has approved your T1 marks submission for CS301.", timestamp: "5 hours ago", link: "/faculty/dashboard", read: true, userId: "u4" },
        { id: "fn4", type: "critical", title: "CO Level 1 Alert", message: "CO3 attainment for CS301 has fallen below 40%. Remedial action required immediately.", timestamp: "2 hours ago", link: "/faculty/course/cs301/co-attainment", read: false, userId: "u4" },
        { id: "fn5", type: "system", title: "Academic Year Active", message: "AY 2024-25 is now active. All marks and CO data must be submitted by April 30th.", timestamp: "1 week ago", link: "/faculty/dashboard", read: true, userId: "u4" },
      ],

      // ── User CRUD ──
      addUser: (user) => {
        const newUser: UserRecord = { ...user, id: uid(), joinedAt: now().split(" ")[0] };
        set(s => ({ users: [...s.users, newUser] }));
        get().addAuditEntry({ type: "user", userId: "system", role: "admin", action: `Provisioned new user: ${user.name} (${user.employeeId})`, ip: "127.0.0.1" });
      },
      updateUser: (id, patch) =>
        set(s => ({ users: s.users.map(u => u.id === id ? { ...u, ...patch } : u) })),
      deleteUser: (id) =>
        set(s => ({ users: s.users.filter(u => u.id !== id) })),

      // ── Course CRUD ──
      addCourse: (course) =>
        set(s => ({ courses: [...s.courses, { ...course, id: uid() }] })),
      updateCourse: (id, patch) =>
        set(s => ({ courses: s.courses.map(c => c.id === id ? { ...c, ...patch } : c) })),

      // ── CO Management ──
      setCOs: (courseId, cos) =>
        set(s => ({ cos: { ...s.cos, [courseId]: cos } })),
      addCO: (courseId, co) =>
        set(s => ({ cos: { ...s.cos, [courseId]: [...(s.cos[courseId] || []), co] } })),
      updateCO: (courseId, coId, patch) =>
        set(s => ({
          cos: { ...s.cos, [courseId]: (s.cos[courseId] || []).map(c => c.co === coId ? { ...c, ...patch } : c) }
        })),
      deleteCO: (courseId, coId) =>
        set(s => ({ cos: { ...s.cos, [courseId]: (s.cos[courseId] || []).filter(c => c.co !== coId) } })),
      setCOPOMapping: (courseId, mapping) =>
        set(s => ({ coPOMappings: { ...s.coPOMappings, [courseId]: mapping } })),
      setCOOverride: (courseId, coId, override) =>
        set(s => ({
          coOverrides: {
            ...(s.coOverrides || {}),
            [courseId]: {
              ...((s.coOverrides || {})[courseId] || {}),
              [coId]: override,
            },
          },
        })),

      // ── Exam Config ──
      addExamConfig: (courseId, exam) =>
        set(s => ({
          examConfigs: {
            ...s.examConfigs,
            [courseId]: [...(s.examConfigs[courseId] || []), exam]
          }
        })),
      setExamConfig: (courseId, examId, patch) =>
        set(s => ({
          examConfigs: {
            ...s.examConfigs,
            [courseId]: (s.examConfigs[courseId] || []).map(e => e.id === examId ? { ...e, ...patch } : e)
          }
        })),
      setQuestions: (courseId, examId, questions) =>
        set(s => ({
          examConfigs: {
            ...s.examConfigs,
            [courseId]: (s.examConfigs[courseId] || []).map(e => e.id === examId ? { ...e, questions } : e)
          }
        })),
      deleteExamConfig: (courseId, examId) =>
        set(s => ({
          examConfigs: {
            ...s.examConfigs,
            [courseId]: (s.examConfigs[courseId] || []).filter(e => e.id !== examId)
          }
        })),

      // ── Marks ──
      setSubmission: (courseId: string, submission: MarksSubmission) =>
        set(s => ({
          submissions: {
            ...s.submissions,
            [courseId]: [
              ...(s.submissions[courseId] || []).filter(m => m.examId !== submission.examId),
              submission
            ]
          }
        })),
      saveSubmission: (submission) =>
        set(s => {
          const existing = s.submissions[submission.courseId] || [];
          const idx = existing.findIndex(m => m.examId === submission.examId);
          const updated = idx >= 0
            ? existing.map((m, i) => i === idx ? submission : m)
            : [...existing, submission];
          return { submissions: { ...s.submissions, [submission.courseId]: updated } };
        }),
      approveSubmission: (courseId, examId, approvedBy) => {
        const approvedAt = new Date().toISOString();
        set(s => ({
          submissions: {
            ...s.submissions,
            [courseId]: (s.submissions[courseId] || []).map(m =>
              m.examId === examId ? { ...m, status: "approved", approvedBy, approvedAt } : m
            )
          }
        }));
        get().addAuditEntry({ type: "approval", userId: approvedBy, role: "subject_lead", action: `Approved marks for ${courseId.toUpperCase()} — ${examId.toUpperCase()}`, ip: "192.168.1.1" });
      },
      returnSubmission: (courseId, examId, reason) =>
        set(s => ({
          submissions: {
            ...s.submissions,
            [courseId]: (s.submissions[courseId] || []).map(m =>
              m.examId === examId ? { ...m, status: "returned", returnReason: reason } : m
            )
          }
        })),
      getSubmission: (courseId, examId) =>
        get().submissions[courseId]?.find(m => m.examId === examId),

      // ── AY Config ──
      setAY: (config) => set(s => ({ ay: { ...s.ay, ...config } })),
      lockAY: (signedBy) => {
        set(s => ({ ay: { ...s.ay, status: "locked", lockedBy: signedBy, lockedOn: now().split(" ")[0] } }));
        get().addAuditEntry({ type: "ay_lock", userId: signedBy, role: "department_head", action: `Academic Year ${get().ay.ay} locked and archived by ${signedBy}`, ip: "192.168.1.1" });
      },
      addAYHistory: (record) =>
        set(s => ({ ayHistory: [...s.ayHistory.filter(h => h.ay !== record.ay), record] })),

      // ── Thresholds ──
      setThresholds: (t) => set(s => ({ thresholds: { ...s.thresholds, ...t } })),

      // ── CO Library ──
      addCOLibrarySet: (set_) =>
        set(s => ({ coLibrary: [...s.coLibrary, { ...set_, id: uid(), createdAt: now().split(" ")[0], updatedAt: now().split(" ")[0] }] })),
      updateCOLibrarySet: (id, patch) =>
        set(s => ({ coLibrary: s.coLibrary.map(l => l.id === id ? { ...l, ...patch, updatedAt: now().split(" ")[0], version: (l.version || 1) + 1 } : l) })),
      archiveCOLibrarySet: (id) =>
        set(s => ({ coLibrary: s.coLibrary.map(l => l.id === id ? { ...l, status: "archived", updatedAt: now().split(" ")[0] } : l) })),
      restoreCOLibrarySet: (id) =>
        set(s => ({ coLibrary: s.coLibrary.map(l => l.id === id ? { ...l, status: "active", updatedAt: now().split(" ")[0] } : l) })),

      // ── PO/PSO Master ──
      updatePODefinition: (id, patch) =>
        set(s => ({ poDefinitions: s.poDefinitions.map(p => p.id === id ? { ...p, ...patch, version: p.version + 1 } : p) })),
      addPSODefinition: (pso) =>
        set(s => ({ psoDefinitions: [...s.psoDefinitions, { ...pso, version: 1 }] })),
      updatePSODefinition: (id, patch) =>
        set(s => ({ psoDefinitions: s.psoDefinitions.map(p => p.id === id ? { ...p, ...patch, version: p.version + 1 } : p) })),
      deletePSODefinition: (id) =>
        set(s => ({ psoDefinitions: s.psoDefinitions.filter(p => p.id !== id) })),

      // ── Audit ──
      addAuditEntry: (entry) =>
        set(s => ({
          auditLog: [
            { ...entry, id: uid(), timestamp: now() },
            ...s.auditLog.slice(0, 499), // keep last 500
          ]
        })),

      // ── Grievances ──
      addGrievance: (g) =>
        set(s => ({ grievances: [...s.grievances, { ...g, id: uid(), submittedAt: now(), status: "pending" }] })),
      resolveGrievance: (id, resolution) =>
        set(s => ({ grievances: s.grievances.map(g => g.id === id ? { ...g, status: "resolved_unchanged", resolution } : g) })),
      updateGrievanceStatus: (id, status, resolution, updatedMarks) =>
        set(s => ({ grievances: s.grievances.map(g => g.id === id ? { ...g, status, ...(resolution ? { resolution } : {}), ...(updatedMarks !== undefined ? { updatedMarks } : {}) } : g) })),

      // ── Submission Status ──
      updateSubmissionStatus: (courseId, examId, status, meta) =>
        set(s => ({
          submissions: {
            ...s.submissions,
            [courseId]: (s.submissions[courseId] || []).map(m =>
              m.examId === examId
                ? {
                    ...m,
                    status,
                    ...(status === "approved" ? { approvedAt: new Date().toISOString(), approvedBy: meta?.by } : {}),
                    ...(status === "returned" ? { returnReason: meta?.returnReason || m.returnReason } : {}),
                    ...(meta?.comment ? { leadComment: meta.comment } : {}),
                    ...(meta?.overrideReason ? { overrideReason: meta.overrideReason } : {}),
                    ...(meta?.students ? { students: meta.students } : {}),
                    history: [
                      ...(m.history || []),
                      {
                        id: uid(),
                        action: status === "approved" ? "approved" : status === "returned" ? "returned" : "submitted",
                        by: meta?.by || "system",
                        role: "subject_lead",
                        at: now(),
                        comment: meta?.comment || meta?.returnReason || meta?.overrideReason,
                      },
                    ],
                  }
                : m
            )
          }
        })),

      // ── Faculty Notifications ──
      addFacultyNotification: (n) =>
        set(s => ({ facultyNotifications: [{ ...n, id: uid(), timestamp: "Just now", read: false }, ...s.facultyNotifications] })),
      markFacultyNotifRead: (id) =>
        set(s => ({ facultyNotifications: s.facultyNotifications.map(n => n.id === id ? { ...n, read: true } : n) })),
      deleteFacultyNotif: (id) =>
        set(s => ({ facultyNotifications: s.facultyNotifications.filter(n => n.id !== id) })),
      markAllFacultyNotifsRead: (userId) =>
        set(s => ({ facultyNotifications: s.facultyNotifications.map(n => n.userId === userId ? { ...n, read: true } : n) })),

      // ── Remedial Actions ──
      saveRemedialAction: (courseId, coId, action) =>
        set(s => ({
          remedialActions: {
            ...s.remedialActions,
            [courseId]: {
              ...(s.remedialActions[courseId] || {}),
              [coId]: action
            }
          }
        })),
    }),
    {
      name: "obe-ai-data-store",
      version: 4,
    }
  )
);
