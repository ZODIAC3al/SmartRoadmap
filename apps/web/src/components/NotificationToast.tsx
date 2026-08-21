'use client';

import React from 'react';
import { useRouter } from 'next/navigation';

export interface NotificationPayload {
  _id?: string;
  id?: string;
  type: string;
  title: string;
  body: string;
  linkTo?: string;
}

export function NotificationToast({
  notification,
}: {
  notification: NotificationPayload;
}) {
  const router = useRouter();

  const handleClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    if (notification.linkTo) {
      router.push(notification.linkTo);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="flex flex-col gap-1 cursor-pointer select-none text-xs"
    >
      <div className="flex items-center justify-between">
        <span className="font-bold text-sm text-base-content leading-tight">
          {notification.title}
        </span>
        <span className="text-[10px] text-primary font-mono font-semibold">
          Now ↗
        </span>
      </div>
      <p className="text-xs text-base-content/70 leading-relaxed">
        {notification.body}
      </p>
    </div>
  );
}
