
import React from 'react';
import { TileType, LevelConfig } from './types';

export const GRID_SIZE = 8;

// Base Brand Colors
export const BASE_BLUE = '#0052FF';

export const TILE_COLORS: Record<TileType, string> = {
  blue: 'bg-[#0052FF] shadow-[#0052FF]/40',
  purple: 'bg-[#7C3AED] shadow-[#7C3AED]/40',
  teal: 'bg-[#06B6D4] shadow-[#06B6D4]/40',
  pink: 'bg-[#EC4899] shadow-[#EC4899]/40',
  amber: 'bg-[#F59E0B] shadow-[#F59E0B]/40',
};

export const LEVELS: LevelConfig[] = [
  { id: 1, moves: 25, targetScore: 1000, initialInfectedCount: 0, initialFrozenCount: 0 },
  { id: 2, moves: 22, targetScore: 2500, targetTiles: { blue: 20 }, initialInfectedCount: 0, initialFrozenCount: 4 },
  { id: 3, moves: 25, targetScore: 5000, initialInfectedCount: 2, initialFrozenCount: 8 },
  { id: 4, moves: 30, targetScore: 10000, initialInfectedCount: 4, initialFrozenCount: 12 },
];

export const TILE_SVGS: Record<TileType, React.ReactNode> = {
  blue: (
    <svg viewBox="0 0 24 24" className="w-full h-full p-2.5 text-white fill-current">
      <circle cx="12" cy="12" r="8" />
      <circle cx="12" cy="12" r="3" fill="rgba(255,255,255,0.4)" />
    </svg>
  ),
  purple: (
    <svg viewBox="0 0 24 24" className="w-full h-full p-2.5 text-white fill-current">
      <path d="M12 2L4.5 20.29l.71.71L12 18l6.79 3 .71-.71z" />
    </svg>
  ),
  teal: (
    <svg viewBox="0 0 24 24" className="w-full h-full p-2.5 text-white fill-current">
      <rect x="5" y="5" width="14" height="14" rx="3" />
    </svg>
  ),
  pink: (
    <svg viewBox="0 0 24 24" className="w-full h-full p-2.5 text-white fill-current">
      <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
    </svg>
  ),
  amber: (
    <svg viewBox="0 0 24 24" className="w-full h-full p-2.5 text-white fill-current">
      <path d="M12 17.27L18.18 21l-1.64-7.03L22 9.24l-7.19-.61L12 2 9.19 8.63 2 9.24l5.46 4.73L5.82 21z" />
    </svg>
  ),
};
