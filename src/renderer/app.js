/**
 * Horizon Timer - Main Application
 * Ties together all components
 */

(function() {
  'use strict';

  // Initialize components
  const timer = new HorizonTimer();
  const audio = new HorizonAudio();
  let hover = null;
  let captureCount = 0;

  // DOM Elements
  const horizonLine = document.getElementById('horizon-line');
  const controlsPanel = document.getElementById('controls-panel');
  const timerDisplay = document.getElementById('timer-display');
  const timerLabel = document.getElementById('timer-label');
  const btnStart = document.getElementById('btn-start');
  const btnPause = document.getElementById('btn-pause');
  const btnReset = document.getElementById('btn-reset');
  const btnNoise = document.getElementById('btn-noise');
  const noiseVolume = document.getElementById('noise-volume');
  const btnAnalytics = document.getElementById('btn-analytics');
  const analyticsPanel = document.getElementById('analytics-panel');
  const closeAnalytics = document.getElementById('close-analytics');
  const ratingPanel = document.getElementById('rating-panel');
  const captureCountBadge = document.getElementById('capture-count');
  const presetBtns = document.querySelectorAll('.preset-btn');
  const starBtns = document.querySelectorAll('.star-btn');
  const skipRating = document.getElementById('skip-rating');
  const floatingTimer = document.getElementById('floating-timer');
  const floatingTime = document.getElementById('floating-time');
  const btnShowTimer = document.getElementById('btn-show-timer');
  const timerOpacity = document.getElementById('timer-opacity');

  // Session tracking
  let sessionStartTime = null;
  let sessionCaptureCount = 0;

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
    hover.setElements(document.body, controlsPanel);

    // Set up timer callbacks
    timer.onTick = handleTimerTick;
    timer.onPhaseChange = handlePhaseChange;
    timer.onComplete = handleTimerComplete;
    timer.onBonusTick = handleBonusTick;

    // Initial UI update
    handleTimerTick(timer.getState());

    // Bind event listeners
    bindEvents();

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
      sessionStartTime = Date.now();
      sessionCaptureCount = 0;
    });

    btnPause.addEventListener('click', () => {
      timer.pause();
      btnPause.classList.add('hidden');
      btnStart.classList.remove('hidden');
      btnStart.textContent = 'Resume';
    });

    btnReset.addEventListener('click', () => {
      timer.reset();
      btnPause.classList.add('hidden');
      btnStart.classList.remove('hidden');
      btnStart.textContent = 'Start';
      ratingPanel.classList.add('hidden');
    });

    // Duration presets
    presetBtns.forEach(btn => {
      btn.addEventListener('click', () => {
        const minutes = parseInt(btn.dataset.minutes);
        timer.setDuration(minutes);

        // Update active state
        presetBtns.forEach(b => b.classList.remove('active'));
        btn.classList.add('active');

        // Save setting
        saveSettings({ timerDuration: minutes * 60 * 1000 });
      });
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

    // Analytics
    btnAnalytics.addEventListener('click', async () => {
      await loadAnalytics();
      analyticsPanel.classList.remove('hidden');
    });

    closeAnalytics.addEventListener('click', () => {
      analyticsPanel.classList.add('hidden');
    });

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

    // Update horizon line width
    const widthPercent = state.remainingPercent;
    horizonLine.style.width = `${widthPercent}%`;

    // Update label
    if (state.isBonus) {
      timerLabel.textContent = 'Bonus Time';
      timerDisplay.classList.add('bonus');
    } else if (state.isPaused) {
      timerLabel.textContent = 'Paused';
      timerDisplay.classList.remove('bonus');
    } else if (state.isRunning) {
      timerLabel.textContent = 'Focus Time';
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
   * Handle timer completion
   */
  function handleTimerComplete(state) {
    // Play gentle alarm
    audio.playAlarm();

    // Show rating panel after a moment
    setTimeout(() => {
      showRatingPanel();
    }, 2000);
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

    const summary = document.getElementById('session-summary');
    summary.textContent = `${sessionDuration} min session • ${sessionCaptureCount} thoughts captured`;

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

    await window.horizon.saveSession({
      duration: sessionDuration,
      captureCount: sessionCaptureCount,
      rating: rating,
      hour: new Date().getHours()
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
