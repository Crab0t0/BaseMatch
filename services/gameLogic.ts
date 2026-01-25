
import { Tile, TileType, SpecialEffect } from '../types';
// Fix: Import GRID_SIZE from constants instead of types
import { GRID_SIZE } from '../constants';

const TILE_TYPES: TileType[] = ['blue', 'purple', 'teal', 'pink', 'amber'];

export const generateId = () => Math.random().toString(36).substr(2, 9);

export const createRandomTile = (x: number, y: number): Tile => ({
  id: generateId(),
  type: TILE_TYPES[Math.floor(Math.random() * TILE_TYPES.length)],
  special: SpecialEffect.NONE,
  frozen: 0,
  infected: false,
  x,
  y,
});

export const initializeGrid = (frozenCount: number, infectedCount: number): (Tile | null)[][] => {
  let grid: (Tile | null)[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      let tile = createRandomTile(x, y);
      // Ensure no initial matches
      while (
        (x >= 2 && grid[y][x - 1]?.type === tile.type && grid[y][x - 2]?.type === tile.type) ||
        (y >= 2 && grid[y - 1][x]?.type === tile.type && grid[y - 2][x]?.type === tile.type)
      ) {
        tile = createRandomTile(x, y);
      }
      grid[y][x] = tile;
    }
  }

  // Add obstacles randomly
  let placedFrozen = 0;
  while (placedFrozen < frozenCount) {
    const rx = Math.floor(Math.random() * GRID_SIZE);
    const ry = Math.floor(Math.random() * GRID_SIZE);
    if (grid[ry][rx] && grid[ry][rx]!.frozen === 0) {
      grid[ry][rx]!.frozen = 2;
      placedFrozen++;
    }
  }

  let placedInfected = 0;
  while (placedInfected < infectedCount) {
    const rx = Math.floor(Math.random() * GRID_SIZE);
    const ry = Math.floor(Math.random() * GRID_SIZE);
    if (grid[ry][rx] && !grid[ry][rx]!.infected && grid[ry][rx]!.frozen === 0) {
      grid[ry][rx]!.infected = true;
      placedInfected++;
    }
  }

  return grid;
};

export const findMatches = (grid: (Tile | null)[][]) => {
  const matches = new Set<string>();
  const specialSpawns: { x: number; y: number; effect: SpecialEffect; type: TileType }[] = [];

  // Horizontal matches
  for (let y = 0; y < GRID_SIZE; y++) {
    let count = 1;
    for (let x = 1; x <= GRID_SIZE; x++) {
      if (x < GRID_SIZE && grid[y][x]?.type === grid[y][x - 1]?.type && grid[y][x] !== null) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 1; k <= count; k++) matches.add(`${y}-${x - k}`);
          
          if (count === 4) {
             specialSpawns.push({ x: x - Math.ceil(count/2), y, effect: SpecialEffect.LINE_V, type: grid[y][x-1]!.type });
          } else if (count >= 5) {
             specialSpawns.push({ x: x - Math.ceil(count/2), y, effect: SpecialEffect.SUPER, type: grid[y][x-1]!.type });
          }
        }
        count = 1;
      }
    }
  }

  // Vertical matches
  for (let x = 0; x < GRID_SIZE; x++) {
    let count = 1;
    for (let y = 1; y <= GRID_SIZE; y++) {
      if (y < GRID_SIZE && grid[y][x]?.type === grid[y - 1][x]?.type && grid[y][x] !== null) {
        count++;
      } else {
        if (count >= 3) {
          for (let k = 1; k <= count; k++) matches.add(`${y - k}-${x}`);
          if (count === 4) {
             specialSpawns.push({ x, y: y - Math.ceil(count/2), effect: SpecialEffect.LINE_H, type: grid[y-1][x]!.type });
          } else if (count >= 5) {
             specialSpawns.push({ x, y: y - Math.ceil(count/2), effect: SpecialEffect.SUPER, type: grid[y-1][x]!.type });
          }
        }
        count = 1;
      }
    }
  }

  return { matches, specialSpawns };
};

export const spreadInfection = (grid: (Tile | null)[][]): (Tile | null)[][] => {
  const newGrid = grid.map(row => row.map(tile => tile ? { ...tile } : null));
  const infectedCoords: [number, number][] = [];

  for (let y = 0; y < GRID_SIZE; y++) {
    for (let x = 0; x < GRID_SIZE; x++) {
      if (newGrid[y][x]?.infected) infectedCoords.push([x, y]);
    }
  }

  infectedCoords.forEach(([x, y]) => {
    const neighbors = [
      [x + 1, y], [x - 1, y], [x, y + 1], [x, y - 1]
    ];
    neighbors.forEach(([nx, ny]) => {
      if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE && newGrid[ny][nx] && !newGrid[ny][nx]!.infected) {
        if (Math.random() < 0.2) { // 20% spread chance per neighbor
          newGrid[ny][nx]!.infected = true;
        }
      }
    });
  });

  return newGrid;
};
