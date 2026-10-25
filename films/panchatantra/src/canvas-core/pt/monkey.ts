// THE MONKEY (kothi) · one module, posed per shot, never redrawn.
//
// ANATOMY (reference, from knowledge): Indian rhesus macaque, Macaca mulatta. Sitting adult about
// 2.4 heads tall from seat to crown. Rounded cranium with a fur cap swept back; a bare, pink-tan
// face with a heavy brow ridge, close-set eyes under it, a short muzzle that juts forward, two
// comma nostrils on a flat nose, a wide thin mouth; small rounded ears set level with the eyes,
// pink inside. Pear-shaped trunk, the belly paler; long arms (the hand reaches the ankle when
// sitting); hands and feet both grasping, five digits, the big toe opposed. DECLARED departure:
// the tail is drawn longer than a rhesus tail (about body length, as a langur's) so the silhouette
// reads at a distance and the tail can act.
// VIEW: three-quarter profile facing the viewer's left. Local origin is the seat (where the rump
// meets whatever he sits on), 1 unit = 1 px at s = 1. Sitting height 200.
import { rng, type Ctx, type P } from "../core";
import { clamp, mix } from "../gallery";
import { darken, gouache, lighten, pencil, ribbonOf, smooth, stroke, trace } from "../folkTaleKit";

export type MonkeyPose = {
  x: number; y: number; s: number;
  head?: number;      // head tilt about the neck, radians (+ = nods down toward the front)
  look?: P;           // pupils' offset, -1..1 each axis
  mouth?: number;     // 0 closed, 1 open (alarm / speech)
  brow?: number;      // -1 frown, 0 rest, 1 raised
  arm?: number;       // near arm swing about the shoulder, radians (+ = forward / up)
  farArm?: number;    // far arm swing
  hand?: P;           // optional override: where the near hand goes (local units), solved two-bone
  legs?: number;      // 0 folded sitting, 1 legs extended for a leap
  tail?: number;      // tail curl phase (radians); the tail tip sways with it
  lean?: number;      // whole-body lean about the seat, radians (+ = forward)
  a?: number;         // overall paint opacity (depth)
};

export const FUR = "#8a6a46", FUR_LIT = "#b08a5c", FUR_DK = "#5a4128", BELLY = "#c9ad86", SKIN = "#d99a86", SKIN_DK = "#b06f5e";

type T = (p: P) => P;
const rot = (c: P, a: number): T => { const co = Math.cos(a), si = Math.sin(a); return ([x, y]) => [c[0] + (x - c[0]) * co - (y - c[1]) * si, c[1] + (x - c[0]) * si + (y - c[1]) * co]; };
const map = (pts: P[], ...fs: T[]) => pts.map((p) => fs.reduce((q, f) => f(q), p));

// ---------------------------------------------------------------- authored shapes (sitting, facing left)
const NECK: P = [-12, -112], SHOULDER: P = [-14, -100], FAR_SHOULDER: P = [6, -104], HIP: P = [20, -24];
const TORSO: P[] = [[-26, -112], [-10, -124], [14, -120], [34, -98], [46, -62], [50, -26], [40, -2], [8, 4], [-20, -2], [-34, -26], [-38, -64], [-34, -94]];
const BELLY_P: P[] = [[-33, -94], [-22, -106], [-14, -84], [-12, -46], [-18, -12], [-30, -20], [-37, -60]];
const CAP: P[] = [[-44, -160], [-40, -180], [-22, -196], [2, -197], [22, -186], [33, -166], [34, -146], [28, -128], [14, -116], [-8, -112], [-26, -118], [-36, -132]];
const FACE: P[] = [[-46, -165], [-32, -173], [-16, -170], [-8, -158], [-9, -142], [-15, -128], [-28, -119], [-44, -120], [-56, -128], [-61, -140], [-58, -152], [-52, -160]];
const EAR: P[] = [[2, -160], [12, -166], [19, -158], [19, -144], [12, -136], [4, -140]];
const EAR_IN: P[] = [[6, -156], [12, -160], [15, -152], [14, -145], [9, -142]];
const THIGH: P[] = [[34, -34], [14, -54], [-24, -60], [-42, -50], [-40, -34], [-8, -22], [28, -4]];
const SHIN: P[] = [[-48, -54], [-30, -54], [-28, -16], [-34, -4], [-50, -6], [-54, -30]];
const FOOT: P[] = [[-60, -2], [-38, -8], [-24, -2], [-26, 6], [-44, 8], [-62, 7]];

const head = (ps: MonkeyPose): T => rot(NECK, ps.head ?? 0);

// two-bone arm: shoulder -> elbow -> wrist, lengths in local units
const arm2 = (sh: P, target: P, l1: number, l2: number, bend = 1): [P, P] => {
  const dx = target[0] - sh[0], dy = target[1] - sh[1], d = Math.min(l1 + l2 - 0.5, Math.hypot(dx, dy)), a = Math.atan2(dy, dx);
  const c = clamp((l1 * l1 + d * d - l2 * l2) / (2 * l1 * d), -1, 1), e = a + bend * Math.acos(c);
  const el: P = [sh[0] + Math.cos(e) * l1, sh[1] + Math.sin(e) * l1], w: P = [sh[0] + Math.cos(a) * d, sh[1] + Math.sin(a) * d];
  return [el, w];
};

// a grasping hand: palm toward the grip, four fingers curled over, the thumb opposed
const handShape = (w: P, dir: number, sz: number): { palm: P[]; fingers: P[][]; thumb: P[] } => {
  const ux = Math.cos(dir), uy = Math.sin(dir), vx = -uy, vy = ux, at = (u: number, v: number): P => [w[0] + ux * u * sz + vx * v * sz, w[1] + uy * u * sz + vy * v * sz];
  const palm = [at(0, -4), at(9, -5), at(12, 0), at(9, 5), at(0, 4)];
  const fingers = [-3.4, -1.1, 1.1, 3.2].map((v, i) => { const L = [5, 6, 5.6, 4.4][i]; return [at(10, v), at(10 + L * 0.7, v * 1.05 + 0.6), at(10 + L * 0.95, v * 1.05 + 2.6), at(10 + L * 0.7, v + 4.2)]; });
  const thumb = [at(4, 4.5), at(8, 7.5), at(11, 7)];
  return { palm, fingers, thumb };
};

const limbShape = (pts: P[], w0: number, w1: number) => { const sm = smooth(pts, 8); return ribbonOf(sm, (t) => (w0 + (w1 - w0) * t) / 2 * Math.sqrt(clamp(t / 0.1)) * Math.sqrt(clamp((1 - t) / 0.1)) + 0.4); };
const furEdge = (c: Ctx, pts: P[], seed: number, col: string, len: number, n: number, a: number, w = 1.1) => {
  const r = rng(seed), s = smooth(pts, 4, true); c.lineCap = "round"; c.strokeStyle = col;
  for (let i = 0; i < n; i++) {
    const k = Math.floor(r() * s.length), p = s[k], q = s[(k + 1) % s.length], tx = q[0] - p[0], ty = q[1] - p[1], tl = Math.hypot(tx, ty) || 1;
    const nx = ty / tl, ny = -tx / tl, l = len * (0.4 + r() * 0.6), bend = 0.6 + (r() - 0.5) * 0.6;
    c.globalAlpha = a * (0.4 + r() * 0.6); c.lineWidth = w * (0.6 + r() * 0.7);
    c.beginPath(); c.moveTo(p[0] - nx * l * 0.4, p[1] - ny * l * 0.4); c.quadraticCurveTo(p[0] + nx * l * 0.3 + tx / tl * l * bend, p[1] + ny * l * 0.3 + ty / tl * l * bend, p[0] + nx * l * 0.7 + tx / tl * l * 0.5, p[1] + ny * l * 0.7 + ty / tl * l * 0.5); c.stroke();
  }
  c.globalAlpha = 1;
};

// Draw the monkey. Paint first (gouache, dry-brush fur), graphite accents last, as the plate does
// for its near figure: the drawing re-stated over the paint at the joins and features.
export const drawMonkey = (c: Ctx, ps: MonkeyPose) => {
  const s = ps.s, A = ps.a ?? 1, lean = ps.lean ?? 0, legs = clamp(ps.legs ?? 0);
  const W: T = ([x, y]) => { const co = Math.cos(lean), si = Math.sin(lean), xx = x * co - y * si, yy = x * si + y * co; return [ps.x + xx * s, ps.y + yy * s]; };
  const L = (pts: P[], ...fs: T[]) => map(pts, ...fs, W);
  const G = (pts: P[], col: string, seed: number, o: Partial<Parameters<typeof gouache>[3]> = {}) => gouache(c, pts, col, { seed, a: A, ...o });
  const fur = (n: number, ang = 1.4) => ({ cols: [FUR_LIT, FUR_DK, lighten(FUR, 0.2)], n, len: 9 * s, w: 1.6 * s, ang, jit: 0.6, a: 0.42 });
  const H = head(ps), pen = (pts: P[], seed: number, a = 0.6, w = 1.1, closed = false) => pencil(c, { pts, seed, a: a * A, w: w * Math.max(0.6, s), closed, per: 3, retrace: false });

  // ---- the tail, behind everything: from the rump, along the seat, the tip curling up
  const tp = ps.tail ?? 0, tc: P[] = [[40, -8], [78, 4], [118, 8], [154, 0], [178, -18 + Math.sin(tp) * 6], [186 + Math.sin(tp) * 6, -44 + Math.cos(tp) * 4], [176 + Math.sin(tp) * 10, -62]];
  const tail = ribbonOf(smooth(L(tc), 6), (t) => (8.5 - 4.5 * t) * s);
  G(tail, FUR, 31, { tex: fur(30, 0.1), rim: FUR_DK, rimA: 0.5, rimW: 1.2 * s });
  furEdge(c, tail, 32, FUR_DK, 5 * s, 40, 0.4 * A);

  // ---- far arm, behind the body: reaches down to grip at the front
  const fa = ps.farArm ?? 0, [fe, fw] = arm2(FAR_SHOULDER, map([[-74, -6]], rot(FAR_SHOULDER, -fa))[0], 52, 50, 1);
  stroke(c, L([FAR_SHOULDER, fe]), 17 * s, 13 * s, darken(FUR, 0.25), A);
  stroke(c, L([fe, fw]), 13 * s, 9 * s, darken(FUR, 0.25), A);
  const fh = handShape(W(fw), Math.atan2(fw[1] - fe[1], fw[0] - fe[0]) + lean, 1.15 * s);
  G(fh.palm, darken(SKIN_DK, 0.15), 33); fh.fingers.forEach((f, i) => stroke(c, smooth(f, 3), 3.4 * s, 2.4 * s, darken(SKIN_DK, 0.2), A));

  // ---- the torso, its paler belly, fur along the contour
  const torso = L(smooth(TORSO, 6, true));
  G(torso, FUR, 40, { tex: fur(140, 1.3), mottle: { cols: [FUR_DK, FUR_LIT], n: 30, r: 5 * s, a: 0.25 }, rim: FUR_DK, rimA: 0.55, rimW: 2 * s, wob: 1.5 });
  // shadow side away from the low left sun: the back and the underside of the rump
  c.save(); trace(c, torso); c.clip(); G(L([[10, -122], [40, -100], [52, -30], [40, 2], [14, 4], [24, -40], [18, -90]]), darken(FUR, 0.28), 41, { a: 0.55 * A }); c.restore();
  G(L(smooth(BELLY_P, 6, true)), BELLY, 42, { tex: { cols: [lighten(BELLY, 0.25), darken(BELLY, 0.2)], n: 50, len: 7 * s, w: 1.3 * s, ang: 1.5, a: 0.4 }, a: 0.9 * A });
  furEdge(c, torso, 43, FUR_DK, 4.5 * s, 60, 0.4 * A);

  // ---- legs: thigh folded up, shin down to the grasping foot (or extended for a leap)
  const legT: T = rot(HIP, -legs * 0.9), shinT: T = ([x, y]) => { const k = rot([-40, -50], legs * 1.9)([x, y]); return legT(k); };
  const thigh = L(smooth(THIGH, 6, true), legT), shin = L(smooth(SHIN, 6, true), shinT), foot = L(smooth(FOOT, 5, true), shinT);
  G(thigh, FUR, 50, { tex: fur(70, 3.3), rim: FUR_DK, rimA: 0.6, rimW: 1.6 * s });
  c.save(); trace(c, thigh); c.clip(); G(L(smooth([[-40, -38], [-8, -26], [28, -6], [32, -22], [0, -40], [-24, -46]], 6, true), legT), darken(FUR, 0.22), 51, { a: 0.4 * A, wob: 2 }); c.restore();
  furEdge(c, thigh, 52, FUR_DK, 6 * s, 40, 0.45 * A);
  G(shin, mix(FUR, FUR_LIT, 0.25), 53, { tex: fur(40, 1.6), rim: FUR_DK, rimA: 0.6, rimW: 1.5 * s });
  G(foot, SKIN_DK, 54, { rim: darken(SKIN_DK, 0.4), rimA: 0.7, rimW: 1.2 * s });
  // toes: four over the edge and the opposed big toe behind
  [[-60, 5], [-55, 7], [-50, 8], [-45, 8]].forEach(([x, y], i) => stroke(c, smooth(L([[x + 3, y - 4], [x, y], [x + 1, y + 5]], shinT), 3), 3.2 * s, 2.4 * s, darken(SKIN_DK, 0.15), A));
  stroke(c, smooth(L([[-28, 0], [-24, 7], [-29, 10]], shinT), 3), 3.4 * s, 2.6 * s, darken(SKIN_DK, 0.2), A);

  // ---- near arm: shoulder to a gripping hand at the front (or the pose's target)
  const aw = ps.arm ?? 0, tgt = ps.hand ?? map([[-84, -4]], rot(SHOULDER, -aw))[0], [el, wr] = arm2(SHOULDER, tgt, 54, 52, 1);
  const SH0: P = [SHOULDER[0] + 6, SHOULDER[1] - 8], el2: P = [el[0] + (el[0] - SHOULDER[0]) * 0.12, el[1] + (el[1] - SHOULDER[1]) * 0.12];
  const upper = limbShape(L([SH0, [(SHOULDER[0] + el[0]) / 2 - 3, (SHOULDER[1] + el[1]) / 2], el2]), 30 * s, 19 * s);
  const el0: P = [el[0] - (wr[0] - el[0]) * 0.1, el[1] - (wr[1] - el[1]) * 0.1];
  const fore = limbShape(L([el0, [(el[0] + wr[0]) / 2, (el[1] + wr[1]) / 2 + 1], wr]), 19 * s, 13 * s);
  G(upper, FUR, 60, { tex: fur(30, 1.9), rim: FUR_DK, rimA: 0.6, rimW: 1.4 * s }); G(fore, mix(FUR, FUR_LIT, 0.3), 61, { tex: fur(30, 2.4), rim: FUR_DK, rimA: 0.6, rimW: 1.4 * s });
  furEdge(c, upper, 62, FUR_DK, 5 * s, 20, 0.4 * A); furEdge(c, fore, 63, FUR_DK, 4 * s, 18, 0.4 * A);
  const hd = handShape(W(wr), Math.atan2(wr[1] - el[1], wr[0] - el[0]) + lean, 1.25 * s);
  G(hd.palm, SKIN_DK, 64, { rim: darken(SKIN_DK, 0.4), rimA: 0.6, rimW: 1 * s });
  hd.fingers.forEach((f) => { stroke(c, smooth(f, 3), 3.6 * s, 2.6 * s, SKIN_DK, A); });
  stroke(c, smooth(hd.thumb, 3), 3.8 * s, 2.8 * s, darken(SKIN_DK, 0.1), A);
  hd.fingers.forEach((f, i) => pen(smooth(f, 3), 70 + i, 0.45, 0.7));

  // ---- the head: fur cap, ear, bare face, then features in graphite and paint
  const cap = L(smooth(CAP, 6, true), H), face = L(smooth(FACE, 6, true), H), ear = L(smooth(EAR, 5, true), H);
  G(cap, FUR, 82, { tex: fur(70, 0.4), mottle: { cols: [FUR_DK, FUR_LIT], n: 14, r: 4 * s, a: 0.2 }, rim: FUR_DK, rimA: 0.5, rimW: 1.6 * s, wob: 1 });
  furEdge(c, cap, 83, FUR_DK, 4 * s, 40, 0.4 * A);
  G(ear, SKIN_DK, 80, { rim: darken(SKIN_DK, 0.4), rimA: 0.6, rimW: 1.2 * s }); G(L(smooth(EAR_IN, 5, true), H), lighten(SKIN, 0.15), 81, { a: 0.8 * A });
  // the crown sweep: fur parted back over the skull
  c.save(); trace(c, cap); c.clip();
  for (let i = 0; i < 9; i++) stroke(c, smooth(L([[-34 + i * 6, -176 + Math.abs(i - 3) * 2], [-26 + i * 7, -186 + Math.abs(i - 4)], [-12 + i * 7, -190]], H), 3), 2 * s, 0.6 * s, i % 2 ? FUR_LIT : FUR_DK, 0.5 * A);
  c.restore();
  G(face, SKIN, 85, { tex: { cols: [lighten(SKIN, 0.2), SKIN_DK], n: 30, len: 6 * s, w: 1.4 * s, ang: 0.2, a: 0.25 }, rim: SKIN_DK, rimA: 0.6, rimW: 1.5 * s, wob: 0.6 });
  { const fr = rng(87); c.lineCap = "round"; const edge = L([[-14, -170], [-7, -160], [-6, -148], [-9, -136], [-15, -126], [-24, -119]], H); for (let i = 0; i < 70; i++) { const k = Math.min(edge.length - 2, Math.floor(fr() * (edge.length - 1))), t = fr(), px = edge[k][0] + (edge[k + 1][0] - edge[k][0]) * t, py = edge[k][1] + (edge[k + 1][1] - edge[k][1]) * t, l = (4 + fr() * 6) * s, an = Math.PI * (0.85 + fr() * 0.3); c.globalAlpha = (0.5 + fr() * 0.5) * A; c.strokeStyle = fr() < 0.5 ? FUR : FUR_LIT; c.lineWidth = (1.4 + fr() * 1.6) * s; c.beginPath(); c.moveTo(px + 3 * s, py); c.quadraticCurveTo(px - l * 0.4, py - l * 0.2, px + Math.cos(an) * l, py + Math.sin(an) * l * 0.4); c.stroke(); } c.globalAlpha = 1; }
  // muzzle shadow under the nose and the cheek turning away
  c.save(); trace(c, face); c.clip(); G(L([[-16, -168], [-8, -156], [-10, -140], [-16, -128], [-26, -120], [-22, -136], [-20, -152]], H), SKIN_DK, 86, { a: 0.55 * A }); c.restore();
  const brow = ps.brow ?? 0, mo = clamp(ps.mouth ?? 0), lk = ps.look ?? [0, 0];
  // brow ridge: a heavy shelf over both eyes, raised or knitted by `brow`
  const BR: P[] = [[-58, -156 - brow * 3], [-46, -163 - brow * 5], [-32, -164 - brow * 6], [-18, -160 - brow * 4]];
  stroke(c, smooth(L(BR, H), 4), 5 * s, 3 * s, darken(SKIN_DK, 0.25), 0.8 * A);
  // eyes: near eye full, far eye narrowed by the turn; amber iris, dark pupil, a catchlight
  for (const [ex, ey, rx, ry] of [[-31, -151, 6.2, 4.6], [-50, -151, 3.6, 4.0]] as [number, number, number, number][]) {
    const [cx, cy] = L([[ex, ey]], H)[0];
    c.globalAlpha = A; c.fillStyle = "#f3e6c8"; c.beginPath(); c.ellipse(cx, cy, rx * s, ry * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#9a6a22"; c.beginPath(); c.ellipse(cx + lk[0] * rx * 0.35 * s, cy + lk[1] * ry * 0.3 * s, rx * 0.62 * s, ry * 0.8 * s, 0, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#1e140c"; c.beginPath(); c.arc(cx + lk[0] * rx * 0.4 * s, cy + lk[1] * ry * 0.35 * s, Math.min(rx, ry) * 0.42 * s, 0, Math.PI * 2); c.fill();
    c.fillStyle = "#fffbe8"; c.beginPath(); c.arc(cx + (lk[0] * rx * 0.4 - rx * 0.25) * s, cy + (lk[1] * ry * 0.35 - ry * 0.3) * s, 1.1 * s, 0, Math.PI * 2); c.fill();
    // upper lid line and the lower lid
    pencil(c, { pts: [[cx - rx * s, cy + 0.5 * s], [cx, cy - ry * 1.15 * s], [cx + rx * s, cy - 0.5 * s]], seed: 90 + ex, a: 0.85 * A, w: 1.4 * s, per: 3, retrace: false });
    pencil(c, { pts: [[cx - rx * 0.8 * s, cy + ry * 0.6 * s], [cx, cy + ry * 1.05 * s], [cx + rx * 0.8 * s, cy + ry * 0.5 * s]], seed: 95 + ex, a: 0.4 * A, w: 0.8 * s, per: 3, retrace: false });
  }
  // nose: flat, two comma nostrils; the philtrum; the mouth (opens to show a dark gap and lower lip)
  const nz = L([[-58, -141], [-54, -138]], H); for (const [x, y] of nz) { c.globalAlpha = 0.8 * A; c.fillStyle = "#4a2a20"; c.beginPath(); c.ellipse(x, y, 1.8 * s, 1.2 * s, 0.5, 0, Math.PI * 2); c.fill(); }
  pen(smooth(L([[-55, -136], [-54, -131]], H), 3), 101, 0.5, 0.8);
  const m0: P = [-59, -129], m1: P = [-40, -126];
  if (mo > 0.05) {
    const gap: P[] = [m0, [-50, -129 - mo * 1], m1, [-46, -126 + mo * 9], [-54, -127 + mo * 8]];
    G(L(gap, H), "#5a2a24", 102, { a: 0.95 * A });
    G(L([[-56, -127 + mo * 7.5], [-50, -125 + mo * 9], [-44, -125 + mo * 8], [-49, -124 + mo * 6]], H), "#e8b0a0", 103, { a: 0.9 * A }); // tongue
  }
  pen(smooth(L([m0, [-52, -129.5 - mo], [-45, -128], m1], H), 4), 104, 0.85, 1.2);
  pen(smooth(L([[-56, -122 + mo * 8], [-48, -119 + mo * 9], [-40, -122 + mo * 4]], H), 3), 105, 0.4, 0.9); // chin
  // cheek blush in the storybook manner
  { const [bx, by] = L([[-36, -136]], H)[0], gr = c.createRadialGradient(bx, by, 0, bx, by, 10 * s); gr.addColorStop(0, "rgba(214,110,96,0.38)"); gr.addColorStop(1, "rgba(214,110,96,0)"); c.globalAlpha = A; c.fillStyle = gr; c.fillRect(bx - 12 * s, by - 12 * s, 24 * s, 24 * s); }

  // ---- graphite over the paint: contours re-stated at the joins (lighter where the light hits)
  pen(face.slice(Math.round(face.length * 0.3), Math.round(face.length * 0.85)), 110, 0.55, 1.1);
  pen(smooth(L([[-34, -94], [-36, -70], [-30, -40]]), 3), 111, 0.35, 0.9);  // belly seam
  pen(smooth(L(THIGH.slice(0, 4), legT), 3), 112, 0.5, 1.1);                  // top of the thigh against the belly
  pen(smooth(L([[-46, -50], [-49, -30], [-50, -8]], shinT), 3), 113, 0.5, 1);  // front of the shin
  pen(ear.slice(0, Math.round(ear.length * 0.8)), 114, 0.6, 1);
  pen(smooth(L([[-14, -100], [-20, -86]]), 3), 115, 0.4, 0.9);                // armpit crease
  c.globalAlpha = 1;
  return { hand: W(wr) };
};
