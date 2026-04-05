/** Google Cloud Translation API v2 (REST). Set `VITE_GOOGLE_TRANSLATE_API_KEY` in `.env`. */

const CODE_MAP: Record<string, string> = {
  'zh-Hans': 'zh-CN',
  'zh-Hant': 'zh-TW',
};

function toGoogleCode(code: string): string {
  return CODE_MAP[code] ?? code;
}

export function hasGoogleTranslateKey(): boolean {
  const k = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY;
  return typeof k === 'string' && k.trim().length > 0;
}

export async function translateGoogle(
  text: string,
  source: string | undefined,
  target: string
): Promise<{ translatedText: string; detectedSourceLanguage?: string }> {
  const key = import.meta.env.VITE_GOOGLE_TRANSLATE_API_KEY?.trim();
  if (!key) throw new Error('Missing VITE_GOOGLE_TRANSLATE_API_KEY');

  const tgt = toGoogleCode(target);
  const body: Record<string, unknown> = {
    q: text.slice(0, 5000),
    target: tgt,
    format: 'text',
  };
  const src = source ? toGoogleCode(source) : undefined;
  if (src) body.source = src;

  const url = `https://translation.googleapis.com/language/translate/v2?key=${encodeURIComponent(key)}`;
  const res = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  });

  const data = (await res.json()) as {
    data?: { translations?: Array<{ translatedText: string; detectedSourceLanguage?: string }> };
    error?: { message?: string };
  };

  if (!res.ok || !data.data?.translations?.[0]) {
    throw new Error(data.error?.message || `Google Translate failed (${res.status})`);
  }

  const t = data.data.translations[0];
  return {
    translatedText: t.translatedText,
    detectedSourceLanguage: t.detectedSourceLanguage,
  };
}
