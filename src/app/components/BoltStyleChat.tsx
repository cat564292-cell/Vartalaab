import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Send, Sparkles, Languages, Volume2, Bot, User, Info, BookOpen, MessageCircle } from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { projectId, publicAnonKey } from '/utils/supabase/info';

interface Message {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
  detailedInfo?: any;
}

interface BoltStyleChatProps {
  onTranslate: (text: string, sourceLang: string, targetLang: string) => Promise<string>;
  sourceLang: string;
  targetLang: string;
}

export function BoltStyleChat({ onTranslate, sourceLang, targetLang }: BoltStyleChatProps) {
  const [messages, setMessages] = useState<Message[]>([
    {
      id: '0',
      role: 'assistant',
      content: '👋 **Welcome to VarTalaab AI Assistant!**\n\nI provide comprehensive translation insights including:\n\n✨ **Accurate translations**\n📖 **Detailed definitions & meanings**\n🎯 **Usage context & examples**\n🗣️ **Pronunciation guides**\n🌍 **Cultural notes**\n📝 **Synonyms & related words**\n\nJust type any word or phrase to get started! Try "hello" or "thank you" to see the magic ✨',
      timestamp: new Date(),
    }
  ]);
  const [input, setInput] = useState('');
  const [isTyping, setIsTyping] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

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
      // Use the enhanced AI assistant endpoint
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

      if (!response.ok) {
        throw new Error('Failed to get AI response');
      }

      const data = await response.json();

      // Format the detailed response
      let responseContent = `🌍 **Translation**\n\n`;
      responseContent += `📝 **Original** (${data.sourceLanguage}): "${data.originalText}"\n`;
      responseContent += `✨ **Translated** (${data.targetLanguage}): "${data.translatedText}"\n\n`;
      
      if (data.detailedInfo) {
        const info = data.detailedInfo;
        
        responseContent += `📚 **Detailed Information**\n\n`;
        responseContent += `**Type:** ${info.type}\n`;
        responseContent += `**Definition:** ${info.definition}\n\n`;
        
        if (info.usage) {
          responseContent += `**Usage:** ${info.usage}\n`;
        }
        
        if (info.context) {
          responseContent += `**Context:** ${info.context}\n`;
        }
        
        if (info.formality) {
          responseContent += `**Formality:** ${info.formality}\n`;
        }
        
        if (info.pronunciation) {
          responseContent += `**Pronunciation:** ${info.pronunciation}\n`;
        }
        
        if (info.partOfSpeech) {
          responseContent += `**Part of Speech:** ${info.partOfSpeech}\n\n`;
        }
        
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
      
      // Fallback to simple translation
      try {
        const translation = await onTranslate(input, sourceLang, targetLang);
        const targetLangName = languages.find(l => l.code === targetLang)?.name || targetLang;
        
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: `🌍 **${targetLangName} Translation:**\n\n"${translation}"\n\n⚠️ Detailed information is currently unavailable. Please try again.`,
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      } catch (fallbackError) {
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          role: 'assistant',
          content: '❌ Sorry, I encountered an error while translating. Please try again.',
          timestamp: new Date(),
        };
        
        setMessages(prev => [...prev, errorMessage]);
      }
      
      setIsTyping(false);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  // Helper function to render formatted message content
  const renderMessageContent = (content: string) => {
    // Split by lines and process each line
    const lines = content.split('\n');
    
    return lines.map((line, idx) => {
      // Check if line contains bold text (text between **)
      const boldRegex = /\*\*(.*?)\*\*/g;
      const parts = [];
      let lastIndex = 0;
      let match;
      
      while ((match = boldRegex.exec(line)) !== null) {
        // Add text before the match
        if (match.index > lastIndex) {
          parts.push(
            <span key={`text-${idx}-${lastIndex}`}>
              {line.substring(lastIndex, match.index)}
            </span>
          );
        }
        
        // Add bold text
        parts.push(
          <strong key={`bold-${idx}-${match.index}`} className="font-semibold text-blue-200">
            {match[1]}
          </strong>
        );
        
        lastIndex = match.index + match[0].length;
      }
      
      // Add remaining text
      if (lastIndex < line.length) {
        parts.push(
          <span key={`text-${idx}-${lastIndex}`}>
            {line.substring(lastIndex)}
          </span>
        );
      }
      
      return (
        <div key={idx}>
          {parts.length > 0 ? parts : line}
        </div>
      );
    });
  };

  return (
    <div className="glass-card rounded-3xl p-6 h-[600px] flex flex-col">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 pb-4 border-b border-white/10">
        <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
          <Bot className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-white font-medium text-lg">AI Translation Assistant</h3>
          <p className="text-white/60 text-sm">Get detailed word information & translations</p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto space-y-4 mb-4 pr-2 custom-scrollbar">
        <AnimatePresence>
          {messages.map((message) => (
            <motion.div
              key={message.id}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className={`flex gap-3 ${message.role === 'user' ? 'flex-row-reverse' : ''}`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${
                message.role === 'user' 
                  ? 'bg-gradient-to-br from-indigo-500 to-purple-500' 
                  : 'bg-gradient-to-br from-blue-500 to-cyan-500'
              }`}>
                {message.role === 'user' ? (
                  <User className="w-4 h-4 text-white" />
                ) : (
                  <BookOpen className="w-4 h-4 text-white" />
                )}
              </div>
              <div className={`flex-1 max-w-[80%] ${message.role === 'user' ? 'text-right' : ''}`}>
                <div className={`inline-block px-4 py-3 rounded-2xl ${
                  message.role === 'user'
                    ? 'bg-gradient-to-r from-indigo-500 to-purple-500 text-white'
                    : 'glass-card text-white'
                }`}>
                  <div className="text-sm leading-relaxed">
                    {renderMessageContent(message.content)}
                  </div>
                </div>
                <p className="text-white/40 text-xs mt-1">
                  {message.timestamp.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </p>
              </div>
            </motion.div>
          ))}
        </AnimatePresence>

        {isTyping && (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex gap-3"
          >
            <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-cyan-500 flex items-center justify-center">
              <Sparkles className="w-4 h-4 text-white" />
            </div>
            <div className="glass-card px-4 py-3 rounded-2xl">
              <div className="flex gap-1">
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0 }}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.2 }}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                />
                <motion.div
                  animate={{ opacity: [0.4, 1, 0.4] }}
                  transition={{ duration: 1.5, repeat: Infinity, delay: 0.4 }}
                  className="w-2 h-2 bg-blue-400 rounded-full"
                />
              </div>
            </div>
          </motion.div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="flex gap-2">
        <Textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder="Ask me to translate something..."
          className="flex-1 bg-white/5 border-white/10 text-white placeholder:text-white/40 focus-visible:ring-white/20 resize-none rounded-xl min-h-[50px] max-h-[100px]"
          rows={1}
        />
        <Button
          onClick={handleSend}
          disabled={!input.trim() || isTyping}
          className="liquid-glass rounded-xl px-4 h-auto hover:bg-white/10 text-white"
        >
          <Send className="w-5 h-5" />
        </Button>
      </div>
    </div>
  );
}

// Language list for reference
const languages = [
  { code: 'auto', name: 'Auto Detect' },
  { code: 'en', name: 'English' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
  { code: 'it', name: 'Italian' },
  { code: 'pt', name: 'Portuguese' },
  { code: 'ru', name: 'Russian' },
  { code: 'ja', name: 'Japanese' },
  { code: 'ko', name: 'Korean' },
  { code: 'zh-Hans', name: 'Chinese' },
  { code: 'ar', name: 'Arabic' },
  { code: 'hi', name: 'Hindi' },
  { code: 'bn', name: 'Bengali' },
  { code: 'tr', name: 'Turkish' },
  { code: 'nl', name: 'Dutch' },
  { code: 'pl', name: 'Polish' },
  { code: 'sv', name: 'Swedish' },
  { code: 'th', name: 'Thai' },
  { code: 'vi', name: 'Vietnamese' },
];