
import { LeaderboardEntry } from '../types';

// Using a lightweight approach for transaction handling
const GM_CONTRACT_ADDRESS = '0xc2F61dcD24404fC4C89a3fd53Dfb5af659b441e8';
const BASE_MAINNET_CHAIN_ID = '0x2105'; // 8453 in hex

/**
 * Compliance: 
 * 1. User-initiated only.
 * 2. No token transfers.
 * 3. Base Mainnet.
 */

export const sayGM = async (): Promise<string> => {
  const provider = (window as any).ethereum;
  if (!provider) {
    throw new Error('No wallet provider found. Please open this in Base.app or a Web3 browser.');
  }

  // Request account access if not already granted
  const accounts = await provider.request({ method: 'eth_requestAccounts' });
  if (!accounts || accounts.length === 0) {
    throw new Error('Wallet connection required for this optional action.');
  }

  // Check network
  const chainId = await provider.request({ method: 'eth_chainId' });
  if (chainId !== BASE_MAINNET_CHAIN_ID) {
    try {
      await provider.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_MAINNET_CHAIN_ID }],
      });
    } catch (switchError: any) {
      throw new Error('Please switch your wallet to Base Mainnet to say GM.');
    }
  }

  // minimal ABI for sayGM()
  // Function signature: 0x56a64095
  const transactionParameters = {
    to: GM_CONTRACT_ADDRESS,
    from: accounts[0],
    data: '0x56a64095', 
    value: '0x0',
  };

  const txHash = await provider.request({
    method: 'eth_sendTransaction',
    params: [transactionParameters],
  });

  return txHash;
};

const MOCK_INDEXED_DATA: LeaderboardEntry[] = [
  { rank: 1, address: '0x4b2...11a9', score: 38400, levelId: 1 },
  { rank: 2, address: '0xf12...8821', score: 31200, levelId: 1 },
  { rank: 3, address: '0x9d4...a110', score: 28850, levelId: 2 },
  { rank: 4, address: '0xbb1...cc22', score: 24000, levelId: 1 },
  { rank: 5, address: '0x7e3...f412', score: 21800, levelId: 2 },
];

export const submitScore = async (levelId: number, score: number): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1500));
  return '0x' + Array.from({length: 64}, () => Math.floor(Math.random() * 16).toString(16)).join('');
};

export const mintScoreNFT = async (levelId: number): Promise<string> => {
  await new Promise(resolve => setTimeout(resolve, 1800));
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
