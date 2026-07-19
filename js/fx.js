'use strict';
/* Visual effects: screen shake, hit-stop, flashes, particles, procedural cracks. */
const FX = (() => {

  // ---------- seeded RNG (deterministic cracks per pane) ----------
  function rng(seed) {
    let s = seed >>> 0;
    return () => {
      s = (s * 1664525 + 1013904223) >>> 0;
      return s / 4294967296;
    };
  }

  // ---------- screen shake ----------
  const shake = {
    trauma: 0,
    add(a) { this.trauma = Math.min(1, this.trauma + a); },
    update(dt) { this.trauma = Math.max(0, this.trauma - dt * 1.6); },
    offset() {
      const t = this.trauma * this.trauma;
      return {
        x: (Math.random() * 2 - 1) * 7 * t,
        y: (Math.random() * 2 - 1) * 5 * t,
      };
    },
  };

  // ---------- hit-stop ----------
  let freezeUntil = 0;
  function hitStop(ms) { freezeUntil = performance.now() + ms; }
  function frozen() { return performance.now() < freezeUntil; }

  // ---------- full-screen flashes ----------
  const flash = { white: 0, red: 0 };
  function updateFlash(dt) {
    flash.white = Math.max(0, flash.white - dt * 4.5);
    flash.red = Math.max(0, flash.red - dt * 2.2);
  }

  // ---------- particles ----------
  const parts = [];

  const GLASS_COLS = ['#cfe6ee', '#9fc4d4', '#eef8fc', '#7fa8bc', '#ffd9de'];

  function spawnShards(x, y, w, h, count, power) {
    for (let i = 0; i < count; i++) {
      const px = x + (Math.random() - 0.5) * w;
      const py = y + (Math.random() - 0.5) * h;
      const ang = Math.atan2(py - y, px - x) + (Math.random() - 0.5) * 1.2;
      const spd = (40 + Math.random() * 160) * power;
      parts.push({
        kind: 'shard',
        x: px, y: py,
        vx: Math.cos(ang) * spd + (Math.random() - 0.5) * 50,
        vy: Math.sin(ang) * spd - 60 - Math.random() * 90,
        rot: Math.random() * Math.PI * 2,
        vr: (Math.random() - 0.5) * 14,
        size: 1.5 + Math.random() * 3.5,
        col: GLASS_COLS[(Math.random() * GLASS_COLS.length) | 0],
        life: 0.9 + Math.random() * 0.9,
        age: 0,
      });
    }
  }

  function spawnSparks(x, y, count, col) {
    for (let i = 0; i < count; i++) {
      const ang = Math.random() * Math.PI * 2;
      const spd = 60 + Math.random() * 140;
      parts.push({
        kind: 'spark',
        x, y,
        vx: Math.cos(ang) * spd, vy: Math.sin(ang) * spd,
        size: 1, col: col || '#ffe9b0',
        life: 0.25 + Math.random() * 0.3, age: 0,
      });
    }
  }

  function spawnDust(W, H) {
    parts.push({
      kind: 'dust',
      x: Math.random() * W, y: H + 4,
      vx: (Math.random() - 0.5) * 4, vy: -3 - Math.random() * 6,
      size: 1, col: 'rgba(200,150,120,0.25)',
      life: 8 + Math.random() * 8, age: 0,
    });
  }

  function updateParts(dt) {
    for (let i = parts.length - 1; i >= 0; i--) {
      const p = parts[i];
      p.age += dt;
      if (p.age > p.life) { parts.splice(i, 1); continue; }
      if (p.kind === 'shard') {
        p.vy += 420 * dt;
        p.rot += p.vr * dt;
      } else if (p.kind === 'spark') {
        p.vy += 160 * dt;
      } else if (p.kind === 'dust') {
        p.vx += (Math.random() - 0.5) * 2 * dt * 10;
      }
      p.x += p.vx * dt;
      p.y += p.vy * dt;
    }
  }

  function drawParts(ctx) {
    for (const p of parts) {
      const k = 1 - p.age / p.life;
      ctx.globalAlpha = p.kind === 'dust' ? k * 0.5 : Math.min(1, k * 2);
      if (p.kind === 'shard') {
        ctx.save();
        ctx.translate(p.x, p.y);
        ctx.rotate(p.rot);
        // occasional white glint
        ctx.fillStyle = (Math.random() < 0.06) ? '#ffffff' : p.col;
        ctx.fillRect(-p.size / 2, -p.size / 4, p.size, p.size / 2);
        ctx.restore();
      } else {
        ctx.fillStyle = p.col;
        ctx.fillRect(p.x | 0, p.y | 0, p.size, p.size);
      }
    }
    ctx.globalAlpha = 1;
  }

  function clearParts() { parts.length = 0; }

  // ---------- procedural cracks ----------
  // Returns array of polylines [[{x,y},...], ...] radiating from (cx,cy)
  // within a box w×h. `n` main cracks, spread over distinct directions.
  function genCracks(cx, cy, w, h, n, seed, micro = 0) {
    const r = rng(seed);
    const lines = [];
    const baseAng = r() * Math.PI * 2;
    for (let i = 0; i < n; i++) {
      const ang = baseAng + (i / n) * Math.PI * 2 + (r() - 0.5) * 0.5;
      lines.push(crackLine(cx, cy, ang, Math.max(w, h) * (0.45 + r() * 0.4), r, true));
    }
    for (let i = 0; i < micro; i++) {
      const ang = r() * Math.PI * 2;
      lines.push(crackLine(cx, cy, ang, Math.max(w, h) * (0.12 + r() * 0.15), r, false));
    }
    return lines;
  }

  function crackLine(x, y, ang, len, r, branch) {
    const pts = [{ x, y }];
    const segs = 3 + (r() * 3 | 0);
    let px = x, py = y, a = ang;
    for (let s = 0; s < segs; s++) {
      const d = len / segs * (0.7 + r() * 0.6);
      a += (r() - 0.5) * 0.9;
      px += Math.cos(a) * d;
      py += Math.sin(a) * d;
      pts.push({ x: px, y: py });
    }
    return pts;
  }

  function drawCracks(ctx, lines, ox, oy, sx, sy, col, width = 1, glow = null) {
    ctx.save();
    if (glow) {
      ctx.strokeStyle = glow;
      ctx.lineWidth = width + 2;
      ctx.globalAlpha = 0.35;
      strokeAll(ctx, lines, ox, oy, sx, sy);
      ctx.globalAlpha = 1;
    }
    ctx.strokeStyle = col;
    ctx.lineWidth = width;
    strokeAll(ctx, lines, ox, oy, sx, sy);
    ctx.restore();
  }

  function strokeAll(ctx, lines, ox, oy, sx, sy) {
    ctx.beginPath();
    for (const line of lines) {
      ctx.moveTo(ox + line[0].x * sx, oy + line[0].y * sy);
      for (let i = 1; i < line.length; i++) {
        ctx.lineTo(ox + line[i].x * sx, oy + line[i].y * sy);
      }
    }
    ctx.stroke();
  }

  return {
    rng, shake, hitStop, frozen, flash, updateFlash,
    spawnShards, spawnSparks, spawnDust, updateParts, drawParts, clearParts,
    genCracks, drawCracks,
  };
})();
