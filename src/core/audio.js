// Procedural WebAudio music + SFX. Everything is synthesised in code: no samples, no copied tracks.
// iOS: the AudioContext is created/resumed inside the first user gesture (unlock()).
const NOTE = (n) => 440 * Math.pow(2, (n - 69) / 12);
// Tracks: tempo (bpm), steps per beat, bars of [lead, bass, drum] step arrays (MIDI note or 0).
const D = 62, A = 69, G = 67, F = 66, E = 64, B = 71, C = 73, Dh = 74;
const TRACKS = {
  // Guild hall jig in D major, 6/8 feel: fiddle-ish lead, oom-pah bass, bodhrán.
  hall: { bpm: 132, spb: 3, wave: 'sawtooth', cut: 2400, lead: [
    D, F, A, Dh, A, F, G, B, Dh, B, G, E, F, A, Dh, A, F, D, E, G, B, A, F, E,
    D, F, A, Dh, C, B, A, G, F, E, F, G, A, F, D, E, F, D, A - 12, D, 0, 0],
    bass: [38, 0, 45, 0, 0, 0, 43, 0, 47, 0, 0, 0, 38, 0, 45, 0, 0, 0, 40, 0, 45, 0, 0, 0, 38, 0, 45, 0, 0, 0, 43, 0, 47, 0, 0, 0, 45, 0, 40, 0, 0, 0, 38, 0, 45, 0, 0, 0],
    drum: [1, 0, 2, 1, 0, 2] },
  // Field theme in G: bright adventurous arpeggios with a warm pad-like bass.
  field: { bpm: 108, spb: 2, wave: 'triangle', cut: 3200, lead: [
    67, 71, 74, 79, 78, 74, 76, 0, 72, 76, 79, 84, 83, 79, 81, 0, 69, 72, 76, 81, 79, 76, 78, 74, 71, 74, 79, 0, 78, 0, 79, 0],
    bass: [43, 0, 50, 0, 43, 0, 50, 0, 48, 0, 55, 0, 48, 0, 55, 0, 45, 0, 52, 0, 45, 0, 50, 0, 43, 0, 50, 0, 50, 0, 43, 0],
    drum: [1, 0, 2, 0, 1, 1, 2, 0] },
  // Boss theme in D minor: driving low ostinato, eerie flute lead (Lullaby).
  boss: { bpm: 152, spb: 2, wave: 'square', cut: 1800, flute: true, lead: [
    74, 0, 77, 76, 74, 0, 73, 74, 70, 0, 69, 0, 67, 69, 70, 73, 74, 0, 77, 79, 81, 0, 79, 77, 76, 74, 73, 70, 69, 0, 0, 0],
    bass: [38, 38, 50, 38, 38, 50, 37, 49, 34, 34, 46, 34, 33, 45, 33, 45, 38, 38, 50, 38, 41, 41, 53, 41, 34, 46, 33, 45, 33, 33, 45, 33],
    drum: [1, 0, 2, 0, 1, 1, 2, 1] },
};

export class Audio {
  constructor(S) { this.S = S; this.ctx = null; this.track = null; this.want = null; this.step = 0; this.next = 0; this.last = {}; }
  get unlocked() { return !!this.ctx && this.ctx.state === 'running'; }
  unlock() {
    try {
      if (!this.ctx) {
        const AC = window.AudioContext || window.webkitAudioContext; if (!AC) return;
        this.ctx = new AC(); const c = this.ctx;
        this.master = c.createGain(); this.master.connect(c.destination);
        this.mus = c.createGain(); this.mus.connect(this.master); this.fx = c.createGain(); this.fx.connect(this.master);
        // tiny feedback delay gives the music some room
        const dl = c.createDelay(); dl.delayTime.value = 0.23; const fb = c.createGain(); fb.gain.value = 0.25; const wet = c.createGain(); wet.gain.value = 0.22;
        this.mus.connect(dl); dl.connect(fb); fb.connect(dl); dl.connect(wet); wet.connect(this.master);
        this.noise = c.createBuffer(1, c.sampleRate, c.sampleRate); const d = this.noise.getChannelData(0); for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
        this.applyVolume();
        this.timer = setInterval(() => this.tick(), 60);
      }
      if (this.ctx.state !== 'running') this.ctx.resume();
      // play a silent buffer inside the gesture (needed by older iOS Safari)
      const s = this.ctx.createBufferSource(); s.buffer = this.ctx.createBuffer(1, 1, 22050); s.connect(this.ctx.destination); s.start(0);
    } catch (e) { /* audio unavailable */ }
  }
  applyVolume() {
    if (!this.ctx) return; const S = this.S; const t = this.ctx.currentTime;
    this.master.gain.setTargetAtTime(S.mute ? 0 : (S.vol ?? 0.7), t, 0.05);
    this.mus.gain.setTargetAtTime((S.musicVol ?? 0.5) * 0.5, t, 0.05); this.fx.gain.setTargetAtTime((S.sfxVol ?? 0.8) * 0.6, t, 0.05);
  }
  play(name) { this.want = name; }
  tick() {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    if (this.want !== this.track) { this.track = this.want; this.step = 0; this.next = c.currentTime + 0.1; }
    const T = TRACKS[this.track]; if (!T) return;
    const dur = 60 / T.bpm / T.spb;
    while (this.next < c.currentTime + 0.25) {
      const i = this.step; const l = T.lead[i % T.lead.length], b = T.bass[i % T.bass.length], dr = T.drum[i % T.drum.length];
      if (l) this.voice(NOTE(l), this.next, dur * 0.9, T.flute ? 'sine' : T.wave, 0.16, T.cut, T.flute);
      if (b) this.voice(NOTE(b), this.next, dur * 0.85, 'triangle', 0.3, 900);
      if (dr === 1) this.kick(this.next); else if (dr === 2) this.hat(this.next, 0.08);
      this.next += dur; this.step++;
    }
  }
  voice(f, t, d, wave, g, cut, vib, out = this.mus) {
    const c = this.ctx; const o = c.createOscillator(); o.type = wave; o.frequency.value = f;
    const fl = c.createBiquadFilter(); fl.type = 'lowpass'; fl.frequency.value = cut; const a = c.createGain();
    a.gain.setValueAtTime(0.0001, t); a.gain.exponentialRampToValueAtTime(g, t + 0.012); a.gain.exponentialRampToValueAtTime(0.0001, t + d);
    if (vib) { const lfo = c.createOscillator(); lfo.frequency.value = 5.5; const lg = c.createGain(); lg.gain.value = f * 0.012; lfo.connect(lg); lg.connect(o.frequency); lfo.start(t); lfo.stop(t + d + 0.05); }
    o.connect(fl); fl.connect(a); a.connect(out); o.start(t); o.stop(t + d + 0.05);
  }
  kick(t, out = this.mus) { const c = this.ctx; const o = c.createOscillator(); const g = c.createGain(); o.frequency.setValueAtTime(140, t); o.frequency.exponentialRampToValueAtTime(45, t + 0.12); g.gain.setValueAtTime(0.5, t); g.gain.exponentialRampToValueAtTime(0.001, t + 0.18); o.connect(g); g.connect(out); o.start(t); o.stop(t + 0.2); }
  hat(t, d, g0 = 0.12, freq = 7000, out = this.mus) { const c = this.ctx; const s = c.createBufferSource(); s.buffer = this.noise; const f = c.createBiquadFilter(); f.type = 'highpass'; f.frequency.value = freq; const g = c.createGain(); g.gain.setValueAtTime(g0, t); g.gain.exponentialRampToValueAtTime(0.001, t + d); s.connect(f); f.connect(g); g.connect(out); s.start(t, Math.random() * 0.5); s.stop(t + d + 0.02); }
  sweep(f0, f1, d, wave, g, t = this.ctx.currentTime) { const c = this.ctx; const o = c.createOscillator(); o.type = wave; o.frequency.setValueAtTime(f0, t); o.frequency.exponentialRampToValueAtTime(f1, t + d); const a = c.createGain(); a.gain.setValueAtTime(g, t); a.gain.exponentialRampToValueAtTime(0.001, t + d); o.connect(a); a.connect(this.fx); o.start(t); o.stop(t + d + 0.02); }
  sfx(name) {
    const c = this.ctx; if (!c || c.state !== 'running') return;
    const now = c.currentTime; if (this.last[name] && now - this.last[name] < 0.05) return; this.last[name] = now;
    switch (name) {
      case 'ui': this.voice(1320, now, 0.06, 'square', 0.12, 4000, false, this.fx); break;
      case 'hit': this.hat(now, 0.09, 0.35, 1200, this.fx); this.sweep(220, 90, 0.1, 'square', 0.18); break;
      case 'swing': this.hat(now, 0.12, 0.2, 3000, this.fx); break;
      case 'spell': this.sweep(300, 1200, 0.25, 'sawtooth', 0.12); this.sweep(600, 2400, 0.2, 'sine', 0.1); this.hat(now, 0.3, 0.12, 2500, this.fx); break;
      case 'hurt': this.sweep(180, 70, 0.18, 'sawtooth', 0.2); break;
      case 'warn': this.voice(440, now, 0.12, 'square', 0.12, 2000, false, this.fx); this.voice(330, now + 0.14, 0.18, 'square', 0.12, 2000, false, this.fx); break;
      case 'requip': for (let i = 0; i < 5; i++) this.voice(NOTE(72 + [0, 4, 7, 12, 16][i]), now + i * 0.06, 0.4, 'triangle', 0.14, 5000, false, this.fx); this.hat(now, 0.6, 0.1, 6000, this.fx); break;
      case 'level': [72, 76, 79, 84, 88].forEach((n, i) => this.voice(NOTE(n), now + i * 0.09, 0.35, 'square', 0.12, 3500, false, this.fx)); break;
      case 'loot': this.voice(NOTE(84), now, 0.08, 'triangle', 0.15, 6000, false, this.fx); this.voice(NOTE(91), now + 0.07, 0.12, 'triangle', 0.15, 6000, false, this.fx); break;
    }
  }
}
