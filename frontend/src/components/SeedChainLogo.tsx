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
        <linearGradient id="seedchain-bg" x1="0" y1="0" x2="64" y2="64" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#6366f1" />
          <stop offset="100%" stopColor="#8b5cf6" />
        </linearGradient>
        <linearGradient id="seedchain-leaf" x1="24" y1="8" x2="44" y2="32" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#10b981" />
        </linearGradient>
        <linearGradient id="seedchain-stem" x1="32" y1="20" x2="32" y2="52" gradientUnits="userSpaceOnUse">
          <stop offset="0%" stopColor="#34d399" />
          <stop offset="100%" stopColor="#059669" />
        </linearGradient>
      </defs>

      {/* Rounded square background */}
      <rect x="0" y="0" width="64" height="64" rx="14" fill="url(#seedchain-bg)" />

      {/* Stem - grows upward from seed */}
      <path
        d="M32 50 C32 50 32 36 32 28"
        stroke="url(#seedchain-stem)"
        strokeWidth="3"
        strokeLinecap="round"
        fill="none"
      />

      {/* Left leaf */}
      <path
        d="M32 32 C28 28 18 26 16 20 C22 20 30 22 32 28"
        fill="url(#seedchain-leaf)"
        opacity="0.9"
      />

      {/* Right leaf (main, larger) */}
      <path
        d="M32 26 C36 22 44 18 48 14 C46 22 38 26 32 26"
        fill="url(#seedchain-leaf)"
      />

      {/* Seed at the base */}
      <ellipse cx="32" cy="50" rx="6" ry="4.5" fill="white" opacity="0.95" />
      <ellipse cx="32" cy="50" rx="4" ry="3" fill="url(#seedchain-bg)" opacity="0.4" />

      {/* Chain link dots — representing blockchain */}
      <circle cx="14" cy="50" r="2.5" fill="white" opacity="0.5" />
      <circle cx="22" cy="50" r="2" fill="white" opacity="0.35" />
      <circle cx="42" cy="50" r="2" fill="white" opacity="0.35" />
      <circle cx="50" cy="50" r="2.5" fill="white" opacity="0.5" />

      {/* Thin chain lines connecting the dots */}
      <line x1="16.5" y1="50" x2="22" y2="50" stroke="white" strokeWidth="1" opacity="0.3" />
      <line x1="24" y1="50" x2="28" y2="50" stroke="white" strokeWidth="1" opacity="0.3" />
      <line x1="38" y1="50" x2="42" y2="50" stroke="white" strokeWidth="1" opacity="0.3" />
      <line x1="44" y1="50" x2="50" y2="50" stroke="white" strokeWidth="1" opacity="0.3" />
    </svg>
  );
}
