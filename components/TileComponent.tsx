
import React from 'react';
import { Tile, SpecialEffect } from '../types';
import { TILE_COLORS, TILE_SVGS } from '../constants';

interface TileComponentProps {
  tile: Tile | null;
  isSelected: boolean;
  onSelect: (x: number, y: number) => void;
}

const TileComponent: React.FC<TileComponentProps> = ({ tile, isSelected, onSelect }) => {
  if (!tile) return <div className="w-full h-full opacity-0" />;

  const colorClass = TILE_COLORS[tile.type];
  
  return (
    <div
      onClick={() => onSelect(tile.x, tile.y)}
      className={`
        relative w-full h-full flex items-center justify-center cursor-pointer select-none
        transition-all duration-300
        ${isSelected ? 'z-[50] scale-110' : 'scale-100'}
        hover:brightness-110 active:scale-95
      `}
    >
      {/* Background Glow for Specials */}
      {tile.special !== SpecialEffect.NONE && (
        <div className={`absolute inset-0 rounded-lg xs:rounded-xl blur-md opacity-40 animate-pulse ${colorClass.split(' ')[0]}`} />
      )}

      {/* Tile Container */}
      <div className={`
        relative w-[92%] h-[92%] rounded-lg xs:rounded-xl flex items-center justify-center shadow-md
        transition-all duration-300 border border-white/15
        ${colorClass}
        ${tile.infected ? 'ring-2 xs:ring-4 ring-emerald-400 shadow-[0_0_15px_rgba(52,211,153,0.5)]' : ''}
        ${tile.frozen > 0 ? 'saturate-[0.3] brightness-50' : 'saturate-100 brightness-100'}
        ${isSelected ? 'ring-2 ring-white shadow-xl' : ''}
      `}>
        {/* Highlight Effect */}
        <div className="absolute inset-0 rounded-lg xs:rounded-xl border-t border-white/20 border-l border-white/5" />
        <div className="absolute inset-0 rounded-lg xs:rounded-xl bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
        
        {/* Icon */}
        <div className={`w-[80%] h-[80%] transition-transform duration-300 ${isSelected ? 'scale-110' : 'scale-100'}`}>
          {TILE_SVGS[tile.type]}
        </div>

        {/* Special Overlays */}
        {tile.special === SpecialEffect.LINE_H && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-full h-0.5 xs:h-1 bg-white/80 blur-[0.5px] shadow-[0_0_8px_white] animate-pulse" />
          </div>
        )}
        {tile.special === SpecialEffect.LINE_V && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none overflow-hidden">
            <div className="w-0.5 xs:w-1 h-full bg-white/80 blur-[0.5px] shadow-[0_0_8px_white] animate-pulse" />
          </div>
        )}
        {tile.special === SpecialEffect.BOMB && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-full h-full border border-white/40 rounded-full animate-ping" />
          </div>
        )}
        {tile.special === SpecialEffect.SUPER && (
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
             <div className="w-full h-full rounded-lg xs:rounded-xl bg-gradient-to-tr from-transparent via-white/20 to-transparent animate-pulse" />
          </div>
        )}

        {/* Frozen Overlay */}
        {tile.frozen > 0 && (
          <div className="absolute inset-0 rounded-lg xs:rounded-xl bg-sky-200/30 backdrop-blur-[1px] flex items-center justify-center">
             <div className="flex gap-0.5">
                {[...Array(tile.frozen)].map((_, i) => (
                  <div key={i} className="w-1.5 h-3 xs:w-2 xs:h-4 bg-white/80 rounded-sm skew-x-12 border border-sky-300/30" />
                ))}
             </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default TileComponent;
