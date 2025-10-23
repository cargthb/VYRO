/**
 * @typedef {Object} InputState
 * @property {number} horizontal
 * @property {number} vertical
 * @property {boolean} jumpPressed
 * @property {boolean} jumpHeld
 * @property {boolean} attackPressed
 * @property {boolean} attackHeld
 * @property {boolean} dashPressed
 * @property {boolean} slidePressed
 * @property {boolean} run
 * @property {boolean} crouch
 * @property {number} aimX
 * @property {number} aimY
 */

/**
 * Handles keyboard events and exposes normalized input state for the game loop.
 */
export class InputManager {
  constructor() {
    this.keys = new Map();
    this.state = this.createNeutralState();
    this.listeners = new Map();
    this.bindEvents();
  }

  /**
   * Initializes key listeners.
   */
  bindEvents() {
    window.addEventListener('keydown', (event) => {
      this.keys.set(event.code, true);
      this.emit(event.code, true);
      if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
        event.preventDefault();
      }
    });
    window.addEventListener('keyup', (event) => {
      this.keys.set(event.code, false);
      this.emit(event.code, false);
    });
  }

  /**
   * Resets per-frame pressed flags.
   */
  resetFrameState() {
    this.state.jumpPressed = false;
    this.state.attackPressed = false;
    this.state.dashPressed = false;
    this.state.slidePressed = false;
  }

  /**
   * Updates continuous inputs for the frame.
   */
  update() {
    const left = this.isDown('ArrowLeft') || this.isDown('KeyA');
    const right = this.isDown('ArrowRight') || this.isDown('KeyD');
    const up = this.isDown('ArrowUp') || this.isDown('KeyW');
    const down = this.isDown('ArrowDown') || this.isDown('KeyS');

    this.state.horizontal = (right ? 1 : 0) - (left ? 1 : 0);
    this.state.vertical = (down ? 1 : 0) - (up ? 1 : 0);
    this.state.jumpHeld = this.isDown('Space') || this.isDown('KeyZ');
    this.state.attackHeld = this.isDown('KeyJ');
    this.state.run = this.isDown('ShiftLeft') || this.isDown('ShiftRight');
    this.state.crouch = down;
    this.state.aimX = this.state.horizontal;
    this.state.aimY = this.state.vertical;

    if (this.consumePress('Space') || this.consumePress('KeyZ')) {
      this.state.jumpPressed = true;
    }
    if (this.consumePress('KeyJ')) {
      this.state.attackPressed = true;
    }
    if (this.consumePress('KeyK')) {
      this.state.dashPressed = true;
    }
    if (this.consumePress('KeyS') || this.consumePress('ArrowDown')) {
      this.state.slidePressed = true;
    }
  }

  /**
   * Returns whether key is held.
   * @param {string} code
   */
  isDown(code) {
    return this.keys.get(code) ?? false;
  }

  /**
   * Tracks and consumes discrete key presses to avoid repeated triggers in same frame.
   * @param {string} code
   * @returns {boolean}
   */
  consumePress(code) {
    if (!this.pressEvents) {
      this.pressEvents = new Map();
    }
    const pressed = this.keys.get(code);
    if (pressed && !this.pressEvents.get(code)) {
      this.pressEvents.set(code, true);
      return true;
    }
    if (!pressed) {
      this.pressEvents.set(code, false);
    }
    return false;
  }

  /**
   * Registers listeners for debugging overlays.
   * @param {string} code
   * @param {(down: boolean) => void} handler
   */
  on(code, handler) {
    if (!this.listeners.has(code)) {
      this.listeners.set(code, new Set());
    }
    this.listeners.get(code)?.add(handler);
  }

  /**
   * Emits events for registered listeners.
   * @param {string} code
   * @param {boolean} down
   */
  emit(code, down) {
    this.listeners.get(code)?.forEach((handler) => handler(down));
  }

  /**
   * Provides a copy of the current state.
   * @returns {InputState}
   */
  getState() {
    return { ...this.state };
  }

  /**
   * Creates default neutral state.
   * @returns {InputState}
   */
  createNeutralState() {
    return {
      horizontal: 0,
      vertical: 0,
      jumpPressed: false,
      jumpHeld: false,
      attackPressed: false,
      attackHeld: false,
      dashPressed: false,
      slidePressed: false,
      run: false,
      crouch: false,
      aimX: 0,
      aimY: 0,
    };
  }
}
