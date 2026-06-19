'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

type Tab = {
    href: string;
    label: string;
    icon: (active: boolean) => React.ReactNode;
};

const TABS: Tab[] = [
    {
        href: '/dashboard',
        label: 'Home',
        icon: (active) => (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill={active ? 'currentColor' : 'none'} stroke="currentColor" strokeWidth="2">
                <path d="M3 11l9-8 9 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M5 10v10a1 1 0 001 1h12a1 1 0 001-1V10" strokeLinecap="round" strokeLinejoin="round" />
            </svg>
        ),
    },
    {
        href: '/roadmap',
        label: 'Roadmap',
        icon: (active) => (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <rect x="4" y="12" width="3.5" height="8" rx="1" fill={active ? 'currentColor' : 'none'} />
                <rect x="10.25" y="7" width="3.5" height="13" rx="1" fill={active ? 'currentColor' : 'none'} />
                <rect x="16.5" y="3" width="3.5" height="17" rx="1" fill={active ? 'currentColor' : 'none'} />
            </svg>
        ),
    },
    {
        href: '/cv',
        label: 'Profile',
        icon: (active) => (
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="12" cy="8" r="4" fill={active ? 'currentColor' : 'none'} />
                <path d="M4 20c0-4 3.6-7 8-7s8 3 8 7" strokeLinecap="round" />
            </svg>
        ),
    },
];

export default function BottomNav() {
    const pathname = usePathname();

    if (pathname.startsWith('/auth')) return null;

    const activeIndex = TABS.findIndex((t) => pathname === t.href || pathname.startsWith(t.href + '/'));

    return (
        <nav
            className="md:hidden fixed bottom-0 left-0 right-0 z-50 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))]"
            aria-label="Primary mobile navigation"
        >
            <div className="relative bg-white rounded-[28px] shadow-[0_8px_30px_rgba(124,58,237,0.18)] h-16 grid grid-cols-3 max-w-sm mx-auto">
                {TABS.map((tab, i) => {
                    const active = i === activeIndex;
                    return (
                        <Link
                            key={tab.href}
                            href={tab.href}
                            className="relative flex flex-col items-center justify-center gap-1 h-full"
                        >
                            {active && (
                                <span
                                    className="absolute -top-7 left-1/2 -translate-x-1/2 w-14 h-14 rounded-full bg-white shadow-[0_4px_16px_rgba(124,58,237,0.35)] flex items-center justify-center text-[#7c3aed]"
                                    aria-hidden="true"
                                >
                                    <span className="absolute inset-0 rounded-full bg-[#7c3aed]/10 scale-125" />
                                    <span className="relative">{tab.icon(true)}</span>
                                </span>
                            )}
                            <span className={active ? 'opacity-0' : 'text-gray-400'}>
                                {!active && tab.icon(false)}
                            </span>
                            <span
                                className={`text-[11px] font-medium ${active ? 'text-[#7c3aed] mt-5' : 'text-gray-400'}`}
                            >
                                {tab.label}
                            </span>
                        </Link>
                    );
                })}
            </div>
        </nav>
    );
}