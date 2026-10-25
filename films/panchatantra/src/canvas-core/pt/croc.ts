// THE CROCODILE (mosali) · one module, posed per shot, never redrawn.
//
// ANATOMY (reference, from knowledge): mugger crocodile, Crocodylus palustris, the river crocodile
// of the Indian subcontinent. The broadest snout of any living crocodile, short and rounded at the
// tip, a raised nostril rosette at the end; eyes on raised orbits on the top of the skull, golden
// with a vertical slit pupil and a heavy bony lid; the teeth of both jaws show along the closed
// mouth, the fourth lower tooth notched into the upper jaw. Behind the skull: four large nuchal
// scutes in two pairs, then the dorsal armour in transverse rows of keeled osteoderms, four to six
// across; the tail laterally flattened, with a DOUBLE crest of upright scutes that merges into a
// single crest for the last third. Olive-grey above with darker cross-bands, the belly cream.
// Swimming: legs folded back against the flanks, the tail sculls in a travelling wave, and only the
// nostrils, eyes, back and crests ride above the water.
// VIEW: side-on from slightly above, facing the viewer's left. Local origin is the waterline under
// the back of the skull, 1 unit = 1 px at s = 1. Snout tip at x = -300, tail tip at x ~ +900.
import { rng, type Ctx, type P } from "../core";
import { clamp, mix } from "../gallery";
import { darken, gouache, lighten, pencil, rgba, ribbonOf, smooth, stroke, trace } from "../folkTaleKit";

export type CrocPose = {
  x: number; y: number; s: number;
  jaw?: number;       // 0 shut, 1 open (upper jaw lifts about the hinge, the lower stays in the water)
  rise?: number;      // how high he rides: 0 low (eyes and back), 1 carrying (the whole back up)
  wave?: number;      // tail sculling phase, radians
  eye?: number;       // eye lid: 1 open, 0 shut (a sly half-lid at 0.5)
  look?: number;      // pupil slide: -1 forward, +1 back toward his rider
  turn?: number;      // the head swung back toward the rider, radians (small: 0 .. 0.25)
  a?: number;
};

export const OLIVE = "#6f7046", OLIVE_LIT = "#97945f", OLIVE_DK = "#3e4226", CREAM = "#c9bf8c", WATER_IN = "#2f5a52";

type T = (p: P) => P;

// the back's top line as a function of x (local), before the pose's rise; the tail sculls
export const backY = (x: number, ps: CrocPose) => {
  const rise = ps.rise ?? 1, w = ps.wave ?? 0;
  if (x < -40) return -36;
  const body = x < 520 ? -(36 + 30 * Math.sin(Math.PI * clamp((x + 40) / 560))) * (0.6 + 0.4 * rise) : -36 * (1 - clamp((x - 520) / 420)) - 2;
  const tailWave = x > 420 ? Math.sin(w - (x - 420) * 0.012) * 6 * clamp((x - 420) / 300) : 0;
  return body + tailWave;
};

export const drawCroc = (c: Ctx, ps: CrocPose, layer: "under" | "over" | "both" = "both") => {
  const s = ps.s, A = ps.a ?? 1, jaw = clamp(ps.jaw ?? 0), eye = ps.eye ?? 1, turn = ps.turn ?? 0, r = rng(700);
  const W: T = ([x, y]) => [ps.x + x * s, ps.y + y * s];
  // the head swings about the neck and the upper jaw lifts about the hinge
  const HINGE: P = [-96, -6], NECK: P = [-20, -10];
  const hT: T = ([x, y]) => { if (x > NECK[0]) return [x, y]; const a = turn * 0.35, co = Math.cos(a), si = Math.sin(a); return [NECK[0] + (x - NECK[0]) * co - (y - NECK[1]) * si, NECK[1] + (x - NECK[0]) * si + (y - NECK[1]) * co]; };
  const jT0: T = ([x, y]) => { if (x > HINGE[0]) return [x, y]; const a = jaw * 0.32, co = Math.cos(a), si = Math.sin(a); const dx = x - HINGE[0], dy = y - HINGE[1]; return [HINGE[0] + dx * co - dy * si, HINGE[1] + dx * si + dy * co]; };
  // the authored head is broadened into the mugger's: shorter and deeper than the first draft
  const hs: T = ([x, y]) => (x < -30 ? [-30 + (x + 30) * 0.74, y * 1.4] : [x, y]), jT: T = (p) => jT0(hs(p));
  const L = (pts: P[], ...fs: T[]) => pts.map((p) => W(fs.reduce((q, f) => f(q), p)));
  const G = (pts: P[], col: string, seed: number, o: Partial<Parameters<typeof gouache>[3]> = {}) => gouache(c, pts, col, { seed, a: A, ...o });
  const pen = (pts: P[], seed: number, a = 0.6, w = 1.1, closed = false) => pencil(c, { pts, seed, a: a * A, w: w * Math.max(0.6, s), closed, per: 3, retrace: false });

  // ---- UNDER: what the river lets through. Painted thin, in the water's own colour, so it reads as depth
  if (layer !== "over") {
    const sub: P[] = [[-296, 4], [-200, 18], [-100, 34], [0, 58], [140, 78], [300, 80], [460, 64], [600, 40], [760, 22], [900, 8], [700, 6], [400, 6], [0, 4]];
    { const sp = L(sub), [bx0, by0, bx1, by1] = [Math.min(...sp.map((q) => q[0])), Math.min(...sp.map((q) => q[1])), Math.max(...sp.map((q) => q[0])), Math.max(...sp.map((q) => q[1]))];
      c.save(); trace(c, smooth(sp, 6, true)); c.clip(); c.lineCap = "round";
      for (let i = 0; i < 260; i++) { const y = by0 + r() * (by1 - by0), x = bx0 + r() * (bx1 - bx0), l = (40 + r() * 140) * s, deep = (y - by0) / Math.max(1, by1 - by0); c.globalAlpha = (0.05 + r() * 0.07) * A * (1 - deep * 0.6); c.strokeStyle = mix(WATER_IN, OLIVE_DK, 0.3 + r() * 0.3); c.lineWidth = (3 + r() * 6) * s; c.beginPath(); c.moveTo(x, y); c.lineTo(x + l, y + (r() - 0.5) * 3); c.stroke(); }
      c.restore(); }
    // folded forelimb and hindlimb, pressed back along the flanks
    G(L([[-10, 40], [30, 52], [80, 76], [92, 84], [70, 84], [26, 66], [-6, 54]]), mix(WATER_IN, OLIVE_DK, 0.55), 702, { a: 0.16 * A, wob: 4 });
    G(L([[380, 60], [440, 70], [520, 82], [548, 92], [520, 94], [450, 84], [386, 72]]), mix(WATER_IN, OLIVE_DK, 0.55), 703, { a: 0.16 * A, wob: 4 });
    // the lower jaw under the surface, and the pale throat
    G(L([[-300, 6], [-220, 16], [-110, 22], [-60, 18], [-90, 8], [-200, 6]], hs, hT), mix(WATER_IN, CREAM, 0.3), 704, { a: 0.35 * A });
    if (layer === "under") return;
  }

  // ---- the back above water: a band from the waterline up to the crest line
  const xs: number[] = []; for (let x = -40; x <= 930; x += 10) xs.push(x);
  const top = xs.map((x) => [x, backY(x, ps)] as P), waterL: P[] = xs.slice().reverse().map((x) => [x, 0] as P);
  // ONE silhouette, head to tail: the skull's top line runs straight on into the back, so no seam shows at the neck
  const skull: P[] = [[-40, -30], [-62, -34], [-86, -39], [-100, -42], [-112, -45], [-126, -45], [-142, -40], [-172, -34], [-210, -29], [-250, -26], [-280, -25], [-298, -21], [-306, -12], [-302, -4], [-260, -4], [-180, -4], [-110, -4], [-60, -2], [-30, 0]];
  const head = L(skull, jT, hT), back = [...head.slice(0, 13).reverse(), ...L(top.slice(1)), ...L(waterL.slice(0, -1)), ...head.slice(13).reverse()];
  if (jaw > 0.05) { // the open mouth: pale pink lining between the lifted upper jaw and the water
    const m: P[] = L([[-300, -2], [-200, -4], [-110, -4]], jT, hT).concat(L([[-100, -2], [-200, 0], [-296, 0]], hs, hT));
    G(m, "#d98f86", 790, { a: 0.95 * A }); G(L([[-280, -1], [-200, -2], [-120, -2], [-200, 0]], hs, hT), "#b0605a", 791, { a: 0.6 * A });
  }  G(back, OLIVE, 710, { tex: { cols: [OLIVE_LIT, OLIVE_DK], n: 160, len: 18 * s, w: 2.4 * s, ang: 0.05, jit: 0.3, a: 0.4 }, mottle: { cols: [OLIVE_DK, OLIVE_LIT], n: 80, r: 6 * s, a: 0.3 }, rim: OLIVE_DK, rimA: 0.5, rimW: 2 * s, wob: 1.2 });
  // darker cross-bands (the mugger's juvenile banding, faded in the adult) and the wet shine
  for (let k = 0; k < 9; k++) { const x0 = 40 + k * 96 + r() * 20, w0 = 22 + r() * 16; c.save(); trace(c, back); c.clip(); G(L([[x0, -90], [x0 + w0, -90], [x0 + w0 * 0.7 + 8, -20], [x0 + w0 * 0.4 + 6, 4], [x0 + 4, 4], [x0 - 4, -30]]), OLIVE_DK, 711 + k, { a: 0.16 * A, wob: 6 }); c.restore(); }
  c.save(); trace(c, back); c.clip(); c.globalAlpha = 0.35 * A; c.strokeStyle = lighten(OLIVE_LIT, 0.4); c.lineWidth = 3 * s; c.lineCap = "round";
  c.beginPath(); top.forEach(([x, y], i) => { const q = W([x, y + 9]); i ? c.lineTo(q[0], q[1]) : c.moveTo(q[0], q[1]); }); c.stroke(); c.restore(); c.globalAlpha = 1;

  // ---- dorsal armour: transverse rows of keeled scutes, seen from a little above (three rows show)
  for (let x = 20; x < 520; x += 24) {
    const y0 = backY(x, ps);
    for (let row = 0; row < 3; row++) {
      const yy = y0 + 5 + row * 7, sc: P[] = [[x - 9, yy + 2], [x - 4, yy - 3 - (row === 0 ? 3 : 1)], [x + 8, yy - 2], [x + 10, yy + 3], [x, yy + 5]];
      G(L(sc.map(([a, b]) => [a + 1.5, b + 2] as P)), OLIVE_DK, 719 + x + row, { a: 0.35 * A }); G(L(sc), mix(OLIVE, OLIVE_LIT, 0.55 - row * 0.2), 720 + x + row, { rim: OLIVE_DK, rimA: 0.35, rimW: 0.9 * s });
    }
  }
  // nuchal scutes: two pairs, larger, just behind the skull
  for (const [x, w] of [[-26, 18], [-4, 18], [22, 15]] as P[]) { const y0 = backY(x, ps); G(L([[x - w / 2, y0 + 4], [x - w / 3, y0 - 6], [x + w / 3, y0 - 7], [x + w / 2, y0 + 3], [x, y0 + 7]]), mix(OLIVE, OLIVE_LIT, 0.6), 760 + x, { rim: OLIVE_DK, rimA: 0.45, rimW: 1.1 * s }); }
  // tail crests: double rows of upright triangles, merging into one
  for (let x = 520; x < 920; x += 17) {
    const y0 = backY(x, ps), h = 13 * (1 - clamp((x - 520) / 460)) + 4, dbl = x < 760;
    for (const off of dbl ? [-4, 4] : [0]) {
      const xx = x + off;
      G(L([[xx - 7, y0 + 2 + (off > 0 ? 3 : 0)], [xx, y0 - h + (off > 0 ? 3 : 0)], [xx + 7, y0 + 2 + (off > 0 ? 3 : 0)]]), off > 0 ? OLIVE_DK : OLIVE_LIT, 780 + xx, { rim: OLIVE_DK, rimA: 0.6, rimW: 1 * s });
    }
  }

  // ---- the head: skull table, raised orbits, the broad snout, nostril rosette, the jaw line with teeth

  // the lit top plane of the snout and skull
  G(L([[-60, -30], [-96, -38], [-140, -34], [-180, -23], [-240, -18], [-282, -22], [-286, -16], [-240, -12], [-180, -14], [-120, -24], [-70, -24]], jT, hT), OLIVE_LIT, 793, { a: 0.55 * A });
  // skin texture: the bumpy sensory pits along the jaw, ridges ahead of the eyes
  for (let i = 0; i < 26; i++) { const x = -290 + i * 7.5 + r() * 3, y = -9 - r() * 6; const [px, py] = L([[x, y]], jT, hT)[0]; c.globalAlpha = 0.5 * A; c.fillStyle = OLIVE_DK; c.beginPath(); c.arc(px, py, (0.9 + r() * 0.8) * s, 0, Math.PI * 2); c.fill(); }
  pen(smooth(L([[-150, -30], [-190, -22], [-230, -19]], jT, hT), 3), 794, 0.35, 0.9);
  // nostril rosette: a raised disc at the tip with two crescent nostrils
  G(L([[-302, -20], [-297, -26], [-286, -27], [-281, -22], [-288, -18]], jT, hT), OLIVE_LIT, 795, { rim: OLIVE_DK, rimA: 0.7, rimW: 1.2 * s });
  for (const [x, y] of [[-295, -22], [-287, -23]] as P[]) { const [px, py] = L([[x, y]], jT, hT)[0]; c.globalAlpha = 0.85 * A; c.fillStyle = "#1f1f12"; c.beginPath(); c.ellipse(px, py, 2.2 * s, 1.2 * s, -0.3, 0, Math.PI * 2); c.fill(); }
  // teeth: the uneven row of a closed crocodile mouth, uppers down and lowers up, interlocking
  const tooth = (x: number, up: boolean, h: number) => { const b = up ? -3 : -5, t: P[] = up ? [[x - 2.6, b], [x, b + h], [x + 2.6, b]] : [[x - 2.4, b], [x, b - h], [x + 2.4, b]]; G(L(t, up ? jT : hs, hT), up ? "#f3ead0" : "#e6dcbc", 800 + Math.round(x), { rim: "#8a7d5a", rimA: 0.6, rimW: 0.6 * s }); };
  for (let x = -292, i = 0; x < -110; x += 11, i++) { const h = 5 + (i % 3 === 1 ? 3 : 0) + jaw * 2; tooth(x, true, h); if (i % 2 === 0) tooth(x + 5.5, false, 4 + (i === 4 ? 4 : 0)); }
  pen(smooth(L([[-302, -4], [-240, -4], [-170, -5], [-110, -4], [-80, -2]], jT, hT), 3), 830, 0.7, 1.3); // the jaw line itself
  // the eyes on their raised orbits: far one barely over the near orbit, near one full
  for (const [ex, ey, sz, far] of [[-122, -44, 0.6, true], [-106, -46, 1, false]] as [number, number, number, boolean][]) {
    const [cx, cy] = L([[ex, ey]], jT, hT)[0], R = 7.5 * sz * s;
    const dome = smooth([[ex - 14 * sz, ey + 8], [ex - 11 * sz, ey - 3], [ex - 4 * sz, ey - 8], [ex + 5 * sz, ey - 8], [ex + 12 * sz, ey - 2], [ex + 14 * sz, ey + 8]], 5, true);
    G(L(dome, jT, hT), far ? darken(OLIVE, 0.08) : OLIVE_LIT, 840 + ex, { rim: OLIVE_DK, rimA: 0.6, rimW: 1.1 * s });
    if (far) continue;
    c.globalAlpha = A; const gr = c.createRadialGradient(cx - R * 0.2, cy - R * 0.2, 0, cx, cy, R); gr.addColorStop(0, "#e9cf5a"); gr.addColorStop(1, "#9a8a2a"); c.fillStyle = gr; c.beginPath(); c.ellipse(cx, cy, R, R * 0.78, 0, 0, Math.PI * 2); c.fill();
    const lk = clamp(ps.look ?? 0, -1, 1); c.fillStyle = "#14140a"; c.beginPath(); c.ellipse(cx + lk * R * 0.42, cy, R * 0.15, R * 0.68, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fffbe8"; c.beginPath(); c.arc(cx - R * 0.35, cy - R * 0.3, 1.3 * s, 0, Math.PI * 2); c.fill();
    // the heavy upper lid: skin over the top of the eyeball, its edge a soft downward curve
    const lid = 1 - clamp(eye), ly = cy - R * 0.95 + R * 1.75 * lid;
    c.save(); c.beginPath(); c.ellipse(cx, cy, R * 1.06, R * 0.84, 0, 0, Math.PI * 2); c.clip();
    c.fillStyle = OLIVE; c.beginPath(); c.moveTo(cx - R * 1.3, cy - R * 1.2); c.lineTo(cx + R * 1.3, cy - R * 1.2); c.lineTo(cx + R * 1.3, ly - R * 0.05); c.quadraticCurveTo(cx, ly + R * 0.35, cx - R * 1.3, ly - R * 0.05); c.closePath(); c.fill(); c.restore();
    pencil(c, { pts: [[cx - R * 1.05, ly + R * 0.02], [cx, ly + R * 0.18], [cx + R * 1.05, ly + R * 0.02]], seed: 851, a: 0.9 * A, w: 1.7 * s, per: 3, retrace: false });
    pencil(c, { pts: [[cx - R * 0.9, cy + R * 0.6], [cx, cy + R * 0.85], [cx + R * 0.9, cy + R * 0.55]], seed: 852, a: 0.45 * A, w: 1 * s, per: 3, retrace: false });
  }
  // graphite: the top line of the head and back, re-stated (broken where the sun lands on it)
  pen(smooth(L(skull.slice(0, 12), jT, hT), 3), 860, 0.55, 1.2);
  pen(smooth(L(top.filter((_, i) => i % 2 === 0 && i > 2 && i < 60)), 3), 861, 0.4, 1);
  c.globalAlpha = 1; void rgba; void ribbonOf; void stroke; void darken;
};
