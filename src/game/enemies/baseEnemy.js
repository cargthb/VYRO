import { Entity } from '../entities/entity.js';
import { ENEMY_STATES } from '../constants.js';
import { clamp } from '../utils/math.js';

/**
 * Base enemy implementing finite state machine.
 */
export class Enemy extends Entity {
  /**
   * @param {{
   *  x: number,
   *  y: number,
   *  width: number,
   *  height: number,
   *  definition: import('./enemyTypes.js').EnemyDefinition,
   * }} config
   */
  constructor(config) {
    super(config);
    this.definition = config.definition;
    this.state = ENEMY_STATES.IDLE;
    this.health = this.definition.stats.maxHp;
    this.attackCooldown = 0;
    this.stateTimer = 0;
  }

  /**
   * Computes squared distance to player.
   * @param {import('../entities/player.js').Player} player
   */
  distanceSq(player) {
    const dx = player.position.x - this.position.x;
    const dy = player.position.y - this.position.y;
    return dx * dx + dy * dy;
  }

  /**
   * Called each frame with context.
   * @param {{player: import('../entities/player.js').Player, tileMap: import('../levels/tilemap.js').TileMap, delta: number, events: Array<any>}} context
   */
  update(context) {
    if (this.health <= 0) {
      this.state = ENEMY_STATES.DEATH;
    }

    if (this.state === ENEMY_STATES.DEATH) {
      this.remove = true;
      context.events.push({ type: 'enemy_defeated', enemy: this });
      return;
    }

    if (this.attackCooldown > 0) {
      this.attackCooldown -= 1;
    }

    const brain = this.definition.behavior;
    const handlers = {
      [ENEMY_STATES.IDLE]: brain.onIdle,
      [ENEMY_STATES.PATROL]: brain.onPatrol,
      [ENEMY_STATES.ALERT]: brain.onAlert,
      [ENEMY_STATES.CHASE]: brain.onChase,
      [ENEMY_STATES.ATTACK]: brain.onAttack,
      [ENEMY_STATES.HURT]: brain.onHurt,
    };

    const handler = handlers[this.state];
    if (handler) {
      handler({ enemy: this, ...context });
    }

    if (this.stateTimer > 0) {
      this.stateTimer -= 1;
    }
  }

  /**
   * Applies damage to enemy.
   * @param {number} amount
   * @param {{knockback?: number}} [options]
   */
  takeDamage(amount, options = {}) {
    this.health = clamp(this.health - amount, 0, this.definition.stats.maxHp);
    if (options.knockback) {
      this.velocity.x += options.knockback * -Math.sign(this.facing);
    }
    if (this.health <= 0) {
      this.state = ENEMY_STATES.DEATH;
    } else {
      this.state = ENEMY_STATES.HURT;
      this.stateTimer = 20;
    }
  }

  /**
   * Requests state change respecting priority.
   * @param {string} next
   */
  setState(next) {
    if (this.state === ENEMY_STATES.HURT && this.stateTimer > 0) {
      return;
    }
    this.state = next;
  }
}
