// All sound is synthesized with WebAudio: no audio files, no network.
// The context starts on the first gesture (browsers block audio before one),
// and every effect is a short oscillator or filtered-noise envelope.

const NOTE = { C2: 65.41, D2: 73.42, E2: 82.41, F2: 87.31, G2: 98.0, A2: 110.0, B2: 123.47, C3: 130.81 };
const BASSLINE = [NOTE.C2, NOTE.C2, NOTE.G2, NOTE.A2, NOTE.F2, NOTE.F2, NOTE.G2, NOTE.E2];

export function createAudio() {
  let ctx = null;
  let master = null;
  let musicGain = null;
  let muted = false;
  let musicTimer = 0;
  let beat = 0;
  let started = false;

  function ensure() {
    if (ctx) return true;
    try {
      const AC = window.AudioContext || window.webkitAudioContext;
      if (!AC) return false;
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = muted ? 0 : 0.5;
      master.connect(ctx.destination);
      musicGain = ctx.createGain();
      musicGain.gain.value = 0.16;
      musicGain.connect(master);
      return true;
    } catch {
      return false;
    }
  }

  function tone(freq, dur, type, vol, slideTo) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, t);
    if (slideTo) osc.frequency.exponentialRampToValueAtTime(Math.max(1, slideTo), t + dur);
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    osc.connect(gain);
    gain.connect(master);
    osc.start(t);
    osc.stop(t + dur + 0.02);
  }

  function noise(dur, vol, filterFreq) {
    if (!ctx || muted) return;
    const t = ctx.currentTime;
    const len = Math.max(1, Math.floor(ctx.sampleRate * dur));
    const buffer = ctx.createBuffer(1, len, ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < len; i += 1) data[i] = (Math.random() * 2 - 1) * (1 - i / len);
    const src = ctx.createBufferSource();
    src.buffer = buffer;
    const filter = ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.value = filterFreq;
    const gain = ctx.createGain();
    gain.gain.setValueAtTime(vol, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + dur);
    src.connect(filter);
    filter.connect(gain);
    gain.connect(master);
    src.start(t);
  }

  function musicStep() {
    if (!ctx || muted) return;
    const freq = BASSLINE[beat % BASSLINE.length];
    const t = ctx.currentTime;
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(freq, t);
    gain.gain.setValueAtTime(0.5, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.24);
    osc.connect(gain);
    gain.connect(musicGain);
    osc.start(t);
    osc.stop(t + 0.26);
    beat += 1;
  }

  return {
    unlock() {
      if (ensure() && ctx.state === 'suspended') ctx.resume().catch(() => {});
      if (ctx && !started) {
        started = true;
        musicTimer = window.setInterval(musicStep, 250);
      }
    },
    shoot() { tone(880, 0.09, 'square', 0.10, 220); },
    enemyDie() { noise(0.22, 0.30, 1400); tone(160, 0.18, 'sawtooth', 0.12, 40); },
    playerHit() { noise(0.35, 0.40, 900); tone(110, 0.3, 'sawtooth', 0.2, 35); },
    pickup() { tone(660, 0.07, 'sine', 0.14); window.setTimeout(() => tone(990, 0.09, 'sine', 0.14), 60); },
    upgrade() { [523, 659, 784].forEach((f, i) => window.setTimeout(() => tone(f, 0.16, 'triangle', 0.16), i * 70)); },
    waveClear() { [392, 523, 659, 784].forEach((f, i) => window.setTimeout(() => tone(f, 0.14, 'triangle', 0.14), i * 80)); },
    bossAlarm() { tone(220, 0.4, 'sawtooth', 0.18, 110); window.setTimeout(() => tone(220, 0.4, 'sawtooth', 0.18, 110), 450); },
    gameOver() { [330, 262, 196, 131].forEach((f, i) => window.setTimeout(() => tone(f, 0.3, 'triangle', 0.16), i * 180)); },
    victory() { [523, 659, 784, 1047, 1319].forEach((f, i) => window.setTimeout(() => tone(f, 0.22, 'triangle', 0.16), i * 110)); },
    toggleMute() {
      muted = !muted;
      if (master) master.gain.value = muted ? 0 : 0.5;
      return muted;
    },
    isMuted() { return muted; },
    dispose() { if (musicTimer) window.clearInterval(musicTimer); },
  };
}
