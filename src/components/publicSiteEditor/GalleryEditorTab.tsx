import React, { useState, useMemo, useRef } from 'react';
import { createPortal } from 'react-dom';
import {
  Image as ImageIcon,
  Plus,
  Trash2,
  Edit3,
  X,
  Upload,
  UploadCloud,
  Images,
  Filter,
  CheckCircle2,
  Loader2,
  FileImage,
} from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { uploadFileWithProgress, formatBytes, type UploadProgressInfo } from '../../utils/fileUpload';
import { getSriLankaDateString } from '../../utils/sriLankaTime';

interface GalleryEditorTabProps {
  galleryItems: any[];
  isGalleryModalOpen: boolean;
  setIsGalleryModalOpen: (open: boolean) => void;
  editingGalleryId?: string | null;
  setEditingGalleryId?: (id: string | null) => void;
  galleryForm: any;
  setGalleryForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveGallery: (e: React.FormEvent) => void;
  deleteGalleryItem: (id: string) => void;
  addGalleryItem?: (item: any) => void;
  updateGalleryItem?: (id: string, item: any) => void;
  handleFileUploadHelper: (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string, sizeStr?: string) => void
  ) => void;
  showNotification: (msg: string) => void;
}

interface SelectedFilePreview {
  file: File;
  previewUrl: string;
  id: string;
}

export const GalleryEditorTab: React.FC<GalleryEditorTabProps> = ({
  galleryItems,
  isGalleryModalOpen,
  setIsGalleryModalOpen,
  editingGalleryId,
  setEditingGalleryId,
  galleryForm,
  setGalleryForm,
  handleSaveGallery,
  deleteGalleryItem,
  addGalleryItem,
  updateGalleryItem,
  handleFileUploadHelper,
  showNotification,
}) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');

  // Single Photo Upload Progress State
  const [singlePhotoProgress, setSinglePhotoProgress] = useState<UploadProgressInfo | null>(null);
  const [isSingleUploading, setIsSingleUploading] = useState<boolean>(false);

  // Bulk Upload States
  const [isBulkModalOpen, setIsBulkModalOpen] = useState<boolean>(false);
  const [bulkFiles, setBulkFiles] = useState<SelectedFilePreview[]>([]);
  const [bulkCategory, setBulkCategory] = useState<string>('Events');
  const [isBulkCustomCategory, setIsBulkCustomCategory] = useState<boolean>(false);
  const [bulkBaseTitle, setBulkBaseTitle] = useState<string>('');
  const [bulkDate, setBulkDate] = useState<string>(getSriLankaDateString());
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

  // Extract all unique categories dynamically
  const dynamicCategories = useMemo(() => {
    const defaultCats = ['Events', 'Premises', 'Academic', 'Dhamma'];
    const catSet = new Set<string>(defaultCats);
    galleryItems.forEach((item) => {
      if (item.category && item.category.trim() !== '') {
        catSet.add(item.category.trim());
      }
    });
    return Array.from(catSet);
  }, [galleryItems]);

  // Filter gallery items by selected category
  const filteredGalleryItems = useMemo(() => {
    if (selectedFilterCategory === 'all') return galleryItems;
    return galleryItems.filter((item) => item.category === selectedFilterCategory);
  }, [galleryItems, selectedFilterCategory]);

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      deleteGalleryItem(deleteTargetId);
      showNotification('ඡායාරූපය ඉවත් කරන ලදී');
      setDeleteTargetId(null);
    }
  };

  // Bulk files selection
  const handleBulkFilesSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    const newPreviews: SelectedFilePreview[] = Array.from(files).map((file, idx) => ({
      file,
      previewUrl: URL.createObjectURL(file),
      id: `${Date.now()}-${idx}-${file.name}`,
    }));

    setBulkFiles((prev) => [...prev, ...newPreviews]);
    if (bulkFileInputRef.current) bulkFileInputRef.current.value = '';
  };

  const removeBulkFile = (id: string) => {
    setBulkFiles((prev) => {
      const target = prev.find((f) => f.id === id);
      if (target) URL.revokeObjectURL(target.previewUrl);
      return prev.filter((f) => f.id !== id);
    });
  };

  const handleStartBulkUpload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (bulkFiles.length === 0) {
      showNotification('❌ කරුණාකර Upload කිරීමට ඡායාරූප එකක් හෝ කිහිපයක් තෝරන්න.');
      return;
    }

    if (!addGalleryItem) {
      showNotification('❌ Gallery Add handler is not connected.');
      return;
    }

    const targetCategory = bulkCategory.trim() || 'Events';
    setIsBulkUploading(true);
    let successCount = 0;

    for (let i = 0; i < bulkFiles.length; i++) {
      const item = bulkFiles[i];
      setBulkUploadProgress({
        current: i + 1,
        total: bulkFiles.length,
        percent: Math.round((i / bulkFiles.length) * 100),
        currentFileName: item.file.name,
        loadedFormatted: '0 B',
        totalFormatted: formatBytes(item.file.size),
        loadedBytes: 0,
        totalBytes: item.file.size,
      });

      try {
        const uploadedUrl = await uploadFileWithProgress(item.file, (prog) => {
          setBulkUploadProgress({
            current: i + 1,
            total: bulkFiles.length,
            percent: prog.percentage,
            currentFileName: item.file.name,
            loadedFormatted: prog.loadedFormatted,
            totalFormatted: prog.totalFormatted,
            loadedBytes: prog.loaded,
            totalBytes: prog.total,
          });
        });
        if (uploadedUrl) {
          const rawName = item.file.name.replace(/\.[^/.]+$/, '');
          const finalTitle = bulkBaseTitle.trim()
            ? bulkFiles.length > 1
              ? `${bulkBaseTitle.trim()} - ${i + 1}`
              : bulkBaseTitle.trim()
            : rawName;

          addGalleryItem({
            title: finalTitle,
            titleSinhala: finalTitle,
            type: 'photo',
            url: uploadedUrl,
            category: targetCategory,
            date: bulkDate || new Date().toISOString().split('T')[0],
          });
          successCount++;
        }
      } catch (err: any) {
        console.error(`Bulk upload error on file ${item.file.name}:`, err);
      }
    }

    // Clean up previews
    bulkFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
    setBulkFiles([]);
    setIsBulkUploading(false);
    setBulkUploadProgress(null);
    setIsBulkModalOpen(false);
    setBulkBaseTitle('');

    showNotification(
      `✅ ඡායාරූප ${successCount} ක් සාර්ථකව "${targetCategory}" කාණ්ඩය යටතේ ගැලරියට එකතු කරන ලදී!`
    );
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-5 text-slate-900 dark:text-white select-none">
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Images className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>ඡායාරූප ගැලරිය ({galleryItems.length})</span>
        </h2>

        <div className="flex flex-wrap items-center gap-2">
          {/* Bulk Upload Button */}
          <button
            onClick={() => {
              setIsBulkModalOpen(true);
              setBulkFiles([]);
              setBulkBaseTitle('');
            }}
            className="px-4 py-2.5 bg-emerald-600 hover:bg-emerald-700 text-white font-bold text-xs rounded-2xl shadow-sm flex items-center gap-1.5 cursor-pointer transition active:scale-95"
          >
            <UploadCloud className="w-4 h-4 text-emerald-200" />
            <span>📸 Bulk Upload ({bulkFiles.length > 0 ? bulkFiles.length : 'ගොනු'})</span>
          </button>

          {/* Single Photo Add Button */}
          <button
            onClick={() => {
              if (setEditingGalleryId) setEditingGalleryId(null);
              setGalleryForm({
                title: '',
                titleSinhala: '',
                type: 'photo',
                url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
                category: dynamicCategories[0] || 'Events',
                date: getSriLankaDateString(),
              });
              setIsCustomCategoryMode(false);
              setIsGalleryModalOpen(true);
            }}
            className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95"
          >
            <Plus className="w-4 h-4" />
            <span> තනි ඡායාරූපයක්</span>
          </button>
        </div>
      </div>

      {/* DYNAMIC CATEGORY FILTER PILLS */}
      <div className="flex items-center gap-2 overflow-x-auto pb-2 pt-1 border-b border-slate-100 dark:border-stone-800 scrollbar-none">
        <span className="text-xs font-bold text-slate-400 flex items-center gap-1 shrink-0">
          <Filter className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
          <span>වර්ගීකරණය:</span>
        </span>

        <button
          onClick={() => setSelectedFilterCategory('all')}
          className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${selectedFilterCategory === 'all'
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
              : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
        >
          සියල්ල ({galleryItems.length})
        </button>

        {dynamicCategories.map((cat) => {
          const count = galleryItems.filter((g) => g.category === cat).length;
          return (
            <button
              key={cat}
              onClick={() => setSelectedFilterCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition shrink-0 cursor-pointer active:scale-95 ${selectedFilterCategory === cat
                  ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
                  : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
                }`}
            >
              {cat} ({count})
            </button>
          );
        })}
      </div>

      {/* PHOTO GRID */}
      {filteredGalleryItems.length === 0 ? (
        <div className="text-center py-12 border-2 border-dashed border-amber-300 dark:border-stone-800 rounded-3xl p-6 bg-amber-50/20 dark:bg-stone-800/20 space-y-2">
          <Images className="w-10 h-10 text-amber-400 mx-auto" />
          <p className="text-sm font-bold text-amber-950 dark:text-amber-200">
            මෙම වර්ගීකරණය යටතේ ඡායාරූප නොමැත
          </p>
          <p className="text-xs text-stone-500">
            ඉහත බොත්තම් මඟින් නව ඡායාරූප එකතු කළ හැක.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {filteredGalleryItems.map((item) => (
            <div
              key={item.id}
              className="relative group border border-amber-200 dark:border-stone-800 rounded-2xl overflow-hidden bg-stone-100 dark:bg-stone-800 aspect-video shadow-xs"
            >
              <img
                src={item.url}
                alt={item.title}
                className="w-full h-full object-cover transition group-hover:scale-105"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent p-3 flex flex-col justify-end text-white">
                <span className="text-[10px] text-amber-300 font-bold uppercase">
                  {item.category}
                </span>
                <h4 className="text-xs font-serif font-bold truncate">
                  {item.titleSinhala || item.title}
                </h4>
                {item.title && item.titleSinhala && item.title !== item.titleSinhala && (
                  <p className="text-[10px] text-stone-300 font-sans truncate">
                    {item.title}
                  </p>
                )}

                {/* Action buttons (Edit & Delete) */}
                <div className="absolute top-2 right-2 flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button
                    onClick={() => {
                      if (setEditingGalleryId) setEditingGalleryId(item.id);
                      setGalleryForm({
                        title: item.title || '',
                        titleSinhala: item.titleSinhala || item.title || '',
                        type: item.type || 'photo',
                        url: item.url,
                        category: item.category,
                        date: item.date || new Date().toISOString().split('T')[0],
                      });
                      setIsCustomCategoryMode(false);
                      setIsGalleryModalOpen(true);
                    }}
                    className="p-1.5 bg-amber-600/90 hover:bg-amber-700 text-white rounded-lg transition cursor-pointer shadow-md"
                    title="Edit Photo Info"
                  >
                    <Edit3 className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => setDeleteTargetId(item.id)}
                    className="p-1.5 bg-rose-600/90 hover:bg-rose-700 text-white rounded-lg transition cursor-pointer shadow-md"
                    title="Delete Photo"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* SINGLE GALLERY PHOTO MODAL */}
      {isGalleryModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl p-6 sm:p-8 max-w-md w-full space-y-4 shadow-2xl border-2 border-amber-500 animate-fade-in my-auto max-h-[92vh] overflow-y-auto">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-stone-800 pb-3">
                <h3 className="font-serif font-bold text-lg text-amber-950 dark:text-amber-100 flex items-center gap-2">
                  <Images className="w-5 h-5 text-amber-600" />
                  <span>{editingGalleryId ? 'ඡායාරූපය සංස්කරණය (Edit Photo)' : 'නව ඡායාරූපයක් එක් කිරීම'}</span>
                </h3>
                <button
                  type="button"
                  onClick={() => {
                    if (setEditingGalleryId) setEditingGalleryId(null);
                    setIsGalleryModalOpen(false);
                  }}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveGallery} className="space-y-3.5 text-xs">
                <div>
                  <label
                    htmlFor="galleryeditortab-titleSinhala"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    ඡායාරූපයේ නම - සිංහල (Sinhala Title) *
                  </label>
                  <input
                    autoComplete="name"
                    id="galleryeditortab-titleSinhala"
                    name="titleSinhala"
                    type="text"
                    placeholder="උදා: 2026 කඨින පිංකම, විහාර මන්දිරය"
                    value={galleryForm.titleSinhala || ''}
                    onChange={(e) =>
                      setGalleryForm({
                        ...galleryForm,
                        titleSinhala: e.target.value,
                        title: galleryForm.title || e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-bold text-amber-950 dark:text-amber-100"
                    required
                  />
                </div>

                <div>
                  <label
                    htmlFor="galleryeditortab-title"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    English Title / දෙවන නම (English Title / Secondary Caption)
                  </label>
                  <input
                    autoComplete="name"
                    id="galleryeditortab-title"
                    name="title"
                    type="text"
                    placeholder="උදා: Annual Katina Pinkama Ceremony"
                    value={galleryForm.title || ''}
                    onChange={(e) =>
                      setGalleryForm({
                        ...galleryForm,
                        title: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-1">
                    <label
                      htmlFor="galleryeditortab-category-select"
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
                        <span>📋 ලැයිස්තුවෙන් තෝරන්න (Select list)</span>
                      ) : (
                        <span>✏️ කැමති අලුත් වර්ගයක් ලියන්න (New Category)</span>
                      )}
                    </button>
                  </div>
                  {isCustomCategoryMode ? (
                    <input
                      autoComplete="name"
                      id="galleryeditortab-filter-category"
                      name="category"
                      type="text"
                      placeholder="අලුත් වර්ගීකරණය ලියන්න (Type New Category Name)"
                      value={galleryForm.category || ''}
                      onChange={(e) => setGalleryForm({ ...galleryForm, category: e.target.value })}
                      className="w-full p-2.5 rounded-xl border-2 border-amber-500 bg-amber-50/50 dark:bg-stone-800 font-bold text-amber-950 dark:text-amber-100"
                      autoFocus
                    />
                  ) : (
                    <select
                      autoComplete="off"
                      id="galleryeditortab-category-select"
                      name="category"
                      value={galleryForm.category || ''}
                      onChange={(e) => {
                        if (e.target.value === 'ADD_CUSTOM_CATEGORY') {
                          setIsCustomCategoryMode(true);
                        } else {
                          setGalleryForm({ ...galleryForm, category: e.target.value });
                        }
                      }}
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                    >
                      {dynamicCategories.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                      {galleryForm.category &&
                        !dynamicCategories.includes(galleryForm.category) && (
                          <option value={galleryForm.category}>✨ {galleryForm.category}</option>
                        )}
                      <option value="ADD_CUSTOM_CATEGORY">✏️ කැමති අලුත් වර්ගයක් ලියන්න (New Category)...</option>
                    </select>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="galleryeditortab-url"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    ඡායාරූපය (Image URL or Direct Upload)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input
                      autoComplete="name"
                      id="galleryeditortab-url"
                      name="url"
                      type="text"
                      value={galleryForm.url || ''}
                      onChange={(e) => setGalleryForm({ ...galleryForm, url: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                      required
                    />
                    <label
                      htmlFor="galleryeditortab-file-single"
                      className="px-3.5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1 shrink-0 transition shadow-xs"
                    >
                      {isSingleUploading ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isSingleUploading ? 'උඩුගත වෙමින්...' : 'Upload'}</span>
                      <input
                        autoComplete="off"
                        id="galleryeditortab-file-single"
                        name="file-single"
                        type="file"
                        accept="image/*"
                        disabled={isSingleUploading}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setIsSingleUploading(true);
                              setSinglePhotoProgress(null);
                              showNotification('ඡායාරූපය Upload වෙමින් පවතී...');
                              const url = await uploadFileWithProgress(file, (prog) => {
                                setSinglePhotoProgress(prog);
                              });
                              if (url) {
                                setGalleryForm((prev: any) => ({ ...prev, url }));
                                showNotification('✅ ඡායාරූපය සාර්ථකව Upload විය!');
                              }
                            } catch (err) {
                              showNotification('❌ ඡායාරූපය Upload දෝෂයක් මතු විය.');
                            } finally {
                              setIsSingleUploading(false);
                              setSinglePhotoProgress(null);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Single Photo Upload Live Progress Indicator */}
                  {isSingleUploading && singlePhotoProgress && (
                    <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                          <span>ඡායාරූපය සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                        </span>
                        <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{singlePhotoProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                          style={{ width: `${singlePhotoProgress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>උඩුගත ප්‍රමාණය:</span>
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                          {singlePhotoProgress.loadedFormatted} / {singlePhotoProgress.totalFormatted} ({singlePhotoProgress.loaded.toLocaleString()} Bytes)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-amber-200 dark:border-stone-800">
                  <button
                    type="button"
                    disabled={isSingleUploading}
                    onClick={() => setIsGalleryModalOpen(false)}
                    className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl cursor-pointer"
                  >
                    අවලංගු කරන්න
                  </button>
                  <button
                    type="submit"
                    disabled={isSingleUploading}
                    className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    {editingGalleryId ? 'වෙනස්කම් සුරකින්න (Save Changes)' : 'ගැලරියට එකතු කරන්න'}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* BULK PHOTO UPLOAD MODAL */}
      {isBulkModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl p-6 sm:p-8 max-w-2xl w-full space-y-5 shadow-2xl border-2 border-emerald-500 animate-fade-in my-auto max-h-[92vh] overflow-y-auto">
              {/* Modal Header */}
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-stone-800 pb-3">
                <div className="flex items-center gap-2.5">
                  <div className="p-2.5 bg-emerald-100 dark:bg-emerald-950 text-emerald-700 dark:text-emerald-300 rounded-2xl">
                    <UploadCloud className="w-6 h-6" />
                  </div>
                  <div>
                    <h3 className="font-serif font-bold text-lg text-emerald-950 dark:text-emerald-100">
                      එකවර ඡායාරූප ගොනුවක් Upload කරන්න (Bulk Upload)
                    </h3>
                    <p className="text-xs text-stone-500">
                      පින්තූර කිහිපයක් එකවර තෝරා එකම කාණ්ඩයක් යටතේ ස්වයංක්‍රීයව ගැලරියට එක් කරන්න.
                    </p>
                  </div>
                </div>
                <button
                  type="button"
                  disabled={isBulkUploading}
                  onClick={() => setIsBulkModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer disabled:opacity-50"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleStartBulkUpload} className="space-y-4 text-xs">
                {/* Common Title & Category Row */}
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {/* Category */}
                  <div>
                    <div className="flex items-center justify-between mb-1">
                      <label className="block font-bold text-stone-800 dark:text-stone-200">
                        වර්ගීකරණය (Category) *
                      </label>
                      <button
                        type="button"
                        disabled={isBulkUploading}
                        onClick={() => setIsBulkCustomCategory(!isBulkCustomCategory)}
                        className="text-[10px] font-bold text-emerald-700 dark:text-emerald-400 hover:underline cursor-pointer"
                      >
                        {isBulkCustomCategory ? '📋 ලැයිස්තුවෙන්' : '✏️ අලුත් වර්ගයක්'}
                      </button>
                    </div>
                    {isBulkCustomCategory ? (
                      <input id="galleryeditortab-input-7" name="galleryeditortab-input-7"
                        type="text"
                        placeholder="අලුත් වර්ගීකරණය ලියන්න (උදා: වෙසක් උත්සවය 2026)"
                        value={bulkCategory}
                        disabled={isBulkUploading}
                        onChange={(e) => setBulkCategory(e.target.value)}
                        className="w-full p-2.5 rounded-xl border-2 border-emerald-500 bg-emerald-50/30 dark:bg-stone-800 font-bold text-stone-900 dark:text-stone-100"
                        required
                      />
                    ) : (
                      <select id="galleryeditortab-select-8" name="galleryeditortab-select-8"
                        value={bulkCategory}
                        disabled={isBulkUploading}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_CUSTOM') {
                            setIsBulkCustomCategory(true);
                          } else {
                            setBulkCategory(e.target.value);
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-semibold"
                      >
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        <option value="ADD_CUSTOM">✏️ කැමති අලුත් වර්ගයක් ලියන්න (New Category)...</option>
                      </select>
                    )}
                  </div>

                  {/* Common Title Prefix */}
                  <div>
                    <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                      පොදු මාතෘකාව (Optional Common Name)
                    </label>
                    <input id="galleryeditortab-input-9" name="galleryeditortab-input-9"
                      type="text"
                      disabled={isBulkUploading}
                      placeholder="හිස්ව තැබුවහොත් File Name එක භාවිතා වේ"
                      value={bulkBaseTitle}
                      onChange={(e) => setBulkBaseTitle(e.target.value)}
                      className="w-full p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                    />
                  </div>
                </div>

                {/* Date */}
                <div>
                  <label className="block font-bold text-stone-800 dark:text-stone-200 mb-1">
                    දිනය (Event Date)
                  </label>
                  <input id="galleryeditortab-input-10" name="date_10"
                    type="date"
                    disabled={isBulkUploading}
                    value={bulkDate}
                    onChange={(e) => setBulkDate(e.target.value)}
                    className="w-full sm:w-1/2 p-2.5 rounded-xl border border-stone-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                  />
                </div>

                {/* File Dropzone / Selector */}
                <div className="border-2 border-dashed border-emerald-400 dark:border-emerald-700 rounded-3xl p-6 bg-emerald-50/30 dark:bg-stone-800/40 text-center space-y-3">
                  <input name="bulk-gallery-files-input"
                    ref={bulkFileInputRef}
                    type="file"
                    accept="image/*"
                    multiple
                    disabled={isBulkUploading}
                    onChange={handleBulkFilesSelect}
                    className="hidden"
                    id="bulk-gallery-files-input"
                  />
                  <div className="w-12 h-12 bg-emerald-100 dark:bg-emerald-950 text-emerald-600 dark:text-emerald-400 rounded-full flex items-center justify-center mx-auto">
                    <Images className="w-6 h-6" />
                  </div>
                  <div>
                    <label
                      htmlFor="bulk-gallery-files-input"
                      className="inline-flex items-center gap-2 px-5 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer shadow-md transition transform hover:scale-102 active:scale-98"
                    >
                      <Upload className="w-4 h-4" />
                      <span>ඡායාරූප තෝරන්න (Select Multiple Photos)</span>
                    </label>
                    <p className="text-[11px] text-stone-500 mt-2">
                      ඔබේ පරිගණකයෙන් එකවර ඡායාරූප 5ක්, 10ක්, හෝ 20ක් තෝරාගත හැක (JPG, PNG, WebP).
                    </p>
                  </div>
                </div>

                {/* Selected Files Previews */}
                {bulkFiles.length > 0 && (
                  <div className="space-y-2">
                    <div className="flex items-center justify-between text-xs font-bold text-stone-700 dark:text-stone-300">
                      <span>තෝරාගත් ඡායාරූප ({bulkFiles.length}):</span>
                      {!isBulkUploading && (
                        <button
                          type="button"
                          onClick={() => {
                            bulkFiles.forEach((f) => URL.revokeObjectURL(f.previewUrl));
                            setBulkFiles([]);
                          }}
                          className="text-rose-600 hover:underline cursor-pointer"
                        >
                          සියල්ල ඉවත් කරන්න
                        </button>
                      )}
                    </div>

                    <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-2 max-h-48 overflow-y-auto p-2 border border-stone-200 dark:border-stone-800 rounded-2xl bg-stone-50 dark:bg-stone-950">
                      {bulkFiles.map((item, idx) => (
                        <div
                          key={item.id}
                          className="relative group rounded-xl overflow-hidden aspect-square border border-stone-300 dark:border-stone-700 bg-stone-200 dark:bg-stone-800"
                        >
                          <img
                            src={item.previewUrl}
                            alt="preview"
                            className="w-full h-full object-cover"
                          />
                          <span className="absolute bottom-1 left-1 bg-black/70 text-[9px] text-white px-1.5 py-0.5 rounded font-bold">
                            #{idx + 1}
                          </span>
                          {!isBulkUploading && (
                            <button
                              type="button"
                              onClick={() => removeBulkFile(item.id)}
                              className="absolute top-1 right-1 p-1 bg-rose-600 text-white rounded-md hover:bg-rose-700 opacity-0 group-hover:opacity-100 transition cursor-pointer"
                            >
                              <Trash2 className="w-3 h-3" />
                            </button>
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                )}

                {/* Upload Progress Indicator */}
                {isBulkUploading && bulkUploadProgress && (
                  <div className="p-4 bg-emerald-50 dark:bg-emerald-950/60 border border-emerald-300 dark:border-emerald-800 rounded-2xl space-y-2 animate-in fade-in duration-200">
                    <div className="flex items-center justify-between text-xs font-bold text-emerald-900 dark:text-emerald-200">
                      <span className="flex items-center gap-2">
                        <Loader2 className="w-4 h-4 animate-spin text-emerald-600 dark:text-emerald-400" />
                        <span>
                          ඡායාරූපය {bulkUploadProgress.current} / {bulkUploadProgress.total} උඩුගත වෙමින් පවතී...
                        </span>
                      </span>
                      <span className="font-mono font-bold text-sm">{bulkUploadProgress.percent}%</span>
                    </div>
                    <div className="w-full bg-emerald-200 dark:bg-stone-800 h-2.5 rounded-full overflow-hidden p-0.5 shadow-inner">
                      <div
                        className="bg-gradient-to-r from-emerald-500 to-emerald-600 h-full rounded-full transition-all duration-150"
                        style={{ width: `${bulkUploadProgress.percent}%` }}
                      />
                    </div>
                    <div className="flex items-center justify-between text-[10px] text-stone-600 dark:text-stone-400 font-mono">
                      <span className="truncate max-w-[200px]">📸 {bulkUploadProgress.currentFileName}</span>
                      {bulkUploadProgress.loadedFormatted && (
                        <span className="font-bold text-emerald-800 dark:text-emerald-300">
                          {bulkUploadProgress.loadedFormatted} / {bulkUploadProgress.totalFormatted} ({bulkUploadProgress.loadedBytes?.toLocaleString()} Bytes)
                        </span>
                      )}
                    </div>
                  </div>
                )}

                {/* Footer Buttons */}
                <div className="flex items-center justify-end gap-2 pt-3 border-t border-stone-200 dark:border-stone-800">
                  <button
                    type="button"
                    disabled={isBulkUploading}
                    onClick={() => setIsBulkModalOpen(false)}
                    className="px-4 py-2.5 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl cursor-pointer disabled:opacity-50"
                  >
                    අවලංගු කරන්න
                  </button>
                  <button
                    type="submit"
                    disabled={isBulkUploading || bulkFiles.length === 0}
                    className="px-6 py-2.5 bg-emerald-700 hover:bg-emerald-800 text-white font-bold rounded-xl cursor-pointer disabled:opacity-50 flex items-center gap-2 shadow-md"
                  >
                    {isBulkUploading ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin" />
                        <span>Upload වෙමින් පවතී...</span>
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="w-4 h-4" />
                        <span>ඡායාරූප {bulkFiles.length} එකවර Upload කරන්න</span>
                      </>
                    )}
                  </button>
                </div>
              </form>
            </div>
          </div>,
          document.body
        )}

      {/* Delete Confirmation Modal */}
      <ConfirmModal
        isOpen={Boolean(deleteTargetId)}
        onClose={() => setDeleteTargetId(null)}
        onConfirm={handleConfirmDelete}
        title="ඡායාරූපය ඉවත් කිරීම"
        message="මෙම ඡායාරූපය ගැලරියෙන් ඉවත් කිරීමට ඔබට විශ්වාසද?"
        confirmText="ඔව්, ඉවත් කරන්න"
        cancelText="අවලංගු කරන්න"
        variant="danger"
      />
    </div>
  );
};
