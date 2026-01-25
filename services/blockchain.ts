import { LeaderboardEntry } from '../types';

/**
 * BaseGM contract (Base Mainnet)
 */
const GM_CONTRACT_ADDRESS = '0xc2F61dcD24404fC4C89a3fd53Dfb5af659b441e8';
const BASE_MAINNET_CHAIN_ID = '0x2105'; // 8453

/**
 * Optional social GM interaction.
 * - User-initiated only
 * - No token transfers
 * - No ETH value
 * - Base Mainnet only
 */
export const sayGM = async (): Promise<string> => {
  const provider = (window as any).ethereum;
  if (!provider) {
    throw new Error(
      'Wallet not available. Please open this app in Base.app or a Web3-enabled browser.'
    );
  }

  // Request wallet access (user-initiated)
  const accounts: string[] = await provider.request({
    method: 'eth_requestAccounts',
  });

  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet connection required for this optional action.');
  }

  // Ensure Base Mainnet
  const chainId: string = await provider.request({
    method: 'eth_chainId',
  });

  if (chainId !== BASE_MAINNET_CHAIN_ID) {
    throw new Error('Please switch your wallet to Base Mainnet to say GM.');
  }

  // Raw transaction call to BaseGM.sayGM()
  // Function selector for sayGM(): 0x56a64095
  const txHash: string = await provider.request({
    method: 'eth_sendTransaction',
    params: [
      {
        from: accounts[0],
        to: GM_CONTRACT_ADDRESS,
        data: '0x56a64095',
      },
    ],
  });

  return txHash;
};

/* ------------------------------------------------------------------
   MOCK / OFFCHAIN DATA (unchanged)
------------------------------------------------------------------- */

const MOCK_INDEXED_DATA: LeaderboardEntry[] = [
  { rank: 1, address: '0x4b2...11a9', score: 38400, levelId: 1 },
  { rank: 2, address: '0xf12...8821', score: 31200, levelId: 1 },
  { rank: 3, address: '0x9d4...a110', score: 28850, levelId: 2 },
  { rank: 4, address: '0xbb1...cc22', score: 24000, levelId: 1 },
  { rank: 5, address: '0x7e3...f412', score: 21800, levelId: 2 },
];

export const submitScore = async (
  levelId: number,
  score: number
): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return (
    '0x' +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  );
};

export const mintScoreNFT = async (levelId: number): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1800));
  return (
    '0x' +
    Array.from({ length: 64 }, () =>
      Math.floor(Math.random() * 16).toString(16)
    ).join('')
  );
};

export const fetchLeaderboard = async (
  levelId?: number
): Promise<LeaderboardEntry[]> => {
  await new Promise(resolve => setTimeout(resolve, 600));

  let data = [...MOCK_INDEXED_DATA];
  if (levelId !== undefined) {
    data = data.filter(e => e.levelId === levelId);
  }

  return data
    .sort((a, b) => b.score - a.score)
    .map((e, i) => ({ ...e, rank: i + 1 }));
};