/**
 * VarTalaab Spring Boot API client
 * Base URL: http://localhost:8080/api
 * Falls back gracefully if backend is offline.
 */

const BASE = 'http://localhost:8080/api';

export interface TranslateResult {
  translatedText: string;
  provider: string;
  historyId?: number;
}

export interface HistoryItem {
  id: number;
  sourceText: string;
  translatedText: string;
  sourceLang: string;
  targetLang: string;
  provider: string;
  createdAt: string;
}

export interface HistoryPage {
  content: HistoryItem[];
  totalElements: number;
  totalPages: number;
  number: number;
}

export interface Suggestion {
  id: string;
  type: 'grammar' | 'autocomplete' | 'synonym' | 'ai';
  text: string;
  label: string;
}

export interface GrammarError {
  start: number;
  end: number;
  original: string;
  suggestion: string;
  message: string;
}

// ── Health ────────────────────────────────────────────────────────────────────

export async function checkBackendHealth(): Promise<boolean> {
  try {
    const r = await fetch(`${BASE}/health`, { signal: AbortSignal.timeout(2000) });
    return r.ok;
  } catch {
    return false;
  }
}

// ── Translation ───────────────────────────────────────────────────────────────

export async function translateViaSpringBoot(
  text: string,
  fromLang: string,
  toLang: string,
  saveHistory = true
): Promise<TranslateResult> {
  const r = await fetch(`${BASE}/translate`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, fromLang, toLang, saveHistory }),
  });
  if (!r.ok) throw new Error(`Translation failed: ${r.status}`);
  return r.json();
}

// ── History ───────────────────────────────────────────────────────────────────

export async function fetchHistory(
  query?: string,
  lang?: string,
  page = 0,
  size = 20
): Promise<HistoryPage> {
  const params = new URLSearchParams({ page: String(page), size: String(size) });
  if (query) params.set('query', query);
  if (lang && lang !== 'all') params.set('lang', lang);
  const r = await fetch(`${BASE}/history?${params}`);
  if (!r.ok) throw new Error('Failed to fetch history');
  return r.json();
}

export async function deleteHistoryItem(id: number): Promise<void> {
  await fetch(`${BASE}/history/${id}`, { method: 'DELETE' });
}

export async function clearAllHistory(): Promise<void> {
  await fetch(`${BASE}/history`, { method: 'DELETE' });
}

export async function fetchHistoryStats(): Promise<{ total: number; languages: number }> {
  const r = await fetch(`${BASE}/history/stats`);
  if (!r.ok) throw new Error('Failed to fetch stats');
  return r.json();
}

// ── Smart Suggestions ─────────────────────────────────────────────────────────

export async function fetchSmartSuggestions(
  text: string,
  targetLang: string
): Promise<Suggestion[]> {
  const r = await fetch(`${BASE}/smart-suggest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text, targetLang }),
  });
  if (!r.ok) throw new Error('Smart suggest failed');
  const data = await r.json();
  return data.suggestions || [];
}

// ── Grammar Check ─────────────────────────────────────────────────────────────

export async function checkGrammar(text: string): Promise<GrammarError[]> {
  const r = await fetch(`${BASE}/grammar-check`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ text }),
  });
  if (!r.ok) throw new Error('Grammar check failed');
  const data = await r.json();
  return data.errors || [];
}
