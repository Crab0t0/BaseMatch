import { ethers } from 'ethers';
import { LeaderboardEntry } from '../types';

const GM_CONTRACT_ADDRESS = '0xc2F61dcD24404fC4C89a3fd53Dfb5af659b441e8';
const BASE_CHAIN_ID_HEX = '0x2105'; // 8453
const BASE_CHAIN_ID_DEC = 8453;

/**
 * Compliance: 
 * 1. User-initiated ONLY.
 * 2. No token transfers.
 * 3. Verified for Base Mainnet.
 */
export const sayGM = async (): Promise<string> => {
  if (!(window as any).ethereum) {
    throw new Error('No wallet provider found. Please use Base.app or a Web3 browser.');
  }

  const provider = new ethers.BrowserProvider((window as any).ethereum);

  // 1. Check Network and Switch if needed
  const network = await provider.getNetwork();
  if (network.chainId !== BigInt(BASE_CHAIN_ID_DEC)) {
    try {
      await (window as any).ethereum.request({
        method: 'wallet_switchEthereumChain',
        params: [{ chainId: BASE_CHAIN_ID_HEX }],
      });
    } catch (switchError: any) {
      // Error code 4902 means the chain hasn't been added to the wallet
      if (switchError.code === 4902) {
        await (window as any).ethereum.request({
          method: 'wallet_addEthereumChain',
          params: [
            {
              chainId: BASE_CHAIN_ID_HEX,
              chainName: 'Base',
              nativeCurrency: { name: 'Ether', symbol: 'ETH', decimals: 18 },
              rpcUrls: ['https://mainnet.base.org'],
              blockExplorerUrls: ['https://basescan.org'],
            },
          ],
        });
      } else {
        throw new Error('Please switch your wallet to Base Mainnet to continue.');
      }
    }
  }

  // 2. Re-instantiate provider/signer after potential network switch
  const updatedProvider = new ethers.BrowserProvider((window as any).ethereum);
  const signer = await updatedProvider.getSigner();

  // 3. Call Contract
  // Using ethers.Contract abstraction handles gas estimation and data encoding correctly, 
  // resolving common simulation errors (#1002).
  const gmContract = new ethers.Contract(
    GM_CONTRACT_ADDRESS,
    ['function sayGM() external'],
    signer
  );

  // Send transaction - no value/payable needed
  const tx = await gmContract.sayGM();
  
  // Wait for confirmation
  const receipt = await tx.wait(1);

  if (!receipt) throw new Error("Transaction failed or was dropped.");
  
  return receipt.hash;
};

// Mocked indexed data for the leaderboard (off-chain storage of on-chain events)
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