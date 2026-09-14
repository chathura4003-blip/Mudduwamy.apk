import React, { useState, useEffect } from 'react';
import { getSriLankaDate, getSriLankaMinutesOfDay } from '../utils/sriLankaTime';

export interface LivePeriodCountdownProps {
  startMin: number;
  endMin?: number;
  mode?: 'remaining' | 'starts_in';
  variant?: 'text' | 'percent' | 'bar' | 'full_badge';
  prefix?: string;
  className?: string;
  barContainerClassName?: string;
  barClassName?: string;
}

interface PeriodMetrics {
  remainingMins: number;
  remainingSecs: number;
  remainingSecStr: string;
  progressPercent: number;
}

function calculatePeriodMetrics(
  startMin: number,
  endMin: number = startMin + 40,
  mode: 'remaining' | 'starts_in' = 'remaining'
): PeriodMetrics {
  const currentMins = getSriLankaMinutesOfDay();
  const currentSecs = getSriLankaDate().getSeconds();
  const totalCurrentSecs = currentMins * 60 + currentSecs;

  if (mode === 'starts_in') {
    const startsInSecs = Math.max(0, startMin * 60 - totalCurrentSecs);
    const remainingMins = Math.floor(startsInSecs / 60);
    const remainingSecStr = String(startsInSecs % 60).padStart(2, '0');
    return {
      remainingMins,
      remainingSecs: startsInSecs,
      remainingSecStr,
      progressPercent: 0,
    };
  }

  // mode === 'remaining'
  const periodTotalSecs = Math.max(1, (endMin - startMin) * 60);
  const elapsedSecs = Math.max(0, totalCurrentSecs - startMin * 60);
  const remainingSecs = Math.max(0, endMin * 60 - totalCurrentSecs);
  const remainingMins = Math.floor(remainingSecs / 60);
  const remainingSecStr = String(remainingSecs % 60).padStart(2, '0');
  const progressPercent = Math.min(100, Math.max(0, (elapsedSecs / periodTotalSecs) * 100));

  return {
    remainingMins,
    remainingSecs,
    remainingSecStr,
    progressPercent,
  };
}

/**
 * ⏳ LivePeriodCountdown
 * Self-contained isolated leaf component for calculating and rendering real-time
 * period progress and countdown without triggering parent tab/portal re-renders.
 */
export const LivePeriodCountdown: React.FC<LivePeriodCountdownProps> = React.memo(({
  startMin,
  endMin = startMin + 40,
  mode = 'remaining',
  variant = 'text',
  prefix = '',
  className = '',
  barContainerClassName = '',
  barClassName = '',
}) => {
  const [metrics, setMetrics] = useState<PeriodMetrics>(() =>
    calculatePeriodMetrics(startMin, endMin, mode)
  );

  useEffect(() => {
    setMetrics(calculatePeriodMetrics(startMin, endMin, mode));

    const timer = setInterval(() => {
      if (!document.hidden) {
        setMetrics(calculatePeriodMetrics(startMin, endMin, mode));
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [startMin, endMin, mode]);

  if (variant === 'percent') {
    return <span className={className}>{Math.round(metrics.progressPercent)}%</span>;
  }

  if (variant === 'bar') {
    return (
      <div className={barContainerClassName}>
        <div
          className={barClassName}
          style={{ width: `${metrics.progressPercent}%` }}
        />
      </div>
    );
  }

  if (variant === 'full_badge') {
    return (
      <span className={className}>
        {prefix ? `${prefix} ` : ''}
        {metrics.remainingMins}:{metrics.remainingSecStr}
      </span>
    );
  }

  // Default 'text'
  return (
    <span className={className}>
      {prefix ? `${prefix} ` : ''}
      {metrics.remainingMins}:{metrics.remainingSecStr}
    </span>
  );
});

LivePeriodCountdown.displayName = 'LivePeriodCountdown';
