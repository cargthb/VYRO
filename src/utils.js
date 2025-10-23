/**
 * Creates an HTML element with the provided options.
 * @param {string} tag
 * @param {{ classes?: string[], attributes?: Record<string, string>, text?: string }} options
 * @returns {HTMLElement}
 */
export function createElement(tag, options = {}) {
  const element = document.createElement(tag);
  if (options.classes) {
    element.classList.add(...options.classes);
  }
  if (options.attributes) {
    Object.entries(options.attributes).forEach(([key, value]) => {
      element.setAttribute(key, value);
    });
  }
  if (options.text) {
    element.textContent = options.text;
  }
  return element;
}

/**
 * Smoothly toggles visibility by adding or removing the hidden class.
 * @param {HTMLElement} element
 * @param {boolean} visible
 */
export function toggleVisibility(element, visible) {
  if (visible) {
    element.classList.add('visible');
    element.classList.remove('hidden');
    element.setAttribute('aria-hidden', 'false');
  } else {
    element.classList.remove('visible');
    element.classList.add('hidden');
    element.setAttribute('aria-hidden', 'true');
  }
}

/**
 * Formats a percentage number for display.
 * @param {number} value
 * @returns {string}
 */
export function formatPercent(value) {
  return `${Math.round(value)}%`;
}

/**
 * Applies inline CSS variables to the root element.
 * @param {Record<string, string>} variables
 */
export function applyCssVariables(variables) {
  const root = document.documentElement;
  Object.entries(variables).forEach(([key, value]) => {
    root.style.setProperty(key, value);
  });
}

/**
 * Applies styles to the document body using the provided theme definition.
 * @param {import('./themes.js').ThemeDefinition} theme
 */
export function applyThemeStyles(theme) {
  applyCssVariables({
    ...theme.colors,
    '--font-primary': theme.fontFamily,
    '--background-animation': theme.background,
  });
  document.documentElement.style.setProperty('--border-radius', theme.buttonShape);
  const title = document.getElementById('gameTitle');
  if (title) {
    title.style.fontSize = theme.titleFontSize;
    title.style.fontFamily = theme.fontFamily;
  }
}

/**
 * Creates a debounced function that delays execution until after wait milliseconds have elapsed.
 * @template {(...args: any[]) => void} T
 * @param {T} fn
 * @param {number} wait
 * @returns {T}
 */
export function debounce(fn, wait) {
  let timeout;
  return function debounced(...args) {
    clearTimeout(timeout);
    timeout = setTimeout(() => fn.apply(this, args), wait);
  };
}

/**
 * Plays a short beep using the Web Audio API.
 * @param {number} gain
 * @param {number} frequency
 */
export function playTone(gain, frequency) {
  try {
    const ctx = new AudioContext();
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    oscillator.type = 'sine';
    oscillator.frequency.value = frequency;
    gainNode.gain.value = Math.max(Math.min(gain, 1), 0);
    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);
    oscillator.start();
    oscillator.stop(ctx.currentTime + 0.2);
    oscillator.onended = () => ctx.close();
  } catch (error) {
    console.error('AudioContext failed to start', error);
  }
}

/**
 * Ensures structured cloning is available in older environments.
 * @template T
 * @param {T} value
 * @returns {T}
 */
export function clone(value) {
  if (typeof structuredClone === 'function') {
    return structuredClone(value);
  }
  return JSON.parse(JSON.stringify(value));
}
