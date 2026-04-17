import { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence, useMotionValue, useSpring, useTransform } from 'motion/react';
import {
  Languages,
  ArrowRightLeft,
  Volume2,
  Copy,
  Check,
  Sparkles,
  Loader2,
  Mic,
  MicOff,
  Zap,
  Brain,
  MessageSquare,
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { SmartSuggestions } from '../components/SmartSuggestions';
import { AIComparison } from '../components/AIComparison';
import { MicrophonePermissionDialog } from '../components/MicrophonePermissionDialog';
import { ScriptKeypad, KEYPAD_LANGS } from '../components/ScriptKeypad';
import { translateText } from '/utils/rapidApiTranslate';
import { appendTranslationHistory } from '/utils/translationHistory';
import { translateViaSpringBoot, checkBackendHealth } from '/utils/springApi';

const languages = [
  { code: 'auto', name: 'Auto Detect', flag: '🌐' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'mr', name: 'Marathi', flag: '🇮🇳' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'it', name: 'Italian', flag: '🇮🇹' },
  { code: 'pt', name: 'Portuguese', flag: '🇵🇹' },
  { code: 'ru', name: 'Russian', flag: '🇷🇺' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'ko', name: 'Korean', flag: '🇰🇷' },
  { code: 'zh-Hans', name: 'Chinese', flag: '🇨🇳' },
  { code: 'ar', name: 'Arabic', flag: '🇸🇦' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
  { code: 'nl', name: 'Dutch', flag: '🇳🇱' },
  { code: 'pl', name: 'Polish', flag: '🇵🇱' },
  { code: 'sv', name: 'Swedish', flag: '🇸🇪' },
  { code: 'th', name: 'Thai', flag: '🇹🇭' },
  { code: 'vi', name: 'Vietnamese', flag: '🇻🇳' },
];

function Card3D({ children, className = '' }: { children: React.ReactNode; className?: string }) {
  const cardRef = useRef<HTMLDivElement>(null);
  const mouseX = useMotionValue(0);
  const mouseY = useMotionValue(0);
  const rotateX = useSpring(useTransform(mouseY, [-0.5, 0.5], [5, -5]), { stiffness: 300, damping: 30 });
  const rotateY = useSpring(useTransform(mouseX, [-0.5, 0.5], [-5, 5]), { stiffness: 300, damping: 30 });

  const handleMouseMove = (e: React.MouseEvent<HTMLDivElement>) => {
    if (!cardRef.current) return;
    const rect = cardRef.current.getBoundingClientRect();
    mouseX.set((e.clientX - rect.left - rect.width / 2) / rect.width);
    mouseY.set((e.clientY - rect.top - rect.height / 2) / rect.height);
  };

  return (
    <motion.div
      ref={cardRef}
      onMouseMove={handleMouseMove}
      onMouseLeave={() => { mouseX.set(0); mouseY.set(0); }}
      style={{ rotateX, rotateY, transformStyle: 'preserve-3d' }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

async function doTranslate(text: string, from: string, to: string): Promise<{ text: string; provider: string }> {
  // 1. Try Spring Boot backend (handles DB save)
  try {
    const r = await translateViaSpringBoot(text, from, to, false);
    if (r.translatedText) return { text: r.translatedText, provider: r.provider };
  } catch { /* fall through */ }
  // 2. Direct engine chain: Google unofficial → MyMemory → RapidAPI → LibreTranslate
  const r = await translateText(text, from, to);
  return { text: r.translatedText, provider: r.provider };
}

export function HomePage() {
  const [sourceText, setSourceText] = useState('');
  const [translatedText, setTranslatedText] = useState('');
  const [sourceLang, setSourceLang] = useState('auto');
  const [targetLang, setTargetLang] = useState('hi');
  const [isTranslating, setIsTranslating] = useState(false);
  const [copied, setCopied] = useState(false);
  const [isListening, setIsListening] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [showMicPermissionDialog, setShowMicPermissionDialog] = useState(false);
  const [activeMode, setActiveMode] = useState<'standard' | 'smart' | 'compare'>('standard');
  const [backendOnline, setBackendOnline] = useState(false);
  const recognitionRef = useRef<any>(null);

  useEffect(() => {
    checkBackendHealth().then(setBackendOnline);
  }, []);

  useEffect(() => {
    if (!sourceText.trim()) { setTranslatedText(''); return; }
    const timer = setTimeout(() => handleTranslate(), 800);
    return () => clearTimeout(timer);
  }, [sourceText, sourceLang, targetLang]);

  useEffect(() => {
    if ('webkitSpeechRecognition' in window || 'SpeechRecognition' in window) {
      const SR = (window as any).webkitSpeechRecognition || (window as any).SpeechRecognition;
      recognitionRef.current = new SR();
      recognitionRef.current.continuous = false;
      recognitionRef.current.interimResults = false;
      recognitionRef.current.onresult = (e: any) => {
        setSourceText(e.results[0][0].transcript);
        setIsListening(false);
        toast.success('Voice captured!');
      };
      recognitionRef.current.onerror = (e: any) => {
        setIsListening(false);
        if (e.error === 'not-allowed') setShowMicPermissionDialog(true);
        else toast.error(`Voice error: ${e.error}`);
      };
      recognitionRef.current.onend = () => setIsListening(false);
    }
  }, []);

  const handleTranslate = async () => {
    if (!sourceText.trim()) return;
    setIsTranslating(true);
    try {
      const result = await doTranslate(sourceText, sourceLang, targetLang);
      setTranslatedText(result.text);
      // Save to Spring Boot DB if online, else localStorage
      if (backendOnline) {
        try { await translateViaSpringBoot(sourceText, sourceLang, targetLang, true); } catch { /* ignore */ }
      }
      appendTranslationHistory({ source: sourceText, translation: result.text, sourceLang, targetLang });
    } catch (err: any) {
      toast.error('Translation failed', { description: err.message });
    } finally {
      setIsTranslating(false);
    }
  };

  // Expose translateText for AIComparison / SmartSuggestions
  const translateFn = async (text: string, from: string, to: string) => {
    const r = await doTranslate(text, from, to);
    return r.text;
  };

  const handleSwapLanguages = () => {
    if (sourceLang === 'auto') { toast.error('Cannot swap from Auto Detect'); return; }
    setSourceLang(targetLang);
    setTargetLang(sourceLang);
    setSourceText(translatedText);
    setTranslatedText(sourceText);
  };

  const handleCopy = async () => {
    if (!translatedText) return;
    await navigator.clipboard.writeText(translatedText);
    setCopied(true);
    toast.success('Copied!');
    setTimeout(() => setCopied(false), 2000);
  };

  const handleSpeak = (text: string, lang: string) => {
    if (!text) { toast.error('No text to speak'); return; }
    if (!('speechSynthesis' in window)) { toast.error('TTS not supported'); return; }
    window.speechSynthesis.cancel();
    const u = new SpeechSynthesisUtterance(text);
    if (lang !== 'auto') u.lang = lang;
    u.rate = 0.9;
    u.onstart = () => setIsSpeaking(true);
    u.onend = () => setIsSpeaking(false);
    u.onerror = () => { setIsSpeaking(false); toast.error('TTS failed'); };
    window.speechSynthesis.speak(u);
  };

  const toggleVoiceInput = async () => {
    if (!recognitionRef.current) { toast.error('Voice not supported'); return; }
    if (isListening) { recognitionRef.current.stop(); setIsListening(false); return; }
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      stream.getTracks().forEach(t => t.stop());
    } catch {
      setShowMicPermissionDialog(true);
      return;
    }
    recognitionRef.current.lang = sourceLang === 'auto' ? 'en-US' : sourceLang;
    recognitionRef.current.start();
    setIsListening(true);
    toast.info('🎤 Listening… speak now');
  };

  // Insert char from keypad into source textarea
  const handleKeypadInsert = (char: string) => {
    if (char === '\b') {
      setSourceText(t => t.slice(0, -1));
    } else {
      setSourceText(t => t + char);
    }
  };

  // Which keypad to show for source lang
  const sourceKeypadLang = KEYPAD_LANGS.includes(sourceLang) ? sourceLang : null;
  const targetKeypadLang = KEYPAD_LANGS.includes(targetLang) ? targetLang : null;

  return (
    <div className="min-h-screen w-full relative">
      {/* Full-screen video behind translator */}
      <div className="fixed inset-0 z-0 pointer-events-none overflow-hidden">
        <motion.div
          className="absolute inset-0"
          animate={{ scale: [1.06, 1.12, 1.06], x: ['-1%', '1%', '-1%'], y: ['0%', '-0.5%', '0%'] }}
          transition={{ duration: 48, repeat: Infinity, ease: 'easeInOut' }}
        >
          <video
            autoPlay loop muted playsInline
            style={{
              position: 'absolute', inset: 0, width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              filter: 'brightness(0.52) contrast(1.25) saturate(1.4)',
              imageRendering: 'high-quality',
              transform: 'scale(1.001)',
            } as React.CSSProperties}
          >
            <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4" type="video/mp4" />
          </video>
        </motion.div>
        {/* Subtle vignette so text stays readable */}
        <div className="absolute inset-0 z-[1]" style={{
          background: 'radial-gradient(ellipse 90% 90% at 50% 50%, transparent 40%, rgba(0,0,0,0.55) 100%)'
        }} />
      </div>

      <div className="relative z-10 container mx-auto px-4 sm:px-6 py-8 sm:py-12 max-w-7xl">
        {/* Hero */}
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2 }}
          className="text-center mb-8 sm:mb-12"
        >
          <motion.h2
            className="text-4xl sm:text-5xl md:text-7xl font-normal leading-tight mb-4 tracking-tight"
            style={{ fontFamily: "'Instrument Serif', serif" }}
            animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
            transition={{ duration: 8, repeat: Infinity, ease: 'linear' }}
          >
            <span style={{
              background: 'linear-gradient(90deg, #fff 0%, #93c5fd 35%, #c4b5fd 65%, #fff 100%)',
              backgroundSize: '200% auto',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              backgroundClip: 'text',
            }}>
              Translate <em className="not-italic" style={{
                background: 'linear-gradient(90deg, #60a5fa, #a78bfa)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent',
                backgroundClip: 'text',
              }}>with precision</em>
            </span>
          </motion.h2>
          <p className="text-white/70 text-base sm:text-lg max-w-2xl mx-auto">
            Powered by advanced AI · 20+ languages · Real-time voice translation
          </p>
          <div className="mt-3 flex items-center justify-center gap-2 text-xs">
            <span className={`w-2 h-2 rounded-full ${backendOnline ? 'bg-green-400' : 'bg-yellow-400'}`} />
            <span className="text-white/50">{backendOnline ? 'Spring Boot DB connected' : 'Offline mode — localStorage only'}</span>
          </div>
        </motion.div>

        {/* Mode Tabs */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="flex justify-center mb-8"
        >
          <div className="glass-card rounded-full p-2 inline-flex gap-2">
            {[
              { id: 'standard', label: 'Standard', Icon: Languages, grad: 'from-blue-500 to-purple-500' },
              { id: 'smart', label: 'Smart', Icon: Zap, grad: 'from-purple-500 to-pink-500' },
              { id: 'compare', label: 'AI Compare', Icon: Brain, grad: 'from-emerald-500 to-cyan-500' },
            ].map(({ id, label, Icon, grad }) => (
              <button
                key={id}
                onClick={() => setActiveMode(id as any)}
                className={`px-6 py-3 rounded-full flex items-center gap-2 transition-all font-medium
                  ${activeMode === id
                    ? `bg-gradient-to-r ${grad} text-white shadow-lg`
                    : 'text-white/60 hover:text-white hover:bg-white/5'
                  }`}
              >
                <Icon className="w-4 h-4" />
                <span>{label}</span>
              </button>
            ))}
          </div>
        </motion.div>

        <AnimatePresence mode="wait">
          {activeMode === 'smart' ? (
            <motion.div key="smart" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <SmartSuggestions
            onAcceptSuggestion={(t) => {
              setSourceText(t);
              setActiveMode('standard');
              toast.success('Suggestion accepted! Translating…');
            }}
            targetLang={targetLang}
            sourceLang={sourceLang}
            onTranslate={translateFn}
          />
            </motion.div>
          ) : activeMode === 'compare' ? (
            <motion.div key="compare" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              <AIComparison onTranslate={translateFn} sourceLang={sourceLang} targetLang={targetLang} />
            </motion.div>
          ) : (
            <motion.div key="standard" initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
              {/* Language Selectors */}
              <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-6 mb-8">
                <div className="w-full sm:flex-1 max-w-xs">
                  <Select value={sourceLang} onValueChange={setSourceLang}>
                    <SelectTrigger className="liquid-glass border-white/20 text-white h-12 rounded-full hover:bg-white/10 transition-all w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20">
                      {languages.map((l) => (
                        <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10">
                          <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <motion.div whileHover={{ scale: 1.1, rotate: 180 }} whileTap={{ scale: 0.9 }} transition={{ type: 'spring', stiffness: 300 }}>
                  <Button onClick={handleSwapLanguages} variant="outline" size="icon"
                    className="liquid-glass rounded-full h-12 w-12 border-white/20 hover:bg-white/10 text-white">
                    <ArrowRightLeft className="w-5 h-5" />
                  </Button>
                </motion.div>

                <div className="w-full sm:flex-1 max-w-xs">
                  <Select value={targetLang} onValueChange={setTargetLang}>
                    <SelectTrigger className="liquid-glass border-white/20 text-white h-12 rounded-full hover:bg-white/10 transition-all w-full">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20">
                      {languages.filter(l => l.code !== 'auto').map((l) => (
                        <SelectItem key={l.code} value={l.code} className="text-white hover:bg-white/10">
                          <span className="flex items-center gap-2"><span>{l.flag}</span><span>{l.name}</span></span>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Translation Cards */}
              <div className="grid lg:grid-cols-2 gap-6 sm:gap-8 mb-8 sm:mb-12">
                {/* Source */}
                <Card3D className="h-full">
                  <div className="glass-card rounded-3xl p-4 sm:p-6 h-full" style={{ backdropFilter: 'blur(24px)', background: 'rgba(15,23,42,0.55)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium text-base sm:text-lg flex items-center gap-2">
                        <Languages className="w-5 h-5" />
                        Source Text
                      </h3>
                      <div className="flex items-center gap-2">
                        {sourceKeypadLang && (
                          <ScriptKeypad lang={sourceKeypadLang} onInsert={handleKeypadInsert} />
                        )}
                        <Button onClick={toggleVoiceInput} variant="ghost" size="sm"
                          className={`liquid-glass rounded-full ${isListening ? 'animate-pulse bg-red-500/30' : 'hover:bg-white/10'} text-white`}>
                          {isListening ? <MicOff className="w-4 h-4" /> : <Mic className="w-4 h-4" />}
                        </Button>
                      </div>
                    </div>

                    <Textarea
                      value={sourceText}
                      onChange={(e) => setSourceText(e.target.value)}
                      placeholder="Type or speak to translate…"
                      className="min-h-[250px] sm:min-h-[300px] text-base sm:text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20 resize-none rounded-2xl"
                    />

                    {/* Keypad row for all script languages */}
                    <div className="flex flex-wrap gap-2 mt-3">
                      {KEYPAD_LANGS.map(lang => (
                        <ScriptKeypad key={lang} lang={lang} onInsert={handleKeypadInsert} />
                      ))}
                    </div>

                    <div className="flex justify-between items-center mt-3">
                      <span className="text-white/60 text-sm">{sourceText.length} / 5000</span>
                      <div className="flex gap-2">
                        <Button onClick={() => handleSpeak(sourceText, sourceLang)} variant="ghost" size="sm"
                          disabled={!sourceText || isSpeaking}
                          className="liquid-glass hover:bg-white/10 text-white rounded-full text-xs sm:text-sm">
                          <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                          <span className="hidden sm:inline">{isSpeaking ? 'Speaking…' : 'Listen'}</span>
                        </Button>
                        {sourceText && (
                          <Button onClick={() => setSourceText('')} variant="ghost" size="sm"
                            className="liquid-glass hover:bg-white/10 text-white rounded-full text-xs sm:text-sm">
                            Clear
                          </Button>
                        )}
                      </div>
                    </div>
                  </div>
                </Card3D>

                {/* Translation */}
                <Card3D className="h-full">
                  <div className="glass-card rounded-3xl p-4 sm:p-6 h-full relative overflow-hidden" style={{ backdropFilter: 'blur(24px)', background: 'rgba(15,23,42,0.55)' }}>
                    <div className="flex items-center justify-between mb-4">
                      <h3 className="text-white font-medium text-base sm:text-lg flex items-center gap-2">
                        <Sparkles className="w-5 h-5" />
                        Translation
                        {targetKeypadLang && (
                          <span className="text-xs bg-blue-500/20 text-blue-300 px-2 py-0.5 rounded-full ml-1">
                            {languages.find(l => l.code === targetLang)?.name}
                          </span>
                        )}
                      </h3>
                      {isTranslating && <div className="shimmer absolute top-0 left-0 right-0 h-1" />}
                    </div>

                    <AnimatePresence mode="wait">
                      {isTranslating ? (
                        <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
                          className="min-h-[250px] sm:min-h-[300px] flex items-center justify-center">
                          <div className="flex flex-col items-center gap-4">
                            <Loader2 className="w-10 h-10 text-blue-400 animate-spin" />
                            <p className="text-white/60 text-sm">Translating…</p>
                          </div>
                        </motion.div>
                      ) : (
                        <motion.div key="translated" initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
                          <Textarea
                            value={translatedText}
                            readOnly
                            placeholder="Translation will appear here…"
                            className="min-h-[250px] sm:min-h-[300px] text-base sm:text-lg bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20 resize-none rounded-2xl"
                          />
                        </motion.div>
                      )}
                    </AnimatePresence>

                    <div className="flex justify-end gap-2 mt-4">
                      <Button onClick={() => handleSpeak(translatedText, targetLang)} variant="ghost" size="sm"
                        disabled={!translatedText || isSpeaking}
                        className="liquid-glass hover:bg-white/10 text-white rounded-full text-xs sm:text-sm">
                        <Volume2 className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" />
                        <span className="hidden sm:inline">{isSpeaking ? 'Speaking…' : 'Listen'}</span>
                      </Button>
                      <Button onClick={handleCopy} variant="ghost" size="sm" disabled={!translatedText}
                        className="liquid-glass hover:bg-white/10 text-white rounded-full text-xs sm:text-sm">
                        {copied ? (
                          <><Check className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1 text-green-400" /><span className="hidden sm:inline">Copied</span></>
                        ) : (
                          <><Copy className="w-3 h-3 sm:w-4 sm:h-4 sm:mr-1" /><span className="hidden sm:inline">Copy</span></>
                        )}
                      </Button>
                    </div>
                  </div>
                </Card3D>
              </div>

              {/* Features Grid */}
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6">
                {[
                  { icon: Languages, title: '20+ Languages', description: 'Hindi, Marathi & more' },
                  { icon: Mic, title: 'Voice Input', description: 'Speak naturally' },
                  { icon: Volume2, title: 'Text-to-Speech', description: 'Hear translations' },
                  { icon: MessageSquare, title: 'AI Assistant', description: 'Chat-based help' },
                ].map((f, i) => (
                  <motion.div key={i} whileHover={{ scale: 1.05, y: -5 }} transition={{ type: 'spring', stiffness: 300 }}
                    className="glass-card rounded-2xl p-4 sm:p-6 text-center" style={{ backdropFilter: 'blur(20px)', background: 'rgba(15,23,42,0.5)' }}>
                    <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-full bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center mb-3 sm:mb-4 mx-auto">
                      <f.icon className="w-5 h-5 sm:w-7 sm:h-7 text-blue-300" />
                    </div>
                    <h4 className="font-medium text-white mb-1 sm:mb-2 text-sm sm:text-base">{f.title}</h4>
                    <p className="text-xs sm:text-sm text-white/60">{f.description}</p>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <MicrophonePermissionDialog
        isOpen={showMicPermissionDialog}
        onClose={() => setShowMicPermissionDialog(false)}
        onRetry={toggleVoiceInput}
      />
    </div>
  );
}
