// LOOK STILL · the soft-toon style for the Panchatantra films (from 2026-10-30). The monkey on
// his branch over the river in the late-afternoon light, holding a jamun, the jungle and the river
// behind him thrown out of focus. Proves the look once before the daily runs build on it.
import { Gfx, rng, type Ctx, type Env, type Medium, type P } from "./core";
import type { Film } from "./film";
import { darken, rgba, smooth } from "./folkTaleKit";
import { blob, clumps, contact, vol } from "./pt/toonKit";
import { drawToonMonkey } from "./pt/toonMonkey";

const W = 1920, H = 1080;
const M: Medium = { nib: 1, taper: 1, pressure: 1, retrace: false, wobble: 0, rough: 0 };

// the world behind: drawn sharp, then blurred as a lens would (depth of field), never disc bokeh
export const toonBackdrop = (c: Ctx, seed = 5) => {
  const r = rng(seed);
  let g = c.createLinearGradient(0, 0, 0, H); g.addColorStop(0, "#f6d8a6"); g.addColorStop(0.45, "#f1c58a"); g.addColorStop(0.62, "#9fb79a"); g.addColorStop(1, "#4f7d6e");
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  // far bank: a band of trees in cool greens, a warm glow where the sun sits low on the left
  g = c.createRadialGradient(380, 420, 20, 380, 420, 700); g.addColorStop(0, rgba("#fff1c8", 0.95)); g.addColorStop(1, rgba("#fff1c8", 0)); c.fillStyle = g; c.fillRect(0, 0, W, H);
  for (let i = 0; i < 26; i++) { const x = -80 + i * 82 + r() * 40, y = 560 + r() * 30, rx = 70 + r() * 70, ry = 90 + r() * 90; c.fillStyle = ["#5f8a5a", "#4c7650", "#6e9660", "#557f52"][i % 4]; c.globalAlpha = 0.95; c.beginPath(); c.ellipse(x, y - ry * 0.6, rx, ry, 0, 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1; c.fillStyle = "#6f9a86"; c.fillRect(0, 600, W, 500);
  // sun on the water: long bright streaks
  for (let i = 0; i < 40; i++) { const y = 620 + r() * 380, x = 200 + r() * 700; c.globalAlpha = 0.25 + r() * 0.35; c.fillStyle = "#fff4d6"; c.fillRect(x, y, 60 + r() * 220, 3 + r() * 4); }
  // near hanging leaves at the edges, out of focus
  for (let i = 0; i < 30; i++) { const side = i % 2 ? 1 : -1, x = side > 0 ? W - r() * 340 : r() * 340, y = r() * 520; c.globalAlpha = 0.9; c.fillStyle = ["#3f6e3a", "#56853f", "#2f5a30"][i % 3]; c.save(); c.translate(x, y); c.rotate(r() * 3); c.beginPath(); c.ellipse(0, 0, 70, 26, 0, 0, Math.PI * 2); c.fill(); c.restore(); }
  c.globalAlpha = 1;
};

// the branch he sits on: in focus, a rounded volume with bark
export const toonBranch = (c: Ctx, y: number) => {
  const pts: P[] = [[-40, y - 40], [500, y - 52], [1000, y - 44], [1500, y - 30], [1960, y - 20], [1960, y + 60], [1500, y + 52], [1000, y + 50], [500, y + 44], [-40, y + 40]];
  vol(c, smooth(pts, 8, true), "#7a5a3e", { light: 0.6, shadow: 0.8, ao: 0.4, rim: 0.4 });
  const r = rng(9); c.lineCap = "round";
  for (let i = 0; i < 70; i++) { const x = r() * W, yy = y - 30 + r() * 70, l = 40 + r() * 120; c.globalAlpha = 0.25 + r() * 0.25; c.strokeStyle = r() < 0.6 ? darken("#7a5a3e", 0.45) : "#a8865e"; c.lineWidth = 2 + r() * 3; c.beginPath(); c.moveTo(x, yy); c.quadraticCurveTo(x + l / 2, yy + (r() - 0.5) * 8, x + l, yy + (r() - 0.5) * 6); c.stroke(); }
  c.globalAlpha = 1;
  // leaves sprouting from the branch, sharp
  for (const [x, a] of [[260, -2.2], [330, -1.4], [1500, -1.0], [1580, -2.0], [1660, -1.5]] as P[]) vol(c, blob([[x, y - 40], [x + Math.cos(a - 0.4) * 60, y - 40 + Math.sin(a - 0.4) * 60], [x + Math.cos(a) * 130, y - 40 + Math.sin(a) * 130], [x + Math.cos(a + 0.4) * 60, y - 40 + Math.sin(a + 0.4) * 60]]), "#4f8a3c", { light: 0.7, rim: 0.3, spec: 0.25 });
};

// a jamun in the hand: glossy, near-black purple with a pale bloom
export const toonJamun = (c: Ctx, x: number, y: number, s: number) => vol(c, blob([[x - 20 * s, y - 2], [x - 12 * s, y - 26 * s], [x + 12 * s, y - 26 * s], [x + 20 * s, y - 2], [x + 12 * s, y + 22 * s], [x - 12 * s, y + 22 * s]]), "#4a1840", { light: 0.8, rim: 0.5, spec: 0.85, sss: "#8a2a6a" });

const draw = (ctx: Ctx, _f: number, env: Env) => {
  const g = new Gfx(ctx, env, 0, M);
  g.group("plain", () => toonBackdrop(g.cur), { blur: 14 });
  const c = g.cur; c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  toonBranch(c, 960);
  const s = 1.15, mx = 960, my = 930;
  const { hands } = drawToonMonkey(c, { x: mx, y: my, s, look: [-0.35, 0.1], smile: 0.75, open: 0.18, brow: 0.5, tail: 0.6, breathe: 0.5 });
  toonJamun(c, hands[0], hands[1] - 22 * s, s * 1.3);
  contact(c, mx, my + 10, 260, 30, 0.25);
  c.restore();
  void clumps;
};

export const toonLook: Film = {
  meta: { title: "Panchatantra · soft-toon look", W, H, fps: 24, bpm: 90, durationFrames: 1, raster: "cpu" },
  assets: { images: {} },
  shots: [{ id: "look", start: 0, end: 1, draw }],
};
