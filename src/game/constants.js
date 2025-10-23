export const MOVEMENT_CONSTANTS = Object.freeze({
  WALK_SPEED: 3.5,
  RUN_SPEED: 7.0,
  MAX_FALL_SPEED: 15.0,
  JUMP_FORCE: 12.0,
  JUMP_HOLD_BONUS: 0.4,
  MAX_JUMP_HOLD_FRAMES: 10,
  GRAVITY: 0.6,
  AIR_CONTROL: 0.75,
  GROUND_FRICTION: 0.85,
  AIR_FRICTION: 0.98,
  SLIDE_FRICTION: 0.95,
  ICE_FRICTION: 0.995,
  WALL_SLIDE_SPEED: 2.0,
  WALL_JUMP_HORIZONTAL: 8.0,
  WALL_JUMP_VERTICAL: 11.0,
  DASH_SPEED: 15.0,
  DASH_DURATION_FRAMES: 12,
  DASH_COOLDOWN_FRAMES: 60,
  COYOTE_FRAMES: 6,
  JUMP_BUFFER_FRAMES: 8,
  TRIPLE_JUMP_WINDOW_FRAMES: 30,
});

export const PLAYER_DEFAULTS = Object.freeze({
  width: 0.9,
  height: 1.8,
  crouchHeight: 0.9,
  maxHp: 100,
  maxEnergy: 100,
  energyRegeneration: 2,
  dashCost: 25,
  airDashCost: 30,
  wallClimbCostPerFrame: 1,
  sprintCostPerFrame: 0.5,
  statusDuration: 600,
});

export const SURFACE_TYPES = Object.freeze({
  NORMAL: 'normal',
  ICE: 'ice',
  MUD: 'mud',
  BOOST: 'boost',
  CONVEYOR_LEFT: 'conveyor_left',
  CONVEYOR_RIGHT: 'conveyor_right',
});

export const SURFACE_MODIFIERS = Object.freeze({
  [SURFACE_TYPES.NORMAL]: { friction: MOVEMENT_CONSTANTS.GROUND_FRICTION, speedMultiplier: 1 },
  [SURFACE_TYPES.ICE]: { friction: MOVEMENT_CONSTANTS.ICE_FRICTION, speedMultiplier: 1 },
  [SURFACE_TYPES.MUD]: { friction: MOVEMENT_CONSTANTS.GROUND_FRICTION, speedMultiplier: 0.7 },
  [SURFACE_TYPES.BOOST]: { friction: MOVEMENT_CONSTANTS.GROUND_FRICTION, speedMultiplier: 1.5 },
  [SURFACE_TYPES.CONVEYOR_LEFT]: { friction: MOVEMENT_CONSTANTS.GROUND_FRICTION, speedMultiplier: 1, conveyor: -2 },
  [SURFACE_TYPES.CONVEYOR_RIGHT]: { friction: MOVEMENT_CONSTANTS.GROUND_FRICTION, speedMultiplier: 1, conveyor: 2 },
});

export const PLAYER_ABILITIES = Object.freeze({
  DOUBLE_JUMP: 'double_jump',
  AIR_DASH: 'air_dash',
  WALL_CLIMB: 'wall_climb',
  SHADOW_CLONE: 'shadow_clone',
  TIME_SLOW: 'time_slow',
  SHIELD_BARRIER: 'shield_barrier',
  TELEPORT_DASH: 'teleport_dash',
  GROUND_SLAM: 'ground_slam',
  HEALING_AURA: 'healing_aura',
  BOOMERANG: 'boomerang',
  GRENADE: 'grenade',
  GRAPPLING_HOOK: 'grappling_hook',
});

export const DAMAGE_TYPES = Object.freeze({
  MELEE: 'melee',
  PROJECTILE: 'projectile',
  EXPLOSIVE: 'explosive',
  POISON: 'poison',
  ELECTRIC: 'electric',
  FIRE: 'fire',
  ICE: 'ice',
});

export const ENEMY_STATES = Object.freeze({
  IDLE: 'idle',
  PATROL: 'patrol',
  ALERT: 'alert',
  CHASE: 'chase',
  ATTACK: 'attack',
  HURT: 'hurt',
  DEATH: 'death',
});

export const PLAYER_ANIMATIONS = Object.freeze([
  'idle',
  'walk',
  'run',
  'jump_rise',
  'jump_peak',
  'jump_fall',
  'land',
  'crouch',
  'slide',
  'dash',
  'wall_slide',
  'ledge_grab',
  'hurt',
  'death',
  'attack_light',
  'attack_heavy',
  'attack_air',
  'attack_dash',
  'charge',
  'ability',
]);

export const WORLD_KEYS = Object.freeze([
  'emerald_forest',
  'crystal_caverns',
  'scorched_wasteland',
  'storm_peaks',
  'abyssal_depths',
]);

export const TILE_SIZE = 48;
