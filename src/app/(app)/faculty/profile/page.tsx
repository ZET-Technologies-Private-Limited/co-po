"use client";

import { useEffect, useMemo, useState } from "react";
import { motion } from "framer-motion";
import {
  User,
  Mail,
  Phone,
  Building2,
  Shield,
  Lock as LockIcon,
  CheckCircle2,
  AlertTriangle,
  Bell,
  Moon,
  Sun,
  Monitor,
  Globe,
  LogOut,
} from "lucide-react";
import { useAuthStore } from "@/lib/authStore";
import { useRouter } from "next/navigation";
import { useUIStore, Language } from "@/lib/uiStore";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

type PasswordStatus = {
  okLength: boolean;
  okUpper: boolean;
  okNumber: boolean;
  okSpecial: boolean;
};

type NotifPref = {
  inApp: boolean;
  email: boolean;
};

type StoredProfilePrefs = {
  phone?: string;
  designationOverride?: string;
  notifPrefs?: Record<string, NotifPref>;
};

const PREFS_KEY = "obe-profile-prefs";

const NOTIF_TYPES = [
  "CO Attainment Alerts",
  "Exam Reminders",
  "System Messages",
  "Student Grievances",
] as const;

function loadPrefs(userId: string | undefined): StoredProfilePrefs {
  if (!userId || typeof window === "undefined") return {};
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    if (!raw) return {};
    const all = JSON.parse(raw) as Record<string, StoredProfilePrefs>;
    return all[userId] || {};
  } catch {
    return {};
  }
}

function savePrefs(userId: string | undefined, prefs: StoredProfilePrefs) {
  if (!userId || typeof window === "undefined") return;
  try {
    const raw = window.localStorage.getItem(PREFS_KEY);
    const all = raw ? (JSON.parse(raw) as Record<string, StoredProfilePrefs>) : {};
    all[userId] = prefs;
    window.localStorage.setItem(PREFS_KEY, JSON.stringify(all));
  } catch {
    // ignore
  }
}

function evalPassword(pwd: string): PasswordStatus {
  return {
    okLength: pwd.length >= 8,
    okUpper: /[A-Z]/.test(pwd),
    okNumber: /\d/.test(pwd),
    okSpecial: /[^A-Za-z0-9]/.test(pwd),
  };
}

export default function FacultyProfilePage() {
  const { user, activeRole, logout } = useAuthStore();
  const router = useRouter();
  const { addToast, darkMode, toggleDarkMode, language, setLanguage } = useUIStore();

  const [phone, setPhone] = useState("");
  const [designation, setDesignation] = useState(user?.designation || "");
  const [editMode, setEditMode] = useState(false);

  const [currentPwd, setCurrentPwd] = useState("");
  const [newPwd, setNewPwd] = useState("");
  const [confirmPwd, setConfirmPwd] = useState("");
  const [pwdMessage, setPwdMessage] = useState<string | null>(null);
  const [pwdError, setPwdError] = useState<string | null>(null);
  const [pwdSaving, setPwdSaving] = useState(false);

  const [notifPrefs, setNotifPrefs] = useState<Record<string, NotifPref>>({});
  const [savingProfile, setSavingProfile] = useState(false);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);

  const initials = useMemo(() => {
    if (!user?.name) return "?";
    const parts = user.name.trim().split(" ");
    if (parts.length === 1) return parts[0][0]?.toUpperCase() || "?";
    return `${parts[0][0] || ""}${parts[parts.length - 1][0] || ""}`.toUpperCase();
  }, [user?.name]);

  useEffect(() => {
    if (!user?.id) return;
    const prefs = loadPrefs(user.id);
    if (prefs.phone) setPhone(prefs.phone);
    if (prefs.designationOverride) setDesignation(prefs.designationOverride);
    if (prefs.notifPrefs) setNotifPrefs(prefs.notifPrefs);
  }, [user?.id]);

  useEffect(() => {
    if (!user?.id) return;
    const base: Record<string, NotifPref> = {};
    NOTIF_TYPES.forEach((t) => {
      base[t] = notifPrefs[t] || { inApp: true, email: true };
    });
    setNotifPrefs(base);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user?.id]);

  const pwdStatus = evalPassword(newPwd);
  const pwdStrength = useMemo(() => {
    const score = Object.values(pwdStatus).filter(Boolean).length;
    if (!newPwd) return { label: "Enter a password", color: "text-white/40", width: "0%" };
    if (score <= 2) return { label: "Weak", color: "text-alert", width: "33%" };
    if (score === 3) return { label: "Medium", color: "text-amber-400", width: "66%" };
    return { label: "Strong", color: "text-attain", width: "100%" };
  }, [pwdStatus, newPwd]);

  const handleSaveProfile = () => {
    if (!user?.id) return;
    const prefs: StoredProfilePrefs = {
      phone: phone.trim(),
      designationOverride: designation.trim(),
      notifPrefs,
    };
    savePrefs(user.id, prefs);
    setSavingProfile(true);
    setTimeout(() => {
      setSavingProfile(false);
      setSaveMessage("Profile updated for this device.");
      setTimeout(() => setSaveMessage(null), 2500);
    }, 400);
  };

  const handleToggleNotif = (type: string, key: "inApp" | "email") => {
    setNotifPrefs((prev) => ({
      ...prev,
      [type]: { ...prev[type], [key]: !prev[type][key] },
    }));
  };

  const handleThemeChange = (mode: "light" | "dark" | "system") => {
    if (mode === "system") {
      const prefersDark =
        typeof window !== "undefined" &&
        window.matchMedia &&
        window.matchMedia("(prefers-color-scheme: dark)").matches;
      if (darkMode !== prefersDark) toggleDarkMode();
      addToast("Theme synced with system preference.", "info");
      return;
    }
    const wantDark = mode === "dark";
    if (wantDark !== darkMode) toggleDarkMode();
    addToast(`Theme set to ${mode === "dark" ? "Dark" : "Light"} mode.`, "success");
  };

  const handleChangePassword = async () => {
    setPwdError(null);
    setPwdMessage(null);
    if (!user) return;
    if (!newPwd || newPwd !== confirmPwd) {
      setPwdError("New password and confirmation do not match.");
      return;
    }
    const status = evalPassword(newPwd);
    if (!Object.values(status).every(Boolean)) {
      setPwdError("Password does not meet all requirements.");
      return;
    }
    setPwdSaving(true);
    try {
      const stored = window.localStorage.getItem("obe-ai-data-store");
      if (!stored) {
        setPwdError("Cannot locate user store.");
        return;
      }
      const parsed = JSON.parse(stored);
      const users = (parsed?.state?.users || []) as any[];
      const idx = users.findIndex((u) => u.id === user.id);
      if (idx === -1) {
        setPwdError("User record not found.");
        return;
      }
      if (users[idx].password !== currentPwd) {
        setPwdError("Current password is incorrect.");
        return;
      }
      users[idx] = { ...users[idx], password: newPwd };
      parsed.state.users = users;
      window.localStorage.setItem("obe-ai-data-store", JSON.stringify(parsed));
      setPwdMessage("Password updated. Use the new password on next login.");
      setCurrentPwd("");
      setNewPwd("");
      setConfirmPwd("");
    } catch {
      setPwdError("Password update failed. Please try again.");
    } finally {
      setPwdSaving(false);
    }
  };

  const handleLogout = () => {
    logout();
    router.push("/login");
  };

  if (!user || activeRole !== "faculty") {
    return (
      <div className="w-full min-h-[60vh] flex flex-col items-center justify-center p-8 text-center">
        <AlertTriangle className="w-10 h-10 text-alert mb-4" />
        <p className="text-sm text-white/60">
          Faculty profile is only available when logged in as Faculty.
        </p>
      </div>
    );
  }

  return (
    <motion.div
      variants={staggerContainer}
      initial="hidden"
      animate="visible"
      className="max-w-5xl mx-auto pb-32"
    >
      {/* HEADER */}
      <motion.div
        variants={fadeSlideUp}
        className="mb-10 border-b border-white/10 pb-8 flex flex-col md:flex-row md:items-end gap-8"
      >
        <div className="w-28 h-28 rounded-full bg-gradient-to-br from-brand via-aurora to-insight p-[3px] shrink-0">
          <div className="w-full h-full bg-cosmic rounded-full flex items-center justify-center">
            <span className="text-3xl md:text-4xl font-display text-white">
              {initials}
            </span>
          </div>
        </div>
        <div className="flex-1">
          <h1 className="text-3xl md:text-4xl font-display text-white">
            {user.name}
          </h1>
          <p className="text-white/50 text-sm mt-1">
            {designation || "Faculty Member"} · {user.department || "Department"}
          </p>
          <div className="flex flex-wrap items-center gap-2 mt-3">
            <span className="px-2 py-0.5 bg-white/10 border border-white/20 text-[10px] font-mono uppercase tracking-widest text-white">
              {user.employeeId || user.id}
            </span>
            <span className="px-2 py-0.5 bg-brand/10 border border-brand/30 text-[10px] font-mono uppercase tracking-widest text-brand flex items-center gap-1.5">
              <Shield className="w-3 h-3" /> Faculty
            </span>
          </div>
        </div>
        <div className="shrink-0 flex flex-col gap-2 items-end">
          <button
            onClick={handleLogout}
            className="px-5 py-2 border border-alert/40 text-alert hover:bg-alert hover:text-white transition-colors text-[10px] font-mono uppercase tracking-widest flex items-center gap-2 rounded"
          >
            <LogOut className="w-3.5 h-3.5" /> Logout
          </button>
        </div>
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* PROFILE INFO + PASSWORD */}
        <div className="flex flex-col gap-8">
          {/* Profile Info */}
          <motion.section variants={fadeSlideUp} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
                <User className="w-3.5 h-3.5" /> Profile Information
              </div>
              <button
                onClick={() => setEditMode((v) => !v)}
                className="text-[10px] font-mono uppercase tracking-widest text-brand hover:text-white transition-colors"
              >
                {editMode ? "Cancel" : "Edit"}
              </button>
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <Mail className="w-3 h-3" /> Email
                </p>
                <p className="text-sm text-white mt-1">{user.email}</p>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                  <Building2 className="w-3 h-3" /> Department
                </p>
                <p className="text-sm text-white mt-1">{user.department || "N/A"}</p>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
                    <Phone className="w-3 h-3" /> Phone
                  </p>
                  {editMode ? (
                    <input
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      className="mt-1 w-full bg-transparent border-b border-white/20 focus:border-brand text-sm text-white outline-none py-1"
                      placeholder="Add contact number"
                    />
                  ) : (
                    <p className="text-sm text-white mt-1">
                      {phone || <span className="text-white/30">Not provided</span>}
                    </p>
                  )}
                </div>
                <div>
                  <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest">
                    Designation
                  </p>
                  {editMode ? (
                    <input
                      value={designation}
                      onChange={(e) => setDesignation(e.target.value)}
                      className="mt-1 w-full bg-transparent border-b border-white/20 focus:border-brand text-sm text-white outline-none py-1"
                      placeholder="Assistant Professor, etc."
                    />
                  ) : (
                    <p className="text-sm text-white mt-1">
                      {designation || <span className="text-white/30">Not set</span>}
                    </p>
                  )}
                </div>
              </div>
            </div>
            <div className="pt-4 border-t border-white/5 flex items-center justify-between">
              <button
                onClick={handleSaveProfile}
                className="px-4 py-2 bg-brand text-white rounded text-[10px] font-mono uppercase tracking-widest hover:bg-brand/80 transition-colors disabled:opacity-50"
                disabled={savingProfile}
              >
                {savingProfile ? "Saving…" : "Save Profile"}
              </button>
              {saveMessage && (
                <p className="text-[10px] font-mono text-attain uppercase tracking-widest flex items-center gap-1">
                  <CheckCircle2 className="w-3 h-3" /> {saveMessage}
                </p>
              )}
            </div>
          </motion.section>

          {/* Change Password */}
          <motion.section variants={fadeSlideUp} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
              <LockIcon className="w-3.5 h-3.5" /> Change Password
            </div>
            <div className="space-y-3">
              <input
                type="password"
                value={currentPwd}
                onChange={(e) => setCurrentPwd(e.target.value)}
                placeholder="Current Password"
                className="w-full bg-transparent border-b border-white/20 focus:border-brand text-sm text-white outline-none py-2 placeholder:text-white/30"
              />
              <input
                type="password"
                value={newPwd}
                onChange={(e) => setNewPwd(e.target.value)}
                placeholder="New Password"
                className="w-full bg-transparent border-b border-white/20 focus:border-brand text-sm text-white outline-none py-2 placeholder:text-white/30"
              />
              <div className="h-1 bg-white/5 rounded-full overflow-hidden mt-1">
                <div
                  className={`h-full ${
                    pwdStrength.color === "text-attain"
                      ? "bg-attain"
                      : pwdStrength.color === "text-amber-400"
                      ? "bg-amber-400"
                      : pwdStrength.color === "text-alert"
                      ? "bg-alert"
                      : "bg-white/10"
                  }`}
                  style={{ width: pwdStrength.width }}
                />
              </div>
              <p className={`text-[10px] font-mono ${pwdStrength.color}`}>
                {pwdStrength.label}
              </p>
              <input
                type="password"
                value={confirmPwd}
                onChange={(e) => setConfirmPwd(e.target.value)}
                placeholder="Confirm New Password"
                className="w-full bg-transparent border-b border-white/20 focus:border-brand text-sm text-white outline-none py-2 placeholder:text-white/30"
              />
            </div>
            <ul className="mt-3 space-y-1 text-[11px]">
              <li
                className={`flex items-center gap-2 ${
                  pwdStatus.okLength ? "text-attain" : "text-white/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" /> Minimum 8
                characters
              </li>
              <li
                className={`flex items-center gap-2 ${
                  pwdStatus.okUpper ? "text-attain" : "text-white/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" /> At least 1
                uppercase letter
              </li>
              <li
                className={`flex items-center gap-2 ${
                  pwdStatus.okNumber ? "text-attain" : "text-white/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" /> At least 1
                number
              </li>
              <li
                className={`flex items-center gap-2 ${
                  pwdStatus.okSpecial ? "text-attain" : "text-white/40"
                }`}
              >
                <span className="w-2 h-2 rounded-full bg-current" /> At least 1
                special character
              </li>
            </ul>
            {pwdError && (
              <p className="text-[11px] text-alert mt-2 flex items-center gap-1">
                <AlertTriangle className="w-3 h-3" /> {pwdError}
              </p>
            )}
            {pwdMessage && (
              <p className="text-[11px] text-attain mt-2 flex items-center gap-1">
                <CheckCircle2 className="w-3 h-3" /> {pwdMessage}
              </p>
            )}
            <div className="pt-3">
              <button
                onClick={handleChangePassword}
                disabled={pwdSaving}
                className="px-4 py-2 bg-brand text-white rounded text-[10px] font-mono uppercase tracking-widest hover:bg-brand/80 transition-colors disabled:opacity-50"
              >
                {pwdSaving ? "Updating…" : "Update Password"}
              </button>
            </div>
          </motion.section>
        </div>

        {/* PREFERENCES, NOTIFICATIONS, SESSIONS */}
        <div className="flex flex-col gap-8">
          {/* Notification Preferences */}
          <motion.section variants={fadeSlideUp} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
              <Bell className="w-3.5 h-3.5" /> Notification Preferences
            </div>
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-white/10 text-white/30">
                  <th className="py-2">Notification Type</th>
                  <th className="py-2 text-center">In-App</th>
                  <th className="py-2 text-center">Email</th>
                </tr>
              </thead>
              <tbody>
                {NOTIF_TYPES.map((t) => (
                  <tr key={t} className="border-b border-white/5 last:border-0">
                    <td className="py-2 pr-2 text-white/70">{t}</td>
                    <td className="py-2 text-center">
                      <input
                        type="checkbox"
                        checked={notifPrefs[t]?.inApp ?? true}
                        onChange={() => handleToggleNotif(t, "inApp")}
                      />
                    </td>
                    <td className="py-2 text-center">
                      <input
                        type="checkbox"
                        checked={notifPrefs[t]?.email ?? true}
                        onChange={() => handleToggleNotif(t, "email")}
                      />
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </motion.section>

          {/* Theme & Language */}
          <motion.section variants={fadeSlideUp} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-5">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
              <Monitor className="w-3.5 h-3.5" /> Display & Language
            </div>
            <div className="space-y-4">
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1">
                  Theme
                </p>
                <select
                  onChange={(e) =>
                    handleThemeChange(e.target.value as "light" | "dark" | "system")
                  }
                  defaultValue={darkMode ? "dark" : "light"}
                  className="w-full bg-transparent border border-white/20 text-xs text-white/80 font-mono uppercase tracking-widest px-3 py-2 rounded outline-none focus:border-brand"
                >
                  <option value="light" className="bg-cosmic">
                    Light
                  </option>
                  <option value="dark" className="bg-cosmic">
                    Dark
                  </option>
                  <option value="system" className="bg-cosmic">
                    System
                  </option>
                </select>
              </div>
              <div>
                <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest mb-1 flex items-center gap-2">
                  <Globe className="w-3 h-3" /> Language
                </p>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value as Language)}
                  className="w-full bg-transparent border border-white/20 text-xs text-white/80 font-mono uppercase tracking-widest px-3 py-2 rounded outline-none focus:border-brand"
                >
                  <option value="en" className="bg-cosmic">
                    English
                  </option>
                  <option value="hi" className="bg-cosmic">
                    Regional
                  </option>
                </select>
              </div>
            </div>
          </motion.section>

          {/* Active Sessions */}
          <motion.section variants={fadeSlideUp} className="bg-white/[0.02] border border-white/10 rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest">
              <Monitor className="w-3.5 h-3.5" /> Active Sessions
            </div>
            <table className="w-full text-left border-collapse text-[11px]">
              <thead>
                <tr className="border-b border-white/10 text-white/30">
                  <th className="py-2">Device</th>
                  <th className="py-2">Last Active</th>
                  <th className="py-2">Location</th>
                  <th className="py-2 text-right">Action</th>
                </tr>
              </thead>
              <tbody>
                <tr className="border-b border-white/10 last:border-0">
                  <td className="py-2 pr-2 text-white/70">
                    {typeof navigator !== "undefined"
                      ? navigator.userAgent.split(")").at(0) || "This Device"
                      : "This Device"}
                  </td>
                  <td className="py-2 text-white/50">Just now</td>
                  <td className="py-2 text-white/40">This browser</td>
                  <td className="py-2 text-right">
                    <button
                      onClick={handleLogout}
                      className="text-[10px] font-mono text-alert hover:text-white uppercase tracking-widest"
                    >
                      Log out this device
                    </button>
                  </td>
                </tr>
              </tbody>
            </table>
            <button
              onClick={() =>
                addToast("Only this device is active in this demo.", "info")
              }
              className="mt-3 text-[10px] font-mono text-white/40 hover:text-white uppercase tracking-widest text-left"
            >
              Log out all other devices
            </button>
          </motion.section>
        </div>
      </div>
    </motion.div>
  );
}

