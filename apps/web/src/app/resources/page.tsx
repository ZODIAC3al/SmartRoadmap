"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { apiJson, apiFetch, getCachedUser, hasSession } from "@/lib/api";

interface Resource {
  _id: string;
  title: string;
  description?: string;
  url: string;
  type: "course" | "article" | "documentation" | "video" | "book" | "tutorial";
  category: string;
  difficulty: "beginner" | "intermediate" | "advanced";
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

export default function ResourcesPage() {
  const router = useRouter();
  const { locale } = useApp();
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [resources, setResources] = useState<Resource[]>([]);
  const [recommendedResources, setRecommendedResources] = useState<Resource[]>([]);
  
  // Filters
  const [search, setSearch] = useState("");
  const [difficulty, setDifficulty] = useState("");
  const [type, setType] = useState("");

  // Submit Modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [newTitle, setNewTitle] = useState("");
  const [newDesc, setNewDesc] = useState("");
  const [newUrl, setNewUrl] = useState("");
  const [newType, setNewType] = useState<any>("course");
  const [newCategory, setNewCategory] = useState("");
  const [newDifficulty, setNewDifficulty] = useState<any>("beginner");
  const [newTags, setNewTags] = useState("");

  useEffect(() => {
    if (!hasSession()) {
      toast.error(locale === "en" ? "Please log in to access resource catalog." : "يرجى تسجيل الدخول للوصول إلى مكتبة المراجع.");
      router.push("/auth/login");
      return;
    }
    setUser(getCachedUser());
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const data = await apiJson<Resource[]>("/resources");
      setResources(data);

      const recommended = await apiJson<Resource[]>("/resources/recommend");
      setRecommendedResources(recommended);

      setLoading(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to load resources.");
      setLoading(false);
    }
  };

  const handleFilterSearch = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    try {
      const params = new URLSearchParams();
      if (search) params.append("search", search);
      if (difficulty) params.append("difficulty", difficulty);
      if (type) params.append("type", type);

      const data = await apiJson<Resource[]>(`/resources?${params.toString()}`);
      setResources(data);
    } catch (e) {}
  };

  // Run filter query on change of dropdowns
  useEffect(() => {
    if (!loading) {
      handleFilterSearch();
    }
  }, [difficulty, type]);

  const handleVote = async (resourceId: string, direction: "up" | "down") => {
    try {
      const res = await apiFetch(`/resources/${resourceId}/vote`, {
        method: "PATCH",
        body: JSON.stringify({ direction }),
      });
      if (res.ok) {
        handleFilterSearch();
        // Refresh recommended if it contains it
        const recommended = await apiJson<Resource[]>("/resources/recommend");
        setRecommendedResources(recommended);
      }
    } catch (e) {}
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
    } catch (e: any) {
      toast.error(e.message || "Resource submission failed.");
    }
  };

  if (loading) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-base-100">
        <span className="loading loading-spinner loading-lg text-[#10B981]"></span>
      </div>
    );
  }

  const isRtl = locale === "ar";

  return (
    <div className={`sr-console min-h-screen text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="sr-shell max-w-6xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="sr-stage sr-signal flex flex-col md:flex-row justify-between items-start md:items-center gap-5 rounded-3xl p-6 sm:p-8">
          <div>
            <span className="sr-kicker">
              {isRtl ? "مصادر تعليمية مقيمة بواسطة الطلاب" : "COMMUNITY VETTED LEARNING MATERIALS"}
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              {isRtl ? "تقييم وتصويت مصادر التعلم" : "Resource Library"}
            </h1>
            <p className="text-xs text-base-content/50 mt-0.5">
              {isRtl
                ? "اكتشف واقترح أفضل الدورات، المقالات، التوثيقات التقنية، والفيديوهات المصنفة جودتها عبر تصويت زملائك."
                : "Find learning material that has earned its place through community review, clear difficulty levels, and practical value."}
            </p>
          </div>
          <button
            onClick={() => setShowSubmitModal(true)}
            className="sr-button btn btn-sm"
          >
            {isRtl ? "🔗 اقترح مرجعاً جديداً" : "Share a resource"}
          </button>
        </div>

        {/* Learning-plan recommendations */}
        {recommendedResources.length > 0 && (
          <div className="sr-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center gap-2 border-b border-[#10B981]/20 pb-3">
              <span className="sr-chip">FOR YOUR PATH</span>
              <div>
                <h3 className="font-extrabold text-sm text-base-content">
                  {isRtl ? "توصيات مراجع تكميلية لمسارك" : "Recommended for your learning plan"}
                </h3>
                <span className="text-[8px] text-primary font-bold uppercase font-mono block mt-0.5">
                  VETTED RESOURCES MATCHING YOUR ROADMAP GOALS
                </span>
              </div>
            </div>

            {/* Recommended resources cards */}
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {recommendedResources.map((rec) => (
                <div key={rec._id} className="sr-card p-4 rounded-xl flex flex-col justify-between space-y-3 relative">
                  <div className="space-y-1.5 text-xs">
                    <span className="badge bg-[#10B981]/15 text-[#059669] text-[8px] font-black uppercase tracking-wider border-none rounded-lg px-2 leading-none font-mono">
                      {rec.type} • {rec.difficulty}
                    </span>
                    <a
                      href={rec.url} target="_blank" rel="noreferrer"
                      className="font-black text-xs text-base-content leading-tight hover:underline block truncate"
                    >
                      {rec.title}
                    </a>
                    <p className="text-[10px] text-base-content/65 line-clamp-2">
                      {rec.description}
                    </p>
                  </div>

                  <div className="flex justify-between items-center border-t border-base-300 pt-2.5">
                    <span className="text-[9px] font-mono text-base-content/40 font-bold uppercase">
                      Score: {rec.score}
                    </span>
                    <a
                      href={rec.url} target="_blank" rel="noreferrer"
                      className="text-[10px] text-primary font-extrabold hover:underline"
                    >
                      {isRtl ? "ابدأ الدراسة ↗" : "Start Study ↗"}
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter bar and Search */}
        <div className="sr-panel p-4 rounded-2xl space-y-4">
          <form onSubmit={handleFilterSearch} className="flex flex-col md:flex-row gap-3">
            <input
              type="text"
              placeholder={isRtl ? "ابحث بعنوان المرجع، الكلمات المفتاحية..." : "Search title, tags..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered rounded-xl bg-base-100 text-xs flex-1"
            />

            <div className="flex flex-wrap gap-2">
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value)}
                className="select select-bordered rounded-xl bg-base-100 select-xs text-xs h-10 px-3 font-semibold"
              >
                <option value="">{isRtl ? "كل المستويات" : "All Difficulties"}</option>
                <option value="beginner">{isRtl ? "مبتدئ" : "Beginner"}</option>
                <option value="intermediate">{isRtl ? "متوسط" : "Intermediate"}</option>
                <option value="advanced">{isRtl ? "متقدم" : "Advanced"}</option>
              </select>

              <select
                value={type}
                onChange={(e) => setType(e.target.value)}
                className="select select-bordered rounded-xl bg-base-100 select-xs text-xs h-10 px-3 font-semibold"
              >
                <option value="">{isRtl ? "كل الأنواع" : "All Types"}</option>
                <option value="course">{isRtl ? "دورة تدريبية" : "Course"}</option>
                <option value="article">{isRtl ? "مقالة" : "Article"}</option>
                <option value="documentation">{isRtl ? "توثيق رسمي" : "Documentation"}</option>
                <option value="video">{isRtl ? "فيديو" : "Video"}</option>
                <option value="book">{isRtl ? "كتاب" : "Book"}</option>
                <option value="tutorial">{isRtl ? "درس تطبيقي" : "Tutorial"}</option>
              </select>

              <button type="submit" className="sr-button btn rounded-xl px-4 text-xs h-10">
                {isRtl ? "تصفية" : "Filter"}
              </button>
            </div>
          </form>

          {/* Catalog grid */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6 pt-2">
            {resources.length === 0 ? (
              <p className="text-xs text-base-content/40 text-center py-12 col-span-full font-bold">
                {isRtl ? "لا توجد نتائج مراجع تطابق البحث." : "No learning resources match current filter."}
              </p>
            ) : (
              resources.map((res) => (
                <div key={res._id} className="sr-card card p-5 rounded-2xl space-y-4">
                  {/* tag + vote summary */}
                  <div className="flex justify-between items-start">
                    <span className="badge bg-base-200 text-base-content/60 text-[8px] font-black uppercase tracking-wider border-none rounded-lg px-2 font-mono py-1">
                      {res.type} • {res.difficulty}
                    </span>

                    {/* Upvote/Downvote */}
                    <div className="flex items-center gap-1 rounded-xl border border-cyan-400/20 bg-cyan-400/[0.06] px-1.5 py-1 font-mono text-[10px] leading-none shrink-0">
                      <button
                        onClick={() => handleVote(res._id, "up")}
                        aria-label="Upvote resource"
                        className={`h-6 w-6 rounded-lg font-black transition-colors ${user && res.upvotes?.includes(user._id) ? "bg-cyan-400 text-slate-950" : "text-cyan-300 hover:bg-cyan-400/15"}`}
                      >
                        +
                      </button>
                      <span className="font-black text-base-content min-w-[10px] text-center">{res.score}</span>
                      <button
                        onClick={() => handleVote(res._id, "down")}
                        aria-label="Downvote resource"
                        className={`h-6 w-6 rounded-lg font-black transition-colors ${user && res.downvotes?.includes(user._id) ? "bg-fuchsia-500 text-white" : "text-fuchsia-300 hover:bg-fuchsia-500/15"}`}
                      >
                        -
                      </button>
                    </div>
                  </div>

                  {/* meta */}
                  <div className="space-y-1.5">
                    <a
                      href={res.url} target="_blank" rel="noreferrer"
                      className="font-black text-xs text-base-content hover:text-[#10B981] transition-colors leading-tight line-clamp-2"
                    >
                      {res.title}
                    </a>
                    <p className="text-[11px] text-base-content/65 line-clamp-3 leading-normal">
                      {res.description || "-"}
                    </p>
                  </div>

                  {/* info footer */}
                  <div className="border-t border-base-300 pt-3 flex justify-between items-center text-[9px]">
                    <div>
                      <span className="text-base-content/40 block font-mono">SUBMITTED BY:</span>
                      <span className="font-extrabold text-base-content/85">{res.submittedBy?.name || "Unknown"}</span>
                    </div>
                    <span className="text-base-content/40 font-mono font-bold uppercase bg-base-200 border border-base-300 px-2 py-0.5 rounded">
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
            <div className="sr-panel card w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4">
              <h3 className="font-extrabold text-sm">
                🔗 {isRtl ? "اقتراح مرجع تعليمي جديد" : "Submit New Study Material"}
              </h3>
              <form onSubmit={handleSubmitResource} className="space-y-3.5 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "عنوان المرجع" : "Title"}</label>
                  <input
                    type="text" required placeholder="e.g. Master Clean Code Principles"
                    value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "الرابط الإلكتروني" : "Resource Link URL"}</label>
                  <input
                    type="url" required placeholder="https://example.com/course"
                    value={newUrl} onChange={(e) => setNewUrl(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100 text-xs font-mono"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "الوصف" : "Short Description"}</label>
                  <textarea
                    rows={2} placeholder="Explain what topics are covered and why this resource is high-quality..."
                    value={newDesc} onChange={(e) => setNewDesc(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>

                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "المجال / التقنية" : "Category / Domain"}</label>
                    <input
                      type="text" required placeholder="e.g. Node.js, NextJS"
                      value={newCategory} onChange={(e) => setNewCategory(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "نوع المرجع" : "Type"}</label>
                    <select
                      value={newType} onChange={(e) => setNewType(e.target.value)}
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
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "مستوى الصعوبة" : "Difficulty"}</label>
                    <select
                      value={newDifficulty} onChange={(e) => setNewDifficulty(e.target.value)}
                      className="select select-bordered w-full rounded-xl bg-base-100 text-xs select-xs h-10 px-3 font-semibold"
                    >
                      <option value="beginner">Beginner</option>
                      <option value="intermediate">Intermediate</option>
                      <option value="advanced">Advanced</option>
                    </select>
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "العلامات (مفصولة بفاصلة)" : "Tags"}</label>
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
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-lg"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-xs sm:btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-lg font-bold"
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
