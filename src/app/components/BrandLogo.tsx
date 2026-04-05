import { motion } from 'motion/react';

export function BrandLogo({ className = '' }: { className?: string }) {
  return (
    <motion.div
      style={{ transformStyle: 'preserve-3d', perspective: 600 }}
      whileHover={{ rotateY: 18, rotateX: -12, scale: 1.1 }}
      animate={{
        rotateZ: [0, -1, 1, 0],
        boxShadow: ['0 0 16px #3b82f655', '0 0 32px #8b5cf655', '0 0 16px #3b82f655'],
      }}
      transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
      className={`rounded-2xl overflow-hidden shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/30 shrink-0 ${className}`}
    >
      <div className="h-12 w-12 sm:h-14 sm:w-14">
        <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-label="VarTalaab translator logo">
          <defs>
            <linearGradient id="blg1" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#3b82f6" />
              <stop offset="100%" stopColor="#8b5cf6" />
            </linearGradient>
            <linearGradient id="blg2" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
              <stop offset="0%" stopColor="#06b6d4" />
              <stop offset="100%" stopColor="#3b82f6" />
            </linearGradient>
          </defs>
          <circle cx="28" cy="28" r="26" fill="url(#blg1)" />
          <circle cx="28" cy="28" r="14" stroke="white" strokeWidth="1.8" fill="none" opacity="0.9" />
          <ellipse cx="28" cy="28" rx="7" ry="14" stroke="white" strokeWidth="1.4" fill="none" opacity="0.7" />
          <line x1="14" y1="28" x2="42" y2="28" stroke="white" strokeWidth="1.4" opacity="0.7" />
          <line x1="16" y1="22" x2="40" y2="22" stroke="white" strokeWidth="1.2" opacity="0.5" />
          <line x1="16" y1="34" x2="40" y2="34" stroke="white" strokeWidth="1.2" opacity="0.5" />
          <path d="M20 10 L14 16 L20 16" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M36 46 L42 40 L36 40" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
          <path d="M14 16 Q28 8 42 40" stroke="url(#blg2)" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
        </svg>
      </div>
    </motion.div>
  );
}
