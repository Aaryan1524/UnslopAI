/**
 * Zero-dependency Web Audio tactile feedback synthesizer.
 * Lazily initializes AudioContext on first user interaction and supports clean muting.
 */

export interface MicroSynthOptions {
  /** Initial mute state (default: false). Audio still only plays inside user gestures. */
  muted?: boolean;
  /** Master output gain in [0, 1] (default: 0.12 for crisp non-intrusive clicks). */
  masterGain?: number;
}

export class MicroSynth {
  private ctx: AudioContext | null = null;
  private master: GainNode | null = null;
  private muted: boolean;
  private masterGainValue: number;

  constructor(options: MicroSynthOptions = {}) {
    this.muted = options.muted ?? false;
    this.masterGainValue = Math.max(0, Math.min(1, options.masterGain ?? 0.12));
  }

  public isMuted(): boolean {
    return this.muted;
  }

  public setMuted(next: boolean): void {
    this.muted = next;
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(
        next ? 0 : this.masterGainValue,
        this.ctx.currentTime,
      );
    }
  }

  public toggleMuted(): boolean {
    this.setMuted(!this.muted);
    return this.muted;
  }

  private ensureContext(): AudioContext | null {
    if (this.muted || typeof window === 'undefined') return null;

    const AudioCtx =
      window.AudioContext ||
      (window as unknown as { webkitAudioContext?: typeof AudioContext })
        .webkitAudioContext;
    if (!AudioCtx) return null;

    if (!this.ctx) {
      this.ctx = new AudioCtx();
      this.master = this.ctx.createGain();
      this.master.gain.value = this.muted ? 0 : this.masterGainValue;
      this.master.connect(this.ctx.destination);
    }

    if (this.ctx.state === 'suspended') {
      void this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  /** Crisp mechanical switch click (buttons, tabs, chips). */
  public playClick(): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1450, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.018);

    env.gain.setValueAtTime(0.9, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.02);

    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.022);
  }

  /** Subtle high-frequency detent tick (rotary knobs, stepped sliders). */
  public playDetent(pitchMultiplier = 1): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    const baseFreq = 2200 * Math.max(0.5, Math.min(2, pitchMultiplier));
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(baseFreq, now);
    osc.frequency.exponentialRampToValueAtTime(baseFreq * 0.45, now + 0.01);

    env.gain.setValueAtTime(0.55, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.012);

    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.014);
  }

  /** Low-end tactile thud for latching toggles or power switches. */
  public playToggle(active: boolean): void {
    const ctx = this.ensureContext();
    if (!ctx || !this.master) return;

    const now = ctx.currentTime;
    const osc = ctx.createOscillator();
    const env = ctx.createGain();

    osc.type = 'sine';
    const startFreq = active ? 210 : 160;
    const endFreq = active ? 420 : 95;
    osc.frequency.setValueAtTime(startFreq, now);
    osc.frequency.exponentialRampToValueAtTime(endFreq, now + 0.028);

    env.gain.setValueAtTime(0.85, now);
    env.gain.exponentialRampToValueAtTime(0.001, now + 0.032);

    osc.connect(env);
    env.connect(this.master);
    osc.start(now);
    osc.stop(now + 0.035);
  }

  public dispose(): void {
    if (this.ctx) {
      void this.ctx.close().catch(() => {});
      this.ctx = null;
      this.master = null;
    }
  }
}

export const microSynth = new MicroSynth();
