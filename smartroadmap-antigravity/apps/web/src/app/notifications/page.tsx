"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { motion, AnimatePresence, useReducedMotion } from "framer-motion";
import { useApp } from "@/components/AppContext";
import { toast } from "react-toastify";
import { apiFetch, hasSession } from "@/lib/api";

// ─── Notification type → icon + accent color ───────────────────────────────
const TYPE_META: Record<string, { icon: string; ring: string; dot: string; bg: string }> = {
  general: { icon: "lni-bell", ring: "ring-slate-200", dot: "bg-slate-400", bg: "bg-slate-100 text-slate-500" },
  quiz_reminder: { icon: "lni-clipboard", ring: "ring-amber-200", dot: "bg-amber-500", bg: "bg-amber-100 text-amber-600" },
  job_interview: { icon: "lni-briefcase", ring: "ring-purple-200", dot: "bg-purple-500", bg: "bg-purple-100 text-purple-600" },
  achievement: { icon: "lni-trophy", ring: "ring-yellow-200", dot: "bg-yellow-500", bg: "bg-yellow-100 text-yellow-600" },
  module_unlock: { icon: "lni-unlock", ring: "ring-emerald-200", dot: "bg-emerald-500", bg: "bg-emerald-100 text-emerald-600" },
  study_session: { icon: "lni-alarm-clock", ring: "ring-indigo-200", dot: "bg-indigo-500", bg: "bg-indigo-100 text-indigo-600" },
  job_match: { icon: "lni-target", ring: "ring-pink-200", dot: "bg-pink-500", bg: "bg-pink-100 text-pink-600" },
};
const typeMeta = (type: string) => TYPE_META[type] ?? TYPE_META.general;

// ─── Copy dictionary ────────────────────────────────────────────────────────
const dict = {
  title: { en: "Notification Center", ar: "مركز التنبيهات" },
  subtitle: { en: "Stay updated with your career progress and messages.", ar: "تابع تقدمك المهني ورسائلك أولاً بأول." },
  all: { en: "All", ar: "الكل" },
  unread: { en: "Unread", ar: "غير مقروءة" },
  markAll: { en: "Mark all as read", ar: "تحديد الكل كمقروء" },
  empty: { en: "You have no notifications.", ar: "ليس لديك أي تنبيهات حالياً." },
  emptyUnread: { en: "You're all caught up.", ar: "لا يوجد لديك أي تنبيهات غير مقروءة." },
  delete: { en: "Delete", ar: "حذف" },
  open: { en: "Open", ar: "فتح" },
  back: { en: "Back to Dashboard", ar: "العودة للوحة التحكم" },
  markAllToast: { en: "All notifications marked as read.", ar: "تم تحديد كافة التنبيهات كمقروءة." },
  deleteToast: { en: "Notification deleted.", ar: "تم حذف التنبيه." },
};
type DictKey = keyof typeof dict;

export default function NotificationsPage() {
  const { locale } = useApp();
  const isAr = locale === "ar";
  const tr = (key: DictKey) => dict[key][isAr ? "ar" : "en"];
  const prefersReducedMotion = useReducedMotion();

  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "unread">("all");

  const fetchNotifications = async () => {
    const token = hasSession();
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await apiFetch("/notifications", {});
      if (res.ok) {
        const body = await res.json();
        setNotifications(body.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch(`/notifications/${id}/read`, { method: "PATCH" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => (n._id === id ? { ...n, read: true } : n)));
      }
    } catch (e) { }
  };

  const handleMarkAllRead = async () => {
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch("/notifications/read-all", { method: "POST" });
      if (res.ok) {
        setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
        toast.success(tr("markAllToast"));
      }
    } catch (e) { }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch(`/notifications/${id}`, { method: "DELETE" });
      if (res.ok) {
        setNotifications((prev) => prev.filter((n) => n._id !== id));
        toast.success(tr("deleteToast"));
      }
    } catch (e) { }
  };

  const filteredNotifications = notifications.filter((n) => (filter === "unread" ? !n.read : true));
  const unreadCount = notifications.filter((n) => !n.read).length;

  const formatDate = (d: string) =>
    new Date(d).toLocaleDateString(isAr ? "ar-EG" : "en-US", { month: "short", day: "numeric" });
  const formatTime = (d: string) =>
    new Date(d).toLocaleTimeString(isAr ? "ar-EG" : "en-US", { hour: "2-digit", minute: "2-digit" });

  return (
    <div dir={isAr ? "rtl" : "ltr"} className="min-h-screen bg-base-100 text-base-content pb-12 px-4 sm:px-6 lg:px-8 text-start font-sans">
      <div className="max-w-3xl mx-auto space-y-6 pt-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-300 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight flex items-center gap-2">
              <i className="lni lni-bell text-indigo-600" />
              {tr("title")}
            </h1>
            <p className="text-xs text-base-content/50 mt-1">{tr("subtitle")}</p>
          </div>
          <div className="flex gap-2">
            <Link
              href="/dashboard"
              className="btn btn-outline border-base-300 btn-xs sm:btn-sm rounded-lg text-xs font-bold gap-1.5"
            >
              <i className={isAr ? "lni lni-arrow-right" : "lni lni-arrow-left"} />
              {tr("back")}
            </Link>
            {unreadCount > 0 && (
              <motion.button
                whileTap={prefersReducedMotion ? undefined : { scale: 0.96 }}
                onClick={handleMarkAllRead}
                className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-xs sm:btn-sm rounded-lg text-xs font-bold gap-1.5"
              >
                <i className="lni lni-checkmark-circle" />
                {tr("markAll")}
              </motion.button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-base-300 pb-3">
          <button
            onClick={() => setFilter("all")}
            className={`btn btn-xs rounded-full font-bold uppercase tracking-wider ${filter === "all" ? "bg-indigo-600 text-white border-none" : "btn-ghost text-base-content/60"}`}
          >
            {tr("all")} ({notifications.length})
          </button>
          <button
            onClick={() => setFilter("unread")}
            className={`btn btn-xs rounded-full font-bold uppercase tracking-wider ${filter === "unread" ? "bg-indigo-600 text-white border-none" : "btn-ghost text-base-content/60"}`}
          >
            {tr("unread")} ({unreadCount})
          </button>
        </div>

        {/* ── Loading skeletons ── */}
        {loading && (
          <div className="space-y-4 pt-2">
            {[0, 1, 2, 3].map((i) => (
              <div key={i} className="flex gap-4">
                <div className="skeleton w-3 h-3 rounded-full shrink-0 mt-2" />
                <div className="flex-1 space-y-2">
                  <div className="skeleton h-4 w-1/3 rounded" />
                  <div className="skeleton h-3 w-2/3 rounded" />
                  <div className="skeleton h-3 w-1/4 rounded" />
                </div>
              </div>
            ))}
          </div>
        )}

        {/* ── Timeline list ── */}
        {!loading && (
          <div className="relative">
            {filteredNotifications.length === 0 ? (
              <motion.div
                initial={prefersReducedMotion ? undefined : { opacity: 0, y: 8 }}
                animate={prefersReducedMotion ? undefined : { opacity: 1, y: 0 }}
                className="bg-base-200 border border-base-300 rounded-2xl p-12 text-center"
              >
                <div className="w-14 h-14 bg-indigo-600/10 text-indigo-600 rounded-full flex items-center justify-center mx-auto text-2xl">
                  <i className="lni lni-alarm-clock" />
                </div>
                <p className="text-xs text-base-content/50 font-bold mt-3">
                  {filter === "unread" ? tr("emptyUnread") : tr("empty")}
                </p>
              </motion.div>
            ) : (
              <div className="relative ps-1">
                {/* connecting vertical line */}
                <div className="absolute top-2 bottom-2 start-[9px] w-px bg-base-300" />

                <ul className="space-y-3">
                  <AnimatePresence initial={false}>
                    {filteredNotifications.map((n, i) => {
                      const meta = typeMeta(n.type);
                      return (
                        <motion.li
                          key={n._id}
                          layout
                          initial={prefersReducedMotion ? undefined : { opacity: 0, x: isAr ? 12 : -12 }}
                          animate={prefersReducedMotion ? undefined : { opacity: 1, x: 0 }}
                          exit={prefersReducedMotion ? undefined : { opacity: 0, height: 0, marginBottom: 0 }}
                          transition={{ duration: 0.25, delay: prefersReducedMotion ? 0 : Math.min(i, 6) * 0.03 }}
                          className="relative flex gap-4"
                        >
                          {/* timeline dot */}
                          <div className="relative z-10 shrink-0 pt-2">
                            <span className={`block w-[19px] h-[19px] rounded-full ${meta.dot} ring-4 ring-base-100`} />
                          </div>

                          {/* card */}
                          <div
                            onClick={() => handleMarkRead(n._id)}
                            className={`flex-1 card bg-base-200 border border-base-300 p-4 rounded-xl flex flex-row items-start justify-between gap-4 cursor-pointer hover:bg-base-300/60 transition-all ${!n.read ? "border-indigo-600/30 bg-indigo-600/5" : ""}`}
                          >
                            <div className="flex gap-3 flex-grow min-w-0">
                              <div className={`w-9 h-9 rounded-full flex items-center justify-center text-base shrink-0 ${meta.bg}`}>
                                <i className={`lni ${meta.icon}`} />
                              </div>
                              <div className="space-y-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <h3 className="font-extrabold text-sm text-base-content truncate">
                                    {isAr ? n.titleAr || n.titleEn : n.titleEn}
                                  </h3>
                                  {!n.read && <span className="w-1.5 h-1.5 bg-indigo-600 rounded-full shrink-0" />}
                                </div>
                                <p className="text-xs text-base-content/70 leading-relaxed">
                                  {isAr ? n.contentAr || n.contentEn : n.contentEn}
                                </p>
                                <div className="flex gap-2 items-center text-[9px] text-base-content/40 font-mono mt-1">
                                  <span>{formatDate(n.createdAt)}</span>
                                  <span>•</span>
                                  <span>{formatTime(n.createdAt)}</span>
                                  {n.type !== "general" && (
                                    <>
                                      <span>•</span>
                                      <span className="uppercase text-indigo-600 font-black">{n.type.replace("_", " ")}</span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            <div className="flex items-center gap-2 shrink-0">
                              {n.link && (
                                <Link
                                  href={n.link}
                                  onClick={(e) => e.stopPropagation()}
                                  className="btn btn-outline border-indigo-600 hover:bg-indigo-600 hover:text-white btn-xs rounded px-2 gap-1"
                                >
                                  <i className="lni lni-arrow-top-right" />
                                  {tr("open")}
                                </Link>
                              )}
                              <button
                                onClick={(e) => handleDelete(n._id, e)}
                                className="btn btn-ghost hover:bg-error/10 text-error btn-xs btn-circle"
                                title={tr("delete")}
                              >
                                <i className="lni lni-trash-can text-sm" />
                              </button>
                            </div>
                          </div>
                        </motion.li>
                      );
                    })}
                  </AnimatePresence>
                </ul>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}