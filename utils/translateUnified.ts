import { translateGoogle, hasGoogleTranslateKey } from './googleTranslate';
import { translateDeepL, hasDeepLKey, isDeepLPairSupported } from './deeplTranslate';
import { translateMyMemory, toMyMemoryCode } from './translateMyMemory';
import { translateRapidApi, hasRapidApiKey } from './rapidApiTranslate';

export type TranslateProvider = 'google' | 'deepl' | 'supabase' | 'mymemory' | 'rapidapi';

export function providerDisplayName(p: TranslateProvider): string {
  switch (p) {
    case 'google':   return 'Google Translate';
    case 'deepl':    return 'DeepL';
    case 'supabase': return 'VarTalaab Cloud';
    case 'mymemory': return 'MyMemory';
    case 'rapidapi': return 'Google Translate';
  }
}

export interface UnifiedTranslateResult {
  text: string;
  provider: TranslateProvider;
  detectedSourceLanguage?: string;
}

export function getConfiguredApiEngines(): { google: boolean; deepl: boolean } {
  return {
    google: hasGoogleTranslateKey() || hasRapidApiKey(),
    deepl: hasDeepLKey(),
  };
}

async function translateSupabase(
  text: string, from: string, to: string,
  projectId: string, anonKey: string
): Promise<string> {
  const response = await fetch(
    `https://${projectId}.supabase.co/functions/v1/make-server-e0a50523/translate`,
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${anonKey}` },
      body: JSON.stringify({ text, from: from === 'auto' ? null : from, to }),
    }
  );
  const data = (await response.json()) as { error?: string; translatedText?: string };
  if (!response.ok || data.error) throw new Error(data.error || `Supabase failed`);
  if (typeof data.translatedText !== 'string') throw new Error('Invalid response');
  return data.translatedText;
}

/**
 * Chain: RapidAPI (Google) → Google direct → DeepL → Supabase → MyMemory
 * MyMemory is always the guaranteed free fallback — works for all language pairs.
 */
export async function translateUnified(
  text: string,
  from: string,
  to: string,
  opts: { projectId: string; anonKey: string }
): Promise<UnifiedTranslateResult> {
  const trimmed = text.trim();
  if (!trimmed) throw new Error('Empty text');

  // 1. RapidAPI — Google Translate (key: 48ee68b2dcmsha...)
  if (hasRapidApiKey()) {
    try {
      const r = await translateRapidApi(trimmed, from, to);
      return { text: r.translatedText, provider: 'rapidapi', detectedSourceLanguage: r.detectedSourceLanguage };
    } catch (e) {
      console.warn('[translate] RapidAPI failed:', e);
    }
  }

  // 2. Google Cloud direct key
  if (hasGoogleTranslateKey()) {
    try {
      const r = await translateGoogle(trimmed, from === 'auto' ? undefined : from, to);
      return { text: r.translatedText, provider: 'google', detectedSourceLanguage: r.detectedSourceLanguage };
    } catch (e) {
      console.warn('[translate] Google failed:', e);
    }
  }

  // 3. DeepL
  if (hasDeepLKey() && isDeepLPairSupported(from, to)) {
    try {
      const r = await translateDeepL(trimmed, from, to);
      return { text: r.translatedText, provider: 'deepl', detectedSourceLanguage: r.detectedSourceLanguage };
    } catch (e) {
      console.warn('[translate] DeepL failed:', e);
    }
  }

  // 4. Supabase cloud
  try {
    const t = await translateSupabase(trimmed, from, to, opts.projectId, opts.anonKey);
    return { text: t, provider: 'supabase' };
  } catch (e) {
    console.warn('[translate] Supabase failed:', e);
  }

  // 5. MyMemory — always works, no key needed
  const fromCode = from === 'auto' ? 'en' : toMyMemoryCode(from);
  const t = await translateMyMemory(trimmed, fromCode, to);
  return { text: t, provider: 'mymemory' };
}
