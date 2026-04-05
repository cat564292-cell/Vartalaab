import { useEffect, useRef, useState } from 'react';
import { motion } from 'motion/react';

export const CLOUDFRONT_VIDEO =
  'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260217_030345_246c0224-10a4-422c-b324-070b7c0eceda.mp4';

export function BackgroundVideo() {
  const videoRef = useRef<HTMLVideoElement>(null);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    const v = videoRef.current;
    if (!v) return;
    v.playbackRate = 0.68; // cinematic slow-motion
    v.play().catch(() => {});
  }, []);

  if (failed) {
    return (
      <div className="absolute inset-0 z-0 bg-gradient-to-br from-slate-900 via-blue-950 to-indigo-950" aria-hidden />
    );
  }

  return (
    <div className="absolute inset-0 z-0 overflow-hidden pointer-events-none" aria-hidden>
      {/* Ken-Burns 3-D cinematic drift */}
      <motion.div
        className="absolute inset-0"
        style={{ transformStyle: 'preserve-3d', perspective: 1600 }}
        animate={{
          scale: [1.08, 1.15, 1.08],
          rotateX: [0, 1.5, 0],
          rotateY: [0, -1.2, 0],
          x: ['-1.5%', '1.5%', '-1.5%'],
          y: ['0%', '-0.8%', '0%'],
        }}
        transition={{ duration: 52, repeat: Infinity, ease: 'easeInOut' }}
      >
        <video
          ref={videoRef}
          src={CLOUDFRONT_VIDEO}
          autoPlay
          loop
          muted
          playsInline
          onError={() => setFailed(true)}
          style={{
            position: 'absolute',
            inset: 0,
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: 'center center',
            // Extra HD 4K cinematic look
            filter: 'brightness(0.28) contrast(1.22) saturate(1.18)',
            imageRendering: 'high-quality',
          } as React.CSSProperties}
        />
      </motion.div>

      {/* Cinematic vignette */}
      <div
        className="absolute inset-0 z-[1] pointer-events-none"
        style={{
          background:
            'radial-gradient(ellipse 80% 80% at 50% 50%, transparent 35%, rgba(0,0,0,0.78) 100%)',
        }}
      />
      {/* Bottom fade to page bg */}
      <div
        className="absolute inset-x-0 bottom-0 z-[2] h-48 pointer-events-none"
        style={{ background: 'linear-gradient(to top, #020617 0%, transparent 100%)' }}
      />
    </div>
  );
}
