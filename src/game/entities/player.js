import { Entity } from './entity.js';
import { MOVEMENT_CONSTANTS, PLAYER_ABILITIES, PLAYER_DEFAULTS, SURFACE_MODIFIERS, SURFACE_TYPES } from '../constants.js';
import { Vec2, clamp } from '../utils/math.js';

/**
 * Tracks combo attack progress.
 */
class ComboTracker {
  constructor() {
    this.sequence = 0;
    this.timer = 0;
  }

  /**
   * Registers attack chain inputs.
   * @returns {number}
   */
  next() {
    this.sequence = (this.sequence % 3) + 1;
    this.timer = 20;
    return this.sequence;
  }

  /**
   * Updates timers per frame.
   */
  tick() {
    if (this.timer > 0) {
      this.timer -= 1;
    }
    if (this.timer === 0) {
      this.sequence = 0;
    }
  }
}

/**
 * Represents the player character with comprehensive movement and combat systems.
 */
export class Player extends Entity {
  constructor() {
    super({ x: 4, y: 2, width: PLAYER_DEFAULTS.width, height: PLAYER_DEFAULTS.height });
    this.health = PLAYER_DEFAULTS.maxHp;
    this.maxHealth = PLAYER_DEFAULTS.maxHp;
    this.energy = PLAYER_DEFAULTS.maxEnergy;
    this.maxEnergy = PLAYER_DEFAULTS.maxEnergy;
    this.energyRegenRate = PLAYER_DEFAULTS.energyRegeneration;
    this.invincibilityFrames = 0;
    this.lastDamageTime = 0;
    this.statusEffects = new Map();
    this.abilities = new Set([
      PLAYER_ABILITIES.DOUBLE_JUMP,
      PLAYER_ABILITIES.AIR_DASH,
      PLAYER_ABILITIES.WALL_CLIMB,
    ]);
    this.availableJumps = 1;
    this.airDashesAvailable = 1;
    this.coyoteTimer = 0;
    this.jumpBuffer = 0;
    this.jumpHoldFrames = 0;
    this.dashTimer = 0;
    this.dashCooldown = 0;
    this.slideCooldown = 0;
    this.isRunning = false;
    this.isCrouching = false;
    this.isSliding = false;
    this.isCharging = false;
    this.chargeTime = 0;
    this.comboTracker = new ComboTracker();
    this.tripleJumpTracker = [];
    this.cameraShake = 0;
    this.speedMultiplier = 1;
    this.jumpMultiplier = 1;
    this.gravityMultiplier = 1;
    this.surface = SURFACE_TYPES.NORMAL;
    this.motionTrail = [];
    this.fpsCounter = 0;
  }

  /**
   * Applies timed status effects, removing expired entries.
   */
  updateStatuses() {
    const expiredKeys = [];
    this.statusEffects.forEach((effect, key) => {
      effect.remaining -= 1;
      if (effect.remaining <= 0) {
        expiredKeys.push(key);
      }
    });
    expiredKeys.forEach((key) => this.statusEffects.delete(key));
  }

  /**
   * Applies modifications granted by active statuses.
   */
  applyStatusModifiers() {
    this.speedMultiplier = 1;
    this.jumpMultiplier = 1;
    this.gravityMultiplier = 1;
    this.statusEffects.forEach((effect) => {
      if (effect.type === 'speed_boost') {
        this.speedMultiplier *= effect.multiplier;
      }
      if (effect.type === 'slow') {
        this.speedMultiplier *= effect.multiplier;
      }
      if (effect.type === 'low_gravity') {
        this.gravityMultiplier *= effect.multiplier;
      }
    });
  }

  /**
   * Regenerates stamina and handles invincibility countdowns.
   */
  recoverResources() {
    if (this.energy < this.maxEnergy) {
      this.energy = clamp(this.energy + this.energyRegenRate, 0, this.maxEnergy);
    }
    if (this.invincibilityFrames > 0) {
      this.invincibilityFrames -= 1;
    }
    this.comboTracker.tick();
    if (this.coyoteTimer > 0) {
      this.coyoteTimer -= 1;
    }
    if (this.jumpBuffer > 0) {
      this.jumpBuffer -= 1;
    }
    if (this.dashTimer > 0) {
      this.dashTimer -= 1;
    }
    if (this.dashCooldown > 0) {
      this.dashCooldown -= 1;
    }
    if (this.slideCooldown > 0) {
      this.slideCooldown -= 1;
    }
  }

  /**
   * Sets the current ground state based on collision feedback.
   * @param {boolean} grounded
   * @param {SURFACE_TYPES} surface
   */
  setGrounded(grounded, surface) {
    if (grounded && !this.grounded) {
      this.animationState = 'land';
      this.availableJumps = 1;
      if (this.abilities.has(PLAYER_ABILITIES.DOUBLE_JUMP)) {
        this.availableJumps += 1;
      }
      this.airDashesAvailable = this.abilities.has(PLAYER_ABILITIES.AIR_DASH) ? 1 : 0;
      this.coyoteTimer = MOVEMENT_CONSTANTS.COYOTE_FRAMES;
      if (Math.abs(this.velocity.y) > 12) {
        this.cameraShake = 8;
      }
      this.tripleJumpTracker.push(performance.now());
      this.tripleJumpTracker = this.tripleJumpTracker.filter((timestamp) => performance.now() - timestamp < 500);
    }
    if (!grounded && this.grounded) {
      this.coyoteTimer = MOVEMENT_CONSTANTS.COYOTE_FRAMES;
    }
    this.grounded = grounded;
    this.surface = surface;
  }

  /**
   * Queues a jump input for buffering.
   */
  bufferJump() {
    this.jumpBuffer = MOVEMENT_CONSTANTS.JUMP_BUFFER_FRAMES;
  }

  /**
   * Calculates target horizontal acceleration based on input.
   * @param {number} inputX
   * @param {boolean} runHeld
   * @param {boolean} crouchHeld
   */
  applyHorizontalInput(inputX, runHeld, crouchHeld) {
    this.isRunning = runHeld;
    this.isCrouching = crouchHeld && this.grounded && !this.isSliding;

    const modifiers = SURFACE_MODIFIERS[this.surface] ?? SURFACE_MODIFIERS[SURFACE_TYPES.NORMAL];
    const targetSpeed = (runHeld ? MOVEMENT_CONSTANTS.RUN_SPEED : MOVEMENT_CONSTANTS.WALK_SPEED) * modifiers.speedMultiplier * this.speedMultiplier;
    const controlFactor = this.grounded ? 1 : MOVEMENT_CONSTANTS.AIR_CONTROL;
    const acceleration = targetSpeed * controlFactor * 0.2;

    if (this.isSliding) {
      this.velocity.x *= MOVEMENT_CONSTANTS.SLIDE_FRICTION;
    } else if (inputX !== 0) {
      this.velocity.x = clamp(
        this.velocity.x + inputX * acceleration,
        -targetSpeed,
        targetSpeed,
      );
      this.facing = Math.sign(inputX);
    } else if (this.grounded) {
      this.velocity.x *= modifiers.friction;
    } else {
      this.velocity.x *= MOVEMENT_CONSTANTS.AIR_FRICTION;
    }

    if (modifiers.conveyor && this.grounded && !this.isSliding) {
      this.velocity.x += modifiers.conveyor * 0.1;
    }

    if (this.isCrouching) {
      this.velocity.x = clamp(this.velocity.x, -targetSpeed * 0.4, targetSpeed * 0.4);
    }
  }

  /**
   * Executes a jump if available.
   * @returns {boolean}
   */
  tryJump() {
    if (this.jumpBuffer === 0) {
      return false;
    }

    if (this.grounded || this.coyoteTimer > 0) {
      this.performJump(MOVEMENT_CONSTANTS.JUMP_FORCE * this.jumpMultiplier);
      this.jumpBuffer = 0;
      this.coyoteTimer = 0;
      this.animationState = 'jump_rise';
      this.spawnJumpEffect('ground');
      return true;
    }

    if (this.availableJumps > 0) {
      this.performJump(MOVEMENT_CONSTANTS.JUMP_FORCE * 0.85 * this.jumpMultiplier);
      this.availableJumps -= 1;
      this.jumpBuffer = 0;
      this.animationState = 'jump_rise';
      this.spawnJumpEffect('double');
      return true;
    }

    if (this.wallSliding) {
      this.velocity.x = -this.facing * MOVEMENT_CONSTANTS.WALL_JUMP_HORIZONTAL;
      this.performJump(MOVEMENT_CONSTANTS.WALL_JUMP_VERTICAL);
      this.jumpBuffer = 0;
      this.animationState = 'jump_rise';
      this.spawnJumpEffect('wall');
      return true;
    }

    if (this.ledgeGrabbing) {
      this.performJump(MOVEMENT_CONSTANTS.JUMP_FORCE * 0.9);
      this.jumpBuffer = 0;
      this.ledgeGrabbing = false;
      return true;
    }

    return false;
  }

  /**
   * Applies jump force with optional hold extension.
   * @param {number} force
   */
  performJump(force) {
    this.velocity.y = -force;
    this.grounded = false;
    this.coyoteTimer = 0;
    this.jumpHoldFrames = MOVEMENT_CONSTANTS.MAX_JUMP_HOLD_FRAMES;
    this.tripleJumpTracker.push(performance.now());
    if (this.tripleJumpTracker.length >= 3) {
      const windowStart = this.tripleJumpTracker[this.tripleJumpTracker.length - 3];
      if (performance.now() - windowStart < MOVEMENT_CONSTANTS.TRIPLE_JUMP_WINDOW_FRAMES * (1000 / 60)) {
        this.velocity.y = -force * 1.3;
        this.spawnJumpEffect('triple');
      }
    }
  }

  /**
   * Processes held jump for variable height.
   * @param {boolean} jumpHeld
   */
  handleJumpHold(jumpHeld) {
    if (jumpHeld && this.velocity.y < 0 && this.jumpHoldFrames > 0) {
      this.velocity.y -= MOVEMENT_CONSTANTS.JUMP_HOLD_BONUS;
      this.jumpHoldFrames -= 1;
    } else if (!jumpHeld) {
      this.jumpHoldFrames = 0;
    }
  }

  /**
   * Initiates a slide if conditions met.
   */
  startSlide() {
    if (!this.grounded || Math.abs(this.velocity.x) < 5 || this.slideCooldown > 0) {
      return false;
    }
    this.isSliding = true;
    this.slideCooldown = 30;
    this.animationState = 'slide';
    this.spawnDustTrail('slide');
    return true;
  }

  /**
   * Updates slide state.
   */
  updateSlide() {
    if (!this.isSliding) {
      return;
    }
    this.velocity.x *= MOVEMENT_CONSTANTS.SLIDE_FRICTION;
    if (Math.abs(this.velocity.x) < 1 || !this.grounded) {
      this.isSliding = false;
    }
  }

  /**
   * Attempts to dash based on availability and stamina.
   * @param {boolean} airborne
   * @param {number} directionX
   * @param {number} directionY
   * @returns {boolean}
   */
  tryDash(airborne, directionX, directionY) {
    if (this.dashCooldown > 0 || this.dashTimer > 0) {
      return false;
    }
    const cost = airborne ? PLAYER_DEFAULTS.airDashCost : PLAYER_DEFAULTS.dashCost;
    if (this.energy < cost || (!airborne && !this.grounded)) {
      return false;
    }
    if (airborne && this.airDashesAvailable === 0) {
      return false;
    }

    this.energy -= cost;
    this.dashTimer = MOVEMENT_CONSTANTS.DASH_DURATION_FRAMES;
    this.dashCooldown = MOVEMENT_CONSTANTS.DASH_COOLDOWN_FRAMES;
    if (airborne) {
      this.airDashesAvailable -= 1;
    }
    const normalized = new Vec2(directionX, directionY);
    if (normalized.x === 0 && normalized.y === 0) {
      normalized.x = this.facing;
    }
    const length = Math.hypot(normalized.x, normalized.y) || 1;
    normalized.x /= length;
    normalized.y /= length;
    this.velocity.set(normalized.x * MOVEMENT_CONSTANTS.DASH_SPEED, normalized.y * MOVEMENT_CONSTANTS.DASH_SPEED);
    this.animationState = 'dash';
    this.spawnDashTrail();
    return true;
  }

  /**
   * Applies dash velocity each frame while active.
   */
  updateDash() {
    if (this.dashTimer > 0) {
      this.dashTimer -= 1;
      if (this.dashTimer === 0) {
        this.velocity.x *= 0.4;
      }
    }
  }

  /**
   * Handles stamina gating for sprint.
   */
  handleSprint() {
    if (this.isRunning && this.grounded) {
      this.energy = clamp(this.energy - PLAYER_DEFAULTS.sprintCostPerFrame, 0, this.maxEnergy);
      if (this.energy <= 0) {
        this.statusEffects.set('fatigue', { type: 'slow', multiplier: 0.8, remaining: PLAYER_DEFAULTS.statusDuration });
      }
    }
  }

  /**
   * Tracks animation state derived from velocity.
   */
  updateAnimationState() {
    if (this.dashTimer > 0) {
      this.animationState = 'dash';
      return;
    }
    if (!this.grounded) {
      if (this.velocity.y < -1) {
        this.animationState = 'jump_rise';
      } else if (this.velocity.y > 1) {
        this.animationState = 'jump_fall';
      } else {
        this.animationState = 'jump_peak';
      }
      return;
    }
    if (this.isSliding) {
      this.animationState = 'slide';
      return;
    }
    if (this.isCrouching) {
      this.animationState = 'crouch';
      return;
    }
    if (Math.abs(this.velocity.x) > MOVEMENT_CONSTANTS.WALK_SPEED * 0.9) {
      this.animationState = 'run';
    } else if (Math.abs(this.velocity.x) > 0.2) {
      this.animationState = 'walk';
    } else {
      this.animationState = 'idle';
    }
  }

  /**
   * Processes combo attack logic.
   * @returns {{damage: number, range: number, knockback: number, type: string, animation: string}}
   */
  performComboAttack() {
    const step = this.comboTracker.next();
    if (step === 1) {
      return { damage: 5, range: 1.2, knockback: 2, type: 'light', animation: 'attack_light' };
    }
    if (step === 2) {
      return { damage: 7, range: 1.3, knockback: 3, type: 'medium', animation: 'attack_light' };
    }
    return { damage: 12, range: 1.5, knockback: 5, type: 'heavy', animation: 'attack_heavy' };
  }

  /**
   * Executes charge attack release.
   * @returns {{damage: number, radius: number, level: number}}
   */
  releaseChargeAttack() {
    const normalized = clamp(this.chargeTime / 120, 0, 1);
    const level = normalized < 0.25 ? 0 : normalized < 0.5 ? 1 : normalized < 0.9 ? 2 : 3;
    this.isCharging = false;
    this.chargeTime = 0;
    if (level === 0) {
      return { damage: 10, radius: 1.2, level };
    }
    if (level === 1) {
      return { damage: 15, radius: 1.4, level };
    }
    if (level === 2) {
      return { damage: 25, radius: 1.6, level };
    }
    return { damage: 40, radius: 1.8, level };
  }

  /**
   * Applies incoming damage.
   * @param {number} amount
   */
  takeDamage(amount) {
    if (this.invincibilityFrames > 0) {
      return;
    }
    this.health = clamp(this.health - amount, 0, this.maxHealth);
    this.invincibilityFrames = 120;
    this.animationState = 'hurt';
    this.lastDamageTime = performance.now();
  }

  /**
   * Adds a status effect.
   * @param {string} key
   * @param {{type: string, multiplier: number, remaining: number}} payload
   */
  addStatusEffect(key, payload) {
    this.statusEffects.set(key, { ...payload });
  }

  /**
   * Spawns jump particles placeholder.
   * @param {string} type
   */
  spawnJumpEffect(type) {
    this.motionTrail.push({ type, ttl: 18, position: this.position.clone() });
  }

  /**
   * Spawns slide dust.
   * @param {string} type
   */
  spawnDustTrail(type) {
    this.motionTrail.push({ type, ttl: 12, position: this.position.clone() });
  }

  /**
   * Spawns dash trail.
   */
  spawnDashTrail() {
    this.motionTrail.push({ type: 'dash', ttl: 18, position: this.position.clone() });
  }

  /**
   * Updates ephemeral trail particles.
   */
  updateTrail() {
    this.motionTrail.forEach((particle) => {
      particle.ttl -= 1;
      particle.position.add(this.velocity.clone().scale(0.016));
    });
    this.motionTrail = this.motionTrail.filter((particle) => particle.ttl > 0);
  }

  /**
   * Called each frame to progress player state.
   * @param {{input: import('../input.js').InputState, delta: number, surface: SURFACE_TYPES}} context
   */
  update(context) {
    this.updateStatuses();
    this.applyStatusModifiers();
    this.recoverResources();
    this.updateTrail();
    this.updateDash();
    this.updateSlide();
    this.handleSprint();

    const { input } = context;
    this.applyHorizontalInput(input.horizontal, input.run, input.crouch);

    if (input.jumpPressed) {
      this.bufferJump();
    }

    this.handleJumpHold(input.jumpHeld);

    if (input.dashPressed) {
      this.tryDash(!this.grounded, input.aimX, input.aimY);
    }

    if (input.attackPressed) {
      const combo = this.performComboAttack();
      this.animationState = combo.animation;
      context.combatQueue.push({ ...combo, source: this });
    }

    if (input.attackHeld) {
      this.isCharging = true;
      this.chargeTime += 1;
      if (this.chargeTime > 120) {
        this.takeDamage(1);
      }
    } else if (this.isCharging) {
      const charge = this.releaseChargeAttack();
      this.animationState = charge.level >= 2 ? 'attack_heavy' : 'attack_light';
      context.combatQueue.push({ ...charge, charged: true, source: this });
    }

    if (input.slidePressed) {
      this.startSlide();
    }

    if (input.jumpPressed) {
      this.tryJump();
    }

    this.velocity.y = clamp(this.velocity.y + MOVEMENT_CONSTANTS.GRAVITY * this.gravityMultiplier, -40, MOVEMENT_CONSTANTS.MAX_FALL_SPEED);
    this.updateAnimationState();
  }
}
