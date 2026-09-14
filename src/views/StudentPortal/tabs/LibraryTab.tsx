import React from 'react';
import { School, Search, Eye, BookMarked, Download, Sparkles } from 'lucide-react';
import type { LibraryBook } from '../../../types';
import { triggerHaptic } from '../../../utils/haptics';

interface LibraryTabProps {
  libraryBooks: LibraryBook[];
  filteredLibraryBooks: LibraryBook[];
  librarySearch: string;
  setLibrarySearch: (v: string) => void;
  selectedLibraryCategory: string;
  setSelectedLibraryCategory: (v: string) => void;
  libraryCategories: string[];
  setViewingLibraryBook: (book: LibraryBook | null) => void;
  isSi: boolean;
}

export const LibraryTab: React.FC<LibraryTabProps> = ({
  libraryBooks,
  filteredLibraryBooks,
  librarySearch,
  setLibrarySearch,
  selectedLibraryCategory,
  setSelectedLibraryCategory,
  libraryCategories,
  setViewingLibraryBook,
  isSi,
}) => {
  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4 animate-fade-in select-none">
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl bg-indigo-500/15 text-indigo-600 dark:bg-indigo-500/20 dark:text-indigo-400 border border-indigo-500/30 flex items-center justify-center shrink-0 shadow-2xs font-bold">
            <School className="w-5 h-5 animate-icon-float" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-base sm:text-lg font-serif font-black text-slate-900 dark:text-white">
                {isSi ? 'ඩිජිටල් පුස්තකාලය & ධර්ම ග්‍රන්ථ' : 'Digital Monastic Library'}
              </h2>
              <span className="px-2.5 py-0.5 bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 font-mono font-bold text-xs rounded-full border border-indigo-500/30">
                {libraryBooks.length}
              </span>
            </div>
            <p className="text-xs text-slate-500 dark:text-slate-400 font-medium">
              {isSi ? 'ත්‍රිපිටක පොත්, ප්‍රාචීන පෙළපොත් සහ පසුගිය විභාග ප්‍රශ්න පත්‍ර' : 'Tipitaka, Pracheena texts & past papers'}
            </p>
          </div>
        </div>

        {/* Search and Category Filter */}
        <div className="w-full sm:w-auto flex flex-col sm:flex-row sm:items-center gap-2">
          <div className="relative w-full sm:min-w-[180px]">
            <Search className="w-3.5 h-3.5 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
            <input id="librarytab-input-1" name="librarytab-input-1"
              type="text"
              value={librarySearch}
              onChange={(e) => setLibrarySearch(e.target.value)}
              placeholder={isSi ? 'පොත් සොයන්න...' : 'Search books...'}
              className="w-full pl-8 pr-3 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 text-xs text-slate-900 dark:text-white bg-slate-50 dark:bg-stone-800 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <select id="librarytab-select-2" name="librarytab-select-2"
            value={selectedLibraryCategory}
            onChange={(e) => {
              triggerHaptic('light');
              setSelectedLibraryCategory(e.target.value);
            }}
            className="w-full sm:w-auto px-3.5 py-2.5 rounded-xl border border-slate-200 dark:border-stone-700 text-xs font-bold bg-white dark:bg-stone-800 text-slate-900 dark:text-white cursor-pointer shadow-2xs"
          >
            <option value="all">{isSi ? 'සියලුම කාණ්ඩ' : 'All Categories'}</option>
            {libraryCategories.map((cat) => (
              <option key={cat} value={cat}>
                {cat}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Library Books Grid */}
      {filteredLibraryBooks.length === 0 ? (
        <div className="text-center py-12 bg-slate-50 dark:bg-stone-800/40 rounded-3xl border border-dashed border-slate-200 dark:border-stone-700 space-y-2">
          <School className="w-10 h-10 text-slate-400 mx-auto animate-icon-float" />
          <h3 className="font-serif font-bold text-slate-900 dark:text-white text-sm">
            {isSi ? 'පොත් කිසිවක් හමු නොවුණි' : 'No E-Books Found'}
          </h3>
          <p className="text-xs text-slate-400">
            {isSi ? 'වෙනත් සෙවුම් වචනයක් හෝ කාණ්ඩයක් තෝරා බලන්න' : 'Try searching with another category'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3.5">
          {filteredLibraryBooks.map((book) => {
            const bookPdf = book.pdfUrl || (book as any).fileUrl || (book as any).downloadUrl;

            return (
              <div
                key={book.id}
                className="bg-white dark:bg-stone-850 border border-slate-200/90 dark:border-stone-700/80 hover:border-indigo-500 dark:hover:border-indigo-500 rounded-2xl p-4 flex flex-col justify-between space-y-3 shadow-2xs hover:shadow-md hover:-translate-y-0.5 transition-all duration-200 group"
              >
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <span className="px-2.5 py-0.5 bg-indigo-500/15 text-indigo-800 dark:text-indigo-300 font-bold text-[10px] rounded-md border border-indigo-500/30">
                      {book.category}
                    </span>
                    {book.paperYear && (
                      <span className="text-[10px] font-mono font-bold text-slate-400">
                        {book.paperYear}
                      </span>
                    )}
                  </div>

                  <h3 className="font-serif font-bold text-sm text-slate-900 dark:text-white leading-snug group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">
                    {book.titleSinhala || book.title}
                  </h3>

                  {book.author && (
                    <p className="text-[11px] text-slate-500 dark:text-slate-400 truncate">
                      ✍️ {book.author}
                    </p>
                  )}
                </div>

                <button
                  type="button"
                  onClick={() => {
                    triggerHaptic('light');
                    setViewingLibraryBook(book);
                  }}
                  className="w-full py-2 bg-gradient-to-r from-indigo-600 to-purple-700 hover:from-indigo-700 hover:to-purple-800 text-white font-bold text-xs rounded-xl transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-indigo-600/20 active:scale-95 group"
                >
                  <Eye className="w-4 h-4 text-indigo-200 group-hover:scale-110 transition-transform" />
                  <span>{isSi ? 'පොත කියවන්න (Read Book)' : 'Read E-Book'}</span>
                </button>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};
