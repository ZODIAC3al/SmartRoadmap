"use client";

import React, { useState, useEffect } from "react";
import { apiFetch } from "@/lib/api";
import { toast } from "react-toastify";

export interface RecommendationItem {
  _id: string;
  category: "course" | "project" | "article" | "certification" | "job";
  title: string;
  description: string;
  tags: string[];
  matchScore: number;
  reason: string;
  url?: string;
  difficulty?: "beginner" | "intermediate" | "advanced";
  estimatedTime?: string;
  status: "active" | "saved" | "completed" | "dismissed";
}

interface RecommendedContentPanelProps {
  locale?: string;
}

export function RecommendedContentPanel({ locale = "en" }: RecommendedContentPanelProps) {
  const [items, setItems] = useState<RecommendationItem[]>([]);
  const [aiInsight, setAiInsight] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [selectedCategory, setSelectedCategory] = useState<string>("all");

  const fetchRecommendations = async (forceRefresh = false) => {
    if (forceRefresh) setRefreshing(true);
    else setLoading(true);

    try {
      const endpoint = forceRefresh ? "/recommendations/refresh" : "/recommendations";
      const method = forceRefresh ? "POST" : "GET";
      const res = await apiFetch(endpoint, { method });

      if (res.ok) {
        const data = await res.json();
        setItems(data.items || []);
        setAiInsight(data.aiInsight || "");
        if (forceRefresh) {
          toast.success(
            locale === "en"
              ? "AI Recommendations updated with your latest profile & activity!"
              : "تم تحديث التوصيات الذكية بناءً على نشاطك ومشاريعك!"
          );
        }
      } else {
        toast.error("Failed to load recommendations.");
      }
    } catch (err: any) {
      toast.error(err.message || "Failed to load recommendations.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const handleStatusChange = async (
    recId: string,
    newStatus: "active" | "saved" | "completed" | "dismissed"
  ) => {
    // Optimistic UI update
    setItems((prev) =>
      prev.map((item) => (item._id === recId ? { ...item, status: newStatus } : item))
    );

    try {
      const res = await apiFetch(`/recommendations/${recId}/status`, {
        method: "POST",
        body: JSON.stringify({ status: newStatus }),
      });

      if (res.ok) {
        toast.success(
          newStatus === "saved"
            ? "Item saved to your profile!"
            : newStatus === "completed"
            ? "Marked as completed!"
            : "Item dismissed."
        );
      }
    } catch {
      toast.error("Failed to update status");
    }
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case "course":
        return "📚";
      case "project":
        return "🚀";
      case "article":
        return "📰";
      case "certification":
        return "📜";
      case "job":
        return "💼";
      default:
        return "✨";
    }
  };

  const getCategoryBadgeClass = (category: string) => {
    switch (category) {
      case "course":
        return "bg-blue-500/10 text-blue-500 border-blue-500/20";
      case "project":
        return "bg-purple-500/10 text-purple-500 border-purple-500/20";
      case "article":
        return "bg-[#8E1616]/10 text-[#8E1616] border-[#8E1616]/20/20";
      case "certification":
        return "bg-amber-500/10 text-amber-500 border-amber-500/20";
      case "job":
        return "bg-indigo-500/10 text-indigo-500 border-indigo-500/20";
      default:
        return "bg-primary/10 text-primary border-primary/20";
    }
  };

  const filteredItems = items.filter((item) => {
    if (item.status === "dismissed") return false;
    if (selectedCategory === "all") return true;
    if (selectedCategory === "saved") return item.status === "saved";
    return item.category === selectedCategory;
  });

  return (
    <div className="space-y-6 text-start">
      {/* Header Banner & Refresh Button */}
      <div className="bg-gradient-to-r from-[#7c3aed]/15 via-purple-600/10 to-blue-600/10 border border-[#7c3aed]/20 rounded-2xl p-6 shadow-sm flex flex-col md:flex-row items-start md:items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="text-xl">✨</span>
            <h2 className="font-extrabold text-base text-base-content uppercase tracking-wider font-mono">
              {locale === "en" ? "AI Recommended Content" : "التوصيات التعليمية الذكية"}
            </h2>
            <span className="badge badge-primary text-[10px] font-bold font-mono">GEMINI POWERED</span>
          </div>
          <p className="text-xs text-stone-700 dark:text-stone-300 font-medium max-w-2xl font-medium">
            {aiInsight ||
              (locale === "en"
                ? "Dynamically matched to your skills, completed roadmaps, quiz scores, and career goals."
                : "مخصصة تلقائياً وفقاً لمهاراتك، خارطة الطريق، نتائج الاختبارات، وأهدافك المهنية.")}
          </p>
        </div>

        <button
          onClick={() => fetchRecommendations(true)}
          disabled={refreshing || loading}
          className="btn btn-primary btn-sm rounded-xl font-bold shadow-md hover:shadow-lg transition-all gap-2 self-end md:self-auto whitespace-nowrap"
        >
          {refreshing ? (
            <>
              <span className="loading loading-spinner loading-xs"></span>
              {locale === "en" ? "Analyzing..." : "جاري التحليل..."}
            </>
          ) : (
            <>
              <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2.5"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
              {locale === "en" ? "Refresh AI Matches" : "إعادة تحسين التوصيات"}
            </>
          )}
        </button>
      </div>

      {/* Category Navigation Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
        {[
          { id: "all", label: locale === "en" ? "All Matches" : "الكل" },
          { id: "course", label: locale === "en" ? "📚 Courses" : "📚 الدورات" },
          { id: "project", label: locale === "en" ? "🚀 Projects" : "🚀 المشاريع" },
          { id: "article", label: locale === "en" ? "📰 Articles" : "📰 المقالات" },
          { id: "certification", label: locale === "en" ? "📜 Certifications" : "📜 الشهادات" },
          { id: "job", label: locale === "en" ? "💼 Jobs" : "💼 الوظائف" },
          { id: "saved", label: locale === "en" ? "⭐ Saved" : "⭐ المحفوظة" },
        ].map((tab) => (
          <button
            key={tab.id}
            onClick={() => setSelectedCategory(tab.id)}
            className={`px-3.5 py-1.5 rounded-full text-xs font-bold transition-all whitespace-nowrap border ${
              selectedCategory === tab.id
                ? "bg-[#7c3aed] text-white border-[#7c3aed] shadow-sm"
                : "bg-base-200 text-stone-700 dark:text-stone-300 font-medium border-base-300 hover:bg-base-300"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Loading Skeleton */}
      {loading ? (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[1, 2, 3, 4].map((i) => (
            <div
              key={i}
              className="bg-base-200 border border-base-300 rounded-2xl p-5 space-y-4 animate-pulse"
            >
              <div className="h-4 bg-base-300 rounded w-1/3"></div>
              <div className="h-6 bg-base-300 rounded w-3/4"></div>
              <div className="h-12 bg-base-300 rounded w-full"></div>
            </div>
          ))}
        </div>
      ) : filteredItems.length === 0 ? (
        <div className="bg-base-200 border border-base-300 rounded-2xl p-10 text-center space-y-3">
          <span className="text-4xl block">🎯</span>
          <h3 className="font-bold text-sm text-base-content">
            {locale === "en" ? "No recommendations in this category yet" : "لا توجد توصيات في هذا القسم حالياً"}
          </h3>
          <p className="text-xs text-stone-700 dark:text-stone-300 font-medium max-w-md mx-auto">
            {locale === "en"
              ? "Click 'Refresh AI Matches' above or explore more roadmaps to trigger new recommendations."
              : "اضغط على 'إعادة تحسين التوصيات' أو أكمل المزيد من الدروس لتوليد اقتراحات جديدة."}
          </p>
        </div>
      ) : (
        /* Items Grid */
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredItems.map((item) => (
            <div
              key={item._id}
              className="bg-base-200 hover:bg-base-200/80 border border-base-300 rounded-2xl p-5 shadow-sm transition-all flex flex-col justify-between space-y-4 relative group"
            >
              <div className="space-y-3">
                {/* Category & Match Score Header */}
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full border ${getCategoryBadgeClass(
                      item.category
                    )}`}
                  >
                    {getCategoryIcon(item.category)} {item.category}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <span className="text-[10px] font-extrabold font-mono text-[#8E1616] bg-[#8E1616]/10 border border-[#8E1616]/20/20 px-2 py-0.5 rounded-full">
                      {item.matchScore}% MATCH
                    </span>
                    {item.status === "saved" && (
                      <span className="text-[10px] bg-amber-500/10 text-amber-500 border border-amber-500/20 px-2 py-0.5 rounded-full font-bold">
                        ⭐ SAVED
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <h3 className="font-extrabold text-sm text-base-content group-hover:text-[#7c3aed] transition-colors leading-snug">
                  {item.title}
                </h3>

                {/* Description */}
                <p className="text-xs text-stone-700 dark:text-stone-300 font-medium line-clamp-3 leading-relaxed">
                  {item.description}
                </p>

                {/* AI Reason Badge */}
                <div className="bg-base-100/60 border border-base-300 rounded-xl p-2.5 flex items-start gap-2">
                  <span className="text-xs text-[#7c3aed]">💡</span>
                  <p className="text-[11px] font-medium text-stone-800 dark:text-stone-200 font-medium leading-tight">
                    <span className="font-bold text-[#7c3aed]">Why recommended: </span>
                    {item.reason}
                  </p>
                </div>

                {/* Tags & Metadata */}
                <div className="flex flex-wrap items-center gap-1.5 pt-1">
                  {item.difficulty && (
                    <span className="badge badge-ghost text-[10px] font-semibold uppercase">
                      {item.difficulty}
                    </span>
                  )}
                  {item.estimatedTime && (
                    <span className="badge badge-ghost text-[10px] font-semibold">
                      ⏱ {item.estimatedTime}
                    </span>
                  )}
                  {item.tags?.map((tag, idx) => (
                    <span key={idx} className="badge badge-outline text-[10px] font-mono">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center justify-between border-t border-base-300 pt-3 mt-2">
                <a
                  href={item.url || "#"}
                  target={item.url?.startsWith("http") ? "_blank" : "_self"}
                  rel="noreferrer"
                  className="btn btn-primary btn-xs rounded-lg font-bold text-[11px]"
                >
                  {item.category === "job"
                    ? "View Job"
                    : item.category === "project"
                    ? "Start Project"
                    : "Explore Resource →"}
                </a>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() =>
                      handleStatusChange(item._id, item.status === "saved" ? "active" : "saved")
                    }
                    title="Bookmark Item"
                    className={`btn btn-ghost btn-xs btn-circle ${
                      item.status === "saved" ? "text-amber-500" : "text-stone-700 dark:text-stone-300 font-medium"
                    }`}
                  >
                    ★
                  </button>
                  <button
                    onClick={() => handleStatusChange(item._id, "completed")}
                    title="Mark as Completed"
                    className="btn btn-ghost btn-xs btn-circle text-success"
                  >
                    ✓
                  </button>
                  <button
                    onClick={() => handleStatusChange(item._id, "dismissed")}
                    title="Dismiss Recommendation"
                    className="btn btn-ghost btn-xs btn-circle text-stone-600 dark:text-stone-400 font-medium hover:text-error"
                  >
                    ✕
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
