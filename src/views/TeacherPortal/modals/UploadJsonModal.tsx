import React from 'react';
import { createPortal } from 'react-dom';
import { motion, AnimatePresence } from 'motion/react';
import { FileCode, Upload, Clipboard, CheckCircle2, AlertCircle, Sparkles } from 'lucide-react';

interface UploadJsonModalProps {
  isOpen: boolean;
  onClose: () => void;
  jsonInputTab: 'file' | 'text';
  setJsonInputTab: (tab: 'file' | 'text') => void;
  pastedJsonText: string;
  setPastedJsonText: (val: string) => void;
  jsonImportSuccessMsg: string | null;
  jsonImportErrorMsg: string | null;
  handleFileUploadJson: (file: File) => void;
  handleLoadJsonPreview: (raw: string) => void;
}

export const UploadJsonModal: React.FC<UploadJsonModalProps> = ({
  isOpen,
  onClose,
  jsonInputTab,
  setJsonInputTab,
  pastedJsonText,
  setPastedJsonText,
  jsonImportSuccessMsg,
  jsonImportErrorMsg,
  handleFileUploadJson,
  handleLoadJsonPreview,
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
            className="bg-white dark:bg-stone-900 border border-amber-300 dark:border-stone-700 rounded-2xl max-w-2xl w-full p-5 sm:p-6 shadow-2xl space-y-4 my-auto max-h-[92vh] overflow-y-auto"
          >
        <div className="flex items-center justify-between border-b border-amber-100 dark:border-stone-800 pb-3">
          <div className="flex items-center gap-2">
            <FileCode className="w-5 h-5 text-amber-600" />
            <h3 className="font-serif font-bold text-amber-950 dark:text-amber-100 text-base">
              📥 JSON මගින් ප්‍රශ්න එකතු කරන්න (Upload / Paste JSON Questions)
            </h3>
          </div>
          <button
            onClick={onClose}
            className="text-stone-400 hover:text-stone-600 dark:hover:text-stone-200 text-lg font-bold cursor-pointer"
          >
            ✕
          </button>
        </div>

        {/* Modal Tabs */}
        <div className="flex items-center gap-2 border-b border-stone-200 dark:border-stone-800 pb-2">
          <button
            type="button"
            onClick={() => setJsonInputTab('file')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              jsonInputTab === 'file'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Upload className="w-3.5 h-3.5" />
            <span>📁 Upload .json File</span>
          </button>
          <button
            type="button"
            onClick={() => setJsonInputTab('text')}
            className={`px-3 py-1.5 rounded-xl font-bold text-xs transition flex items-center gap-1.5 cursor-pointer ${
              jsonInputTab === 'text'
                ? 'bg-amber-800 text-white shadow-2xs'
                : 'bg-stone-100 dark:bg-stone-800 text-stone-700 dark:text-stone-300 hover:bg-stone-200'
            }`}
          >
            <Clipboard className="w-3.5 h-3.5" />
            <span>📋 Paste JSON Raw Text</span>
          </button>
        </div>

        {jsonImportSuccessMsg && (
          <div className="p-3 bg-emerald-100 dark:bg-emerald-950 text-emerald-900 dark:text-emerald-200 rounded-xl text-xs font-bold border border-emerald-300 flex items-center gap-2">
            <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />
            <span>{jsonImportSuccessMsg}</span>
          </div>
        )}

        {jsonImportErrorMsg && (
          <div className="p-3 bg-rose-100 dark:bg-rose-950 text-rose-900 dark:text-rose-200 rounded-xl text-xs font-bold border border-rose-300 flex items-center gap-2">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
            <span>{jsonImportErrorMsg}</span>
          </div>
        )}

        {jsonInputTab === 'file' ? (
          <div className="p-6 bg-amber-50/60 dark:bg-stone-800/60 border-2 border-dashed border-amber-300 dark:border-stone-700 rounded-2xl text-center space-y-3">
            <FileCode className="w-10 h-10 text-amber-600 mx-auto" />
            <div>
              <h4 className="font-bold text-amber-950 dark:text-amber-100 text-sm">
                ඔබගේ .json ගොනුව තෝරන්න (Select .json File)
              </h4>
              <p className="text-xs text-stone-500 dark:text-stone-400 mt-0.5">
                පූර්ව-නිර්මාණය කළ ප්‍රශ්න අඩංගු .json ගොනුවක් ඔබේ පරිගණකයෙන් තෝරා Upload කරන්න.
              </p>
            </div>
            <label htmlFor="uploadjsonmodal-pastedJsonText" className="inline-flex items-center gap-2 px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-extrabold text-xs rounded-xl shadow cursor-pointer transition">
              <Upload className="w-4 h-4 text-amber-300" />
              <span>.json File එක තෝරන්න (Browse)</span>
              <input autoComplete="off" id="uploadjsonmodal-file-1" name="file-1"
                type="file"
                accept=".json,application/json"
                className="hidden"
                onChange={(e) => {
                  if (e.target.files && e.target.files[0]) {
                    handleFileUploadJson(e.target.files[0]);
                  }
                }}
              />
            </label>
          </div>
        ) : (
          <div className="space-y-3">
            <label htmlFor="uploadjsonmodal-pastedJsonText" className="block text-xs font-bold text-stone-700 dark:text-stone-300">
              JSON Raw Text ඇතුළත් කරන්න (Paste JSON Code Here):
            </label>
            <textarea autoComplete="name" id="uploadjsonmodal-pastedJsonText" name="pastedJsonText"
              rows={9}
              value={pastedJsonText}
              onChange={(e) => setPastedJsonText(e.target.value)}
              placeholder={`[\n  {\n    "question": "සංස්කෘත භාෂාවේ ස්වර අක්ෂර ගණන කීයද?",\n    "option_a": "10",\n    "option_b": "13",\n    "option_c": "14",\n    "option_d": "16",\n    "correct_answer": "2",\n    "marks": 2,\n    "type": "mcq",\n    "explanation": "සංස්කෘත භාෂාවේ ප්‍රධාන ස්වර අක්ෂර 13කි."\n  }\n]`}
              className="w-full p-3 rounded-xl border border-amber-300 dark:border-stone-700 bg-stone-950 text-emerald-400 font-mono text-xs focus:ring-2 focus:ring-amber-500 focus:outline-none leading-relaxed"
            />
            <div className="flex justify-end">
              <button
                type="button"
                onClick={() => handleLoadJsonPreview(pastedJsonText)}
                className="px-5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white font-extrabold text-xs rounded-xl shadow transition flex items-center gap-2 cursor-pointer"
              >
                <Sparkles className="w-4 h-4 text-amber-300" />
                <span>🔍 JSON ලෝඩ් කර බලන්න (Load & Preview JSON)</span>
              </button>
            </div>
          </div>
        )}
      </motion.div>
      </div>
    )}
  </AnimatePresence>
  );

  return typeof document !== 'undefined' ? createPortal(modalContent, document.body) : modalContent;
};

