/**
 * Timer Logic Module
 * Handles the core timer functionality with phase-based color transitions
 */

class HorizonTimer {
  constructor() {
    this.duration = 25 * 60 * 1000; // Default 25 minutes
    this.remaining = this.duration;
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedAt = null;
    this.intervalId = null;
    this.bonusTime = 0;

    // Phase thresholds (percentage of time elapsed)
    this.phases = {
      flow: { min: 0, max: 80 },      // 0-80% elapsed = flow (teal)
      transition: { min: 80, max: 95 }, // 80-95% elapsed = transition (amber)
      crunch: { min: 95, max: 100 }     // 95-100% elapsed = crunch (rose)
    };

    // Callbacks
    this.onTick = null;
    this.onPhaseChange = null;
    this.onComplete = null;
    this.onBonusTick = null;

    this.currentPhase = 'flow';
  }

  setDuration(minutes) {
    this.duration = minutes * 60 * 1000;
    this.remaining = this.duration;
    this.bonusTime = 0;
    if (this.onTick) {
      this.onTick(this.getState());
    }
  }

  start() {
    if (this.isRunning && !this.isPaused) return;

    if (this.isPaused && this.pausedAt) {
      // Resume from pause
      const pauseDuration = Date.now() - this.pausedAt;
      this.startTime += pauseDuration;
      this.isPaused = false;
      this.pausedAt = null;
    } else {
      // Fresh start
      this.startTime = Date.now();
      this.remaining = this.duration;
      this.bonusTime = 0;
    }

    this.isRunning = true;
    this.tick();
    this.intervalId = setInterval(() => this.tick(), 100);
  }

  pause() {
    if (!this.isRunning || this.isPaused) return;

    this.isPaused = true;
    this.pausedAt = Date.now();
    clearInterval(this.intervalId);
    this.intervalId = null;
  }

  reset() {
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedAt = null;
    this.bonusTime = 0;

    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    this.remaining = this.duration;
    this.currentPhase = 'flow';

    if (this.onTick) {
      this.onTick(this.getState());
    }
    if (this.onPhaseChange) {
      this.onPhaseChange('flow');
    }
  }

  tick() {
    if (!this.isRunning || this.isPaused) return;

    const elapsed = Date.now() - this.startTime;
    this.remaining = this.duration - elapsed;

    if (this.remaining <= 0) {
      // Timer complete - start counting bonus time
      this.bonusTime = Math.abs(this.remaining);
      this.remaining = 0;

      const newPhase = 'bonus';
      if (this.currentPhase !== newPhase) {
        this.currentPhase = newPhase;
        if (this.onPhaseChange) {
          this.onPhaseChange(newPhase);
        }
        if (this.onComplete) {
          this.onComplete(this.getState());
        }
      }

      if (this.onBonusTick) {
        this.onBonusTick(this.getState());
      }
    } else {
      // Calculate phase based on elapsed percentage
      const elapsedPercent = (elapsed / this.duration) * 100;
      const newPhase = this.getPhase(elapsedPercent);

      if (newPhase !== this.currentPhase) {
        this.currentPhase = newPhase;
        if (this.onPhaseChange) {
          this.onPhaseChange(newPhase);
        }
      }
    }

    if (this.onTick) {
      this.onTick(this.getState());
    }
  }

  getPhase(elapsedPercent) {
    if (elapsedPercent < this.phases.flow.max) return 'flow';
    if (elapsedPercent < this.phases.transition.max) return 'transition';
    return 'crunch';
  }

  getState() {
    const remainingPercent = this.duration > 0
      ? Math.max(0, (this.remaining / this.duration) * 100)
      : 0;

    return {
      duration: this.duration,
      remaining: this.remaining,
      remainingPercent: remainingPercent,
      bonusTime: this.bonusTime,
      phase: this.currentPhase,
      isRunning: this.isRunning,
      isPaused: this.isPaused,
      isBonus: this.bonusTime > 0
    };
  }

  formatTime(ms) {
    const totalSeconds = Math.floor(Math.abs(ms) / 1000);
    const minutes = Math.floor(totalSeconds / 60);
    const seconds = totalSeconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
  }

  getRemainingFormatted() {
    if (this.bonusTime > 0) {
      return '+' + this.formatTime(this.bonusTime);
    }
    return this.formatTime(this.remaining);
  }
}

// Export for use in app
window.HorizonTimer = HorizonTimer;
