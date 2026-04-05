import { useState, useRef, useEffect } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { 
  MessageSquare, 
  Send, 
  Sparkles, 
  Bot, 
  User, 
  Zap,
  Brain,
  Globe,
  BookOpen,
  Wand2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Textarea } from '../components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '../components/ui/select';
import { toast } from 'sonner';
import { projectId, publicAnonKey } from '/utils/supabase/info';

// Language options
const languages = [
  { code: 'en', name: 'English', flag: '🇬🇧' },
  { code: 'es', name: 'Spanish', flag: '🇪🇸' },
  { code: 'fr', name: 'French', flag: '🇫🇷' },
  { code: 'de', name: 'German', flag: '🇩🇪' },
  { code: 'ja', name: 'Japanese', flag: '🇯🇵' },
  { code: 'zh-Hans', name: 'Chinese', flag: '🇨🇳' },
];

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  detailedInfo?: any;
}

// Floating cartoon character component
function FloatingCharacter({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0 }}
      animate={{ 
        opacity: 1, 
        scale: 1,
        y: [0, -20, 0],
        rotate: [0, 5, -5, 0]
      }}
      transition={{
        duration: 3,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
      className="absolute"
    >
      <div className="relative">
        <motion.div
          animate={{
            boxShadow: [
              '0 0 20px rgba(59, 130, 246, 0.5)',
              '0 0 40px rgba(147, 51, 234, 0.5)',
              '0 0 20px rgba(59, 130, 246, 0.5)',
            ]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="w-24 h-24 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center"
        >
          <Sparkles className="w-12 h-12 text-white" />
        </motion.div>
        {/* Sparkle particles */}
        <motion.div
          animate={{
            scale: [1, 1.2, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity }}
          className="absolute -top-2 -right-2 w-6 h-6 rounded-full bg-yellow-400"
        />
        <motion.div
          animate={{
            scale: [1, 1.3, 1],
            opacity: [0.5, 1, 0.5]
          }}
          transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
          className="absolute -bottom-2 -left-2 w-4 h-4 rounded-full bg-pink-400"
        />
      </div>
    </motion.div>
  );
}

// 3D Scroll Card Component
function ScrollCard3D({ children, index }: { children: React.ReactNode; index: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [100, -100]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.8, 1, 1, 0.8]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [15, 0, -15]);

  return (
    <motion.div
      ref={ref}
      style={{ 
        y: useSpring(y, { stiffness: 100, damping: 30 }),
        opacity,
        scale: useSpring(scale, { stiffness: 100, damping: 30 }),
        rotateX: useSpring(rotateX, { stiffness: 100, damping: 30 }),
        transformStyle: 'preserve-3d',
        transformPerspective: 1000
      }}
    >
      {children}
    </motion.div>
  );
}

export function AIAssistantPage() {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      role: 'assistant',
      content: '👋 Hello! I\'m your AI translation assistant. I can help you understand words, phrases, and their cultural context. Just type any word or phrase you\'d like to learn about!',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const [sourceLang, setSourceLang] = useState('en');
  const [targetLang, setTargetLang] = useState('es');
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSend = async () => {
    if (!input.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      role: 'user',
      content: input,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInput('');
    setIsTyping(true);

    try {
      const response = await fetch(
        `https://${projectId}.supabase.co/functions/v1/make-server-e0a50523/ai-assistant`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${publicAnonKey}`
          },
          body: JSON.stringify({
            text: input,
            sourceLang: sourceLang,
            targetLang: targetLang
          })
        }
      );

      const data = await response.json();

      let responseContent = `🌍 **Translation**\n\n`;
      responseContent += `📝 **Original** (${data.sourceLanguage}): "${data.originalText}"\n`;
      responseContent += `✨ **Translated** (${data.targetLanguage}): "${data.translatedText}"\n\n`;
      
      if (data.detailedInfo) {
        const info = data.detailedInfo;
        
        responseContent += `📚 **Detailed Information**\n\n`;
        responseContent += `**Type:** ${info.type}\n`;
        responseContent += `**Definition:** ${info.definition}\n\n`;
        
        if (info.usage) responseContent += `**Usage:** ${info.usage}\n`;
        if (info.context) responseContent += `**Context:** ${info.context}\n`;
        if (info.formality) responseContent += `**Formality:** ${info.formality}\n`;
        if (info.pronunciation) responseContent += `**Pronunciation:** ${info.pronunciation}\n`;
        if (info.partOfSpeech) responseContent += `**Part of Speech:** ${info.partOfSpeech}\n\n`;
        
        if (info.examples && info.examples.length > 0) {
          responseContent += `**Examples:**\n`;
          info.examples.forEach((example: string, idx: number) => {
            responseContent += `${idx + 1}. ${example}\n`;
          });
          responseContent += `\n`;
        }
        
        if (info.synonyms && info.synonyms.length > 0) {
          responseContent += `**Synonyms:** ${info.synonyms.join(', ')}\n\n`;
        }
        
        if (info.cultural) {
          responseContent += `**Cultural Note:** ${info.cultural}\n`;
        }
      }

      const assistantMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: responseContent,
        detailedInfo: data.detailedInfo,
        timestamp: new Date(),
      };

      setTimeout(() => {
        setMessages(prev => [...prev, assistantMessage]);
        setIsTyping(false);
      }, 500);
    } catch (error) {
      console.error('AI Assistant error:', error);
      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        role: 'assistant',
        content: '❌ Sorry, I encountered an error. Please try again!',
        timestamp: new Date(),
      };
      setMessages(prev => [...prev, errorMessage]);
      setIsTyping(false);
      toast.error('Failed to get AI response');
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl relative">
      {/* Floating Cartoon Characters */}
      <div className="hidden lg:block">
        <div className="fixed top-32 left-10 z-0">
          <FloatingCharacter delay={0} />
        </div>
        <div className="fixed top-64 right-10 z-0">
          <FloatingCharacter delay={1} />
        </div>
        <div className="fixed bottom-32 left-20 z-0">
          <FloatingCharacter delay={2} />
        </div>
      </div>

      {/* Hero Section with 3D Animation */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, type: "spring" }}
        style={{ transformStyle: 'preserve-3d' }}
        className="text-center mb-12 relative z-10"
      >
        <motion.div
          animate={{
            y: [0, -10, 0],
            rotateY: [0, 5, -5, 0]
          }}
          transition={{ duration: 4, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-purple-500 via-pink-500 to-blue-500 flex items-center justify-center shadow-2xl">
            <Bot className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <h1 
          className="text-5xl md:text-7xl font-normal text-white mb-4"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          AI Translation <em className="not-italic text-purple-400">Assistant</em>
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Your intelligent companion for understanding languages, cultures, and context
        </p>
      </motion.div>

      {/* Language Selectors with 3D effect */}
      <ScrollCard3D index={0}>
        <motion.div 
          className="flex items-center justify-center gap-4 mb-8"
          whileHover={{ scale: 1.05 }}
        >
          <div className="glass-card rounded-full p-4 flex items-center gap-4">
            <Globe className="w-5 h-5 text-blue-400" />
            <Select value={sourceLang} onValueChange={setSourceLang}>
              <SelectTrigger className="bg-transparent border-0 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-white/10">
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            
            <motion.div
              animate={{ rotate: [0, 180, 360] }}
              transition={{ duration: 3, repeat: Infinity, ease: "linear" }}
            >
              <Zap className="w-5 h-5 text-yellow-400" />
            </motion.div>

            <Select value={targetLang} onValueChange={setTargetLang}>
              <SelectTrigger className="bg-transparent border-0 text-white w-40">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-slate-900/95 backdrop-blur-xl border-white/20">
                {languages.map((lang) => (
                  <SelectItem key={lang.code} value={lang.code} className="text-white hover:bg-white/10">
                    <span className="flex items-center gap-2">
                      <span>{lang.flag}</span>
                      <span>{lang.name}</span>
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </motion.div>
      </ScrollCard3D>

      {/* Chat Container with 3D Scroll Effect */}
      <ScrollCard3D index={1}>
        <div className="glass-card rounded-3xl p-6 mb-6 relative overflow-hidden">
          {/* Animated background gradient */}
          <motion.div
            animate={{
              backgroundPosition: ['0% 0%', '100% 100%', '0% 0%']
            }}
            transition={{ duration: 10, repeat: Infinity, ease: "linear" }}
            className="absolute inset-0 bg-gradient-to-br from-blue-500/5 via-purple-500/5 to-pink-500/5"
            style={{ backgroundSize: '200% 200%' }}
          />

          {/* Messages */}
          <div 
            ref={containerRef}
            className="h-[500px] overflow-y-auto mb-4 space-y-4 custom-scrollbar relative z-10"
          >
            {messages.map((message, index) => (
              <motion.div
                key={message.id}
                initial={{ opacity: 0, x: message.role === 'user' ? 50 : -50, scale: 0.8 }}
                animate={{ opacity: 1, x: 0, scale: 1 }}
                transition={{ 
                  type: "spring",
                  stiffness: 200,
                  damping: 20,
                  delay: index * 0.1
                }}
                className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                <div className={`flex items-start gap-3 max-w-[80%] ${message.role === 'user' ? 'flex-row-reverse' : 'flex-row'}`}>
                  {/* Avatar with 3D effect */}
                  <motion.div
                    whileHover={{ 
                      scale: 1.2, 
                      rotate: [0, -10, 10, 0],
                      transition: { duration: 0.5 }
                    }}
                    className={`
                      w-10 h-10 rounded-full flex items-center justify-center flex-shrink-0
                      ${message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500 to-cyan-500'
                        : 'bg-gradient-to-br from-purple-500 to-pink-500'
                      }
                    `}
                  >
                    {message.role === 'user' ? (
                      <User className="w-5 h-5 text-white" />
                    ) : (
                      <Brain className="w-5 h-5 text-white" />
                    )}
                  </motion.div>

                  {/* Message Bubble */}
                  <motion.div
                    whileHover={{ scale: 1.02, y: -2 }}
                    className={`
                      rounded-2xl p-4 
                      ${message.role === 'user'
                        ? 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20 border border-blue-500/30'
                        : 'glass-card'
                      }
                    `}
                  >
                    <div className="text-white text-sm leading-relaxed whitespace-pre-wrap">
                      {message.content.split('**').map((part, i) => 
                        i % 2 === 0 ? part : <strong key={i} className="text-purple-300">{part}</strong>
                      )}
                    </div>
                    <div className="text-white/40 text-xs mt-2">
                      {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                    </div>
                  </motion.div>
                </div>
              </motion.div>
            ))}

            {/* Typing Indicator */}
            {isTyping && (
              <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex items-start gap-3"
              >
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
                  <Brain className="w-5 h-5 text-white" />
                </div>
                <div className="glass-card rounded-2xl p-4">
                  <div className="flex gap-2">
                    {[0, 1, 2].map((i) => (
                      <motion.div
                        key={i}
                        animate={{
                          y: [0, -10, 0],
                          opacity: [0.5, 1, 0.5]
                        }}
                        transition={{
                          duration: 1,
                          repeat: Infinity,
                          delay: i * 0.2
                        }}
                        className="w-2 h-2 bg-purple-400 rounded-full"
                      />
                    ))}
                  </div>
                </div>
              </motion.div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="flex gap-3 relative z-10">
            <Textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyPress={handleKeyPress}
              placeholder="Ask me about any word or phrase..."
              className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-2xl resize-none h-14"
              rows={1}
            />
            <motion.div whileHover={{ scale: 1.1 }} whileTap={{ scale: 0.9 }}>
              <Button
                onClick={handleSend}
                disabled={!input.trim() || isTyping}
                className="h-14 px-6 bg-gradient-to-r from-purple-500 to-pink-500 hover:from-purple-600 hover:to-pink-600 text-white rounded-2xl"
              >
                <Send className="w-5 h-5" />
              </Button>
            </motion.div>
          </div>
        </div>
      </ScrollCard3D>

      {/* Feature Cards with 3D Scroll */}
      <div className="grid md:grid-cols-3 gap-6 mt-12">
        {[
          {
            icon: BookOpen,
            title: 'Detailed Definitions',
            description: 'Get comprehensive meanings and usage examples',
            color: 'from-blue-500 to-cyan-500'
          },
          {
            icon: Globe,
            title: 'Cultural Context',
            description: 'Understand cultural nuances and appropriateness',
            color: 'from-purple-500 to-pink-500'
          },
          {
            icon: Wand2,
            title: 'Smart Learning',
            description: 'Synonyms, pronunciation, and part of speech',
            color: 'from-green-500 to-emerald-500'
          }
        ].map((feature, index) => (
          <ScrollCard3D key={index} index={index + 2}>
            <motion.div
              whileHover={{ 
                scale: 1.05,
                rotateY: 10,
                z: 50
              }}
              style={{ transformStyle: 'preserve-3d' }}
              className="glass-card rounded-2xl p-6 text-center"
            >
              <motion.div
                animate={{
                  rotate: [0, 360],
                  scale: [1, 1.2, 1]
                }}
                transition={{
                  duration: 4,
                  repeat: Infinity,
                  ease: "easeInOut"
                }}
                className={`w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br ${feature.color} flex items-center justify-center`}
              >
                <feature.icon className="w-8 h-8 text-white" />
              </motion.div>
              <h3 className="text-white font-semibold text-lg mb-2">{feature.title}</h3>
              <p className="text-white/60 text-sm">{feature.description}</p>
            </motion.div>
          </ScrollCard3D>
        ))}
      </div>
    </div>
  );
}
