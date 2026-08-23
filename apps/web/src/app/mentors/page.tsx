"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useAppUi } from "@/store/hooks/useAppUi";
import {
  apiJson,
  getCachedUser,
  getErrorMessage,
  hasSession,
  type SessionUser,
} from "@/lib/api";
import {
  Users,
  GraduationCap,
  Sparkles,
  Search,
  Calendar,
  Clock,
  Star,
  CheckCircle2,
  XCircle,
  Building2,
  Award,
  Settings,
  UserPlus,
  MessageSquare,
  Plus,
  Trash2,
  Check,
  X,
} from "lucide-react";

interface Mentor {
  _id: string;
  userId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
    bio?: string;
  };
  expertise: string[];
  experienceYears: number;
  industry: string;
  bio: string;
  certifications: string[];
  availability: {
    dayOfWeek: number;
    startTime: string;
    endTime: string;
  }[];
  rating: number;
  ratingCount: number;
  matchReason?: string;
  matchScore?: number;
}

interface Session {
  _id: string;
  mentorId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  learnerId: {
    _id: string;
    name: string;
    email: string;
    avatarUrl?: string;
  };
  status: "pending" | "accepted" | "rejected" | "completed" | "cancelled";
  scheduledAt: string;
  notes?: string;
  feedback?: string;
}

const DAYS = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const DAYS_AR = ["الأحد", "الإثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"];

export default function MentorsPage() {
  const router = useRouter();
  const { locale } = useAppUi();
  const [user, setUser] = useState<SessionUser | null>(null);
  const [loading, setLoading] = useState(true);

  // States
  const [mentors, setMentors] = useState<Mentor[]>([]);
  const [recommendedMentors, setRecommendedMentors] = useState<Mentor[]>([]);
  const [sessions, setSessions] = useState<Session[]>([]);
  const [search, setSearch] = useState("");

  // Booking Modal
  const [selectedMentor, setSelectedMentor] = useState<Mentor | null>(null);
  const [bookingDate, setBookingDate] = useState("");
  const [bookingTime, setBookingTime] = useState("");
  const [bookingNotes, setBookingNotes] = useState("");

  // Profile Edit modal for Mentors
  const [showProfileEdit, setShowProfileEdit] = useState(false);
  const [expertiseInput, setExpertiseInput] = useState("");
  const [expYearsInput, setExpYearsInput] = useState(3);
  const [industryInput, setIndustryInput] = useState("");
  const [bioInput, setBioInput] = useState("");
  const [certInput, setCertInput] = useState("");
  const [slotsInput, setSlotsInput] = useState<{ dayOfWeek: number; startTime: string; endTime: string }[]>([
    { dayOfWeek: 1, startTime: "14:00", endTime: "16:00" },
  ]);

  // Rating Modal
  const [ratingSessionId, setRatingSessionId] = useState<string | null>(null);
  const [rateQuality, setRateQuality] = useState(5);
  const [rateHelpfulness, setRateHelpfulness] = useState(5);
  const [rateExpertise, setRateExpertise] = useState(5);
  const [rateCommunication, setRateCommunication] = useState(5);
  const [rateReview, setRateReview] = useState("");

  const fetchInitialData = useCallback(async () => {
    try {
      const allMentors = await apiJson<Mentor[]>("/mentor/profiles");
      setMentors(allMentors);

      const recommended = await apiJson<Mentor[]>("/mentor/profiles/recommend");
      setRecommendedMentors(recommended);

      const mySessions = await apiJson<Session[]>("/mentor/sessions/me");
      setSessions(mySessions);

      const currentUsr = getCachedUser();
      if (currentUsr?.role === "mentor") {
        try {
          const profile = await apiJson<Mentor>(`/mentor/profiles/${currentUsr.id || currentUsr._id}`);
          setExpertiseInput(profile.expertise.join(", "));
          setExpYearsInput(profile.experienceYears);
          setIndustryInput(profile.industry);
          setBioInput(profile.bio);
          setCertInput(profile.certifications.join(", "));
          setSlotsInput(profile.availability);
        } catch {
          toast.warning(locale === "en" ? "Your mentor profile could not be pre-filled." : "تعذر تحميل بيانات ملف الموجه.");
        }
      }
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to load mentor network data."));
    } finally {
      setLoading(false);
    }
  }, [locale]);

  useEffect(() => {
    if (!hasSession()) {
      toast.error(locale === "en" ? "Please log in to access the Mentor Network." : "يرجى تسجيل الدخول للوصول إلى شبكة الموجهين.");
      router.push("/auth/login");
      return;
    }
    setUser(getCachedUser());
    void fetchInitialData();
  }, [fetchInitialData, locale, router]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiJson<Mentor[]>(`/mentor/profiles?search=${search}`);
      setMentors(data);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to search mentors."));
    }
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      const mentorId =
        typeof selectedMentor.userId === "object"
          ? (selectedMentor.userId as any)?._id || (selectedMentor.userId as any)?.id || selectedMentor._id
          : selectedMentor.userId || selectedMentor._id;

      const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`);
      await apiJson("/mentor/sessions", {
        method: "POST",
        body: JSON.stringify({
          mentorId: String(mentorId),
          scheduledAt: scheduledAt.toISOString(),
          notes: bookingNotes,
        }),
      });

      toast.success(locale === "en" ? "Session booked successfully! Awaiting response." : "تم حجز الجلسة بنجاح! في انتظار موافقة الموجه.");
      setSelectedMentor(null);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
      const mySessions = await apiJson<Session[]>("/mentor/sessions/me");
      setSessions(mySessions);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to book session."));
    }
  };

  const handleUpdateStatus = async (
    sessionId: string,
    status: Session["status"],
    feedback?: string,
  ) => {
    try {
      await apiJson(`/mentor/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, feedback }),
      });
      toast.success(locale === "en" ? `Session marked as ${status}.` : `تم تحديث حالة الجلسة إلى: ${status}.`);
      const mySessions = await apiJson<Session[]>("/mentor/sessions/me");
      setSessions(mySessions);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Action failed."));
    }
  };

  const handleRateSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!ratingSessionId) return;

    try {
      await apiJson(`/mentor/sessions/${ratingSessionId}/rate`, {
        method: "POST",
        body: JSON.stringify({
          quality: rateQuality,
          helpfulness: rateHelpfulness,
          expertise: rateExpertise,
          communication: rateCommunication,
          review: rateReview,
        }),
      });

      toast.success(locale === "en" ? "Rating submitted successfully!" : "تم تسجيل تقييمك بنجاح!");
      setRatingSessionId(null);
      setRateQuality(5);
      setRateHelpfulness(5);
      setRateExpertise(5);
      setRateCommunication(5);
      setRateReview("");
      fetchInitialData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Rating submission failed."));
    }
  };

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) {
      toast.error(locale === "en" ? "Your session has expired. Please sign in again." : "انتهت الجلسة. يرجى تسجيل الدخول مرة أخرى.");
      return;
    }

    try {
      await apiJson<Mentor>("/mentor/profiles", {
        method: "POST",
        body: JSON.stringify({
          expertise: expertiseInput.split(",").map((s) => s.trim()).filter(Boolean),
          experienceYears: expYearsInput,
          industry: industryInput,
          bio: bioInput,
          certifications: certInput.split(",").map((s) => s.trim()).filter(Boolean),
          availability: slotsInput,
        }),
      });

      toast.success(locale === "en" ? "Mentor Profile saved successfully!" : "تم حفظ ملف الموجه بنجاح!");
      setShowProfileEdit(false);
      const updatedUser: SessionUser = { ...user, role: "mentor" };
      localStorage.setItem("smart_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      fetchInitialData();
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, "Failed to save profile."));
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
  const userIsMentor = user?.role === "mentor";

  return (
    <div className={`min-h-screen text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="max-w-6xl mx-auto space-y-8 pt-4">
        
        {/* Header Block */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-6 sm:p-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-5 shadow-xl relative overflow-hidden">
          <div className="space-y-1 z-10">
            <span className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 text-emerald-500 text-[10px] font-extrabold uppercase tracking-widest font-mono border border-emerald-500/20">
              <Users className="w-3.5 h-3.5" />
              {isRtl ? "توجيه مهني وفني مباشر" : "DIRECT CAREER & TECHNICAL MENTORING"}
            </span>
            <h1 className="text-2xl sm:text-3xl font-black tracking-tight text-base-content mt-2">
              {isRtl ? "شبكة الموجهين والخبراء" : "Mentor Network"}
            </h1>
            <p className="text-xs sm:text-sm text-base-content/60 max-w-2xl leading-relaxed">
              {isRtl
                ? "احجز جلسات توجيه فردية مع خبراء الصناعة لتسريع خارطة طريقك وتجاوز التحديات."
                : "Work directly with experienced practitioners, unblock difficult decisions, and keep your learning plan moving."}
            </p>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-2xl font-bold px-5 text-xs gap-2 shadow-lg shrink-0 z-10"
          >
            {userIsMentor ? (
              <>
                <Settings className="w-4 h-4" />
                {isRtl ? "إعدادات ملف الموجه" : "Edit mentor profile"}
              </>
            ) : (
              <>
                <UserPlus className="w-4 h-4" />
                {isRtl ? "انضم كموجه" : "Join the network"}
              </>
            )}
          </button>
        </div>

        {/* Curated mentor recommendations */}
        {!userIsMentor && recommendedMentors.length > 0 && (
          <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-6 space-y-4 shadow-xl">
            <div className="flex items-center justify-between border-b border-base-300 pb-3">
              <div className="flex items-center gap-2">
                <span className="px-2.5 py-0.5 rounded-md bg-amber-500/10 text-amber-500 text-[10px] font-black uppercase tracking-wider font-mono border border-amber-500/20 flex items-center gap-1">
                  <Sparkles className="w-3 h-3" />
                  CURATED
                </span>
                <div>
                  <h3 className="font-extrabold text-sm text-base-content">
                    {isRtl ? "موجهون مناسبون لمسارك الحالي" : "Recommended for your current path"}
                  </h3>
                  <span className="text-[9px] text-base-content/50 font-bold uppercase font-mono block">
                    MATCHED BY SKILLS, AVAILABILITY, AND LEARNER GOALS
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended mentors grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedMentors.slice(0, 2).map((rec) => (
                <div key={rec._id} className="bg-base-100 border border-base-300 p-4 rounded-2xl flex gap-3 relative overflow-hidden hover:border-[#10B981]/40 transition-all shadow-md">
                  <div className="absolute top-0 right-0 bg-[#10B981] text-white font-mono text-[9px] font-black px-2.5 py-0.5 rounded-bl-xl shadow-sm">
                    {rec.matchScore}% Match
                  </div>
                  {rec.userId.avatarUrl ? (
                    <img
                      src={rec.userId.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover shrink-0 border border-base-300"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-sm shrink-0 font-sans shadow-sm">
                      {rec.userId.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="font-black text-xs text-base-content truncate">{rec.userId.name}</h4>
                    <span className="text-[9px] text-base-content/50 font-bold block uppercase leading-none font-mono">
                      {rec.industry} • {rec.experienceYears} Years Exp
                    </span>
                    <p className="text-[10px] text-[#10B981] leading-normal italic font-semibold flex items-center gap-1">
                      <Sparkles className="w-3 h-3 text-[#10B981] shrink-0" />
                      <span>{rec.matchReason}</span>
                    </p>
                    <button
                      onClick={() => setSelectedMentor(rec)}
                      className="btn btn-xs bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl px-3.5 mt-1 font-bold gap-1"
                    >
                      <Calendar className="w-3 h-3" />
                      {isRtl ? "احجز جلسة" : "Book session"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sessions Manager */}
        <div className="bg-base-200/80 backdrop-blur-md border border-base-300 rounded-3xl p-6 space-y-4 shadow-xl">
          <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-base-content/50 flex items-center gap-1.5">
            <Calendar className="w-4 h-4 text-emerald-500" />
            {isRtl ? "جدول الجلسات الخاص بك" : "Your Booked Mentorship Sessions"}
          </h3>

          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-base-content/40 text-center py-8 italic font-semibold">
                {isRtl ? "لا توجد جلسات مجدولة حالياً." : "No scheduled sessions found."}
              </p>
            ) : (
              <table className="table w-full text-xs">
                <thead>
                  <tr className="border-b border-base-300 uppercase font-mono text-[9px] text-base-content/50">
                    <th>{isRtl ? "المشارك" : "Participant"}</th>
                    <th>{isRtl ? "التاريخ والوقت" : "Date & Time"}</th>
                    <th>{isRtl ? "ملاحظات" : "Notes"}</th>
                    <th>{isRtl ? "الحالة" : "Status"}</th>
                    <th>{isRtl ? "خيارات" : "Actions"}</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.map((sess) => {
                    const isLearnerSession = sess.learnerId._id === user?.id || sess.learnerId._id === user?._id;
                    const counterpart = isLearnerSession ? sess.mentorId : sess.learnerId;
                    return (
                      <tr key={sess._id} className="border-b border-base-300/60 hover:bg-base-100/40 transition-colors">
                        <td>
                          <div className="flex items-center gap-2.5">
                            {counterpart.avatarUrl ? (
                              <img src={counterpart.avatarUrl} alt="" className="w-7 h-7 rounded-full object-cover border border-base-300" />
                            ) : (
                              <div className="w-7 h-7 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-[10px] font-sans">
                                {counterpart.name.split(" ").map((n) => n[0]).join("")}
                              </div>
                            )}
                            <div>
                              <span className="font-extrabold block text-xs">{counterpart.name}</span>
                              <span className="text-[9px] text-base-content/40 block font-mono">
                                {isLearnerSession ? (isRtl ? "موجه" : "MENTOR") : (isRtl ? "طالب" : "LEARNER")}
                              </span>
                            </div>
                          </div>
                        </td>
                        <td className="font-mono text-xs">
                          {new Date(sess.scheduledAt).toLocaleString(locale === "en" ? "en-US" : "ar-EG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="max-w-[150px] truncate text-base-content/70">{sess.notes || "-"}</td>
                        <td>
                          <span className={`badge border-none font-extrabold text-[9px] uppercase px-2.5 py-1 rounded-lg font-mono ${
                            sess.status === "accepted" ? "bg-emerald-500/15 text-emerald-500 border border-emerald-500/30" :
                            sess.status === "pending" ? "bg-amber-500/15 text-amber-500 border border-amber-500/30" :
                            sess.status === "rejected" ? "bg-red-500/15 text-red-500 border border-red-500/30" :
                            sess.status === "completed" ? "bg-blue-500/15 text-blue-500 border border-blue-500/30" : "bg-base-300 text-base-content/50"
                          }`}>
                            {sess.status}
                          </span>
                          {sess.feedback && (
                            <p className="text-[10px] text-base-content/60 italic mt-1 block">
                              📝 Feed: {sess.feedback}
                            </p>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            {!isLearnerSession && sess.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(sess._id, "accepted")}
                                  className="btn btn-xs bg-emerald-500 hover:bg-emerald-600 text-white border-none rounded-lg p-1"
                                  title="Accept"
                                >
                                  <Check className="w-3.5 h-3.5" />
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(sess._id, "rejected")}
                                  className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-none rounded-lg p-1"
                                  title="Reject"
                                >
                                  <X className="w-3.5 h-3.5" />
                                </button>
                              </>
                            )}

                            {!isLearnerSession && sess.status === "accepted" && (
                              <button
                                onClick={() => {
                                  const feed = prompt("Provide recommendations for the learner:");
                                  if (feed) handleUpdateStatus(sess._id, "completed", feed);
                                }}
                                className="btn btn-xs bg-blue-600 hover:bg-blue-700 text-white border-none rounded-lg font-bold"
                              >
                                {isRtl ? "إنهاء الجلسة" : "Complete"}
                              </button>
                            )}

                            {isLearnerSession && sess.status === "completed" && (
                              <button
                                onClick={() => setRatingSessionId(sess._id)}
                                className="btn btn-xs bg-amber-500 hover:bg-amber-600 text-white border-none rounded-lg font-bold flex items-center gap-1"
                              >
                                <Star className="w-3 h-3 fill-current" />
                                {isRtl ? "تقييم الموجه" : "Rate Mentor"}
                              </button>
                            )}

                            {sess.status === "pending" && (
                              <button
                                onClick={() => handleUpdateStatus(sess._id, "cancelled")}
                                className="btn btn-xs btn-ghost text-red-500 hover:bg-red-500/10 font-bold"
                              >
                                {isRtl ? "إلغاء" : "Cancel"}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </div>

        {/* Directory catalog search */}
        <div className="space-y-4">
          <form onSubmit={handleSearch} className="bg-base-200/80 backdrop-blur-md border border-base-300 p-2.5 rounded-2xl flex gap-2 max-w-md shadow-lg">
            <input
              type="text"
              placeholder={isRtl ? "ابحث بمهارة معينة أو اسم موجه..." : "Search expertise, industry, bio..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
            />
            <button type="submit" className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl text-xs px-4 gap-1.5">
              <Search className="w-3.5 h-3.5" />
              {isRtl ? "بحث" : "Search"}
            </button>
          </form>

          {/* Mentors grid catalog */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.length === 0 ? (
              <p className="text-xs text-base-content/40 text-center py-12 col-span-full font-bold">
                {isRtl ? "لا توجد نتائج مطابقة لفلتر البحث." : "No mentors matched search filters."}
              </p>
            ) : (
              mentors.map((mentor) => (
                <div key={mentor._id} className="bg-base-200/80 backdrop-blur-md border border-base-300 p-5 rounded-3xl space-y-4 shadow-xl hover:border-emerald-500/30 transition-all flex flex-col justify-between">
                  <div className="space-y-4">
                    {/* Profile Head */}
                    <div className="flex gap-3 items-center">
                      {mentor.userId.avatarUrl ? (
                        <img src={mentor.userId.avatarUrl} alt="" className="w-11 h-11 rounded-full object-cover border border-base-300" />
                      ) : (
                        <div className="w-11 h-11 rounded-full bg-emerald-600 text-white flex items-center justify-center font-bold text-xs font-sans shadow-md">
                          {mentor.userId.name.split(" ").map((n) => n[0]).join("")}
                        </div>
                      )}
                      <div>
                        <h4 className="font-black text-xs text-base-content leading-tight">{mentor.userId.name}</h4>
                        <span className="text-[10px] text-[#10B981] font-extrabold uppercase font-mono mt-0.5 flex items-center gap-1">
                          <Star className="w-3 h-3 fill-current" />
                          <span>{mentor.rating} ({mentor.ratingCount} Reviews)</span>
                        </span>
                      </div>
                    </div>

                    {/* Details */}
                    <div className="space-y-1.5 text-xs">
                      <div className="flex justify-between font-mono text-[9px] text-base-content/50">
                        <span>INDUSTRY:</span>
                        <span className="font-extrabold text-base-content">{mentor.industry}</span>
                      </div>
                      <div className="flex justify-between font-mono text-[9px] text-base-content/50">
                        <span>EXPERIENCE:</span>
                        <span className="font-extrabold text-base-content">{mentor.experienceYears} Years</span>
                      </div>
                      <p className="text-[11px] text-base-content/75 leading-normal line-clamp-3 pt-1">
                        {mentor.bio}
                      </p>
                    </div>

                    {/* Expertise tags */}
                    <div className="flex flex-wrap gap-1">
                      {mentor.expertise.map((exp) => (
                        <span key={exp} className="text-[9px] bg-base-100 text-base-content/70 font-mono px-2.5 py-0.5 rounded-lg border border-base-300 font-bold">
                          {exp}
                        </span>
                      ))}
                    </div>
                  </div>

                  {/* Book button */}
                  {!userIsMentor && (
                    <button
                      onClick={() => setSelectedMentor(mentor)}
                      className="btn btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-2xl font-bold w-full gap-2 shadow-md mt-2"
                    >
                      <Calendar className="w-4 h-4" />
                      {isRtl ? "احجز موعداً" : "Schedule Meeting"}
                    </button>
                  )}
                </div>
              ))
            )}
          </div>
        </div>

        {/* Schedule session modal */}
        {selectedMentor && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-base-200 border border-base-300 w-full max-w-sm p-6 rounded-3xl shadow-2xl space-y-4">
              <h3 className="font-extrabold text-sm text-base-content flex items-center gap-2">
                <Calendar className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? "جدولة موعد مع" : "Schedule session with"} {selectedMentor.userId.name}</span>
              </h3>

              <div className="bg-emerald-500/10 border border-emerald-500/20 p-3 rounded-2xl space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-emerald-500 block uppercase">
                  {isRtl ? "مواعيد توافر الموجه الأسبوعية" : "Mentor Availability Schedule"}
                </span>
                <div className="space-y-0.5 text-[10px] text-base-content/70">
                  {selectedMentor.availability.map((slot, i) => (
                    <div key={i} className="font-mono">
                      • {isRtl ? DAYS_AR[slot.dayOfWeek] : DAYS[slot.dayOfWeek]}: {slot.startTime} - {slot.endTime}
                    </div>
                  ))}
                </div>
              </div>

              <form onSubmit={handleBookSession} className="space-y-4 text-xs font-semibold">
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "التاريخ" : "Date"}</label>
                    <input
                      type="date"
                      required
                      value={bookingDate}
                      onChange={(e) => setBookingDate(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "الوقت" : "Time"}</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100 font-mono text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "ملاحظات وأهداف الجلسة" : "Session goals"}</label>
                  <textarea
                    rows={2}
                    placeholder={isRtl ? "ما الذي ترغب بمناقشته مع الموجه؟..." : "Describe what you want to study..."}
                    value={bookingNotes}
                    onChange={(e) => setBookingNotes(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-xl font-bold"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-xs sm:btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-bold"
                  >
                    {isRtl ? "تأكيد الطلب" : "Confirm Request"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Mentor Profile Setup / Edit Modal */}
        {showProfileEdit && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="bg-base-200 border border-base-300 w-full max-w-md p-6 rounded-3xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <h3 className="font-extrabold text-sm text-base-content flex items-center gap-2">
                <GraduationCap className="w-4 h-4 text-emerald-500" />
                <span>{isRtl ? "إعداد الملف المهني للموجه" : "Set up Mentor Profile"}</span>
              </h3>
              <form onSubmit={handleSetupProfile} className="space-y-4 text-xs font-semibold">
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "مجالات الخبرة (مفصولة بفاصلة)" : "Expertise tags (comma separated)"}</label>
                  <input
                    type="text"
                    required
                    placeholder="React, AWS, Machine Learning, UI/UX"
                    value={expertiseInput}
                    onChange={(e) => setExpertiseInput(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "سنوات الخبرة" : "Years of Experience"}</label>
                    <input
                      type="number"
                      required
                      value={expYearsInput}
                      onChange={(e) => setExpYearsInput(parseInt(e.target.value) || 0)}
                      className="input input-bordered w-full rounded-xl bg-base-100 font-mono text-xs"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "مجال الصناعة" : "Industry Segment"}</label>
                    <input
                      type="text"
                      required
                      placeholder="e.g. Software, Healthcare"
                      value={industryInput}
                      onChange={(e) => setIndustryInput(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                    />
                  </div>
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "النبذة التعريفية" : "Professional Bio"}</label>
                  <textarea
                    required
                    rows={3}
                    placeholder="Describe your background and what topics you can teach..."
                    value={bioInput}
                    onChange={(e) => setBioInput(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "الشهادات المهنية (مفصولة بفاصلة)" : "Certifications"}</label>
                  <input
                    type="text"
                    placeholder="AWS Solutions Architect, PMP"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
                  />
                </div>

                {/* Slots Availability Schedule */}
                <div className="space-y-2">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "أوقات التوافر الأسبوعية" : "Weekly Availability Slots"}</label>
                  {slotsInput.map((slot, index) => (
                    <div key={index} className="flex gap-1.5 items-center">
                      <select
                        value={slot.dayOfWeek}
                        onChange={(e) => {
                          const val = parseInt(e.target.value);
                          const copy = [...slotsInput];
                          copy[index].dayOfWeek = val;
                          setSlotsInput(copy);
                        }}
                        className="select select-bordered bg-base-100 rounded-xl select-xs flex-1 text-xs"
                      >
                        {DAYS.map((d, dIdx) => (
                          <option key={dIdx} value={dIdx}>
                            {isRtl ? DAYS_AR[dIdx] : d}
                          </option>
                        ))}
                      </select>
                      <input
                        type="time"
                        value={slot.startTime}
                        onChange={(e) => {
                          const copy = [...slotsInput];
                          copy[index].startTime = e.target.value;
                          setSlotsInput(copy);
                        }}
                        className="input input-bordered bg-base-100 rounded-xl input-xs font-mono w-24"
                      />
                      <span className="text-[10px] text-base-content/40 font-bold font-mono">-</span>
                      <input
                        type="time"
                        value={slot.endTime}
                        onChange={(e) => {
                          const copy = [...slotsInput];
                          copy[index].endTime = e.target.value;
                          setSlotsInput(copy);
                        }}
                        className="input input-bordered bg-base-100 rounded-xl input-xs font-mono w-24"
                      />
                      <button
                        type="button"
                        onClick={() => {
                          setSlotsInput(slotsInput.filter((_, sIdx) => sIdx !== index));
                        }}
                        className="btn btn-circle btn-xs btn-ghost text-red-500 hover:bg-red-500/10"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSlotsInput([...slotsInput, { dayOfWeek: 1, startTime: "14:00", endTime: "16:00" }]);
                    }}
                    className="text-xs text-primary font-bold hover:underline flex items-center gap-1 pt-1"
                  >
                    <Plus className="w-3.5 h-3.5" />
                    <span>{isRtl ? "إضافة وقت توافر" : "Add Availability Slot"}</span>
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-base-300">
                  <button
                    type="button"
                    onClick={() => setShowProfileEdit(false)}
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-xl font-bold"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-xs sm:btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-bold"
                  >
                    {isRtl ? "حفظ وتنشيط الحساب" : "Save Profile"}
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
