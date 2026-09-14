import { validateUploadedPaperFile } from './paperProcessor';
import { aiProviderManager } from './AiProviderManager';
import { extractCleanErrorMessage, safeJsonParse } from './utils';

export interface ExtractedMaterialResult {
  success: boolean;
  isAuthError?: boolean;
  title: string;
  titleSinhala: string;
  description: string;
  type: 'pdf' | 'notes' | 'past_paper' | 'audio' | 'video';
  suggestedSubject?: string;
  suggestedClass?: string;
  error?: string;
}

export async function processMaterialAnalysis(
  fileBase64: string,
  fileName?: string,
  mimeType?: string
): Promise<ExtractedMaterialResult> {
  const validation = validateUploadedPaperFile(fileBase64, fileName, mimeType, 20 * 1024 * 1024);
  if (!validation.valid) {
    const fallbackTitle = fileName ? fileName.replace(/\.[^/.]+$/, '') : 'Study Note';
    return {
      success: false,
      title: fallbackTitle,
      titleSinhala: fallbackTitle,
      description: '',
      type: 'notes',
      error: validation.error,
    };
  }

  const { mimeType: verifiedMime } = validation;

  const promptText = `You are an expert Pirivena educational resource OCR and metadata extraction engine for Sri Sumana Pirivena in Ratnapura, Sri Lanka.

Analyze the attached document/image photo/notes carefully.
Extract and synthesize:
1. "title": Short descriptive title in English or Sinhala for this note/material.
2. "titleSinhala": Title in Sinhala language script (or translation of title to Sinhala).
3. "description": Detailed transcribed text or comprehensive bulleted summary in Sinhala of the notes/contents written on the document/photo. (Include key Pali verses/stanzas, definitions, or main bullet points so students can read or listen to it directly).
4. "type": Best fit category. Must be one of: "notes", "pdf", "past_paper", "audio", "video". (For photos of written/printed notes, use "notes").
5. "suggestedSubject": Keyword matching subject, e.g., "pali", "tripitaka", "buddhist_culture", "sinhala", "sanskrit", "english", "history".
6. "suggestedClass": Grade or class mentioned (e.g. Prathama, Madhyama, Avasana, Grade 6-11).

Return strictly valid JSON format matching this schema:
{
  "title": "...",
  "titleSinhala": "...",
  "description": "...",
  "type": "notes",
  "suggestedSubject": "...",
  "suggestedClass": "..."
}

Return ONLY raw JSON.`;

  let pureBase64 = fileBase64;
  if (fileBase64.includes(';base64,')) {
    pureBase64 = fileBase64.split(';base64,')[1];
  }

  try {
    const completion = await aiProviderManager.executeCompletion({
      prompt: promptText,
      responseJson: true,
      useThinking: true,
      media: {
        dataBase64: pureBase64,
        mimeType: verifiedMime,
      },
      temperature: 0.2,
      timeoutMs: 45000,
    });

    const parsed = safeJsonParse(completion.text || '') || {};

    const validTypes = ['pdf', 'notes', 'past_paper', 'audio', 'video'];
    const selectedType = validTypes.includes(parsed.type) ? parsed.type : 'notes';

    return {
      success: true,
      title: parsed.title || fileName || 'Study Note',
      titleSinhala: parsed.titleSinhala || parsed.title || 'අධ්‍යයන සටහන',
      description: parsed.description || '',
      type: selectedType as any,
      suggestedSubject: parsed.suggestedSubject || 'general',
      suggestedClass: parsed.suggestedClass || 'all',
    };
  } catch (err: any) {
    const cleanMsg = extractCleanErrorMessage(err);
    console.warn('[AI Material Vision Fallback]:', cleanMsg);
    const isAuth =
      cleanMsg.includes('401') ||
      cleanMsg.includes('UNAUTHENTICATED') ||
      cleanMsg.includes('API key');

    const cleanTitle = fileName
      ? fileName.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ')
      : 'අධ්‍යයන සටහන (Study Note)';

    return {
      success: false,
      isAuthError: isAuth,
      title: cleanTitle,
      titleSinhala: cleanTitle,
      description:
        'ඡායාරූපයෙන් තොරතුරු ස්වයංක්‍රීයව කියවීමට නොහැකි විය. කරුණාකර මාතෘකාව සහ සටහන අතින් ඇතුළත් කරන්න.',
      type: 'notes',
      error: isAuth ? '🔑 AI API Key නොමැත. (Check Admin AI API settings)' : cleanMsg,
    };
  }
}
