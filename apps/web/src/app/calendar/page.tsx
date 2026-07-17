"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";
import { motion } from "framer-motion";
import Link from "next/link";

type CalendarEventItem = {
  _id: string;
  title: string;
  type: "study_session" | "quiz_reminder" | "job_interview" | "custom";
  moduleId?: string;
  startAt: string;
  endAt: string;
  completed: boolean;
};

type AvailabilitySlot = {
  dayOfWeek: number;
  startHour: number;
  endHour: number;
};

export default function CalendarPage() {
  const [user, setUser] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [isOffline, setIsOffline] = useState(false);
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);
  
  // Hovered schedule item tooltip state
  const [hoveredEvent, setHoveredEvent] = useState<any>(null);

  // ── New Interactive Event States ─────────────────────────────────────────
  const [showAddModal, setShowAddModal] = useState(false);
  const [newEventTitle, setNewEventTitle] = useState("");
  const [newEventType, setNewEventType] = useState<"study_session" | "quiz_reminder" | "job_interview" | "custom">("study_session");
  const [newEventDay, setNewEventDay] = useState(1); // Monday default
  const [newEventStartHour, setNewEventStartHour] = useState(14);
  const [newEventEndHour, setNewEventEndHour] = useState(16);

  const handleAddEvent = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newEventTitle.trim()) {
      toast.error("Please enter an event title.");
      return;
    }

    const today = new Date();
    const currentDay = today.getDay();
    const distance = (newEventDay + 7 - currentDay) % 7;
    const targetDate = new Date(today);
    targetDate.setDate(today.getDate() + distance);

    const startAt = new Date(targetDate);
    startAt.setHours(newEventStartHour, 0, 0, 0);

    const endAt = new Date(targetDate);
    endAt.setHours(newEventEndHour, 0, 0, 0);

    try {
      const res = await apiFetch("/calendar/events", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          title: newEventTitle.trim(),
          type: newEventType,
          startAt: startAt.toISOString(),
          endAt: endAt.toISOString(),
          completed: false,
        }),
      });

      if (res.ok) {
        const body = await res.json();
        setEvents((prev) => [...prev, body.data]);
        toast.success("Study session saved successfully!");
        setShowAddModal(false);
        setNewEventTitle("");
      }
    } catch {
      toast.error("Could not register event on timeline.");
    }
  };

  const handleDeleteEvent = async (id: string) => {
    try {
      const res = await apiFetch(`/calendar/events/${id}`, {
        method: "DELETE",
      });
      if (res.ok) {
        setEvents((prev) => prev.filter((ev) => ev._id !== id));
        toast.success("Event deleted from calendar.");
        setHoveredEvent(null);
      }
    } catch {
      toast.error("Could not delete timeline event.");
    }
  };


  useEffect(() => {
    if (typeof window === "undefined") return;
    setIsOffline(!navigator.onLine);
    const handleOffline = () => setIsOffline(true);
    const handleOnline = () => setIsOffline(false);
    window.addEventListener("offline", handleOffline);
    window.addEventListener("online", handleOnline);
    return () => {
      window.removeEventListener("offline", handleOffline);
      window.removeEventListener("online", handleOnline);
    };
  }, []);

  useEffect(() => {
    const storedUser = getCachedUser();
    const token = hasSession();
    if (!storedUser || !token) {
      setLoading(false);
      return;
    }
    setUser(storedUser);
    setAvailability(storedUser.studyAvailability || []);

    async function loadEvents() {
      try {
        const res = await apiFetch("/calendar/events");
        if (res.ok) {
          const data = await res.json();
          setEvents(data.data || []);
        }
      } catch (e) {
        console.error("Failed to load calendar events");
      } finally {
        setLoading(false);
      }
    }
    loadEvents();
  }, []);

  const handleAutoSchedule = async () => {
    setLoading(true);
    try {
      const res = await apiFetch("/calendar/auto-schedule", { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setEvents(data.data || []);
        toast.success("Greedy scheduler successfully compiled! Timeline study slots populated.");
      }
    } catch (e) {
      toast.error("Auto scheduling failed.");
    } finally {
      setLoading(false);
    }
  };

  const handleSaveAvailability = async () => {
    try {
      const res = await apiFetch("/auth/me", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ studyAvailability: availability }),
      });
      if (res.ok) {
        toast.success("Study Availability updated successfully!");
        const data = await res.json();
        localStorage.setItem("user", JSON.stringify(data.user));
      }
    } catch (e) {
      toast.error("Failed to save availability settings.");
    }
  };

  const handleToggleDay = (dayNum: number) => {
    const exists = availability.find((a) => a.dayOfWeek === dayNum);
    if (exists) {
      setAvailability(availability.filter((a) => a.dayOfWeek !== dayNum));
    } else {
      setAvailability([...availability, { dayOfWeek: dayNum, startHour: 13, endHour: 20 }]);
    }
  };

  const handleTimeChange = (dayNum: number, start: number, end: number) => {
    setAvailability(
      availability.map((a) => (a.dayOfWeek === dayNum ? { ...a, startHour: start, endHour: end } : a))
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      </div>
    );
  }

  if (!user) {
    return (
      <div className="flex flex-col min-h-[80vh] items-center justify-center p-8 text-center bg-base-100">
        <h2 className="text-2xl font-black text-base-content tracking-tight">Access Restricted</h2>
        <p className="text-sm text-base-content/60 max-w-sm mb-6">
          Please log in to view and customize your calendar timeline scheduler.
        </p>
        <Link href="/auth/login" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl px-6">
          Log In
        </Link>
      </div>
    );
  }

  const daysLabel = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
  const hoursList = [13, 14, 15, 16, 17, 18, 19, 20];
  const pastelColors = [
    "bg-teal-100 dark:bg-teal-950/40 text-teal-800 dark:text-teal-200 border-teal-200",
    "bg-indigo-100 dark:bg-indigo-950/40 text-indigo-800 dark:text-indigo-200 border-indigo-200",
    "bg-purple-100 dark:bg-purple-950/40 text-purple-800 dark:text-purple-200 border-purple-200",
    "bg-amber-100 dark:bg-amber-950/40 text-amber-800 dark:text-amber-200 border-amber-200",
    "bg-pink-100 dark:bg-pink-950/40 text-pink-800 dark:text-pink-200 border-pink-200",
  ];

  return (
    <div className="bg-base-100 text-base-content min-h-screen pb-12 pt-6 px-4 sm:px-8 overflow-y-auto relative">
      
      {/* Offline Alert */}
      {isOffline && (
        <div className="max-w-6xl mx-auto mb-6 bg-amber-500 text-white font-extrabold text-xs px-4 py-3 rounded-2xl flex items-center justify-center gap-2 shadow-md">
          <i className="lni lni-warning text-sm"></i>
          <span>You are offline. Showing locally cached study schedule items.</span>
        </div>
      )}

      <div className="max-w-6xl mx-auto grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
        
        {/* LEFT COLUMN: Isabella Santos Profile Card & Subjects (Image 3 layout) */}
        <motion.aside 
          initial={{ opacity: 0, x: -30 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.5 }}
          className="lg:col-span-3 space-y-6 shrink-0"
        >
          {/* Profile Card */}
          <div className="bg-base-200 border border-base-300 rounded-[2rem] p-6 text-center shadow-sm space-y-4">
            <div className="w-24 h-24 rounded-full overflow-hidden mx-auto border-2 border-indigo-500/20 relative">
              {/* Fallback avatar matching mockup */}
              <div className="w-full h-full bg-amber-400 flex items-center justify-center text-4xl text-white font-bold select-none">
                {user.name?.charAt(0) || "U"}
              </div>
            </div>
            
            <div className="space-y-0.5">
              <h2 className="font-extrabold text-base-content text-base leading-snug">{user.name || "Isabella Santos"}</h2>
              <span className="text-[10px] text-base-content/40 font-bold uppercase tracking-wider block">
                {user.role === "learner" ? "Syllabus Learner" : "Instructor"}
              </span>
            </div>

            <div className="flex gap-2.5 pt-2">
              <button onClick={() => toast.info("Message feature loads on chat window.")} className="btn btn-outline border-base-300 btn-xs text-base-content font-bold rounded-xl flex-1 py-2 h-auto text-[10px]">
                Message
              </button>
              <button className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none btn-xs font-bold rounded-xl flex-1 py-2 h-auto text-[10px]">
                Follow
              </button>
            </div>
          </div>

          {/* Subjects Card */}
          <div className="bg-base-200 border border-base-300 rounded-[2rem] p-6 text-start shadow-sm space-y-4">
            <span className="text-[10px] text-base-content/40 font-extrabold uppercase tracking-widest block">Subjects</span>
            <div className="flex flex-wrap gap-2 pt-1">
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-teal-50 dark:bg-teal-950/40 text-teal-600 border border-teal-200/25">Math</span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-amber-50 dark:bg-amber-950/40 text-amber-600 border border-amber-200/25">Music</span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-indigo-50 dark:bg-indigo-950/40 text-indigo-600 border border-indigo-200/25">Biology</span>
              <span className="px-3.5 py-1.5 rounded-full text-xs font-extrabold bg-purple-50 dark:bg-purple-950/40 text-purple-600 border border-purple-200/25">Foundations</span>
            </div>
          </div>

          {/* Availability Settings panel */}
          <div className="bg-base-200 border border-base-300 rounded-[2rem] p-6 text-start shadow-sm space-y-4">
            <div className="space-y-0.5">
              <h3 className="font-extrabold text-base-content text-sm">Study Slots</h3>
              <p className="text-[10px] text-base-content/40">Choose hours available for syllabus auto-scheduling.</p>
            </div>

            <div className="space-y-2 max-h-48 overflow-y-auto pr-1">
              {[1, 2, 3, 4, 5].map((dayNum) => {
                const activeSlot = availability.find((a) => a.dayOfWeek === dayNum);
                return (
                  <div key={dayNum} className="border border-base-350 rounded-xl p-2.5 bg-base-100 space-y-1.5">
                    <label className="flex items-center gap-2 cursor-pointer font-bold text-[11px] text-base-content">
                      <input
                        type="checkbox"
                        checked={!!activeSlot}
                        onChange={() => handleToggleDay(dayNum)}
                        className="checkbox checkbox-xs checkbox-primary"
                      />
                      <span>{daysLabel[dayNum].slice(0, 3)}</span>
                    </label>

                    {activeSlot && (
                      <div className="flex gap-1.5 items-center">
                        <select
                          className="select select-bordered select-xs bg-base-200 text-[10px]"
                          value={activeSlot.startHour}
                          onChange={(e) => handleTimeChange(dayNum, parseInt(e.target.value), activeSlot.endHour)}
                        >
                          {hoursList.map((h) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                        <span className="text-[10px] text-base-content/40">to</span>
                        <select
                          className="select select-bordered select-xs bg-base-200 text-[10px]"
                          value={activeSlot.endHour}
                          onChange={(e) => handleTimeChange(dayNum, activeSlot.startHour, parseInt(e.target.value))}
                        >
                          {hoursList.map((h) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>

            <button
              onClick={handleSaveAvailability}
              className="btn btn-outline border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white btn-xs btn-block rounded-xl font-bold py-2 h-auto text-[10px]"
            >
              Save availability configuration
            </button>
          </div>
        </motion.aside>

        {/* MIDDLE/RIGHT PANEL STRUCTURE (Image 3 details) */}
        <div className="lg:col-span-9 space-y-8">
          
          {/* Row 1: Calendar Widget + Reviews */}
          <div className="grid grid-cols-1 md:grid-cols-12 gap-6">
            
            {/* Card 1: Schedule session Calendar Grid widget */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="bg-base-200 border border-base-300 rounded-[2rem] p-6 shadow-sm text-start space-y-4 md:col-span-6"
            >
              <div className="flex justify-between items-center text-xs font-bold text-base-content/60">
                <span className="font-extrabold">July 2026</span>
                <div className="flex gap-2">
                  <span className="cursor-pointer">‹</span>
                  <span className="cursor-pointer">›</span>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center text-base-content/40 font-extrabold font-mono">
                <span>S</span><span>M</span><span>T</span><span>W</span><span>T</span><span>F</span><span>S</span>
              </div>
              <div className="grid grid-cols-7 gap-1 text-[10px] text-center font-bold font-mono text-base-content">
                <span className="text-base-content/20">28</span><span className="text-base-content/20">29</span><span className="text-base-content/20">30</span><span>1</span><span>2</span><span>3</span><span>4</span>
                <span>5</span><span>6</span><span>7</span><span>8</span><span>9</span><span className="bg-indigo-500 text-white rounded-full p-0.5">15</span><span>16</span>
                <span>17</span><span>18</span><span>19</span><span>20</span><span>21</span><span>22</span><span>23</span>
              </div>
            </motion.div>

            {/* Card 2: Reviews Panel (mimics Biology Sarah Blue review cards list) */}
            <motion.div 
              initial={{ opacity: 0, y: -20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.3, duration: 0.5 }}
              className="bg-base-200 border border-base-300 rounded-[2rem] p-6 shadow-sm text-start space-y-4 md:col-span-6"
            >
              <span className="text-[10px] text-base-content/40 font-extrabold uppercase tracking-widest block">Reviews</span>
              
              <div className="space-y-3">
                <div className="bg-base-100 border border-base-300 rounded-2xl p-3 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-teal-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">M</div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between items-center w-full gap-8">
                      <span className="font-extrabold text-base-content">Monica Richard</span>
                      <span className="text-[10px] text-amber-500 font-bold">★ 4.5</span>
                    </div>
                    <p className="text-[10px] text-base-content/50 leading-snug">Biology curriculum path generated with excellent RAG citation matching.</p>
                  </div>
                </div>
                
                <div className="bg-base-100 border border-base-300 rounded-2xl p-3 flex gap-3 items-start">
                  <div className="w-7 h-7 rounded-full bg-indigo-500 flex items-center justify-center text-white text-[10px] font-black shrink-0">S</div>
                  <div className="space-y-0.5 text-xs">
                    <div className="flex justify-between items-center w-full gap-8">
                      <span className="font-extrabold text-base-content">Sarah Blue</span>
                      <span className="text-[10px] text-amber-500 font-bold">★ 4.6</span>
                    </div>
                    <p className="text-[10px] text-base-content/50 leading-snug">Mastered JavaScript in record time using custom sandbox execution verification.</p>
                  </div>
                </div>
              </div>
            </motion.div>

          </div>

          {/* Row 2: Current week schedule weekly layout Grid (13:00 to 20:00) */}
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4, duration: 0.5 }}
            className="bg-base-200 border border-base-300 rounded-[2.5rem] p-6 shadow-sm text-start space-y-4"
          >
            <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 border-b border-base-300 pb-3">
              <div>
                <h3 className="font-extrabold text-base-content text-sm">Current week schedule</h3>
                <p className="text-[10px] text-base-content/40 mt-0.5">Click Auto-Schedule to align active roadmap modules to weekly slots.</p>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => setShowAddModal(true)}
                  className="btn btn-outline border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white rounded-xl text-[10px] font-extrabold py-2 h-auto"
                >
                  Add Event ＋
                </button>
                <button
                  onClick={handleAutoSchedule}
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl text-[10px] font-extrabold py-2 h-auto"
                >
                  Auto-Schedule Study Plan ⚡
                </button>
              </div>
            </div>

            {/* Calendar weekly grid layout */}
            <div className="overflow-x-auto w-full pt-2 relative">
              
              {/* Header hours columns */}
              <div className="grid grid-cols-9 gap-2 text-center text-[10px] text-base-content/40 font-extrabold border-b border-base-300 pb-2 min-w-[650px]">
                <span className="text-left">Days</span>
                {hoursList.map((h) => (
                  <span key={h}>{h}:00</span>
                ))}
              </div>

              {/* Weekly rows */}
              <div className="divide-y divide-base-300/40 min-w-[650px]">
                {[1, 2, 3, 4, 5, 6, 0].map((dayNum) => {
                  const dayEvents = events.filter((ev) => {
                    const d = new Date(ev.startAt);
                    return d.getDay() === dayNum;
                  });

                  return (
                    <div key={dayNum} className="grid grid-cols-9 gap-2 py-3 items-center text-xs">
                      {/* Day Label */}
                      <span className="font-extrabold text-base-content/60 text-left truncate">{daysLabel[dayNum].slice(0, 3)}</span>
                      
                      {/* Hours cells */}
                      {hoursList.map((hour) => {
                        // Find event spanning this hour slot
                        const matchingEvent = dayEvents.find((ev) => {
                          const start = new Date(ev.startAt).getHours();
                          const end = new Date(ev.endAt).getHours();
                          return hour >= start && hour < end;
                        });

                        const isStart = matchingEvent && new Date(matchingEvent.startAt).getHours() === hour;

                        return (
                          <div key={hour} className="h-10 border border-base-300/30 rounded-xl relative flex items-center justify-center">
                            {matchingEvent && isStart && (
                              <div
                                onMouseEnter={() => setHoveredEvent(matchingEvent)}
                                onMouseLeave={() => setHoveredEvent(null)}
                                className={`absolute left-1 right-1 h-8 rounded-xl flex items-center justify-start px-2 border text-[9px] font-extrabold shadow-sm cursor-pointer z-10 truncate transition-all hover:scale-[1.03] ${
                                  pastelColors[matchingEvent.title.length % pastelColors.length]
                                }`}
                                style={{
                                  width: `calc(${
                                    (new Date(matchingEvent.endAt).getHours() - new Date(matchingEvent.startAt).getHours()) * 100
                                  }% - 0.5rem)`,
                                }}
                              >
                                <span>{matchingEvent.title}</span>
                              </div>
                            )}
                          </div>
                        );
                      })}
                    </div>
                  );
                })}
              </div>

               {/* Event details tooltip element on hover */}
              {hoveredEvent && (
                <div
                  onMouseEnter={() => setHoveredEvent(hoveredEvent)}
                  onMouseLeave={() => setHoveredEvent(null)}
                  className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 bg-base-200 border border-base-350 p-4 rounded-2xl shadow-xl z-30 max-w-xs text-start space-y-2 animate-fade-in"
                >
                  <span className="text-[9px] uppercase font-mono font-bold text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded">
                    {hoveredEvent.type}
                  </span>
                  <h4 className="font-extrabold text-xs text-base-content">{hoveredEvent.title}</h4>
                  <p className="text-[10px] text-base-content/50 leading-snug">
                    Session schedule: {new Date(hoveredEvent.startAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })} to {new Date(hoveredEvent.endAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                  </p>
                  <button
                    onClick={() => handleDeleteEvent(hoveredEvent._id)}
                    className="btn btn-error btn-xs btn-block rounded-lg text-[9px] text-white font-extrabold flex items-center justify-center gap-1 mt-1.5 py-1.5 h-auto"
                  >
                    Delete Event 🗑️
                  </button>
                </div>
              )}

            </div>
          </motion.div>

        </div>

      </div>

      {/* Add Custom Event Modal Overlay */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="w-full max-w-md bg-base-250 border border-base-300 rounded-[2rem] p-6 shadow-2xl space-y-5 text-start bg-base-200"
          >
            <div className="flex justify-between items-center">
              <h3 className="font-extrabold text-base-content text-sm">Add Custom Event</h3>
              <button
                onClick={() => setShowAddModal(false)}
                className="text-base-content/40 hover:text-base-content text-sm font-bold"
              >
                ✕
              </button>
            </div>

            <form onSubmit={handleAddEvent} className="space-y-4">
              <div className="form-control">
                <label className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Event Title</label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Study React Components"
                  value={newEventTitle}
                  onChange={(e) => setNewEventTitle(e.target.value)}
                  className="input input-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                />
              </div>

              <div className="form-control">
                <label className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Event Type</label>
                <select
                  value={newEventType}
                  onChange={(e: any) => setNewEventType(e.target.value)}
                  className="select select-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                >
                  <option value="study_session">Study Session 📖</option>
                  <option value="quiz_reminder">Quiz Reminder ✏️</option>
                  <option value="job_interview">Job Interview 💼</option>
                  <option value="custom">Custom 🎯</option>
                </select>
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div className="form-control">
                  <label className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Day</label>
                  <select
                    value={newEventDay}
                    onChange={(e) => setNewEventDay(parseInt(e.target.value))}
                    className="select select-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                  >
                    {[1, 2, 3, 4, 5, 6, 0].map((d) => (
                      <option key={d} value={d}>
                        {daysLabel[d].slice(0, 3)}
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Starts At</label>
                  <select
                    value={newEventStartHour}
                    onChange={(e) => setNewEventStartHour(parseInt(e.target.value))}
                    className="select select-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                  >
                    {hoursList.map((h) => (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    ))}
                  </select>
                </div>

                <div className="form-control">
                  <label className="text-[10px] uppercase font-bold text-base-content/50 mb-1">Ends At</label>
                  <select
                    value={newEventEndHour}
                    onChange={(e) => setNewEventEndHour(parseInt(e.target.value))}
                    className="select select-bordered w-full rounded-xl bg-base-100 text-xs h-10 border-base-300"
                  >
                    {hoursList.map((h) => (
                      <option key={h} value={h}>
                        {h}:00
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  type="button"
                  onClick={() => setShowAddModal(false)}
                  className="btn btn-outline border-base-300 text-base-content rounded-xl flex-1 text-xs"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl flex-1 text-xs font-bold"
                >
                  Save Event
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}
    </div>
  );
}
