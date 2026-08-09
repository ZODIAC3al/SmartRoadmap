"use client";

import React, { useState, useEffect, useRef } from "react";
import Link from "next/link";
import { useApp } from "@/components/AppContext";
import { toast } from "react-toastify";
import { apiFetch, getCachedUser, hasSession } from "@/lib/api";

type Conversation = {
  partnerId: string;
  partnerName: string;
  partnerEmail: string;
  partnerAvatar?: string;
  partnerRole: string;
  lastMessage: string;
  lastMessageSender: string;
  lastMessageTime: string;
  unreadCount: number;
};

type Message = {
  _id: string;
  sender: string;
  recipient: string;
  content: string;
  read: boolean;
  createdAt: string;
};

type User = {
  id: string;
  name: string;
  email: string;
  role: string;
  avatarUrl?: string;
};

export default function MessagesPage() {
  const { locale, t } = useApp();
  const [currentUser, setCurrentUser] = useState<any>(null);

  // Data lists
  const [conversations, setConversations] = useState<Conversation[]>([]);
  const [messages, setMessages] = useState<Message[]>([]);
  const [allUsers, setAllUsers] = useState<User[]>([]);

  // Active conversation partner
  const [activePartner, setActivePartner] = useState<User | null>(null);

  // Loading indicators
  const [loadingConvs, setLoadingConvs] = useState(true);
  const [loadingThread, setLoadingThread] = useState(false);

  // Inputs
  const [searchQuery, setSearchQuery] = useState("");
  const [messageText, setMessageText] = useState("");

  const messagesEndRef = useRef<HTMLDivElement | null>(null);

  // Load user details
  useEffect(() => {
    const storedUser = getCachedUser();
    if (storedUser) {
      try {
        setCurrentUser(storedUser);
      } catch (e) {}
    }
  }, []);

  // Fetch conversations list
  const fetchConversations = async (silent = false) => {
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch("/messages/conversations", {});
      if (res.ok) {
        const body = await res.json();
        setConversations(body.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingConvs(false);
    }
  };

  // Fetch all users to support searching new partners
  const fetchAllUsers = async () => {
    const token = hasSession();
    if (!token) return;
    try {
      const res = await apiFetch("/auth/users", {});
      if (res.ok) {
        const body = await res.json();
        setAllUsers(body.data || []);
      }
    } catch (e) {
      console.error(e);
    }
  };

  // Fetch thread messages
  const fetchThread = async (partnerId: string, silent = false) => {
    const token = hasSession();
    if (!token) return;
    if (!silent) setLoadingThread(true);
    try {
      const res = await apiFetch(`/messages/thread/${partnerId}`, {});
      if (res.ok) {
        const body = await res.json();
        setMessages(body.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      if (!silent) setLoadingThread(false);
    }
  };

  // Initialize and poll conversations (8s) and users list
  useEffect(() => {
    if (currentUser) {
      fetchConversations();
      fetchAllUsers();
      const interval = setInterval(() => fetchConversations(true), 8000);
      return () => clearInterval(interval);
    }
  }, [currentUser]);

  // Poll active thread (3s)
  useEffect(() => {
    if (activePartner) {
      fetchThread(activePartner.id);
      const interval = setInterval(
        () => fetchThread(activePartner.id, true),
        3000,
      );
      return () => clearInterval(interval);
    } else {
      setMessages([]);
    }
  }, [activePartner]);

  // Auto-scroll messages to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Send message handler
  const handleSendMessage = async (e?: React.FormEvent) => {
    if (e) e.preventDefault();
    if (!messageText.trim() || !activePartner) return;

    const token = hasSession();
    if (!token) return;

    const content = messageText.trim();
    setMessageText(""); // Optimistic input clear

    try {
      const res = await apiFetch("/messages/send", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          recipientId: activePartner.id,
          content,
        }),
      });

      if (res.ok) {
        const body = await res.json();
        // Append sent message and trigger inbox refresh
        setMessages((prev) => [...prev, body.data]);
        fetchConversations(true);
      } else {
        toast.error(
          locale === "en" ? "Could not send message" : "فشل إرسال الرسالة",
        );
      }
    } catch (err) {
      toast.error("Network error sending message");
    }
  };

  // Start chat with a user selected from search results
  const handleSelectPartner = (partner: User) => {
    setActivePartner(partner);
    setSearchQuery(""); // Reset search box
    // Clear unread count locally for smooth UX
    setConversations((prev) =>
      prev.map((c) =>
        c.partnerId === partner.id ? { ...c, unreadCount: 0 } : c,
      ),
    );
  };

  // Filter existing chats matching the search query
  const filteredConversations = conversations.filter(
    (c) =>
      c.partnerName.toLowerCase().includes(searchQuery.toLowerCase()) ||
      c.partnerEmail.toLowerCase().includes(searchQuery.toLowerCase()),
  );

  // Find other users that match the search query and are NOT already in the active chats list
  const activeChatPartnerIds = conversations.map((c) => c.partnerId);
  const searchResultsNewUsers = allUsers.filter(
    (u) =>
      u.id !== currentUser?.id &&
      u.id !== "support@smartroadmap.dev" && // Support is already seeded and will show up in convs
      !activeChatPartnerIds.includes(u.id) &&
      (u.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
        u.email.toLowerCase().includes(searchQuery.toLowerCase())),
  );

  // Localization Dictionary
  const dict = {
    inbox: { en: "Chat Inbox", ar: "الرسائل والمحادثات" },
    searchPlaceholder: {
      en: "Search chats or start new...",
      ar: "ابحث عن محادثة أو ابدأ جديدة...",
    },
    newResults: { en: "Start New Chat", ar: "بدء محادثة جديدة" },
    emptyChats: { en: "No active conversations.", ar: "لا توجد محادثات نشطة." },
    emptyThread: {
      en: "Select a conversation to start messaging",
      ar: "اختر محادثة لبدء المراسلة والتواصل",
    },
    noMessages: {
      en: "No messages yet. Send a greeting!",
      ar: "لا توجد رسائل بعد. أرسل تحية للبدء!",
    },
    typePlaceholder: { en: "Type a message...", ar: "اكتب رسالة هنا..." },
    send: { en: "Send", ar: "إرسال" },
    supportBadge: { en: "Support", ar: "الدعم الفني" },
    backDashboard: { en: "Dashboard", ar: "لوحة التحكم" },
  };

  const getLabel = (key: keyof typeof dict) =>
    dict[key][locale === "ar" ? "ar" : "en"];

  if (!currentUser) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center font-sans text-xs">
        <div className="text-center p-8 bg-base-200 border border-base-300 rounded-2xl max-w-sm">
          <h3 className="font-extrabold text-sm mb-2">Access Denied</h3>
          <p className="text-base-content/60 mb-4">
            Please log in to access your messaging inbox.
          </p>
          <Link
            href="/auth/login"
            className="btn bg-primary hover:bg-[#059669] text-white border-none btn-sm rounded-lg"
          >
            Log In
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-16 md:pb-0 flex flex-col font-sans select-none print:hidden">
      {/* Messages Workspace Container */}
      <div className="flex-grow grid grid-cols-1 md:grid-cols-12 gap-0 max-w-7xl w-full mx-auto p-4 sm:p-6 items-stretch overflow-hidden">
        {/* SIDEBAR: Conversation list (4 columns) */}
        <aside className="col-span-1 md:col-span-4 border border-base-300 bg-base-200 rounded-t-xl md:rounded-t-none md:rounded-l-xl p-4 flex flex-col gap-4 overflow-hidden border-r-0">
          {/* Sidebar Header */}
          <div className="flex justify-between items-center">
            <h1 className="font-black text-sm uppercase tracking-wider text-primary">
              {getLabel("inbox")}
            </h1>
            <Link
              href="/dashboard"
              className="btn btn-ghost hover:bg-base-300 btn-xs text-[10px] uppercase font-bold text-base-content/60"
            >
              {getLabel("backDashboard")}
            </Link>
          </div>

          {/* Search bar */}
          <div className="relative">
            <input
              type="text"
              placeholder={getLabel("searchPlaceholder")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="input input-bordered w-full h-9 rounded-lg bg-base-100 border-base-300 text-xs text-base-content focus:border-primary pl-3 pr-3"
            />
          </div>

          {/* Conversations list container */}
          <div className="flex-grow overflow-y-auto space-y-2">
            {loadingConvs ? (
              <div className="flex justify-center py-10">
                <span className="loading loading-spinner loading-md text-primary"></span>
              </div>
            ) : (
              <>
                {/* 1. Active Chats */}
                {filteredConversations.map((c) => {
                  const isActive = activePartner?.id === c.partnerId;
                  const isOnline = c.partnerId === "support@smartroadmap.dev"; // support is simulated online
                  return (
                    <div
                      key={c.partnerId}
                      onClick={() =>
                        handleSelectPartner({
                          id: c.partnerId,
                          name: c.partnerName,
                          email: c.partnerEmail,
                          role: c.partnerRole,
                          avatarUrl: c.partnerAvatar,
                        })
                      }
                      className={`flex gap-3 items-center p-3 rounded-xl cursor-pointer hover:bg-base-300 transition-colors border text-left ${isActive ? "bg-primary/10 border-primary/25 text-base-content" : "bg-base-100 border-base-300/40 text-base-content/85"}`}
                    >
                      {/* Avatar with status indicator */}
                      <div className="relative shrink-0">
                        {c.partnerAvatar ? (
                          <img
                            src={c.partnerAvatar}
                            alt={c.partnerName}
                            className="w-9 h-9 rounded-full object-cover border border-base-300"
                          />
                        ) : (
                          <div className="w-9 h-9 rounded-full bg-primary/15 text-primary flex items-center justify-center font-bold text-xs font-sans uppercase">
                            {c.partnerName[0]}
                          </div>
                        )}
                        {isOnline && (
                          <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-base-100"></span>
                        )}
                      </div>

                      {/* Content snippet */}
                      <div className="flex-1 truncate space-y-0.5">
                        <div className="flex justify-between items-baseline gap-1.5">
                          <span className="font-extrabold text-[11px] truncate">
                            {c.partnerName}
                          </span>
                          <span className="text-[8px] text-base-content/40 font-mono">
                            {new Date(c.lastMessageTime).toLocaleTimeString(
                              [],
                              { hour: "2-digit", minute: "2-digit" },
                            )}
                          </span>
                        </div>
                        <p className="text-[10px] text-base-content/50 truncate leading-normal">
                          {c.lastMessage}
                        </p>
                      </div>

                      {/* Unread badge */}
                      {c.unreadCount > 0 && (
                        <span className="badge bg-red-500 text-white font-mono font-bold text-[9px] h-4.5 min-w-4.5 rounded-full shrink-0 border-none">
                          {c.unreadCount}
                        </span>
                      )}
                    </div>
                  );
                })}

                {/* 2. New Chat Search Results (If query active) */}
                {searchQuery.trim().length > 0 &&
                  searchResultsNewUsers.length > 0 && (
                    <div className="space-y-1.5 pt-2">
                      <h3 className="text-[9px] uppercase tracking-wider text-base-content/40 font-extrabold px-1">
                        {getLabel("newResults")}
                      </h3>
                      {searchResultsNewUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectPartner(u)}
                          className="flex gap-3 items-center p-2.5 bg-base-100 hover:bg-base-300 border border-base-300/40 rounded-xl cursor-pointer text-left"
                        >
                          <div className="w-8 h-8 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-xs">
                            {u.name[0]}
                          </div>
                          <div className="flex-1 truncate">
                            <p className="font-bold text-[10px] truncate leading-tight text-base-content">
                              {u.name}
                            </p>
                            <span className="text-[8px] text-base-content/40 font-mono">
                              {u.email}
                            </span>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                {/* Empty State */}
                {filteredConversations.length === 0 &&
                  searchResultsNewUsers.length === 0 && (
                    <p className="text-[10px] text-base-content/40 text-center py-10 font-bold">
                      {getLabel("emptyChats")}
                    </p>
                  )}
              </>
            )}
          </div>
        </aside>

        {/* CHAT THREAD VIEW (8 columns) */}
        <section className="col-span-1 md:col-span-8 border border-base-300 bg-base-100 rounded-b-xl md:rounded-b-none md:rounded-r-xl flex flex-col overflow-hidden min-h-[480px]">
          {activePartner ? (
            <>
              {/* Thread Header */}
              <div className="navbar bg-base-200 border-b border-base-300 py-2.5 px-4 flex justify-between items-center shrink-0">
                <div className="flex items-center gap-3 text-left">
                  <div className="relative">
                    {activePartner.avatarUrl ? (
                      <img
                        src={activePartner.avatarUrl}
                        alt={activePartner.name}
                        className="w-9 h-9 rounded-full object-cover border border-base-300"
                      />
                    ) : (
                      <div className="w-9 h-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-extrabold text-xs">
                        {activePartner.name[0]}
                      </div>
                    )}
                    {activePartner.id === "support@smartroadmap.dev" && (
                      <span className="absolute bottom-0 right-0 w-2.5 h-2.5 bg-green-500 rounded-full border-2 border-base-100"></span>
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-1.5">
                      <span className="font-extrabold text-xs text-base-content">
                        {activePartner.name}
                      </span>
                      {activePartner.id === "support@smartroadmap.dev" && (
                        <span className="badge bg-primary/10 text-primary border-none text-[8px] font-black uppercase rounded-sm px-1 py-0 h-4.5">
                          {getLabel("supportBadge")}
                        </span>
                      )}
                    </div>
                    <span className="text-[8px] text-base-content/40 font-mono block leading-none mt-0.5">
                      {activePartner.email}
                    </span>
                  </div>
                </div>

                {/* Recruiter / Candidate matching badge details */}
                <div className="hidden sm:block">
                  <span className="text-[8.5px] uppercase font-mono font-bold text-base-content/40">
                    Role: {activePartner.role}
                  </span>
                </div>
              </div>

              {/* Message History Feed */}
              <div className="flex-grow overflow-y-auto p-4 space-y-4 bg-base-100/50">
                {loadingThread ? (
                  <div className="flex justify-center items-center h-full">
                    <span className="loading loading-spinner loading-md text-primary"></span>
                  </div>
                ) : (
                  <>
                    {messages.length === 0 ? (
                      <p className="text-[10px] text-base-content/40 text-center py-20 font-bold">
                        {getLabel("noMessages")}
                      </p>
                    ) : (
                      messages.map((m) => {
                        const isMe = m.sender === currentUser.id;
                        return (
                          <div
                            key={m._id}
                            className={`flex flex-col max-w-[80%] ${isMe ? "ml-auto items-end" : "mr-auto items-start"}`}
                          >
                            <div
                              className={`p-3 rounded-2xl text-left text-xs font-semibold leading-relaxed shadow-sm ${isMe ? "bg-primary text-white rounded-tr-none" : "bg-base-200 text-base-content rounded-tl-none border border-base-300/40"}`}
                            >
                              {m.content}
                            </div>
                            <span className="text-[8px] text-base-content/30 font-mono mt-1 px-1">
                              {new Date(m.createdAt).toLocaleTimeString([], {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </span>
                          </div>
                        );
                      })
                    )}
                    <div ref={messagesEndRef} />
                  </>
                )}
              </div>

              {/* Message Typing area (Form) */}
              <form
                onSubmit={handleSendMessage}
                className="border-t border-base-300 p-4 bg-base-200 shrink-0 flex gap-2.5 items-center"
              >
                <input
                  type="text"
                  placeholder={getLabel("typePlaceholder")}
                  value={messageText}
                  onChange={(e) => setMessageText(e.target.value)}
                  className="input input-bordered flex-grow h-10 rounded-lg bg-base-100 border-base-300 text-xs text-base-content focus:border-primary px-4"
                />
                <button
                  type="submit"
                  disabled={!messageText.trim()}
                  className="btn bg-primary hover:bg-[#059669] disabled:bg-base-300 disabled:text-base-content/25 text-white border-none rounded-lg h-10 w-10 min-w-0 p-0 flex items-center justify-center shadow-md transition-all"
                  title={getLabel("send")}
                >
                  <svg
                    viewBox="0 0 24 24"
                    className="w-4 h-4 text-current"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="3"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M14 5l7 7m0 0l-7 7m7-7H3"
                    />
                  </svg>
                </button>
              </form>
            </>
          ) : (
            // No Chat Active Empty State
            <div className="flex-grow flex flex-col items-center justify-center p-8 text-center bg-base-200/25">
              <div className="w-16 h-16 bg-primary/10 text-primary rounded-full flex items-center justify-center mb-4 text-3xl shadow-inner font-bold">
                ✉️
              </div>
              <h2 className="text-sm font-black text-base-content uppercase tracking-wider">
                {getLabel("inbox")}
              </h2>
              <p className="text-xs text-base-content/50 max-w-sm mt-1.5">
                {getLabel("emptyThread")}
              </p>
            </div>
          )}
        </section>
      </div>
    </div>
  );
}
