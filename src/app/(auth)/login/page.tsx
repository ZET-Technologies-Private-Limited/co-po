"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Lock, Eye, EyeOff, Loader2, CheckCircle2 } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { useAuthStore } from "@/lib/authStore";

const DEMO_USERS = {
  faculty: {
    email: "faculty@university.edu", pass: "demo",
    user: { id: "fac_1", name: "Prof. Anita Nair", email: "faculty@university.edu", employeeId: "FAC2024001", roles: ["faculty"] as any, department: "Computer Science", designation: "Assistant Professor" }
  },
  subject_lead: {
    email: "lead@university.edu", pass: "demo",
    user: { id: "sl_1", name: "Dr. Ramesh Iyer", email: "lead@university.edu", employeeId: "FAC2022015", roles: ["subject_lead", "faculty"] as any, department: "Computer Science", designation: "Senior Faculty / Subject Coordinator" }
  },
  department_head: {
    email: "hod@university.edu", pass: "demo",
    user: { id: "hod_1", name: "Dr. Priya Sharma", email: "hod@university.edu", employeeId: "HOD2020001", roles: ["department_head", "faculty"] as any, department: "Computer Science", designation: "Head of Department" }
  },
  admin: {
    email: "admin@university.edu", pass: "demo",
    user: { id: "sys_admin_1", name: "Mr. A.K. Verma", email: "admin@university.edu", employeeId: "ADM2024001", roles: ["admin"] as any, department: "Administration", designation: "System Administrator" }
  },
  student: {
    email: "student@university.edu", pass: "demo",
    user: { id: "stu_1", name: "Rahul Kumar", email: "student@university.edu", employeeId: "21CSE001", roles: ["student"] as any, department: "Computer Science", designation: "Student - BE CSE" }
  }
};

const DEPARTMENTS = ["Computer Science", "Electronics", "Mechanical", "Civil", "IT", "Administration"];
const ACTIVE_AYS = ["2024-25", "2023-24"];

export default function LoginPage() {
  const router = useRouter();
  const { login, setActiveRole } = useAuthStore();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [employeeId, setEmployeeId] = useState("");
  const [department, setDepartment] = useState("");
  const [selectedAY, setSelectedAY] = useState("2024-25");
  const [showPassword, setShowPassword] = useState(false);
  const [isError, setIsError] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleSelector, setShowRoleSelector] = useState(false);
  const [pendingUser, setPendingUser] = useState<typeof DEMO_USERS[keyof typeof DEMO_USERS]['user'] | null>(null);

  const setDemoCredentials = (roleKey: keyof typeof DEMO_USERS) => {
    const demo = DEMO_USERS[roleKey];
    setEmail(demo.email);
    setPassword(demo.pass);
    setEmployeeId(demo.user.employeeId);
    setDepartment(demo.user.department);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    const matchedRole = Object.values(DEMO_USERS).find(u => u.email === email && u.pass === password);
    if (matchedRole) {
      setIsLoading(true);
      await new Promise(resolve => setTimeout(resolve, 1500));
      const userObj = matchedRole.user as any;
      // Dual-role detection: show selector if user has more than one role
      if (userObj.roles.length > 1) {
        setPendingUser(userObj);
        setIsLoading(false);
        setShowRoleSelector(true);
      } else {
        login(userObj);
        router.push("/dashboard");
      }
    } else {
      setIsError(true);
      setTimeout(() => setIsError(false), 2500);
    }
  };

  const handleRoleSelect = (role: string) => {
    if (!pendingUser) return;
    login(pendingUser as any);
    setActiveRole(role as any);
    setShowRoleSelector(false);
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-cosmic overflow-hidden selection:bg-brand/30 selection:text-white">
      <LoginBackground />

      <div className="relative z-10 min-h-screen flex">
        {/* Left — Identity Panel */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 px-20 py-16">
          {/* Logo */}
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-aurora flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-display font-medium text-white tracking-widest uppercase text-sm">Nexus Engine</span>
          </div>

          {/* Large headline, same typographic style as landing */}
          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest">
              <span className="w-8 h-[1px] bg-brand"></span>
              Academic Intelligence Platform
            </div>

            <h1 className="text-5xl lg:text-6xl font-display font-medium text-white leading-tight tracking-tight">
              Map outcomes.<br />
              <span className="text-white/50">Measure attainment.</span>
            </h1>

            <p className="text-lg text-white/40 font-light leading-relaxed max-w-md">
              The complete CO-PO-PSO intelligence platform for accreditation-ready universities.
            </p>
          </div>

          {/* Roles Info & Demo Credentials */}
          <div className="flex flex-col gap-6">
            <span className="text-xs font-mono text-white/20 uppercase tracking-widest">System Access Roles (click to auto-fill)</span>
            <div className="grid grid-cols-2 gap-x-8 gap-y-6">
              <div onClick={() => setDemoCredentials('faculty')}
                className="flex flex-col gap-1.5 text-sm p-3 -m-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                <span className="text-white font-mono uppercase tracking-widest text-[10px]">Faculty</span>
                <span className="text-brand text-[10px] font-mono">Course Teacher · Visiting Faculty</span>
                <span className="text-white/40 font-light text-xs leading-relaxed">Generates COs, configures exams, uploads marks.</span>
              </div>
              <div onClick={() => setDemoCredentials('subject_lead')}
                className="flex flex-col gap-1.5 text-sm p-3 -m-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                <span className="text-insight font-mono uppercase tracking-widest text-[10px]">Course Lead</span>
                <span className="text-insight text-[10px] font-mono">Senior Faculty · Subject Coordinator</span>
                <span className="text-white/40 font-light text-xs leading-relaxed">Views CO attainment, approves marks, PO/PSO.</span>
              </div>
              <div onClick={() => setDemoCredentials('department_head')}
                className="flex flex-col gap-1.5 text-sm p-3 -m-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                <span className="text-aurora font-mono uppercase tracking-widest text-[10px]">HOD</span>
                <span className="text-aurora text-[10px] font-mono">Head of Department</span>
                <span className="text-white/40 font-light text-xs leading-relaxed">Full dept: COs, POs, PSOs, 3-year AY history.</span>
              </div>
              <div onClick={() => setDemoCredentials('admin')}
                className="flex flex-col gap-1.5 text-sm p-3 -m-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                <span className="text-alert font-mono uppercase tracking-widest text-[10px]">Admin</span>
                <span className="text-alert text-[10px] font-mono">System Admin · Exam Cell Staff</span>
                <span className="text-white/40 font-light text-xs leading-relaxed">All departments + system config, AY setup.</span>
              </div>
              <div onClick={() => setDemoCredentials('student')}
                className="flex flex-col gap-1.5 text-sm p-3 -m-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                <span className="text-cyan-400 font-mono uppercase tracking-widest text-[10px]">Student</span>
                <span className="text-cyan-400 text-[10px] font-mono">Enrolled Student</span>
                <span className="text-white/40 font-light text-xs leading-relaxed">View own marks, CO attainment, and improvement areas.</span>
              </div>
            </div>
            <div className="mt-4 pt-6 border-t border-white/10 flex flex-col gap-1 font-mono text-sm text-white/40">
              <span className="text-[10px] text-white/20 uppercase tracking-widest mb-1">Password for all demo accounts</span>
              <span className="text-white/70">demo</span>
            </div>
          </div>
        </div>

        {/* Right — Login Form (NO CARD, pure typography) */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-20 py-16">
          <motion.div
            variants={staggerContainer}
            initial="hidden"
            animate="visible"
            className="w-full max-w-md"
          >
            {/* Mobile logo only */}
            <div className="flex items-center gap-3 mb-16 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-aurora flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="font-display font-medium text-white tracking-widest uppercase text-sm">Nexus Engine</span>
            </div>

            {/* Heading */}
            <motion.div variants={fadeSlideUp} className="mb-14">
              <div className="flex items-center gap-3 text-sm font-mono text-white/30 uppercase tracking-widest mb-6">
                <span className="w-8 h-[1px] bg-white/20"></span>
                Secure Access
              </div>
              <h2 className="text-4xl font-display text-white">Welcome back.</h2>
            </motion.div>

            {/* Form — flat, borderless fields */}
            <motion.form variants={staggerContainer} onSubmit={handleLogin} className="flex flex-col gap-0">
              {/* Employee ID field */}
              <motion.div variants={fadeSlideUp} className="flex flex-col gap-2 pb-6 border-b border-white/10 mb-6">
                <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Employee ID</label>
                <input type="text" value={employeeId} onChange={e => setEmployeeId(e.target.value)}
                  placeholder="FAC2024001"
                  className="bg-transparent text-white text-lg placeholder-white/20 outline-none w-full font-light font-mono"
                />
              </motion.div>
              {/* Department + AY row */}
              <motion.div variants={fadeSlideUp} className="grid grid-cols-2 gap-6 pb-6 border-b border-white/10 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Department</label>
                  <select value={department} onChange={e => setDepartment(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none font-light border-none appearance-none w-full cursor-pointer">
                    <option value="" className="bg-[#0a0a0f]">Select department</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Academic Year</label>
                  <select value={selectedAY} onChange={e => setSelectedAY(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none font-light border-none appearance-none w-full cursor-pointer">
                    {ACTIVE_AYS.map(ay => <option key={ay} value={ay} className="bg-[#0a0a0f]">{ay}</option>)}
                  </select>
                </div>
              </motion.div>
              {/* Email field */}
              <motion.div variants={fadeSlideUp} className="flex flex-col gap-2 pb-8 border-b border-white/10 mb-8">
                <label className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3"/> Email
                </label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@university.edu"
                  className="bg-transparent text-white text-xl placeholder-white/20 outline-none w-full font-light"
                />
              </motion.div>

              {/* Password field */}
              <motion.div variants={fadeSlideUp} className="flex flex-col gap-2 pb-8 border-b border-white/10 mb-10">
                <label className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3 h-3"/> Password
                </label>
                <div className="flex items-center gap-4">
                  <input
                    type={showPassword ? "text" : "password"}
                    required
                    value={password}
                    onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="bg-transparent text-white text-xl placeholder-white/20 outline-none flex-1 font-light"
                  />
                  <button type="button" onClick={() => setShowPassword(s => !s)} className="text-white/20 hover:text-white/60 transition-colors shrink-0">
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Error message */}
              <AnimatePresence>
                {isError && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="text-alert text-sm font-mono mb-8 -mt-4"
                  >
                    Invalid credentials. Use demo account details above.
                  </motion.p>
                )}
              </AnimatePresence>

              {/* CTA Row */}
              <motion.div variants={fadeSlideUp} className="flex items-center justify-between">
                <button
                  type="submit"
                  disabled={isLoading}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-50"
                >
                  {isLoading
                    ? <><Loader2 className="w-4 h-4 animate-spin" /> Authenticating</>
                    : <>Sign In <ArrowRight className="w-4 h-4" /></>}
                </button>

                <Link href="/forgot-password" className="text-sm text-white/40 hover:text-white transition-colors font-mono">
                  Forgot password?
                </Link>
              </motion.div>
            </motion.form>

            <motion.p variants={fadeSlideUp} className="mt-12 text-white/30 text-sm font-light">
              New to Nexus Engine? <Link href="/register" className="text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline">Request access →</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* Dual-Role Selector Modal */}
      <AnimatePresence>
        {showRoleSelector && pendingUser && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.95, opacity: 0 }} animate={{ scale: 1, opacity: 1 }}
              className="w-full max-w-md bg-[#0a0a0f] border border-white/10 p-10">
              <p className="text-xs font-mono text-brand uppercase tracking-widest mb-2">Dual-Role Account Detected</p>
              <h3 className="text-2xl font-display text-white mb-2">{pendingUser.name}</h3>
              <p className="text-white/40 font-light mb-8 text-sm">{pendingUser.designation}</p>
              <p className="text-white/50 text-sm mb-6">Select the role to log in with:</p>
              <div className="flex flex-col gap-3">
                {(pendingUser.roles as string[]).map((role: string) => {
                  const labels: Record<string, { label: string; sub: string; color: string }> = {
                    faculty: { label: "Faculty", sub: "Course Teacher", color: "text-white border-white/20" },
                    subject_lead: { label: "Course Lead", sub: "Subject Coordinator", color: "text-insight border-insight/30" },
                    department_head: { label: "HOD", sub: "Head of Department", color: "text-aurora border-aurora/30" },
                    admin: { label: "Admin", sub: "System Administrator", color: "text-alert border-alert/30" },
                  };
                  const meta = labels[role] ?? { label: role, sub: "", color: "text-white border-white/20" };
                  return (
                    <button key={role} onClick={() => handleRoleSelect(role)}
                      className={`flex items-center justify-between px-6 py-4 border transition-all hover:bg-white/5 ${meta.color}`}>
                      <div className="text-left">
                        <p className="font-mono text-sm uppercase tracking-widest">{meta.label}</p>
                        <p className="text-xs text-white/40 font-light mt-0.5">{meta.sub}</p>
                      </div>
                      <ArrowRight className="w-4 h-4 opacity-40" />
                    </button>
                  );
                })}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
