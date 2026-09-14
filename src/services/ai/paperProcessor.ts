import fs from 'fs';
import path from 'path';
import os from 'os';
import { aiProviderManager } from './AiProviderManager';
import { validateAndCleanPaperResponse, fallbackExtractQuestionsFromRawText } from './validator';
import { extractCleanErrorMessage } from './utils';
import type { ExtractedPaperResult, AiProviderName } from './types';
import type { Question } from '../../types';

export interface FileValidationResult {
  valid: boolean;
  mimeType: string;
  extension: string;
  sizeBytes: number;
  buffer: Buffer;
  error?: string;
}

/**
 * Validates uploaded file MIME type, extension, size, and header magic bytes.
 */
export function validateUploadedPaperFile(
  fileBase64: string,
  fileName?: string,
  declaredMimeType?: string,
  maxSizeBytes: number = 50 * 1024 * 1024 // 50MB
): FileValidationResult {
  if (!fileBase64 || typeof fileBase64 !== 'string' || !fileBase64.trim()) {
    return {
      valid: false,
      mimeType: '',
      extension: '',
      sizeBytes: 0,
      buffer: Buffer.alloc(0),
      error: 'ගොනු දත්ත ලබා දී නොමැත (Empty file payload).',
    };
  }

  let pureBase64 = fileBase64;
  let mimeFromDataUrl = '';
  if (fileBase64.includes(';base64,')) {
    const parts = fileBase64.split(';base64,');
    mimeFromDataUrl = parts[0].replace('data:', '').trim();
    pureBase64 = parts[1];
  }

  let buffer: Buffer;
  try {
    buffer = Buffer.from(pureBase64, 'base64');
  } catch (err) {
    return {
      valid: false,
      mimeType: '',
      extension: '',
      sizeBytes: 0,
      buffer: Buffer.alloc(0),
      error: 'අවලංගු Base64 ගොනු සංකේතනයකි (Invalid base64 encoding).',
    };
  }

  if (!buffer || buffer.length === 0) {
    return {
      valid: false,
      mimeType: '',
      extension: '',
      sizeBytes: 0,
      buffer: Buffer.alloc(0),
      error: 'උඩුගත කළ ගොනුව හිස් ය (0 Bytes file).',
    };
  }

  if (buffer.length > maxSizeBytes) {
    const sizeMb = (buffer.length / (1024 * 1024)).toFixed(1);
    return {
      valid: false,
      mimeType: '',
      extension: '',
      sizeBytes: buffer.length,
      buffer,
      error: `ගොනුවේ ප්‍රමාණය (${sizeMb} MB) උපරිම අනුමත සීමාව වන 15 MB ඉක්මවා ඇත.`,
    };
  }

  // Validate Header Magic Bytes (Security Layer)
  let actualMime = '';
  let extension = '';

  if (
    buffer.length >= 4 &&
    buffer[0] === 0x25 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x44 &&
    buffer[3] === 0x46
  ) {
    actualMime = 'application/pdf';
    extension = 'pdf';
  } else if (
    buffer.length >= 4 &&
    buffer[0] === 0x89 &&
    buffer[1] === 0x50 &&
    buffer[2] === 0x4e &&
    buffer[3] === 0x47
  ) {
    actualMime = 'image/png';
    extension = 'png';
  } else if (buffer.length >= 3 && buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    actualMime = 'image/jpeg';
    extension = 'jpg';
  } else {
    return {
      valid: false,
      mimeType: declaredMimeType || mimeFromDataUrl || 'unknown',
      extension: '',
      sizeBytes: buffer.length,
      buffer,
      error:
        'ආරක්ෂිත පරික්ෂාව: ගොනු හිස (Magic Bytes) සහාය දක්වන ආකෘතියකට (PDF, JPG, JPEG, PNG) අනුකූල නොවේ.',
    };
  }

  return {
    valid: true,
    mimeType: actualMime,
    extension,
    sizeBytes: buffer.length,
    buffer,
  };
}

/**
 * Safely extracts text layer and page count from a PDF buffer using pdf-parse.
 */
async function extractPdfTextAndPages(
  buffer: Buffer
): Promise<{ text: string; pageCount: number }> {
  try {
    // @ts-ignore
    const pdfModule = await import(/* @vite-ignore */ 'pdf-parse').catch(() => null);
    const { PDFParse } = (pdfModule || {}) as any;

    if (PDFParse && typeof PDFParse === 'function') {
      const parser = new PDFParse({ data: buffer });
      if (typeof parser.load === 'function') {
        await parser.load();
      }
      let text = '';
      let pageCount = 1;

      if (typeof parser.getText === 'function') {
        const res = await parser.getText();
        text = typeof res === 'string' ? res : res?.text || '';
        pageCount = res?.pages?.length || parser?.doc?.numPages || 1;
      }
      return { text: text.trim(), pageCount: pageCount || 1 };
    }
    return { text: '', pageCount: 1 };
  } catch (err) {
    console.warn('[PDF Parser Warning] Could not parse text layer:', extractCleanErrorMessage(err));
    return { text: '', pageCount: 1 };
  }
}

/**
 * Main AI Paper Vision Extraction Pipeline.
 */
export async function processPaperExtraction(
  fileBase64: string,
  fileName?: string,
  mimeType?: string
): Promise<ExtractedPaperResult> {
  const startTime = Date.now();
  let tempFilePath: string | null = null;

  // 1. Validate File Metadata, Magic Bytes, Size
  const validation = validateUploadedPaperFile(fileBase64, fileName, mimeType);
  if (!validation.valid) {
    console.warn(
      `[AI Paper Vision] Upload validation failed for "${fileName || 'unnamed'}": ${validation.error}`
    );
    return {
      success: false,
      title: '',
      instructions: '',
      questions: [],
      error: validation.error,
    };
  }

  const { buffer, mimeType: verifiedMime, extension, sizeBytes } = validation;
  const sizeKb = (sizeBytes / 1024).toFixed(1);
  console.log(
    `[AI Paper Vision] Processing uploaded paper "${fileName || 'document'}" (${verifiedMime}, ${sizeKb} KB)`
  );

  let extractedPdfText = '';
  let pageCount = 1;

  try {
    // 2. Safely create temporary file on disk for file processing and ensure deletion in finally
    const tempDir = os.tmpdir();
    tempFilePath = path.join(
      tempDir,
      `paper_vision_${Date.now()}_${Math.random().toString(36).substring(2, 8)}.${extension}`
    );
    fs.writeFileSync(tempFilePath, buffer);

    // 3. For PDF documents, extract text layer and check page count limits
    if (verifiedMime === 'application/pdf') {
      const pdfInfo = await extractPdfTextAndPages(buffer);
      extractedPdfText = pdfInfo.text;
      pageCount = pdfInfo.pageCount;

      console.log(
        `[AI Paper Vision] PDF text layer parsed: ${pageCount} pages, ${extractedPdfText.length} chars text.`
      );

      if (pageCount > 30) {
        return {
          success: false,
          title: '',
          instructions: '',
          questions: [],
          error: `ප්‍රශ්න පත්‍රයේ පිටු ගණන (${pageCount}) උපරිම අනුමත පිටු 30 සීමාව ඉක්මවා ඇත.`,
        };
      }
    }

    // Limit text layer in prompt to max 20,000 characters to preserve token window
    const safeTextLayer = extractedPdfText.length > 20000
      ? extractedPdfText.slice(0, 20000) + '\n...[Text Layer Truncated for Prompt]'
      : extractedPdfText;

    // 4. Construct AI Vision System Prompt with strict 9-column extraction instructions
    const promptText = `You are a high-precision Examination Document OCR & JSON Grid Extractor AI for Pirivena & Pracheena Oriental Examination Papers.
Your task is to transcribe and extract ALL questions from the provided PDF / image paper into a standardized JSON array where EVERY object strictly adheres to this schema:

### REQUIRED JSON SCHEMA FOR EACH QUESTION:
{
  "question": "Exact question text in original language (Sinhala/Pali/Sanskrit/English/Tamil)",
  "option_a": "Option A / 1 clean text (or null if not MCQ)",
  "option_b": "Option B / 2 clean text (or null if not MCQ)",
  "option_c": "Option C / 3 clean text (or null if not MCQ)",
  "option_d": "Option D / 4 clean text (or null if not MCQ)",
  "correct_answer": "1", // String "1", "2", "3", or "4" for MCQ (representing option 1 to 4 index); or answer text / boolean for others
  "marks": 20, // Number (default 20 or marks specified in paper)
  "type": "mcq", // String "mcq" | "essay" | "true_false" | "structured"
  "explanation": "Brief explanation or model answer"
}

### CRITICAL EXTRACTION RULES:
1. Extract EVERY single question in sequence. Do NOT omit or truncate any question.
2. Preserve Devanagari script, Sinhala diacritics, and punctuation (।, ?, :) accurately.
3. For MCQ options, strip leading numbers/labels like "(1)", "(2)", "(A)", "A)", "1." so option_a, option_b, option_c, option_d contain only the clean option text.
4. Set "correct_answer" to "1", "2", "3", or "4" as a string indicating the 1-based option number.
5. Default "marks" to 20 if not explicitly indicated.
6. Output MUST be ONLY valid JSON matching this schema.

Document Info:
File: ${fileName || 'Exam Paper'}
Pages: ${pageCount}
${safeTextLayer ? `Extracted Text Layer:\n"""\n${safeTextLayer}\n"""\n` : ''}

### EXACT EXAMPLE JSON OUTPUT FORMAT:
[
  {
    "question": "පාලි වාක්ය රටාවෙහි උක්තය සඳහා භාවිතා වන ප්රධාන විභත්තිය කුමක්ද? (What is the primary grammatical case used for the subject in Pali?)",
    "option_a": "පඨමා විභත්තිය (Nominative)",
    "option_b": "දුතියා විභත්තිය (Accusative)",
    "option_c": "තතියා විභත්තිය (Instrumental)",
    "option_d": "ඡට්ඨී විභත්තිය (Genitive)",
    "correct_answer": "1",
    "marks": 20,
    "type": "mcq",
    "explanation": "Nominative (Paṭhamā) case marks the grammatical subject."
  }
]`;

    let pureBase64 = fileBase64;
    if (fileBase64.includes(';base64,')) {
      pureBase64 = fileBase64.split(';base64,')[1];
    }

    // 5. Execute Vision Completion via AI Provider Manager
    const completion = await aiProviderManager.executeCompletion({
      prompt: promptText,
      responseJson: true,
      useThinking: false,
      media: {
        dataBase64: pureBase64,
        mimeType: verifiedMime,
      },
      temperature: 0.1,
      maxTokens: 8192,
      timeoutMs: 180000,
    });

    // 6. Schema Validation & Cleanup of returned JSON
    let parsedPaper = validateAndCleanPaperResponse(completion.text, fileName);

    // If AI model returned no questions, attempt text layer fallback extraction if available
    if ((!parsedPaper || parsedPaper.questions.length === 0) && extractedPdfText.trim().length > 0) {
      console.log('[AI Paper Vision Fallback] AI model response gave 0 questions. Attempting text layer fallback parsing...');
      const fallbackQuestions = fallbackExtractQuestionsFromRawText(extractedPdfText);
      if (fallbackQuestions.length > 0) {
        parsedPaper = {
          title: fileName ? `ප්‍රශ්න පත්‍රය (${fileName.replace(/\.[^/.]+$/, '')})` : 'ප්‍රශ්න පත්‍රය',
          instructions: 'සියලුම ප්‍රශ්නවලට පිළිතුරු සපයන්න.',
          questions: fallbackQuestions,
        };
      }
    }

    const durationMs = Date.now() - startTime;

    if (parsedPaper && parsedPaper.questions.length > 0) {
      console.log(
        `[AI Paper Vision Success] Extracted ${parsedPaper.questions.length} questions from "${fileName || 'document'}" in ${durationMs}ms using ${completion.provider} (${completion.model})`
      );

      return {
        success: true,
        title: parsedPaper.title,
        instructions: parsedPaper.instructions,
        questions: parsedPaper.questions,
        provider: completion.provider,
        model: completion.model,
        pageCount,
      };
    }

    console.warn(
      `[AI Paper Vision Unreadable] Failed to extract valid questions from "${fileName || 'document'}" (${durationMs}ms)`
    );
    return {
      success: false,
      title: '',
      instructions: '',
      questions: [],
      pageCount,
      error:
        'ප්‍රශ්න පත්‍රයෙන් ප්‍රශ්න හඳුනා ගැනීමට නොහැකි විය. කරුණාකර වඩාත් පැහැදිලි ඡායාරූපයක් හෝ PDF ලේඛනයක් ලබාදෙන්න.',
    };
  } catch (err: any) {
    const durationMs = Date.now() - startTime;
    const cleanMsg = extractCleanErrorMessage(err);
    console.error(`[AI Paper Vision Error] Processing failed (${durationMs}ms): ${cleanMsg}`);

    // If API call failed or timed out, but text layer is available from PDF
    if (extractedPdfText && extractedPdfText.trim().length > 0) {
      console.log('[AI Paper Vision Recovery] AI Model request failed, but extracted PDF text is available. Attempting fallback question parsing...');
      const fallbackQuestions = fallbackExtractQuestionsFromRawText(extractedPdfText);
      if (fallbackQuestions.length > 0) {
        return {
          success: true,
          title: fileName ? `ප්‍රශ්න පත්‍රය (${fileName.replace(/\.[^/.]+$/, '')})` : 'ප්‍රශ්න පත්‍රය',
          instructions: 'සියලුම ප්‍රශ්නවලට පිළිතුරු සපයන්න.',
          questions: fallbackQuestions,
          provider: 'pdf-text-layer',
          model: 'text-fallback',
          pageCount,
        };
      }
    }

    const isMissingKey =
      cleanMsg.includes('missing or unconfigured') ||
      cleanMsg.includes('API key is missing');

    const isAuth =
      isMissingKey ||
      cleanMsg.includes('401') ||
      cleanMsg.includes('UNAUTHENTICATED') ||
      cleanMsg.includes('invalid authentication credentials');

    let userErrorMsg = `ප්‍රශ්න පත්‍රය කියවීමට අපොහොසත් විය: ${cleanMsg}`;
    if (isMissingKey) {
      userErrorMsg = '🔑 AI API Key නොමැත. කරුණාකර Admin Panel -> Settings හි Google Gemini හෝ OpenRouter API Key ඇතුළත් කරන්න.';
    } else if (isAuth) {
      userErrorMsg = '🔑 ඇතුළත් කර ඇති AI API Key සක්‍රීය හෝ වලංගු නැත (HTTP 401). කරුණාකර Admin Panel එකෙන් API Keys පරීක්ෂා කරන්න.';
    }

    return {
      success: false,
      isAuthError: isAuth,
      title: '',
      instructions: '',
      questions: [],
      pageCount,
      error: userErrorMsg,
    };
  } finally {
    // 7. ALWAYS clean up temporary file
    if (tempFilePath && fs.existsSync(tempFilePath)) {
      try {
        fs.unlinkSync(tempFilePath);
        console.log(`[AI Paper Vision] Temporary file cleaned: ${tempFilePath}`);
      } catch (cleanErr) {
        console.warn(`[AI Paper Vision] Failed to delete temp file (${tempFilePath}):`, cleanErr);
      }
    }
  }
}
