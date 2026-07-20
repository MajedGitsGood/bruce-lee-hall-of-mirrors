'use strict';
/* ============================================================
   HALL OF MIRRORS — Bruce vs Han
   Based on the final scene of Enter the Dragon.
   ============================================================ */

const W = 480, H = 270, NUM = 10;
const cv = document.getElementById('game');
const ctx = cv.getContext('2d');
ctx.imageSmoothingEnabled = false;

window.DEBUG = false;

// ---------- responsive letterbox ----------
function fit() {
  const s = Math.min(window.innerWidth / W, window.innerHeight / H);
  cv.style.width = (W * s) + 'px';
  cv.style.height = (H * s) + 'px';
}
window.addEventListener('resize', fit);
fit();

// ---------- utils ----------
const D2R = Math.PI / 180;
const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
const lerp = (a, b, t) => a + (b - a) * t;
function wrap180(a) { a = ((a + 180) % 360 + 360) % 360; return a - 180; }
function circDist(a, b) { const d = Math.abs(a - b); return Math.min(d, NUM - d); }
function fmtTime(s) { s = Math.floor(s); return `${(s / 60) | 0}:${String(s % 60).padStart(2, '0')}`; }
function pad(n, w) { return String(n | 0).padStart(w, '0'); }

// ---------- state ----------
let state = 'title'; // title | play | victory | defeat
let panes = [];      // {intact, brokenBy, clue, cracks, jag, seed}
let hanAt = 0, heroHP = 5, hanHP = 5;
let combo = 0, maxCombo = 0, hits = 0, score = 0;
let elapsed = 0;
let yaw = -18, targetYaw = -18;
let tutorialOpen = false;
let hoverPane = -1;
let strike = null;       // {i,isHit,t,impacted,fromRight,cx,cy,startX,startY}
let pendingStrike = null;
let reveal = null;       // {pane,t,dir}
let flicker = 0, tauntT = 0;
let comboPop = 0, heroFlash = 0, hanFlash = 0;
let victoryAnim = null, defeatAnim = null;
let paneQuads = new Array(NUM).fill(null);
let redPulseT = 0;
let titleT = 0;

// ---------- pane content buffers ----------
const PW = 64, PH = 104;
const intactBuf = SPR.canvas(PW, PH);
const intactFlip = SPR.canvas(PW, PH);
const brokenBufs = [];
for (let i = 0; i < NUM; i++) {
  brokenBufs.push({ c: SPR.canvas(PW, PH), f: SPR.canvas(PW, PH) });
}

// ============================================================
// GAME SETUP
// ============================================================
function resetGame() {
  panes = [];
  for (let i = 0; i < NUM; i++) {
    panes.push({ intact: true, brokenBy: null, clue: 0, cracks: null, jag: null, seed: (Math.random() * 1e9) | 0 });
  }
  hanAt = (Math.random() * NUM) | 0;
  heroHP = 5; hanHP = 5;
  combo = 0; maxCombo = 0; hits = 0; score = 0;
  elapsed = 0;
  strike = null; pendingStrike = null; reveal = null;
  flicker = 0; comboPop = 0; heroFlash = 0; hanFlash = 0;
  victoryAnim = null; defeatAnim = null;
  yaw = targetYaw = -18; // camera home: mirror 1 is the default focus
  hoverPane = -1;
  FX.clearParts();
  FX.shake.trauma = 0;
  if (window.DEBUG) console.log('[DEBUG] Han is behind pane', (hanAt + 1) % 10);
}

function startGame() {
  if (window.DEBUG) console.log('[DEBUG] startGame', new Error().stack.split('\n')[2]);
  SFX.init();
  SFX.gongStart();
  SFX.droneStart();
  resetGame();
  state = 'play';
}

// ============================================================
// LAYOUT / PROJECTION  (rotating 360 camera, panes tiled edge-to-edge)
// ============================================================
function projR(a) {
  // rel ±108 maps to the screen edges so six gapless mirrors fit at once
  return W / 2 + 240 * Math.sin(a * 0.75 * D2R) / Math.sin(81 * D2R);
}
function hRot(a) {
  const c = Math.max(0.05, Math.cos(a * D2R));
  return 190 * (0.40 + 0.60 * c);
}

function computeQuads() {
  paneQuads = new Array(NUM).fill(null);
  const order = [];
  for (let i = 0; i < NUM; i++) {
    const rel = wrap180(i * 36 - yaw);
    if (Math.abs(rel) > 120) continue;
    // panes span the full 36° slot: neighbors share an edge, no gap
    const xL = projR(rel - 18), xR = projR(rel + 18);
    if (xR < -12 || xL > W + 12) continue;
    order.push({ i, rel, xL, xR, hL: hRot(rel - 18), hR: hRot(rel + 18), yMid: 134 });
  }
  order.sort((a, b) => Math.abs(b.rel) - Math.abs(a.rel));
  for (const q of order) paneQuads[q.i] = q;
  return order;
}

function quadCenter(q) {
  return { x: (q.xL + q.xR) / 2, y: q.yMid, h: (q.hL + q.hR) / 2 };
}

function hitTestPane(x, y) {
  let best = -1, bestH = -1;
  for (let i = 0; i < NUM; i++) {
    const q = paneQuads[i];
    if (!q) continue;
    if (x < q.xL || x > q.xR) continue;
    const u = (x - q.xL) / Math.max(1, q.xR - q.xL);
    const h = q.hL + (q.hR - q.hL) * u;
    if (Math.abs(y - q.yMid) <= h / 2 && h > bestH) { best = i; bestH = h; }
  }
  return best;
}

// ============================================================
// PANE CONTENT RENDERING
// ============================================================
function renderIntactBuffer(t) {
  const c = intactBuf.getContext('2d');
  c.clearRect(0, 0, PW, PH);
  // glass
  const g = c.createLinearGradient(0, 0, 0, PH);
  g.addColorStop(0, '#2a3a4a');
  g.addColorStop(0.5, '#17222e');
  g.addColorStop(1, '#241a22');
  c.fillStyle = g;
  c.fillRect(3, 3, PW - 6, PH - 6);
  // faint room reflections (vertical bars)
  c.fillStyle = 'rgba(120,40,50,0.10)';
  c.fillRect(8, 6, 6, PH - 12);
  c.fillRect(PW - 16, 6, 5, PH - 12);
  c.fillStyle = 'rgba(180,200,220,0.05)';
  c.fillRect(20, 6, 3, PH - 12);

  // Han's reflection — identical in every pane
  const taunting = tauntT > 7.2;
  const spr = taunting ? SPR.han.taunt : SPR.han.idle;
  const sway = Math.round(Math.sin(t * 1.15) * 2);
  const bob = Math.round(Math.sin(t * 2.3) * 1);
  let alpha = 0.92;
  if (flicker > 0) alpha *= 0.25 + Math.random() * 0.75;
  c.globalAlpha = alpha;
  c.drawImage(spr, 0, 0, SPR.HAN_W, SPR.HAN_H, 6 + sway, 8 + bob, SPR.HAN_W, SPR.HAN_H);
  c.globalAlpha = 1;

  // moving specular sheen
  const sh = ((t * 22) % (PH + 90)) - 45;
  const sg = c.createLinearGradient(0, sh - 20, 18, sh + 20);
  sg.addColorStop(0, 'rgba(255,255,255,0)');
  sg.addColorStop(0.5, 'rgba(220,235,255,0.09)');
  sg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = sg;
  c.save();
  c.translate(0, 0);
  c.transform(1, -0.35, 0, 1, 0, 0);
  c.fillRect(3, sh - 26, PW - 6, 52);
  c.restore();
  // corner glints
  c.fillStyle = 'rgba(255,255,255,0.25)';
  if (Math.sin(t * 3.1) > 0.93) c.fillRect(9, 9, 2, 2);
  if (Math.sin(t * 2.3 + 2) > 0.95) c.fillRect(PW - 12, PH - 40, 2, 2);

  drawFrame(c, false);
  // flip copy for floor reflection
  const f = intactFlip.getContext('2d');
  f.clearRect(0, 0, PW, PH);
  f.save(); f.translate(0, PH); f.scale(1, -1);
  f.drawImage(intactBuf, 0, 0);
  f.restore();
}

function drawFrame(c, scorched) {
  const base = scorched ? '#4a3018' : '#7a5326';
  const hi = scorched ? '#8a6836' : '#d8a850';
  c.fillStyle = base;
  c.fillRect(0, 0, PW, 3); c.fillRect(0, PH - 3, PW, 3);
  c.fillRect(0, 0, 3, PH); c.fillRect(PW - 3, 0, 3, PH);
  c.fillStyle = hi;
  c.fillRect(0, 0, PW, 1); c.fillRect(0, 0, 1, PH);
  // corner studs
  c.fillStyle = hi;
  c.fillRect(1, 1, 3, 3); c.fillRect(PW - 4, 1, 3, 3);
  c.fillRect(1, PH - 4, 3, 3); c.fillRect(PW - 4, PH - 4, 3, 3);
}

function genJag(seed) {
  const r = FX.rng(seed);
  const tris = [];
  // jagged remnant teeth along each inner edge
  function edge(x0, y0, x1, y1, nx, ny) {
    const n = 4 + (r() * 3 | 0);
    for (let i = 0; i < n; i++) {
      const t0 = i / n + r() * 0.04, t1 = (i + 0.5 + r() * 0.4) / n;
      const depth = 5 + r() * 11;
      const ax = lerp(x0, x1, t0), ay = lerp(y0, y1, t0);
      const bx = lerp(x0, x1, Math.min(1, t1 + 0.2)), by = lerp(y0, y1, Math.min(1, t1 + 0.2));
      const cx2 = lerp(x0, x1, t1) + nx * depth, cy2 = lerp(y0, y1, t1) + ny * depth;
      tris.push([ax, ay, bx, by, cx2, cy2]);
    }
  }
  edge(3, 3, PW - 3, 3, 0, 1);
  edge(3, PH - 3, PW - 3, PH - 3, 0, -1);
  edge(3, 3, 3, PH - 3, 1, 0);
  edge(PW - 3, 3, PW - 3, PH - 3, -1, 0);
  return tris;
}

function renderBrokenBuffer(idx, t) {
  const pane = panes[idx];
  const c = brokenBufs[idx].c.getContext('2d');
  c.clearRect(0, 0, PW, PH);
  if (pane.brokenBy === 'miss') {
    // cracked (not shattered) glass — dimmed mirror, no reflection of Han
    const g = c.createLinearGradient(0, 0, 0, PH);
    g.addColorStop(0, '#1c2833');
    g.addColorStop(0.5, '#0f171f');
    g.addColorStop(1, '#181117');
    c.fillStyle = g;
    c.fillRect(3, 3, PW - 6, PH - 6);
    c.fillStyle = 'rgba(120,40,50,0.07)';
    c.fillRect(8, 6, 6, PH - 12);
    c.fillRect(PW - 16, 6, 5, PH - 12);
    // clue cracks — count = distance to Han
    if (pane.cracks) {
      const pulse = 0.5 + 0.5 * Math.sin(t * 2.4 + idx);
      FX.drawCracks(c, pane.cracks, 0, 0, 1, 1, '#e8d5d8', 1,
        `rgba(230,60,70,${0.25 + 0.3 * pulse})`);
    }
  } else {
    // hit — Han burst through: dark hole with remnant glass teeth
    const g = c.createRadialGradient(PW / 2, PH / 2, 4, PW / 2, PH / 2, PH * 0.7);
    g.addColorStop(0, '#140a10');
    g.addColorStop(1, '#060309');
    c.fillStyle = g;
    c.fillRect(3, 3, PW - 6, PH - 6);
    if (pane.jag) {
      c.fillStyle = 'rgba(170,200,215,0.45)';
      c.strokeStyle = 'rgba(230,245,250,0.5)';
      c.lineWidth = 1;
      for (const tr of pane.jag) {
        c.beginPath();
        c.moveTo(tr[0], tr[1]); c.lineTo(tr[2], tr[3]); c.lineTo(tr[4], tr[5]);
        c.closePath(); c.fill(); c.stroke();
      }
    }
  }
  drawFrame(c, true);
  // flipped
  const f = brokenBufs[idx].f.getContext('2d');
  f.clearRect(0, 0, PW, PH);
  f.save(); f.translate(0, PH); f.scale(1, -1);
  f.drawImage(brokenBufs[idx].c, 0, 0);
  f.restore();
}

// ---------- quad blitting (column strips = cheap perspective) ----------
function drawPaneQuad(buf, q, alpha = 1) {
  const wpx = Math.max(1, Math.round(q.xR - q.xL));
  if (alpha !== 1) ctx.globalAlpha = alpha;
  for (let i = 0; i < wpx; i++) {
    const dx = Math.round(q.xL + i);
    if (dx < -1 || dx > W) continue;
    const u = i / wpx;
    const h = q.hL + (q.hR - q.hL) * u;
    const sx = Math.min(PW - 1, Math.floor(u * PW));
    ctx.drawImage(buf, sx, 0, 1, PH, dx, Math.round(q.yMid - h / 2), 1, Math.round(h));
  }
  if (alpha !== 1) ctx.globalAlpha = 1;
}

function drawPaneReflection(flipBuf, q) {
  const wpx = Math.max(1, Math.round(q.xR - q.xL));
  ctx.globalAlpha = 0.15;
  for (let i = 0; i < wpx; i += 2) {
    const dx = Math.round(q.xL + i);
    if (dx < -1 || dx > W) continue;
    const u = i / wpx;
    const h = q.hL + (q.hR - q.hL) * u;
    const sx = Math.min(PW - 1, Math.floor(u * PW));
    ctx.drawImage(flipBuf, sx, 0, 1, PH, dx, Math.round(q.yMid + h / 2) + 1, 2, Math.round(h * 0.45));
  }
  ctx.globalAlpha = 1;
}

// ============================================================
// STRIKE
// ============================================================
function beginStrike(i) {
  if (window.DEBUG) console.log('[DEBUG] beginStrike', (i + 1) % 10, new Error().stack.split('\n')[2]);
  if (strike || state !== 'play') return;
  const q = paneQuads[i];
  if (!q) { // pane off-screen (rotate mode) — swing camera first
    targetYaw = i * 36;
    pendingStrike = i;
    return;
  }
  const qc = quadCenter(q);
  const fromRight = (hits + (5 - heroHP)) % 2 === 0;
  strike = {
    i, isHit: i === hanAt, t: 0, impacted: false, fromRight,
    cx: qc.x, cy: qc.y,
    startX: fromRight ? W + 30 : -30, startY: H + 40,
    trail: [],
  };
  SFX.whoosh();
}

function resolveStrike() {
  const i = strike.i, isHit = strike.isHit;
  const pane = panes[i];
  const q = paneQuads[i];
  pane.intact = false;
  pane.brokenBy = isHit ? 'hit' : 'miss';
  if (isHit) pane.jag = genJag(pane.seed);
  if (q) {
    const qc = quadCenter(q);
    // a miss only cracks the glass — lighter debris than a full shatter
    FX.spawnShards(qc.x, qc.y, (q.xR - q.xL) * 0.9, qc.h * 0.9, isHit ? 55 : 18, isHit ? 1.1 : 0.8);
    FX.spawnSparks(qc.x, qc.y, 10);
  }
  SFX.impact();
  SFX.shatter(isHit ? 1 : 0.6);

  if (isHit) {
    hanHP--; hits++;
    combo++; maxCombo = Math.max(maxCombo, combo);
    score += 100 * combo;
    comboPop = 1;
    hanFlash = 1.5;
    SFX.kiai();
    FX.shake.add(0.45);
    FX.flash.white = 0.7;
    reveal = { pane: i, t: 0, dir: Math.random() < 0.5 ? -1 : 1 };
    setTimeout(() => { SFX.gong(); SFX.hanHurt(); }, 60);
    if (combo >= 2) setTimeout(() => SFX.comboSting(combo), 260);
    if (hanHP <= 0) { beginVictory(); return; }
    // Han always relocates to a random intact pane
    const options = [];
    for (let k = 0; k < NUM; k++) if (panes[k].intact) options.push(k);
    hanAt = options[(Math.random() * options.length) | 0];
    flicker = 0.5;
    if (window.DEBUG) console.log('[DEBUG] Han moved to pane', (hanAt + 1) % 10);
  } else {
    heroHP--;
    combo = 0;
    heroFlash = 1.5;
    const d = circDist(i, hanAt);
    pane.clue = d;
    const r = FX.rng(pane.seed);
    // crack count is the clue: exactly d lines, no extra micro-cracks
    pane.cracks = FX.genCracks(
      PW / 2 + (r() - 0.5) * 14, PH / 2 + (r() - 0.5) * 20,
      PW, PH * 0.7, d, pane.seed, 0);
    FX.shake.add(0.7);
    FX.flash.red = 0.9;
    setTimeout(() => SFX.heroHurt(), 80);
    if (heroHP <= 0) { beginDefeat(); return; }
  }
}

function updateStrike(dt) {
  if (!strike) return;
  // track the pane's live position (camera may still be easing)
  const q = paneQuads[strike.i];
  if (q) {
    const qc = quadCenter(q);
    strike.cx = qc.x; strike.cy = qc.y;
  }
  strike.t += dt;
  const t = strike.t;
  if (!strike.impacted && t >= 0.16) {
    strike.impacted = true;
    FX.hitStop(90);
    resolveStrike();
  }
  if (t > 0.7) strike = null;
}

// ============================================================
// WIN / LOSE
// ============================================================
function beginVictory() {
  state = 'victory';
  pendingStrike = null;
  const timeBonus = Math.max(0, Math.floor((300 - elapsed)) * 5);
  victoryAnim = { t: 0, timeBonus, total: score + timeBonus, cascadeDone: false };
  score += timeBonus;
  SFX.droneStop();
  setTimeout(() => SFX.victory(), 900);
}

function beginDefeat() {
  state = 'defeat';
  strike = null;
  pendingStrike = null;
  defeatAnim = {
    t: 0,
    cracks: FX.genCracks(W / 2, H / 2, W, H, 7, (Math.random() * 1e9) | 0, 5),
  };
  SFX.droneStop();
  SFX.defeat();
}

function updateVictory(dt) {
  const v = victoryAnim;
  v.t += dt;
  // cascade: remaining panes shatter one by one
  if (!v.cascadeDone) {
    let k = 0, done = true;
    for (let i = 0; i < NUM; i++) {
      if (!panes[i].intact) continue;
      done = false;
      if (v.t > 0.5 + k * 0.14) {
        panes[i].intact = false;
        panes[i].brokenBy = 'hit';
        panes[i].jag = genJag(panes[i].seed);
        const q = paneQuads[i];
        if (q) {
          const qc = quadCenter(q);
          FX.spawnShards(qc.x, qc.y, (q.xR - q.xL) * 0.9, qc.h * 0.9, 30, 0.9);
        }
        FX.shake.add(0.25);
        SFX.shatter(0.55);
      }
      k++;
    }
    if (done) v.cascadeDone = true;
  }
}

function updateDefeat(dt) {
  defeatAnim.t += dt;
}

// ============================================================
// UPDATE
// ============================================================
let dustTimer = 0;

function update(dt, t) {
  redPulseT = t;
  if (tutorialOpen) return; // game holds still while the tutorial is up
  // camera easing
  yaw += wrap180(targetYaw - yaw) * clamp(dt * 8, 0, 1);

  dustTimer -= dt;
  if (dustTimer <= 0) { FX.spawnDust(W, H); dustTimer = 0.4 + Math.random() * 0.5; }

  comboPop = Math.max(0, comboPop - dt * 2.2);
  heroFlash = Math.max(0, heroFlash - dt);
  hanFlash = Math.max(0, hanFlash - dt);
  flicker = Math.max(0, flicker - dt);

  if (state === 'title') { titleT += dt; return; }

  if (state === 'play') {
    elapsed += dt;
    tauntT += dt;
    if (tauntT > 8) { tauntT = 0; }
    if (tauntT > 7.2 && tauntT - dt <= 7.2 && !strike) SFX.laugh();
    updateStrike(dt);
    if (pendingStrike !== null && !strike) {
      const rel = wrap180(pendingStrike * 36 - yaw);
      if (Math.abs(rel) < 14) {
        const idx = pendingStrike;
        pendingStrike = null;
        beginStrike(idx);
      }
    }
  } else if (state === 'victory') {
    updateStrike(dt); // let the final punch finish its retract
    updateVictory(dt);
  } else if (state === 'defeat') {
    updateDefeat(dt);
  }

  if (reveal) {
    reveal.t += dt;
    if (reveal.t > 1.8) reveal = null;
  }
}

// ============================================================
// RENDER
// ============================================================
function drawBackground(t) {
  const g = ctx.createLinearGradient(0, 0, 0, H);
  g.addColorStop(0, '#170a10');
  g.addColorStop(0.45, '#0b070d');
  g.addColorStop(0.78, '#0e0709');
  g.addColorStop(1, '#1a0c10');
  ctx.fillStyle = g;
  ctx.fillRect(0, 0, W, H);
  // floor sheen line
  ctx.fillStyle = 'rgba(140,50,60,0.10)';
  ctx.fillRect(0, 226, W, 1);
  ctx.fillStyle = 'rgba(200,150,120,0.05)';
  ctx.fillRect(0, 232, W, 1);
  // ceiling glow
  const cg = ctx.createRadialGradient(W / 2, -40, 10, W / 2, -40, 260);
  cg.addColorStop(0, 'rgba(150,30,40,0.16)');
  cg.addColorStop(1, 'rgba(0,0,0,0)');
  ctx.fillStyle = cg;
  ctx.fillRect(0, 0, W, 160);
}

function drawScene(t) {
  const order = computeQuads();
  renderIntactBuffer(t);
  for (const q of order) {
    if (!panes[q.i].intact) renderBrokenBuffer(q.i, t);
  }
  // floor reflections first
  for (const q of order) {
    const pane = panes[q.i];
    drawPaneReflection(pane.intact ? intactFlip : brokenBufs[q.i].f, q);
  }
  // panes far -> near
  for (const q of order) {
    const pane = panes[q.i];
    drawPaneQuad(pane.intact ? intactBuf : brokenBufs[q.i].c, q);
    // pane number plate (mirrors 1-9 then 0, matching the number keys)
    const qc = quadCenter(q);
    const yTop = q.yMid - Math.max(q.hL, q.hR) / 2;
    SPR.text(ctx, String((q.i + 1) % 10), qc.x, yTop - 8, 1,
      pane.intact ? 'rgba(216,168,80,0.75)' : 'rgba(120,90,60,0.55)', 'center');
    // hover highlight
    if (state === 'play' && !strike && q.i === hoverPane && pane.intact) {
      ctx.strokeStyle = 'rgba(255,220,120,0.9)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(q.xL, q.yMid - q.hL / 2);
      ctx.lineTo(q.xR, q.yMid - q.hR / 2);
      ctx.lineTo(q.xR, q.yMid + q.hR / 2);
      ctx.lineTo(q.xL, q.yMid + q.hL / 2);
      ctx.closePath();
      ctx.stroke();
      ctx.strokeStyle = 'rgba(255,220,120,0.25)';
      ctx.lineWidth = 3;
      ctx.stroke();
    }
  }

  // Han reveal — he really WAS behind that glass
  if (reveal) {
    const q = paneQuads[reveal.pane];
    if (q) {
      const qc = quadCenter(q);
      const scale = Math.min(qc.h / SPR.HAN_H, (q.xR - q.xL) / SPR.HAN_W) * 0.92;
      const rw = SPR.HAN_W * scale, rh = SPR.HAN_H * scale;
      let alpha = 1, ox = 0;
      if (reveal.t > 0.8) {
        const k = (reveal.t - 0.8) / 1.0;
        alpha = 1 - k;
        ox = reveal.dir * k * k * 120;
      }
      ctx.globalAlpha = alpha;
      const spr = reveal.t < 0.25 ? SPR.han.hurtWhite : SPR.han.hurt;
      const shakeX = reveal.t < 0.6 ? (Math.random() - 0.5) * 3 : 0;
      ctx.drawImage(spr, qc.x - rw / 2 + ox + shakeX, q.yMid - rh / 2 + rh * 0.06, rw, rh);
      ctx.globalAlpha = 1;
    }
  }
}

function drawFists(t) {
  if (state !== 'play' && state !== 'victory') return;
  const bobL = Math.sin(t * 2.1) * 2;
  const bobR = Math.sin(t * 2.1 + 1.2) * 2;
  // idle guard fists (first-person stance, clear of minimap)
  if (!strike || !strike.fromRight) ctx.drawImage(SPR.fistR, 352, H - 34 + bobR, 46, 39);
  if (!strike || strike.fromRight) ctx.drawImage(SPR.fistL, 82, H - 34 + bobL, 46, 39);

  if (strike) {
    const t0 = clamp(strike.t / 0.16, 0, 1);
    let px, py, sc;
    if (strike.t <= 0.16) {
      const e = t0 * t0; // ease-in: accelerating punch
      px = lerp(strike.startX, strike.cx, e);
      py = lerp(strike.startY, strike.cy, e);
      sc = lerp(2.0, 0.9, e);
      strike.trail.push({ x: px, y: py, s: sc });
      if (strike.trail.length > 5) strike.trail.shift();
    } else {
      const k = clamp((strike.t - 0.16) / 0.22, 0, 1);
      const e = k * k;
      px = lerp(strike.cx, strike.startX, e);
      py = lerp(strike.cy, strike.startY, e);
      sc = lerp(0.9, 2.0, e);
    }
    const spr = strike.fromRight ? SPR.fistR : SPR.fistL;
    // motion trail
    for (let i = 0; i < strike.trail.length; i++) {
      const tr = strike.trail[i];
      ctx.globalAlpha = 0.12 * (i + 1) / strike.trail.length;
      ctx.drawImage(spr, tr.x - 20 * tr.s, tr.y - 17 * tr.s, 40 * tr.s, 34 * tr.s);
    }
    ctx.globalAlpha = 1;
    ctx.drawImage(spr, px - 20 * sc, py - 17 * sc, 40 * sc, 34 * sc);
  }
}

// ---------- HUD ----------
function drawHealthBar(x, name, portrait, hp, flash, alignRight) {
  const chipW = 11, chipH = 7, gap = 2;
  const barW = 5 * (chipW + gap);
  const px = alignRight ? x - 16 - barW - 20 : x;
  // portrait
  ctx.fillStyle = '#7a5326';
  const portX = alignRight ? x - 16 : px;
  ctx.fillRect(portX - 1, 7, 16, 16);
  ctx.drawImage(portrait, portX, 8, 14, 14);
  const tx = alignRight ? portX - 4 : px + 20;
  SPR.text(ctx, name, alignRight ? portX - 4 - barW + barW : px + 20, 8, 1, '#d8a850', alignRight ? 'right' : 'left');
  // chips
  const cy = 16;
  for (let i = 0; i < 5; i++) {
    const cx2 = alignRight ? portX - 4 - barW + i * (chipW + gap) : px + 20 + i * (chipW + gap);
    const alive = i < hp;
    // the just-lost chip blinks white/red for the whole flash window
    const isFlashing = i === hp && flash > 0;
    const blinkOn = Math.floor(flash * 6) % 2 === 0;
    ctx.fillStyle = alive
      ? (alignRight ? '#c22b3d' : '#3fae6a')
      : (isFlashing ? (blinkOn ? '#ffffff' : '#c22b3d') : '#2a1a20');
    ctx.fillRect(cx2, cy, chipW, chipH);
    ctx.fillStyle = alive ? 'rgba(255,255,255,0.35)' : 'rgba(255,255,255,0.05)';
    ctx.fillRect(cx2, cy, chipW, 2);
    ctx.strokeStyle = 'rgba(0,0,0,0.6)';
    ctx.strokeRect(cx2 + 0.5, cy + 0.5, chipW - 1, chipH - 1);
  }
}

function drawMinimap(t) {
  const mx = 40, my = H - 40, R = 24;
  ctx.fillStyle = 'rgba(10,5,10,0.65)';
  ctx.beginPath(); ctx.arc(mx, my, R + 9, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = 'rgba(122,83,38,0.8)';
  ctx.lineWidth = 1;
  ctx.beginPath(); ctx.arc(mx, my, R + 9, 0, Math.PI * 2); ctx.stroke();

  // view cone
  {
    const a = (yaw - 90) * D2R;
    ctx.fillStyle = 'rgba(216,168,80,0.10)';
    ctx.beginPath();
    ctx.moveTo(mx, my);
    ctx.arc(mx, my, R + 7, a - 50 * D2R, a + 50 * D2R);
    ctx.closePath(); ctx.fill();
  }
  // player
  ctx.fillStyle = '#d8a850';
  ctx.fillRect(mx - 1, my - 1, 3, 3);

  for (let i = 0; i < NUM; i++) {
    const a = (i * 36 - 90) * D2R;
    const dx = mx + Math.cos(a) * R, dy = my + Math.sin(a) * R;
    const pane = panes[i];
    if (pane.intact) {
      ctx.fillStyle = (i === hoverPane) ? '#ffe9b0' : '#d8a850';
      ctx.fillRect(dx - 2, dy - 2, 4, 4);
    } else if (pane.brokenBy === 'miss') {
      ctx.fillStyle = '#57131d';
      ctx.fillRect(dx - 2, dy - 2, 4, 4);
    } else {
      ctx.fillStyle = '#3d2c16';
      ctx.fillRect(dx - 2, dy - 2, 4, 4);
      ctx.fillStyle = '#7a5326';
      ctx.fillRect(dx - 1, dy - 1, 2, 2);
    }
    if (window.DEBUG && i === hanAt) {
      ctx.fillStyle = '#ff0000';
      ctx.fillRect(dx - 1, dy - 4, 2, 2);
    }
  }
}

function drawHUD(t) {
  drawHealthBar(10, 'BRUCE', SPR.portraitBruce, heroHP, heroFlash, false);
  drawHealthBar(W - 10, 'HAN', SPR.portraitHan, hanHP, hanFlash, true);
  SPR.text(ctx, fmtTime(elapsed), W / 2, 8, 1, '#9b8b6a', 'center');
  SPR.text(ctx, pad(score, 6), W / 2, 16, 1, '#d8a850', 'center');
  drawMinimap(t);
  // combo
  if (combo >= 2 && state === 'play') {
    const s = 1 + comboPop * 1.1;
    const scale = Math.max(1, Math.round(s));
    const col = combo >= 4 ? '#ff5a64' : '#ffe9b0';
    SPR.text(ctx, `COMBO x${combo}`, W / 2, 196 - scale * 2, scale, col, 'center');
  }
  // hints
  if (state === 'play' && elapsed < 12) {
    SPR.text(ctx, 'CLICK A MIRROR TO STRIKE - DRAG TO LOOK', W / 2, H - 8, 1, 'rgba(155,139,106,0.55)', 'center');
  }
  drawUIButtons();
}

// ---------- title ----------
function drawTitle(t) {
  ctx.fillStyle = '#080409';
  ctx.fillRect(0, 0, W, H);
  // red sun
  const pul = 1 + Math.sin(t * 1.2) * 0.02;
  const sy = 120;
  const grd = ctx.createRadialGradient(W / 2, sy, 10, W / 2, sy, 90 * pul);
  grd.addColorStop(0, '#c22b3d');
  grd.addColorStop(0.75, '#8e1626');
  grd.addColorStop(1, 'rgba(120,15,30,0)');
  ctx.fillStyle = grd;
  ctx.beginPath(); ctx.arc(W / 2, sy, 90 * pul, 0, Math.PI * 2); ctx.fill();
  ctx.fillStyle = '#a91e30';
  ctx.beginPath(); ctx.arc(W / 2, sy, 62 * pul, 0, Math.PI * 2); ctx.fill();
  ctx.strokeStyle = '#d8a850';
  ctx.lineWidth = 2;
  ctx.beginPath(); ctx.arc(W / 2, sy, 66 * pul, 0, Math.PI * 2); ctx.stroke();
  // Bruce silhouette (flying kick)
  ctx.drawImage(SPR.bruceSil, W / 2 - 78, sy - 52, 156, 104);
  // title
  const ty = 34;
  SPR.text(ctx, 'HALL OF MIRRORS', W / 2 + 2, ty + 2, 3, '#57131d', 'center');
  SPR.text(ctx, 'HALL OF MIRRORS', W / 2, ty, 3, '#ffd985', 'center');
  // subtitle below the red sun
  SPR.text(ctx, 'BRUCE VS HAN', W / 2, 218, 1, '#c9a15c', 'center');
  // prompt
  if (Math.floor(t * 1.6) % 2 === 0) {
    SPR.text(ctx, 'CLICK TO ENTER', W / 2, 240, 2, '#ffe9b0', 'center');
  }
}

// ---------- end screens ----------
function tallyLine(label, value, y, t, startT, isTime) {
  if (t < startT) return;
  const k = clamp((t - startT) / 0.8, 0, 1);
  const shown = isTime ? value : Math.floor(value * k);
  SPR.text(ctx, label, W / 2 - 70, y, 1, '#9b8b6a', 'left');
  SPR.text(ctx, isTime ? value : String(shown), W / 2 + 70, y, 1, '#ffd985', 'right');
  if (!isTime && k < 1 && Math.random() < 0.4) SFX.tallyTick();
}

function drawVictory(t) {
  const v = victoryAnim;
  if (v.t < 1.4) return; // let the cascade play out
  const k = clamp((v.t - 1.4) / 0.5, 0, 1);
  ctx.fillStyle = `rgba(5,2,6,${0.72 * k})`;
  ctx.fillRect(0, 0, W, H);
  const pulse = 1 + Math.sin(t * 3) * 0.02;
  const scale = 4;
  SPR.text(ctx, 'VICTORY', W / 2 + 3, 62 + 3, scale, '#57131d', 'center');
  SPR.text(ctx, 'VICTORY', W / 2, 62, scale, pulse > 1 ? '#ffe9b0' : '#ffd985', 'center');
  SPR.text(ctx, 'DESTROY THE IMAGE AND YOU WILL BREAK THE ENEMY', W / 2, 100, 1, '#ffd985', 'center');
  const t2 = v.t - 1.9;
  tallyLine('STRIKES', hits, 126, t2, 0, false);
  tallyLine('BEST COMBO', maxCombo, 140, t2, 0.4, false);
  tallyLine('TIME', fmtTime(elapsed), 154, t2, 0.8, true);
  tallyLine('TIME BONUS', v.timeBonus, 168, t2, 1.2, false);
  if (t2 > 1.8) {
    ctx.fillStyle = 'rgba(216,168,80,0.5)';
    ctx.fillRect(W / 2 - 74, 182, 148, 1);
    const k2 = clamp((t2 - 1.8) / 1.0, 0, 1);
    SPR.text(ctx, 'SCORE', W / 2 - 70, 192, 2, '#d8a850', 'left');
    SPR.text(ctx, pad(v.total * k2, 6), W / 2 + 70, 192, 2, '#ffe9b0', 'right');
    if (k2 < 1 && Math.random() < 0.5) SFX.tallyTick();
  }
  if (t2 > 3 && Math.floor(t * 1.6) % 2 === 0) {
    SPR.text(ctx, 'CLICK TO FIGHT AGAIN', W / 2, 234, 1, '#ffe9b0', 'center');
  }
}

function drawDefeat(t) {
  const d = defeatAnim;
  const k = clamp(d.t / 0.6, 0, 1);
  // the SCREEN cracks
  ctx.save();
  ctx.globalAlpha = Math.min(1, d.t * 2);
  const partial = d.cracks.map(line => {
    const n = Math.max(2, Math.ceil(line.length * k));
    return line.slice(0, n);
  });
  FX.drawCracks(ctx, partial, 0, 0, 1, 1, 'rgba(230,220,225,0.9)', 1.5, 'rgba(200,40,50,0.5)');
  ctx.restore();
  if (d.t > 0.8) {
    const k2 = clamp((d.t - 0.8) / 0.6, 0, 1);
    ctx.fillStyle = `rgba(8,2,4,${0.78 * k2})`;
    ctx.fillRect(0, 0, W, H);
    SPR.text(ctx, 'DEFEAT', W / 2 + 3, 78 + 3, 4, '#2a0a10', 'center');
    SPR.text(ctx, 'DEFEAT', W / 2, 78, 4, '#c22b3d', 'center');
    SPR.text(ctx, 'YOU FAILED TO STOP HAN. THE SHAOLIN TEMPLE IS DISGRACED.', W / 2, 116, 1, '#ffd985', 'center');
    SPR.text(ctx, 'WILL YOU CONTINUE THE FIGHT?', W / 2, 126, 1, '#ffd985', 'center');
    SPR.text(ctx, `STRIKES ${hits}   TIME ${fmtTime(elapsed)}`, W / 2, 152, 1, '#6e6350', 'center');
    SPR.text(ctx, `SCORE ${pad(score, 6)}`, W / 2, 166, 1, '#d8a850', 'center');
  }
  if (d.t > 1.8 && Math.floor(t * 1.6) % 2 === 0) {
    SPR.text(ctx, 'CLICK TO TRY AGAIN', W / 2, 214, 1, '#ffe9b0', 'center');
  }
}

// ---------- main render ----------
function render(t) {
  ctx.clearRect(0, 0, W, H);

  if (state === 'title') {
    drawTitle(t);
    FX.drawParts(ctx);
    drawUIButtons();
    if (tutorialOpen) drawTutorial(t);
    applyFlashes();
    return;
  }

  const off = FX.shake.offset();
  ctx.save();
  ctx.translate(Math.round(off.x), Math.round(off.y));

  // strike zoom-in toward the target pane
  if (strike) {
    let z = 1;
    if (strike.t <= 0.16) z = 1 + (strike.t / 0.16) * 0.13;
    else z = 1 + Math.max(0, 1 - (strike.t - 0.16) / 0.3) * 0.13;
    ctx.translate(strike.cx, strike.cy);
    ctx.scale(z, z);
    ctx.translate(-strike.cx, -strike.cy);
  }

  drawBackground(t);
  drawScene(t);
  FX.drawParts(ctx);
  drawFists(t);
  ctx.restore();

  // ambient red pulse
  const pa = 0.045 + 0.03 * Math.sin(redPulseT * 0.8);
  ctx.fillStyle = `rgba(150,15,30,${pa})`;
  ctx.fillRect(0, 0, W, H);

  applyFlashes();
  drawHUD(t);

  if (state === 'victory') drawVictory(t);
  if (state === 'defeat') drawDefeat(t);
  if (tutorialOpen) drawTutorial(t);
}

function applyFlashes() {
  if (FX.flash.white > 0) {
    ctx.fillStyle = `rgba(255,255,255,${clamp(FX.flash.white, 0, 1) * 0.85})`;
    ctx.fillRect(0, 0, W, H);
  }
  if (FX.flash.red > 0) {
    ctx.fillStyle = `rgba(190,25,40,${clamp(FX.flash.red, 0, 1) * 0.4})`;
    ctx.fillRect(0, 0, W, H);
  }
}

// ============================================================
// INPUT
// ============================================================
let pointer = { x: 0, y: 0, down: false, downX: 0, downYaw: 0, dragging: false };

function canvasPos(e) {
  const r = cv.getBoundingClientRect();
  return { x: (e.clientX - r.left) * W / r.width, y: (e.clientY - r.top) * H / r.height };
}

cv.addEventListener('pointerdown', e => {
  const p = canvasPos(e);
  pointer.down = true; pointer.dragging = false;
  pointer.downX = p.x; pointer.downYaw = targetYaw;
  pointer.x = p.x; pointer.y = p.y;
  cv.setPointerCapture(e.pointerId);
});

cv.addEventListener('pointermove', e => {
  const p = canvasPos(e);
  pointer.x = p.x; pointer.y = p.y;
  if (tutorialOpen) { hoverPane = -1; return; }
  if (pointer.down && state === 'play') {
    const dx = p.x - pointer.downX;
    if (Math.abs(dx) > 6) pointer.dragging = true;
    if (pointer.dragging) targetYaw = pointer.downYaw - dx * 0.45;
  }
  hoverPane = (state === 'play' && !strike && !pointer.dragging) ? hitTestPane(p.x, p.y) : -1;
  if (hoverPane >= 0 && !panes[hoverPane].intact) hoverPane = -1;
});

cv.addEventListener('pointerup', e => {
  const wasDrag = pointer.dragging;
  pointer.down = false; pointer.dragging = false;
  if (wasDrag) return;
  const p = canvasPos(e);
  handleClick(p.x, p.y);
});

function handleClick(x, y) {
  SFX.init();
  if (tutorialOpen) { tutorialOpen = false; SFX.uiTick(); return; }
  if (clickUIButton(x, y)) return;
  if (state === 'title') { startGame(); return; }
  if (state === 'victory' && victoryAnim.t > 4.5) { SFX.uiTick(); startGame(); return; }
  if (state === 'defeat' && defeatAnim.t > 2.0) { SFX.uiTick(); startGame(); return; }
  if (state !== 'play' || strike) return;
  const i = hitTestPane(x, y);
  if (i < 0) return;
  if (!panes[i].intact) { SFX.uiTick(); return; }
  beginStrike(i);
}

window.addEventListener('keydown', e => {
  if (e.repeat) return;
  const k = e.key;
  if (tutorialOpen) {
    if (k === 'Escape' || k === 'Enter' || k === ' ') { tutorialOpen = false; SFX.uiTick(); }
    return;
  }
  if (k === 'm' || k === 'M') { toggleMute(); return; }
  if (k === 'Enter' || k === ' ') {
    SFX.init();
    if (state === 'title') startGame();
    else if (state === 'victory' && victoryAnim.t > 4.5) startGame();
    else if (state === 'defeat' && defeatAnim.t > 2.0) startGame();
    return;
  }
  if (state !== 'play') return;
  if (k === 'ArrowLeft') { targetYaw -= 36; SFX.uiTick(); }
  if (k === 'ArrowRight') { targetYaw += 36; SFX.uiTick(); }
  if (k === 'ArrowUp') {
    // strike the mirror closest to the center of view
    let best = -1, bestRel = 1e9;
    for (let i = 0; i < NUM; i++) {
      if (!panes[i].intact) continue;
      const rel = Math.abs(wrap180(i * 36 - yaw));
      if (rel < bestRel) { bestRel = rel; best = i; }
    }
    if (best >= 0 && !strike) {
      SFX.init();
      beginStrike(best);
    }
    return;
  }
  if (/^[0-9]$/.test(k)) {
    const i = (k === '0') ? 9 : parseInt(k, 10) - 1;
    if (panes[i] && panes[i].intact && !strike) {
      SFX.init();
      beginStrike(i);
    }
  }
});

// ---------- in-canvas UI buttons ----------
function toggleMute() {
  SFX.init();
  SFX.setMuted(!SFX.muted);
}
function uiButtons() {
  return [
    { id: 'tutorial', label: 'TUTORIAL', x: W - 106, y: 28, w: 50, h: 11 },
    { id: 'mute', label: SFX.muted ? 'SND:OFF' : 'SND:ON', x: W - 52, y: 28, w: 45, h: 11 },
  ];
}

function drawUIButtons() {
  for (const b of uiButtons()) {
    const hov = pointer.x >= b.x && pointer.x <= b.x + b.w && pointer.y >= b.y && pointer.y <= b.y + b.h;
    ctx.fillStyle = hov ? 'rgba(60,30,20,0.85)' : 'rgba(20,8,12,0.7)';
    ctx.fillRect(b.x, b.y, b.w, b.h);
    ctx.strokeStyle = hov ? '#d8a850' : '#7a5326';
    ctx.strokeRect(b.x + 0.5, b.y + 0.5, b.w - 1, b.h - 1);
    SPR.text(ctx, b.label, b.x + b.w / 2, b.y + 3, 1, hov ? '#ffe9b0' : '#c9a15c', 'center');
  }
}

function clickUIButton(x, y) {
  for (const b of uiButtons()) {
    if (x >= b.x && x <= b.x + b.w && y >= b.y && y <= b.y + b.h) {
      if (b.id === 'tutorial') { tutorialOpen = true; SFX.uiTick(); }
      else toggleMute();
      return true;
    }
  }
  return false;
}

// ---------- tutorial modal ----------
function drawKeycap(x, y, w, h, hot) {
  ctx.fillStyle = hot ? '#3a2415' : '#1c0f13';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = hot ? '#ffe9b0' : '#7a5326';
  ctx.strokeRect(x + 0.5, y + 0.5, w - 1, h - 1);
  ctx.fillStyle = hot ? 'rgba(255,233,176,0.35)' : 'rgba(216,168,80,0.2)';
  ctx.fillRect(x + 1, y + 1, w - 2, 1);
}

function drawArrowGlyph(cx, cy, dir, col) {
  ctx.fillStyle = col;
  for (let i = 0; i < 4; i++) {
    const s = i * 2 + 1;
    if (dir === 'up') ctx.fillRect(cx - i, cy - 2 + i, s, 1);
    else if (dir === 'left') ctx.fillRect(cx - 2 + i, cy - i, 1, s);
    else ctx.fillRect(cx + 2 - i, cy - i, 1, s);
  }
}

function drawMouseIcon(x, y, hot) {
  const B = hot ? '#ffe9b0' : '#9b8b6a';
  ctx.fillStyle = '#1c0f13';
  ctx.fillRect(x + 2, y + 1, 16, 24);
  ctx.fillRect(x + 1, y + 3, 18, 20);
  ctx.fillStyle = B;
  ctx.fillRect(x + 4, y, 12, 1);
  ctx.fillRect(x + 4, y + 25, 12, 1);
  ctx.fillRect(x, y + 4, 1, 18);
  ctx.fillRect(x + 19, y + 4, 1, 18);
  ctx.fillRect(x + 2, y + 1, 2, 1); ctx.fillRect(x + 16, y + 1, 2, 1);
  ctx.fillRect(x + 1, y + 2, 1, 2); ctx.fillRect(x + 18, y + 2, 1, 2);
  ctx.fillRect(x + 2, y + 24, 2, 1); ctx.fillRect(x + 16, y + 24, 2, 1);
  ctx.fillRect(x + 1, y + 22, 1, 2); ctx.fillRect(x + 18, y + 22, 1, 2);
  ctx.fillRect(x + 9, y + 3, 2, 6); // button split / scroll wheel
}

function drawTutorial(t) {
  ctx.fillStyle = 'rgba(5,2,6,0.82)';
  ctx.fillRect(0, 0, W, H);
  const bx = 16, by = 62, bw = W - 32, bh = 146;
  ctx.fillStyle = 'rgba(20,8,12,0.95)';
  ctx.fillRect(bx, by, bw, bh);
  ctx.strokeStyle = '#7a5326';
  ctx.strokeRect(bx + 0.5, by + 0.5, bw - 1, bh - 1);
  ctx.strokeStyle = '#d8a850';
  ctx.strokeRect(bx + 2.5, by + 2.5, bw - 5, bh - 5);

  SPR.text(ctx, 'HOW TO PLAY', W / 2, by + 10, 2, '#ffd985', 'center');

  // numbered steps — compact font, one per line, full panel width
  const BODY = '#e8d5b0';
  const steps = [
    '1. STRIKE THE MIRRORS TO FIND AND DEFEAT HAN',
    '2. HITTING HAN REDUCES HIS HEALTH BUT HE WILL HIDE BEHIND A NEW MIRROR',
    '3. MISSING HAN REDUCES YOUR HEALTH BUT THE MIRROR CRACKS WITH CLUES TO HIS NEW POSITION',
    '4. 1 CRACK = 1 AWAY   2 CRACKS = 2 AWAY   3 CRACKS = 3 AWAY   4+ CRACKS = FAR AWAY',
  ];
  let y = by + 30;
  for (const s of steps) {
    SPR.textSmall(ctx, s, bx + 14, y, BODY, 'left');
    y += 9;
  }

  // controls, keycap-style — highlight cycles through the three groups
  const hot = Math.floor(t / 1.4) % 3;
  const ky = by + 74;
  const LBL = (i) => hot === i ? '#ffe9b0' : '#9b8b6a';

  // mouse
  drawMouseIcon(118, ky, hot === 0);
  SPR.textSmall(ctx, 'CLICK - STRIKE', 128, ky + 31, LBL(0), 'center');
  SPR.textSmall(ctx, 'DRAG - LOOK', 128, ky + 39, LBL(0), 'center');

  // arrow cluster
  const ac = 240, ks = 15;
  drawKeycap(ac - ks / 2, ky - 4, ks, ks, hot === 1);
  drawArrowGlyph(ac, ky - 4 + ks / 2, 'up', LBL(1));
  drawKeycap(ac - ks / 2 - ks - 2, ky + ks - 2, ks, ks, hot === 1);
  drawArrowGlyph(ac - ks - 2, ky + ks - 2 + ks / 2, 'left', LBL(1));
  drawKeycap(ac + ks / 2 + 2, ky + ks - 2, ks, ks, hot === 1);
  drawArrowGlyph(ac + ks + 2, ky + ks - 2 + ks / 2, 'right', LBL(1));
  SPR.textSmall(ctx, 'UP - STRIKE CENTER', ac, ky + 31, LBL(1), 'center');
  SPR.textSmall(ctx, 'LEFT RIGHT - LOOK', ac, ky + 39, LBL(1), 'center');

  // number + sound keys
  const kc = 352;
  drawKeycap(kc - 22, ky + 3, 26, ks, hot === 2);
  SPR.textSmall(ctx, '0-9', kc - 9, ky + 8, LBL(2), 'center');
  drawKeycap(kc + 8, ky + 3, ks, ks, hot === 2);
  SPR.textSmall(ctx, 'M', kc + 15, ky + 8, LBL(2), 'center');
  SPR.textSmall(ctx, '0-9 - STRIKE', kc, ky + 31, LBL(2), 'center');
  SPR.textSmall(ctx, 'M - SOUND', kc, ky + 39, LBL(2), 'center');

  SPR.textSmall(ctx, 'CLICK ANYWHERE TO CLOSE', W / 2, by + bh - 11, 'rgba(232,213,176,0.6)', 'center');
}

// ============================================================
// MAIN LOOP
// ============================================================
let last = performance.now();
function frame(now) {
  requestAnimationFrame(frame);
  const dt = Math.min(0.05, (now - last) / 1000);
  last = now;
  const t = now / 1000;
  FX.updateFlash(dt);
  if (!FX.frozen()) {
    update(dt, t);
    FX.shake.update(dt);
    FX.updateParts(dt);
  }
  render(t);
}
requestAnimationFrame(frame);
