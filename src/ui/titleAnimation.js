/**
 * Animates the title canvas with swirling particles that orbit the title text.
 */
export class TitleAnimator {
  /**
   * Creates the canvas context and starts rendering frames.
   */
  constructor() {
    this.canvas = document.getElementById('titleCanvas');
    this.context = this.canvas.getContext('2d');
    this.particles = [];
    this.time = 0;
    this.resize();
    window.addEventListener('resize', () => this.resize());
    this.initParticles();
    requestAnimationFrame(() => this.render());
  }

  /**
   * Resizes the canvas to match the title element.
   */
  resize() {
    const title = document.getElementById('gameTitle');
    const rect = title.getBoundingClientRect();
    this.canvas.width = rect.width;
    this.canvas.height = rect.height;
    this.canvas.style.width = `${rect.width}px`;
    this.canvas.style.height = `${rect.height}px`;
  }

  /**
   * Initializes the particle collection orbiting the title.
   */
  initParticles() {
    const particleCount = 60;
    this.particles = Array.from({ length: particleCount }, (_, index) => ({
      angle: (Math.PI * 2 * index) / particleCount,
      radius: Math.random() * 30 + 30,
      speed: 0.01 + Math.random() * 0.02,
    }));
  }

  /**
   * Draws the particle system on each animation frame.
   */
  render() {
    this.context.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const centerX = this.canvas.width / 2;
    const centerY = this.canvas.height / 2;

    this.particles.forEach((particle, index) => {
      const angle = particle.angle + this.time * particle.speed;
      const x = centerX + Math.cos(angle) * particle.radius;
      const y = centerY + Math.sin(angle) * particle.radius * 0.6;
      const gradient = this.context.createRadialGradient(x, y, 0, x, y, 14);
      gradient.addColorStop(0, 'rgba(56,189,248,0.85)');
      gradient.addColorStop(1, 'rgba(56,189,248,0)');
      this.context.fillStyle = gradient;
      this.context.beginPath();
      this.context.arc(x, y, 6, 0, Math.PI * 2);
      this.context.fill();
      if (index % 7 === 0) {
        this.context.strokeStyle = 'rgba(148,163,184,0.4)';
        this.context.beginPath();
        this.context.moveTo(centerX, centerY);
        this.context.lineTo(x, y);
        this.context.stroke();
      }
    });

    this.time += 1;
    requestAnimationFrame(() => this.render());
  }
}
