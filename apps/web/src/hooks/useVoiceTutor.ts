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
      ? `\nHere is the generated AI Cheatsheet / Master Study Guide for this module. Use this content to answer technical questions or create quiz questions:\n"""\n${options.cheatSheetContent.slice(0, 2000)}\n"""`
      : "";

    const base = `You are an AI Voice Tutor for SmartRoadmap specializing in "${options.moduleTitle}" (${options.trackTitle} track).
Module topics: ${topicsStr}.
Keep spoken replies clear, conversational, and under 3 sentences unless explaining a complex topic.
${cheatsheetContext}`;

    if (options.mode === "expert") {
      return `${base}\n
BEHAVIORAL RULES:
1. Act strictly as a subject/module expert.
2. Answer questions using the module's content and cheatsheet as your PRIMARY knowledge source.
3. Explain concepts, give examples, and clarify module-specific questions.
4. DO NOT switch into career advice or generic conversation.
5. IF the learner asks an unrelated question, politely decline and redirect them back to the module topics.`;
    } else if (options.mode === "quiz") {
      return `${base}\n
BEHAVIORAL RULES:
1. You are actively conducting an oral quiz. DO NOT behave like a normal open-ended voice assistant.
2. Generate questions based on the module's topics and cheatsheet.
3. START THE SESSION by immediately asking the first question. DO NOT wait for the user to speak first.
4. Ask EXACTLY ONE question at a time and WAIT for the learner to answer.
5. When the learner answers, evaluate it. Briefly explain why it is correct or incorrect, then immediately ask the next question.
6. Keep track of the learner's score/progress internally and mention it periodically (e.g., "That's 3 out of 3! Next question...").`;
    } else {
      return `${base}\n
BEHAVIORAL RULES:
1. Provide open-ended tutoring, study guidance, and career advice related to the learner's current path.
2. You can answer broader questions outside the strict scope of the module, but always tie it back to their context when possible.
3. Act as a supportive, encouraging mentor.`;
    }
  };

  // Generate initial greeting to make the AI speak first
  const getGreeting = () => {
    if (options.mode === "expert") {
      return `Hello! I am your AI Expert for ${options.moduleTitle}. What technical questions can I help you with today?`;
    } else if (options.mode === "quiz") {
      return `Welcome to the ${options.moduleTitle} quiz! I'm ready to begin. Here is your first question:`;
    } else {
      return `Hi there! I'm your general tutor. How can I support your learning journey today?`;
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
              greeting: getGreeting(),
              output: {
                voice: "ivy", // default US english friendly voice
              },
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
