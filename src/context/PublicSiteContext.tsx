import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import type {
  NewsArticle,
  PirivenaEvent,
  GalleryItem,
  LibraryBook,
  OnlineAdmission,
  DonationRecord,
} from '../types';
import { contentApi, libraryApi, settingsApi } from '../api';
import { getSriLankaDateString } from '../utils/sriLankaTime';
import { setActiveAppVersion } from '../utils/appVersion';

export interface SiteSettings {
  pirivenaName: string;
  pirivenaNameSinhala: string;
  registrationNo: string;
  heroTitle: string;
  heroTitleSinhala: string;
  heroSubtitle: string;
  heroSubtitleSinhala: string;
  heroMotto: string;
  heroMottoSinhala: string;
  heroImageUrl?: string;
  heroLogoUrl?: string;
  campusImageUrl?: string;
  principalImageUrl?: string;
  bannerNotice: string;
  bannerNoticeSinhala?: string;
  bannerNoticeActive: boolean;
  bannerNoticeLink?: string;
  aboutHistory: string;
  aboutHistorySinhala: string;
  vision: string;
  visionSinhala: string;
  mission: string;
  missionSinhala: string;
  principalName: string;
  principalNameSinhala: string;
  principalTitle: string;
  principalTitleSinhala: string;
  principalMessage: string;
  principalMessageSinhala: string;
  phone: string;
  phonePrimary?: string;
  phoneSecondary?: string;
  email: string;
  address: string;
  website?: string;
  facebookUrl?: string;
  youtubeUrl?: string;
  whatsappUrl?: string;
  twitterUrl?: string;
  tiktokUrl?: string;
  telegramUrl?: string;
  googleMapEmbedUrl?: string;
  openingHours: string;
  statMonksCount?: string;
  statTeachersCount?: string;
  statExamPassRate?: string;
  statEstablishedYear?: string;
  geminiApiKey?: string;
  openRouterApiKey?: string;
  geminiConfigured?: boolean;
  openRouterConfigured?: boolean;
  activeAiProvider?: 'auto' | 'gemini' | 'openrouter' | 'local';
  primaryProvider?: string;
  fallbackProvider?: string;
  geminiModel?: string;
  openRouterModel?: string;
  bankName?: string;
  bankAccountName?: string;
  bankAccountNumber?: string;
  bankBranch?: string;
  bankSwiftCode?: string;
  admissionDeadline?: string;
  admissionIsOpen?: boolean;
  admissionNoticeSinhala?: string;

  // Global Academic Year and Term
  currentAcademicYear?: string;
  currentAcademicTerm?: string;
  currentAcademicTermSinhala?: string;

  // About Us Page Extended Customizable Fields
  aboutHeaderTag?: string;
  aboutHeaderTagSinhala?: string;
  aboutTitle?: string;
  aboutTitleSinhala?: string;
  campusImageCaption?: string;
  campusImageCaptionSinhala?: string;
  aboutHistoryTag?: string;
  aboutHistoryTagSinhala?: string;
  aboutHistoryHeading?: string;
  aboutHistoryHeadingSinhala?: string;
  aboutPillarsTitle?: string;
  aboutPillarsTitleSinhala?: string;
  aboutPillarExamCenter?: string;
  aboutPillarExamCenterSinhala?: string;
  aboutPillarResidence?: string;
  aboutPillarResidenceSinhala?: string;
  aboutPillarSmartLab?: string;
  aboutPillarSmartLabSinhala?: string;
  aboutPillarsNote?: string;
  aboutPillarsNoteSinhala?: string;

  aboutLeadershipTitle?: string;
  aboutLeadershipTitleSinhala?: string;

  vicePrincipalName?: string;
  vicePrincipalNameSinhala?: string;
  vicePrincipalTitle?: string;
  vicePrincipalTitleSinhala?: string;
  vicePrincipalBio?: string;
  vicePrincipalBioSinhala?: string;

  seniorTeacherName?: string;
  seniorTeacherNameSinhala?: string;
  seniorTeacherTitle?: string;
  seniorTeacherTitleSinhala?: string;
  seniorTeacherBio?: string;
  seniorTeacherBioSinhala?: string;
}

export const DEFAULT_SITE_SETTINGS: SiteSettings = {
  pirivenaName: 'Sri Sumana Maha Pirivena - Mudduwa',
  pirivenaNameSinhala: 'ශ්‍රී සුමන මහා පිරිවෙන - රත්නපුර මුද්දුව',
  registrationNo: 'PRV/RAT/1984',
  heroTitle: 'Sri Sumana Pirivena',
  heroTitleSinhala: 'ශ්‍රී සුමන මහා පිරිවෙන් ඩිජිටල් විද්‍යා පීඨය',
  heroSubtitle: 'Oriental Studies & Monastic Ethics Center',
  heroSubtitleSinhala: 'ත්‍රිපිටක ධර්ම, පාලි, සංස්කෘත හා ප්‍රාචීන ශාස්ත්‍රීය අධ්‍යාපන නිකේතනය',
  heroMotto: 'Preserving Theravada Dhamma & Empowering Monastic Scholars with Modern Technology.',
  heroMottoSinhala: 'ප්‍රාචීන ශාස්ත්‍රඥ භික්ෂු පරපුරක් සහ ආදර්ශමත් සාමණේර පරපුරක් බිහිකිරීම.',
  heroImageUrl: '/public.jpg',
  heroLogoUrl: '/pirivena-logo.svg',
  campusImageUrl: '/campus.jpg',
  principalImageUrl: '',
  bannerNotice: '',
  bannerNoticeSinhala: '',
  bannerNoticeActive: false,
  bannerNoticeLink: '',
  aboutHistory:
    'Established in Mudduwa, Ratnapura, Sri Sumana Maha Pirivena stands as a prestigious institution for Theravada Pali studies and Oriental languages. Recognised by the Department of Examinations and Ministry of Education.',
  aboutHistorySinhala:
    'රත්නපුර මුද්දුව ශ්‍රී සුමන මහා පිරිවෙන 1984 වර්ෂයේ ආරම්භ කර, ශ්‍රී ලංකා විභාග දෙපාර්තමේන්තුවේ හා අධ්‍යාපන අමාත්‍යාංශයේ ලියාපදිංචි ප්‍රාචීන විභාග මධ්‍යස්ථානයක් ලෙස වසර ගණනාවක් තිස්සේ ශාසනික සේවාව ඉටුකරයි.',
  vision: "To be Sri Lanka's leading center for monastic excellence and Oriental scholarship.",
  visionSinhala:
    'සම්බුද්ධ ශාසනයේ චිරස්ථිතිය උදෙසා උගත්, විනයගරුක හා සංඝ සමාජයට ආදර්ශමත් ශ්‍රේෂ්ඨ යතිවර පරපුරක් බිහිකිරීම.',
  mission:
    'Empower Buddhist monks and lay scholars with traditional Dhamma knowledge and modern digital skills.',
  missionSinhala:
    'පාලි, සංස්කෘත, ත්‍රිපිටක ධර්මය හා නූතන තොරතුරු තාක්ෂණික දැනුමෙන් පූර්ණ ධර්මධර භික්ෂු පරපුරක් උදෙසා ගුණාත්මක අධ්‍යාපනයක් ලබාදීම.',
  principalName: 'Ven. Mudduwe Dhammika Thero',
  principalNameSinhala: 'පූජ්‍ය මුද්දුවේ ධම්මික නායක හිමි',
  principalTitle: 'Chief Incumbent & Principal',
  principalTitleSinhala: 'කෘත්‍යාධිකාරී හා පරිවෙණාධිපති ස්වාමීන් වහන්සේ',
  principalMessage:
    'Welcome to Sri Sumana Maha Pirivena. We strive to nurture disciplined, knowledgeable scholars equipped for the modern world.',
  principalMessageSinhala:
    'අප ශ්‍රී සුමන මහා පිරිවෙන් ඩිජිටල් අවකාශයට ඔබ සියලු දෙනා සාදරයෙන් පිළිගනිමු. ශාසනික හා ශාස්ත්‍රීය උන්නතිය උදෙසා කැපවී කටයුතු කරමු.',
  phone: '+94 45 222 3450',
  phonePrimary: '+94 45 222 3450',
  phoneSecondary: '+94 77 123 4567',
  email: 'info@pirivena.edu.lk',
  address: 'Sri Sumana Maha Pirivena, Mudduwa, Ratnapura, Sri Lanka',
  website: 'https://pirivena.edu.lk',
  facebookUrl: 'https://facebook.com',
  youtubeUrl: 'https://youtube.com',
  whatsappUrl: 'https://wa.me/94771234567',
  twitterUrl: 'https://twitter.com',
  tiktokUrl: 'https://tiktok.com',
  telegramUrl: 'https://t.me/pirivena',
  googleMapEmbedUrl: 'https://maps.google.com/maps?q=Sri+Sumana+Maha+Pirivena,+Mudduwa,+Ratnapura&t=&z=14&ie=UTF8&iwloc=&output=embed',
  openingHours: 'Monday - Saturday: 7:30 AM - 4:30 PM',
  statMonksCount: '150+',
  statTeachersCount: '25+',
  statExamPassRate: '98.5%',
  statEstablishedYear: '1984',
  geminiApiKey: '',
  openRouterApiKey: '',
  activeAiProvider: 'auto',
  bankName: 'Bank of Ceylon (BOC)',
  bankAccountName: 'Sri Sumana Maha Pirivena Development Trust',
  bankAccountNumber: '000789456123',
  bankBranch: 'Ratnapura Main Branch',
  bankSwiftCode: 'BCEYLKLX',
  admissionDeadline: '2026-08-31',
  admissionIsOpen: true,
  admissionNoticeSinhala:
    '2026 අධ්‍යයන වර්ෂය සඳහා සාමණේර හිමිවරුන් හා ගිහි සිසුන් ඇතුළත් කරගැනීමේ අයදුම්පත් භාරගැනීම සක්‍රීයයි.',
  currentAcademicYear: '2026',
  currentAcademicTerm: 'Term 1',
  currentAcademicTermSinhala: 'ප්‍රථම වාරය (1st Term)',
  aboutHeaderTag: 'Institutional Overview',
  aboutHeaderTagSinhala: 'ආයතනික හැඳින්වීම',
  aboutTitle: 'About Our Institution',
  aboutTitleSinhala: 'අපගේ ආයතනය පිළිබඳව',
  campusImageCaption: 'Sri Sumana Pirivena Central Campus (Mudduwa, Ratnapura)',
  campusImageCaptionSinhala: 'ශ්‍රී සුමන මහා පිරිවෙන් මධ්‍යම පරිශ්‍රය (මුද්දුව, රත්නපුර)',
  aboutHistoryTag: 'Monastic Lineage & History',
  aboutHistoryTagSinhala: 'පිරිවෙන් ශාසනික ඉතිහාසය',
  aboutHistoryHeading: 'Our Noble History',
  aboutHistoryHeadingSinhala: 'අපගේ අභිමානවත් ඉතිහාසය',
  aboutPillarsTitle: 'Key Institutional Pillars',
  aboutPillarsTitleSinhala: 'ප්‍රධාන ආයතනික අංග',
  aboutPillarExamCenter: 'Full Pracheena Examination Center (Prarambha, Madhyama, Final)',
  aboutPillarExamCenterSinhala: 'පූර්ණ ප්‍රාචීන විභාග මධ්‍යස්ථානය (ප්‍රාරම්භ, මධ්‍යම, අවසාන)',
  aboutPillarResidence: 'Dedicated Monastic Residence & Alms Hall',
  aboutPillarResidenceSinhala: 'නාවාසික ආරාම සංකීර්ණය හා දාන ශාලාව',
  aboutPillarSmartLab: 'Smart Computer Lab & Digital Tripitaka Library',
  aboutPillarSmartLabSinhala: 'ස්මාර්ට් පරිගණක විද්‍යාගාරය හා ඩිජිටල් ත්‍රිපිටක පුස්තකාලය',
  aboutPillarsNote: 'Fostering classical Pali, Sanskrit, and Theravada Buddhist scholarship for monks & lay students.',
  aboutPillarsNoteSinhala: 'සාමණේර හිමිවරුන් සහ ගිහි සිසුන් උදෙසා උසස් බෞද්ධ හා සාම්ප්‍රදායික ශාස්ත්‍රීය අධ්‍යාපනය.',
  aboutLeadershipTitle: 'Monastic Leadership & Administration',
  aboutLeadershipTitleSinhala: 'පිරිවෙන් ආචාර්ය හා පාලක මණ්ඩලය',
  vicePrincipalName: 'Ven. Mudduwe Dhammika Thero',
  vicePrincipalNameSinhala: 'පූජ්‍ය මුද්දුවේ ධම්මික හිමි',
  vicePrincipalTitle: 'Vice Principal & Registrar',
  vicePrincipalTitleSinhala: 'නියෝජ්‍ය පරිවේණාධිපති හා ලේඛකාධිකාරී',
  vicePrincipalBio: 'MA in Buddhist Studies. Overseeing academic examinations, student discipline, and administrative operations.',
  vicePrincipalBioSinhala: 'බෞද්ධ අධ්‍යයන ශාස්ත්‍රපති. අධ්‍යයන කටයුතු, ශිෂ්‍ය විනය හා පාලන කටයුතු භාරව.',
  seniorTeacherName: 'Ven. Sabaragamuwe Sumanasara Thero',
  seniorTeacherNameSinhala: 'පූජ්‍ය සබරගමුවේ සුමනසාර හිමි',
  seniorTeacherTitle: 'Senior Head of Pali & Tripitaka',
  seniorTeacherTitleSinhala: 'පාලි හා ත්‍රිපිටක අංශ භාර ජ්‍යෙෂ්ඨ ආචාර්ය',
  seniorTeacherBio: 'Expert in Pali Grammar (Balawatara) and Abhidhammattha Sangaha. Master of classical monastic chant.',
  seniorTeacherBioSinhala: 'පාලි ව්‍යාකරණ (බාලාවතාර) හා අභිධර්මත්‍ථ සංග්‍රහය පිළිබඳ ප්‍රවීණ. පිරිවෙන් පාලි භාෂා ප්‍රධාන.',
};

interface PublicSiteContextType {
  siteSettings: SiteSettings;
  updateSiteSettings: (settings: Partial<SiteSettings>) => void;
  newsArticles: NewsArticle[];
  addNewsArticle: (article: Omit<NewsArticle, 'id'>) => void;
  updateNewsArticle: (id: string, article: Partial<NewsArticle>) => void;
  deleteNewsArticle: (id: string) => void;
  events: PirivenaEvent[];
  addEvent: (event: Omit<PirivenaEvent, 'id'>) => void;
  updateEvent: (id: string, event: Partial<PirivenaEvent>) => void;
  deleteEvent: (id: string) => void;
  galleryItems: GalleryItem[];
  addGalleryItem: (item: Omit<GalleryItem, 'id'>) => void;
  updateGalleryItem: (id: string, item: Partial<GalleryItem>) => void;
  deleteGalleryItem: (id: string) => void;
  libraryBooks: LibraryBook[];
  addLibraryBook: (book: Omit<LibraryBook, 'id'>) => void;
  updateLibraryBook: (id: string, book: Partial<LibraryBook>) => void;
  deleteLibraryBook: (id: string) => void;
  admissions: OnlineAdmission[];
  addAdmission: (admission: Omit<OnlineAdmission, 'id' | 'dateSubmitted' | 'status'>) => void;
  updateAdmissionStatus: (id: string, status: 'approved' | 'rejected') => void;
  deleteAdmission: (id: string) => void;
  donations: DonationRecord[];
  addDonation: (donation: DonationRecord) => void;
  updateDonationStatus: (id: string, status: 'approved' | 'rejected') => void;
  deleteDonation: (id: string) => void;
  refreshAllData: () => Promise<void>;
  resetToDefaults: () => void;
  isLoadingData: boolean;
}

const PublicSiteContext = createContext<PublicSiteContextType | undefined>(undefined);

export const triggerRealtimeSync = () => {
  if (typeof window !== 'undefined') {
    window.dispatchEvent(new CustomEvent('site-data-updated'));
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        const bc = new BroadcastChannel('pirivena_realtime_channel');
        bc.postMessage('site-data-updated');
        bc.close();
      } catch (e) {}
    }
  }
};

export const PublicSiteProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [siteSettings, setSiteSettings] = useState<SiteSettings>(() => {
    try {
      const saved = localStorage.getItem('pirivena_site_settings');
      return saved ? { ...DEFAULT_SITE_SETTINGS, ...JSON.parse(saved) } : DEFAULT_SITE_SETTINGS;
    } catch (e) {
      return DEFAULT_SITE_SETTINGS;
    }
  });
  const [newsArticles, setNewsArticles] = useState<NewsArticle[]>([]);
  const [events, setEvents] = useState<PirivenaEvent[]>([]);
  const [galleryItems, setGalleryItems] = useState<GalleryItem[]>([]);
  const [libraryBooks, setLibraryBooks] = useState<LibraryBook[]>([]);
  const [admissions, setAdmissions] = useState<OnlineAdmission[]>([]);
  const [donations, setDonations] = useState<DonationRecord[]>([]);
  const [isLoadingData, setIsLoadingData] = useState<boolean>(false);
  const isRefreshingRef = useRef(false);

  // Fast helper to prevent unnecessary re-renders when polled data is truly unchanged
  const isDataEqual = (a: any, b: any): boolean => {
    if (a === b) return true;
    if (!a || !b) return false;
    if (Array.isArray(a) && Array.isArray(b)) {
      if (a.length !== b.length) return false;
      if (a.length === 0) return true;
      const firstA = a[0];
      const firstB = b[0];
      const lastA = a[a.length - 1];
      const lastB = b[b.length - 1];
      if (firstA?.id !== firstB?.id || lastA?.id !== lastB?.id) return false;
      if ((firstA?.updated_at || firstA?.createdAt) !== (firstB?.updated_at || firstB?.createdAt)) return false;
    }
    try {
      return JSON.stringify(a) === JSON.stringify(b);
    } catch {
      return false;
    }
  };

  // Fetch real-time data from Backend API on mount & auto-poll
  const refreshAllData = async () => {
    if (isRefreshingRef.current || (typeof document !== 'undefined' && document.hidden)) return;
    isRefreshingRef.current = true;
    try {
      await Promise.allSettled([
        contentApi.getAdmissions().then((data) => {
          if (Array.isArray(data)) setAdmissions((prev) => (isDataEqual(prev, data) ? prev : data));
        }),
        contentApi.getDonations().then((data) => {
          if (Array.isArray(data)) setDonations((prev) => (isDataEqual(prev, data) ? prev : data));
        }),
        contentApi.getNews().then((data) => {
          if (Array.isArray(data)) setNewsArticles((prev) => (isDataEqual(prev, data) ? prev : data));
        }),
        contentApi.getEvents().then((data) => {
          if (Array.isArray(data)) setEvents((prev) => (isDataEqual(prev, data) ? prev : data));
        }),
        contentApi.getGallery().then((data) => {
          if (Array.isArray(data)) setGalleryItems((prev) => (isDataEqual(prev, data) ? prev : data));
        }),
        libraryApi.getLibraryItems().then((data) => {
          if (Array.isArray(data)) setLibraryBooks((prev) => (isDataEqual(prev, data) ? prev : data));
        }),
        settingsApi.getSiteSettings().then((data) => {
          if (data && typeof data === 'object' && Object.keys(data).length > 0) {
            const ver = (data as any).liveUpdateVersion || (data as any).appLatestVersion;
            if (ver) {
              setActiveAppVersion(ver);
            }
            setSiteSettings((prev) => {
              const next = { ...prev, ...data };
              if (isDataEqual(prev, next)) return prev;
              try {
                localStorage.setItem('pirivena_site_settings', JSON.stringify(next));
              } catch (e) {}
              return next;
            });
          }
        }),
      ]);
    } finally {
      isRefreshingRef.current = false;
    }
  };

  useEffect(() => {
    refreshAllData();

    // Auto-poll every 90 seconds when page is active
    const interval = window.setInterval(refreshAllData, 90000);

    // Instant sync when tab or mobile screen becomes active
    const handleVisibility = () => {
      if (document.visibilityState === 'visible') {
        refreshAllData();
      }
    };
    document.addEventListener('visibilitychange', handleVisibility);
    window.addEventListener('focus', handleVisibility);

    // CustomEvent listener for in-app instant state sync
    const handleSync = () => refreshAllData();
    window.addEventListener('site-data-updated', handleSync);
    window.addEventListener('pirivena-notices-updated', handleSync);
    window.addEventListener('refresh-portal-data', handleSync);

    // BroadcastChannel for instant cross-tab real-time sync
    let bc: BroadcastChannel | null = null;
    if (typeof BroadcastChannel !== 'undefined') {
      try {
        bc = new BroadcastChannel('pirivena_realtime_channel');
        bc.onmessage = () => {
          refreshAllData();
        };
      } catch (e) {}
    }

    return () => {
      clearInterval(interval);
      document.removeEventListener('visibilitychange', handleVisibility);
      window.removeEventListener('focus', handleVisibility);
      window.removeEventListener('site-data-updated', handleSync);
      window.removeEventListener('pirivena-notices-updated', handleSync);
      window.removeEventListener('refresh-portal-data', handleSync);
      if (bc) bc.close();
    };
  }, []);

  // CRUD Handlers connected directly to Backend API
  const updateSiteSettings = (newSettings: Partial<SiteSettings>) => {
    setSiteSettings((prev) => {
      const next = { ...prev, ...newSettings };
      try {
        localStorage.setItem('pirivena_site_settings', JSON.stringify(next));
      } catch (e) {}
      return next;
    });
    settingsApi
      .updateSiteSettings(newSettings)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Site Settings PUT error:', e));
  };

  const addNewsArticle = (art: Omit<NewsArticle, 'id'>) => {
    const tempId = `news-${Date.now()}`;
    const newItem: NewsArticle = { ...art, id: tempId };
    setNewsArticles((prev) => [newItem, ...prev]);

    contentApi
      .createNews(art)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('News POST error:', e));
  };

  const updateNewsArticle = (id: string, art: Partial<NewsArticle>) => {
    setNewsArticles((prev) => prev.map((a) => (a.id === id ? { ...a, ...art } : a)));
    contentApi
      .updateNews(id, art)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('News PUT error:', e));
  };

  const deleteNewsArticle = (id: string) => {
    setNewsArticles((prev) => prev.filter((a) => a.id !== id));
    contentApi
      .deleteNews(id)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('News DELETE error:', e));
  };

  const addEvent = (ev: Omit<PirivenaEvent, 'id'>) => {
    const tempId = `ev-${Date.now()}`;
    const newItem: PirivenaEvent = { ...ev, id: tempId };
    setEvents((prev) => [newItem, ...prev]);

    contentApi
      .createEvent(ev)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Event POST error:', e));
  };

  const updateEvent = (id: string, ev: Partial<PirivenaEvent>) => {
    setEvents((prev) => prev.map((item) => (item.id === id ? { ...item, ...ev } : item)));
    contentApi
      .updateEvent(id, ev)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Event PUT error:', e));
  };

  const deleteEvent = (id: string) => {
    setEvents((prev) => prev.filter((ev) => ev.id !== id));
    contentApi
      .deleteEvent(id)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Event DELETE error:', e));
  };

  const addGalleryItem = (item: Omit<GalleryItem, 'id'>) => {
    const tempId = `gal-${Date.now()}`;
    const newItem: GalleryItem = { ...item, id: tempId };
    setGalleryItems((prev) => [newItem, ...prev]);

    contentApi
      .createGalleryItem(item)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Gallery POST error:', e));
  };

  const updateGalleryItem = (id: string, item: Partial<GalleryItem>) => {
    setGalleryItems((prev) => prev.map((g) => (g.id === id ? { ...g, ...item } : g)));
    contentApi
      .updateGalleryItem(id, item)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Gallery PUT error:', e));
  };

  const deleteGalleryItem = (id: string) => {
    setGalleryItems((prev) => prev.filter((g) => g.id !== id));
    contentApi
      .deleteGalleryItem(id)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Gallery DELETE error:', e));
  };

  const addLibraryBook = (bk: Omit<LibraryBook, 'id'>) => {
    const tempId = `bk-${Date.now()}`;
    const newItem: LibraryBook = { ...bk, id: tempId };
    setLibraryBooks((prev) => [newItem, ...prev]);

    libraryApi
      .createLibraryItem(bk)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Library POST error:', e));
  };

  const updateLibraryBook = (id: string, bk: Partial<LibraryBook>) => {
    setLibraryBooks((prev) => prev.map((b) => (b.id === id ? { ...b, ...bk } : b)));
    libraryApi
      .updateLibraryItem(id, bk)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Library PUT error:', e));
  };

  const deleteLibraryBook = (id: string) => {
    setLibraryBooks((prev) => prev.filter((b) => b.id !== id));
    libraryApi
      .deleteLibraryItem(id)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Library DELETE error:', e));
  };

  const addAdmission = (item: any) => {
    const sDate = getSriLankaDateString();
    const newRecord: OnlineAdmission = {
      id: item.id || `adm_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`,
      trackingId: item.trackingId || `ADM-2026-${Math.floor(10000 + Math.random() * 90000)}`,
      submittedDate: item.submittedDate || sDate,
      dateSubmitted: item.dateSubmitted || sDate,
      status: item.status || 'pending',
      ...item,
    };
    setAdmissions((prev) => [newRecord, ...prev.filter((a) => a.id !== newRecord.id && a.trackingId !== newRecord.trackingId)]);
    contentApi
      .createAdmission(newRecord)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Admissions POST error:', e));
  };

  const updateAdmissionStatus = (id: string, status: 'approved' | 'rejected') => {
    setAdmissions((prev) =>
      prev.map((a) => (a.id === id ? { ...a, status } : a))
    );
    contentApi
      .updateAdmissionStatus(id, status)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Admissions PATCH status error:', e));
  };

  const deleteAdmission = (id: string) => {
    setAdmissions((prev) => prev.filter((a) => a.id !== id));
    contentApi
      .deleteAdmission(id)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Admissions DELETE error:', e));
  };

  const addDonation = (donation: DonationRecord) => {
    const payload = {
      ...donation,
      amount: Number(donation.amount) || 1000,
    };
    setDonations((prev) => [payload, ...prev]);
    contentApi
      .createDonation(payload)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Donations POST error:', e));
  };

  const updateDonationStatus = (id: string, status: 'approved' | 'rejected') => {
    setDonations((prev) =>
      prev.map((d) => (d.id === id || d.receiptId === id ? { ...d, status } : d))
    );
    contentApi
      .updateDonationStatus(id, status)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Donations PATCH status error:', e));
  };

  const deleteDonation = (id: string) => {
    setDonations((prev) => prev.filter((d) => d.id !== id));
    contentApi
      .deleteDonation(id)
      .then(() => {
        refreshAllData();
        triggerRealtimeSync();
      })
      .catch((e) => console.warn('Donations DELETE error:', e));
  };

  const resetToDefaults = () => {
    setSiteSettings(DEFAULT_SITE_SETTINGS);
    refreshAllData();
  };

  return (
    <PublicSiteContext.Provider
      value={{
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
        admissions,
        addAdmission,
        updateAdmissionStatus,
        deleteAdmission,
        donations,
        addDonation,
        updateDonationStatus,
        deleteDonation,
        refreshAllData,
        resetToDefaults,
        isLoadingData,
      }}
    >
      {children}
    </PublicSiteContext.Provider>
  );
};

export const usePublicSite = () => {
  const context = useContext(PublicSiteContext);
  if (!context) {
    throw new Error('usePublicSite must be used within a PublicSiteProvider');
  }
  return context;
};
