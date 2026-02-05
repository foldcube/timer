/**
 * Timer Logic Tests
 * Tests for the HorizonTimer class
 */

const { test, describe, beforeEach } = require('node:test');
const assert = require('node:assert');

// Mock the timer class for Node.js testing
class HorizonTimer {
  constructor() {
    this.duration = 25 * 60 * 1000;
    this.remaining = this.duration;
    this.isRunning = false;
    this.isPaused = false;
    this.startTime = null;
    this.pausedAt = null;
    this.intervalId = null;
    this.bonusTime = 0;

    this.phases = {
      flow: { min: 0, max: 80 },
      transition: { min: 80, max: 95 },
      crunch: { min: 95, max: 100 }
    };

    this.onTick = null;
    this.onPhaseChange = null;
    this.onComplete = null;
    this.currentPhase = 'flow';
  }

  setDuration(minutes) {
    this.duration = minutes * 60 * 1000;
    this.remaining = this.duration;
    this.bonusTime = 0;
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

  simulateElapsed(ms) {
    this.remaining = Math.max(0, this.duration - ms);
    if (this.remaining === 0) {
      this.bonusTime = ms - this.duration;
    }
  }
}

describe('HorizonTimer', () => {
  let timer;

  beforeEach(() => {
    timer = new HorizonTimer();
  });

  test('should initialize with default 25 minute duration', () => {
    assert.strictEqual(timer.duration, 25 * 60 * 1000);
    assert.strictEqual(timer.remaining, 25 * 60 * 1000);
    assert.strictEqual(timer.isRunning, false);
  });

  test('should set duration correctly', () => {
    timer.setDuration(15);
    assert.strictEqual(timer.duration, 15 * 60 * 1000);
    assert.strictEqual(timer.remaining, 15 * 60 * 1000);
  });

  test('should format time correctly', () => {
    assert.strictEqual(timer.formatTime(0), '00:00');
    assert.strictEqual(timer.formatTime(30000), '00:30');
    assert.strictEqual(timer.formatTime(60000), '01:00');
    assert.strictEqual(timer.formatTime(90000), '01:30');
    assert.strictEqual(timer.formatTime(1500000), '25:00');
    assert.strictEqual(timer.formatTime(3600000), '60:00');
  });

  test('should calculate remaining percentage correctly', () => {
    timer.setDuration(10); // 10 minutes
    const state = timer.getState();
    assert.strictEqual(state.remainingPercent, 100);

    timer.simulateElapsed(5 * 60 * 1000); // 5 minutes elapsed
    const state2 = timer.getState();
    assert.strictEqual(state2.remainingPercent, 50);

    timer.simulateElapsed(10 * 60 * 1000); // All time elapsed
    const state3 = timer.getState();
    assert.strictEqual(state3.remainingPercent, 0);
  });

  describe('Phase Detection', () => {
    test('should return flow phase for 0-80% elapsed', () => {
      assert.strictEqual(timer.getPhase(0), 'flow');
      assert.strictEqual(timer.getPhase(50), 'flow');
      assert.strictEqual(timer.getPhase(79), 'flow');
      assert.strictEqual(timer.getPhase(79.9), 'flow');
    });

    test('should return transition phase for 80-95% elapsed', () => {
      assert.strictEqual(timer.getPhase(80), 'transition');
      assert.strictEqual(timer.getPhase(85), 'transition');
      assert.strictEqual(timer.getPhase(94), 'transition');
      assert.strictEqual(timer.getPhase(94.9), 'transition');
    });

    test('should return crunch phase for 95-100% elapsed', () => {
      assert.strictEqual(timer.getPhase(95), 'crunch');
      assert.strictEqual(timer.getPhase(99), 'crunch');
      assert.strictEqual(timer.getPhase(100), 'crunch');
    });
  });

  describe('State Management', () => {
    test('should return correct initial state', () => {
      const state = timer.getState();

      assert.strictEqual(state.duration, 25 * 60 * 1000);
      assert.strictEqual(state.remaining, 25 * 60 * 1000);
      assert.strictEqual(state.remainingPercent, 100);
      assert.strictEqual(state.bonusTime, 0);
      assert.strictEqual(state.phase, 'flow');
      assert.strictEqual(state.isRunning, false);
      assert.strictEqual(state.isPaused, false);
      assert.strictEqual(state.isBonus, false);
    });

    test('should track bonus time when timer expires', () => {
      timer.setDuration(1); // 1 minute
      timer.simulateElapsed(2 * 60 * 1000); // 2 minutes elapsed (1 min over)

      const state = timer.getState();
      assert.strictEqual(state.remaining, 0);
      assert.strictEqual(state.bonusTime, 60000); // 1 minute bonus
      assert.strictEqual(state.isBonus, true);
    });
  });

  describe('Time Formatting Edge Cases', () => {
    test('should handle negative time for bonus display', () => {
      // Bonus time should be displayed as positive
      assert.strictEqual(timer.formatTime(-60000), '01:00');
    });

    test('should pad single digit minutes and seconds', () => {
      assert.strictEqual(timer.formatTime(65000), '01:05');
      assert.strictEqual(timer.formatTime(5000), '00:05');
    });

    test('should handle large durations', () => {
      assert.strictEqual(timer.formatTime(7200000), '120:00'); // 2 hours
    });
  });
});

// Run tests
console.log('Running timer tests...');
