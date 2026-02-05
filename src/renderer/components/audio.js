/**
 * Audio Module
 * Brown noise generator and psychoacoustic alarms
 */

class HorizonAudio {
  constructor() {
    this.audioContext = null;
    this.noiseNode = null;
    this.gainNode = null;
    this.isPlaying = false;
    this.volume = 0.3;

    // Alarm settings
    this.alarmDuration = 15000; // 15 second fade-in
  }

  initContext() {
    if (!this.audioContext) {
      this.audioContext = new (window.AudioContext || window.webkitAudioContext)();
    }
    return this.audioContext;
  }

  /**
   * Generate brown noise using filtered white noise
   * Brown noise has more energy at lower frequencies - better for focus
   */
  createBrownNoise() {
    const ctx = this.initContext();
    const bufferSize = 2 * ctx.sampleRate;
    const noiseBuffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
    const output = noiseBuffer.getChannelData(0);

    let lastOut = 0.0;
    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1;
      // Brown noise: integrate white noise
      output[i] = (lastOut + (0.02 * white)) / 1.02;
      lastOut = output[i];
      // Normalize to prevent clipping
      output[i] *= 3.5;
    }

    return noiseBuffer;
  }

  startBrownNoise() {
    if (this.isPlaying) return;

    const ctx = this.initContext();

    // Resume context if suspended (browser autoplay policy)
    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create noise source
    const noiseBuffer = this.createBrownNoise();
    this.noiseNode = ctx.createBufferSource();
    this.noiseNode.buffer = noiseBuffer;
    this.noiseNode.loop = true;

    // Create gain for volume control
    this.gainNode = ctx.createGain();
    this.gainNode.gain.value = this.volume;

    // Connect nodes
    this.noiseNode.connect(this.gainNode);
    this.gainNode.connect(ctx.destination);

    // Start playing
    this.noiseNode.start();
    this.isPlaying = true;
  }

  stopBrownNoise() {
    if (!this.isPlaying || !this.noiseNode) return;

    // Fade out to prevent clicking
    if (this.gainNode) {
      const ctx = this.audioContext;
      this.gainNode.gain.setValueAtTime(this.gainNode.gain.value, ctx.currentTime);
      this.gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5);
    }

    setTimeout(() => {
      if (this.noiseNode) {
        this.noiseNode.stop();
        this.noiseNode.disconnect();
        this.noiseNode = null;
      }
      if (this.gainNode) {
        this.gainNode.disconnect();
        this.gainNode = null;
      }
      this.isPlaying = false;
    }, 500);
  }

  toggleBrownNoise() {
    if (this.isPlaying) {
      this.stopBrownNoise();
    } else {
      this.startBrownNoise();
    }
    return this.isPlaying;
  }

  setVolume(value) {
    // value: 0-100
    this.volume = value / 100;
    if (this.gainNode) {
      this.gainNode.gain.value = this.volume;
    }
  }

  /**
   * Psychoacoustic alarm - gentle sine wave fade-in
   * Uses slow attack envelope to avoid startling the user
   */
  playAlarm() {
    const ctx = this.initContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    // Create oscillator for gentle sine wave
    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 432; // A4 at 432Hz - slightly warmer

    // Create gain for fade-in envelope
    const alarmGain = ctx.createGain();
    alarmGain.gain.value = 0;

    // Connect
    oscillator.connect(alarmGain);
    alarmGain.connect(ctx.destination);

    // Slow attack envelope (10-15 seconds)
    const attackTime = 12; // seconds
    const sustainTime = 3;
    const releaseTime = 2;

    const now = ctx.currentTime;
    alarmGain.gain.setValueAtTime(0, now);
    alarmGain.gain.linearRampToValueAtTime(0.15, now + attackTime);
    alarmGain.gain.setValueAtTime(0.15, now + attackTime + sustainTime);
    alarmGain.gain.exponentialRampToValueAtTime(0.001, now + attackTime + sustainTime + releaseTime);

    // Start and stop
    oscillator.start(now);
    oscillator.stop(now + attackTime + sustainTime + releaseTime + 0.1);

    // Cleanup
    oscillator.onended = () => {
      oscillator.disconnect();
      alarmGain.disconnect();
    };
  }

  /**
   * Quick notification sound - very subtle
   */
  playNotification() {
    const ctx = this.initContext();

    if (ctx.state === 'suspended') {
      ctx.resume();
    }

    const oscillator = ctx.createOscillator();
    oscillator.type = 'sine';
    oscillator.frequency.value = 880;

    const gain = ctx.createGain();
    gain.gain.value = 0;

    oscillator.connect(gain);
    gain.connect(ctx.destination);

    const now = ctx.currentTime;
    gain.gain.setValueAtTime(0, now);
    gain.gain.linearRampToValueAtTime(0.05, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.5);

    oscillator.start(now);
    oscillator.stop(now + 0.6);

    oscillator.onended = () => {
      oscillator.disconnect();
      gain.disconnect();
    };
  }
}

// Export for use in app
window.HorizonAudio = HorizonAudio;
