'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { useApp } from '@/components/AppContext';
import { toast } from 'react-toastify';

export default function NotificationsPage() {
  const { locale, t } = useApp();
  const [notifications, setNotifications] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'all' | 'unread'>('all');

  const fetchNotifications = async () => {
    const token = localStorage.getItem('smart_token');
    if (!token) {
      setLoading(false);
      return;
    }
    try {
      const res = await fetch('http://localhost:3000/notifications', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        const body = await res.json();
        setNotifications(body.data || []);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNotifications();
  }, []);

  const handleMarkRead = async (id: string) => {
    const token = localStorage.getItem('smart_token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/notifications/${id}/read`, {
        method: 'PATCH',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev =>
          prev.map(n => (n._id === id ? { ...n, read: true } : n))
        );
      }
    } catch (e) {}
  };

  const handleMarkAllRead = async () => {
    const token = localStorage.getItem('smart_token');
    if (!token) return;
    try {
      const res = await fetch('http://localhost:3000/notifications/read-all', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.map(n => ({ ...n, read: true })));
        toast.success(locale === 'en' ? 'All notifications marked as read.' : 'تم تحديد كافة التنبيهات كمقروءة.');
      }
    } catch (e) {}
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    const token = localStorage.getItem('smart_token');
    if (!token) return;
    try {
      const res = await fetch(`http://localhost:3000/notifications/${id}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (res.ok) {
        setNotifications(prev => prev.filter(n => n._id !== id));
        toast.success(locale === 'en' ? 'Notification deleted.' : 'تم حذف التنبيه.');
      }
    } catch (e) {}
  };

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'unread') return !n.read;
    return true;
  });

  // Localized dictionary
  const dict = {
    title: { en: 'Notification Center', ar: 'مركز التنبيهات' },
    subtitle: { en: 'Stay updated with your career progress and messages.', ar: 'تابع تقدمك المهني ورسائلك أولاً بأول.' },
    all: { en: 'All Notifications', ar: 'كافة التنبيهات' },
    unread: { en: 'Unread Only', ar: 'غير المقروءة فقط' },
    markAll: { en: 'Mark all as read', ar: 'تحديد الكل كمقروء' },
    empty: { en: 'You have no notifications.', ar: 'ليس لديك أي تنبيهات حالياً.' },
    delete: { en: 'Delete', ar: 'حذف' },
    back: { en: 'Back to Dashboard', ar: 'العودة للوحة التحكم' }
  };

  const getLabel = (key: keyof typeof dict) => dict[key][locale === 'ar' ? 'ar' : 'en'];

  if (loading) {
    return (
      <div className="flex min-h-screen bg-base-100 items-center justify-center">
        <span className="loading loading-spinner loading-lg text-primary"></span>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-base-100 text-base-content pb-12 px-4 sm:px-6 lg:px-8 text-start select-none font-sans">
      <div className="max-w-3xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 border-b border-base-300 pb-4">
          <div>
            <h1 className="text-2xl font-black tracking-tight">{getLabel('title')}</h1>
            <p className="text-xs text-base-content/50 mt-1">{getLabel('subtitle')}</p>
          </div>
          <div className="flex gap-2">
            <Link href="/dashboard" className="btn btn-outline border-base-300 btn-xs sm:btn-sm rounded-lg text-xs font-bold">
              {getLabel('back')}
            </Link>
            {notifications.filter(n => !n.read).length > 0 && (
              <button 
                onClick={handleMarkAllRead} 
                className="btn bg-primary hover:bg-[#059669] text-white border-none btn-xs sm:btn-sm rounded-lg text-xs font-bold"
              >
                {getLabel('markAll')}
              </button>
            )}
          </div>
        </div>

        {/* Filters */}
        <div className="flex gap-2 border-b border-base-300 pb-2">
          <button 
            onClick={() => setFilter('all')}
            className={`btn btn-xs rounded-full font-bold uppercase tracking-wider ${filter === 'all' ? 'bg-primary text-white border-none' : 'btn-ghost text-base-content/60'}`}
          >
            {getLabel('all')} ({notifications.length})
          </button>
          <button 
            onClick={() => setFilter('unread')}
            className={`btn btn-xs rounded-full font-bold uppercase tracking-wider ${filter === 'unread' ? 'bg-primary text-white border-none' : 'btn-ghost text-base-content/60'}`}
          >
            {getLabel('unread')} ({notifications.filter(n => !n.read).length})
          </button>
        </div>

        {/* List */}
        <div className="space-y-3">
          {filteredNotifications.length === 0 ? (
            <div className="bg-base-200 border border-base-300 rounded-2xl p-12 text-center">
              <div className="w-12 h-12 bg-primary/10 text-primary rounded-full flex items-center justify-center mx-auto text-xl font-bold">
                🔔
              </div>
              <p className="text-xs text-base-content/50 font-bold mt-3">{getLabel('empty')}</p>
            </div>
          ) : (
            filteredNotifications.map((n) => (
              <div 
                key={n._id}
                onClick={() => handleMarkRead(n._id)}
                className={`card bg-base-200 border border-base-300 p-4 rounded-xl flex flex-row items-start justify-between gap-4 cursor-pointer hover:bg-base-300/60 transition-all ${!n.read ? 'border-primary/20 bg-primary/5' : ''}`}
              >
                <div className="space-y-1 flex-grow">
                  <div className="flex items-center gap-2">
                    <h3 className="font-extrabold text-sm text-base-content">
                      {locale === 'en' ? n.titleEn : n.titleAr}
                    </h3>
                    {!n.read && (
                      <span className="w-1.5 h-1.5 bg-primary rounded-full shrink-0"></span>
                    )}
                  </div>
                  <p className="text-xs text-base-content/70 leading-relaxed pr-2">
                    {locale === 'en' ? n.contentEn : n.contentAr}
                  </p>
                  <div className="flex gap-2 items-center text-[9px] text-base-content/40 font-mono mt-1">
                    <span>{new Date(n.createdAt).toLocaleDateString([], { month: 'short', day: 'numeric' })}</span>
                    <span>•</span>
                    <span>{new Date(n.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                    {n.type !== 'general' && (
                      <>
                        <span>•</span>
                        <span className="uppercase text-primary font-black">{n.type}</span>
                      </>
                    )}
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  {n.link && (
                    <Link 
                      href={n.link}
                      className="btn btn-outline border-primary hover:bg-primary hover:text-white btn-xs rounded px-2"
                    >
                      {locale === 'en' ? 'Open' : 'فتح'}
                    </Link>
                  )}
                  <button 
                    onClick={(e) => handleDelete(n._id, e)}
                    className="btn btn-ghost hover:bg-red-500/10 text-error btn-xs btn-circle"
                    title={getLabel('delete')}
                  >
                    <svg className="w-4.5 h-4.5" fill="none" stroke="currentColor" strokeWidth="2" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            ))
          )}
        </div>

      </div>
    </div>
  );
}
