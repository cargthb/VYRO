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
   * @param {import('../entities/entity.js').Entity} entity
   * @param {number} delta
   * @returns {{ grounded: boolean, surface: SURFACE_TYPES }}
   */
  resolveEntityCollision(entity, delta = 1) {
    const frameScalar = 0.016 * delta;
    const halfWidth = entity.hitbox.width / 2;
    const halfHeight = entity.hitbox.height;

    const prevX = entity.previousPosition?.x ?? entity.position.x;
    const prevY = entity.previousPosition?.y ?? entity.position.y;
    const targetX = entity.position.x + entity.velocity.x * frameScalar;
    const targetY = entity.position.y + entity.velocity.y * frameScalar;

    let resolvedX = targetX;
    let resolvedY = targetY;
    let grounded = false;
    let surface = null;

    if (targetX > prevX) {
      const right = Math.floor(targetX + halfWidth);
      const top = Math.floor(prevY - halfHeight + 0.1);
      const bottom = Math.floor(prevY + 0.05);
      if (this.getTile(right, bottom).solid || this.getTile(right, top).solid) {
        resolvedX = right - halfWidth - 0.01;
        entity.velocity.x = 0;
      }
    } else if (targetX < prevX) {
      const left = Math.floor(targetX - halfWidth);
      const top = Math.floor(prevY - halfHeight + 0.1);
      const bottom = Math.floor(prevY + 0.05);
      if (this.getTile(left, bottom).solid || this.getTile(left, top).solid) {
        resolvedX = left + 1 + halfWidth + 0.01;
        entity.velocity.x = 0;
      }
    }

    const currentX = clamp(resolvedX, -Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    const nextBottom = Math.floor(targetY + 0.1);
    const nextTop = Math.floor(targetY - halfHeight);
    const sampleLeft = Math.floor(currentX - halfWidth + 0.05);
    const sampleRight = Math.floor(currentX + halfWidth - 0.05);

    if (targetY > prevY) {
      const belowLeft = this.getTile(sampleLeft, nextBottom);
      const belowRight = this.getTile(sampleRight, nextBottom);
      if (belowLeft.solid || belowRight.solid) {
        resolvedY = nextBottom - 0.01;
        entity.velocity.y = 0;
        grounded = true;
        surface = belowLeft.surface || belowRight.surface || SURFACE_TYPES.NORMAL;
      }
    } else if (targetY < prevY) {
      const aboveLeft = this.getTile(sampleLeft, nextTop);
      const aboveRight = this.getTile(sampleRight, nextTop);
      if (aboveLeft.solid || aboveRight.solid) {
        resolvedY = nextTop + 1 + halfHeight + 0.01;
        entity.velocity.y = Math.max(0, entity.velocity.y);
      }
    }

    entity.position.x = resolvedX;
    entity.position.y = resolvedY;
    return { grounded, surface };
  }

  /**
   * Resolves collision for the player and applies ground state feedback.
   * @param {import('../entities/player.js').Player} player
   * @param {number} delta
   */
  resolvePlayerCollision(player, delta = 1) {
    const result = this.resolveEntityCollision(player, delta);
    const surface = result.surface ?? player.surface ?? SURFACE_TYPES.NORMAL;
    player.setGrounded(result.grounded, surface);
  }

  /**
   * Returns hazard type at world position if any.
   * @param {number} x
   * @param {number} y
   * @returns {string | null}
   */
  getHazard(x, y) {
    const tile = this.getTile(Math.floor(x), Math.floor(y + 0.05));
    return tile.hazard ?? null;
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
