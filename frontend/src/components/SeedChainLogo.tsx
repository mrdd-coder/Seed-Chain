import React from 'react';

interface SeedChainLogoProps {
  size?: number;
  className?: string;
}

export default function SeedChainLogo({ size = 32, className = '' }: SeedChainLogoProps) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 64 64"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
    >
      <defs>
        <linearGradient id="sc-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#4f46e5" />
          <stop offset="50%" stopColor="#7c3aed" />
          <stop offset="100%" stopColor="#6d28d9" />
        </linearGradient>
        <linearGradient id="sc-glow" x1="32" y1="0" x2="32" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="white" stopOpacity="0.15" />
          <stop offset="100%" stopColor="white" stopOpacity="0" />
        </linearGradient>
        <linearGradient id="sc-leaf" x1="20" y1="8" x2="44" y2="36" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
        <linearGradient id="sc-chain" x1="10" y1="44" x2="54" y2="44" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#818cf8" stopOpacity="0.6" />
          <stop offset="50%" stopColor="#c4b5fd" />
          <stop offset="100%" stopColor="#818cf8" stopOpacity="0.6" />
        </linearGradient>
      </defs>

      {/* Background — rounded hex-ish square */}
      <rect x="0" y="0" width="64" height="64" rx="16" fill="url(#sc-bg)" />
      <rect x="0" y="0" width="64" height="64" rx="16" fill="url(#sc-glow)" />

      {/* ── SEED ELEMENT ── */}
      {/* Seed body — teardrop / almond shape */}
      <path
        d="M32 42 C28 40 24 36 24 30 C24 24 28 20 32 18 C36 20 40 24 40 30 C40 36 36 40 32 42Z"
        fill="white"
        opacity="0.95"
      />
      {/* Inner seed vein */}
      <path
        d="M32 20 L32 40"
        stroke="url(#sc-bg)"
        strokeWidth="1.2"
        strokeLinecap="round"
        opacity="0.4"
      />
      <path
        d="M32 26 L27 30"
        stroke="url(#sc-bg)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />
      <path
        d="M32 30 L37 34"
        stroke="url(#sc-bg)"
        strokeWidth="1"
        strokeLinecap="round"
        opacity="0.3"
      />

      {/* Sprout leaves emerging from top of seed */}
      <path
        d="M32 18 C30 14 24 10 20 9 C22 14 27 16 32 18"
        fill="url(#sc-leaf)"
        opacity="0.95"
      />
      <path
        d="M32 18 C34 14 40 10 44 9 C42 14 37 16 32 18"
        fill="url(#sc-leaf)"
        opacity="0.85"
      />

      {/* ── CHAIN LINKS ── */}
      {/* Left chain link — rounded rectangle outline */}
      <rect
        x="6" y="39" width="14" height="10" rx="5"
        fill="none"
        stroke="url(#sc-chain)"
        strokeWidth="2.2"
      />
      {/* Right chain link — rounded rectangle outline */}
      <rect
        x="44" y="39" width="14" height="10" rx="5"
        fill="none"
        stroke="url(#sc-chain)"
        strokeWidth="2.2"
      />
      {/* Center connecting bars into seed */}
      <line x1="20" y1="44" x2="26" y2="44" stroke="url(#sc-chain)" strokeWidth="2.2" strokeLinecap="round" />
      <line x1="38" y1="44" x2="44" y2="44" stroke="url(#sc-chain)" strokeWidth="2.2" strokeLinecap="round" />

      {/* Small node dots at chain ends */}
      <circle cx="9" cy="44" r="1.5" fill="#c4b5fd" opacity="0.8" />
      <circle cx="55" cy="44" r="1.5" fill="#c4b5fd" opacity="0.8" />
    </svg>
  );
}
