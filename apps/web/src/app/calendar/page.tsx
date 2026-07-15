"use client";

import React, { useState, useEffect } from "react";
import { toast } from "react-toastify";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";

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
  const [events, setEvents] = useState<CalendarEventItem[]>([]);
  
  // Study availability days setting: Mon-Fri slots
  const [availability, setAvailability] = useState<AvailabilitySlot[]>([]);

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
        // Refresh local cache
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
      setAvailability([...availability, { dayOfWeek: dayNum, startHour: 18, endHour: 20 }]);
    }
  };

  const handleTimeChange = (dayNum: number, start: number, end: number) => {
    setAvailability(
      availability.map((a) => (a.dayOfWeek === dayNum ? { ...a, startHour: start, endHour: end } : a))
    );
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      </div>
    );
  }

  const daysLabel = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

  return (
    <div className="bg-slate-50 text-slate-800 min-h-screen pb-12 pt-6 px-4 sm:px-8 overflow-y-auto">
      <div className="max-w-6xl mx-auto space-y-8">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 text-start">
          <div className="space-y-1">
            <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Productivity schedule</span>
            <h1 className="text-3xl font-extrabold text-slate-900 tracking-tight">Timeline Calendar</h1>
          </div>
          <button
            onClick={handleAutoSchedule}
            className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl font-bold text-xs"
          >
            Auto-Schedule Study Plan ⚡
          </button>
        </div>

        {/* Main Columns Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          
          {/* LEFT Availability Config Panel */}
          <div className="lg:col-span-4 bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-6">
            <div className="space-y-1">
              <h3 className="font-bold text-slate-800 text-sm">Availability Settings</h3>
              <p className="text-xs text-slate-400">Define hours you are available for learning roadmap modules.</p>
            </div>

            <div className="space-y-3">
              {[1, 2, 3, 4, 5].map((dayNum) => {
                const activeSlot = availability.find((a) => a.dayOfWeek === dayNum);
                return (
                  <div key={dayNum} className="border border-slate-100 rounded-xl p-3 bg-slate-50 space-y-2">
                    <div className="flex justify-between items-center">
                      <label className="flex items-center gap-2 cursor-pointer font-bold text-xs text-slate-700">
                        <input
                          type="checkbox"
                          checked={!!activeSlot}
                          onChange={() => handleToggleDay(dayNum)}
                          className="checkbox checkbox-xs checkbox-primary"
                        />
                        <span>{daysLabel[dayNum]}</span>
                      </label>
                    </div>

                    {activeSlot && (
                      <div className="flex gap-2 items-center pt-1">
                        <select
                          className="select select-bordered select-xs bg-white text-[11px]"
                          value={activeSlot.startHour}
                          onChange={(e) => handleTimeChange(dayNum, parseInt(e.target.value), activeSlot.endHour)}
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
                            <option key={h} value={h}>{h}:00</option>
                          ))}
                        </select>
                        <span className="text-xs text-slate-400">to</span>
                        <select
                          className="select select-bordered select-xs bg-white text-[11px]"
                          value={activeSlot.endHour}
                          onChange={(e) => handleTimeChange(dayNum, activeSlot.startHour, parseInt(e.target.value))}
                        >
                          {Array.from({ length: 24 }).map((_, h) => (
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
              className="btn btn-outline border-indigo-650 text-indigo-600 hover:bg-indigo-600 hover:text-white btn-sm btn-block rounded-xl font-bold text-xs"
            >
              Save availability configuration
            </button>
          </div>

          {/* RIGHT Calendar Timeline View */}
          <div className="lg:col-span-8 space-y-6">
            
            {/* Timeline Scheduler List */}
            <div className="bg-white border border-slate-100 rounded-2xl p-6 shadow-sm text-start space-y-4">
              <h3 className="font-bold text-slate-800 text-sm">Scheduled study timeline sessions</h3>
              
              <div className="space-y-4 pt-2">
                {events.length > 0 ? (
                  events.map((ev, i) => (
                    <div key={ev._id} className="flex gap-4 border-l-4 border-indigo-500 pl-4 py-1">
                      <div className="min-w-[80px]">
                        <span className="text-[10px] font-bold text-slate-400 font-mono block uppercase">
                          {new Date(ev.startAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                        </span>
                        <span className="text-[10px] text-indigo-600 font-bold block">
                          {new Date(ev.startAt).toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h4 className="text-xs font-bold text-slate-800">{ev.title}</h4>
                        <span className="text-[9px] uppercase font-mono font-bold text-slate-400 bg-slate-100 px-2 py-0.5 rounded border border-slate-200">
                          {ev.type}
                        </span>
                      </div>
                    </div>
                  ))
                ) : (
                  <div className="text-xs text-slate-400 italic py-6 text-center">
                    No scheduled sessions. Click &quot;Auto-Schedule&quot; to outline your roadmap automatically!
                  </div>
                )}
              </div>
            </div>

          </div>

        </div>

      </div>
    </div>
  );
}
