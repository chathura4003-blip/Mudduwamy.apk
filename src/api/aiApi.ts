import { apiClient } from './apiClient';

export const aiApi = {
  chat: (prompt: string, language?: string, provider?: string) =>
    apiClient<{
      reply: string;
      source?: string;
      model?: string;
      success?: boolean;
      isAuthError?: boolean;
      error?: string;
    }>('/api/ai/chat', {
      method: 'POST',
      body: { prompt, language, provider },
      timeout: 60000,
    }),

  extractPaper: (fileData: any) =>
    apiClient<{
      success?: boolean;
      isAuthError?: boolean;
      title?: string;
      durationMinutes?: number;
      instructions?: string;
      questions: any[];
      error?: string;
    }>('/api/ai/extract-paper', {
      method: 'POST',
      body: fileData,
      timeout: 180000, // 3 minutes timeout for heavy OCR & multi-page PDF processing
    }),

  generateQuestions: (params: {
    topic: string;
    subject?: string;
    grade?: string;
    questionType?: string;
    count?: number;
  }) =>
    apiClient<{
      success?: boolean;
      count?: number;
      topic?: string;
      questions: any[];
      error?: string;
    }>('/api/ai/generate-questions', {
      method: 'POST',
      body: params,
      timeout: 60000,
    }),

  analyzeMaterial: (fileData: { fileBase64: string; fileName?: string; mimeType?: string }) =>
    apiClient<{
      success?: boolean;
      isAuthError?: boolean;
      title?: string;
      titleSinhala?: string;
      description?: string;
      type?: string;
      suggestedSubject?: string;
      suggestedClass?: string;
      error?: string;
    }>('/api/ai/analyze-material', {
      method: 'POST',
      body: fileData,
      timeout: 120000, // 2 minutes timeout for material document analysis
    }),
};
