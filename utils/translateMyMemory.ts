/** MyMemory public API — no key; good fallback when your backend is unavailable. */

const CODE_MAP: Record<string, string> = {
  'zh-Hans': 'zh-CN',
  'zh': 'zh-CN',
  auto: 'en',
};

export function toMyMemoryCode(code: string): string {
  return CODE_MAP[code] ?? code;
}

export async function translateMyMemory(
  text: string,
  from: string,
  to: string
): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty text');

  const src = toMyMemoryCode(from);
  const tgt = toMyMemoryCode(to);
  if (src === tgt) return trimmed;

  const q = encodeURIComponent(trimmed.slice(0, 450));
  const url = `https://api.mymemory.translated.net/get?q=${q}&langpair=${src}|${tgt}`;
  const res = await fetch(url);
  if (!res.ok) throw new Error(`Translation request failed (${res.status})`);

  const data = (await res.json()) as {
    responseStatus?: number;
    responseData?: { translatedText?: string };
    responseDetails?: string;
  };

  if (data.responseStatus !== 200 || !data.responseData?.translatedText) {
    throw new Error(data.responseDetails || 'Translation service returned no result');
  }

  return data.responseData.translatedText;
}
