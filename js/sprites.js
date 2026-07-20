'use strict';
/* Procedural pixel-art sprites + a 4x5 bitmap font. All drawn in code, no assets. */
const SPR = (() => {

  function canvas(w, h) {
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const x = c.getContext('2d');
    x.imageSmoothingEnabled = false;
    return c;
  }

  // ============================================================
  // 4x5 pixel font
  // ============================================================
  const G = {
    A:[6,9,15,9,9], B:[14,9,14,9,14], C:[7,8,8,8,7], D:[14,9,9,9,14],
    E:[15,8,14,8,15], F:[15,8,14,8,8], G:[7,8,11,9,7], H:[9,9,15,9,9],
    I:[14,4,4,4,14], J:[3,1,1,9,6], K:[9,10,12,10,9], L:[8,8,8,8,15],
    M:[9,15,15,9,9], N:[9,13,15,11,9], O:[6,9,9,9,6], P:[14,9,14,8,8],
    Q:[6,9,9,10,5], R:[14,9,14,10,9], S:[7,8,6,1,14], T:[14,4,4,4,4],
    U:[9,9,9,9,6], V:[9,9,9,10,4], W:[9,9,15,15,9], X:[9,9,6,9,9],
    Y:[9,9,6,4,4], Z:[15,1,6,8,15],
    '0':[6,9,11,13,6], '1':[4,12,4,4,14], '2':[14,1,6,8,15], '3':[14,1,6,1,14],
    '4':[9,9,15,1,1], '5':[15,8,14,1,14], '6':[7,8,14,9,6], '7':[15,1,2,4,4],
    '8':[6,9,6,9,6], '9':[6,9,7,1,14],
    ' ':[0,0,0,0,0], '.':[0,0,0,0,4], ':':[0,4,0,4,0], '!':[4,4,4,0,4],
    '-':[0,0,14,0,0], 'x':[0,9,6,9,0], '+':[0,4,14,4,0], '/':[1,2,4,8,8],
    '>':[8,4,2,4,8], '<':[2,4,8,4,2], "'":[4,4,0,0,0], '?':[14,1,6,0,4],
    '=':[0,14,0,14,0],
  };

  function text(ctx, str, x, y, scale, col, align = 'left') {
    str = String(str).toUpperCase();
    const w = str.length * 5 * scale;
    let ox = x;
    if (align === 'center') ox = x - w / 2;
    else if (align === 'right') ox = x - w;
    // integer origin keeps the pixel font crisp (half-pixel rects antialias)
    ox = Math.round(ox);
    y = Math.round(y);
    ctx.fillStyle = col;
    for (let ci = 0; ci < str.length; ci++) {
      const g = G[str[ci]] || G['?'];
      for (let r = 0; r < 5; r++) {
        const bits = g[r];
        for (let b = 0; b < 4; b++) {
          if (bits & (8 >> b)) {
            ctx.fillRect(ox + (ci * 5 + b) * scale, y + r * scale, scale, scale);
          }
        }
      }
    }
    return w;
  }
  function textW(str, scale) { return String(str).length * 5 * scale; }

  // ============================================================
  // HAN — 52x92 sprite (2x internal grid so the blades can be
  // half-pixel thin), poses: idle, taunt, hurt, impaled
  // ============================================================
  const HAN_W = 52, HAN_H = 92;

  function drawHanInto(c, pose) {
    const SKIN = '#d19a62', SKIN2 = '#a56b3a',
      HAIR = '#585d66', HAIR2 = '#3e434b',
      TOP = '#6e4526', TOP2 = '#513218', TOP3 = '#8a5c33',
      PANTS = '#a8996a', PANTS2 = '#847752', PANTS3 = '#c2b485',
      BELT = '#3a2412', CLAW = '#c3ccd4', CLAWH = '#f2f8fc', DK = '#1c1410',
      CUFF = '#e9edf2', GLOVE = '#141419';
    const S = 2; // internal grid scale
    const px = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x * S, y * S, w * S, h * S); };
    const pxr = (x, y, w, h, col) => { c.fillStyle = col; c.fillRect(x, y, w, h); }; // raw (half-grid) px
    const hurt = pose === 'hurt';
    const imp = pose === 'impaled';
    const down = hurt || imp;        // slumped: arms drop, eyes shut
    const taunt = pose === 'taunt';
    const L = down ? 2 : 0;          // torso lean
    const hy = 2 + (down ? 2 : 0) + (imp ? 1 : 0); // head y (impaled slumps deeper)

    // ---- khaki pants / legs ----
    px(7, 27, 12, 15, PANTS);
    px(7, 27, 3, 15, PANTS2);
    px(16, 27, 3, 15, PANTS3);
    px(6, 40, 14, 2, PANTS2);         // hem
    px(8, 42, 3, 2, DK); px(14, 42, 3, 2, DK); // shoes
    // center seam
    px(12, 30, 1, 11, PANTS2);

    // ---- brown torso ----
    px(6 + L, 16, 14, 12, TOP);
    px(6 + L, 16, 4, 12, TOP2);
    px(16 + L, 16, 3, 12, TOP3);
    px(6 + L, 25, 14, 2, BELT);       // dark belt
    px(12 + L, 16, 1, 9, TOP3);       // frog-button line
    px(5 + L, 14, 16, 3, TOP);        // shoulders
    px(5 + L, 14, 4, 3, TOP2);
    if (imp) {                        // spear wound — dark stain spreading from the chest
      px(10 + L, 18, 6, 3, '#8e1626');
      px(12 + L, 19, 3, 2, '#c22b3d');
      px(12 + L, 21, 1, 4, '#6e1120');
      px(15 + L, 21, 1, 3, '#6e1120');
    }

    // ---- right arm (viewer right) hangs down, black glove ----
    px(19 + L, 17, 3, 8, TOP2);
    px(19 + L, 25, 3, 3, GLOVE);
    px(19 + L, 27, 3, 1, '#0b0b10');

    // ---- left arm (his blade hand): four needle blades on a white cuff ----
    if (down) {
      // both arms drop, blades hang low
      px(4 + L, 17, 3, 8, TOP2);
      pxr((4 + L) * S - 1, 25 * S, 8, 4, CUFF);       // wrist-width cuff
      for (let k = 0; k < 4; k++) {
        pxr((4 + L) * S + k * 2, 27 * S, 1, 8 + (k % 2 ? 2 : 0), k % 2 ? CLAWH : CLAW);
      }
    } else {
      const raise = taunt ? 4 : 0;
      px(5 + L, 15 - raise, 3, 4, TOP3);              // upper arm
      px(4 + L, 11 - raise, 3, 5, TOP2);              // forearm
      // white shirt cuff — no wider than the wrist
      const cx0 = (4 + L) * S - 1, byTop = (9 - raise) * S;
      pxr(cx0, byTop, 8, 4, CUFF);
      // four needle blades packed at 1px gaps, cluster = wrist width
      for (let k = 0; k < 4; k++) {
        const len = 11 + (k % 2 ? 2 : 0);
        pxr(cx0 + 1 + k * 2, byTop - len, 1, len, k % 2 ? CLAWH : CLAW);
        pxr(cx0 + 1 + k * 2, byTop - len, 1, 2, CLAWH); // bright tip
      }
    }

    // ---- head ----
    const hx = 9 + L;
    px(hx, hy, 8, 11, SKIN);
    px(hx, hy, 8, 3, HAIR);            // slicked-back hair
    px(hx, hy, 8, 1, HAIR2);
    px(hx - 1, hy + 1, 1, 2, HAIR2);   // temple
    px(hx + 8, hy + 1, 1, 2, HAIR2);
    px(hx + 6, hy + 3, 2, 6, SKIN2);   // face shading right
    // heavy angled brows (menace)
    px(hx + 1, hy + 4, 3, 1, HAIR2);
    px(hx + 5, hy + 4, 3, 1, HAIR2);
    px(hx + 3, hy + 5, 1, 1, HAIR2);
    px(hx + 5, hy + 5, 1, 1, HAIR2);
    // narrow slit eyes
    if (down) {
      px(hx + 1, hy + 5, 2, 1, DK);    // squeezed shut
      px(hx + 6, hy + 5, 2, 1, DK);
    } else {
      px(hx + 1, hy + 5, 1, 1, '#e8e4da');
      px(hx + 2, hy + 5, 1, 1, '#131019');
      px(hx + 6, hy + 5, 1, 1, '#e8e4da');
      px(hx + 7, hy + 5, 1, 1, '#131019');
    }
    // scar down right cheek
    px(hx + 7, hy + 2, 1, 4, '#8a4a52');
    // nose
    px(hx + 4, hy + 6, 1, 1, SKIN2);
    // mouth (clean-shaven)
    if (down) px(hx + 3, hy + 8, 3, 2, '#3d1216');
    else px(hx + 3, hy + 8, 3, 1, '#7a4530');
    // chin shading
    px(hx + 3, hy + 10, 3, 1, SKIN2);
    // neck
    px(hx + 2, hy + 11, 4, 2, SKIN2);
    // collar
    px(hx + 1, hy + 12, 6, 2, TOP2);
  }

  function makeHan(pose) {
    const c = canvas(HAN_W, HAN_H);
    drawHanInto(c.getContext('2d'), pose);
    return c;
  }

  function whiteVersion(src) {
    const c = canvas(src.width, src.height);
    const x = c.getContext('2d');
    x.drawImage(src, 0, 0);
    x.globalCompositeOperation = 'source-atop';
    x.fillStyle = '#ffffff';
    x.fillRect(0, 0, src.width, src.height);
    return c;
  }

  const han = {
    idle: makeHan('idle'),
    taunt: makeHan('taunt'),
    hurt: makeHan('hurt'),
    impaled: makeHan('impaled'),
  };
  han.hurtWhite = whiteVersion(han.hurt);
  han.idleWhite = whiteVersion(han.idle);

  // ============================================================
  // BRUCE — 52x92 reflection sprite (intro cinematic): shirtless,
  // trademark claw cuts across the chest, black kung-fu pants
  // ============================================================
  const BRUCE_W = HAN_W, BRUCE_H = HAN_H;

  function makeBruce() {
    const c = canvas(BRUCE_W, BRUCE_H);
    const x = c.getContext('2d');
    const SKIN = '#e0a86e', SKIN2 = '#b57a42', SKIN3 = '#8e5a2e',
      HAIR = '#15130f',
      PANTS = '#23252e', PANTS2 = '#15161c', PANTS3 = '#33363f',
      CUT = '#a32638', CUT2 = '#c93b4e', BELT = '#0c0c10';
    const S = 2;
    const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a * S, b * S, w * S, h * S); };
    const pxr = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };

    // ---- black kung-fu pants ----
    px(7, 27, 12, 15, PANTS);
    px(7, 27, 3, 15, PANTS2);
    px(16, 27, 3, 15, PANTS3);
    px(6, 40, 14, 2, PANTS2);          // hem
    px(12, 30, 1, 11, PANTS2);         // seam
    px(8, 42, 3, 2, SKIN2); px(14, 42, 3, 2, SKIN2); // bare feet
    px(6, 25, 14, 2, BELT);            // sash

    // ---- bare torso ----
    px(6, 15, 14, 11, SKIN);
    px(6, 15, 3, 11, SKIN2);
    px(5, 13, 16, 3, SKIN);            // shoulders
    px(5, 13, 3, 3, SKIN2);
    // pec + ab definition
    px(9, 18, 3, 1, SKIN3); px(14, 18, 3, 1, SKIN3);
    px(12, 20, 1, 5, SKIN3);
    px(9, 21, 2, 1, SKIN3); px(15, 21, 2, 1, SKIN3);
    px(9, 23, 2, 1, SKIN3); px(15, 23, 2, 1, SKIN3);
    // the trademark claw cuts — three thin diagonals across the chest
    for (let k = 0; k < 3; k++) {
      const cx0 = 17 + k * 4, cy0 = 31 + k;
      for (let s = 0; s < 7; s++) {
        pxr(cx0 + s, cy0 + s, 1, 2, k === 1 ? CUT2 : CUT);
      }
    }

    // ---- arms: fighting guard ----
    px(19, 14, 3, 4, SKIN2);           // right shoulder
    px(20, 10, 3, 5, SKIN);            // forearm raised
    px(19, 7, 4, 4, SKIN);             // fist up by the jaw
    px(19, 7, 4, 1, SKIN3);
    px(3, 16, 3, 5, SKIN2);            // left arm extended low
    px(2, 20, 4, 4, SKIN);
    px(2, 20, 4, 1, SKIN3);

    // ---- head ----
    const hx = 9, hy = 2;
    px(hx, hy, 8, 11, SKIN);
    px(hx, hy, 8, 3, HAIR);            // Bruce's mop
    px(hx - 1, hy + 1, 1, 3, HAIR);
    px(hx + 8, hy + 1, 1, 3, HAIR);
    px(hx, hy + 3, 1, 1, HAIR);        // fringe
    px(hx + 7, hy + 3, 1, 1, HAIR);
    px(hx + 6, hy + 3, 2, 6, SKIN2);   // face shading
    // intense brows
    px(hx + 1, hy + 4, 3, 1, HAIR);
    px(hx + 5, hy + 4, 3, 1, HAIR);
    // eyes
    px(hx + 1, hy + 5, 1, 1, '#e8e4da');
    px(hx + 2, hy + 5, 1, 1, '#131019');
    px(hx + 6, hy + 5, 1, 1, '#e8e4da');
    px(hx + 7, hy + 5, 1, 1, '#131019');
    // nose + set jaw
    px(hx + 4, hy + 6, 1, 1, SKIN2);
    px(hx + 3, hy + 8, 3, 1, '#6e3a26');
    px(hx + 3, hy + 10, 3, 1, SKIN2);
    px(hx + 2, hy + 11, 4, 2, SKIN2);  // neck
    return c;
  }
  const bruce = makeBruce();

  // ============================================================
  // SPEAR — horizontal wall-mount with yellow/red pennant, 90x18.
  // Two frames (pennant flutter).
  // ============================================================
  const SPEAR_W = 90, SPEAR_H = 18;

  function makeSpear(flap) {
    const c = canvas(SPEAR_W, SPEAR_H);
    const x = c.getContext('2d');
    const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    // shaft
    px(0, 6, 74, 3, '#6b4423');
    px(0, 6, 74, 1, '#8a5c33');
    px(0, 8, 74, 1, '#4a2e14');
    px(0, 5, 3, 5, '#3a2412');          // butt cap
    px(64, 5, 4, 5, '#8e1626');         // binding cord
    // leaf blade pointing right
    px(74, 6, 10, 3, '#c3ccd4');
    px(76, 5, 7, 5, '#c3ccd4');
    px(82, 6, 6, 3, '#f2f8fc');
    px(88, 7, 2, 1, '#ffffff');         // bright tip
    // pennant: yellow cloth, red tail, hanging + fluttering
    px(60, 9, 8, 4, '#e8c33a');
    px(58 + flap, 12, 7, 3, '#e8c33a');
    px(56 + flap * 2, 14, 6, 2, '#c22b3d');
    px(53 + flap * 2, 15 + flap, 5, 2, '#c22b3d');
    return c;
  }
  const spear = [makeSpear(0), makeSpear(1)];

  // ============================================================
  // BRUCE fist (first-person strike) — 40x34
  // ============================================================
  function makeFist(mirror) {
    const c = canvas(40, 34);
    const x = c.getContext('2d');
    const SKIN = '#e0a86e', SKIN2 = '#b57a42', SKIN3 = '#8e5a2e', WRAP = '#23252e';
    const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    // forearm — solid diagonal from fist to bottom-right corner
    for (let s = 0; s < 5; s++) {
      px(12 + s * 6, 11 + s * 5, 18, 13, SKIN);
      px(12 + s * 6, 11 + s * 5 + 10, 18, 3, SKIN2); // underside shade
    }
    // wrist wrap
    px(17, 16, 12, 4, WRAP);
    px(20, 20, 12, 4, '#33363f');
    // scratch marks (Enter the Dragon!)
    px(27, 24, 2, 8, '#a32638'); px(31, 26, 2, 8, '#a32638'); px(35, 29, 2, 5, '#8e1626');
    // fist
    px(2, 2, 17, 15, SKIN);
    px(0, 5, 3, 9, SKIN);            // thumb side
    px(2, 2, 17, 3, SKIN2);          // knuckle top shade
    // knuckle bumps
    px(3, 1, 3, 2, SKIN); px(7, 0, 3, 2, SKIN); px(11, 0, 3, 2, SKIN); px(15, 1, 3, 2, SKIN);
    px(3, 4, 3, 1, SKIN3); px(7, 3, 3, 1, SKIN3); px(11, 3, 3, 1, SKIN3); px(15, 4, 3, 1, SKIN3);
    // finger creases
    px(3, 9, 15, 1, SKIN2);
    px(3, 13, 15, 1, SKIN2);
    px(0, 13, 3, 2, SKIN2);          // thumb shade
    if (!mirror) return c;
    const m = canvas(40, 34);
    const mx = m.getContext('2d');
    mx.translate(40, 0); mx.scale(-1, 1);
    mx.drawImage(c, 0, 0);
    return m;
  }
  const fistR = makeFist(false);
  const fistL = makeFist(true);

  // ============================================================
  // Bruce title silhouette (flying kick) — 120x80
  // ============================================================
  function makeBruceSilhouette() {
    const c = canvas(120, 80);
    const x = c.getContext('2d');
    x.fillStyle = '#0a0508';
    x.strokeStyle = '#0a0508';
    x.lineCap = 'round';
    x.lineJoin = 'round';
    // torso (leaning back)
    x.lineWidth = 11;
    x.beginPath(); x.moveTo(38, 52); x.lineTo(30, 30); x.stroke();
    // head
    x.beginPath(); x.arc(28, 21, 7, 0, Math.PI * 2); x.fill();
    // kicking leg — extended
    x.lineWidth = 9;
    x.beginPath(); x.moveTo(38, 52); x.lineTo(78, 40); x.stroke();
    // foot
    x.fillRect(76, 33, 14, 10);
    // folded leg
    x.beginPath(); x.moveTo(38, 52); x.lineTo(46, 64); x.lineTo(34, 70); x.stroke();
    // guard arms
    x.lineWidth = 7;
    x.beginPath(); x.moveTo(31, 33); x.lineTo(50, 26); x.stroke();
    x.beginPath(); x.moveTo(31, 36); x.lineTo(14, 44); x.stroke();
    // fists
    x.beginPath(); x.arc(52, 25, 4.5, 0, Math.PI * 2); x.fill();
    x.beginPath(); x.arc(12, 45, 4.5, 0, Math.PI * 2); x.fill();
    return c;
  }
  const bruceSil = makeBruceSilhouette();

  // ============================================================
  // Portraits 14x14 (HUD)
  // ============================================================
  function makePortraitBruce() {
    const c = canvas(14, 14);
    const x = c.getContext('2d');
    const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    px(0, 0, 14, 14, '#241018');
    px(3, 2, 8, 10, '#e0a86e');           // face
    px(3, 1, 8, 3, '#15130f');            // hair
    px(2, 2, 1, 4, '#15130f');
    px(11, 2, 1, 4, '#15130f');
    px(4, 6, 2, 1, '#131019'); px(8, 6, 2, 1, '#131019'); // eyes
    px(5, 9, 4, 1, '#8e5a2e');            // mouth
    px(9, 4, 1, 5, '#a32638');            // claw scratch
    px(10, 4, 1, 5, '#a32638');
    return c;
  }
  function makePortraitHan() {
    const c = canvas(14, 14);
    const x = c.getContext('2d');
    const px = (a, b, w, h, col) => { x.fillStyle = col; x.fillRect(a, b, w, h); };
    px(0, 0, 14, 14, '#241018');
    px(3, 2, 8, 10, '#d19a62');
    px(3, 1, 8, 2, '#585d66');            // grey hair
    px(4, 6, 2, 1, '#131019'); px(8, 6, 2, 1, '#131019');
    px(3, 5, 3, 1, '#3e434b'); px(8, 5, 3, 1, '#3e434b'); // brows
    px(6, 10, 3, 2, '#3e434b');           // goatee
    px(10, 3, 1, 5, '#8a4a52');           // scar
    return c;
  }
  const portraitBruce = makePortraitBruce();
  const portraitHan = makePortraitHan();

  return {
    text, textW,
    han, HAN_W, HAN_H,
    bruce, BRUCE_W, BRUCE_H,
    spear, SPEAR_W, SPEAR_H,
    fistR, fistL,
    bruceSil,
    portraitBruce, portraitHan,
    canvas,
  };
})();
