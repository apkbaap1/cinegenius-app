// THE RIVER WORLD · scenery for the monkey and the crocodile, in the folk-tale storybook hand.
//
// DEPTH IS THE MEDIUM, as on the plate: the far bank (village temple, huts, palms) is bare pencil
// on the cream sheet; the jamun tree in the middle distance is a thin wash that dissolves into its
// own drawing; the near water and the lotus at the viewer's feet are opaque gouache.
// REFERENCE (from knowledge): a South Indian riverside village: a stone temple with a stepped
// vimana / gopuram tower and kalasha finial, thatched huts with low eaves, coconut palms (Cocos
// nucifera: a leaning ringed trunk, a crown of long pinnate fronds); the jamun tree (Syzygium
// cumini, "neredu"): a big evergreen with a dense rounded crown, glossy elliptic leaves, rough
// grey-brown bark, and clusters of ovoid fruit ripening green -> magenta -> near black-purple;
// the sacred lotus (Nelumbo nucifera): round peltate pads with veins radiating from the centre,
// wavy margins, held flat on the water or raised on stalks; pink flowers of broad cupped petals.
import { rng, type Ctx, type P } from "../core";
import { clamp, mix } from "../gallery";
import { darken, far, glowBand, gouache, grass, leaf, lighten, pencil, rgba, sketch, smooth, stroke, trace, type Leaf, type Line } from "../folkTaleKit";

export const HORIZON = 330;
export const WATER_FAR = "#9fb7a6", WATER_MID = "#6f9488", WATER_NEAR = "#3f6a62", WATER_DEEP = "#2a4e4a";

// ---------------------------------------------------------------- far bank: pencil only
const box4 = (x0: number, y0: number, x1: number, y1: number, seed: number, a = 0.5): Line[] => [
  { pts: [[x0, y1], [x0, y0]], seed, a }, { pts: [[x1, y0], [x1, y1]], seed: seed + 1, a }, { pts: [[x0 - 2, y0], [x1 + 2, y0]], seed: seed + 2, a },
];
// a stepped temple tower: tiers narrowing upward, a dome cap and the kalasha finial
const temple = (cx: number, base: number, w: number, h: number, seed: number, a = 0.55): Line[] => {
  const L: Line[] = [], tiers = 5; let y = base, ww = w;
  L.push(...box4(cx - w * 0.9, base - h * 0.28, cx + w * 0.9, base, seed, a)); // the mandapa hall in front
  for (let i = 0; i < 3; i++) L.push({ pts: [[cx - w * 0.7 + i * w * 0.7, base], [cx - w * 0.7 + i * w * 0.7, base - h * 0.22]], seed: seed + 3 + i, a: a * 0.5, w: 0.7, retrace: false });
  y = base - h * 0.28;
  for (let i = 0; i < tiers; i++) { const th = (h * 0.55) / tiers, nw = ww * 0.82; L.push({ pts: [[cx - ww / 2, y], [cx - nw / 2, y - th], [cx + nw / 2, y - th], [cx + ww / 2, y]], seed: seed + 10 + i, a }); L.push({ pts: [[cx - nw * 0.3, y - th * 0.3], [cx + nw * 0.3, y - th * 0.3]], seed: seed + 20 + i, a: a * 0.4, w: 0.6, retrace: false }); y -= th; ww = nw; }
  L.push({ pts: [[cx - ww / 2, y], [cx - ww * 0.55, y - h * 0.06], [cx - ww * 0.3, y - h * 0.12], [cx, y - h * 0.14], [cx + ww * 0.3, y - h * 0.12], [cx + ww * 0.55, y - h * 0.06], [cx + ww / 2, y]], seed: seed + 30, a });
  L.push({ pts: [[cx, y - h * 0.14], [cx, y - h * 0.22]], seed: seed + 31, a, retrace: false });
  L.push({ pts: [[cx - 3, y - h * 0.18], [cx, y - h * 0.2], [cx + 3, y - h * 0.18]], seed: seed + 32, a, retrace: false });
  return L;
};
const hut = (x: number, y: number, w: number, h: number, seed: number, a = 0.45): Line[] => [
  { pts: [[x, y], [x, y - h * 0.55]], seed, a }, { pts: [[x + w, y], [x + w, y - h * 0.55]], seed: seed + 1, a },
  { pts: [[x - w * 0.18, y - h * 0.45], [x + w * 0.2, y - h * 0.95], [x + w * 0.8, y - h * 1.0], [x + w * 1.18, y - h * 0.45]], seed: seed + 2, a },
  { pts: [[x + w * 0.4, y], [x + w * 0.4, y - h * 0.35], [x + w * 0.6, y - h * 0.35], [x + w * 0.6, y]], seed: seed + 3, a: a * 0.7, retrace: false },
  { pts: [[x, y - h * 0.62], [x + w * 0.3, y - h * 0.66]], seed: seed + 4, a: a * 0.35, w: 0.6, retrace: false },
];
const palm = (x: number, base: number, h: number, lean: number, seed: number, a = 0.5): Line[] => {
  const r = rng(seed), top: P = [x + lean * h, base - h], mid: P = [x + lean * h * 0.35, base - h * 0.5], L: Line[] = [];
  L.push({ pts: [[x - 2.5, base], [mid[0] - 2, mid[1]], [top[0] - 1.5, top[1]]], seed, a }, { pts: [[x + 2.5, base], [mid[0] + 2, mid[1]], [top[0] + 1.5, top[1]]], seed: seed + 1, a: a * 0.8 });
  for (let i = 0; i < 9; i++) { const ang = -Math.PI / 2 + (i / 8 - 0.5) * 3.6 + (r() - 0.5) * 0.2, l = h * (0.28 + r() * 0.12), ex = top[0] + Math.cos(ang) * l, ey = top[1] + Math.sin(ang) * l * 0.6 + l * 0.35 * Math.abs(Math.cos(ang)); const mx = top[0] + Math.cos(ang) * l * 0.5, my = top[1] + Math.sin(ang) * l * 0.5 - l * 0.12; L.push({ pts: [top, [mx, my], [ex, ey]], seed: seed + 5 + i, a: a * 0.9, w: 0.8, retrace: false }); for (let k = 1; k < 5; k++) { const t = k / 5, px = top[0] + (ex - top[0]) * t, py = top[1] + (ey - top[1]) * t - Math.sin(Math.PI * t) * l * 0.12; L.push({ pts: [[px, py], [px + Math.cos(ang + 1.2) * 6, py + 7]], seed: seed + 40 + i * 5 + k, a: a * 0.5, w: 0.5, retrace: false }); } }
  for (let k = 0; k < 5; k++) { const yy = base - h * (0.15 + k * 0.15), xx = x + lean * h * (0.15 + k * 0.15) * 0.7; L.push({ pts: [[xx - 2.5, yy], [xx + 2.5, yy - 1]], seed: seed + 90 + k, a: a * 0.4, w: 0.6, retrace: false }); }
  return L;
};
const lineTree = (cx: number, base: number, rx: number, ry: number, seed: number, a = 0.45): Line[] => {
  const r = rng(seed), pts: P[] = [], n = 13 + Math.floor(r() * 5), cy = base - ry * 1.25;
  for (let i = 0; i <= n; i++) { const th = Math.PI * 0.62 + (i / n) * Math.PI * 1.76, bump = 0.86 + 0.14 * Math.abs(Math.sin(i * 1.7 + r())); pts.push([cx + Math.cos(th) * rx * bump, cy + Math.sin(th) * ry * bump]); }
  return [{ pts, seed, a, w: 0.85 }, { pts: [[cx - rx * 0.08, base], [cx - rx * 0.06, cy + ry * 0.75]], seed: seed + 2, a, w: 0.8 }, { pts: [[cx + rx * 0.08, base], [cx + rx * 0.05, cy + ry * 0.75]], seed: seed + 3, a, w: 0.8 }];
};
export const FAR_BANK: Line[] = (() => {
  const L: Line[] = [];
  L.push({ pts: [[0, HORIZON + 4], [200, HORIZON], [420, HORIZON + 5], [640, HORIZON - 2], [880, HORIZON + 3], [1100, HORIZON], [1340, HORIZON + 4], [1600, HORIZON - 1], [1920, HORIZON + 3]], seed: 11, a: 0.5, w: 1 });
  L.push({ pts: [[60, HORIZON + 12], [300, HORIZON + 16], [520, HORIZON + 11]], seed: 12, a: 0.25, w: 0.7, retrace: false });
  L.push(...temple(420, HORIZON, 70, 150, 20));
  L.push(...hut(240, HORIZON, 46, 34, 60), ...hut(300, HORIZON + 2, 38, 28, 70, 0.38), ...hut(560, HORIZON, 44, 32, 80), ...hut(640, HORIZON + 1, 34, 26, 90, 0.35), ...hut(980, HORIZON, 40, 30, 100, 0.35));
  L.push(...palm(150, HORIZON + 2, 120, 0.12, 200), ...palm(190, HORIZON + 2, 96, -0.1, 230, 0.4), ...palm(520, HORIZON, 130, 0.08, 260), ...palm(700, HORIZON + 2, 110, -0.14, 290, 0.45), ...palm(880, HORIZON, 100, 0.1, 320, 0.4), ...palm(1060, HORIZON, 88, -0.06, 350, 0.35));
  L.push(...lineTree(340, HORIZON + 2, 30, 22, 400), ...lineTree(780, HORIZON + 2, 34, 24, 410, 0.4), ...lineTree(1180, HORIZON + 2, 28, 20, 420, 0.35));
  // birds over the far bank: three pencil ticks
  for (const [x, y, sc, sd] of [[760, 250, 1.3, 500], [820, 222, 1, 502], [700, 276, 0.9, 504]]) L.push({ pts: [[x - 10 * sc, y - 3 * sc], [x - 4 * sc, y], [x, y + 1 * sc], [x + 4 * sc, y], [x + 10 * sc, y - 4 * sc]], seed: sd, a: 0.65, w: 1.1, retrace: false });
  return L.map((l) => ({ ...l, a: Math.min(0.85, (l.a ?? 0.5) * 1.4) }));
})();

export const sky = (c: Ctx, W: number) => {
  const gr = c.createRadialGradient(560, HORIZON - 40, 30, 560, HORIZON - 40, 900);
  gr.addColorStop(0, rgba("#f8e0a0", 0.5)); gr.addColorStop(0.45, rgba("#f6ebc4", 0.2)); gr.addColorStop(1, rgba("#f3e3a8", 0));
  c.fillStyle = gr; c.fillRect(0, 0, W, HORIZON + 40);
};

// ---------------------------------------------------------------- the river
// A wash laid in horizontal strokes, pale and thin at the far bank, deep and opaque at our feet.
// The surface catches the sky in long broken light strokes; shadow under anything that floats.
export const river = (c: Ctx, W: number, H: number, t = 0, seed = 1, scroll = 0) => {
  const wrap = (x: number, k: number) => { const span = W + 240, v = (((x - scroll * k) % span) + span) % span; return v - 120; };
  const r = rng(seed), y0 = HORIZON + 6;
  const gr = c.createLinearGradient(0, y0, 0, H); gr.addColorStop(0, WATER_FAR); gr.addColorStop(0.25, mix(WATER_FAR, WATER_MID, 0.6)); gr.addColorStop(0.6, WATER_MID); gr.addColorStop(1, WATER_NEAR);
  // the wash with a ragged far edge where the paint stops short of the bank's pencil line
  const edge: P[] = []; for (let x = -10; x <= W + 34; x += 24) edge.push([x, y0 + 3 + r() * 5]);
    c.globalAlpha = 1; c.fillStyle = gr; trace(c, [...edge, [W + 40, H + 10], [-10, H + 10]]); c.fill();
  // the far bank's reflection: a band of soft warm tone under the horizon
  glowBand(c, [0, y0, W, y0 + 60], "#d9d0a8", [[0, 0.5], [1, 0]]);
  // horizontal brush drags: depth decides their length, width and how much they show
  c.lineCap = "round";
  for (let i = 0; i < 900; i++) {
    const v = r(), y = y0 + 8 + Math.pow(v, 1.4) * (H - y0), d = 1 - (y - y0) / (H - y0), x = wrap(r() * (W + 240), 1 - d * 0.75) + Math.sin(t * 0.03 + y * 0.05) * 6 * (1 - d);
    const l = (20 + r() * 90) * (1.4 - d), w = (1 + r() * 3.4) * (1.3 - d), dark = r() < 0.55;
    c.globalAlpha = (0.08 + r() * 0.18) * (1 - d * 0.6); c.strokeStyle = dark ? darken(WATER_NEAR, 0.25 + r() * 0.2) : lighten(WATER_MID, 0.25 + r() * 0.3);
    c.lineWidth = w; c.beginPath(); c.moveTo(x, y); c.quadraticCurveTo(x + l / 2, y + (r() - 0.5) * 2, x + l, y); c.stroke();
  }
  // sky glints: short bright strokes, denser toward the low sun on the left
  for (let i = 0; i < 160; i++) {
    const y = y0 + 10 + r() * (H - y0 - 20), d = 1 - (y - y0) / (H - y0), x = wrap(r() * (W + 240) * (0.4 + 0.6 * r()), 1 - d * 0.75) + Math.sin(t * 0.05 + i) * 4;
    c.globalAlpha = (0.2 + r() * 0.35) * (0.4 + 0.6 * d); c.strokeStyle = "#f6efcf"; c.lineWidth = 1 + r() * 1.6 * (1.2 - d);
    const l = (6 + r() * 30) * (1.3 - d); c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y + (r() - 0.5)); c.stroke();
  }
  c.globalAlpha = 1;
};

// ripples hugging a floating body: broken light lines along the waterline, a dark seam right at it
export const waterline = (c: Ctx, pts: P[], seed: number, a = 1) => {
  const r = rng(seed); c.lineCap = "round";
  c.globalAlpha = 0.5 * a; c.strokeStyle = WATER_DEEP; c.lineWidth = 4; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y + 2) : c.moveTo(x, y + 2))); c.stroke();
  for (let k = 0; k < 3; k++) for (let i = 0; i < pts.length - 1; i++) {
    if (r() < 0.35) continue; const [x0, y0] = pts[i], [x1] = pts[i + 1], yy = y0 + 6 + k * 7 + r() * 3;
    c.globalAlpha = (0.55 - k * 0.15) * a; c.strokeStyle = k === 0 ? "#eef0d8" : lighten(WATER_MID, 0.45); c.lineWidth = 2.2 - k * 0.5;
    c.beginPath(); c.moveTo(x0 + (r() - 0.5) * 6, yy); c.quadraticCurveTo((x0 + x1) / 2, yy - 2, x1 + (r() - 0.5) * 6, yy); c.stroke();
  }
  c.globalAlpha = 1;
};
// the V of a wake spreading behind a moving head
export const wake = (c: Ctx, tip: P, dir: number, len: number, spread: number, seed: number, t = 0) => {
  const r = rng(seed); c.lineCap = "round";
  for (const side of [-1, 1]) for (let k = 0; k < 6; k++) {
    const u = (k + ((t * 0.04) % 1)) / 6, d0 = u * len, x0 = tip[0] + Math.cos(dir) * d0, y0 = tip[1] + Math.sin(dir) * d0 * 0.3 + side * u * spread, w = 18 + u * 60;
    c.globalAlpha = 0.5 * (1 - u); c.strokeStyle = "#eef0d8"; c.lineWidth = 2.4 - u * 1.4;
    c.beginPath(); c.moveTo(x0 - w / 2, y0 + (r() - 0.5) * 2); c.quadraticCurveTo(x0, y0 - side * 3, x0 + w / 2, y0 + side * 4); c.stroke();
  }
  c.globalAlpha = 1;
};

// ---------------------------------------------------------------- the jamun tree
export type Jamun = { x: number; base: number; s: number; d: number; seed: number };
// trunk and main limbs as painted ribbons; the crown as many glossy elliptic leaves in clusters
export const jamunGeom = (J: Jamun) => {
  const r = rng(J.seed), { x, base, s } = J;
  const trunk: P[] = [[x - 30 * s, base], [x - 18 * s, base - 120 * s], [x - 10 * s, base - 230 * s], [x + 4 * s, base - 300 * s]];
  const limbs: P[][] = [
    [[x - 12 * s, base - 200 * s], [x - 90 * s, base - 270 * s], [x - 170 * s, base - 300 * s]],
    [[x - 6 * s, base - 250 * s], [x + 60 * s, base - 320 * s], [x + 150 * s, base - 340 * s]],
    [[x, base - 290 * s], [x - 30 * s, base - 380 * s], [x - 60 * s, base - 430 * s]],
    [[x + 2 * s, base - 300 * s], [x + 50 * s, base - 400 * s], [x + 70 * s, base - 440 * s]],
  ];
  const clusters: P[] = [[-170, -320], [-120, -380], [-60, -440], [0, -470], [70, -450], [130, -400], [170, -340], [-200, -260], [200, -280], [-30, -380], [60, -360], [-110, -300], [110, -300]].map(([dx, dy]) => [x + dx * s, base + dy * s]);
  const leaves: Leaf[] = [];
  clusters.forEach(([cx, cy], k) => { for (let i = 0; i < 16; i++) { const a = r() * Math.PI * 2, rr = r() * 62 * s; leaves.push({ x: cx + Math.cos(a) * rr, y: cy + Math.sin(a) * rr * 0.75, a: -Math.PI / 2 + (r() - 0.5) * 3.2, len: (30 + r() * 12) * s, wid: (13 + r() * 5) * s, col: ["#2f5a2a", "#3a6a30", "#28502a", "#456f34"][Math.floor(r() * 4)], seed: J.seed * 10 + k * 100 + i, bend: (r() - 0.5) * 0.3, round: 0.7, d: J.d, vein: "#7a9a5a" }); } });
  const fruit: P[] = []; clusters.forEach(([cx, cy]) => { for (let i = 0; i < 5; i++) fruit.push([cx + (r() - 0.5) * 70 * s, cy + 10 * s + r() * 40 * s]); });
  return { trunk, limbs, leaves, clusters, fruit };
};
export const drawJamun = (c: Ctx, J: Jamun, p = 1, wind?: number) => {
  const G = jamunGeom(J), d = J.d, BARK = "#6e5a46";
  // the drawing first: it stays visible where the wash thins
  sketch(c, [{ pts: G.trunk, seed: J.seed, a: 0.6 }, ...G.limbs.map((l, i) => ({ pts: l, seed: J.seed + 1 + i, a: 0.5 }) as Line)], p);
  if (p < 1) return;
  stroke(c, G.trunk, 46 * J.s, 26 * J.s, far(BARK, d), 0.9);
  G.limbs.forEach((l, i) => stroke(c, l, (18 - i * 2) * J.s, 5 * J.s, far(darken(BARK, 0.1), d), 0.85));
  // bark: vertical fissures on the trunk
  const r = rng(J.seed + 5); for (let i = 0; i < 26; i++) { const t = r(), y = J.base - t * 280 * J.s, x = J.x - 22 * J.s + t * 22 * J.s + (r() - 0.5) * 28 * J.s; stroke(c, [[x, y], [x + (r() - 0.5) * 3, y - 18 * J.s]], 2.2, 0.8, far(darken(BARK, 0.4), d), 0.6); }
  // the crown's mass: a soft dark wash under the leaves so the crown reads as one shape
  for (const [cx, cy] of G.clusters) { const gr = c.createRadialGradient(cx, cy, 0, cx, cy, 80 * J.s); gr.addColorStop(0, rgba(far("#2a4a26", d), 0.55)); gr.addColorStop(1, rgba(far("#2a4a26", d), 0)); c.fillStyle = gr; c.fillRect(cx - 90 * J.s, cy - 90 * J.s, 180 * J.s, 180 * J.s); }
  const gust = (i: number, x: number, y: number) => (wind === undefined ? 0 : Math.sin(wind * 0.11 + i * 0.73 + x * 0.004) * (0.6 + 0.4 * Math.sin(wind * 0.023 + y * 0.01)));
  G.leaves.forEach((L, i) => { const g = gust(i, L.x, L.y); leaf(c, g ? { ...L, a: L.a + g * 0.12, x: L.x + g * 3 * J.s, y: L.y + g * 1.2 * J.s } : L, 1); });
  // fruit: small ovoid berries, ripening toward near-black purple, each with a pale bloom
  const rr = rng(J.seed + 9);
  G.fruit.forEach(([x0, y], i) => { const x = x0 + gust(i * 3, x0, y) * 2.5 * J.s; const col = ["#3a1530", "#5a1f48", "#2a0f24", "#7a2a5a"][i % 4]; c.globalAlpha = 1 - 0.4 * d; c.fillStyle = far(col, d); c.beginPath(); c.ellipse(x, y, 4.2 * J.s, 5.4 * J.s, (rr() - 0.5) * 0.6, 0, Math.PI * 2); c.fill(); c.globalAlpha = 0.5 * (1 - d * 0.5); c.fillStyle = "#c9a9c9"; c.beginPath(); c.arc(x - 1.4 * J.s, y - 1.8 * J.s, 1.2 * J.s, 0, Math.PI * 2); c.fill(); });
  c.globalAlpha = 1;
};

// ---------------------------------------------------------------- lotus
// a pad: round, peltate (the stalk under the centre), wavy margin, veins radiating from the centre,
// seen at an angle so it foreshortens; blue-green, lighter at the cupped rim
export const lotusPad = (c: Ctx, x: number, y: number, R: number, sq: number, rot: number, seed: number, d = 0) => {
  const r = rng(seed), n = 48, pts: P[] = [], col = "#4f7d4a", a = 1 - 0.45 * d;
  for (let i = 0; i < n; i++) { const th = (i / n) * Math.PI * 2, rr = R * (1 + 0.04 * Math.sin(th * 7 + seed) + 0.03 * Math.sin(th * 13 + seed * 2)); pts.push([x + Math.cos(th + rot) * rr, y + Math.sin(th + rot) * rr * sq]); }
  c.globalAlpha = 0.3 * a; c.fillStyle = "#1f3a36"; c.beginPath(); c.ellipse(x + R * 0.08, y + R * sq * 0.25, R * 1.04, R * sq * 1.0, 0, 0, Math.PI * 2); c.fill();
  gouache(c, pts, far(col, d), { seed, a, tex: { cols: [far(lighten(col, 0.25), d), far(darken(col, 0.25), d)], n: Math.round(R * 1.2), len: R * 0.25, w: R * 0.04, ang: 0, jit: 3.2, a: 0.35 }, rim: far(lighten(col, 0.35), d), rimA: 0.7, rimW: R * 0.025 });
  // the shadow half and the raised lit rim on the sun side
  c.save(); trace(c, pts); c.clip(); c.globalAlpha = 0.3 * a; c.fillStyle = far(darken(col, 0.35), d); c.beginPath(); c.ellipse(x + R * 0.3, y + R * sq * 0.2, R * 0.9, R * sq * 0.8, 0, 0, Math.PI * 2); c.fill(); c.restore();
  for (let i = 0; i < 18; i++) { const th = (i / 18) * Math.PI * 2 + r() * 0.1; stroke(c, [[x, y], [x + Math.cos(th + rot) * R * 0.5, y + Math.sin(th + rot) * R * sq * 0.5], [x + Math.cos(th + rot + 0.05) * R * 0.92, y + Math.sin(th + rot + 0.05) * R * sq * 0.92]], R * 0.022, R * 0.006, far(lighten(col, 0.4), d), 0.55 * a, 1, 3); }
  c.globalAlpha = 0.8 * a; c.fillStyle = far(lighten(col, 0.45), d); c.beginPath(); c.ellipse(x, y, R * 0.06, R * 0.06 * sq, 0, 0, Math.PI * 2); c.fill(); c.globalAlpha = 1;
};
// a lotus flower: two rings of broad cupped petals, pink at the tips paling to cream at the base
export const lotusFlower = (c: Ctx, x: number, y: number, s: number, seed: number, open = 1) => {
  const r = rng(seed), PINK = "#e58aa6", PALE = "#f8e2e4";
  stroke(c, [[x + 4, y + 70 * s], [x + 2, y + 30 * s], [x, y]], 4 * s, 3 * s, "#4a6a34", 1);
  const pet = (ang: number, l: number, w: number, k: number, back: boolean) => {
    const ux = Math.sin(ang), uy = -Math.cos(ang), vx = -uy, vy = ux, at = (u: number, v: number): P => [x + ux * u + vx * v, y + uy * u * 0.9 + vy * v];
    const pts = smooth([at(0, -w * 0.3), at(l * 0.4, -w * 0.55), at(l * 0.8, -w * 0.35), at(l, 0), at(l * 0.8, w * 0.35), at(l * 0.4, w * 0.55), at(0, w * 0.3)], 5, true);
    const gr = c.createLinearGradient(x, y, ...at(l, 0)); gr.addColorStop(0, back ? darken(PALE, 0.08) : PALE); gr.addColorStop(0.55, mix(PALE, PINK, 0.4)); gr.addColorStop(1, back ? darken(PINK, 0.12) : PINK);
    c.globalAlpha = 1; c.fillStyle = gr; trace(c, pts); c.fill();
    c.globalAlpha = 0.5; c.strokeStyle = darken(PINK, 0.3); c.lineWidth = 1.1 * s; trace(c, pts); c.stroke();
    for (let q = -1; q <= 1; q++) stroke(c, [at(l * 0.1, q * w * 0.12), at(l * 0.55, q * w * 0.22), at(l * 0.92, q * w * 0.08)], 1 * s, 0.4 * s, darken(PINK, 0.2), 0.35, 1, 3);
    void k;
  };
  const sp = 0.55 + 0.45 * clamp(open);
  for (let i = 0; i < 5; i++) pet((i - 2) * 0.55 * sp + (r() - 0.5) * 0.08, 46 * s, 28 * s, i, true);
  c.globalAlpha = 1; c.fillStyle = "#e7c24a"; c.beginPath(); c.ellipse(x, y - 14 * s, 11 * s, 5 * s, 0, 0, Math.PI * 2); c.fill();
  for (let i = 0; i < 4; i++) pet((i - 1.5) * 0.42 * sp + (r() - 0.5) * 0.08, 40 * s, 26 * s, i + 5, false);
  c.globalAlpha = 1;
};

// reeds and river grass at a bank, by the kit's clumped blade
export const reeds = (c: Ctx, x0: number, x1: number, base: number, h: [number, number], seed: number, d = 0) =>
  grass(c, { x0, x1, base: () => base, n: Math.round((x1 - x0) * 0.6), h, w: 5, cols: ["#4a6a2a", "#5d7d34", "#3a5a22", "#6e8a3c"], lean: 0.12, seed, d, tip: "#b5c27a", spread: 18, clump: 5, dry: "#a89a5a" });
void pencil;
