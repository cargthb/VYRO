import { debounce } from '../utils.js';

/**
 * Renders animated particles within the background canvas to provide ambient motion.
 */
export class BackgroundAnimator {
  /**
   * Configures the canvas context and begins animation loops.
   */
  constructor() {
    this.canvas = document.getElementById('backgroundCanvas');
    this.context = this.canvas.getContext('2d');
    this.particles = [];
    this.animationFrame = null;
    this.resizeObserver = debounce(this.resize.bind(this), 100);
    this.primaryColor = 'rgba(56, 189, 248, 1)';
    this.primaryComponents = [56, 189, 248];
    window.addEventListener('resize', this.resizeObserver);
    this.resize();
    this.spawnParticles();
    this.animate = this.animate.bind(this);
    this.animate();
  }

  /**
   * Resizes the canvas to fill the viewport.
   */
  resize() {
    this.canvas.width = window.innerWidth;
    this.canvas.height = window.innerHeight;
  }

  /**
   * Creates the particle set sized to the current screen dimensions.
   */
  spawnParticles() {
    const count = Math.min(160, Math.floor((window.innerWidth * window.innerHeight) / 12000));
    this.particles = Array.from({ length: count }, () => this.createParticle());
  }

  /**
   * Generates a single particle with random position and velocity.
   * @returns {{ x: number, y: number, radius: number, velocityX: number, velocityY: number, alpha: number }}
   */
  createParticle() {
    return {
      x: Math.random() * this.canvas.width,
      y: Math.random() * this.canvas.height,
      radius: Math.random() * 2 + 0.5,
      velocityX: (Math.random() - 0.5) * 0.6,
      velocityY: (Math.random() - 0.5) * 0.6,
      alpha: Math.random() * 0.5 + 0.3,
    };
  }

  /**
   * Advances the animation frame and renders particles.
   */
  animate() {
    this.animationFrame = requestAnimationFrame(this.animate);
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);

    this.particles.forEach((particle) => {
      particle.x += particle.velocityX;
      particle.y += particle.velocityY;

      if (particle.x < 0 || particle.x > this.canvas.width) {
        particle.velocityX *= -1;
      }
      if (particle.y < 0 || particle.y > this.canvas.height) {
        particle.velocityY *= -1;
      }

      this.context.beginPath();
      const gradient = this.context.createRadialGradient(
        particle.x,
        particle.y,
        0,
        particle.x,
        particle.y,
        particle.radius * 6,
      );
      gradient.addColorStop(0, this.colorWithAlpha(particle.alpha));
      gradient.addColorStop(1, this.colorWithAlpha(0));
      this.context.fillStyle = gradient;
      this.context.arc(particle.x, particle.y, particle.radius * 4, 0, Math.PI * 2);
      this.context.fill();
    });
  }

  /**
   * Stops the animation and cleans up resources.
   */
  destroy() {
    cancelAnimationFrame(this.animationFrame);
    window.removeEventListener('resize', this.resizeObserver);
  }

  /**
   * Updates the primary color used for particle rendering.
   * @param {string} color
   */
  setPrimaryColor(color) {
    const parser = document.createElement('canvas').getContext('2d');
    parser.fillStyle = color;
    const computed = parser.fillStyle;
    const match = /rgba?\((\d+), (\d+), (\d+)/.exec(computed);
    if (match) {
      this.primaryComponents = match.slice(1, 4).map((component) => Number(component));
      this.primaryColor = computed;
    }
  }

  /**
   * Converts the primary color components into an rgba string with alpha.
   * @param {number} alpha
   * @returns {string}
   */
  colorWithAlpha(alpha) {
    const [r, g, b] = this.primaryComponents;
    return `rgba(${r}, ${g}, ${b}, ${alpha})`;
  }
}
