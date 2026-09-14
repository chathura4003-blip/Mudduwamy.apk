import React, { useMemo } from 'react';

/**
 * 🪷 Dynamic Ambient Atmosphere Background Engine (GPU Hardware-Accelerated)
 * Provides rich, fluid, 60fps/120fps animated monastic ambiance across all portals
 * with zero CPU frame drop, optimized for Mobile WebViews, Android APKs, and Desktop.
 */
export const AnimatedAtmosphereBackground: React.FC = React.memo(() => {
  // Generate deterministic gentle stardust particles for zero hydration mismatches
  const stardustParticles = useMemo(
    () => [
      { top: '12%', left: '15%', size: 'w-1.5 h-1.5', delay: '0s', dur: '6s', opacity: 0.65 },
      { top: '24%', left: '85%', size: 'w-2 h-2', delay: '1.2s', dur: '7s', opacity: 0.55 },
      { top: '42%', left: '8%', size: 'w-1 h-1', delay: '2.5s', dur: '5.5s', opacity: 0.7 },
      { top: '65%', left: '92%', size: 'w-2.5 h-2.5', delay: '0.8s', dur: '8s', opacity: 0.6 },
      { top: '78%', left: '18%', size: 'w-1.5 h-1.5', delay: '3.1s', dur: '6.5s', opacity: 0.5 },
      { top: '88%', left: '72%', size: 'w-2 h-2', delay: '1.8s', dur: '7.5s', opacity: 0.65 },
      { top: '35%', left: '50%', size: 'w-1.5 h-1.5', delay: '4s', dur: '9s', opacity: 0.45 },
    ],
    []
  );

  return (
    <div
      aria-hidden="true"
      className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none"
    >
      {/* 🌟 1. Ambient Radial Aurora Mesh Overlay */}
      <div className="absolute inset-0 w-full h-full bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.14),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(234,88,12,0.12),transparent_50%),radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.08),transparent_55%)] dark:bg-[radial-gradient(circle_at_20%_15%,rgba(245,158,11,0.10),transparent_45%),radial-gradient(circle_at_80%_85%,rgba(234,88,12,0.09),transparent_50%),radial-gradient(circle_at_50%_35%,rgba(251,191,36,0.06),transparent_55%)]" />

      {/* 🌟 2. Four Floating Glowing Ambient Orbs (GPU Layer Promoted) */}
      {/* Orb 1: Warm Sacred Amber (Top-Left) */}
      <div className="absolute -top-24 -left-24 w-96 h-96 sm:w-[32rem] sm:h-[32rem] rounded-full bg-gradient-to-br from-amber-400/25 via-amber-500/15 to-transparent dark:from-amber-500/15 dark:via-amber-600/10 dark:to-transparent blur-3xl animate-bg-float-1 transform-gpu" />

      {/* Orb 2: Deep Monastic Saffron/Terracotta (Bottom-Right) */}
      <div className="absolute -bottom-28 -right-28 w-96 h-96 sm:w-[34rem] sm:h-[34rem] rounded-full bg-gradient-to-tl from-orange-600/20 via-amber-600/15 to-transparent dark:from-orange-600/14 dark:via-amber-700/08 dark:to-transparent blur-3xl animate-bg-float-2 transform-gpu" />

      {/* Orb 3: Sacred Sun Golden Aura (Center-Right) */}
      <div className="absolute top-1/3 -right-20 w-80 h-80 sm:w-96 sm:h-96 rounded-full bg-gradient-to-l from-yellow-400/20 via-amber-400/10 to-transparent dark:from-yellow-500/10 dark:via-amber-500/05 dark:to-transparent blur-3xl animate-bg-float-3 transform-gpu" />

      {/* Orb 4: Soft Sapphire Radiance (Bottom-Left) */}
      <div className="absolute -bottom-16 left-1/4 w-72 h-72 sm:w-80 sm:h-80 rounded-full bg-gradient-to-tr from-blue-500/15 via-cyan-400/08 to-transparent dark:from-blue-600/10 dark:via-indigo-500/05 dark:to-transparent blur-3xl animate-bg-float-4 transform-gpu" />

      {/* 🌟 3. Subtle Drifting Stardust & Golden Particles */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        {stardustParticles.map((pt, i) => (
          <div
            key={i}
            style={{
              top: pt.top,
              left: pt.left,
              animationDelay: pt.delay,
              animationDuration: pt.dur,
              opacity: pt.opacity,
            }}
            className={`absolute ${pt.size} rounded-full bg-amber-400/70 dark:bg-amber-300/60 shadow-[0_0_10px_rgba(251,191,36,0.8)] animate-bg-particle transform-gpu`}
          />
        ))}
      </div>

      {/* 🌟 4. Light Theme Delicate Grain/Shimmer Depth Accent */}
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-amber-500/[0.02] to-transparent dark:via-amber-400/[0.01] pointer-events-none" />
    </div>
  );
});

AnimatedAtmosphereBackground.displayName = 'AnimatedAtmosphereBackground';

