"use client";

import { useState, useMemo } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Bell, CheckCircle2, AlertTriangle, Info, Clock, Trash2, Inbox, ArrowUpRight, Check } from "lucide-react";
import Link from "next/link";
import { useDataStore } from "@/lib/dataStore";
import { useAuthStore } from "@/lib/authStore";
import { AccessGate } from "@/components/auth/AccessGate";
import { staggerContainer, fadeSlideUp } from "@/lib/animations";

export default function LeadNotificationsPage() {
  const { user } = useAuthStore();
  const allNotifs          = useDataStore(s => s.facultyNotifications);
  const markRead           = useDataStore(s => s.markFacultyNotifRead);
  const markAllRead        = useDataStore(s => s.markAllFacultyNotifsRead);
  const deleteNotif        = useDataStore(s => s.deleteFacultyNotif);

  const [filter, setFilter] = useState<"all" | "critical" | "reminder" | "success" | "system">("all");

  const notifs = useMemo(() =>
    allNotifs.filter(n =>
      n.userId === user?.id &&
      (filter === "all" || n.type === filter)
    ), [allNotifs, user, filter]);

  const unread = notifs.filter(n => !n.read).length;

  const getIcon = (type: string) => {
    switch (type) {
      case "critical":  return <AlertTriangle className="w-4 h-4 text-alert" />;
      case "reminder":  return <Clock className="w-4 h-4 text-amber-400" />;
      case "success":   return <CheckCircle2 className="w-4 h-4 text-attain" />;
      default:          return <Info className="w-4 h-4 text-brand" />;
    }
  };

  const borderColor = (type: string) => {
    switch (type) {
      case "critical": return "border-l-alert";
      case "reminder": return "border-l-amber-400";
      case "success":  return "border-l-attain";
      default:         return "border-l-brand";
    }
  };

  return (
    <AccessGate feature="notifications" deny="lock">
      <motion.div variants={staggerContainer} initial="hidden" animate="visible" className="flex flex-col gap-0 pb-32">

        {/* Header */}
        <motion.div variants={fadeSlideUp} className="flex justify-between items-end pb-8 border-b border-white/5">
          <div>
            <div className="flex items-center gap-2 text-[10px] font-mono text-brand uppercase tracking-widest mb-3">
              <span className="w-8 h-[1px] bg-brand" /> Coordinator Feed
            </div>
            <h1 className="text-4xl font-display text-white">Alerts & Notifications</h1>
            <p className="text-white/40 font-light mt-1">{unread} unread · {notifs.length} total</p>
          </div>
          {unread > 0 && (
            <button onClick={() => user && markAllRead(user.id)}
              className="px-5 py-2.5 border border-white/10 text-white/40 hover:text-white text-[10px] font-mono uppercase tracking-widest transition-colors flex items-center gap-2">
              <Check className="w-3.5 h-3.5" /> Mark All Read
            </button>
          )}
        </motion.div>

        {/* Filter tabs */}
        <div className="flex border-b border-white/5">
          {(["all", "critical", "reminder", "success", "system"] as const).map(f => (
            <button key={f} onClick={() => setFilter(f)}
              className={`px-5 py-3 text-[10px] font-mono uppercase tracking-widest border-b-2 transition-all ${
                filter === f ? "border-brand text-brand" : "border-transparent text-white/30 hover:text-white"
              }`}>
              {f}
            </button>
          ))}
        </div>

        {/* Notification list */}
        <div className="flex flex-col divide-y divide-white/5">
          {notifs.length === 0 ? (
            <div className="py-32 flex flex-col items-center gap-4 text-white/10">
              <Inbox className="w-12 h-12" />
              <p className="text-sm font-mono uppercase tracking-widest">Inbox empty</p>
            </div>
          ) : (
            <AnimatePresence>
              {notifs.map(n => (
                <motion.div key={n.id} variants={fadeSlideUp} exit={{ opacity: 0, height: 0 }}
                  className={`flex items-start gap-5 py-5 group border-l-2 pl-5 transition-opacity ${borderColor(n.type)} ${n.read ? "opacity-50" : ""}`}>
                  <div className="shrink-0 mt-0.5">{getIcon(n.type)}</div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <p className={`text-sm font-display ${n.read ? "text-white/60" : "text-white"}`}>{n.title}</p>
                        <p className="text-[10px] font-mono text-white/20 uppercase mt-0.5">{n.timestamp}</p>
                      </div>
                      <div className="flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity shrink-0">
                        {!n.read && (
                          <button onClick={() => markRead(n.id)}
                            className="p-1.5 border border-white/10 text-white/30 hover:text-white transition-colors">
                            <Check className="w-3 h-3" />
                          </button>
                        )}
                        <button onClick={() => deleteNotif(n.id)}
                          className="p-1.5 border border-white/10 text-white/30 hover:text-alert transition-colors">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    </div>
                    <p className="text-xs text-white/40 font-light mt-1 leading-relaxed">{n.message}</p>
                    {n.link && (
                      <Link href={n.link}
                        className="inline-flex items-center gap-1.5 text-[10px] font-mono text-brand uppercase tracking-widest mt-2 hover:gap-2 transition-all">
                        Take Action <ArrowUpRight className="w-3 h-3" />
                      </Link>
                    )}
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
        </div>

      </motion.div>
    </AccessGate>
  );
}
