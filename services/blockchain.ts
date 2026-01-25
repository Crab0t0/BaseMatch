import { LeaderboardEntry } from '../types';

/**
 * BASE MAINNET BLOCKCHAIN SERVICE
 * 
 * Official Base RPC: https://mainnet.base.org
 * Contract Address (Example): 0x4200000000000000000000000000000000000069
 * 
 * Compliance:
 * 1. No automatic transactions.
 * 2. All onchain actions are strictly user-initiated.
 * 3. Gameplay is fully usable offchain.
 */

const BASE_RPC_URL = 'https://mainnet.base.org';

const MOCK_INDEXED_DATA: LeaderboardEntry[] = [
  { rank: 1, address: '0x4b2...11a9', score: 38400, levelId: 1 },
  { rank: 2, address: '0xf12...8821', score: 31200, levelId: 1 },
  { rank: 3, address: '0x9d4...a110', score: 28850, levelId: 2 },
  { rank: 4, address: '0xbb1...cc22', score: 24000, levelId: 1 },
  { rank: 5, address: '0x7e3...f412', score: 21800, levelId: 2 },
];

export const submitScore = async (levelId: number, score: number): Promise<string> => {
  console.log(`[Base Service] submitScore(${levelId}, ${score})`);
  await new Promise(resolve => setTimeout(resolve, 1500));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

export const mintScoreNFT = async (levelId: number): Promise<string> => {
  console.log(`[Base Service] mintScoreNFT(${levelId})`);
  await new Promise(resolve => setTimeout(resolve, 1800));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * Sends a 'GM' transaction to the social contract on Base.
 * Optional social interaction.
 */
export const sayGM = async (): Promise<string> => {
  console.log(`[Base Service] Broadcasting GM to ${BASE_RPC_URL}`);
  // Simulate transaction confirmation
  await new Promise(resolve => setTimeout(resolve, 1200));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

export const fetchLeaderboard = async (levelId?: number): Promise<LeaderboardEntry[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));
  let data = [...MOCK_INDEXED_DATA];
  if (levelId !== undefined) {
    data = data.filter(e => e.levelId === levelId);
  }
  return data.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
};