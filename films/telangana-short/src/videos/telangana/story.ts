// Timeline of "One Ring at a Time" (Telugu voice, voice/words_te.json): 20 shots timed to the phrase onsets,
// the camera grammar of the template (smootherstep glides 18-40 f, hard cuts on big reframes, every hold creeps,
// 7-frame flip kicks on impacts, no hand-held float) and the lens table. Voice starts at frame 0, ends at 116.1 s.
import { GATE, QUAY_Z, CANOPY, VIL, BOARD, CHAIR, BK, FIELDS, DELHI, MINE, BUS, SHOPS, LAMP_WIN } from "./places";

export const FPS = 30;
export const TOTAL = 3530; // 117.7 s: the voice plus a 1.5 s tail
export const D0 = 6.0;     // ground height (lake surface at 0, quay wall 6 m)
export type V3 = [number, number, number];

export const clamp01 = (x: number) => Math.max(0, Math.min(1, x));
export const smooth = (x: number) => { const u = clamp01(x); return u * u * (3 - 2 * u); };
export const easeOut = (u: number) => 1 - (1 - clamp01(u)) ** 4;

// ---------------- story clock (seconds of the voice) ----------------
export const W = {
  hook: 0, y1956: 7.41, merge: 12.31, sign: 15.44, safeguards: 18.68, y1969: 23.15, jai: 28.46, lives: 31.85, quiet: 34.16, idea: 35.6,
  prof: 38.16, y2009: 46.43, fast: 49.23, delhiYes: 52.01, yes: 52.81, wait: 54.04, stopped: 56.61, halt: 59.71, strike: 60.85,
  buses: 63.83, offices: 64.65, courts: 65.57, mines: 66.29, still: 67.33, march: 68.76, came: 72.26, feb: 73.86, passed: 78.48, gavel: 79.4,
  june: 80.73, born: 85.11, bk: 86.63, rings: 89.97, single: 92.8, rests: 94.85, built: 97.75, gen: 100.52, died: 103.16, early: 106.34,
  univ: 108.46, name: 111.82, alive: 113.56, end: 116.12,
};
export const STUDENTS = 32;      // the 1969 column: 8 rows of 4
export const ROW_GAP = 1.25;
export const FILES = [-1.8, -0.6, 0.6, 1.8];
/** z of the front row of the 1969 march (walking +z, from the gate toward the lake at 1.3 m/s) */
export const marchFront = (t: number) => -104 + 1.3 * (t - 22.5);
export const marchPhase = (t: number) => ((t * 1.0) % 1 + 1) % 1;
/** bus: drives up the street (-z) and stops at BUS on "ఆగి" */
export const busZ = (t: number) => BUS[1] + 26 * (1 - smooth((t - (W.halt - 2.6)) / 2.6)) * (t < W.halt ? 1 : 0);
/** shutter drop 0 (open) .. 1 (down): each shop pulls its shutter down after the bus stops */
export const shutterK = (i: number, t: number) => smooth((t - (W.halt - 0.4 + i * 0.35)) / 0.7);
/** Bathukamma rings standing: 0..9 */
export const ringsUp = (t: number) => {
  if (t < W.rings - 1.5) return 2;
  return Math.min(9, 2 + Math.floor(((t - (W.rings - 1.5)) / 2.0) * 7));
};
export const TOP_FLOWER = 114.9; // the last flower goes on top

// ---------------- shots ----------------
export type Light = "day" | "golden";
export type Scene = "hook" | "aerial" | "sign" | "march" | "quiet" | "teach" | "fast" | "delhi" | "halt" | "strike" | "mine" | "million"
  | "parliament" | "june" | "bk" | "gens" | "chair" | "fields";
export type ShotDef = { id: number; a: number; b: number; light: Light; scene: Scene; sunAz?: number; sunEl?: number };
const f = (s: number) => Math.round(s * FPS);
export const SHOTS: ShotDef[] = [
  { id: 1, a: 0, b: 220, light: "golden", scene: "hook", sunAz: 150, sunEl: 12 },
  { id: 2, a: 220, b: 461, light: "day", scene: "aerial", sunAz: 120 },
  { id: 3, a: 461, b: 692, light: "day", scene: "sign" },
  { id: 4, a: 692, b: 953, light: "day", scene: "march" },
  { id: 5, a: 953, b: 1143, light: "golden", scene: "quiet", sunAz: 30, sunEl: 6 },
  { id: 6, a: 1143, b: 1391, light: "day", scene: "teach" },
  { id: 7, a: 1391, b: 1558, light: "day", scene: "fast" },
  { id: 8, a: 1558, b: 1696, light: "day", scene: "delhi", sunAz: 120 },
  { id: 9, a: 1696, b: 1823, light: "day", scene: "halt" },
  { id: 10, a: 1823, b: f(66.2), light: "day", scene: "strike" },
  { id: 11, a: f(66.2), b: 2063, light: "day", scene: "mine" },
  { id: 12, a: 2063, b: 2216, light: "day", scene: "million", sunAz: 110 },
  { id: 13, a: 2216, b: 2420, light: "day", scene: "parliament", sunAz: 120 },
  { id: 14, a: 2420, b: 2596, light: "golden", scene: "june", sunAz: 160, sunEl: 10 },
  { id: 15, a: 2596, b: 2782, light: "day", scene: "bk" },
  { id: 16, a: 2782, b: 2931, light: "day", scene: "bk" },
  { id: 17, a: 2931, b: 3092, light: "golden", scene: "gens", sunAz: 150, sunEl: 9 },
  { id: 18, a: 3092, b: 3252, light: "golden", scene: "chair", sunAz: 40 },
  { id: 19, a: 3252, b: 3405, light: "golden", scene: "fields", sunAz: 20, sunEl: 8 },
  { id: 20, a: 3405, b: TOTAL, light: "golden", scene: "bk", sunAz: 150, sunEl: 9 },
];
/** crossfades (frames) at place/time changes; white flashes after the hook and on the state's birth */
export const XFADE: Record<number, number> = { 5: 10, 6: 10, 12: 8, 15: 12, 17: 12, 18: 12, 19: 12, 20: 12 };
export const FLASHES = [220, 2420];
export const FLASH_AT = FLASHES[0];

export const shotAt = (fr: number) => SHOTS.find((s) => fr >= s.a && fr < s.b) ?? SHOTS[SHOTS.length - 1];
export const layersAt = (fr: number): { id: number; alpha: number }[] => {
  for (const s of SHOTS) {
    const x = XFADE[s.id];
    if (x && fr >= s.a - x / 2 && fr < s.a + x / 2) return [{ id: s.id - 1, alpha: 1 }, { id: s.id, alpha: (fr - (s.a - x / 2) + 1) / (x + 1) }];
  }
  return [{ id: shotAt(fr).id, alpha: 1 }];
};

// ---------------- camera ----------------
export type Cam = { pos: V3; look: V3; fov: number; roll: number };
type Shot = Partial<Cam> & { pos: V3; look: V3 };
type Key = { f: number; dur?: number; cut?: boolean; s: (f: number) => Shot };
export const glide = (u: number) => { const x = clamp01(u); return x * x * x * (x * (6 * x - 15) + 10); };
const mixC = (a: Cam, b: Cam, k: number): Cam => ({
  pos: a.pos.map((v, i) => v + (b.pos[i] - v) * k) as V3, look: a.look.map((v, i) => v + (b.look[i] - v) * k) as V3,
  fov: a.fov + (b.fov - a.fov) * k, roll: a.roll + (b.roll - a.roll) * k,
});
const full = (c: Shot): Cam => ({ fov: 40, roll: 0, ...c });
const run = (keys: Key[], fr: number) => {
  let cur = full(keys[0].s(fr));
  for (let i = 1; i < keys.length; i++) {
    const k = keys[i];
    if (fr < k.f) break;
    cur = k.cut ? full(k.s(fr)) : mixC(cur, full(k.s(fr)), glide((fr - k.f) / (k.dur ?? 24)));
  }
  return cur;
};
const T = (fr: number) => fr / FPS;
const pushK = (fr: number, f0: number, rate: number, punch = 0, n = 35) => {
  const x = Math.max(0, fr - f0);
  let s = rate * x;
  if (punch > rate) for (let i = 0; i < Math.min(x, n); i++) s += (punch - rate) * Math.max(0, Math.min(1, (i + 0.5) / 8, (n - i - 0.5) / 8));
  return Math.exp(-s);
};
const dolly = (pos: V3, look: V3, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos: [look[0] + (pos[0] - look[0]) * k, look[1] + (pos[1] - look[1]) * k, look[2] + (pos[2] - look[2]) * k], look, ...rest });
const zoom = (pos: V3, look: V3, fov: number, k: number, rest: Partial<Cam> = {}): Shot =>
  ({ pos, look, fov: (360 / Math.PI) * Math.atan(Math.tan((fov * Math.PI) / 360) * k), ...rest });
const rolled = (s: (fr: number) => Shot, roll: number) => (fr: number): Shot => ({ ...s(fr), roll });
/** crane along a quadratic Bezier from a to c through b, look sliding la -> lc, over [f0, f0 + n] */
const crane = (f0: number, n: number, a: V3, b: V3, c: V3, la: V3, lc: V3, fov0: number, fov1: number) => (fr: number): Shot => {
  const s = glide((fr - f0) / n), r = 1 - s;
  return { pos: [0, 1, 2].map((i) => r * r * a[i] + 2 * s * r * b[i] + s * s * c[i]) as V3, look: [0, 1, 2].map((i) => la[i] + (lc[i] - la[i]) * s) as V3, fov: fov0 + (fov1 - fov0) * s };
};
const G = D0;
const [vx, vz] = VIL, [bx, bz] = BK, [dx, dz] = DELHI, [mx, mz] = MINE;
export const HOOK_AT: V3 = [0, G, QUAY_Z - 0.4];  // the three generations on the promenade
export const TABLE_AT: V3 = [0, G, -90];           // the 1956 table, the gate behind it
const mz0 = (fr: number) => marchFront(T(fr));

const CAMS: Record<number, Key[]> = {
  // 1 hook: low over the lake wall, the three generations, the street and the gate behind them; push to their faces
  1: [
    { f: 0, s: (fr) => zoom([1.6, G + 2.2, -21.5], [0, G + 7.5, -60], 50, pushK(fr, 0, 0.0012)) },
    { f: 118, dur: 40, s: (fr) => dolly([0.7, G + 1.55, -28.4], [0, G + 1.5, -33.8], pushK(fr, 118, 0.002), { fov: 40, roll: -0.03 }) },
  ],
  // 2 1956: high aerial over the lake and the city, glide toward the gate on "కలిపి"
  2: [
    { f: 220, s: (fr) => zoom([70, 62, 55], [0, 8, -55], 46, pushK(fr, 220, 0.0018)) },
    { f: 360, dur: 40, s: (fr) => zoom([30, 44, -25], [0, 18, -112], 44, pushK(fr, 360, 0.0015, 0.005, 30), { roll: 0.03 }) },
  ],
  // 3 the promise: two leaders at a table before the gate -> the paper (top-down CU) on "తెలంగాణ ఉద్యోగాలు"
  3: [
    { f: 461, s: (fr) => dolly([1.2, G + 1.6, -83.5], [0, G + 1.4, -90.6], pushK(fr, 461, 0.0022), { fov: 40 }) },
    { f: f(W.safeguards) - 3, cut: true, s: (fr) => dolly([0.15, G + 1.75, -89.3], [0, G + 0.78, -90.05], pushK(fr, f(W.safeguards), 0.0018), { fov: 36, roll: 0.04 }) },
  ],
  // 4 1969: ahead of the student column walking down the street toward the lens; low 3/4 on "జై తెలంగాణ"
  4: [
    { f: 692, s: (fr) => { const F = mz0(fr); return dolly([2.0, G + 2.4, F + 11], [0, G + 1.6, F - 2], pushK(fr, 692, 0.0018), { fov: 44 }); } },
    { f: f(W.jai) - 2, cut: true, s: (fr) => { const F = mz0(fr); return dolly([-1.6, G + 0.75, F + 4.2], [0, G + 2.0, F - 0.5], pushK(fr, f(W.jai), 0.0025, 0.006, 30), { fov: 40, roll: 0.05 }); } },
  ],
  // 5 the quiet street at dusk; push into the one lit window on "కానీ ఆ ఆలోచన"
  5: [
    { f: 953, s: (fr) => dolly([2.5, G + 1.6, -66], [-4, G + 2.6, -92], pushK(fr, 953, 0.0016), { fov: 44 }) },
    { f: f(W.idea) - 10, dur: 40, s: (fr) => zoom([1.5, G + 1.7, -78], [LAMP_WIN[0], LAMP_WIN[1] + 0.2, LAMP_WIN[2]], 34, pushK(fr, f(W.idea), 0.003)) },
  ],
  // 6 the professor under the village tree, listeners in front
  6: [
    { f: 1143, s: (fr) => dolly([vx + 0.6, G + 1.7, vz + 8.5], [vx + 2.0, G + 1.4, vz - 0.4], pushK(fr, 1143, 0.0022), { fov: 42 }) },
    { f: f(42.48), dur: 36, s: (fr) => dolly([vx + 3.6, G + 1.6, vz + 4.2], [vx + 1.9, G + 1.6, vz - 0.2], pushK(fr, f(42.48), 0.0022), { fov: 38, roll: -0.03 }) },
  ],
  // 7 the fast: canopy on the promenade, the man on the mat, students round him
  7: [
    { f: 1391, s: (fr) => dolly([CANOPY[0] + 3.5, G + 2.1, CANOPY[1] + 8.0], [CANOPY[0], G + 1.1, CANOPY[1] - 0.3], pushK(fr, 1391, 0.0022), { fov: 44 }) },
    { f: f(W.fast) - 2, cut: true, s: (fr) => dolly([CANOPY[0] - 0.5, G + 1.0, CANOPY[1] + 3.0], [CANOPY[0] + 0.1, G + 0.95, CANOPY[1] - 0.1], pushK(fr, f(W.fast), 0.0022), { fov: 38, roll: 0.03 }) },
  ],
  // 8 Delhi: the round building; a giant hand gives a thumbs-up, then turns into a raised palm on "ఆగండి"
  8: [
    { f: 1558, s: (fr) => zoom([dx + 42, G + 11, dz - 95], [dx, G + 13, dz], 44, pushK(fr, 1558, 0.0016)) },
    { f: f(W.wait) - 2, dur: 20, s: rolled((fr) => zoom([dx + 42, G + 11, dz - 95], [dx, G + 13, dz], 44, pushK(fr, 1558, 0.0016) * pushK(fr, f(W.wait), 0.003)), -0.05) },
  ],
  // 9 the halt: the bus comes up the street and stops; shutters come down behind it
  9: [
    { f: 1696, s: (fr) => dolly([-2.8, G + 1.5, -96], [1.2, G + 1.8, -64], pushK(fr, 1696, 0.0016), { fov: 42 }) },
  ],
  // 10 the strike, three inserts on the words: buses / offices / courts
  10: [
    { f: 1823, s: (fr) => dolly([7.0, G + 1.7, -93.5], [BUS[0] + 1.6, G + 1.5, BUS[1] - 4.0], pushK(fr, 1823, 0.0022), { fov: 42 }) },
    { f: f(W.offices) - 2, cut: true, s: (fr) => dolly([2.6, G + 1.6, -51], [-6, G + 1.4, -57.5], pushK(fr, f(W.offices), 0.003), { fov: 40, roll: -0.03 }) },
    { f: f(W.courts) - 2, cut: true, s: (fr) => dolly([2.8, G + 1.4, -64.5], [-5.2, G + 1.0, -68.5], pushK(fr, f(W.courts), 0.003), { fov: 40, roll: 0.03 }) },
  ],
  // 11 the mine: miners at the tunnel mouth, lamps going out one by one
  11: [
    { f: f(66.2), s: (fr) => dolly([mx + 1.4, G + 1.6, mz - 4.0], [mx - 0.2, G + 1.9, mz + 6.0], pushK(fr, f(66.2), 0.0025), { fov: 44 }) },
  ],
  // 12 the Million March: aerial over Tank Bund, then into the crowd on "వేల మంది"
  12: [
    { f: 2063, s: (fr) => zoom([46, 34, 6], [0, G, QUAY_Z - 2], 46, pushK(fr, 2063, 0.0018)) },
    { f: f(W.came) - 2, cut: true, s: (fr) => dolly([3.2, G + 1.7, -27.3], [-1, G + 1.6, QUAY_Z - 0.6], pushK(fr, f(W.came), 0.0025), { fov: 42, roll: -0.04 }) },
  ],
  // 13 Parliament: low on the path looking up at the building; the gavel lands on "ఆమోదించింది"
  13: [
    { f: 2216, s: (fr) => dolly([dx + 6, G + 1.6, dz - 70], [dx, G + 11, dz], pushK(fr, 2216, 0.0018), { fov: 42 }) },
    { f: f(W.passed) - 2, dur: 26, s: (fr) => dolly([dx + 3, G + 2.4, dz - 52], [dx, G + 12, dz], pushK(fr, f(W.passed), 0.002, 0.006, 30), { fov: 40, roll: 0.04 }) },
  ],
  // 14 the second of June: dusk, fireworks over the gate, the street cheering; crane up on "అవతరించింది"
  14: [
    { f: 2420, s: (fr) => dolly([1.6, G + 1.6, -50], [0, G + 20, -112], pushK(fr, 2420, 0.0016), { fov: 52 }) },
    { f: f(W.born) - 8, s: crane(f(W.born) - 8, 55, [1.6, G + 1.6, -50], [6, G + 6, -44], [10, G + 15, -38], [0, G + 20, -112], [0, G + 28, -112], 52, 54) },
  ],
  // 15 Bathukamma: the women round the plate; 16 low close-up as the rings rise
  15: [
    { f: 2596, s: (fr) => dolly([bx + 0.8, G + 1.55, bz + 5.0], [bx, G + 0.7, bz], pushK(fr, 2596, 0.0022), { fov: 42 }) },
    { f: f(W.rings) - 8, dur: 36, s: (fr) => dolly([bx + 0.4, G + 1.1, bz + 3.0], [bx, G + 0.7, bz], pushK(fr, f(W.rings), 0.0022), { fov: 40, roll: 0.03 }) },
  ],
  16: [
    { f: 2782, s: (fr) => dolly([bx - 0.3, G + 0.45, bz + 1.9], [bx, G + 0.62, bz], pushK(fr, 2782, 0.0025), { fov: 38 }) },
    { f: f(W.rests) - 4, dur: 34, s: (fr) => dolly([bx + 0.5, G + 0.75, bz + 1.6], [bx, G + 0.75, bz], pushK(fr, f(W.rests), 0.002), { fov: 38, roll: -0.04 }) },
  ],
  // 17 every generation: the finished tower in front, the people of every era standing behind it; pull back on "ప్రతి తరం"
  17: [
    { f: 2931, s: (fr) => dolly([bx + 0.3, G + 0.95, bz + 2.6], [bx, G + 1.0, bz - 3], pushK(fr, 2931, 0.0018), { fov: 42 }) },
    { f: f(W.gen) - 6, dur: 40, s: (fr) => dolly([bx + 0.6, G + 1.6, bz + 5.2], [bx, G + 1.4, bz - 4], pushK(fr, f(W.gen), 0.0016), { fov: 46 }) },
  ],
  // 18 the empty chair by the chalkboard at sunset
  18: [
    { f: 3092, s: (fr) => dolly([CHAIR[0] + 2.4, G + 1.3, CHAIR[1] + 3.6], [CHAIR[0] + 0.7, G + 0.85, CHAIR[1] - 0.3], pushK(fr, 3092, 0.0022), { fov: 40 }) },
  ],
  // 19 the fields at golden hour: crane up and away
  19: [
    { f: 3252, s: crane(3252, 150, [FIELDS[0] - 4, G + 1.8, FIELDS[1] + 38], [FIELDS[0] + 2, G + 12, FIELDS[1] + 52], [FIELDS[0] + 8, G + 30, FIELDS[1] + 70],
      [FIELDS[0], G + 1.5, FIELDS[1] + 10], [FIELDS[0], G, FIELDS[1]], 44, 48) },
  ],
  // 20 back to the tower: the last flower goes on top, a slow pull back to the end
  20: [
    { f: 3405, s: (fr) => dolly([bx + 0.2, G + 1.05, bz + 1.7], [bx, G + 1.05, bz], pushK(fr, 3405, 0.0015), { fov: 38 }) },
    { f: f(TOP_FLOWER) + 12, dur: 60, s: (fr) => dolly([bx + 0.6, G + 1.7, bz + 4.8], [bx, G + 1.2, bz], 1, { fov: 44 }) },
  ],
};

// impact kicks: the gavel, the strike halting, the flash of the second of June
const KICKS: [number, number][] = [[W.gavel, 1.2], [W.halt, 0.5], [W.jai, 0.4], [80.7, 0.6]];
export const kickAt = (t: number) => {
  let a = 0;
  for (const [t0, g] of KICKS) {
    const n = Math.floor((t - t0) * FPS + 1e-6);
    if (n >= 0 && n < 7) a += g * (n % 2 ? -1 : 1) * (1 - n / 7) ** 1.5;
  }
  return a;
};
export const camAt = (id: number, fr: number): Cam => {
  const c = run(CAMS[id], fr), a = kickAt(T(fr));
  if (!a) return c;
  const d: V3 = [c.look[0] - c.pos[0], c.look[1] - c.pos[1], c.look[2] - c.pos[2]];
  const L = Math.hypot(...d), h = Math.hypot(d[0], d[2]) || 1;
  const m = (3 / 640) * Math.tan((c.fov * Math.PI) / 360) * L * a;
  return { ...c, look: [c.look[0] - (d[2] / h) * m, c.look[1] + 0.6 * m, c.look[2] + (d[0] / h) * m], roll: c.roll + a * 0.004 };
};

// ---------------- lens ----------------
export type Dof = { f: number; dur?: number; cInf: number; focus?: (f: number) => V3 };
export const DOF: Dof[] = [
  { f: 0, cInf: 0 },
  { f: 118, dur: 40, cInf: 13, focus: () => [0, G + 1.5, QUAY_Z - 0.4] },     // the three generations
  { f: 220, cInf: 0 },                                                         // aerial
  { f: 461, cInf: 10, focus: () => [0, G + 1.5, -90.7] },                       // leaders at the table
  { f: f(W.safeguards) - 3, cInf: 14 },                                        // the paper
  { f: 692, cInf: 0 },                                                         // the march
  { f: f(W.jai) - 2, cInf: 10, focus: (fr) => [0, G + 1.7, mz0(fr)] },          // fists up
  { f: 953, cInf: 0 },                                                         // quiet street
  { f: f(W.idea) - 10, dur: 40, cInf: 8 },                                     // the window
  { f: 1143, cInf: 10, focus: () => [vx + 1.9, G + 1.6, vz - 0.3] },             // the professor
  { f: 1391, cInf: 0 },                                                        // canopy wide
  { f: f(W.fast) - 2, cInf: 12, focus: () => [CANOPY[0], G + 0.95, CANOPY[1]] }, // the man fasting
  { f: 1558, cInf: 0 },                                                        // Delhi, the street, the strike
  { f: f(W.offices) - 2, cInf: 8 },                                            // shutters
  { f: f(W.courts) - 2, cInf: 10 },                                            // lawyers on the steps
  { f: f(66.2), cInf: 10, focus: () => [mx, G + 1.6, mz + 4.6] },               // miners
  { f: 2063, cInf: 0 },                                                        // march aerial
  { f: f(W.came) - 2, cInf: 9 },                                               // the crowd
  { f: 2216, cInf: 0 },                                                        // parliament, June 2
  { f: 2596, cInf: 9, focus: () => [bx, G + 0.6, bz] },                         // Bathukamma
  { f: 2782, cInf: 15, focus: () => [bx, G + 0.6, bz] },                        // low CU
  { f: 2931, cInf: 12, focus: () => [bx, G + 0.8, bz] },                        // tower + generations behind (soft)
  { f: f(W.gen) - 6, dur: 40, cInf: 5, focus: () => [bx, G + 1.2, bz - 3] },     // pull back: the people come into focus
  { f: 3092, cInf: 9 },                                                        // the chair
  { f: 3252, cInf: 0 },                                                        // fields
  { f: 3405, cInf: 14, focus: () => [bx, G + 1.05, bz] },                       // last flower
];
export const dofAt = (fr: number) => {
  let i = 0; while (i + 1 < DOF.length && fr >= DOF[i + 1].f) i++;
  const d = DOF[i], p = DOF[Math.max(0, i - 1)];
  const k = d.dur ? Math.min(1, (fr - d.f) / d.dur) : 1;
  return { cInf: p.cInf + (d.cInf - p.cInf) * k, focus: d.focus };
};
export const focusAt = (id: number, fr: number): V3 => { const d = dofAt(fr); return d.focus ? d.focus(fr) : camAt(id, fr).look; };

/** near framing objects (Kenney names or cartoon plants), visible a <= f < b inside their own shot */
export type Fg = { a: number; b: number; kit: string; pos: V3; s?: number; yaw?: number };
export const FOREGROUND: Fg[] = [
  { a: 1143, b: 1391, kit: "plant_bushDetailed", pos: [vx - 1.6, G, vz + 6.2], s: 1.0, yaw: 0.4 },
  { a: 3092, b: 3252, kit: "plant_bushLarge", pos: [CHAIR[0] + 3.1, G, CHAIR[1] + 2.0], s: 0.9 },
];
export { GATE, BOARD, SHOPS };
