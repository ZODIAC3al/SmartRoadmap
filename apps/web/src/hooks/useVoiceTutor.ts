"use client";

import { useEffect, useRef, useState } from "react";
import { apiFetch } from "@/lib/api";

export interface VoiceTutorOptions {
  moduleTitle: string;
  moduleTopics: string[];
  trackTitle: string;
  mode: "expert" | "quiz" | "assistant";
  cheatSheetContent?: string;
}

export function useVoiceTutor(options: VoiceTutorOptions) {
  const [status, setStatus] = useState<"idle" | "connecting" | "ready" | "talking" | "listening" | "error">("idle");
  const [userTranscript, setUserTranscript] = useState("");
  const [agentTranscript, setAgentTranscript] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const wsRef = useRef<WebSocket | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const scriptProcessorRef = useRef<ScriptProcessorNode | null>(null);
  const micStreamRef = useRef<MediaStream | null>(null);
  const playQueueRef = useRef<Float32Array[]>([]);
  const isPlayingRef = useRef(false);
  const playTimeRef = useRef(0);

  // Generate system prompt based on tutor mode
  const getSystemPrompt = () => {
    const topicsStr = options.moduleTopics.join(", ");
    const cheatsheetContext = options.cheatSheetContent
      ? `\nHere are the AI Speech Notes (Reference Guide) generated for this module. Refer to these notes and build on top of them during your explanations:\n"""\n${options.cheatSheetContent}\n"""`
      : "";

    const base = `You are a friendly, concise AI Tutor for SmartRoadmap. The student is learning "${options.moduleTitle}" in the "${options.trackTitle}" track.
Speak clearly, keep your replies under 3 sentences, and ask engaging questions. Avoid long explanations.${cheatsheetContext}`;

    if (options.mode === "expert") {
      return `${base}\nYour goal is to answer any technical questions about: ${topicsStr}. Provide quick code examples if asked, but keep it readable. Rely heavily on the provided AI Speech Notes (Cheat Sheet) to ensure accuracy.`;
    } else if (options.mode === "quiz") {
      return `${base}\nYour goal is to quiz the student verbally on the topics, concepts, and key information detailed in the provided AI Speech Notes (Cheat Sheet).
Ask one concept question at a time based directly on the cheat sheet. Listen to their answer, give brief feedback (correct/incorrect and why), and then ask the next question.`;
    } else {
      return `${base}\nYour goal is to act as a general learning assistant. Help them plan, explain meta-concepts, or motivate them in their software journey. Refer to the provided AI Speech Notes (Cheat Sheet) whenever relevant.`;
    }
  };

  const start = async () => {
    if (status !== "idle") return;
    setStatus("connecting");
    setErrorMsg("");
    setUserTranscript("");
    setAgentTranscript("");

    try {
      // 1. Get temporary single-use token from backend proxy
      const tokenRes = await apiFetch("/voice-agent/token");
      if (!tokenRes.ok) throw new Error("Could not authenticate voice agent session.");
      const { token } = await tokenRes.json();

      // 2. Establish connection to AssemblyAI Voice Agent API
      const wsUrl = `wss://agents.assemblyai.com/v1/ws?token=${token}`;
      const ws = new WebSocket(wsUrl);
      wsRef.current = ws;

      ws.onopen = async () => {
        // Initialize Audio Context at 24kHz mono (required by AssemblyAI Agent)
        const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
        const audioCtx = new AudioContextClass({ sampleRate: 24000 });
        audioContextRef.current = audioCtx;
        playTimeRef.current = audioCtx.currentTime;

        // Request mic access
        const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
        micStreamRef.current = stream;

        const source = audioCtx.createMediaStreamSource(stream);
        // ScriptProcessor captures mic audio chunks (1024 sample buffer)
        const processor = audioCtx.createScriptProcessor(4096, 1, 1);
        scriptProcessorRef.current = processor;

        source.connect(processor);
        processor.connect(audioCtx.destination);

        processor.onaudioprocess = (e) => {
          const inputData = e.inputBuffer.getChannelData(0);
          // Downsample/Convert Float32 samples to Int16
          const pcm16 = new Int16Array(inputData.length);
          for (let i = 0; i < inputData.length; i++) {
            const s = Math.max(-1, Math.min(1, inputData[i]));
            pcm16[i] = s < 0 ? s * 0x8000 : s * 0x7fff;
          }
          // Convert PCM16 buffer to Base64
          const base64 = btoa(
            String.fromCharCode(...new Uint8Array(pcm16.buffer))
          );
          // Stream raw audio frame to AssemblyAI Voice Agent
          if (ws.readyState === WebSocket.OPEN) {
            ws.send(JSON.stringify({ type: "input.audio", audio: base64 }));
          }
        };

        // Update AssemblyAI Voice session config
        ws.send(
          JSON.stringify({
            type: "session.update",
            session: {
              system_prompt: getSystemPrompt(),
              voice: "ivy", // default US english friendly voice
            },
          })
        );

        setStatus("ready");
      };

      ws.onmessage = async (e) => {
        const msg = JSON.parse(e.data);

        if (msg.type === "session.ready") {
          setStatus("listening");
        } else if (msg.type === "reply.audio") {
          // Receive PCM16 base64 chunk from Agent (normalizing base64url formatting)
          const base64 = msg.data.replace(/-/g, "+").replace(/_/g, "/").replace(/\s/g, "");
          const pad = base64.length % 4;
          const padded = pad ? base64 + "=".repeat(4 - pad) : base64;
          const rawBinary = atob(padded);
          const pcmData = new Int16Array(rawBinary.length / 2);
          for (let i = 0; i < pcmData.length; i++) {
            pcmData[i] = (rawBinary.charCodeAt(i * 2 + 1) << 8) | rawBinary.charCodeAt(i * 2);
          }
          // Convert Int16 back to Float32 for Web Audio API playback
          const float32 = new Float32Array(pcmData.length);
          for (let i = 0; i < pcmData.length; i++) {
            float32[i] = pcmData[i] / 32768.0;
          }
          enqueuePlayback(float32);
        } else if (msg.type === "reply.done" && msg.status === "interrupted") {
          // Clear playback queue if student interrupts the agent by speaking
          playQueueRef.current = [];
        } else if (msg.type === "transcript") {
          if (msg.participant === "user") {
            setUserTranscript(msg.text);
            setStatus("listening");
          } else {
            setAgentTranscript(msg.text);
            setStatus("talking");
          }
        }
      };

      ws.onerror = () => {
        setStatus("error");
        setErrorMsg("WebSocket connection error.");
      };

      ws.onclose = () => {
        cleanup();
        setStatus("idle");
      };
    } catch (err: any) {
      cleanup();
      setStatus("error");
      setErrorMsg(err.message || "Failed to start Voice Tutor session.");
    }
  };

  const enqueuePlayback = (float32: Float32Array) => {
    const audioCtx = audioContextRef.current;
    if (!audioCtx) return;

    // Create single-channel buffer at 24kHz
    const buffer = audioCtx.createBuffer(1, float32.length, 24000);
    buffer.getChannelData(0).set(float32);

    const source = audioCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(audioCtx.destination);

    // Schedule play time sequentially to avoid pops/gaps
    const currentTime = audioCtx.currentTime;
    const playTime = Math.max(playTimeRef.current, currentTime);
    source.start(playTime);
    playTimeRef.current = playTime + buffer.duration;
  };

  const stop = () => {
    if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type: "session.terminate" }));
      wsRef.current.close();
    }
    cleanup();
    setStatus("idle");
  };

  const cleanup = () => {
    if (micStreamRef.current) {
      micStreamRef.current.getTracks().forEach((track) => track.stop());
      micStreamRef.current = null;
    }
    if (scriptProcessorRef.current) {
      scriptProcessorRef.current.disconnect();
      scriptProcessorRef.current = null;
    }
    if (audioContextRef.current) {
      audioContextRef.current.close();
      audioContextRef.current = null;
    }
    wsRef.current = null;
  };

  useEffect(() => {
    return () => {
      cleanup();
    };
  }, []);

  return {
    status,
    userTranscript,
    agentTranscript,
    errorMsg,
    start,
    stop,
  };
}
