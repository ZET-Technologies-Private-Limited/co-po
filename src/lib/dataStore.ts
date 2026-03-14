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
  mappings?: Record<string, Record<string, number>>; // co -> po -> weight
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
  returnReason?: string;
};

export type UserRecord = {
  id: string;
  name: string;
  email: string;
  password: string;     // plain text for demo; in prod would be hashed
  employeeId: string;
  roles: Role[];
  dept: string;
  designation: string;
  status: "active" | "inactive";
  joinedAt: string;
};

export type AYConfig = {
  ay: string;           // "2024-25"
  status: "active" | "locked" | "archived";
  startDate: string;
  endDate: string;
  marksDeadline: string;
  coLockDeadline: string;
  poDeadline: string;
};

export type ThresholdConfig = {
  level3: number;      // ≥ this → Level 3
  level2: number;      // ≥ this → Level 2
  level1: number;      // < level2 → Level 1
  targetPassPct: number;
  cieWeight: number;
  seeWeight: number;
};

export type COLibrarySet = {
  id: string;
  name: string;
  dept: string;
  bloomCode: string;
  cos: { co: string; desc: string; bloomCode: string }[];
  version: string;
  status: "active" | "archived";
  createdAt: string;
};

export type AuditEntry = {
  id: string;
  type: "login" | "login_fail" | "co_generate" | "marks" | "approval" | "override" | "system" | "user" | "ay_lock";
  userId: string;
  role: string;
  action: string;
  ip: string;
  timestamp: string;
};

export type Grievance = {
  id: string;
  studentRoll: string;
  courseId: string;
  examId: string;
  qno: string;
  text: string;
  status: "open" | "resolved";
  submittedAt: string;
  resolution?: string;
};

// ─── DEFAULT SEED DATA ────────────────────────────────────────

const DEFAULT_USERS: UserRecord[] = [
  { id: "u1", name: "Dr. System Admin",    email: "admin@nexus.edu",   password: "Admin@123",   employeeId: "ADM001", roles: ["admin"],           dept: "Administration", designation: "System Administrator", status: "active", joinedAt: "2022-07-01" },
  { id: "u2", name: "Prof. Ravi Kumar",    email: "hod@nexus.edu",     password: "Hod@1234",    employeeId: "HOD001", roles: ["department_head"], dept: "CSE",            designation: "Head of Department",   status: "active", joinedAt: "2019-06-01" },
  { id: "u3", name: "Dr. Anita Nair",      email: "lead@nexus.edu",    password: "Lead@123",    employeeId: "FAC001", roles: ["subject_lead"],   dept: "CSE",            designation: "Associate Professor",  status: "active", joinedAt: "2020-08-01" },
  { id: "u4", name: "Mr. Sanjay Kapoor",   email: "faculty@nexus.edu", password: "Faculty@1",   employeeId: "FAC002", roles: ["faculty"],         dept: "CSE",            designation: "Assistant Professor",  status: "active", joinedAt: "2021-07-01" },
  { id: "u5", name: "Aarav Sharma",        email: "student@nexus.edu", password: "Student@1",   employeeId: "21CS001",roles: ["student"],         dept: "CSE",            designation: "B.Tech Student",       status: "active", joinedAt: "2021-08-01" },
];

const DEFAULT_COURSES: CourseRecord[] = [
  { id: "cs301", code: "CS301", name: "Database Management Systems", dept: "CSE", semester: 5, credits: 4, students: 60, examType: "Theory",              facultyId: "u4", leadId: "u3" },
  { id: "cs401", code: "CS401", name: "Machine Learning",           dept: "CSE", semester: 7, credits: 4, students: 48, examType: "Theory",              facultyId: "u4", leadId: "u3" },
  { id: "ec201", code: "EC201", name: "Digital Signal Processing",  dept: "ECE", semester: 4, credits: 3, students: 55, examType: "Theory + Practical",  facultyId: "u4", leadId: "u3" },
  { id: "me301", code: "ME301", name: "Thermodynamics",             dept: "MECH",semester: 5, credits: 4, students: 71, examType: "Theory",              facultyId: "u4", leadId: "u3" },
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
      submittedAt: "2024-09-10T10:00:00Z", approvedBy: "u3",
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
};

const DEFAULT_CO_LIBRARY: COLibrarySet[] = [
  {
    id: "lib1", name: "Database Systems — Standard Set", dept: "CSE", bloomCode: "L3", version: "v2.1",
    status: "active", createdAt: "2023-06-01",
    cos: [
      { co: "CO1", desc: "Design ER diagrams and relational models",    bloomCode: "L6" },
      { co: "CO2", desc: "Apply normalization techniques up to BCNF",   bloomCode: "L3" },
      { co: "CO3", desc: "Formulate complex SQL queries",               bloomCode: "L3" },
      { co: "CO4", desc: "Analyse indexing and query optimization",     bloomCode: "L4" },
      { co: "CO5", desc: "Implement ACID-compliant transaction systems", bloomCode: "L3" },
    ]
  },
  {
    id: "lib2", name: "Machine Learning — Core Set", dept: "CSE", bloomCode: "L3", version: "v1.4",
    status: "active", createdAt: "2023-06-01",
    cos: [
      { co: "CO1", desc: "Understand supervised and unsupervised ML methods", bloomCode: "L2" },
      { co: "CO2", desc: "Apply regression and classification algorithms",    bloomCode: "L3" },
      { co: "CO3", desc: "Analyse model overfitting and regularization",     bloomCode: "L4" },
      { co: "CO4", desc: "Design neural network architectures",              bloomCode: "L6" },
    ]
  },
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
  grievances: Grievance[];

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

  // Exam Config
  addExamConfig: (courseId: string, exam: ExamConfig) => void;
  setExamConfig: (courseId: string, examId: string, patch: Partial<ExamConfig>) => void;
  setQuestions: (courseId: string, examId: string, questions: QuestionDef[]) => void;

  // Marks
  setSubmission: (courseId: string, submission: MarksSubmission) => void;
  saveSubmission: (submission: MarksSubmission) => void;
  approveSubmission: (courseId: string, examId: string, approvedBy: string) => void;
  returnSubmission: (courseId: string, examId: string, reason: string) => void;
  getSubmission: (courseId: string, examId: string) => MarksSubmission | undefined;

  // AY Config
  setAY: (config: Partial<AYConfig>) => void;
  lockAY: (signedBy: string) => void;

  // Thresholds
  setThresholds: (t: Partial<ThresholdConfig>) => void;

  // CO Library
  addCOLibrarySet: (set: Omit<COLibrarySet, "id" | "createdAt">) => void;
  updateCOLibrarySet: (id: string, patch: Partial<COLibrarySet>) => void;
  archiveCOLibrarySet: (id: string) => void;

  // Audit
  addAuditEntry: (entry: Omit<AuditEntry, "id" | "timestamp">) => void;

  // Grievances
  addGrievance: (g: Omit<Grievance, "id" | "submittedAt">) => void;
  resolveGrievance: (id: string, resolution: string) => void;
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
      ay: DEFAULT_AY,
      thresholds: DEFAULT_THRESHOLDS,
      coLibrary: DEFAULT_CO_LIBRARY,
      auditLog: [],
      grievances: [],

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
        set(s => ({
          submissions: {
            ...s.submissions,
            [courseId]: (s.submissions[courseId] || []).map(m =>
              m.examId === examId ? { ...m, status: "approved", approvedBy } : m
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
        set(s => ({ ay: { ...s.ay, status: "locked" } }));
        get().addAuditEntry({ type: "ay_lock", userId: signedBy, role: "department_head", action: `Academic Year ${get().ay.ay} locked and archived by ${signedBy}`, ip: "192.168.1.1" });
      },

      // ── Thresholds ──
      setThresholds: (t) => set(s => ({ thresholds: { ...s.thresholds, ...t } })),

      // ── CO Library ──
      addCOLibrarySet: (set_) =>
        set(s => ({ coLibrary: [...s.coLibrary, { ...set_, id: uid(), createdAt: now().split(" ")[0] }] })),
      updateCOLibrarySet: (id, patch) =>
        set(s => ({ coLibrary: s.coLibrary.map(l => l.id === id ? { ...l, ...patch } : l) })),
      archiveCOLibrarySet: (id) =>
        set(s => ({ coLibrary: s.coLibrary.map(l => l.id === id ? { ...l, status: "archived" } : l) })),

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
        set(s => ({ grievances: [...s.grievances, { ...g, id: uid(), submittedAt: now(), status: "open" }] })),
      resolveGrievance: (id, resolution) =>
        set(s => ({ grievances: s.grievances.map(g => g.id === id ? { ...g, status: "resolved", resolution } : g) })),
    }),
    {
      name: "obe-ai-data-store",
      version: 1,
    }
  )
);
