/**
 * SessionTracker - Comprehensive session analytics tracking
 * Captures detailed metrics during timer sessions for performance analysis
 */

class SessionTracker {
  constructor() {
    this.currentSession = null;
    this.isTracking = false;
    
    // Pause tracking state
    this.currentPauseStart = null;
    
    // Phase tracking state
    this.currentPhase = 'flow';
    this.phaseStartTime = null;
  }

  /**
   * Start tracking a new session
   */
  startSession() {
    const now = Date.now();
    
    this.currentSession = {
      id: this.generateId(),
      startTime: now,
      endTime: null,
      duration: 0,
      
      // Cycle tracking
      cyclesCompleted: 0,
      cycleHistory: [],
      currentCycleStart: now,
      
      // Phase distribution (time in milliseconds)
      phaseDistribution: {
        flow: 0,
        transition: 0,
        crunch: 0
      },
      
      // Pause analytics
      pauseCount: 0,
      pauses: [],
      totalPauseTime: 0,
      
      // Captures during session
      captureCount: 0,
      captures: [],
      
      // Performance metrics
      wasSuccessful: true, // Becomes false if any pause occurs
      rating: null,
      
      // Context
      hour: new Date(now).getHours(),
      dayOfWeek: new Date(now).getDay(),
      
      // Extra/Bonus time
      bonusTime: 0,
      
      // Notes
      notes: ''
    };
    
    this.isTracking = true;
    this.currentPhase = 'flow';
    this.phaseStartTime = now;
    
    console.log('[SessionTracker] Session started:', this.currentSession.id);
  }

  /**
   * Record a pause event
   */
  recordPause() {
    if (!this.isTracking || !this.currentSession) return;
    
    const now = Date.now();
    this.currentPauseStart = now;
    
    // Update phase time before pausing
    this.updatePhaseTime();
    
    console.log('[SessionTracker] Pause recorded');
  }

  /**
   * Record resume from pause
   */
  recordResume() {
    if (!this.isTracking || !this.currentSession || !this.currentPauseStart) return;
    
    const now = Date.now();
    const pauseDuration = now - this.currentPauseStart;
    
    // Record pause details
    this.currentSession.pauses.push({
      startTime: this.currentPauseStart,
      endTime: now,
      duration: pauseDuration
    });
    
    this.currentSession.pauseCount++;
    this.currentSession.totalPauseTime += pauseDuration;
    this.currentSession.wasSuccessful = false;
    
    this.currentPauseStart = null;
    
    // Reset phase start time (pauses don't count toward phase time)
    this.phaseStartTime = now;
    
    console.log('[SessionTracker] Resume recorded, pause duration:', this.formatDuration(pauseDuration));
  }

  /**
   * Record phase change
   */
  recordPhaseChange(newPhase) {
    if (!this.isTracking || !this.currentSession) return;
    
    // Update time for previous phase
    this.updatePhaseTime();
    
    // Start tracking new phase
    this.currentPhase = newPhase;
    this.phaseStartTime = Date.now();
    
    console.log('[SessionTracker] Phase changed to:', newPhase);
  }

  /**
   * Update time spent in current phase
   */
  updatePhaseTime() {
    if (!this.phaseStartTime || !this.currentPhase) return;
    
    const now = Date.now();
    const phaseTime = now - this.phaseStartTime;
    
    if (this.currentSession.phaseDistribution[this.currentPhase] !== undefined) {
      this.currentSession.phaseDistribution[this.currentPhase] += phaseTime;
    }
    
    // Reset for next update
    this.phaseStartTime = now;
  }

  /**
   * Record cycle completion
   */
  recordCycleComplete(cycleNumber, cycleDuration) {
    if (!this.isTracking || !this.currentSession) return;
    
    const now = Date.now();
    
    // Update phase time before cycle ends
    this.updatePhaseTime();
    
    // Record cycle history
    this.currentSession.cycleHistory.push({
      cycleNumber: cycleNumber,
      startTime: this.currentSession.currentCycleStart,
      endTime: now,
      duration: cycleDuration
    });
    
    this.currentSession.cyclesCompleted++;
    this.currentSession.currentCycleStart = now;
    
    // Reset phase tracking for new cycle
    this.currentPhase = 'flow';
    this.phaseStartTime = now;
    
    console.log('[SessionTracker] Cycle completed:', cycleNumber);
  }

  /**
   * Record a thought capture during session
   */
  recordCapture(captureText) {
    if (!this.isTracking || !this.currentSession) return;
    
    this.currentSession.captures.push({
      timestamp: Date.now(),
      text: captureText
    });
    
    this.currentSession.captureCount++;
    
    console.log('[SessionTracker] Capture recorded');
  }

  /**
   * Set bonus time
   */
  setBonusTime(bonusMs) {
    if (!this.isTracking || !this.currentSession) return;
    
    this.currentSession.bonusTime = bonusMs;
  }

  /**
   * End the current session and return summary
   */
  endSession(rating = null) {
    if (!this.isTracking || !this.currentSession) return null;
    
    const now = Date.now();
    
    // Update phase time before ending
    this.updatePhaseTime();
    
    // Finalize session
    this.currentSession.endTime = now;
    this.currentSession.duration = now - this.currentSession.startTime - this.currentSession.totalPauseTime;
    this.currentSession.rating = rating;
    
    // Remove temporary tracking fields
    delete this.currentSession.currentCycleStart;
    
    const sessionSummary = { ...this.currentSession };
    
    // Reset tracking state
    this.isTracking = false;
    this.currentSession = null;
    this.currentPauseStart = null;
    this.phaseStartTime = null;
    
    console.log('[SessionTracker] Session ended:', sessionSummary.id);
    
    return sessionSummary;
  }

  /**
   * Get current session summary (without ending it)
   */
  getSessionSummary() {
    if (!this.currentSession) return null;
    
    const now = Date.now();
    const currentDuration = now - this.currentSession.startTime - this.currentSession.totalPauseTime;
    
    return {
      ...this.currentSession,
      duration: currentDuration,
      isActive: this.isTracking
    };
  }

  /**
   * Generate unique session ID
   */
  generateId() {
    return `session-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Format duration for logging
   */
  formatDuration(ms) {
    const seconds = Math.floor(ms / 1000);
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    
    if (minutes > 0) {
      return `${minutes}m ${remainingSeconds}s`;
    }
    return `${remainingSeconds}s`;
  }

  /**
   * Check if currently tracking
   */
  isActiveSession() {
    return this.isTracking && this.currentSession !== null;
  }
}

// Export for use in app
window.SessionTracker = SessionTracker;
