'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';

export default function ScannerBanner() {
  const [isVisible, setIsVisible] = useState(false); // Start hidden to avoid hydration mismatch

  useEffect(() => {
    const isHidden = localStorage.getItem('hideScannerBanner') === 'true';
    if (!isHidden) {
      setIsVisible(true);
    }
  }, []);

  const dismissBanner = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsVisible(false);
    localStorage.setItem('hideScannerBanner', 'true');
  };

  if (!isVisible) return null;

  return (
    <Link href="/scanner" className="block mb-8 group relative overflow-hidden rounded-2xl">
      <div className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 opacity-50 group-hover:opacity-100 transition-opacity" />
      <div className="bg-slate-900/40 backdrop-blur-md border border-emerald-500/20 rounded-2xl p-4 flex items-center justify-between hover:border-emerald-500/40 transition-all relative">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-emerald-500/10 rounded-xl text-emerald-400 group-hover:scale-110 transition-transform">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="font-semibold text-emerald-400">Geocaching Scanner Mode</h3>
              <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">New</span>
            </div>
            <p className="text-slate-400 text-sm mt-0.5">Incorporate Secret Shards into geocaches or other real world puzzles with this specialized scanner mode</p>
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={dismissBanner}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all z-10"
            title="Dismiss"
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </Link>
  );
}

