"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowRight, Mail, Lock, Eye, EyeOff, Loader2, AlertCircle } from "lucide-react";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";
import { LoginBackground } from "@/components/auth/LoginBackground";
import { useAuthStore } from "@/lib/authStore";

// Demo credential quick-fill for ease of switching roles
const DEMO_CREDS = [
  { role: "Faculty",          color: "text-brand",   email: "faculty@nexus.edu", password: "Faculty@1",  desc: "Course Teacher · Marks & COs" },
  { role: "Course Lead",      color: "text-insight",  email: "lead@nexus.edu",    password: "Lead@123",   desc: "Senior Faculty · Attainment & Approvals" },
  { role: "HOD",              color: "text-aurora",   email: "hod@nexus.edu",     password: "Hod@1234",   desc: "Head of Department · Full Dept View" },
  { role: "Admin",            color: "text-alert",    email: "admin@nexus.edu",   password: "Admin@123",  desc: "System Config · All Departments" },
  { role: "Student",          color: "text-cyan-400", email: "student@nexus.edu", password: "Student@1",  desc: "Enrolled Student · Own Marks & COs" },
];

const DEPARTMENTS = ["Administration", "CSE", "ECE", "MECH", "CIVIL", "IT"];
const ACTIVE_AYS  = ["2024-25", "2023-24", "2022-23"];

export default function LoginPage() {
  const router = useRouter();
  const { login, setActiveRole, setActiveAY, loginError } = useAuthStore();

  const [email, setEmail]         = useState("");
  const [password, setPassword]   = useState("");
  const [dept, setDept]           = useState("");
  const [ay, setAY]               = useState("2024-25");
  const [showPass, setShowPass]   = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [pendingRoles, setPendingRoles]   = useState<string[]>([]);

  const fillDemo = (creds: typeof DEMO_CREDS[0]) => {
    setEmail(creds.email);
    setPassword(creds.password);
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    // Simulate network latency for UX
    await new Promise(r => setTimeout(r, 800));

    const success = login(email, password);
    if (success) {
      const { user } = useAuthStore.getState();
      if (user && user.roles.length > 1) {
        setPendingRoles(user.roles as string[]);
        setShowRoleModal(true);
        setIsLoading(false);
      } else {
        setActiveAY(ay);
        router.push("/dashboard");
      }
    } else {
      setIsLoading(false);
    }
  };

  const handleRoleSelect = (role: string) => {
    setActiveRole(role as any);
    setActiveAY(ay);
    setShowRoleModal(false);
    router.push("/dashboard");
  };

  return (
    <div className="relative min-h-screen bg-cosmic overflow-hidden selection:bg-brand/30 selection:text-white">
      <LoginBackground />

      <div className="relative z-10 min-h-screen flex">
        {/* ── LEFT PANEL ── */}
        <div className="hidden lg:flex flex-col justify-between w-1/2 px-20 py-16">
          <div className="flex items-center gap-3">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-aurora flex items-center justify-center">
              <span className="text-white text-xs font-bold">N</span>
            </div>
            <span className="font-display font-medium text-white tracking-widest uppercase text-sm">Nexus Engine</span>
          </div>

          <div className="flex flex-col gap-8">
            <div className="flex items-center gap-3 text-sm font-mono text-brand uppercase tracking-widest">
              <span className="w-8 h-[1px] bg-brand" />
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

          {/* Demo credential quick-fill */}
          <div className="flex flex-col gap-4">
            <span className="text-[10px] font-mono text-white/20 uppercase tracking-widest">Quick Access — Click to fill credentials</span>
            <div className="grid grid-cols-2 gap-x-8 gap-y-3">
              {DEMO_CREDS.map(c => (
                <button key={c.role} onClick={() => fillDemo(c)}
                  className="flex flex-col gap-1 text-left p-3 -m-3 rounded-lg hover:bg-white/5 cursor-pointer transition-colors border border-transparent hover:border-white/10">
                  <span className={`text-[10px] font-mono uppercase tracking-widest ${c.color}`}>{c.role}</span>
                  <span className="text-white/40 font-light text-xs leading-relaxed">{c.desc}</span>
                </button>
              ))}
            </div>
            <div className="mt-2 pt-4 border-t border-white/10 font-mono text-xs text-white/30">
              Passwords: <span className="text-white/60">Faculty@1 / Lead@123 / Hod@1234 / Admin@123 / Student@1</span>
            </div>
          </div>
        </div>

        {/* ── RIGHT PANEL — Login Form ── */}
        <div className="flex-1 flex items-center justify-center px-8 lg:px-20 py-16">
          <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="w-full max-w-md">

            <div className="flex items-center gap-3 mb-16 lg:hidden">
              <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-brand to-aurora flex items-center justify-center">
                <span className="text-white text-xs font-bold">N</span>
              </div>
              <span className="font-display font-medium text-white tracking-widest uppercase text-sm">Nexus Engine</span>
            </div>

            <motion.div variants={fadeSlideUp} className="mb-14">
              <div className="flex items-center gap-3 text-sm font-mono text-white/30 uppercase tracking-widest mb-6">
                <span className="w-8 h-[1px] bg-white/20" />
                Secure Access
              </div>
              <h2 className="text-4xl font-display text-white">Welcome back.</h2>
            </motion.div>

            <motion.form variants={staggerContainer} onSubmit={handleLogin} className="flex flex-col gap-0">
              {/* Department + AY */}
              <motion.div variants={fadeSlideUp} className="grid grid-cols-2 gap-6 pb-6 border-b border-white/10 mb-6">
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Department</label>
                  <select value={dept} onChange={e => setDept(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none font-light border-none appearance-none w-full cursor-pointer">
                    <option value="" className="bg-[#0a0a0f]">Select</option>
                    {DEPARTMENTS.map(d => <option key={d} value={d} className="bg-[#0a0a0f]">{d}</option>)}
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-xs font-mono text-white/40 uppercase tracking-widest">Academic Year</label>
                  <select value={ay} onChange={e => setAY(e.target.value)}
                    className="bg-transparent text-white text-sm outline-none font-light border-none appearance-none w-full cursor-pointer">
                    {ACTIVE_AYS.map(a => <option key={a} value={a} className="bg-[#0a0a0f]">{a}</option>)}
                  </select>
                </div>
              </motion.div>

              {/* Email */}
              <motion.div variants={fadeSlideUp} className="flex flex-col gap-2 pb-8 border-b border-white/10 mb-8">
                <label className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email
                </label>
                <input type="email" required value={email} onChange={e => setEmail(e.target.value)}
                  placeholder="you@nexus.edu"
                  className="bg-transparent text-white text-xl placeholder-white/20 outline-none w-full font-light" />
              </motion.div>

              {/* Password */}
              <motion.div variants={fadeSlideUp} className="flex flex-col gap-2 pb-8 border-b border-white/10 mb-6">
                <label className="text-xs font-mono text-white/40 uppercase tracking-widest flex items-center gap-2">
                  <Lock className="w-3 h-3" /> Password
                </label>
                <div className="flex items-center gap-4">
                  <input type={showPass ? "text" : "password"} required value={password} onChange={e => setPassword(e.target.value)}
                    placeholder="••••••••••"
                    className="bg-transparent text-white text-xl placeholder-white/20 outline-none flex-1 font-light" />
                  <button type="button" onClick={() => setShowPass(s => !s)} className="text-white/20 hover:text-white/60 transition-colors shrink-0">
                    {showPass ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>
              </motion.div>

              {/* Error */}
              <AnimatePresence>
                {loginError && (
                  <motion.div initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                    className="flex items-center gap-3 text-alert text-sm font-mono mb-6 p-3 bg-alert/5 border border-alert/20">
                    <AlertCircle className="w-4 h-4 shrink-0" /> {loginError}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Submit */}
              <motion.div variants={fadeSlideUp} className="flex items-center justify-between">
                <button type="submit" disabled={isLoading}
                  className="flex items-center gap-3 px-8 py-4 bg-white text-black font-medium text-sm hover:bg-white/90 transition-colors disabled:opacity-50">
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
              New to Nexus Engine?{" "}
              <Link href="/register" className="text-white/60 hover:text-white transition-colors underline-offset-4 hover:underline">Request access →</Link>
            </motion.p>
          </motion.div>
        </div>
      </div>

      {/* ── Dual-Role Modal ── */}
      <AnimatePresence>
        {showRoleModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-8">
            <motion.div initial={{ scale: 0.95 }} animate={{ scale: 1 }}
              className="w-full max-w-md bg-[#0a0a0f] border border-white/10 p-10">
              <p className="text-xs font-mono text-brand uppercase tracking-widest mb-4">Dual-Role Account Detected</p>
              <p className="text-white/50 text-sm mb-6">This account has multiple roles. Select the dashboard to open:</p>
              <div className="flex flex-col gap-3">
                {pendingRoles.map(role => {
                  const meta: Record<string, { label: string; color: string }> = {
                    faculty:         { label: "Faculty Dashboard",   color: "text-brand border-brand/30" },
                    subject_lead:    { label: "Course Lead Dashboard", color: "text-insight border-insight/30" },
                    department_head: { label: "HOD Dashboard",       color: "text-aurora border-aurora/30" },
                    admin:           { label: "Admin Dashboard",     color: "text-alert border-alert/30" },
                    student:         { label: "Student Dashboard",   color: "text-cyan-400 border-cyan-400/30" },
                  };
                  const m = meta[role] ?? { label: role, color: "text-white border-white/20" };
                  return (
                    <button key={role} onClick={() => handleRoleSelect(role)}
                      className={`flex items-center justify-between px-6 py-4 border transition-all hover:bg-white/5 ${m.color}`}>
                      <span className="font-mono text-sm uppercase tracking-widest">{m.label}</span>
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
