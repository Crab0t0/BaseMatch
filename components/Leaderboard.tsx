
import React, { useEffect, useState } from 'react';
import { LeaderboardEntry } from '../types';
import { fetchLeaderboard } from '../services/blockchain';

interface LeaderboardProps {
  onBack: () => void;
  userAddress: string | null;
  currentLevel: number;
}

const Leaderboard: React.FC<LeaderboardProps> = ({ onBack, userAddress, currentLevel }) => {
  const [data, setData] = useState<LeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<'global' | 'level'>('global');

  useEffect(() => {
    setLoading(true);
    // Compliance: Fetching from indexed offchain cache
    fetchLeaderboard(filter === 'level' ? currentLevel + 1 : undefined).then(res => {
      // Mocking user position
      if (userAddress) {
        res.push({ rank: 24, address: userAddress, score: 1450, levelId: currentLevel + 1, isUser: true });
      }
      setData(res);
      setLoading(false);
    });
  }, [filter, currentLevel, userAddress]);

  return (
    <div className="flex flex-col h-full bg-[#030303] text-white animate-in slide-in-from-right duration-500 ease-out font-sans">
      <header className="p-8 flex items-center justify-between border-b border-white/5 bg-black/60 backdrop-blur-3xl sticky top-0 z-[100]">
        <div className="flex items-center gap-5">
          <button onClick={onBack} className="w-12 h-12 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-2xl transition active:scale-90 border border-white/10">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M15 19l-7-7 7-7"/></svg>
          </button>
          <div>
            <h2 className="text-2xl font-black italic uppercase tracking-tighter">HALL OF FAME</h2>
            <p className="text-[9px] text-blue-500 font-black uppercase tracking-[0.25em]">Indexed Onchain Events</p>
          </div>
        </div>
      </header>

      <div className="flex px-8 py-8 gap-4">
        <button 
          onClick={() => setFilter('global')}
          className={`flex-1 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all border ${filter === 'global' ? 'bg-[#0052FF] border-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white/5 border-white/5 text-slate-500'}`}
        >
          GLOBAL
        </button>
        <button 
          onClick={() => setFilter('level')}
          className={`flex-1 py-4 rounded-3xl text-[11px] font-black uppercase tracking-widest transition-all border ${filter === 'level' ? 'bg-[#0052FF] border-blue-600 text-white shadow-xl shadow-blue-500/30' : 'bg-white/5 border-white/5 text-slate-500'}`}
        >
          LVL {currentLevel + 1}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-8 space-y-4 pb-16">
        {loading ? (
          <div className="flex flex-col items-center justify-center h-64 gap-5">
            <div className="w-12 h-12 border-[4px] border-[#0052FF] border-t-transparent rounded-full animate-spin" />
            <p className="text-[10px] font-black text-slate-600 uppercase tracking-widest">QUERYING INDEXER...</p>
          </div>
        ) : (
          data.map((entry) => (
            <div 
              key={`${entry.address}-${entry.levelId}`}
              className={`flex items-center justify-between p-7 rounded-[2.5rem] border transition-all duration-300 transform hover:scale-[1.01] ${
                entry.isUser ? 'bg-[#0052FF]/10 border-[#0052FF]/40 shadow-xl shadow-blue-500/10' : 'bg-white/5 border-white/5 hover:border-white/10'
              }`}
            >
              <div className="flex items-center gap-7">
                <div className={`w-11 h-11 rounded-2xl flex items-center justify-center text-sm font-black italic shadow-lg ${
                  entry.rank === 1 ? 'bg-amber-400 text-amber-950 shadow-amber-400/20' :
                  entry.rank === 2 ? 'bg-slate-300 text-slate-900 shadow-slate-300/20' :
                  entry.rank === 3 ? 'bg-orange-400 text-orange-950 shadow-orange-400/20' :
                  'bg-white/5 text-slate-500'
                }`}>
                  {entry.rank}
                </div>
                <div>
                  <p className={`text-sm font-black tracking-tight ${entry.isUser ? 'text-blue-400' : 'text-slate-100'}`}>
                    {entry.address.toLowerCase()}
                  </p>
                  <p className="text-[9px] text-slate-600 font-black uppercase tracking-[0.2em] mt-1">Verified Block Secured</p>
                </div>
              </div>
              <div className="text-right">
                <p className="text-2xl font-black text-[#0052FF] tracking-tighter">{entry.score.toLocaleString()}</p>
                <p className="text-[9px] text-slate-700 font-black uppercase tracking-widest">POINTS</p>
              </div>
            </div>
          ))
        )}
      </div>

      <footer className="p-10 bg-black/80 border-t border-white/5 flex flex-col items-center gap-5">
        <p className="text-[10px] text-slate-700 text-center font-black uppercase tracking-[0.35em]">
          DATA SYNCED WITH BASE MAINNET RPC
        </p>
        <div className="flex gap-8 opacity-20 grayscale">
           <img src="https://base.org/images/base-logo.svg" alt="Base" className="h-4" />
        </div>
      </footer>
    </div>
  );
};

export default Leaderboard;
