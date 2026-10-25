// KOTHI, MOSALI · "The Monkey and the Crocodile", from the Panchatantra. Folk-tale storybook hand.
//
// The story in three sentences: a monkey in a jamun tree throws sweet fruit to a crocodile every day
// and they become friends; the crocodile carries him across the river and, mid-river, confesses he
// wants the monkey's heart; the monkey says his heart is up in the tree, is carried back, leaps to
// safety, and the friendship is over. Transformation: trust -> wit. The token: a jamun fruit, thrown
// in friendship at the start, and at the end dropped onto the empty river where it floats alone.
//
// GRID: 30 fps, 90 bpm, a beat is 20 frames and a bar 80. Every frame number lives in CUE; the
// checker below runs at load. The score (monkeyCrocScore.ts) changes section on the same bars.
import { Gfx, rng, type Ctx, type Env, type Medium, type P } from "./core";
import type { Film } from "./film";
import { clamp } from "./gallery";
import { darken, faded, gouache, grass, leaf, ramp, reveal, sheet, sketch, stroke, trace, type Box } from "./folkTaleKit";
import { filmScore } from "./score";
import { score } from "./monkeyCrocScore";
import { backY, drawCroc, type CrocPose } from "./pt/croc";
import { drawMonkey, type MonkeyPose } from "./pt/monkey";
import { FAR_BANK, HORIZON, drawJamun, lotusFlower, lotusPad, reeds, river, sky, wake, waterline } from "./pt/river";

const W = 1920, H = 1080, FPS = 30, BPM = 90, N = 2400;
const M: Medium = { nib: 1, taper: 1, pressure: 1, retrace: false, wobble: 0, rough: 0 };

// ---------------------------------------------------------------- the cue table (frames)
// Retimed to the user's own Telugu voice-over (vo/voiceover.wav): every event sits on the line that tells it.
export const CUE = {
  title: 0, bank: 240, ride: 880, confess: 1200, trick: 1600, back: 1760, moral: 2080, end: N,
  // bank (friendship): "...పండ్లు విసిరేది" ends at 570, "...స్నేహితులయ్యారు" at 660, the invitation 740-820, "సంతోషంగా ఎక్కింది" 843
  reach1: 430, pick1: 470, toss1: 510, catch1: 570, chat1: 590, reach2: 610, toss2: 650, catch2: 710, invite: 730, hop: 840,
  // confession: his line 1332-1443, "కోతి గుండె జారిపోయింది" 1458, "కానీ వెంటనే ఆలోచించింది" 1515-1578
  talk: 1330, talkEnd: 1445, shock: 1455, think: 1530,
  // back: "ఒక్క దూకుతో చెట్టెక్కేసింది" 1899-1962; the monkey's last words 1980-2088
  slow: 1880, leap: 1910, land: 1950, turn: 1970, retort: 1980,
  // moral: "మొసలి సిగ్గుతో వెళ్ళిపోయింది" 2109-2154; "ఆపదలో తెలివే రక్ష" 2235-2301
  drop: 2160, splash: 2190, card: 2200,
};
(() => { // the grid checker: cuts on bars, events on 5-frame steps, nothing past the end
  const cuts = [CUE.bank, CUE.ride, CUE.confess, CUE.trick, CUE.back, CUE.moral];
  for (const c of cuts) if (c % 80) throw new Error(`cue: cut at ${c} is off the bar grid`);
  for (let i = 1; i < cuts.length; i++) if (cuts[i] <= cuts[i - 1]) throw new Error(`cue: cuts out of order at ${cuts[i]}`);
  for (const [k, v] of Object.entries(CUE)) { if (v % 5) throw new Error(`cue ${k}=${v} is not on a 5-frame step`); if (v > N) throw new Error(`cue ${k} past the end`); }
})();

// ---------------------------------------------------------------- helpers
const ease = (f: number, a: number, b: number) => { const t = clamp((f - a) / (b - a)); return t * t * (3 - 2 * t); };
const lerp = (a: number, b: number, t: number) => a + (b - a) * t;
type Cam = { x: number; y?: number; z?: number; fx?: number; fy?: number };
// world -> screen: (w - cam.x - fx) * z + fx
const withCam = (c: Ctx, env: Env, cam: Cam, fn: () => void) => {
  const k = env.scale, z = cam.z ?? 1, fx = cam.fx ?? W / 2, fy = cam.fy ?? H / 2;
  c.save(); c.setTransform(k * z, 0, 0, k * z, k * (fx - (cam.x + fx) * z), k * (fy - ((cam.y ?? 0) + fy) * z)); fn(); c.restore();
};
// a mirrored character: drawn about its own x, so the same module faces the other way
const mirror = (c: Ctx, x: number, on: boolean, fn: () => void) => { if (!on) { fn(); return; } c.save(); c.translate(x, 0); c.scale(-1, 1); c.translate(-x, 0); fn(); c.restore(); };
const monkey = (c: Ctx, ps: MonkeyPose, flip = false) => { let hand: P = [0, 0]; mirror(c, ps.x, flip, () => { hand = drawMonkey(c, ps).hand; }); return (flip ? [2 * ps.x - hand[0], hand[1]] : hand) as P; };
// the crocodile rides the water's slow swell: a bob that is a pure function of the frame
const croc = (c: Ctx, ps: CrocPose, flip: boolean, layer: "under" | "over", f: number) => mirror(c, ps.x, flip, () => drawCroc(c, { ...ps, y: ps.y + Math.sin(f * 0.13) * 5 }, layer));
// where the crocodile's snout tip and back sit in the world, for this pose
const snout = (ps: CrocPose, flip: boolean): P => [ps.x + (flip ? 1 : -1) * 232 * ps.s, ps.y - 6 * ps.s];
const seatOn = (ps: CrocPose, flip: boolean, lx = 120): P => [ps.x + (flip ? -1 : 1) * lx * ps.s, ps.y + backY(lx, ps) * ps.s + 4];
const talkJaw = (f: number, a: number, b: number, amt = 0.28) => (f >= a && f < b ? amt * Math.abs(Math.sin((f - a) * 0.32)) * (0.6 + 0.4 * Math.sin((f - a) * 0.07)) : 0);

// one jamun fruit: an ovoid berry, near-black purple, a pale bloom, a dry tip
const fruit = (c: Ctx, x: number, y: number, s = 1, rot = 0) => {
  c.save(); c.translate(x, y); c.rotate(rot);
  c.globalAlpha = 1; c.fillStyle = "#3a1432"; c.beginPath(); c.ellipse(0, 0, 9 * s, 12 * s, 0, 0, Math.PI * 2); c.fill();
  c.fillStyle = "#6a2a5c"; c.beginPath(); c.ellipse(-2.5 * s, -2 * s, 5 * s, 7 * s, 0, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.7; c.fillStyle = "#d8bfd8"; c.beginPath(); c.ellipse(-3.5 * s, -5 * s, 2 * s, 3 * s, -0.4, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 1; c.fillStyle = "#5a4a2a"; c.beginPath(); c.arc(0, -12 * s, 1.8 * s, 0, Math.PI * 2); c.fill();
  c.restore();
};
// rings spreading from where something met the water
const rings = (c: Ctx, x: number, y: number, age: number, s = 1) => {
  if (age < 0 || age > 70) return;
  for (let k = 0; k < 3; k++) { const a = age - k * 9; if (a < 0) continue; const r = (8 + a * 2.2) * s; c.globalAlpha = 0.6 * (1 - a / 70); c.strokeStyle = "#eef0d8"; c.lineWidth = 2; c.beginPath(); c.ellipse(x, y, r, r * 0.28, 0, 0, Math.PI * 2); c.stroke(); }
  if (age < 14) for (let i = 0; i < 7; i++) { const th = -Math.PI * (0.15 + 0.7 * (i / 6)), v = 3.2 * s, t = age; c.globalAlpha = 0.8 * (1 - age / 14); c.fillStyle = "#f2f4e2"; c.beginPath(); c.arc(x + Math.cos(th) * v * t * 2, y + Math.sin(th) * v * t * 2 + 0.25 * t * t, 3 * s, 0, Math.PI * 2); c.fill(); }
  c.globalAlpha = 1;
};

// ---------------------------------------------------------------- the world
const sheetAndSky = (g: Gfx) => { sheet(g, [[560, HORIZON - 40, 900, "#fbf3d6"]]); };
const farBank = (c: Ctx, scroll: number, p = 1) => {
  const o = -(((scroll * 0.18) % W) + W) % W;
  for (const dx of [o, o + W]) { c.save(); c.translate(dx, 0); sketch(c, FAR_BANK, p); c.restore(); }
};
// the near bank with the jamun tree, in world units (the tree's trunk at x = 1520 in the bank shot)
const TREE = { x: 1560, base: 700, s: 1.25, d: 0.08, seed: 91 };
const BRANCH: P[] = [[1500, 470], [1380, 440], [1240, 438], [1080, 452], [1000, 470]];
export const SEAT: P = [1150, 446];
const bankPoly: P[] = [[1150, 1200], [1190, 1010], [1236, 900], [1290, 812], [1360, 752], [1450, 716], [1560, 700], [1760, 694], [2300, 700], [2300, 1200]];
const nearBank = (c: Ctx, sway: number) => {
  gouache(c, bankPoly, "#8f7448", { seed: 301, tex: { cols: ["#6e5634", "#b0946a"], n: 120, len: 40, w: 4, ang: 0.1, a: 0.4 }, rim: "#5a4428", rimA: 0.5, rimW: 2 });
  c.save(); trace(c, bankPoly); c.clip(); gouache(c, [[1160, 1200], [1200, 1010], [1250, 900], [1310, 820], [1380, 790], [1500, 840], [1560, 1200]], "#5e4a2c", { seed: 302, a: 0.45, wob: 8 }); c.restore();
  drawJamun(c, TREE, 1, sway * 20);
  // the long branch over the water that he sits on, and its leaves
  stroke(c, BRANCH, 30, 11, "#6a5442", 1); stroke(c, BRANCH.map(([x, y]) => [x, y + 6] as P), 14, 5, darken("#6a5442", 0.3), 0.6);
  const r = rng(303);
  for (let i = 0; i < 26; i++) { const t = 0.25 + r() * 0.75, k = Math.floor(t * (BRANCH.length - 1)), [x0, y0] = BRANCH[k], [x1, y1] = BRANCH[Math.min(k + 1, BRANCH.length - 1)], f = t * (BRANCH.length - 1) - k;
    leaf(c, { x: x0 + (x1 - x0) * f, y: y0 + (y1 - y0) * f - 6, a: -Math.PI / 2 + (r() - 0.5) * 2.6 + Math.sin(sway * 2.2 + i) * 0.1, len: 44 + r() * 14, wid: 18 + r() * 6, col: ["#2f5a2a", "#3a6a30", "#456f34"][i % 3], seed: 3100 + i, bend: (r() - 0.5) * 0.3, round: 0.7, d: 0.05, vein: "#7a9a5a" }); }
  // fruit hanging in clusters along the branch
  for (const [x, y] of [[1290, 470], [1302, 478], [1280, 482], [1420, 466], [1432, 474], [1088, 480], [1100, 488]] as P[]) fruit(c, x, y, 0.8);
  reeds(c, 1300, 1560, 740, [60, 140], 304, 0); reeds(c, 1560, 2000, 712, [50, 110], 305, 0); reeds(c, 1180, 1300, 940, [70, 150], 306, 0);
};
// lotus pads placed in the WORLD, so they slide past as the camera travels
const PADS: [number, number, number, number][] = [[-2700, 620, 38, 10], [-2100, 520, 26, 11], [-1550, 640, 44, 12], [-1100, 540, 30, 13], [-650, 650, 42, 14], [-150, 600, 34, 15], [350, 640, 40, 16], [-3400, 560, 32, 17],[-1800, 560, 34, 1], [-1300, 600, 46, 2], [-900, 520, 28, 3], [-400, 610, 40, 4], [100, 540, 30, 5], [600, 580, 36, 6], [1000, 520, 26, 7], [-2400, 540, 30, 8], [-3000, 590, 40, 9]];
const midPads = (c: Ctx) => PADS.forEach(([x, y, R, s]) => lotusPad(c, x, y, R, 0.28, s, 400 + s, 0.45));
const foreground = (c: Ctx, scroll: number) => {
  // near pads and a lotus at the viewer's feet: they move fastest with the camera
  const o = (x: number) => { const span = W + 600; return ((((x - scroll * 1.25) % span) + span) % span) - 300; };
  lotusPad(c, o(150), 1010, 150, 0.33, 0.3, 71); lotusPad(c, o(420), 1070, 100, 0.33, 1.2, 72); lotusPad(c, o(1640), 1030, 130, 0.33, 2.1, 73);
  lotusFlower(c, o(300), 940, 1.05, 75);
};

const CURRENT = 2.2; // px per frame: the river flows left to right in every shot, whatever the camera does
const birds = (c: Ctx, f: number) => {
  for (const [x0, y0, v, ph, s] of [[-200, 150, 2.6, 0, 1.3], [-420, 190, 2.3, 1.7, 1.1], [-320, 120, 2.8, 3.1, 0.9]]) {
    const x = ((x0 + f * v) % (W + 600) + W + 600) % (W + 600) - 300, y = y0 + Math.sin(f * 0.03 + ph) * 18, flap = Math.sin(f * 0.55 + ph) * 7 * s;
    pencilTick(c, [[x - 14 * s, y - flap], [x - 6 * s, y - flap * 0.3], [x, y + 1.5 * s], [x + 6 * s, y - flap * 0.3], [x + 14 * s, y - flap]], 1.6 * s);
  }
};
const pencilTick = (c: Ctx, pts: P[], w: number) => { c.save(); c.globalAlpha = 0.75; c.strokeStyle = "#5a5246"; c.lineWidth = w; c.lineCap = "round"; c.lineJoin = "round"; c.beginPath(); pts.forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.restore(); };
const water = (c: Ctx, f: number, scroll: number) => { sky(c, W); birds(c, f); river(c, W, H, f, 3, scroll - f * CURRENT); };

// ---------------------------------------------------------------- shots
// 1. TITLE (bars 0-3): the far bank draws itself in pencil, the river is washed in, the title is lettered
const titleShot = (ctx: Ctx, f: number, env: Env) => {
  const g = new Gfx(ctx, env, 0, M), c = g.cur; sheetAndSky(g);
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0);
  reveal(c, [0, HORIZON - 10, W, H], 0, 0.04 + 0.96 * ease(f, 0, 110), 11, () => water(c, f, 0));
  farBank(c, 0, 0.05 + 0.95 * ease(f, 0, 90));
  // a single jamun drifts in from the right, already on the water: the token, planted
  if (f > 150) { const x = 1500 - (f - 150) * 1.2, y = 760 + Math.sin(f * 0.12) * 3; fruit(c, x, y, 1.2, Math.sin(f * 0.05) * 0.2); rings(c, x, y + 10, (f - 150) % 45, 0.5); }
  // the title on the quiet sky: lettered with a brush front, never faded
  const t1 = env.image?.("title1"), t2 = env.image?.("title2");
  if (t1) reveal(c, [480, 60, 1440, 320], 0, ease(f, 30, 95), 21, () => c.drawImage(t1, 960 - 1563 * 0.31, 50, 1563 * 0.62, 371 * 0.62));
  if (t2) reveal(c, [700, 250, 1220, 420], 0, ease(f, 100, 140), 22, () => c.drawImage(t2, 960 - 892 * 0.24, 236, 892 * 0.48, 290 * 0.48));
  c.restore(); g.paper("paper", 0.14); g.paper("coldpress", 0.07);
};

// 2. BANK (bars 3-11): friendship. The monkey on his branch, the crocodile below; two jamun tossed and caught
const bankShot = (ctx: Ctx, f0: number, env: Env) => {
  const f = f0 + CUE.bank, g = new Gfx(ctx, env, 0, M), c = g.cur; sheetAndSky(g);
  const cam: Cam = { x: 0, z: 1 + 0.04 * ease(f, CUE.bank, CUE.ride), fx: 1100, fy: 600 };
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0); water(c, f, 0); farBank(c, 0); c.restore();
  const cx = lerp(lerp(300, 640, clamp((f - CUE.bank) / (CUE.reach1 + 20 - CUE.bank))), 820, ease(f, CUE.invite, CUE.hop)) /* he swims in from the left as the narration introduces him */, cps: CrocPose = { x: cx, y: 862, s: 1.3, rise: 0.7, wave: f * 0.12, look: -0.6, turn: 0.25, eye: 1 };
  // the crocodile's mouth: opens for each fruit, snaps shut on the catch, then chats
  const open = (a: number, b: number) => ease(f, a, b - 12) * (1 - ease(f, b - 4, b));
  cps.jaw = Math.max(open(CUE.toss1 - 10, CUE.catch1) * 0.85, open(CUE.toss2 - 10, CUE.catch2) * 0.85, talkJaw(f, CUE.chat1, CUE.reach2), talkJaw(f, CUE.invite, CUE.hop - 20));
  cps.eye = f > CUE.catch1 && f < CUE.catch1 + 40 || f > CUE.catch2 && f < CUE.catch2 + 40 ? 0.25 : 1;
  withCam(c, env, cam, () => {
    midPads(c);
    croc(c, cps, true, "under", f); wake(c, snout(cps, true), Math.PI, 300, 40, 61, f);
    croc(c, cps, true, "over", f);
    const wl: P[] = []; for (let x = cx - 1300; x <= snout(cps, true)[0] + 8; x += 40) wl.push([x, 862]); waterline(c, wl, 62 + Math.floor(f / 6));
    nearBank(c, f * 0.05);
    // the monkey: sits, reaches into the crown, tosses; laughs; hops down to the crocodile's back
    const hopT = ease(f, CUE.hop, CUE.ride + 20), tgt = seatOn(cps, true);
    const reach = (a: number, b: number) => ease(f, a, a + 20) * (1 - ease(f, b - 10, b));
    const r1 = Math.max(reach(CUE.reach1, CUE.pick1 + 10), reach(CUE.reach2, CUE.toss2 - 8)), throwT = Math.max(ease(f, CUE.toss1 - 20, CUE.toss1) * (1 - ease(f, CUE.toss1 + 10, CUE.toss1 + 40)), ease(f, CUE.toss2 - 20, CUE.toss2) * (1 - ease(f, CUE.toss2 + 10, CUE.toss2 + 40)));
    const scratch = ease(f, CUE.bank + 70, CUE.bank + 90) * (1 - ease(f, CUE.reach1 - 20, CUE.reach1));
    const hand: P = scratch > 0 && r1 === 0 ? [lerp(-84, -26, scratch) + Math.sin(f * 0.9) * 5 * scratch, lerp(-4, -176, scratch) + Math.cos(f * 0.9) * 4 * scratch] : r1 > 0 ? [lerp(-84, 14, r1), lerp(-4, -214, r1)] : throwT > 0 ? [lerp(-84, -62, throwT), lerp(-4, -190, throwT)] : [-84, -4];
    const laugh = ease(f, CUE.catch1, CUE.catch1 + 15) * (1 - ease(f, CUE.reach2 - 20, CUE.reach2)) + ease(f, CUE.catch2, CUE.catch2 + 15) * (1 - ease(f, CUE.invite + 40, CUE.invite + 60));
    const sx = lerp(SEAT[0], tgt[0], hopT), sy = lerp(SEAT[1], tgt[1], hopT) - Math.sin(Math.PI * hopT) * 140;
    const mp: MonkeyPose = { x: sx, y: sy, s: 1.3, hand, head: 0.18 + 0.06 * Math.sin(f * 0.05) - laugh * 0.15, look: [-0.8, 0.7], mouth: laugh * (0.4 + 0.3 * Math.abs(Math.sin(f * 0.4))), brow: laugh * 0.6, tail: f * 0.06, legs: Math.sin(Math.PI * hopT), lean: hopT > 0 ? 0.25 * Math.sin(Math.PI * hopT) : 0 };
    const hp = monkey(c, mp);
    // the fruit: in the hand while picked and raised, then a parabola to the crocodile's open mouth
    const toss = (pick: number, t0: number, t1: number) => {
      const m = snout(cps, true);
      if (f >= pick && f < t0) fruit(c, hp[0], hp[1] - 6, 1);
      else if (f >= t0 && f < t1) { const u = (f - t0) / (t1 - t0), x = lerp(hp[0], m[0] - 26, u), y = lerp(hp[1], m[1] - 10, u) - Math.sin(Math.PI * u) * 120; fruit(c, x, y, 1, u * 6); }
    };
    toss(CUE.pick1, CUE.toss1, CUE.catch1); toss(CUE.toss2 - 8, CUE.toss2, CUE.catch2);
  });
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0); reeds(c, 1800, 1940, 1090, [140, 300], 901, 0); c.restore();
  g.paper("paper", 0.14); g.paper("coldpress", 0.07);
};

// the open river with the two of them riding: shared by the ride, the confession and the trick
const rideFrame = (ctx: Ctx, f: number, env: Env, o: { cps: CrocPose; cflip: boolean; mp: MonkeyPose; mflip: boolean; scroll: number; cam: Cam; tree?: boolean; landing?: number; offCroc?: boolean }) => {
  const g = new Gfx(ctx, env, 0, M), c = g.cur; sheetAndSky(g);
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0); water(c, f, o.scroll); farBank(c, o.scroll); c.restore();
  withCam(c, env, o.cam, () => {
    midPads(c);
    croc(c, o.cps, o.cflip, "under", f); wake(c, snout(o.cps, o.cflip), o.cflip ? Math.PI : 0, 520, 70, 61, f);
    croc(c, o.cps, o.cflip, "over", f);
    const wl: P[] = []; for (let x = o.cps.x - 1400; x <= o.cps.x + 1400; x += 40) wl.push([x, o.cps.y]); waterline(c, wl, 62 + Math.floor(f / 6));
    if (o.tree) nearBank(c, f * 0.05);
    monkey(c, o.offCroc ? o.mp : { ...o.mp, y: o.mp.y + Math.sin(f * 0.13) * 5 }, o.mflip);
    if (o.landing !== undefined) rings(c, o.mp.x, o.cps.y + 4, o.landing, 1.2);
  });
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0); foreground(c, o.scroll); reeds(c, 1800, 1940, 1090, [140, 300], 901, 0); c.restore();
  g.paper("paper", 0.14); g.paper("coldpress", 0.07);
};

// 3. RIDE (bars 11-15): he lands on the crocodile's back and they set off across the river, away from the tree
const rideShot = (ctx: Ctx, f0: number, env: Env) => {
  const f = f0 + CUE.ride, wx = lerp(820, -900, ease(f, CUE.ride, CUE.confess + 60)), cps: CrocPose = { x: wx, y: 850, s: 1.3, rise: 1, wave: f * 0.18, eye: 1, look: -0.4 };
  const seat = seatOn(cps, false), land = ease(f, CUE.ride - 40, CUE.ride + 20);
  const mp: MonkeyPose = { x: seat[0], y: seat[1] - Math.sin(Math.PI * (0.5 + land * 0.5)) * 60 * (1 - land), s: 1.3, legs: 1 - land, head: -0.05 + 0.05 * Math.sin(f * 0.06), look: [-0.6, -0.2], mouth: 0.15, brow: 0.3, tail: f * 0.08, lean: 0.08 * Math.sin(f * 0.07) };
  rideFrame(ctx, f, env, { cps, cflip: false, mp, mflip: false, scroll: wx - 820, cam: { x: wx - 760 }, tree: true, landing: f - CUE.ride - 6 });
};

// 4. CONFESS (bars 15-19): mid-river. A slow push-in; he says it; the monkey's face changes twice
const confessShot = (ctx: Ctx, f0: number, env: Env) => {
  const f = f0 + CUE.confess, drift = (f - CUE.confess) * 1.2;
  const cps: CrocPose = { x: 700, y: 850, s: 1.7, rise: 1, wave: f * 0.12, eye: lerp(1, 0.62, ease(f, CUE.talk - 20, CUE.talk + 10)), look: ease(f, CUE.talk - 30, CUE.talk), turn: 0.12 * ease(f, CUE.talk - 30, CUE.talk), jaw: talkJaw(f, CUE.talk, CUE.talkEnd, 0.3) };
  const shock = ease(f, CUE.shock, CUE.shock + 8), think = ease(f, CUE.think, CUE.think + 30);
  const seat = seatOn(cps, false);
  const mp: MonkeyPose = { x: seat[0], y: seat[1] + shock * 4 - (shock > 0 && f < CUE.shock + 12 ? Math.sin(((f - CUE.shock) / 12) * Math.PI) * 14 : 0), s: 1.85,
    head: lerp(lerp(-0.02, 0.12, shock), -0.08, think), look: think > 0.5 ? [0.6, -0.8] : [lerp(-0.4, -0.7, shock), lerp(0.1, 0.6, shock)], mouth: lerp(lerp(0.12, 0.45, shock), 0.08, think), brow: lerp(lerp(0.2, 1, shock), -0.5, think), tail: f * 0.05 * (1 - shock * 0.8), lean: 0.06 };
  rideFrame(ctx, f, env, { cps, cflip: false, mp, mflip: false, scroll: -2000 - drift, cam: { x: 0, z: 1 + 0.16 * ease(f, CUE.confess, CUE.think + 40), fx: 820, fy: 640 } });
};

// 5. TRICK (bars 19-21): he turns on the crocodile's back and points to the far tree: "my heart is up there!"
const trickShot = (ctx: Ctx, f0: number, env: Env) => {
  const f = f0 + CUE.trick;
  const cps: CrocPose = { x: 640, y: 860, s: 1.7, rise: 1, wave: f * 0.1, eye: 1, look: 1, turn: 0.18, jaw: 0.15 + 0.1 * ease(f, CUE.trick + 60, CUE.trick + 90) };
  const seat = seatOn(cps, false, 140), point = ease(f, CUE.trick + 10, CUE.trick + 30);
  // flipped, he faces right: his local "forward" is the viewer's right, toward the tree
  const mp: MonkeyPose = { x: seat[0], y: seat[1], s: 1.85, hand: [lerp(-84, -118, point), lerp(-4, -172, point)], head: -0.12, look: [-0.9, -0.5], mouth: talkJaw(f, CUE.trick + 20, CUE.back, 1.6), brow: 0.8, tail: f * 0.1, lean: 0.1 * point };
  rideFrame(ctx, f, env, { cps, cflip: false, mp, mflip: true, scroll: -2400 - (f - CUE.trick) * 0.6, cam: { x: 0, z: 1.12, fx: 900, fy: 640 } });
};

// 6. BACK (bars 21-24): racing back to the tree; at the bank he leaps from the crocodile's back to his branch
const backShot = (ctx: Ctx, f0: number, env: Env) => {
  const f = f0 + CUE.back, wx = lerp(-300, 520, ease(f, CUE.back, CUE.slow + 20)), cps: CrocPose = { x: wx, y: 862, s: 1.3, rise: 1, wave: f * 0.24, eye: 1, look: 0.2 };
  const leapT = ease(f, CUE.leap, CUE.land), seat = seatOn(cps, true), landed = f >= CUE.land, turned = f >= CUE.turn;
  cps.jaw = landed ? 0.55 * ease(f, CUE.land, CUE.land + 10) : 0; cps.look = landed ? -1 : 0.2; cps.turn = landed ? 0.3 : 0;
  const x = lerp(seat[0], SEAT[0], leapT), y = lerp(seat[1], SEAT[1], leapT) - Math.sin(Math.PI * leapT) * 220;
  const bob = turned && f < CUE.turn + 10 ? -Math.sin(((f - CUE.turn) / 10) * Math.PI) * 16 : 0;
  const mp: MonkeyPose = { x, y: y + bob, s: 1.3, legs: Math.sin(Math.PI * leapT), lean: 0.35 * Math.sin(Math.PI * leapT), hand: leapT > 0 && leapT < 1 ? [-70, -200] : undefined, head: turned ? 0.2 : -0.05, look: turned ? [-0.8, 0.8] : [-0.5, -0.6], mouth: turned ? Math.max(0.06, talkJaw(f, CUE.retort, CUE.moral, 1.4)) : 0.2, brow: turned ? -0.4 : 0.6, tail: f * 0.1 };
  const camX = lerp(-760, 0, ease(f, CUE.back, CUE.slow + 20));
  rideFrame(ctx, f, env, { cps, cflip: true, mp, mflip: !turned, scroll: camX, cam: { x: camX }, tree: true, landing: landed ? -1 : f - CUE.back, offCroc: leapT > 0 });
};

// 7. MORAL (bars 24-28): wide. The crocodile swims away; the monkey drops one jamun; it floats on the empty river
const moralShot = (ctx: Ctx, f0: number, env: Env) => {
  const f = f0 + CUE.moral, g = new Gfx(ctx, env, 0, M), c = g.cur; sheetAndSky(g);
  const cam: Cam = { x: 0, z: lerp(1, 0.9, ease(f, CUE.moral, CUE.card)), fx: 1200, fy: 560 };
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0); water(c, f, 0); farBank(c, 0); c.restore();
  const cx = lerp(560, -500, ease(f, CUE.moral, CUE.end)), cps: CrocPose = { x: cx, y: 870, s: 1.2, rise: lerp(1, 0.5, ease(f, CUE.moral, CUE.card)), wave: f * 0.1, eye: 0.5, look: 0.6 };
  withCam(c, env, cam, () => {
    midPads(c);
    croc(c, cps, false, "under", f); wake(c, snout(cps, false), 0, 380, 50, 61, f); croc(c, cps, false, "over", f);
    const wl: P[] = []; for (let x = cx - 300; x <= cx + 1300; x += 40) wl.push([x, 870]); waterline(c, wl, 62 + Math.floor(f / 6));
    nearBank(c, f * 0.05);
    const holding = f < CUE.drop, mp: MonkeyPose = { x: SEAT[0], y: SEAT[1], s: 1.3, hand: holding ? [-96, -40] : [-84, -4], head: 0.22, look: [-0.9, 0.7], mouth: 0, brow: -0.2, tail: f * 0.04 };
    const hp = monkey(c, mp);
    // the jamun: held out, let go, falls, and floats where it landed
    const fx = 1010, fy = 878;
    if (holding) fruit(c, hp[0], hp[1] + 8, 1);
    else if (f < CUE.splash) { const u = (f - CUE.drop) / (CUE.splash - CUE.drop); fruit(c, lerp(hp[0], fx, u), lerp(hp[1] + 8, fy, u * u), 1, u * 2); }
    else { fruit(c, fx + Math.sin(f * 0.04) * 3, fy + Math.sin(f * 0.11) * 2.5, 1, Math.sin(f * 0.05) * 0.25); rings(c, fx, fy + 10, (f - CUE.splash) % 70, 0.8); }
  });
  // the moral: a torn cream card at the top, lettered with the brush front; a plate under the words
  if (f >= CUE.card) {
    c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0);
    const p = ease(f, CUE.card, CUE.card + 30), box: Box = [420, 70, 1500, 330], r = rng(77), edge: P[] = [];
    for (let x = box[0]; x <= box[2]; x += 20) edge.push([x, box[1] + (r() - 0.5) * 8]); for (let y = box[1]; y <= box[3]; y += 20) edge.push([box[2] + (r() - 0.5) * 8, y]);
    for (let x = box[2]; x >= box[0]; x -= 20) edge.push([x, box[3] + (r() - 0.5) * 8]); for (let y = box[3]; y >= box[1]; y -= 20) edge.push([box[0] + (r() - 0.5) * 8, y]);
    reveal(c, [box[0] - 10, box[1] - 10, box[2] + 10, box[3] + 10], 0, p, 81, () => {
      c.globalAlpha = 0.25; c.fillStyle = "#3a2a1a"; trace(c, edge.map(([x, y]) => [x + 8, y + 10] as P)); c.fill();
      gouache(c, edge, "#f6eedb", { seed: 82, rim: "#c9b48a", rimA: 0.7, rimW: 2, tex: { cols: ["#efe2c4", "#fbf6ea"], n: 60, len: 60, w: 4, ang: 0, a: 0.3 } });
    });
    const img = env.image?.("moral");
    if (img) reveal(c, [440, 80, 1480, 320], 0, ease(f, CUE.card + 20, CUE.card + 60), 83, () => c.drawImage(img, 960 - 1187 * 0.4, 90, 1187 * 0.8, 276.5 * 0.8));
    c.restore();
  }
  c.save(); c.setTransform(env.scale, 0, 0, env.scale, 0, 0); reeds(c, -20, 60, 1090, [100, 220], 902, 0); c.restore();
  g.paper("paper", 0.14); g.paper("coldpress", 0.07);
};

export const monkeyCroc: Film = {
  meta: {
    title: "Kothi, Mosali · Panchatantra", W, H, fps: FPS, bpm: BPM, durationFrames: N, raster: "cpu", kind: "story", poster: 1300,
    score: { tempo: BPM, form: "intro verse build breakdown bridge drop outro" },
    captions: [{ from: 100, to: 240, text: "పంచతంత్ర కథలు — కోతి, మొసలి" }, { from: CUE.card + 60, to: N, text: "ఆపదలో తెలివే రక్ష" }],
    // the moral card is read: the river still moves under it
    holds: [[100, CUE.bank, "the title is read: lettered by frame 95, the subtitle written under it while it is read"], [CUE.card + 60, N, "the moral card is read"]],
  },
  assets: { images: { title1: "assets/title1.png", title2: "assets/title2.png", moral: "assets/moral.png" } },
  shots: [
    { id: "title", start: CUE.title, end: CUE.bank, draw: titleShot },
    { id: "bank", start: CUE.bank, end: CUE.ride, draw: bankShot },
    { id: "ride", start: CUE.ride, end: CUE.confess, draw: rideShot },
    { id: "confess", start: CUE.confess, end: CUE.trick, draw: confessShot },
    { id: "trick", start: CUE.trick, end: CUE.back, draw: trickShot },
    { id: "back", start: CUE.back, end: CUE.moral, draw: backShot },
    { id: "moral", start: CUE.moral, end: CUE.end, draw: moralShot },
  ],
  audio: filmScore(score(), FPS, N),
};
void faded; void ramp; void grass; void W;
