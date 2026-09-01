"use client";

import React, { useState, useEffect } from "react";
import { useApp } from "@/components/AppContext";
import { toast } from "react-toastify";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { apiFetch, cacheUser, getCachedUser, logout } from "@/lib/api";
import SalaryInsightsPanel, { SalaryInsights, COUNTRY_OPTIONS } from "@/components/SalaryInsightsPanel";
import { RecommendedContentPanel } from "@/components/RecommendedContentPanel";

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

// Briefcase icon for Matched Jobs
const JobsIcon = () => (
  <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <rect x="2" y="7" width="20" height="14" rx="2" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M16 7V5a2 2 0 00-2-2h-4a2 2 0 00-2 2v2" />
  </svg>
);

// Dollar-circle icon for Salary Insights
const SalaryIcon = () => (
  <svg className="w-4 h-4 text-current" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
    <circle cx="12" cy="12" r="10" />
    <path strokeLinecap="round" strokeLinejoin="round" d="M12 6v12M9 9h4.5a1.5 1.5 0 010 3H10.5a1.5 1.5 0 000 3H15" />
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

function ProfileContent() {
  const { theme, setTheme, locale, setLocale, t } = useApp();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // Active tab state matching the mockup tabs
  const [activeTab, setActiveTab] = useState<
    "account" | "salary" | "recommendations" | "security" | "notifications" | "interface" | "additional"
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

  // Career profile state — populated from GET /salary/profile when the salary tab opens.
  // Used for the read-only context strip. No manual form in the salary tab.
  const [currentRole, setCurrentRole] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [experienceYears, setExperienceYears] = useState(0);
  const [location, setLocation] = useState("");
  const [skillsStr, setSkillsStr] = useState("");
  const [educationLevel, setEducationLevel] = useState("");
  const [certificationsStr, setCertificationsStr] = useState("");
  const [industry, setIndustry] = useState("");

  const searchParams = useSearchParams();

  const [salaryInsights, setSalaryInsights] = useState<SalaryInsights | null>(null);
  const [loadingInsights, setLoadingInsights] = useState(false);

  /**
   * Selected country code for salary lookup (ISO-3166-1 alpha-2).
   * Initialised from the profile location when the salary tab first opens;
   * the user can override it with the country selector at any time.
   */
  const [selectedCountry, setSelectedCountry] = useState("us");

  /** Populate career profile fields for the context strip */
  const fetchCareerProfile = async () => {
    try {
      const res = await apiFetch("/salary/profile");
      if (res.ok) {
        const data = await res.json();
        setCurrentRole(data.currentRole || "");
        setTargetRole(data.targetRole || "");
        setExperienceYears(data.experienceYears || 0);
        setLocation(data.location || "");
        setSkillsStr(data.skills ? data.skills.join(", ") : "");
        setEducationLevel(data.educationLevel || "");
        setCertificationsStr(data.certifications ? data.certifications.join(", ") : "");
        setIndustry(data.industry || "");

        // Auto-detect country from profile location on first load.
        // Only override if the user hasn't made an explicit selection yet
        // (i.e. still on the default "us").
        if (data.location) {
          const loc = (data.location as string).toLowerCase();
          const detected = COUNTRY_OPTIONS.find((opt) =>
            loc.includes(opt.label.toLowerCase()) ||
            loc.includes(opt.code.toLowerCase())
          );
          if (detected) setSelectedCountry(detected.code);
        }
      }
    } catch {
      toast.error("Failed to load career profile.");
    }
  };

  /**
   * Fetch salary insights from the backend.
   * The backend reads the authenticated user's stored profile automatically.
   * Only the country code is sent from the client — everything else (role,
   * skills, experience, etc.) is loaded server-side from the JWT identity.
   */
  const fetchSalaryInsights = async (countryCode?: string) => {
    setLoadingInsights(true);
    try {
      const country = countryCode ?? selectedCountry;
      const res = await apiFetch(`/salary/insights?country=${country}`);
      if (res.ok) {
        const data: SalaryInsights = await res.json();
        setSalaryInsights(data);
      } else {
        toast.error("Could not load salary insights.");
      }
    } catch {
      toast.error("Failed to load salary insights.");
    } finally {
      setLoadingInsights(false);
    }
  };

  /** Handle country pill click — update state and re-fetch immediately */
  const handleCountryChange = (code: string) => {
    setSelectedCountry(code);
    setSalaryInsights(null); // clear stale data while loading
    fetchSalaryInsights(code);
  };

  // Notification settings states
  const [notifyMatches, setNotifyMatches] = useState(true);
  const [notifyQuizzes, setNotifyQuizzes] = useState(false);
  const [notifyNewsletter, setNotifyNewsletter] = useState(true);

  // Password fields state
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [unreadCount, setUnreadCount] = useState(0);

  // Auto-activate tab from URL query param (e.g. /profile?tab=salary)
  useEffect(() => {
    const tabParam = searchParams?.get("tab");
    const validTabs = ["account", "salary", "recommendations", "security", "notifications", "interface", "additional"];
    if (tabParam && validTabs.includes(tabParam as any)) {
      setActiveTab(tabParam as any);
    }
  }, [searchParams]);

  useEffect(() => {
    if (activeTab === "salary") {
      // Load career profile first (auto-detects country from location),
      // then fetch insights. Both are async but profile resolves fast since
      // it's a local DB read — insights takes longer (Adzuna/AI call).
      fetchCareerProfile().then(() => fetchSalaryInsights());
    }
  }, [activeTab]);

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
        // Load notifications settings from localStorage
        const mPref = localStorage.getItem("pref_notifyMatches");
        if (mPref !== null) setNotifyMatches(mPref === "true");
        const qPref = localStorage.getItem("pref_notifyQuizzes");
        if (qPref !== null) setNotifyQuizzes(qPref === "true");
        const nPref = localStorage.getItem("pref_notifyNewsletter");
        if (nPref !== null) setNotifyNewsletter(nPref === "true");
      } catch (e) {}
    }

    const fetchUnreadCount = async () => {
      try {
        const res = await apiFetch("/notifications");
        if (res.ok) {
          const body = await res.json();
          const list = body.data || [];
          setUnreadCount(list.filter((n: any) => !n.read).length);
        }
      } catch (e) {}
    };
    fetchUnreadCount();

    setLoading(false);
  }, []);

  const handleUpdatePassword = async () => {
    if (!currentPassword || !newPassword || !confirmPassword) {
      toast.error(locale === "en" ? "Please fill all fields." : "يرجى ملء جميع الحقول.");
      return;
    }
    if (newPassword !== confirmPassword) {
      toast.error(locale === "en" ? "Passwords do not match." : "كلمتا المرور غير متطابقتين.");
      return;
    }
    setIsUpdatingPassword(true);
    try {
      const res = await apiFetch("/auth/change-password", {
        method: "PATCH",
        body: JSON.stringify({ currentPassword, newPassword }),
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.message || "Failed to update password");
      }
      toast.success(
        locale === "en" ? "Password changed successfully! Please log in again." : "تم تغيير كلمة المرور بنجاح! يرجى تسجيل الدخول مرة أخرى."
      );
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
      setTimeout(() => handleLogout(), 2000);
    } catch (err: any) {
      toast.error(err.message);
    } finally {
      setIsUpdatingPassword(false);
    }
  };

  const handleSetTheme = async (newTheme: "smartlight" | "smartdark") => {
    setTheme(newTheme);
    try {
      await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ theme: newTheme }),
      });
      const updatedUser = { ...user, theme: newTheme };
      cacheUser(updatedUser);
      setUser(updatedUser);
    } catch (e) {}
  };

  const handleSetLocale = async (newTheme: "en" | "ar") => {
    setLocale(newTheme);
    try {
      await apiFetch("/auth/me", {
        method: "PATCH",
        body: JSON.stringify({ locale: newTheme }),
      });
      const updatedUser = { ...user, locale: newTheme };
      cacheUser(updatedUser);
      setUser(updatedUser);
    } catch (e) {}
  };

  const handleSaveNotifications = () => {
    localStorage.setItem("pref_notifyMatches", String(notifyMatches));
    localStorage.setItem("pref_notifyQuizzes", String(notifyQuizzes));
    localStorage.setItem("pref_notifyNewsletter", String(notifyNewsletter));
    toast.success(
      locale === "en" ? "Notification settings saved successfully!" : "تم حفظ إعدادات التنبيهات بنجاح!"
    );
  };

  const handleDeleteAccount = async () => {
    if (
      !confirm(
        locale === "en"
          ? "Are you sure you want to permanently delete your account? This action is irreversible!"
          : "هل أنت متأكد من حذف الحساب نهائياً؟ هذا الإجراء لا يمكن التراجع عنه!"
      )
    )
      return;
    toast.success(locale === "en" ? "Account deletion request submitted." : "تم إرسال طلب حذف الحساب.");
    handleLogout();
  };

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
        <span className="loading loading-spinner loading-lg text-[#8E1616]"></span>
      </div>
    );
  }

  // Sidebar link dataset matching mockup
  type SidebarLink = {
    label: string;
    href?: string;
    icon: React.ReactNode;
    active?: boolean;
    onClick?: () => void;
  };
  const sidebarLinks: SidebarLink[] = [
    {
      label: t("profile.sidebar.home"),
      href: "/dashboard",
      icon: <HomeIcon />,
    },
    { label: t("profile.sidebar.popular"), href: "/roadmap", icon: <PopularIcon /> },
    { label: t("profile.sidebar.activity"), href: "/dashboard?tab=activity", icon: <ActivityIcon /> },
    { label: t("profile.sidebar.saved"), href: "/achievements", icon: <BookmarkIcon /> },
    {
      label: t("nav.jobsMatch"),
      href: "/hiring",
      icon: <JobsIcon />,
    },
    {
      label: locale === "en" ? "Recommended Content" : "المحتوى الموصى به",
      icon: <PopularIcon />,
      active: activeTab === "recommendations",
      onClick: () => setActiveTab("recommendations"),
    },
    {
      label: t("profile.sidebar.salaryInsights"),
      icon: <SalaryIcon />,
      active: activeTab === "salary",
      onClick: () => setActiveTab("salary"),
    },
    {
      label: t("profile.sidebar.settings"),
      icon: <SettingsIcon />,
      active: activeTab === "account" || activeTab === "security" || activeTab === "notifications" || activeTab === "interface" || activeTab === "additional",
      onClick: () => setActiveTab("account"),
    },
  ];

  return (
    <div className="bg-[#F8EEDF] dark:bg-base-100 text-base-content min-h-screen pb-12 px-4 sm:px-6 lg:px-8 text-start select-none">
      <div className="max-w-6xl mx-auto space-y-6 pt-6">


        {/* MAIN LAYOUT CONTAINER */}
        <div className="flex flex-col items-stretch">
          {/* MAIN PANEL */}
          <main className="w-full flex flex-col space-y-6">
            {/* Header Tab list from Reference Design */}
            <div className="flex border-b border-base-300 overflow-x-auto pb-px gap-6 text-xs font-semibold scrollbar-none">
              {[
                { id: "account", label: t("profile.tabs.account") },
                { id: "recommendations", label: locale === "en" ? "Recommended Content" : "التوصيات المحتوى" },
                { id: "salary", label: t("profile.tabs.salary") },
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
                      ? "border-[#8E1616] text-[#8E1616]"
                      : "border-transparent text-stone-700 dark:text-stone-300 font-medium hover:text-base-content"
                  }`}
                >
                  {tab.label}
                </button>
              ))}
            </div>

            {/* TAB PANEL CONTENT */}
            <div className="flex-grow">
              {/* 1. Account Settings Panel */}
              {activeTab === 'account' && (
                <form onSubmit={handleSaveProfile} className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                  
                  {/* Profile Import CTA Card */}
                  <div className="bg-[#8E1616]/10 border border-[#8E1616]/20 rounded-xl p-4 flex flex-col sm:flex-row items-center justify-between gap-4">
                    <div className="text-start">
                      <h4 className="font-extrabold text-xs text-[#8E1616]">
                        {locale === 'en' ? 'Quick Profile Import & Certificate Upload' : 'استيراد سريع للملف الشخصي ورفع الشهادات'}
                      </h4>
                      <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium mt-1 leading-relaxed">
                        {locale === 'en'
                          ? 'Populate your profile instantly from GitHub, LinkedIn, or manage your certificates.'
                          : 'املأ ملفك المهني فوراً من GitHub أو LinkedIn أو أدر شهاداتك المهنية.'}
                      </p>
                    </div>
                    <Link href="/profile/import" className="btn bg-[#8E1616] hover:bg-[#6d28d9] border-none text-white btn-xs h-8 rounded-xl font-bold whitespace-nowrap px-4 flex items-center justify-center">
                      {locale === 'en' ? 'Get Started' : 'ابدأ الآن'}
                    </Link>
                  </div>

                  {/* Profile Picture Upload row */}
                  <div className="space-y-3 text-start">
                    <span className="text-[10px] font-bold text-stone-600 dark:text-stone-400 font-medium uppercase tracking-wider block font-mono">
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
                        <div className="w-16 h-16 rounded-full bg-[#8E1616]/10 text-[#8E1616] border border-[#8E1616]/20 flex items-center justify-center font-black text-xl shadow-inner font-mono">
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
                          className="btn bg-[#8E1616] hover:bg-[#6d28d9] border-none text-white btn-sm rounded-xl font-bold text-xs"
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
                      <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium block font-mono">
                        {t("profile.form.name")}
                      </label>
                      <input
                        type="text"
                        required
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#8E1616] text-base-content font-medium"
                        value={name}
                        onChange={(e) => setName(e.target.value)}
                      />
                    </div>

                    {/* Email address */}
                    <div className="form-control">
                      <div className="flex justify-between items-center">
                        <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium block font-mono">
                          {t("profile.form.email")}
                        </label>
                        <span className="text-[9px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-tighter">
                          ✓ {t("profile.form.verified")}
                        </span>
                      </div>
                      <input
                        type="email"
                        required
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#8E1616] text-base-content font-medium"
                        value={email}
                        onChange={(e) => setEmail(e.target.value)}
                      />
                    </div>

                    {/* Username */}
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium block font-mono">
                        {t("profile.form.username")}
                      </label>
                      <input
                        type="text"
                        required
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#8E1616] text-base-content font-medium"
                        value={username}
                        onChange={(e) => setUsername(e.target.value)}
                      />
                    </div>

                    {/* Phone number */}
                    <div className="form-control">
                      <div className="flex justify-between items-center">
                        <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium block font-mono">
                          {t("profile.form.phone")}
                        </label>
                        <span className="text-[9px] bg-success/10 text-success border border-success/20 px-1.5 py-0.5 rounded font-bold uppercase font-mono tracking-tighter">
                          ✓ {t("profile.form.verified")}
                        </span>
                      </div>
                      <input
                        type="text"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 focus:border-[#8E1616] text-base-content font-medium"
                        value={phone}
                        onChange={(e) => setPhone(e.target.value)}
                        placeholder="+1 945-913-2196"
                      />
                    </div>
                  </div>

                  {/* Bio text area */}
                  <div className="form-control text-start">
                    <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium block font-mono">
                      {t("profile.form.bio")}
                    </label>
                    <textarea
                      className="textarea textarea-bordered w-full h-28 rounded-xl bg-base-100 text-xs border-base-300 focus:border-[#8E1616] text-base-content resize-none font-medium leading-relaxed"
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
                      className="btn bg-[#8E1616] hover:bg-[#6d28d9] border-none text-white rounded-xl text-xs h-11 min-h-0 px-8 font-bold uppercase tracking-wider"
                    >
                      {isSaving && (
                        <span className="loading loading-spinner loading-xs mr-2" />
                      )}
                      {t("profile.form.update")}
                    </button>
                  </div>
                </form>
              )}

              {/* 2. Salary Insights Panel */}
              {activeTab === "salary" && (
                <div className="space-y-0">
                  {/* Profile context strip — shows what data drives the insights */}
                  {salaryInsights && (
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mb-5 px-1">
                      <span className="text-[10px] font-bold uppercase text-stone-500 dark:text-stone-400 font-medium font-mono tracking-wider">
                        Analysing profile:
                      </span>
                      {currentRole && (
                        <span className="text-[10px] font-semibold text-stone-700 dark:text-stone-300 font-medium">
                          {currentRole}
                        </span>
                      )}
                      {location && (
                        <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                          · {location}
                        </span>
                      )}
                      {experienceYears > 0 && (
                        <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium">
                          · {experienceYears} yr{experienceYears !== 1 ? "s" : ""} exp
                        </span>
                      )}
                      {skillsStr && (
                        <span className="text-[10px] text-stone-600 dark:text-stone-400 font-medium truncate max-w-[220px]">
                          · {skillsStr}
                        </span>
                      )}
                    </div>
                  )}

                  <SalaryInsightsPanel
                    insights={salaryInsights}
                    loading={loadingInsights}
                    selectedCountry={selectedCountry}
                    onCountryChange={handleCountryChange}
                    onRefresh={() => fetchSalaryInsights()}
                  />
                </div>
              )}

              {/* Recommended Content Tab */}
              {activeTab === "recommendations" && (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm">
                  <RecommendedContentPanel locale={locale} />
                </div>
              )}

              {/* 3. Login & Security Tab */}
              {activeTab === "security" && (
                <div className="bg-base-200 border border-base-300 rounded-2xl p-6 md:p-8 space-y-6 shadow-sm text-start">
                  <h3 className="font-extrabold text-sm text-base-content border-b border-base-300 pb-3 uppercase tracking-wider font-mono">
                    {locale === "en"
                      ? "Update Login Password"
                      : "تغيير كلمة المرور"}
                  </h3>

                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium font-mono">
                        Current Password
                      </label>
                      <input
                        type="password"
                        placeholder="••••••••"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 text-base-content"
                        value={currentPassword}
                        onChange={(e) => setCurrentPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium font-mono">
                        New Password
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 text-base-content"
                        value={newPassword}
                        onChange={(e) => setNewPassword(e.target.value)}
                      />
                    </div>
                    <div className="form-control">
                      <label className="label text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium font-mono">
                        Confirm Password
                      </label>
                      <input
                        type="password"
                        className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300 text-base-content"
                        value={confirmPassword}
                        onChange={(e) => setConfirmPassword(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="flex justify-end pt-2">
                    <button
                      onClick={handleUpdatePassword}
                      disabled={isUpdatingPassword}
                      className="btn bg-[#8E1616] hover:bg-[#6d28d9] border-none text-white text-xs rounded-xl h-10 min-h-0 px-6 font-bold uppercase animate-pulse-slow"
                    >
                      {isUpdatingPassword && <span className="loading loading-spinner loading-xs mr-2" />}
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
                        <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium mt-0.5">
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
                        <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium mt-0.5">
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
                        <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium mt-0.5">
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
                      onClick={handleSaveNotifications}
                      className="btn bg-[#8E1616] hover:bg-[#6d28d9] border-none text-white text-xs rounded-xl h-10 min-h-0 px-6 font-bold uppercase"
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
                      <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium block font-mono">
                        {locale === "en"
                          ? "Visual Theme Mode"
                          : "وضع المظهر المرئي"}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetTheme("smartlight")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            theme === "smartlight"
                              ? "bg-[#8E1616] text-white border-none"
                              : "btn-outline border-base-300 text-base-content hover:bg-base-100"
                            }`}
                        >
                          <SunIcon />
                          {locale === "en" ? "Light Mode" : "المظهر المضيء"}
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetTheme("smartdark")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5 ${
                            theme === "smartdark"
                              ? "bg-[#8E1616] text-white border-none"
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
                      <label className="text-[10px] font-bold uppercase text-stone-600 dark:text-stone-400 font-medium block font-mono">
                        {locale === "en"
                          ? "Application Language"
                          : "لغة التطبيق الافتراضية"}
                      </label>
                      <div className="flex gap-2">
                        <button
                          type="button"
                          onClick={() => handleSetLocale("en")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold ${
                            locale === "en"
                              ? "bg-[#8E1616] text-white border-none"
                              : "btn-outline border-base-300 text-base-content hover:bg-base-100"
                            }`}
                        >
                          English (LTR)
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSetLocale("ar")}
                          className={`flex-grow btn btn-sm rounded-xl text-xs font-semibold ${
                            locale === "ar"
                              ? "bg-[#8E1616] text-white border-none"
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
                      <p className="text-[10px] text-stone-700 dark:text-stone-300 font-medium mt-1">
                        Once confirmed, all completed learning paths, roadmap
                        quiz records, and matching indices will be permanently
                        scrubbed from MongoDB.
                      </p>
                    </div>
                    <button
                      onClick={handleDeleteAccount}
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

export default function ProfilePage() {
  return (
    <React.Suspense
      fallback={
        <div className="min-h-screen bg-base-100 flex items-center justify-center p-8">
          <span className="loading loading-spinner loading-lg text-[#8E1616]" />
        </div>
      }
    >
      <ProfileContent />
    </React.Suspense>
  );
}
