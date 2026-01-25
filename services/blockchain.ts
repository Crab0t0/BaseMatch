
import { LeaderboardEntry } from '../types';

/**
 * BASE MAINNET BLOCKCHAIN SERVICE (Prototype)
 * 
 * Compliance Checklist:
 * 1. No automatic transactions.
 * 2. Transactions are optional and async.
 * 3. Leaderboard data is sourced from event indexing (Offchain truth).
 */

// Simulated "Indexer" cache populated by watching onchain events
const MOCK_INDEXED_DATA: LeaderboardEntry[] = [
  { rank: 1, address: '0x4b2...11a9', score: 32400, levelId: 1 },
  { rank: 2, address: '0xf12...8821', score: 28200, levelId: 1 },
  { rank: 3, address: '0x9d4...a110', score: 25850, levelId: 2 },
  { rank: 4, address: '0xbb1...cc22', score: 21000, levelId: 1 },
  { rank: 5, address: '0x7e3...f412', score: 18800, levelId: 2 },
];

/**
 * Submits score to Base Mainnet.
 * Note: This triggers a user-confirmed transaction in a real wallet.
 */
export const submitScore = async (levelId: number, score: number): Promise<string> => {
  console.log(`[Base] Preparing optional transaction: submitScore(${levelId}, ${score})`);
  // Simulate network broadcast & confirmation
  await new Promise(resolve => setTimeout(resolve, 2000));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * Mints an ERC-1155 NFT representing the user's achievement.
 * Compliance: Requires explicit user action.
 */
export const mintScoreNFT = async (levelId: number): Promise<string> => {
  console.log(`[Base] Preparing optional transaction: mintScoreNFT(${levelId})`);
  // Simulate NFT minting lifecycle
  await new Promise(resolve => setTimeout(resolve, 2500));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

/**
 * Fetches leaderboard data from an offchain indexer (e.g. Subgraph or Vercel Backend).
 * Compliance: No expensive onchain sorting/arrays.
 */
export const fetchLeaderboard = async (levelId?: number): Promise<LeaderboardEntry[]> => {
  await new Promise(resolve => setTimeout(resolve, 800));
  let data = [...MOCK_INDEXED_DATA];
  if (levelId !== undefined) {
    data = data.filter(e => e.levelId === levelId);
  }
  return data.sort((a, b) => b.score - a.score).map((e, i) => ({ ...e, rank: i + 1 }));
};
