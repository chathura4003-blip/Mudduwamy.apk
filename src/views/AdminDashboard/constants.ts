export const PIRIVENA_CATEGORIES = [
  {
    key: 'Mulika Pirivena',
    name: 'Mulika Pirivena (මූලික පිරිවෙන)',
    nameSinhala: 'මූලික පිරිවෙන අංශය',
    levels: ['Level 1', 'Level 2', 'Level 3', 'Level 4', 'Level 5'],
  },
  {
    key: 'Pracheena',
    name: 'Pracheena (ප්‍රාචීන / Oriental Studies)',
    nameSinhala: 'ප්‍රාචීන අංශය',
    levels: ['Preliminary', 'Level 1', 'Level 2', 'Level 3'],
  },
  {
    key: 'A/L Section',
    name: 'A/L Section (උසස් පෙළ අංශය)',
    nameSinhala: 'උසස් පෙළ අංශය',
    levels: ['A/L Year 1', 'A/L Year 2', 'A/L Revision'],
  },
  {
    key: 'Advanced',
    name: 'Advanced (උසස් / ධර්මාචාර්ය අංශය)',
    nameSinhala: 'උසස් / ධර්මාචාර්ය අංශය',
    levels: ['Pracheena Final', 'Dharmacharya', 'Higher Studies'],
  },
];

export const generateClassDefaults = (category: string, levelName: string) => {
  let codePrefix = 'MUL';
  let catEn = 'Mulika Pirivena';
  let catSi = 'මූලික පිරිවෙන';

  if (category === 'Pracheena') {
    codePrefix = 'PRA';
    catEn = 'Pracheena';
    catSi = 'ප්‍රාචීන අංශය';
  } else if (category === 'A/L Section' || category === 'O/L Section') {
    codePrefix = 'AL';
    catEn = 'A/L Section';
    catSi = 'උසස් පෙළ අංශය';
  } else if (category === 'Advanced') {
    codePrefix = 'ADV';
    catEn = 'Advanced';
    catSi = 'උසස් / ධර්මාචාර්ය අංශය';
  } else if (category && category !== 'Mulika Pirivena') {
    codePrefix = 'SUB';
    catEn = category;
    catSi = category;
  }

  let levelCode = 'L01';
  let levelSi = levelName;

  if (levelName === 'Level 1') {
    levelCode = 'L01';
    levelSi = '01 ශ්‍රේණිය';
  } else if (levelName === 'Level 2') {
    levelCode = 'L02';
    levelSi = '02 ශ්‍රේණිය';
  } else if (levelName === 'Level 3') {
    levelCode = 'L03';
    levelSi = '03 ශ්‍රේණිය';
  } else if (levelName === 'Level 4') {
    levelCode = 'L04';
    levelSi = '04 ශ්‍රේණිය';
  } else if (levelName === 'Level 5') {
    levelCode = 'L05';
    levelSi = '05 ශ්‍රේණිය';
  } else if (levelName === 'Preliminary') {
    levelCode = 'PRE';
    levelSi = 'ප්‍රාරම්භ ශ්‍රේණිය';
  } else if (levelName === 'A/L Preparation' || levelName === 'O/L Preparation') {
    levelCode = 'PREP';
    levelSi = 'පූර්ව ප්‍රවේශ පන්තිය';
  } else if (levelName === 'A/L Year 1' || levelName === 'O/L Year 1') {
    levelCode = 'Y01';
    levelSi = '12 ශ්‍රේණිය (Year 1)';
  } else if (levelName === 'A/L Year 2' || levelName === 'O/L Year 2') {
    levelCode = 'Y02';
    levelSi = '13 ශ්‍රේණිය (Year 2)';
  } else if (levelName === 'A/L Revision' || levelName === 'O/L Revision') {
    levelCode = 'REV';
    levelSi = 'පුනරීක්ෂණ පන්තිය';
  } else if (levelName === 'Pracheena Final') {
    levelCode = 'FIN';
    levelSi = 'ප්‍රාචීන අවසාන';
  } else if (levelName === 'Dharmacharya') {
    levelCode = 'DHM';
    levelSi = 'ධර්මාචාර්ය';
  } else if (levelName === 'Higher Studies') {
    levelCode = 'HGH';
    levelSi = 'උසස් අධ්‍යයන';
  }

  return {
    code: `${codePrefix}-${levelCode}`,
    name: `${catEn} - ${levelName}`,
    nameSinhala: `${catSi} - ${levelSi}`,
  };
};

export const SUBJECT_CATEGORIES = [
  {
    key: 'Buddhism',
    name: 'Buddhism & Dhamma',
    nameSinhala: 'බුද්ධ ධර්මය',
    label: 'Buddhism / බුද්ධ ධර්මය',
    codePrefix: 'BUD',
  },
  {
    key: 'Pali',
    name: 'Pali Language & Literature',
    nameSinhala: 'පාලි භාෂාව හා සාහිත්‍යය',
    label: 'Pali / පාලි',
    codePrefix: 'PAL',
  },
  {
    key: 'Sanskrit',
    name: 'Sanskrit Language & Grammar',
    nameSinhala: 'සංස්කෘත භාෂාව හා ව්‍යාකරණ',
    label: 'Sanskrit / සංස්කෘත',
    codePrefix: 'SAN',
  },
  {
    key: 'Sinhala',
    name: 'Sinhala Language & Composition',
    nameSinhala: 'සිංහල භාෂාව හා රචනය',
    label: 'Sinhala / සිංහල',
    codePrefix: 'SIN',
  },
  {
    key: 'English',
    name: 'English Language',
    nameSinhala: 'ඉංග්‍රීසි භාෂාව',
    label: 'English / ඉංග්‍රීසි',
    codePrefix: 'ENG',
  },
  {
    key: 'Mathematics',
    name: 'Mathematics',
    nameSinhala: 'ගණිතය',
    label: 'Mathematics / ගණිතය',
    codePrefix: 'MATH',
  },
  {
    key: 'History',
    name: 'Buddhist History & Sri Lankan History',
    nameSinhala: 'බෞද්ධ ඉතිහාසය හා ලංකා ඉතිහාසය',
    label: 'History / ඉතිහාසය',
    codePrefix: 'HIST',
  },
  {
    key: 'Social Studies',
    name: 'Social Studies & Civics',
    nameSinhala: 'සමාජ විද්‍යාව හා පෞරනීතිය',
    label: 'Social Studies / සමාජ විද්‍යාව',
    codePrefix: 'SOC',
  },
  {
    key: 'Health',
    name: 'Health & Physical Education',
    nameSinhala: 'සෞඛ්‍ය හා ශාරීරික අධ්‍යාපනය',
    label: 'Health & PE / සෞඛ්‍ය',
    codePrefix: 'HPE',
  },
  {
    key: 'Tripitaka',
    name: 'Theravada Tripitaka & Vinaya',
    nameSinhala: 'ත්‍රිපිටකය හා විනය පිටකය',
    label: 'Theravada Tripitaka / ත්‍රිපිටකය',
    codePrefix: 'TRIP',
  },
  {
    key: 'IT',
    name: 'Information & Communication Technology (ICT)',
    nameSinhala: 'තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)',
    label: 'Information Technology / ICT',
    codePrefix: 'ICT',
  },
  {
    key: 'Other',
    name: 'Other Subject',
    nameSinhala: 'වෙනත් විෂයය',
    label: 'Other / වෙනත් (Custom)',
    codePrefix: 'SUBJ',
  },
];

export const TABLE_DISPLAY_NAMES: Record<string, string> = {
  users: '👥 පරිශීලකයින් (Users)',
  classes: '🏫 පන්ති කාමර (Classes)',
  subjects: '📚 විෂයයන් (Subjects)',
  exams: '📝 විභාග (Exams)',
  exam_submissions: '✍️ විභාග පිළිතුරු (Exam Submissions)',
  study_materials: '📖 අධ්‍යයන ද්‍රව්‍ය (Study Materials)',
  library_books: '📚 පුස්තකාල පොත් (Library Books)',
  news: '📰 පුවත් සහ ලිපි (News)',
  events: '🎉 උත්සව හා විශේෂාංග (Events)',
  gallery: '🖼️ ඡායාරූප ගැලරිය (Gallery)',
  downloads: '📥 බාගැනීම් (Downloads)',
  donations: '🙏 ආධාර හා සම්මාදම් (Donations)',
  admissions: '🎓 නව ඇතුළත් කිරීම් (Admissions)',
  audit_logs: '📜 පද්ධති සටහන් (Audit Logs)',
  site_settings: '⚙️ වෙබ් අඩවි සැකසුම් (Site Settings)',
  broadcast_notices: '📢 විකාශන නිවේදන (Broadcast Notices)',
};
