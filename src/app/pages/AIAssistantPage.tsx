import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import {
  Send, Bot, User, Brain, Globe, BookOpen, Wand2,
  Volume2, Copy, Check, Languages, ArrowRightLeft, Loader2,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { translateText } from '/utils/rapidApiTranslate';
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

interface InfoCard { label: string; value: string; color: string; }
interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  translation?: string;
  provider?: string;
  timestamp: Date;
  cards?: InfoCard[];
}

const LANG_TIPS: Record<string, string> = {
  hi: 'Hindi uses Devanagari script. "आप" (aap) = formal you, "तुम" (tum) = informal you.',
  mr: 'Marathi is Maharashtra\'s official language. "आई" (aai) = mother, "बाबा" (baba) = father.',
  ja: 'Japanese has 3 scripts: Hiragana, Katakana & Kanji. Politeness levels are crucial.',
  ar: 'Arabic is written right-to-left. "مرحبا" (marhaba) = hello, "شكرا" (shukran) = thank you.',
  'zh-Hans': 'Mandarin uses tones — same syllable, different tone = different meaning.',
  ko: 'Korean has formal (존댓말) and informal speech levels. "안녕" (annyeong) = hi.',
  ru: 'Russian uses Cyrillic alphabet and has 6 grammatical cases.',
  fr: 'French nouns have gender (masculine/feminine). "Bonjour" = hello.',
  de: 'German has 3 genders (der/die/das). "Danke" = thank you.',
  es: '"Usted" = formal you, "tú" = informal you. "Hola" = hello.',
};

const QUICK_PHRASES = [
  'Hello, how are you?',
  'Thank you very much',
  'My name is',
  'Where is the hospital?',
  'Good morning!',
  'I love you',
];

function buildCards(text: string, translated: string, from: string, to: string): InfoCard[] {
  const fl = languages.find(l => l.code === from);
  const tl = languages.find(l => l.code === to);
  const words = text.trim().split(/\s+/).length;
  const cards: InfoCard[] = [
    { label: '📝 Original', value: text, color: 'border-blue-500/40 bg-blue-500/10' },
    { label: `✨ ${tl?.flag ?? ''} ${tl?.name ?? to} Translation`, value: translated, color: 'border-green-500/40 bg-green-500/10' },
    { label: '🌐 Language Pair', value: `${fl?.flag ?? ''} ${fl?.name ?? from}  →  ${tl?.flag ?? ''} ${tl?.name ?? to}`, color: 'border-amber-500/40 bg-amber-500/10' },
    { label: '📊 Stats', value: `${words} word${words !== 1 ? 's' : ''} · ${text.length} chars`, color: 'border-purple-500/40 bg-purple-500/10' },
  ];
  const tip = LANG_TIPS[to];
  if (tip) cards.push({ label: '💡 Language Tip', value: tip, color: 'border-cyan-500/40 bg-cyan-500/10' });
  return cards;
}

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([{
    id: '1', role: 'assistant', timestamp: new Date(),
    content: 'Hello! I\'m your **AI Translation Assistant**.\n\nType any text and I\'ll translate it instantly with language tips, pronunciation and more. I support **20+ languages** — Hindi, Marathi, Japanese, Arabic and more!\n\nTry: "hi" → Spanish = **hola** · "maa" → Marathi = **आई**',
  }]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('hi');
  const [copied, setCopied] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => { messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' }); }, [messages]);

  const handleSend = async (override?: string) => {
    const text = (override ?? input).trim();
    if (!text) return;
    setMessages(prev => [...prev, { id: Date.now().toString(), role: 'user', content: text, timestamp: new Date() }]);
    setInput('');
    setIsTyping(true);
    try {
      const result = await translateText(text, sourceLang, targetLang);
      appendTranslationHistory({ source: text, translation: result.translatedText, sourceLang, targetLang });
      setTimeout(() => {
        setMessages(prev => [...prev, {
          id: (Date.now() + 1).toString(), role: 'assistant', timestamp: new Date(),
          content: `Translation via **${result.provider}**:\n\n"${result.translatedText}"`,
          translation: result.translatedText,
          provider: result.provider,
          cards: buildCards(text, result.translatedText, sourceLang, targetLang),
        }]);
        setIsTyping(false);
      }, 300);
    } catch (err: any) {
      setMessages(prev => [...prev, {
        id: (Date.now() + 1).toString(), role: 'assistant', timestamp: new Date(),
        content: `❌ **Error:** ${err.message}`,
      }]);
      setIsTyping(false);
      toast.error('Translation failed');
    }
  };

  const speak = (text: string, lang: string) => {
    if (!('speechSynthesis' in window)) return;
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    u.lang = lang; u.rate = 0.88;
    window.speechSynthesis.speak(u);
    toast.info('🔊 Playing…');
  };

  const copy = (text: string, id: string) => {
    navigator.clipboard.writeText(text);
    setCopied(id);
    toast.success('Copied!');
    setTimeout(() => setCopied(null), 2000);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-5xl relative z-10">

      {/* Hero */}
      <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-8">
        <motion.div animate={{ y: [0, -8, 0] }} transition={{ duration: 4, repeat: Infinity }} className="inline-block mb-5">
          <div className="w-24 h-24 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl shadow-purple-500/40">
            <Bot className="w-12 h-12 text-white" />
          </div>
        </motion.div>
        <h1 className="text-4xl sm:text-6xl font-normal text-white mb-3 tracking-tight" style={{ fontFamily: "'Instrument Serif', serif" }}>
          AI Translation{' '}
          <em className="not-italic" style={{ background: 'linear-gradient(90deg,#a78bfa,#ec4899)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent', backgroundClip: 'text' }}>Assistant</em>
        </h1>
        <p className="text-white/60 text-base max-w-xl mx-auto">Google Translate · 20+ languages · Pronunciation · Cultural tips</p>
      </motion.div>

      {/* Language bar */}
      <motion.div initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }} className="flex justify-center mb-6">
        <div className="glass-card rounded-2xl px-4 py-3 flex items-center gap-3" style={{ backdropFilter: 'blur(24px)', background: 'rgba(15,23,42,0.65)' }}>
          <Globe className="w-4 h-4 text-blue-400 shrink-0" />
          <Select value={sourceLang} onValueChange={setSourceLang}>
            <SelectTrigger className="bg-transparent border-0 text-white w-36 h-8 p-0 focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 max-h-64">
              {languages.map(l => <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10"><span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span></SelectItem>)}
            </SelectContent>
          </Select>
          <motion.button whileHover={{ scale: 1.15, rotate: 180 }} whileTap={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 300 }}
            onClick={() => { setSourceLang(targetLang); setTargetLang(sourceLang); }}
            className="w-8 h-8 rounded-full bg-white/10 hover:bg-white/20 flex items-center justify-center text-white">
            <ArrowRightLeft className="w-4 h-4" />
          </motion.button>
          <Select value={targetLang} onValueChange={setTargetLang}>
            <SelectTrigger className="bg-transparent border-0 text-white w-36 h-8 p-0 focus:ring-0"><SelectValue /></SelectTrigger>
            <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20 max-h-64">
              {languages.map(l => <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10"><span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span></SelectItem>)}
            </SelectContent>
          </Select>
        </div>
      </motion.div>

      {/* Quick phrases */}
      <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.3 }} className="flex flex-wrap gap-2 justify-center mb-6">
        {QUICK_PHRASES.map((p, i) => (
          <motion.button key={i} whileHover={{ scale: 1.05, y: -2 }} whileTap={{ scale: 0.95 }} onClick={() => handleSend(p)}
            className="px-3 py-1.5 rounded-full text-xs text-white/70 hover:text-white border border-white/15 hover:border-white/30 bg-white/5 hover:bg-white/10 transition-all">
            {p}
          </motion.button>
        ))}
      </motion.div>

      {/* Chat window */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.35 }}
        className="glass-card rounded-3xl overflow-hidden mb-4" style={{ backdropFilter: 'blur(28px)', background: 'rgba(15,23,42,0.65)' }}>

        <div className="h-[480px] overflow-y-auto p-5 space-y-5 custom-scrollbar">
          <AnimatePresence initial={false}>
            {messages.map(msg => (
              <motion.div key={msg.id} initial={{ opacity: 0, y: 16, scale: 0.96 }} animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ type: 'spring', stiffness: 260, damping: 22 }}
                className={`flex gap-3 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>

                {msg.role === 'assistant' && (
                  <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0 mt-1 shadow-lg shadow-purple-500/30">
                    <Brain className="w-4 h-4 text-white" />
                  </div>
                )}

                <div className={`max-w-[78%] space-y-3 flex flex-col ${msg.role === 'user' ? 'items-end' : 'items-start'}`}>
                  <div className={`rounded-2xl px-4 py-3 text-sm leading-relaxed ${msg.role === 'user' ? 'bg-gradient-to-br from-blue-500/25 to-cyan-500/25 border border-blue-500/30 text-white' : 'bg-white/5 border border-white/10 text-white/90'}`}>
                    {msg.content.split('**').map((part, i) =>
                      i % 2 === 0 ? <span key={i}>{part}</span> : <strong key={i} className="text-purple-300 font-semibold">{part}</strong>
                    )}
                  </div>

                  {msg.cards && (
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full">
                      {msg.cards.map((card, ci) => (
                        <motion.div key={ci} initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: ci * 0.07 }}
                          className={`rounded-xl p-3 border text-xs ${card.color}`}>
                          <div className="text-white/60 font-medium mb-1">{card.label}</div>
                          <div className="text-white font-medium leading-relaxed">{card.value}</div>
                          {ci === 1 && msg.translation && (
                            <div className="flex gap-2 mt-2">
                              <button onClick={() => speak(msg.translation!, targetLang)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                                <Volume2 className="w-3 h-3" /><span>Speak</span>
                              </button>
                              <button onClick={() => copy(msg.translation!, msg.id)}
                                className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/10 hover:bg-white/20 text-white/70 hover:text-white transition-colors">
                                {copied === msg.id ? <><Check className="w-3 h-3 text-green-400" /><span className="text-green-400">Copied</span></> : <><Copy className="w-3 h-3" /><span>Copy</span></>}
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

          {isTyping && (
            <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="flex gap-3 items-start">
              <div className="w-9 h-9 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center shrink-0">
                <Brain className="w-4 h-4 text-white" />
              </div>
              <div className="bg-white/5 border border-white/10 rounded-2xl px-4 py-3 flex items-center gap-1.5">
                {[0, 1, 2].map(i => (
                  <motion.div key={i} animate={{ y: [0, -6, 0], opacity: [0.4, 1, 0.4] }}
                    transition={{ duration: 0.8, repeat: Infinity, delay: i * 0.15 }}
                    className="w-2 h-2 bg-purple-400 rounded-full" />
                ))}
                <span className="text-white/40 text-xs ml-2">Translating…</span>
              </div>
            </motion.div>
          )}
          <div ref={messagesEndRef} />
        </div>

        <div className="border-t border-white/10 p-4 flex gap-3">
          <Textarea value={input} onChange={e => setInput(e.target.value)}
            onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); } }}
            placeholder={`Type in ${languages.find(l => l.code === sourceLang)?.name ?? 'any language'}… (Enter to send)`}
            className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/35 rounded-2xl resize-none min-h-[52px] max-h-32 focus-visible:ring-purple-500/40" rows={1} />
          <motion.div whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
            <Button onClick={() => handleSend()} disabled={!input.trim() || isTyping}
              className="h-[52px] px-5 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl shadow-lg shadow-purple-500/30 disabled:opacity-40">
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
          <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.5 + i * 0.1 }}
            whileHover={{ scale: 1.04, y: -4 }} className="glass-card rounded-2xl p-5 text-center"
            style={{ backdropFilter: 'blur(20px)', background: 'rgba(15,23,42,0.5)' }}>
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
