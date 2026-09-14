import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import {
  X,
  Download,
  Printer,
  Maximize2,
  Minimize2,
  ZoomIn,
  ZoomOut,
  RotateCw,
  FileText,
  ExternalLink,
  Sparkles,
  AlertCircle,
  Eye,
  FileBadge,
  Share2,
  Globe,
  Layers,
  Smartphone,
  RefreshCw,
} from 'lucide-react';
import {
  getPdfObjectUrl,
  downloadFileFromUrl,
  parseGoogleDriveUrl,
  getMimeTypeFromUrl,
  openInDevicePdfViewer,
  isLocalOrPrivateUrl,
  convertDataUrlToBlobUrl,
} from '../utils/pdfHelper';
import { triggerHaptic } from '../utils/haptics';
import { useToast } from '../context/ToastContext';
import { copyToClipboard } from '../utils/clipboardHelper';
import { shareContent } from '../utils/shareHelper';
import { triggerUniversalPrint } from '../utils/printHelper';
import { navigationHistoryManager } from '../services/navigationHistoryManager';
import { getMediaUrl } from '../api/apiClient';

export interface InAppFileInfo {
  url: string;
  title?: string;
  subtitle?: string;
  fileType?: 'pdf' | 'image' | 'audio' | 'video' | 'text' | 'auto';
  downloadFileName?: string;
}

interface UniversalFileViewerModalProps {
  isOpen: boolean;
  fileInfo: InAppFileInfo | null;
  onClose: () => void;
}

export const UniversalFileViewerModal: React.FC<UniversalFileViewerModalProps> = ({
  isOpen,
  fileInfo,
  onClose,
}) => {
  const [zoom, setZoom] = useState<number>(100);
  const [rotation, setRotation] = useState<number>(0);
  const [isFullscreen, setIsFullscreen] = useState<boolean>(false);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadError, setLoadError] = useState<boolean>(false);
  const [pdfEngine, setPdfEngine] = useState<'auto' | 'google' | 'pdfjs' | 'direct'>('auto');

  // Reset viewport settings whenever a new file is opened
  useEffect(() => {
    if (isOpen && fileInfo) {
      setZoom(100);
      setRotation(0);
      setLoading(true);
      setLoadError(false);
      setPdfEngine('auto');
      // Safety timeout to dismiss loading spinner
      const timer = setTimeout(() => setLoading(false), 3000);
      return () => clearTimeout(timer);
    }
  }, [isOpen, fileInfo]);

  useEffect(() => {
    if (isOpen) {
      navigationHistoryManager.pushModal('universal_file_viewer', onClose, 60);
    } else {
      navigationHistoryManager.removeModal('universal_file_viewer');
    }
    return () => navigationHistoryManager.removeModal('universal_file_viewer');
  }, [isOpen, onClose]);

  // Handle ESC key to close viewer
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };
    window.addEventListener('keydown', handleEsc);
    return () => window.removeEventListener('keydown', handleEsc);
  }, [isOpen, onClose]);

  if (!isOpen || !fileInfo || !fileInfo.url) return null;

  const rawUrl = getMediaUrl(fileInfo.url.trim());
  const mimeType = getMimeTypeFromUrl(rawUrl);
  const isImage =
    fileInfo.fileType === 'image' ||
    mimeType.startsWith('image/') ||
    /\.(jpg|jpeg|png|webp|gif|svg)$/i.test(rawUrl);
  const isAudio =
    fileInfo.fileType === 'audio' ||
    mimeType.startsWith('audio/') ||
    /\.(mp3|wav|ogg|m4a)$/i.test(rawUrl);
  const isVideo =
    fileInfo.fileType === 'video' ||
    mimeType.startsWith('video/') ||
    /\.(mp4|webm|mov)$/i.test(rawUrl);
  const isPdf =
    fileInfo.fileType === 'pdf' ||
    mimeType.includes('pdf') ||
    (!isImage && !isAudio && !isVideo);

  const embedUrl = isPdf ? getPdfObjectUrl(rawUrl, pdfEngine) : rawUrl;
  const driveInfo = parseGoogleDriveUrl(rawUrl);

  const displayTitle =
    fileInfo.title || (isPdf ? 'ලේඛන පෙරදසුන (PDF Document)' : 'ගොනු පෙරදසුන (File Preview)');
  const displaySubtitle =
    fileInfo.subtitle ||
    (isPdf
      ? `PDF Reader Engine (${pdfEngine.toUpperCase()}) • In-App Document Engine`
      : 'Digital Media Viewer');

  const handleZoomIn = () => {
    triggerHaptic('light');
    setZoom((prev) => Math.min(prev + 25, 250));
  };

  const handleZoomOut = () => {
    triggerHaptic('light');
    setZoom((prev) => Math.max(prev - 25, 50));
  };

  const handleRotate = () => {
    triggerHaptic('light');
    setRotation((prev) => (prev + 90) % 360);
  };

  const handleDownload = () => {
    triggerHaptic('medium');
    downloadFileFromUrl(
      rawUrl,
      fileInfo.downloadFileName ||
        `${displayTitle.replace(/[^a-zA-Z0-9_\u0D80-\u0DFF-]/g, '_')}${isPdf ? '.pdf' : ''}`
    );
  };

  const handleOpenDeviceApp = () => {
    triggerHaptic('medium');
    openInDevicePdfViewer(rawUrl, displayTitle);
  };

  const handlePrint = () => {
    triggerUniversalPrint(displayTitle);
  };

  const toast = useToast();

  const handleShare = async () => {
    const res = await shareContent({
      title: displayTitle,
      text: `ශ්‍රී සුමන මහා පිරිවෙන (මුද්දුව, රත්නපුර) - ${displayTitle}`,
      url: rawUrl.startsWith('data:') ? undefined : rawUrl,
    });
    if (res.success) {
      if (res.method === 'clipboard') {
        toast.success('✓ ගොනු සබැඳිය සාර්ථකව Copy විය!');
      }
    }
  };

  const handleChangeEngine = (engine: 'auto' | 'google' | 'pdfjs' | 'direct') => {
    triggerHaptic('light');
    setLoading(true);
    setLoadError(false);
    setPdfEngine(engine);
    setTimeout(() => setLoading(false), 2500);
  };

  const [showWebIframe, setShowWebIframe] = useState<boolean>(false);

  const modalJSX = (
    <AnimatePresence>
      {isOpen && fileInfo && (
        <motion.div
          initial={{ opacity: 0, scale: 0.96, y: 15 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.96, y: 15 }}
          transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
          className="fixed inset-0 z-[999999] flex flex-col bg-stone-950/98 backdrop-blur-2xl text-white select-none overflow-hidden transform-gpu pt-safe pb-safe"
        >
        {/* ========================================================= */}
        {/* 📱 1. TOP APP BAR & CONTROLS TOOLBAR                     */}
        {/* ========================================================= */}
        <div className="h-14 sm:h-16 px-3 sm:px-6 bg-stone-900/95 backdrop-blur-xl border-b border-amber-500/25 flex items-center justify-between gap-2 shrink-0 z-10 shadow-lg">
          {/* Left: Document Info */}
          <div className="flex items-center gap-2.5 min-w-0 flex-1">
            <div className="w-9 h-9 sm:w-10 sm:h-10 rounded-xl bg-gradient-to-br from-amber-500/20 to-amber-600/30 border border-amber-400/40 text-amber-400 flex items-center justify-center shrink-0 shadow-xs">
              {isPdf ? (
                <FileText className="w-5 h-5 animate-pulse" />
              ) : isImage ? (
                <Eye className="w-5 h-5" />
              ) : (
                <FileBadge className="w-5 h-5" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <h3 className="font-serif font-black text-xs sm:text-sm text-amber-100 truncate">
                {displayTitle}
              </h3>
              <p className="text-[10px] sm:text-[11px] text-amber-300/80 truncate">
                {isPdf ? '📄 PDF ලේඛනය • Mobile Reader Ready' : displaySubtitle}
              </p>
            </div>
          </div>

          {/* Right: Touch Controls */}
          <div className="flex items-center gap-1 sm:gap-1.5 shrink-0">
            {/* Share */}
            <button
              onClick={handleShare}
              className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-stone-800 hover:bg-stone-700 text-stone-200 transition cursor-pointer active:scale-90 border border-stone-700 flex items-center justify-center touch-manipulation"
              title="බෙදාහරින්න (Share)"
            >
              <Share2 className="w-4 h-4" />
            </button>

            {/* Download Button */}
            <button
              onClick={handleDownload}
              className="min-h-[44px] px-3 sm:px-4 py-2 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 shadow-md touch-manipulation"
              title="බාගත කරන්න (Download File)"
            >
              <Download className="w-3.5 h-3.5 sm:w-4 sm:h-4 stroke-[2.8]" />
              <span className="hidden xs:inline">බාගන්න</span>
            </button>

            {/* Close Button */}
            <button
              onClick={() => {
                triggerHaptic('light');
                onClose();
              }}
              className="min-w-[44px] min-h-[44px] p-2 rounded-xl bg-rose-950/80 hover:bg-rose-900 text-rose-300 hover:text-white border border-rose-800 transition cursor-pointer active:scale-90 ml-1 flex items-center justify-center touch-manipulation"
              title="වසන්න (Close Viewer)"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* ========================================================= */}
        {/* 📄 2. DOCUMENT CANVAS / MOBILE PDF ACTION HUB            */}
        {/* ========================================================= */}
        <div className="flex-1 relative bg-stone-950 flex flex-col items-center justify-center overflow-y-auto p-3 sm:p-6">
          {/* Content Type 1: PDF Document Hub */}
          {isPdf && !showWebIframe && (
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 15 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              transition={{ duration: 0.3 }}
              className="w-full max-w-lg bg-gradient-to-b from-stone-900/90 to-stone-950/95 border border-amber-500/35 rounded-3xl p-5 sm:p-7 shadow-[0_20px_50px_rgba(0,0,0,0.8)] text-center space-y-5 my-auto"
            >
              {/* Animated Glowing PDF Icon */}
              <div className="relative mx-auto w-20 h-20 flex items-center justify-center">
                <div className="absolute inset-0 rounded-3xl bg-amber-500/20 blur-xl animate-pulse" />
                <div className="relative w-20 h-20 rounded-3xl bg-gradient-to-br from-amber-500/20 via-amber-600/30 to-amber-700/20 border-2 border-amber-400/50 flex items-center justify-center text-amber-400 shadow-xl">
                  <FileText className="w-10 h-10 drop-shadow-md stroke-[2.2]" />
                </div>
              </div>

              {/* Title & Prompt */}
              <div className="space-y-2">
                <span className="inline-block px-3 py-1 bg-amber-500/15 border border-amber-500/30 rounded-full text-amber-300 font-mono font-black text-[10px] uppercase tracking-wider">
                  PDF Document • ඩිජිටල් ලේඛනය
                </span>
                <h3 className="font-serif font-black text-base sm:text-lg text-amber-100 leading-snug px-2">
                  {displayTitle}
                </h3>
                <p className="text-xs text-stone-300/90 leading-relaxed max-w-md mx-auto pt-1">
                  මෙම PDF ලේඛනය ඔබගේ දුරකථනයේ ඇති <b>PDF Reader App</b> (Google Drive PDF / Adobe Acrobat / WPS Office) එකකින් පහසුවෙන් විවෘත කළ හැක.
                </p>
              </div>

              {/* Primary Native Open Action */}
              <div className="space-y-3 pt-2">
                <motion.button
                  whileHover={{ scale: 1.02 }}
                  whileTap={{ scale: 0.96 }}
                  onClick={handleOpenDeviceApp}
                  className="w-full min-h-[48px] touch-manipulation py-3.5 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 hover:from-amber-500 hover:to-amber-500 text-stone-950 font-black text-sm rounded-2xl flex items-center justify-center gap-2.5 shadow-[0_8px_25px_rgba(245,158,11,0.4)] cursor-pointer transition border border-amber-300/50"
                >
                  <Smartphone className="w-5 h-5 text-stone-950 stroke-[2.5]" />
                  <span>Mobile එකේ PDF App එකෙන් බලන්න</span>
                </motion.button>

                {/* Secondary Actions Grid */}
                <div className="grid grid-cols-2 sm:grid-cols-3 gap-2 pt-1 text-xs">
                  <button
                    type="button"
                    onClick={handleDownload}
                    className="p-3 min-h-[50px] touch-manipulation bg-stone-850 hover:bg-stone-800 text-amber-200 border border-stone-700/80 hover:border-amber-500/40 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Download className="w-4 h-4 text-amber-400" />
                    <span>බාගත කරන්න</span>
                  </button>

                  <button
                    type="button"
                    onClick={handleShare}
                    className="p-3 min-h-[50px] touch-manipulation bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700/80 hover:border-amber-500/40 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95"
                  >
                    <Share2 className="w-4 h-4 text-stone-300" />
                    <span>බෙදාහරින්න</span>
                  </button>

                  <button
                    type="button"
                    onClick={handlePrint}
                    className="p-3 min-h-[50px] touch-manipulation bg-stone-850 hover:bg-stone-800 text-stone-200 border border-stone-700/80 hover:border-amber-500/40 rounded-2xl font-bold flex flex-col items-center justify-center gap-1.5 transition cursor-pointer active:scale-95 col-span-2 sm:col-span-1"
                  >
                    <Printer className="w-4 h-4 text-amber-400" />
                    <span>මුද්‍රණය</span>
                  </button>
                </div>

                {/* Optional Web Preview Toggle */}
                <div className="pt-2">
                  <button
                    type="button"
                    onClick={() => setShowWebIframe(true)}
                    className="text-[11px] text-amber-400/80 hover:text-amber-300 underline underline-offset-4 cursor-pointer transition"
                  >
                    🌐 වෙබ් බ්‍රවුසර පෙරදසුන (Web Iframe Preview) උත්සාහ කරන්න
                  </button>
                </div>
              </div>
            </motion.div>
          )}

          {/* Optional Web Iframe View */}
          {isPdf && showWebIframe && (
            <div className="w-full h-full max-w-5xl rounded-2xl overflow-hidden bg-white dark:bg-stone-900 border border-stone-800 shadow-2xl flex flex-col relative">
              <div className="p-2 bg-stone-900 border-b border-stone-800 flex items-center justify-between">
                <span className="text-xs text-amber-300 font-bold px-2">Web Preview Mode</span>
                <button
                  onClick={() => setShowWebIframe(false)}
                  className="px-3 py-1 bg-amber-600 text-stone-950 font-bold text-xs rounded-lg"
                >
                  ← ආපසු විකල්ප වෙත (Back)
                </button>
              </div>
              <iframe
                src={embedUrl}
                title={displayTitle}
                className="w-full h-full border-0 bg-white"
              />
            </div>
          )}

          {/* Content Type 2: Image Preview */}
          {isImage && (
            <div
              className="max-w-full max-h-full flex items-center justify-center p-2 transition-transform duration-200"
              style={{
                transform: `scale(${zoom / 100}) rotate(${rotation}deg)`,
                transformOrigin: 'center center',
              }}
            >
              <img
                src={rawUrl}
                alt={displayTitle}
                className="max-w-full max-h-[82vh] object-contain rounded-2xl shadow-2xl border border-stone-800"
              />
            </div>
          )}

          {/* Content Type 3: Audio Player */}
          {isAudio && (
            <div className="p-8 bg-stone-900 rounded-3xl border border-amber-500/30 max-w-md w-full text-center space-y-4 shadow-2xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/40 text-amber-400 flex items-center justify-center">
                <FileBadge className="w-8 h-8 animate-pulse" />
              </div>
              <h4 className="font-bold text-sm text-stone-200">{displayTitle}</h4>
              <audio controls src={rawUrl} className="w-full" autoPlay />
            </div>
          )}

          {/* Content Type 4: Video Player */}
          {isVideo && (
            <div className="max-w-4xl w-full rounded-2xl overflow-hidden shadow-2xl border border-stone-800 bg-black">
              <video controls src={rawUrl} className="w-full max-h-[75vh]" autoPlay />
            </div>
          )}
        </div>
      </motion.div>
    )}
    </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalJSX, document.body) : null;
};
