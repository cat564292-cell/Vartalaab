import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Sparkles, Bot, User, Brain, Globe, BookOpen, Wand2,
  Volume2, Copy, Check, Zap, Languages, ArrowRightLeft, Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { translateRapidApi } from '/utils/rapidApiTranslate';
import { translateMyMemory, toMyMemoryCode } from '/utils/translateMyMemory';
import { appendTranslationHistory } from '/utils/translationHistory';

const languages = [
  { code: 'en',      name: 'English',    flag: '🇬🇧' },
  { code: 'hi',      name: 'Hindi',      flag: '🇮🇳' },
  { code: 'mr',      name: 'Marathi',    flag: '🇮🇳' },
  { code: 'es',      name: 'Spanish',    flag: '🇪🇸' },
  { code: 'fr',      name: 'French',     flag: '🇫🇷' },
  { code: 'de',      name: 'German',     flag: '🇩🇪' },
  { code: 'it',      name: 'Italian',    flag: '🇮🇹' },
  { code: 'pt',      name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru',      name: 'Russian',    flag: '🇷🇺' },
  { code: 'ja',      name: 'Japanese',   flag: '🇯🇵' },
  { code: 'ko',      name: 'Korean',     flag: '🇰🇷' },
  { code: 'zh-Hans', name: 'Chinese',    flag: '🇨🇳' },
  { code: 'ar',      name: 'Arabic',     flag: '🇸🇦' },
  { code: 'bn',      name: 'Bengali',    flag: '🇧🇩' },
  { code: 'tr',      name: 'Turkish',    flag: '🇹🇷' },
  { code: 'nl',      name: 'Dutch',      flag: '🇳🇱' },
  { code: 'pl',      name: 'Polish',     flag: '🇵🇱' },
  { code: 'th',      name: 'Thai',       flag: '🇹🇭' },
  { code: 'vi',      name: 'Vietnamese', flag: '🇻🇳' },
  { code: 'sv',      name: 'Swedish',    flag: '🇸🇪' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  provider?: string;
  timestamp: Date;
  cards?: InfoCard[];
}

interface InfoCard {
  label: string;
  value: string;
  color: string;
}

// ── Core translation engine ───────────────────────────────────────────────────

async function performTranslation(
  text: string, from: string, to: string
): Promise<{ translated: string; provider: string }> {
  // 1. RapidAPI (Google Translate) — most accurate
  try {
    const r = await translateRapidApi(text, from, to);
    if (r.translatedText && r.translatedText !== text) {
      return { translated: r.translatedText, provider: 'Google Translate (RapidAPI)' };
    }
  } catch { /* fall through */ }

  // 2. MyMemory — free fallback
  try {
    const fromCode = from === 'auto' ? 'en' : toMyMemoryCode(from);
    const t = await translateMyMemory(text, fromCode, to);
    if (t && t !== text) return { translated: t, provider: 'MyMemory' };
  } catch { /* fall through */ }

  throw new Error('All translation engines failed. Please check your connection.');
}

// ── Build rich AI response cards ─────────────────────────────────────────────

function buildInfoCards(text: string, translated: string, from: string, to: string): InfoCard[] {
  const fromLang = languages.find(l => l.code === from);
  const toLang   = languages.find(l => l.code === to);
  const wordCount = text.trim().split(/\s+/).length;
  const charCount = text.length;

  const cards: InfoCard[] = [
    { label: '📝 Original', value: text, color: 'border-blue-500/40 bg-blue-500/10' },
    { label: `✨ ${toLang?.flag ?? ''} ${toLang?.name ?? to} Translation`, value: translated, color: 'border-green-500/40 bg-green-500/10' },
    { label: '📊 Stats', value: `${wordCount} word${wordCount !== 1 ? 's' : ''} · ${charCount} characters`, color: 'border-purple-500/40 bg-purple-500/10' },
    { label: '🌐 Language Pair', value: `${fromLang?.flag ?? ''} ${fromLang?.name ?? from} → ${toLang?.flag ?? ''} ${toLang?.name ?? to}`, color: 'border-amber-500/40 bg-amber-500/10' },
  ];

  // Add usage tips based on target language
  const tips: Record<string, string> = {
    hi: 'Hindi uses Devanagari script. Formal address uses "आप" (aap), informal uses "तुम" (tum).',
    mr: 'Marathi is the official language of Maharashtra. It shares Devanagari script with Hindi.',
    ja: 'Japanese has 3 scripts: Hiragana, Katakana, and Kanji. Politeness levels matter greatly.',
    ar: 'Arabic is written right-to-left. Modern Standard Arabic differs from spoken dialects.',
    zh_Hans: 'Mandarin Chinese uses tones — the same syllable with different tones has different meanings.',
    ko: 'Korean (Hangul) has formal and informal speech levels called "존댓말" (jondaemal).',
    ru: 'Russian uses the Cyrillic alphabet and has 6 grammatical cases.',
    fr: 'French has gendered nouns (masculine/feminine) and liaison rules between words.',
    de: 'German has 3 genders (der/die/das) and 4 grammatical cases.',
    es: 'Spanish has two forms of "you": formal "usted" and informal "tú".',
  };

  const tipKey = to.replace('-', '_');
  if (tips[tipKey]) {
    cards.push({ label: '💡 Language Tip', value: tips[tipKey], color: 'border-cyan-500/40 bg-cyan-500/10' });
  }

  return cards;
}

function buildAssistantContent(text: string, translated: string, provider: string): string {
  return `Here's your translation powered by **${provider}**:\n\n"${translated}"\n\nClick the cards below for details. You can also tap 🔊 to hear the pronunciation.`;
}

// ── Quick phrase suggestions ──────────────────────────────────────────────────

const QUICK_PHRASES = [
  'Hello, how are you?',
  'Thank you very much',
  'Where is the nearest hospital?',
  'I need help please',
  'What is your name?',
  'Good morning!',
];

// ── Component ─────────────────────────────────────────────────────────────────

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1',
    role: 'assistant',
    content: 'Hello! I\'m your **AI Translation Assistant** powered by Google Translate.\n\nType any text below and I\'ll translate it with full details — language tips, word count, pronunciation and more. I support **20+ languages** including Hindi, Marathi, Japanese, Arabic and more!',
    timestamp: new Date(),
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const handleSend = async (textOverride?: string) => {
    const text = (textOverride ?? input).trim();
    if (!text) return;

    const userMsg: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: text,
      timestamp: new Date(),
    };
    setMessages(prev => [...prev, userMsg]);
    setInput('');
    setIsTyping(true);

    try {
      const { translated, provider } = await performTranslation(text, sourceLang, targetLang);

      // Save to history
      appendTranslationHistory({
        source: text,
        translation: translated,
        sourceLang,
        targetLang,
      });

      const assistantMsg: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: buildAssistantContent(text, translated, provider),
        translation: translated,
        provider,
        timestamp: new Date(),
        cards: buildInfoCards(text, translated, sourceLang, targetLang),
      };

      setTimeout(() => {
        setMessages(prev => [...prev, assistantMsg]);
        setIsTyping(false);
      }, 400);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: `❌ **Translation failed:** ${err.message}\n\nPlease check your internet connection and try again.`,
        timestamp: new Date(),
      }]);
      setIsTyping(false);
      toast.error('Translation failed', { description: err.message });
    }
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!('speechSynthesis' in window)) { toast.error('TTS not supported'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang;
    u.rate = 0.88;
    window.speechSynthesis.speak(u);
    toast.info('🔊 Playing…');
  };

  const handleCopy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  const handleSwap = () => {
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">

      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.7 }}
        className="text-center mb-8"
      >
        <motion.div
          animate={{ y: [0, -8, 0], rotateY: [0, 6, -6, 0] }}
          transition={{ duration: 4, repeat: Infinity }}
          className="inline-block mb-5"
        >
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-purple-500/40">
            <Bot className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        <h1
          className="text-4xl sm:text-6xl font-normal text-white mb-3 tracking-tight"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          AI Translation{' '}
          <em className="not-italic" style={{
            background: 'linear-gradient(90deg,#a78bfa,#ec4899)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text',
          }}>Assistant</em>
        </h1>
        <p className="text-white/60 text-base max-w-xl mx-auto">
          Powered by Google Translate · 20+ languages · Pronunciation · Cultural tips
        </p>
      </motion.div>

      {/* Language selector bar */}
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.2 }}
        className="flex items-center justify-center gap-3 mb-6 flex-wrap"
      >
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3" style={{ backdropFilter: 'blur(24px)', background: 'rgba(15,23,42,0.6)' }}>
          <Globe className="w-4 h-4 text-blue-400 shrink-0" />
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="bg-transparent border-0 text-white w-36 h-8 p-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 max-h-64">
              {languages.map(l => (
                <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10">
                  <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <motion.button
            whileHover={{ scale: 1.15, rotate: 180 }}
            whileTap={{ scale: 0.9 }}
            transition={{ type: 'spring', stiffness: 300 }}
            onClick={handleSwap}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white transition-colors"
          >
            <ArrowRightLeft className="w-4 h-4" />
          </motion.button>

          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="bg-transparent border-0 text-white w-36 h-8 p-0 focus:ring-0">
              <SelectValue />
            </SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 max-h-64">
              {languages.map(l => (
                <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10">
                  <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Quick phrases */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.3 }}
        className="flex flex-wrap gap-2 justify-center mb-6"
      >
        {QUICK_PHRASES.map((phrase, i) => (
          <motion.button
            key={i}
            whileHover={{ scale: 1.05, y: -2 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => handleSend(phrase)}
            className="px-3 py-1.5 rounded-full text-xs text-white/70 hover:text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all"
          >
            {phrase}
          </motion.button>
        ))}
      </motion.div>

      {/* Chat window */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="glass-card rounded-3xl overflow-hidden mb-4"
        style={{ backdropFilter: 'blur(28px)', background: 'rgba(15,23,42,0.65)' }}
      >
        {/* Messages */}
        <div className="h-[480px] overflow-y-auto p-5 space-y-5 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map((msg) => (
              <motion.div
                key={msg.id}
                initial={{ opacity: 0, y: 16, scale: 0.96 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-purple-500/30">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[78%] space-y-3 ${msg.role === 'user' ? 'items-end' : 'items-start'} flex flex-col`}>
                  {/* Bubble */}
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                    msg.role === 'user'
                      ? 'bg-gradient-to-br from-blue-500/25 to-cyan-500/25 border border-blue-500/30 text-white'
                      : 'bg-white/5 border border-white/10 text-white/90'
                  }`}>
                    {msg.content.split('**').map((part, i) =>
                      i % 2 === 0
                        ? <span key={i}>{part}</span>
                        : <strong key={i} className="text-purple-300 font-semibold">{part}</strong>
                    )}
                  </div>

                  {/* Info cards */}
                  {msg.cards && msg.cards.length > 0 && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      {msg.cards.map((card, ci) => (
                        <motion.div
                          key={ci}
                          initial={{ opacity: 0, y: 8 }}
                          animate={{ opacity: 1, y: 0 }}
                          transition={{ delay: ci * 0.07 }}
                          className={`rounded-xl p-3 border text-xs ${card.color}`}
                        >
                          <div className="text-white/60 font-medium mb-1">{card.label}</div>
                          <div className="text-white font-medium leading-relaxed">{card.value}</div>
                          {/* Action buttons on translation card */}
                          {ci === 1 && msg.translation && (
                            <div className="flex gap-2 mt-2">
                              <button
                                onClick={() => handleSpeak(msg.translation!, targetLang)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                              >
                                <Volume2 className="w-3 h-3" />
                                <span>Speak</span>
                              </button>
                              <button
                                onClick={() => handleCopy(msg.translation!, msg.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors"
                              >
                                {copied === msg.id
                                  ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></>
                                  : <><Copy className="w-3 h-3" /><span>Copy</span></>
                                }
                              </button>
                            </div>
                          )}
                        </motion.div>
                      ))}
                    </div>
                  )}

                  <div className="text-white/30 text-xs px-1">
                    {msg.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    {msg.provider && <span className="ml-2 text-green-400/60">· {msg.provider}</span>}
                  </div>
                </div>

                {msg.role === 'user' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-blue-500/30">
                    <User className="w-4 h-4 text-white" />
                  </div>
                )}
              </motion.div>
            ))}
          </AnimatePresence>

          {/* Typing indicator */}
          {isTyping && (
            <motion.div
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              className="flex gap-3 items-start"
            >
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div
                    key={i}
                    animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 bg-purple-400 rounded-full"
                  />
                ))}
                <span className="text-white/40 text-xs ml-2">Translating…</span>
              </div>
            </motion.div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Input bar */}
        <div className="border-t border-white/10 p-4 flex gap-3">
          <Textarea
            ref={inputRef}
            value={input}
            onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Type in ${languages.find(l => l.code === sourceLang)?.name ?? 'any language'}… (Enter to send)`}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/35 rounded-2xl resize-none min-h-[52px] max-h-32 focus-visible:ring-purple-500/40"
            rows={1}
          />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button
              onClick={() => handleSend()}
              disabled={!input.trim() || isTyping}
              className="h-[52px] px-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 disabled:opacity-40"
            >
              {isTyping ? <Loader2 className="w-5 h-5 animate-spin" /> : <Send className="w-5 h-5" />}
            </Button>
          </motion.div>
        </div>
      </motion.div>

      {/* Feature cards */}
      <div className="grid sm:grid-cols-3 gap-4 mt-6">
        {[
          { icon: Languages, title: '20+ Languages', desc: 'Hindi, Marathi, Japanese, Arabic & more', color: 'from-blue-500 to-cyan-500' },
          { icon: BookOpen,  title: 'Rich Details',  desc: 'Language tips, word count, cultural context', color: 'from-purple-500 to-pink-500' },
          { icon: Wand2,     title: 'Pronunciation', desc: 'Hear any translation spoken aloud', color: 'from-green-500 to-emerald-500' },
        ].map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.04, y: -4 }}
            className="glass-card rounded-2xl p-5 text-center"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(15,23,42,0.5)' }}
          >
            <div className={`w-12 h-12 mx-auto mb-3 rounded-xl bg-gradient-to-br ${f.color} flex items-center justify-center shadow-lg`}>
              <f.icon className="w-6 h-6 text-white" />
            </div>
            <h3 className="text-white font-semibold text-sm mb-1">{f.title}</h3>
            <p className="text-white/50 text-xs">{f.desc}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
}
