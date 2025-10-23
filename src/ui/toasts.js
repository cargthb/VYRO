import { createElement } from '../utils.js';

/**
 * Shows transient toast notifications for user feedback.
 */
export class ToastManager {
  /**
   * Locates the toast root container in the DOM.
   */
  constructor() {
    this.root = document.getElementById('toastRoot');
  }

  /**
   * Displays a toast with severity styling.
   * @param {'success' | 'error' | 'info'} level
   * @param {string} message
   */
  show(level, message) {
    const toast = createElement('div', { classes: ['toast', level], text: message });
    this.root.appendChild(toast);
    setTimeout(() => {
      toast.classList.add('toast-show');
    }, 10);
    setTimeout(() => {
      toast.classList.remove('toast-show');
      toast.addEventListener('transitionend', () => toast.remove(), { once: true });
    }, 3200);
  }
}
