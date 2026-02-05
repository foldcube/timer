/**
 * Hover Detection Module
 * Handles the 400ms hover delay for ghost interaction
 * Works across multiple monitors with transparent Electron windows
 */

class HoverController {
  constructor(options = {}) {
    this.hoverDelay = options.hoverDelay || 400; // ms
    this.hideDelay = options.hideDelay || 200; // ms - delay before hiding after mouse leaves
    this.hoverTimeout = null;
    this.hideTimeout = null;
    this.isHovering = false;
    this.isControlsVisible = false;
    this.lastMousePosition = { x: 0, y: 0 };
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
    // Track mouse movement
    document.addEventListener('mousemove', (e) => this.handleMouseMove(e));

    // Auto-collapse on click outside controls panel
    document.addEventListener('click', (e) => this.handleClick(e));

    // Use polling to detect when mouse leaves window (more reliable for transparent windows)
    this.startMouseTracking();
  }

  setElements(triggerArea, controlsPanel) {
    this.triggerArea = triggerArea;
    this.controlsPanel = controlsPanel;
  }

  startMouseTracking() {
    // Poll every 100ms to check if mouse is still in window
    setInterval(() => {
      this.checkMousePosition();
    }, 100);
  }

  checkMousePosition() {
    // Get window bounds via IPC if available
    if (window.horizon && window.horizon.getWindowBounds) {
      window.horizon.getWindowBounds().then(bounds => {
        if (!bounds) return;

        const { x, y } = this.lastMousePosition;
        const isInWindow = x >= 0 && x <= bounds.width && y >= 0 && y <= bounds.height;

        if (isInWindow && !this.isMouseInWindow) {
          // Mouse entered window
          this.isMouseInWindow = true;
          this.handleMouseEnter();
        } else if (!isInWindow && this.isMouseInWindow) {
          // Mouse left window
          this.isMouseInWindow = false;
          this.handleMouseLeave();
        }
      });
    } else {
      // Fallback: use document bounds
      const { x, y } = this.lastMousePosition;
      const isInWindow = x >= 0 && x <= window.innerWidth && y >= 0 && y <= window.innerHeight;

      if (isInWindow && !this.isMouseInWindow) {
        this.isMouseInWindow = true;
        this.handleMouseEnter();
      } else if (!isInWindow && this.isMouseInWindow) {
        this.isMouseInWindow = false;
        this.handleMouseLeave();
      }
    }
  }

  handleMouseMove(e) {
    // Update last known mouse position
    this.lastMousePosition = { x: e.clientX, y: e.clientY };

    // Mark mouse as in window
    if (!this.isMouseInWindow) {
      this.isMouseInWindow = true;
      this.handleMouseEnter();
    }

    // Cancel any pending hide
    this.cancelHideTimer();

    // Start hover timer if not already hovering
    if (!this.isHovering && !this.hoverTimeout) {
      this.startHoverTimer();
    }
  }

  handleMouseEnter() {
    // Cancel any pending hide
    this.cancelHideTimer();

    // Start hover detection timer
    this.startHoverTimer();

    // Enable mouse events on the window when mouse enters
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(false);
    }
  }

  handleMouseLeave() {
    // Cancel hover timer
    this.cancelHoverTimer();

    // Start hide timer (small delay to prevent flickering)
    this.startHideTimer();

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

  startHideTimer() {
    if (this.hideTimeout) return;

    this.hideTimeout = setTimeout(() => {
      this.hideControls();
      this.hideTimeout = null;
    }, this.hideDelay);
  }

  cancelHideTimer() {
    if (this.hideTimeout) {
      clearTimeout(this.hideTimeout);
      this.hideTimeout = null;
    }
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

    // Don't hide if there are open panels
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
    this.cancelHideTimer();
    this.isHovering = true;
    this.showControls();
  }

  // Force hide controls
  forceHide() {
    this.cancelHoverTimer();
    this.cancelHideTimer();
    this.hideControls();
  }
}

// Export for use in app
window.HoverController = HoverController;
