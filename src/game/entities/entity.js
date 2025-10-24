import { Vec2 } from '../utils/math.js';
import { TILE_SIZE } from '../constants.js';

/**
 * Base entity class shared by player and enemies.
 */
export class Entity {
  /**
   * @param {{x: number, y: number, width: number, height: number}} config
   */
  constructor(config) {
    this.position = new Vec2(config.x, config.y);
    this.velocity = new Vec2();
    this.acceleration = new Vec2();
    this.width = config.width;
    this.height = config.height;
    this.hitbox = { width: this.width, height: this.height };
    this.facing = 1;
    this.grounded = false;
    this.wallSliding = false;
    this.ledgeGrabbing = false;
    this.ceilingHanging = false;
    this.animationState = 'idle';
    this.remove = false;
    this.previousPosition = this.position.clone();
  }

  /**
   * Stores the current world position for subsequent collision resolution.
   */
  storePreviousPosition() {
    this.previousPosition.set(this.position.x, this.position.y);
  }

  /**
   * Returns pixel aligned rectangle for rendering and collision.
   * @returns {{x: number, y: number, width: number, height: number}}
   */
  getAabb() {
    return {
      x: this.position.x * TILE_SIZE,
      y: this.position.y * TILE_SIZE,
      width: this.hitbox.width * TILE_SIZE,
      height: this.hitbox.height * TILE_SIZE,
    };
  }
}
