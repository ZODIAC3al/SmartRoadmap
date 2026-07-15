"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { toast } from "react-toastify";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";

type Module = {
  id: string;
  title: string;
  description: string;
  difficulty: "beginner" | "intermediate" | "advanced";
  estimatedHours: number;
  topics: string[];
  prerequisites: string[];
  status: "locked" | "in_progress" | "completed" | "failed";
  positionX?: number;
  positionY?: number;
};

type Viewport = {
  x: number;
  y: number;
  zoom: number;
};

type Roadmap = {
  _id: string;
  title: string;
  targetRole: string;
  totalEstimatedHours: number;
  modules: Module[];
  viewport?: Viewport;
  edgeStyle?: "straight" | "curved";
};

export default function RoadmapPage() {
  const [user, setUser] = useState<any>(null);
  const [roadmap, setRoadmap] = useState<Roadmap | null>(null);
  const [selectedModule, setSelectedModule] = useState<Module | null>(null);
  const [loading, setLoading] = useState(true);
  
  // Custom camera pan / zoom state
  const [camera, setCamera] = useState<Viewport>({ x: 0, y: 0, zoom: 1 });
  const [edgeStyle, setEdgeStyle] = useState<"straight" | "curved">("curved");
  const isDragging = useRef(false);
  const dragStart = useRef({ x: 0, y: 0 });
  const canvasRef = useRef<HTMLDivElement>(null);

  // Cheat sheets & Audio summaries integrations
  const [cheatSheet, setCheatSheet] = useState<any>(null);
  const [generatingSheet, setGeneratingSheet] = useState(false);
  const [audioSummary, setAudioSummary] = useState<any>(null);
  const [generatingAudio, setGeneratingAudio] = useState(false);
  const [audioPlaybackRate, setAudioPlaybackRate] = useState(1);
  const audioPlayerRef = useRef<HTMLAudioElement>(null);

  useEffect(() => {
    const storedUser = getCachedUser();
    const token = hasSession();
    if (!storedUser || !token) {
      setLoading(false);
      return;
    }
    setUser(storedUser);

    async function loadRoadmap() {
      try {
        const res = await apiFetch("/roadmap/me");
        if (res.ok) {
          const data = await res.json();
          setRoadmap(data);
          
          if (data.viewport) {
            setCamera(data.viewport);
          }
          if (data.edgeStyle) {
            setEdgeStyle(data.edgeStyle);
          }

          // Default selection
          const next = data.modules.find((m: Module) => m.status === "in_progress") || data.modules[0];
          if (next) setSelectedModule(next);
        }
      } catch (err) {
        console.error("Failed to load roadmap graph");
      } finally {
        setLoading(false);
      }
    }
    loadRoadmap();
  }, []);

  // Update selected module assets: cheats & audio
  useEffect(() => {
    if (!selectedModule) return;
    const mid = selectedModule.id;
    setCheatSheet(null);
    setAudioSummary(null);

    async function loadAssets() {
      try {
        // Fetch cheat sheet
        const sheetRes = await apiFetch(`/cheat-sheets/${mid}`);
        if (sheetRes.ok) {
          const sheetData = await sheetRes.json();
          setCheatSheet(sheetData.data);
        }

        // Fetch audio summary
        const audioRes = await apiFetch(`/audio-summaries/${mid}`);
        if (audioRes.ok) {
          const audioData = await audioRes.json();
          setAudioSummary(audioData.data);
        }
      } catch (e) {}
    }
    loadAssets();
  }, [selectedModule]);

  // Viewport low-frequency debounced patch update
  const saveViewport = useRef(
    debounce(async (id: string, view: Viewport, style: string) => {
      try {
        await apiFetch(`/roadmap/${id}/viewport`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ viewport: view, edgeStyle: style }),
        });
      } catch (e) {}
    }, 800)
  ).current;

  // Viewport dragging handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if ((e.target as HTMLElement).closest(".roadmap-node")) return;
    isDragging.current = true;
    dragStart.current = { x: e.clientX - camera.x, y: e.clientY - camera.y };
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging.current) return;
    const newX = e.clientX - dragStart.current.x;
    const newY = e.clientY - dragStart.current.y;
    const newCam = { ...camera, x: newX, y: newY };
    setCamera(newCam);
    
    if (roadmap) {
      saveViewport(roadmap._id, newCam, edgeStyle);
    }
  };

  const handleMouseUp = () => {
    isDragging.current = false;
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const zoomFactor = 1.05;
    const nextZoom = e.deltaY < 0 ? camera.zoom * zoomFactor : camera.zoom / zoomFactor;
    const boundedZoom = Math.max(0.4, Math.min(2, nextZoom));
    const newCam = { ...camera, zoom: boundedZoom };
    setCamera(newCam);

    if (roadmap) {
      saveViewport(roadmap._id, newCam, edgeStyle);
    }
  };

  // Triggering on-demand generators
  const handleGenerateCheatSheet = async () => {
    if (!selectedModule) return;
    setGeneratingSheet(true);
    try {
      const res = await apiFetch(`/cheat-sheets/${selectedModule.id}/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setCheatSheet(data.data);
        toast.success("AI Cheat Sheet reference guide successfully generated!");
      }
    } catch (e) {
      toast.error("Failed to generate cheat sheet guide.");
    } finally {
      setGeneratingSheet(false);
    }
  };

  const handleGenerateAudio = async () => {
    if (!selectedModule) return;
    setGeneratingAudio(true);
    try {
      const res = await apiFetch(`/audio-summaries/${selectedModule.id}/generate`, { method: "POST" });
      if (res.ok) {
        const data = await res.json();
        setAudioSummary(data.data);
        toast.success("Generation queued. Synthesizing audio guide narration...");
        // Poll for ready state
        pollAudioStatus(selectedModule.id);
      }
    } catch (e) {
      toast.error("Failed to generate audio summary.");
      setGeneratingAudio(false);
    }
  };

  const pollAudioStatus = (mid: string) => {
    const timer = setInterval(async () => {
      try {
        const res = await apiFetch(`/audio-summaries/${mid}`);
        if (res.ok) {
          const data = await res.json();
          if (data.data.status === "ready") {
            setAudioSummary(data.data);
            setGeneratingAudio(false);
            clearInterval(timer);
            toast.success("Audio guide synthesized successfully!");
          } else if (data.data.status === "failed") {
            setGeneratingAudio(false);
            clearInterval(timer);
            toast.error("Audio generation failed: provider unconfigured.");
          }
        }
      } catch (e) {
        clearInterval(timer);
        setGeneratingAudio(false);
      }
    }, 2000);
  };

  if (loading) {
    return (
      <div className="flex min-h-screen bg-slate-50 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-indigo-600"></span>
      </div>
    );
  }

  if (!roadmap) {
    return (
      <div className="flex flex-col min-h-screen bg-slate-50 items-center justify-center p-4 text-center">
        <h2 className="text-2xl font-black mb-2 text-slate-800 tracking-tight">No Active Career Roadmap</h2>
        <p className="text-sm text-slate-500 max-w-sm mb-6">Define your target role to build your visual learning graph.</p>
        <Link href="/onboarding" className="btn bg-indigo-600 hover:bg-indigo-700 text-white border-none rounded-xl">
          Generate Path
        </Link>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col select-none overflow-hidden">
      
      {/* Visual edge style toggle toolbar */}
      <header className="bg-white border-b border-slate-100 py-4 px-6 flex justify-between items-center z-10 shadow-sm text-start">
        <div>
          <span className="text-[10px] text-slate-400 font-bold uppercase tracking-wider font-mono">Interactive canvas</span>
          <h1 className="text-xl font-extrabold text-slate-900 tracking-tight">{roadmap.targetRole} Path</h1>
        </div>
        <div className="flex items-center gap-4">
          <div className="flex border border-slate-200 rounded-lg overflow-hidden text-xs">
            <button
              onClick={() => { setEdgeStyle("curved"); if (roadmap) saveViewport(roadmap._id, camera, "curved"); }}
              className={`px-3 py-1.5 font-bold ${edgeStyle === "curved" ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}
            >
              Curved Path
            </button>
            <button
              onClick={() => { setEdgeStyle("straight"); if (roadmap) saveViewport(roadmap._id, camera, "straight"); }}
              className={`px-3 py-1.5 font-bold ${edgeStyle === "straight" ? "bg-indigo-600 text-white" : "bg-white text-slate-600"}`}
            >
              Straight Path
            </button>
          </div>
          <Link href="/practice" className="btn bg-emerald-600 hover:bg-emerald-700 text-white border-none btn-sm rounded-xl font-bold">
            Sandbox Practice
          </Link>
        </div>
      </header>

      {/* Main split canvas & drawer panel */}
      <div className="flex-grow flex relative">
        
        {/* SVG GRAPH CANVAS BOX (TIMAPUSHKIN1 ZIGZAG ROUTE MAPPING) */}
        <div
          ref={canvasRef}
          onMouseDown={handleMouseDown}
          onMouseMove={handleMouseMove}
          onMouseUp={handleMouseUp}
          onMouseLeave={handleMouseUp}
          onWheel={handleWheel}
          className="flex-grow h-[85vh] bg-[radial-gradient(#e2e8f0_1px,transparent_1.5px)] [background-size:24px_24px] cursor-grab active:cursor-grabbing relative overflow-hidden"
        >
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <g transform={`translate(${camera.x}, ${camera.y}) scale(${camera.zoom})`}>
              
              {/* Draw prerequisites path connections */}
              {roadmap.modules.map((mod, index) => {
                // Calculate automatic default positions in horizontal zigzag if not present
                const srcX = mod.positionX ?? ((index % 3) * 220 + 120);
                const srcY = mod.positionY ?? (Math.floor(index / 3) * 160 + 100);

                return mod.prerequisites.map((prereqId) => {
                  const targetIndex = roadmap.modules.findIndex((m) => m.id === prereqId);
                  if (targetIndex === -1) return null;

                  const targetMod = roadmap.modules[targetIndex];
                  const tgtX = targetMod.positionX ?? ((targetIndex % 3) * 220 + 120);
                  const tgtY = targetMod.positionY ?? (Math.floor(targetIndex / 3) * 160 + 100);

                  // Curve rendering
                  const d = edgeStyle === "curved"
                    ? `M ${tgtX} ${tgtY} C ${(tgtX + srcX) / 2} ${tgtY}, ${(tgtX + srcX) / 2} ${srcY}, ${srcX} ${srcY}`
                    : `M ${tgtX} ${tgtY} L ${srcX} ${srcY}`;

                  return (
                    <path
                      key={`${mod.id}-${prereqId}`}
                      d={d}
                      stroke={mod.status === "completed" ? "#10b981" : "#cbd5e1"}
                      strokeWidth={3}
                      strokeDasharray={mod.status === "locked" ? "6" : "0"}
                      fill="none"
                    />
                  );
                });
              })}

              {/* Draw Milestone Node Cards */}
              {roadmap.modules.map((mod, index) => {
                const x = mod.positionX ?? ((index % 3) * 220 + 120);
                const y = mod.positionY ?? (Math.floor(index / 3) * 160 + 100);
                const selected = selectedModule?.id === mod.id;

                let strokeColor = "#cbd5e1";
                let fillGrad = "from-slate-200 to-slate-300";
                
                if (mod.status === "completed") {
                  strokeColor = "#10b981";
                  fillGrad = "from-emerald-400 to-teal-500";
                } else if (mod.status === "in_progress") {
                  strokeColor = "#6366f1";
                  fillGrad = "from-indigo-400 to-violet-500";
                } else if (mod.status === "failed") {
                  strokeColor = "#f59e0b";
                  fillGrad = "from-amber-400 to-amber-600";
                }

                return (
                  <g
                    key={mod.id}
                    transform={`translate(${x - 40}, ${y - 40})`}
                    className="roadmap-node cursor-pointer pointer-events-auto"
                    onClick={() => setSelectedModule(mod)}
                  >
                    {/* Ring highlight on active */}
                    {selected && (
                      <circle cx="40" cy="40" r="48" fill="none" stroke="#6366f1" strokeWidth="2.5" strokeDasharray="3" className="animate-spin" style={{ animationDuration: '8s' }} />
                    )}

                    {/* Outer Node Shield */}
                    <circle
                      cx="40"
                      cy="40"
                      r="36"
                      fill={`url(#grad-${mod.id})`}
                      stroke={strokeColor}
                      strokeWidth={selected ? 4 : 2}
                      className={mod.status === "in_progress" ? "animate-pulse" : ""}
                    />

                    {/* SVG Gradient declaration */}
                    <defs>
                      <linearGradient id={`grad-${mod.id}`} x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stopColor={mod.status === "completed" ? "#10b981" : mod.status === "in_progress" ? "#6366f1" : "#94a3b8"} />
                        <stop offset="100%" stopColor={mod.status === "completed" ? "#047857" : mod.status === "in_progress" ? "#4338ca" : "#64748b"} />
                      </linearGradient>
                    </defs>

                    {/* Icons representations */}
                    <text x="40" y="46" textAnchor="middle" fill="#fff" fontSize="20" fontWeight="bold">
                      {mod.status === "completed" ? "✓" : mod.status === "failed" ? "⚠" : index + 1}
                    </text>

                    {/* Floating label */}
                    <text x="40" y="90" textAnchor="middle" fill="#334155" fontSize="10" fontWeight="bold" className="drop-shadow-sm select-none">
                      {mod.title.substring(0, 16)}...
                    </text>
                  </g>
                );
              })}

            </g>
          </svg>
        </div>

        {/* DETAILS DRAWER ON THE RIGHT */}
        {selectedModule && (
          <aside className="w-96 border-l border-slate-100 bg-white shadow-xl flex flex-col justify-between p-6 z-10 text-start h-[85vh] overflow-y-auto">
            <div className="space-y-6">
              {/* Header */}
              <div className="space-y-1">
                <span className="text-[10px] font-bold text-slate-400 font-mono uppercase tracking-wider block">
                  Module Details
                </span>
                <h2 className="text-xl font-extrabold text-slate-800 leading-tight">{selectedModule.title}</h2>
                <div className="flex gap-2 pt-2">
                  <span className="text-[10px] bg-slate-100 text-slate-500 font-bold px-2 py-0.5 rounded border border-slate-200">
                    {selectedModule.difficulty.toUpperCase()}
                  </span>
                  <span className="text-[10px] bg-indigo-50 text-indigo-600 font-bold px-2 py-0.5 rounded">
                    ⚡ {selectedModule.status.toUpperCase()}
                  </span>
                </div>
              </div>

              {/* Description */}
              <p className="text-xs text-slate-500 leading-relaxed">{selectedModule.description}</p>

              {/* Topics */}
              <div className="space-y-2">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Key Topics</h4>
                <div className="flex flex-wrap gap-1.5">
                  {selectedModule.topics.map((t, i) => (
                    <span key={i} className="text-[10px] bg-slate-100 text-slate-600 px-2 py-1 rounded">
                      {t}
                    </span>
                  ))}
                </div>
              </div>

              {/* Audio Summaries Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Audio Summary</h4>
                
                {audioSummary ? (
                  audioSummary.status === "ready" ? (
                    <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 space-y-3">
                      <div className="flex items-center justify-between text-xs text-slate-500">
                        <span className="font-semibold">Narration Voice: Puck</span>
                        <span className="font-mono">{audioSummary.durationSeconds}s</span>
                      </div>
                      
                      {/* Audio Speed Rate Controls */}
                      <div className="flex justify-between items-center gap-2">
                        <audio
                          ref={audioPlayerRef}
                          src={`http://localhost:3000${audioSummary.audioUrl}`}
                          controls
                          className="w-full h-8"
                        />
                        <select
                          className="select select-bordered select-xs bg-white text-xs"
                          value={audioPlaybackRate}
                          onChange={(e) => {
                            const val = parseFloat(e.target.value);
                            setAudioPlaybackRate(val);
                            if (audioPlayerRef.current) audioPlayerRef.current.playbackRate = val;
                          }}
                        >
                          <option value="1">1.0x</option>
                          <option value="1.5">1.5x</option>
                          <option value="2">2.0x</option>
                        </select>
                      </div>
                    </div>
                  ) : audioSummary.status === "pending" || generatingAudio ? (
                    <div className="flex items-center justify-center gap-2 text-xs text-slate-400 py-3">
                      <span className="loading loading-spinner loading-xs text-indigo-600"></span>
                      <span>Synthesizing audio narration...</span>
                    </div>
                  ) : (
                    <div className="text-[11px] text-red-500">Audio synthesis failed. Config verify missing.</div>
                  )
                ) : (
                  <button
                    onClick={handleGenerateAudio}
                    disabled={generatingAudio}
                    className="btn btn-outline border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white btn-xs font-bold w-full h-8"
                  >
                    {generatingAudio ? "Synthesizing..." : "Generate Audio Summaries"}
                  </button>
                )}
              </div>

              {/* Cheat Sheets Section */}
              <div className="border-t border-slate-100 pt-4 space-y-3">
                <h4 className="text-xs font-bold text-slate-500 uppercase tracking-wide">Cheatsheet Guide</h4>
                
                {cheatSheet ? (
                  <div className="bg-slate-50 border border-slate-100 rounded-xl p-3.5 max-h-56 overflow-y-auto space-y-3 text-xs leading-relaxed text-slate-600">
                    <pre className="font-sans whitespace-pre-wrap">{cheatSheet.content}</pre>
                    <button
                      onClick={handleGenerateCheatSheet}
                      disabled={generatingSheet}
                      className="text-[10px] text-indigo-600 hover:underline font-bold block"
                    >
                      Regenerate (Remaining limits apply)
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={handleGenerateCheatSheet}
                    disabled={generatingSheet}
                    className="btn btn-outline border-indigo-600 text-indigo-600 hover:bg-indigo-600 hover:text-white btn-xs font-bold w-full h-8"
                  >
                    {generatingSheet ? "Generating Guide..." : "Generate Reference Guides"}
                  </button>
                )}
              </div>

            </div>

            {/* CTAs */}
            <div className="border-t border-slate-100 pt-4 space-y-2">
              <Link
                href={`/quiz/${selectedModule.id}`}
                className={`btn btn-block btn-sm rounded-xl font-bold border-none text-white ${
                  selectedModule.status === "locked"
                    ? "bg-slate-350 cursor-not-allowed"
                    : "bg-indigo-600 hover:bg-indigo-700"
                }`}
                onClick={(e) => { if (selectedModule.status === "locked") e.preventDefault(); }}
              >
                Start Adaptive Quiz
              </Link>
            </div>
          </aside>
        )}

      </div>
    </div>
  );
}

// Simple debounce helper
function debounce<T extends (...args: any[]) => any>(fn: T, delay: number) {
  let timeout: NodeJS.Timeout;
  return function (this: any, ...args: Parameters<T>) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), delay);
  } as unknown as T;
}
