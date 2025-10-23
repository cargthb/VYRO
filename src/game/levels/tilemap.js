import { SURFACE_TYPES, TILE_SIZE } from '../constants.js';
import { clamp } from '../utils/math.js';

/**
 * Represents a tile map storing collision and surface data.
 */
export class TileMap {
  /**
   * @param {{width: number, height: number, tiles: Array<Array<{solid: boolean, surface?: string}>>}} definition
   */
  constructor(definition) {
    this.width = definition.width;
    this.height = definition.height;
    this.tiles = definition.tiles;
  }

  /**
   * Retrieves tile data.
   * @param {number} x
   * @param {number} y
   * @returns {{solid: boolean, surface?: string}}
   */
  getTile(x, y) {
    if (x < 0 || y < 0 || x >= this.width || y >= this.height) {
      return { solid: false };
    }
    return this.tiles[y]?.[x] ?? { solid: false };
  }

  /**
   * Resolves collision for an entity.
   * @param {import('../entities/player.js').Player} player
   */
  resolvePlayerCollision(player, delta = 1) {
    const frameScalar = 0.016 * delta;
    const nextX = player.position.x + player.velocity.x * frameScalar;
    const nextY = player.position.y + player.velocity.y * frameScalar;

    const halfWidth = player.hitbox.width / 2;
    const halfHeight = player.hitbox.height;

    let grounded = false;
    let surface = SURFACE_TYPES.NORMAL;

    // Horizontal collision
    const left = Math.floor(nextX - halfWidth);
    const right = Math.floor(nextX + halfWidth);
    const bottom = Math.floor(player.position.y + 0.05);
    const top = Math.floor(player.position.y - halfHeight + 1);

    if (player.velocity.x > 0) {
      if (this.getTile(right, bottom).solid || this.getTile(right, top).solid) {
        player.velocity.x = 0;
        player.position.x = right - halfWidth - 0.01;
      } else {
        player.position.x = nextX;
      }
    } else if (player.velocity.x < 0) {
      if (this.getTile(left, bottom).solid || this.getTile(left, top).solid) {
        player.velocity.x = 0;
        player.position.x = left + 1 + halfWidth + 0.01;
      } else {
        player.position.x = nextX;
      }
    } else {
      player.position.x = nextX;
    }

    const nextBottom = Math.floor(nextY + 0.1);
    const nextTop = Math.floor(nextY - halfHeight);

    if (player.velocity.y > 0) {
      const solidBelowLeft = this.getTile(Math.floor(player.position.x - halfWidth), nextBottom);
      const solidBelowRight = this.getTile(Math.floor(player.position.x + halfWidth), nextBottom);
      if (solidBelowLeft.solid || solidBelowRight.solid) {
        player.velocity.y = 0;
        player.position.y = nextBottom - 0.01;
        grounded = true;
        surface = solidBelowLeft.surface || solidBelowRight.surface || SURFACE_TYPES.NORMAL;
      } else {
        player.position.y = nextY;
      }
    } else if (player.velocity.y < 0) {
      const solidAboveLeft = this.getTile(Math.floor(player.position.x - halfWidth), nextTop);
      const solidAboveRight = this.getTile(Math.floor(player.position.x + halfWidth), nextTop);
      if (solidAboveLeft.solid || solidAboveRight.solid) {
        player.velocity.y = clamp(player.velocity.y, 0, player.velocity.y);
      } else {
        player.position.y = nextY;
      }
    } else {
      player.position.y = nextY;
    }

    player.setGrounded(grounded, surface);
  }

  /**
   * Converts tile coordinates to world position.
   * @param {number} x
   * @param {number} y
   * @returns {{x: number, y: number}}
   */
  tileToWorld(x, y) {
    return { x: x * TILE_SIZE, y: y * TILE_SIZE };
  }
}
