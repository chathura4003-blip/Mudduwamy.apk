function getSiteSettingsFromDb() {
  try {
    const s = typeof localStorage !== 'undefined' ? localStorage.getItem('pirivena_site_settings') : null;
    return s ? JSON.parse(s) : {};
  } catch (e) {
    return {};
  }
}
import type {
  IAiProvider,
  AiModelConfig,
  AiCompletionOptions,
  AiCompletionResult,
  AiKeyTestResult,
  AiProviderName,
} from './types';
import { GeminiProvider } from './GeminiProvider';
import { OpenRouterProvider } from './OpenRouterProvider';
import { extractCleanErrorMessage } from './utils';

export function getApiKeys(overrideGeminiKey?: string, overrideOpenRouterKey?: string) {
  const settings = getSiteSettingsFromDb() || {};

  const envGeminiKey =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_API_KEY || import.meta.env?.GEMINI_API_KEY)) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_API_KEY) ||
    undefined;

  const envOpenRouterKey =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_OPENROUTER_API_KEY || import.meta.env?.OPENROUTER_API_KEY)) ||
    (typeof process !== 'undefined' && process.env?.OPENROUTER_API_KEY) ||
    undefined;

  const geminiKey =
    (overrideGeminiKey && overrideGeminiKey.trim()) ||
    (settings.geminiApiKey && settings.geminiApiKey.trim()) ||
    (envGeminiKey && String(envGeminiKey).trim()) ||
    undefined;

  const openRouterKey =
    (overrideOpenRouterKey && overrideOpenRouterKey.trim()) ||
    (settings.openRouterApiKey && settings.openRouterApiKey.trim()) ||
    (envOpenRouterKey && String(envOpenRouterKey).trim()) ||
    undefined;

  return { geminiKey, openRouterKey };
}

export function getAiModelConfig(
  overrideGeminiKey?: string,
  overrideOpenRouterKey?: string
): AiModelConfig {
  const settings = getSiteSettingsFromDb() || {};
  const { geminiKey, openRouterKey } = getApiKeys(overrideGeminiKey, overrideOpenRouterKey);

  const envPrimaryProvider =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_PRIMARY_PROVIDER || import.meta.env?.PRIMARY_PROVIDER)) ||
    (typeof process !== 'undefined' && process.env?.PRIMARY_PROVIDER);

  const primaryRaw = (
    envPrimaryProvider ||
    settings.primaryProvider ||
    settings.activeAiProvider ||
    'gemini'
  )
    .toLowerCase()
    .trim();
  let primaryProvider: AiProviderName = primaryRaw === 'openrouter' ? 'openrouter' : 'gemini';

  const hasValidOpenRouterKey = Boolean(
    openRouterKey && openRouterKey.trim().length > 10 && openRouterKey !== 'undefined'
  );
  const hasValidGeminiKey = Boolean(
    geminiKey && geminiKey.trim().length > 0 && geminiKey !== 'undefined'
  );

  // Smart provider auto-selection: if primary provider key is unconfigured or invalid, auto-switch primary
  if (primaryProvider === 'gemini' && !hasValidGeminiKey && hasValidOpenRouterKey) {
    primaryProvider = 'openrouter';
  } else if (primaryProvider === 'openrouter' && !hasValidOpenRouterKey && hasValidGeminiKey) {
    primaryProvider = 'gemini';
  }

  const defaultFallback = primaryProvider === 'gemini' ? 'openrouter' : 'gemini';
  const envFallbackProvider =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_FALLBACK_PROVIDER || import.meta.env?.FALLBACK_PROVIDER)) ||
    (typeof process !== 'undefined' && process.env?.FALLBACK_PROVIDER);

  const fallbackRaw = (
    envFallbackProvider ||
    settings.fallbackProvider ||
    defaultFallback
  )
    .toLowerCase()
    .trim();

  let fallbackProvider: AiProviderName | 'none' = 'none';
  if (fallbackRaw === 'gemini') fallbackProvider = 'gemini';
  else if (fallbackRaw === 'openrouter') fallbackProvider = 'openrouter';
  else if (fallbackRaw === 'none' || fallbackRaw === 'off' || fallbackRaw === 'disabled')
    fallbackProvider = 'none';
  else fallbackProvider = defaultFallback;

  if (fallbackProvider === primaryProvider) {
    fallbackProvider = primaryProvider === 'gemini' ? 'openrouter' : 'gemini';
  }

  const envGeminiModel =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_GEMINI_MODEL || import.meta.env?.GEMINI_MODEL)) ||
    (typeof process !== 'undefined' && process.env?.GEMINI_MODEL);

  const envOpenRouterModel =
    (typeof import.meta !== 'undefined' && (import.meta.env?.VITE_OPENROUTER_MODEL || import.meta.env?.OPENROUTER_MODEL)) ||
    (typeof process !== 'undefined' && process.env?.OPENROUTER_MODEL);

  const geminiModel = (
    envGeminiModel ||
    settings.geminiModel ||
    'gemini-2.5-flash'
  ).trim();
  const openRouterModel = (
    envOpenRouterModel ||
    settings.openRouterModel ||
    'google/gemini-2.0-flash-001'
  ).trim();

  return {
    primaryProvider,
    fallbackProvider,
    geminiModel,
    openRouterModel,
    geminiKey,
    openRouterKey,
  };
}

export class AiProviderManager {
  private providers: Map<AiProviderName, IAiProvider> = new Map();

  constructor() {
    const gemini = new GeminiProvider();
    const openrouter = new OpenRouterProvider();

    this.providers.set(gemini.name, gemini);
    this.providers.set(openrouter.name, openrouter);
  }

  getProvider(name: AiProviderName): IAiProvider {
    const provider = this.providers.get(name);
    if (!provider) {
      throw new Error(`AI Provider "${name}" is not supported.`);
    }
    return provider;
  }

  async testKey(providerName: AiProviderName, overrideKey?: string): Promise<AiKeyTestResult> {
    const provider = this.getProvider(providerName);
    return provider.testKey(overrideKey);
  }

  async executeCompletion(
    options: AiCompletionOptions,
    preferredProviderOverride?: string
  ): Promise<AiCompletionResult> {
    // 1. Client payload validation
    if (!options.prompt || typeof options.prompt !== 'string' || !options.prompt.trim()) {
      throw new Error('Invalid User Input: Prompt string is required and cannot be empty.');
    }

    const config = getAiModelConfig();

    // Determine execution order
    let primaryName: AiProviderName = config.primaryProvider;
    if (preferredProviderOverride === 'gemini' || preferredProviderOverride === 'openrouter') {
      primaryName = preferredProviderOverride;
    }

    const providersToTry: AiProviderName[] = [primaryName];

    let fallbackName: AiProviderName | 'none' = config.fallbackProvider;
    if (fallbackName !== 'none' && !providersToTry.includes(fallbackName)) {
      providersToTry.push(fallbackName);
    }

    // Always include gemini if geminiKey is available and not yet in list
    if (config.geminiKey && !providersToTry.includes('gemini')) {
      providersToTry.push('gemini');
    }

    // Always include openrouter if openRouterKey is available and not yet in list
    if (config.openRouterKey && !providersToTry.includes('openrouter')) {
      providersToTry.push('openrouter');
    }

    const errors: Record<string, string> = {};

    for (const pName of providersToTry) {
      const provider = this.getProvider(pName);
      if (provider.isConfigured(config)) {
        try {
          console.info(`[AI Provider Manager] Executing provider (${pName})...`);
          return await provider.generateCompletion(options, config);
        } catch (err: any) {
          const cleanErr = extractCleanErrorMessage(err);
          errors[pName] = cleanErr;
          console.warn(`[AI Provider Manager] Provider (${pName}) failed: ${cleanErr}`);
        }
      } else {
        errors[pName] = `${pName.toUpperCase()} API key is missing or unconfigured.`;
      }
    }

    // Throw comprehensive diagnostic error if all attempted providers failed
    const diagnosticMessage = [
      `AI Service Error (Tried: ${providersToTry.map((p) => p.toUpperCase()).join(', ')}):`,
      ...Object.entries(errors).map(([p, err]) => `• ${p.toUpperCase()}: ${err}`),
      `Action: Please check your API keys in Admin Panel -> Admin Settings.`,
    ].join('\n');

    throw new Error(diagnosticMessage);
  }
}

export const aiProviderManager = new AiProviderManager();
