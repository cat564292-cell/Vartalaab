import { Outlet, Link, useLocation } from 'react-router';
import { motion, AnimatePresence } from 'motion/react';
import { MessageSquare, History, Home, Globe, Languages, Sparkles, Zap, Brain } from 'lucide-react';
import { Toaster } from '../components/ui/sonner';

const CLOUDFRONT_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4';

/** Clean, precise translator logo SVG */
function LogoSVG() {
  return (
    <svg viewBox="0 0 56 56" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full" aria-label="VarTalaab">
      {/* Gradient defs */}
      <defs>
        <linearGradient id="lg1" x1="0" y1="0" x2="56" y2="56" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#3b82f6" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="lg2" x1="0" y1="0" x2="56" y2="0" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#06b6d4" />
          <stop offset="100%" stopColor="#3b82f6" />
        </linearGradient>
      </defs>
      {/* Background circle */}
      <circle cx="28" cy="28" r="26" fill="url(#lg1)" />
      {/* Globe lines */}
      <circle cx="28" cy="28" r="14" stroke="white" strokeWidth="1.8" fill="none" opacity="0.9" />
      <ellipse cx="28" cy="28" rx="7" ry="14" stroke="white" strokeWidth="1.4" fill="none" opacity="0.7" />
      <line x1="14" y1="28" x2="42" y2="28" stroke="white" strokeWidth="1.4" opacity="0.7" />
      <line x1="16" y1="22" x2="40" y2="22" stroke="white" strokeWidth="1.2" opacity="0.5" />
      <line x1="16" y1="34" x2="40" y2="34" stroke="white" strokeWidth="1.2" opacity="0.5" />
      {/* Translate arrows */}
      <path d="M20 10 L14 16 L20 16" stroke="#fbbf24" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M36 46 L42 40 L36 40" stroke="#34d399" strokeWidth="2" fill="none" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 16 Q28 8 42 40" stroke="url(#lg2)" strokeWidth="1.8" fill="none" strokeLinecap="round" opacity="0.85" />
    </svg>
  );
}

function FloatingIcon({
  icon: Icon, color, size, top, left, delay, duration = 7,
}: {
  icon: React.ElementType; color: string; size: number;
  top: string; left: string; delay: number; duration?: number;
}) {
  return (
    <motion.div
      className="absolute pointer-events-none"
      style={{ top, left, zIndex: 1 }}
      animate={{
        opacity: [0.3, 0.6, 0.3],
        y: [0, -20, 0],
        rotateY: [0, 20, -20, 0],
        rotateZ: [0, 5, -5, 0],
      }}
      transition={{ duration, repeat: Infinity, delay, ease: 'easeInOut' }}
    >
      <div
        className="rounded-2xl flex items-center justify-center shadow-2xl"
        style={{
          width: size, height: size,
          background: `radial-gradient(circle at 30% 30%, ${color}55, ${color}22)`,
          border: `1.5px solid ${color}44`,
          backdropFilter: 'blur(8px)',
          transform: 'perspective(400px) rotateX(12deg)',
        }}
      >
        <Icon style={{ width: size * 0.48, height: size * 0.48, color }} />
      </div>
    </motion.div>
  );
}

export function RootLayout() {
  const location = useLocation();

  const navItems = [
    { path: '/', icon: Home, label: 'Home' },
    { path: '/ai-assistant', icon: MessageSquare, label: 'AI Assistant' },
    { path: '/history', icon: History, label: 'History' },
  ];

  return (
    <div className="min-h-screen bg-slate-950 overflow-x-hidden relative">
      <Toaster position="top-center" richColors />

      {/* ── Fullscreen CloudFront video background ── */}
      <div className="fixed inset-0 z-0 overflow-hidden pointer-events-none">
        <motion.div
          className="absolute inset-0"
          animate={{
            scale: [1.06, 1.12, 1.06],
            x: ['-1%', '1%', '-1%'],
            y: ['0%', '-0.5%', '0%'],
          }}
          transition={{ duration: 48, repeat: Infinity, ease: 'easeInOut' }}
        >
          <video
            autoPlay loop muted playsInline
            style={{
              position: 'absolute', inset: 0,
              width: '100%', height: '100%',
              objectFit: 'cover', objectPosition: 'center',
              filter: 'brightness(0.52) contrast(1.25) saturate(1.4)',
              imageRendering: 'high-quality',
              transform: 'scale(1.001)',
            } as React.CSSProperties}
          >
            <source src={CLOUDFRONT_VIDEO} type="video/mp4" />
          </video>
        </motion.div>
        {/* Vignette + cinematic letterbox */}
        <div className="absolute inset-0 z-[1]" style={{
          background: 'radial-gradient(ellipse 85% 75% at 50% 50%, transparent 30%, rgba(0,0,0,0.72) 100%)'
        }} />
        {/* Top & bottom cinematic bars */}
        <div className="absolute inset-x-0 top-0 z-[2] h-16 pointer-events-none" style={{ background: 'linear-gradient(to bottom, rgba(0,0,0,0.55) 0%, transparent 100%)' }} />
        <div className="absolute inset-x-0 bottom-0 z-[2] h-24 pointer-events-none" style={{ background: 'linear-gradient(to top, rgba(2,6,23,0.9) 0%, transparent 100%)' }} />
        {/* Subtle blue-purple cinematic tint overlay */}
        <div className="absolute inset-0 z-[1] pointer-events-none" style={{ background: 'linear-gradient(135deg, rgba(59,130,246,0.06) 0%, rgba(139,92,246,0.08) 50%, rgba(236,72,153,0.04) 100%)' }} />
      </div>

      {/* ── Ambient colour orbs ── */}
      <div className="fixed inset-0 z-[1] pointer-events-none overflow-hidden">
        <motion.div
          animate={{ y: [0, -24, 0], opacity: [0.15, 0.28, 0.15] }}
          transition={{ duration: 14, repeat: Infinity, ease: 'easeInOut' }}
          className="absolute top-16 left-[8%] w-80 h-80 bg-blue-500/20 rounded-full blur-[80px]"
        />
        <motion.div
          animate={{ y: [0, 28, 0], opacity: [0.12, 0.24, 0.12] }}
          transition={{ duration: 18, repeat: Infinity, ease: 'easeInOut', delay: 1 }}
          className="absolute bottom-20 right-[6%] w-80 h-80 bg-purple-500/20 rounded-full blur-[80px]"
        />
      </div>

      {/* ── 3D floating icons ── */}
      <div className="fixed inset-0 z-[2] pointer-events-none hidden lg:block">
        <FloatingIcon icon={Globe}         color="#38bdf8" size={52} top="18%"  left="3%"  delay={0}   duration={8} />
        <FloatingIcon icon={Languages}     color="#a78bfa" size={44} top="55%"  left="2%"  delay={1.5} duration={9} />
        <FloatingIcon icon={Sparkles}      color="#fbbf24" size={40} top="78%"  left="5%"  delay={3}   duration={7} />
        <FloatingIcon icon={Brain}         color="#34d399" size={48} top="22%"  left="93%" delay={0.8} duration={10} />
        <FloatingIcon icon={Zap}           color="#f472b6" size={38} top="62%"  left="94%" delay={2.2} duration={8} />
        <FloatingIcon icon={MessageSquare} color="#60a5fa" size={42} top="85%"  left="90%" delay={4}   duration={9} />
      </div>

      {/* ── Header ── */}
      <motion.header
        initial={{ y: -100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ duration: 0.8, ease: 'easeOut' }}
        className="relative z-20 liquid-glass border-b border-white/10"
      >
        <div className="container mx-auto px-4 sm:px-6 py-4 max-w-7xl">
          <div className="flex items-center justify-between">
            <Link to="/">
              <motion.div
                className="flex items-center gap-3 cursor-pointer"
                whileHover={{ scale: 1.03 }}
                transition={{ type: 'spring', stiffness: 300 }}
              >
                <motion.div
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shadow-lg shadow-blue-500/40 ring-2 ring-blue-400/30 shrink-0 overflow-hidden"
                  whileHover={{ rotateY: 18, rotateX: -12, scale: 1.1 }}
                  animate={{ rotateZ: [0, -1, 1, 0], boxShadow: ['0 0 16px #3b82f655', '0 0 32px #8b5cf655', '0 0 16px #3b82f655'] }}
                  transition={{ duration: 5, repeat: Infinity, ease: 'easeInOut' }}
                  style={{ transformStyle: 'preserve-3d', perspective: 600 }}
                >
                  <LogoSVG />
                </motion.div>
                <div>
                  <motion.h1
                    className="text-2xl sm:text-3xl font-normal tracking-tight"
                    style={{ fontFamily: "'Instrument Serif', serif" }}
                    animate={{ backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'] }}
                    transition={{ duration: 6, repeat: Infinity, ease: 'linear' }}
                  >
                    <span style={{
                      background: 'linear-gradient(90deg, #fff 0%, #93c5fd 40%, #c4b5fd 70%, #fff 100%)',
                      backgroundSize: '200% auto',
                      WebkitBackgroundClip: 'text',
                      WebkitTextFillColor: 'transparent',
                      backgroundClip: 'text',
                    }}>VarTalaab</span><sup className="text-xs" style={{ WebkitTextFillColor: 'white', color: 'white' }}>®</sup>
                  </motion.h1>
                  <p className="text-xs text-white/55">Where words transcend borders</p>
                </div>
              </motion.div>
            </Link>

            <nav className="flex items-center gap-2">
              {navItems.map((item) => {
                const isActive = location.pathname === item.path;
                const Icon = item.icon;
                return (
                  <Link key={item.path} to={item.path}>
                    <motion.button
                      whileHover={{ scale: 1.06, y: -2 }}
                      whileTap={{ scale: 0.94 }}
                      className={`px-3 sm:px-4 py-2 rounded-full flex items-center gap-2 transition-all text-sm font-medium
                        ${isActive
                          ? 'bg-gradient-to-r from-blue-500 to-purple-500 text-white shadow-lg shadow-blue-500/25'
                          : 'liquid-glass text-white/75 hover:text-white hover:bg-white/10'
                        }`}
                    >
                      <Icon className="w-4 h-4" />
                      <span className="hidden sm:inline">{item.label}</span>
                    </motion.button>
                  </Link>
                );
              })}
            </nav>
          </div>
        </div>
      </motion.header>

      {/* ── Page content ── */}
      <main className="relative z-10">
        <AnimatePresence mode="wait">
          <motion.div
            key={location.pathname}
            initial={{ opacity: 0, y: 18 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -18 }}
            transition={{ duration: 0.38, ease: 'easeOut' }}
          >
            <Outlet />
          </motion.div>
        </AnimatePresence>
      </main>

      {/* ── Footer ── */}
      <motion.footer
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 1.2 }}
        className="relative z-10 text-center py-6 text-white/35 text-xs"
      >
        <p>VarTalaab<sup>®</sup> — Translating the world, one word at a time</p>
      </motion.footer>
    </div>
  );
}
