import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Zap, Wand2, RefreshCw, Languages } from 'lucide-react';
import { Button } from './ui/button';
import { ScriptKeypad, KEYPAD_LANGS } from './ScriptKeypad';
import { fetchSmartSuggestions, checkBackendHealth, type Suggestion } from '/utils/springApi';

interface SmartSuggestionsProps {
  onAcceptSuggestion: (text: string) => void;
  targetLang: string;
  sourceLang?: string;
  onTranslate?: (text: string, from: string, to: string) => Promise<string>;
}

// Local fallback grammar rules
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
  'how are':  ['how are you?', 'how are you doing?'],
  'thank you': ['thank you very much', 'thank you for your help'],
  'i would':  ['I would like to', 'I would appreciate it'],
  'nice to':  ['nice to meet you', 'nice to see you again'],
  'good':     ['good morning', 'good afternoon', 'good evening'],
  'see you':  ['see you later', 'see you soon'],
  'can you':  ['can you help me?', 'can you please explain?'],
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
        if (!lower.includes(c))
          suggestions.push({ id: `auto-${i}`, type: 'autocomplete', text: c, label: 'Autocomplete' });
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
        id: `syn-${word}`, type: 'synonym',
        text: text.replace(new RegExp(`\\b${word}\\b`, 'i'), syn),
        label: `Replace '${word}' → '${syn}'`,
      });
    }
  }
  return suggestions.slice(0, 5);
}

const TYPE_CONFIG: Record<string, { icon: any; color: string }> = {
  grammar:      { icon: CheckCircle2, color: 'bg-red-500/20 text-red-400 border-red-500/30' },
  autocomplete: { icon: ArrowRight,   color: 'bg-blue-500/20 text-blue-400 border-blue-500/30' },
  synonym:      { icon: Sparkles,     color: 'bg-green-500/20 text-green-400 border-green-500/30' },
  ai:           { icon: Wand2,        color: 'bg-purple-500/20 text-purple-400 border-purple-500/30' },
};

export function SmartSuggestions({
  onAcceptSuggestion,
  targetLang,
  sourceLang = 'auto',
  onTranslate,
}: SmartSuggestionsProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [backendOnline, setBackendOnline] = useState(false);
  const [liveTranslation, setLiveTranslation] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  // Check Spring Boot health
  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  // Smart suggestions (Spring Boot or local fallback)
  useEffect(() => {
    if (!input.trim()) { setSuggestions([]); return; }
    setIsAnalyzing(true);
    const timer = setTimeout(async () => {
      if (backendOnline) {
        try {
          const results = await fetchSmartSuggestions(input, targetLang);
          setSuggestions(results);
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

  // Live translation preview
  useEffect(() => {
    if (!input.trim() || !onTranslate) { setLiveTranslation(''); return; }
    const t = setTimeout(async () => {
      setIsTranslating(true);
      try {
        const result = await onTranslate(input, sourceLang, targetLang);
        setLiveTranslation(result);
      } catch {
        setLiveTranslation('');
      } finally {
        setIsTranslating(false);
      }
    }, 900);
    return () => clearTimeout(t);
  }, [input, sourceLang, targetLang]);

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
                {backendOnline ? '🟢 Spring Boot DB connected' : '🟡 Local mode — start Spring Boot for DB'}
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
            placeholder="Start typing to see AI-powered suggestions and live translation…"
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

        {/* Live translation preview */}
        <AnimatePresence>
          {(liveTranslation || isTranslating) && (
            <motion.div
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 8 }}
              className="mb-4 p-4 rounded-2xl border border-blue-500/30 bg-blue-500/10"
            >
              <div className="flex items-center gap-2 mb-2">
                <Languages className="w-4 h-4 text-blue-400" />
                <span className="text-blue-300 text-xs font-medium">Live Translation Preview</span>
                {isTranslating && (
                  <motion.div animate={{ rotate: 360 }} transition={{ duration: 1, repeat: Infinity, ease: 'linear' }}>
                    <RefreshCw className="w-3 h-3 text-blue-400" />
                  </motion.div>
                )}
              </div>
              <p className="text-white text-sm leading-relaxed">
                {isTranslating ? <span className="text-white/40">Translating…</span> : liveTranslation}
              </p>
            </motion.div>
          )}
        </AnimatePresence>

        {/* Suggestions */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }} className="space-y-2">
              <div className="flex items-center gap-2 text-white/50 text-xs mb-3">
                <Zap className="w-3 h-3" />
                <span>Suggestions — ↑↓ navigate · Ctrl+Enter accept · Esc dismiss</span>
              </div>
              {suggestions.map((s, i) => {
                const cfg = TYPE_CONFIG[s.type] ?? TYPE_CONFIG.autocomplete;
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
                      ${selectedIndex === i
                        ? 'ring-2 ring-purple-500 bg-purple-500/10 border-purple-500/30'
                        : 'border-white/[0.08] hover:bg-white/5'}`}
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

        {/* Translate This button */}
        {input.trim() && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-5 flex justify-end">
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
          Grammar fixes · Autocomplete · Synonyms · Live preview · All scripts supported
        </p>
      </div>
    </div>
  );
}
