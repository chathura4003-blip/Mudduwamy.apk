import { GoogleGenAI, ThinkingLevel } from '@google/genai';
import type {
  IAiProvider,
  AiProviderName,
  AiModelConfig,
  AiCompletionOptions,
  AiCompletionResult,
  AiKeyTestResult,
} from './types';
import { extractCleanErrorMessage, withTimeout, withSafeRetry } from './utils';

export class GeminiProvider implements IAiProvider {
  readonly name: AiProviderName = 'gemini';

  isConfigured(config: AiModelConfig): boolean {
    return Boolean(config.geminiKey && config.geminiKey.trim().length > 0);
  }

  async testKey(overrideKey?: string): Promise<AiKeyTestResult> {
    const envKey =
      (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY)) ||
      (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY);
    const key = (overrideKey && overrideKey.trim()) || (envKey && String(envKey).trim());
    if (!key) {
      return {
        valid: false,
        message: 'Google Gemini API key is missing from .env or server configuration.',
      };
    }

    try {
      const listUrl = `https://generativelanguage.googleapis.com/v1beta/models?key=${encodeURIComponent(key)}`;
      const res = await fetch(listUrl, { method: 'GET' });

      if (res.ok) {
        return {
          valid: true,
          message: 'Google Gemini API key is active and verified successfully!',
        };
      }

      const errData = await res.json().catch(() => ({}));
      const status = res.status;
      const msg = errData?.error?.message || res.statusText;

      if (
        status === 401 ||
        msg?.includes('UNAUTHENTICATED') ||
        msg?.includes('invalid authentication credentials')
      ) {
        return {
          valid: false,
          message:
            'Gemini Key Test Failed: Invalid or Unauthenticated API Key (401). Please verify your Google Gemini API key.',
        };
      } else if (status === 403) {
        return {
          valid: false,
          message:
            'Gemini Key Test Failed: API Key Permission Denied (403). Please check key permissions in Google AI Studio.',
        };
      } else if (
        status === 429 ||
        msg?.toLowerCase().includes('quota') ||
        msg?.includes('RESOURCE_EXHAUSTED')
      ) {
        return {
          valid: false,
          message:
            'Gemini Key Test Notice: API Quota / Rate Limit Exceeded (429 / RESOURCE_EXHAUSTED). You exceeded your current Gemini quota.',
        };
      } else {
        return { valid: false, message: `Gemini Key Test Failed: HTTP ${status} (${msg})` };
      }
    } catch (err: any) {
      console.info(`[Gemini Key Test Info]: ${extractCleanErrorMessage(err)}`);
    }

    // Fallback ping check using SDK
    const candidateModels = [
      'gemini-flash-lite-latest',
      'gemini-2.5-flash-lite',
      'gemini-3.7-flash',
      'gemini-3.5-flash',
      'gemini-flash-latest',
      'gemini-pro-latest',
      'gemini-2.5-flash',
    ];
    for (const modelName of candidateModels) {
      try {
        const ai = new GoogleGenAI({ apiKey: key });
        const response = await ai.models.generateContent({
          model: modelName,
          contents: 'Ping test. Reply with OK.',
        });
        if (response && response.text) {
          return {
            valid: true,
            message: `Google Gemini API key verified successfully (${modelName})!`,
          };
        }
      } catch (err: any) {
        const cleanMsg = extractCleanErrorMessage(err);
        if (cleanMsg.includes('401') || cleanMsg.includes('UNAUTHENTICATED')) {
          return {
            valid: false,
            message: 'Gemini Key Test Failed: Invalid or Unauthenticated API Key (401).',
          };
        }
      }
    }

    return {
      valid: false,
      message: 'Gemini Key Test Failed: Unable to verify API key with Gemini service.',
    };
  }

  async generateCompletion(
    options: AiCompletionOptions,
    config: AiModelConfig
  ): Promise<AiCompletionResult> {
    if (!config.geminiKey) {
      throw new Error('Google Gemini API Key is missing.');
    }

    const ai = new GoogleGenAI({ apiKey: config.geminiKey });

    const hasMedia = Boolean(options.media && options.media.dataBase64);

    const candidateModels = hasMedia
      ? Array.from(
          new Set([
            config.geminiModel,
            'gemini-flash-lite-latest',
            'gemini-2.5-flash-lite',
            'gemini-3.7-flash',
            'gemini-flash-latest',
            'gemini-2.5-flash',
          ])
        ).filter(Boolean)
      : options.useThinking
      ? Array.from(
          new Set([
            'gemini-3.1-pro-preview',
            config.geminiModel,
            'gemini-flash-lite-latest',
            'gemini-2.5-flash-lite',
            'gemini-3.7-flash',
          ])
        ).filter(Boolean)
      : Array.from(
          new Set([
            config.geminiModel,
            'gemini-flash-lite-latest',
            'gemini-2.5-flash-lite',
            'gemini-3.7-flash',
            'gemini-3.5-flash',
            'gemini-flash-latest',
            'gemini-2.5-flash',
          ])
        ).filter(Boolean);

    let lastError: any = null;

    for (const modelName of candidateModels) {
      try {
        const contents: any[] = [];
        if (options.media && options.media.dataBase64) {
          let pureBase64 = options.media.dataBase64;
          let mimeType = options.media.mimeType || 'image/png';
          if (pureBase64.includes(';base64,')) {
            const parts = pureBase64.split(';base64,');
            mimeType = parts[0].replace('data:', '') || mimeType;
            pureBase64 = parts[1];
          }
          contents.push({
            inlineData: {
              data: pureBase64,
              mimeType,
            },
          });
        }
        contents.push(options.prompt);

        const isThinkingModel =
          modelName === 'gemini-3.1-pro-preview' ||
          modelName === 'gemini-2.5-pro' ||
          Boolean(options.useThinking);

        const configObj: any = {};
        if (options.systemInstruction) {
          configObj.systemInstruction = options.systemInstruction;
        }
        if (options.temperature !== undefined) {
          configObj.temperature = options.temperature;
        }
        if (options.responseJson) {
          configObj.responseMimeType = 'application/json';
        }

        if (isThinkingModel) {
          configObj.thinkingConfig = {
            thinkingLevel: ThinkingLevel.HIGH,
          };
          // Explicitly do NOT set maxOutputTokens when using thinking mode
        } else {
          configObj.maxOutputTokens = options.maxTokens || 8192;
        }

        const timeoutMs = options.timeoutMs || 45000;

        const resultText = await withSafeRetry(
          () =>
            withTimeout(
              (async () => {
                const response = await ai.models.generateContent({
                  model: modelName,
                  contents,
                  config: configObj,
                });
                if (!response || !response.text) {
                  throw new Error(`Empty response returned from Gemini model (${modelName}).`);
                }
                return response.text;
              })(),
              timeoutMs,
              `Gemini (${modelName})`
            ),
          1,
          1000
        );

        return {
          text: resultText,
          provider: 'gemini',
          model: modelName,
        };
      } catch (err: any) {
        lastError = err;
        const cleanMsg = extractCleanErrorMessage(err);
        console.info(`[Gemini Provider] Model ${modelName} notice: ${cleanMsg}. Trying next model...`);

        if (
          cleanMsg.includes('401') ||
          cleanMsg.includes('UNAUTHENTICATED') ||
          cleanMsg.includes('invalid authentication credentials')
        ) {
          throw new Error(`Gemini Authentication Error (401): ${cleanMsg}`);
        }
      }
    }

    throw new Error(`Gemini Provider Failure: ${extractCleanErrorMessage(lastError)}`);
  }
}
