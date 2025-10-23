import { createElement } from '../utils.js';

/**
 * Handles creation of modal dialogs used across the application.
 */
export class ModalManager {
  /**
   * Creates a new modal manager instance and locates DOM roots.
   */
  constructor() {
    this.root = document.getElementById('modalRoot');
    this.activeModal = null;
    this.boundHandleKey = this.handleKey.bind(this);
  }

  /**
   * Opens a modal with the provided configuration.
   * @param {{ title: string, message: string, actions: { label: string, variant?: 'primary' | 'danger' | 'secondary', handler: () => void }[] }} options
   */
  open(options) {
    this.close();
    const overlay = createElement('div', { classes: ['modal-overlay'] });
    overlay.addEventListener('click', () => this.close());

    const modal = createElement('div', { classes: ['modal'], attributes: { role: 'dialog', 'aria-modal': 'true' } });
    modal.addEventListener('click', (event) => event.stopPropagation());

    const title = createElement('h2', { text: options.title });
    const message = createElement('p', { text: options.message });

    const actions = createElement('div', { classes: ['modal-actions'] });
    options.actions.forEach((action) => {
      const button = createElement('button', {
        text: action.label,
        classes: [action.variant === 'danger' ? 'danger-button' : action.variant === 'primary' ? 'primary-button' : 'secondary-button'],
      });
      button.addEventListener('click', () => {
        action.handler();
        this.close();
      });
      actions.appendChild(button);
    });

    modal.append(title, message, actions);
    this.root.append(overlay, modal);
    this.activeModal = { overlay, modal };
    document.addEventListener('keydown', this.boundHandleKey);
  }

  /**
   * Closes any active modal dialog and removes event listeners.
   */
  close() {
    if (!this.activeModal) {
      return;
    }
    this.root.removeChild(this.activeModal.overlay);
    this.root.removeChild(this.activeModal.modal);
    this.activeModal = null;
    document.removeEventListener('keydown', this.boundHandleKey);
  }

  /**
   * Handles keyboard shortcuts while a modal is open.
   * @param {KeyboardEvent} event
   */
  handleKey(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }
}
