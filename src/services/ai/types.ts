import type { Question } from '../../types';

export type AiProviderName = 'gemini' | 'openrouter';

export interface AiModelConfig {
  primaryProvider: AiProviderName;
  fallbackProvider: AiProviderName | 'none';
  geminiModel: string;
  openRouterModel: string;
  geminiKey?: string;
  openRouterKey?: string;
}

export interface AiCompletionOptions {
  prompt: string;
  systemInstruction?: string;
  temperature?: number;
  maxTokens?: number;
  responseJson?: boolean;
  useThinking?: boolean;
  timeoutMs?: number;
  media?: {
    dataBase64: string;
    mimeType: string;
  };
}

export interface AiCompletionResult {
  text: string;
  provider: AiProviderName;
  model: string;
  raw?: any;
}

export interface AiKeyTestResult {
  valid: boolean;
  message: string;
}

export interface IAiProvider {
  readonly name: AiProviderName;
  isConfigured(config: AiModelConfig): boolean;
  testKey(overrideKey?: string): Promise<AiKeyTestResult>;
  generateCompletion(
    options: AiCompletionOptions,
    config: AiModelConfig
  ): Promise<AiCompletionResult>;
}

export interface ExtractedPaperResult {
  success: boolean;
  isAuthError?: boolean;
  title: string;
  instructions: string;
  questions: Question[];
  error?: string;
  provider?: string;
  model?: string;
  pageCount?: number;
}
