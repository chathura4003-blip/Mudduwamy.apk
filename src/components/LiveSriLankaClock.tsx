import React, { useState, useEffect } from 'react';
import { formatSriLankaTime, formatSriLankaDateTime } from '../utils/sriLankaTime';

export interface LiveSriLankaClockProps {
  format?: 'time' | 'full';
  includeSeconds?: boolean;
  isSi?: boolean;
  className?: string;
}

/**
 * 🕒 LiveSriLankaClock
 * Self-contained isolated leaf component for displaying real-time Sri Lanka Standard Time.
 * Updates only its own DOM text node every 1,000ms.
 * Prevents unnecessary parent portal or tab re-renders.
 */
export const LiveSriLankaClock: React.FC<LiveSriLankaClockProps> = React.memo(({
  format = 'time',
  includeSeconds = true,
  isSi = false,
  className = '',
}) => {
  const getFormattedTime = () => {
    if (format === 'full') {
      return formatSriLankaDateTime(null, isSi ? 'si' : 'en', includeSeconds, true);
    }
    return formatSriLankaTime(null, includeSeconds);
  };

  const [timeStr, setTimeStr] = useState<string>(getFormattedTime);

  useEffect(() => {
    // Initial immediate update
    setTimeStr(getFormattedTime());

    const timer = setInterval(() => {
      // Pause updates if document is hidden to conserve battery & CPU
      if (!document.hidden) {
        setTimeStr(getFormattedTime());
      }
    }, 1000);

    return () => clearInterval(timer);
  }, [format, includeSeconds, isSi]);

  return <span className={className}>{timeStr}</span>;
});

LiveSriLankaClock.displayName = 'LiveSriLankaClock';
