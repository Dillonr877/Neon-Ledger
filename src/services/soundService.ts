class SoundService {
  private audioCtx: AudioContext | null = null;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
  }

  private playTone(freq: number, type: OscillatorType, duration: number, volume: number = 0.1) {
    this.init();
    if (!this.audioCtx) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, this.audioCtx.currentTime);

    gain.gain.setValueAtTime(volume, this.audioCtx.currentTime);
    gain.gain.exponentialRampToValueAtTime(0.0001, this.audioCtx.currentTime + duration);

    osc.connect(gain);
    gain.connect(this.audioCtx.destination);

    osc.start();
    osc.stop(this.audioCtx.currentTime + duration);
  }

  playAdd() {
    this.playTone(880, 'sine', 0.1, 0.1);
  }

  playDelete() {
    this.playTone(220, 'square', 0.15, 0.05);
  }

  playSwitch() {
    this.playTone(440, 'triangle', 0.2, 0.08);
    setTimeout(() => this.playTone(660, 'triangle', 0.2, 0.05), 50);
  }

  playWarning() {
    const now = this.audioCtx?.currentTime || 0;
    [0, 0.1, 0.2].forEach(delay => {
      setTimeout(() => this.playTone(330, 'sine', 0.1, 0.1), delay * 1000);
    });
  }

  playExceeded() {
    this.playTone(110, 'sawtooth', 0.3, 0.1);
  }

  playGoal() {
    [440, 554.37, 659.25, 880].forEach((f, i) => {
      setTimeout(() => this.playTone(f, 'sine', 0.4, 0.1), i * 100);
    });
  }

  playBoot() {
    this.playTone(55, 'sine', 1.0, 0.2);
    setTimeout(() => this.playTone(880, 'sine', 0.5, 0.1), 800);
  }
}

export const sounds = new SoundService();
