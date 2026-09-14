import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { X, ExternalLink, Download, Smartphone } from 'lucide-react';
import type { LibraryBook } from '../../../types';
import { downloadFileFromUrl, openInDevicePdfViewer, openInAppFileViewer } from '../../../utils/pdfHelper';
import { triggerHaptic } from '../../../utils/haptics';

interface BookReaderModalProps {
  viewingLibraryBook: LibraryBook | null;
  onClose: () => void;
  getPdfObjectUrl: (url: string) => string;
  openPdfInBlobTab: (url: string) => void;
  isSi: boolean;
}

export const BookReaderModal: React.FC<BookReaderModalProps> = ({
  viewingLibraryBook,
  onClose,
  getPdfObjectUrl,
  openPdfInBlobTab,
  isSi,
}) => {
  const bookUrl =
    viewingLibraryBook?.pdfUrl ||
    (viewingLibraryBook as any)?.fileUrl ||
    (viewingLibraryBook as any)?.downloadUrl ||
    '';

  const bookTitle = viewingLibraryBook?.titleSinhala || viewingLibraryBook?.title || '';

  const handleOpenUniversalViewer = () => {
    triggerHaptic('light');
    if (bookUrl) {
      openInAppFileViewer({
        url: bookUrl,
        title: bookTitle,
        subtitle: `${viewingLibraryBook.author || 'කර්තෘ'} • ${viewingLibraryBook.category || 'පුස්තකාලය'}`,
        fileType: 'pdf',
        downloadFileName: `${bookTitle}.pdf`,
      });
      onClose();
    }
  };

  const handleDownload = () => {
    triggerHaptic('medium');
    if (bookUrl) {
      downloadFileFromUrl(bookUrl, `${bookTitle}.pdf`);
    }
  };

  const handleOpenDeviceApp = () => {
    triggerHaptic('medium');
    if (bookUrl) {
      openInDevicePdfViewer(bookUrl, bookTitle);
    }
  };

  const modalContent = (
    <AnimatePresence>
      {viewingLibraryBook && (
        <div
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-black/85 backdrop-blur-sm p-2 sm:p-4 select-none overflow-y-auto"
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-stone-800 my-auto"
          >
        <div className="p-3 border-b border-slate-100 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0">
          <div className="min-w-0 flex-1 truncate">
            <h3 className="font-bold text-sm text-slate-900 dark:text-white truncate">
              {bookTitle}
            </h3>
            <p className="text-[11px] text-slate-400 truncate">
              {viewingLibraryBook.author} • {viewingLibraryBook.category}
            </p>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Device PDF App */}
            {bookUrl && (
              <button
                type="button"
                onClick={handleOpenDeviceApp}
                className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-amber-600 dark:text-amber-300 rounded-xl cursor-pointer transition border border-amber-500/30"
                title="බාහිර PDF App එකෙන් විවෘත කරන්න"
              >
                <Smartphone className="w-4 h-4" />
              </button>
            )}

            {/* Download */}
            {bookUrl && (
              <button
                type="button"
                onClick={handleDownload}
                className="p-1.5 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-slate-700 dark:text-slate-200 rounded-xl cursor-pointer transition border border-stone-300 dark:border-stone-700"
                title="බාගත කරන්න (Download)"
              >
                <Download className="w-4 h-4" />
              </button>
            )}

            {/* Fullscreen / Universal Reader */}
            <button
              type="button"
              onClick={handleOpenUniversalViewer}
              className="px-2.5 sm:px-3 py-1.5 bg-amber-600 hover:bg-amber-700 text-stone-950 text-xs font-black rounded-xl flex items-center gap-1 cursor-pointer shadow-xs transition"
              title={isSi ? 'සම්පූර්ණ තිරයෙන්' : 'Full Screen'}
            >
              <ExternalLink className="w-3.5 h-3.5 stroke-[2.5]" />
              <span className="hidden xs:inline">{isSi ? 'සම්පූර්ණ තිරයෙන්' : 'Full Screen'}</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="p-1.5 hover:bg-slate-100 dark:hover:bg-stone-800 rounded-xl cursor-pointer text-slate-500 hover:text-slate-900 dark:hover:text-white transition"
              aria-label="Close"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="flex-1 bg-stone-950 overflow-y-auto p-4 sm:p-6 flex items-center justify-center">
          <div className="w-full max-w-md bg-stone-900/90 border border-amber-500/30 rounded-3xl p-6 text-center space-y-4 shadow-2xl">
            <div className="w-16 h-16 mx-auto rounded-2xl bg-amber-500/20 border border-amber-400/50 flex items-center justify-center text-amber-400">
              <Smartphone className="w-8 h-8 animate-pulse" />
            </div>
            <div className="space-y-1">
              <h4 className="font-serif font-bold text-base text-amber-100">
                {bookTitle}
              </h4>
              <p className="text-xs text-stone-300">
                {isSi
                  ? 'මෙම ග්‍රන්ථය / ලේඛනය ඔබගේ දුරකථනයේ ඇති PDF Reader App එකෙන් විවෘත කරන්නද?'
                  : 'Open this book/document with your mobile PDF reader app?'}
              </p>
            </div>
            <div className="space-y-2.5 pt-2">
              <button
                type="button"
                onClick={handleOpenDeviceApp}
                className="w-full py-3 px-4 bg-gradient-to-r from-amber-600 via-amber-500 to-amber-600 text-stone-950 font-black text-xs sm:text-sm rounded-xl flex items-center justify-center gap-2 shadow-lg transition cursor-pointer active:scale-95"
              >
                <Smartphone className="w-4 h-4 stroke-[2.5]" />
                <span>{isSi ? 'Mobile එකේ PDF App එකෙන් කියවන්න' : 'Open in Mobile PDF App'}</span>
              </button>

              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={handleDownload}
                  className="py-2.5 px-3 bg-stone-800 hover:bg-stone-750 text-stone-200 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-stone-700 active:scale-95"
                >
                  <Download className="w-3.5 h-3.5 text-amber-400" />
                  <span>{isSi ? 'බාගත කරන්න' : 'Download'}</span>
                </button>
                <button
                  type="button"
                  onClick={handleOpenUniversalViewer}
                  className="py-2.5 px-3 bg-stone-800 hover:bg-stone-750 text-amber-300 font-bold text-xs rounded-xl flex items-center justify-center gap-1.5 transition cursor-pointer border border-amber-500/30 active:scale-95"
                >
                  <ExternalLink className="w-3.5 h-3.5" />
                  <span>{isSi ? 'සම්පූර්ණ තිරය' : 'Full Screen'}</span>
                </button>
              </div>
            </div>
          </div>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};
