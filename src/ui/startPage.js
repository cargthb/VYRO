import { ModalManager } from './modals.js';
import { ToastManager } from './toasts.js';
import { TooltipManager } from './tooltip.js';
import { toggleVisibility } from '../utils.js';

/**
 * Manages interactions within the start page, including modals and navigation triggers.
 */
export class StartPageController {
  /**
   * Creates a start page controller handling navigation triggers.
   * @param {{ onOpenSettings: () => void, onOpenThemes: () => void }} callbacks
   */
  constructor(callbacks) {
    this.callbacks = callbacks;
    this.modalManager = new ModalManager();
    this.toastManager = new ToastManager();
    this.tooltipManager = new TooltipManager();
    this.soundOn = true;
    this.init();
  }

  /**
   * Initializes button bindings and tooltip interactions for the start screen.
   */
  init() {
    const play = document.getElementById('playButton');
    const settings = document.getElementById('settingsButton');
    const themes = document.getElementById('themesButton');
    const credits = document.getElementById('creditsButton');
    const quit = document.getElementById('quitButton');
    const soundToggle = document.getElementById('soundToggle');

    play.addEventListener('click', () => {
      this.toastManager.show('success', 'Gameplay systems arrive in phase two.');
    });

    settings.addEventListener('click', () => {
      this.callbacks.onOpenSettings();
    });

    themes.addEventListener('click', () => {
      this.callbacks.onOpenThemes();
    });

    credits.addEventListener('click', () => {
      this.modalManager.open({
        title: 'Credits',
        message: 'Created by CR',
        actions: [
          {
            label: 'Close',
            handler: () => undefined,
          },
        ],
      });
    });

    quit.addEventListener('click', () => {
      this.modalManager.open({
        title: 'Confirm Exit',
        message: 'Are you sure you want to leave VYRO?',
        actions: [
          {
            label: 'Cancel',
            handler: () => undefined,
          },
          {
            label: 'Quit',
            variant: 'danger',
            handler: () => this.toastManager.show('info', 'Browser tabs cannot be closed programmatically for safety.'),
          },
        ],
      });
    });

    soundToggle.addEventListener('click', () => {
      this.soundOn = !this.soundOn;
      soundToggle.setAttribute('aria-pressed', String(this.soundOn));
      soundToggle.querySelector('.label').textContent = this.soundOn ? 'Sound On' : 'Sound Off';
      soundToggle.querySelector('.icon').textContent = this.soundOn ? '🔊' : '🔇';
      this.toastManager.show('info', this.soundOn ? 'Sound enabled.' : 'Sound muted.');
    });

    this.tooltipManager.activate();
  }

  /**
   * Shows or hides the start page.
   * @param {boolean} visible
   */
  toggle(visible) {
    const page = document.getElementById('startPage');
    toggleVisibility(page, visible);
  }
}
