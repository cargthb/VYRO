/**
 * Manages tooltip creation and visibility for interactive controls.
 */
export class TooltipManager {
  /**
   * Sets up tooltip DOM elements and bound handlers.
   */
  constructor() {
    this.tooltip = document.createElement('div');
    this.tooltip.className = 'tooltip';
    document.body.appendChild(this.tooltip);
    this.boundHandleMouseEnter = this.handleMouseEnter.bind(this);
    this.boundHandleMouseLeave = this.handleMouseLeave.bind(this);
    this.boundHandleMouseMove = this.handleMouseMove.bind(this);
  }

  /**
   * Enables tooltip behavior on elements that declare a tooltip.
   */
  activate() {
    document.querySelectorAll('[data-tooltip]').forEach((element) => {
      element.addEventListener('mouseenter', this.boundHandleMouseEnter);
      element.addEventListener('mouseleave', this.boundHandleMouseLeave);
      element.addEventListener('mousemove', this.boundHandleMouseMove);
    });
  }

  /**
   * Deactivates tooltip behavior and hides the tooltip.
   */
  deactivate() {
    document.querySelectorAll('[data-tooltip]').forEach((element) => {
      element.removeEventListener('mouseenter', this.boundHandleMouseEnter);
      element.removeEventListener('mouseleave', this.boundHandleMouseLeave);
      element.removeEventListener('mousemove', this.boundHandleMouseMove);
    });
    this.hide();
  }

  /**
   * Handles pointer entry events for tooltip targets.
   * @param {MouseEvent} event
   */
  handleMouseEnter(event) {
    const target = event.currentTarget;
    const content = target?.getAttribute('data-tooltip');
    if (!content) {
      return;
    }
    this.tooltip.textContent = content;
    this.tooltip.classList.add('visible');
  }

  /**
   * Hides the tooltip when the pointer leaves a target.
   * @param {MouseEvent} event
   */
  handleMouseLeave(event) {
    if (!event.currentTarget) {
      return;
    }
    this.hide();
  }

  /**
   * Updates the tooltip position to follow the cursor.
   * @param {MouseEvent} event
   */
  handleMouseMove(event) {
    const padding = 16;
    this.tooltip.style.left = `${event.pageX + padding}px`;
    this.tooltip.style.top = `${event.pageY + padding}px`;
  }

  /**
   * Hides the tooltip element.
   */
  hide() {
    this.tooltip.classList.remove('visible');
  }
}
