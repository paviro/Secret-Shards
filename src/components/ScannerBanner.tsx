'use client';

import { useState, useEffect } from 'react';
import Link from 'next/link';
import { motion, AnimatePresence, type Transition } from 'framer-motion';

const layoutSpring: Transition = {
  type: 'spring',
  stiffness: 260,
  damping: 24,
};

export default function ScannerBanner() {
  const [isVisible, setIsVisible] = useState(false);
  const [showIntro, setShowIntro] = useState(false);

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
    <motion.div
      layout
      transition={layoutSpring}
      onClick={() => !showIntro && setShowIntro(true)}
      className={`block mb-8 relative overflow-hidden rounded-2xl border backdrop-blur-md transition-colors ${showIntro
        ? 'bg-slate-900/40 border-emerald-500/20 p-5 cursor-default'
        : 'bg-slate-900/40 border-emerald-500/20 hover:border-emerald-500/40 p-5 cursor-pointer group'
        }`}
    >
      {/* Background Gradient Effect */}
      <AnimatePresence>
        {!showIntro && (
          <motion.div
            key="bg-highlight"
            initial={{ opacity: 0 }}
            animate={{ opacity: 0.5 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25 }}
            className="absolute inset-0 bg-gradient-to-r from-emerald-500/10 to-teal-500/10 group-hover:opacity-100 transition-opacity pointer-events-none"
          />
        )}
      </AnimatePresence>

      <div className="flex items-start gap-4 relative z-10">
        {/* Icon – no layout props, no alignment changes */}
        <div
          className={`p-3 bg-emerald-500/10 rounded-xl text-emerald-400 shrink-0 ${!showIntro && 'group-hover:scale-110 transition-transform'
            }`}
        >
          <svg
            className={showIntro ? 'w-8 h-8' : 'w-6 h-6'}
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        </div>

        {/* Text column */}
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h3
              className={`font-semibold text-emerald-400 ${showIntro ? 'text-lg mb-1' : ''
                }`}
            >
              Scanner Mode
            </h3>

            <AnimatePresence>
              {!showIntro && (
                <motion.span
                  key="new-badge"
                  initial={{ opacity: 0, scale: 0.8 }}
                  animate={{ opacity: 1, scale: 1 }}
                  exit={{ opacity: 0, scale: 0.8 }}
                  transition={{ duration: 0.2 }}
                  className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30"
                >
                  New
                </motion.span>
              )}
            </AnimatePresence>
          </div>

          {/* Content swap – only opacity / small y shift */}
          <AnimatePresence mode="wait" initial={false}>
            {!showIntro ? (
              <motion.p
                key="short-desc"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.18 }}
                className="text-slate-400 text-sm mt-0.5"
              >
                Incorporate Secret Shards into geocaches or other real world puzzles with this specialized scanner mode
              </motion.p>
            ) : (
              <motion.div
                key="long-desc"
                initial={{ opacity: 0, y: 4 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -4 }}
                transition={{ duration: 0.2 }}
                className="mt-1"
              >
                <p className="text-slate-300 mb-6 leading-relaxed">
                  Designed for real-world adventures! This specialized mode features a full-screen QR code scanner that stores scanned codes in your browser's local storage. It's perfect for multi-stage geocaches and scavenger hunts where you need to scan and save codes quickly while on the go.
                </p>
                <div className="flex items-center gap-3">
                  <Link
                    href="/scanner"
                    className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
                  >
                    <span>Launch Scanner</span>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      setShowIntro(false);
                    }}
                    className="px-4 py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
                  >
                    Cancel
                  </button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <div className={showIntro ? '-mt-2 -mr-2' : ''}>
          <button
            onClick={dismissBanner}
            className="p-2 text-slate-500 hover:text-slate-300 hover:bg-slate-800/50 rounded-lg transition-all"
            title="Dismiss"
          >
            <svg className={showIntro ? 'w-5 h-5' : 'w-4 h-4'} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>
      </div>
    </motion.div>
  );
}
