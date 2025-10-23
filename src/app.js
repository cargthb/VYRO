import { loadState, StateManager } from './state.js';
import { applyThemeStyles } from './utils.js';
import { BackgroundAnimator } from './ui/background.js';
import { StartPageController } from './ui/startPage.js';
import { SettingsController } from './ui/settings.js';
import { ThemeSelector } from './ui/themeSelector.js';
import { TitleAnimator } from './ui/titleAnimation.js';
import { ToastManager } from './ui/toasts.js';
import { getThemeByKey } from './themes.js';

const stateManager = new StateManager(loadState());
const toastManager = new ToastManager();

const backgroundAnimator = new BackgroundAnimator();
const titleAnimator = new TitleAnimator();

/**
 * Applies the theme stored in settings to the UI.
 * @param {string} key
 */
function setTheme(key) {
  const theme = getThemeByKey(key);
  document.body.classList.add('theme-transition');
  applyThemeStyles(theme);
  const computedPrimary = getComputedStyle(document.documentElement)
    .getPropertyValue('--color-primary')
    .trim();
  backgroundAnimator.setPrimaryColor(computedPrimary || '#38bdf8');
  setTimeout(() => document.body.classList.remove('theme-transition'), 600);
}

setTheme(stateManager.getState().activeTheme);

const settingsController = new SettingsController(stateManager, (key) => {
  setTheme(key);
  toastManager.show('success', `Theme set to ${getThemeByKey(key).name}.`);
});

const themeSelector = new ThemeSelector({
  getState: () => stateManager.getState(),
  onThemeChange: (key) => {
    stateManager.update((state) => ({ ...state, activeTheme: key }));
    settingsController.setActiveTheme(key);
    setTheme(key);
    toastManager.show('success', `Theme set to ${getThemeByKey(key).name}.`);
  },
});

const startPageController = new StartPageController({
  onOpenSettings: () => settingsController.open(),
  onOpenThemes: () => themeSelector.open(),
});

// Accessibility enhancements
window.addEventListener('keydown', (event) => {
  if (event.key === 'Escape') {
    themeSelector.close();
  }
});

stateManager.subscribe((state) => {
  if (state.accessibility.reduceMotion) {
    document.body.style.setProperty('scroll-behavior', 'auto');
  } else {
    document.body.style.setProperty('scroll-behavior', 'smooth');
  }
});

// Expose controllers for debugging if needed.
window.vyro = {
  backgroundAnimator,
  titleAnimator,
  startPageController,
  settingsController,
  themeSelector,
};
