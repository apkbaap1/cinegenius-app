// SOFT TOON KIT · the "3D feature-animation" look the owner asked for (2026-10-29, from two
// reference portraits: oversized glossy eyes, a bulbous nose, big curly hair and beards, soft
// rounded volumes under one warm key light, a cool rim, a background thrown out of focus).
//
// MEDIUM, honestly named: this is 2D, painted in code. It borrows the CUES of a rendered
// character, not a renderer: every form is a volume shaded from one light (a warm key high left,
// a cool fill), with a core shadow that wraps away from the light, ambient occlusion where forms
// meet, a thin cool rim on the shadow edge, and a specular glint where a surface is wet or
// glossy (eyes, nose). Skin and ears glow warmer at their thin edges (the subsurface cue). Hair
// and fur are clumps of tapered strands, dark at the root and catching the light at the tip. The
// background is drawn sharp and then blurred (Gfx.group blur), so depth of field is real blur of
// real shapes, never disc bokeh.
// ORDER: background (blurred) -> ground/branch -> far limbs -> body -> near limbs -> head volume
// -> face -> eyes -> nose -> mouth -> hair/fur clumps over the edges -> glints last.
import { rng, type Ctx, type P } from "../core";
import { clamp, mix } from "../gallery";
import { bbox, darken, lighten, rgba, smooth, trace } from "../folkTaleKit";

export const KEY: P = [-0.55, -0.83];     // toward the key light: high, upper left
export const RIM = "#cfe2ff", WARM = "#ffe2b8";

// A rounded volume: base colour, a broad soft light toward the key, a core shadow that wraps the
// far side, a cool rim on the edge away from the light, and occlusion at the bottom.
export type Vol = { light?: number; shadow?: number; rim?: number; ao?: number; sss?: string; spec?: number; edge?: string };
export const vol = (c: Ctx, pts: P[], base: string, o: Vol = {}) => {
  const [x0, y0, x1, y1] = bbox(pts), cx = (x0 + x1) / 2, cy = (y0 + y1) / 2, R = Math.max(x1 - x0, y1 - y0) / 2;
  const lx = cx + KEY[0] * R * 0.55, ly = cy + KEY[1] * R * 0.55;
  c.save(); c.globalAlpha = 1; c.fillStyle = base; trace(c, pts); c.fill(); trace(c, pts); c.clip();
  // core shadow: dark toward the edges that face away from the light
  let g = c.createRadialGradient(lx, ly, R * 0.15, lx, ly, R * 1.75);
  g.addColorStop(0, rgba(darken(base, 0.0), 0)); g.addColorStop(0.55, rgba(darken(base, 0.35), 0)); g.addColorStop(1, rgba(darken(base, 0.55), o.shadow ?? 0.85));
  c.fillStyle = g; c.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  // the broad light
  g = c.createRadialGradient(lx, ly, 0, lx, ly, R * 0.95);
  g.addColorStop(0, rgba(lighten(mix(base, WARM, 0.3), 0.32), o.light ?? 0.75)); g.addColorStop(1, rgba(base, 0));
  c.fillStyle = g; c.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4);
  // subsurface: thin edges glow warm (ears, fingers, the nose tip)
  if (o.sss) { g = c.createRadialGradient(cx, cy, R * 0.35, cx, cy, R * 1.05); g.addColorStop(0, rgba(o.sss, 0)); g.addColorStop(1, rgba(o.sss, 0.45)); c.fillStyle = g; c.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4); }
  // occlusion at the bottom where the form sits on what is under it
  if (o.ao) { g = c.createLinearGradient(0, y1 - (y1 - y0) * 0.35, 0, y1); g.addColorStop(0, rgba("#20140c", 0)); g.addColorStop(1, rgba("#20140c", o.ao)); c.fillStyle = g; c.fillRect(x0 - 2, y0 - 2, x1 - x0 + 4, y1 - y0 + 4); }
  // the cool rim on the shadow side
  if ((o.rim ?? 0.5) > 0) { const gx = c.createLinearGradient(lx, ly, cx - KEY[0] * R, cy - KEY[1] * R); gx.addColorStop(0, rgba(RIM, 0)); gx.addColorStop(0.75, rgba(RIM, 0)); gx.addColorStop(1, rgba(RIM, o.rim ?? 0.5)); c.strokeStyle = gx; c.lineWidth = Math.max(2, R * 0.07); trace(c, pts); c.stroke(); }
  // a wet/glossy glint
  if (o.spec) { c.globalAlpha = o.spec; c.fillStyle = "#fffaf0"; c.beginPath(); c.ellipse(cx + KEY[0] * R * 0.42, cy + KEY[1] * R * 0.45, R * 0.2, R * 0.12, -0.6, 0, Math.PI * 2); c.fill(); c.globalAlpha = o.spec * 0.6; c.beginPath(); c.arc(cx + KEY[0] * R * 0.15, cy + KEY[1] * R * 0.62, R * 0.05, 0, Math.PI * 2); c.fill(); }
  c.restore();
  if (o.edge) { c.save(); c.globalAlpha = 0.55; c.strokeStyle = o.edge; c.lineWidth = Math.max(1, R * 0.012); trace(c, pts); c.stroke(); c.restore(); }
};
// a closed, smooth shape from authored control points
export const blob = (pts: P[], per = 8) => smooth(pts, per, true);

// The big glossy eye: shaded sclera, a deep iris with a dark limbal ring and radial fibres, a
// pupil, two catchlights, the lid's skin over the top and its shadow on the eyeball.
export type Eye = { x: number; y: number; r: number; look?: P; lid?: number; low?: number; iris?: string; skin: string; tilt?: number; seed: number };
export const eye = (c: Ctx, E: Eye) => {
  const { x, y, r } = E, lk = E.look ?? [0, 0], iris = E.iris ?? "#9a5420", lid = clamp(E.lid ?? 0.18), low = clamp(E.low ?? 0.05), tilt = E.tilt ?? 0, rr = rng(E.seed);
  c.save(); c.translate(x, y); c.rotate(tilt);
  // socket shadow around the eye
  let g = c.createRadialGradient(0, 0, r * 0.9, 0, 0, r * 1.35); g.addColorStop(0, rgba("#3a1f14", 0.35)); g.addColorStop(1, rgba("#3a1f14", 0)); c.fillStyle = g; c.beginPath(); c.arc(0, 0, r * 1.35, 0, Math.PI * 2); c.fill();
  c.beginPath(); c.ellipse(0, 0, r, r * 1.04, 0, 0, Math.PI * 2); c.save(); c.clip();
  // sclera: never pure white, shaded as a ball, darker at the top under the lid
  g = c.createRadialGradient(-r * 0.3, -r * 0.35, r * 0.1, 0, 0, r * 1.05); g.addColorStop(0, "#fffdf8"); g.addColorStop(0.7, "#ece6dc"); g.addColorStop(1, "#c9bfb2"); c.fillStyle = g; c.fillRect(-r * 1.2, -r * 1.2, r * 2.4, r * 2.4);
  const ix = lk[0] * r * 0.38, iy = lk[1] * r * 0.3, ir = r * 0.52;
  g = c.createRadialGradient(ix - ir * 0.2, iy - ir * 0.25, ir * 0.1, ix, iy, ir); g.addColorStop(0, lighten(iris, 0.45)); g.addColorStop(0.55, iris); g.addColorStop(0.85, darken(iris, 0.45)); g.addColorStop(1, darken(iris, 0.75));
  c.fillStyle = g; c.beginPath(); c.arc(ix, iy, ir, 0, Math.PI * 2); c.fill();
  c.lineCap = "round"; for (let i = 0; i < 46; i++) { const a = (i / 46) * Math.PI * 2 + rr() * 0.1, r0 = ir * (0.38 + rr() * 0.1), r1 = ir * (0.8 + rr() * 0.15); c.globalAlpha = 0.25 + rr() * 0.25; c.strokeStyle = rr() < 0.5 ? lighten(iris, 0.5) : darken(iris, 0.5); c.lineWidth = Math.max(0.6, r * 0.018); c.beginPath(); c.moveTo(ix + Math.cos(a) * r0, iy + Math.sin(a) * r0); c.lineTo(ix + Math.cos(a) * r1, iy + Math.sin(a) * r1); c.stroke(); }
  c.globalAlpha = 1; c.fillStyle = "#120a06"; c.beginPath(); c.arc(ix, iy, ir * 0.42, 0, Math.PI * 2); c.fill();
  // the lid's shadow cast on the eyeball, then the lids themselves
  const top = -r * 1.05 + lid * r * 2.0;
  g = c.createLinearGradient(0, top - r * 0.05, 0, top + r * 0.5); g.addColorStop(0, rgba("#2a160c", 0.55)); g.addColorStop(1, rgba("#2a160c", 0)); c.fillStyle = g; c.fillRect(-r * 1.2, top, r * 2.4, r * 0.6);
  // the lids follow the eyeball: the upper lid's edge bows down at the middle, the lower one up
  c.fillStyle = E.skin; c.beginPath(); c.moveTo(-r * 1.2, -r * 1.3); c.lineTo(r * 1.2, -r * 1.3); c.lineTo(r * 1.2, top - r * 0.12); c.quadraticCurveTo(0, top + r * 0.22, -r * 1.2, top - r * 0.12); c.closePath(); c.fill();
  const bot = r * 1.05 - low * r * 2; c.beginPath(); c.moveTo(-r * 1.2, r * 1.3); c.lineTo(r * 1.2, r * 1.3); c.lineTo(r * 1.2, bot + r * 0.1); c.quadraticCurveTo(0, bot - r * 0.16, -r * 1.2, bot + r * 0.1); c.closePath(); c.fill();
  c.restore();
  // lid edges: a soft darker line where the lid meets the eye, and the crease above
  c.strokeStyle = darken(E.skin, 0.45); c.lineWidth = Math.max(1.5, r * 0.07); c.lineCap = "round";
  c.beginPath(); c.ellipse(0, 0, r * 1.0, r * 1.04, 0, Math.PI * 1.04, Math.PI * 1.96); c.globalAlpha = lid > 0.02 ? 0.9 : 0.6; c.stroke();
  c.globalAlpha = 0.4; c.lineWidth = Math.max(1, r * 0.04); c.beginPath(); c.ellipse(0, -r * 0.08, r * 1.12, r * 1.15, 0, Math.PI * 1.1, Math.PI * 1.85); c.stroke();
  // catchlights last: a soft window above-left, a small sharp one below-right
  c.globalAlpha = 0.95; c.fillStyle = "#ffffff"; c.beginPath(); c.ellipse(ix - ir * 0.38, iy - ir * 0.42, ir * 0.24, ir * 0.18, -0.5, 0, Math.PI * 2); c.fill();
  c.globalAlpha = 0.7; c.beginPath(); c.arc(ix + ir * 0.35, iy + ir * 0.38, ir * 0.08, 0, Math.PI * 2); c.fill();
  c.restore(); c.globalAlpha = 1;
};

// A bulbous nose: a glossy volume with a strong glint, nostril shadows and a soft cast shadow below.
export const nose = (c: Ctx, x: number, y: number, rx: number, ry: number, skin: string) => {
  c.save(); c.globalAlpha = 0.35; const g = c.createRadialGradient(x + rx * 0.2, y + ry * 1.05, 0, x + rx * 0.2, y + ry * 1.05, rx * 1.2); g.addColorStop(0, "#3a1a10"); g.addColorStop(1, rgba("#3a1a10", 0)); c.fillStyle = g; c.fillRect(x - rx * 1.5, y, rx * 3, ry * 2.4); c.restore();
  const pts = blob([[x - rx * 0.95, y + ry * 0.2], [x - rx * 0.7, y - ry * 0.75], [x, y - ry], [x + rx * 0.7, y - ry * 0.75], [x + rx * 0.95, y + ry * 0.2], [x + rx * 0.6, y + ry * 0.92], [x, y + ry], [x - rx * 0.6, y + ry * 0.92]]);
  vol(c, pts, skin, { light: 0.85, shadow: 0.7, rim: 0.35, spec: 0.75, sss: "#ff8a6a" });
  c.save(); c.fillStyle = "#4a1d14"; c.globalAlpha = 0.75;
  for (const s of [-1, 1]) { c.beginPath(); c.ellipse(x + s * rx * 0.42, y + ry * 0.72, rx * 0.18, ry * 0.1, s * 0.4, 0, Math.PI * 2); c.fill(); }
  c.restore();
};

// Hair and fur as clumps of tapered strands: each clump a little sweep of 4-9 strands, dark at
// the root, light at the tip on the key side. `curl` > 0 bends each strand into a ringlet.
export type Clumps = { n: number; at: (r: () => number) => P; dir: (x: number, y: number, r: () => number) => number; len: [number, number]; w: number; dark: string; light: string; curl?: number; seed: number; a?: number };
export const clumps = (c: Ctx, C: Clumps) => {
  const r = rng(C.seed); c.lineCap = "round";
  for (let i = 0; i < C.n; i++) {
    const [x, y] = C.at(r), d = C.dir(x, y, r), L = C.len[0] + (C.len[1] - C.len[0]) * r(), k = 4 + Math.floor(r() * 6), curl = (C.curl ?? 0) * (0.6 + r() * 0.8) * (r() < 0.5 ? -1 : 1);
    const lit = clamp(0.5 - (Math.cos(d) * KEY[0] + Math.sin(d) * KEY[1]) * 0.25 + (KEY[0] * (x % 97) + KEY[1] * (y % 89)) * 0);
    for (let s = 0; s < k; s++) {
      const ox = (r() - 0.5) * C.w * 2.2, oy = (r() - 0.5) * C.w * 2.2, l = L * (0.7 + r() * 0.4), w = C.w * (0.5 + r() * 0.7);
      const pts: P[] = []; let a = d + (r() - 0.5) * 0.3, px = x + ox, py = y + oy;
      for (let t = 0; t <= 10; t++) { pts.push([px, py]); a += curl * 0.32; px += Math.cos(a) * l / 10; py += Math.sin(a) * l / 10; }
      for (let t = 0; t < pts.length - 1; t++) {
        const u = t / (pts.length - 1); c.globalAlpha = (C.a ?? 1) * (0.55 + 0.45 * (1 - u)); c.strokeStyle = mix(C.dark, C.light, clamp(u * 0.9 * (0.6 + lit))); c.lineWidth = w * (1 - u * 0.75);
        c.beginPath(); c.moveTo(pts[t][0], pts[t][1]); c.lineTo(pts[t + 1][0], pts[t + 1][1]); c.stroke();
      }
    }
  }
  c.globalAlpha = 1;
};

// a soft contact shadow under anything that rests on something
export const contact = (c: Ctx, x: number, y: number, rx: number, ry: number, a = 0.4) => { c.save(); const g = c.createRadialGradient(x, y, 0, x, y, rx); g.addColorStop(0, rgba("#1e140c", a)); g.addColorStop(1, rgba("#1e140c", 0)); c.translate(x, y); c.scale(1, ry / rx); c.translate(-x, -y); c.fillStyle = g; c.fillRect(x - rx, y - rx, rx * 2, rx * 2); c.restore(); };
