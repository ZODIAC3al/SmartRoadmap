"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useApp } from "@/components/AppContext";
import { apiFetch, getCachedUser, hasSession, logout } from "@/lib/api";

// Crisp SVG Icons representing OS Platforms for PWA download
const WindowsIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="currentColor">
    <path d="M0 3.449L9.75 2.1v9.45H0V3.449zM0 12.45h9.75v9.45L0 20.551v-8.1zM10.8 1.95L24 0v11.55H10.8V1.95zM10.8 12.45H24v11.55l-13.2-1.95v-9.6z" />
  </svg>
);

const AppleIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="currentColor">
    <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M15.97 4.17c.66-.81 1.11-1.93.99-3.06-1 .04-2.22.67-2.94 1.5-.64.73-1.2 1.87-1.05 2.98 1.12.09 2.27-.56 3-1.42z" />
  </svg>
);

const LinuxIcon = () => (
  <svg viewBox="0 0 24 24" className="w-4 h-4 text-current" fill="currentColor">
    <path d="M12 2a5 5 0 00-5 5c0 1.23.47 2.37 1.23 3.23C6.34 11.23 5 13.46 5 16v1a2 2 0 002 2h10a2 2 0 002-2v-1c0-2.54-1.34-4.77-3.23-5.77C16.53 9.37 17 8.23 17 7a5 5 0 00-5-5zm0 1.5a3.5 3.5 0 110 7 3.5 3.5 0 010-7zM7 16h10c0-1.93-1.57-3.5-3.5-3.5S10 14.07 10 16H7z" />
  </svg>
);

const MobileIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <rect x="6" y="2" width="12" height="20" rx="2" />
    <path
      d="M12 18h.01"
      strokeLinecap="round"
      strokeLinejoin="round"
      strokeWidth="3"
    />
  </svg>
);

const DownloadAppIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    viewBox="0 0 24 24"
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, locale, toggleLocale, t } = useApp();
  const [user, setUser] = useState<{
    name: string;
    email: string;
    role: string;
    avatarUrl?: string;
  } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  // Notifications states & handlers
  const [notifications, setNotifications] = useState<any[]>([]);
  const [unreadNotificationsCount, setUnreadNotificationsCount] = useState(0);

  const fetchNotifications = async () => {
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch("/notifications", {});
      if (res.ok) {
        const body = await res.json();
        const data = body.data || [];
        setNotifications(data);
        setUnreadNotificationsCount(data.filter((n: any) => !n.read).length);
      }
    } catch (e) {}
  };

  const handleMarkAllNotificationsRead = async () => {
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch("/notifications/read-all", {
        method: "POST",
      });
      if (res.ok) {
        fetchNotifications();
      }
    } catch (e) {}
  };

  const handleMarkNotificationRead = async (id: string, link?: string) => {
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch(`/notifications/${id}/read`, {
        method: "PATCH",
      });
      if (res.ok) {
        fetchNotifications();
        if (link) {
          router.push(link);
        }
      }
    } catch (e) {}
  };

  // PWA installer hooks
  const [deferredPrompt, setDeferredPrompt] = useState<any>(null);
  const [isInstallable, setIsInstallable] = useState(false);
  const [os, setOs] = useState<
    "windows" | "macos" | "linux" | "ios" | "android" | "other"
  >("other");
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    const handleUserUpdate = () => {
      const storedUser = getCachedUser();
      const storedToken = hasSession();
      if (storedUser && storedToken) {
        setUser(storedUser);
      } else {
        setUser(null);
      }
    };

    handleUserUpdate();
    if (typeof window !== "undefined") {
      window.addEventListener("user-updated", handleUserUpdate);
    }

    setMobileOpen(false);

    // Detect OS
    if (typeof window !== "undefined") {
      const ua = window.navigator.userAgent.toLowerCase();
      if (ua.includes("win")) setOs("windows");
      else if (ua.includes("mac") && !("ontouchend" in document))
        setOs("macos");
      else if (ua.includes("linux")) setOs("linux");
      else if (
        ua.includes("iphone") ||
        ua.includes("ipad") ||
        (ua.includes("mac") && "ontouchend" in document)
      )
        setOs("ios");
      else if (ua.includes("android")) setOs("android");
    }

    const handleBeforePrompt = (e: any) => {
      e.preventDefault();
      setDeferredPrompt(e);
      setIsInstallable(true);
    };

    window.addEventListener("beforeinstallprompt", handleBeforePrompt);

    // Check if PWA is standalone
    if (
      typeof window !== "undefined" &&
      window.matchMedia("(display-mode: standalone)").matches
    ) {
      setIsInstallable(false);
    }

    return () => {
      window.removeEventListener("beforeinstallprompt", handleBeforePrompt);
      if (typeof window !== "undefined") {
        window.removeEventListener("user-updated", handleUserUpdate);
      }
    };
  }, [pathname]);

  useEffect(() => {
    if (user) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 10000);
      return () => clearInterval(interval);
    } else {
      setNotifications([]);
      setUnreadNotificationsCount(0);
    }
  }, [user]);

  const handleInstallClick = () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      deferredPrompt.userChoice.then((choiceResult: any) => {
        if (choiceResult.outcome === "accepted") {
          console.log("PWA installation accepted");
          setIsInstallable(false);
        }
        setDeferredPrompt(null);
      });
    } else {
      setShowModal(true);
    }
  };

  const handleLogout = () => {
    logout();
    setUser(null);
    router.push("/");
  };

  if (pathname.startsWith("/auth")) {
    return null;
  }

  const isLinkActive = (path: string) => pathname === path;

  const navLinks = [
    { href: "/roadmap", label: t("nav.roadmap"), show: !!user },
    { href: "/cv", label: t("nav.cv"), show: !!user },
    {
      href: "/hiring",
      label: t("nav.jobsMatch"),
      show: !!user && user?.role === "learner",
    },
    {
      href: "/company",
      label: t("nav.talentBoard"),
      show: !!user && user?.role === "company",
    },
    { href: "/pricing", label: t("nav.pricing"), show: true },
    { href: "/contact", label: t("nav.contact"), show: true },
  ];

  return (
    <header className="sticky top-4 z-50 px-4 w-full">
      <div className="max-w-5xl mx-auto rounded-full bg-base-200/90 backdrop-blur-md text-base-content border border-base-300 shadow-lg px-3 sm:px-6 h-14 flex items-center justify-between gap-2 sm:gap-4 transition-all duration-200">
        {/* Logo (Mockup Style: Planet circle) */}
        <Link href="/" className="flex items-center gap-2 shrink-0">
          <img
            src="/logo.svg"
            alt="SmartRoadmap Logo"
            className="w-8 h-8 sm:w-9 sm:h-9 hover:scale-105 transition-transform duration-200"
          />
          <span className="hidden sm:inline font-black tracking-tight text-sm text-base-content">
            {t("nav.logo")}
          </span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 text-[11px] font-bold uppercase tracking-wider flex-1 justify-center">
          {navLinks
            .filter((l) => l.show)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`transition-colors hover:text-[#10B981] ${
                  isLinkActive(link.href)
                    ? "text-[#10B981] font-black"
                    : "text-base-content/65"
                }`}
              >
                {link.label}
              </Link>
            ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-1.5 sm:gap-2 shrink-0">
          {/* Language Selector Button */}
          <button
            onClick={toggleLocale}
            className="btn btn-ghost btn-xs text-base-content/85 font-black tracking-wide hover:bg-base-300 px-2 rounded-lg"
            title={locale === "en" ? "Switch to Arabic" : "تغيير للإنجليزية"}
          >
            {locale === "en" ? "AR" : "EN"}
          </button>

          {/* Theme Selector Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle btn-xs text-base-content/85 hover:bg-base-300"
            title={theme === "smartlight" ? "Dark Mode" : "Light Mode"}
          >
            {theme === "smartlight" ? (
              // Moon Icon
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
                />
              </svg>
            ) : (
              // Sun Icon
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z"
                />
              </svg>
            )}
          </button>

          {/* Localized PWA App Installation Trigger - hidden on xs */}
          <button
            onClick={handleInstallClick}
            className="hidden xs:flex btn btn-ghost btn-circle btn-xs text-base-content/85 hover:bg-base-300 items-center justify-center relative group"
            title={
              locale === "en"
                ? `Download Standalone App (${os.toUpperCase()})`
                : `تحميل التطبيق المستقل (${os.toUpperCase()})`
            }
          >
            {os === "windows" && <WindowsIcon />}
            {os === "macos" && <AppleIcon />}
            {os === "linux" && <LinuxIcon />}
            {(os === "ios" || os === "android") && <MobileIcon />}
            {os === "other" && <DownloadAppIcon />}

            {/* Install Badge if installable natively */}
            {isInstallable && (
              <span className="absolute -top-0.5 -right-0.5 w-1.5 h-1.5 bg-emerald-500 rounded-full animate-ping"></span>
            )}
          </button>

          {/* Interactive Notifications Dropdown - hidden on xs */}
          {user && (
            <div className="hidden xs:block dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-ghost btn-circle btn-xs text-base-content/85 hover:bg-base-300 flex items-center justify-center relative cursor-pointer"
              >
                <BellIcon />
                {unreadNotificationsCount > 0 && (
                  <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full animate-pulse"></span>
                )}
              </label>

              <div
                tabIndex={0}
                className="dropdown-content mt-3 z-[150] p-4 shadow-xl bg-base-200 text-base-content border border-base-300 rounded-2xl w-72 sm:w-96 space-y-3 font-sans"
              >
                <div className="flex justify-between items-center border-b border-base-300 pb-2">
                  <h4 className="font-extrabold text-xs">
                    {locale === "en" ? "Notifications" : "التنبيهات"}
                  </h4>
                  {unreadNotificationsCount > 0 && (
                    <button
                      onClick={handleMarkAllNotificationsRead}
                      className="text-[10px] text-primary hover:underline font-bold"
                    >
                      {locale === "en" ? "Mark all read" : "تحديد الكل كمقروء"}
                    </button>
                  )}
                </div>

                <div className="max-h-60 overflow-y-auto space-y-2">
                  {notifications.length === 0 ? (
                    <p className="text-[10px] text-base-content/40 text-center py-6">
                      {locale === "en"
                        ? "No notifications yet."
                        : "لا توجد تنبيهات حالياً."}
                    </p>
                  ) : (
                    notifications.slice(0, 5).map((n) => (
                      <div
                        key={n._id}
                        onClick={() =>
                          handleMarkNotificationRead(n._id, n.link)
                        }
                        className={`p-2.5 rounded-xl cursor-pointer hover:bg-base-300 transition-colors text-left space-y-1 relative ${!n.read ? "bg-primary/5 border border-primary/15" : "border border-transparent"}`}
                      >
                        <div className="flex justify-between items-start gap-2">
                          <span className="font-extrabold text-[11px] leading-tight">
                            {locale === "en" ? n.titleEn : n.titleAr}
                          </span>
                          {!n.read && (
                            <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0 mt-1"></span>
                          )}
                        </div>
                        <p className="text-[10px] text-base-content/65 leading-normal">
                          {locale === "en" ? n.contentEn : n.contentAr}
                        </p>
                        <span className="text-[8px] text-base-content/30 block font-mono">
                          {new Date(n.createdAt).toLocaleTimeString([], {
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </span>
                      </div>
                    ))
                  )}
                </div>

                <div className="border-t border-base-300 pt-2 text-center">
                  <Link
                    href="/notifications"
                    className="text-[10px] text-primary hover:underline font-extrabold block"
                  >
                    {locale === "en"
                      ? "See all notifications"
                      : "عرض كافة التنبيهات"}
                  </Link>
                </div>
              </div>
            </div>
          )}

          {user ? (
            <div className="dropdown dropdown-end">
              <label
                tabIndex={0}
                className="btn btn-xs rounded-full bg-base-100 border border-base-300 text-base-content hover:bg-base-300 font-bold px-2 sm:px-3 flex items-center gap-1 sm:gap-1.5 cursor-pointer normal-case shadow-sm transition-all"
              >
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl}
                    alt="Avatar"
                    className="w-5 h-5 rounded-full object-cover border border-base-300 shrink-0"
                  />
                ) : (
                  <div className="w-5 h-5 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[9px] shrink-0 font-sans">
                    {user.name
                      .split(" ")
                      .map((n: string) => n[0])
                      .join("")}
                  </div>
                )}
                <span className="hidden sm:block max-w-[100px] truncate text-[11px] font-mono">
                  {user.email}
                </span>
                <svg
                  className="w-3 h-3 text-base-content/50"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="3"
                >
                  <path
                    d="M19 9l-7 7-7-7"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </label>
              <ul
                tabIndex={0}
                className="menu menu-sm dropdown-content mt-3 z-[100] p-3 shadow-lg bg-base-200 text-base-content border border-base-300 rounded-2xl w-60 space-y-1"
              >
                <li className="px-3 py-2 border-b border-base-300 mb-1 flex flex-row gap-2.5 items-center">
                  {user.avatarUrl ? (
                    <img
                      src={user.avatarUrl}
                      alt="Avatar"
                      className="w-8 h-8 rounded-full object-cover border border-base-300 shrink-0"
                    />
                  ) : (
                    <div className="w-8 h-8 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs shrink-0 font-sans">
                      {user.name
                        .split(" ")
                        .map((n: string) => n[0])
                        .join("")}
                    </div>
                  )}
                  <div className="truncate flex-1">
                    <div className="font-black text-xs truncate p-0 leading-none text-base-content">
                      {user.name}
                    </div>
                    <div className="text-[9px] text-base-content/50 truncate p-0 font-mono mt-1">
                      {user.email}
                    </div>
                  </div>
                </li>
                {user.role === "learner" && (
                  <li>
                    <Link href="/dashboard">{t("nav.dashboard")}</Link>
                  </li>
                )}
                <li>
                  <Link href="/roadmap">{t("nav.roadmap")}</Link>
                </li>
                <li>
                  <Link href="/cv">{t("nav.cv")}</Link>
                </li>
                {user.role === "learner" && (
                  <li>
                    <Link href="/hiring">{t("nav.jobsMatch")}</Link>
                  </li>
                )}
                {user.role === "company" && (
                  <li>
                    <Link href="/company">{t("nav.talentBoard")}</Link>
                  </li>
                )}
                <li>
                  <Link href="/profile">
                    {locale === "en" ? "Settings" : "الإعدادات"}
                  </Link>
                </li>
                <li className="border-t border-base-300 pt-1 text-red-500 font-bold">
                  <button onClick={handleLogout}>{t("nav.logout")}</button>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <Link
                href="/auth/login"
                className="hidden sm:inline text-xs font-bold text-base-content/75 hover:text-[#10B981] transition-colors"
              >
                {t("nav.login")}
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-xs rounded-full bg-[#10B981] hover:bg-[#059669] text-white border-none px-3 sm:px-4 font-bold text-xs shadow-sm transition-all"
              >
                {t("nav.signup")}
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden btn btn-ghost btn-circle btn-xs text-base-content hover:bg-base-300"
            aria-label="Toggle menu"
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2.5"
            >
              {mobileOpen ? (
                <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileOpen && (
        <div className="md:hidden mt-2 max-w-5xl mx-auto bg-base-200 border border-base-300 rounded-2xl p-4 space-y-3 shadow-lg text-start">
          {navLinks
            .filter((l) => l.show)
            .map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={`block text-sm font-bold transition-all ${isLinkActive(link.href) ? "text-[#10B981]" : "text-base-content/75"}`}
              >
                {link.label}
              </Link>
            ))}
          {!user && (
            <Link
              href="/auth/login"
              className="block text-sm font-bold text-base-content/75 pt-2 border-t border-base-300"
            >
              {t("nav.login")}
            </Link>
          )}
        </div>
      )}
      {/* PWA Download Info Modal Dialog */}
      {showModal && (
        <div className="fixed inset-0 z-[1000] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm select-none">
          <div className="card w-full max-w-sm bg-base-200 border border-base-300 text-base-content p-6 rounded-2xl shadow-2xl relative text-start animate-in fade-in zoom-in-95 duration-200">
            <button
              onClick={() => setShowModal(false)}
              className="absolute top-3 right-3 btn btn-circle btn-xs btn-ghost text-base-content/60"
            >
              <svg
                viewBox="0 0 24 24"
                className="w-4 h-4"
                fill="none"
                stroke="currentColor"
                strokeWidth="2.5"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M6 18L18 6M6 6l12 12"
                />
              </svg>
            </button>

            <div className="space-y-4">
              <div className="flex items-center gap-3 border-b border-base-300 pb-3">
                <div className="w-9 h-9 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
                  <DownloadAppIcon />
                </div>
                <div>
                  <h3 className="font-extrabold text-sm leading-tight">
                    {locale === "en"
                      ? "Install Standalone App"
                      : "تثبيت التطبيق المستقل"}
                  </h3>
                  <span className="text-[10px] text-base-content/40 font-bold uppercase font-mono mt-0.5 block">
                    {os.toUpperCase()} OS DETECTED
                  </span>
                </div>
              </div>

              <div className="text-xs leading-relaxed space-y-2.5 font-medium text-base-content/80">
                {os === "windows" && (
                  <p>
                    {locale === "en"
                      ? 'To install on Windows, click the installation icon in your browser address bar (right side), or open the settings menu (...) and click "Install SmartRoadmap".'
                      : 'لتثبيت التطبيق على ويندوز، انقر فوق أيقونة التثبيت في شريط عنوان المتصفح (الجانب الأيمن)، أو افتح القائمة (...) وانقر فوق "تثبيت SmartRoadmap".'}
                  </p>
                )}
                {os === "macos" && (
                  <p>
                    {locale === "en"
                      ? 'To install on macOS, click the Share icon in the Safari toolbar, then select "Add to Dock". This will place a native application icon on your launchpad.'
                      : 'لتثبيت التطبيق على ماك، انقر فوق أيقونة "مشاركة" في شريط أدوات Safari، ثم اختر "إضافة إلى Dock" لوضع أيقونة التطبيق في شريط التطبيقات الرئيسي.'}
                  </p>
                )}
                {os === "linux" && (
                  <p>
                    {locale === "en"
                      ? 'To install on Linux, click the install prompt in your Chromium/Chrome browser address bar, or select "Install SmartRoadmap" from the settings dropdown.'
                      : 'لتثبيت التطبيق على لينكس، انقر فوق أيقونة التثبيت في شريط العنوان بمتصفح كروم، أو اختر "تثبيت SmartRoadmap" من قائمة الإعدادات.'}
                  </p>
                )}
                {os === "ios" && (
                  <p>
                    {locale === "en"
                      ? 'To install on iOS/Safari, tap the "Share" button at the bottom of Safari, scroll down the actions sheet, and select "Add to Home Screen".'
                      : 'لتثبيت التطبيق على هواتف آيفون/آيباد، انقر على زر "مشاركة" أسفل متصفح Safari، ثم مرر لأسفل واختر "إضافة إلى الصفحة الرئيسية".'}
                  </p>
                )}
                {os === "android" && (
                  <p>
                    {locale === "en"
                      ? 'To install on Android, tap the three vertical dots menu at the top-right of Chrome, and select "Install App" or "Add to Home Screen".'
                      : 'لتثبيت التطبيق على أندرويد، انقر على قائمة النقاط الثلاث الرأسية أعلى يمين متصفح Chrome، ثم اختر "تثبيت التطبيق" أو "إضافة للشاشة الرئيسية".'}
                  </p>
                )}
                {os === "other" && (
                  <p>
                    {locale === "en"
                      ? 'Open the settings menu of your mobile or desktop browser and select "Install App" or "Add to Home Screen" to install SmartRoadmap standalone.'
                      : 'افتح قائمة إعدادات المتصفح على هاتفك أو حاسوبك واختر "تثبيت التطبيق" أو "إضافة إلى الشاشة الرئيسية" لتشغيل البرنامج كموقع مستقل.'}
                  </p>
                )}
              </div>

              <div className="bg-primary/5 border border-primary/20 rounded-xl p-3 text-[10px] leading-relaxed text-primary/95 flex gap-2 items-start font-semibold">
                <span>💡</span>
                <p>
                  {locale === "en"
                    ? "Running SmartRoadmap as a standalone app provides offline caching, secure session management, and cleaner desktop notifications."
                    : "تشغيل البرنامج كتطبيق مستقل يتيح لك تصفحاً أسرع، وإدارة آمنة للجلسات، بالإضافة إلى تلقي إشعارات سطح المكتب بشكل منسق."}
                </p>
              </div>

              <div className="pt-2 flex justify-end">
                <button
                  onClick={() => setShowModal(false)}
                  className="btn bg-primary hover:bg-[#059669] text-white btn-xs sm:btn-sm rounded-lg font-bold border-none px-5"
                >
                  {locale === "en" ? "Got it" : "حسناً، فهمت"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </header>
  );
}
