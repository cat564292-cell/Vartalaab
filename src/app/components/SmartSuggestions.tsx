import { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Sparkles, ArrowRight, CheckCircle2, Zap } from 'lucide-react';
import { Button } from './ui/button';

interface Suggestion {
  id: string;
  text: string;
  type: 'grammar' | 'autocomplete' | 'replacement';
  changes?: {
    original: string;
    corrected: string;
    position: number;
  }[];
}

interface SmartSuggestionsProps {
  onAcceptSuggestion: (text: string) => void;
  targetLang: string;
}

export function SmartSuggestions({ onAcceptSuggestion, targetLang }: SmartSuggestionsProps) {
  const [input, setInput] = useState('');
  const [suggestions, setSuggestions] = useState<Suggestion[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [grammarErrors, setGrammarErrors] = useState<{ start: number; end: number; message: string }[]>([]);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const suggestionsRef = useRef<HTMLDivElement>(null);

  // Simulate AI analyzing text
  useEffect(() => {
    if (input.length === 0) {
      setSuggestions([]);
      setGrammarErrors([]);
      return;
    }

    setIsAnalyzing(true);
    const timer = setTimeout(() => {
      analyzeText(input);
      setIsAnalyzing(false);
    }, 300);

    return () => clearTimeout(timer);
  }, [input]);

  const analyzeText = (text: string) => {
    const newSuggestions: Suggestion[] = [];
    const errors: { start: number; end: number; message: string }[] = [];

    // Grammar correction examples
    const grammarPatterns = [
      {
        pattern: /\bhe go\b/gi,
        correction: 'he goes',
        message: 'Subject-verb agreement'
      },
      {
        pattern: /\bshe go\b/gi,
        correction: 'she goes',
        message: 'Subject-verb agreement'
      },
      {
        pattern: /\bit go\b/gi,
        correction: 'it goes',
        message: 'Subject-verb agreement'
      },
      {
        pattern: /\bi goes\b/gi,
        correction: 'I go',
        message: 'Subject-verb agreement'
      },
      {
        pattern: /\bthey goes\b/gi,
        correction: 'they go',
        message: 'Subject-verb agreement'
      },
      {
        pattern: /\ba apple\b/gi,
        correction: 'an apple',
        message: 'Article usage'
      },
      {
        pattern: /\ba orange\b/gi,
        correction: 'an orange',
        message: 'Article usage'
      },
      {
        pattern: /\ban car\b/gi,
        correction: 'a car',
        message: 'Article usage'
      },
      {
        pattern: /\bim\b/gi,
        correction: "I'm",
        message: 'Contraction spelling'
      },
      {
        pattern: /\bdont\b/gi,
        correction: "don't",
        message: 'Contraction spelling'
      },
      {
        pattern: /\bcant\b/gi,
        correction: "can't",
        message: 'Contraction spelling'
      }
    ];

    let correctedText = text;
    const changes: { original: string; corrected: string; position: number }[] = [];

    grammarPatterns.forEach(({ pattern, correction, message }) => {
      let match;
      const regex = new RegExp(pattern);
      while ((match = regex.exec(text)) !== null) {
        errors.push({
          start: match.index,
          end: match.index + match[0].length,
          message
        });
        
        changes.push({
          original: match[0],
          corrected: correction,
          position: match.index
        });
        
        correctedText = correctedText.replace(pattern, correction);
      }
    });

    if (changes.length > 0) {
      newSuggestions.push({
        id: 'grammar',
        text: correctedText,
        type: 'grammar',
        changes
      });
    }

    // Autocomplete suggestions
    const autocompletePhrases: { [key: string]: string[] } = {
      'how are': ['how are you?', 'how are you doing?', 'how are things?'],
      'thank you': ['thank you very much', 'thank you for your help', 'thank you so much'],
      'i would': ['I would like to', 'I would appreciate', 'I would love to'],
      'nice to': ['nice to meet you', 'nice to see you', 'nice to talk to you'],
      'good': ['good morning', 'good afternoon', 'good evening', 'good night'],
      'see you': ['see you later', 'see you soon', 'see you tomorrow'],
    };

    const lowerText = text.toLowerCase();
    Object.entries(autocompletePhrases).forEach(([trigger, completions]) => {
      if (lowerText.endsWith(trigger) || lowerText.includes(trigger + ' ')) {
        completions.forEach((completion, idx) => {
          if (!lowerText.includes(completion)) {
            newSuggestions.push({
              id: `autocomplete-${idx}`,
              text: completion,
              type: 'autocomplete'
            });
          }
        });
      }
    });

    // Word replacement suggestions
    const replacements: { [key: string]: string[] } = {
      'good': ['great', 'excellent', 'wonderful', 'fantastic'],
      'bad': ['poor', 'terrible', 'awful', 'unfortunate'],
      'big': ['large', 'huge', 'enormous', 'massive'],
      'small': ['tiny', 'little', 'compact', 'petite'],
      'happy': ['joyful', 'delighted', 'pleased', 'cheerful'],
      'sad': ['unhappy', 'sorrowful', 'melancholy', 'dejected']
    };

    const words = text.toLowerCase().split(/\s+/);
    words.forEach(word => {
      const cleanWord = word.replace(/[.,!?;:]/, '');
      if (replacements[cleanWord]) {
        replacements[cleanWord].forEach((replacement, idx) => {
          newSuggestions.push({
            id: `replacement-${cleanWord}-${idx}`,
            text: text.replace(new RegExp(`\\b${cleanWord}\\b`, 'i'), replacement),
            type: 'replacement'
          });
        });
      }
    });

    setGrammarErrors(errors);
    setSuggestions(newSuggestions.slice(0, 5)); // Limit to 5 suggestions
    setSelectedIndex(0);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (suggestions.length === 0) return;

    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex(prev => (prev + 1) % suggestions.length);
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex(prev => (prev - 1 + suggestions.length) % suggestions.length);
    } else if (e.key === 'Enter' && e.ctrlKey && suggestions[selectedIndex]) {
      e.preventDefault();
      acceptSuggestion(suggestions[selectedIndex]);
    } else if (e.key === 'Escape') {
      setSuggestions([]);
    }
  };

  const acceptSuggestion = (suggestion: Suggestion) => {
    setInput(suggestion.text);
    onAcceptSuggestion(suggestion.text);
    setSuggestions([]);
    setGrammarErrors([]);
  };

  const renderTextWithErrors = () => {
    if (grammarErrors.length === 0) return input;

    const parts: JSX.Element[] = [];
    let lastIndex = 0;

    grammarErrors.forEach((error, idx) => {
      if (error.start > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{input.substring(lastIndex, error.start)}</span>
        );
      }
      parts.push(
        <span
          key={`error-${idx}`}
          className="relative inline-block"
        >
          <span className="border-b-2 border-red-500 border-dotted">
            {input.substring(error.start, error.end)}
          </span>
          <span className="absolute -bottom-6 left-0 text-xs text-red-400 whitespace-nowrap">
            {error.message}
          </span>
        </span>
      );
      lastIndex = error.end;
    });

    if (lastIndex < input.length) {
      parts.push(
        <span key="text-end">{input.substring(lastIndex)}</span>
      );
    }

    return <div className="whitespace-pre-wrap">{parts}</div>;
  };

  const renderSuggestionText = (suggestion: Suggestion) => {
    if (suggestion.type !== 'grammar' || !suggestion.changes) {
      return <span>{suggestion.text}</span>;
    }

    const parts: JSX.Element[] = [];
    let lastIndex = 0;
    const text = suggestion.text;

    suggestion.changes.forEach((change, idx) => {
      const position = text.toLowerCase().indexOf(change.corrected.toLowerCase(), lastIndex);
      if (position > lastIndex) {
        parts.push(
          <span key={`text-${idx}`}>{text.substring(lastIndex, position)}</span>
        );
      }
      parts.push(
        <span key={`change-${idx}`} className="text-blue-400 font-medium">
          {text.substring(position, position + change.corrected.length)}
        </span>
      );
      lastIndex = position + change.corrected.length;
    });

    if (lastIndex < text.length) {
      parts.push(<span key="text-end">{text.substring(lastIndex)}</span>);
    }

    return <div>{parts}</div>;
  };

  return (
    <div className="w-full max-w-4xl mx-auto">
      <div className="glass-card rounded-3xl p-8 relative">
        {/* Header */}
        <div className="flex items-center gap-3 mb-6">
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <div>
            <h3 className="text-white font-semibold text-lg">Smart Translator</h3>
            <p className="text-white/60 text-sm">AI-powered writing assistant</p>
          </div>
          {isAnalyzing && (
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={{ opacity: 1, scale: 1 }}
              className="ml-auto flex items-center gap-2 text-purple-400 text-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>AI is analyzing...</span>
            </motion.div>
          )}
        </div>

        {/* Input Area */}
        <div className="relative">
          <div className="absolute inset-0 bg-white/5 rounded-2xl pointer-events-none" />
          <textarea
            ref={inputRef}
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Start typing to see AI suggestions..."
            className="w-full h-48 bg-transparent border-2 border-white/10 focus:border-purple-500/50 rounded-2xl p-6 text-white text-lg resize-none outline-none transition-colors relative z-10"
            style={{ caretColor: '#a78bfa' }}
          />
          
          {/* Grammar error overlay */}
          {grammarErrors.length > 0 && (
            <div className="absolute inset-0 p-6 text-lg pointer-events-none overflow-hidden rounded-2xl">
              <div className="opacity-0">{renderTextWithErrors()}</div>
            </div>
          )}
        </div>

        {/* Suggestions Dropdown */}
        <AnimatePresence>
          {suggestions.length > 0 && (
            <motion.div
              ref={suggestionsRef}
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              className="mt-4 space-y-2"
            >
              <div className="flex items-center gap-2 text-white/60 text-xs mb-2">
                <Zap className="w-3 h-3" />
                <span>AI Suggestions</span>
                <span className="text-white/40">
                  (↑↓ to navigate, Ctrl+Enter to accept, Esc to dismiss)
                </span>
              </div>

              {suggestions.map((suggestion, index) => (
                <motion.div
                  key={suggestion.id}
                  initial={{ opacity: 0, x: -10 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.05 }}
                  onClick={() => acceptSuggestion(suggestion)}
                  onMouseEnter={() => setSelectedIndex(index)}
                  className={`
                    glass-card rounded-xl p-4 cursor-pointer transition-all
                    ${selectedIndex === index 
                      ? 'ring-2 ring-purple-500 bg-purple-500/10' 
                      : 'hover:bg-white/5'
                    }
                  `}
                >
                  <div className="flex items-start gap-3">
                    <div className={`
                      w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0
                      ${suggestion.type === 'grammar' 
                        ? 'bg-red-500/20 text-red-400' 
                        : suggestion.type === 'autocomplete'
                        ? 'bg-blue-500/20 text-blue-400'
                        : 'bg-green-500/20 text-green-400'
                      }
                    `}>
                      {suggestion.type === 'grammar' ? (
                        <CheckCircle2 className="w-4 h-4" />
                      ) : suggestion.type === 'autocomplete' ? (
                        <ArrowRight className="w-4 h-4" />
                      ) : (
                        <Sparkles className="w-4 h-4" />
                      )}
                    </div>
                    
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2 mb-1">
                        <span className={`
                          text-xs font-medium px-2 py-0.5 rounded-full
                          ${suggestion.type === 'grammar'
                            ? 'bg-red-500/20 text-red-400'
                            : suggestion.type === 'autocomplete'
                            ? 'bg-blue-500/20 text-blue-400'
                            : 'bg-green-500/20 text-green-400'
                          }
                        `}>
                          {suggestion.type === 'grammar' 
                            ? 'Grammar' 
                            : suggestion.type === 'autocomplete'
                            ? 'Autocomplete'
                            : 'Alternative'
                          }
                        </span>
                      </div>
                      <div className="text-white text-sm leading-relaxed">
                        {renderSuggestionText(suggestion)}
                      </div>
                    </div>

                    <ArrowRight className={`
                      w-5 h-5 flex-shrink-0 transition-transform
                      ${selectedIndex === index ? 'translate-x-1 text-purple-400' : 'text-white/40'}
                    `} />
                  </div>
                </motion.div>
              ))}
            </motion.div>
          )}
        </AnimatePresence>

        {/* Helper Text */}
        <div className="mt-4 text-white/40 text-xs text-center">
          Type in English to see smart suggestions and grammar corrections
        </div>
      </div>
    </div>
  );
}
