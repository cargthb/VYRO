import { clone, createElement, formatPercent, toggleVisibility, playTone } from '../utils.js';
import { createDefaultState } from '../state.js';
import { ModalManager } from './modals.js';
import { ToastManager } from './toasts.js';

/**
 * Coordinates the settings interface, including tab navigation and data binding.
 */
export class SettingsController {
  /**
   * @param {import('../state.js').StateManager} stateManager
   * @param {(key: string) => void} onThemeChange
   */
  constructor(stateManager, onThemeChange) {
    this.stateManager = stateManager;
    this.onThemeChange = onThemeChange;
    this.modalManager = new ModalManager();
    this.toastManager = new ToastManager();
    this.panel = document.getElementById('settingsPanel');
    this.content = document.getElementById('settingsContent');
    this.breadcrumb = document.getElementById('breadcrumbTrail');
    this.status = document.getElementById('settingsStatus');
    this.loadingIndicator = document.getElementById('loadingIndicator');
    this.tabs = Array.from(document.querySelectorAll('.settings-tab'));
    this.backButton = document.getElementById('settingsBack');
    this.cancelButton = document.getElementById('cancelSettings');
    this.applyButton = document.getElementById('applySettings');
    this.resetButton = document.getElementById('resetSettings');
    this.draft = clone(this.stateManager.getState());
    this.audioTestIndicators = { music: null, effects: null };
    this.boundHandleKey = this.handleKey.bind(this);
    this.attachEvents();
    this.activateTab(this.draft.activeTab);
  }

  /**
   * Wires event listeners for navigation controls and action buttons.
   */
  attachEvents() {
    this.tabs.forEach((tab) => {
      tab.addEventListener('click', () => this.activateTab(tab.dataset.tab));
    });

    this.backButton.addEventListener('click', () => this.close());
    this.cancelButton.addEventListener('click', () => {
      this.draft = clone(this.stateManager.getState());
      this.activateTab(this.draft.activeTab);
      this.close();
      this.toastManager.show('info', 'Changes discarded.');
    });

    this.applyButton.addEventListener('click', () => this.applySettings());
    this.resetButton.addEventListener('click', () => this.confirmReset());
  }

  /**
   * Opens the settings panel.
   */
  open() {
    this.draft = clone(this.stateManager.getState());
    this.activateTab(this.draft.activeTab);
    toggleVisibility(document.getElementById('startPage'), false);
    toggleVisibility(this.panel, true);
    document.addEventListener('keydown', this.boundHandleKey);
  }

  /**
   * Closes the settings panel.
   */
  close() {
    toggleVisibility(this.panel, false);
    toggleVisibility(document.getElementById('startPage'), true);
    document.removeEventListener('keydown', this.boundHandleKey);
  }

  /**
   * Handles global keyboard shortcuts for the settings panel.
   * @param {KeyboardEvent} event
   */
  handleKey(event) {
    if (event.key === 'Escape') {
      this.close();
    }
  }

  /**
   * Activates the provided settings tab.
   * @param {string} key
   */
  activateTab(key) {
    this.tabs.forEach((tab) => {
      tab.classList.toggle('active', tab.dataset.tab === key);
      tab.setAttribute('aria-selected', tab.dataset.tab === key ? 'true' : 'false');
    });
    this.draft.activeTab = key;
    this.stateManager.update((state) => ({ ...state, activeTab: key }));
    this.renderContent(key);
    this.updateBreadcrumb(key);
  }

  /**
   * Synchronizes the currently selected theme with the draft state.
   * @param {string} key
   */
  setActiveTheme(key) {
    this.draft.activeTheme = key;
  }

  /**
   * Updates the breadcrumb trail to reflect the active tab.
   * @param {string} key
   */
  updateBreadcrumb(key) {
    const label = key.charAt(0).toUpperCase() + key.slice(1);
    this.breadcrumb.innerHTML = `Start <span>/</span> Settings <span>/</span> ${label}`;
  }

  /**
   * Renders the settings content for the chosen tab.
   * @param {string} key
   */
  renderContent(key) {
    this.content.innerHTML = '';
    switch (key) {
      case 'audio':
        this.renderAudioSettings();
        break;
      case 'display':
        this.renderDisplaySettings();
        break;
      case 'gameplay':
        this.renderGameplaySettings();
        break;
      case 'accessibility':
        this.renderAccessibilitySettings();
        break;
      default:
        break;
    }
  }

  /**
   * Generates a section wrapper with a heading for settings content grouping.
   * @param {string} title
   * @returns {HTMLElement}
   */
  renderSection(title) {
    const section = createElement('section', { classes: ['settings-section'] });
    section.appendChild(createElement('h2', { text: title }));
    return section;
  }

  /**
   * Builds the audio tab controls including sliders, toggles, and test buttons.
   */
  renderAudioSettings() {
    const section = this.renderSection('Audio Mix');
    const controls = createElement('div', { classes: ['control-group'] });
    this.audioTestIndicators.music = null;
    this.audioTestIndicators.effects = null;
    controls.append(
      this.createSliderControl('Master Volume', 'audio.masterVolume', this.draft.audio.masterVolume),
      this.createSliderControl('Music Volume', 'audio.musicVolume', this.draft.audio.musicVolume),
      this.createSliderControl('Effects Volume', 'audio.effectsVolume', this.draft.audio.effectsVolume),
      this.createToggleControl('Mute All', 'audio.mute', this.draft.audio.mute),
      this.createButtonControl('Test Music Channel', () => this.testChannel('music')),
      this.createButtonControl('Test Effects Channel', () => this.testChannel('effects')),
    );
    const musicStatus = this.createStatusControl('Music Channel Test', this.draft.audio.musicTested, 'Tested', 'Pending');
    const effectsStatus = this.createStatusControl('Effects Channel Test', this.draft.audio.effectsTested, 'Tested', 'Pending');
    this.audioTestIndicators.music = musicStatus.querySelector('.status-indicator');
    this.audioTestIndicators.effects = effectsStatus.querySelector('.status-indicator');
    controls.append(musicStatus, effectsStatus);
    section.appendChild(controls);
    this.content.appendChild(section);
  }

  /**
   * Builds the display configuration controls such as resolution and brightness.
   */
  renderDisplaySettings() {
    const section = this.renderSection('Display Configuration');
    const controls = createElement('div', { classes: ['control-group'] });
    controls.append(
      this.createSelectControl('Resolution', 'display.resolution', this.draft.display.resolution, [
        '3840x2160',
        '3440x1440',
        '2560x1440',
        '1920x1080',
        '1600x900',
        '1280x720',
      ]),
      this.createToggleControl('Fullscreen', 'display.fullscreen', this.draft.display.fullscreen),
      this.createToggleControl('Vertical Sync', 'display.vsync', this.draft.display.vsync),
      this.createSliderControl('Brightness', 'display.brightness', this.draft.display.brightness),
      this.createSliderControl('Contrast', 'display.contrast', this.draft.display.contrast),
      this.createSelectControl('Display Mode', 'display.displayMode', this.draft.display.displayMode, [
        'windowed',
        'borderless',
        'fullscreen',
      ]),
    );
    section.appendChild(controls);
    this.content.appendChild(section);
  }

  /**
   * Constructs the gameplay settings tab with difficulty and control bindings.
   */
  renderGameplaySettings() {
    const section = this.renderSection('Gameplay Preferences');
    const controls = createElement('div', { classes: ['control-group'] });
    controls.append(
      this.createSelectControl('Difficulty', 'gameplay.difficulty', this.draft.gameplay.difficulty, [
        'Easy',
        'Normal',
        'Hard',
        'Expert',
      ]),
      this.createControlEditor(),
      this.createToggleControl('Show FPS Counter', 'gameplay.showFps', this.draft.gameplay.showFps),
      this.createToggleControl('Tutorial Hints', 'gameplay.tutorialHints', this.draft.gameplay.tutorialHints),
      this.createToggleControl('Auto-Save', 'gameplay.autoSave', this.draft.gameplay.autoSave),
      this.createSliderControl('Camera Shake', 'gameplay.cameraShake', this.draft.gameplay.cameraShake),
    );
    section.appendChild(controls);
    this.content.appendChild(section);
  }

  /**
   * Creates the accessibility settings tab with assistive feature controls.
   */
  renderAccessibilitySettings() {
    const section = this.renderSection('Accessibility Options');
    const controls = createElement('div', { classes: ['control-group'] });
    const screenReaderIndicator = this.createStatusControl(
      'Screen Reader Support',
      this.draft.accessibility.screenReader,
    );

    controls.append(
      this.createRadioGroup('Colorblind Modes', 'accessibility.colorblindMode', this.draft.accessibility.colorblindMode, [
        'None',
        'Protanopia',
        'Deuteranopia',
        'Tritanopia',
      ]),
      this.createSelectControl('Text Size', 'accessibility.textSize', this.draft.accessibility.textSize, [
        'Small',
        'Medium',
        'Large',
        'Extra Large',
      ]),
      this.createToggleControl('Reduce Motion', 'accessibility.reduceMotion', this.draft.accessibility.reduceMotion),
      this.createToggleControl('Subtitles', 'accessibility.subtitles', this.draft.accessibility.subtitles),
      this.createToggleControl('High Contrast Mode', 'accessibility.highContrast', this.draft.accessibility.highContrast),
      this.createToggleControl(
        'Screen Reader Mode',
        'accessibility.screenReader',
        this.draft.accessibility.screenReader,
        (enabled) => {
          const indicator = screenReaderIndicator.querySelector('.status-indicator');
          if (indicator) {
            const trueText = indicator.dataset.trueText ?? 'Detected';
            const falseText = indicator.dataset.falseText ?? 'Not Detected';
            indicator.textContent = enabled ? trueText : falseText;
          }
        },
      ),
      screenReaderIndicator,
    );
    section.appendChild(controls);
    this.content.appendChild(section);
  }

  /**
   * Produces a slider control with progress bar and value label.
   * @param {string} label
   * @param {string} path
   * @param {number} value
   * @returns {HTMLElement}
   */
  createSliderControl(label, path, value) {
    const wrapper = createElement('div', { classes: ['control'] });
    const labelElement = createElement('label', { text: label });
    const slider = createElement('input', {
      classes: ['slider-input'],
      attributes: { type: 'range', min: '0', max: '100', value: String(value), 'data-path': path },
    });
    const indicator = createElement('div', { classes: ['progress-bar'] });
    const fill = createElement('div', { classes: ['fill'] });
    fill.style.width = `${value}%`;
    indicator.appendChild(fill);
    const valueLabel = createElement('span', { text: formatPercent(value) });

    slider.addEventListener('input', (event) => {
      const target = event.target;
      const newValue = Number(target.value);
      fill.style.width = `${newValue}%`;
      valueLabel.textContent = formatPercent(newValue);
      this.updateDraft(path, newValue);
    });

    wrapper.append(labelElement, slider, indicator, valueLabel);
    return wrapper;
  }

  /**
   * Produces a checkbox toggle control with status feedback.
   * @param {string} label
   * @param {string} path
   * @param {boolean} value
   * @param {(enabled: boolean) => void} [onChange]
   * @returns {HTMLElement}
   */
  createToggleControl(label, path, value, onChange) {
    const wrapper = createElement('div', { classes: ['control'] });
    const labelElement = createElement('label', { text: label });
    const row = createElement('div', { classes: ['toggle-row'] });
    const checkbox = createElement('input', {
      attributes: { type: 'checkbox', 'data-path': path },
    });
    checkbox.checked = value;
    const statusLabel = createElement('span', { text: value ? 'Enabled' : 'Disabled' });
    checkbox.addEventListener('change', () => {
      statusLabel.textContent = checkbox.checked ? 'Enabled' : 'Disabled';
      this.updateDraft(path, checkbox.checked);
      if (path === 'accessibility.highContrast' && checkbox.checked) {
        this.toastManager.show('success', 'High contrast overrides theme colors for legibility.');
      }
      if (onChange) {
        onChange(checkbox.checked);
      }
    });
    row.append(checkbox, statusLabel);
    wrapper.append(labelElement, row);
    return wrapper;
  }

  /**
   * Creates a select dropdown for enumerated choices.
   * @param {string} label
   * @param {string} path
   * @param {string} value
   * @param {string[]} options
   * @returns {HTMLElement}
   */
  createSelectControl(label, path, value, options) {
    const wrapper = createElement('div', { classes: ['control'] });
    const labelElement = createElement('label', { text: label });
    const select = createElement('select', { classes: ['select-input'], attributes: { 'data-path': path } });
    options.forEach((option) => {
      const optionElement = createElement('option', { text: option, attributes: { value: option } });
      if (option === value) {
        optionElement.selected = true;
      }
      select.appendChild(optionElement);
    });
    select.addEventListener('change', () => {
      this.updateDraft(path, select.value);
    });
    wrapper.append(labelElement, select);
    return wrapper;
  }

  /**
   * Builds a single action button control.
   * @param {string} label
   * @param {() => void} handler
   * @returns {HTMLElement}
   */
  createButtonControl(label, handler) {
    const wrapper = createElement('div', { classes: ['control'] });
    const button = createElement('button', { text: label, classes: ['secondary-button'] });
    button.addEventListener('click', handler);
    wrapper.append(button);
    return wrapper;
  }

  /**
   * Produces a radio group for mutually exclusive options.
   * @param {string} label
   * @param {string} path
   * @param {string} value
   * @param {string[]} options
   * @returns {HTMLElement}
   */
  createRadioGroup(label, path, value, options) {
    const wrapper = createElement('div', { classes: ['control'] });
    wrapper.appendChild(createElement('label', { text: label }));
    const group = createElement('div', { classes: ['radio-group'] });
    options.forEach((option) => {
      const id = `${path}-${option}`.replace(/\s+/g, '-').toLowerCase();
      const container = createElement('div', { classes: ['toggle-row'] });
      const radio = createElement('input', { attributes: { type: 'radio', name: path, id, value: option } });
      radio.checked = option === value;
      radio.addEventListener('change', () => {
        if (radio.checked) {
          this.updateDraft(path, option);
        }
      });
      const text = createElement('label', { text: option, attributes: { for: id } });
      container.append(radio, text);
      group.appendChild(container);
    });
    wrapper.appendChild(group);
    return wrapper;
  }

  /**
   * Builds a status indicator for read-only accessibility information.
   * @param {string} label
   * @param {boolean} enabled
   * @param {string} [trueText='Detected']
   * @param {string} [falseText='Not Detected']
   * @returns {HTMLElement}
   */
  createStatusControl(label, enabled, trueText = 'Detected', falseText = 'Not Detected') {
    const wrapper = createElement('div', { classes: ['control'] });
    const labelElement = createElement('label', { text: label });
    const status = createElement('div', { text: enabled ? trueText : falseText, classes: ['status-indicator'] });
    status.dataset.trueText = trueText;
    status.dataset.falseText = falseText;
    status.setAttribute('role', 'status');
    status.setAttribute('aria-live', 'polite');
    wrapper.append(labelElement, status);
    return wrapper;
  }

  /**
   * Creates the control binding editor for remapping gameplay inputs.
   * @returns {HTMLElement}
   */
  createControlEditor() {
    const wrapper = createElement('div', { classes: ['control'] });
    wrapper.appendChild(createElement('label', { text: 'Control Scheme' }));
    const list = createElement('div', { classes: ['control-list'] });
    Object.entries(this.draft.gameplay.controls).forEach(([action, binding]) => {
      const row = createElement('div', { classes: ['toggle-row'] });
      const actionLabel = createElement('span', { text: action });
      const input = createElement('input', {
        classes: ['text-input'],
        attributes: { value: binding, 'data-action': action, maxlength: '12' },
      });
      input.addEventListener('input', () => {
        if (!input.value.trim()) {
          input.classList.add('error');
        } else {
          input.classList.remove('error');
          this.draft.gameplay.controls[action] = input.value.trim();
        }
      });
      row.append(actionLabel, input);
      list.appendChild(row);
    });
    wrapper.appendChild(list);
    return wrapper;
  }

  /**
   * Updates the staged draft state for a settings value.
   * @param {string} path
   * @param {unknown} value
   */
  updateDraft(path, value) {
    const [section, field] = path.split('.');
    if (section && field) {
      this.draft[section][field] = value;
      this.status.textContent = 'Unsaved changes';
    }
  }

  /**
   * Plays a test tone for the requested audio channel.
   * @param {'music' | 'effects'} channel
   */
  testChannel(channel) {
    if (this.draft.audio.mute) {
      this.toastManager.show('error', 'Unmute audio before testing.');
      return;
    }
    const volume = channel === 'music' ? this.draft.audio.musicVolume : this.draft.audio.effectsVolume;
    playTone(volume / 100, channel === 'music' ? 440 : 660);
    this.toastManager.show('success', `${channel === 'music' ? 'Music' : 'Effects'} channel test.`);
    const flag = channel === 'music' ? 'musicTested' : 'effectsTested';
    this.draft.audio[flag] = true;
    const indicator = this.audioTestIndicators[channel];
    if (indicator) {
      indicator.textContent = indicator.dataset.trueText ?? 'Tested';
    }
  }

  /**
   * Opens a confirmation dialog before restoring default settings.
   */
  confirmReset() {
    this.modalManager.open({
      title: 'Reset Settings',
      message: 'Restore all settings to default values?',
      actions: [
        { label: 'Cancel', handler: () => undefined },
        {
          label: 'Reset',
          variant: 'danger',
          handler: () => {
            this.draft = createDefaultState();
            this.activateTab(this.draft.activeTab);
            this.status.textContent = 'Defaults restored';
          },
        },
      ],
    });
  }

  /**
   * Validates and persists the draft state to storage.
   */
  applySettings() {
    toggleVisibility(this.loadingIndicator, true);
    setTimeout(() => {
      toggleVisibility(this.loadingIndicator, false);
      this.stateManager.update(() => clone(this.draft));
      this.status.textContent = 'Settings saved';
      this.toastManager.show('success', 'Preferences applied successfully.');
      if (this.draft.accessibility.highContrast) {
        document.body.classList.add('high-contrast');
      } else {
        document.body.classList.remove('high-contrast');
      }
      this.onThemeChange(this.draft.activeTheme);
    }, 650);
  }
}
