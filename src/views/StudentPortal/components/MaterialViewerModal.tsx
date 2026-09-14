import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Music, Download, Smartphone } from 'lucide-react';
import type { StudyMaterial } from '../../../types';
import { downloadFileFromUrl, openInDevicePdfViewer, openInAppFileViewer } from '../../../utils/pdfHelper';
import { triggerHaptic } from '../../../utils/haptics';
import { resolveSubjectSinhalaName } from '../../../utils/subjectHelper';

interface MaterialViewerModalProps {
  viewingMaterial: StudyMaterial | null;
  onClose: () => void;
  getMaterialTypeBadge: (material: StudyMaterial) => React.ReactNode;
  isImageResource: (url?: string, filename?: string) => boolean;
  getPdfObjectUrl: (url: string) => string;
  openPdfInBlobTab: (url: string) => void;
  decodedTextNote: string;
  isSi: boolean;
}

export const MaterialViewerModal: React.FC<MaterialViewerModalProps> = ({
  viewingMaterial,
  onClose,
  getMaterialTypeBadge,
  isImageResource,
  getPdfObjectUrl,
  openPdfInBlobTab,
  decodedTextNote,
  isSi,
}) => {
  const isPdf =
    viewingMaterial?.type === 'pdf' ||
    (viewingMaterial?.fileUrl &&
      (viewingMaterial.fileUrl.endsWith('.pdf') || viewingMaterial.fileUrl.includes('.pdf')));

  const handleOpenUniversalViewer = () => {
    triggerHaptic('light');
    if (viewingMaterial.fileUrl) {
      if ('speechSynthesis' in window) window.speechSynthesis.cancel();
      const cleanSubj = resolveSubjectSinhalaName(viewingMaterial.subjectId || (viewingMaterial as any).subject);
      openInAppFileViewer({
        url: viewingMaterial.fileUrl,
        title: viewingMaterial.title,
        subtitle: cleanSubj ? `විෂය: ${cleanSubj}` : undefined,
        fileType: isPdf ? 'pdf' : isImageResource(viewingMaterial.fileUrl, viewingMaterial.fileName) ? 'image' : 'auto',
        downloadFileName: viewingMaterial.fileName || `${viewingMaterial.title}.pdf`,
      });
      onClose();
    }
  };

  const handleDownload = () => {
    triggerHaptic('medium');
    if (viewingMaterial.fileUrl) {
      downloadFileFromUrl(
        viewingMaterial.fileUrl,
        viewingMaterial.fileName || `${viewingMaterial.title}${isPdf ? '.pdf' : ''}`
      );
    }
  };

  const handleOpenDeviceApp = () => {
    triggerHaptic('medium');
    if (viewingMaterial.fileUrl) {
      openInDevicePdfViewer(viewingMaterial.fileUrl, viewingMaterial.title);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {viewingMaterial && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/80 backdrop-blur-xs p-2 sm:p-4 overflow-y-auto select-none"
          onClick={(e) => {
            if (e.target === e.currentTarget) {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-4 sm:p-5 max-w-4xl w-full shadow-2xl space-y-3 max-h-[95vh] overflow-y-auto my-auto text-stone-900 dark:text-stone-100 border border-slate-200 dark:border-stone-700 mobile-bottom-sheet"
          >
            {/* Mobile Bottom Sheet Drag Indicator */}
            <div className="bottom-sheet-drag-handle sm:hidden -mt-1 mb-2" />

            <div className="flex items-start justify-between border-b pb-2.5">
          <div>
            {getMaterialTypeBadge(viewingMaterial)}
            <h3 className="font-serif font-bold text-base text-amber-950 dark:text-amber-100 mt-1">
              {viewingMaterial.title}
            </h3>
          </div>
          <button
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="p-1 rounded-lg hover:bg-slate-100 dark:hover:bg-stone-800 cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-2.5">
          {isPdf ? (
            <div className="w-full bg-gradient-to-br from-stone-900 to-stone-950 p-6 rounded-2xl border border-amber-500/30 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                <Smartphone className="w-8 h-8 animate-pulse text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-sm text-amber-100">
                  {viewingMaterial.title}
                </h4>
                <p className="text-xs text-stone-300">
                  මෙම PDF ලේඛනය ඔබගේ දුරකථනයේ ඇති PDF Reader App එකෙන් විවෘත කරන්නද?
                </p>
              </div>
              <div className="flex flex-wrap items-center justify-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={handleOpenDeviceApp}
                  className="px-4 py-2.5 bg-gradient-to-r from-amber-600 to-amber-700 hover:from-amber-500 hover:to-amber-600 text-stone-950 font-black text-xs rounded-xl flex items-center gap-2 transition cursor-pointer shadow-md active:scale-95"
                >
                  <Smartphone className="w-4 h-4 stroke-[2.5]" />
                  <span>Mobile PDF App එකෙන් බලන්න</span>
                </button>
                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-4 py-2.5 bg-stone-800 hover:bg-stone-700 text-stone-200 font-bold text-xs rounded-xl flex items-center gap-2 transition cursor-pointer border border-stone-700 active:scale-95"
                >
                  <Download className="w-4 h-4 text-amber-400" />
                  <span>බාගත කරන්න (Download)</span>
                </button>
              </div>
            </div>
          ) : isImageResource(viewingMaterial.fileUrl, viewingMaterial.fileName) ? (
            <div className="bg-stone-900 p-3 rounded-2xl text-center">
              <img
                src={viewingMaterial.fileUrl}
                alt={viewingMaterial.title}
                className="max-h-[55vh] mx-auto object-contain rounded-xl"
              />
            </div>
          ) : viewingMaterial.type === 'audio' ? (
            <div className="p-5 bg-amber-950 text-white rounded-2xl text-center space-y-2">
              <Music className="w-8 h-8 text-amber-400 mx-auto animate-pulse" />
              <audio controls src={viewingMaterial.fileUrl} className="w-full max-w-md mx-auto" />
            </div>
          ) : (
            <div className="p-4 bg-slate-50 dark:bg-stone-800 rounded-2xl whitespace-pre-wrap font-serif text-xs">
              {decodedTextNote ||
                viewingMaterial.description ||
                (isSi ? 'විස්තරයක් නොමැත.' : 'No description.')}
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t pt-2.5">
          <div className="flex items-center gap-2">
            {viewingMaterial.fileUrl && (
              <>
                <button
                  type="button"
                  onClick={handleOpenUniversalViewer}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>{isSi ? 'සම්පූර්ණ තිරයෙන්' : 'Full Screen'}</span>
                </button>

                {isPdf && (
                  <button
                    type="button"
                    onClick={handleOpenDeviceApp}
                    className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-amber-600 dark:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-amber-500/30"
                    title="බාහිර PDF App එකෙන් විවෘත කරන්න"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>{isSi ? 'PDF App' : 'PDF App'}</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-stone-300 dark:border-stone-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>{isSi ? 'බාගන්න' : 'Download'}</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              if ('speechSynthesis' in window) window.speechSynthesis.cancel();
              onClose();
            }}
            className="px-5 py-1.5 bg-stone-700 hover:bg-stone-800 text-white font-bold text-xs rounded-xl cursor-pointer shadow-xs active:scale-95"
          >
            {isSi ? 'වසන්න' : 'Close'}
          </button>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
