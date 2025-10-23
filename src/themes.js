/**
 * @typedef {Object} ThemeDefinition
 * @property {string} key
 * @property {string} name
 * @property {string} description
 * @property {Record<string, string>} colors
 * @property {string} background
 * @property {string} fontFamily
 * @property {string} titleFontSize
 * @property {string} buttonShape
 * @property {string} thumbnail
 */

/**
 * Collection of all theme definitions used by the application.
 * @type {ThemeDefinition[]}
 */
export const THEMES = [
  {
    key: 'darkMode',
    name: 'Abyssal Dark',
    description: 'Deep blacks with cyan highlights.',
    colors: {
      '--color-background': '#020617',
      '--color-surface': 'rgba(2, 6, 23, 0.84)',
      '--color-primary': '#38bdf8',
      '--color-secondary': '#64748b',
      '--color-accent': '#f59e0b',
      '--color-text': '#f8fafc',
    },
    background:
      'radial-gradient(circle at 30% 20%, rgba(56,189,248,0.25), transparent 60%), radial-gradient(circle at 80% 70%, rgba(59,130,246,0.22), transparent 52%), radial-gradient(circle at 50% 50%, rgba(2,132,199,0.18), transparent 40%)',
    fontFamily: "'Orbitron', sans-serif",
    titleFontSize: 'clamp(3.5rem, 6vw, 6.5rem)',
    buttonShape: '18px',
    thumbnail:
      'linear-gradient(135deg, #020617, #0f172a 55%), radial-gradient(circle at 30% 30%, rgba(56,189,248,0.35), transparent 55%)',
  },
  {
    key: 'lightMode',
    name: 'Celestial Light',
    description: 'Clean whites and pastel accents.',
    colors: {
      '--color-background': '#f8fafc',
      '--color-surface': 'rgba(255, 255, 255, 0.9)',
      '--color-primary': '#0ea5e9',
      '--color-secondary': '#475569',
      '--color-accent': '#f97316',
      '--color-text': '#0f172a',
    },
    background:
      'linear-gradient(180deg, rgba(248,250,252,1) 0%, rgba(224,242,254,0.9) 60%, rgba(250,250,250,1) 100%)',
    fontFamily: "'Roboto', sans-serif",
    titleFontSize: 'clamp(3.2rem, 5.5vw, 6rem)',
    buttonShape: '22px',
    thumbnail:
      'linear-gradient(135deg, #f8fafc, #e2e8f0 60%), radial-gradient(circle at 70% 40%, rgba(14,165,233,0.45), transparent 55%)',
  },
  {
    key: 'neonCyber',
    name: 'Neon Pulse',
    description: 'Cyberpunk glow with electric purples.',
    colors: {
      '--color-background': '#050017',
      '--color-surface': 'rgba(10, 3, 40, 0.88)',
      '--color-primary': '#7c3aed',
      '--color-secondary': '#22d3ee',
      '--color-accent': '#f97316',
      '--color-text': '#f5f3ff',
    },
    background:
      'radial-gradient(circle at 20% 20%, rgba(236,72,153,0.25), transparent 55%), radial-gradient(circle at 70% 30%, rgba(124,58,237,0.35), transparent 50%), radial-gradient(circle at 40% 80%, rgba(6,182,212,0.3), transparent 40%)',
    fontFamily: "'Orbitron', sans-serif",
    titleFontSize: 'clamp(3.8rem, 6.5vw, 6.8rem)',
    buttonShape: '16px',
    thumbnail:
      'linear-gradient(135deg, #050017, #1a0647 60%), radial-gradient(circle at 40% 60%, rgba(124,58,237,0.45), transparent 55%)',
  },
  {
    key: 'natureForest',
    name: 'Emerald Canopy',
    description: 'Organic greens with earthy tones.',
    colors: {
      '--color-background': '#022c22',
      '--color-surface': 'rgba(3, 40, 32, 0.88)',
      '--color-primary': '#22c55e',
      '--color-secondary': '#bbf7d0',
      '--color-accent': '#f97316',
      '--color-text': '#ecfdf5',
    },
    background:
      'radial-gradient(circle at 15% 20%, rgba(34,197,94,0.25), transparent 60%), radial-gradient(circle at 80% 70%, rgba(22,163,74,0.3), transparent 50%), radial-gradient(circle at 50% 50%, rgba(15,118,110,0.25), transparent 45%)',
    fontFamily: "'Roboto', sans-serif",
    titleFontSize: 'clamp(3.4rem, 5.8vw, 6.3rem)',
    buttonShape: '20px',
    thumbnail:
      'linear-gradient(135deg, #022c22, #065f46 60%), radial-gradient(circle at 25% 40%, rgba(34,197,94,0.4), transparent 50%)',
  },
  {
    key: 'oceanic',
    name: 'Tidal Drift',
    description: 'Aquatic blues with gentle gradients.',
    colors: {
      '--color-background': '#0b1120',
      '--color-surface': 'rgba(8, 47, 73, 0.88)',
      '--color-primary': '#0ea5e9',
      '--color-secondary': '#38bdf8',
      '--color-accent': '#facc15',
      '--color-text': '#e0f2fe',
    },
    background:
      'radial-gradient(circle at 20% 15%, rgba(14,165,233,0.28), transparent 55%), radial-gradient(circle at 80% 50%, rgba(56,189,248,0.35), transparent 50%), radial-gradient(circle at 50% 80%, rgba(14,116,144,0.25), transparent 45%)',
    fontFamily: "'Roboto', sans-serif",
    titleFontSize: 'clamp(3.6rem, 6vw, 6.4rem)',
    buttonShape: '18px',
    thumbnail:
      'linear-gradient(135deg, #082f49, #0ea5e9 60%), radial-gradient(circle at 40% 40%, rgba(56,189,248,0.45), transparent 55%)',
  },
  {
    key: 'sunsetWarm',
    name: 'Aurora Ember',
    description: 'Vibrant oranges and purples reminiscent of sunset skies.',
    colors: {
      '--color-background': '#2c0a24',
      '--color-surface': 'rgba(76, 29, 149, 0.85)',
      '--color-primary': '#fb7185',
      '--color-secondary': '#fcd34d',
      '--color-accent': '#f97316',
      '--color-text': '#fff7ed',
    },
    background:
      'linear-gradient(140deg, rgba(100,37,105,0.95) 0%, rgba(190,24,93,0.9) 60%, rgba(249,115,22,0.85) 100%)',
    fontFamily: "'Orbitron', sans-serif",
    titleFontSize: 'clamp(3.7rem, 6.2vw, 6.6rem)',
    buttonShape: '24px',
    thumbnail:
      'linear-gradient(135deg, #2c0a24, #be185d 60%), radial-gradient(circle at 55% 50%, rgba(249,115,22,0.45), transparent 55%)',
  },
  {
    key: 'monochrome',
    name: 'Carbon Steel',
    description: 'Sleek blacks, whites, and grays.',
    colors: {
      '--color-background': '#111827',
      '--color-surface': 'rgba(17, 24, 39, 0.92)',
      '--color-primary': '#d1d5db',
      '--color-secondary': '#9ca3af',
      '--color-accent': '#f5f5f5',
      '--color-text': '#f9fafb',
    },
    background:
      'linear-gradient(135deg, rgba(17,24,39,1) 0%, rgba(55,65,81,0.85) 60%, rgba(17,24,39,1) 100%)',
    fontFamily: "'Roboto', sans-serif",
    titleFontSize: 'clamp(3.5rem, 5.8vw, 6.2rem)',
    buttonShape: '18px',
    thumbnail:
      'linear-gradient(135deg, #0f172a, #374151 60%), radial-gradient(circle at 50% 50%, rgba(209,213,219,0.45), transparent 55%)',
  },
  {
    key: 'highContrast',
    name: 'Signal Flare',
    description: 'High contrast palette tuned for accessibility.',
    colors: {
      '--color-background': '#000000',
      '--color-surface': 'rgba(0, 0, 0, 0.95)',
      '--color-primary': '#ffea00',
      '--color-secondary': '#f97316',
      '--color-accent': '#00ffab',
      '--color-text': '#ffffff',
    },
    background:
      'linear-gradient(135deg, rgba(0,0,0,1) 0%, rgba(24,24,27,1) 60%, rgba(0,0,0,1) 100%)',
    fontFamily: "'Orbitron', sans-serif",
    titleFontSize: 'clamp(4rem, 6.8vw, 7rem)',
    buttonShape: '14px',
    thumbnail:
      'linear-gradient(135deg, #000000, #1f2937 60%), radial-gradient(circle at 65% 45%, rgba(255,234,0,0.5), transparent 55%)',
  },
];

/**
 * Finds a theme by its key, falling back to the default theme when not found.
 * @param {string} key
 * @returns {ThemeDefinition}
 */
export function getThemeByKey(key) {
  return THEMES.find((theme) => theme.key === key) ?? THEMES[0];
}
