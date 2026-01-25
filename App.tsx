import React, { useState, useEffect, useCallback } from 'react';
import { Tile, GameState, SpecialEffect, BlockchainState } from './types';
import { GRID_SIZE, LEVELS } from './constants';
import { initializeGrid, findMatches, spreadInfection, generateId, createRandomTile } from './services/gameLogic';
import * as baseL2 from './services/blockchain';
import TileComponent from './components/TileComponent';
import Leaderboard from './components/Leaderboard';

const INITIAL_BLOCKCHAIN_STATE: BlockchainState = {
  isSyncing: false,
  isMinting: false,
  isSendingGM: false,
  hasSynced: false,
  hasMinted: false,
  hasSentGM: false,
  lastTxHash: null,
};

const App: React.FC = () => {
  const [view, setView] = useState<'welcome' | 'game' | 'leaderboard'>('welcome');
  const [gameState, setGameState] = useState<GameState>({
    grid: [],
    score: 0,
    movesLeft: 0,
    level: 0,
    status: 'playing',
    view: 'game',
    walletConnected: false,
    blockchain: INITIAL_BLOCKCHAIN_STATE,
  });

  const [walletAddress, setWalletAddress] = useState<string | null>(null);
  const [isConnecting, setIsConnecting] = useState(false);
  const [selectedTile, setSelectedTile] = useState<{ x: number; y: number } | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const startLevel = useCallback((levelIndex: number) => {
    const level = LEVELS[levelIndex];
    setGameState(prev => ({
      ...prev,
      grid: initializeGrid(level.initialFrozenCount, level.initialInfectedCount),
      score: 0,
      movesLeft: level.moves,
      level: levelIndex,
      status: 'playing',
      view: 'game',
      blockchain: INITIAL_BLOCKCHAIN_STATE,
    }));
    setSelectedTile(null);
    setIsProcessing(false);
    setView('game');
  }, []);

  const connectWallet = async () => {
    if (walletAddress || isConnecting) return;
    setIsConnecting(true);
    try {
      await new Promise(resolve => setTimeout(resolve, 800));
      setWalletAddress('0x862...f412');
      setGameState(prev => ({ ...prev, walletConnected: true }));
    } finally {
      setIsConnecting(false);
    }
  };

  const onSayGM = async () => {
    if (!walletAddress) {
      await connectWallet();
    }
    setGameState(prev => ({ ...prev, blockchain: { ...prev.blockchain, isSendingGM: true } }));
    try {
      const hash = await baseL2.sayGM();
      setGameState(prev => ({
        ...prev,
        blockchain: { ...prev.blockchain, isSendingGM: false, hasSentGM: true, lastTxHash: hash }
      }));
    } catch (e) {
      setGameState(prev => ({ ...prev, blockchain: { ...prev.blockchain, isSendingGM: false } }));
    }
  };

  const onSyncScore = async () => {
    if (!walletAddress) {
      await connectWallet();
      return;
    }
    setGameState(prev => ({ ...prev, blockchain: { ...prev.blockchain, isSyncing: true } }));
    try {
      const hash = await baseL2.submitScore(gameState.level + 1, gameState.score);
      setGameState(prev => ({
        ...prev,
        blockchain: { ...prev.blockchain, isSyncing: false, hasSynced: true, lastTxHash: hash }
      }));
    } catch (e) {
      setGameState(prev => ({ ...prev, blockchain: { ...prev.blockchain, isSyncing: false } }));
    }
  };

  const onMintNFT = async () => {
    if (!gameState.blockchain.hasSynced) {
      await onSyncScore();
      return;
    }
    setGameState(prev => ({ ...prev, blockchain: { ...prev.blockchain, isMinting: true } }));
    try {
      const hash = await baseL2.mintScoreNFT(gameState.level + 1);
      setGameState(prev => ({
        ...prev,
        blockchain: { ...prev.blockchain, isMinting: false, hasMinted: true, lastTxHash: hash }
      }));
    } catch (e) {
      setGameState(prev => ({ ...prev, blockchain: { ...prev.blockchain, isMinting: false } }));
    }
  };

  const processGrid = useCallback(async (currentGrid: (Tile | null)[][]): Promise<(Tile | null)[][]> => {
    let grid = currentGrid.map(row => row.map(tile => tile ? { ...tile } : null));
    let hasChanged = true;
    let comboMultiplier = 1;

    while (hasChanged) {
      const { matches, specialSpawns } = findMatches(grid);
      if (matches.size === 0) break;
      hasChanged = true;
      let newScore = 0;

      matches.forEach(key => {
        const [y, x] = key.split('-').map(Number);
        const tile = grid[y][x];
        if (tile) {
          if (tile.frozen > 0) {
             tile.frozen -= 1;
             matches.delete(key); 
          } else {
             newScore += 10 * comboMultiplier;
             if (tile.special === SpecialEffect.LINE_H) {
               for (let ix = 0; ix < GRID_SIZE; ix++) matches.add(`${y}-${ix}`);
             } else if (tile.special === SpecialEffect.LINE_V) {
               for (let iy = 0; iy < GRID_SIZE; iy++) matches.add(`${iy}-${x}`);
             } else if (tile.special === SpecialEffect.BOMB) {
               for (let dy = -1; dy <= 1; dy++) {
                 for (let dx = -1; dx <= 1; dx++) {
                   if (y+dy >=0 && y+dy < GRID_SIZE && x+dx >=0 && x+dx < GRID_SIZE) matches.add(`${y+dy}-${x+dx}`);
                 }
               }
             }
             grid[y][x] = null;
          }
        }
      });

      setGameState(prev => ({ ...prev, score: prev.score + newScore }));

      specialSpawns.forEach(spawn => {
        if (grid[spawn.y][spawn.x] === null || matches.has(`${spawn.y}-${spawn.x}`)) {
          grid[spawn.y][spawn.x] = {
            ...createRandomTile(spawn.x, spawn.y),
            type: spawn.type,
            special: spawn.effect,
            id: generateId()
          };
        }
      });

      for (let x = 0; x < GRID_SIZE; x++) {
        let emptySpaces = 0;
        for (let y = GRID_SIZE - 1; y >= 0; y--) {
          if (grid[y][x] === null) {
            emptySpaces++;
          } else if (emptySpaces > 0) {
            grid[y + emptySpaces][x] = grid[y][x];
            grid[y + emptySpaces][x]!.y = y + emptySpaces;
            grid[y][x] = null;
          }
        }
        for (let y = 0; y < emptySpaces; y++) {
          const newTile = createRandomTile(x, y);
          grid[y][x] = newTile;
        }
      }

      comboMultiplier++;
      setGameState(prev => ({ ...prev, grid }));
      await new Promise(r => setTimeout(r, 200)); 
    }
    return grid;
  }, []);

  const handleTileSelect = async (x: number, y: number) => {
    if (isProcessing || gameState.status !== 'playing' || view !== 'game') return;
    if (!selectedTile) {
      setSelectedTile({ x, y });
    } else {
      const dist = Math.abs(x - selectedTile.x) + Math.abs(y - selectedTile.y);
      if (dist === 1) {
        setIsProcessing(true);
        const newGrid = gameState.grid.map(row => row.map(tile => tile ? { ...tile } : null));
        const tileA = newGrid[selectedTile.y][selectedTile.x];
        const tileB = newGrid[y][x];
        if (tileA && tileB) {
          newGrid[selectedTile.y][selectedTile.x] = { ...tileB, x: selectedTile.x, y: selectedTile.y };
          newGrid[y][x] = { ...tileA, x, y };
          setGameState(prev => ({ ...prev, grid: newGrid }));
          await new Promise(r => setTimeout(r, 150));
          const { matches } = findMatches(newGrid);
          if (matches.size > 0) {
            const nextGrid = await processGrid(newGrid);
            const finalGrid = spreadInfection(nextGrid);
            setGameState(prev => {
              const newMoves = prev.movesLeft - 1;
              const currentLevel = LEVELS[prev.level];
              let newStatus = prev.status;
              if (prev.score >= currentLevel.targetScore) newStatus = 'won';
              else if (newMoves <= 0) newStatus = 'lost';
              return { ...prev, grid: finalGrid, movesLeft: newMoves, status: newStatus };
            });
          } else {
            const resetGrid = gameState.grid.map(row => row.map(tile => tile ? { ...tile } : null));
            setGameState(prev => ({ ...prev, grid: resetGrid }));
          }
        }
        setSelectedTile(null);
        setIsProcessing(false);
      } else {
        setSelectedTile({ x, y });
      }
    }
  };

  if (view === 'welcome') {
    return (
      <div className="flex flex-col h-full bg-[#030303] text-white p-6 items-center justify-center text-center animate-in fade-in duration-700 pt-safe pb-safe">
        <div className="w-20 h-20 xs:w-24 xs:h-24 rounded-3xl bg-[#0052FF] flex items-center justify-center p-4 mb-8 shadow-[0_0_50px_rgba(0,82,255,0.4)] relative">
           <div className="w-full h-full rounded-full border-[6px] border-white" />
           <div className="absolute inset-0 animate-pulse bg-blue-500/20 rounded-3xl blur-xl" />
        </div>
        <h1 className="text-4xl xs:text-5xl font-black italic tracking-tighter mb-4">BASEMATCH</h1>
        <p className="text-slate-400 font-medium mb-12 max-w-[280px] text-sm xs:text-base leading-relaxed">High-performance Match-3 sequence built for the Base ecosystem.</p>
        
        <div className="w-full space-y-4 max-w-[260px]">
          <button 
            onClick={() => startLevel(0)}
            className="w-full py-4 bg-[#0052FF] rounded-[2rem] font-black text-sm uppercase tracking-widest shadow-2xl active:scale-95 transition-all hover:brightness-110"
          >
            Play Game
          </button>
          <button 
            onClick={() => setView('leaderboard')}
            className="w-full py-4 bg-white/5 border border-white/10 rounded-[2rem] font-black text-sm uppercase tracking-widest hover:bg-white/10 transition active:scale-95 text-slate-300"
          >
            Leaderboard
          </button>
          
          <div className="pt-4 border-t border-white/5">
             <button 
               onClick={onSayGM}
               disabled={gameState.blockchain.isSendingGM || gameState.blockchain.hasSentGM}
               className={`w-full py-4 rounded-[2rem] font-black text-[11px] uppercase tracking-widest transition-all active:scale-95 flex items-center justify-center gap-3 border ${
                 gameState.blockchain.hasSentGM 
                 ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' 
                 : 'bg-white/5 border-white/10 text-blue-400 hover:bg-white/10'
               }`}
             >
               {gameState.blockchain.isSendingGM ? 'Processing...' : (gameState.blockchain.hasSentGM ? 'GM RECORDED' : 'Say GM on Base')}
               {!gameState.blockchain.hasSentGM && <span className="text-xs">👋</span>}
             </button>
             <p className="text-[9px] text-slate-600 mt-3 font-bold uppercase tracking-wider">
               Optional social transaction. Gas fees apply.
             </p>
          </div>
        </div>
        
        <div className="mt-12 opacity-30 flex flex-col items-center gap-3">
          <p className="text-[9px] font-black uppercase tracking-[0.4em]">Optimized for Base Mainnet</p>
          <img src="https://base.org/images/base-logo.svg" alt="Base" className="h-4" />
        </div>
      </div>
    );
  }

  if (view === 'leaderboard') {
    return (
      <Leaderboard 
        onBack={() => setView(gameState.status === 'playing' ? 'game' : 'welcome')} 
        userAddress={walletAddress}
        currentLevel={gameState.level}
      />
    );
  }

  const currentLevelData = LEVELS[gameState.level];

  return (
    <div className="flex flex-col h-full bg-[#030303] text-white overflow-hidden selection:bg-blue-500/30 font-sans pt-safe pb-safe">
      {/* Header */}
      <nav className="h-[60px] xs:h-[70px] flex-none px-4 xs:px-8 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-3xl z-[100]">
        <div className="flex items-center gap-3" onClick={() => setView('welcome')}>
          <div className="w-8 h-8 xs:w-10 xs:h-10 rounded-xl bg-[#0052FF] flex items-center justify-center p-1.5 shadow-lg shadow-blue-500/30">
             <div className="w-full h-full rounded-full border-[2px] border-white" />
          </div>
          <div className="hidden xs:block">
            <h1 className="text-base font-black leading-none tracking-tight italic uppercase">BASEMATCH</h1>
            <div className="flex items-center gap-1.5 mt-0.5">
               <span className="w-1 h-1 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,0.8)]" />
               <p className="text-[8px] text-emerald-400 font-black uppercase tracking-widest">Mainnet Live</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-2 xs:gap-3">
          <button 
            onClick={() => setView('leaderboard')}
            className="w-10 h-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition active:scale-90"
          >
            📊
          </button>
          <button 
            onClick={connectWallet}
            className={`px-4 py-2 rounded-full font-black text-[9px] xs:text-[10px] uppercase tracking-wider transition-all shadow-xl active:scale-95 border ${
              walletAddress 
              ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' 
              : 'bg-[#0052FF] text-white border-blue-600'
            }`}
          >
            {isConnecting ? '...' : (walletAddress ? 'Linked' : 'Link Wallet')}
          </button>
        </div>
      </nav>

      {/* Main Container - Responsive Layout */}
      <div className="flex-1 flex flex-col md:flex-row items-center justify-center p-3 xs:p-6 md:p-10 relative overflow-hidden min-h-0 gap-6 md:gap-12">
        <div className="absolute inset-0 bg-radial-gradient from-[#0052FF]/5 to-transparent pointer-events-none opacity-40 blur-3xl" />
        
        {/* Left/Main Column: Game Board */}
        <div className="relative w-full max-w-[min(85vw,calc(100dvh-200px))] aspect-square order-2 md:order-1">
          <div 
            className="grid gap-1 xs:gap-1.5 bg-white/5 p-2 xs:p-3 rounded-[2.5rem] xs:rounded-[3.5rem] border border-white/10 w-full h-full relative z-10 shadow-[0_0_100px_rgba(0,0,0,0.5)] backdrop-blur-md"
            style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
          >
            {gameState.grid.map((row, y) => row.map((tile, x) => (
              <TileComponent
                key={tile?.id || `empty-${x}-${y}`}
                tile={tile}
                isSelected={selectedTile?.x === x && selectedTile?.y === y}
                onSelect={handleTileSelect}
              />
            )))}
          </div>
          <div className="absolute -bottom-8 left-1/2 -translate-x-1/2 w-[80%] h-4 bg-blue-500/10 blur-xl rounded-full opacity-50" />
        </div>

        {/* Right/Side Column: Stats Dashboard */}
        <div className="w-full md:w-[280px] flex flex-row md:flex-col gap-3 xs:gap-4 order-1 md:order-2">
          {/* Moves Card */}
          <div className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-2xl xs:rounded-3xl p-3 xs:p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute top-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full" />
            <p className="text-[8px] xs:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em] mb-1">Energy / Moves</p>
            <div className="flex items-center justify-between">
              <p className={`text-3xl xs:text-5xl font-black tabular-nums tracking-tighter ${gameState.movesLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
                {gameState.movesLeft}
              </p>
              <div className="w-8 h-8 rounded-full bg-white/5 flex items-center justify-center text-xs">⚡</div>
            </div>
          </div>

          {/* Score Card */}
          <div className="flex-1 md:flex-none bg-white/5 border border-white/10 rounded-2xl xs:rounded-3xl p-3 xs:p-5 relative overflow-hidden group hover:border-blue-500/30 transition-colors">
            <div className="absolute bottom-0 right-0 w-16 h-16 bg-blue-500/5 blur-2xl rounded-full" />
            <div className="flex justify-between items-center mb-1">
              <p className="text-[8px] xs:text-[10px] font-black text-slate-500 uppercase tracking-[0.25em]">Sequence Score</p>
              <p className="text-[8px] xs:text-[10px] font-black text-blue-500 uppercase tracking-[0.1em]">Lv.{gameState.level + 1}</p>
            </div>
            <p className="text-3xl xs:text-5xl font-black tabular-nums tracking-tighter text-[#0052FF]">
              {gameState.score.toLocaleString()}
            </p>
            
            <div className="w-full mt-3 xs:mt-4 bg-white/10 h-1.5 xs:h-2 rounded-full overflow-hidden relative">
               <div className="absolute inset-0 bg-blue-500/20 blur-sm" />
               <div 
                  className="h-full bg-gradient-to-r from-[#0052FF] to-blue-400 transition-all duration-700 ease-out shadow-[0_0_12px_rgba(0,82,255,0.6)] relative z-10" 
                  style={{ width: `${Math.min(100, (gameState.score / currentLevelData.targetScore) * 100)}%` }} 
               />
            </div>
          </div>

          {/* Extra Sidebar Info - GM Quick Toggle */}
          <div className="hidden md:block mt-auto p-5 bg-blue-500/5 border border-blue-500/10 rounded-[2rem]">
             <p className="text-[9px] font-black text-blue-400 uppercase tracking-widest mb-3 italic">Social Context</p>
             <button 
               onClick={onSayGM}
               disabled={gameState.blockchain.hasSentGM || gameState.blockchain.isSendingGM}
               className="w-full py-3 bg-white/5 border border-white/10 rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-white/10 transition flex items-center justify-center gap-2"
             >
               {gameState.blockchain.hasSentGM ? 'GM SENT ✅' : 'DROP A GM 🫡'}
             </button>
          </div>
        </div>

        {/* Status Overlays */}
        {gameState.status === 'won' && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in zoom-in duration-300">
            <div className="bg-[#0A0A0A] border border-white/10 p-8 xs:p-10 rounded-[4rem] shadow-[0_0_100px_rgba(0,82,255,0.3)] w-full max-w-sm text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              <div className="w-16 h-16 xs:w-20 xs:h-20 rounded-full mx-auto mb-8 bg-gradient-to-br from-[#0052FF] to-blue-400 flex items-center justify-center shadow-[0_0_40px_rgba(0,82,255,0.4)] animate-bounce text-4xl">💎</div>
              <h2 className="text-2xl xs:text-3xl font-black mb-1 tracking-tighter uppercase italic">SUCCESS</h2>
              <p className="text-blue-500 font-black text-[9px] xs:text-[10px] uppercase tracking-[0.4em] mb-10">LEVEL {gameState.level + 1} VERIFIED</p>
              
              <div className="space-y-3 mb-10">
                <button onClick={onSyncScore} disabled={gameState.blockchain.isSyncing || gameState.blockchain.hasSynced} className={`w-full py-4 px-6 rounded-[2rem] flex items-center justify-between font-black text-[10px] xs:text-[11px] uppercase tracking-widest border transition-all ${gameState.blockchain.hasSynced ? 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400' : 'bg-white/5 border-white/10 text-white hover:border-blue-500/50'}`}>
                  <span>Sync Onchain</span>
                  <span className="opacity-40">{gameState.blockchain.isSyncing ? '...' : (gameState.blockchain.hasSynced ? 'DONE' : 'L2')}</span>
                </button>
                <button onClick={onMintNFT} disabled={gameState.blockchain.isMinting || gameState.blockchain.hasMinted} className={`w-full py-4 px-6 rounded-[2rem] flex items-center justify-between font-black text-[10px] xs:text-[11px] uppercase tracking-widest border transition-all ${gameState.blockchain.hasMinted ? 'bg-amber-500/10 border-amber-500/20 text-amber-400' : 'bg-white/5 border-white/10 text-white hover:border-amber-500/50'} ${!gameState.blockchain.hasSynced ? 'opacity-30' : ''}`}>
                  <span>Mint Badge</span>
                  <span className="opacity-40">{gameState.blockchain.isMinting ? '...' : (gameState.blockchain.hasMinted ? 'OWNED' : 'NFT')}</span>
                </button>
                
                <div className="pt-2">
                   <p className="text-[8px] text-slate-600 mb-2 uppercase font-bold tracking-widest">Optional Action:</p>
                   <button 
                     onClick={onSayGM}
                     disabled={gameState.blockchain.hasSentGM || gameState.blockchain.isSendingGM}
                     className="w-full py-3 bg-blue-500/5 border border-blue-500/20 rounded-[1.5rem] text-[9px] font-black uppercase text-blue-400 tracking-widest flex items-center justify-center gap-2"
                   >
                     {gameState.blockchain.hasSentGM ? 'GM RECORDED 👋' : 'SAY GM ON BASE'}
                   </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <button onClick={() => setView('welcome')} className="py-4 rounded-[2rem] bg-white/5 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-white/10">Exit</button>
                <button onClick={() => startLevel(gameState.level < LEVELS.length - 1 ? gameState.level + 1 : 0)} className="py-4 rounded-[2rem] bg-[#0052FF] text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/40 hover:scale-105 active:scale-95 transition-all">Next</button>
              </div>
            </div>
          </div>
        )}

        {gameState.status === 'lost' && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-4 animate-in fade-in duration-300">
            <div className="bg-[#0A0A0A] border border-white/10 p-8 xs:p-10 rounded-[4rem] shadow-2xl w-full max-w-sm text-center">
              <div className="w-14 h-14 xs:w-16 xs:h-16 rounded-full mx-auto mb-8 bg-rose-500/10 text-rose-500 flex items-center justify-center text-3xl font-black shadow-[0_0_20px_rgba(244,63,94,0.2)]">!</div>
              <h2 className="text-2xl xs:text-3xl font-black mb-3 italic uppercase tracking-tighter text-rose-500">DROPPED</h2>
              <p className="text-slate-500 text-[11px] xs:text-[12px] mb-10 px-4 leading-relaxed font-medium">Network mismatch. Energy levels depleted. Retry to secure the block sequence.</p>
              <div className="space-y-4">
                <button onClick={() => startLevel(gameState.level)} className="w-full py-4 bg-[#0052FF] rounded-[2rem] font-black text-xs uppercase tracking-widest shadow-xl shadow-blue-500/30 active:scale-95 transition">Retry</button>
                <button onClick={() => setView('welcome')} className="w-full py-4 bg-white/5 rounded-[2rem] font-black text-xs uppercase tracking-widest text-slate-500 hover:bg-white/10 transition">Main Menu</button>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Footer Network Indicator */}
      <footer className="h-[40px] xs:h-[50px] flex-none px-8 flex items-center justify-center border-t border-white/5 bg-black/40 backdrop-blur-xl">
        <div className="flex items-center gap-6 text-[8px] font-black text-slate-600 uppercase tracking-[0.3em]">
           <div className="flex items-center gap-2">
              <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,0.8)]" />
              Base Mainnet Active
           </div>
           <div className="h-3 w-px bg-white/10" />
           <p className="hidden xs:block">Build something that matters</p>
           {gameState.blockchain.hasSentGM && <p className="text-emerald-500">GM SENT ✅</p>}
        </div>
      </footer>
    </div>
  );
};

export default App;