import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import { PirivenaLogo } from './PirivenaLogo';

interface SplashLoaderProps {
  onComplete?: () => void;
}

export const SplashLoader: React.FC<SplashLoaderProps> = ({ onComplete }) => {
  const [loading, setLoading] = useState(() => {
    try {
      return !sessionStorage.getItem('pirivena_splash_seen');
    } catch (e) {
      return false;
    }
  });
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    if (!loading) {
      if (onComplete) onComplete();
      return;
    }

    let finishTimer: any = null;
    let rafId: number;

    // Fast & Responsive 60fps counter (~180ms for instant entrance & ultra-fast LCP)
    const startTime = Date.now();
    const duration = 180;

    const frame = () => {
      const elapsed = Date.now() - startTime;
      const pct = Math.min(100, Math.round((elapsed / duration) * 100));
      setProgress(pct);

      if (pct < 100) {
        rafId = requestAnimationFrame(frame);
      } else {
        try {
          sessionStorage.setItem('pirivena_splash_seen', '1');
        } catch (_) {}
        finishTimer = setTimeout(() => {
          setLoading(false);
          if (onComplete) onComplete();
        }, 30);
      }
    };

    rafId = requestAnimationFrame(frame);
    return () => {
      cancelAnimationFrame(rafId);
      if (finishTimer) clearTimeout(finishTimer);
    };
  }, [loading, onComplete]);

  return (
    <AnimatePresence>
      {loading && (
        <motion.div
          data-splash="true"
          initial={{ opacity: 1 }}
          exit={{ opacity: 0, scale: 0.98 }}
          transition={{ duration: 0.18, ease: 'easeOut' }}
          className="fixed inset-0 z-[99999] flex flex-col items-center justify-center bg-gradient-to-b from-[#0a0806] via-[#14100c] to-[#080705] text-amber-100 overflow-hidden select-none transform-gpu"
        >
          {/* 🌟 1. GPU-ACCELERATED AMBIENT RADIAL LIGHTING */}
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_20%_25%,rgba(245,158,11,0.15),transparent_50%),radial-gradient(circle_at_80%_75%,rgba(234,88,12,0.12),transparent_50%)] pointer-events-none" />

          {/* 🌟 3. CENTRAL CONTENT GLASS CARD */}
          <div className="relative z-10 flex flex-col items-center px-6 max-w-sm sm:max-w-md text-center">
            {/* Official Pirivena Emblem with Dynamic Spring Entrance & Radiant Halo */}
            <motion.div
              initial={{ scale: 0.35, opacity: 0, y: 35 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              transition={{ duration: 0.6, type: 'spring', stiffness: 240, damping: 18 }}
              className="relative mb-5"
            >
              {/* Outer Golden Breathing Ring */}
              <div className="absolute -inset-3 rounded-full bg-gradient-to-r from-amber-500/30 via-yellow-400/20 to-orange-500/30 blur-md animate-icon-pulse-glow" />

              <div className="relative p-3.5 rounded-full bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-transparent backdrop-blur-2xl shadow-[0_0_60px_rgba(245,158,11,0.4)] border border-amber-300/40 ring-4 ring-amber-500/25">
                <PirivenaLogo size={105} variant="icon" animate />
              </div>

              {/* Decorative floating sparkle badge */}
              <motion.div
                initial={{ scale: 0, rotate: -45 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.25, duration: 0.45, type: 'spring' }}
                className="absolute -top-1.5 -right-1.5 p-1.5 rounded-full bg-gradient-to-tr from-amber-600 to-yellow-400 text-stone-950 shadow-xl ring-2 ring-stone-950 animate-icon-sparkle"
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
            </motion.div>

            {/* Institution Titles with Staggered Fade Up */}
            <motion.div
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.15, duration: 0.45 }}
              className="space-y-1.5 mb-6"
            >
              <div className="inline-flex items-center gap-1.5 px-3 py-0.5 rounded-full bg-amber-500/15 border border-amber-400/30 text-amber-300 text-[10px] font-mono uppercase tracking-widest font-black shadow-xs">
                <span>☸ MONASTIC SMART ERP</span>
              </div>
              <h1 className="text-2xl sm:text-3xl font-serif font-black text-transparent bg-clip-text bg-gradient-to-r from-amber-200 via-yellow-200 to-amber-400 tracking-tight leading-tight drop-shadow-sm">
                ශ්‍රී සුමන මහා පිරිවෙන
              </h1>
              <p className="text-xs sm:text-sm font-bold text-amber-300/90 font-serif">
                මුද්දුව, රත්නපුර • Sri Sumana Maha Pirivena
              </p>
              <p className="text-[11px] text-amber-400/70 font-medium tracking-wide">
                Digital Monastic Learning & Administrative System
              </p>
            </motion.div>

            {/* Glowing Golden Progress Bar with Shimmer Beam */}
            <motion.div
              initial={{ opacity: 0, scaleX: 0.8 }}
              animate={{ opacity: 1, scaleX: 1 }}
              transition={{ delay: 0.25, duration: 0.3 }}
              className="w-64 sm:w-72 bg-stone-900/90 border border-amber-500/50 rounded-full h-3 p-0.5 shadow-inner overflow-hidden relative mb-3"
            >
              <motion.div
                className="h-full bg-gradient-to-r from-amber-600 via-yellow-400 to-amber-300 rounded-full shadow-[0_0_15px_rgba(245,158,11,0.7)] relative overflow-hidden"
                style={{ width: `${progress}%` }}
                transition={{ ease: 'easeOut', duration: 0.05 }}
              >
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-white/40 to-transparent animate-bg-shimmer" />
              </motion.div>
            </motion.div>

            {/* Percentage & Live Pulse Status */}
            <div className="flex items-center justify-between w-64 sm:w-72 text-[11px] font-bold text-amber-300/80 mb-5 px-1 font-mono">
              <span className="flex items-center gap-1.5 font-sans">
                <span className="w-2 h-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="text-amber-200/90">ආරම්භ වෙමින් පවතී...</span>
              </span>
              <span className="text-amber-200 font-black text-xs">{progress}%</span>
            </div>

            {/* Sacred Pali Gatha Quote with Golden Glow */}
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.35, duration: 0.5 }}
              className="border-t border-amber-500/20 pt-3 w-full"
            >
              <p className="italic text-xs text-amber-200/90 font-serif tracking-wider font-bold drop-shadow-xs">
                "ධම්මෝ හවේ රක්ඛති ධම්මචාරිං"
              </p>
              <p className="text-[10px] text-amber-400/60 font-sans mt-0.5">
                ධර්මයේ හැසිරෙන්නා ධර්මය විසින්ම ආරක්ෂා කරයි
              </p>
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
};
