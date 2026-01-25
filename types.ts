
export type TileType = 'blue' | 'purple' | 'teal' | 'pink' | 'amber';

export enum SpecialEffect {
  NONE = 'NONE',
  LINE_H = 'LINE_H',
  LINE_V = 'LINE_V',
  BOMB = 'BOMB',
  SUPER = 'SUPER'
}

export interface Tile {
  id: string;
  type: TileType;
  special: SpecialEffect;
  frozen: number; // 0: clear, 1: needs 1 hit, 2: needs 2 hits
  infected: boolean;
  x: number;
  y: number;
}

export interface LevelConfig {
  id: number;
  moves: number;
  targetScore: number;
  targetTiles?: Partial<Record<TileType, number>>;
  initialInfectedCount: number;
  initialFrozenCount: number;
}

export interface LeaderboardEntry {
  rank: number;
  address: string;
  score: number;
  levelId: number;
  isUser?: boolean;
}

export interface BlockchainState {
  isSyncing: boolean;
  isMinting: boolean;
  hasSynced: boolean;
  hasMinted: boolean;
  lastTxHash: string | null;
}

export interface GameState {
  grid: (Tile | null)[][];
  score: number;
  movesLeft: number;
  level: number;
  status: 'playing' | 'won' | 'lost' | 'animating';
  view: 'game' | 'leaderboard';
  walletConnected: boolean;
  blockchain: BlockchainState;
}
