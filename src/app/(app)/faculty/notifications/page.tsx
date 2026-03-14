"use client";

import { useState, useMemo } from "react";
import { motion } from "framer-motion";
import {
  Bell, AlertTriangle, CheckCircle2, Lock, Clock,
  ChevronRight, Trash2, CheckCheck
} from "lucide-react";
import { useRouter } from "next/navigation";
import { AccessGate } from "@/components/auth/AccessGate";
import { useAuthStore } from "@/lib/authStore";
import { useDataStore } from "@/lib/dataStore";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

type FilterType = "all" | "critical" | "success" | "reminder" | "system";

export default function FacultyNotificationsPage() {
  const router = useRouter();
  const { user } = useAuthStore();
  const facultyNotifs      = useDataStore(s => s.facultyNotifications);
  const markRead           = useDataStore(s => s.markFacultyNotifRead);
  const deleteNotif        = useDataStore(s => s.deleteFacultyNotif);
  const markAllRead        = useDataStore(s => s.markAllFacultyNotifsRead);

  const [filter, setFilter] = useState<FilterType>("all");

  const myNotifs = useMemo(
    () => facultyNotifs.filter(n => n.userId === user?.id),
    [facultyNotifs, user]
  );

  const filtered = useMemo(
    () => filter === "all" ? myNotifs : myNotifs.filter(n => n.type === filter),
    [myNotifs, filter]
  );

  const unreadCount = myNotifs.filter(n => !n.read).length;

  const handleClick = (id: string, link: string) => {
    markRead(id);
    router.push(link);
  };

  const FILTER_TABS: { id: FilterType; label: string }[] = [
    { id: "all",      label: `All (${myNotifs.length})` },
    { id: "critical", label: "Critical" },
    { id: "success",  label: "Approved" },
    { id: "reminder", label: "Reminders" },
    { id: "system",   label: "System" },
  ];

  const typeIcon = (type: string) => {
    if (type === "critical") return <AlertTriangle className="w-4 h-4" />;
    if (type === "success")  return <CheckCircle2 className="w-4 h-4" />;
    if (type === "reminder") return <Clock className="w-4 h-4" />;
    return <Lock className="w-4 h-4" />;
  };

  const typeColor = (type: string) => {
    if (type === "critical") return "text-alert";
    if (type === "success")  return "text-attain";
    if (type === "reminder") return "text-amber-400";
    return "text-white/30";
  };

  return (
    <AccessGate feature="notifications" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="max-w-4xl mx-auto flex flex-col gap-0 pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Hub Notifications
            </div>
            <h1 className="text-4xl font-display text-white">Notification Centre</h1>
            <p className="text-white/40 font-light mt-1">
              {unreadCount > 0 ? `${unreadCount} unread alert${unreadCount > 1 ? "s" : ""}` : "All caught up"}
            </p>
          </div>
          {unreadCount > 0 && (
            <button onClick={() => user && markAllRead(user.id)}
              className="flex items-center gap-2 text-[10px] font-mono text-white/40 uppercase tracking-widest hover:text-white transition-colors border border-white/10 px-4 py-2">
              <CheckCheck className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </motion.div>

        {/* Filter tabs */}
        <div className="flex border-b border-white/5">
          {FILTER_TABS.map(tab => (
            <button key={tab.id} onClick={() => setFilter(tab.id)}
              className={`px-5 py-3 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                filter === tab.id ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
              }`}>
              {tab.label}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="flex flex-col divide-y divide-white/5">
          {filtered.length === 0 && (
            <div className="py-24 flex flex-col items-center gap-4 text-white/10">
              <Bell className="w-12 h-12 opacity-10" />
              <p className="text-sm italic">No notifications in this category.</p>
            </div>
          )}

          {filtered.map(n => (
            <motion.div key={n.id} variants={fadeSlideUp}
              className={`flex items-start gap-5 py-5 group cursor-pointer hover:bg-white/[0.01] transition-colors px-2 ${n.read ? "opacity-50" : ""}`}
              onClick={() => handleClick(n.id, n.link)}
            >
              {/* Type indicator */}
              <div className={`mt-0.5 shrink-0 ${typeColor(n.type)}`}>
                {typeIcon(n.type)}
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center justify-between gap-4 mb-1">
                  <h3 className={`text-sm font-display ${n.read ? "text-white/50" : "text-white"}`}>{n.title}</h3>
                  <span className="text-[9px] font-mono text-white/20 uppercase shrink-0">{n.timestamp}</span>
                </div>
                <p className="text-xs text-white/40 leading-relaxed">{n.message}</p>
                {!n.read && (
                  <div className="flex items-center gap-1.5 mt-2 text-brand text-[9px] font-mono uppercase tracking-widest opacity-0 group-hover:opacity-100 transition-opacity">
                    View Detail <ChevronRight className="w-3 h-3" />
                  </div>
                )}
              </div>

              {/* Unread dot */}
              {!n.read && <div className="w-1.5 h-1.5 rounded-full bg-brand mt-2 shrink-0" />}

              {/* Delete */}
              <button
                onClick={e => { e.stopPropagation(); deleteNotif(n.id); }}
                className="p-1.5 text-white/10 hover:text-alert transition-colors opacity-0 group-hover:opacity-100 shrink-0">
                <Trash2 className="w-3.5 h-3.5" />
              </button>
            </motion.div>
          ))}
        </div>

        {/* Smart digest footer */}
        <div className="mt-8 py-6 border-t border-white/5 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Bell className="w-4 h-4 text-brand" />
            <div>
              <p className="text-sm font-display text-white">Smart Digest</p>
              <p className="text-[10px] text-white/30 font-light mt-0.5">Weekly summary of your courses' attainment gaps sent to your email.</p>
            </div>
          </div>
          <button className="px-5 py-2 border border-brand/20 text-brand text-[10px] font-mono uppercase tracking-widest hover:bg-brand/5 transition-colors">
            Configure
          </button>
        </div>
      </motion.div>
    </AccessGate>
  );
}
