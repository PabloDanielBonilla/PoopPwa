// Web Audio API synthesizer for Global Poop Radar effects

class RadarAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  constructor() {
    // Lazy init
  }

  private getContext(): AudioContext | null {
    if (this.isMuted) return null;
    if (typeof window === 'undefined') return null;

    try {
      if (!this.ctx) {
        const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
        if (AudioCtx) {
          this.ctx = new AudioCtx();
        }
      }
      if (this.ctx && this.ctx.state === 'suspended') {
        this.ctx.resume().catch(() => {});
      }
      return this.ctx;
    } catch {
      return null;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getMuted(): boolean {
    return this.isMuted;
  }

  // Cartoonish subtle, humorous "Plop!" sound for poop drops
  public playPlop(variant: 'standard' | 'deep' | 'bubbly' = 'standard') {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      
      // Primary bubble oscillator (drops pitch rapidly)
      const osc1 = ctx.createOscillator();
      const gain1 = ctx.createGain();

      // Secondary body/harmonic oscillator for cartoon roundness
      const osc2 = ctx.createOscillator();
      const gain2 = ctx.createGain();

      // Low resonance pop
      const startFreq = variant === 'deep' ? 380 : variant === 'bubbly' ? 620 : 490;
      const endFreq = variant === 'deep' ? 95 : variant === 'bubbly' ? 160 : 130;

      osc1.type = 'sine';
      osc1.frequency.setValueAtTime(startFreq, now);
      osc1.frequency.exponentialRampToValueAtTime(endFreq, now + 0.11);

      gain1.gain.setValueAtTime(0.32, now);
      gain1.gain.exponentialRampToValueAtTime(0.001, now + 0.13);

      osc2.type = 'triangle';
      osc2.frequency.setValueAtTime(startFreq * 1.5, now);
      osc2.frequency.exponentialRampToValueAtTime(endFreq * 0.8, now + 0.08);

      gain2.gain.setValueAtTime(0.16, now);
      gain2.gain.exponentialRampToValueAtTime(0.001, now + 0.09);

      osc1.connect(gain1);
      gain1.connect(ctx.destination);

      osc2.connect(gain2);
      gain2.connect(ctx.destination);

      osc1.start(now);
      osc1.stop(now + 0.13);

      osc2.start(now);
      osc2.stop(now + 0.09);
    } catch {
      // ignore
    }
  }

  // Cartoon fart for the "I just pooped" button and poop notifications.
  public playFart() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const duration = 0.8;

      const master = ctx.createGain();
      master.gain.setValueAtTime(0.0001, now);
      master.gain.exponentialRampToValueAtTime(0.42, now + 0.02);
      master.gain.setValueAtTime(0.38, now + duration * 0.45);
      master.gain.exponentialRampToValueAtTime(0.0001, now + duration);
      master.connect(ctx.destination);

      // Low, flappy body. The LFO makes the classic motorboat vibration.
      const lowpass = ctx.createBiquadFilter();
      lowpass.type = 'lowpass';
      lowpass.frequency.setValueAtTime(720, now);
      lowpass.frequency.exponentialRampToValueAtTime(240, now + duration);
      lowpass.Q.setValueAtTime(8, now);
      lowpass.connect(master);

      const body = ctx.createOscillator();
      body.type = 'sawtooth';
      body.frequency.setValueAtTime(84, now);
      body.frequency.exponentialRampToValueAtTime(56, now + duration);

      const flutter = ctx.createOscillator();
      flutter.type = 'sine';
      flutter.frequency.setValueAtTime(11.5, now);
      const flutterDepth = ctx.createGain();
      flutterDepth.gain.setValueAtTime(19, now);
      flutter.connect(flutterDepth);
      flutterDepth.connect(body.frequency);

      body.connect(lowpass);
      body.start(now);
      body.stop(now + duration);
      flutter.start(now);
      flutter.stop(now + duration);

      // Damp noise adds the wet, sputtering texture.
      const noiseBuffer = ctx.createBuffer(
        1,
        Math.max(1, Math.floor(ctx.sampleRate * duration)),
        ctx.sampleRate
      );
      const samples = noiseBuffer.getChannelData(0);
      for (let index = 0; index < samples.length; index += 1) {
        const time = index / ctx.sampleRate;
        const gate = 0.35 + 0.65 * Math.abs(Math.sin(Math.PI * 12 * time));
        samples[index] = (Math.random() * 2 - 1) * gate;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = noiseBuffer;
      const bandpass = ctx.createBiquadFilter();
      bandpass.type = 'bandpass';
      bandpass.frequency.setValueAtTime(210, now);
      bandpass.frequency.exponentialRampToValueAtTime(110, now + duration);
      bandpass.Q.setValueAtTime(1.3, now);
      const noiseGain = ctx.createGain();
      noiseGain.gain.setValueAtTime(0.18, now);
      noiseGain.gain.exponentialRampToValueAtTime(0.001, now + duration);
      noise.connect(bandpass);
      bandpass.connect(noiseGain);
      noiseGain.connect(master);
      noise.start(now);
      noise.stop(now + duration);
    } catch {
      // ignore
    }
  }

  // Celebration flush / royal fanfare chime
  public playCelebration() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const notes = [440, 554.37, 659.25, 880]; // A major arpeggio
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const noteTime = now + idx * 0.07;

        osc.type = 'sine';
        osc.frequency.setValueAtTime(freq, noteTime);

        gain.gain.setValueAtTime(0.2, noteTime);
        gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.28);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(noteTime);
        osc.stop(noteTime + 0.28);
      });
    } catch {
      // ignore
    }
  }

  // Sonar radar blip sound when scanning or selecting pins
  public playRadarPing() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sine';
      osc.frequency.setValueAtTime(980, now);
      osc.frequency.exponentialRampToValueAtTime(1240, now + 0.08);

      gain.gain.setValueAtTime(0.12, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.22);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.22);
    } catch {
      // ignore
    }
  }

  // Subtle click when toggling filters or regions
  public playClick() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const now = ctx.currentTime;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(600, now);
      osc.frequency.exponentialRampToValueAtTime(300, now + 0.04);

      gain.gain.setValueAtTime(0.08, now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

      osc.connect(gain);
      gain.connect(ctx.destination);

      osc.start(now);
      osc.stop(now + 0.05);
    } catch {
      // ignore
    }
  }

  // Royal fanfarria for VIP Room upgrades and celebrations
  public playFanfare() {
    const ctx = this.getContext();
    if (!ctx) return;

    try {
      const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
      notes.forEach((freq, idx) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        const start = ctx.currentTime + (idx * 0.1);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        gain.gain.setValueAtTime(0.15, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.35);
        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.35);
      });
    } catch {
      // ignore
    }
  }
}

export const radarAudio = new RadarAudioEngine();
