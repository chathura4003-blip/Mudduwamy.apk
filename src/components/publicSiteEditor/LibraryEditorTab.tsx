import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  BookOpen,
  Plus,
  Trash2,
  X,
  Upload,
  UploadCloud,
  Eye,
  FileText,
  Download,
  Filter,
  Files,
  Loader2,
  CheckCircle2,
  Search,
  Edit3,
  Sparkles,
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { openPdfInBlobTab, downloadFileFromUrl, getEmbeddableUrl } from '../../utils/pdfHelper';
import { uploadFileWithProgress, formatBytes, type UploadProgressInfo } from '../../utils/fileUpload';
import type { LibraryBook } from '../../types';

interface LibraryEditorTabProps {
  libraryBooks: LibraryBook[];
  addLibraryBook: (book: any) => void;
  updateLibraryBook?: (id: string, book: any) => void;
  deleteLibraryBook: (id: string) => void;
  handleFileUploadHelper?: (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string, sizeStr?: string) => void
  ) => void;
  showNotification: (msg: string) => void;
}

interface BulkPdfItem {
  file: File;
  id: string;
}

const CATEGORY_TABS = [
  { id: 'all', label: 'සියල්ල' },
  { id: 'books', label: '📖 ධර්ම ග්‍රන්ථ' },
  { id: 'past_papers', label: '📜 පසුගිය ප්‍රශ්න පත්‍ර' },
  { id: 'model_papers', label: '🪷 ආදර්ශ ප්‍රශ්න පත්‍ර' },
  { id: 'term_tests', label: '📝 වාර පරීක්ෂණ' },
  { id: 'syllabus', label: '📘 විෂය නිර්දේශ' },
];

export const LibraryEditorTab: React.FC<LibraryEditorTabProps> = ({
  libraryBooks = [],
  addLibraryBook,
  updateLibraryBook,
  deleteLibraryBook,
  showNotification,
}) => {
  const [searchTerm, setSearchTerm] = useState<string>('');
  const [selectedCategoryTab, setSelectedCategoryTab] = useState<string>('all');
  const [isLibraryModalOpen, setIsLibraryModalOpen] = useState<boolean>(false);
  const [editingBookId, setEditingBookId] = useState<string | null>(null);
  const [modalMode, setModalMode] = useState<'single' | 'bulk'>('single');
  const [deleteTargetBookId, setDeleteTargetBookId] = useState<string | null>(null);
  const [adminPreviewBook, setAdminPreviewBook] = useState<LibraryBook | null>(null);

  // Single Book / Paper Form State
  const [libraryForm, setLibraryForm] = useState<{
    title: string;
    titleSinhala: string;
    author: string;
    category: string;
    educationCategory: string;
    paperType: string;
    paperYear: string;
    pdfUrl: string;
    fileUrl: string;
  }>({
    title: '',
    titleSinhala: '',
    author: 'පිරිවෙන් විද්‍යාපීඨය',
    category: 'Tripitaka',
    educationCategory: 'Pracheena',
    paperType: 'general',
    paperYear: '2025',
    pdfUrl: '',
    fileUrl: '',
  });

  // Single PDF Upload Progress State
  const [singlePdfProgress, setSinglePdfProgress] = useState<UploadProgressInfo | null>(null);
  const [isSingleUploading, setIsSingleUploading] = useState<boolean>(false);

  // Bulk Upload State
  const [bulkPdfFiles, setBulkPdfFiles] = useState<BulkPdfItem[]>([]);
  const [bulkDocNature, setBulkDocNature] = useState<'book' | 'paper'>('book');
  const [bulkCategory, setBulkCategory] = useState<string>('Tripitaka');
  const [bulkPaperType, setBulkPaperType] = useState<string>('past_paper');
  const [bulkPaperYear, setBulkPaperYear] = useState<string>('2025');
  const [isBulkUploading, setIsBulkUploading] = useState<boolean>(false);
  const [bulkUploadProgress, setBulkUploadProgress] = useState<{
    current: number;
    total: number;
    percent: number;
    currentFileName: string;
    loadedFormatted?: string;
    totalFormatted?: string;
    loadedBytes?: number;
    totalBytes?: number;
  } | null>(null);

  const bulkFileInputRef = useRef<HTMLInputElement>(null);

  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);

  // Dynamic Authors from existing library
  const existingAuthors = useMemo(() => {
    const authors = libraryBooks
      .map((b) => b.author?.trim())
      .filter((a): a is string => Boolean(a && a.length > 0));
    return Array.from(new Set(authors));
  }, [libraryBooks]);

  // Dynamic Categories from existing library
  const dynamicCategories = useMemo(() => {
    const defaults = [
      'Tripitaka',
      'Pali Literature',
      'Sanskrit',
      'Sinhala Literature',
      'Buddhism & History',
      'Abhidhamma',
      'Sutta Pitaka',
      'Vinaya Pitaka',
      'Past Papers',
      'General',
    ];
    const set = new Set(defaults);
    libraryBooks.forEach((b) => {
      if (b.category?.trim()) set.add(b.category.trim());
    });
    return Array.from(set);
  }, [libraryBooks]);

  // Smart Author Change with Auto-Category Linking
  const handleAuthorChange = (newAuthor: string) => {
    const prevBook = libraryBooks.find(
      (b) => b.author && b.author.trim().toLowerCase() === newAuthor.trim().toLowerCase()
    );
    setLibraryForm((prev) => ({
      ...prev,
      author: newAuthor,
      category: prevBook?.category || prev.category,
    }));
  };

  // Dynamic Category Filter Tabs (Includes auto-discovered custom categories)
  const dynamicFilterTabs = useMemo(() => {
    const defaultTabs = [
      { id: 'all', label: `සියල්ල (${libraryBooks.length})` },
      { id: 'books', label: '📖 ධර්ම ග්‍රන්ථ' },
      { id: 'past_papers', label: '📜 පසුගිය ප්‍රශ්න පත්‍ර' },
      { id: 'model_papers', label: '🪷 ආදර්ශ ප්‍රශ්න පත්‍ර' },
      { id: 'term_tests', label: '📝 වාර පරීක්ෂණ' },
      { id: 'syllabus', label: '📘 විෂය නිර්දේශ' },
    ];

    const standardCategories = [
      'Tripitaka',
      'Pali Literature',
      'Sanskrit',
      'Sinhala Literature',
      'Past Papers',
      'Marking Scheme',
      'General',
    ];

    const customUsed = new Set<string>();
    libraryBooks.forEach((b) => {
      if (b.category && !standardCategories.includes(b.category)) {
        customUsed.add(b.category.trim());
      }
    });

    const customTabs = Array.from(customUsed).map((cat) => ({
      id: `cat_${cat}`,
      label: `✨ ${cat}`,
    }));

    return [...defaultTabs, ...customTabs];
  }, [libraryBooks]);

  // Filter books with search & category
  const filteredBooks = useMemo(() => {
    return libraryBooks.filter((book) => {
      const q = searchTerm.toLowerCase().trim();
      const matchesSearch =
        !q ||
        (book.titleSinhala && book.titleSinhala.toLowerCase().includes(q)) ||
        (book.title && book.title.toLowerCase().includes(q)) ||
        (book.author && book.author.toLowerCase().includes(q)) ||
        (book.category && book.category.toLowerCase().includes(q)) ||
        (book.paperYear && book.paperYear.toString().includes(q));

      if (!matchesSearch) return false;

      if (selectedCategoryTab === 'all') return true;
      if (selectedCategoryTab === 'books') {
        return (
          !book.paperType ||
          book.paperType === 'general' ||
          book.category === 'Tripitaka' ||
          book.category === 'Pali Literature' ||
          book.category === 'Sanskrit' ||
          book.category === 'Sinhala Literature'
        );
      }
      if (selectedCategoryTab === 'past_papers') return book.paperType === 'past_paper';
      if (selectedCategoryTab === 'model_papers') return book.paperType === 'model_paper';
      if (selectedCategoryTab === 'term_tests') return book.paperType === 'term_test';
      if (selectedCategoryTab === 'syllabus') return book.paperType === 'syllabus';

      if (selectedCategoryTab.startsWith('cat_')) {
        const targetCategory = selectedCategoryTab.replace('cat_', '');
        return (
          Boolean(book.category) &&
          book.category!.trim().toLowerCase() === targetCategory.toLowerCase()
        );
      }

      return true;
    });
  }, [libraryBooks, searchTerm, selectedCategoryTab]);

  // Open Edit Modal
  const handleOpenEdit = (book: LibraryBook) => {
    setEditingBookId(book.id);
    setLibraryForm({
      title: book.title || '',
      titleSinhala: book.titleSinhala || book.title || '',
      author: book.author || 'පිරිවෙන් විද්‍යාපීඨය',
      category: book.category || 'Tripitaka',
      educationCategory: book.educationCategory || 'Pracheena',
      paperType: book.paperType || 'general',
      paperYear: book.paperYear || '2025',
      pdfUrl: book.pdfUrl || (book as any).fileUrl || '',
      fileUrl: (book as any).fileUrl || book.pdfUrl || '',
    });
    setModalMode('single');
    setIsLibraryModalOpen(true);
  };

  // Save Single Item
  const handleSaveSingle = (e: React.FormEvent) => {
    e.preventDefault();
    const finalBook = {
      ...libraryForm,
      pdfUrl: libraryForm.pdfUrl || libraryForm.fileUrl || '',
      fileUrl: libraryForm.fileUrl || libraryForm.pdfUrl || '',
      title: libraryForm.title || libraryForm.titleSinhala,
    };

    if (editingBookId && updateLibraryBook) {
      updateLibraryBook(editingBookId, finalBook);
      showNotification('ග්‍රන්ථය / ප්‍රශ්න පත්‍රය සාර්ථකව යාවත්කාලීන කරන ලදී');
    } else {
      addLibraryBook(finalBook);
      showNotification('නව ග්‍රන්ථය / ප්‍රශ්න පත්‍රය සාර්ථකව පුස්තකාලයට එක් කරන ලදී');
    }

    setIsLibraryModalOpen(false);
    setEditingBookId(null);
  };

  // Bulk File Selection
  const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newItems: BulkPdfItem[] = Array.from(files)
      .filter((file) => file.name.toLowerCase().endsWith('.pdf') || file.type.includes('pdf'))
      .map((file, idx) => ({
        file,
        id: `${Date.now()}-${idx}-${file.name}`,
      }));

    if (newItems.length === 0) {
      showNotification('❌ කරුණාකර PDF ගොනු පමණක් තෝරන්න (.pdf files only)');
      return;
    }

    setBulkPdfFiles((prev) => [...prev, ...newItems]);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
  };

  // Save Bulk PDFs
  const handleSaveBulkPdfs = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkPdfFiles.length === 0) {
      showNotification('කරුණාකර අවම වශයෙන් එක් PDF ගොනුවක් තෝරන්න');
      return;
    }

    setIsBulkUploading(true);
    let successCount = 0;

    for (let i = 0; i < bulkPdfFiles.length; i++) {
      const item = bulkPdfFiles[i];
      setBulkUploadProgress({
        current: i + 1,
        total: bulkPdfFiles.length,
        percent: Math.round((i / bulkPdfFiles.length) * 100),
        currentFileName: item.file.name,
        loadedFormatted: '0 B',
        totalFormatted: formatBytes(item.file.size),
        loadedBytes: 0,
        totalBytes: item.file.size,
      });

      try {
        const url = await uploadFileWithProgress(item.file, (prog) => {
          setBulkUploadProgress({
            current: i + 1,
            total: bulkPdfFiles.length,
            percent: prog.percentage,
            currentFileName: item.file.name,
            loadedFormatted: prog.loadedFormatted,
            totalFormatted: prog.totalFormatted,
            loadedBytes: prog.loaded,
            totalBytes: prog.total,
          });
        });
        if (url) {
          const autoTitle = item.file.name.replace(/\.[^/.]+$/, '').replace(/[_-]/g, ' ');
          const isPaper = bulkDocNature === 'paper';

          const newDoc = {
            title: autoTitle,
            titleSinhala: autoTitle,
            category: isPaper ? 'Past Papers' : bulkCategory,
            paperType: isPaper ? bulkPaperType : 'general',
            paperYear: bulkPaperYear,
            author: 'පිරිවෙන් ප්‍රකාශන',
            educationCategory: 'Pracheena',
            pdfUrl: url,
            fileUrl: url,
          };

          addLibraryBook(newDoc);
          successCount++;
        }
      } catch (err) {
        console.error('Bulk PDF upload error:', err);
      }
    }

    setBulkPdfFiles([]);
    setIsBulkUploading(false);
    setBulkUploadProgress(null);
    setIsLibraryModalOpen(false);
    showNotification(`✅ PDF ගොනු ${successCount} ක් සාර්ථකව පුස්තකාලයට එක් කරන ලදී!`);
  };

  // Delete Book Confirm
  const handleConfirmDelete = () => {
    if (deleteTargetBookId) {
      deleteLibraryBook(deleteTargetBookId);
      showNotification('ග්‍රන්ථය / ලේඛනය සාර්ථකව මකා දමන ලදී');
      setDeleteTargetBookId(null);
    }
  };

  // Badge helper
  const getDocBadge = (book: LibraryBook) => {
    const type = book.paperType || 'general';
    switch (type) {
      case 'past_paper':
        return { label: '📜 පසුගිය ප්‍රශ්න පත්‍රය', color: 'bg-amber-500/10 text-amber-600 dark:text-amber-400 border-amber-500/20' };
      case 'model_paper':
        return { label: '🪷 ආදර්ශ ප්‍රශ්න පත්‍රය', color: 'bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 border-emerald-500/20' };
      case 'term_test':
        return { label: '📝 වාර පරීක්ෂණය', color: 'bg-blue-500/10 text-blue-600 dark:text-blue-400 border-blue-500/20' };
      case 'syllabus':
        return { label: '📘 විෂය නිර්දේශය', color: 'bg-indigo-500/10 text-indigo-600 dark:text-indigo-400 border-indigo-500/20' };
      default:
        return { label: `📖 ${book.category || 'ග්‍රන්ථය'}`, color: 'bg-slate-500/10 text-slate-700 dark:text-slate-300 border-slate-500/20' };
    }
  };

  return (
    <div className="space-y-4 text-slate-900 dark:text-white select-none">
      {/* 📱 1. CLEAN CARD CONTAINER */}
      <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-4 sm:p-6 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-4">
        {/* Header Row */}
        <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-3.5">
          <div className="flex items-center gap-2 min-w-0">
            <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
              <BookOpen className="w-4.5 h-4.5" />
            </div>
            <h2 className="text-sm sm:text-base font-black text-slate-900 dark:text-white truncate">
              ඩිජිටල් පුස්තකාලය & ප්‍රශ්න පත්‍ර ({libraryBooks.length})
            </h2>
          </div>

          <button
            onClick={() => {
              setEditingBookId(null);
              setLibraryForm({
                title: '',
                titleSinhala: '',
                author: 'පිරිවෙන් විද්‍යාපීඨය',
                category: 'Tripitaka',
                educationCategory: 'Pracheena',
                paperType: 'general',
                paperYear: '2025',
                pdfUrl: '',
                fileUrl: '',
              });
              setBulkPdfFiles([]);
              setModalMode('single');
              setIsLibraryModalOpen(true);
            }}
            className="px-4 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
          >
            <Plus className="w-4 h-4" />
            <span>+ නව ග්‍රන්ථයක් / PDF</span>
          </button>
        </div>

        {/* 🔍 2. INSTANT SEARCH BAR */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input id="libraryeditortab-input-1" name="libraryeditortab-input-1"
            type="text"
            placeholder="ග්‍රන්ථයේ නම, කතුවරයා, වර්ෂය හෝ විෂය අනුව සොයන්න..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-2xl border border-slate-200 dark:border-stone-700 bg-slate-50/50 dark:bg-stone-800/50 focus:bg-white dark:focus:bg-stone-900 focus:ring-2 focus:ring-amber-500 font-medium text-slate-900 dark:text-white transition"
          />
        </div>

        {/* 🏷️ 3. CLEAN CATEGORY FILTER PILLS */}
        <div className="flex items-center gap-1.5 overflow-x-auto pb-1 scrollbar-none">
          {dynamicFilterTabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setSelectedCategoryTab(tab.id)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold whitespace-nowrap transition cursor-pointer active:scale-95 ${
                selectedCategoryTab === tab.id
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-xs font-black'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* 📚 4. CARDS GRID */}
        {filteredBooks.length === 0 ? (
          <div className="text-center py-12 border-2 border-dashed border-slate-200 dark:border-stone-800 rounded-3xl p-6 bg-slate-50/40 dark:bg-stone-800/20 space-y-2">
            <BookOpen className="w-8 h-8 mx-auto text-slate-400" />
            <p className="text-xs font-bold text-slate-600 dark:text-slate-400">
              ග්‍රන්ථ හෝ ප්‍රශ්න පත්‍ර කිසිවක් හමු නොවීය.
            </p>
            {searchTerm && (
              <button
                onClick={() => setSearchTerm('')}
                className="text-xs font-bold text-amber-600 underline cursor-pointer"
              >
                සෙවුම ඉවත් කරන්න
              </button>
            )}
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3.5">
            {filteredBooks.map((book) => {
              const pdfUrl = book.pdfUrl || (book as any).fileUrl || '';
              const hasPdf = Boolean(pdfUrl && pdfUrl !== '#');
              const badge = getDocBadge(book);

              return (
                <div
                  key={book.id}
                  className="p-4 rounded-2xl bg-slate-50/70 dark:bg-stone-800/60 border border-slate-200/80 dark:border-stone-700/80 hover:border-amber-400/80 transition flex flex-col justify-between gap-3 shadow-2xs group"
                >
                  <div className="space-y-2">
                    {/* Badge & PDF Status */}
                    <div className="flex items-center justify-between gap-2">
                      <span
                        className={`px-2.5 py-0.5 rounded-lg text-[10px] font-bold border ${badge.color}`}
                      >
                        {badge.label}
                      </span>
                      {hasPdf ? (
                        <span className="px-2 py-0.5 rounded-md bg-emerald-500/10 text-emerald-600 dark:text-emerald-400 text-[10px] font-bold flex items-center gap-1 border border-emerald-500/20">
                          <FileText className="w-3 h-3" />
                          <span>PDF ඇත</span>
                        </span>
                      ) : (
                        <span className="px-2 py-0.5 rounded-md bg-slate-200 dark:bg-stone-700 text-slate-500 dark:text-slate-400 text-[10px] font-medium">
                          PDF නැත
                        </span>
                      )}
                    </div>

                    {/* Book Title */}
                    <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white line-clamp-2 leading-snug">
                      {book.titleSinhala || book.title}
                    </h3>

                    {/* Meta info */}
                    <div className="flex flex-wrap items-center gap-2 text-[10px] text-slate-500 dark:text-slate-400 font-medium">
                      {book.author && <span>✍️ {book.author}</span>}
                      {book.paperYear && <span>🗓️ {book.paperYear}</span>}
                      {book.educationCategory && (
                        <span>🎓 {book.educationCategory}</span>
                      )}
                    </div>
                  </div>

                  {/* Action Buttons */}
                  <div className="flex items-center justify-between gap-1.5 pt-2 border-t border-slate-200/60 dark:border-stone-700/60">
                    <div className="flex items-center gap-1.5">
                      {hasPdf && (
                        <button
                          type="button"
                          onClick={() => setAdminPreviewBook(book)}
                          className="px-2.5 py-1.5 rounded-xl bg-amber-500/10 hover:bg-amber-500/20 text-amber-700 dark:text-amber-300 font-bold text-xs flex items-center gap-1 transition cursor-pointer active:scale-90"
                          title="PDF බලන්න"
                        >
                          <Eye className="w-3.5 h-3.5" />
                          <span>බලන්න</span>
                        </button>
                      )}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => handleOpenEdit(book)}
                        className="p-1.5 rounded-xl bg-slate-200/80 dark:bg-stone-700/80 hover:bg-slate-300 text-slate-700 dark:text-slate-300 transition cursor-pointer active:scale-90"
                        title="සංස්කරණය"
                      >
                        <Edit3 className="w-3.5 h-3.5" />
                      </button>

                      <button
                        type="button"
                        onClick={() => setDeleteTargetBookId(book.id)}
                        className="p-1.5 rounded-xl bg-rose-500/10 hover:bg-rose-500/20 text-rose-600 dark:text-rose-400 transition cursor-pointer active:scale-90"
                        title="මකන්න"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* 🚀 5. CLEAN ADD / EDIT MODAL */}
      {isLibraryModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md p-3 sm:p-4 overflow-y-auto">
            <div className="bg-white dark:bg-stone-900 text-slate-900 dark:text-white rounded-3xl p-5 sm:p-7 max-w-lg w-full space-y-4 shadow-2xl border border-slate-200 dark:border-stone-800 animate-fade-in my-auto max-h-[90vh] overflow-y-auto">
              {/* Modal Top Header */}
              <div className="flex items-center justify-between border-b border-slate-100 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-xl bg-amber-500/15 text-amber-600 dark:text-amber-400 flex items-center justify-center shrink-0">
                    <BookOpen className="w-4 h-4" />
                  </div>
                  <h3 className="font-bold text-sm sm:text-base text-slate-900 dark:text-white">
                    {editingBookId
                      ? 'ග්‍රන්ථය / ප්‍රශ්න පත්‍රය සංස්කරණය'
                      : modalMode === 'single'
                      ? 'නව ග්‍රන්ථයක් හෝ ප්‍රශ්න පත්‍රයක්'
                      : 'එකවර PDF රැසක් Upload කරන්න'}
                  </h3>
                </div>
                <button
                  type="button"
                  disabled={isBulkUploading}
                  onClick={() => setIsLibraryModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {/* Mode Switcher (Single vs Bulk) */}
              {!editingBookId && (
                <div className="flex p-1 bg-slate-100 dark:bg-stone-800 rounded-2xl">
                  <button
                    type="button"
                    onClick={() => setModalMode('single')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      modalMode === 'single'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    <span>තනි ගොනුවක්</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setModalMode('bulk')}
                    className={`flex-1 py-1.5 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 transition cursor-pointer ${
                      modalMode === 'bulk'
                        ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
                        : 'text-slate-600 dark:text-slate-400'
                    }`}
                  >
                    <Files className="w-3.5 h-3.5" />
                    <span>Bulk PDF Upload</span>
                  </button>
                </div>
              )}

              {/* Single Mode Form */}
              {modalMode === 'single' ? (
                <form onSubmit={handleSaveSingle} className="space-y-3 text-xs">
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      ග්‍රන්ථයේ හෝ ප්‍රශ්න පත්‍රයේ නම (Title) *
                    </label>
                    <input id="libraryeditortab-input-2" name="libraryeditortab-input-2"
                      type="text"
                      placeholder="උදා: මජ්ඣිම නිකාය / 2025 ප්‍රාචීන ප්‍රාරම්භ පාලි ප්‍රශ්න පත්‍රය"
                      value={libraryForm.titleSinhala}
                      onChange={(e) =>
                        setLibraryForm({
                          ...libraryForm,
                          titleSinhala: e.target.value,
                          title: e.target.value,
                        })
                      }
                      className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        වර්ගය (Nature)
                      </label>
                      <select id="libraryeditortab-select-3" name="libraryeditortab-select-3"
                        value={libraryForm.paperType}
                        onChange={(e) => {
                          const val = e.target.value;
                          setLibraryForm({
                            ...libraryForm,
                            paperType: val,
                            category: val === 'general' ? libraryForm.category || 'Tripitaka' : 'Past Papers',
                          });
                        }}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                      >
                        <option value="general">📖 ධර්ම ග්‍රන්ථය / E-Book</option>
                        <option value="past_paper">📜 පසුගිය ප්‍රශ්න පත්‍රය</option>
                        <option value="model_paper">🪷 ආදර්ශ ප්‍රශ්න පත්‍රය</option>
                        <option value="term_test">📝 වාර පරීක්ෂණය</option>
                        <option value="syllabus">📘 විෂය නිර්දේශය</option>
                      </select>
                    </div>

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        කර්තෘ / ප්‍රකාශනය (Author)
                      </label>
                      <input id="libraryeditortab-input-4" name="libraryeditortab-input-4"
                        type="text"
                        list="existing-authors-list"
                        placeholder="උදා: රේරුකානේ චන්දවිමල හිමි"
                        value={libraryForm.author}
                        onChange={(e) => handleAuthorChange(e.target.value)}
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                      />
                      <datalist id="existing-authors-list">
                        {existingAuthors.map((auth) => (
                          <option key={auth} value={auth} />
                        ))}
                      </datalist>
                    </div>
                  </div>

                  {/* Existing Authors Quick Suggestion Badges */}
                  {existingAuthors.length > 0 && (
                    <div className="flex flex-wrap items-center gap-1">
                      <span className="text-[10px] text-slate-400 font-bold">පෙර කතුවරුන්:</span>
                      {existingAuthors.slice(0, 5).map((auth) => (
                        <button
                          key={auth}
                          type="button"
                          onClick={() => handleAuthorChange(auth)}
                          className="px-2 py-0.5 rounded-md bg-amber-50 dark:bg-amber-950/40 text-amber-800 dark:text-amber-300 border border-amber-200 dark:border-amber-800 text-[10px] font-bold hover:bg-amber-100 transition cursor-pointer active:scale-95"
                        >
                          + {auth}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Category Field (Direct Custom Input with Auto-complete + Badges) */}
                  {libraryForm.paperType === 'general' && (
                    <div className="space-y-1.5">
                      <label className="block font-bold text-slate-700 dark:text-slate-300">
                        කාණ්ඩය (Category / Custom Category) *
                      </label>
                      <input id="libraryeditortab-input-5" name="libraryeditortab-input-5"
                        type="text"
                        list="library-categories-datalist"
                        placeholder="කාණ්ඩය තෝරන්න හෝ අලුත් Custom කාණ්ඩයක් ලියන්න..."
                        value={libraryForm.category}
                        onChange={(e) =>
                          setLibraryForm({ ...libraryForm, category: e.target.value })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-slate-900 dark:text-white"
                        required
                      />
                      <datalist id="library-categories-datalist">
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat} />
                        ))}
                      </datalist>

                      {/* Quick Select Category Badges */}
                      <div className="flex flex-wrap items-center gap-1 mt-1">
                        <span className="text-[10px] text-slate-400 font-bold">පවතින කාණ්ඩ:</span>
                        {dynamicCategories.map((cat) => (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setLibraryForm({ ...libraryForm, category: cat })}
                            className={`px-2 py-0.5 rounded-md text-[10px] font-bold border transition cursor-pointer active:scale-95 ${
                              libraryForm.category === cat
                                ? 'bg-amber-600 text-white border-amber-600 shadow-xs'
                                : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 border-slate-200 dark:border-stone-700 hover:bg-slate-200'
                            }`}
                          >
                            {cat}
                          </button>
                        ))}
                      </div>
                    </div>
                  )}

                  {libraryForm.paperType !== 'general' && (
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          අධ්‍යාපන අංශය
                        </label>
                        <select id="libraryeditortab-select-6" name="libraryeditortab-select-6"
                          value={libraryForm.educationCategory}
                          onChange={(e) =>
                            setLibraryForm({
                              ...libraryForm,
                              educationCategory: e.target.value,
                            })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                        >
                          <option value="Pracheena">ප්‍රාචීන භාෂෝපකාරී (Pracheena)</option>
                          <option value="Moolika">මූලික පිරිවෙන් (Moolika)</option>
                          <option value="General">සාමාන්‍ය / උසස් පෙළ</option>
                        </select>
                      </div>

                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          වර්ෂය (Year)
                        </label>
                        <input id="libraryeditortab-input-7" name="libraryeditortab-input-7"
                          type="text"
                          value={libraryForm.paperYear}
                          onChange={(e) =>
                            setLibraryForm({ ...libraryForm, paperYear: e.target.value })
                          }
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                        />
                      </div>
                    </div>
                  )}

                  {/* PDF Upload / URL Field */}
                  <div>
                    <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                      PDF ගොනුව (PDF File or URL)
                    </label>
                    <div className="flex gap-2 items-center">
                      <input id="libraryeditortab-input-8" name="libraryeditortab-input-8"
                        type="text"
                        placeholder="https://... හෝ Upload කරන්න"
                        value={libraryForm.pdfUrl}
                        onChange={(e) =>
                          setLibraryForm({
                            ...libraryForm,
                            pdfUrl: e.target.value,
                            fileUrl: e.target.value,
                          })
                        }
                        className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                      />
                      <label className="px-3.5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 rounded-xl font-bold cursor-pointer flex items-center gap-1 shrink-0 transition active:scale-95 shadow-xs">
                        {isSingleUploading ? (
                          <Loader2 className="w-4 h-4 animate-spin" />
                        ) : (
                          <Upload className="w-4 h-4" />
                        )}
                        <span>{isSingleUploading ? 'උඩුගත වෙමින්...' : 'Upload PDF'}</span>
                        <input id="libraryeditortab-input-9" name="file_9"
                          type="file"
                          accept=".pdf,application/pdf"
                          disabled={isSingleUploading}
                          className="hidden"
                          onChange={async (e) => {
                            const file = e.target.files?.[0];
                            if (file) {
                              try {
                                setIsSingleUploading(true);
                                setSinglePdfProgress(null);
                                showNotification('PDF ගොනුව Upload වෙමින් පවතී...');
                                const url = await uploadFileWithProgress(file, (prog) => {
                                  setSinglePdfProgress(prog);
                                });
                                if (url) {
                                  setLibraryForm((prev) => ({
                                    ...prev,
                                    pdfUrl: url,
                                    fileUrl: url,
                                  }));
                                  showNotification('✅ PDF ගොනුව සාර්ථකව Upload විය!');
                                }
                              } catch (err) {
                                showNotification('❌ PDF Upload දෝෂයක් මතු විය.');
                              } finally {
                                setIsSingleUploading(false);
                                setSinglePdfProgress(null);
                              }
                            }
                          }}
                        />
                      </label>
                    </div>

                    {/* Single PDF Upload Live Progress Indicator */}
                    {isSingleUploading && singlePdfProgress && (
                      <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                        <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                          <span className="flex items-center gap-1.5">
                            <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                            <span>PDF ගොනුව සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                          </span>
                          <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{singlePdfProgress.percentage}%</span>
                        </div>
                        <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                          <div
                            className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                            style={{ width: `${singlePdfProgress.percentage}%` }}
                          />
                        </div>
                        <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                          <span>උඩුගත ප්‍රමාණය:</span>
                          <span className="font-bold text-amber-800 dark:text-amber-300">
                            {singlePdfProgress.loadedFormatted} / {singlePdfProgress.totalFormatted} ({singlePdfProgress.loaded.toLocaleString()} Bytes)
                          </span>
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-stone-800">
                    <button
                      type="button"
                      disabled={isSingleUploading}
                      onClick={() => setIsLibraryModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                    >
                      අවලංගු කරන්න
                    </button>
                    <button
                      type="submit"
                      disabled={isSingleUploading}
                      className="px-5 py-2 bg-amber-600 hover:bg-amber-700 text-white font-bold rounded-xl shadow-xs transition cursor-pointer"
                    >
                      {editingBookId ? '💾 සුරකින්න' : '➕ එකතු කරන්න'}
                    </button>
                  </div>
                </form>
              ) : (
                /* Bulk Upload Mode Form */
                <form onSubmit={handleSaveBulkPdfs} className="space-y-4 text-xs">
                  {/* Category Nature */}
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      type="button"
                      disabled={isBulkUploading}
                      onClick={() => setBulkDocNature('book')}
                      className={`p-3 rounded-2xl border text-center font-bold transition cursor-pointer ${
                        bulkDocNature === 'book'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200'
                          : 'bg-slate-50 dark:bg-stone-800 border-slate-200 dark:border-stone-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      📖 ධර්ම ග්‍රන්ථ / පොත්
                    </button>
                    <button
                      type="button"
                      disabled={isBulkUploading}
                      onClick={() => setBulkDocNature('paper')}
                      className={`p-3 rounded-2xl border text-center font-bold transition cursor-pointer ${
                        bulkDocNature === 'paper'
                          ? 'bg-amber-500/15 border-amber-500 text-amber-900 dark:text-amber-200'
                          : 'bg-slate-50 dark:bg-stone-800 border-slate-200 dark:border-stone-700 text-slate-600 dark:text-slate-400'
                      }`}
                    >
                      📜 විභාග ප්‍රශ්න පත්‍ර
                    </button>
                  </div>

                  {/* Dynamic Category / Year */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {bulkDocNature === 'paper' ? (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          ප්‍රශ්න පත්‍ර වර්ගය
                        </label>
                        <select id="libraryeditortab-select-10" name="libraryeditortab-select-10"
                          disabled={isBulkUploading}
                          value={bulkPaperType}
                          onChange={(e) => setBulkPaperType(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                        >
                          <option value="past_paper">📜 පසුගිය ප්‍රශ්න පත්‍ර (Past Paper)</option>
                          <option value="model_paper">🪷 ආදර්ශ ප්‍රශ්න පත්‍ර (Model Paper)</option>
                          <option value="term_test">📝 වාර පරීක්ෂණ (Term Test)</option>
                          <option value="syllabus">📘 විෂය නිර්දේශ (Syllabus)</option>
                        </select>
                      </div>
                    ) : (
                      <div>
                        <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                          පොත් වර්ගය (Book Category)
                        </label>
                        <select id="libraryeditortab-select-11" name="libraryeditortab-select-11"
                          disabled={isBulkUploading}
                          value={bulkCategory}
                          onChange={(e) => setBulkCategory(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                        >
                          {dynamicCategories.map((cat) => (
                            <option key={cat} value={cat}>
                              {cat}
                            </option>
                          ))}
                        </select>
                      </div>
                    )}

                    <div>
                      <label className="block font-bold text-slate-700 dark:text-slate-300 mb-1">
                        {bulkDocNature === 'book' ? 'කර්තෘ / ප්‍රකාශක' : 'වර්ෂය (Year)'}
                      </label>
                      {bulkDocNature === 'book' ? (
                        <>
                          <input id="libraryeditortab-input-12" name="libraryeditortab-input-12"
                            type="text"
                            disabled={isBulkUploading}
                            value={bulkCategory}
                            onChange={(e) => setBulkCategory(e.target.value)}
                            list="bulk-categories-datalist"
                            className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                          />
                          <datalist id="bulk-categories-datalist">
                            {dynamicCategories.map((cat) => (
                              <option key={cat} value={cat} />
                            ))}
                          </datalist>
                        </>
                      ) : (
                        <input id="libraryeditortab-input-13" name="libraryeditortab-input-13"
                          type="text"
                          disabled={isBulkUploading}
                          value={bulkPaperYear}
                          onChange={(e) => setBulkPaperYear(e.target.value)}
                          className="w-full p-2.5 rounded-xl border border-slate-200 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                        />
                      )}
                    </div>
                  </div>

                  {/* Dropzone */}
                  <div className="border-2 border-dashed border-slate-300 dark:border-stone-700 rounded-2xl p-6 bg-slate-50/50 dark:bg-stone-800/40 text-center space-y-3">
                    <input name="bulk-library-pdf-input"
                      ref={bulkFileInputRef}
                      type="file"
                      accept=".pdf,application/pdf"
                      multiple
                      disabled={isBulkUploading}
                      onChange={handleBulkFilesSelect}
                      className="hidden"
                      id="bulk-library-pdf-input"
                    />
                    <div className="w-10 h-10 bg-amber-500/15 text-amber-600 dark:text-amber-400 rounded-full flex items-center justify-center mx-auto">
                      <Files className="w-5 h-5" />
                    </div>
                    <div>
                      <label
                        htmlFor="bulk-library-pdf-input"
                        className="inline-flex items-center gap-2 px-4 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-xl cursor-pointer shadow-md transition active:scale-95"
                      >
                        <UploadCloud className="w-4 h-4" />
                        <span>PDF ගොනු තෝරන්න (Select PDFs)</span>
                      </label>
                      <p className="text-[10px] text-slate-400 mt-1.5">
                        එකවර PDF 5ක්, 10ක් හෝ 20ක් තෝරාගත හැක.
                      </p>
                    </div>
                  </div>

                  {/* Selected count */}
                  {bulkPdfFiles.length > 0 && (
                    <div className="p-3 bg-emerald-50 dark:bg-emerald-950/40 border border-emerald-200 dark:border-emerald-800 rounded-2xl flex items-center justify-between text-emerald-800 dark:text-emerald-200 font-bold">
                      <span>තෝරාගත් PDF ගොනු: {bulkPdfFiles.length}</span>
                      {!isBulkUploading && (
                        <button
                          type="button"
                          onClick={() => setBulkPdfFiles([])}
                          className="text-rose-600 underline cursor-pointer text-[11px]"
                        >
                          සියල්ල ඉවත් කරන්න
                        </button>
                      )}
                    </div>
                  )}

                  {/* Upload Progress */}
                  {isBulkUploading && bulkUploadProgress && (
                    <div className="space-y-2 p-4 bg-amber-50 dark:bg-stone-800 border-2 border-amber-400 dark:border-amber-600 rounded-2xl animate-in fade-in duration-200">
                      <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-4 h-4 text-amber-600 dark:text-amber-400 animate-spin" />
                          <span>ගොනුව {bulkUploadProgress.current} / {bulkUploadProgress.total} උඩුගත වෙමින් පවතී...</span>
                        </span>
                        <span className="font-mono text-amber-700 dark:text-amber-300 font-extrabold text-sm">{bulkUploadProgress.percent}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-stone-700 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                        <div
                          className="bg-gradient-to-r from-amber-500 via-amber-400 to-amber-600 h-full rounded-full transition-all duration-150 ease-out"
                          style={{ width: `${bulkUploadProgress.percent}%` }}
                        />
                      </div>
                      <div className="flex items-center justify-between text-[10px] text-slate-600 dark:text-slate-400 font-mono">
                        <span className="truncate max-w-[200px]">📄 {bulkUploadProgress.currentFileName}</span>
                        {bulkUploadProgress.loadedFormatted && (
                          <span className="font-bold text-amber-800 dark:text-amber-300">
                            {bulkUploadProgress.loadedFormatted} / {bulkUploadProgress.totalFormatted} ({bulkUploadProgress.loadedBytes?.toLocaleString()} Bytes)
                          </span>
                        )}
                      </div>
                    </div>
                  )}

                  <div className="flex justify-end gap-2 pt-3 border-t border-slate-100 dark:border-stone-800">
                    <button
                      type="button"
                      disabled={isBulkUploading}
                      onClick={() => setIsLibraryModalOpen(false)}
                      className="px-4 py-2 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-700 dark:text-slate-300 font-bold rounded-xl cursor-pointer"
                    >
                      අවලංගු කරන්න
                    </button>
                    <button
                      type="submit"
                      disabled={isBulkUploading || bulkPdfFiles.length === 0}
                      className="px-5 py-2 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black rounded-xl cursor-pointer shadow-md disabled:opacity-50"
                    >
                      {isBulkUploading ? 'Upload වෙමින් පවතී...' : `PDF ${bulkPdfFiles.length} එකවර Upload කරන්න`}
                    </button>
                  </div>
                </form>
              )}
            </div>
          </div>,
          document.body
        )}

      {/* 📖 6. CLEAN PDF PREVIEW MODAL */}
      {adminPreviewBook &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/85 backdrop-blur-md p-2 sm:p-4">
            <div className="bg-white dark:bg-stone-900 rounded-3xl w-full max-w-4xl h-[90vh] flex flex-col overflow-hidden shadow-2xl border border-slate-200 dark:border-stone-800 animate-fade-in">
              <div className="p-3.5 sm:p-4 border-b border-slate-100 dark:border-stone-800 flex items-center justify-between gap-2 shrink-0">
                <div className="min-w-0 flex-1 truncate">
                  <h3 className="font-bold text-xs sm:text-sm text-slate-900 dark:text-white truncate">
                    {adminPreviewBook.titleSinhala || adminPreviewBook.title}
                  </h3>
                </div>

                <div className="flex items-center gap-1.5 shrink-0">
                  <button
                    onClick={() => {
                      const url = adminPreviewBook.pdfUrl || (adminPreviewBook as any).fileUrl || '';
                      if (url) openPdfInBlobTab(url);
                    }}
                    className="px-3 py-1.5 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-800 dark:text-slate-200 text-xs font-bold rounded-xl flex items-center gap-1 transition cursor-pointer"
                  >
                    <Eye className="w-3.5 h-3.5" />
                    <span>සම්පූර්ණ තිරයෙන් (In-App)</span>
                  </button>

                  <button
                    onClick={() => setAdminPreviewBook(null)}
                    className="p-1.5 bg-slate-100 dark:bg-stone-800 hover:bg-slate-200 text-slate-500 rounded-xl transition cursor-pointer"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
              </div>

              <div className="flex-1 bg-slate-100 dark:bg-stone-950 p-2 overflow-hidden">
                <iframe
                  src={getEmbeddableUrl(adminPreviewBook.pdfUrl || (adminPreviewBook as any).fileUrl || '')}
                  className="w-full h-full rounded-2xl border border-slate-200 dark:border-stone-800"
                  title="PDF Viewer"
                />
              </div>
            </div>
          </div>,
          document.body
        )}

      {/* ⚠️ 7. DELETE CONFIRMATION MODAL */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetBookId)}
        title="ග්‍රන්ථය / ලේඛනය ඉවත් කිරීම"
        message="මෙම ග්‍රන්ථය හෝ විභාග ප්‍රශ්න පත්‍රය ඩිජිටල් පුස්තකාලයෙන් ස්ථිරවම ඉවත් කිරීමට අවශ්‍ය බව තහවුරු කරන්න."
        confirmText="ඔව්, ඉවත් කරන්න"
        cancelText="අවලංගු කරන්න"
        variant="danger"
        onConfirm={handleConfirmDelete}
        onClose={() => setDeleteTargetBookId(null)}
      />
    </div>
  );
};
