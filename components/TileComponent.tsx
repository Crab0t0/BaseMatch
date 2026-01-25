
import React from 'react';
import { Tile, SpecialEffect } from '../types';
import { TILE_COLORS, TILE_SVGS } from '../constants';

interface TileComponentProps {
  tile: Tile | null;
  isSelected: boolean;
  onSelect: (x: number, y: number) => void;
}

const TileComponent: React.FC<TileComponentProps> = ({ tile, isSelected, onSelect }) => {
  if (!tile) return <div className="w-full h-full opacity-0 scale-50 transition-all duration-300" />;

  const colorClass = TILE_COLORS[tile.type];
  
  return (
    <div
      onClick={() => onSelect(tile.x, tile.y)}
      className={`
        relative w-full h-full flex items-center justify-center cursor-pointer select-none
        transition-all duration-500 ease-[cubic-bezier(0.34,1.56,0.64,1)]
        ${isSelected ? 'z-[50] scale-110' : 'scale-100'}
        hover:brightness-110 active:scale-95
      `}
    >
      {/* Background Glow for Specials */}
      {tile.special !== SpecialEffect.NONE && (
        <div className={`absolute inset-0 rounded-2xl blur-lg opacity-60 animate-pulse ${colorClass.split(' ')[0]}`} />
      )}

      {/* Tile Container */}
      <div className={`
        relative w-[94%] h-[94%] rounded-[1.4rem] flex items-center justify-center shadow-lg
        transition-all duration-300 border border-white/20
        ${colorClass}
        ${tile.infected ? 'ring-4 ring-emerald-400 shadow-[0_0_20px_rgba(52,211,153,0.6)]' : ''}
        ${tile.frozen > 0 ? 'saturate-[0.2] brightness-50' : 'saturate-100 brightness-100'}
        ${isSelected ? 'ring-4 ring-white shadow-2xl translate-y-[-2px]' : ''}
      `}>
        {/* Bezel / Highlight Effect */}
        <div className="absolute inset-0 rounded-[1.4rem] border-t-2 border-white/30 border-l border-white/10" />
        <div className="absolute inset-0 rounded-[1.4rem] bg-gradient-to-br from-white/20 to-transparent pointer-events-none" />
        
        {/* SVG Icon */}
        <div className={`transition-transform duration-300 ${isSelected ? 'scale-110 rotate-3' : 'scale-100'}`}>
          {TILE_SVGS[tile.type]}
        </div>

        {/* Special Overlays */}
        {tile.special === SpecialEffect.LINE_H && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-full h-1.5 bg-white/90 blur-[1px] shadow-[0_0_12px_white] animate-pulse" />
          </div>
        )}
        {tile.special === SpecialEffect.LINE_V && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-1.5 h-full bg-white/90 blur-[1px] shadow-[0_0_12px_white] animate-pulse" />
          </div>
        )}
        {tile.special === SpecialEffect.BOMB && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-10 h-10 border-2 border-white/40 rounded-full animate-ping" />
             <div className="w-6 h-6 border-[3px] border-white/60 rounded-full animate-pulse" />
          </div>
        )}
        {tile.special === SpecialEffect.SUPER && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-full h-full rounded-[1.4rem] bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-[shimmer_2s_infinite]" />
             <div className="text-[10px] font-black text-white drop-shadow-[0_2px_2px_rgba(0,0,0,0.5)]">SUPER</div>
          </div>
        )}

        {/* Frozen Layers */}
        {tile.frozen > 0 && (
          <div className="absolute inset-0 rounded-[1.4rem] bg-sky-200/40 backdrop-blur-[2px] flex items-center justify-center">
             <div className="flex gap-1">
                {[...Array(tile.frozen)].map((_, i) => (
                  <div key={i} className="w-3 h-5 bg-white/90 rounded-sm skew-x-12 shadow-md border border-sky-300/50" />
                ))}
             </div>
          </div>
        )}

        {/* Selection Indicator */}
        {isSelected && (
          <div className="absolute -inset-1.5 border-[3px] border-[#0052FF] rounded-[1.6rem] animate-[ping_2s_infinite] opacity-30 pointer-events-none" />
        )}
      </div>
    </div>
  );
};

export default TileComponent;
