import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileCode, Check, Copy, Download } from 'lucide-react';
import type { Question } from '../../../types';
import { formatQuestionsTo9ColumnJson } from '../../../services/ai/validator';

interface RawAiJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  rawAiJsonContent: string;
  questionsList: Question[];
  handleCopyRawJsonToClipboard: () => void;
  copiedRawJsonSuccess: boolean;
  handleDownloadRawJsonFile: () => void;
}

export const RawAiJsonModal: React.FC<RawAiJsonModalProps> = ({
  isOpen,
  onClose,
  rawAiJsonContent,
  questionsList,
  handleCopyRawJsonToClipboard,
  copiedRawJsonSuccess,
  handleDownloadRawJsonFile,
}) => {
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 bg-stone-900/80 backdrop-blur-xs z-[99999] flex items-center justify-center p-3 sm:p-4 overflow-y-auto select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-700 rounded-2xl max-w-3xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto"
          >
        <div className="flex items-center justify-between border-b border-amber-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-amber-950 dark:text-amber-100 text-base">
              🔍 AI Vision නිර්මාණය කළ Raw JSON දත්ත (JSON Viewer)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        <p className="text-xs text-stone-600 dark:text-stone-300">
          AI Vision මගින් ප්‍රශ්න පත්‍රය ස්කෑන් කර නිර්මාණය කළ 9-Column JSON ආකෘතිය පහත දැක්වේ. ඔබට මෙය Copy කරගැනීමට හෝ බාගත (Download) කර ගැනීමට හැක.
        </p>

        <div className="relative">
          <pre className="p-4 bg-stone-950 text-emerald-400 rounded-xl text-xs font-mono max-h-96 overflow-y-auto leading-relaxed border border-stone-800 selection:bg-emerald-900 selection:text-white">
            {rawAiJsonContent || formatQuestionsTo9ColumnJson(questionsList)}
          </pre>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 border-t border-stone-200 dark:border-stone-800 pt-3">
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={handleCopyRawJsonToClipboard}
              className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold text-xs rounded-xl shadow transition flex items-center gap-1.5 cursor-pointer"
            >
              {copiedRawJsonSuccess ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>✓ JSON Copy විය!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4 text-amber-300" />
                  <span>📋 Copy JSON</span>
                </>
              )}
            </button>

            <button
              type="button"
              onClick={handleDownloadRawJsonFile}
              className="px-4 py-2 bg-stone-100 dark:bg-stone-800 hover:bg-stone-200 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl border border-stone-300 dark:border-stone-700 transition flex items-center gap-1.5 cursor-pointer"
            >
              <Download className="w-4 h-4 text-amber-600" />
              <span>📥 Download .json File</span>
            </button>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-stone-200 hover:bg-stone-300 dark:bg-stone-800 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
          >
            වසා දමන්න (Close)
          </button>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

