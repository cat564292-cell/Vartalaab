/**
 * Google Translate via RapidAPI — primary translation engine
 * Key: 48ee68b2dcmsha1b4b92776621f4p151e90jsna17c78afdc2b
 * Supports ALL 20+ languages including Hindi, Marathi, Japanese, Arabic, etc.
 */

const LANG_MAP: Record<string, string> = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
  'zh':      'zh-CN',
};

function toLangCode(code: string): string {
  return LANG_MAP[code] ?? code;
}

function getKey(): string {
  const k = import.meta.env.VITE_RAPIDAPI_KEY?.trim();
  if (k) return k;
  // Hardcoded fallback so it always works even without .env
  return '48ee68b2dcmsha1b4b92776621f4p151e90jsna17c78afdc2b';
}

export function hasRapidApiKey(): boolean {
  return true; // always available via hardcoded fallback
}

export async function translateRapidApi(
  text: string,
  from: string,
  to: string
): Promise<{ translatedText: string; detectedSourceLanguage?: string }> {
  const key = getKey();
  const src = from === 'auto' ? 'auto' : toLangCode(from);
  const tgt = toLangCode(to);
  const trimmed = text.slice(0, 5000);

  // ── Endpoint 1: google-translate113 ──────────────────────────────────────
  try {
    const r = await fetch('https://google-translate113.p.rapidapi.com/api/v1/translator/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'google-translate113.p.rapidapi.com',
      },
      body: JSON.stringify({ from: src, to: tgt, text: trimmed }),
    });
    if (r.ok) {
      const d = await r.json() as Record<string, any>;
      const translated = d.trans ?? d.translation ?? d.translatedText ?? d.result;
      if (translated && typeof translated === 'string' && translated.trim()) {
        return { translatedText: translated.trim(), detectedSourceLanguage: d.src ?? d.source };
      }
    }
  } catch { /* try next */ }

  // ── Endpoint 2: google-translator9 ───────────────────────────────────────
  try {
    const r2 = await fetch('https://google-translator9.p.rapidapi.com/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'google-translator9.p.rapidapi.com',
      },
      body: JSON.stringify({ q: trimmed, source: src === 'auto' ? undefined : src, target: tgt, format: 'text' }),
    });
    if (r2.ok) {
      const d2 = await r2.json() as any;
      const t = d2?.data?.translations?.[0];
      if (t?.translatedText?.trim()) {
        return { translatedText: t.translatedText.trim(), detectedSourceLanguage: t.detectedSourceLanguage };
      }
    }
  } catch { /* try next */ }

  // ── Endpoint 3: Deep Translate via RapidAPI ───────────────────────────────
  try {
    const r3 = await fetch('https://deep-translate1.p.rapidapi.com/language/translate/v2', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-RapidAPI-Key': key,
        'X-RapidAPI-Host': 'deep-translate1.p.rapidapi.com',
      },
      body: JSON.stringify({ q: trimmed, source: src === 'auto' ? 'en' : src, target: tgt }),
    });
    if (r3.ok) {
      const d3 = await r3.json() as any;
      const t3 = d3?.data?.translations?.translatedText;
      if (t3?.trim()) return { translatedText: t3.trim() };
    }
  } catch { /* try next */ }

  // ── Endpoint 4: MyMemory free fallback ────────────────────────────────────
  const mmSrc = from === 'auto' ? 'en' : toLangCode(from);
  const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(trimmed.slice(0, 450))}&langpair=${mmSrc}|${tgt}`;
  const r4 = await fetch(mmUrl);
  if (r4.ok) {
    const d4 = await r4.json() as any;
    if (d4?.responseStatus === 200 && d4?.responseData?.translatedText?.trim()) {
      return { translatedText: d4.responseData.translatedText.trim() };
    }
  }

  throw new Error('All translation engines failed — please check your internet connection.');
}
