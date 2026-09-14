/**
 * Utility helper for subject code generation, normalization, and display.
 * Converts legacy or raw subject codes (e.g., 'SUB-SIN-104', 'SUB-001', 'sub-8', 'sub-1786852354-873')
 * into clean, human-readable Sinhala names and standard subject codes like 'ICT-108', 'BUD-101', 'PAL-102', 'SIN-104'.
 */

export const CLEAN_SUBJECT_MAPPINGS: Record<string, { code: string; name: string; nameSinhala: string; category: string }> = {
  'sub-1': { code: 'BUD-101', name: 'Buddhism & Theravada Studies', nameSinhala: 'බුද්ධ ධර්මය හා ථේරවාද අධ්‍යයනය', category: 'Buddhism' },
  'sub-2': { code: 'PAL-102', name: 'Pali Language & Grammar', nameSinhala: 'පාලි භාෂාව හා ව්‍යාකරණ', category: 'Pali' },
  'sub-3': { code: 'SAN-103', name: 'Sanskrit Language & Literature', nameSinhala: 'සංස්කෘත භාෂාව හා සාහිත්‍යය', category: 'Sanskrit' },
  'sub-4': { code: 'SIN-104', name: 'Sinhala Language & Literature', nameSinhala: 'සිංහල භාෂාව හා සාහිත්‍යය', category: 'Sinhala' },
  'sub-5': { code: 'ENG-105', name: 'English Language', nameSinhala: 'ඉංග්‍රීසි භාෂාව', category: 'English' },
  'sub-6': { code: 'MATH-106', name: 'Mathematics', nameSinhala: 'ගණිතය', category: 'Mathematics' },
  'sub-7': { code: 'HIST-107', name: 'Buddhist History & Heritage', nameSinhala: 'බෞද්ධ ඉතිහාසය හා ලංකා ඉතිහාසය', category: 'History' },
  'sub-8': { code: 'ICT-108', name: 'Information & Communication Technology (ICT)', nameSinhala: 'තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)', category: 'IT' },
  'sub-9': { code: 'TRIP-109', name: 'Tripitaka & Abhidhamma Studies', nameSinhala: 'ත්‍රිපිටක ධර්මය හා අභිධර්මය', category: 'Tripitaka' },
  'sub-001': { code: 'PAL-102', name: 'Pali Language & Grammar', nameSinhala: 'පාලි භාෂාව', category: 'Pali' },
  'sub-002': { code: 'SAN-103', name: 'Sanskrit Language & Literature', nameSinhala: 'සංස්කෘත භාෂාව', category: 'Sanskrit' },
  'sub-003': { code: 'SIN-104', name: 'Sinhala Language & Literature', nameSinhala: 'සිංහල භාෂාව', category: 'Sinhala' },
  'sub-004': { code: 'BUD-101', name: 'Buddhism & Theravada Studies', nameSinhala: 'බුද්ධ ධර්මය', category: 'Buddhism' },
  'sub-005': { code: 'ENG-105', name: 'English Language', nameSinhala: 'ඉංග්‍රීසි භාෂාව', category: 'English' },
  'sub-006': { code: 'ICT-108', name: 'Information & Communication Technology', nameSinhala: 'තොරතුරු තාක්ෂණය', category: 'IT' },
  'subj-pali-101': { code: 'PAL-101', name: 'Pali Language', nameSinhala: 'පාලි භාෂාව', category: 'Pali' },
  'subj-sans-102': { code: 'SAN-102', name: 'Sanskrit Language', nameSinhala: 'සංස්කෘත භාෂාව', category: 'Sanskrit' },
  'subj-sinh-103': { code: 'SIN-103', name: 'Sinhala Language', nameSinhala: 'සිංහල භාෂාව', category: 'Sinhala' },
  'subj-budd-104': { code: 'BUD-104', name: 'Buddhist Studies', nameSinhala: 'බෞද්ධ ධර්මය හා දර්ශනය', category: 'Buddhism' },
  'subj-budd-hist-105': { code: 'HIST-105', name: 'Buddhist History', nameSinhala: 'බෞද්ධ ඉතිහාසය හා සංස්කෘතිය', category: 'History' },
  'subj-tripitaka-106': { code: 'TRIP-106', name: 'Tripitaka', nameSinhala: 'ත්‍රිපිටක ධර්මය', category: 'Tripitaka' },
  'subj-abhidhamma-107': { code: 'ABHI-107', name: 'Abhidhamma', nameSinhala: 'අභිධර්මය', category: 'Tripitaka' },
  'subj-eng-108': { code: 'ENG-108', name: 'English Language', nameSinhala: 'ඉංග්‍රීසි භාෂාව', category: 'English' },
  'subj-ict-109': { code: 'ICT-109', name: 'ICT', nameSinhala: 'තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)', category: 'IT' },
  'subj-math-110': { code: 'MATH-110', name: 'Mathematics', nameSinhala: 'ගණිතය', category: 'Mathematics' },
  'subj-hist-111': { code: 'HIST-111', name: 'Sri Lankan History', nameSinhala: 'ශ්‍රී ලංකා ඉතිහාසය', category: 'History' },
  'subj-geo-112': { code: 'GEO-112', name: 'Geography', nameSinhala: 'භූගෝල විද්‍යාව', category: 'Geography' },
  'subj-geography-112': { code: 'GEO-112', name: 'Geography', nameSinhala: 'භූගෝල විද්‍යාව (Geography)', category: 'Geography' },
};

export function getCleanSubjectCode(subjectInput: any): string {
  if (!subjectInput) return 'SUBJ-101';

  let rawCode = '';
  let rawName = '';
  let rawCategory = '';
  let rawId = '';

  if (typeof subjectInput === 'string') {
    rawCode = subjectInput;
    rawId = subjectInput;
  } else if (typeof subjectInput === 'object') {
    rawCode = subjectInput.code || subjectInput.subjectCode || subjectInput.id || '';
    rawName = subjectInput.name || subjectInput.nameSinhala || subjectInput.subjectName || '';
    rawCategory = subjectInput.category || '';
    rawId = subjectInput.id || '';
  }

  const trimmedId = rawId.trim().toLowerCase();
  if (CLEAN_SUBJECT_MAPPINGS[trimmedId]) {
    return CLEAN_SUBJECT_MAPPINGS[trimmedId].code;
  }

  const codeUpper = rawCode.trim().toUpperCase();

  // Handle SUB- legacy prefixes
  if (codeUpper.startsWith('SUB-SIN-')) return codeUpper.replace('SUB-SIN-', 'SIN-');
  if (codeUpper.startsWith('SUB-ENG-')) return codeUpper.replace('SUB-ENG-', 'ENG-');
  if (codeUpper.startsWith('SUB-MAT-') || codeUpper.startsWith('SUB-MATH-')) return codeUpper.replace(/SUB-MAT(H)?-/, 'MATH-');
  if (codeUpper.startsWith('SUB-HIS-') || codeUpper.startsWith('SUB-HIST-')) return codeUpper.replace(/SUB-HIS(T)?-/, 'HIST-');
  if (codeUpper.startsWith('SUB-PAL-') || codeUpper.startsWith('SUB-PALI-')) return codeUpper.replace(/SUB-PAL(I)?-/, 'PAL-');
  if (codeUpper.startsWith('SUB-SAN-')) return codeUpper.replace('SUB-SAN-', 'SAN-');
  if (codeUpper.startsWith('SUB-BUD-')) return codeUpper.replace('SUB-BUD-', 'BUD-');
  if (codeUpper.startsWith('SUB-ICT-') || codeUpper.startsWith('SUB-IT-')) return codeUpper.replace(/SUB-I(C)?T-/, 'ICT-');
  if (codeUpper.startsWith('SUB-GEO-') || codeUpper.startsWith('SUB-GEOG-')) return codeUpper.replace(/SUB-GEO(G)?-/, 'GEO-');

  // If code is generic SUB-### or raw id sub-###
  if (!codeUpper || codeUpper.startsWith('SUB-') || codeUpper.startsWith('SUB_') || codeUpper.startsWith('SUBJ-') || codeUpper.startsWith('SUB')) {
    const combinedStr = `${rawCode} ${rawName} ${rawCategory} ${rawId}`.toLowerCase();

    if (combinedStr.includes('geography') || combinedStr.includes('භූගෝල')) {
      return 'GEO-112';
    }
    if (combinedStr.includes('ict') || combinedStr.includes('information') || combinedStr.includes('තොරතුරු') || combinedStr.includes('පරිගණක')) {
      return 'ICT-108';
    }
    if (combinedStr.includes('buddhism') || combinedStr.includes('buddhist') || combinedStr.includes('බුද්ධ') || combinedStr.includes('ධර්ම')) {
      return 'BUD-101';
    }
    if (combinedStr.includes('pali') || combinedStr.includes('පාලි')) {
      return 'PAL-102';
    }
    if (combinedStr.includes('sanskrit') || combinedStr.includes('සංස්කෘත')) {
      return 'SAN-103';
    }
    if (combinedStr.includes('sinhala') || combinedStr.includes('සිංහල')) {
      return 'SIN-104';
    }
    if (combinedStr.includes('english') || combinedStr.includes('ඉංග්‍රීසි')) {
      return 'ENG-105';
    }
    if (combinedStr.includes('math') || combinedStr.includes('ගණිත')) {
      return 'MATH-106';
    }
    if (combinedStr.includes('history') || combinedStr.includes('ඉතිහාස')) {
      return 'HIST-107';
    }
    if (combinedStr.includes('tripitaka') || combinedStr.includes('ත්‍රිපිටක') || combinedStr.includes('abhidhamma')) {
      return 'TRIP-109';
    }
    if (combinedStr.includes('logic') || combinedStr.includes('තර්ක')) {
      return 'LOG-111';
    }

    // Extract digits if any
    const digits = codeUpper.replace(/[^0-9]/g, '');
    if (digits && digits.length <= 4) {
      return `SUBJ-${digits}`;
    }
    return 'SUBJ-101';
  }

  return codeUpper;
}

export function generateSmartSubjectCode(
  categoryKey?: string,
  subjectName?: string,
  subjectNameSinhala?: string,
  existingCount: number = 0
): string {
  const num = 101 + existingCount;
  const combined = `${categoryKey || ''} ${subjectName || ''} ${subjectNameSinhala || ''}`.toLowerCase();

  if (combined.includes('geography') || combined.includes('භූගෝල')) {
    return `GEO-${112 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('ict') || combined.includes('information') || combined.includes('තොරතුරු') || combined.includes('පරිගණක')) {
    return `ICT-${108 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('pali') || combined.includes('පාලි')) {
    return `PAL-${102 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('sanskrit') || combined.includes('සංස්කෘත')) {
    return `SAN-${103 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('buddhism') || combined.includes('බුද්ධ')) {
    return `BUD-${101 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('sinhala') || combined.includes('සිංහල')) {
    return `SIN-${104 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('english') || combined.includes('ඉංග්‍රීසි')) {
    return `ENG-${105 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('math') || combined.includes('ගණිත')) {
    return `MATH-${106 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('history') || combined.includes('ඉතිහාස')) {
    return `HIST-${107 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('tripitaka') || combined.includes('ත්‍රිපිටක')) {
    return `TRIP-${109 + (existingCount > 0 ? existingCount : 0)}`;
  }
  if (combined.includes('logic') || combined.includes('තර්ක')) {
    return `LOG-${num}`;
  }
  if (combined.includes('econ') || combined.includes('ආර්ථික')) {
    return `ECON-${num}`;
  }

  const prefixMap: Record<string, string> = {
    Buddhism: 'BUD',
    Pali: 'PAL',
    Sanskrit: 'SAN',
    Sinhala: 'SIN',
    English: 'ENG',
    Mathematics: 'MATH',
    History: 'HIST',
    Geography: 'GEO',
    IT: 'ICT',
    ICT: 'ICT',
    Tripitaka: 'TRIP',
    Abhidhamma: 'ABHI',
    'Social Studies': 'SOC',
    Health: 'HPE',
  };

  const prefix = (categoryKey && prefixMap[categoryKey]) || 'SUBJ';
  return `${prefix}-${num}`;
}

export function formatCleanSubjectName(nameOrCode?: string, examTitle?: string): { code: string; name: string } {
  const raw = `${nameOrCode || ''} ${examTitle || ''}`.trim().toLowerCase();

  if (raw.includes('geography') || raw.includes('geog') || raw.includes('භූගෝල') || raw.includes('භූගෝලය')) {
    return { code: 'GEO-112', name: 'භූගෝල විද්‍යාව (Geography)' };
  }
  if (raw.includes('pali') || raw.includes('පාලි') || raw.includes('පාලී')) {
    return { code: 'PAL-102', name: 'පාලි භාෂාව හා ව්‍යාකරණ (Pali)' };
  }
  if (raw.includes('buddhism') || raw.includes('buddhist') || raw.includes('බුද්ධ') || raw.includes('දහම්') || raw.includes('ධර්ම')) {
    return { code: 'BUD-101', name: 'බුද්ධ ධර්මය හා ථේරවාද අධ්‍යයනය (Buddhism)' };
  }
  if (raw.includes('sanskrit') || raw.includes('සංස්කෘත')) {
    return { code: 'SAN-103', name: 'සංස්කෘත භාෂාව හා සාහිත්‍යය (Sanskrit)' };
  }
  if (raw.includes('sinhala') || raw.includes('සිංහල') || raw.includes('සාහිත්‍ය')) {
    return { code: 'SIN-104', name: 'සිංහල භාෂාව හා සාහිත්‍යය (Sinhala)' };
  }
  if (raw.includes('tripitaka') || raw.includes('ත්‍රිපිටක') || raw.includes('vinaya') || raw.includes('විනය')) {
    return { code: 'TRIP-109', name: 'ත්‍රිපිටක ධර්මය හා විනය (Tripitaka)' };
  }
  if (raw.includes('abhidhamma') || raw.includes('අභිධර්ම')) {
    return { code: 'ABHI-107', name: 'අභිධර්මය (Abhidhamma)' };
  }
  if (raw.includes('english') || raw.includes('ඉංග්‍රීසි')) {
    return { code: 'ENG-105', name: 'ඉංග්‍රීසි භාෂාව (English Language)' };
  }
  if (raw.includes('ict') || raw.includes('information') || raw.includes('තොරතුරු') || raw.includes('පරිගණක')) {
    return { code: 'ICT-108', name: 'තොරතුරු හා සන්නිවේදන තාක්ෂණය (ICT)' };
  }
  if (raw.includes('history') || raw.includes('ඉතිහාස') || raw.includes('පුරාවිද්‍යා')) {
    return { code: 'HIST-107', name: 'බෞද්ධ හා ලංකා ඉතිහාසය (History)' };
  }
  if (raw.includes('math') || raw.includes('ගණිත')) {
    return { code: 'MATH-106', name: 'ගණිතය (Mathematics)' };
  }
  if (raw.includes('science') || raw.includes('විද්‍යා')) {
    return { code: 'SCI-113', name: 'විද්‍යාව (Science)' };
  }
  if (raw.includes('logic') || raw.includes('තර්ක')) {
    return { code: 'LOG-111', name: 'තර්ක ශාස්ත්‍රය හා විද්‍යාත්මක ක්‍රමය' };
  }
  if (raw.includes('econ') || raw.includes('ආර්ථික')) {
    return { code: 'ECON-114', name: 'ආර්ථික විද්‍යාව (Economics)' };
  }
  if (raw.includes('political') || raw.includes('politics') || raw.includes('දේශපාලන')) {
    return { code: 'POL-115', name: 'දේශපාලන විද්‍යාව (Political Science)' };
  }
  if (raw.includes('commerce') || raw.includes('business') || raw.includes('වාණිජ') || raw.includes('ව්‍යාපාර')) {
    return { code: 'BS-116', name: 'ව්‍යාපාර අධ්‍යයනය (Business Studies)' };
  }
  if (raw.includes('accounting') || raw.includes('account') || raw.includes('ගිණුම්')) {
    return { code: 'ACC-117', name: 'ගිණුම්කරණය (Accounting)' };
  }
  if (raw.includes('art') || raw.includes('චිත්‍ර')) {
    return { code: 'ART-118', name: 'චිත්‍ර කලාව (Art)' };
  }
  if (raw.includes('music') || raw.includes('සංගීත')) {
    return { code: 'MUS-119', name: 'සංගීතය (Music)' };
  }
  if (raw.includes('dance') || raw.includes('dancing') || raw.includes('නර්තන')) {
    return { code: 'DAN-120', name: 'නර්තනය (Dancing)' };
  }
  if (raw.includes('drama') || raw.includes('නාට්‍ය')) {
    return { code: 'DRA-121', name: 'නාට්‍ය හා රංග කලාව' };
  }
  if (raw.includes('health') || raw.includes('සෞඛ්‍ය')) {
    return { code: 'HPE-122', name: 'සෞඛ්‍ය හා ශාරීරික අධ්‍යාපනය' };
  }
  if (raw.includes('astrology') || raw.includes('ජ්‍යොතිෂ')) {
    return { code: 'AST-123', name: 'ජ්‍යොතිෂය (Astrology)' };
  }
  if (raw.includes('ayurveda') || raw.includes('ආයුර්වේද')) {
    return { code: 'AYU-124', name: 'ආයුර්වේදය (Ayurveda)' };
  }
  if (raw.includes('pracheena') || raw.includes('ප්‍රාචීන')) {
    return { code: 'PRAC-201', name: 'ප්‍රාචීන ප්‍රාරම්භ අධ්‍යයනය (Pracheena Studies)' };
  }

  const cleanCode = getCleanSubjectCode(nameOrCode);
  const cleanName = 'ප්‍රාචීන අධ්‍යයන විෂය (Oriental Studies)';
  return { code: cleanCode, name: cleanName };
}

export function resolveClassSinhalaName(classInput?: string): string {
  if (!classInput) return 'සියලුම පන්ති';
  const trimmed = classInput.trim();
  const lower = trimmed.toLowerCase();
  if (['all', 'all classes', 'general', 'පොදු', 'සියලු', 'සියලු පන්ති'].includes(lower)) {
    return 'සියලුම පන්ති';
  }
  const dict: Record<string, string> = {
    'class-pra-01': 'ප්‍රාරම්භ පන්තිය (Praarambha)',
    'class-mad-02': 'මධ්‍යම පන්තිය (Madhyama)',
    'class-awa-03': 'අවසාන පන්තිය (Awasana)',
    'cls-001': 'ප්‍රාරම්භ පන්තිය',
    'cls-002': 'මධ්‍යම පන්තිය',
    'cls-003': 'අවසාන පන්තිය',
    'cls-mulika-1': 'මූලික පිරිවෙන් 1 වසර',
    'cls-mulika-2': 'මූලික පිරිවෙන් 2 වසර',
    'cls-mulika-3': 'මූලික පිරිවෙන් 3 වසර',
    'cls-mulika-4': 'මූලික පිරිවෙන් 4 වසර',
    'cls-mulika-5': 'මූලික පිරිවෙන් 5 වසර',
  };
  if (dict[lower]) return dict[lower];
  if (trimmed.includes('ප්‍රාරම්භ') || lower.includes('praarambha') || lower.includes('pramukha')) return 'ප්‍රාරම්භ පන්තිය';
  if (trimmed.includes('මධ්‍යම') || lower.includes('madhyama')) return 'මධ්‍යම පන්තිය';
  if (trimmed.includes('අවසාන') || lower.includes('awasana')) return 'අවසාන පන්තිය';
  return trimmed;
}

export function resolveSubjectSinhalaName(
  subjectInput?: string,
  subjectsList?: any[],
  contextTitle?: string
): string {
  const trimmed = String(subjectInput || '').trim();
  const lower = trimmed.toLowerCase();

  // 1. If subjectInput matches an existing subject from subjects array
  if (subjectsList && Array.isArray(subjectsList) && trimmed) {
    const found = subjectsList.find(
      (s) =>
        s &&
        (s.id === trimmed ||
          s.code === trimmed ||
          s.subjectCode === trimmed ||
          s.name === trimmed ||
          s.nameSinhala === trimmed ||
          (s as any).subjectName === trimmed ||
          (s as any).subjectNameSinhala === trimmed ||
          (s.id && s.id.toLowerCase() === lower) ||
          (s.code && s.code.toLowerCase() === lower))
    );
    if (found) {
      return (
        found.nameSinhala ||
        found.subjectNameSinhala ||
        found.name ||
        found.subjectName ||
        'විෂයය'
      );
    }
  }

  // 2. Universal / empty checks
  if (!trimmed || ['all', 'all subjects', 'general', 'පොදු', 'සියලු', 'සියලු විෂයයන්'].includes(lower)) {
    // If contextTitle has clues, infer from title
    if (contextTitle) {
      const inferred = formatCleanSubjectName('', contextTitle);
      if (inferred && inferred.name && !inferred.name.includes('ප්‍රාචීන අධ්‍යයන විෂය')) {
        return inferred.name;
      }
    }
    return 'පොදු / සියලු විෂයයන්';
  }

  // 3. Static mappings lookup
  if (CLEAN_SUBJECT_MAPPINGS[lower]) {
    return CLEAN_SUBJECT_MAPPINGS[lower].nameSinhala;
  }

  // 4. If it already contains Sinhala characters and does NOT look like a raw generated ID (e.g. sub-1786...)
  const isGeneratedId = /^(sub|subj)[-_]\d+/i.test(trimmed) || /^\d{5,}/.test(trimmed);
  if (!isGeneratedId && /[\u0D80-\u0DFF]/.test(trimmed)) {
    return trimmed;
  }

  // 5. Infer from Subject Code / ID + Context Title (e.g. "2024-AL-Geography-Past-Paper" -> Geography)
  const inferred = formatCleanSubjectName(trimmed, contextTitle);
  if (inferred && inferred.name && (!isGeneratedId || !inferred.name.includes('ප්‍රාචීන අධ්‍යයන විෂය'))) {
    return inferred.name;
  }

  // 6. If it's a generated ID (like sub-1786852354-873), NEVER show the raw numbers!
  if (isGeneratedId) {
    if (contextTitle) {
      const fromTitle = formatCleanSubjectName('', contextTitle);
      if (fromTitle && fromTitle.name) {
        return fromTitle.name;
      }
    }
    return 'ප්‍රාචීන අධ්‍යයනය (Oriental Studies)';
  }

  return trimmed;
}
