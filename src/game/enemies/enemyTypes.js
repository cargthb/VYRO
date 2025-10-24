import { ENEMY_STATES } from '../constants.js';
import { clamp } from '../utils/math.js';

/**
 * @typedef {ReturnType<typeof createEnemyDefinition>} EnemyDefinition
 */

function createEnemyDefinition(key, name, stats, behavior, description) {
  return { key, name, stats, behavior, description };
}

function facePlayer(enemy, player) {
  enemy.facing = player.position.x < enemy.position.x ? -1 : 1;
}

function distance(enemy, player) {
  const dx = player.position.x - enemy.position.x;
  const dy = player.position.y - enemy.position.y;
  return Math.hypot(dx, dy);
}

function moveTowards(enemy, targetX, speed) {
  const direction = targetX > enemy.position.x ? 1 : -1;
  enemy.velocity.x = clamp(enemy.velocity.x + direction * 0.1, -speed, speed);
  enemy.position.x += enemy.velocity.x * 0.016;
}

function simpleAttack(enemy, context, damage, range) {
  if (enemy.attackCooldown === 0 && distance(enemy, context.player) < range) {
    context.events.push({ type: 'enemy_attack', enemy, damage });
    enemy.attackCooldown = enemy.definition.stats.framesBetweenAttacks;
  }
}

const createPatrollerBehavior = (config) => ({
  onIdle: ({ enemy }) => {
    enemy.setState(ENEMY_STATES.PATROL);
    enemy.stateTimer = 30;
  },
  onPatrol: ({ enemy, player }) => {
    enemy.velocity.x = Math.sin(performance.now() / 500 + enemy.position.y) * config.speed * 0.016;
    enemy.position.x += enemy.velocity.x;
    if (distance(enemy, player) < config.detectRange) {
      enemy.setState(ENEMY_STATES.ALERT);
      enemy.stateTimer = 30;
    }
  },
  onAlert: ({ enemy, player }) => {
    facePlayer(enemy, player);
    if (enemy.stateTimer <= 0) {
      enemy.setState(ENEMY_STATES.CHASE);
    }
  },
  onChase: ({ enemy, player }) => {
    moveTowards(enemy, player.position.x, config.chaseSpeed);
    if (distance(enemy, player) < config.attackRange) {
      enemy.setState(ENEMY_STATES.ATTACK);
    }
  },
  onAttack: ({ enemy, player, events }) => {
    facePlayer(enemy, player);
    simpleAttack(enemy, { player, events }, config.damage, config.attackRange);
    if (enemy.attackCooldown > 0) {
      enemy.setState(ENEMY_STATES.CHASE);
    }
  },
  onHurt: ({ enemy }) => {
    if (enemy.stateTimer <= 0) {
      enemy.setState(ENEMY_STATES.CHASE);
    }
  },
});

/**
 * Enemy definitions with descriptive data for the encyclopedia.
 */
export const ENEMY_DEFINITIONS = {
  basic_walker: createEnemyDefinition(
    'basic_walker',
    'Basic Walker',
    {
      maxHp: 20,
      contactDamage: 5,
      framesBetweenAttacks: 45,
    },
    createPatrollerBehavior({ speed: 2, detectRange: 6, chaseSpeed: 2, attackRange: 1.2, damage: 5 }),
    'A simple ground patroller that relies on contact damage. Ideal for teaching basic combat and stomp mechanics.',
  ),
  charging_bruiser: createEnemyDefinition(
    'charging_bruiser',
    'Charging Bruiser',
    {
      maxHp: 50,
      contactDamage: 15,
      framesBetweenAttacks: 120,
    },
    {
      onIdle: ({ enemy }) => {
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onPatrol: ({ enemy, player }) => {
        if (distance(enemy, player) < 8) {
          enemy.setState(ENEMY_STATES.ALERT);
          enemy.stateTimer = 60;
        }
      },
      onAlert: ({ enemy, player }) => {
        facePlayer(enemy, player);
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.ATTACK);
          enemy.attackCooldown = 0;
        }
      },
      onChase: ({ enemy }) => {
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onAttack: ({ enemy, player, events }) => {
        facePlayer(enemy, player);
        enemy.velocity.x = enemy.facing * 10 * 0.016;
        enemy.position.x += enemy.velocity.x;
        if (distance(enemy, player) < 1.5) {
          events.push({ type: 'enemy_attack', enemy, damage: 15, style: 'charge' });
          enemy.setState(ENEMY_STATES.HURT);
          enemy.stateTimer = 120;
        }
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'A heavy hitter that charges across the arena once alerted. Punish it when it slams into walls.',
  ),
  assassin: createEnemyDefinition(
    'assassin',
    'Assassin',
    {
      maxHp: 25,
      contactDamage: 20,
      framesBetweenAttacks: 90,
    },
    {
      onIdle: ({ enemy }) => {
        enemy.opacity = 0.3;
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onPatrol: ({ enemy, player }) => {
        if (distance(enemy, player) < 2) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        facePlayer(enemy, player);
        enemy.position.x += enemy.facing * 6 * 0.016;
        if (distance(enemy, player) < 1) {
          events.push({ type: 'enemy_attack', enemy, damage: 20, style: 'dash' });
          enemy.attackCooldown = 120;
        }
        if (enemy.attackCooldown > 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
      onHurt: ({ enemy }) => {
        enemy.opacity = 1;
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'A stealth specialist that dashes in for heavy backstab damage. Listen for audio cues and watch for shimmering outlines.',
  ),
  armored_knight: createEnemyDefinition(
    'armored_knight',
    'Armored Knight',
    {
      maxHp: 80,
      contactDamage: 10,
      framesBetweenAttacks: 90,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy, player }) => {
        moveTowards(enemy, player.position.x, 1.5);
        if (distance(enemy, player) < 2.5) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAlert: () => undefined,
      onChase: ({ enemy, player }) => moveTowards(enemy, player.position.x, 1.5),
      onAttack: ({ enemy, player, events }) => {
        if (distance(enemy, player) < 2) {
          events.push({ type: 'enemy_attack', enemy, damage: 15, style: 'shield_bash' });
        }
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'Heavily armored defenders immune to knockback. Attack from behind or use high-impact strikes to break guard.',
  ),
  burrower: createEnemyDefinition(
    'burrower',
    'Burrower',
    {
      maxHp: 30,
      contactDamage: 12,
      framesBetweenAttacks: 120,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy, player }) => {
        if (distance(enemy, player) < 8) {
          enemy.setState(ENEMY_STATES.ALERT);
          enemy.stateTimer = 30;
        }
      },
      onAlert: ({ enemy, events }) => {
        if (enemy.stateTimer === 29) {
          events.push({ type: 'warning', enemy, message: 'Ground rumble!' });
        }
        if (enemy.stateTimer <= 0) {
          enemy.position.x += enemy.facing * 3;
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        if (distance(enemy, player) < 1.5) {
          events.push({ type: 'enemy_attack', enemy, damage: 12, style: 'burrow' });
        }
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'Ambushers that emerge beneath the player. Watch the ground for tremors and reposition quickly.',
  ),
  pack_hunter: createEnemyDefinition(
    'pack_hunter',
    'Pack Hunter',
    {
      maxHp: 15,
      contactDamage: 8,
      framesBetweenAttacks: 45,
    },
    createPatrollerBehavior({ speed: 5.5, detectRange: 10, chaseSpeed: 5.5, attackRange: 1.3, damage: 8 }),
    'Fast predators that attack in coordinated packs. Separate them or use area attacks to avoid getting surrounded.',
  ),
  swooping_bird: createEnemyDefinition(
    'swooping_bird',
    'Swooping Bird',
    {
      maxHp: 15,
      contactDamage: 8,
      framesBetweenAttacks: 120,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy }) => {
        enemy.position.x += Math.cos(performance.now() / 500) * 0.05;
        enemy.position.y += Math.sin(performance.now() / 500) * 0.05;
      },
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        enemy.position.x += (player.position.x - enemy.position.x) * 0.2;
        enemy.position.y += (player.position.y - enemy.position.y) * 0.2;
        if (distance(enemy, player) < 1) {
          events.push({ type: 'enemy_attack', enemy, damage: 8, style: 'dive' });
        }
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'Aerial threat that swoops in sine-wave patterns before diving at the player when aligned.',
  ),
  floating_eye: createEnemyDefinition(
    'floating_eye',
    'Floating Eye',
    {
      maxHp: 20,
      contactDamage: 0,
      framesBetweenAttacks: 120,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy, player }) => {
        enemy.position.x += (player.position.x - enemy.position.x) * 0.01;
        enemy.position.y += Math.sin(performance.now() / 800) * 0.03;
        if (distance(enemy, player) < 7) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'projectile_spawn', enemy, payload: { speed: 4, direction: Math.atan2(player.position.y - enemy.position.y, player.position.x - enemy.position.x) } });
        enemy.attackCooldown = 120;
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'A ranged sentinel that peppers the arena with energy bolts while floating out of reach.',
  ),
  bomber_drone: createEnemyDefinition(
    'bomber_drone',
    'Bomber Drone',
    {
      maxHp: 25,
      contactDamage: 0,
      framesBetweenAttacks: 1,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.CHASE),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: ({ enemy, player }) => {
        enemy.position.x += (player.position.x - enemy.position.x) * 0.04;
        enemy.position.y += (player.position.y - enemy.position.y) * 0.04;
        if (distance(enemy, player) < 2) {
          enemy.setState(ENEMY_STATES.ATTACK);
          enemy.stateTimer = 120;
        }
      },
      onAttack: ({ enemy, player, events }) => {
        enemy.stateTimer -= 1;
        events.push({ type: 'countdown', enemy, remaining: enemy.stateTimer });
        if (enemy.stateTimer <= 0 || distance(enemy, player) < 1.5) {
          events.push({ type: 'explosion', enemy, damage: 20, radius: 4 });
          enemy.health = 0;
          enemy.setState(ENEMY_STATES.DEATH);
        }
      },
      onHurt: ({ enemy }) => {
        enemy.state = ENEMY_STATES.DEATH;
      },
    },
    'Explosive drones that detonate when close. Shoot them before they trigger.',
  ),
  lightning_cloud: createEnemyDefinition(
    'lightning_cloud',
    'Lightning Cloud',
    {
      maxHp: 40,
      contactDamage: 0,
      framesBetweenAttacks: 240,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy, player }) => {
        enemy.position.x = player.position.x;
        enemy.position.y += Math.sin(performance.now() / 600) * 0.02;
        if (enemy.attackCooldown === 0) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'lightning_strike', enemy, targetX: player.position.x, damage: 15 });
        enemy.attackCooldown = 240;
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'Storm entities that track overhead before unleashing vertical lightning strikes.',
  ),
  bat_swarm: createEnemyDefinition(
    'bat_swarm',
    'Bat Swarm',
    {
      maxHp: 3,
      contactDamage: 5,
      framesBetweenAttacks: 30,
    },
    createPatrollerBehavior({ speed: 6, detectRange: 12, chaseSpeed: 6, attackRange: 1, damage: 5 }),
    'Flocks of small bats that split and dive at the player. Dispatch quickly with spinning attacks or dashes.',
  ),
  gargoyle_guardian: createEnemyDefinition(
    'gargoyle_guardian',
    'Gargoyle Guardian',
    {
      maxHp: 60,
      contactDamage: 12,
      framesBetweenAttacks: 180,
    },
    {
      onIdle: ({ enemy }) => {
        enemy.stoneForm = true;
        enemy.setState(ENEMY_STATES.ALERT);
        enemy.stateTimer = 120;
      },
      onPatrol: () => undefined,
      onAlert: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.stoneForm = false;
          enemy.setState(ENEMY_STATES.CHASE);
        }
      },
      onChase: ({ enemy }) => {
        enemy.position.x += Math.sin(performance.now() / 600) * 0.08;
        enemy.position.y += Math.cos(performance.now() / 600) * 0.08;
        if (enemy.attackCooldown === 0) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAttack: ({ enemy, player, events }) => {
        if (Math.random() > 0.5) {
          events.push({ type: 'dive_attack', enemy, target: player, damage: 15 });
        } else {
          events.push({ type: 'petrify_breath', enemy, cone: { angle: Math.atan2(player.position.y - enemy.position.y, player.position.x - enemy.position.x), range: 4 }, slow: 0.5 });
        }
        enemy.attackCooldown = 300;
        enemy.setState(ENEMY_STATES.CHASE);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.CHASE);
        }
      },
    },
    'Stone sentries that animate into lethal aerial threats once the player approaches.',
  ),
  archer: createEnemyDefinition(
    'archer',
    'Archer',
    {
      maxHp: 25,
      contactDamage: 12,
      framesBetweenAttacks: 180,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy, player }) => {
        facePlayer(enemy, player);
        if (distance(enemy, player) < 15) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'arrow_shot', enemy, target: player.position.clone?.() ?? { ...player.position }, speed: 8 });
        enemy.attackCooldown = 180;
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'Long-range snipers that telegraph shots with laser sights before firing deadly arrows.',
  ),
  turret: createEnemyDefinition(
    'turret',
    'Turret',
    {
      maxHp: 40,
      contactDamage: 8,
      framesBetweenAttacks: 120,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.ATTACK),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'bullet_burst', enemy, target: player.position.clone?.() ?? { ...player.position }, count: 3, spread: 0.2 });
        enemy.attackCooldown = 120;
      },
      onHurt: ({ enemy }) => {
        if (enemy.health < enemy.definition.stats.maxHp / 2) {
          enemy.attackCooldown = 30;
        }
      },
    },
    'Stationary defenses that fire bursts before overheating. Aim for the glowing core when active.',
  ),
  mage: createEnemyDefinition(
    'mage',
    'Mage',
    {
      maxHp: 30,
      contactDamage: 10,
      framesBetweenAttacks: 150,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.CHASE),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: ({ enemy, player }) => {
        const desired = player.position.x + (player.facing === 1 ? -6 : 6);
        moveTowards(enemy, desired, 1.5);
        if (distance(enemy, player) < 12) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAttack: ({ enemy, events }) => {
        const spell = ['fireball', 'ice_shard', 'lightning_chain'][Math.floor(Math.random() * 3)];
        events.push({ type: 'spell_cast', enemy, spell });
        enemy.attackCooldown = 150;
        enemy.setState(ENEMY_STATES.CHASE);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.CHASE);
        }
      },
    },
    'Caster that cycles elemental spells and teleports when threatened. Interrupt the cast to avoid devastation.',
  ),
  mortar: createEnemyDefinition(
    'mortar',
    'Mortar Artillery',
    {
      maxHp: 50,
      contactDamage: 0,
      framesBetweenAttacks: 300,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.ATTACK),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'mortar_shell', enemy, target: { x: player.position.x, y: player.position.y }, fuse: 120 });
        enemy.attackCooldown = 300;
      },
      onHurt: ({ enemy }) => {
        if (enemy.health < enemy.definition.stats.maxHp / 2) {
          enemy.attackCooldown = 180;
        }
      },
    },
    'Long-range artillery launching arcing explosives. Keep moving to dodge targeted blasts.',
  ),
  poison_spitter: createEnemyDefinition(
    'poison_spitter',
    'Poison Spitter',
    {
      maxHp: 20,
      contactDamage: 5,
      framesBetweenAttacks: 180,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.ATTACK),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'poison_glob', enemy, target: player.position.clone?.() ?? { ...player.position }, puddleDuration: 480 });
        enemy.attackCooldown = 180;
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
    },
    'Toxic artillery that carpets the ground with damaging puddles. Stay mobile and strike from afar.',
  ),
  shadow_stalker: createEnemyDefinition(
    'shadow_stalker',
    'Shadow Stalker',
    {
      maxHp: 100,
      contactDamage: 25,
      framesBetweenAttacks: 150,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.CHASE),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: ({ enemy, player }) => {
        if (performance.now() / 1000 % 4 < 0.1) {
          enemy.position.x = player.position.x - 1;
          enemy.position.y = player.position.y;
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'backstab', enemy, damage: 25 });
        enemy.setState(ENEMY_STATES.PATROL);
        enemy.stateTimer = 60;
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.CHASE);
        }
      },
    },
    'Teleporting elite that strikes from the shadows with deadly precision. Parry to stun.',
  ),
  shielded_paladin: createEnemyDefinition(
    'shielded_paladin',
    'Shielded Paladin',
    {
      maxHp: 120,
      contactDamage: 15,
      framesBetweenAttacks: 120,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy, player }) => {
        moveTowards(enemy, player.position.x, 1);
        if (distance(enemy, player) < 3) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAlert: () => undefined,
      onChase: ({ enemy, player }) => moveTowards(enemy, player.position.x, 1),
      onAttack: ({ enemy, player, events }) => {
        const attack = Math.random() > 0.5 ? 'shield_bash' : 'ground_slam';
        events.push({ type: attack, enemy, damage: attack === 'shield_bash' ? 20 : 25, radius: attack === 'ground_slam' ? 4 : 0 });
        enemy.attackCooldown = 150;
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        enemy.raiseShield = true;
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'A fortress on legs. Break through the shield or strike from behind after baiting attacks.',
  ),
  berserker: createEnemyDefinition(
    'berserker',
    'Berserker',
    {
      maxHp: 80,
      contactDamage: 18,
      framesBetweenAttacks: 60,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.CHASE),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: ({ enemy, player }) => {
        const enraged = enemy.health < enemy.definition.stats.maxHp / 2;
        moveTowards(enemy, player.position.x, enraged ? 8 : 6);
        if (distance(enemy, player) < 2) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAttack: ({ enemy, player, events }) => {
        const enraged = enemy.health < enemy.definition.stats.maxHp / 2;
        const damage = enraged ? 30 : 18;
        events.push({ type: 'berserker_swing', enemy, damage });
        enemy.attackCooldown = enraged ? 30 : 60;
        enemy.setState(ENEMY_STATES.CHASE);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.CHASE);
        }
      },
    },
    'An aggressive melee elite that grows faster and stronger as it weakens. Stay on the move.',
  ),
  necromancer: createEnemyDefinition(
    'necromancer',
    'Necromancer',
    {
      maxHp: 60,
      contactDamage: 10,
      framesBetweenAttacks: 180,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.ATTACK),
      onPatrol: () => undefined,
      onAlert: () => undefined,
      onChase: () => undefined,
      onAttack: ({ enemy, events }) => {
        const action = Math.random();
        if (action < 0.5) {
          events.push({ type: 'summon_minion', enemy, amount: 2 });
        } else if (action < 0.8) {
          events.push({ type: 'life_drain', enemy, heal: 10 });
        } else {
          events.push({ type: 'curse', enemy, duration: 300 });
        }
        enemy.attackCooldown = 180;
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
    },
    'Dark summoner commanding skeletal hordes. Eliminate minions quickly to expose the caster.',
  ),
  mimic: createEnemyDefinition(
    'mimic',
    'Mimic',
    {
      maxHp: 70,
      contactDamage: 20,
      framesBetweenAttacks: 90,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.ALERT),
      onPatrol: () => undefined,
      onAlert: ({ enemy, player }) => {
        if (distance(enemy, player) < 1) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onChase: () => undefined,
      onAttack: ({ enemy, player, events }) => {
        events.push({ type: 'mimic_bite', enemy, damage: 20, grab: true });
        enemy.attackCooldown = 180;
        enemy.setState(ENEMY_STATES.CHASE);
      },
      onHurt: ({ enemy }) => {
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.CHASE);
        }
      },
    },
    'Treasure chest impostors that pounce when disturbed. Attack from a distance to reveal their true form.',
  ),
  crystal_golem: createEnemyDefinition(
    'crystal_golem',
    'Crystal Golem',
    {
      maxHp: 150,
      contactDamage: 15,
      framesBetweenAttacks: 150,
    },
    {
      onIdle: ({ enemy }) => enemy.setState(ENEMY_STATES.PATROL),
      onPatrol: ({ enemy, player }) => {
        moveTowards(enemy, player.position.x, 1.2);
        if (distance(enemy, player) < 3) {
          enemy.setState(ENEMY_STATES.ATTACK);
        }
      },
      onAlert: () => undefined,
      onChase: ({ enemy, player }) => moveTowards(enemy, player.position.x, 1.2),
      onAttack: ({ enemy, events }) => {
        const abilities = ['fire_wave', 'ice_field', 'lightning_bolt'];
        events.push({ type: abilities[Math.floor(Math.random() * abilities.length)], enemy });
        enemy.attackCooldown = 150;
        enemy.setState(ENEMY_STATES.PATROL);
      },
      onHurt: ({ enemy }) => {
        enemy.vulnerable = true;
        if (enemy.stateTimer <= 0) {
          enemy.setState(ENEMY_STATES.PATROL);
        }
      },
    },
    'Elemental juggernaut protected by crystal cores. Destroy weak points to strip abilities.',
  ),
};

export const ENEMY_ORDER = Object.keys(ENEMY_DEFINITIONS);
