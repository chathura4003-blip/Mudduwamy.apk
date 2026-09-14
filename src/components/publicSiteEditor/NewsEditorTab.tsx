import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Newspaper, Plus, Edit3, Trash2, X, Upload, Filter, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { getSriLankaDateString } from '../../utils/sriLankaTime';
import { uploadFileWithProgress, type UploadProgressInfo } from '../../utils/fileUpload';

interface NewsEditorTabProps {
  newsArticles: any[];
  isNewsModalOpen: boolean;
  setIsNewsModalOpen: (open: boolean) => void;
  editingNewsId: string | null;
  newsForm: any;
  setNewsForm: React.Dispatch<React.SetStateAction<any>>;
  handleEditNews: (article: any) => void;
  handleSaveNews: (e: React.FormEvent) => void;
  deleteNewsArticle: (id: string) => void;
  handleFileUploadHelper: (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string, sizeStr?: string) => void
  ) => void;
  showNotification: (msg: string) => void;
}

export const NewsEditorTab: React.FC<NewsEditorTabProps> = ({
  newsArticles,
  isNewsModalOpen,
  setIsNewsModalOpen,
  editingNewsId,
  newsForm,
  setNewsForm,
  handleEditNews,
  handleSaveNews,
  deleteNewsArticle,
  handleFileUploadHelper,
  showNotification,
}) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [newsPhotoProgress, setNewsPhotoProgress] = useState<UploadProgressInfo | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Extract all unique categories dynamically
  const dynamicCategories = useMemo(() => {
    const defaultCats = ['Academic', 'Religious', 'Special', 'Dhamma'];
    const catSet = new Set<string>(defaultCats);
    newsArticles.forEach((art) => {
      if (art.category && art.category.trim() !== '') {
        catSet.add(art.category.trim());
      }
    });
    return Array.from(catSet);
  }, [newsArticles]);

  // Filter news articles by category
  const filteredNews = useMemo(() => {
    if (selectedFilterCategory === 'all') return newsArticles;
    return newsArticles.filter((art) => art.category === selectedFilterCategory);
  }, [newsArticles, selectedFilterCategory]);

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      deleteNewsArticle(deleteTargetId);
      showNotification('පුවත ඉවත් කරන ලදී');
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-5 text-slate-900 dark:text-white select-none">
      <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Newspaper className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>පුවත් සහ නිවේදන ({newsArticles.length})</span>
        </h2>

        <button
          onClick={() => {
            setNewsForm({
              title: '',
              titleSinhala: '',
              category: dynamicCategories[0] || 'Academic',
              summary: '',
              summarySinhala: '',
              content: '',
              contentSinhala: '',
              imageUrl:
                'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
              publishedDate: getSriLankaDateString(),
              author: 'Pirivena Media Desk',
            });
            setIsCustomCategoryMode(false);
            setIsNewsModalOpen(true);
          }}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span> නව පුවතක්</span>
        </button>
      </div>

      {/* Category Filter Pills */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>වර්ගීකරණය:</span>
        </span>

        <button
          onClick={() => setSelectedFilterCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${selectedFilterCategory === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
              : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
        >
          සියල්ල ({newsArticles.length})
        </button>

        {dynamicCategories.map((cat) => {
          const count = newsArticles.filter((a) => a.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${selectedFilterCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {filteredNews.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-stone-800 rounded-3xl p-6 bg-slate-50 dark:bg-stone-800/40 space-y-2">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            මෙම වර්ගීකරණය යටතේ පුවත් නොමැත
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredNews.map((art) => (
            <div
              key={art.id}
              className="border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 bg-slate-50/80 dark:bg-stone-800/60 space-y-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-stone-700 transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold rounded-lg text-[10px] uppercase">
                    {art.category}
                  </span>
                  <span className="text-[11px] font-medium">{art.publishedDate}</span>
                </div>
                <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">
                  {art.titleSinhala || art.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                  {art.summarySinhala || art.summary}
                </p>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-stone-700">
                <button
                  onClick={() => handleEditNews(art)}
                  className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>සංස්කරණය</span>
                </button>
                <button
                  onClick={() => setDeleteTargetId(art.id)}
                  className="px-3 py-1.5 bg-rose-50 hover:bg-rose-100 dark:bg-rose-950/40 text-rose-600 dark:text-rose-400 font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95 border border-rose-200 dark:border-rose-800"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  <span>ඉවත් කරන්න</span>
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* NEWS MODAL */}
      {isNewsModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl p-6 sm:p-8 max-w-2xl w-full max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl border-2 border-amber-500 animate-fade-in my-auto">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-stone-800 pb-3">
                <h3 className="font-serif font-bold text-lg text-amber-950 dark:text-amber-100">
                  {editingNewsId ? 'පුවත සංස්කරණය කරන්න' : 'නව පුවතක් එකතු කරන්න'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsNewsModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveNews} className="space-y-4 text-xs">
                <div>
                  <label
                    htmlFor="newseditortab-titleSinhala"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    පුවතේ මාතෘකාව (Sinhala Title)
                  </label>
                  <input
                    autoComplete="name"
                    id="newseditortab-titleSinhala"
                    name="titleSinhala"
                    type="text"
                    value={newsForm.titleSinhala || ''}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        titleSinhala: e.target.value,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                    required
                  />
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label
                        htmlFor="newseditortab-publishedDate"
                        className="block font-bold text-amber-950 dark:text-amber-200"
                      >
                        වර්ගීකරණය (Category)
                      </label>
                      <button
                        type="button"
                        onClick={() => setIsCustomCategoryMode(!isCustomCategoryMode)}
                        className="text-[10px] font-bold text-amber-800 dark:text-amber-300 hover:underline flex items-center gap-0.5 cursor-pointer"
                      >
                        {isCustomCategoryMode ? (
                          <span>📋 ලැයිස්තුවෙන්</span>
                        ) : (
                          <span>✏️ අලුත් වර්ගයක්</span>
                        )}
                      </button>
                    </div>
                    {isCustomCategoryMode ? (
                      <input
                        autoComplete="name"
                        id="newseditortab-filter-category"
                        name="category"
                        type="text"
                        placeholder="අලුත් වර්ගීකරණය ලියන්න"
                        value={newsForm.category}
                        onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border-2 border-amber-500 bg-amber-50/50 dark:bg-stone-800 font-bold text-amber-950 dark:text-amber-100"
                      />
                    ) : (
                      <select
                        id="newseditortab-publishedDate"
                        name="category"
                        value={newsForm.category}
                        onChange={(e) => setNewsForm({ ...newsForm, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                      >
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                      </select>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="newseditortab-publishedDate-input"
                      className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                    >
                      ප්‍රකාශිත දිනය (Date)
                    </label>
                    <input
                      autoComplete="name"
                      id="newseditortab-publishedDate-input"
                      name="publishedDate"
                      type="date"
                      value={newsForm.publishedDate || getSriLankaDateString()}
                      onChange={(e) =>
                        setNewsForm({ ...newsForm, publishedDate: e.target.value })
                      }
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold"
                    />
                  </div>
                </div>

                <div>
                  <label
                    htmlFor="newseditortab-summarySinhala"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    කෙටි හැඳින්වීම (Sinhala Summary)
                  </label>
                  <textarea
                    autoComplete="name"
                    id="newseditortab-summarySinhala"
                    name="summarySinhala"
                    value={newsForm.summarySinhala || ''}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        summarySinhala: e.target.value,
                        summary: e.target.value,
                      })
                    }
                    rows={2}
                    className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    placeholder="පුවත පිළිබඳ කෙටි සාරාංශයක්..."
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="newseditortab-contentSinhala"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    සම්පූර්ණ පුවත් විස්තරය (Full Content)
                  </label>
                  <textarea
                    autoComplete="name"
                    id="newseditortab-contentSinhala"
                    name="contentSinhala"
                    value={newsForm.contentSinhala || ''}
                    onChange={(e) =>
                      setNewsForm({
                        ...newsForm,
                        contentSinhala: e.target.value,
                        content: e.target.value,
                      })
                    }
                    rows={5}
                    className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    placeholder="සම්පූර්ණ විස්තරය මෙහි ලියන්න..."
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="newseditortab-imageUrl"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    පුවත සඳහා ඡායාරූපය (Image)
                  </label>
                  <div className="flex gap-2">
                    <input
                      autoComplete="name"
                      id="newseditortab-imageUrl"
                      name="imageUrl"
                      type="text"
                      value={newsForm.imageUrl}
                      onChange={(e) => setNewsForm({ ...newsForm, imageUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                      placeholder="https://..."
                    />
                    <label
                      htmlFor="newseditortab-file-23"
                      className="px-4 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl flex items-center gap-1 cursor-pointer shrink-0 transition active:scale-95 shadow-xs"
                    >
                      {isUploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isUploadingPhoto ? 'උඩුගත වෙමින්...' : 'Upload'}</span>
                      <input
                        autoComplete="off"
                        id="newseditortab-file-23"
                        name="file-23"
                        type="file"
                        accept="image/*"
                        disabled={isUploadingPhoto}
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setIsUploadingPhoto(true);
                              setNewsPhotoProgress(null);
                              showNotification('පුවත් ඡායාරූපය Upload වෙමින් පවතී...');
                              const url = await uploadFileWithProgress(file, (prog) => {
                                setNewsPhotoProgress(prog);
                              });
                              if (url) {
                                setNewsForm({ ...newsForm, imageUrl: url });
                                showNotification('✅ ඡායාරූපය සාර්ථකව Upload විය!');
                              }
                            } catch (err) {
                              showNotification('❌ ඡායාරූපය Upload දෝෂයක් මතු විය.');
                            } finally {
                              setIsUploadingPhoto(false);
                              setNewsPhotoProgress(null);
                            }
                          }
                        }}
                        className="hidden"
                      />
                    </label>
                  </div>

                  {/* News Photo Upload Live Progress Indicator */}
                  {isUploadingPhoto && newsPhotoProgress && (
                    <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                          <span>ඡායාරූපය සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                        </span>
                        <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{newsPhotoProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                          style={{ width: `${newsPhotoProgress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>උඩුගත ප්‍රමාණය:</span>
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                          {newsPhotoProgress.loadedFormatted} / {newsPhotoProgress.totalFormatted} ({newsPhotoProgress.loaded.toLocaleString()} Bytes)
                        </span>
                      </div>
                    </div>
                  )}

                  {newsForm.imageUrl && (
                    <div className="mt-2 relative w-full h-32 rounded-xl overflow-hidden border border-amber-300 dark:border-stone-700">
                      <img
                        src={newsForm.imageUrl}
                        alt="Preview"
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-4 border-t border-amber-200 dark:border-stone-800">
                  <button
                    type="button"
                    disabled={isUploadingPhoto}
                    onClick={() => setIsNewsModalOpen(false)}
                    className="px-4 py-2 bg-stone-200 dark:bg-stone-800 text-stone-700 dark:text-stone-300 font-bold rounded-xl cursor-pointer"
                  >
                    අවලංගු කරන්න
                  </button>
                  <button
                    type="submit"
                    disabled={isUploadingPhoto}
                    className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    {editingNewsId ? 'වෙනස්කම් සුරකින්න' : 'පුවත පළ කරන්න'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="පුවත ඉවත් කිරීම"
        message="මෙම පුවත වෙබ් අඩවියෙන් ඉවත් කිරීමට ඔබට විශ්වාසද?"
        confirmText="ඔව්, ඉවත් කරන්න"
        cancelText="අවලංගු කරන්න"
        variant="danger"
      />
    </div>
  );
};
