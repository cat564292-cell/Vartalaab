import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Zap, Wand2, RefreshCw } from 'lucide-react';
import { Button } from './ui/button';
import { ScriptKeypad, KEYPAD_LANGS } from './ScriptKeypad';

interface Suggestion {
  id: string;
  text: string;
  type: 'grammar' | 'autocomplete' | 'synonym' | 'ai';
  label: string;
}

interface SmartSuggestionsProps {
  onAcceptSuggestion: (text: string) => void;
  targetLang: string;
}

const BACKEND = 'http://localhost:8000';

// Local fallback grammar rules (mirrors backend)
const GRAMMAR_RULES: [RegExp, string, string][] = [
  [/\bhe go\b/gi, 'he goes', 'Subject-verb agreement'],
  [/\bshe go\b/gi, 'she goes', 'Subject-verb agreement'],
  [/\bit go\b/gi, 'it goes', 'Subject-verb agreement'],
  [/\bi goes\b/gi, 'I go', 'Subject-verb agreement'],
  [/\bthey goes\b/gi, 'they go', 'Subject-verb agreement'],
  [/\ba apple\b/gi, 'an apple', 'Article usage'],
  [/\ba orange\b/gi, 'an orange', 'Article usage'],
  [/\ban car\b/gi, 'a car', 'Article usage'],
  [/\bim\b/gi, "I'm", 'Contraction spelling'],
  [/\bdont\b/gi, "don't", 'Contraction spelling'],
  [/\bcant\b/gi, "can't", 'Contraction spelling'],
  [/\bwont\b/gi, "won't", 'Contraction spelling'],
];

const AUTOCOMPLETE: Record<string, string[]> = {
  'how are': ['how are you?', 'how are you doing?'],
  'thank you': ['thank you very much', 'thank you for your help'],
  'i would': ['I would like to', 'I would appreciate it'],
  'nice to': ['nice to meet you', 'nice to see you again'],
  'good': ['good morning', 'good afternoon', 'good evening'],
  'see you': ['see you later', 'see you soon'],
  'can you': ['can you help me?', 'can you please explain?'],
};

const SYNONYMS: Record<string, string[]> = {
  good: ['great', 'excellent'], bad: ['poor', 'terrible'],
  big: ['large', 'huge'], small: ['tiny', 'compact'],
  happy: ['joyful', 'delighted'], sad: ['unhappy', 'sorrowful'],
  fast: ['quick', 'rapid'], smart: ['intelligent', 'clever'],
  beautiful: ['gorgeous', 'stunning'],
};

function localSuggest(text: string): Suggestion[] {
  const suggestions: Suggestion[] = [];
  let corrected = text;
  const changes: string[] = [];

  for (const [pattern, replacement, message] of GRAMMAR_RULES) {
    if (pattern.test(corrected)) {
      changes.push(message);
      corrected = corrected.replace(pattern, replacement);
    }
  }
  if (changes.length > 0) {
    suggestions.push({ id: 'grammar', type: 'grammar', text: corrected, label: `Grammar: ${changes[0]}` });
  }

  const lower = text.toLowerCase();
  for (const [trigger, completions] of Object.entries(AUTOCOMPLETE)) {
    if (lower.endsWith(trigger) || lower.includes(trigger + ' ')) {
      completions.slice(0, 1).forEach((c, i) => {
        if (!lower.includes(c)) suggestions.push({ id: `auto-${i}`, type: 'autocomplete', text: c, label: 'Autocomplete' });
      });
    }
  }

  const words = lower.match(/\b\w+\b/g) || [];
  const seen = new Set<string>();
  for (const word of words) {
    if (SYNONYMS[word] && !seen.has(word)) {
      seen.add(word);
      const syn = SYNONYMS[word][0];
      suggestions.push({
        id: `syn-${word}`,
        type: 'synonym',
        text: text.replace(new RegExp(`\\b${word}\\b`, 'i'), syn),
        label: `Replace '${word}' → '${syn}'`,
      });
    }
  }
  return suggestions.slice(0, 5);
}

const TYPE_CONFIG = {
  grammar:    { icon: CheckCircle2, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  autocomplete: { icon: ArrowRight, color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  synonym:    { icon: Sparkles, color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ai:         { icon: Wand2, color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

export function SmartSuggestions({ onAcceptSuggestion, targetLang }: SmartSuggestionsProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check if backend is online
  useEffect(() => {
    fetch(`${BACKEND}/health`).then(() => setBackendOnline(true)).catch(() => setBackendOnline(false));
  }, []);

  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    setIsAnalyzing(true);
    const timer = setTimeout(async () => {
      if (backendOnline) {
        try {
          const res = await fetch(`${BACKEND}/smart-suggest`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ text: input, targetLang }),
          });
          const data = await res.json();
          setSuggestions(data.suggestions || []);
        } catch {
          setSuggestions(localSuggest(input));
        }
      } else {
        setSuggestions(localSuggest(input));
      }
      setIsAnalyzing(false);
      setSelectedIndex(0);
    }, 350);
    return () => clearTimeout(timer);
  }, [input, targetLang, backendOnline]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (!suggestions.length) return;
    if (e.key === 'ArrowDown') { e.preventDefault(); setSelectedIndex(i => (i + 1) % suggestions.length); }
    else if (e.key === 'ArrowUp') { e.preventDefault(); setSelectedIndex(i => (i - 1 + suggestions.length) % suggestions.length); }
    else if (e.key === 'Enter' && e.ctrlKey) { e.preventDefault(); accept(suggestions[selectedIndex]); }
    else if (e.key === 'Escape') setSuggestions([]);
  };

  const accept = (s: Suggestion) => {
    setInput(s.text);
    onAcceptSuggestion(s.text);
    setSuggestions([]);
  };

  const handleKeypadInsert = (char: string) => {
    if (char === '\b') setInput(t => t.slice(0, -1));
    else setInput(t => t + char);
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-card rounded-3xl p-6 sm:p-8 relative" style={{ backdropFilter: 'blur(28px)', background: 'rgba(15,23,42,0.6)' }}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <motion.div
              animate={{ rotate: [0, 360] }}
              transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
              className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
            >
              <Sparkles className="w-5 h-5 text-white" />
            </motion.div>
            <div>
              <h3 className="text-white font-semibold text-lg">Smart Translator</h3>
              <p className="text-white/50 text-xs">
                {backendOnline ? '🟢 AI backend connected' : '🟡 Local mode (start backend for AI)'}
              </p>
            </div>
          </div>
          {isAnalyzing && (
            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center gap-2 text-purple-400 text-sm">
              <motion.div animate={{ rotate: 360 }} transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}>
                <RefreshCw className="w-4 h-4" />
              </motion.div>
              <span>Analyzing…</span>
            </motion.div>
          )}
        </div>

        {/* Textarea */}
        <div className="relative mb-4">
          <textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing to see AI-powered suggestions…"
            className="w-full h-44 bg-white/5 border-2 border-white/10 focus:border-purple-500/50 rounded-2xl p-5 text-white text-base resize-none outline-none transition-colors"
            style={{ caretColor: '#a78bfa' }}
          />
          <div className="absolute bottom-3 right-3 text-white/30 text-xs">{input.length}/5000</div>
        </div>

        {/* Script keypads */}
        <div className="flex flex-wrap gap-2 mb-4">
          {KEYPAD_LANGS.map(lang => (
            <ScriptKeypad key={lang} lang={lang} onInsert={handleKeypadInsert} />
          ))}
        </div>

        {/* Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-3">
                <Zap className="w-3 h-3" />
                <span>Suggestions — ↑↓ navigate · Ctrl+Enter accept · Esc dismiss</span>
              </div>
              {suggestions.map((s, i) => {
                const cfg = TYPE_CONFIG[s.type] || TYPE_CONFIG.autocomplete;
                const Icon = cfg.icon;
                return (
                  <motion.div
                    key={s.id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    transition={{ delay: i * 0.04 }}
                    onClick={() => accept(s)}
                    onMouseEnter={() => setSelectedIndex(i)}
                    className={`flex items-center gap-3 p-4 rounded-xl cursor-pointer transition-all border
                      ${selectedIndex === i ? 'ring-2 ring-purple-500 bg-purple-500/10 border-purple-500/30' : 'border-white/8 hover:bg-white/5'}`}
                  >
                    <div className={`w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 border ${cfg.color}`}>
                      <Icon className="w-4 h-4" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <span className={`text-xs font-medium px-2 py-0.5 rounded-full border mr-2 ${cfg.color}`}>{s.label}</span>
                      <span className="text-white text-sm">{s.text}</span>
                    </div>
                    <ArrowRight className={`w-4 h-4 flex-shrink-0 transition-transform ${selectedIndex === i ? 'translate-x-1 text-purple-400' : 'text-white/30'}`} />
                  </motion.div>
                );
              })}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Accept button */}
        {input.trim() && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-4 flex justify-end">
            <Button
              onClick={() => onAcceptSuggestion(input)}
              className="bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-xl px-6"
            >
              <ArrowRight className="w-4 h-4 mr-2" />
              Translate This
            </Button>
          </motion.div>
        )}

        <p className="mt-4 text-white/30 text-xs text-center">
          Type in any language · Grammar fixes · Autocomplete · Synonym suggestions
        </p>
      </div>
    </div>
  );
}
