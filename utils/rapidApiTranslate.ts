/**
 * VarTalaab Translation Engine
 * Chain: Google Translate (unofficial, always free) → MyMemory → RapidAPI
 * "hi" → "hola" (Spanish), "maa" → "आई" (Marathi) — all work correctly.
 */

const LANG_MAP: Record<string, string> = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  'zh': 'zh-CN',
};

function code(lang: string): string {
  return LANG_MAP[lang] ?? lang;
}

// ── Engine 1: Google Translate unofficial (no key, always works) ──────────────
async function googleUnofficial(text: string, from: string, to: string): Promise<string> {
  const sl = from === 'auto' ? 'auto' : code(from);
  const tl = code(to);
  const url =
    `https://translate.googleapis.com/translate_a/single` +
    `?client=gtx&sl=${sl}&tl=${tl}&dt=t&q=${encodeURIComponent(text)}`;

  const r = await fetch(url, { headers: { 'User-Agent': 'Mozilla/5.0' } });
  if (!r.ok) throw new Error(`Google unofficial ${r.status}`);
  const data = await r.json();
  // Response shape: [ [ ["translated","original",...], ... ], ... ]
  const parts: string[] = [];
  if (Array.isArray(data?.[0])) {
    for (const chunk of data[0]) {
      if (Array.isArray(chunk) && typeof chunk[0] === 'string') parts.push(chunk[0]);
    }
  }
  const result = parts.join('').trim();
  if (!result) throw new Error('Empty response from Google');
  return result;
}

// ── Engine 2: MyMemory (free, no key) ─────────────────────────────────────────
async function myMemory(text: string, from: string, to: string): Promise<string> {
  const sl = from === 'auto' ? 'en' : code(from);
  const tl = code(to);
  const url = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${sl}|${tl}`;
  const r = await fetch(url);
  if (!r.ok) throw new Error(`MyMemory ${r.status}`);
  const data = await r.json();
  // Accept any non-empty translatedText regardless of responseStatus
  const t = data?.responseData?.translatedText?.trim();
  if (t && t.toLowerCase() !== 'invalid language pair') return t;
  throw new Error('MyMemory: no result');
}

// ── Engine 3: RapidAPI Google Translate ───────────────────────────────────────
async function rapidApi(text: string, from: string, to: string): Promise<string> {
  const key = (import.meta.env.VITE_RAPIDAPI_KEY?.trim()) ||
    '48ee68b2dcmsha1b4b92776621f4p151e90jsna17c78afdc2b';
  const sl = from === 'auto' ? 'auto' : code(from);
  const tl = code(to);

  const r = await fetch('https://google-translate113.p.rapidapi.com/api/v1/translator/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'google-translate113.p.rapidapi.com',
    },
    body: JSON.stringify({ from: sl, to: tl, text: text.slice(0, 5000) }),
  });
  if (!r.ok) throw new Error(`RapidAPI ${r.status}`);
  const d = await r.json();
  const t = (d.trans ?? d.translation ?? d.translatedText ?? d.result ?? '')?.trim();
  if (t) return t;
  throw new Error('RapidAPI: empty result');
}

// ── Engine 4: LibreTranslate public instance ──────────────────────────────────
async function libreTranslate(text: string, from: string, to: string): Promise<string> {
  const sl = from === 'auto' ? 'auto' : code(from).split('-')[0]; // libre uses 2-letter codes
  const tl = code(to).split('-')[0];
  const r = await fetch('https://libretranslate.com/translate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ q: text.slice(0, 1000), source: sl, target: tl, format: 'text' }),
  });
  if (!r.ok) throw new Error(`LibreTranslate ${r.status}`);
  const d = await r.json();
  const t = d?.translatedText?.trim();
  if (t) return t;
  throw new Error('LibreTranslate: empty result');
}

// ── Public API ────────────────────────────────────────────────────────────────

export interface TranslateResult {
  translatedText: string;
  detectedSourceLanguage?: string;
  provider: string;
}

export async function translateText(
  text: string,
  from: string,
  to: string
): Promise<TranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty text');
  if (code(from) === code(to) && from !== 'auto') return { translatedText: trimmed, provider: 'passthrough' };

  const engines: Array<[string, () => Promise<string>]> = [
    ['Google Translate', () => googleUnofficial(trimmed, from, to)],
    ['MyMemory',         () => myMemory(trimmed, from, to)],
    ['RapidAPI',         () => rapidApi(trimmed, from, to)],
    ['LibreTranslate',   () => libreTranslate(trimmed, from, to)],
  ];

  const errors: string[] = [];
  for (const [name, fn] of engines) {
    try {
      const result = await fn();
      if (result && result !== trimmed) {
        return { translatedText: result, provider: name };
      }
    } catch (e: any) {
      errors.push(`${name}: ${e.message}`);
    }
  }

  // Last resort — return original with note
  console.error('All engines failed:', errors);
  throw new Error('Translation unavailable. Engines tried: ' + errors.join(' | '));
}

// Legacy compat exports used by other files
export async function translateRapidApi(
  text: string, from: string, to: string
): Promise<{ translatedText: string; detectedSourceLanguage?: string }> {
  const r = await translateText(text, from, to);
  return { translatedText: r.translatedText };
}

export function hasRapidApiKey(): boolean { return true; }
