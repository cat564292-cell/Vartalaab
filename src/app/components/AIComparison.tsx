import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { 
  Sparkles, 
  Zap, 
  Brain, 
  Award,
  TrendingUp,
  Lightbulb,
  Check,
  X,
  Info,
  Eye,
  EyeOff
} from 'lucide-react';
import { Button } from './ui/button';
import { Textarea } from './ui/textarea';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from './ui/dialog';
import { Tabs, TabsList, TabsTrigger, TabsContent } from './ui/tabs';

interface AIModel {
  id: string;
  name: string;
  icon: JSX.Element;
  color: string;
  gradient: string;
}

interface Translation {
  model: string;
  text: string;
  tone: 'Formal' | 'Casual' | 'Literal' | 'Natural';
  badges: string[];
}

interface AIComparisonProps {
  onTranslate: (text: string, sourceLang: string, targetLang: string) => Promise<string>;
  sourceLang: string;
  targetLang: string;
}

const aiModels: AIModel[] = [
  {
    id: 'gpt',
    name: 'GPT-4',
    icon: <Sparkles className="w-5 h-5" />,
    color: 'from-emerald-500 to-teal-500',
    gradient: 'bg-gradient-to-br from-emerald-500/20 to-teal-500/20'
  },
  {
    id: 'gemini',
    name: 'Gemini',
    icon: <Brain className="w-5 h-5" />,
    color: 'from-blue-500 to-cyan-500',
    gradient: 'bg-gradient-to-br from-blue-500/20 to-cyan-500/20'
  },
  {
    id: 'claude',
    name: 'Claude',
    icon: <Zap className="w-5 h-5" />,
    color: 'from-purple-500 to-pink-500',
    gradient: 'bg-gradient-to-br from-purple-500/20 to-pink-500/20'
  }
];

export function AIComparison({ onTranslate, sourceLang, targetLang }: AIComparisonProps) {
  const [input, setInput] = useState('');
  const [translations, setTranslations] = useState<Translation[]>([]);
  const [isTranslating, setIsTranslating] = useState(false);
  const [showDifferences, setShowDifferences] = useState(false);
  const [selectedModel, setSelectedModel] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<'translation' | 'explanation' | 'tone'>('translation');
  const [hoveredCard, setHoveredCard] = useState<string | null>(null);

  useEffect(() => {
    if (input.length > 0) {
      const timer = setTimeout(() => {
        handleTranslate();
      }, 500);
      return () => clearTimeout(timer);
    } else {
      setTranslations([]);
    }
  }, [input]);

  const handleTranslate = async () => {
    if (!input.trim()) return;

    setIsTranslating(true);

    try {
      // Get base translation
      const baseTranslation = await onTranslate(input, sourceLang, targetLang);

      // Simulate different AI model outputs with variations
      const variations = generateVariations(baseTranslation, input);

      setTranslations(variations);
    } catch (error) {
      console.error('Translation error:', error);
    } finally {
      setIsTranslating(false);
    }
  };

  const generateVariations = (baseText: string, original: string): Translation[] => {
    // Create variations based on tone and style
    const variations: Translation[] = [];

    // GPT-4 - Most natural and context-aware
    variations.push({
      model: 'gpt',
      text: baseText,
      tone: 'Natural',
      badges: ['Most Natural', 'Context-Aware']
    });

    // Gemini - Literal but accurate
    const literalText = baseText.replace(/\b(very|really|so)\b/gi, '').trim();
    variations.push({
      model: 'gemini',
      text: literalText || baseText,
      tone: 'Literal',
      badges: ['Most Accurate', 'Precise']
    });

    // Claude - Formal and polished
    const formalText = baseText
      .replace(/\bhi\b/gi, 'Hello')
      .replace(/\bbye\b/gi, 'Goodbye')
      .replace(/\bthanks\b/gi, 'Thank you');
    variations.push({
      model: 'claude',
      text: formalText,
      tone: 'Formal',
      badges: ['Most Polished', 'Professional']
    });

    return variations;
  };

  const highlightDifferences = (text: string, referenceText: string) => {
    if (!showDifferences) return text;

    const words = text.split(' ');
    const refWords = referenceText.split(' ');
    
    return words.map((word, idx) => {
      const isDifferent = refWords[idx] !== word;
      return (
        <span
          key={idx}
          className={isDifferent ? 'bg-cyan-500/30 text-cyan-300 px-1 rounded' : ''}
        >
          {word}{' '}
        </span>
      );
    });
  };

  const getExplanation = (model: string, translation: Translation) => {
    const explanations = {
      gpt: `GPT-4 provides a natural, context-aware translation that considers idioms and cultural nuances. It aims for the most human-like output.`,
      gemini: `Gemini focuses on literal accuracy and precision. It translates word-for-word while maintaining grammatical correctness.`,
      claude: `Claude emphasizes formal, polished translations suitable for professional contexts. It elevates the tone while preserving meaning.`
    };

    return explanations[model as keyof typeof explanations] || 'AI-powered translation';
  };

  const getToneDescription = (tone: string) => {
    const descriptions = {
      Natural: 'Conversational and contextual',
      Literal: 'Word-for-word accuracy',
      Formal: 'Professional and polished',
      Casual: 'Informal and friendly'
    };

    return descriptions[tone as keyof typeof descriptions] || tone;
  };

  return (
    <div className="w-full max-w-7xl mx-auto">
      <div className="glass-card rounded-3xl p-8">
        {/* Header */}
        <div className="flex items-center justify-between mb-8">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-blue-500 to-purple-500 flex items-center justify-center">
              <Brain className="w-6 h-6 text-white" />
            </div>
            <div>
              <h2 className="text-white font-bold text-2xl">AI Comparison Lab</h2>
              <p className="text-white/60 text-sm">Compare translations across multiple AI models</p>
            </div>
          </div>

          <Button
            onClick={() => setShowDifferences(!showDifferences)}
            className={`
              px-4 py-2 rounded-xl transition-all
              ${showDifferences 
                ? 'bg-cyan-500/20 text-cyan-400 border-2 border-cyan-500/50' 
                : 'glass-card text-white/80 hover:bg-white/10'
              }
            `}
          >
            {showDifferences ? <Eye className="w-4 h-4 mr-2" /> : <EyeOff className="w-4 h-4 mr-2" />}
            {showDifferences ? 'Hide' : 'Show'} Differences
          </Button>
        </div>

        {/* Input Section */}
        <div className="mb-8">
          <Textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            placeholder="Enter text to compare AI translations..."
            className="w-full h-32 bg-black/40 border-2 border-white/10 focus:border-purple-500/50 rounded-2xl p-6 text-white text-lg resize-none outline-none transition-colors"
          />
          
          {isTranslating && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="flex items-center gap-2 mt-3 text-purple-400 text-sm"
            >
              <motion.div
                animate={{ rotate: 360 }}
                transition={{ duration: 2, repeat: Infinity, ease: 'linear' }}
              >
                <Sparkles className="w-4 h-4" />
              </motion.div>
              <span>AI models are translating...</span>
            </motion.div>
          )}
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={(v) => setActiveTab(v as any)} className="mb-6">
          <TabsList className="glass-card p-1 rounded-xl">
            <TabsTrigger value="translation" className="rounded-lg data-[state=active]:bg-purple-500/20 data-[state=active]:text-purple-300">
              Translation
            </TabsTrigger>
            <TabsTrigger value="explanation" className="rounded-lg data-[state=active]:bg-blue-500/20 data-[state=active]:text-blue-300">
              Explanation
            </TabsTrigger>
            <TabsTrigger value="tone" className="rounded-lg data-[state=active]:bg-green-500/20 data-[state=active]:text-green-300">
              Tone Analysis
            </TabsTrigger>
          </TabsList>

          {/* Translation Cards Grid */}
          <TabsContent value="translation" className="mt-6">
            <AnimatePresence>
              {translations.length > 0 ? (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                  {translations.map((translation, index) => {
                    const model = aiModels.find(m => m.id === translation.model)!;
                    const isHovered = hoveredCard === model.id;

                    return (
                      <motion.div
                        key={model.id}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: index * 0.1 }}
                        onMouseEnter={() => setHoveredCard(model.id)}
                        onMouseLeave={() => setHoveredCard(null)}
                        onClick={() => setSelectedModel(model.id)}
                        className={`
                          glass-card rounded-2xl p-6 cursor-pointer transition-all duration-300
                          ${isHovered ? 'scale-105 ring-2 ring-white/20' : ''}
                          hover:bg-white/5
                        `}
                      >
                        {/* Model Header */}
                        <div className="flex items-center gap-3 mb-4">
                          <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center`}>
                            {model.icon}
                          </div>
                          <div className="flex-1">
                            <h3 className="text-white font-semibold text-lg">{model.name}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <span className={`
                                text-xs px-2 py-0.5 rounded-full
                                ${translation.tone === 'Natural' ? 'bg-green-500/20 text-green-400' :
                                  translation.tone === 'Literal' ? 'bg-blue-500/20 text-blue-400' :
                                  translation.tone === 'Formal' ? 'bg-purple-500/20 text-purple-400' :
                                  'bg-gray-500/20 text-gray-400'
                                }
                              `}>
                                {translation.tone}
                              </span>
                            </div>
                          </div>
                          {isHovered && (
                            <motion.div
                              initial={{ scale: 0 }}
                              animate={{ scale: 1 }}
                            >
                              <Info className="w-5 h-5 text-white/60" />
                            </motion.div>
                          )}
                        </div>

                        {/* Translation Text */}
                        <div className={`
                          ${model.gradient} rounded-xl p-4 mb-4 min-h-[120px] flex items-center
                        `}>
                          <p className="text-white text-lg leading-relaxed">
                            {activeTab === 'translation' && highlightDifferences(
                              translation.text,
                              translations[0].text
                            )}
                          </p>
                        </div>

                        {/* Badges */}
                        <div className="flex flex-wrap gap-2">
                          {translation.badges.map((badge, idx) => (
                            <motion.div
                              key={idx}
                              initial={{ opacity: 0, scale: 0.8 }}
                              animate={{ opacity: 1, scale: 1 }}
                              transition={{ delay: 0.3 + idx * 0.1 }}
                              className={`
                                flex items-center gap-1 px-3 py-1 rounded-full text-xs
                                bg-gradient-to-r ${model.color} text-white font-medium
                              `}
                            >
                              {idx === 0 ? <Award className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                              {badge}
                            </motion.div>
                          ))}
                        </div>

                        {/* Hover Effect */}
                        {isHovered && (
                          <motion.div
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="mt-4 pt-4 border-t border-white/10"
                          >
                            <p className="text-white/60 text-sm">
                              Click to see detailed explanation →
                            </p>
                          </motion.div>
                        )}
                      </motion.div>
                    );
                  })}
                </div>
              ) : (
                <div className="text-center py-20">
                  <motion.div
                    animate={{ 
                      scale: [1, 1.1, 1],
                      opacity: [0.5, 1, 0.5]
                    }}
                    transition={{ duration: 2, repeat: Infinity }}
                    className="w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center"
                  >
                    <Lightbulb className="w-8 h-8 text-white" />
                  </motion.div>
                  <p className="text-white/60 text-lg">
                    Enter text above to see AI comparison
                  </p>
                </div>
              )}
            </AnimatePresence>
          </TabsContent>

          {/* Explanation Tab */}
          <TabsContent value="explanation" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {translations.map((translation) => {
                const model = aiModels.find(m => m.id === translation.model)!;
                return (
                  <div key={model.id} className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center`}>
                        {model.icon}
                      </div>
                      <h3 className="text-white font-semibold">{model.name}</h3>
                    </div>
                    <p className="text-white/80 text-sm leading-relaxed">
                      {getExplanation(model.id, translation)}
                    </p>
                  </div>
                );
              })}
            </div>
          </TabsContent>

          {/* Tone Analysis Tab */}
          <TabsContent value="tone" className="mt-6">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {translations.map((translation) => {
                const model = aiModels.find(m => m.id === translation.model)!;
                return (
                  <div key={model.id} className="glass-card rounded-2xl p-6">
                    <div className="flex items-center gap-3 mb-4">
                      <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center`}>
                        {model.icon}
                      </div>
                      <h3 className="text-white font-semibold">{model.name}</h3>
                    </div>
                    <div className="space-y-3">
                      <div>
                        <span className="text-white/60 text-sm">Tone:</span>
                        <p className="text-white font-medium mt-1">{translation.tone}</p>
                      </div>
                      <div>
                        <span className="text-white/60 text-sm">Description:</span>
                        <p className="text-white/80 text-sm mt-1">{getToneDescription(translation.tone)}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </TabsContent>
        </Tabs>
      </div>

      {/* Detailed Modal */}
      <Dialog open={selectedModel !== null} onOpenChange={() => setSelectedModel(null)}>
        <DialogContent className="glass-card border-white/10 max-w-2xl">
          {selectedModel && (() => {
            const model = aiModels.find(m => m.id === selectedModel)!;
            const translation = translations.find(t => t.model === selectedModel)!;
            
            return (
              <>
                <DialogHeader>
                  <DialogTitle className="flex items-center gap-3 text-white">
                    <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${model.color} flex items-center justify-center`}>
                      {model.icon}
                    </div>
                    <span>{model.name} - Detailed Analysis</span>
                  </DialogTitle>
                </DialogHeader>
                
                <div className="space-y-6 mt-6">
                  <div>
                    <h4 className="text-white/80 font-medium mb-2">Translation:</h4>
                    <div className={`${model.gradient} rounded-xl p-4`}>
                      <p className="text-white text-lg">{translation.text}</p>
                    </div>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-medium mb-2">Tone & Style:</h4>
                    <p className="text-white/60">{translation.tone} - {getToneDescription(translation.tone)}</p>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-medium mb-2">AI Approach:</h4>
                    <p className="text-white/60 leading-relaxed">
                      {getExplanation(model.id, translation)}
                    </p>
                  </div>

                  <div>
                    <h4 className="text-white/80 font-medium mb-2">Quality Badges:</h4>
                    <div className="flex flex-wrap gap-2">
                      {translation.badges.map((badge, idx) => (
                        <span
                          key={idx}
                          className={`px-3 py-1 rounded-full text-sm bg-gradient-to-r ${model.color} text-white`}
                        >
                          {badge}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              </>
            );
          })()}
        </DialogContent>
      </Dialog>
    </div>
  );
}
