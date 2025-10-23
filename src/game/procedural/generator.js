import { SURFACE_TYPES } from '../constants.js';

/**
 * Generates endless parkour segments influenced by world themes.
 */
export class InfiniteLevelGenerator {
  /**
   * @param {{ themeKey: string, difficulty: number }} config
   */
  constructor(config) {
    this.themeKey = config.themeKey;
    this.difficulty = config.difficulty;
    this.segmentIndex = 0;
    this.height = 20;
  }

  /**
   * Creates a new tile segment.
   * @returns {{width: number, height: number, tiles: Array<Array<{solid: boolean, surface?: string}>>}}
   */
  nextSegment() {
    const width = 60;
    const tiles = Array.from({ length: this.height }, () => Array.from({ length: width }, () => ({ solid: false })));
    const groundLevel = this.height - 2;
    const surface = this.pickSurface();
    for (let x = 0; x < width; x += 1) {
      const gap = Math.random() < 0.05 * (1 + this.difficulty * 0.1);
      if (!gap) {
        tiles[groundLevel][x] = { solid: true, surface };
        tiles[groundLevel + 1][x] = { solid: true, surface };
      }
      if (Math.random() < 0.1) {
        const platformHeight = groundLevel - (2 + Math.floor(Math.random() * 3));
        tiles[platformHeight][x] = { solid: true, surface: SURFACE_TYPES.NORMAL };
      }
      if (Math.random() < 0.05) {
        const high = groundLevel - (4 + Math.floor(Math.random() * 3));
        tiles[high][x] = { solid: true, surface: SURFACE_TYPES.NORMAL };
      }
    }
    this.segmentIndex += 1;
    return { width, height: this.height, tiles };
  }

  /**
   * Chooses a surface modifier based on current world.
   * @returns {SURFACE_TYPES}
   */
  pickSurface() {
    switch (this.themeKey) {
      case 'crystal_caverns':
        return SURFACE_TYPES.ICE;
      case 'scorched_wasteland':
        return SURFACE_TYPES.MUD;
      case 'storm_peaks':
        return Math.random() > 0.5 ? SURFACE_TYPES.NORMAL : SURFACE_TYPES.BOOST;
      case 'abyssal_depths':
        return SURFACE_TYPES.MUD;
      default:
        return SURFACE_TYPES.NORMAL;
    }
  }
}
