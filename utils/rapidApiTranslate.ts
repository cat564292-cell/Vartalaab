/**
 * Google Translate via RapidAPI
 * Host: google-translate113.p.rapidapi.com
 * Supports ALL languages: Hindi (hi), Marathi (mr), Japanese (ja), Arabic (ar), etc.
 */

const LANG_MAP: Record<string, string> = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
};

function toLangCode(code: string): string {
  return LANG_MAP[code] ?? code;
}

export function hasRapidApiKey(): boolean {
  const k = import.meta.env.VITE_RAPIDAPI_KEY;
  return typeof k === 'string' && k.trim().length > 0;
}

export async function translateRapidApi(
  text: string,
  from: string,
  to: string
): Promise<{ translatedText: string; detectedSourceLanguage?: string }> {
  const key = import.meta.env.VITE_RAPIDAPI_KEY?.trim();
  if (!key) throw new Error('Missing VITE_RAPIDAPI_KEY');

  const src = from === 'auto' ? 'auto' : toLangCode(from);
  const tgt = toLangCode(to);

  const res = await fetch('https://google-translate113.p.rapidapi.com/api/v1/translator/text', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'google-translate113.p.rapidapi.com',
    },
    body: JSON.stringify({
      from: src,
      to: tgt,
      text: text.slice(0, 5000),
    }),
  });

  if (res.ok) {
    const data = (await res.json()) as {
      trans?: string;
      translation?: string;
      translatedText?: string;
      dest?: string;
      src?: string;
    };
    const translated = data.trans ?? data.translation ?? data.translatedText;
    if (translated) {
      return { translatedText: translated, detectedSourceLanguage: data.src };
    }
  }

  // Fallback to google-translator9 endpoint
  const res2 = await fetch('https://google-translator9.p.rapidapi.com/v2', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'X-RapidAPI-Key': key,
      'X-RapidAPI-Host': 'google-translator9.p.rapidapi.com',
    },
    body: JSON.stringify({
      q: text.slice(0, 5000),
      source: src,
      target: tgt,
      format: 'text',
    }),
  });

  if (res2.ok) {
    const data2 = (await res2.json()) as {
      data?: { translations?: Array<{ translatedText: string; detectedSourceLanguage?: string }> };
    };
    const t = data2.data?.translations?.[0];
    if (t?.translatedText) {
      return { translatedText: t.translatedText, detectedSourceLanguage: t.detectedSourceLanguage };
    }
  }

  // Final free fallback — MyMemory (no key, works for all pairs)
  const mmSrc = from === 'auto' ? 'en' : toLangCode(from);
  const mmUrl = `https://api.mymemory.translated.net/get?q=${encodeURIComponent(text.slice(0, 450))}&langpair=${mmSrc}|${tgt}`;
  const res3 = await fetch(mmUrl);
  if (!res3.ok) throw new Error(`All translation engines failed`);
  const data3 = (await res3.json()) as {
    responseStatus: number;
    responseData: { translatedText: string };
  };
  if (data3.responseStatus !== 200) throw new Error('Translation service error');
  return { translatedText: data3.responseData.translatedText };
}
