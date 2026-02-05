/**
 * Hover Detection Module
 * Handles the 400ms hover delay for ghost interaction
 */

class HoverController {
  constructor(options = {}) {
    this.hoverDelay = options.hoverDelay || 400; // ms
    this.hoverTimeout = null;
    this.isHovering = false;
    this.isControlsVisible = false;

    // Callbacks
    this.onHoverStart = options.onHoverStart || null;
    this.onHoverEnd = options.onHoverEnd || null;

    // Elements
    this.triggerArea = null;
    this.controlsPanel = null;

    this.init();
  }

  init() {
    // The entire app acts as a hover detection area
    document.addEventListener('mouseenter', (e) => this.handleMouseEnter(e));
    document.addEventListener('mouseleave', (e) => this.handleMouseLeave(e));
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));
  }

  setElements(triggerArea, controlsPanel) {
    this.triggerArea = triggerArea;
    this.controlsPanel = controlsPanel;
  }

  handleMouseEnter(e) {
    // Start hover detection timer
    this.startHoverTimer();

    // Enable mouse events on the window when mouse enters
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(false);
    }
  }

  handleMouseLeave(e) {
    // Cancel hover timer and hide controls
    this.cancelHoverTimer();
    this.hideControls();

    // Re-enable click-through when mouse leaves
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  handleMouseMove(e) {
    // If already hovering, keep the timer active
    if (!this.isHovering && !this.hoverTimeout) {
      this.startHoverTimer();
    }
  }

  startHoverTimer() {
    if (this.hoverTimeout) return;

    this.hoverTimeout = setTimeout(() => {
      this.isHovering = true;
      this.showControls();
      this.hoverTimeout = null;
    }, this.hoverDelay);
  }

  cancelHoverTimer() {
    if (this.hoverTimeout) {
      clearTimeout(this.hoverTimeout);
      this.hoverTimeout = null;
    }
    this.isHovering = false;
  }

  showControls() {
    if (this.isControlsVisible) return;

    this.isControlsVisible = true;

    if (this.controlsPanel) {
      this.controlsPanel.classList.remove('hidden');
      this.controlsPanel.classList.add('visible');
    }

    if (this.onHoverStart) {
      this.onHoverStart();
    }
  }

  hideControls() {
    if (!this.isControlsVisible) return;

    this.isControlsVisible = false;

    if (this.controlsPanel) {
      this.controlsPanel.classList.remove('visible');
      this.controlsPanel.classList.add('hidden');
    }

    if (this.onHoverEnd) {
      this.onHoverEnd();
    }
  }

  // Force show controls (for keyboard shortcuts, etc.)
  forceShow() {
    this.cancelHoverTimer();
    this.isHovering = true;
    this.showControls();
  }

  // Force hide controls
  forceHide() {
    this.cancelHoverTimer();
    this.hideControls();
  }
}

// Export for use in app
window.HoverController = HoverController;
