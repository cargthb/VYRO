import { THEMES } from '../themes.js';
import { createElement, toggleVisibility } from '../utils.js';

/**
 * Presents a theme selection dialog with previews and transition animations.
 */
export class ThemeSelector {
  /**
   * @param {{ getState: () => import('../state.js').SettingsState, onThemeChange: (key: string) => void }} options
   */
  constructor(options) {
    this.options = options;
    this.panel = document.getElementById('settingsPanel');
    this.container = createElement('div', { classes: ['settings-content'] });
    this.container.id = 'themeSelector';
    this.modal = null;
    this.wasStartPageVisible = true;
  }

  /**
   * Renders the theme selection content inside a modal dialog.
   */
  open() {
    if (this.modal) {
      return;
    }

    const root = document.getElementById('modalRoot');
    const startPage = document.getElementById('startPage');
    this.wasStartPageVisible = !startPage.classList.contains('hidden');
    const overlay = createElement('div', { classes: ['modal-overlay'] });
    const modal = createElement('div', {
      classes: ['modal'],
      attributes: { role: 'dialog', 'aria-modal': 'true', 'aria-label': 'Theme selector' },
    });

    const header = createElement('h2', { text: 'Select Theme' });
    const grid = createElement('div', { classes: ['theme-grid'] });

    const activeTheme = this.options.getState().activeTheme;

    THEMES.forEach((theme) => {
      const card = createElement('button', { classes: ['theme-card'], attributes: { type: 'button' } });
      if (theme.key === activeTheme) {
        card.classList.add('active');
      }
      const thumbnail = createElement('div', {
        classes: ['theme-thumbnail'],
      });
      thumbnail.style.backgroundImage = theme.thumbnail;
      const name = createElement('strong', { text: theme.name });
      const meta = createElement('div', { classes: ['theme-meta'] });
      meta.append(name, createElement('span', { text: theme.description }));
      card.append(thumbnail, meta);
      card.addEventListener('click', () => {
        this.applyTheme(theme.key);
        Array.from(grid.children).forEach((child) => child.classList.remove('active'));
        card.classList.add('active');
      });
      grid.appendChild(card);
    });

    const closeButton = createElement('button', { text: 'Close', classes: ['secondary-button'] });
    closeButton.addEventListener('click', () => this.close());

    modal.append(header, grid, closeButton);
    modal.addEventListener('click', (event) => event.stopPropagation());
    overlay.addEventListener('click', () => this.close());

    root.append(overlay, modal);
    this.modal = { overlay, modal };
    if (this.wasStartPageVisible) {
      toggleVisibility(startPage, false);
    }
  }

  /**
   * Closes the theme modal and restores the previous screen visibility.
   */
  close() {
    if (!this.modal) {
      return;
    }
    this.modal.overlay.remove();
    this.modal.modal.remove();
    this.modal = null;
    if (this.wasStartPageVisible) {
      toggleVisibility(document.getElementById('startPage'), true);
    }
  }

  /**
   * Applies a theme and notifies the state manager.
   * @param {string} key
   */
  applyTheme(key) {
    this.options.onThemeChange(key);
  }
}
