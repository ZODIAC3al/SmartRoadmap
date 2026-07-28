"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { toast } from "react-toastify";
import { useApp } from "@/components/AppContext";
import { apiJson, apiFetch, getCachedUser, hasSession } from "@/lib/api";

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
  const { locale } = useApp();
  const [user, setUser] = useState<any>(null);
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

  useEffect(() => {
    if (!hasSession()) {
      toast.error(locale === "en" ? "Please log in to access the Mentor Network." : "يرجى تسجيل الدخول للوصول إلى شبكة الموجهين.");
      router.push("/auth/login");
      return;
    }
    setUser(getCachedUser());
    fetchInitialData();
  }, []);

  const fetchInitialData = async () => {
    try {
      const allMentors = await apiJson<Mentor[]>("/mentor/profiles");
      setMentors(allMentors);

      const recommended = await apiJson<Mentor[]>("/mentor/profiles/recommend");
      setRecommendedMentors(recommended);

      const mySessions = await apiJson<Session[]>("/mentor/sessions/me");
      setSessions(mySessions);

      // Pre-fill profile edit if user is already a mentor
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
        } catch (e) {}
      }

      setLoading(false);
    } catch (e: any) {
      toast.error(e.message || "Failed to load mentor network data.");
      setLoading(false);
    }
  };

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data = await apiJson<Mentor[]>(`/mentor/profiles?search=${search}`);
      setMentors(data);
    } catch (e) {}
  };

  const handleBookSession = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedMentor) return;

    try {
      const scheduledAt = new Date(`${bookingDate}T${bookingTime}:00`);
      await apiJson("/mentor/sessions", {
        method: "POST",
        body: JSON.stringify({
          mentorId: selectedMentor.userId._id,
          scheduledAt: scheduledAt.toISOString(),
          notes: bookingNotes,
        }),
      });

      toast.success(locale === "en" ? "Session booked successfully! Awaiting response." : "تم حجز الجلسة بنجاح! في انتظار موافقة الموجه.");
      setSelectedMentor(null);
      setBookingDate("");
      setBookingTime("");
      setBookingNotes("");
      // Refresh sessions list
      const mySessions = await apiJson<Session[]>("/mentor/sessions/me");
      setSessions(mySessions);
    } catch (e: any) {
      toast.error(e.message || "Failed to book session.");
    }
  };

  const handleUpdateStatus = async (sessionId: string, status: string, feedback?: string) => {
    try {
      await apiJson(`/mentor/sessions/${sessionId}`, {
        method: "PATCH",
        body: JSON.stringify({ status, feedback }),
      });
      toast.success(locale === "en" ? `Session marked as ${status}.` : `تم تحديث حالة الجلسة إلى: ${status}.`);
      const mySessions = await apiJson<Session[]>("/mentor/sessions/me");
      setSessions(mySessions);
    } catch (e: any) {
      toast.error(e.message || "Action failed.");
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
    } catch (e: any) {
      toast.error(e.message || "Rating submission failed.");
    }
  };

  const handleSetupProfile = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const profile = await apiJson<Mentor>("/mentor/profiles", {
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
      // Reload profile
      const updatedUser = { ...user, role: "mentor" };
      localStorage.setItem("smart_user", JSON.stringify(updatedUser));
      setUser(updatedUser);
      fetchInitialData();
    } catch (e: any) {
      toast.error(e.message || "Failed to save profile.");
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
    <div className={`sr-console min-h-screen text-base-content pb-16 px-4 sm:px-6 lg:px-8 font-sans ${isRtl ? "text-right" : "text-left"}`}>
      <div className="sr-shell max-w-6xl mx-auto space-y-8">
        
        {/* Header Block */}
        <div className="sr-stage sr-signal flex flex-col md:flex-row justify-between items-start md:items-center gap-5 rounded-3xl p-6 sm:p-8">
          <div>
            <span className="sr-kicker">
              {isRtl ? "توجيه مهني وفني مباشر" : "DIRECT CAREER & TECHNICAL MENTORING"}
            </span>
            <h1 className="text-2xl font-black tracking-tight mt-1">
              {isRtl ? "شبكة الموجهين والخبراء" : "Mentor Network"}
            </h1>
            <p className="text-xs text-base-content/50 mt-0.5">
              {isRtl
                ? "احجز جلسات توجيه فردية مع خبراء الصناعة لتسريع خارطة طريقك وتجاوز التحديات."
                : "Work directly with experienced practitioners, unblock difficult decisions, and keep your learning plan moving."}
            </p>
          </div>
          <button
            onClick={() => setShowProfileEdit(true)}
            className="sr-button btn btn-sm"
          >
            {userIsMentor
              ? (isRtl ? "⚙️ إعدادات ملف الموجه" : "Edit mentor profile")
              : (isRtl ? "🎓 انضم كموجه" : "Join the network")}
          </button>
        </div>

        {/* Curated mentor recommendations */}
        {!userIsMentor && recommendedMentors.length > 0 && (
          <div className="sr-panel rounded-2xl p-6 space-y-4">
            <div className="flex items-center justify-between border-b border-[#10B981]/20 pb-3">
              <div className="flex items-center gap-2">
                <span className="sr-chip">CURATED</span>
                <div>
                  <h3 className="font-extrabold text-sm text-base-content">
                    {isRtl ? "موجهون مناسبون لمسارك الحالي" : "Recommended for your current path"}
                  </h3>
                  <span className="text-[8px] text-primary font-bold uppercase font-mono block mt-0.5">
                    MATCHED BY SKILLS, AVAILABILITY, AND LEARNER GOALS
                  </span>
                </div>
              </div>
            </div>

            {/* Recommended mentors grid */}
            <div className="grid md:grid-cols-2 gap-4">
              {recommendedMentors.slice(0, 2).map((rec) => (
                <div key={rec._id} className="sr-card p-4 rounded-xl flex gap-3 relative overflow-hidden">
                  <div className="absolute -top-1 -right-1 bg-[#10B981] text-white font-mono text-[9px] font-black px-2 py-0.5 rounded-bl-lg">
                    {rec.matchScore}% Match
                  </div>
                  {rec.userId.avatarUrl ? (
                    <img
                      src={rec.userId.avatarUrl}
                      alt=""
                      className="w-12 h-12 rounded-full object-cover shrink-0"
                    />
                  ) : (
                    <div className="w-12 h-12 rounded-full bg-primary text-white flex items-center justify-center font-bold text-sm shrink-0 font-sans">
                      {rec.userId.name.split(" ").map((n) => n[0]).join("")}
                    </div>
                  )}
                  <div className="space-y-1.5 flex-1 min-w-0">
                    <h4 className="font-black text-xs text-base-content truncate">{rec.userId.name}</h4>
                    <span className="text-[9px] text-base-content/40 font-bold block uppercase leading-none font-mono">
                      {rec.industry} • {rec.experienceYears} Years Exp
                    </span>
                    <p className="text-[10px] text-primary leading-normal italic font-semibold">
                      💡 {rec.matchReason}
                    </p>
                    <button
                      onClick={() => setSelectedMentor(rec)}
                      className="btn btn-xs bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-lg px-3 mt-1.5 font-bold"
                    >
                      {isRtl ? "احجز جلسة" : "Book session"}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Sessions Manager */}
        <div className="sr-panel rounded-2xl p-6 space-y-4">
          <h3 className="font-extrabold text-xs uppercase tracking-wider font-mono text-base-content/40">
            {isRtl ? "جدول الجلسات الخاص بك" : "Your Booked Mentorship Sessions"}
          </h3>

          <div className="overflow-x-auto">
            {sessions.length === 0 ? (
              <p className="text-xs text-base-content/40 text-center py-6">
                {isRtl ? "لا توجد جلسات مجدولة حالياً." : "No scheduled sessions found."}
              </p>
            ) : (
              <table className="table w-full text-xs">
                <thead>
                  <tr className="border-b border-base-300 uppercase font-mono text-[9px]">
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
                      <tr key={sess._id} className="border-b border-base-300">
                        <td>
                          <div className="flex items-center gap-2">
                            {counterpart.avatarUrl ? (
                              <img src={counterpart.avatarUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                            ) : (
                              <div className="w-6 h-6 rounded-full bg-primary text-white flex items-center justify-center font-bold text-[9px] font-sans">
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
                        <td className="font-mono">
                          {new Date(sess.scheduledAt).toLocaleString(locale === "en" ? "en-US" : "ar-EG", {
                            dateStyle: "medium",
                            timeStyle: "short",
                          })}
                        </td>
                        <td className="max-w-[150px] truncate">{sess.notes || "-"}</td>
                        <td>
                          <span className={`badge border-none font-bold text-[8px] uppercase px-2 py-0.5 rounded font-mono ${
                            sess.status === "accepted" ? "bg-green-500/10 text-green-500" :
                            sess.status === "pending" ? "bg-yellow-500/10 text-yellow-500" :
                            sess.status === "rejected" ? "bg-red-500/10 text-red-500" :
                            sess.status === "completed" ? "bg-blue-500/10 text-blue-500" : "bg-neutral/10 text-neutral-content/40"
                          }`}>
                            {sess.status}
                          </span>
                          {sess.feedback && (
                            <p className="text-[10px] text-base-content/50 italic mt-1 block">
                              📝 Feed: {sess.feedback}
                            </p>
                          )}
                        </td>
                        <td>
                          <div className="flex gap-1.5">
                            {/* Mentor options */}
                            {!isLearnerSession && sess.status === "pending" && (
                              <>
                                <button
                                  onClick={() => handleUpdateStatus(sess._id, "accepted")}
                                  className="btn btn-xs bg-green-500 hover:bg-green-600 text-white border-none rounded-lg px-2"
                                >
                                  ✓
                                </button>
                                <button
                                  onClick={() => handleUpdateStatus(sess._id, "rejected")}
                                  className="btn btn-xs bg-red-500 hover:bg-red-600 text-white border-none rounded-lg px-2"
                                >
                                  ✕
                                </button>
                              </>
                            )}

                            {!isLearnerSession && sess.status === "accepted" && (
                              <button
                                onClick={() => {
                                  const feed = prompt("Provide recommendations for the learner:");
                                  if (feed) handleUpdateStatus(sess._id, "completed", feed);
                                }}
                                className="btn btn-xs bg-blue-500 hover:bg-blue-600 text-white border-none rounded-lg font-bold"
                              >
                                {isRtl ? "إنهاء الجلسة" : "Complete"}
                              </button>
                            )}

                            {/* Learner options */}
                            {isLearnerSession && sess.status === "completed" && (
                              <button
                                onClick={() => setRatingSessionId(sess._id)}
                                className="btn btn-xs bg-yellow-500 hover:bg-yellow-600 text-white border-none rounded-lg font-bold"
                              >
                                ★ {isRtl ? "تقييم الموجه" : "Rate Mentor"}
                              </button>
                            )}

                            {sess.status === "pending" && (
                              <button
                                onClick={() => handleUpdateStatus(sess._id, "cancelled")}
                                className="btn btn-xs btn-ghost text-red-500 hover:bg-red-50 font-bold"
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
          <form onSubmit={handleSearch} className="sr-panel flex gap-2 max-w-md p-2.5 rounded-2xl">
            <input
              type="text"
              placeholder={isRtl ? "ابحث بمهارة معينة أو اسم موجه..." : "Search expertise, industry, bio..."}
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="input input-bordered w-full rounded-xl bg-base-100 text-xs"
            />
            <button type="submit" className="btn bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl text-xs px-4">
              {isRtl ? "بحث" : "Search"}
            </button>
          </form>

          {/* Mentors grid catalog */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {mentors.length === 0 ? (
              <p className="text-xs text-base-content/40 text-center py-6 col-span-full">
                {isRtl ? "لا توجد نتائج مطابقة لفلتر البحث." : "No mentors matched search filters."}
              </p>
            ) : (
              mentors.map((mentor) => (
                <div key={mentor._id} className="sr-card card p-5 rounded-2xl space-y-4">
                  {/* profile head */}
                  <div className="flex gap-3">
                    {mentor.userId.avatarUrl ? (
                      <img src={mentor.userId.avatarUrl} alt="" className="w-10 h-10 rounded-full object-cover border border-base-300" />
                    ) : (
                      <div className="w-10 h-10 rounded-full bg-primary text-white flex items-center justify-center font-bold text-xs font-sans">
                        {mentor.userId.name.split(" ").map((n) => n[0]).join("")}
                      </div>
                    )}
                    <div>
                      <h4 className="font-black text-xs text-base-content leading-tight">{mentor.userId.name}</h4>
                      <span className="text-[9px] text-[#10B981] font-extrabold uppercase font-mono mt-0.5 block">
                        ★ {mentor.rating} ({mentor.ratingCount} Reviews)
                      </span>
                    </div>
                  </div>

                  {/* details */}
                  <div className="space-y-1 text-xs">
                    <div className="flex justify-between font-mono text-[9px] text-base-content/50 leading-none">
                      <span>INDUSTRY:</span>
                      <span className="font-extrabold text-base-content">{mentor.industry}</span>
                    </div>
                    <div className="flex justify-between font-mono text-[9px] text-base-content/50 leading-none">
                      <span>EXPERIENCE:</span>
                      <span className="font-extrabold text-base-content">{mentor.experienceYears} Years</span>
                    </div>
                    <p className="text-[11px] text-base-content/75 leading-normal line-clamp-3 pt-1">
                      {mentor.bio}
                    </p>
                  </div>

                  {/* expertise tags */}
                  <div className="flex flex-wrap gap-1">
                    {mentor.expertise.map((exp) => (
                      <span key={exp} className="text-[9px] bg-base-100 text-base-content/60 font-mono px-2 py-0.5 rounded-lg border border-base-300 font-bold">
                        {exp}
                      </span>
                    ))}
                  </div>

                  {/* book button */}
                  {!userIsMentor && (
                    <button
                      onClick={() => setSelectedMentor(mentor)}
                      className="btn btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-xl font-bold w-full"
                    >
                      📅 {isRtl ? "احجز موعداً" : "Schedule Meeting"}
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
            <div className="sr-panel card w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4">
              <h3 className="font-extrabold text-sm">
                📅 {isRtl ? "جدولة موعد مع" : "Schedule session with"} {selectedMentor.userId.name}
              </h3>

              <div className="bg-primary/5 border border-primary/20 p-3 rounded-xl space-y-1.5">
                <span className="text-[9px] font-mono font-bold text-primary block uppercase">
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
                      className="input input-bordered w-full rounded-xl bg-base-100 font-mono"
                    />
                  </div>
                  <div className="space-y-1">
                    <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "الوقت" : "Time"}</label>
                    <input
                      type="time"
                      required
                      value={bookingTime}
                      onChange={(e) => setBookingTime(e.target.value)}
                      className="input input-bordered w-full rounded-xl bg-base-100 font-mono"
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
                    className="textarea textarea-bordered w-full rounded-xl bg-base-100"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setSelectedMentor(null)}
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-lg"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-xs sm:btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-lg font-bold"
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
            <div className="sr-panel card w-full max-w-md p-6 rounded-2xl shadow-2xl space-y-4 max-h-[85vh] overflow-y-auto">
              <h3 className="font-extrabold text-sm">
                🎓 {isRtl ? "إعداد الملف المهني للموجه" : "Set up Mentor Profile"}
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
                    className="input input-bordered w-full rounded-xl bg-base-100"
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
                      className="input input-bordered w-full rounded-xl bg-base-100 font-mono"
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
                      className="input input-bordered w-full rounded-xl bg-base-100"
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
                    className="textarea textarea-bordered w-full rounded-xl bg-base-100"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "الشهادات المهنية (مفصولة بفاصلة)" : "Certifications"}</label>
                  <input
                    type="text"
                    placeholder="AWS Solutions Architect, PMP"
                    value={certInput}
                    onChange={(e) => setCertInput(e.target.value)}
                    className="input input-bordered w-full rounded-xl bg-base-100"
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
                        className="select select-bordered bg-base-100 rounded-xl select-xs flex-1"
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
                        className="text-red-500 hover:scale-105 transition-transform"
                      >
                        ✕
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={() => {
                      setSlotsInput([...slotsInput, { dayOfWeek: 1, startTime: "14:00", endTime: "16:00" }]);
                    }}
                    className="text-xs text-primary font-bold hover:underline"
                  >
                    + {isRtl ? "إضافة وقت توافر" : "Add Availability Slot"}
                  </button>
                </div>

                <div className="flex justify-end gap-2 pt-2 border-t border-base-300">
                  <button
                    type="button"
                    onClick={() => setShowProfileEdit(false)}
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-lg"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-xs sm:btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-lg font-bold"
                  >
                    {isRtl ? "حفظ وتنشيط الحساب" : "Save and Activate Profile"}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Rating Submission Modal */}
        {ratingSessionId && (
          <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
            <div className="sr-panel card w-full max-w-sm p-6 rounded-2xl shadow-2xl space-y-4">
              <h3 className="font-extrabold text-sm">
                ★ {isRtl ? "تقييم الجلسة والتوجيه" : "Rate Mentor Session"}
              </h3>
              <form onSubmit={handleRateSubmit} className="space-y-4 text-xs font-semibold">
                
                {/* Aspects Grid */}
                <div className="space-y-2">
                  <div className="flex justify-between items-center">
                    <span>{isRtl ? "جودة المساعدة:" : "Session Quality:"}</span>
                    <input
                      type="range" min="1" max="5" value={rateQuality}
                      onChange={(e) => setRateQuality(parseInt(e.target.value))}
                      className="range range-primary range-xs w-36"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{isRtl ? "الفائدة:" : "Helpfulness:"}</span>
                    <input
                      type="range" min="1" max="5" value={rateHelpfulness}
                      onChange={(e) => setRateHelpfulness(parseInt(e.target.value))}
                      className="range range-primary range-xs w-36"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{isRtl ? "الخبرة الفنية:" : "Technical Expertise:"}</span>
                    <input
                      type="range" min="1" max="5" value={rateExpertise}
                      onChange={(e) => setRateExpertise(parseInt(e.target.value))}
                      className="range range-primary range-xs w-36"
                    />
                  </div>
                  <div className="flex justify-between items-center">
                    <span>{isRtl ? "التواصل:" : "Communication:"}</span>
                    <input
                      type="range" min="1" max="5" value={rateCommunication}
                      onChange={(e) => setRateCommunication(parseInt(e.target.value))}
                      className="range range-primary range-xs w-36"
                    />
                  </div>
                </div>

                <div className="space-y-1">
                  <label className="text-[10px] text-base-content/50 uppercase block">{isRtl ? "مراجعة مكتوبة" : "Written Review"}</label>
                  <textarea
                    rows={2}
                    placeholder={isRtl ? "اكتب تعليقك حول الجلسة..." : "What helped you most in this session..."}
                    value={rateReview}
                    onChange={(e) => setRateReview(e.target.value)}
                    className="textarea textarea-bordered w-full rounded-xl bg-base-100"
                  />
                </div>

                <div className="flex justify-end gap-2 pt-2">
                  <button
                    type="button"
                    onClick={() => setRatingSessionId(null)}
                    className="btn btn-xs sm:btn-sm btn-ghost rounded-lg"
                  >
                    {isRtl ? "إلغاء" : "Cancel"}
                  </button>
                  <button
                    type="submit"
                    className="btn btn-xs sm:btn-sm bg-[#10B981] hover:bg-[#059669] text-white border-none rounded-lg font-bold"
                  >
                    {isRtl ? "إرسال التقييم" : "Submit Review"}
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
