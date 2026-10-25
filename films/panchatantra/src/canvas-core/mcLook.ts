// LOOK STILL · the hardest frame of "Kothi, Mosali": mid-river, the turn. The crocodile has just
// confessed what he is carrying the monkey home for; the monkey, on his back, is about to think
// of the answer. Both characters large, in their world, in the final medium and the final light.
import { Gfx, type Ctx, type Env, type Medium } from "./core";
import type { Film } from "./film";
import { faded, ramp, sheet, sketch, type Box } from "./folkTaleKit";
import { backY, drawCroc } from "./pt/croc";
import { drawMonkey } from "./pt/monkey";
import { FAR_BANK, HORIZON, drawJamun, lotusFlower, lotusPad, reeds, river, sky, wake, waterline } from "./pt/river";

const W = 1920, H = 1080;
const M: Medium = { nib: 1, taper: 1, pressure: 1, retrace: false, wobble: 0, rough: 0 };
export const LOOK = {
  croc: { x: 700, y: 850, s: 1.7, jaw: 0.22, rise: 1, wave: 0.8, eye: 0.62, look: 1, turn: 0.12 },
  monkey: { x: 700 + 120 * 1.7, y: 850 + backY(120, { x: 0, y: 0, s: 1, rise: 1, wave: 0.8 }) * 1.7 + 4, s: 1.85, head: 0.12, look: [-0.7, 0.6] as [number, number], mouth: 0.35, brow: 1, arm: 0, farArm: 0.05, tail: 0.6, lean: 0.06 },
};

const draw = (ctx: Ctx, _f: number, env: Env) => {
  const g = new Gfx(ctx, env, 0, M), c = g.cur;
  sheet(g, [[560, HORIZON - 40, 900, "#fbf3d6"]]);
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  sky(c, W);
  river(c, W, H, 0, 3);
  sketch(c, FAR_BANK, 1);
  // the jamun tree they left, middle distance: a thin wash that dissolves into its own drawing at the crown
  const J = { x: 1660, base: HORIZON + 10, s: 0.62, d: 0.5, seed: 77 }, jb: Box = [1380, 0, 1920, HORIZON + 14];
  drawJamun(c, J, 0.999);
  faded(g, jb, (m) => ramp(m, jb, [0, HORIZON + 10], [0, HORIZON - 300], [[0, 0.95], [0.55, 0.75], [1, 0.25]]), (k) => drawJamun(k, J, 1));
  c.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  reeds(c, 1320, 1820, HORIZON + 14, [14, 34], 900, 0.6);
  // middle-distance pads, thin
  lotusPad(c, 1240, 560, 36, 0.28, 0, 51, 0.5); lotusPad(c, 1316, 578, 26, 0.28, 1, 52, 0.5); lotusPad(c, 300, 520, 30, 0.28, 2, 53, 0.55); lotusPad(c, 1600, 470, 22, 0.28, 2, 54, 0.6);
  // the crocodile: what shows under the surface first, then the wake, then what rides above it
  drawCroc(c, LOOK.croc, "under");
  wake(c, [262, 852], 0, 700, 90, 61, 0);
  drawCroc(c, LOOK.croc, "over");
  const wl: [number, number][] = []; for (let x = 262; x <= 1960; x += 40) wl.push([x, 850]);
  waterline(c, wl, 62);
  drawMonkey(c, LOOK.monkey);
  // foreground: lotus pads and a flower at our feet, opaque; reeds at the right edge
  lotusPad(c, 150, 1000, 150, 0.33, 0.3, 71); lotusPad(c, 420, 1066, 100, 0.33, 1.2, 72); lotusPad(c, 1640, 1020, 130, 0.33, 2.1, 73); lotusPad(c, 1420, 1080, 80, 0.33, 0.7, 74);
  lotusFlower(c, 300, 930, 1.05, 75);
  reeds(c, 1800, 1940, 1090, [140, 300], 901, 0);
  reeds(c, -20, 60, 1090, [100, 220], 902, 0);
  c.restore();
  g.paper("paper", 0.14); g.paper("coldpress", 0.07);
};

export const mcLook: Film = {
  meta: { title: "Kothi, Mosali · look still", W, H, fps: 30, bpm: 90, durationFrames: 1, raster: "cpu" },
  assets: { images: {} },
  shots: [{ id: "look", start: 0, end: 1, draw }],
};
