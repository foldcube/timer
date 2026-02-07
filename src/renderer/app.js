/**
 * Horizon Timer - Main Application
 * Ties together all components
 */

(function() {
  'use strict';

  // Initialize components
  const timer = new HorizonTimer();
  const audio = new HorizonAudio();
  const sessionTracker = new SessionTracker();
  const analyticsEngine = new AnalyticsEngine();
  let hover = null;
  const analyticsDashboard = new AnalyticsDashboard(analyticsEngine);
  let captureCount = 0;
  let charts = {}; // Store chart instances

  // DOM Elements
  const horizonLine = document.getElementById('horizon-line');
  const controlsPanel = document.getElementById('controls-panel');
  const timerDisplay = document.getElementById('timer-display');
  const timerLabel = document.getElementById('timer-label');
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnEnd = document.getElementById('btn-end');
  const btnNoise = document.getElementById('btn-noise');
  const noiseVolume = document.getElementById('noise-volume');
  const btnAutoNoise = document.getElementById('btn-auto-noise');
  const btnAnalytics = document.getElementById('btn-analytics');
  const analyticsPanel = document.getElementById('analytics-panel');
  const ratingPanel = document.getElementById('rating-panel');
  const captureCountBadge = document.getElementById('capture-count');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const starBtns = document.querySelectorAll('.star-btn');
  const skipRating = document.getElementById('skip-rating');
  const floatingTimer = document.getElementById('floating-timer');
  const floatingTime = document.getElementById('floating-time');
  const btnShowTimer = document.getElementById('btn-show-timer');
  const timerOpacity = document.getElementById('timer-opacity');
  const alarmVolume = document.getElementById('alarm-volume');
  const btnDisplayMode = document.getElementById('btn-display-mode');
  const btnAutoStartApp = document.getElementById('btn-auto-start');
  const customTimeInput = document.getElementById('custom-time');
  const customTimeValue = document.getElementById('custom-time-value');
  const btnExportData = document.getElementById('export-data');
  const filterPeriod = document.getElementById('filter-period');
  const filterSuccess = document.getElementById('filter-success');

  // Session tracking
  let sessionStartTime = null;
  let sessionCaptureCount = 0;
  let autoStartNoise = false; // Auto-start noise with timer

  /**
   * Initialize the application
   */
  async function init() {
    // Load settings
    const settings = await window.horizon.getSettings();
    if (settings) {
      timer.setDuration(settings.timerDuration / 60000);
      noiseVolume.value = settings.brownNoiseVolume * 100;
      audio.setVolume(settings.brownNoiseVolume * 100);

      // Load floating timer settings
      if (settings.showFloatingTimer) {
        floatingTimer.classList.remove('hidden');
        btnShowTimer.classList.add('active');
      }
      if (settings.floatingTimerOpacity !== undefined) {
        timerOpacity.value = settings.floatingTimerOpacity * 100;
        floatingTimer.style.opacity = settings.floatingTimerOpacity;
      }
      
      // Load auto-start noise setting
      if (settings.autoStartNoise !== undefined) {
        autoStartNoise = settings.autoStartNoise;
        btnAutoNoise.classList.toggle('active', autoStartNoise);
      }
      
      // Load alarm volume setting
      if (settings.alarmVolume !== undefined) {
        alarmVolume.value = settings.alarmVolume * 100;
        audio.setAlarmVolume(settings.alarmVolume * 100);
      }

      // Load display mode setting
      if (settings.displayMode !== undefined) {
        updateDisplayModeUI(settings.displayMode);
      }
    }

    // Load auto-start status
    const autoStartEnabled = await window.horizon.getAutoStart();
    if (autoStartEnabled) {
      btnAutoStartApp.classList.add('active');
    }

    // Load capture count
    const captures = await window.horizon.getCaptures();
    captureCount = captures.length;
    updateCaptureCount();

    // Initialize hover controller
    hover = new HoverController({
      hoverDelay: settings?.hoverDelay || 400,
      onHoverStart: () => {
        // Controls shown
      },
      onHoverEnd: () => {
        // Controls hidden
      }
    });
    hover.setElements(horizonLine, controlsPanel);

    // Set up timer callbacks
    timer.onTick = handleTimerTick;
    timer.onPhaseChange = handlePhaseChange;
    timer.onComplete = handleTimerComplete;
    timer.onBonusTick = handleBonusTick;
    timer.onCycleChange = handleCycleChange;

    // Initial UI update
    handleTimerTick(timer.getState());

    // Bind event listeners
    bindEvents();
    
    // Listen for display mode changes from main process
    window.horizon.onDisplayModeChanged(async (mode) => {
      updateDisplayModeUI(mode);
      
      // Reposition analytics panel if it's open
      if (!analyticsPanel.classList.contains('hidden')) {
        await positionAnalyticsPanel();
      }
      
      console.log('Display mode auto-changed to:', mode);
    });

    console.log('Horizon Timer initialized');
  }

  /**
   * Bind UI event listeners
   */
  function bindEvents() {
    // Timer controls
    btnStart.addEventListener('click', () => {
      timer.start();
      btnStart.classList.add('hidden');
      btnPause.classList.remove('hidden');
      btnEnd.classList.remove('hidden');
      sessionStartTime = Date.now();
      sessionCaptureCount = 0;
      
      // Start or resume session tracking
      if (!sessionTracker.isActiveSession()) {
        sessionTracker.startSession();
      } else {
        // Resuming from pause
        sessionTracker.recordResume();
      }
      
      // Auto-start noise if enabled
      if (autoStartNoise && !audio.isPlaying) {
        audio.startBrownNoise();
        btnNoise.querySelector('.icon').textContent = '🔊';
        btnNoise.classList.add('active');
      }
    });

    btnPause.addEventListener('click', () => {
      timer.pause();
      btnPause.classList.add('hidden');
      btnStart.classList.remove('hidden');
      btnStart.textContent = 'Resume';
      
      // Track pause event
      sessionTracker.recordPause();
      
      // Auto-pause noise if enabled
      if (autoStartNoise && audio.isPlaying) {
        audio.stopBrownNoise();
        btnNoise.querySelector('.icon').textContent = '🔇';
        btnNoise.classList.remove('active');
      }
    });

    btnEnd.addEventListener('click', async () => {
      // End and save session
      if (sessionTracker.isActiveSession()) {
        const sessionData = sessionTracker.endSession();
        if (sessionData) {
          await window.horizon.saveSessionAnalytics(sessionData);
          console.log('Session saved:', sessionData);
        }
      }
      
      timer.reset();
      btnPause.classList.add('hidden');
      btnEnd.classList.add('hidden');
      btnStart.classList.remove('hidden');
      btnStart.textContent = 'Start';
      
      // Auto-stop noise if enabled
      if (autoStartNoise && audio.isPlaying) {
        audio.stopBrownNoise();
        btnNoise.querySelector('.icon').textContent = '🔇';
        btnNoise.classList.remove('active');
      }
    });

    // Duration presets
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        timer.setDuration(minutes);

        // Update active state
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Clear custom input
        customTimeInput.value = '';

        // Save setting
        saveSettings({ timerDuration: minutes * 60 * 1000 });
      });
    });

    // Custom time slider
    customTimeInput.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      
      // Update display value
      customTimeValue.textContent = `${value}m`;
      
      // Update timer duration (1-60 minutes)
      timer.setDuration(value);
      
      // Clear preset selection
      presetBtns.forEach(b => b.classList.remove('active'));
      
      // Save setting
      saveSettings({ timerDuration: value * 60 * 1000 });
    });

    // Audio controls
    btnNoise.addEventListener('click', () => {
      const isPlaying = audio.toggleBrownNoise();
      btnNoise.querySelector('.icon').textContent = isPlaying ? '🔊' : '🔇';
      btnNoise.classList.toggle('active', isPlaying);
    });

    noiseVolume.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      audio.setVolume(value);
      saveSettings({ brownNoiseVolume: value / 100 });
    });
    
    // Auto-start noise toggle
    btnAutoNoise.addEventListener('click', () => {
      autoStartNoise = !autoStartNoise;
      btnAutoNoise.classList.toggle('active', autoStartNoise);
      saveSettings({ autoStartNoise: autoStartNoise });
    });
    
    // Alarm volume control
    alarmVolume.addEventListener('input', (e) => {
      const value = parseInt(e.target.value);
      audio.setAlarmVolume(value);
      saveSettings({ alarmVolume: value / 100 });
    });

    // Floating timer display toggle
    btnShowTimer.addEventListener('click', () => {
      const isVisible = !floatingTimer.classList.contains('hidden');
      if (isVisible) {
        floatingTimer.classList.add('hidden');
        btnShowTimer.classList.remove('active');
      } else {
        floatingTimer.classList.remove('hidden');
        btnShowTimer.classList.add('active');
      }
      saveSettings({ showFloatingTimer: !isVisible });
    });

    // Floating timer opacity
    timerOpacity.addEventListener('input', (e) => {
      const value = parseInt(e.target.value) / 100;
      floatingTimer.style.opacity = value;
      saveSettings({ floatingTimerOpacity: value });
    });

    // Display mode toggle
    btnDisplayMode.addEventListener('click', async () => {
      const currentSettings = await window.horizon.getSettings();
      const currentMode = currentSettings.displayMode || 'all-screens';
      const newMode = currentMode === 'all-screens' ? 'primary-screen' : 'all-screens';
      
      await window.horizon.setDisplayMode(newMode);
      updateDisplayModeUI(newMode);
      saveSettings({ displayMode: newMode });
    });

    // Auto-start toggle
    btnAutoStartApp.addEventListener('click', async () => {
      const currentEnabled = await window.horizon.getAutoStart();
      const newEnabled = !currentEnabled;
      
      const success = await window.horizon.setAutoStart(newEnabled);
      if (success) {
        btnAutoStartApp.classList.toggle('active', newEnabled);
        saveSettings({ autoStart: newEnabled });
      }
    });

   // CORRECTED ANALYTICS SECTION FOR app.js (lines 309-340)
// Replace lines 309-340 in src/renderer/app.js with this:

    // Analytics - Toggle behavior
    btnAnalytics.addEventListener('click', async () => {
      try {
        const isHidden = analyticsPanel.classList.contains('hidden');
        
        if (isHidden) {
          // Opening panel
          await analyticsDashboard.loadDashboard();
          await positionAnalyticsPanel();
          analyticsPanel.classList.remove('hidden');
          
          // Resize window for minimal dashboard (600px height)
          await window.horizon.setWindowHeight(600);
        } else {
          // Closing panel
          analyticsPanel.classList.add('hidden');
          
          // Restore window to original height
          await window.horizon.setWindowHeight(120);
        }
      } catch (error) {
        console.error('Error toggling analytics:', error);
      }
    });

    // Close button removed - panel now toggles via stats button

    // Export data button
    if (btnExportData) {
      btnExportData.addEventListener('click', async () => {
        await analyticsDashboard.exportData('csv');
      });
    }

    // Period filter
    if (filterPeriod) {
      filterPeriod.addEventListener('change', (e) => {
        analyticsDashboard.filterByPeriod(e.target.value);
      });
    }

    // Success filter
    if (filterSuccess) {
      filterSuccess.addEventListener('change', (e) => {
        analyticsDashboard.filterBySuccess(e.target.value);
      });
    }


    // Rating
    starBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const rating = parseInt(btn.dataset.rating);
        selectRating(rating);
        saveSession(rating);
      });

      btn.addEventListener('mouseenter', () => {
        const rating = parseInt(btn.dataset.rating);
        highlightStars(rating);
      });

      btn.addEventListener('mouseleave', () => {
        highlightStars(0);
      });
    });

    skipRating.addEventListener('click', () => {
      saveSession(null);
    });
  }

  /**
   * Handle timer tick - update display
   */
  function handleTimerTick(state) {
    const timeText = timer.getRemainingFormatted();

    // Update timer display
    timerDisplay.textContent = timeText;

    // Update floating timer display
    floatingTime.textContent = timeText;

    // Calculate progress width (reverse on odd cycles)
    let widthPercent = state.remainingPercent;
    if (state.isReversed) {
      // Odd cycles: invert progress (left-to-right)
      widthPercent = 100 - state.remainingPercent;
    }
    
    // Update horizon line width via CSS variable (for ::before pseudo-element)
    horizonLine.style.setProperty('--progress-width', `${widthPercent}%`);

    // Update animation state
    horizonLine.classList.toggle('running', state.isRunning && !state.isPaused && !state.isBonus);
    horizonLine.classList.toggle('bonus', state.isBonus);
    horizonLine.classList.toggle('reversed', state.isReversed);

    // Position floating timer at the end of the progress line
    if (!floatingTimer.classList.contains('hidden')) {
      const windowWidth = window.innerWidth;
      const progressWidth = (windowWidth * widthPercent) / 100;
      const timerWidth = floatingTimer.offsetWidth || 60; // Approximate width
      let timerPosition = Math.max(20, progressWidth - timerWidth - 10); // 10px offset from end
      
      // Ensure timer doesn't go off right edge
      timerPosition = Math.min(timerPosition, windowWidth - timerWidth - 20);
      
      floatingTimer.style.left = `${timerPosition}px`;
    }

    // Update label
    if (state.isBonus) {
      timerLabel.textContent = 'Bonus Time';
      timerDisplay.classList.add('bonus');
    } else if (state.isPaused) {
      const totalElapsed = timer.getTotalElapsedFormatted();
      timerLabel.textContent = `Paused • Cycle ${state.cycleNumber + 1} • Total: ${totalElapsed}`;
      timerDisplay.classList.remove('bonus');
    } else if (state.isRunning) {
      const totalElapsed = timer.getTotalElapsedFormatted();
      timerLabel.textContent = `Cycle ${state.cycleNumber + 1} • Total: ${totalElapsed}`;
      timerDisplay.classList.remove('bonus');
    } else {
      timerLabel.textContent = 'Ready';
      timerDisplay.classList.remove('bonus');
    }
  }

  /**
   * Handle phase change - update colors
   */
  function handlePhaseChange(phase) {
    // Track phase change in session
    if (sessionTracker.isActiveSession()) {
      sessionTracker.recordPhaseChange(phase);
    }
    
    // Remove all phase classes from horizon line
    horizonLine.classList.remove('phase-flow', 'phase-transition', 'phase-crunch', 'phase-bonus');
    // Add current phase class
    horizonLine.classList.add(`phase-${phase}`);

    // Update floating timer color too
    floatingTimer.classList.remove('phase-flow', 'phase-transition', 'phase-crunch', 'phase-bonus');
    floatingTimer.classList.add(`phase-${phase}`);

    console.log(`Phase changed to: ${phase}`);
  }

  /**
   * Handle cycle change
   */
  function handleCycleChange(cycleNumber) {
    // Track cycle completion in session
    if (sessionTracker.isActiveSession() && cycleNumber > 0) {
      sessionTracker.recordCycleComplete(cycleNumber - 1, timer.duration);
    }
  }

  /**
   * Handle timer completion
   */
  function handleTimerComplete(state) {
    // Play gentle alarm
    audio.playAlarm();

    // Session rating removed - timer continues cycling
    // setTimeout(() => {
    //   showRatingPanel();
    // }, 2000);
  }

  /**
   * Handle bonus time tick
   */
  function handleBonusTick(state) {
    // Bonus time styling is handled in handleTimerTick
  }

  /**
   * Show the session rating panel
   */
  function showRatingPanel() {
    const sessionDuration = sessionStartTime
      ? Math.floor((Date.now() - sessionStartTime) / 60000)
      : 0;

    const sessionMetrics = timer.getSessionMetrics();
    const summary = document.getElementById('session-summary');
    
    let summaryText = `${sessionDuration} min session • ${sessionCaptureCount} thoughts captured`;
    if (sessionMetrics.hadPause) {
      summaryText += ` • ${sessionMetrics.pauseCount} pause${sessionMetrics.pauseCount > 1 ? 's' : ''}`;
    }
    
    summary.textContent = summaryText;

    ratingPanel.classList.remove('hidden');
  }

  /**
   * Highlight stars up to rating
   */
  function highlightStars(rating) {
    starBtns.forEach(btn => {
      const btnRating = parseInt(btn.dataset.rating);
      btn.classList.toggle('active', btnRating <= rating);
    });
  }

  /**
   * Select a rating
   */
  function selectRating(rating) {
    highlightStars(rating);
  }

  /**
   * Save session with rating
   */
  async function saveSession(rating) {
    const sessionDuration = sessionStartTime
      ? Date.now() - sessionStartTime
      : 0;

    const sessionMetrics = timer.getSessionMetrics();

    await window.horizon.saveSession({
      duration: sessionDuration,
      captureCount: sessionCaptureCount,
      rating: rating,
      hour: new Date().getHours(),
      hadPause: sessionMetrics.hadPause,
      pauseCount: sessionMetrics.pauseCount,
      totalPauseTime: sessionMetrics.totalPauseTime,
      wasSuccessful: sessionMetrics.wasSuccessful
    });

    ratingPanel.classList.add('hidden');
    timer.reset();
    btnPause.classList.add('hidden');
    btnStart.classList.remove('hidden');
    btnStart.textContent = 'Start';
  }

  /**
   * Load and display analytics
   */
  async function loadAnalytics() {
    const analytics = await window.horizon.getAnalytics();
    const captures = await window.horizon.getCaptures();

    document.getElementById('stat-sessions').textContent = analytics.totalSessions;
    document.getElementById('stat-captures').textContent = analytics.totalCaptures;
    document.getElementById('stat-rating').textContent =
      analytics.averageRating > 0 ? analytics.averageRating.toFixed(1) : '--';
    document.getElementById('stat-week-sessions').textContent = analytics.sessionsThisWeek;

    // Recent captures
    const capturesList = document.getElementById('recent-captures');
    capturesList.innerHTML = '';

    const recentCaptures = captures.slice(-10).reverse();
    recentCaptures.forEach(capture => {
      const li = document.createElement('li');
      li.textContent = capture.text;
      capturesList.appendChild(li);
    });

    if (recentCaptures.length === 0) {
      const li = document.createElement('li');
      li.textContent = 'No captures yet. Use Alt+Space to capture thoughts!';
      li.style.fontStyle = 'italic';
      capturesList.appendChild(li);
    }
  }

  /**
   * Update capture count badge
   */
  function updateCaptureCount() {
    captureCountBadge.textContent = captureCount;
  }

  /**
   * Position analytics panel based on display configuration
   */
  async function positionAnalyticsPanel() {
    try {
      const displayInfo = await window.horizon.getDisplayInfo();
      
      if (!displayInfo) return;
      
      const { numDisplays, primaryBounds, displayMode } = displayInfo;
      
      // In multi-monitor mode with all-screens display, position at center-left of primary monitor
      if (numDisplays > 1 && displayMode === 'all-screens') {
        // Calculate center-left position on primary monitor
        // Position at 30% from the left edge of the primary monitor
        const panelWidth = 800; // Analytics panel width
        const centerLeftPercent = 0.30; // 30% from left
        const leftPosition = primaryBounds.x + (primaryBounds.width * centerLeftPercent) - (panelWidth / 2);
        
        // Apply multi-monitor positioning
        analyticsPanel.classList.add('multi-monitor');
        analyticsPanel.style.setProperty('--panel-left', `${leftPosition}px`);
        
        console.log(`Multi-monitor positioning: ${numDisplays} displays, positioned at ${leftPosition}px`);
      } else {
        // Single monitor or primary-screen mode: use default centered positioning
        analyticsPanel.classList.remove('multi-monitor');
        analyticsPanel.style.removeProperty('--panel-left');
        
        console.log('Single monitor positioning: centered');
      }
    } catch (error) {
      console.error('Error positioning analytics panel:', error);
      // Fall back to default centered positioning
      analyticsPanel.classList.remove('multi-monitor');
      analyticsPanel.style.removeProperty('--panel-left');
    }
  }

  /**
   * Update display mode UI
   */
  function updateDisplayModeUI(mode) {
    const label = btnDisplayMode.querySelector('.label');
    if (mode === 'all-screens') {
      label.textContent = 'All';
      btnDisplayMode.classList.add('active');
    } else {
      label.textContent = '1';
      btnDisplayMode.classList.remove('active');
    }
  }

  /**
   * Save settings
   */
  async function saveSettings(updates) {
    const currentSettings = await window.horizon.getSettings();
    const newSettings = { ...currentSettings, ...updates };
    await window.horizon.saveSettings(newSettings);
  }

  /**
   * Called when a capture is made (from quick capture window)
   */
  window.addEventListener('storage', async (e) => {
    // Refresh capture count when storage changes
    const captures = await window.horizon.getCaptures();
    captureCount = captures.length;
    sessionCaptureCount++;
    updateCaptureCount();
  });

  // Poll for capture updates (since storage events don't work across Electron windows)
  setInterval(async () => {
    const captures = await window.horizon.getCaptures();
    if (captures.length !== captureCount) {
      const newCaptures = captures.length - captureCount;
      captureCount = captures.length;
      sessionCaptureCount += newCaptures;
      updateCaptureCount();

      // Brief notification
      audio.playNotification();
    }
  }, 1000);

  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', init);
  } else {
    init();
  }
})();
