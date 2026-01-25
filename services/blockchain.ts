import { ethers } from 'ethers';

const GM_CONTRACT_ADDRESS = '0xc2F61dcD24404fC4C89a3fd53Dfb5af659b441e8';
const BASE_CHAIN_ID = 8453;

export const sayGM = async (): Promise<string> => {
  if (!(window as any).ethereum) {
    throw new Error('Wallet not available.');
  }

  const provider = new ethers.BrowserProvider(
    (window as any).ethereum
  );

  const signer = await provider.getSigner();
  const network = await provider.getNetwork();

  if (network.chainId !== BigInt(BASE_CHAIN_ID)) {
    throw new Error('Please switch to Base Mainnet.');
  }

  const gmContract = new ethers.Contract(
    GM_CONTRACT_ADDRESS,
    ['function sayGM()'],
    signer
  );

  const tx = await gmContract.sayGM();
  await tx.wait();

  return tx.hash;
};