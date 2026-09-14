import type {
  IAiProvider,
  AiProviderName,
  AiModelConfig,
  AiCompletionOptions,
  AiCompletionResult,
  AiKeyTestResult,
} from './types';
import { extractCleanErrorMessage, withTimeout } from './utils';

export class OpenRouterProvider implements IAiProvider {
  readonly name: AiProviderName = 'openrouter';

  isConfigured(config: AiModelConfig): boolean {
    return Boolean(
      config.openRouterKey &&
        config.openRouterKey.trim().length > 10 &&
        config.openRouterKey !== 'undefined' &&
        config.openRouterKey !== 'null'
    );
  }

  async testKey(overrideKey?: string): Promise<AiKeyTestResult> {
    const envKey =
      (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_OPENROUTER_API_KEY || import.meta.env?.OPENROUTER_API_KEY)) ||
      (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY);
    const key = (overrideKey && overrideKey.trim()) || (envKey && String(envKey).trim());
    if (!key) {
      return { valid: false, message: 'OpenRouter API key is missing from .env or server configuration.' };
    }

    const testModels = Array.from(
      new Set([
        process.env.OPENROUTER_MODEL,
        'google/gemini-2.0-flash-001',
        'openrouter/auto',
        'google/gemini-flash-1.5',
        'meta-llama/llama-3.3-70b-instruct:free',
      ])
    ).filter(Boolean) as string[];

    let lastErrorMessage = '';

    for (const testModel of testModels) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${key}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': process.env.APP_URL || 'https://pirivena.edu.lk',
            'X-Title': 'Sri Sumana Maha Pirivena ERP',
          },
          body: JSON.stringify({
            model: testModel,
            messages: [{ role: 'user', content: 'Ping test' }],
            max_tokens: 10,
          }),
        });

        if (res.ok) {
          const data = await res.json();
          if (data?.choices?.[0]?.message) {
            return {
              valid: true,
              message: `OpenRouter API key verified successfully (${testModel})!`,
            };
          }
        }

        const errData = await res.json().catch(() => ({}));
        lastErrorMessage = errData?.error?.message || res.statusText || 'Invalid API key';
      } catch (err: any) {
        lastErrorMessage = extractCleanErrorMessage(err);
      }
    }

    return { valid: false, message: `OpenRouter Key Test Failed: ${lastErrorMessage}` };
  }

  async generateCompletion(
    options: AiCompletionOptions,
    config: AiModelConfig
  ): Promise<AiCompletionResult> {
    if (!config.openRouterKey) {
      throw new Error('OpenRouter API Key is missing.');
    }

    const hasMedia = Boolean(options.media && options.media.dataBase64);

    const candidateModels = hasMedia
      ? Array.from(
          new Set([
            config.openRouterModel,
            'google/gemini-2.0-flash-001',
            'google/gemini-flash-1.5',
            'openrouter/auto',
          ])
        ).filter(Boolean)
      : Array.from(
          new Set([
            config.openRouterModel,
            'google/gemini-2.0-flash-001',
            'meta-llama/llama-3.3-70b-instruct:free',
            'deepseek/deepseek-r1:free',
            'mistralai/mistral-7b-instruct:free',
            'qwen/qwen-2.5-72b-instruct:free',
            'openrouter/auto',
          ])
        ).filter(Boolean);

    let lastError: any = null;

    for (const modelName of candidateModels) {
      const initialMaxTokens = options.maxTokens || 8192;
      const tokenLimitsToTry =
        initialMaxTokens > 2000 ? [initialMaxTokens, 4096, 2048] : [initialMaxTokens];

      for (const tokenLimit of tokenLimitsToTry) {
        try {
          const messages: any[] = [];
          if (options.systemInstruction) {
            messages.push({ role: 'system', content: options.systemInstruction });
          }

          let userContent: any = options.prompt;

          if (options.media && options.media.dataBase64) {
            let pureBase64 = options.media.dataBase64;
            let mimeType = options.media.mimeType || 'image/png';
            if (pureBase64.includes(';base64,')) {
              const parts = pureBase64.split(';base64,');
              mimeType = parts[0].replace('data:', '') || mimeType;
              pureBase64 = parts[1];
            }

            const dataUrl = `data:${mimeType};base64,${pureBase64}`;
            if (mimeType.startsWith('image/')) {
              userContent = [
                { type: 'text', text: options.prompt },
                { type: 'image_url', image_url: { url: dataUrl } },
              ];
            } else if (mimeType === 'application/pdf') {
              userContent = [
                { type: 'text', text: options.prompt },
                { type: 'file_url', file_url: { url: dataUrl } },
              ];
            } else {
              userContent = `${options.prompt}\n\n[ATTACHED MEDIA CONTENT DETECTED]`;
            }
          }

          messages.push({ role: 'user', content: userContent });

          const requestBody: any = {
            model: modelName,
            max_tokens: tokenLimit,
            messages,
          };

          if (options.temperature !== undefined) {
            requestBody.temperature = options.temperature;
          }

          const timeoutMs = options.timeoutMs || 35000;

          const res = await withTimeout(
            fetch('https://openrouter.ai/api/v1/chat/completions', {
              method: 'POST',
              headers: {
                Authorization: `Bearer ${config.openRouterKey}`,
                'Content-Type': 'application/json',
                'HTTP-Referer': process.env.APP_URL || 'https://pirivena.edu.lk',
                'X-Title': 'Sri Sumana Maha Pirivena ERP',
              },
              body: JSON.stringify(requestBody),
            }),
            timeoutMs,
            `OpenRouter (${modelName})`
          );

          if (res.ok) {
            const data = await res.json();
            const text = data?.choices?.[0]?.message?.content;
            if (text && typeof text === 'string') {
              return {
                text,
                provider: 'openrouter',
                model: data?.model || modelName,
                raw: data,
              };
            }
          }

          const errData = await res.json().catch(() => ({}));
          const errMsg = errData?.error?.message || res.statusText || 'Error';
          lastError = new Error(`OpenRouter HTTP ${res.status}: ${errMsg}`);

          // Handle 402 payment / token limit guard
          if (
            res.status === 402 ||
            errMsg.includes('402') ||
            errMsg.toLowerCase().includes('credits')
          ) {
            console.warn(
              `[OpenRouter 402 Guard] Model ${modelName} with max_tokens=${tokenLimit} failed due to credits/token limit. Retrying with lower max_tokens limit...`
            );
            continue; // try smaller token limit
          }

          // If 401 unauthenticated, throw auth error immediately
          if (
            res.status === 401 ||
            errMsg.includes('401') ||
            errMsg.toLowerCase().includes('unauthorized')
          ) {
            throw new Error(`OpenRouter Authentication Error (401): ${errMsg}`);
          }

          // For other HTTP status codes, break token limit loop to try next candidate model
          break;
        } catch (err: any) {
          lastError = err;
          const cleanMsg = extractCleanErrorMessage(err);
          console.warn(`[OpenRouter Provider Warning] (${modelName}): ${cleanMsg}`);
          if (cleanMsg.includes('401') || cleanMsg.includes('Unauthorized')) {
            throw err;
          }
          break;
        }
      }
    }

    throw new Error(`OpenRouter Provider Failure: ${extractCleanErrorMessage(lastError)}`);
  }
}
