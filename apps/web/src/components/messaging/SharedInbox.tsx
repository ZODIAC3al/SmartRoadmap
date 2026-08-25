'use client';

import React, {
  useState,
  useEffect,
  useRef,
  useCallback,
  useMemo,
} from 'react';
import { apiFetch } from '@/lib/api';
import { useSubscription } from '@/lib/use-subscription';
import { UsageBar } from '@/components/company/UsageBar';
import {
  Check,
  CheckCheck,
  Send,
  ArrowLeft,
  Loader2,
  MessageSquare,
  Circle,
  Building2,
  GraduationCap,
  ShieldCheck,
  Search,
  Plus,
  X,
  Paperclip,
  FileText,
  Image as ImageIcon,
  Download,
  File,
} from 'lucide-react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import {
  useGetThreadsQuery,
  useGetThreadMessagesQuery,
  useSendMessageMutation,
  useMarkThreadReadMutation,
  useUploadAttachmentMutation,
  useSearchMessagingUsersQuery,
  selectAllThreads,
  MessageThreadItem,
  MessageItem,
  MessagingUser,
} from '@/store/api/messagesApi';
import { baseApi } from '@/store/api/baseApi';
import { useDispatch } from 'react-redux';

/* ─── Helpers ─────────────────────────────────────────────────────── */

function formatTime(dateStr: string) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday =
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear();
  if (isToday) return d.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  return d.toLocaleDateString([], { month: 'short', day: 'numeric' });
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
}

function getFileIcon(type?: string) {
  if (!type) return <File className="w-5 h-5 text-base-content/60" />;
  if (type.startsWith('image/')) return <ImageIcon className="w-5 h-5 text-primary" />;
  if (type === 'application/pdf') return <FileText className="w-5 h-5 text-red-500" />;
  return <FileText className="w-5 h-5 text-base-content/60" />;
}

function RoleIcon({ role }: { role?: string }) {
  if (role === 'company') return <Building2 className="w-3.5 h-3.5 text-primary" />;
  if (role === 'admin') return <ShieldCheck className="w-3.5 h-3.5 text-red-500" />;
  return <GraduationCap className="w-3.5 h-3.5 text-[#8E1616]" />;
}

function RoleBadge({ role }: { role?: string }) {
  const map: Record<string, { bg: string; text: string }> = {
    learner: { bg: 'bg-[#8E1616]/10 border-[#8E1616]/20', text: 'text-[#701111]' },
    company: { bg: 'bg-primary text-primary-content/10 border-primary/20', text: 'text-primary' },
    admin: { bg: 'bg-red-500/10 border-red-500/20', text: 'text-red-600' },
  };
  const cfg = map[role || 'learner'] || map['learner'];
  return (
    <span className={`px-2 py-0.5 rounded-full border text-[10px] font-bold font-mono capitalize ${cfg.bg} ${cfg.text}`}>
      {role}
    </span>
  );
}

/* ─── Attachment Bubble ──────────────────────────────────────────── */

function AttachmentBubble({ url, name, type, size, isMe }: {
  url: string; name?: string; type?: string; size?: number; isMe: boolean;
}) {
  const isImage = type?.startsWith('image/');
  const baseClass = isMe
    ? 'bg-[#8E1616]/90 text-white'
    : 'bg-base-100 border border-base-300 text-base-content';

  if (isImage) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={url}
          alt={name || 'image'}
          className="max-w-[240px] max-h-[200px] rounded-xl object-cover shadow-xs border border-base-300/50"
        />
      </a>
    );
  }

  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl ${baseClass} hover:opacity-80 transition-opacity max-w-[240px]`}
    >
      <div className={`w-8 h-8 rounded-2xl flex items-center justify-center flex-shrink-0 ${isMe ? 'bg-base-100/20' : 'bg-base-200'}`}>
        {getFileIcon(type)}
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-xs font-bold truncate">{name || 'attachment'}</p>
        {size && <p className="text-[10px] opacity-70 font-mono">{formatBytes(size)}</p>}
      </div>
      <Download className="w-3.5 h-3.5 opacity-60 flex-shrink-0" />
    </a>
  );
}

/* ─── New Conversation Modal ─────────────────────────────────────── */

function NewConversationModal({
  currentUserId,
  onClose,
  onThreadCreated,
}: {
  currentUserId?: string;
  onClose: () => void;
  onThreadCreated: (threadId: string) => void;
}) {
  const [query, setQuery] = useState('');
  const [selectedRole, setSelectedRole] = useState('');
  const [selectedUser, setSelectedUser] = useState<MessagingUser | null>(null);
  const [initialMessage, setInitialMessage] = useState('');
  const [creating, setCreating] = useState(false);
  const dispatch = useDispatch();

  const { data: users = [], isFetching } = useSearchMessagingUsersQuery(
    { q: query, role: selectedRole || undefined },
    { skip: query.length < 1 },
  );

  const handleStart = async () => {
    if (!selectedUser || !initialMessage.trim()) return;
    setCreating(true);
    try {
      const res = await apiFetch('/messaging/threads', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          otherUserId: selectedUser.id,
          context: 'hiring',
          initialMessage: initialMessage.trim(),
        }),
      });
      if (!res.ok) {
        const errBody = await res.json().catch(() => ({}));
        throw new Error((errBody as any)?.message || 'Failed to create thread');
      }
      const thread = await res.json();
      dispatch(baseApi.util.invalidateTags([{ type: 'MessageThread', id: 'LIST' }]));
      onThreadCreated(thread._id || thread.id);
    } catch (e) {
      console.error('Failed to start conversation', e);
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="fixed inset-0 z-[500] flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
      <div className="bg-base-100 border border-base-300 rounded-3xl shadow-2xl w-full max-w-md flex flex-col overflow-hidden animate-in fade-in zoom-in-95 duration-200">
        {/* Modal Header */}
        <div className="flex justify-between items-center px-5 py-4 border-b border-base-200">
          <h2 className="font-extrabold text-base text-base-content font-heading">
            New Conversation
          </h2>
          <button onClick={onClose} className="btn btn-ghost btn-xs btn-circle">
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Search + Filter */}
        <div className="px-5 pt-4 pb-3 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
            <input
              autoFocus
              type="text"
              placeholder="Search by name or email..."
              value={query}
              onChange={(e) => { setQuery(e.target.value); setSelectedUser(null); }}
              className="w-full pl-9 pr-3 py-2.5 text-xs bg-base-200 border border-base-300 rounded-xl outline-none focus:border-[#8E1616]/50 focus:ring-2 focus:ring-[#8E1616]/10 transition-all"
            />
          </div>

          {/* Role Filter Pills */}
          <div className="flex gap-2">
            {[{ v: '', l: 'All' }, { v: 'learner', l: '🎓 Learners' }, { v: 'company', l: '🏢 Companies' }, { v: 'admin', l: '🛡️ Admins' }].map(({ v, l }) => (
              <button
                key={v}
                onClick={() => setSelectedRole(v)}
                className={`px-2.5 py-1 rounded-full text-[10px] font-bold border transition-all ${
                  selectedRole === v
                    ? 'bg-[#8E1616] text-white border-[#8E1616] shadow-xs'
                    : 'bg-base-200 text-base-content/70 border-base-300 hover:border-[#8E1616]/50'
                }`}
              >
                {l}
              </button>
            ))}
          </div>
        </div>

        {/* Results List */}
        <div className="flex-1 overflow-y-auto max-h-48 border-t border-base-200">
          {isFetching ? (
            <div className="flex items-center justify-center py-6 gap-2 text-xs text-base-content/50">
              <Loader2 className="w-4 h-4 animate-spin text-[#8E1616]" />
              Searching...
            </div>
          ) : query.length < 1 ? (
            <div className="py-8 text-center text-xs text-base-content/40">
              Type a name or email to search users
            </div>
          ) : users.length === 0 ? (
            <div className="py-8 text-center text-xs text-base-content/40">
              No users found for &ldquo;{query}&rdquo;
            </div>
          ) : (
            <div className="p-2 space-y-1">
              {users.map((u) => (
                <button
                  key={u.id}
                  onClick={() => setSelectedUser(u)}
                  className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-left transition-all ${
                    selectedUser?.id === u.id
                      ? 'bg-[#8E1616]/10 border border-[#8E1616]/30'
                      : 'hover:bg-base-200 border border-transparent'
                  }`}
                >
                  <div className="w-8 h-8 rounded-xl bg-base-200 text-base-content/70 font-bold text-xs flex items-center justify-center font-heading flex-shrink-0">
                    {u.name.substring(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-xs text-base-content truncate">{u.name}</span>
                      <RoleBadge role={u.role} />
                    </div>
                    <span className="text-[10px] text-base-content/50 font-mono truncate block">{u.email}</span>
                  </div>
                  {selectedUser?.id === u.id && (
                    <Check className="w-4 h-4 text-[#8E1616] flex-shrink-0" />
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Initial Message */}
        {selectedUser && (
          <div className="px-5 py-4 border-t border-base-200 space-y-3 bg-base-200/30">
            <div className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-xl bg-[#8E1616]/10 text-[#701111] font-bold text-[10px] flex items-center justify-center">
                {selectedUser.name.substring(0, 2).toUpperCase()}
              </div>
              <div>
                <span className="text-xs font-bold text-base-content">{selectedUser.name}</span>
                <span className="text-[10px] text-base-content/50 ml-2 capitalize">{selectedUser.role}</span>
              </div>
            </div>
            <textarea
              placeholder={`Say hello to ${selectedUser.name}...`}
              value={initialMessage}
              onChange={(e) => setInitialMessage(e.target.value)}
              rows={3}
              className="w-full px-3 py-2.5 text-xs bg-base-100 border border-base-300 rounded-xl outline-none focus:border-[#8E1616]/50 focus:ring-2 focus:ring-[#8E1616]/10 resize-none transition-all"
            />
            <button
              onClick={handleStart}
              disabled={!initialMessage.trim() || creating}
              className="w-full btn btn-sm bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-xl font-bold text-xs flex items-center justify-center gap-2 disabled:opacity-40 transition-all duration-300 ease-in-out"
            >
              {creating ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Send className="w-3.5 h-3.5" />}
              {creating ? 'Starting...' : 'Start Conversation'}
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

/* ─── Props ──────────────────────────────────────────────────────── */

interface SharedInboxProps {
  currentRole: 'learner' | 'company' | 'admin';
  currentUserId?: string;
}

/* ─── Main Component ─────────────────────────────────────────────── */

export function SharedInbox({ currentRole, currentUserId }: SharedInboxProps) {
  const { plan, usage, limits } = useSubscription();
  const searchParams = useSearchParams();
  const threadParam = searchParams?.get('threadId');
  const [activeThreadId, setActiveThreadId] = useState<string | null>(null);
  const [inputText, setInputText] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'learner' | 'company'>('all');
  const [showMobileDetail, setShowMobileDetail] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [showNewConvo, setShowNewConvo] = useState(false);

  // Attachment state
  const [pendingAttachment, setPendingAttachment] = useState<{
    url: string; name: string; type: string; size: number;
  } | null>(null);
  const [uploadProgress, setUploadProgress] = useState(false);

  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  /* ── RTK Query ── */
  const { data: threadsData, isLoading: threadsLoading, refetch: refetchThreads } = useGetThreadsQuery(
    undefined,
    { pollingInterval: 8000 },
  );
  const threads: MessageThreadItem[] = useMemo(
    () => (threadsData ? selectAllThreads(threadsData) : []),
    [threadsData],
  );

  useEffect(() => {
    if (threadParam) {
      setActiveThreadId(threadParam);
    } else if (threads.length > 0 && !activeThreadId) {
      setActiveThreadId(threads[0].id);
    }
  }, [threads, activeThreadId, threadParam]);

  const {
    data: messagesData,
    isLoading: messagesLoading,
    refetch: refetchMessages,
  } = useGetThreadMessagesQuery(
    { threadId: activeThreadId || '' },
    { skip: !activeThreadId, pollingInterval: 4000 },
  );
  const messages: MessageItem[] = useMemo(() => messagesData || [], [messagesData]);

  const [sendMessageMutation, { isLoading: sending }] = useSendMessageMutation();
  const [markReadMutation] = useMarkThreadReadMutation();
  const [uploadAttachmentMutation] = useUploadAttachmentMutation();

  /* ── Auto scroll ── */
  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTo({
        top: scrollContainerRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);

  /* ── Mark as read on open ── */
  useEffect(() => {
    if (activeThreadId) {
      const thread = threads.find((t) => t.id === activeThreadId);
      if (thread && thread.unreadCount > 0) {
        markReadMutation(activeThreadId).catch(() => {});
      }
    }
  }, [activeThreadId, threads]);

  const activeThread = useMemo(
    () => threads.find((t) => t.id === activeThreadId),
    [threads, activeThreadId],
  );

  const isCompany = currentRole === 'company';
  const isStarter = isCompany && plan === 'starter';
  const isQuotaExhausted =
    isCompany && limits.messagesIncluded !== -1 && usage.messagesSentThisPeriod >= limits.messagesIncluded;

  /* ── Attachment upload ── */
  const handleFileChange = useCallback(
    async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0];
      if (!file) return;

      setUploadProgress(true);
      try {
        const formData = new FormData();
        formData.append('file', file);
        const res = await uploadAttachmentMutation(formData).unwrap();
        setPendingAttachment(res);
      } catch {
        alert('File upload failed. Please try again.');
      } finally {
        setUploadProgress(false);
        if (fileInputRef.current) fileInputRef.current.value = '';
      }
    },
    [uploadAttachmentMutation],
  );

  /* ── Send ── */
  const handleSendMessage = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      const hasText = inputText.trim().length > 0;
      const hasAttachment = !!pendingAttachment;
      if ((!hasText && !hasAttachment) || !activeThreadId || isStarter || isQuotaExhausted || sending) return;

      const bodyText = hasText ? inputText.trim() : pendingAttachment!.name;
      const clientNonce =
        typeof crypto !== 'undefined' && crypto.randomUUID
          ? crypto.randomUUID()
          : Date.now().toString();

      setInputText('');
      const attachmentToSend = pendingAttachment;
      setPendingAttachment(null);

      try {
        await sendMessageMutation({
          threadId: activeThreadId,
          body: bodyText,
          attachmentUrl: attachmentToSend?.url,
          attachmentName: attachmentToSend?.name,
          attachmentType: attachmentToSend?.type,
          attachmentSize: attachmentToSend?.size,
          clientNonce,
        }).unwrap();
        refetchThreads();
      } catch {
        // Optimistic rollback happens in API
      }
    },
    [inputText, pendingAttachment, activeThreadId, isStarter, isQuotaExhausted, sending, sendMessageMutation],
  );

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && !e.shiftKey) handleSendMessage(e as any);
  };

  const filteredThreads = useMemo(
    () =>
      threads.filter((t: any) => {
        const roleMatch =
          currentRole !== 'admin' || roleFilter === 'all' || t.otherParticipant?.role === roleFilter;
        const searchMatch =
          !searchQuery ||
          t.otherParticipant?.name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
          t.lastMessagePreview?.toLowerCase().includes(searchQuery.toLowerCase());
        return roleMatch && searchMatch;
      }),
    [threads, currentRole, roleFilter, searchQuery],
  );

  const totalUnread = useMemo(
    () => threads.reduce((acc, t) => acc + (t.unreadCount || 0), 0),
    [threads],
  );

  /* ── Render ── */
  return (
    <>
      {/* New Conversation Modal — admins and companies only */}
      {showNewConvo && currentRole !== 'learner' && (
        <NewConversationModal
          currentUserId={currentUserId}
          onClose={() => setShowNewConvo(false)}
          onThreadCreated={(id) => {
            setShowNewConvo(false);
            setActiveThreadId(id);
            setShowMobileDetail(true);
            refetchThreads();
          }}
        />
      )}

      {/* Hidden file input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*,.pdf,.doc,.docx,.xls,.xlsx,.txt,.ppt,.pptx"
        className="hidden"
        onChange={handleFileChange}
      />

      <div className="bg-base-100 rounded-3xl border border-base-300 shadow-xl overflow-hidden flex flex-col md:flex-row h-[80vh] min-h-[560px] text-base-content">
        {/* ════════════════════ LEFT: Thread List ════════════════════ */}
        <div
          className={`w-full md:w-80 xl:w-96 flex-shrink-0 border-r border-base-200 flex flex-col bg-base-100 ${
            showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {/* Thread List Header */}
          <div className="px-3 pt-3 pb-2.5 border-b border-base-200 bg-base-200/40 flex flex-col gap-2.5">
            <div className="flex justify-between items-center">
              <div className="flex items-center gap-2">
                <MessageSquare className="w-4 h-4 text-[#8E1616]" />
                <h2 className="font-bold text-sm text-base-content font-heading">Inbox</h2>
                {totalUnread > 0 && (
                  <span className="min-w-5 h-5 px-1.5 rounded-full bg-[#8E1616] text-white font-bold text-[10px] flex items-center justify-center">
                    {totalUnread}
                  </span>
                )}
              </div>
              {currentRole !== 'learner' && (
                <button
                  onClick={() => setShowNewConvo(true)}
                  className="btn btn-xs bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-xl gap-1 font-bold text-[11px] transition-all duration-300 ease-in-out"
                >
                  <Plus className="w-3.5 h-3.5" />
                  New
                </button>
              )}
            </div>

            {/* Search */}
            <div className="relative">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-base-content/40" />
              <input
                type="text"
                placeholder="Search conversations..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-base-100 border border-base-300 rounded-xl outline-none focus:border-[#8E1616]/50 focus:ring-1 focus:ring-[#8E1616]/20 transition-all"
              />
            </div>

            {/* Admin Role Filter */}
            {currentRole === 'admin' && (
              <div className="join w-full grid grid-cols-3">
                {(['all', 'learner', 'company'] as const).map((f) => (
                  <button
                    key={f}
                    onClick={() => setRoleFilter(f)}
                    className={`join-item btn btn-xs capitalize font-bold ${
                      roleFilter === f ? 'btn-primary' : 'btn-ghost border border-base-300'
                    }`}
                  >
                    {f}
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Threads Scroll List */}
          <div className="flex-1 overflow-y-auto">
            {threadsLoading ? (
              <div className="flex items-center justify-center py-12 gap-2 text-xs text-base-content/50">
                <Loader2 className="w-4 h-4 animate-spin text-[#8E1616]" />
                Loading threads...
              </div>
            ) : filteredThreads.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 gap-3 text-center px-6">
                <div className="w-12 h-12 rounded-2xl bg-base-200 flex items-center justify-center">
                  <MessageSquare className="w-6 h-6 text-base-content/30" />
                </div>
                <p className="text-xs text-base-content/50 font-semibold">
                  {searchQuery ? 'No conversations match your search' : 'No messages yet'}
                </p>
                {!searchQuery && currentRole !== 'learner' && (
                  <button
                    onClick={() => setShowNewConvo(true)}
                    className="btn btn-xs bg-[#8E1616] text-white border-none rounded-xl gap-1 font-bold text-[11px]"
                  >
                    <Plus className="w-3 h-3" />
                    Start a conversation
                  </button>
                )}
              </div>
            ) : (
              <div className="p-2 space-y-0.5">
                {filteredThreads.map((t) => {
                  const isActive = t.id === activeThreadId;
                  const initial = (t.otherParticipant?.name || 'U').substring(0, 2).toUpperCase();
                  return (
                    <button
                      key={t.id}
                      onClick={() => {
                        setActiveThreadId(t.id);
                        setShowMobileDetail(true);
                      }}
                      className={`w-full p-3 rounded-2xl text-left transition-all flex items-center gap-3 group ${
                        isActive
                          ? 'bg-[#8E1616]/10 border border-[#8E1616]/25'
                          : 'hover:bg-base-200/70 border border-transparent'
                      }`}
                    >
                      {/* Avatar */}
                      <div
                        className={`w-10 h-10 rounded-2xl flex-shrink-0 font-bold text-xs flex items-center justify-center font-heading relative ${
                          isActive
                            ? 'bg-[#8E1616] text-white'
                            : 'bg-base-200 text-base-content/70 group-hover:bg-base-300'
                        }`}
                      >
                        {initial}
                        {t.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-4 h-4 px-1 rounded-full bg-[#8E1616] border-2 border-base-100 text-white text-[8px] font-black flex items-center justify-center">
                            {t.unreadCount > 9 ? '9+' : t.unreadCount}
                          </span>
                        )}
                      </div>

                      {/* Thread Info */}
                      <div className="flex-1 min-w-0">
                        <div className="flex justify-between items-center gap-1">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className={`font-bold text-xs truncate ${t.unreadCount > 0 ? 'text-base-content' : 'text-base-content/80'}`}>
                              {t.otherParticipant?.name || 'User'}
                            </span>
                            <RoleIcon role={t.otherParticipant?.role} />
                          </div>
                          <span className="text-[10px] font-mono text-base-content/40 flex-shrink-0">
                            {formatTime(t.lastMessageAt)}
                          </span>
                        </div>
                        <p className={`text-[11px] truncate mt-0.5 ${t.unreadCount > 0 ? 'text-base-content/80 font-semibold' : 'text-base-content/50'}`}>
                          {t.lastMessagePreview || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* ════════════════════ RIGHT: Active Thread ════════════════════ */}
        <div
          className={`flex-1 flex flex-col bg-base-200/20 min-w-0 ${
            !showMobileDetail ? 'hidden md:flex' : 'flex'
          }`}
        >
          {activeThread ? (
            <>
              {/* Thread Header */}
              <div className="px-4 py-3 border-b border-base-200 bg-base-100 flex justify-between items-center shadow-xs flex-shrink-0">
                <div className="flex items-center gap-3">
                  <button
                    onClick={() => setShowMobileDetail(false)}
                    className="md:hidden btn btn-ghost btn-xs btn-circle"
                  >
                    <ArrowLeft className="w-4 h-4" />
                  </button>
                  <div className="w-9 h-9 rounded-2xl bg-[#8E1616]/10 text-[#701111] font-bold text-xs flex items-center justify-center font-heading">
                    {(activeThread.otherParticipant?.name || 'U').substring(0, 2).toUpperCase()}
                  </div>
                  <div>
                    <h3 className="font-bold text-sm text-base-content leading-none">
                      {activeThread.otherParticipant?.name || 'User'}
                    </h3>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Circle className="w-2 h-2 fill-[#8E1616] text-[#8E1616]" />
                      <span className="text-[11px] text-base-content/60 capitalize">
                        {activeThread.otherParticipant?.role}
                      </span>
                      <span className="text-[10px] text-base-content/40 font-mono">
                        · {activeThread.context}
                      </span>
                    </div>
                  </div>
                </div>

                <button
                  onClick={() => refetchMessages()}
                  className="btn btn-ghost btn-xs rounded-xl border border-base-300 text-[10px] font-bold"
                >
                  Refresh
                </button>
              </div>

              {/* Messages Area */}
              <div ref={scrollContainerRef} className="flex-1 overflow-y-auto px-4 py-4 flex flex-col gap-2">
                {messagesLoading ? (
                  <div className="flex-1 flex items-center justify-center gap-2 text-xs text-base-content/50">
                    <Loader2 className="w-4 h-4 animate-spin text-[#8E1616]" />
                    Loading messages...
                  </div>
                ) : messages.length === 0 ? (
                  <div className="flex-1 flex flex-col items-center justify-center gap-3 py-12">
                    <div className="w-14 h-14 rounded-3xl bg-base-200 flex items-center justify-center">
                      <MessageSquare className="w-7 h-7 text-base-content/20" />
                    </div>
                    <p className="text-xs text-base-content/50 font-semibold">
                      No messages yet — send the first one!
                    </p>
                  </div>
                ) : (
                  <>
                    {messages.map((m, idx) => {
                      const isMe = m.senderId === currentUserId || m.senderId === 'me';
                      const prevMsg = messages[idx - 1];
                      const showDateDivider =
                        !prevMsg ||
                        new Date(m.createdAt).toDateString() !== new Date(prevMsg.createdAt).toDateString();

                      return (
                        <React.Fragment key={m._id}>
                          {showDateDivider && (
                            <div className="flex items-center gap-3 my-2">
                              <div className="flex-1 h-px bg-base-300" />
                              <span className="text-[10px] font-mono text-base-content/40 px-3 py-0.5 rounded-full border border-base-300 bg-base-200/50">
                                {new Date(m.createdAt).toLocaleDateString([], {
                                  weekday: 'short',
                                  month: 'short',
                                  day: 'numeric',
                                })}
                              </span>
                              <div className="flex-1 h-px bg-base-300" />
                            </div>
                          )}

                          <div className={`flex flex-col gap-0.5 ${isMe ? 'items-end' : 'items-start'}`}>
                            {/* Attachment bubble (if any) */}
                            {m.attachmentUrl && (
                              <AttachmentBubble
                                url={m.attachmentUrl}
                                name={m.attachmentName}
                                type={m.attachmentType}
                                size={m.attachmentSize}
                                isMe={isMe}
                              />
                            )}

                            {/* Text bubble (if body is more than just the filename) */}
                            {m.body && !(m.attachmentUrl && m.body === m.attachmentName) && (
                              <div
                                className={`max-w-[75%] md:max-w-lg px-4 py-2.5 rounded-2xl text-xs leading-relaxed shadow-xs ${
                                  isMe
                                    ? 'bg-[#8E1616] text-white rounded-br-sm'
                                    : 'bg-base-100 border border-base-300 text-base-content rounded-bl-sm'
                                }`}
                              >
                                {m.body}
                              </div>
                            )}

                            {/* Meta: time + read receipt */}
                            <div className="flex items-center gap-1 text-[10px] font-mono text-base-content/40 px-1">
                              <span>
                                {new Date(m.createdAt).toLocaleTimeString([], {
                                  hour: '2-digit',
                                  minute: '2-digit',
                                })}
                              </span>
                              {isMe &&
                                (m.read ? (
                                  <CheckCheck className="w-3 h-3 text-[#8E1616]" />
                                ) : (
                                  <Check className="w-3 h-3 text-base-content/40" />
                                ))}
                            </div>
                          </div>
                        </React.Fragment>
                      );
                    })}

                  </>
                )}
              </div>

              {/* Pending Attachment Preview */}
              {pendingAttachment && (
                <div className="px-4 pb-2 flex-shrink-0">
                  <div className="flex items-center gap-3 px-3.5 py-2 rounded-xl bg-base-200 border border-base-300">
                    {getFileIcon(pendingAttachment.type)}
                    <div className="flex-1 min-w-0">
                      <p className="text-xs font-bold truncate text-base-content">{pendingAttachment.name}</p>
                      <p className="text-[10px] text-base-content/50 font-mono">
                        {formatBytes(pendingAttachment.size)} · Ready to send
                      </p>
                    </div>
                    <button
                      onClick={() => setPendingAttachment(null)}
                      className="btn btn-ghost btn-xs btn-circle text-base-content/60"
                    >
                      <X className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
              )}

              {/* Composer Footer */}
              <div className="px-4 pb-4 pt-3 border-t border-base-200 bg-base-100 flex flex-col gap-2 flex-shrink-0">
                {isStarter ? (
                  <div className="p-3.5 rounded-2xl bg-amber-500/10 border border-amber-500/30 text-center flex flex-col items-center gap-2">
                    <p className="text-xs font-semibold text-amber-500">
                      ⚡ Messaging is locked on Free Starter plan
                    </p>
                    <Link href="/company/billing" className="btn btn-xs btn-warning font-medium">
                      Upgrade to Growth Plan ($49/mo)
                    </Link>
                  </div>
                ) : (
                  <>

                    <form onSubmit={handleSendMessage} className="flex items-center gap-2">
                      {/* Attachment Button */}
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={uploadProgress || isQuotaExhausted}
                        className="w-9 h-9 flex-shrink-0 rounded-2xl bg-base-200 hover:bg-base-300 border border-base-300 flex items-center justify-center transition-all disabled:opacity-40"
                        title="Attach file or image"
                      >
                        {uploadProgress ? (
                          <Loader2 className="w-4 h-4 animate-spin text-[#8E1616]" />
                        ) : (
                          <Paperclip className="w-4 h-4 text-base-content/60" />
                        )}
                      </button>

                      {/* Message Input */}
                      <input
                        type="text"
                        placeholder={
                          isQuotaExhausted
                            ? 'Monthly quota exhausted...'
                            : pendingAttachment
                            ? 'Add a caption (optional)...'
                            : 'Type a message, press Enter to send...'
                        }
                        value={inputText}
                        onChange={(e) => setInputText(e.target.value)}
                        onKeyDown={handleKeyDown}
                        disabled={isQuotaExhausted || sending}
                        className="flex-1 px-4 py-2.5 text-xs bg-base-200 border border-base-300 rounded-2xl outline-none focus:border-[#8E1616]/50 focus:ring-2 focus:ring-[#8E1616]/10 transition-all disabled:opacity-50"
                      />

                      {/* Send Button */}
                      <button
                        type="submit"
                        disabled={isQuotaExhausted || ((!inputText.trim()) && !pendingAttachment) || sending}
                        className="w-9 h-9 rounded-2xl bg-[#8E1616] hover:bg-[#701111] disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-all shadow-xs flex-shrink-0"
                      >
                        {sending ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Send className="w-4 h-4" />
                        )}
                      </button>
                    </form>
                  </>
                )}
              </div>
            </>
          ) : (
            /* Empty state — no thread selected */
            <div className="flex-1 flex flex-col items-center justify-center gap-5 p-8 text-center">
              <div className="w-20 h-20 rounded-3xl bg-[#8E1616]/10 flex items-center justify-center">
                <MessageSquare className="w-10 h-10 text-[#8E1616]/60" />
              </div>
              <div>
                <p className="font-bold text-base text-base-content">Your messages</p>
                <p className="text-xs text-base-content/50 mt-1 max-w-xs">
                  {currentRole === 'learner'
                    ? 'Select a conversation from the left to read and reply to messages sent to you.'
                    : 'Select a conversation from the left, or start a new one to communicate with candidates, companies, or admins.'}
                </p>
              </div>
              {currentRole !== 'learner' && (
                <button
                  onClick={() => setShowNewConvo(true)}
                  className="btn btn-sm bg-[#8E1616] hover:bg-[#701111] text-white border-none rounded-2xl font-bold gap-2 transition-all duration-300 ease-in-out"
                >
                  <Plus className="w-4 h-4" />
                  New Conversation
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}
