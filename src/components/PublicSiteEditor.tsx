import React, { useState, useEffect } from 'react';
import { usePublicSite, SiteSettings } from '../context/PublicSiteContext';
import { uploadFile, uploadFileWithProgress } from '../utils/fileUpload';
import type { NewsArticle, PirivenaEvent, GalleryItem } from '../types';
import {
  Globe,
  FileText,
  Newspaper,
  Calendar,
  Image as ImageIcon,
  BookOpen,
  CheckCircle,
  X,
  ExternalLink,
} from 'lucide-react';
import { GeneralSettingsTab } from './publicSiteEditor/GeneralSettingsTab';
import { AboutSettingsTab } from './publicSiteEditor/AboutSettingsTab';
import { NewsEditorTab } from './publicSiteEditor/NewsEditorTab';
import { EventsEditorTab } from './publicSiteEditor/EventsEditorTab';
import { GalleryEditorTab } from './publicSiteEditor/GalleryEditorTab';
import { LibraryEditorTab } from './publicSiteEditor/LibraryEditorTab';

interface PublicSiteEditorProps {
  forcedTab?: 'general' | 'about' | 'news' | 'events' | 'gallery' | 'library';
}

export const PublicSiteEditor: React.FC<PublicSiteEditorProps> = ({ forcedTab }) => {
  const {
    siteSettings,
    updateSiteSettings,
    newsArticles,
    addNewsArticle,
    updateNewsArticle,
    deleteNewsArticle,
    events,
    addEvent,
    updateEvent,
    deleteEvent,
    galleryItems,
    addGalleryItem,
    updateGalleryItem,
    deleteGalleryItem,
    libraryBooks,
    addLibraryBook,
    updateLibraryBook,
    deleteLibraryBook,
  } = usePublicSite();

  const [activeTab, setActiveTab] = useState<
    'general' | 'about' | 'news' | 'events' | 'gallery' | 'library'
  >(() => {
    if (forcedTab) return forcedTab;
    try {
      return (
        (localStorage.getItem('pirivena_public_site_editor_tab') as any) || 'news'
      );
    } catch (e) {
      return 'news';
    }
  });

  useEffect(() => {
    if (forcedTab) {
      setActiveTab(forcedTab);
    }
  }, [forcedTab]);

  useEffect(() => {
    try {
      localStorage.setItem('pirivena_public_site_editor_tab', activeTab);
    } catch (e) {}
  }, [activeTab]);

  const [saveSuccessMsg, setSaveSuccessMsg] = useState<string | null>(null);

  // Local state for Site Settings form
  const [settingsForm, setSettingsForm] = useState<SiteSettings>(siteSettings);
  const [formDirty, setFormDirty] = useState(false);

  // Sync form with API-loaded settings ONLY when user hasn't started editing
  // This prevents the 3-second polling from overwriting active user input
  useEffect(() => {
    if (!formDirty) {
      setSettingsForm(siteSettings);
    }
  }, [siteSettings, formDirty]);

  // News Modal State
  const [isNewsModalOpen, setIsNewsModalOpen] = useState(false);
  const [editingNewsId, setEditingNewsId] = useState<string | null>(null);
  const [newsForm, setNewsForm] = useState({
    title: '',
    titleSinhala: '',
    category: 'Academic' as NewsArticle['category'],
    summary: '',
    summarySinhala: '',
    content: '',
    contentSinhala: '',
    imageUrl: '',
    publishedDate: new Date().toISOString().split('T')[0],
    author: 'Pirivena Media Desk',
  });

  // Event Modal State
  const [isEventModalOpen, setIsEventModalOpen] = useState(false);
  const [editingEventId, setEditingEventId] = useState<string | null>(null);
  const [eventForm, setEventForm] = useState({
    title: '',
    titleSinhala: '',
    category: 'Religious' as PirivenaEvent['category'],
    date: new Date().toISOString().split('T')[0],
    time: '08:00 AM - 04:00 PM',
    location: 'Main Dhamma Hall',
    description: '',
    descriptionSinhala: '',
    imageUrl: '',
  });

  // Gallery Modal State
  const [isGalleryModalOpen, setIsGalleryModalOpen] = useState(false);
  const [editingGalleryId, setEditingGalleryId] = useState<string | null>(null);
  const [galleryForm, setGalleryForm] = useState({
    title: '',
    titleSinhala: '',
    type: 'photo' as 'photo' | 'video',
    url: 'https://images.unsplash.com/photo-1544717305-2782549b5136?auto=format&fit=crop&q=80&w=800',
    category: 'Events' as GalleryItem['category'],
    date: new Date().toISOString().split('T')[0],
  });

  const handleFileUploadHelper = async (
    e: React.ChangeEvent<HTMLInputElement>,
    callback: (url: string, sizeStr?: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    showNotification(`⏳ ගොනුව Upload වෙමින් පවතී... (0%)`);

    try {
      const uploadedUrl = await uploadFileWithProgress(file, (prog) => {
        showNotification(
          `⏳ Upload වෙමින් පවතී: ${prog.loadedFormatted} / ${prog.totalFormatted} (${prog.percentage}%)`
        );
      });
      const sizeMB = `${(file.size / (1024 * 1024)).toFixed(1)} MB`;
      showNotification(`✅ ගොනුව සාර්ථකව Upload විය! (${sizeMB})`);
      callback(uploadedUrl, sizeMB);
    } catch (err: any) {
      console.error('File upload error:', err);
      showNotification('❌ ගොනුව Upload කිරීමේදී දෝෂයක් සිදුවිය: ' + (err.message || 'Error'));
    }
  };

  const showNotification = (msg: string) => {
    setSaveSuccessMsg(msg);
    setTimeout(() => setSaveSuccessMsg(null), 3500);
  };

  const handleSaveSettings = (e: React.FormEvent) => {
    e.preventDefault();
    updateSiteSettings(settingsForm);
    setFormDirty(false);
    showNotification('වෙබ් අඩවි ප්‍රධාන තොරතුරු සාර්ථකව යාවත්කාලීන කරන ලදී! (Settings Saved)');
  };

  const handleSaveNews = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingNewsId) {
      updateNewsArticle(editingNewsId, newsForm);
      showNotification('පුවත සාර්ථකව යාවත්කාලීන කරන ලදී!');
    } else {
      addNewsArticle(newsForm);
      showNotification('නව පුවතක් සාර්ථකව එකතු කරන ලදී!');
    }
    setIsNewsModalOpen(false);
    setEditingNewsId(null);
  };

  const handleEditNews = (art: any) => {
    setEditingNewsId(art.id);
    setNewsForm({
      title: art.title,
      titleSinhala: art.titleSinhala || art.title,
      category: art.category,
      summary: art.summary,
      summarySinhala: art.summarySinhala || art.summary,
      content: art.content,
      contentSinhala: art.contentSinhala || art.content,
      imageUrl: art.imageUrl,
      publishedDate: art.publishedDate,
      author: art.author,
    });
    setIsNewsModalOpen(true);
  };

  const handleSaveEvent = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingEventId) {
      updateEvent(editingEventId, eventForm);
      showNotification('උත්සව/කාලසටහන් තොරතුරු යාවත්කාලීන කරන ලදී!');
    } else {
      addEvent(eventForm);
      showNotification('නව උත්සවයක් සාර්ථකව එකතු කරන ලදී!');
    }
    setIsEventModalOpen(false);
    setEditingEventId(null);
  };

  const handleSaveGallery = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingGalleryId) {
      updateGalleryItem(editingGalleryId, galleryForm);
      showNotification('ඡායාරූපය/වීඩියෝ තොරතුරු සාර්ථකව යාවත්කාලීන කරන ලදී!');
    } else {
      addGalleryItem(galleryForm);
      showNotification('ඡායාරූපය/වීඩියෝව ගැලරියට එකතු කරන ලදී!');
    }
    setIsGalleryModalOpen(false);
    setEditingGalleryId(null);
  };

  useEffect(() => {
    const handleSubTabChange = (e: any) => {
      if (
        e.detail &&
        ['general', 'about', 'news', 'events', 'gallery', 'library'].includes(e.detail)
      ) {
        setActiveTab((prev) => (prev !== e.detail ? e.detail : prev));
      }
    };
    window.addEventListener('switch-site-editor-subtab', handleSubTabChange);
    return () => window.removeEventListener('switch-site-editor-subtab', handleSubTabChange);
  }, []);


  return (
    <div className="space-y-4 pb-8 select-none">
      {/* Save Success Notification */}
      {saveSuccessMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 text-emerald-900 dark:text-emerald-200 text-xs font-bold rounded-2xl flex items-center justify-between gap-2 shadow-xs animate-fade-in">
          <div className="flex items-center gap-2">
            <CheckCircle className="w-5 h-5 text-emerald-600" />
            <span>{saveSuccessMsg}</span>
          </div>
          <button
            onClick={() => setSaveSuccessMsg(null)}
            className="text-emerald-700 hover:text-emerald-950 dark:hover:text-white cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      )}

      {/* TAB CONTENT */}
      {activeTab === 'general' && (
        <GeneralSettingsTab
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          setFormDirty={setFormDirty}
          onSave={handleSaveSettings}
          showNotification={showNotification}
          updateSiteSettings={updateSiteSettings}
          handleFileUploadHelper={handleFileUploadHelper}
        />
      )}

      {activeTab === 'about' && (
        <AboutSettingsTab
          settingsForm={settingsForm}
          setSettingsForm={setSettingsForm}
          setFormDirty={setFormDirty}
          onSave={handleSaveSettings}
          showNotification={showNotification}
          updateSiteSettings={updateSiteSettings}
          handleFileUploadHelper={handleFileUploadHelper}
        />
      )}

      {activeTab === 'news' && (
        <NewsEditorTab
          newsArticles={newsArticles}
          isNewsModalOpen={isNewsModalOpen}
          setIsNewsModalOpen={setIsNewsModalOpen}
          editingNewsId={editingNewsId}
          newsForm={newsForm}
          setNewsForm={setNewsForm}
          handleEditNews={handleEditNews}
          handleSaveNews={handleSaveNews}
          deleteNewsArticle={deleteNewsArticle}
          handleFileUploadHelper={handleFileUploadHelper}
          showNotification={showNotification}
        />
      )}

      {activeTab === 'events' && (
        <EventsEditorTab
          events={events}
          isEventModalOpen={isEventModalOpen}
          setIsEventModalOpen={setIsEventModalOpen}
          editingEventId={editingEventId}
          setEditingEventId={setEditingEventId}
          eventForm={eventForm}
          setEventForm={setEventForm}
          handleSaveEvent={handleSaveEvent}
          deleteEvent={deleteEvent}
          handleFileUploadHelper={handleFileUploadHelper}
          showNotification={showNotification}
        />
      )}

      {activeTab === 'gallery' && (
        <GalleryEditorTab
          galleryItems={galleryItems}
          isGalleryModalOpen={isGalleryModalOpen}
          setIsGalleryModalOpen={setIsGalleryModalOpen}
          editingGalleryId={editingGalleryId}
          setEditingGalleryId={setEditingGalleryId}
          galleryForm={galleryForm}
          setGalleryForm={setGalleryForm}
          handleSaveGallery={handleSaveGallery}
          deleteGalleryItem={deleteGalleryItem}
          addGalleryItem={addGalleryItem}
          updateGalleryItem={updateGalleryItem}
          handleFileUploadHelper={handleFileUploadHelper}
          showNotification={showNotification}
        />
      )}

      {activeTab === 'library' && (
        <LibraryEditorTab
          libraryBooks={libraryBooks}
          addLibraryBook={addLibraryBook}
          updateLibraryBook={updateLibraryBook}
          deleteLibraryBook={deleteLibraryBook}
          handleFileUploadHelper={handleFileUploadHelper}
          showNotification={showNotification}
        />
      )}
    </div>
  );
};
