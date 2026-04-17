import { useState, useEffect, useRef } from 'react';
import { motion, useScroll, useTransform, useSpring } from 'motion/react';
import { 
  History as HistoryIcon,
  Trash2,
  Search,
  Calendar,
  Clock,
  RefreshCw,
  Download,
  Filter,
  ChevronDown,
  Sparkles,
  Globe2
} from 'lucide-react';
import { Button } from '../components/ui/button';
import { Input } from '../components/ui/input';
import { toast } from 'sonner';

interface Translation {
  id: string;
  source: string;
  translation: string;
  sourceLang: string;
  targetLang: string;
  timestamp: Date;
}

const languages = [
  { code: 'auto', name: 'Auto Detect', flag: '🌐' },
  { code: 'en', name: 'English', flag: '🇬🇧' },
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
  { code: 'hi', name: 'Hindi', flag: '🇮🇳' },
  { code: 'bn', name: 'Bengali', flag: '🇧🇩' },
  { code: 'tr', name: 'Turkish', flag: '🇹🇷' },
];

// 3D Floating Scroll Component
function FloatingScroll({ delay = 0 }: { delay?: number }) {
  return (
    <motion.div
      initial={{ opacity: 0, scale: 0, rotate: -180 }}
      animate={{ 
        opacity: [0.3, 0.6, 0.3], 
        scale: [1, 1.2, 1],
        rotate: [0, 360],
        y: [0, -30, 0]
      }}
      transition={{
        duration: 8,
        repeat: Infinity,
        delay,
        ease: "easeInOut"
      }}
      className="absolute pointer-events-none"
    >
      <div className="relative">
        <div className="w-32 h-40 rounded-lg bg-gradient-to-br from-amber-400/20 to-orange-500/20 backdrop-blur-sm border-2 border-amber-400/30 shadow-xl">
          <div className="absolute inset-0 flex items-center justify-center">
            <HistoryIcon className="w-16 h-16 text-amber-400/50" />
          </div>
          {/* Decorative lines like ancient scroll */}
          <div className="absolute inset-4 flex flex-col gap-2 justify-center">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-0.5 bg-amber-400/20 rounded" />
            ))}
          </div>
        </div>
      </div>
    </motion.div>
  );
}

// 3D Card Component with Scroll Animation
function HistoryCard3D({ item, index, onRestore }: { item: Translation; index: number; onRestore: (item: Translation) => void }) {
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], [50, -50]);
  const opacity = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0, 1, 1, 0]);
  const rotateX = useTransform(scrollYProgress, [0, 0.5, 1], [10, 0, -10]);
  const scale = useTransform(scrollYProgress, [0, 0.2, 0.8, 1], [0.9, 1, 1, 0.9]);

  const sourceLangInfo = languages.find(l => l.code === item.sourceLang);
  const targetLangInfo = languages.find(l => l.code === item.targetLang);

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
      whileHover={{ 
        scale: 1.03,
        rotateY: 5,
        z: 50,
        transition: { duration: 0.3 }
      }}
      className="glass-card rounded-2xl p-6 cursor-pointer relative overflow-hidden group"
      onClick={() => onRestore(item)}
    >
      {/* Animated background gradient on hover */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-blue-500/10 to-purple-500/10 opacity-0 group-hover:opacity-100 transition-opacity"
      />

      <div className="relative z-10">
        {/* Header */}
        <div className="flex items-start justify-between mb-4">
          <div className="flex items-center gap-3">
            <motion.div
              whileHover={{ rotate: 360 }}
              transition={{ duration: 0.5 }}
              className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-500/20 to-purple-500/20 flex items-center justify-center"
            >
              <Globe2 className="w-5 h-5 text-blue-400" />
            </motion.div>
            <div>
              <div className="flex items-center gap-2 text-sm text-white/60">
                <span>{sourceLangInfo?.flag || '🌐'} {sourceLangInfo?.name || 'Unknown'}</span>
                <motion.div
                  animate={{ x: [0, 5, 0] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                >
                  →
                </motion.div>
                <span>{targetLangInfo?.flag || '🌐'} {targetLangInfo?.name || 'Unknown'}</span>
              </div>
            </div>
          </div>
          
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Clock className="w-3 h-3" />
            <span>{new Date(item.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
          </div>
        </div>

        {/* Content */}
        <div className="space-y-3">
          <div>
            <p className="text-white/80 text-sm font-medium mb-1">Original:</p>
            <p className="text-white text-base leading-relaxed line-clamp-2">{item.source}</p>
          </div>
          
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            transition={{ delay: index * 0.05 }}
            className="border-t border-white/10 pt-3"
          >
            <p className="text-white/80 text-sm font-medium mb-1">Translation:</p>
            <p className="text-blue-300 text-base leading-relaxed line-clamp-2">{item.translation}</p>
          </motion.div>
        </div>

        {/* Footer */}
        <div className="flex items-center justify-between mt-4 pt-4 border-t border-white/10">
          <div className="flex items-center gap-2 text-xs text-white/40">
            <Calendar className="w-3 h-3" />
            <span>{new Date(item.timestamp).toLocaleDateString()}</span>
          </div>
          
          <motion.div 
            className="opacity-0 group-hover:opacity-100 transition-opacity"
            whileHover={{ scale: 1.1 }}
          >
            <Button
              size="sm"
              variant="ghost"
              className="text-blue-400 hover:text-blue-300 hover:bg-blue-500/10 rounded-xl"
            >
              <RefreshCw className="w-3 h-3 mr-1" />
              Restore
            </Button>
          </motion.div>
        </div>
      </div>

      {/* Decorative corner sparkle */}
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          rotate: [0, 180, 360],
          opacity: [0.3, 0.6, 0.3]
        }}
        transition={{ duration: 3, repeat: Infinity }}
        className="absolute top-2 right-2 w-2 h-2 bg-yellow-400 rounded-full"
      />
    </motion.div>
  );
}

export function HistoryPage() {
  const [history, setHistory] = useState<Translation[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [filterLang, setFilterLang] = useState<string>('all');
  const [sortBy, setSortBy] = useState<'newest' | 'oldest'>('newest');

  // Load history from localStorage
  useEffect(() => {
    const savedHistory = localStorage.getItem('translation-history');
    if (savedHistory) {
      try {
        const parsed = JSON.parse(savedHistory);
        setHistory(parsed.map((item: any) => ({
          ...item,
          timestamp: new Date(item.timestamp)
        })));
      } catch (error) {
        console.error('Failed to load history:', error);
      }
    }
  }, []);

  const clearHistory = () => {
    setHistory([]);
    localStorage.removeItem('translation-history');
    toast.success('History cleared successfully!');
  };

  const exportHistory = () => {
    const dataStr = JSON.stringify(history, null, 2);
    const dataBlob = new Blob([dataStr], { type: 'application/json' });
    const url = URL.createObjectURL(dataBlob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `translation-history-${new Date().toISOString().split('T')[0]}.json`;
    link.click();
    toast.success('History exported successfully!');
  };

  const restoreTranslation = (item: Translation) => {
    toast.success('Translation restored! Navigate to Home to view.');
    sessionStorage.setItem('restored-translation', JSON.stringify(item));
    // Also copy to clipboard for convenience
    navigator.clipboard.writeText(item.translation).catch(() => {});
  };

  // Filter and search
  const filteredHistory = history.filter(item => {
    const matchesSearch = 
      item.source.toLowerCase().includes(searchQuery.toLowerCase()) ||
      item.translation.toLowerCase().includes(searchQuery.toLowerCase());
    
    const matchesLang = filterLang === 'all' || 
      item.sourceLang === filterLang || 
      item.targetLang === filterLang;
    
    return matchesSearch && matchesLang;
  });

  // Sort
  const sortedHistory = [...filteredHistory].sort((a, b) => {
    if (sortBy === 'newest') {
      return new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime();
    } else {
      return new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime();
    }
  });

  return (
    <div className="container mx-auto px-4 py-8 max-w-7xl relative">
      {/* Floating Scrolls Background */}
      <div className="hidden lg:block">
        <div className="fixed top-20 left-10 z-0">
          <FloatingScroll delay={0} />
        </div>
        <div className="fixed top-40 right-20 z-0">
          <FloatingScroll delay={1.5} />
        </div>
        <div className="fixed bottom-20 left-1/4 z-0">
          <FloatingScroll delay={3} />
        </div>
        <div className="fixed bottom-32 right-1/4 z-0">
          <FloatingScroll delay={4.5} />
        </div>
      </div>

      {/* Hero Section */}
      <motion.div
        initial={{ opacity: 0, y: 50, rotateX: 20 }}
        animate={{ opacity: 1, y: 0, rotateX: 0 }}
        transition={{ duration: 1, type: "spring" }}
        style={{ transformStyle: 'preserve-3d' }}
        className="text-center mb-12 relative z-10"
      >
        <motion.div
          animate={{
            y: [0, -15, 0],
            rotateZ: [0, 5, -5, 0]
          }}
          transition={{ duration: 5, repeat: Infinity }}
          className="inline-block mb-6"
        >
          <div className="w-32 h-32 rounded-3xl bg-gradient-to-br from-amber-500 via-orange-500 to-red-500 flex items-center justify-center shadow-2xl">
            <HistoryIcon className="w-16 h-16 text-white" />
          </div>
        </motion.div>

        <h1 
          className="text-5xl md:text-7xl font-normal text-white mb-4"
          style={{ fontFamily: "'Instrument Serif', serif" }}
        >
          Translation <em className="not-italic text-amber-400">History</em>
        </h1>
        <p className="text-white/70 text-lg max-w-2xl mx-auto">
          Access and restore your past translations with a single click
        </p>
      </motion.div>

      {/* Controls Bar */}
      <motion.div
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.3 }}
        className="glass-card rounded-3xl p-6 mb-8 relative z-10"
      >
        <div className="flex flex-col md:flex-row gap-4 items-center justify-between">
          {/* Search */}
          <div className="relative flex-1 w-full md:max-w-md">
            <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-white/40" />
            <Input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search translations..."
              className="pl-12 bg-white/5 border-white/10 text-white placeholder:text-white/40 rounded-2xl h-12"
            />
          </div>

          {/* Filter & Sort */}
          <div className="flex gap-3 flex-wrap justify-center">
            <select
              value={filterLang}
              onChange={(e) => setFilterLang(e.target.value)}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
            >
              <option value="all">All Languages</option>
              {languages.map(lang => (
                <option key={lang.code} value={lang.code}>
                  {lang.flag} {lang.name}
                </option>
              ))}
            </select>

            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as 'newest' | 'oldest')}
              className="px-4 py-2 rounded-xl bg-white/5 border border-white/10 text-white text-sm hover:bg-white/10 transition-colors"
            >
              <option value="newest">Newest First</option>
              <option value="oldest">Oldest First</option>
            </select>

            <Button
              onClick={exportHistory}
              disabled={history.length === 0}
              variant="ghost"
              size="sm"
              className="liquid-glass hover:bg-white/10 text-white rounded-xl"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </Button>

            <Button
              onClick={clearHistory}
              disabled={history.length === 0}
              variant="ghost"
              size="sm"
              className="liquid-glass hover:bg-red-500/10 text-red-400 hover:text-red-300 rounded-xl"
            >
              <Trash2 className="w-4 h-4 mr-2" />
              Clear All
            </Button>
          </div>
        </div>

        {/* Stats */}
        <div className="flex items-center justify-center gap-8 mt-6 pt-6 border-t border-white/10">
          <div className="text-center">
            <motion.div 
              className="text-3xl font-bold text-white mb-1"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
            >
              {history.length}
            </motion.div>
            <div className="text-white/60 text-sm">Total Translations</div>
          </div>
          <div className="text-center">
            <motion.div 
              className="text-3xl font-bold text-white mb-1"
              animate={{ scale: [1, 1.1, 1] }}
              transition={{ duration: 2, repeat: Infinity, delay: 0.5 }}
            >
              {sortedHistory.length}
            </motion.div>
            <div className="text-white/60 text-sm">Filtered Results</div>
          </div>
        </div>
      </motion.div>

      {/* History Grid */}
      <div className="relative z-10">
        {sortedHistory.length === 0 ? (
          <motion.div
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            className="glass-card rounded-3xl p-12 text-center"
          >
            <motion.div
              animate={{
                y: [0, -20, 0],
                rotate: [0, 10, -10, 0]
              }}
              transition={{ duration: 4, repeat: Infinity }}
              className="w-32 h-32 mx-auto mb-6 rounded-full bg-gradient-to-br from-gray-500/20 to-gray-600/20 flex items-center justify-center"
            >
              <HistoryIcon className="w-16 h-16 text-white/30" />
            </motion.div>
            <h3 className="text-2xl text-white font-medium mb-2">No History Found</h3>
            <p className="text-white/60">
              {searchQuery || filterLang !== 'all' 
                ? 'Try adjusting your filters or search query'
                : 'Start translating on the Home page to build your history. Every translation is automatically saved here.'}
            </p>
          </motion.div>
        ) : (
          <div className="grid md:grid-cols-2 gap-6">
            {sortedHistory.map((item, index) => (
              <HistoryCard3D
                key={item.id}
                item={item}
                index={index}
                onRestore={restoreTranslation}
              />
            ))}
          </div>
        )}
      </div>

      {/* Decorative Elements */}
      <motion.div
        animate={{
          rotate: 360,
          scale: [1, 1.2, 1]
        }}
        transition={{ duration: 20, repeat: Infinity }}
        className="fixed bottom-10 right-10 w-20 h-20 rounded-full bg-gradient-to-br from-purple-500/10 to-pink-500/10 blur-2xl z-0"
      />
    </div>
  );
}
