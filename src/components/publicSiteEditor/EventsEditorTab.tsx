import React, { useState, useMemo } from 'react';
import { createPortal } from 'react-dom';
import { Calendar, Plus, Edit3, Trash2, X, Filter, Upload, Image as ImageIcon, Loader2 } from 'lucide-react';
import { ConfirmModal } from '../ConfirmModal';
import { getSriLankaDateString } from '../../utils/sriLankaTime';
import { uploadFileWithProgress, type UploadProgressInfo } from '../../utils/fileUpload';

interface EventsEditorTabProps {
  events: any[];
  isEventModalOpen: boolean;
  setIsEventModalOpen: (open: boolean) => void;
  editingEventId: string | null;
  setEditingEventId: (id: string | null) => void;
  eventForm: any;
  setEventForm: React.Dispatch<React.SetStateAction<any>>;
  handleSaveEvent: (e: React.FormEvent) => void;
  deleteEvent: (id: string) => void;
  handleFileUploadHelper?: (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string, sizeStr?: string) => void
  ) => void;
  showNotification: (msg: string) => void;
}

export const EventsEditorTab: React.FC<EventsEditorTabProps> = ({
  events,
  isEventModalOpen,
  setIsEventModalOpen,
  editingEventId,
  setEditingEventId,
  eventForm,
  setEventForm,
  handleSaveEvent,
  deleteEvent,
  handleFileUploadHelper,
  showNotification,
}) => {
  const [deleteTargetId, setDeleteTargetId] = useState<string | null>(null);
  const [isCustomCategoryMode, setIsCustomCategoryMode] = useState<boolean>(false);
  const [selectedFilterCategory, setSelectedFilterCategory] = useState<string>('all');
  const [eventPhotoProgress, setEventPhotoProgress] = useState<UploadProgressInfo | null>(null);
  const [isUploadingPhoto, setIsUploadingPhoto] = useState<boolean>(false);

  // Extract all unique categories dynamically
  const dynamicCategories = useMemo(() => {
    const defaultCats = ['Religious', 'Academic', 'Cultural', 'Special'];
    const catSet = new Set<string>(defaultCats);
    events.forEach((ev) => {
      if (ev.category && ev.category.trim() !== '') {
        catSet.add(ev.category.trim());
      }
    });
    return Array.from(catSet);
  }, [events]);

  // Filter events by category
  const filteredEvents = useMemo(() => {
    if (selectedFilterCategory === 'all') return events;
    return events.filter((ev) => ev.category === selectedFilterCategory);
  }, [events, selectedFilterCategory]);

  const handleConfirmDelete = () => {
    if (deleteTargetId) {
      deleteEvent(deleteTargetId);
      showNotification('උත්සව තොරතුරු ඉවත් කරන ලදී');
      setDeleteTargetId(null);
    }
  };

  return (
    <div className="bg-white dark:bg-stone-900 border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 sm:p-7 shadow-[0_8px_30px_rgba(0,0,0,0.06)] space-y-5 text-slate-900 dark:text-white select-none">
      <div className="flex flex-row items-center justify-between gap-3 border-b border-slate-100 dark:border-stone-800 pb-4">
        <h2 className="text-base sm:text-lg font-black text-slate-900 dark:text-white flex items-center gap-2">
          <Calendar className="w-5 h-5 text-amber-600 dark:text-amber-400" />
          <span>උත්සව & දින දර්ශනය ({events.length})</span>
        </h2>

        <button
          onClick={() => {
            setEditingEventId(null);
            setEventForm({
              title: '',
              titleSinhala: '',
              category: dynamicCategories[0] || 'Religious',
              date: getSriLankaDateString(),
              time: '08:00 AM - 04:00 PM',
              location: 'ශ්‍රී සුමන මහා පිරිවෙන් ශාලාව',
              description: '',
              descriptionSinhala: '',
            });
            setIsCustomCategoryMode(false);
            setIsEventModalOpen(true);
          }}
          className="px-5 py-2.5 bg-slate-900 hover:bg-slate-800 dark:bg-white dark:hover:bg-slate-100 text-white dark:text-slate-900 font-black text-xs rounded-2xl shadow-md flex items-center gap-1.5 cursor-pointer active:scale-95 shrink-0"
        >
          <Plus className="w-4 h-4" />
          <span> නව උත්සවයක්</span>
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
              ? 'bg-slate-900 dark:bg-white text-white dark:text-slate-900 shadow-sm font-black'
              : 'bg-slate-100 dark:bg-stone-800 text-slate-700 dark:text-slate-300 hover:bg-slate-200'
            }`}
        >
          සියල්ල ({events.length})
        </button>

        {dynamicCategories.map((cat) => {
          const count = events.filter((e) => e.category === cat).length;
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

      {filteredEvents.length === 0 ? (
        <div className="text-center py-10 border-2 border-dashed border-slate-200 dark:border-stone-800 rounded-3xl p-6 bg-slate-50 dark:bg-stone-800/40 space-y-2">
          <p className="text-sm font-bold text-slate-600 dark:text-slate-300">
            මෙම වර්ගීකරණය යටතේ උත්සව හෝ කාලසටහන් නොමැත
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredEvents.map((ev) => (
            <div
              key={ev.id}
              className="border border-slate-200/90 dark:border-stone-800 rounded-3xl p-5 bg-slate-50/80 dark:bg-stone-800/60 space-y-3 flex flex-col justify-between shadow-2xs hover:border-slate-300 dark:hover:border-stone-700 transition"
            >
              <div>
                <div className="flex items-center justify-between text-xs text-slate-500 dark:text-slate-400 mb-2">
                  <span className="px-2.5 py-0.5 bg-amber-500/10 text-amber-700 dark:text-amber-300 border border-amber-500/20 font-bold rounded-lg text-[10px] uppercase">
                    {ev.category}
                  </span>
                  <span className="font-bold text-slate-900 dark:text-white">{ev.date}</span>
                </div>
                <h3 className="font-serif font-black text-base text-slate-900 dark:text-white">
                  {ev.titleSinhala || ev.title}
                </h3>
                <p className="text-xs text-slate-600 dark:text-slate-400 line-clamp-2 mt-1">
                  {ev.descriptionSinhala || ev.description}
                </p>
                <div className="text-[11px] text-slate-500 dark:text-slate-400 mt-2 font-medium">
                  📍 {ev.location} | ⏰ {ev.time}
                </div>
              </div>

              <div className="flex items-center justify-end gap-2 pt-3 border-t border-slate-200/80 dark:border-stone-700">
                <button
                  onClick={() => {
                    setEditingEventId(ev.id);
                    setEventForm({
                      title: ev.title,
                      titleSinhala: ev.titleSinhala || ev.title,
                      category: ev.category,
                      date: ev.date,
                      time: ev.time,
                      location: ev.location,
                      description: ev.description,
                      descriptionSinhala: ev.descriptionSinhala || ev.description,
                      imageUrl: ev.imageUrl || '',
                    });
                    setIsCustomCategoryMode(false);
                    setIsEventModalOpen(true);
                  }}
                  className="px-3 py-1.5 bg-slate-200/80 hover:bg-slate-300 dark:bg-stone-700 dark:hover:bg-stone-600 text-slate-800 dark:text-white font-bold text-xs rounded-xl flex items-center gap-1.5 transition cursor-pointer active:scale-95"
                >
                  <Edit3 className="w-3.5 h-3.5" />
                  <span>සංස්කරණය</span>
                </button>
                <button
                  onClick={() => setDeleteTargetId(ev.id)}
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

      {/* EVENT MODAL */}
      {isEventModalOpen &&
        typeof document !== 'undefined' &&
        createPortal(
          <div className="fixed inset-0 z-[999999] flex items-center justify-center bg-black/75 backdrop-blur-md p-4 overflow-y-auto">
            <div className="bg-white dark:bg-stone-900 text-stone-900 dark:text-stone-100 rounded-3xl p-6 sm:p-8 max-w-xl w-full max-h-[92vh] overflow-y-auto space-y-4 shadow-2xl border-2 border-amber-500 animate-fade-in my-auto">
              <div className="flex items-center justify-between border-b border-amber-200 dark:border-stone-800 pb-3">
                <h3 className="font-serif font-bold text-lg text-amber-950 dark:text-amber-100">
                  {editingEventId ? 'උත්සවය සංස්කරණය කරන්න' : 'නව උත්සවයක් එකතු කරන්න'}
                </h3>
                <button
                  type="button"
                  onClick={() => setIsEventModalOpen(false)}
                  className="w-8 h-8 rounded-full bg-slate-100 dark:bg-stone-800 text-slate-500 hover:text-slate-900 dark:hover:text-white flex items-center justify-center font-bold text-sm cursor-pointer"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <form onSubmit={handleSaveEvent} className="space-y-4 text-xs">
                <div>
                  <label
                    htmlFor="eventseditortab-titleSinhala"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    උත්සවයේ නම (Sinhala Title)
                  </label>
                  <input
                    autoComplete="name"
                    id="eventseditortab-titleSinhala"
                    name="titleSinhala"
                    type="text"
                    value={eventForm.titleSinhala || ''}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
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
                        htmlFor="eventseditortab-category-label"
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
                        id="eventseditortab-custom-category"
                        name="category"
                        type="text"
                        placeholder="අලුත් වර්ගීකරණය ඇතුළත් කරන්න"
                        value={eventForm.category || ''}
                        onChange={(e) => setEventForm({ ...eventForm, category: e.target.value })}
                        className="w-full p-2.5 rounded-xl border-2 border-amber-500 bg-amber-50/50 dark:bg-stone-800 font-bold text-amber-950 dark:text-amber-100"
                        autoFocus
                      />
                    ) : (
                      <select
                        autoComplete="off"
                        id="eventseditortab-select-category"
                        name="category"
                        value={eventForm.category || ''}
                        onChange={(e) => {
                          if (e.target.value === 'ADD_CUSTOM_CATEGORY') {
                            setIsCustomCategoryMode(true);
                          } else {
                            setEventForm({ ...eventForm, category: e.target.value });
                          }
                        }}
                        className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 font-medium"
                      >
                        {dynamicCategories.map((cat) => (
                          <option key={cat} value={cat}>
                            {cat}
                          </option>
                        ))}
                        {eventForm.category && !dynamicCategories.includes(eventForm.category) && (
                          <option value={eventForm.category}>✨ {eventForm.category}</option>
                        )}
                        <option value="ADD_CUSTOM_CATEGORY">✏️ කැමති අලුත් වර්ගයක් ලියන්න (New Category)...</option>
                      </select>
                    )}
                  </div>

                  <div>
                    <label
                      htmlFor="eventseditortab-date"
                      className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                    >
                      දිනය (Date)
                    </label>
                    <input
                      autoComplete="name"
                      id="eventseditortab-date"
                      name="date"
                      type="date"
                      value={eventForm.date || ''}
                      onChange={(e) => setEventForm({ ...eventForm, date: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                      required
                    />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label
                      htmlFor="eventseditortab-time"
                      className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                    >
                      වේලාව (Time)
                    </label>
                    <input
                      autoComplete="name"
                      id="eventseditortab-time"
                      name="time"
                      type="text"
                      placeholder="උදා: 08:30 AM"
                      value={eventForm.time || ''}
                      onChange={(e) => setEventForm({ ...eventForm, time: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>

                  <div>
                    <label
                      htmlFor="eventseditortab-location"
                      className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                    >
                      ස්ථානය (Location)
                    </label>
                    <input
                      autoComplete="name"
                      id="eventseditortab-location"
                      name="location"
                      type="text"
                      placeholder="උදා: ප්‍රධාන ශාලාව"
                      value={eventForm.location || ''}
                      onChange={(e) => setEventForm({ ...eventForm, location: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    />
                  </div>
                </div>

                <div>
                  <label className="block font-bold text-amber-950 dark:text-amber-200 mb-1">
                    උත්සව ඡායාරූපය / බැනරය (Event Banner / Photo URL)
                  </label>
                  <div className="flex gap-2 items-center">
                    <input id="eventseditortab-input-7" name="eventseditortab-input-7"
                      type="text"
                      placeholder="උදා: https://... හෝ Upload කරන්න"
                      value={eventForm.imageUrl || ''}
                      onChange={(e) => setEventForm({ ...eventForm, imageUrl: e.target.value })}
                      className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800 text-xs"
                    />
                    <label className="px-3.5 py-2.5 bg-amber-800 hover:bg-amber-900 text-white rounded-xl font-bold cursor-pointer flex items-center gap-1 shrink-0 transition active:scale-95 shadow-xs">
                      {isUploadingPhoto ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Upload className="w-4 h-4" />
                      )}
                      <span>{isUploadingPhoto ? 'උඩුගත වෙමින්...' : 'Upload'}</span>
                      <input id="eventseditortab-input-8" name="file_8"
                        type="file"
                        accept="image/*"
                        disabled={isUploadingPhoto}
                        className="hidden"
                        onChange={async (e) => {
                          const file = e.target.files?.[0];
                          if (file) {
                            try {
                              setIsUploadingPhoto(true);
                              setEventPhotoProgress(null);
                              showNotification('උත්සව ඡායාරූපය Upload වෙමින් පවතී...');
                              const url = await uploadFileWithProgress(file, (prog) => {
                                setEventPhotoProgress(prog);
                              });
                              if (url) {
                                setEventForm((prev: any) => ({ ...prev, imageUrl: url }));
                                showNotification('✅ උත්සව ඡායාරූපය සාර්ථකව Upload විය!');
                              }
                            } catch (err) {
                              showNotification('❌ ඡායාරූපය Upload දෝෂයක් මතු විය.');
                            } finally {
                              setIsUploadingPhoto(false);
                              setEventPhotoProgress(null);
                            }
                          }
                        }}
                      />
                    </label>
                  </div>

                  {/* Event Photo Upload Live Progress Indicator */}
                  {isUploadingPhoto && eventPhotoProgress && (
                    <div className="mt-2 p-3 bg-amber-500/10 dark:bg-stone-800 border border-amber-500/40 rounded-xl space-y-2 animate-in fade-in duration-200">
                      <div className="flex justify-between items-center font-bold text-xs text-slate-900 dark:text-white">
                        <span className="flex items-center gap-1.5">
                          <Loader2 className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400 animate-spin" />
                          <span>ඡායාරූපය සර්වර් වෙත උඩුගත වෙමින් පවතී...</span>
                        </span>
                        <span className="font-mono text-amber-700 dark:text-amber-300 font-bold">{eventPhotoProgress.percentage}%</span>
                      </div>
                      <div className="w-full bg-slate-200 dark:bg-stone-700 h-2 rounded-full overflow-hidden p-0.5">
                        <div
                          className="bg-gradient-to-r from-amber-500 to-amber-600 h-full rounded-full transition-all duration-150"
                          style={{ width: `${eventPhotoProgress.percentage}%` }}
                        />
                      </div>
                      <div className="flex justify-between text-[10px] text-slate-500 dark:text-slate-400 font-mono">
                        <span>උඩුගත ප්‍රමාණය:</span>
                        <span className="font-bold text-amber-800 dark:text-amber-300">
                          {eventPhotoProgress.loadedFormatted} / {eventPhotoProgress.totalFormatted} ({eventPhotoProgress.loaded.toLocaleString()} Bytes)
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label
                    htmlFor="eventseditortab-descriptionSinhala"
                    className="block font-bold text-amber-950 dark:text-amber-200 mb-1"
                  >
                    උත්සවයේ විස්තරය (Description)
                  </label>
                  <textarea
                    autoComplete="name"
                    id="eventseditortab-descriptionSinhala"
                    name="descriptionSinhala"
                    rows={3}
                    value={eventForm.descriptionSinhala || ''}
                    onChange={(e) =>
                      setEventForm({
                        ...eventForm,
                        descriptionSinhala: e.target.value,
                        description: e.target.value,
                      })
                    }
                    className="w-full p-2.5 rounded-xl border border-amber-300 dark:border-stone-700 bg-white dark:bg-stone-800"
                    placeholder="උත්සවය පිළිබඳ විස්තර මෙතැන ලියන්න..."
                  />
                </div>

                <div className="flex justify-end gap-2 pt-3 border-t border-amber-200 dark:border-stone-800">
                  <button
                    type="button"
                    onClick={() => setIsEventModalOpen(false)}
                    className="px-4 py-2 bg-stone-200 dark:bg-stone-800 hover:bg-stone-300 dark:hover:bg-stone-700 text-stone-800 dark:text-stone-200 font-bold rounded-xl cursor-pointer"
                  >
                    අවලංගු කරන්න
                  </button>
                  <button
                    type="submit"
                    className="px-5 py-2 bg-amber-800 hover:bg-amber-900 text-white font-bold rounded-xl cursor-pointer shadow-xs"
                  >
                    {editingEventId ? 'වෙනස්කම් සුරකින්න' : 'උත්සවය එකතු කරන්න'}
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
        title="උත්සව තොරතුරු ඉවත් කිරීම"
        message="මෙම උත්සවය ලැයිස්තුවෙන් ඉවත් කිරීමට ඔබට විශ්වාසද?"
        confirmText="ඔව්, ඉවත් කරන්න"
        cancelText="අවලංගු කරන්න"
        variant="danger"
      />
    </div>
  );
};
