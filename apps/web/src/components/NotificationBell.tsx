'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { Bell, CheckCheck } from 'lucide-react';
import { useAppDispatch, useAppSelector } from '@/store/hooks';
import {
  useGetNotificationsQuery,
  useMarkAsReadMutation,
  useMarkAllReadMutation,
  selectAllNotifications,
} from '@/store/api/notificationsApi';
import { resetUnread } from '@/store/slices/notificationsSlice';

export function NotificationBell() {
  const [isOpen, setIsOpen] = useState(false);
  const dispatch = useAppDispatch();
  const token = useAppSelector((state) => state.auth?.token) || (typeof window !== 'undefined' ? localStorage.getItem('token') : null);
  const isAuthenticated = !!token;
  const unreadCount = useAppSelector((state) => state.notifications.unreadCount);

  const { data: notificationsState, isLoading } = useGetNotificationsQuery(undefined, { skip: !isAuthenticated });
  const notifications = notificationsState ? selectAllNotifications(notificationsState) : [];

  const [markAsRead] = useMarkAsReadMutation();
  const [markAllRead] = useMarkAllReadMutation();

  const handleMarkAllRead = async () => {
    try {
      await markAllRead().unwrap();
      dispatch(resetUnread());
    } catch {
      // Fallback reset
      dispatch(resetUnread());
    }
  };

  const handleNotificationClick = async (n: any) => {
    if (!n.read) {
      try {
        await markAsRead({ id: n.id }).unwrap();
      } catch {
        // Continue navigation
      }
    }
    setIsOpen(false);
  };

  return (
    <div className="relative">
      {/* Bell Icon Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="btn btn-ghost btn-circle btn-sm relative text-base-content/80 hover:text-base-content transition-all duration-300 ease-in-out"
        aria-label="Open notifications"
      >
        <Bell className="w-5 h-5" />
        {unreadCount > 0 && (
          <span className="absolute top-0 right-0 badge badge-xs badge-error font-mono text-[9px] font-bold">
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {/* Dropdown Panel */}
      {isOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/20 md:bg-transparent"
            onClick={() => setIsOpen(false)}
          />

          <div className="fixed inset-x-0 bottom-0 z-50 md:absolute md:inset-auto md:right-0 md:top-10 md:w-90 bg-base-100 border border-base-300 shadow-2xl rounded-t-2xl md:rounded-2xl overflow-hidden flex flex-col max-h-[85vh] md:max-h-120 animate-fade-in text-base-content">
            {/* Header */}
            <div className="p-3.5 border-b border-base-200 flex justify-between items-center bg-base-200/50">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm font-heading">Notifications</h3>
                {unreadCount > 0 && (
                  <span className="badge badge-xs badge-primary font-mono font-bold">
                    {unreadCount} new
                  </span>
                )}
              </div>
              <button
                onClick={handleMarkAllRead}
                className="btn btn-ghost btn-xs text-xs text-primary font-medium flex items-center gap-1"
              >
                <CheckCheck className="w-3.5 h-3.5" />
                Mark all read
              </button>
            </div>

            {/* Notifications Feed */}
            <div className="flex-1 overflow-y-auto divide-y divide-base-200 p-1">
              {isLoading && (
                <div className="p-4 text-center text-xs text-base-content/50">
                  Loading notifications...
                </div>
              )}

              {notifications.map((n: any) => (
                <Link
                  key={n.id || n._id}
                  href={n.data?.linkTo || n.linkTo || '/dashboard'}
                  onClick={() => handleNotificationClick(n)}
                  className={`p-3 block transition-colors rounded-xl m-1 ${
                    !n.read ? 'bg-primary/5 border border-primary/20 font-medium' : 'hover:bg-base-200/60'
                  }`}
                >
                  <div className="flex justify-between items-start mb-1">
                    <span className="font-bold text-xs text-base-content">
                      {n.title}
                    </span>
                    {!n.read && (
                      <span className="w-2 h-2 rounded-full bg-primary shrink-0" />
                    )}
                  </div>
                  <p className="text-xs text-base-content/70 line-clamp-2 leading-relaxed">
                    {n.message || n.body}
                  </p>
                </Link>
              ))}

              {!isLoading && notifications.length === 0 && (
                <div className="p-8 text-center text-xs text-base-content/40 italic">
                  No notifications yet
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

