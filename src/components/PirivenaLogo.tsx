import React from 'react';
import { usePublicSite } from '../context/PublicSiteContext';

interface PirivenaLogoProps {
  className?: string;
  size?: 'xs' | 'sm' | 'md' | 'lg' | 'xl' | '2xl' | '3xl' | number;
  showText?: boolean;
  textClassName?: string;
  subtitleClassName?: string;
  animate?: boolean;
  variant?: 'full' | 'icon' | 'badge';
  logoUrl?: string;
  onClick?: () => void;
}

export const PirivenaLogo: React.FC<PirivenaLogoProps> = ({
  className = '',
  size = 'md',
  showText = true,
  textClassName = '',
  subtitleClassName = '',
  animate = false,
  variant = 'full',
  logoUrl,
  onClick,
}) => {
  let contextLogoUrl: string | undefined;
  try {
    const { siteSettings } = usePublicSite();
    contextLogoUrl = siteSettings?.heroLogoUrl;
  } catch (e) {
    // Graceful fallback if rendered outside PublicSiteProvider
  }

  const activeLogoSrc = logoUrl || contextLogoUrl || '/pirivena-logo.svg';

  // Convert size prop to numeric pixels
  const getSizePx = (): number => {
    if (typeof size === 'number') return size;
    switch (size) {
      case 'xs':
        return 28;
      case 'sm':
        return 36;
      case 'md':
        return 48;
      case 'lg':
        return 64;
      case 'xl':
        return 88;
      case '2xl':
        return 120;
      case '3xl':
        return 160;
      default:
        return 48;
    }
  };

  const logoPx = getSizePx();

  return (
    <div
      onClick={onClick}
      className={`inline-flex items-center gap-2.5 sm:gap-3 select-none ${
        onClick ? 'cursor-pointer hover:opacity-95 transition-opacity' : ''
      } ${className}`}
    >
      {/* Official Emblem Graphic */}
      <div
        style={{ maxWidth: `${logoPx}px`, maxHeight: `${logoPx}px` }}
        className={`w-10 h-10 xs:w-11 xs:h-11 sm:w-12 sm:h-12 md:w-[58px] md:h-[58px] relative flex-shrink-0 flex items-center justify-center filter drop-shadow-md transition-transform duration-200 ${
          animate ? 'hover:scale-105 transform-gpu' : ''
        }`}
      >
        <img
          src={activeLogoSrc}
          alt="ශ්‍රී සුමන මහා පිරිවෙණ ලාංඡනය"
          className="w-full h-full object-contain pointer-events-none transform-gpu"
          onError={(e) => {
            const target = e.target as HTMLImageElement;
            if (target.src && !target.src.endsWith('/pirivena-logo.svg')) {
              target.src = '/pirivena-logo.svg';
            }
          }}
        />
      </div>

      {/* Brand Text Header */}
      {showText && variant !== 'icon' && (
        <div className="flex flex-col text-left justify-center leading-tight drop-shadow-xs min-w-0 flex-1">
          <span
            className={`font-serif font-black tracking-tight text-amber-950 dark:text-amber-100 leading-snug break-words group-hover:text-amber-800 dark:group-hover:text-amber-200 transition-colors ${
              textClassName ||
              (logoPx >= 64
                ? 'text-xl sm:text-2xl md:text-3xl'
                : logoPx >= 48
                  ? 'text-xs min-[380px]:text-sm sm:text-lg md:text-xl lg:text-2xl'
                  : 'text-[11px] sm:text-xs')
            }`}
          >
            Sri Sumana Maha Pirivena
          </span>
          <span
            className={`font-serif font-bold text-amber-800 dark:text-amber-300/90 leading-snug break-words ${
              subtitleClassName ||
              (logoPx >= 64
                ? 'text-xs sm:text-base md:text-lg'
                : logoPx >= 48
                  ? 'text-[9.5px] min-[380px]:text-[10.5px] sm:text-xs md:text-sm lg:text-base'
                  : 'text-[8.5px] sm:text-[10px]')
            }`}
          >
            ශ්‍රී සුමන මහා පිරිවෙන - මුද්දුව, රත්නපුර
          </span>
        </div>
      )}
    </div>
  );
};
