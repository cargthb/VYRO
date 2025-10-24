import { SURFACE_TYPES } from '../constants.js';

/**
 * Symbol legend used to construct level tiles.
 */
const TILE_SYMBOLS = {
  '#': { solid: true, surface: SURFACE_TYPES.NORMAL },
  '~': { solid: true, surface: SURFACE_TYPES.MUD },
  '=': { solid: true, surface: SURFACE_TYPES.ICE },
  '+': { solid: true, surface: SURFACE_TYPES.BOOST },
  '<': { solid: true, surface: SURFACE_TYPES.CONVEYOR_LEFT },
  '>': { solid: true, surface: SURFACE_TYPES.CONVEYOR_RIGHT },
  '^': { solid: true, surface: SURFACE_TYPES.NORMAL, hazard: 'spikes' },
};

/**
 * Collectible legend for parsing layouts.
 */
const COLLECTIBLE_SYMBOLS = {
  o: { type: 'seed' },
  '*': { type: 'essence' },
};

function createGrid(width, height) {
  return Array.from({ length: height }, () => Array.from({ length: width }, () => '.'));
}

function fillRow(grid, row, start, end, symbol) {
  for (let x = start; x < end; x += 1) {
    grid[row][x] = symbol;
  }
}

function carveGap(grid, row, baseRow, start, end) {
  for (let x = start; x < end; x += 1) {
    grid[row][x] = '.';
    grid[baseRow][x] = '.';
  }
}

function placePlatform(grid, startX, length, row, symbol = '#') {
  for (let x = startX; x < startX + length; x += 1) {
    grid[row][x] = symbol;
  }
}

function placeVerticalColumn(grid, x, startRow, endRow, symbol = '#') {
  for (let y = startRow; y <= endRow; y += 1) {
    grid[y][x] = symbol;
  }
}

function addCollectible(grid, x, y, symbol = 'o') {
  grid[y][x] = symbol;
}

function createEmeraldForestIntro() {
  const width = 128;
  const height = 20;
  const grid = createGrid(width, height);
  const floor = height - 2;
  const bedrock = height - 1;

  fillRow(grid, floor, 0, width, '#');
  fillRow(grid, bedrock, 0, width, '#');

  carveGap(grid, floor, bedrock, 10, 14);
  carveGap(grid, floor, bedrock, 34, 38);
  carveGap(grid, floor, bedrock, 74, 77);

  placePlatform(grid, 14, 6, floor, '~');
  placePlatform(grid, 20, 5, floor - 3, '#');
  placePlatform(grid, 26, 4, floor - 5, '#');
  placePlatform(grid, 32, 6, floor, '^');
  placePlatform(grid, 46, 6, floor, '>');
  placePlatform(grid, 60, 4, floor - 4, '#');
  placePlatform(grid, 66, 6, floor - 7, '#');
  placePlatform(grid, 80, 5, floor, '+');
  placePlatform(grid, 92, 4, floor - 4, '#');
  placePlatform(grid, 102, 6, floor - 6, '#');
  placePlatform(grid, 110, 6, floor, '~');

  addCollectible(grid, 22, floor - 4, '*');
  addCollectible(grid, 67, floor - 8, 'o');
  addCollectible(grid, 104, floor - 7, '*');

  return {
    key: 'w1-1',
    name: 'First Steps',
    objective: 'Collect forest cores',
    layout: grid.map((row) => row.join('')),
    spawn: { x: 4, y: floor - 0.1 },
    exit: { x: width - 6, y: floor - 0.1 },
    enemies: [
      { type: 'basic_walker', x: 18, y: floor - 0.1, width: 1.2, height: 1.8 },
      { type: 'charging_bruiser', x: 48, y: floor - 0.1, width: 1.4, height: 1.9 },
      { type: 'floating_eye', x: 68, y: floor - 6.5, width: 1.2, height: 1.2 },
    ],
  };
}

function createEmeraldForestClimb() {
  const width = 96;
  const height = 22;
  const grid = createGrid(width, height);
  const floor = height - 3;
  const bedrock = height - 2;

  fillRow(grid, floor, 0, width, '#');
  fillRow(grid, bedrock, 0, width, '#');
  fillRow(grid, height - 1, 0, width, '#');

  placeVerticalColumn(grid, 28, floor - 6, floor, '#');
  placeVerticalColumn(grid, 29, floor - 6, floor, '#');
  placeVerticalColumn(grid, 62, floor - 8, floor, '#');
  placeVerticalColumn(grid, 63, floor - 8, floor, '#');

  placePlatform(grid, 6, 4, floor - 3, '#');
  placePlatform(grid, 14, 5, floor - 6, '#');
  placePlatform(grid, 24, 4, floor - 9, '#');
  placePlatform(grid, 34, 6, floor - 12, '#');
  placePlatform(grid, 44, 5, floor - 14, '#');
  placePlatform(grid, 52, 6, floor - 16, '#');
  placePlatform(grid, 64, 6, floor - 5, '=');
  placePlatform(grid, 74, 4, floor - 8, '#');
  placePlatform(grid, 82, 6, floor - 11, '#');
  placePlatform(grid, 88, 4, floor - 4, '>');

  addCollectible(grid, 16, floor - 7, 'o');
  addCollectible(grid, 36, floor - 13, '*');
  addCollectible(grid, 54, floor - 17, 'o');
  addCollectible(grid, 83, floor - 12, '*');

  return {
    key: 'w1-2',
    name: 'Canopy Traverse',
    objective: 'Reach the canopy exit',
    layout: grid.map((row) => row.join('')),
    spawn: { x: 6, y: floor - 0.1 },
    exit: { x: 86, y: floor - 11 - 0.1 },
    enemies: [
      { type: 'basic_walker', x: 12, y: floor - 0.1, width: 1.2, height: 1.8 },
      { type: 'swooping_bird', x: 40, y: floor - 10, width: 1.2, height: 1.2 },
      { type: 'charging_bruiser', x: 70, y: floor - 0.1, width: 1.4, height: 1.9 },
    ],
  };
}

export const PREBUILT_LEVELS = {
  'w1-1': createEmeraldForestIntro(),
  'w1-2': createEmeraldForestClimb(),
};

/**
 * Converts a level definition into map and spawn data used by the engine.
 * @param {{ layout: string[], spawn: { x: number, y: number }, exit: { x: number, y: number }, enemies: any[] }} definition
 */
export function buildLevelData(definition) {
  const height = definition.layout.length;
  const width = definition.layout[0].length;
  const tiles = Array.from({ length: height }, () => Array.from({ length: width }, () => ({ solid: false })));
  const collectibles = [];

  for (let y = 0; y < height; y += 1) {
    const row = definition.layout[y];
    for (let x = 0; x < width; x += 1) {
      const symbol = row[x];
      if (COLLECTIBLE_SYMBOLS[symbol]) {
        collectibles.push({ type: COLLECTIBLE_SYMBOLS[symbol].type, x: x + 0.5, y: y + 0.5 });
      }
      const tileDef = TILE_SYMBOLS[symbol];
      if (tileDef) {
        tiles[y][x] = { solid: true, surface: tileDef.surface, hazard: tileDef.hazard };
      } else {
        tiles[y][x] = { solid: false };
      }
    }
  }

  return {
    map: { width, height, tiles },
    spawn: { ...definition.spawn },
    exit: { ...definition.exit },
    enemies: definition.enemies,
    collectibles,
  };
}
