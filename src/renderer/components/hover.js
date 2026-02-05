/**
 * Hover Detection Module
 * Handles the 400ms hover delay for ghost interaction
 * Works across multiple monitors with transparent Electron windows
 */

class HoverController {
  constructor(options = {}) {
    this.hoverDelay = options.hoverDelay || 400; // ms
    this.inactivityThreshold = 150; // ms - if no mouse activity, assume left
    this.hoverTimeout = null;
    this.isHovering = false;
    this.isControlsVisible = false;
    this.lastActivityTime = 0;
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
    // Track mouse movement - this only fires when mouse is inside window
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Auto-collapse on click outside controls panel
    document.addEventListener('click', (e) => this.handleClick(e));

    // Poll to detect when mouse has left (no activity = mouse left)
    this.startInactivityDetection();
  }

  setElements(triggerArea, controlsPanel) {
    this.triggerArea = triggerArea;
    this.controlsPanel = controlsPanel;
  }

  startInactivityDetection() {
    // Check every 100ms if we've stopped receiving mouse events
    setInterval(() => {
      const now = Date.now();
      const timeSinceActivity = now - this.lastActivityTime;

      // If no mouse activity for threshold period, mouse has left
      if (this.isMouseInWindow && timeSinceActivity > this.inactivityThreshold) {
        this.isMouseInWindow = false;
        this.handleMouseLeave();
      }
    }, 100);
  }

  handleMouseMove(e) {
    // Update activity timestamp
    this.lastActivityTime = Date.now();

    // Mouse is in window (we received an event)
    if (!this.isMouseInWindow) {
      this.isMouseInWindow = true;
      this.handleMouseEnter();
    }

    // Start hover timer if not already hovering
    if (!this.isHovering && !this.hoverTimeout) {
      this.startHoverTimer();
    }
  }

  handleMouseEnter() {
    // Enable mouse events on the window
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(false);
    }

    // Start hover detection timer
    this.startHoverTimer();
  }

  handleMouseLeave() {
    // Cancel hover timer
    this.cancelHoverTimer();

    // Hide controls
    this.hideControls();

    // Re-enable click-through when mouse leaves
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(true, { forward: true });
    }
  }

  handleClick(e) {
    // Auto-collapse if clicking outside the controls panel
    if (!this.isControlsVisible || !this.controlsPanel) return;

    // Check if click is inside controls panel or any open panel
    const panels = document.querySelectorAll('.panel:not(.hidden)');
    let clickedInside = this.controlsPanel.contains(e.target);

    panels.forEach(panel => {
      if (panel.contains(e.target)) {
        clickedInside = true;
      }
    });

    // If clicked outside, hide controls
    if (!clickedInside) {
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
