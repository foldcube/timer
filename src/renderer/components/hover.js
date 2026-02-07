/**
 * Hover Detection Module
 * Handles the 400ms hover delay for ghost interaction
 * Works across multiple monitors with transparent Electron windows
 */

class HoverController {
  constructor(options = {}) {
    this.hoverDelay = options.hoverDelay || 400; // ms
    this.hideDelay = options.hideDelay || 300; // ms grace period before hiding
    this.hoverTimeout = null;
    this.hideTimeout = null;
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
    // Click handler on document for collapse/expand functionality
    document.addEventListener('click', (e) => this.handleClick(e));
  }

  setElements(triggerArea, controlsPanel) {
    this.triggerArea = triggerArea;
    this.controlsPanel = controlsPanel;

    // Set up hover detection only on the horizon line (3px active area)
    if (this.triggerArea) {
      this.triggerArea.addEventListener('mouseenter', () => this.handleMouseEnter());
      this.triggerArea.addEventListener('mouseleave', () => this.handleMouseLeave());
      
      // Direct click handler on horizon line for reliable detection
      this.triggerArea.addEventListener('click', (e) => {
        console.log('Horizon line clicked!');
        e.stopPropagation(); // Prevent document click handler from also firing
        
        if (!this.isControlsVisible) {
          this.showControls();
        } else {
          this.hideControls();
        }
      });
    }

    // Also detect when mouse enters/leaves controls panel to keep it visible
    if (this.controlsPanel) {
      this.controlsPanel.addEventListener('mouseenter', () => {
        this.isMouseInWindow = true;
        this.cancelHoverTimer();
        this.cancelHideTimer(); // Cancel any pending hide when entering controls
      });
      this.controlsPanel.addEventListener('mouseleave', () => {
        this.isMouseInWindow = false;
        this.startHideTimer(); // Delayed hide when leaving controls
      });
    }
  }

  handleMouseEnter() {
    if (this.isMouseInWindow) return;
    this.isMouseInWindow = true;

    // Enable mouse events on the window (disable click-through)
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(false);
    }

    // Note: Removed auto-show on hover to prevent accidental display
    // Menu now only shows on click
  }

  handleMouseLeave() {
    if (!this.isMouseInWindow) return;
    this.isMouseInWindow = false;

    // Cancel hover timer
    this.cancelHoverTimer();

    // Start delayed hide (grace period to move to controls panel)
    this.startHideTimer();
    
    // Note: Don't re-enable click-through here - wait until controls actually hide
  }

  handleClick(e) {
    // Check if analytics panel is open
    const analyticsPanel = document.getElementById('analytics-panel');
    if (analyticsPanel && !analyticsPanel.classList.contains('hidden')) {
      // Check if click is inside the analytics panel
      const clickedInPanel = e.target.closest('#analytics-panel');
      if (!clickedInPanel) {
        // Click was outside analytics panel, close it
        analyticsPanel.classList.add('hidden');
        return;
      }
    }

    // Check if rating panel is open
    const ratingPanel = document.getElementById('rating-panel');
    if (ratingPanel && !ratingPanel.classList.contains('hidden')) {
      // Check if click is inside the rating panel
      const clickedInRatingPanel = e.target.closest('#rating-panel');
      if (!clickedInRatingPanel) {
        // Don't close rating panel on outside clicks - user must rate or skip
        return;
      }
    }

    // Check if click is on timer-related elements
    const timerElements = '#horizon-line, #controls-panel, .panel, #floating-timer';
    const clickedOnTimer = e.target.closest(timerElements);
    
    // Ignore clicks that aren't on timer elements (they're for other apps)
    if (!clickedOnTimer) {
      return;
    }

    // Check if click is on an interactive element (button, input, slider, etc.)
    const interactiveSelectors = 'button, input, .control-btn, .preset-btn, .star-btn, .panel, [role="button"]';
    const clickedOnInteractive = e.target.closest(interactiveSelectors);

    // If controls are hidden, show them immediately when clicking on horizon line
    if (!this.isControlsVisible) {
      this.cancelHoverTimer();
      this.cancelHideTimer();
      this.isHovering = true;
      this.showControls();
      return;
    }

    // If controls are visible and clicked on empty space (not on a button/control), hide controls
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

  startHideTimer() {
    // Cancel any existing hide timer
    this.cancelHideTimer();

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

    // Cancel any pending hide when showing controls
    this.cancelHideTimer();

    // Ensure mouse events are enabled for the window
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(false);
    }

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
    this.isHovering = false;

    if (this.controlsPanel) {
      this.controlsPanel.classList.remove('visible');
      this.controlsPanel.classList.add('hidden');
    }

    // Re-enable click-through when controls are hidden
    if (window.horizon) {
      window.horizon.setIgnoreMouseEvents(true, { forward: true });
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
