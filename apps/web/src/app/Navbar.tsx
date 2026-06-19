'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useApp } from '@/components/AppContext';

export default function Navbar() {
  const pathname = usePathname();
  const router = useRouter();
  const { theme, toggleTheme, locale, toggleLocale, t } = useApp();
  const [user, setUser] = useState<{ name: string; email: string; role: string } | null>(null);
  const [mobileOpen, setMobileOpen] = useState(false);

  useEffect(() => {
    const storedUser = localStorage.getItem('smart_user');
    const storedToken = localStorage.getItem('smart_token');
    if (storedUser && storedToken) {
      try {
        setUser(JSON.parse(storedUser));
      } catch (e) {
        setUser(null);
      }
    } else {
      setUser(null);
    }
    setMobileOpen(false);
  }, [pathname]);

  const handleLogout = () => {
    localStorage.removeItem('smart_token');
    localStorage.removeItem('smart_user');
    setUser(null);
    router.push('/');
  };

  if (pathname.startsWith('/auth')) {
    return null;
  }

  const isLinkActive = (path: string) => pathname === path;

  const navLinks = [
    { href: '/roadmap', label: t('nav.roadmap'), show: !!user },
    { href: '/cv', label: t('nav.cv'), show: !!user },
    { href: '/hiring', label: t('nav.jobsMatch'), show: !!user && user?.role === 'learner' },
    { href: '/company', label: t('nav.talentBoard'), show: !!user && user?.role === 'company' },
    { href: '/pricing', label: t('nav.pricing'), show: true },
    { href: '/contact', label: t('nav.contact'), show: true },
  ];

  return (
    <header className="sticky top-4 z-50 px-4 w-full">
      <div className="max-w-5xl mx-auto rounded-full bg-[#111e1c]/95 text-white border border-white/10 shadow-lg px-4 sm:px-6 h-14 flex items-center justify-between gap-4">
        {/* Logo (Mockup Style: Planet circle) */}
        <Link href="/" className="flex items-center gap-2.5 shrink-0">
          <div className="bg-white text-[#111e1c] rounded-full w-9 h-9 flex items-center justify-center shadow-sm hover:scale-105 transition-transform">
            <svg viewBox="0 0 24 24" className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth="2.5">
              <circle cx="12" cy="12" r="6" fill="currentColor" />
              <path d="M4 12c3-1.5 9-1.5 12 0" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
            </svg>
          </div>
          <span className="hidden sm:inline font-bold tracking-tight text-white text-sm">{t('nav.logo')}</span>
        </Link>

        {/* Desktop nav links */}
        <nav className="hidden md:flex items-center gap-6 text-xs font-semibold uppercase tracking-wider flex-1 justify-center">
          {navLinks.filter((l) => l.show).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`transition-colors hover:text-white ${
                isLinkActive(link.href) ? 'text-white font-bold' : 'text-white/60'
              }`}
            >
              {link.label}
            </Link>
          ))}
        </nav>

        {/* Right side controls */}
        <div className="flex items-center gap-2 sm:gap-3 shrink-0">
          {/* Language Selector Button */}
          <button
            onClick={toggleLocale}
            className="btn btn-ghost btn-xs text-white/80 font-bold tracking-wide hover:bg-white/10 px-2 rounded"
            title={locale === 'en' ? 'Switch to Arabic' : 'تغيير للإنجليزية'}
          >
            {locale === 'en' ? 'العربية' : 'EN'}
          </button>

          {/* Theme Selector Toggle */}
          <button
            onClick={toggleTheme}
            className="btn btn-ghost btn-circle btn-xs text-white/80 hover:bg-white/10"
            title={theme === 'smartlight' ? 'Dark Mode' : 'Light Mode'}
          >
            {theme === 'smartlight' ? (
              // Moon Icon
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
              </svg>
            ) : (
              // Sun Icon
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364-6.364l-.707.707M6.343 17.657l-.707.707m12.728 0l-.707-.707M6.343 6.343l-.707-.707M14 12a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            )}
          </button>

          {user ? (
            <div className="dropdown dropdown-end">
              <label tabIndex={0} className="btn btn-xs sm:btn-sm rounded-full bg-white text-[#111e1c] border-none hover:bg-white/90 font-semibold px-4 flex items-center gap-1.5 cursor-pointer normal-case shadow-sm">
                <span className="max-w-[120px] truncate text-[11px] sm:text-xs font-mono">{user.email}</span>
                <svg className="w-3 h-3 text-[#111e1c]" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3">
                  <path d="M19 9l-7 7-7-7" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </label>
              <ul tabIndex={0} className="menu menu-sm dropdown-content mt-3 z-[100] p-3 shadow-lg bg-base-200 text-base-content border border-base-300 rounded-box w-60 space-y-1">
                <li className="px-3 py-2 border-b border-base-300 mb-1">
                  <div className="font-bold text-sm truncate p-0">{user.name}</div>
                  <div className="text-xs text-base-content/60 truncate p-0">{user.email}</div>
                </li>
                {user.role === 'learner' && (
                  <li><Link href="/dashboard">{t('nav.dashboard')}</Link></li>
                )}
                <li><Link href="/roadmap">{t('nav.roadmap')}</Link></li>
                <li><Link href="/cv">{t('nav.cv')}</Link></li>
                {user.role === 'learner' && <li><Link href="/hiring">{t('nav.jobsMatch')}</Link></li>}
                {user.role === 'company' && <li><Link href="/company">{t('nav.talentBoard')}</Link></li>}
                <li className="border-t border-base-300 pt-1 text-red-500">
                  <button onClick={handleLogout}>{t('nav.logout')}</button>
                </li>
              </ul>
            </div>
          ) : (
            <>
              <Link href="/auth/login" className="hidden sm:inline text-xs font-semibold text-white/80 hover:text-white transition-colors">
                {t('nav.login')}
              </Link>
              <Link
                href="/auth/register"
                className="btn btn-xs sm:btn-sm rounded-full bg-white text-[#111e1c] hover:bg-white/90 border-none px-4 font-semibold text-xs shadow-sm"
              >
                {t('nav.signup')}
              </Link>
            </>
          )}

          {/* Mobile menu toggle */}
          <button
            onClick={() => setMobileOpen(!mobileOpen)}
            className="md:hidden btn btn-ghost btn-circle btn-xs text-white hover:bg-white/10"
            aria-label="Toggle menu"
          >
            <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              {mobileOpen ? (
                <path d="M6 6L18 18M6 18L18 6" strokeLinecap="round" />
              ) : (
                <path d="M4 6h16M4 12h16M4 18h16" strokeLinecap="round" />
              )}
            </svg>
          </button>
        </div>
      </div>

      {/* Mobile dropdown panel */}
      {mobileOpen && (
        <div className="md:hidden mt-2 max-w-5xl mx-auto bg-[#111e1c] border border-white/10 rounded-2xl p-4 space-y-3 shadow-lg">
          {navLinks.filter((l) => l.show).map((link) => (
            <Link
              key={link.href}
              href={link.href}
              className={`block text-sm font-semibold text-white/85 ${isLinkActive(link.href) ? 'text-white font-bold' : 'text-white/70'}`}
            >
              {link.label}
            </Link>
          ))}
          {!user && (
            <Link href="/auth/login" className="block text-sm font-semibold text-white/80 pt-2 border-t border-white/10">
              {t('nav.login')}
            </Link>
          )}
        </div>
      )}
    </header>
  );
}
