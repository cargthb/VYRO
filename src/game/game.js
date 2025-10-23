import { Player } from './entities/player.js';
import { InputManager } from './input.js';
import { TileMap } from './levels/tilemap.js';
import { InfiniteLevelGenerator } from './procedural/generator.js';
import { CombatResolver } from './combat/resolver.js';
import { Enemy } from './enemies/baseEnemy.js';
import { ENEMY_DEFINITIONS, ENEMY_ORDER } from './enemies/enemyTypes.js';
import { WORLD_CATALOG } from './levels/worlds.js';

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
    this.generator = new InfiniteLevelGenerator({ themeKey: 'emerald_forest', difficulty: 1 });
    this.mapData = this.generator.nextSegment();
    this.tileMap = new TileMap(this.mapData);
    this.combat = new CombatResolver();
    this.enemies = [];
    this.enemyEvents = [];
    this.playerEvents = [];
    this.worldKey = 'emerald_forest';
    this.worldOffset = 0;
    this.spawnInitialEnemies();
    this.resizeCanvas();
    window.addEventListener('resize', () => this.resizeCanvas());
  }

  /**
   * Generates initial enemy lineup for the run.
   */
  spawnInitialEnemies() {
    const picks = ENEMY_ORDER.slice(0, 5);
    picks.forEach((key, index) => {
      const def = ENEMY_DEFINITIONS[key];
      const enemy = new Enemy({
        x: 8 + index * 6,
        y: 3,
        width: 1.2,
        height: 1.8,
        definition: def,
      });
      this.enemies.push(enemy);
    });
  }

  /**
   * Adjusts canvas resolution to window size.
   */
  resizeCanvas() {
    this.canvas.width = this.canvas.clientWidth * window.devicePixelRatio;
    this.canvas.height = this.canvas.clientHeight * window.devicePixelRatio;
  }

  /**
   * Starts the main loop.
   */
  start() {
    if (this.running) {
      return;
    }
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
    this.player.update({ input: inputState, delta, combatQueue: this.playerEvents });
    this.tileMap.resolvePlayerCollision(this.player, delta);
    this.extendWorldIfNeeded();
    this.enemies.forEach((enemy) => {
      enemy.update({ player: this.player, tileMap: this.tileMap, delta, events: this.enemyEvents });
    });
    this.enemies = this.enemies.filter((enemy) => !enemy.remove);
    this.combat.resolve({ player: this.player, enemies: this.enemies, playerEvents: this.playerEvents, enemyEvents: this.enemyEvents });
    this.handleCombatEffects();
    this.updateOverlay();
  }

  /**
   * Extends the infinite world and prunes old segments.
   */
  extendWorldIfNeeded() {
    const playerTileX = Math.floor(this.player.position.x);
    if (playerTileX > this.mapData.width - 20) {
      const next = this.generator.nextSegment();
      this.appendSegment(next);
    }
    if (playerTileX > 80) {
      this.pruneColumns(40);
    }
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
        // Placeholder visual pulse for projectiles.
        this.overlay?.classList.add('hud-projectile-flash');
        window.setTimeout(() => this.overlay?.classList.remove('hud-projectile-flash'), 120);
      }
    });
    this.combat.effects.length = 0;
  }

  /**
   * Appends new segment to current map data.
   * @param {{width: number, height: number, tiles: any}} segment
   */
  appendSegment(segment) {
    for (let y = 0; y < this.mapData.height; y += 1) {
      for (let x = 0; x < segment.width; x += 1) {
        this.mapData.tiles[y].push(segment.tiles[y][x]);
      }
    }
    this.mapData.width += segment.width;
    this.tileMap.tiles = this.mapData.tiles;
    this.tileMap.width = this.mapData.width;
    this.tileMap.height = this.mapData.height;
  }

  /**
   * Removes columns from the start to keep map manageable.
   * @param {number} columns
   */
  pruneColumns(columns) {
    for (let y = 0; y < this.mapData.height; y += 1) {
      this.mapData.tiles[y].splice(0, columns);
    }
    this.mapData.width -= columns;
    this.player.position.x -= columns;
    this.enemies.forEach((enemy) => {
      enemy.position.x -= columns;
    });
    this.worldOffset += columns;
    this.tileMap.tiles = this.mapData.tiles;
    this.tileMap.width = this.mapData.width;
    this.tileMap.height = this.mapData.height;
  }

  /**
   * Updates HUD overlay with player vitals and location.
   */
  updateOverlay() {
    if (!this.overlay) {
      return;
    }
    const worldInfo = WORLD_CATALOG[this.worldKey];
    this.overlay.querySelector('[data-stat="health"]').textContent = `${Math.round(this.player.health)} / ${this.player.maxHealth}`;
    this.overlay.querySelector('[data-stat="energy"]').textContent = `${Math.round(this.player.energy)} / ${this.player.maxEnergy}`;
    this.overlay.querySelector('[data-stat="world"]').textContent = `${worldInfo.name} – Segment ${this.generator.segmentIndex}`;
    this.overlay.querySelector('[data-stat="position"]').textContent = `X ${(this.player.position.x + this.worldOffset).toFixed(1)} | Y ${this.player.position.y.toFixed(1)}`;
    this.overlay.querySelector('[data-stat="status"]').textContent = [...this.player.statusEffects.keys()].join(', ') || 'Normal';
  }

  /**
   * Renders entities and tilemap.
   */
  render() {
    const ctx = this.ctx;
    const width = this.canvas.width / window.devicePixelRatio;
    const height = this.canvas.height / window.devicePixelRatio;
    ctx.save();
    ctx.setTransform(window.devicePixelRatio, 0, 0, window.devicePixelRatio, 0, 0);
    ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    ctx.restore();
    ctx.save();
    ctx.scale(window.devicePixelRatio, window.devicePixelRatio);
    ctx.fillStyle = '#05121f';
    ctx.fillRect(0, 0, width, height);
    const scale = 48;
    const offsetX = width / 2 - this.player.position.x * scale;
    const offsetY = height / 2 - this.player.position.y * scale;

    // Draw tiles
    for (let y = 0; y < this.mapData.height; y += 1) {
      for (let x = 0; x < this.mapData.width; x += 1) {
        const tile = this.mapData.tiles[y][x];
        if (tile.solid) {
          ctx.fillStyle = this.resolveSurfaceColor(tile.surface);
          ctx.fillRect(offsetX + (x * scale), offsetY + (y * scale), scale, scale);
        }
      }
    }

    // Player
    ctx.fillStyle = '#66f7ff';
    ctx.fillRect(offsetX + this.player.position.x * scale - scale * 0.4, offsetY + this.player.position.y * scale - scale * this.player.hitbox.height, scale * 0.8, scale * this.player.hitbox.height);

    // Enemies
    ctx.fillStyle = '#ff5b5b';
    this.enemies.forEach((enemy) => {
      ctx.fillRect(offsetX + enemy.position.x * scale - scale * 0.4, offsetY + enemy.position.y * scale - scale * enemy.hitbox.height, scale * 0.8, scale * enemy.hitbox.height);
    });

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
    Object.entries(WORLD_CATALOG).forEach(([key, data]) => {
      const item = document.createElement('article');
      item.className = 'codex-entry';
      const levels = data.levels
        .map((level) => `<li>${level.name}${level.type ? ` <span class="tag">${level.type}</span>` : ''}</li>`)
        .join('');
      item.innerHTML = `<h4>${data.name}</h4><p>${data.theme}</p><ul>${levels}</ul>`;
      worldList.appendChild(item);
    });
  }
}
