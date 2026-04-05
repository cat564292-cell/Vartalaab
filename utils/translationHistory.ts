const STORAGE_KEY = 'translation-history';
const MAX_ITEMS = 200;

export interface TranslationHistoryItem {
  id: string;
  source: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  timestamp: string;
}

export function appendTranslationHistory(entry: {
  source: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
}): void {
  const source = entry.source.trim();
  const translation = entry.translation.trim();
  if (source.length < 2 || !translation) return;

  const item: TranslationHistoryItem = {
    id: `${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    source,
    translation,
    sourceLang: entry.sourceLang,
    targetLang: entry.targetLang,
    timestamp: new Date().toISOString(),
  };

  let list: TranslationHistoryItem[] = [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (raw) list = JSON.parse(raw);
    if (!Array.isArray(list)) list = [];
  } catch {
    list = [];
  }

  list.unshift(item);
  localStorage.setItem(STORAGE_KEY, JSON.stringify(list.slice(0, MAX_ITEMS)));
}
