import React from 'react';

interface PrensLogoProps {
  size?: 'sm' | 'md' | 'lg' | 'xl';
  showText?: boolean;
  animated?: boolean;
  className?: string;
}

export const PrensLogo: React.FC<PrensLogoProps> = ({
  size = 'md',
  showText = false,
  animated = false,
  className = '',
}) => {
  const sizeMap = {
    sm: 'w-7 h-7',
    md: 'w-10 h-10',
    lg: 'w-16 h-16',
    xl: 'w-24 h-24',
  };

  const textMap = {
    sm: 'text-base font-bold',
    md: 'text-xl font-bold',
    lg: 'text-3xl font-extrabold',
    xl: 'text-4xl font-extrabold',
  };

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className={`relative ${sizeMap[size]} flex items-center justify-center shrink-0`}>
        {/* Ambient glow behind logo */}
        <div
          className={`absolute inset-0 rounded-2xl bg-gradient-to-tr from-purple-600/40 via-violet-500/30 to-indigo-600/30 blur-md ${
            animated ? 'animate-pulse-slow' : ''
          }`}
        />

        {/* Outer glowing frame */}
        <div className="relative w-full h-full rounded-2xl bg-gradient-to-b from-purple-500/30 via-slate-900/90 to-purple-950/80 p-[1.5px] shadow-lg shadow-purple-950/40">
          <div className="w-full h-full rounded-[14px] bg-[#0A0B14] flex items-center justify-center overflow-hidden relative">
            {/* Subtle background mesh */}
            <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-purple-900/40 via-transparent to-transparent" />

            <svg
              viewBox="0 0 100 100"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className={`w-3/4 h-3/4 relative z-10 ${animated ? 'animate-float' : ''}`}
            >
              <defs>
                <linearGradient id="prens-grad-1" x1="10" y1="10" x2="90" y2="90" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#C084FC" />
                  <stop offset="50%" stopColor="#8B5CF6" />
                  <stop offset="100%" stopColor="#3B82F6" />
                </linearGradient>
                <linearGradient id="prens-grad-inner" x1="30" y1="30" x2="70" y2="70" gradientUnits="userSpaceOnUse">
                  <stop offset="0%" stopColor="#E9D5FF" />
                  <stop offset="100%" stopColor="#A855F7" />
                </linearGradient>
                <filter id="prens-glow" x="-20%" y="-20%" width="140%" height="140%">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feComposite in="SourceGraphic" in2="blur" operator="over" />
                </filter>
              </defs>

              {/* Geometric Outer Hex-Ring */}
              <path
                d="M50 12 L82 30 L82 70 L50 88 L18 70 L18 30 Z"
                stroke="url(#prens-grad-1)"
                strokeWidth="3.5"
                strokeLinecap="round"
                strokeLinejoin="round"
                className="opacity-90"
              />

              {/* Internal Neural Prism */}
              <path
                d="M50 24 L72 37 L72 63 L50 76 L28 63 L28 37 Z"
                stroke="url(#prens-grad-1)"
                strokeWidth="1.5"
                strokeDasharray="4 2"
                className="opacity-60"
              />

              {/* Connecting Quantum Rays */}
              <line x1="50" y1="12" x2="50" y2="35" stroke="url(#prens-grad-1)" strokeWidth="2" strokeLinecap="round" />
              <line x1="82" y1="70" x2="62" y2="58" stroke="url(#prens-grad-1)" strokeWidth="2" strokeLinecap="round" />
              <line x1="18" y1="70" x2="38" y2="58" stroke="url(#prens-grad-1)" strokeWidth="2" strokeLinecap="round" />

              {/* Central Glowing Core (Diamond/Star) */}
              <path
                d="M50 36 L59 50 L50 64 L41 50 Z"
                fill="url(#prens-grad-inner)"
                filter="url(#prens-glow)"
              />
              <circle cx="50" cy="50" r="3" fill="#FFFFFF" />
            </svg>
          </div>
        </div>
      </div>

      {showText && (
        <div className="flex flex-col">
          <span className={`tracking-wider font-display text-white ${textMap[size]} flex items-center gap-1.5`}>
            PRENS
            <span className="bg-gradient-to-r from-purple-400 to-violet-300 bg-clip-text text-transparent font-black">
              IA
            </span>
          </span>
          {size !== 'sm' && (
            <span className="text-[10px] tracking-widest text-purple-300/70 uppercase font-mono">
              Inteligencia Artificial
            </span>
          )}
        </div>
      )}
    </div>
  );
};
