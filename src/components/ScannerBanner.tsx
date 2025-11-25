import Link from 'next/link';
import { motion } from 'framer-motion';
import { MapPinIcon, ArrowRightIcon } from '@heroicons/react/24/outline';
import ExpandingInfoSection from './ExpandingInfoSection';

export default function ScannerBanner() {
  return (
    <ExpandingInfoSection
      className="mb-8"
      storageKey="hideScannerBanner"
      title="Scanner Mode"
      icon={(isExpanded) => (
        <MapPinIcon
          className={isExpanded ? 'w-8 h-8' : 'w-6 h-6'}
        />
      )}
      badge={
        <span className="text-xs bg-emerald-500/20 text-emerald-300 px-2 py-0.5 rounded-full border border-emerald-500/30">
          New
        </span>
      }
      description="Incorporate Secret Shards into geocaches or other real world puzzles with this specialized scanner mode"
    >
      {(collapse) => (
        <>
          <p className="text-slate-300 mb-6 leading-relaxed">
            Designed for real-world adventures! This specialized mode features a full-screen QR code scanner that stores scanned codes in your browser's local storage. It's perfect for multi-stage geocaches and scavenger hunts where you need to scan and save codes quickly while on the go.
          </p>
          <div className="flex items-center gap-3">
            <Link
              href="/scanner"
              className="px-4 py-2 bg-emerald-500 hover:bg-emerald-400 text-slate-900 font-semibold rounded-lg transition-colors flex items-center gap-2 shadow-lg shadow-emerald-900/20"
            >
              <span>Launch Scanner</span>
              <ArrowRightIcon className="w-4 h-4 pt-1" stroke="currentColor" strokeWidth={3} />
            </Link>
            <button
              onClick={(e) => {
                e.stopPropagation();
                collapse();
              }}
              className="px-4 py-2 text-slate-400 hover:text-slate-200 font-medium transition-colors"
            >
              Cancel
            </button>
          </div>
        </>
      )}
    </ExpandingInfoSection>
  );
}
