// Resume only from a deliberate user action; never queue game sounds while suspended.
export class GameAudio {
  constructor({ muted = true, createContext, onChange = () => {} } = {}) {
    this.muted = muted;
    this.createContext = createContext || (() => new (window.AudioContext || window.webkitAudioContext)());
    this.onChange = onChange;
    this.context = null;
    this.voices = new Set();
    this.failed = false;
  }
  get state() { return this.muted ? 'muted' : this.failed ? 'unavailable' : this.context?.state || 'suspended'; }
  setMuted(value) {
    this.muted = value;
    if (value) this.silence();
    this.onChange(this.state);
  }
  silence() {
    for (const voice of this.voices) { try { voice.stop(); } catch {} }
    this.voices.clear();
  }
  async unlock() {
    if (this.muted) return false;
    try {
      if (!this.context || this.context.state === 'closed') {
        this.context = this.createContext();
        this.context.onstatechange = () => this.onChange(this.state);
      }
      // Call resume immediately within the click/tap, then await readiness.
      if (this.context.state !== 'running') await this.context.resume();
      this.failed = this.context.state !== 'running';
    } catch { this.failed = true; }
    this.onChange(this.state);
    return !this.muted && !this.failed;
  }
  play(frequency = 520, duration = .13) {
    if (this.muted || this.failed || this.context?.state !== 'running' || this.voices.size >= 6) return false;
    try {
      const context = this.context, oscillator = context.createOscillator(), gain = context.createGain();
      oscillator.type = 'sine';
      oscillator.frequency.setValueAtTime(frequency, context.currentTime);
      gain.gain.setValueAtTime(.001, context.currentTime);
      gain.gain.exponentialRampToValueAtTime(.085, context.currentTime + .008);
      gain.gain.exponentialRampToValueAtTime(.001, context.currentTime + duration);
      oscillator.connect(gain); gain.connect(context.destination);
      this.voices.add(oscillator);
      oscillator.onended = () => { oscillator.disconnect(); gain.disconnect(); this.voices.delete(oscillator); };
      oscillator.start(); oscillator.stop(context.currentTime + duration + .015);
      return true;
    } catch { this.failed = true; this.onChange(this.state); return false; }
  }
}
