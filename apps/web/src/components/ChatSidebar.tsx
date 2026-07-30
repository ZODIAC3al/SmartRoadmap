"use client";

import React, { useState, useEffect, useRef } from "react";
import { usePathname } from "next/navigation";
import { useApp } from "@/components/AppContext";
import { apiJson, fetchMe, getErrorMessage } from "@/lib/api";
import { toast } from "react-toastify";

interface Message {
  role: "user" | "model" | "system";
  content: string;
  createdAt?: string;
}

export default function ChatSidebar() {
  const pathname = usePathname();
  const { locale } = useApp();
  const isRtl = locale === "ar";

  const [isOpen, setIsOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [messages, setMessages] = useState<Message[]>([]);
  const [inputText, setInputText] = useState("");
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Hidden on Auth paths
  const isAuthPage = pathname?.startsWith("/auth");

  // Localized string translations
  const t = {
    title: isRtl ? "🤖 رفيق الدراسة الذكي" : "🤖 Study Buddy AI",
    subtitle: isRtl ? "تحدث معي عن البرمجة والمسارات!" : "Ask me anything about coding & roadmaps!",
    placeholder: isRtl ? "اكتب سؤالك هنا..." : "Type your message...",
    send: isRtl ? "إرسال" : "Send",
    reset: isRtl ? "مسح المحادثة" : "Clear Chat",
    loginRequired: isRtl ? "الرجاء تسجيل الدخول أولاً." : "Please log in to chat.",
    errorFetch: isRtl ? "فشل تحميل المحادثة" : "Failed to load chat history.",
    errorSend: isRtl ? "فشل إرسال الرسالة" : "Failed to send message.",
    suggestedTitle: isRtl ? "أسئلة مقترحة:" : "Suggested Prompts:",
  };

  const suggestions = isRtl
    ? [
        "ما هي خطوتي التالية في مساري؟",
        "اشرح لي مفهوم async/await في JavaScript",
        "كيف أجد وظائف مناسبة لمهاراتي؟",
        "ما هي مميزات إطار عمل NestJS؟",
      ]
    : [
        "What is my next step in the roadmap?",
        "Explain async/await in JavaScript",
        "How do I match jobs with my skills?",
        "What are the benefits of NestJS?",
      ];

  useEffect(() => {
    if (isAuthPage) return;
    void (async () => {
      const user = await fetchMe();
      if (!user) {
        setIsLoggedIn(false);
        return;
      }

      setIsLoggedIn(true);
      try {
        const history = await apiJson<Message[]>("/chatbot/history");
        setMessages(history.filter((message) => message.role !== "system"));
      } catch {
        toast.error(t.errorFetch);
      }
    })();
  }, [isAuthPage, t.errorFetch]);

  useEffect(() => {
    if (isOpen) {
      scrollToBottom();
    }
  }, [isOpen, messages, isTyping]);

  const handleSend = async (text: string) => {
    if (!text.trim() || isTyping) return;

    const userMessage: Message = { role: "user", content: text };
    setMessages((prev) => [...prev, userMessage]);
    setInputText("");
    setIsTyping(true);

    try {
      const res = await apiJson<{ response: string }>("/chatbot/message", {
        method: "POST",
        body: JSON.stringify({ message: text }),
      });
      setMessages((prev) => [...prev, { role: "model", content: res.response }]);
    } catch (error: unknown) {
      toast.error(getErrorMessage(error, t.errorSend));
    } finally {
      setIsTyping(false);
    }
  };

  const handleReset = async () => {
    if (!confirm(isRtl ? "هل أنت متأكد من مسح المحادثة بالكامل؟" : "Are you sure you want to clear the entire conversation?")) return;
    try {
      await apiJson("/chatbot/reset", { method: "DELETE" });
      setMessages([]);
    } catch {
      toast.error(isRtl ? "فشل مسح المحادثة" : "Failed to clear conversation.");
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  if (isAuthPage || !isLoggedIn) return null;

  return (
    <>
      {/* Floating Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 left-6 z-[99] btn btn-circle btn-primary shadow-xl hover:scale-105 transition-all duration-200 flex items-center justify-center text-white h-14 w-14"
        title="Toggle AI Chat"
      >
        <span className="text-2xl">🤖</span>
      </button>

      {/* Backdrop overlay */}
      {isOpen && (
        <div
          onClick={() => setIsOpen(false)}
          className="fixed inset-0 bg-black/40 z-[998] transition-opacity duration-300"
        />
      )}

      {/* Slide-out Sidebar Drawer */}
      <div
        className={`fixed top-0 left-0 h-full w-80 sm:w-96 z-[999] bg-base-200 border-r border-base-300 shadow-2xl flex flex-col transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
        style={{ direction: isRtl ? "rtl" : "ltr" }}
      >
        {/* Header */}
        <div className="p-4 border-b border-base-300 bg-base-300 flex justify-between items-center">
          <div>
            <h3 className="font-extrabold text-sm text-[#10B981] flex items-center gap-1.5">
              {t.title}
            </h3>
            <p className="text-[10px] text-base-content/65 font-medium leading-tight">
              {t.subtitle}
            </p>
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={handleReset}
              className="btn btn-ghost btn-xs rounded-lg text-error px-1.5 font-bold"
              title={t.reset}
            >
              🗑️
            </button>
            <button
              onClick={() => setIsOpen(false)}
              className="btn btn-ghost btn-xs btn-circle rounded-lg font-bold text-xs"
            >
              ✕
            </button>
          </div>
        </div>

        {/* Messages Body */}
        <div className="flex-grow overflow-y-auto p-4 space-y-4">
          {messages.length === 0 && (
            <div className="space-y-4 py-4 text-center">
              <span className="text-4xl block">✨</span>
              <p className="text-xs text-base-content/60 px-4">
                {isRtl
                  ? "مرحباً بك! أنا رفيقك الدراسي. اسألني أي سؤال لمساعدتك في المذاكرة وفهم الأكواد!"
                  : "Welcome! I am your study buddy. Feel free to ask me anything to help you learn and understand code!"}
              </p>
              
              {/* Suggestions */}
              <div className="text-left space-y-2 mt-4 px-2" style={{ direction: isRtl ? "rtl" : "ltr" }}>
                <span className="text-[10px] font-bold text-base-content/40 uppercase block mb-1">
                  {t.suggestedTitle}
                </span>
                <div className="flex flex-col gap-1.5">
                  {suggestions.map((text, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleSend(text)}
                      className="btn btn-xs btn-outline border-base-300 rounded-xl hover:bg-base-300 font-bold text-left justify-start py-1.5 h-auto text-[11px]"
                    >
                      💡 {text}
                    </button>
                  ))}
                </div>
              </div>
            </div>
          )}

          {messages.map((msg, i) => (
            <div
              key={i}
              className={`chat ${msg.role === "user" ? "chat-end" : "chat-start"}`}
            >
              <div
                className={`chat-bubble text-xs rounded-2xl py-2 px-3.5 leading-relaxed font-medium ${
                  msg.role === "user"
                    ? "chat-bubble-primary text-white"
                    : "chat-bubble-secondary bg-base-300 text-base-content border border-base-300"
                }`}
                style={{ whiteSpace: "pre-wrap" }}
              >
                {msg.content}
              </div>
            </div>
          ))}

          {isTyping && (
            <div className="chat chat-start">
              <div className="chat-bubble chat-bubble-secondary flex gap-1 items-center bg-base-300 py-3 px-4 rounded-2xl">
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "0ms" }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "150ms" }} />
                <span className="w-1.5 h-1.5 bg-current rounded-full animate-bounce" style={{ animationDelay: "300ms" }} />
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>

        {/* Input Footer */}
        <form
          onSubmit={(e) => {
            e.preventDefault();
            handleSend(inputText);
          }}
          className="p-3 border-t border-base-300 bg-base-300 flex gap-1.5 items-center"
        >
          <input
            type="text"
            required
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            placeholder={t.placeholder}
            className="input input-bordered input-sm flex-grow rounded-xl bg-base-100 text-xs px-3 h-9"
          />
          <button
            type="submit"
            disabled={!inputText.trim() || isTyping}
            className="btn btn-sm btn-primary text-white rounded-xl font-bold px-4 h-9"
          >
            {t.send}
          </button>
        </form>
      </div>
    </>
  );
}
