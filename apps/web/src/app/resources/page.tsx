"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import {
  apiFetch,
  apiJson,
  getCachedUser,
  getErrorMessage,
  getUserId,
  hasSession,
  type SessionUser,
} from "@/lib/api";
import {
  BookOpen,
  Sparkles,
  Search,
  Filter,
  Link as LinkIcon,
  Plus,
  ThumbsUp,
  ThumbsDown,
  ArrowUpRight,
  Video,
  FileText,
  Book,
  GraduationCap,
  Layers,
  X,
} from "lucide-react";

type ResourceType = "course" | "article" | "documentation" | "video" | "book" | "tutorial";
type ResourceDifficulty = "beginner" | "intermediate" | "advanced";

interface Resource {
  _id: string;
  title: string;
  description?: string;
  url: string;
  type: ResourceType;
  category: string;
  difficulty: ResourceDifficulty;
  submittedBy: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  upvotes: string[];
  downvotes: string[];
  score: number;
  tags: string[];
  createdAt: string;
}

function isResourceType(value: string): value is ResourceType {
  return (
    value === "course" ||
    value === "article" ||
    value === "documentation" ||
    value === "video" ||
    value === "book" ||
    value === "tutorial"
  );
}

function isResourceDifficulty(value: string): value is ResourceDifficulty {
  return value === "beginner" || value === "intermediate" || value === "advanced";
}

export default function ResourcesPage() {
  const router = useRouter();
  const { locale } = useApp();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [resources, setResources] = useState<Resource[]>([]);
  const [recommendedResources, setRecommendedResources] = useState<Resource[]>([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState<ResourceDifficulty | "">("");
  const [type, setType] = useState<ResourceType | "">("");

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<ResourceType>("course");
  const [newCategory, setNewCategory] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<ResourceDifficulty>("beginner");
  const [newTags, setNewTags] = useState("");

  const fetchInitialData = useCallback(async () => {
    try {
      const data = await apiJson<Resource[]>("/resources");
      setResources(data);

      const recommended = await apiJson<Resource[]>("/resources/recommend");
      setRecommendedResources(recommended);

    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load resources."));
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!hasSession()) {
      toast.error(locale === "en" ? "Please log in to access resource catalog." : "يرجى تسجيل الدخول للوصول إلى مكتبة المراجع.");
      router.push("/auth/login");
      return;
    }
    setUser(getCachedUser());
    void fetchInitialData();
  }, [fetchInitialData, locale, router]);

  const handleFilterSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (difficulty) params.append("difficulty", difficulty);
      if (type) params.append("type", type);

      const data = await apiJson<Resource[]>(`/resources?${params.toString()}`);
      setResources(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to filter resources."));
    }
  };

  const handleVote = async (resourceId: string, direction: "up" | "down") => {
    try {
      const res = await apiFetch(`/resources/${resourceId}/vote`, {
        method: "PATCH",
        body: JSON.stringify({ direction }),
      });
      if (res.ok) {
        handleFilterSearch();
        const recommended = await apiJson<Resource[]>("/resources/recommend");
        setRecommendedResources(recommended);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update your vote."));
    }
  };

  const handleSubmitResource = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      await apiJson("/resources", {
        method: "POST",
        body: JSON.stringify({
          title: newTitle,
          description: newDesc,
          url: newUrl,
          type: newType,
          category: newCategory,
          difficulty: newDifficulty,
          tags: newTags.split(",").map((s) => s.trim()).filter(Boolean),
        }),
      });

      toast.success(locale === "en" ? "Resource submitted successfully!" : "تمت إضافة المرجع بنجاح وبدء التصويت!");
      setShowSubmitModal(false);
      setNewTitle("");
      setNewDesc("");
      setNewUrl("");
      setNewType("course");
      setNewCategory("");
      setNewDifficulty("beginner");
      setNewTags("");
      fetchInitialData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Resource submission failed."));
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-[#8E1616]"></span>
      </div>
    );
  }

  const isRtl = locale === "ar";
  const currentUserId = getUserId(user);

  const getResourceTypeIcon = (t: ResourceType) => {
    switch (t) {
      case "video": return <Video className="w-3.5 h-3.5 text-red-500" />;
      case "article": return <FileText className="w-3.5 h-3.5 text-primary" />;
      case "book": return <Book className="w-3.5 h-3.5 text-amber-500" />;
      case "course": return <GraduationCap className="w-3.5 h-3.5 text-[#8E1616]" />;
      case "documentation": return <Layers className="w-3.5 h-3.5 text-primary" />;
      default: return <BookOpen className="w-3.5 h-3.5 text-primary" />;
    }
  };

  return (
    <div className={`min-h-screen text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="max-w-6xl mx-auto space-y-8 pt-4">
        
        {/* Header Block */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-xl relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-primary text-primary-content/10 text-primary text-[10px] font-extrabold uppercase tracking-widest font-mono border border-primary/20">
              <BookOpen className="w-3.5 h-3.5" />
              {isRtl ? "مصادر تعليمية مقيمة بواسطة الطلاب" : "COMMUNITY VETTED LEARNING MATERIALS"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content mt-2">
              {isRtl ? "تقييم وتصويت مصادر التعلم" : "Resource Library"}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/70 dark:text-stone-300 font-medium max-w-2xl leading-relaxed">
              {isRtl
                ? "اكتشف واقترح أفضل الدورات، المقالات، التوثيقات التقنية، والفيديوهات المصنفة جودتها عبر تصويت زملائك."
                : "Find learning material that has earned its place through community review, clear difficulty levels, and practical value."}
            </p>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="btn bg-[#8E1616] hover:bg-[#8E1616] text-white border-none rounded-2xl font-bold px-5 text-xs gap-2 shadow-lg shrink-0 z-10 transition-all duration-300 ease-in-out"
          >
            <Plus className="w-4 h-4" />
            {isRtl ? "اقترح مرجعاً جديداً" : "Share a resource"}
          </button>
        </div>

        {/* Learning-plan recommendations */}
        {recommendedResources.length > 0 && (
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center gap-2 border-b border-base-300 pb-3">
              <span className="px-2.5 py-0.5 rounded-xl bg-[#8E1616]/10 text-[#8E1616] text-[10px] font-black uppercase tracking-wider font-mono border border-[#8E1616]/20/20 flex items-center gap-1">
                <Sparkles className="w-3 h-3" />
                FOR YOUR PATH
              </span>
              <div>
                <h3 className="font-extrabold text-sm text-base-content">
                  {isRtl ? "توصيات مراجع تكميلية لمسارك" : "Recommended for your learning plan"}
                </h3>
                <span className="text-[9px] text-base-content/70 dark:text-stone-300 font-medium font-bold uppercase font-mono block">
                  VETTED RESOURCES MATCHING YOUR ROADMAP GOALS
                </span>
              </div>
            </div>

            {/* Recommended resources cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedResources.map((rec) => (
                <div key={rec._id} className="bg-base-100 border border-base-300 p-4 rounded-2xl flex flex-col justify-between space-y-3 relative hover:border-[#8E1616]/40 transition-all shadow-md">
                  <div className="space-y-2 text-xs">
                    <div className="flex items-center gap-1.5">
                      {getResourceTypeIcon(rec.type)}
                      <span className="badge bg-[#8E1616]/15 text-[#8E1616] text-[9px] font-black uppercase tracking-wider border-none rounded-xl px-2 font-mono">
                        {rec.type} • {rec.difficulty}
                      </span>
                    </div>
                    <a
                      href={rec.url} target="_blank" rel="noreferrer"
                      className="font-black text-xs text-base-content leading-tight hover:text-[#8E1616] transition-colors block truncate"
                    >
                      {rec.title}
                    </a>
                    <p className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium line-clamp-2 leading-relaxed">
                      {rec.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-base-300 pt-2.5">
                    <span className="text-[9px] font-mono text-base-content/70 dark:text-stone-300 font-medium font-bold uppercase">
                      Score: {rec.score}
                    </span>
                    <a
                      href={rec.url} target="_blank" rel="noreferrer"
                      className="text-[10px] text-[#8E1616] font-extrabold hover:underline flex items-center gap-1 transition-all duration-300 ease-in-out"
                    >
                      <span>{isRtl ? "ابدأ الدراسة" : "Start Study"}</span>
                      <ArrowUpRight className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter bar and Search */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300 p-6 rounded-3xl space-y-4 shadow-xl">
          <form onSubmit={handleFilterSearch} className="flex flex-col md:flex-row gap-3">
            <div className="relative flex-1">
              <input
                type="text"
                placeholder={isRtl ? "ابحث بعنوان المرجع، الكلمات المفتاحية..." : "Search title, tags..."}
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="input input-bordered w-full rounded-2xl bg-base-100 text-xs pl-9"
              />
              <Search className="w-4 h-4 text-base-content/70 dark:text-stone-400 font-medium absolute left-3 top-3.5" />
            </div>

            <div className="flex flex-wrap gap-2">
              <select
                value={difficulty}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || isResourceDifficulty(value)) setDifficulty(value);
                }}
                className="select select-bordered rounded-2xl bg-base-100 text-xs h-11 px-3 font-semibold"
              >
                <option value="">{isRtl ? "كل المستويات" : "All Difficulties"}</option>
                <option value="beginner">{isRtl ? "مبتدئ" : "Beginner"}</option>
                <option value="intermediate">{isRtl ? "متوسط" : "Intermediate"}</option>
                <option value="advanced">{isRtl ? "متقدم" : "Advanced"}</option>
              </select>

              <select
                value={type}
                onChange={(e) => {
                  const value = e.target.value;
                  if (value === "" || isResourceType(value)) setType(value);
                }}
                className="select select-bordered rounded-2xl bg-base-100 text-xs h-11 px-3 font-semibold"
              >
                <option value="">{isRtl ? "كل الأنواع" : "All Types"}</option>
                <option value="course">{isRtl ? "دورة تدريبية" : "Course"}</option>
                <option value="article">{isRtl ? "مقالة" : "Article"}</option>
                <option value="documentation">{isRtl ? "توثيق رسمي" : "Documentation"}</option>
                <option value="video">{isRtl ? "فيديو" : "Video"}</option>
                <option value="book">{isRtl ? "كتاب" : "Book"}</option>
                <option value="tutorial">{isRtl ? "درس تطبيقي" : "Tutorial"}</option>
              </select>

              <button type="submit" className="btn bg-[#8E1616] hover:bg-[#8E1616] text-white border-none rounded-2xl px-5 text-xs h-11 gap-1.5 font-bold shadow-md transition-all duration-300 ease-in-out">
                <Filter className="w-3.5 h-3.5" />
                {isRtl ? "تصفية" : "Filter"}
              </button>
            </div>
          </form>

          {/* Catalog grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {resources.length === 0 ? (
              <p className="text-xs text-base-content/70 dark:text-stone-400 font-medium text-center py-12 col-span-full font-bold italic">
                {isRtl ? "لا توجد نتائج مراجع تطابق البحث." : "No learning resources match current filter."}
              </p>
            ) : (
              resources.map((res) => (
                <div key={res._id} className="bg-base-100 border border-base-300 p-5 rounded-3xl space-y-4 shadow-xl hover:border-[#8E1616]/20/30 transition-all flex flex-col justify-between">
                  <div className="space-y-3">
                    {/* tag + vote summary */}
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-1.5">
                        {getResourceTypeIcon(res.type)}
                        <span className="badge bg-base-200 text-base-content/70 dark:text-stone-300 font-medium text-[9px] font-black uppercase tracking-wider border-none rounded-2xl px-2 font-mono py-1">
                          {res.type} • {res.difficulty}
                        </span>
                      </div>

                      {/* Upvote/Downvote */}
                      <div className="flex items-center gap-1 rounded-xl border border-[#8E1616]/20/20 bg-[#8E1616]/5 px-2 py-1 font-mono text-[10px] shrink-0">
                        <button
                          onClick={() => handleVote(res._id, "up")}
                          aria-label="Upvote resource"
                          className={`p-1 rounded-xl transition-colors ${currentUserId && res.upvotes?.includes(currentUserId) ? "bg-[#8E1616] text-white" : "text-[#8E1616] hover:bg-[#8E1616]/20"}`}
                        >
                          <ThumbsUp className="w-3 h-3" />
                        </button>
                        <span className="font-black text-base-content min-w-[12px] text-center">{res.score}</span>
                        <button
                          onClick={() => handleVote(res._id, "down")}
                          aria-label="Downvote resource"
                          className={`p-1 rounded-xl transition-colors ${currentUserId && res.downvotes?.includes(currentUserId) ? "bg-red-500 text-white" : "text-red-500 hover:bg-red-500/20"}`}
                        >
                          <ThumbsDown className="w-3 h-3" />
                        </button>
                      </div>
                    </div>

                    {/* meta */}
                    <div className="space-y-1.5">
                      <a
                        href={res.url} target="_blank" rel="noreferrer"
                        className="font-black text-xs text-base-content hover:text-[#8E1616] transition-colors leading-tight line-clamp-2"
                      >
                        {res.title}
                      </a>
                      <p className="text-[11px] text-base-content/70 dark:text-stone-300 font-medium line-clamp-3 leading-relaxed">
                        {res.description || "-"}
                      </p>
                    </div>
                  </div>

                  {/* info footer */}
                  <div className="border-t border-base-300 pt-3 flex justify-between items-center text-[9px]">
                    <div>
                      <span className="text-base-content/70 dark:text-stone-400 font-medium block font-mono">SUBMITTED BY:</span>
                      <span className="font-extrabold text-base-content dark:text-stone-200 font-medium">{res.submittedBy?.name || "Unknown"}</span>
                    </div>
                    <span className="text-base-content/70 dark:text-stone-300 font-medium font-mono font-bold uppercase bg-base-200 border border-base-300 px-2 py-0.5 rounded-2xl">
                      {res.category}
                    </span>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Suggest resource modal overlay */}
        {showSubmitModal && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-base-200 border border-base-300 w-full max-w-sm p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-base-content flex items-center gap-2">
                <LinkIcon className="w-4 h-4 text-[#8E1616]" />
                <span>{isRtl ? "اقتراح مرجع تعليمي جديد" : "Submit New Study Material"}</span>
              </h3>
              <form onSubmit={handleSubmitResource} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium uppercase block">{isRtl ? "عنوان المرجع" : "Title"}</label>
                  <input
                    type="text" required placeholder="e.g. Master Clean Code Principles"
                    value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium uppercase block">{isRtl ? "الرابط الإلكتروني" : "Resource Link URL"}</label>
                  <input
                    type="url" required placeholder="https://example.com/course"
                    value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium uppercase block">{isRtl ? "الوصف" : "Short Description"}</label>
                  <textarea
                    rows={2} placeholder="Explain what topics are covered and why this resource is high-quality..."
                    value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium uppercase block">{isRtl ? "المجال / التقنية" : "Category / Domain"}</label>
                    <input
                      type="text" required placeholder="e.g. Node.js, NextJS"
                      value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium uppercase block">{isRtl ? "نوع المرجع" : "Type"}</label>
                    <select
                      value={newType}
                      onChange={(e) => {
                        if (isResourceType(e.target.value)) setNewType(e.target.value);
                      }}
                      className="select select-bordered w-full rounded-xl bg-base-100 text-xs select-xs h-10 px-3 font-semibold"
                    >
                      <option value="course">Course</option>
                      <option value="article">Article</option>
                      <option value="documentation">Documentation</option>
                      <option value="video">Video</option>
                      <option value="book">Book</option>
                      <option value="tutorial">Tutorial</option>
                    </select>
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium uppercase block">{isRtl ? "مستوى الصعوبة" : "Difficulty"}</label>
                    <select
                      value={newDifficulty}
                      onChange={(e) => {
                        if (isResourceDifficulty(e.target.value)) setNewDifficulty(e.target.value);
                      }}
                      className="select select-bordered w-full rounded-xl bg-base-100 text-xs select-xs h-10 px-3 font-semibold"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/70 dark:text-stone-300 font-medium uppercase block">{isRtl ? "العلامات (مفصولة بفاصلة)" : "Tags"}</label>
                    <input
                      type="text" placeholder="react, basics"
                      value={newTags} onChange={(e) => setNewTags(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                    />
                  </div>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-base-300">
                  <button
                    type="button"
                    onClick={() => setShowSubmitModal(false)}
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-xl font-bold"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-xs sm:btn-sm bg-[#8E1616] hover:bg-[#8E1616] text-white border-none rounded-xl font-bold transition-all duration-300 ease-in-out"
                  >
                    {isRtl ? "اقتراح المرجع" : "Submit Resource"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

      </div>
    </div>
  );
}
