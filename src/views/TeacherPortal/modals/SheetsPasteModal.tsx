import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileSpreadsheet, Sparkles } from 'lucide-react';

interface SheetsPasteModalProps {
  isOpen: boolean;
  onClose: () => void;
  sheetsPastedData: string;
  setSheetsPastedData: (val: string) => void;
  handleImportFromPastedGoogleSheets: (data: string) => void;
}

export const SheetsPasteModal: React.FC<SheetsPasteModalProps> = ({
  isOpen,
  onClose,
  sheetsPastedData,
  setSheetsPastedData,
  handleImportFromPastedGoogleSheets,
}) => {
  const modalContent = (
    <AnimatePresence>
      {isOpen && (
        <div
          onClick={(e) => {
            if (e.target === e.currentTarget) onClose();
          }}
          className="fixed inset-0 z-[99999] flex items-center justify-center bg-stone-950/80 backdrop-blur-md p-3 sm:p-4 overflow-y-auto select-none"
        >
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 14 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 14 }}
            transition={{ type: 'spring', damping: 26, stiffness: 360 }}
            className="bg-white dark:bg-stone-900 rounded-3xl shadow-2xl w-full max-w-2xl overflow-hidden border-2 border-emerald-600 text-stone-900 dark:text-stone-100 my-auto max-h-[92vh] overflow-y-auto"
          >
        <div className="bg-emerald-950 text-white p-5 flex items-center justify-between border-b border-emerald-700">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-emerald-500/20 border border-emerald-400/40 flex items-center justify-center text-emerald-300">
              <FileSpreadsheet className="w-6 h-6" />
            </div>
            <div>
              <h3 className="font-serif font-black text-lg text-emerald-100">
                Import Questions from Google Sheets (9 Columns)
              </h3>
              <p className="text-xs text-emerald-200/90 font-medium">
                Google Sheets හි ඇති 9-Column පේළි මෙතැනට Paste කර පද්ධතියට එක් කරන්න.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-emerald-800 text-emerald-200 rounded-xl transition cursor-pointer"
          >
            ✕
          </button>
        </div>

        <div className="p-6 space-y-4 bg-stone-50/80 dark:bg-stone-900/90">
          <div className="bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-300 dark:border-emerald-800 p-3 rounded-2xl text-xs text-emerald-950 dark:text-emerald-200 space-y-1">
            <span className="font-bold block">📋 බලාපොරොත්තු වන Column සැකස්ම (Google Sheets Header):</span>
            <p className="font-mono text-[11px] text-emerald-900 dark:text-emerald-300 bg-white dark:bg-stone-800 p-2 rounded-lg border border-emerald-200 dark:border-emerald-700">
              Question | Option A | Option B | Option C | Option D | Correct Answer (1-4/Text) | Marks | Type (mcq/true_false/essay/structured) | Explanation
            </p>
            <p className="text-[10px] text-emerald-800 dark:text-emerald-400">
              * Google Sheets හි අදාළ සෛල (Cells) තෝරා Ctrl+C මගින් Copy කර පහත කොටුවෙහි Ctrl+V මගින් Paste කරන්න.
            </p>
          </div>

          <div>
            <label htmlFor="sheetspastemodal-sheetsPastedData" className="block text-xs font-bold text-stone-700 dark:text-stone-300 mb-1">
              Google Sheets හි පිටපත් කරගත් දත්ත (Paste Google Sheets Raw TSV Data):
            </label>
            <textarea autoComplete="name" id="sheetspastemodal-sheetsPastedData" name="sheetsPastedData"
              rows={8}
              value={sheetsPastedData}
              onChange={(e) => setSheetsPastedData(e.target.value)}
              placeholder="මෙහි Google Sheets වෙතින් පිටපත් කරගත් 9-Column දත්ත පේළි Paste කරන්න..."
              className="w-full p-3 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs font-mono focus:ring-2 focus:ring-emerald-500 focus:outline-none"
            />
          </div>

          <div className="flex items-center justify-end gap-3 pt-2 border-t border-stone-200 dark:border-stone-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold text-xs rounded-xl transition cursor-pointer"
            >
              අවලංගු කරන්න (Cancel)
            </button>
            <button
              type="button"
              onClick={() => {
                handleImportFromPastedGoogleSheets(sheetsPastedData);
                onClose();
              }}
              className="px-5 py-2 bg-emerald-700 hover:bg-emerald-800 text-white font-bold text-xs rounded-xl shadow-md transition flex items-center gap-2 cursor-pointer"
            >
              <Sparkles className="w-4 h-4 text-emerald-300" />
              <span>ප්‍රශ්න පද්ධතියට එක් කරන්න (Import Questions)</span>
            </button>
          </div>
        </div>
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

