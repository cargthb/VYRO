/**
 * @typedef {Object} SettingsState
 * @property {AudioSettings} audio
 * @property {DisplaySettings} display
 * @property {GameplaySettings} gameplay
 * @property {AccessibilitySettings} accessibility
 * @property {string} activeTab
 * @property {string} activeTheme
 */

/**
 * @typedef {Object} AudioSettings
 * @property {number} masterVolume
 * @property {number} musicVolume
 * @property {number} effectsVolume
 * @property {boolean} mute
 * @property {boolean} musicTested
 * @property {boolean} effectsTested
 */

/**
 * @typedef {Object} DisplaySettings
 * @property {string} resolution
 * @property {boolean} fullscreen
 * @property {boolean} vsync
 * @property {number} brightness
 * @property {number} contrast
 * @property {string} displayMode
 */

/**
 * @typedef {Object} GameplaySettings
 * @property {string} difficulty
 * @property {Record<string, string>} controls
 * @property {boolean} showFps
 * @property {boolean} tutorialHints
 * @property {boolean} autoSave
 * @property {number} cameraShake
 */

/**
 * @typedef {Object} AccessibilitySettings
 * @property {string} colorblindMode
 * @property {string} textSize
 * @property {boolean} reduceMotion
 * @property {boolean} subtitles
 * @property {boolean} highContrast
 * @property {boolean} screenReader
 */

const STORAGE_KEY = 'vyro-settings-state';

/**
 * Returns the default settings state used when a user has no saved preferences.
 * @returns {SettingsState}
 */
export function createDefaultState() {
  return {
    audio: {
      masterVolume: 80,
      musicVolume: 70,
      effectsVolume: 75,
      mute: false,
      musicTested: false,
      effectsTested: false,
    },
    display: {
      resolution: '2560x1440',
      fullscreen: false,
      vsync: true,
      brightness: 65,
      contrast: 55,
      displayMode: 'borderless',
    },
    gameplay: {
      difficulty: 'Normal',
      controls: {
        moveUp: 'W',
        moveDown: 'S',
        moveLeft: 'A',
        moveRight: 'D',
        interact: 'E',
        ability: 'Q',
      },
      showFps: true,
      tutorialHints: true,
      autoSave: true,
      cameraShake: 40,
    },
    accessibility: {
      colorblindMode: 'None',
      textSize: 'Medium',
      reduceMotion: false,
      subtitles: true,
      highContrast: false,
      screenReader: false,
    },
    activeTab: 'audio',
    activeTheme: 'darkMode',
  };
}

/**
 * Validates individual setting values and clamps them into valid ranges.
 * @param {SettingsState} state
 * @returns {SettingsState}
 */
export function validateState(state) {
  const clamp = (value, min, max) => Math.min(Math.max(value, min), max);
  return {
    ...state,
    audio: {
      ...state.audio,
      masterVolume: clamp(state.audio.masterVolume, 0, 100),
      musicVolume: clamp(state.audio.musicVolume, 0, 100),
      effectsVolume: clamp(state.audio.effectsVolume, 0, 100),
    },
    display: {
      ...state.display,
      brightness: clamp(state.display.brightness, 0, 100),
      contrast: clamp(state.display.contrast, 0, 100),
    },
    gameplay: {
      ...state.gameplay,
      cameraShake: clamp(state.gameplay.cameraShake, 0, 100),
    },
  };
}

/**
 * Persists the settings state into localStorage with validation.
 * @param {SettingsState} state
 */
export function saveState(state) {
  try {
    const validated = validateState(state);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(validated));
  } catch (error) {
    console.error('Failed to save settings state', error);
  }
}

/**
 * Restores the settings state from localStorage or returns defaults.
 * @returns {SettingsState}
 */
export function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) {
      return createDefaultState();
    }
    const parsed = JSON.parse(raw);
    return validateState({ ...createDefaultState(), ...parsed });
  } catch (error) {
    console.error('Failed to load settings state', error);
    return createDefaultState();
  }
}

/**
 * Provides a structured interface for managing settings state.
 */
export class StateManager {
  /**
   * @param {SettingsState} initialState
   */
  constructor(initialState) {
    this.state = validateState(initialState);
    this.listeners = new Set();
  }

  /**
   * Returns the current settings state.
   * @returns {SettingsState}
   */
  getState() {
    return this.state;
  }

  /**
   * Updates the state and notifies listeners.
   * @param {(state: SettingsState) => SettingsState} updater
   */
  update(updater) {
    const clone = typeof structuredClone === 'function'
      ? structuredClone
      : (value) => JSON.parse(JSON.stringify(value));
    this.state = validateState(updater(clone(this.state)));
    saveState(this.state);
    this.listeners.forEach((listener) => listener(this.state));
  }

  /**
   * Registers a listener that fires whenever the state changes.
   * @param {(state: SettingsState) => void} listener
   * @returns {() => void}
   */
  subscribe(listener) {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }
}
