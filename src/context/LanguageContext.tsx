import React, { createContext, useContext, useState, useEffect } from 'react';

export type Language = 'en' | 'si';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  toggleLanguage: () => void;
  t: (key: string) => string;
}

const TRANSLATIONS: Record<string, { en: string; si: string }> = {
  // Navigation Links & Header
  'nav.home': { en: 'Home', si: 'මුල් පිටුව' },
  'nav.about': { en: 'About Us', si: 'අප ගැන' },
  'nav.academic': { en: 'Academic & Curriculum', si: 'අධ්‍යයන හා විෂයමාලා' },
  'nav.news': { en: 'News & Announcements', si: 'පුවත් සහ නිවේදන' },
  'nav.events': { en: 'Events & Calendar', si: 'උත්සව සහ දින දර්ශනය' },
  'nav.gallery': { en: 'Photo Gallery', si: 'ඡායාරූප ගැලරිය' },
  'nav.library': { en: 'Digital Library & Past Papers', si: 'ඩිජිටල් පුස්තකාලය & ප්‍රශ්න පත්‍ර' },
  'nav.downloads': { en: 'Downloads & Syllabus', si: 'බාගැනීම් හා නිබන්ධන' },
  'nav.admissions': { en: 'Online Admissions', si: 'නව ශිෂ්‍ය ඇතුළත් වීම්' },
  'nav.donations': { en: 'Meritorious Donations', si: 'පින්කම් අරමුදල හා ආධාර' },
  'nav.portal': { en: 'Smart Portal Login', si: 'පද්ධතියට පිවිසෙන්න' },
  'nav.ai_assistant': { en: 'AI Dhamma Copilot', si: 'AI ධර්ම සහකාර' },
  'nav.cert_verify': { en: 'Verify Certificate / ID', si: 'සහතික සහ ID සත්‍යාපනය' },
  'nav.view_public_site': { en: 'View Public Site', si: 'ප්‍රධාන වෙබ් අඩවිය' },

  // Hero Section
  'hero.title': {
    en: 'Sri Sumana Maha Pirivena',
    si: 'ශ්‍රී සුමන මහා පිරිවෙන',
  },
  'hero.subtitle': {
    en: 'Mudduwa, Ratnapura, Sri Lanka',
    si: 'මුද්දුව, රත්නපුර, ශ්‍රී ලංකාව',
  },
  'hero.motto': {
    en: 'Premier Seat of Oriental Wisdom, Pali Literature & Theravada Buddhist Scholarship',
    si: 'පාලි සාහිත්‍යය, ත්‍රිපිටක ධර්මය හා තේරවාද බෞද්ධ අධ්‍යාපනයේ විශිෂ්ටතම කේන්ද්‍රස්ථානය',
  },
  'hero.explore_btn': { en: 'Explore Pirivena', si: 'පිරිවෙන පිළිබඳ තොරතුරු' },
  'hero.portal_btn': { en: 'Smart Monastic ERP Portal', si: 'පිරිවෙන් පාලන පද්ධතිය' },
  'hero.ai_btn': { en: 'AI Dhamma Assistant', si: 'AI ධර්ම සහායක' },

  // Portal Navigation Items
  'portal.overview': { en: 'Dashboard Overview', si: 'ප්‍රධාන පුවරුව' },
  'portal.admissions': { en: 'Online Admissions', si: 'නව ශිෂ්‍ය ඇතුළත් කිරීම්' },
  'portal.students': { en: 'Directory (Students & Staff)', si: 'සාමාජික නාමාවලිය' },
  'portal.teachers': { en: 'Teacher Staff & Mentors', si: 'ගුරු මණ්ඩලය' },
  'portal.classes': { en: 'Classes & Curriculum', si: 'පන්ති සහ විෂයමාලා' },
  'portal.exams': { en: 'Exams & Assessment Center', si: 'විභාග සහ ලකුණු වාර්තා' },
  'portal.exam_reviews': { en: 'Exam Reviews & Marks Entry', si: 'විභාග සමාලෝචන සහ ලකුණු' },
  'portal.donations_manager': { en: 'Pinkama Donations Manager', si: 'පින්කම් අරමුදල කළමනාකරණය' },
  'portal.site_editor': { en: 'Public Site Content Editor', si: 'වෙබ් අඩවි සංස්කාරකය' },
  'portal.site_news': { en: 'News & Announcements', si: 'පුවත් සහ නිවේදන' },
  'portal.site_events': { en: 'Events & Calendar', si: 'උත්සව & දින දර්ශනය' },
  'portal.site_gallery': { en: 'Photo Gallery Management', si: 'ඡායාරූප ගැලරිය' },
  'portal.site_library': { en: 'Digital Library & Papers', si: 'ඩිජිටල් පුස්තකාලය' },
  'portal.site_about': { en: 'About Us Content Settings', si: 'අප ගැන විස්තර සංස්කාරකය' },
  'portal.audit': { en: 'Security Audit Trail', si: 'ආරක්ෂක සටහන් සහ Logs' },
  'portal.settings': { en: 'System & Security Settings', si: 'පද්ධති සැකසුම්' },
  'portal.app_info': { en: 'App Info & Developer Profile', si: 'පද්ධති හා සංවර්ධක තොරතුරු' },

  // Teacher Portal Specific
  'teacher.timetable': { en: 'My Weekly Timetable', si: 'මගේ කාලසටහන' },
  'teacher.roster': { en: 'Class Student Roster', si: 'ශිෂ්‍ය නාමාවලිය' },
  'teacher.exams': { en: 'Exam & Test Management', si: 'විභාග කළමනාකරණය' },
  'teacher.resources': { en: 'Study Materials & Resources', si: 'අධ්‍යයන නිබන්ධන & සටහන්' },

  // Student Portal Specific
  'student.dashboard': { en: 'Student Dashboard', si: 'මගේ ප්‍රධාන පුවරුව' },
  'student.exams': { en: 'Exam Schedule & Hall Pass', si: 'විභාග කාලසටහන' },
  'student.results': { en: 'Exam Results & Term Reports', si: 'විභාග ප්‍රතිඵල සහ ලකුණු' },
  'student.library': { en: 'Digital Library & E-Books', si: 'ඩිජිටල් පුස්තකාලය' },
  'student.qr_card': { en: 'My Digital Student ID', si: 'මගේ QR ශිෂ්‍ය හැඳුනුම්පත' },
  'student.report_card': { en: 'Term Report Card', si: 'වාර ප්‍රගති වාර්තාව' },

  // Stats Counters
  'stats.students': { en: 'Enrolled Novices & Students', si: 'සාමණේර හිමිවරු හා ශිෂ්‍යයන්' },
  'stats.teachers': { en: 'Academic Teaching Staff', si: 'ගුරු මණ්ඩලය' },
  'stats.pass_rate': { en: 'Pracheena Exam Pass Rate', si: 'ප්‍රාචීන විභාග සමත් ප්‍රතිශතය' },
  'stats.books': { en: 'Digital Books & Palm-Leaf Texts', si: 'පුස්කොළ හා දහම් පොත් එකතුව' },

  // Admissions Form
  'admissions.title': { en: 'Online Admissions 2026', si: 'නව ශිෂ්‍ය ඇතුළත් කිරීම් - 2026' },
  'admissions.subtitle': { en: 'Enroll in Sri Sumana Pirivena for Classical Buddhist & Oriental Studies', si: 'ශ්‍රී සුමන මහා පිරිවෙන වෙත නව සාමණේර සහ ගිහි සිසුන් ඇතුළත් කරගැනීමේ නිල අයදුම්පත' },
  'admissions.applicant_name': { en: 'Full Name of Applicant', si: 'අයදුම්කරුගේ සම්පූර්ණ නම' },
  'admissions.monk_name': { en: 'Monastic Name (If ordained)', si: 'පැවිදි නම (හිමිවරුන් සඳහා)' },
  'admissions.dob': { en: 'Date of Birth', si: 'උපන් දිනය' },
  'admissions.phone': { en: 'Contact Telephone Number', si: 'දුරකථන අංකය' },
  'admissions.whatsapp': { en: 'WhatsApp Mobile Number', si: 'WhatsApp අංකය' },
  'admissions.address': { en: 'Residential / Temple Address', si: 'ස්ථීර ලිපිනය / විහාරස්ථානය' },
  'admissions.district': { en: 'Administrative District', si: 'දිස්ත්‍රික්කය' },
  'admissions.guardian': { en: 'Name of Guardian / Chief Monk', si: 'භාරකරුගේ / නායක හිමියන්ගේ නම' },
  'admissions.submit_btn': { en: 'Submit Admission Application', si: 'අයදුම්පත යොමු කරන්න' },
  'admissions.reset_btn': { en: 'Fill New Application', si: 'නව අයදුම්පතක් පුරවන්න' },
  'admissions.success_title': { en: 'Application Submitted Successfully!', si: 'අයදුම්පත සාර්ථකව යොමු කරන ලදී!' },
  'admissions.print_voucher': { en: 'Print Admission Voucher', si: 'ඇතුළත් වීමේ ලදුපත මුද්‍රණය කරන්න' },

  // Meritorious Donations
  'donations.title': { en: 'Meritorious Offerings & Donations', si: 'ශ්‍රී සුමන පුණ්‍ය අරමුදල හා ආධාර' },
  'donations.subtitle': { en: 'Support monastic education, novice student welfare, and temple infrastructure development', si: 'පිරිවෙන් විහාරස්ථානයේ හා සාමණේර භික්ෂු අධ්‍යාපනයේ උන්නතිය සඳහා දායක වන්න' },
  'donations.donor_name': { en: 'Name of Donor', si: 'දායක මහතා/මහත්මියගේ නම' },
  'donations.donor_phone': { en: 'Phone Number', si: 'දුරකථන අංකය' },
  'donations.amount': { en: 'Contribution Amount (LKR)', si: 'පූජා මුදල (රුපියල්)' },
  'donations.purpose': { en: 'Cause / Project Target', si: 'ආධාර අරමුණ' },
  'donations.upload_slip': { en: 'Upload Bank Transfer Slip', si: 'බැංකු රිසිට්පත (Bank Slip) ඇමිණීම' },
  'donations.submit_btn': { en: 'Record Meritorious Donation', si: 'පුණ්‍යානුමෝදනා පූජාව සටහන් කරන්න' },

  // Login View
  'login.title': { en: 'Smart Pirivena Portal Login', si: 'පිරිවෙන් පාලන පද්ධති පිවිසුම' },
  'login.id_label': { en: 'User ID or Registered Email', si: 'පරිශීලක අංකය (User ID) හෝ Email' },
  'login.id_placeholder': { en: 'e.g. STD-2026-001 or admin@gmail.com', si: 'උදා: STD-2026-001 හෝ user@gmail.com' },
  'login.password_label': { en: 'Password', si: 'මුරපදය (Password)' },
  'login.remember_me': { en: 'Remember ID', si: 'මතක තබා ගන්න' },
  'login.forgot_password': { en: 'Forgot Password?', si: 'මුරපදය අමතකද?' },
  'login.submit_btn': { en: 'Sign In to Portal', si: 'ලොග් වන්න / Sign In' },
  'login.verifying': { en: 'Verifying credentials...', si: 'තොරතුරු පරීක්ෂා වේ...' },
  'login.success': { en: 'Login successful! Redirecting...', si: 'සාර්ථකව පිවිසෙන ලදී!' },

  // Roles
  'role.admin': { en: 'Administrator', si: 'පරිපාලක' },
  'role.superadmin': { en: 'Super Administrator', si: 'ප්‍රධාන පරිපාලක' },
  'role.teacher': { en: 'Teacher Staff', si: 'ගුරුභවත්' },
  'role.student': { en: 'Novice Monk / Student', si: 'ශිෂ්‍ය හිමි / ශිෂ්‍ය' },
  'role.user': { en: 'User', si: 'පරිශීලක' },

  // Common UI Actions & Labels
  'common.search': { en: 'Search...', si: 'සොයන්න...' },
  'common.save': { en: 'Save Changes', si: 'වෙනස්කම් සුරකින්න' },
  'common.cancel': { en: 'Cancel', si: 'අවලංගු කරන්න' },
  'common.close': { en: 'Close', si: 'වසා දමන්න' },
  'common.edit': { en: 'Edit', si: 'සංස්කරණය' },
  'common.delete': { en: 'Delete', si: 'මකන්න' },
  'common.upload': { en: 'Upload File', si: 'Upload කරන්න' },
  'common.logout': { en: 'Sign Out of ERP', si: 'පද්ධතියෙන් ඉවත් වන්න' },
  'common.login': { en: 'Login', si: 'ප්‍රවේශ වන්න' },
  'common.back': { en: 'Back to Dashboard', si: 'ආපසු ප්‍රධාන පුවරුවට' },
  'common.view': { en: 'View Details', si: 'විස්තර බලන්න' },
  'common.print': { en: 'Print Document', si: 'මුද්‍රණය කරන්න' },
  'common.download': { en: 'Download PDF', si: 'බාගත කරන්න (PDF)' },
  'common.active': { en: 'Active', si: 'සජීවී' },
  'common.inactive': { en: 'Inactive', si: 'අක්‍රිය' },
  'common.loading': { en: 'Loading data...', si: 'පූරණය වෙමින් පවතී...' },
  'common.success': { en: 'Action completed successfully!', si: 'ක්‍රියාව සාර්ථකව අවසන් විය!' },
  'common.error': { en: 'An error occurred. Please try again.', si: 'දෝෂයක් සිදු විය. කරුණාකර නැවත උත්සාහ කරන්න.' },
  'common.all': { en: 'All', si: 'සියල්ල' },
  'common.version': { en: 'App Version', si: 'යෙදුම් අනුවාදය' },
  'common.developer': { en: 'Developer: Chathura Dananjaya', si: 'සංවර්ධක: චතුර ධනංජය' },
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguageState] = useState<Language>(() => {
    try {
      const saved = localStorage.getItem('pirivena_language');
      return (saved === 'en' || saved === 'si') ? saved : 'si';
    } catch (e) {
      return 'si';
    }
  });

  const setLanguage = React.useCallback((lang: Language) => {
    setLanguageState(lang);
    try {
      localStorage.setItem('pirivena_language', lang);
    } catch (e) {
      console.warn('Could not save language to localStorage:', e);
    }
  }, []);

  const toggleLanguage = React.useCallback(() => {
    setLanguageState((prev) => {
      const next = prev === 'si' ? 'en' : 'si';
      try {
        localStorage.setItem('pirivena_language', next);
      } catch (e) {}
      return next;
    });
  }, []);

  const t = React.useCallback(
    (key: string): string => {
      if (TRANSLATIONS[key]) {
        return TRANSLATIONS[key][language] || TRANSLATIONS[key]['en'];
      }
      return key;
    },
    [language]
  );

  return (
    <LanguageContext.Provider value={{ language, setLanguage, toggleLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within LanguageProvider');
  }
  return context;
};
