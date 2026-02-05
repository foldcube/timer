/**
 * Hover Detection Module
 * Handles the 400ms hover delay for ghost interaction
 * Works across multiple monitors with transparent Electron windows
 */

class HoverController {
  constructor(options = {}) {
    this.hoverDelay = options.hoverDelay || 400; // ms
    this.hoverTimeout = null;
    this.isHovering = false;
    this.isControlsVisible = false;
    this.isMouseInWindow = false;

    // Callbacks
    this.onHoverStart = options.onHoverStart || null;
    this.onHoverEnd = options.onHoverEnd || null;

    // Elements
    this.triggerArea = null;
    this.controlsPanel = null;

    this.init();
  }

  init() {
    // Use native mouseenter/mouseleave on document
    // These work with Electron's setIgnoreMouseEvents(true, { forward: true })
    document.documentElement.addEventListener('mouseenter', () => this.handleMouseEnter());
    document.documentElement.addEventListener('mouseleave', () => this.handleMouseLeave());

    // Track mouse movement for hover delay
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Auto-collapse on click outside controls panel
    document.addEventListener('click', (e) => this.handleClick(e));
  }

  setElements(triggerArea, controlsPanel) {
    this.triggerArea = triggerArea;
    this.controlsPanel = controlsPanel;
  }

  handleMouseEnter() {
    if (this.isMouseInWindow) return;
    this.isMouseInWindow = true;

    // Enable mouse events on the window (disable click-through)
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(false);
    }

    // Start hover detection timer
    this.startHoverTimer();
  }

  handleMouseLeave() {
    if (!this.isMouseInWindow) return;
    this.isMouseInWindow = false;

    // Cancel hover timer
    this.cancelHoverTimer();

    // Hide controls
    this.hideControls();

    // Re-enable click-through when mouse leaves
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  handleMouseMove(e) {
    // If we get a mousemove but isMouseInWindow is false, mouse must have entered
    if (!this.isMouseInWindow) {
      this.handleMouseEnter();
    }

    // Restart hover timer if not already showing controls
    if (!this.isHovering && !this.hoverTimeout) {
      this.startHoverTimer();
    }
  }

  handleClick(e) {
    // Auto-collapse if clicking outside interactive elements
    if (!this.isControlsVisible) return;

    // Check if click is on an interactive element (button, input, slider, etc.)
    const interactiveSelectors = 'button, input, .control-btn, .preset-btn, .star-btn, .panel, [role="button"]';
    const clickedOnInteractive = e.target.closest(interactiveSelectors);

    // If clicked on empty space (not on a button/control), hide controls
    if (!clickedOnInteractive) {
      this.cancelHoverTimer();
      this.hideControls();
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

    // Don't hide if there are open panels (analytics, rating, etc.)
    const openPanels = document.querySelectorAll('.panel:not(.hidden)');
    if (openPanels.length > 0) return;

    this.isControlsVisible = false;
    this.isHovering = false;

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
