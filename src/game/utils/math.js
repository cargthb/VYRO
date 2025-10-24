/**
 * Provides vector math helpers for gameplay systems.
 */
export class Vec2 {
  /**
   * @param {number} x
   * @param {number} y
   */
  constructor(x = 0, y = 0) {
    this.x = x;
    this.y = y;
  }

  /**
   * Copies the vector.
   * @returns {Vec2}
   */
  clone() {
    return new Vec2(this.x, this.y);
  }

  /**
   * Adds another vector.
   * @param {Vec2} vec
   * @returns {Vec2}
   */
  add(vec) {
    this.x += vec.x;
    this.y += vec.y;
    return this;
  }

  /**
   * Scales the vector.
   * @param {number} scalar
   * @returns {Vec2}
   */
  scale(scalar) {
    this.x *= scalar;
    this.y *= scalar;
    return this;
  }

  /**
   * Sets vector components.
   * @param {number} x
   * @param {number} y
   * @returns {Vec2}
   */
  set(x, y) {
    this.x = x;
    this.y = y;
    return this;
  }

  /**
   * @param {Vec2} target
   * @param {number} lerp
   * @returns {Vec2}
   */
  lerp(target, lerp) {
    this.x += (target.x - this.x) * lerp;
    this.y += (target.y - this.y) * lerp;
    return this;
  }
}

/**
 * Clamps a value to a range.
 * @param {number} value
 * @param {number} min
 * @param {number} max
 * @returns {number}
 */
export function clamp(value, min, max) {
  return Math.max(min, Math.min(max, value));
}

/**
 * Approaches target by delta.
 * @param {number} value
 * @param {number} target
 * @param {number} delta
 * @returns {number}
 */
export function approach(value, target, delta) {
  if (value < target) {
    return Math.min(target, value + delta);
  }
  if (value > target) {
    return Math.max(target, value - delta);
  }
  return value;
}

/**
 * Linear interpolation.
 * @param {number} a
 * @param {number} b
 * @param {number} t
 * @returns {number}
 */
export function lerp(a, b, t) {
  return a + (b - a) * t;
}
