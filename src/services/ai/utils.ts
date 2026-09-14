export function extractCleanErrorMessage(err: any): string {
  if (!err) return 'Unknown error';
  const raw = typeof err === 'string' ? err : err.message || String(err);
  try {
    const parsed = JSON.parse(raw);
    if (parsed?.error?.message) {
      return parsed.error.message;
    }
  } catch (_) {}
  return raw;
}

export function withTimeout<T>(
  promise: Promise<T>,
  timeoutMs: number = 30000,
  label: string = 'AI Request'
): Promise<T> {
  let timer: NodeJS.Timeout;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timer = setTimeout(() => {
      reject(new Error(`${label} timed out after ${Math.round(timeoutMs / 1000)} seconds.`));
    }, timeoutMs);
  });

  return Promise.race([promise, timeoutPromise]).finally(() => {
    clearTimeout(timer);
  });
}

export async function withSafeRetry<T>(
  fn: () => Promise<T>,
  retries: number = 1,
  delayMs: number = 1000,
  shouldRetry: (err: any) => boolean = (err) => {
    const msg = extractCleanErrorMessage(err).toLowerCase();
    // Do not retry on same model for auth errors, bad requests, or high demand / quota limits.
    // Instead fail fast so model/provider failover can take place immediately.
    if (
      msg.includes('401') ||
      msg.includes('unauthenticated') ||
      msg.includes('bad request') ||
      msg.includes('invalid') ||
      msg.includes('400') ||
      msg.includes('high demand') ||
      msg.includes('overloaded') ||
      msg.includes('quota') ||
      msg.includes('429')
    ) {
      return false;
    }
    return true;
  }
): Promise<T> {
  let lastError: any;
  for (let attempt = 0; attempt <= retries; attempt++) {
    try {
      return await fn();
    } catch (err: any) {
      lastError = err;
      if (attempt < retries && shouldRetry(err)) {
        console.info(
          `[AI Retry Guard]: Transient error on attempt ${attempt + 1} (${extractCleanErrorMessage(err)}). Retrying in ${delayMs}ms...`
        );
        await new Promise((res) => setTimeout(res, delayMs));
      } else {
        break;
      }
    }
  }
  throw lastError;
}

export function safeJsonParse(rawText: string): any {
  if (!rawText || typeof rawText !== 'string') return null;
  let text = rawText.trim();
  text = text.replace(/^```(?:json)?\s*/gi, '').replace(/\s*```$/gi, '');

  // 1. Try parsing full JSON match
  const jsonMatch = text.match(/\{[\s\S]*\}|\[[\s\S]*\]/);
  if (jsonMatch) {
    const candidate = jsonMatch[0];
    try {
      return JSON.parse(candidate);
    } catch (_) {
      try {
        const cleaned = candidate
          .replace(/,\s*([\]\}])/g, '$1')
          .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
        return JSON.parse(cleaned);
      } catch (__) {}
    }
  }

  // 2. Try direct JSON.parse
  try {
    return JSON.parse(text);
  } catch (_) {
    try {
      const cleaned = text
        .replace(/,\s*([\]\}])/g, '$1')
        .replace(/[\u0000-\u001F\u007F-\u009F]/g, ' ');
      return JSON.parse(cleaned);
    } catch (__) {}
  }

  // 3. Fallback for truncated JSON arrays: recover all complete JSON objects {...}
  if (text.includes('{') && text.includes('}')) {
    const recoveredObjects: any[] = [];
    const objectRegex = /\{[^{}]*(?:\{[^{}]*\}[^{}]*)*\}/g;
    let match;
    while ((match = objectRegex.exec(text)) !== null) {
      if (match.index === objectRegex.lastIndex) {
        objectRegex.lastIndex++;
      }
      try {
        const obj = JSON.parse(match[0]);
        if (obj && typeof obj === 'object') {
          recoveredObjects.push(obj);
        }
      } catch (_) {
        // try cleaning trailing comma
        try {
          const cleanObj = JSON.parse(match[0].replace(/,\s*\}/g, '}'));
          if (cleanObj && typeof cleanObj === 'object') {
            recoveredObjects.push(cleanObj);
          }
        } catch (__) {}
      }
    }
    if (recoveredObjects.length > 0) {
      return recoveredObjects;
    }
  }

  return null;
}
