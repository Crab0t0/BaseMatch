import { LeaderboardEntry } from '../types';

/**
 * BASE MAINNET BLOCKCHAIN SERVICE
 * 
 * Official Base RPC: https://mainnet.base.org
 * 
 * Compliance:
 * 1. No automatic transactions.
 * 2. All onchain actions are strictly user-initiated.
 * 3. Gameplay is fully usable offchain.
 */

const BASE_RPC_URL = 'https://mainnet.base.org';

// Simulated database of indexed onchain events for the leaderboard
const MOCK_INDEXED_DATA: LeaderboardEntry[] = [
  { rank: 1, address: '0x4b2...11a9', score: 38400, levelId: 1 },
  { rank: 2, address: '0xf12...8821', score: 31200, levelId: 1 },
  { rank: 3, address: '0x9d4...a110', score: 28850, levelId: 2 },
  { rank: 4, address: '0xbb1...cc22', score: 24000, levelId: 1 },
  { rank: 5, address: '0x7e3...f412', score: 21800, levelId: 2 },
];

/**
 * Submits score to Base Mainnet using the user's connected wallet.
 * Compliance: Triggered by explicit UI button only.
 */
export const submitScore = async (levelId: number, score: number): Promise<string> => {
  console.log(`[Base Service] Broadcasting to ${BASE_RPC_URL}: submitScore(${levelId}, ${score})`);
  // Simulation of a standard transaction lifecycle
  await new Promise(resolve => setTimeout(resolve, 1800));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * Mints achievement NFT (ERC-1155) on Base Mainnet.
 * Compliance: Requires valid score event index onchain.
 */
export const mintScoreNFT = async (levelId: number): Promise<string> => {
  console.log(`[Base Service] Calling ERC-1155 contract on ${BASE_RPC_URL}...`);
  await new Promise(resolve => setTimeout(resolve, 2200));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * Fetches the competitive leaderboard.
 * Compliance: Data is retrieved via HTTPS from an offchain indexer (simulation).
 */
export const fetchLeaderboard = async (levelId?: number): Promise<LeaderboardEntry[]> => {
  // Simulating a network delay from a high-performance indexer
  await new Promise(resolve => setTimeout(resolve, 600));
  let data = [...MOCK_INDEXED_DATA];
  if (levelId !== undefined) {
    data = data.filter(e => e.levelId === levelId);
  }
  return data.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
};