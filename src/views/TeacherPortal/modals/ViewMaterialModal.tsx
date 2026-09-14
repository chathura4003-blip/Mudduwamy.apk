import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Music, FileText, Download, Smartphone } from 'lucide-react';
import type { StudyMaterial } from '../../../types';
import {
  parseGoogleDriveUrl,
  openPdfInBlobTab,
  getEmbeddableUrl,
  downloadFileFromUrl,
  openInDevicePdfViewer,
  openInAppFileViewer,
} from '../../../utils/pdfHelper';
import { triggerHaptic } from '../../../utils/haptics';

interface ViewMaterialModalProps {
  material: StudyMaterial | null;
  onClose: () => void;
}

export const ViewMaterialModal: React.FC<ViewMaterialModalProps> = ({ material, onClose }) => {
  const driveInfo = material ? parseGoogleDriveUrl(material.fileUrl) : null;
  const isPdf =
    material?.type === 'pdf' ||
    (material?.fileUrl &&
      (material.fileUrl.includes('.pdf') ||
        material.fileUrl.startsWith('data:application/pdf') ||
        material.fileUrl.startsWith('/uploads/')));

  const handleOpenUniversalViewer = () => {
    if (!material) return;
    triggerHaptic('light');
    openInAppFileViewer({
      url: material.fileUrl,
      title: material.title,
      subtitle: material.titleSinhala || undefined,
      fileType: isPdf ? 'pdf' : 'auto',
      downloadFileName: material.fileName || `${material.title}${isPdf ? '.pdf' : ''}`,
    });
    onClose();
  };

  const handleDownload = () => {
    if (!material) return;
    triggerHaptic('medium');
    downloadFileFromUrl(
      material.fileUrl,
      material.fileName || `${material.title}${isPdf ? '.pdf' : ''}`
    );
  };

  const handleOpenDeviceApp = () => {
    if (!material) return;
    triggerHaptic('medium');
    openInDevicePdfViewer(material.fileUrl, material.title);
  };

  const modalContent = (
    <AnimatePresence>
      {material && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-md p-3 sm:p-4 overflow-y-auto select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl p-5 sm:p-6 max-w-2xl w-full border border-amber-500/30 dark:border-stone-800 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto"
          >
        <div className="flex items-center justify-between border-b border-amber-200 dark:border-stone-800 pb-3">
          <div>
            <span className="px-2.5 py-0.5 bg-amber-200 dark:bg-amber-900 text-amber-950 dark:text-amber-100 font-bold text-[10px] rounded uppercase">
              {material.type} Resource Preview
            </span>
            <h3 className="font-serif font-bold text-lg text-amber-950 dark:text-amber-100 mt-1 leading-tight">
              {material.title}
            </h3>
            {material.titleSinhala && (
              <p className="text-xs text-stone-600 dark:text-stone-400">{material.titleSinhala}</p>
            )}
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-stone-100 dark:hover:bg-stone-800 rounded-xl text-stone-500 transition cursor-pointer"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="space-y-4">
          {driveInfo.isGoogleDrive && driveInfo.embedUrl ? (
            <div className="space-y-3">
              <div className="w-full h-[55vh] rounded-2xl overflow-hidden shadow-lg border-2 border-amber-300 dark:border-stone-700 bg-stone-900">
                <iframe
                  src={driveInfo.embedUrl}
                  title={material.title}
                  className="w-full h-full border-0"
                  allow="autoplay"
                />
              </div>
            </div>
          ) : material.fileUrl.startsWith('data:image/') ||
            material.fileUrl.match(/\.(jpeg|jpg|gif|png|webp)$/i) ? (
            <div className="rounded-2xl overflow-hidden border border-amber-200 dark:border-stone-800 bg-stone-950 flex items-center justify-center p-2">
              <img
                src={material.fileUrl}
                alt={material.title}
                className="max-h-[55vh] object-contain rounded-xl"
              />
            </div>
          ) : material.type === 'audio' ? (
            <div className="bg-stone-900 text-white p-6 rounded-2xl text-center space-y-3">
              <Music className="w-10 h-10 text-amber-400 mx-auto" />
              <p className="text-xs font-serif font-bold text-amber-200">Audio Recitation</p>
              <audio controls src={material.fileUrl} className="w-full max-w-md mx-auto" />
            </div>
          ) : material.fileUrl.startsWith('data:text/') ? (
            <div className="p-4 bg-stone-50 dark:bg-stone-800 border dark:border-stone-700 rounded-2xl font-serif text-xs text-stone-800 dark:text-stone-200 whitespace-pre-wrap max-h-60 overflow-y-auto">
              {decodeURIComponent(material.fileUrl.split(',')[1] || '')}
            </div>
          ) : isPdf ? (
            <div className="bg-stone-900/90 p-6 rounded-2xl border border-amber-500/30 text-center space-y-4 shadow-xl">
              <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
                <Smartphone className="w-8 h-8 animate-pulse text-amber-400" />
              </div>
              <div className="space-y-1">
                <h4 className="font-serif font-bold text-base text-amber-100">{material.title}</h4>
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
          ) : (
            <div className="p-6 bg-amber-50 dark:bg-stone-800 text-center rounded-2xl border border-amber-200 dark:border-stone-700 space-y-3">
              <FileText className="w-10 h-10 text-amber-800 dark:text-amber-400 mx-auto" />
              <p className="text-xs font-bold text-amber-950 dark:text-amber-100">
                Resource File Ready ({material.fileName || 'Document'})
              </p>
            </div>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-slate-200 dark:border-stone-800 pt-3">
          <div className="flex items-center gap-2">
            {material.fileUrl && (
              <>
                <button
                  type="button"
                  onClick={handleOpenUniversalViewer}
                  className="px-3.5 py-1.5 bg-amber-600 hover:bg-amber-700 text-stone-950 font-black text-xs rounded-xl flex items-center gap-1.5 cursor-pointer shadow-xs transition"
                >
                  <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
                  <span>Full Screen</span>
                </button>

                {isPdf && (
                  <button
                    type="button"
                    onClick={handleOpenDeviceApp}
                    className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-amber-600 dark:text-amber-300 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-amber-500/30"
                    title="Open in Device PDF App"
                  >
                    <Smartphone className="w-3.5 h-3.5" />
                    <span>PDF App</span>
                  </button>
                )}

                <button
                  type="button"
                  onClick={handleDownload}
                  className="px-3 py-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-slate-700 dark:text-slate-200 font-bold text-xs rounded-xl flex items-center gap-1.5 cursor-pointer transition border border-stone-300 dark:border-stone-700"
                >
                  <Download className="w-3.5 h-3.5" />
                  <span>Download</span>
                </button>
              </>
            )}
          </div>

          <button
            type="button"
            onClick={() => {
              triggerHaptic('light');
              onClose();
            }}
            className="px-5 py-2.5 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 dark:hover:bg-stone-700 text-slate-800 dark:text-stone-200 font-bold text-xs rounded-2xl cursor-pointer transition active:scale-95 min-h-[44px]"
          >
            වසන්න (Close)
          </button>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
