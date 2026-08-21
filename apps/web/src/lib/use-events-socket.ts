'use client';

import React, { useEffect, useState, useRef } from 'react';
import { io, Socket } from 'socket.io-client';
import { toast } from 'react-toastify';
import { NotificationToast } from '@/components/NotificationToast';

export function useEventsSocket(userId?: string) {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);
  const isInitialConnect = useRef(true);

  useEffect(() => {
    if (!userId) return;

    const socketUrl =
      process.env.NEXT_PUBLIC_WS_URL || 'http://localhost:3000/ws/events';

    const s = io(socketUrl, {
      query: { userId },
      transports: ['websocket', 'polling'],
    });

    s.on('connect', () => {
      setIsConnected(true);

      // Reconnect reconciliation: fetch missed state after initial load
      if (!isInitialConnect.current) {
        // Trigger silent state refresh event across components
        window.dispatchEvent(new Event('socket-reconnected'));
      }
      isInitialConnect.current = false;
    });

    s.on('disconnect', () => {
      setIsConnected(false);
    });

    s.on('notification:new', (n: any) => {
      // Toast only live events with deduplication
      toast(React.createElement(NotificationToast, { notification: n }), {
        toastId: n._id || n.id,
        autoClose: n.type === 'subscription_past_due' ? false : 5000,
      });

      // Dispatch event to update bell badge counter
      window.dispatchEvent(new CustomEvent('notification-received', { detail: n }));
    });

    s.on('message:new', (payload: any) => {
      window.dispatchEvent(new CustomEvent('message-received', { detail: payload }));
    });

    setSocket(s);

    return () => {
      s.disconnect();
    };
  }, [userId]);

  return { socket, isConnected };
}
