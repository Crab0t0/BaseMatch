
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
  hasSynced: false,
  hasMinted: false,
  lastTxHash: null,
};

const App: React.FC = () => {
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
  }, []);

  useEffect(() => {
    startLevel(0);
  }, [startLevel]);

  const connectWallet = async () => {
    if (walletAddress) return;
    setIsConnecting(true);
    // Simulate Base Wallet connection
    await new Promise(resolve => setTimeout(resolve, 800));
    setWalletAddress('0x862...f412');
    setGameState(prev => ({ ...prev, walletConnected: true }));
    setIsConnecting(false);
  };

  const onSyncScore = async () => {
    if (!walletAddress) {
      await connectWallet();
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
    if (isProcessing || gameState.status !== 'playing' || gameState.view !== 'game') return;
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

  if (gameState.view === 'leaderboard') {
    return (
      <Leaderboard 
        onBack={() => setGameState(prev => ({ ...prev, view: 'game' }))} 
        userAddress={walletAddress}
        currentLevel={gameState.level}
      />
    );
  }

  const currentLevelData = LEVELS[gameState.level];

  return (
    <div className="flex flex-col h-full bg-[#030303] text-white overflow-hidden selection:bg-blue-500/30 font-sans">
      {/* Navigation (Strict Compliance: Clear Wallet State) */}
      <nav className="px-6 py-5 flex justify-between items-center border-b border-white/5 bg-black/80 backdrop-blur-3xl sticky top-0 z-[100]">
        <div className="flex items-center gap-4">
          <div className="w-10 h-10 rounded-xl bg-[#0052FF] flex items-center justify-center p-2 shadow-lg shadow-blue-500/30">
             <div className="w-full h-full rounded-full border-[2.5px] border-white" />
          </div>
          <div>
            <h1 className="text-xl font-black leading-none tracking-tight italic">BASEMATCH</h1>
            <div className="flex items-center gap-1.5 mt-1">
               <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
               <p className="text-[9px] text-emerald-400 font-black uppercase tracking-widest">Offchain Primary</p>
            </div>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <button 
            onClick={() => setGameState(prev => ({ ...prev, view: 'leaderboard' }))}
            className="w-11 h-11 rounded-full bg-white/5 border border-white/10 flex items-center justify-center hover:bg-white/10 transition active:scale-90"
            aria-label="Leaderboard"
          >
            📊
          </button>
          <button 
            onClick={connectWallet}
            className={`px-6 py-2.5 rounded-full font-black text-[11px] uppercase tracking-wider transition-all shadow-xl active:scale-95 border ${
              walletAddress 
              ? 'bg-emerald-500/5 text-emerald-400 border-emerald-500/20' 
              : 'bg-[#0052FF] text-white border-blue-600'
            }`}
          >
            {isConnecting ? '...' : (walletAddress || 'Connect')}
          </button>
        </div>
      </nav>

      {/* Stats Dashboard */}
      <div className="grid grid-cols-2 gap-4 p-6">
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Energy</p>
          <p className={`text-4xl font-black tabular-nums tracking-tighter ${gameState.movesLeft < 5 ? 'text-rose-500 animate-pulse' : 'text-white'}`}>
            {gameState.movesLeft}
          </p>
        </div>
        <div className="bg-white/5 border border-white/10 rounded-[2rem] p-6 relative overflow-hidden">
          <p className="text-[10px] font-black text-slate-500 uppercase tracking-[0.2em] mb-1">Score</p>
          <div className="flex items-baseline gap-2">
            <span className="text-4xl font-black tabular-nums tracking-tighter text-[#0052FF]">{gameState.score}</span>
          </div>
          <div className="w-full mt-3 bg-white/5 h-1.5 rounded-full overflow-hidden">
             <div className="h-full bg-gradient-to-r from-[#0052FF] to-blue-400 transition-all duration-700 ease-out" style={{ width: `${Math.min(100, (gameState.score / currentLevelData.targetScore) * 100)}%` }} />
          </div>
        </div>
      </div>

      {/* Main Grid View */}
      <div className="flex-1 flex items-center justify-center p-6 relative">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[140%] h-[140%] bg-[#0052FF]/10 rounded-full blur-[120px] pointer-events-none opacity-40" />
        
        <div 
          className="grid gap-2 bg-white/5 p-4 rounded-[3.5rem] border border-white/10 aspect-square w-full max-w-[500px] relative z-10 shadow-2xl"
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

        {/* Level Complete Overlay (Compliance: Clear Optional Flow) */}
        {gameState.status === 'won' && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6 animate-in fade-in zoom-in duration-500">
            <div className="bg-[#0A0A0A] border border-white/10 p-10 rounded-[4rem] shadow-[0_0_80px_rgba(0,82,255,0.2)] w-full max-w-sm text-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-blue-500/5 to-transparent pointer-events-none" />
              
              <div className="w-24 h-24 rounded-full mx-auto mb-8 bg-gradient-to-br from-[#0052FF] to-blue-400 flex items-center justify-center shadow-[0_0_30px_rgba(0,82,255,0.4)] animate-bounce">
                <span className="text-5xl">💎</span>
              </div>
              
              <h2 className="text-4xl font-black mb-1 tracking-tighter uppercase italic">SECURED</h2>
              <p className="text-blue-500 font-black text-[11px] uppercase tracking-[0.3em] mb-10">LEVEL {gameState.level + 1} COMPLETE</p>
              
              <div className="space-y-4 mb-10 text-left">
                {/* Information Card (Compliance) */}
                <div className="px-5 py-3 bg-white/5 rounded-2xl border border-white/5 mb-6">
                   <p className="text-[10px] text-slate-500 font-bold leading-tight">
                     Onchain actions are entirely optional. Submit your score to join the global leaderboard or claim a commemorative NFT.
                   </p>
                </div>

                {/* Optional Score Submission */}
                <button 
                  onClick={onSyncScore}
                  disabled={gameState.blockchain.isSyncing || gameState.blockchain.hasSynced}
                  className={`w-full py-5 px-6 rounded-3xl flex items-center justify-between font-black text-xs transition-all border ${
                    gameState.blockchain.hasSynced 
                    ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                    : 'bg-white/5 border-white/10 hover:border-[#0052FF]/40 text-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-4">
                    <div className={`w-2.5 h-2.5 rounded-full ${gameState.blockchain.hasSynced ? 'bg-emerald-500 shadow-[0_0_8px_rgba(16,185,129,1)]' : 'bg-blue-500 animate-pulse'}`} />
                    <span className="uppercase tracking-[0.15em]">SAVE ONCHAIN</span>
                  </div>
                  <span className="opacity-60">{gameState.blockchain.isSyncing ? '...' : (gameState.blockchain.hasSynced ? 'SYNCED' : 'GAS OPT')}</span>
                </button>

                {/* Optional NFT Claim */}
                <button 
                  onClick={onMintNFT}
                  disabled={gameState.blockchain.isMinting || gameState.blockchain.hasMinted}
                  className={`w-full py-5 px-6 rounded-3xl flex items-center justify-between font-black text-xs transition-all border ${
                    gameState.blockchain.hasMinted 
                    ? 'bg-amber-500/10 border-amber-500/30 text-amber-400' 
                    : 'bg-white/5 border-white/10 hover:border-amber-500/40 text-slate-100'
                  } ${!gameState.blockchain.hasSynced ? 'opacity-30 cursor-not-allowed' : ''}`}
                >
                  <div className="flex items-center gap-4">
                    <span className="text-xl">🎖️</span>
                    <span className="uppercase tracking-[0.15em]">MINT BADGE</span>
                  </div>
                  <span className="opacity-60">{gameState.blockchain.isMinting ? '...' : (gameState.blockchain.hasMinted ? 'COLLECTED' : 'LEVEL 1')}</span>
                </button>
              </div>

              {gameState.blockchain.lastTxHash && (
                <div className="mb-8 px-5 py-3 bg-emerald-500/5 rounded-2xl border border-emerald-500/10 text-left">
                   <p className="text-[9px] text-emerald-500/70 uppercase font-black tracking-widest mb-1">TX CONFIRMED</p>
                   <p className="text-[10px] text-emerald-400 font-mono truncate">{gameState.blockchain.lastTxHash}</p>
                </div>
              )}
              
              <div className="grid grid-cols-2 gap-4">
                <button 
                  onClick={() => setGameState(prev => ({ ...prev, view: 'leaderboard' }))}
                  className="py-5 rounded-[2rem] bg-white/5 text-slate-500 font-black text-[11px] uppercase tracking-widest hover:bg-white/10 transition"
                >
                  RANKS
                </button>
                <button 
                  onClick={() => startLevel(gameState.level < LEVELS.length - 1 ? gameState.level + 1 : 0)}
                  className="py-5 rounded-[2rem] bg-[#0052FF] text-white font-black text-[11px] uppercase tracking-widest shadow-xl shadow-blue-500/30 hover:scale-105 transition active:scale-95"
                >
                  NEXT
                </button>
              </div>
            </div>
          </div>
        )}

        {/* Failed Overlay */}
        {gameState.status === 'lost' && (
          <div className="absolute inset-0 z-[1000] flex items-center justify-center bg-black/95 backdrop-blur-3xl p-6">
            <div className="bg-[#0A0A0A] border border-white/10 p-10 rounded-[4rem] shadow-2xl w-full max-w-sm text-center">
              <div className="w-20 h-20 rounded-full mx-auto mb-8 bg-rose-500/10 text-rose-500 flex items-center justify-center text-4xl font-black shadow-[0_0_20px_rgba(244,63,94,0.2)]">!</div>
              <h2 className="text-3xl font-black mb-3 italic uppercase tracking-tighter">DROPPED</h2>
              <p className="text-slate-500 text-sm mb-10 px-6 leading-relaxed">Network power depleted. Retry the block to secure your score.</p>
              <button 
                onClick={() => startLevel(gameState.level)} 
                className="w-full py-5 bg-[#0052FF] rounded-[2rem] font-black text-xs uppercase tracking-[0.2em] shadow-xl shadow-blue-500/20 active:scale-95 transition"
              >
                RETRY BLOCK
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Footer Branding (Compliance: Explicit Network & Status) */}
      <footer className="px-8 pb-8">
        <div className="bg-white/5 rounded-3xl p-6 border border-white/5 flex items-center justify-between text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
           <div className="flex items-center gap-3">
              <div className="w-2 h-2 rounded-full bg-emerald-500 shadow-[0_0_5px_rgba(16,185,129,1)]" />
              Base Mainnet Active
           </div>
           <div className="h-4 w-px bg-white/10" />
           <p>Build Something that Matters</p>
        </div>
      </footer>
    </div>
  );
};

export default App;
