"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppUi } from "@/store/hooks/useAppUi";
import {
  apiFetch,
  apiJson,
  getCachedUser,
  getErrorMessage,
  getUserId,
  hasSession,
  type SessionUser,
} from "@/lib/api";

interface Space {
  _id: string;
  name: string;
  description?: string;
  category: string;
  skills: string[];
  recommended?: boolean;
  matchScore?: number;
}

interface Post {
  _id: string;
  title: string;
  content: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
  };
  upvotes: string[];
  downvotes: string[];
  qualityScore: number;
  tags: string[];
  isArticle: boolean;
  createdAt: string;
}

interface Comment {
  _id: string;
  content: string;
  authorId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    role: string;
  };
  createdAt: string;
}

export default function CommunityPage() {
  const router = useRouter();
  const { locale } = useAppUi();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // Data States
  const [spaces, setSpaces] = useState<Space[]>([]);
  const [selectedSpace, setSelectedSpace] = useState<Space | null>(null);
  const [posts, setPosts] = useState<Post[]>([]);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);
  const [comments, setComments] = useState<Comment[]>([]);

  // Form States
  const [showCreatePost, setShowCreatePost] = useState(false);
  const [newPostTitle, setNewPostTitle] = useState("");
  const [newPostContent, setNewPostContent] = useState("");
  const [newPostTags, setNewPostTags] = useState("");
  const [newPostIsArticle, setNewPostIsArticle] = useState(false);

  const [newCommentContent, setNewCommentContent] = useState("");
  const [flaggedContentId, setFlaggedContentId] = useState<string | null>(null);
  const [flaggedType, setFlaggedType] = useState<"post" | "comment" | "resource" | "mentor_profile" | null>(null);
  const [reportReason, setReportReason] = useState("");

  const fetchPosts = useCallback(async (spaceId: string) => {
    try {
      const data = await apiJson<Post[]>(`/community/spaces/${spaceId}/posts`);
      setPosts(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load posts."));
    }
  }, []);

  const fetchSpaces = useCallback(async () => {
    try {
      const data = await apiJson<Space[]>("/community/spaces");
      setSpaces(data);
      if (data.length > 0) {
        setSelectedSpace(data[0]);
        await fetchPosts(data[0]._id);
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load spaces."));
    } finally {
      setLoading(false);
    }
  }, [fetchPosts]);

  useEffect(() => {
    if (!hasSession()) {
      toast.error(locale === "en" ? "Please log in to access the community." : "يرجى تسجيل الدخول للوصول إلى المجتمع.");
      router.push("/auth/login");
      return;
    }
    setUser(getCachedUser());
    void fetchSpaces();
  }, [fetchSpaces, locale, router]);

  const handleSpaceSelect = (space: Space) => {
    setSelectedSpace(space);
    setSelectedPost(null);
    fetchPosts(space._id);
  };

  const handleVote = async (postId: string, direction: "up" | "down") => {
    try {
      const res = await apiFetch(`/community/posts/${postId}/vote`, {
        method: "PATCH",
        body: JSON.stringify({ direction }),
      });
      if (res.ok && selectedSpace) {
        fetchPosts(selectedSpace._id);
        if (selectedPost && selectedPost._id === postId) {
          const updatedPost = await apiJson<Post>(`/community/posts/${postId}`);
          setSelectedPost(updatedPost);
        }
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to update your vote."));
    }
  };

  const handleCreatePost = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedSpace) return;
    try {
      await apiJson(`/community/spaces/${selectedSpace._id}/posts`, {
        method: "POST",
        body: JSON.stringify({
          title: newPostTitle,
          content: newPostContent,
          tags: newPostTags.split(",").map((t) => t.trim()).filter(Boolean),
          isArticle: newPostIsArticle,
        }),
      });
      toast.success(locale === "en" ? "Post published successfully!" : "تم نشر المنشور بنجاح!");
      setNewPostTitle("");
      setNewPostContent("");
      setNewPostTags("");
      setNewPostIsArticle(false);
      setShowCreatePost(false);
      fetchPosts(selectedSpace._id);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to create post."));
    }
  };

  const handleViewComments = async (post: Post) => {
    setSelectedPost(post);
    try {
      const data = await apiJson<Comment[]>(`/community/posts/${post._id}/comments`);
      setComments(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load comments."));
    }
  };

  const handleAddComment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedPost) return;
    try {
      await apiJson(`/community/posts/${selectedPost._id}/comments`, {
        method: "POST",
        body: JSON.stringify({ content: newCommentContent }),
      });
      setNewCommentContent("");
      const data = await apiJson<Comment[]>(`/community/posts/${selectedPost._id}/comments`);
      setComments(data);
      if (selectedSpace) fetchPosts(selectedSpace._id);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to add comment."));
    }
  };

  const handleReport = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!flaggedContentId || !flaggedType) return;
    try {
      await apiJson(`/community/report`, {
        method: "POST",
        body: JSON.stringify({
          contentType: flaggedType,
          contentId: flaggedContentId,
          reason: reportReason,
        }),
      });
      toast.success(locale === "en" ? "Content flagged for moderator review." : "تم إرسال بلاغك للمراجعة.");
      setFlaggedContentId(null);
      setFlaggedType(null);
      setReportReason("");
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Report submission failed."));
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
  const currentUserId = getUserId(user);

  return (
    <div className={`min-h-screen text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="max-w-6xl mx-auto space-y-6 pt-4">

        {/* Header Block */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-xl relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-extrabold uppercase tracking-widest font-mono border border-emerald-500/20">
              💬 {isRtl ? "مساحة عملية لتبادل الخبرات" : "PEOPLE · PRACTICE · PROGRESS"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content mt-2">
              {isRtl ? "مساحة المجتمع" : "Community Exchange"}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 max-w-2xl leading-relaxed">
              {isRtl
                ? "ناقش مشاكل حقيقية، شارك ما تعلمته، وابنِ سمعتك من خلال مساهمات مفيدة يمكن للمجتمع تقييمها."
                : "Ask better questions, share field notes, and build a visible reputation through useful contributions."}
            </p>
          </div>
          <button
            onClick={() => setShowCreatePost(true)}
            className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-2xl font-bold px-5 text-xs gap-2 shadow-lg shrink-0 z-10"
          >
            ✏️ {isRtl ? "موضوع جديد" : "Start a discussion"}
          </button>
        </div>

        {/* Dual Grid Layout */}
        <div className="grid md:grid-cols-4 gap-6">

          {/* Left Column: Spaces directory */}
          <div className="md:col-span-1 space-y-4">
            <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-2xl p-4 shadow-lg">
              <h3 className="font-extrabold text-[10px] uppercase tracking-widest font-mono text-base-content/50 mb-3">
                {isRtl ? "غرف النقاش" : "Discussion Spaces"}
              </h3>
              <div className="space-y-1.5">
                {spaces.map((space) => {
                  const isActive = selectedSpace?._id === space._id;
                  return (
                    <button
                      key={space._id}
                      onClick={() => handleSpaceSelect(space)}
                      className={`w-full flex items-center justify-between p-2.5 rounded-xl text-xs font-bold transition-all text-start border ${
                        isActive
                          ? "bg-[#10B981]/10 border-[#10B981]/30 text-[#10B981]"
                          : "bg-base-100 hover:bg-base-300 border-transparent text-base-content/70 hover:border-base-300"
                      }`}
                    >
                      <div className="truncate">
                        <span># {space.name}</span>
                        <span className="block text-[9px] text-base-content/40 font-normal mt-0.5 truncate">
                          {space.category}
                        </span>
                      </div>
                      {space.recommended && (
                        <span
                          className="text-[9px] font-bold font-mono px-2 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 border border-emerald-500/20 uppercase tracking-wide shrink-0"
                          title={isRtl ? "موصى به لمهاراتك" : "Recommended for your skills"}
                        >
                          MATCH
                        </span>
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Right Column: Feed and comment split */}
          <div className="md:col-span-3 space-y-6">

            {/* Create Post Dialog Overlay */}
            {showCreatePost && (
              <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-2xl p-6 space-y-4 shadow-xl animate-in fade-in slide-in-from-top-4 duration-250">
                <div className="flex justify-between items-center border-b border-base-300 pb-3">
                  <h3 className="font-extrabold text-sm text-base-content">
                    {isRtl ? "إنشاء منشور في #" : "Publish a new post in #"} {selectedSpace?.name}
                  </h3>
                  <button
                    onClick={() => setShowCreatePost(false)}
                    className="btn btn-circle btn-xs btn-ghost"
                  >
                    ✕
                  </button>
                </div>
                <form onSubmit={handleCreatePost} className="space-y-4 text-xs font-semibold">
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block font-mono tracking-wider">
                      {isRtl ? "عنوان المنشور" : "Title"}
                    </label>
                    <input
                      type="text"
                      required
                      placeholder={isRtl ? "أدخل عنواناً جذاباً..." : "Enter descriptive title..."}
                      value={newPostTitle}
                      onChange={(e) => setNewPostTitle(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block font-mono tracking-wider">
                      {isRtl ? "المحتوى" : "Content (Markdown Supported)"}
                    </label>
                    <textarea
                      required
                      rows={5}
                      placeholder={isRtl ? "اكتب محتوى موضوعك بالتفصيل..." : "Write details about your post..."}
                      value={newPostContent}
                      onChange={(e) => setNewPostContent(e.target.value)}
                      className="textarea textarea-bordered w-full rounded-xl bg-base-100"
                    />
                  </div>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-1">
                      <label className="text-[10px] text-base-content/50 uppercase block font-mono tracking-wider">
                        {isRtl ? "العلامات (مفصولة بفاصلة)" : "Tags (comma separated)"}
                      </label>
                      <input
                        type="text"
                        placeholder="react, typescript, beginners"
                        value={newPostTags}
                        onChange={(e) => setNewPostTags(e.target.value)}
                        className="input input-bordered w-full rounded-xl bg-base-100"
                      />
                    </div>
                    <div className="flex items-center gap-2 pt-5">
                      <input
                        type="checkbox"
                        id="isArticle"
                        checked={newPostIsArticle}
                        onChange={(e) => setNewPostIsArticle(e.target.checked)}
                        className="checkbox checkbox-primary"
                      />
                      <label htmlFor="isArticle" className="text-xs select-none text-base-content/70">
                        {isRtl ? "أنشئها كمقالة تعليمية" : "Publish as educational article"}
                      </label>
                    </div>
                  </div>
                  <div className="flex justify-end gap-2 pt-2">
                    <button
                      type="button"
                      onClick={() => setShowCreatePost(false)}
                      className="btn btn-sm btn-ghost rounded-xl"
                    >
                      {isRtl ? "إلغاء" : "Cancel"}
                    </button>
                    <button
                      type="submit"
                      className="btn btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-bold"
                    >
                      {isRtl ? "نشر الموضوع" : "Publish Post"}
                    </button>
                  </div>
                </form>
              </div>
            )}

            {/* Posts Feed */}
            <div className="space-y-4">
              {posts.length === 0 ? (
                <div className="bg-base-200/80 backdrop-blur-md border border-base-300 p-12 rounded-2xl text-center space-y-3 shadow-lg">
                  <span className="text-3xl">☕</span>
                  <h4 className="font-extrabold text-sm text-base-content">
                    {isRtl ? "لا توجد منشورات هنا بعد" : "No discussions started yet"}
                  </h4>
                  <p className="text-xs text-base-content/50 max-w-sm mx-auto">
                    {isRtl
                      ? "كن أول من يبدأ النقاش وينشر سؤالاً أو مقالاً في هذه الغرفة!"
                      : "Be the first to share a question, article, or resource in this topic!"}
                  </p>
                </div>
              ) : (
                posts.map((post) => (
                  <div
                    key={post._id}
                    className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-2xl p-5 space-y-4 shadow-lg hover:border-[#10B981]/30 transition-all"
                  >
                    {/* Author block */}
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex items-center gap-3">
                        {post.authorId?.avatarUrl ? (
                          <img
                            src={post.authorId.avatarUrl}
                            alt=""
                            className="w-8 h-8 rounded-full object-cover border border-base-300"
                          />
                        ) : (
                          <div className="w-8 h-8 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold text-xs font-sans border border-[#10B981]/30">
                            {(post.authorId?.name || "?").split(" ").map((n) => n[0]).join("")}
                          </div>
                        )}
                        <div>
                          <div className="font-black text-xs text-base-content">
                            {post.authorId?.name || (isRtl ? "مستخدم محذوف" : "Deleted user")}
                            <span className="ml-2 badge badge-neutral text-[8px] uppercase tracking-wide px-1.5 py-0.5 rounded font-mono">
                              {post.authorId?.role}
                            </span>
                          </div>
                          <span className="text-[9px] text-base-content/40 block font-mono">
                            {new Date(post.createdAt).toLocaleDateString(locale === "en" ? "en-US" : "ar-EG", {
                              month: "short",
                              day: "numeric",
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </span>
                        </div>
                      </div>

                      {/* Flag report */}
                      <button
                        onClick={() => {
                          setFlaggedContentId(post._id);
                          setFlaggedType("post");
                        }}
                        className="btn btn-ghost btn-circle btn-xs text-base-content/40 hover:text-red-500"
                        title={isRtl ? "إبلاغ عن محتوى غير لائق" : "Flag content"}
                      >
                        ⚠️
                      </button>
                    </div>

                    {/* Post content */}
                    <div className="space-y-1.5">
                      {post.isArticle && (
                        <span className="badge bg-[#10B981]/15 text-[#059669] text-[9px] font-bold border-none py-1">
                          📚 {isRtl ? "مقالة تعليمية" : "Educational Article"}
                        </span>
                      )}
                      <h3
                        className="font-black text-sm text-base-content leading-tight hover:text-[#10B981] cursor-pointer transition-colors"
                        onClick={() => handleViewComments(post)}
                      >
                        {post.title}
                      </h3>
                      <p className="text-xs text-base-content/75 whitespace-pre-line leading-relaxed">
                        {post.content}
                      </p>
                    </div>

                    {/* Tags row */}
                    {post.tags && post.tags.length > 0 && (
                      <div className="flex flex-wrap gap-1.5">
                        {post.tags.map((t) => (
                          <span
                            key={t}
                            className="text-[10px] font-bold text-base-content/50 font-mono bg-base-100 px-2 py-0.5 rounded-lg border border-base-300"
                          >
                            #{t}
                          </span>
                        ))}
                      </div>
                    )}

                    {/* Footer Interactions */}
                    <div className="flex items-center justify-between border-t border-base-300 pt-3">
                      {/* Voting */}
                      <div className="flex items-center gap-1 bg-base-100 border border-base-300 rounded-full px-2 py-0.5 font-mono text-[10px]">
                        <button
                          onClick={() => handleVote(post._id, "up")}
                          aria-label={`Upvote ${post.title}`}
                          className={`font-black px-1.5 transition-colors ${
                            currentUserId && post.upvotes?.includes(currentUserId)
                              ? "text-[#10B981]"
                              : "hover:text-[#10B981]"
                          }`}
                        >
                          ▲
                        </button>
                        <span className="font-black text-base-content min-w-[12px] text-center">
                          {post.qualityScore}
                        </span>
                        <button
                          onClick={() => handleVote(post._id, "down")}
                          aria-label={`Downvote ${post.title}`}
                          className={`font-black px-1.5 transition-colors ${
                            currentUserId && post.downvotes?.includes(currentUserId)
                              ? "text-red-500"
                              : "hover:text-red-500"
                          }`}
                        >
                          ▼
                        </button>
                      </div>

                      {/* Comment trigger */}
                      <button
                        onClick={() => handleViewComments(post)}
                        className="btn btn-ghost btn-xs text-xs font-bold text-base-content/65 hover:text-[#10B981] rounded-xl flex items-center gap-1.5 transition-colors"
                      >
                        💬 {isRtl ? "التعليقات والمناقشة" : "Comments"}
                      </button>
                    </div>
                  </div>
                ))
              )}
            </div>

            {/* Comments Drawer / Thread display */}
            {selectedPost && (
              <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-2xl p-6 space-y-4 shadow-xl animate-in fade-in duration-200">
                <div className="flex justify-between items-center border-b border-base-300 pb-3">
                  <div>
                    <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider font-mono block">
                      {isRtl ? "مخرجات المناقشة" : "DISCUSSION COMMENTS"}
                    </span>
                    <h3 className="font-extrabold text-sm text-base-content">
                      {selectedPost.title}
                    </h3>
                  </div>
                  <button
                    onClick={() => setSelectedPost(null)}
                    className="btn btn-circle btn-xs btn-ghost"
                  >
                    ✕
                  </button>
                </div>

                {/* Comment list */}
                <div className="space-y-3 max-h-96 overflow-y-auto pr-1">
                  {comments.length === 0 ? (
                    <p className="text-[10px] text-base-content/40 text-center py-6">
                      {isRtl ? "لا توجد تعليقات بعد. ابدأ المناقشة!" : "No replies yet. Start the conversation!"}
                    </p>
                  ) : (
                    comments.map((c) => (
                      <div
                        key={c._id}
                        className="p-3 bg-base-100 border border-base-300 rounded-xl space-y-2 hover:border-[#10B981]/20 transition-colors"
                      >
                        <div className="flex justify-between items-center">
                          <div className="flex items-center gap-2">
                            {c.authorId?.avatarUrl ? (
                              <img
                                src={c.authorId.avatarUrl}
                                alt=""
                                className="w-6 h-6 rounded-full object-cover"
                              />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-[#10B981]/20 text-[#10B981] flex items-center justify-center font-bold text-[9px] font-sans border border-[#10B981]/30">
                                {(c.authorId?.name || "?").split(" ").map((n) => n[0]).join("")}
                              </div>
                            )}
                            <span className="font-extrabold text-[11px] text-base-content block leading-tight">
                              {c.authorId?.name || (isRtl ? "مستخدم محذوف" : "Deleted user")}
                              <span className="ml-1 badge bg-base-200 text-base-content/70 border-none text-[8px] px-1 font-mono uppercase">
                                {c.authorId?.role}
                              </span>
                            </span>
                          </div>
                          <button
                            onClick={() => {
                              setFlaggedContentId(c._id);
                              setFlaggedType("comment");
                            }}
                            className="text-[10px] text-base-content/30 hover:text-red-500 transition-colors"
                            aria-label={`Report comment by ${c.authorId?.name || "deleted user"}`}
                          >
                            ⚠️
                          </button>
                        </div>
                        <p className="text-xs text-base-content/75 leading-normal pl-8">
                          {c.content}
                        </p>
                      </div>
                    ))
                  )}
                </div>

                {/* Add Comment Input Form */}
                <form onSubmit={handleAddComment} className="flex gap-2 pt-2">
                  <input
                    type="text"
                    required
                    placeholder={isRtl ? "اكتب رداً أو سؤالاً..." : "Type your reply..."}
                    value={newCommentContent}
                    onChange={(e) => setNewCommentContent(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                  <button
                    type="submit"
                    className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-4 text-xs font-bold"
                  >
                    {isRtl ? "إرسال" : "Reply"}
                  </button>
                </form>
              </div>
            )}

            {/* Moderation Flag Modal Dialog */}
            {flaggedContentId && (
              <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                <div
                  className="bg-base-200 border border-base-300 w-full max-w-sm p-6 rounded-2xl shadow-xl space-y-4"
                  role="dialog"
                  aria-modal="true"
                  aria-labelledby="community-report-title"
                >
                  <h3 id="community-report-title" className="font-extrabold text-sm text-base-content">
                    ⚠️ {isRtl ? "الإبلاغ عن محتوى غير لائق" : "Submit Moderation Flag"}
                  </h3>
                  <p className="text-xs text-base-content/50">
                    {isRtl
                      ? "يرجى توضيح سبب الإبلاغ عن هذا المحتوى للمشرفين."
                      : "Explain why this content violates community guidelines."}
                  </p>
                  <form onSubmit={handleReport} className="space-y-4 text-xs">
                    <textarea
                      required
                      rows={3}
                      placeholder={isRtl ? "مثال: محتوى غير مرغوب فيه، سب، معلومات مضللة..." : "Reason e.g. spam, abuse, wrong guide..."}
                      value={reportReason}
                      onChange={(e) => setReportReason(e.target.value)}
                      className="textarea textarea-bordered w-full rounded-xl bg-base-100"
                    />
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={() => {
                          setFlaggedContentId(null);
                          setFlaggedType(null);
                        }}
                        className="btn btn-xs sm:btn-sm btn-ghost rounded-lg"
                      >
                        {isRtl ? "إلغاء" : "Cancel"}
                      </button>
                      <button
                        type="submit"
                        className="btn btn-xs sm:btn-sm bg-red-500 hover:bg-red-600 text-white border-none rounded-lg font-bold"
                      >
                        {isRtl ? "إرسال البلاغ" : "Submit Flag"}
                      </button>
                    </div>
                  </form>
                </div>
              </div>
            )}

          </div>
        </div>
      </div>
    </div>
  );
}
