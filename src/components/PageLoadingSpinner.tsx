import React from 'react';
import { motion } from 'motion/react';
import { Sparkles } from 'lucide-react';

interface PageLoadingSpinnerProps {
  message?: string;
  submessage?: string;
}

export const PageLoadingSpinner: React.FC<PageLoadingSpinnerProps> = ({
  message = 'Loading data, please wait...',
  submessage = 'Sri Sumana Maha Pirivena ERP System',
}) => {
  return (
    <div className="min-h-[60vh] flex flex-col items-center justify-center p-8 text-center select-none">
      <motion.div
        initial={{ opacity: 0, scale: 0.9 }}
        animate={{ opacity: 1, scale: 1 }}
        exit={{ opacity: 0, scale: 0.9 }}
        transition={{ duration: 0.4 }}
        className="relative flex flex-col items-center max-w-sm p-8 bg-white/90 dark:bg-stone-900/90 backdrop-blur-md rounded-3xl border border-amber-300/80 dark:border-amber-800/60 shadow-xl"
      >
        {/* Ambient glowing circle */}
        <div className="absolute w-40 h-40 bg-amber-500/15 rounded-full blur-2xl pointer-events-none animate-pulse-glow" />

        {/* Central Spinning Golden Chakra Wheel */}
        <div className="relative mb-5">
          <div className="w-16 h-16 sm:w-20 sm:h-20 rounded-full bg-gradient-to-br from-amber-400 via-amber-500 to-amber-700 p-0.5 shadow-lg shadow-amber-500/40 flex items-center justify-center border-2 border-amber-200 animate-pulse-slow">
            <div className="w-full h-full rounded-full bg-stone-950/85 backdrop-blur-md flex items-center justify-center border border-amber-400/50">
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 12, ease: 'linear' }}
                className="text-3xl sm:text-4xl drop-shadow-[0_0_15px_rgba(251,191,36,0.9)]"
              >
                ☸
              </motion.span>
            </div>
          </div>

          <div className="absolute -top-1 -right-1 text-amber-400 animate-bounce">
            <Sparkles className="w-4 h-4" />
          </div>
        </div>

        {/* Loading Message & Submessage */}
        <h3 className="text-sm sm:text-base font-bold text-amber-950 dark:text-amber-100 tracking-tight mb-1 flex items-center gap-2">
          <span>{message}</span>
        </h3>
        <p className="text-xs font-semibold text-amber-800/80 dark:text-amber-300/80 mb-4">
          {submessage}
        </p>

        {/* Pulse loading indicator line */}
        <div className="w-36 bg-amber-200/60 dark:bg-amber-950/80 h-1.5 rounded-full overflow-hidden relative">
          <motion.div
            animate={{ x: ['-100%', '100%'] }}
            transition={{ repeat: Infinity, duration: 1.5, ease: 'easeInOut' }}
            className="w-1/2 h-full bg-gradient-to-r from-amber-500 to-amber-300 rounded-full shadow-sm"
          />
        </div>
      </motion.div>
    </div>
  );
};
