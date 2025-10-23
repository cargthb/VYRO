import { DAMAGE_TYPES } from '../constants.js';
import { clamp } from '../utils/math.js';

/**
 * Resolves combat events produced by player and enemies.
 */
export class CombatResolver {
  constructor() {
    this.effects = [];
  }

  /**
   * Processes queued events from the frame.
   * @param {{player: import('../entities/player.js').Player, enemies: Array<import('../enemies/baseEnemy.js').Enemy>, playerEvents: Array<any>, enemyEvents: Array<any>}} context
   */
  resolve(context) {
    this.effects.length = 0;
    this.handlePlayerEvents(context);
    this.handleEnemyEvents(context);
  }

  /**
   * Resolves player-origin attacks against enemies.
   * @param {{player: import('../entities/player.js').Player, enemies: Array<import('../enemies/baseEnemy.js').Enemy>, playerEvents: Array<any>}} context
   */
  handlePlayerEvents({ player, enemies, playerEvents }) {
    playerEvents.forEach((event) => {
      if (event.damage) {
        enemies.forEach((enemy) => {
          if (!enemy.remove && Math.abs(enemy.position.x - player.position.x) < (event.range ?? 1.2) + 0.5 && Math.abs(enemy.position.y - player.position.y) < 1.5) {
            const knockback = event.knockback ?? 0;
            enemy.takeDamage(event.damage, { knockback });
            this.effects.push({ type: 'hit_spark', position: enemy.position.clone?.() ?? enemy.position, strength: event.damage });
          }
        });
      }
      if (event.radius) {
        enemies.forEach((enemy) => {
          const distance = Math.hypot(enemy.position.x - player.position.x, enemy.position.y - player.position.y);
          if (distance < event.radius) {
            enemy.takeDamage(event.damage, { knockback: (event.radius - distance) });
          }
        });
      }
      if (event.charged) {
        player.energy = clamp(player.energy + event.level * 5, 0, player.maxEnergy);
      }
    });
    playerEvents.length = 0;
  }

  /**
   * Applies enemy events toward the player.
   * @param {{player: import('../entities/player.js').Player, enemies: Array<import('../enemies/baseEnemy.js').Enemy>, enemyEvents: Array<any>}} context
   */
  handleEnemyEvents({ player, enemies, enemyEvents }) {
    enemyEvents.forEach((event) => {
      switch (event.type) {
        case 'enemy_attack':
        case 'berserker_swing':
        case 'shield_bash':
        case 'ground_slam':
        case 'backstab':
        case 'mimic_bite': {
          if (Math.abs(event.enemy.position.x - player.position.x) < 1.5 && Math.abs(event.enemy.position.y - player.position.y) < 2) {
            player.takeDamage(event.damage);
          }
          break;
        }
        case 'explosion': {
          const distance = Math.hypot(event.enemy.position.x - player.position.x, event.enemy.position.y - player.position.y);
          if (distance < (event.radius ?? 3)) {
            player.takeDamage(event.damage);
          }
          break;
        }
        case 'lightning_strike':
        case 'arrow_shot':
        case 'bullet_burst':
        case 'poison_glob':
        case 'spell_cast': {
          this.effects.push({ type: 'projectile', payload: event });
          break;
        }
        case 'summon_minion': {
          this.effects.push({ type: 'summon', payload: event });
          break;
        }
        case 'curse': {
          player.addStatusEffect('curse', { type: 'slow', multiplier: 0.7, remaining: event.duration });
          break;
        }
        case 'life_drain': {
          event.enemy.health = Math.min(event.enemy.definition.stats.maxHp, event.enemy.health + event.heal);
          break;
        }
        default:
          break;
      }
    });
    enemyEvents.length = 0;
  }
}

export const DAMAGE_SOURCE = DAMAGE_TYPES;
