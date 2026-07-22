'use strict';
/* Synthesized audio — no external files. Everything built from oscillators + noise. */
const SFX = (() => {
  let ac = null, master = null, droneNodes = null, introMusicNodes = null;
  let muted = false;

  function init() {
    if (ac) { if (ac.state === 'suspended') ac.resume(); return; }
    ac = new (window.AudioContext || window.webkitAudioContext)();
    master = ac.createGain();
    master.gain.value = muted ? 0 : 0.55;
    master.connect(ac.destination);
  }

  function setMuted(m) {
    muted = m;
    if (master) master.gain.setTargetAtTime(muted ? 0 : 0.55, ac.currentTime, 0.02);
  }

  // ---- primitives ----
  function env(gainNode, t0, a, peak, d, sustain = 0.0001) {
    const g = gainNode.gain;
    g.setValueAtTime(0.0001, t0);
    g.exponentialRampToValueAtTime(Math.max(peak, 0.0002), t0 + a);
    g.exponentialRampToValueAtTime(sustain, t0 + a + d);
  }

  function tone(type, f0, f1, dur, vol, t0 = 0, bendCurve = 1) {
    if (!ac) return;
    const t = ac.currentTime + t0;
    const o = ac.createOscillator();
    const g = ac.createGain();
    o.type = type;
    o.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) o.frequency.exponentialRampToValueAtTime(Math.max(f1, 1), t + dur * bendCurve);
    env(g, t, 0.005, vol, dur);
    o.connect(g); g.connect(master);
    o.start(t); o.stop(t + dur + 0.05);
  }

  function noiseBuf() {
    const len = ac.sampleRate * 1.2;
    const buf = ac.createBuffer(1, len, ac.sampleRate);
    const d = buf.getChannelData(0);
    for (let i = 0; i < len; i++) d[i] = Math.random() * 2 - 1;
    return buf;
  }
  let _noise = null;

  function noise(dur, vol, fType, f0, f1, t0 = 0, q = 1) {
    if (!ac) return;
    if (!_noise) _noise = noiseBuf();
    const t = ac.currentTime + t0;
    const src = ac.createBufferSource();
    src.buffer = _noise;
    src.loop = true;
    const flt = ac.createBiquadFilter();
    flt.type = fType; flt.Q.value = q;
    flt.frequency.setValueAtTime(f0, t);
    if (f1 !== f0) flt.frequency.exponentialRampToValueAtTime(Math.max(f1, 20), t + dur);
    const g = ac.createGain();
    env(g, t, 0.004, vol, dur);
    src.connect(flt); flt.connect(g); g.connect(master);
    src.start(t); src.stop(t + dur + 0.05);
  }

  // ---- game sounds ----
  function whoosh() {
    if (!ac) return;
    noise(0.16, 0.35, 'bandpass', 2400, 300, 0, 2.5);
  }

  function impact() {
    if (!ac) return;
    tone('sine', 150, 40, 0.18, 0.9);
    noise(0.06, 0.5, 'lowpass', 3000, 800);
  }

  function shatter(big = 1) {
    if (!ac) return;
    // burst of bright noise
    noise(0.5 * big, 0.55, 'highpass', 2500, 5500, 0, 0.8);
    noise(0.25, 0.35, 'bandpass', 5000, 8000, 0.02, 1.5);
    // glass "pings" — random high partials falling
    const n = 6 + Math.floor(Math.random() * 4);
    for (let i = 0; i < n; i++) {
      const f = 1800 + Math.random() * 4200;
      tone('sine', f, f * 0.7, 0.25 + Math.random() * 0.3, 0.08, Math.random() * 0.18);
    }
    tone('triangle', 320, 90, 0.3, 0.25);
  }

  function gong() { // enemy hit — metallic ring
    if (!ac) return;
    [230, 347, 461, 693].forEach((f, i) => {
      tone('sine', f * (1 + Math.random() * 0.01), f * 0.985, 1.4 - i * 0.2, 0.16 / (i + 1));
    });
    tone('sine', 115, 110, 1.6, 0.14);
  }

  function hanHurt() {
    if (!ac) return;
    tone('sawtooth', 300, 130, 0.3, 0.14, 0.05);
    tone('square', 220, 90, 0.25, 0.07, 0.08);
  }

  function heroHurt() {
    if (!ac) return;
    tone('sawtooth', 160, 60, 0.35, 0.22);
    tone('square', 90, 45, 0.4, 0.16, 0.03);
    noise(0.2, 0.2, 'lowpass', 900, 200, 0.02);
  }

  function comboSting(n) {
    if (!ac) return;
    const base = 392; // G4
    const steps = [0, 4, 7, 12, 16, 19, 24];
    const k = Math.min(n, steps.length - 1);
    for (let i = 0; i <= k; i++) {
      const f = base * Math.pow(2, steps[i] / 12);
      tone('square', f, f, 0.09, 0.07, i * 0.045);
    }
  }

  function kiai() { // martial-arts strike accent — whip-crack + short "shout"
    if (!ac) return;
    noise(0.08, 0.5, 'bandpass', 1800, 4200, 0, 3);
    tone('sawtooth', 620, 180, 0.16, 0.3, 0.02);
    tone('square', 310, 120, 0.12, 0.12, 0.03);
  }

  function laugh() {
    if (!ac) return;
    for (let i = 0; i < 3; i++) {
      tone('sawtooth', 180 - i * 25, 120 - i * 20, 0.09, 0.05, i * 0.14);
    }
  }

  function evilLaugh() { // Han multiplies into every mirror — a long, cold cackle
    if (!ac) return;
    const notes = [200, 150, 175, 130, 150, 110, 130, 95];
    for (let i = 0; i < notes.length; i++) {
      const t0 = i * 0.17;
      tone('sawtooth', notes[i], notes[i] * 0.8, 0.14, 0.06, t0);
      tone('square', notes[i] / 2, notes[i] / 2 * 0.8, 0.12, 0.04, t0);
    }
    const tail = notes.length * 0.17;
    noise(0.8, 0.05, 'bandpass', 500, 200, tail, 1.5); // reverberant hall tail
    tone('sine', 70, 45, 1.3, 0.08, tail);
  }

  function hanDeath() { // the spear lands — a dying groan
    if (!ac) return;
    tone('sawtooth', 240, 70, 0.9, 0.14);            // pitched-down cry
    tone('square', 120, 40, 0.9, 0.07, 0.02);
    noise(0.5, 0.25, 'bandpass', 700, 300, 0.05, 1.2); // gasp
    tone('sine', 60, 32, 1.1, 0.12, 0.1);            // low collapse
  }

  function uiTick() {
    if (!ac) return;
    tone('square', 880, 880, 0.04, 0.05);
  }

  function gongStart() {
    if (!ac) return;
    [196, 294, 392, 588].forEach((f, i) => {
      tone('sine', f, f * 0.99, 2.2 - i * 0.3, 0.2 / (i + 1));
    });
    noise(0.1, 0.15, 'bandpass', 800, 1200);
  }

  function victory() { // triumphant, sustained horn — plays the instant Han falls
    if (!ac) return;
    // a rising horn call that lands on a held chord
    tone('triangle', 220, 220, 0.30, 0.17, 0.00);     // A
    tone('triangle', 293.7, 293.7, 0.30, 0.17, 0.24);  // D
    tone('triangle', 329.6, 329.6, 2.0, 0.17, 0.48);   // E — held lead
    // sustained brass chord underneath (triangle body + a little saw for edge)
    [110, 164.8, 220, 277.2].forEach((f) => {          // A E A C#
      tone('triangle', f, f, 2.2, 0.10, 0.48);
      tone('sawtooth', f, f, 2.2, 0.035, 0.48);
    });
    tone('sine', 55, 55, 2.4, 0.12, 0.48);             // low root for weight
  }

  function defeat() {
    if (!ac) return;
    const seq = [330, 262, 208, 165, 110];
    seq.forEach((f, i) => {
      tone('sawtooth', f, f * 0.96, 0.4, 0.12, i * 0.22);
    });
    tone('sine', 55, 40, 2.0, 0.2, 1.0);
  }

  function tallyTick() {
    if (!ac) return;
    tone('square', 1320, 1320, 0.03, 0.04);
  }

  function doorCreak() { // revolving mirror-panel: slow groan + hinge squeal
    if (!ac) return;
    noise(0.9, 0.22, 'bandpass', 300, 900, 0, 4);
    tone('sawtooth', 90, 140, 0.8, 0.06);
    tone('sine', 62, 48, 0.9, 0.1);
  }

  function impale() { // heavy flesh-thud: low sine drop + noise burst
    if (!ac) return;
    tone('sine', 120, 35, 0.5, 1.0);
    noise(0.25, 0.6, 'lowpass', 2200, 300);
    noise(0.12, 0.4, 'bandpass', 900, 500, 0.02, 2);
    tone('sawtooth', 200, 60, 0.4, 0.18, 0.05);
  }

  function droneStart() {
    if (!ac || droneNodes) return;
    const t = ac.currentTime;
    const g = ac.createGain(); g.gain.value = 0.0;
    g.gain.setTargetAtTime(0.05, t, 2);
    const flt = ac.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = 220;
    const o1 = ac.createOscillator(); o1.type = 'sawtooth'; o1.frequency.value = 55;
    const o2 = ac.createOscillator(); o2.type = 'sawtooth'; o2.frequency.value = 55.7;
    const o3 = ac.createOscillator(); o3.type = 'sine'; o3.frequency.value = 110.3;
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.09;
    const lfoG = ac.createGain(); lfoG.gain.value = 0.02;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    [o1, o2, o3].forEach(o => o.connect(flt));
    flt.connect(g); g.connect(master);
    [o1, o2, o3, lfo].forEach(o => o.start(t));
    droneNodes = { g, oscs: [o1, o2, o3, lfo] };
  }

  function droneStop() {
    if (!droneNodes) return;
    const t = ac.currentTime;
    droneNodes.g.gain.setTargetAtTime(0.0001, t, 0.8);
    const nodes = droneNodes;
    setTimeout(() => nodes.oscs.forEach(o => { try { o.stop(); } catch (e) {} }), 3000);
    droneNodes = null;
  }

  // ---- intro cinematic music bed (melodic pad over the drone) ----
  function introMusicStart() {
    if (!ac || introMusicNodes) return;
    const t = ac.currentTime;
    const g = ac.createGain(); g.gain.value = 0.0001;
    g.gain.setTargetAtTime(0.06, t, 1.5);
    const flt = ac.createBiquadFilter();
    flt.type = 'lowpass'; flt.frequency.value = 900;
    // A-minor pad — root, minor third, fifth + a low octave, slightly detuned for width
    const freqs = [110, 130.8, 164.8, 82.4];
    const oscs = freqs.map((f, i) => {
      const o = ac.createOscillator();
      o.type = i === 3 ? 'sine' : 'triangle';
      o.frequency.value = f * (i % 2 ? 1.004 : 1);
      o.connect(flt);
      return o;
    });
    const lfo = ac.createOscillator(); lfo.frequency.value = 0.13; // slow swell
    const lfoG = ac.createGain(); lfoG.gain.value = 0.025;
    lfo.connect(lfoG); lfoG.connect(g.gain);
    flt.connect(g); g.connect(master);
    [...oscs, lfo].forEach(o => o.start(t));
    introMusicNodes = { g, oscs: [...oscs, lfo] };
  }

  function introMusicStop() {
    if (!introMusicNodes) return;
    const t = ac.currentTime;
    introMusicNodes.g.gain.setTargetAtTime(0.0001, t, 0.5);
    const nodes = introMusicNodes;
    setTimeout(() => nodes.oscs.forEach(o => { try { o.stop(); } catch (e) {} }), 2000);
    introMusicNodes = null;
  }

  function introSwell() { // dramatic rising motif as Bruce's reflection appears
    if (!ac) return;
    const seq = [220, 261.6, 329.6, 440]; // A C E A — a heroic rise
    seq.forEach((f, i) => {
      tone('triangle', f, f, 0.5, 0.10, i * 0.18);
      tone('square', f, f, 0.4, 0.04, i * 0.18);
    });
    tone('sine', 110, 110, 1.6, 0.10, 0.1); // sustaining root underneath
  }

  return {
    init, setMuted, get muted() { return muted; },
    whoosh, impact, shatter, gong, hanHurt, heroHurt, comboSting, kiai,
    laugh, evilLaugh, hanDeath, uiTick, gongStart, victory, defeat, tallyTick,
    doorCreak, impale,
    introMusicStart, introMusicStop, introSwell,
    droneStart, droneStop,
  };
})();
