import { motion, AnimatePresence } from 'motion/react';
import { Sparkles } from 'lucide-react';
import type { TranslateProvider } from '/utils/translateUnified';
import { providerDisplayName } from '/utils/translateUnified';

const providerAccent: Record<TranslateProvider, string> = {
  google: 'from-emerald-500/30 to-cyan-500/30 border-emerald-400/40 text-emerald-200',
  deepl: 'from-indigo-500/30 to-violet-500/30 border-indigo-400/40 text-indigo-200',
  supabase: 'from-blue-500/30 to-sky-500/30 border-blue-400/40 text-blue-200',
  mymemory: 'from-amber-500/25 to-orange-500/25 border-amber-400/35 text-amber-200',
};

export function TranslationEngineBadge({
  provider,
  className = '',
}: {
  provider: TranslateProvider | null;
  className?: string;
}) {
  return (
    <div className={`min-h-[2rem] flex items-center justify-end ${className}`}>
      <AnimatePresence mode="wait">
        {provider ? (
          <motion.div
            key={provider}
            initial={{ opacity: 0, rotateX: -78, y: 8, scale: 0.92 }}
            animate={{ opacity: 1, rotateX: 0, y: 0, scale: 1 }}
            exit={{ opacity: 0, rotateX: 78, y: -8, scale: 0.92 }}
            transition={{ type: 'spring', stiffness: 420, damping: 28 }}
            style={{ transformStyle: 'preserve-3d', perspective: 800 }}
            className={`
              inline-flex items-center gap-2 rounded-full border px-3 py-1.5 text-xs font-medium
              bg-gradient-to-r shadow-lg backdrop-blur-md
              ${providerAccent[provider]}
            `}
          >
            <motion.span
              animate={{ rotate: [0, 14, -10, 0] }}
              transition={{ duration: 3.5, repeat: Infinity, ease: 'easeInOut' }}
            >
              <Sparkles className="w-3.5 h-3.5 opacity-90" />
            </motion.span>
            {providerDisplayName(provider)}
          </motion.div>
        ) : null}
      </AnimatePresence>
    </div>
  );
}
