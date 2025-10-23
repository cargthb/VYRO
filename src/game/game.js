import { Player } from './entities/player.js';
import { InputManager } from './input.js';
import { TileMap } from './levels/tilemap.js';
import { CombatResolver } from './combat/resolver.js';
import { Enemy } from './enemies/baseEnemy.js';
import { ENEMY_DEFINITIONS, ENEMY_ORDER } from './enemies/enemyTypes.js';
import { WORLD_CATALOG } from './levels/worlds.js';
import { MOVEMENT_CONSTANTS } from './constants.js';
import { PREBUILT_LEVELS, buildLevelData } from './levels/prebuilt.js';
import { clamp } from './utils/math.js';

/**
 * Core game runner responsible for the update loop, rendering, and world orchestration.
 */
export class GameEngine {
  /**
   * @param {{ canvas: HTMLCanvasElement, overlay: HTMLElement, encyclopedia: HTMLElement }} config
   */
  constructor(config) {
    this.canvas = config.canvas;
    this.ctx = this.canvas.getContext('2d');
    this.overlay = config.overlay;
    this.encyclopedia = config.encyclopedia;
    this.running = false;
    this.lastTime = 0;
    this.player = new Player();
    this.input = new InputManager();
    this.tileMap = new TileMap({ width: 1, height: 1, tiles: [[{ solid: false }]] });
    this.combat = new CombatResolver();
    this.enemies = [];
    this.enemyEvents = [];
    this.playerEvents = [];
    this.worldKey = 'emerald_forest';
    this.levelOrder = ['w1-1', 'w1-2'];
    this.currentLevelIndex = 0;
    this.collectibles = [];
    this.levelStats = { collected: 0, totalCollectibles: 0 };
    this.levelStartTime = performance.now();
    this.levelData = null;
    this.resizeCanvas();
    this.runCompleted = false;
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Adjusts canvas resolution to window size.
   */
  resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
  }

  /**
   * Starts the main loop and initialises the first level.
   */
  start() {
    if (this.running) {
      return;
    }
    this.resetRun();
    this.running = true;
    this.lastTime = performance.now();
    requestAnimationFrame((timestamp) => this.loop(timestamp));
    this.populateEncyclopedia();
  }

  /**
   * Stops the loop.
   */
  stop() {
    this.running = false;
  }

  /**
   * Primary game loop.
   * @param {number} timestamp
   */
  loop(timestamp) {
    if (!this.running) {
      return;
    }
    const delta = (timestamp - this.lastTime) / (1000 / 60);
    this.lastTime = timestamp;
    this.update(delta);
    this.render();
    requestAnimationFrame((time) => this.loop(time));
  }

  /**
   * Updates simulation state for frame.
   * @param {number} delta
   */
  update(delta) {
    this.input.resetFrameState();
    this.input.update();
    const inputState = this.input.getState();
    if (inputState.resetPressed && !this.runCompleted) {
      this.resetLevel({ full: false });
    }
    if (this.runCompleted) {
      if (inputState.resetPressed) {
        this.resetRun();
        this.runCompleted = false;
      }
      this.updateOverlay();
      return;
    }
    this.player.update({ input: inputState, delta, combatQueue: this.playerEvents });
    this.tileMap.resolvePlayerCollision(this.player, delta);
    this.handlePlayerHazards();
    this.enemies.forEach((enemy) => {
      enemy.storePreviousPosition();
      enemy.update({ player: this.player, tileMap: this.tileMap, delta, events: this.enemyEvents });
      enemy.velocity.y = Math.min(
        enemy.velocity.y + MOVEMENT_CONSTANTS.GRAVITY,
        MOVEMENT_CONSTANTS.MAX_FALL_SPEED,
      );
      const { grounded } = this.tileMap.resolveEntityCollision(enemy, delta);
      enemy.grounded = grounded;
    });
    this.enemies = this.enemies.filter((enemy) => !enemy.remove);
    this.combat.resolve({
      player: this.player,
      enemies: this.enemies,
      playerEvents: this.playerEvents,
      enemyEvents: this.enemyEvents,
    });
    this.handleCombatEffects();
    this.resolveCollectibles();
    this.checkFailStates();
    this.checkLevelCompletion();
    this.updateOverlay();
  }

  /**
   * Reacts to combat resolver side effects such as summons or projectiles.
   */
  handleCombatEffects() {
    this.combat.effects.forEach((effect) => {
      if (effect.type === 'summon') {
        const origin = effect.payload.enemy;
        const minion = new Enemy({
          x: origin.position.x + (Math.random() > 0.5 ? 2 : -2),
          y: origin.position.y,
          width: 1,
          height: 1.6,
          definition: ENEMY_DEFINITIONS.basic_walker,
        });
        this.enemies.push(minion);
      }
      if (effect.type === 'projectile') {
        this.overlay?.classList.add('hud-projectile-flash');
        window.setTimeout(() => this.overlay?.classList.remove('hud-projectile-flash'), 120);
      }
    });
    this.combat.effects.length = 0;
  }

  /**
   * Updates HUD overlay with player vitals and location.
   */
  updateOverlay() {
    if (!this.overlay) {
      return;
    }
    const worldInfo = WORLD_CATALOG[this.worldKey];
    const levelKey = this.levelOrder[this.currentLevelIndex];
    const levelMeta = PREBUILT_LEVELS[levelKey];
    const elapsed = ((performance.now() - this.levelStartTime) / 1000).toFixed(1);
    this.overlay.querySelector('[data-stat="health"]').textContent = `${Math.round(this.player.health)} / ${this.player.maxHealth}`;
    this.overlay.querySelector('[data-stat="energy"]').textContent = `${Math.round(this.player.energy)} / ${this.player.maxEnergy}`;
    this.overlay.querySelector('[data-stat="world"]').textContent = `${worldInfo.name} – ${levelMeta?.name ?? 'Training'}`;
    this.overlay.querySelector('[data-stat="position"]').textContent = `X ${this.player.position.x.toFixed(1)} | Y ${this.player.position.y.toFixed(1)}`;
    this.overlay.querySelector('[data-stat="timer"]').textContent = `${elapsed}s`;
    this.overlay.querySelector('[data-stat="collectibles"]').textContent = `${this.levelStats.collected} / ${this.levelStats.totalCollectibles}`;
    const status = this.levelStats.totalCollectibles > 0
      ? `${levelMeta.objective} (${this.levelStats.collected}/${this.levelStats.totalCollectibles})`
      : levelMeta.objective;
    this.overlay.querySelector('[data-stat="status"]').textContent = status;
  }

  /**
   * Renders entities and tilemap.
   */
  render() {
    if (!this.mapData) {
      return;
    }
    const ctx = this.ctx;
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;
    ctx.save();
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    this.renderBackground(ctx, width, height);
    const scale = 48;
    const levelWidth = this.mapData.width;
    const minOffsetX = Math.min(0, width - levelWidth * scale);
    let offsetX = width / 2 - this.player.position.x * scale;
    offsetX = clamp(offsetX, minOffsetX - 64, 64);
    const offsetY = height / 2 - this.player.position.y * scale;

    for (let y = 0; y < this.mapData.height; y += 1) {
      for (let x = 0; x < this.mapData.width; x += 1) {
        const tile = this.mapData.tiles[y][x];
        if (tile.solid) {
          ctx.fillStyle = this.resolveSurfaceColor(tile.surface);
          ctx.fillRect(offsetX + x * scale, offsetY + y * scale, scale, scale);
          if (tile.hazard === 'spikes') {
            this.renderSpike(ctx, offsetX + x * scale, offsetY + y * scale, scale);
          }
        }
      }
    }

    this.renderCollectibles(ctx, offsetX, offsetY, scale);
    this.renderExit(ctx, offsetX, offsetY, scale);

    ctx.fillStyle = '#66f7ff';
    ctx.fillRect(
      offsetX + this.player.position.x * scale - scale * 0.4,
      offsetY + this.player.position.y * scale - scale * this.player.hitbox.height,
      scale * 0.8,
      scale * this.player.hitbox.height,
    );

    ctx.fillStyle = '#ff5b5b';
    this.enemies.forEach((enemy) => {
      ctx.fillRect(
        offsetX + enemy.position.x * scale - scale * 0.4,
        offsetY + enemy.position.y * scale - scale * enemy.hitbox.height,
        scale * 0.8,
        scale * enemy.hitbox.height,
      );
    });

    ctx.restore();
  }

  /**
   * Draws gradient background.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} width
   * @param {number} height
   */
  renderBackground(ctx, width, height) {
    const gradient = ctx.createLinearGradient(0, 0, 0, height);
    gradient.addColorStop(0, '#052e16');
    gradient.addColorStop(1, '#02100a');
    ctx.fillStyle = gradient;
    ctx.fillRect(0, 0, width, height);
  }

  /**
   * Draws collectibles for current level.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} offsetX
   * @param {number} offsetY
   * @param {number} scale
   */
  renderCollectibles(ctx, offsetX, offsetY, scale) {
    ctx.save();
    this.collectibles.forEach((item) => {
      if (item.collected) {
        return;
      }
      ctx.beginPath();
      ctx.fillStyle = item.type === 'essence' ? '#facc15' : '#34d399';
      ctx.globalAlpha = 0.85;
      ctx.arc(
        offsetX + item.x * scale,
        offsetY + item.y * scale - scale * 0.6,
        scale * 0.2,
        0,
        Math.PI * 2,
      );
      ctx.fill();
      ctx.globalAlpha = 1;
    });
    ctx.restore();
  }

  /**
   * Renders exit portal for the level.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} offsetX
   * @param {number} offsetY
   * @param {number} scale
   */
  renderExit(ctx, offsetX, offsetY, scale) {
    if (!this.levelData?.exit) {
      return;
    }
    ctx.save();
    ctx.fillStyle = '#60a5fa';
    const width = scale * 0.6;
    const height = scale * 1.6;
    const x = offsetX + this.levelData.exit.x * scale - width / 2;
    const y = offsetY + this.levelData.exit.y * scale - height;
    ctx.globalAlpha = 0.6;
    ctx.fillRect(x, y, width, height);
    ctx.globalAlpha = 1;
    ctx.strokeStyle = '#93c5fd';
    ctx.lineWidth = 2;
    ctx.strokeRect(x, y, width, height);
    ctx.restore();
  }

  /**
   * Draws spike top overlay for hazard tiles.
   * @param {CanvasRenderingContext2D} ctx
   * @param {number} x
   * @param {number} y
   * @param {number} scale
   */
  renderSpike(ctx, x, y, scale) {
    ctx.save();
    ctx.fillStyle = '#ef4444';
    const step = scale / 4;
    for (let i = 0; i < 4; i += 1) {
      ctx.beginPath();
      ctx.moveTo(x + i * step, y + scale);
      ctx.lineTo(x + (i + 0.5) * step, y + scale * 0.6);
      ctx.lineTo(x + (i + 1) * step, y + scale);
      ctx.closePath();
      ctx.fill();
    }
    ctx.restore();
  }

  /**
   * Resolves a surface color for drawing.
   * @param {string} surface
   * @returns {string}
   */
  resolveSurfaceColor(surface) {
    switch (surface) {
      case 'ice':
        return '#7dd3fc';
      case 'mud':
        return '#7c2d12';
      case 'conveyor_left':
      case 'conveyor_right':
        return '#f97316';
      case 'boost':
        return '#fde047';
      default:
        return '#14532d';
    }
  }

  /**
   * Populates the encyclopedia overlay with enemy and world data.
   */
  populateEncyclopedia() {
    if (!this.encyclopedia) {
      return;
    }
    const enemyList = this.encyclopedia.querySelector('[data-encyclopedia="enemies"]');
    const worldList = this.encyclopedia.querySelector('[data-encyclopedia="worlds"]');
    enemyList.innerHTML = '';
    worldList.innerHTML = '';
    ENEMY_ORDER.forEach((key) => {
      const def = ENEMY_DEFINITIONS[key];
      const item = document.createElement('article');
      item.className = 'codex-entry';
      item.innerHTML = `<h4>${def.name}</h4><p>${def.description}</p><p class="codex-stat">HP ${def.stats.maxHp} • Damage ${def.stats.contactDamage}</p>`;
      enemyList.appendChild(item);
    });
    Object.entries(WORLD_CATALOG).forEach(([, data]) => {
      const item = document.createElement('article');
      item.className = 'codex-entry';
      const levels = data.levels
        .map((level) => `<li>${level.name}${level.type ? ` <span class="tag">${level.type}</span>` : ''}</li>`)
        .join('');
      item.innerHTML = `<h4>${data.name}</h4><p>${data.theme}</p><ul>${levels}</ul>`;
      worldList.appendChild(item);
    });
  }

  /**
   * Loads the current level definition and resets entities.
   */
  resetRun() {
    this.currentLevelIndex = 0;
    this.loadLevel(this.levelOrder[this.currentLevelIndex], { full: true });
    this.runCompleted = false;
  }

  /**
   * Resets level state from definition.
   * @param {string} key
   * @param {{ full: boolean }} options
   */
  loadLevel(key, options = { full: true }) {
    const definition = PREBUILT_LEVELS[key];
    if (!definition) {
      throw new Error(`Unknown level ${key}`);
    }
    this.levelData = buildLevelData(definition);
    this.mapData = this.levelData.map;
    this.tileMap = new TileMap(this.mapData);
    this.collectibles = this.levelData.collectibles.map((item) => ({ ...item }));
    this.levelStats.collected = 0;
    this.levelStats.totalCollectibles = this.collectibles.length;
    this.player.reset(this.levelData.spawn, options);
    this.enemies = this.levelData.enemies.map((spawn) => new Enemy({
      x: spawn.x,
      y: spawn.y,
      width: spawn.width,
      height: spawn.height,
      definition: ENEMY_DEFINITIONS[spawn.type],
    }));
    this.levelStartTime = performance.now();
  }

  /**
   * Restores the current level to its initial state.
   * @param {{ full: boolean }} param0
   */
  resetLevel({ full }) {
    const key = this.levelOrder[this.currentLevelIndex];
    this.loadLevel(key, { full });
    this.playerEvents.length = 0;
    this.enemyEvents.length = 0;
    this.runCompleted = false;
  }

  /**
   * Applies hazards and respawn logic when the player fails.
   */
  checkFailStates() {
    if (this.player.health <= 0 || this.player.position.y > this.mapData.height + 4) {
      this.player.reset(this.levelData.spawn, { full: false });
      this.player.health = this.player.maxHealth;
      this.player.energy = this.player.maxEnergy;
      this.resetLevel({ full: false });
    }
  }

  /**
   * Damages the player when standing on hazardous surfaces.
   */
  handlePlayerHazards() {
    const hazard = this.tileMap.getHazard(this.player.position.x, this.player.position.y);
    if (hazard === 'spikes' && this.player.invincibilityFrames === 0) {
      this.player.takeDamage(15);
      this.player.velocity.y = -6;
    }
  }

  /**
   * Tracks collectible pickups.
   */
  resolveCollectibles() {
    this.collectibles.forEach((item) => {
      if (item.collected) {
        return;
      }
      const withinX = Math.abs(item.x - this.player.position.x) < 0.6;
      const withinY = Math.abs(item.y - this.player.position.y) < 1.2;
      if (withinX && withinY) {
        item.collected = true;
        this.levelStats.collected += 1;
        this.player.energy = Math.min(this.player.maxEnergy, this.player.energy + 5);
      }
    });
  }

  /**
   * Checks if exit conditions have been satisfied and advances level.
   */
  checkLevelCompletion() {
    if (!this.levelData?.exit) {
      return;
    }
    const atExit = Math.abs(this.player.position.x - this.levelData.exit.x) < 0.8
      && Math.abs(this.player.position.y - this.levelData.exit.y) < 1.2;
    if (atExit && this.levelStats.collected >= this.levelStats.totalCollectibles) {
      if (this.currentLevelIndex < this.levelOrder.length - 1) {
        this.currentLevelIndex += 1;
        this.loadLevel(this.levelOrder[this.currentLevelIndex], { full: false });
      } else {
        this.runCompleted = true;
        this.overlay?.querySelector('[data-stat="status"]').textContent = 'Victory! Press R to restart.';
        this.player.velocity.set(0, 0);
      }
    }
  }
}
