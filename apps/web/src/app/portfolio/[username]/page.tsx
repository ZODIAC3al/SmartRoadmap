import React from 'react';
import Link from 'next/link';
import { PortfolioRenderer } from '../_components/PortfolioRenderer';
import { PortfolioData } from '@/lib/portfolio';

// Server/Public fetch helper
async function fetchPublicPortfolioData(username: string): Promise<PortfolioData | null> {
  try {
    const apiBase = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:3000';
    const res = await fetch(`${apiBase}/portfolio/public/${username}`, {
      cache: 'no-store',
    });
    if (!res.ok) return null;
    const json = await res.json();
    return json.data || null;
  } catch (err) {
    return null;
  }
}

export default async function PublicPortfolioPage({
  params,
}: {
  params: Promise<{ username: string }>;
}) {
  const { username } = await params;
  const portfolio = await fetchPublicPortfolioData(username);

  if (!portfolio || !portfolio.isPublished) {
    return (
      <div className="min-h-screen bg-slate-950 text-slate-100 flex flex-col items-center justify-center p-6 text-center space-y-4">
        <div className="w-16 h-16 bg-slate-900 border border-slate-800 rounded-3xl flex items-center justify-center text-2xl font-bold">
          🔒
        </div>
        <h1 className="text-2xl font-extrabold text-white">Portfolio Private or Not Found</h1>
        <p className="text-xs text-slate-400 max-w-sm">
          The public portfolio for user "<span className="font-mono text-primary">{username}</span>" is either private or has not been published yet.
        </p>
        <Link
          href="/"
          className="btn bg-primary hover:bg-[#059669] text-white btn-sm rounded-xl font-bold border-none"
        >
          Return to Home
        </Link>
      </div>
    );
  }

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100">
      <PortfolioRenderer portfolio={portfolio} />
    </main>
  );
}
