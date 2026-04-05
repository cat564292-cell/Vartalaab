/**
 * DeepL API (JSON). Set `VITE_DEEPL_API_KEY` in `.env`.
 * Free tier: https://api-free.deepl.com — override with `VITE_DEEPL_API_URL` for Pro.
 */

const DEFAULT_URL = 'https://api-free.deepl.com/v2/translate';

/** Target langs DeepL accepts (subset we map from app codes). */
const TO_DEEPL: Record<string, string> = {
  en: 'EN-US',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
  pt: 'PT-PT',
  ru: 'RU',
  ja: 'JA',
  ko: 'KO',
  'zh-Hans': 'ZH',
  ar: 'AR',
  hi: 'HI',
  nl: 'NL',
  pl: 'PL',
  sv: 'SV',
  tr: 'TR',
  uk: 'UK',
  bg: 'BG',
  cs: 'CS',
  da: 'DA',
  el: 'EL',
  et: 'ET',
  fi: 'FI',
  hu: 'HU',
  id: 'ID',
  lt: 'LT',
  lv: 'LV',
  nb: 'NB',
  ro: 'RO',
  sk: 'SK',
  sl: 'SL',
};

/** Source langs (omit = auto-detect). */
const FROM_DEEPL: Record<string, string> = {
  en: 'EN',
  es: 'ES',
  fr: 'FR',
  de: 'DE',
  it: 'IT',
  pt: 'PT',
  ru: 'RU',
  ja: 'JA',
  ko: 'KO',
  'zh-Hans': 'ZH',
  ar: 'AR',
  hi: 'HI',
  nl: 'NL',
  pl: 'PL',
  sv: 'SV',
  tr: 'TR',
  uk: 'UK',
  bg: 'BG',
  cs: 'CS',
  da: 'DA',
  el: 'EL',
  et: 'ET',
  fi: 'FI',
  hu: 'HU',
  id: 'ID',
  lt: 'LT',
  lv: 'LV',
  nb: 'NB',
  ro: 'RO',
  sk: 'SK',
  sl: 'SL',
};

export function hasDeepLKey(): boolean {
  const k = import.meta.env.VITE_DEEPL_API_KEY;
  return typeof k === 'string' && k.trim().length > 0;
}

export function isDeepLPairSupported(from: string, to: string): boolean {
  if (!TO_DEEPL[to]) return false;
  if (from === 'auto') return true;
  return Boolean(FROM_DEEPL[from]);
}

export async function translateDeepL(
  text: string,
  from: string,
  to: string
): Promise<{ translatedText: string; detectedSourceLanguage?: string }> {
  const key = import.meta.env.VITE_DEEPL_API_KEY?.trim();
  if (!key) throw new Error('Missing VITE_DEEPL_API_KEY');

  const target_lang = TO_DEEPL[to];
  if (!target_lang) throw new Error(`DeepL does not support target language: ${to}`);

  const url = import.meta.env.VITE_DEEPL_API_URL?.trim() || DEFAULT_URL;

  const body: Record<string, unknown> = {
    text: [text.slice(0, 5000)],
    target_lang,
  };
  if (from !== 'auto') {
    const sl = FROM_DEEPL[from];
    if (!sl) throw new Error(`DeepL does not support source language: ${from}`);
    body.source_lang = sl;
  }

  const res = await fetch(url, {
    method: 'POST',
    headers: {
      Authorization: `DeepL-Auth-Key ${key}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    translations?: Array<{ text: string; detected_source_language?: string }>;
    message?: string;
  };

  if (!res.ok || !data.translations?.[0]?.text) {
    throw new Error(data.message || `DeepL failed (${res.status})`);
  }

  const t = data.translations[0];
  return {
    translatedText: t.text,
    detectedSourceLanguage: t.detected_source_language?.toLowerCase(),
  };
}
