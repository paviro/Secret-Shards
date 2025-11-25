'use client';

import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import EncryptForm from '@/features/encrypt/EncryptForm';
import DecryptForm from '@/features/decrypt/DecryptForm';
import Header from '@/components/Header';
import FeatureSwitcher from '@/components/FeatureSwitcher';
import ScannerBanner from '@/components/ScannerBanner';
import Footer from '@/components/Footer';

export default function Home() {
  const [mode, setMode] = useState<'encrypt' | 'decrypt'>('encrypt');

  return (
    <main className="min-h-screen bg-slate-950 text-slate-100 p-4 md:p-8 font-sans selection:bg-indigo-500/30">
      <div className="max-w-4xl mx-auto">
        <Header />

        <ScannerBanner />

        <FeatureSwitcher mode={mode} setMode={setMode} />

        <div className="relative min-h-[400px]">
          <AnimatePresence mode="wait">
            {mode === 'encrypt' ? (
              <motion.div
                key="encrypt"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: 20 }}
                transition={{ duration: 0.3 }}
              >
                <EncryptForm />
              </motion.div>
            ) : (
              <motion.div
                key="decrypt"
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <DecryptForm />
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <Footer />
      </div>
    </main>
  );
}
