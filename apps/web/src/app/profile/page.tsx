"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/AppContext";
import { toast } from "react-toastify";
import Link from "next/link";
import { apiFetch, cacheUser, getCachedUser, logout } from "@/lib/api";

// Crisp, professional SVG icons replacing keyboard emojis
const HomeIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6"
    />
  </svg>
);

const PopularIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17.657 18.657A8 8 0 016.343 7.343S7 9 9 10c0-2 .5-5 2.986-7C14 5 16.09 5.777 17.656 7.343A7.975 7.975 0 0120 13a7.975 7.975 0 01-2.343 5.657z"
    />
  </svg>
);

const ActivityIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M13 10V3L4 14h7v7l9-11h-7z"
    />
  </svg>
);

const BookmarkIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M5 5a2 2 0 012-2h10a2 2 0 012 2v16l-7-3.5L5 21V5z"
    />
  </svg>
);

const SettingsIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
    />
    <circle cx="12" cy="12" r="3" />
  </svg>
);

const SearchIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
    />
  </svg>
);

const BellIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9"
    />
  </svg>
);

const LogoutIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1"
    />
  </svg>
);

const SunIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z"
    />
  </svg>
);

const MoonIcon = () => (
  <svg
    className="w-4 h-4 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2"
    viewBox="0 0 24 24"
  >
    <path
      strokeLinecap="round"
      strokeLinejoin="round"
      d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z"
    />
  </svg>
);

const CaretDownIcon = () => (
  <svg
    className="w-3 h-3 text-current"
    fill="none"
    stroke="currentColor"
    strokeWidth="2.5"
    viewBox="0 0 24 24"
  >
    <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
  </svg>
);

export default function ProfilePage() {
  const { theme, setTheme, locale, setLocale, t } = useApp();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active tab state matching the mockup tabs
  const [activeTab, setActiveTab] = useState<
    "account" | "security" | "notifications" | "interface" | "additional"
  >("account");

  // Form states
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [username, setUsername] = useState("");
  const [phone, setPhone] = useState("");
  const [bio, setBio] = useState("");
  const [role, setRole] = useState("learner");
  const [avatarChar, setAvatarChar] = useState("AM");
  const [isSaving, setIsSaving] = useState(false);

  // Mock settings states
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyQuizzes, setNotifyQuizzes] = useState(false);
  const [notifyNewsletter, setNotifyNewsletter] = useState(true);

  useEffect(() => {
    const storedUser = getCachedUser();
    if (storedUser) {
      try {
        const u = storedUser;
        setUser(u);
        setName(u.name || "");
        setEmail(u.email || "");
        setUsername(
          u.username ||
            (u.name ? u.name.toLowerCase().replace(/\s+/g, "") : ""),
        );
        setPhone(u.phone || "");
        setBio(u.bio || "");
        setRole(u.role || "learner");
        setAvatarChar(
          (u.name || "Ali Maher")
            .split(" ")
            .map((n: string) => n[0])
            .join(""),
        );
      } catch (e) {}
    }
    setLoading(false);
  }, []);

  const handleSaveProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);

    try {
      // The server derives the user from the JWT — `userId` is no longer accepted.
      // Email and role are not self-editable (email needs re-verification,
      // role is an admin operation).
      const response = await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ name, username, phone, bio }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.message || "Profile update failed.");
      }

      const result = await response.json();
      const updatedUser = {
        ...user,
        ...result.user,
      };

      cacheUser(updatedUser);
      setUser(updatedUser);
      setAvatarChar(
        name
          .split(" ")
          .map((n) => n[0])
          .join(""),
      );

      toast.success(
        locale === "en"
          ? "Profile details updated successfully!"
          : "تم تحديث بيانات الملف الشخصي بنجاح!",
      );
    } catch (err: any) {
      toast.error(
        locale === "en"
          ? `Update failed: ${err.message}`
          : `فشل التحديث: ${err.message}`,
      );
    } finally {
      setIsSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const formData = new FormData();
    formData.append("file", file);

    try {
      const response = await apiFetch("/upload/image", {
        method: "POST",
        body: formData,
      });

      if (!response.ok) throw new Error("Upload failed");
      const result = await response.json();

      // Update backend user profile model with the new Cloudinary URL
      const updateResponse = await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: result.url }),
      });

      if (!updateResponse.ok)
        throw new Error("Failed to save profile picture URL.");

      const updatedUser = {
        ...user,
        avatarUrl: result.url,
      };

      cacheUser(updatedUser);
      setUser(updatedUser);
      toast.success(
        locale === "en"
          ? "Avatar updated successfully!"
          : "تم تحديث الصورة الشخصية بنجاح!",
      );
    } catch (err: any) {
      toast.error(
        locale === "en"
          ? `Upload failed: ${err.message}`
          : `فشل الرفع: ${err.message}`,
      );
    }
  };

  const handleRemoveAvatar = async () => {
    if (
      !confirm(
        locale === "en"
          ? "Are you sure you want to remove your profile picture?"
          : "هل أنت متأكد من إزالة الصورة الشخصية؟",
      )
    )
      return;

    try {
      const response = await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ avatarUrl: "" }),
      });

      if (!response.ok) throw new Error("Failed to remove avatar");

      const updatedUser = {
        ...user,
        avatarUrl: "",
      };
      cacheUser(updatedUser);
      setUser(updatedUser);
      toast.success(
        locale === "en"
          ? "Profile picture removed."
          : "تم إزالة الصورة الشخصية.",
      );
    } catch (err: any) {
      toast.error(err.message);
    }
  };

  const handleLogout = () => {
    logout();
    toast.success(
      locale === "en" ? "Logged out successfully." : "تم تسجيل الخروج بنجاح.",
    );
    window.location.href = "/";
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-[#7c3aed]"></span>
      </div>
    );
  }

  // Sidebar link dataset matching mockup
  const sidebarLinks = [
    {
      label: t("profile.sidebar.home"),
      href: "/dashboard",
      icon: <HomeIcon />,
    },
    { label: t("profile.sidebar.popular"), href: "#", icon: <PopularIcon /> },
    { label: t("profile.sidebar.activity"), href: "#", icon: <ActivityIcon /> },
    { label: t("profile.sidebar.saved"), href: "#", icon: <BookmarkIcon /> },
    {
      label: t("profile.sidebar.settings"),
      href: "/profile",
      icon: <SettingsIcon />,
      active: true,
    },
  ];

  return (
    <div className="bg-base-100 text-base-content min-h-screen pb-12 px-4 sm:px-6 lg:px-8 text-start select-none">
      <div className="max-w-6xl mx-auto space-y-6">
        {/* TOP HEADER BAR matching design layout */}
        <header className="flex flex-col sm:flex-row items-center justify-between gap-4 py-4 border-b border-base-300">
          <div className="flex items-center gap-3">
            <img
              src="/logo.svg"
              alt="Logo"
              className="w-8 h-8 object-contain"
            />
            <div>
              <span className="font-extrabold text-sm tracking-tight text-base-content block">
                deep creationz
              </span>
              <span className="text-[9px] text-base-content/40 uppercase font-bold font-mono tracking-widest leading-none">
                smartroadmap
              </span>
            </div>
          </div>

          <div className="relative w-full sm:w-64 max-w-xs">
            <span className="absolute inset-y-0 left-3 flex items-center text-base-content/40 text-xs">
              <SearchIcon />
            </span>
            <input
              type="text"
              placeholder={t("profile.header.search")}
              className="input input-bordered w-full h-9 rounded-full bg-base-200 border-base-300 text-xs pl-9 text-base-content focus:border-[#7c3aed]"
            />
          </div>

          <div className="flex items-center gap-4">
            {/* Notification bell mock */}
            <button className="btn btn-ghost btn-circle btn-xs text-base-content/60 relative">
              <BellIcon />
              <span className="absolute top-0 right-0 w-2 h-2 bg-[#7c3aed] rounded-full"></span>
            </button>

            {/* User welcome & avatar row */}
            <div className="flex items-center gap-2">
              {user?.avatarUrl ? (
                <img
                  src={user.avatarUrl}
                  alt="Avatar"
                  className="w-8 h-8 rounded-full object-cover border border-base-300 shadow-sm"
                />
              ) : (
                <div className="w-8 h-8 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 flex items-center justify-center font-bold text-xs">
                  {avatarChar || "AM"}
                </div>
              )}
              <div className="hidden md:block text-left">
                <span className="text-[10px] text-base-content/50 block font-semibold leading-none">
                  {t("profile.header.welcome")}
                </span>
                <span className="text-xs font-bold text-base-content mt-1 block leading-none">
                  {name || "Christine Brown"}
                </span>
              </div>
              <span className="text-base-content/40 text-[9px] cursor-pointer">
                <CaretDownIcon />
              </span>
            </div>
          </div>
        </header>

        {/* MAIN LAYOUT CONTAINER */}
        <div className="grid grid-cols-1 md:grid-cols-12 gap-8 items-stretch">
          {/* LEFT SIDEBAR: Navigation Menu matching mockup */}
          <aside className="col-span-1 md:col-span-3 bg-base-200/50 border border-base-300 rounded-2xl p-5 flex flex-col justify-between shadow-sm min-h-[480px]">
            <div className="space-y-4">
              <nav className="space-y-1">
                {sidebarLinks.map((link) => (
                  <Link
                    key={link.label}
                    href={link.href}
                    className={`flex items-center justify-between px-4 py-2.5 rounded-xl font-bold text-xs transition-all relative ${
                      link.active
                        ? "bg-base-200 text-[#7c3aed] shadow-sm border border-base-300"
                        : "text-base-content/75 hover:bg-base-300 hover:text-base-content"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <span>{link.icon}</span>
                      <span>{link.label}</span>
                    </div>
                    {link.active && (
                      <span className="absolute right-0 top-1/4 bottom-1/4 w-1 bg-[#7c3aed] rounded-l-full"></span>
                    )}
                  </Link>
                ))}
              </nav>
            </div>

            <div className="border-t border-base-300 pt-4">
              <button
                onClick={handleLogout}
                className="flex items-center gap-3 w-full px-4 py-2.5 text-xs font-bold text-error hover:bg-error/10 rounded-xl transition-all"
              >
                <LogoutIcon />
                {t("profile.sidebar.logout")}
              </button>
            </div>
          </aside>

          {/* RIGHT MAIN PANEL */}
          <main className="col-span-1 md:col-span-9 flex flex-col space-y-6">
            {/* Header Tab list from Reference Design */}
            <div className="flex border-b border-base-300 overflow-x-auto pb-px gap-6 text-xs font-semibold scrollbar-none">
              {[
                { id: "account", label: t("profile.tabs.account") },
                { id: "security", label: t("profile.tabs.security") },
                { id: "notifications", label: t("profile.tabs.notifications") },
                { id: "interface", label: t("profile.tabs.interface") },
                { id: "additional", label: t("profile.tabs.danger") },
              ].map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id as any)}
                  className={`pb-4 px-1 whitespace-nowrap transition-all border-b-2 text-[11px] font-bold tracking-wide uppercase ${
                    activeTab === tab.id
                      ? "border-[#7c3aed] text-[#7c3aed]"
                      : "border-transparent text-base-content/55 hover:text-base-content"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB PANEL CONTENT */}
            <div className="flex-grow">
              {/* 1. Account Settings Panel */}
              {activeTab === "account" && (
                <form
                  onSubmit={handleSaveProfile}
                  className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm"
                >
                  {/* Profile Picture Upload row */}
                  <div className="space-y-3 text-start">
                    <span className="text-[10px] font-bold text-base-content/40 uppercase tracking-wider block font-mono">
                      {t("profile.form.avatar")}
                    </span>

                    <div className="flex items-center gap-4 flex-wrap">
                      {user?.avatarUrl ? (
                        <img
                          src={user.avatarUrl}
                          alt="Avatar"
                          className="w-16 h-16 rounded-full object-cover border border-base-300 shadow-sm"
                        />
                      ) : (
                        <div className="w-16 h-16 rounded-full bg-[#7c3aed]/10 text-[#7c3aed] border border-[#7c3aed]/20 flex items-center justify-center font-black text-xl shadow-inner font-mono">
                          {avatarChar || "AM"}
                        </div>
                      )}

                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() =>
                            document
                              .getElementById("accountAvatarFileInput")
                              ?.click()
                          }
                          className="btn bg-[#7c3aed] hover:bg-[#6d28d9] border-none text-white btn-sm rounded-xl font-bold text-xs"
                        >
                          {t("profile.form.upload")}
                        </button>
                        <input
                          type="file"
                          id="accountAvatarFileInput"
                          accept="image/*"
                          onChange={handleAvatarUpload}
                          className="hidden"
                        />

                        <button
                          type="button"
                          onClick={handleRemoveAvatar}
                          className="btn btn-outline border-base-300 hover:bg-base-300 hover:text-base-content text-base-content btn-sm rounded-xl font-bold text-xs"
                        >
                          {t("profile.form.remove")}
                        </button>
                      </div>
                    </div>
                  </div>

                  {/* Form fields */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 text-start">
                    {/* Full Name */}
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40 block font-mono">
                        {t("profile.form.name")}
                      </label>
                      <input
                        type="text"
                        required
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#7c3aed] text-base-content font-medium"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* Email address */}
                    <div className="form-control">
                      <div className="flex justify-between items-center">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40 block font-mono">
                          {t("profile.form.email")}
                        </label>
                        <span className="text-[9px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-tighter">
                          ✓ {t("profile.form.verified")}
                        </span>
                      </div>
                      <input
                        type="email"
                        required
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#7c3aed] text-base-content font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {/* Username */}
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40 block font-mono">
                        {t("profile.form.username")}
                      </label>
                      <input
                        type="text"
                        required
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#7c3aed] text-base-content font-medium"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    {/* Phone number */}
                    <div className="form-control">
                      <div className="flex justify-between items-center">
                        <label className="label text-[10px] font-bold uppercase text-base-content/40 block font-mono">
                          {t("profile.form.phone")}
                        </label>
                        <span className="text-[9px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-tighter">
                          ✓ {t("profile.form.verified")}
                        </span>
                      </div>
                      <input
                        type="text"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#7c3aed] text-base-content font-medium"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 945-913-2196"
                      />
                    </div>
                  </div>

                  {/* Bio text area */}
                  <div className="form-control text-start">
                    <label className="label text-[10px] font-bold uppercase text-base-content/40 block font-mono">
                      {t("profile.form.bio")}
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full h-28 rounded-xl bg-base-100 text-xs border-base-300 focus:border-[#7c3aed] text-base-content resize-none font-medium leading-relaxed"
                      value={bio}
                      onChange={(e) => setBio(e.target.value)}
                      placeholder="Tell us about your career credentials..."
                    />
                  </div>

                  {/* Save button */}
                  <div className="pt-2 flex justify-end">
                    <button
                      type="submit"
                      disabled={isSaving}
                      className="btn bg-[#7c3aed] hover:bg-[#6d28d9] border-none text-white rounded-xl text-xs h-11 min-h-0 px-8 font-bold uppercase tracking-wider"
                    >
                      {isSaving && (
                        <span className="loading loading-spinner loading-xs mr-2" />
                      )}
                      {t("profile.form.update")}
                    </button>
                  </div>
                </form>
              )}

              {/* 2. Login & Security Tab */}
              {activeTab === "security" && (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm text-start">
                  <h3 className="font-extrabold text-sm text-base-content border-b border-base-300 pb-3 uppercase tracking-wider font-mono">
                    {locale === "en"
                      ? "Update Login Password"
                      : "تغيير كلمة المرور"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                      />
                    </div>
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-base-content/40 font-mono">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() =>
                        toast.success("Password update simulated.")
                      }
                      className="btn bg-[#7c3aed] hover:bg-[#6d28d9] border-none text-white text-xs rounded-xl h-10 min-h-0 px-6 font-bold uppercase"
                    >
                      Save Password
                    </button>
                  </div>
                </div>
              )}

              {/* 3. Notification Settings Tab */}
              {activeTab === "notifications" && (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm text-start">
                  <h3 className="font-extrabold text-sm text-base-content border-b border-base-300 pb-3 uppercase tracking-wider font-mono">
                    {locale === "en"
                      ? "Notification Subscriptions"
                      : "اشتراكات الإشعارات والتنبيهات"}
                  </h3>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-base-100 border border-base-300 rounded-xl">
                      <div>
                        <p className="font-bold text-xs">Job Match Alerts</p>
                        <p className="text-[10px] text-base-content/55 mt-0.5">
                          Receive immediate notification when your CV matches
                          new job openings.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={notifyMatches}
                        onChange={(e) => setNotifyMatches(e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-base-100 border border-base-300 rounded-xl">
                      <div>
                        <p className="font-bold text-xs">Quiz Reminders</p>
                        <p className="text-[10px] text-base-content/55 mt-0.5">
                          Weekly notifications for unlocked roadmap milestone
                          challenges.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={notifyQuizzes}
                        onChange={(e) => setNotifyQuizzes(e.target.checked)}
                      />
                    </div>

                    <div className="flex items-center justify-between p-3 bg-base-100 border border-base-300 rounded-xl">
                      <div>
                        <p className="font-bold text-xs">
                          Newsletter & Updates
                        </p>
                        <p className="text-[10px] text-base-content/55 mt-0.5">
                          Receive digests of candidate verified metrics and
                          hiring trends.
                        </p>
                      </div>
                      <input
                        type="checkbox"
                        className="toggle toggle-primary toggle-sm"
                        checked={notifyNewsletter}
                        onChange={(e) => setNotifyNewsletter(e.target.checked)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={() =>
                        toast.success("Notification selections saved.")
                      }
                      className="btn bg-[#7c3aed] hover:bg-[#6d28d9] border-none text-white text-xs rounded-xl h-10 min-h-0 px-6 font-bold uppercase"
                    >
                      Save Settings
                    </button>
                  </div>
                </div>
              )}

              {/* 4. Interface Configurations Tab */}
              {activeTab === "interface" && (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm text-start">
                  <h3 className="font-extrabold text-sm text-base-content border-b border-base-300 pb-3 uppercase tracking-wider font-mono">
                    {locale === "en"
                      ? "Interface Configurations"
                      : "إعدادات واجهة المستخدم"}
                  </h3>

                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                    {/* Theme Selector */}
                    <div className="form-control space-y-2">
                      <label className="text-[10px] font-bold uppercase text-base-content/40 block font-mono">
                        {locale === "en"
                          ? "Visual Theme Mode"
                          : "وضع المظهر المرئي"}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setTheme("smartlight")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            theme === "smartlight"
                              ? "bg-[#7c3aed] text-white border-none"
                              : "btn-outline border-base-300 text-base-content hover:bg-base-100"
                          }`}
                        >
                          <SunIcon />
                          {locale === "en" ? "Light Mode" : "المظهر المضيء"}
                        </button>
                        <button
                          type="button"
                          onClick={() => setTheme("smartdark")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            theme === "smartdark"
                              ? "bg-[#7c3aed] text-white border-none"
                              : "btn-outline border-base-300 text-base-content hover:bg-base-100"
                          }`}
                        >
                          <MoonIcon />
                          {locale === "en" ? "Dark Mode" : "المظهر الداكن"}
                        </button>
                      </div>
                    </div>

                    {/* Language Selector */}
                    <div className="form-control space-y-2">
                      <label className="text-[10px] font-bold uppercase text-base-content/40 block font-mono">
                        {locale === "en"
                          ? "Application Language"
                          : "لغة التطبيق الافتراضية"}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => setLocale("en")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold ${
                            locale === "en"
                              ? "bg-[#7c3aed] text-white border-none"
                              : "btn-outline border-base-300 text-base-content hover:bg-base-100"
                          }`}
                        >
                          English (LTR)
                        </button>
                        <button
                          type="button"
                          onClick={() => setLocale("ar")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold ${
                            locale === "ar"
                              ? "bg-[#7c3aed] text-white border-none"
                              : "btn-outline border-base-300 text-base-content hover:bg-base-100"
                          }`}
                        >
                          العربية (RTL)
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              {/* 5. Additional Settings Tab */}
              {activeTab === "additional" && (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm text-start">
                  <h3 className="font-extrabold text-sm text-error border-b border-base-300 pb-3 uppercase tracking-wider font-mono">
                    {locale === "en" ? "Danger Zone" : "منطقة الخطر"}
                  </h3>

                  <div className="p-4 bg-error/5 border border-error/20 rounded-xl space-y-4">
                    <div>
                      <h4 className="font-bold text-xs text-error">
                        Delete Workspace Account
                      </h4>
                      <p className="text-[10px] text-base-content/60 mt-1">
                        Once confirmed, all completed learning paths, roadmap
                        quiz records, and matching indices will be permanently
                        scrubbed from MongoDB.
                      </p>
                    </div>
                    <button
                      onClick={() => alert("Account deletion simulated.")}
                      className="btn btn-error btn-xs text-white rounded-lg px-4"
                    >
                      Delete Account
                    </button>
                  </div>
                </div>
              )}
            </div>
          </main>
        </div>
      </div>
    </div>
  );
}
