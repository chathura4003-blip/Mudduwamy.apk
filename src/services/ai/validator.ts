import type { Question } from '../../types';
import { safeJsonParse } from './utils';

export function validateQuestionObject(
  q: any,
  defaultTopic: string = 'General',
  index: number = 0
): Question | null {
  if (!q || typeof q !== 'object') return null;

  // 1. Text / Question string validation
  let text =
    q.question ??
    q.text ??
    q.prompt ??
    q.q_text ??
    q.Question ??
    q.Prompt ??
    q.title ??
    q.name ??
    q['Col 1: Question'] ??
    q['Col 1'] ??
    q['Question'] ??
    q.content ??
    q.stem ??
    q.body ??
    q.Q ??
    q.q ??
    q.statement ??
    q.problem ??
    q.item;

  if (text === undefined || text === null || !String(text).trim()) {
    return null; // Reject if no question text
  }
  text = String(text).trim();

  if (q.optionE || q.option_e) {
    text += `\n(Option E: ${q.optionE || q.option_e})`;
  }

  // 2. Type validation - ALLOWED TYPES ONLY: 'mcq' | 'true_false' | 'essay' | 'structured'
  let type: 'mcq' | 'true_false' | 'essay' | 'structured' = 'mcq';
  const rawType = String(
    q.type ??
      q['Col 8: Type (mcq/true_false/essay)'] ??
      q['Col 8: Type'] ??
      q['Col 8'] ??
      q.Type ??
      q.question_type ??
      q.questionType ??
      ''
  )
    .toLowerCase()
    .trim();

  if (
    rawType === 'true_false' ||
    rawType === 'tf' ||
    rawType === 'truefalse' ||
    rawType === 'true/false' ||
    rawType === 'boolean'
  ) {
    type = 'true_false';
  } else if (
    rawType === 'essay' ||
    rawType === 'descriptive' ||
    rawType === 'long_answer' ||
    rawType === 'translation'
  ) {
    type = 'essay';
  } else if (
    rawType === 'structured' ||
    rawType === 'short_answer' ||
    rawType === 'short' ||
    rawType === 'struct'
  ) {
    type = 'structured';
  } else {
    type = 'mcq';
  }

  // 3. Options validation for MCQ
  let options: string[] | undefined = undefined;
  const optA =
    q.option_a ??
    q.optionA ??
    q['Col 2: Option A'] ??
    q['Col 2'] ??
    q['Option A'] ??
    q['Option 1'] ??
    q.optA ??
    q.opt1 ??
    q.a ??
    q['1'] ??
    q.option1;

  const optB =
    q.option_b ??
    q.optionB ??
    q['Col 3: Option B'] ??
    q['Col 3'] ??
    q['Option B'] ??
    q['Option 2'] ??
    q.optB ??
    q.opt2 ??
    q.b ??
    q['2'] ??
    q.option2;

  const optC =
    q.option_c ??
    q.optionC ??
    q['Col 4: Option C'] ??
    q['Col 4'] ??
    q['Option C'] ??
    q['Option 3'] ??
    q.optC ??
    q.opt3 ??
    q.c ??
    q['3'] ??
    q.option3;

  const optD =
    q.option_d ??
    q.optionD ??
    q['Col 5: Option D'] ??
    q['Col 5'] ??
    q['Option D'] ??
    q['Option 4'] ??
    q.optD ??
    q.opt4 ??
    q.d ??
    q['4'] ??
    q.option4;

  const rawOptionsArray = Array.isArray(q.options)
    ? q.options
    : Array.isArray(q.choices)
      ? q.choices
      : Array.isArray(q.answers)
        ? q.answers
        : null;

  if (rawOptionsArray && rawOptionsArray.length > 0) {
    options = rawOptionsArray.map((opt: any) => String(opt || '').trim());
  } else if (optA !== undefined || optB !== undefined || optC !== undefined || optD !== undefined) {
    options = [
      String(optA ?? 'විකල්පය A').trim(),
      String(optB ?? 'විකල්පය B').trim(),
      String(optC ?? 'විකල්පය C').trim(),
      String(optD ?? 'විකල්පය D').trim(),
    ];
  }

  if (type === 'mcq' && (!options || options.length === 0)) {
    options = ['විකල්පය A', 'විකල්පය B', 'වিকল্পය C', 'විකල්පය D'];
  }

  // 4. Correct Answer validation
  let correctAnswer: string | number | undefined = undefined;
  const rawAns =
    q.correct_answer ??
    q.correctAnswer ??
    q['Col 6: Correct Answer (1-4 / Text)'] ??
    q['Col 6: Correct Answer'] ??
    q['Col 6'] ??
    q['Correct Answer'] ??
    q['Correct'] ??
    q.answer ??
    q.correct ??
    q.key ??
    q.ans;

  if (type === 'mcq') {
    correctAnswer = parseMcqCorrectAnswer(rawAns, options);
  } else if (type === 'true_false') {
    const lower = String(rawAns ?? 'true').trim().toLowerCase();
    if (lower === 'false' || lower === 'f' || lower === 'අසත්‍යයි' || lower === '0') {
      correctAnswer = 'false';
    } else {
      correctAnswer = 'true';
    }
  } else {
    correctAnswer = rawAns !== undefined && rawAns !== null ? String(rawAns).trim() : '';
  }

  // 5. Marks validation
  let marks: number = 10;
  const rawMarks = q.marks ?? q['Col 7: Marks'] ?? q['Col 7'] ?? q.Marks ?? q.points ?? q.score;
  if (rawMarks !== undefined && rawMarks !== null && String(rawMarks).trim() !== '') {
    const parsedMarks = Number(rawMarks);
    if (!isNaN(parsedMarks) && parsedMarks > 0) {
      marks = parsedMarks;
    }
  }

  // 6. Explanation validation
  const rawExp =
    q.explanation ??
    q['Col 9: Explanation'] ??
    q['Col 9'] ??
    q.Explanation ??
    q.model_answer ??
    q.answer_explanation ??
    '';
  const explanation = typeof rawExp === 'string' ? rawExp.trim() : '';

  // 7. ID assignment
  const id = typeof q.id === 'string' && q.id.trim() ? q.id.trim() : `q-val-${Date.now()}-${index}`;

  return {
    id,
    type,
    text,
    question: text,
    textSinhala: text,
    questionSinhala: text,
    options,
    correctAnswer,
    marks,
    explanation,
  };
}

function parseMcqCorrectAnswer(rawAns: any, options?: string[]): number {
  if (rawAns === undefined || rawAns === null) return 0;
  if (typeof rawAns === 'number' && !isNaN(rawAns)) {
    if (options && options.length > 0) {
      if (rawAns >= 0 && rawAns < options.length) return rawAns;
      if (rawAns >= 1 && rawAns <= options.length) return rawAns - 1;
    }
    return rawAns >= 0 ? rawAns : 0;
  }
  const str = String(rawAns).trim();
  if (!str) return 0;
  const lower = str.toLowerCase();

  // 1. Try matching against option text first if options array exists
  if (options && Array.isArray(options) && options.length > 0) {
    const textIdx = options.findIndex(
      (opt) => String(opt || '').trim().toLowerCase() === lower
    );
    if (textIdx !== -1) {
      return textIdx;
    }
  }

  // 2. Letter / Option label matching (A-Z: a=0, b=1, c=2, d=3, e=4, f=5, etc.)
  const letterMatch = lower.match(/(?:opt|option|vikalpaya|විකල්පය|පිළිතුර|op)?\s*([a-z])\b/);
  if (letterMatch) {
    const code = letterMatch[1].charCodeAt(0) - 97;
    if (code >= 0 && code < (options?.length || 26)) {
      return code;
    }
  }

  // 3. Number matching: 1-N (1-based) vs 0-(N-1) (0-based)
  const num = parseInt(str, 10);
  if (!isNaN(num)) {
    const numOpts = options?.length || 10;
    if (num >= 1 && num <= numOpts) {
      return num - 1;
    }
    if (num >= 0 && num < numOpts) {
      return num;
    }
  }

  return 0;
}

export function validateAndCleanQuestionsArray(
  parsedJson: any,
  defaultTopic: string = 'General'
): Question[] {
  let rawArray: any[] = [];

  if (Array.isArray(parsedJson)) {
    rawArray = parsedJson;
  } else if (parsedJson && typeof parsedJson === 'object') {
    if (Array.isArray(parsedJson.questions)) rawArray = parsedJson.questions;
    else if (Array.isArray(parsedJson.data)) rawArray = parsedJson.data;
    else if (Array.isArray(parsedJson.paper)) rawArray = parsedJson.paper;
    else if (Array.isArray(parsedJson.questionsList)) rawArray = parsedJson.questionsList;
    else if (Array.isArray(parsedJson.items)) rawArray = parsedJson.items;
    else if (Array.isArray(parsedJson.results)) rawArray = parsedJson.results;
    else if (parsedJson.question || parsedJson.text) rawArray = [parsedJson];
    else {
      // Check if it's an object with numeric keys { "0": {...}, "1": {...} }
      const values = Object.values(parsedJson);
      if (values.length > 0 && values.some((val: any) => val && typeof val === 'object' && (val.question || val.text))) {
        rawArray = values;
      }
    }
  }

  if (!Array.isArray(rawArray) || rawArray.length === 0) {
    return [];
  }

  const validQuestions: Question[] = [];
  for (let i = 0; i < rawArray.length; i++) {
    const validQ = validateQuestionObject(rawArray[i], defaultTopic, i);
    if (validQ) {
      validQuestions.push(validQ);
    }
  }
  return validQuestions;
}

export function fallbackExtractQuestionsFromRawText(rawText: string): Question[] {
  if (!rawText || typeof rawText !== 'string') return [];
  const lines = rawText.split('\n');
  const questions: Question[] = [];

  let currentQ: Question | null = null;

  const pushCurrent = () => {
    if (currentQ && currentQ.text.trim()) {
      // If no options were found, check if it looks like essay or structured
      if (currentQ.options.length < 2) {
        currentQ.type = 'essay';
        currentQ.options = [];
        currentQ.correctAnswer = '';
      } else {
        currentQ.type = 'mcq';
        if (!currentQ.correctAnswer) currentQ.correctAnswer = '1';
      }
      questions.push({ ...currentQ } as Question);
    }
  };

  for (const line of lines) {
    const trimmed = line.trim();
    if (!trimmed) continue;

    // Detect question number pattern: "1.", "(1)", "01.", "Q1:", "ප්‍රශ්න 01:", "1 - "
    const qMatch = trimmed.match(/^(?:ප්‍රශ්න(?:ය)?\s*)?(?:\(|\{|\[)?(\d{1,3})(?:\)|\}|\]|\.|\:|\-)\s*(.+)/i);
    const isQHeader = qMatch && parseInt(qMatch[1], 10) > 0 && parseInt(qMatch[1], 10) <= 100;

    if (isQHeader && qMatch) {
      pushCurrent();
      const qText = qMatch[2] || trimmed;
      currentQ = {
        id: `q-fallback-${Date.now()}-${questions.length}`,
        text: qText,
        question: qText,
        textSinhala: qText,
        questionSinhala: qText,
        options: [],
        correctAnswer: '1',
        marks: 20,
        type: 'mcq',
        explanation: '',
      };
      continue;
    }

    if (currentQ) {
      // Check single line with 4 options: (1) A (2) B (3) C (4) D
      const fourOptMatch = trimmed.match(
        /(?:\(1\)|1\.|1\))\s*([^(\n]+)(?:\(2\)|2\.|2\))\s*([^(\n]+)(?:\(3\)|3\.|3\))\s*([^(\n]+)(?:\(4\)|4\.|4\))\s*([^(\n]+)/i
      );
      if (fourOptMatch) {
        currentQ.options = [
          fourOptMatch[1].trim(),
          fourOptMatch[2].trim(),
          fourOptMatch[3].trim(),
          fourOptMatch[4].trim(),
        ];
        continue;
      }

      // Check single option line: (1) text or 1) text or A) text
      const singleOptMatch = trimmed.match(/^(?:\(([1-4A-Da-d])\)|([1-4A-Da-d])[\.\)])\s*(.+)/);
      if (singleOptMatch && currentQ.options.length < 4) {
        currentQ.options.push(singleOptMatch[3].trim());
        continue;
      }

      // Append extra text to question prompt if options not yet collected
      if (currentQ.options.length === 0) {
        currentQ.text += ' ' + trimmed;
      }
    }
  }

  pushCurrent();
  return questions;
}

export function validateAndCleanPaperResponse(
  rawText: string,
  fileName?: string
): { title: string; instructions: string; questions: Question[] } | null {
  const parsed = safeJsonParse(rawText);
  let questions: Question[] = [];

  if (parsed) {
    questions = validateAndCleanQuestionsArray(parsed, 'Paper OCR');
  }

  if (questions.length === 0) {
    questions = fallbackExtractQuestionsFromRawText(rawText);
  }

  if (questions.length === 0) return null;

  const title =
    typeof parsed?.title === 'string' && parsed.title.trim()
      ? parsed.title.trim()
      : fileName
        ? `උඩුගත කළ ප්‍රශ්න පත්‍රය (${fileName.replace(/\.[^/.]+$/, '')})`
        : 'ස්කෑන් කළ ප්‍රාචීන ප්‍රශ්න පත්‍රය';

  const instructions =
    typeof parsed?.instructions === 'string' && parsed.instructions.trim()
      ? parsed.instructions.trim()
      : 'සියලුම ප්‍රශ්නවලට පිළිතුරු සපයන්න.';

  return {
    title,
    instructions,
    questions,
  };
}

export function formatQuestionsTo9ColumnJson(questions: any[]): string {
  if (!Array.isArray(questions) || questions.length === 0) return '[]';

  const cleanOpt = (val: any) => {
    if (val === null || val === undefined) return null;
    const str = String(val).trim();
    if (!str) return null;
    const cleaned = str.replace(/^(?:\([1-4A-Da-d]\)|[1-4A-Da-d][\.\)]|（[1-4A-Da-d]）)\s*/, '').trim();
    return cleaned || str;
  };

  const formatted = questions.map((q, idx) => {
    const question = String(q.question || q.text || `Question #${idx + 1}`).trim();

    let optA = q.option_a ?? q.optionA ?? (Array.isArray(q.options) ? q.options[0] : null);
    let optB = q.option_b ?? q.optionB ?? (Array.isArray(q.options) ? q.options[1] : null);
    let optC = q.option_c ?? q.optionC ?? (Array.isArray(q.options) ? q.options[2] : null);
    let optD = q.option_d ?? q.optionD ?? (Array.isArray(q.options) ? q.options[3] : null);

    optA = cleanOpt(optA);
    optB = cleanOpt(optB);
    optC = cleanOpt(optC);
    optD = cleanOpt(optD);

    const type = String(q.type || (optA || optB ? 'mcq' : 'essay')).toLowerCase();

    let correctAnswer: string;
    const rawCorr = q.correct_answer ?? q.correctAnswer;
    if (type === 'mcq' && typeof rawCorr === 'number') {
      correctAnswer = String(rawCorr + 1); // convert 0-indexed number (0,1,2,3) to 1-4 option number
    } else if (rawCorr !== undefined && rawCorr !== null && String(rawCorr).trim()) {
      correctAnswer = String(rawCorr).trim();
    } else {
      correctAnswer = type === 'mcq' ? '1' : '';
    }

    return {
      question,
      option_a: optA,
      option_b: optB,
      option_c: optC,
      option_d: optD,
      correct_answer: correctAnswer,
      marks: Number(q.marks) || 20,
      type: type === 'true_false' ? 'true_false' : type === 'essay' ? 'essay' : type === 'structured' ? 'structured' : 'mcq',
      explanation: q.explanation ? String(q.explanation).trim() : '',
    };
  });

  return JSON.stringify(formatted, null, 2);
}
