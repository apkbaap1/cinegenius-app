// THE MONKEY, soft-toon cast (kothi) · one module, posed per shot, never redrawn.
//
// The same character as pt/monkey.ts (a rhesus macaque from the Panchatantra river), redesigned
// for the soft-toon look: the head is about 45 % of his sitting height (a caricature canon,
// DECLARED), eyes enormous and glossy, a bulb nose (a caricature borrowed from the owner's
// references; a real macaque's nose is flat), a wide mobile mouth, big translucent ears, and a fur
// cap that breaks into curly tufts. Anatomy kept from the reference animal: the bare pink face
// framed by fur, the brow ridge, ears set level with the eyes, a pale belly, long arms, hand-like
// feet that grip, a long tail (declared longer than a rhesus tail, as before).
// VIEW: front three-quarter, facing the camera. Local origin = the seat; 1 unit = 1 px at s = 1.
// Sitting height 620.
import type { Ctx, P } from "../core";
import { clamp, mix } from "../gallery";
import { darken, lighten, ribbonOf, smooth, trace } from "../folkTaleKit";
import { blob, clumps, contact, eye, nose, vol } from "./toonKit";

export type ToonMonkeyPose = {
  x: number; y: number; s: number;
  look?: P;          // where the eyes look, -1..1
  lid?: number;      // upper lids, 0 wide open .. 1 shut (blink)
  smile?: number;    // -1 frown .. 1 big smile
  open?: number;     // mouth open 0..1 (talk, gasp)
  brow?: number;     // -1 knitted .. 1 raised
  tilt?: number;     // head tilt, radians
  turn?: number;     // head turn -1 (his right, our left) .. 1
  hands?: P;         // where both hands meet (local); default holding something at the belly
  tail?: number;     // tail sway phase
  breathe?: number;  // 0..1 chest rise
};

export const FUR = "#8a5a34", FUR_DK = "#4a2c16", FUR_LT = "#c99a62", SKIN = "#eaa58a", BELLY = "#e2bf8f";

export const drawToonMonkey = (c: Ctx, ps: ToonMonkeyPose) => {
  const s = ps.s, T = (p: P): P => [ps.x + p[0] * s, ps.y + p[1] * s], L = (pts: P[]) => pts.map(T);
  const br = 1 + 0.015 * (ps.breathe ?? 0), tp = ps.tail ?? 0, turn = clamp(ps.turn ?? 0, -1, 1);
  const HC: P = [turn * 14, -400];                       // head centre
  const H = (p: P): P => { const a = ps.tilt ?? 0, co = Math.cos(a), si = Math.sin(a), dx = p[0], dy = p[1] - HC[1] + 0; const q: P = [HC[0] + dx * co - (dy) * si, HC[1] + dx * si + dy * co]; return T(q); };
  const LH = (pts: P[]) => pts.map(H);

  contact(c, ps.x, ps.y + 6 * s, 190 * s, 26 * s, 0.45);
  // the tail behind him, curling up on his left
  const tc: P[] = [[110, -40], [200, -30], [262, -90], [270, -180 + Math.sin(tp) * 14], [230 + Math.sin(tp) * 18, -250], [196 + Math.sin(tp) * 22, -230]];
  vol(c, ribbonOf(smooth(L(tc), 8), (t) => (16 - 8 * t) * s), FUR, { light: 0.6, rim: 0.4 });
  // the body: a pear, the pale belly, breathing
  const body = blob([[-120, -230 * br], [-55, -272 * br], [55, -272 * br], [120, -230 * br], [152, -120], [142, -22], [80, 8], [-80, 8], [-142, -22], [-152, -120]]);
  vol(c, L(body), FUR, { light: 0.7, ao: 0.35 });
  vol(c, L(blob([[-72, -205 * br], [72, -205 * br], [98, -95], [72, -12], [-72, -12], [-98, -95]])), BELLY, { light: 0.6, shadow: 0.5, rim: 0 });
  // feet: hand-like, gripping the branch, toes curled over its front
  for (const sg of [-1, 1]) {
    vol(c, L(blob([[sg * 60, -70], [sg * 140, -90], [sg * 175, -40], [sg * 160, 0], [sg * 70, 6], [sg * 50, -30]])), FUR, { light: 0.6, ao: 0.4 }); // thigh/shin
    const fx = sg * 120;
    vol(c, L(blob([[fx - 38, -6], [fx + 38, -6], [fx + 44, 18], [fx - 44, 18]])), darken(SKIN, 0.15), { light: 0.6, sss: "#ff8a6a", rim: 0.2 });
    for (let k = 0; k < 4; k++) { const tx = fx - 30 + k * 20; vol(c, L(blob([[tx - 8, 10], [tx + 8, 10], [tx + 9, 30], [tx, 36], [tx - 9, 30]], 4)), darken(SKIN, 0.18), { light: 0.5, rim: 0.15 }); }
  }
  // arms: from the shoulders to the hands, which meet at the belly holding whatever he holds
  const hp = ps.hands ?? [0, -128];
  for (const sg of [-1, 1]) {
    const sh: P = [sg * 118, -222], el: P = [sg * 150, -140], wr: P = [hp[0] + sg * 34, hp[1] + 6];
    vol(c, ribbonOf(smooth(L([sh, [sg * 145, -190], el, [(el[0] + wr[0]) / 2, (el[1] + wr[1]) / 2 + 10], wr]), 8), (t) => (30 - 10 * t) * s), FUR, { light: 0.6, rim: 0.45 });
    vol(c, L(blob([[wr[0] - 26, wr[1] - 16], [wr[0] + 26, wr[1] - 16], [wr[0] + 30, wr[1] + 16], [wr[0], wr[1] + 26], [wr[0] - 30, wr[1] + 16]])), darken(SKIN, 0.1), { light: 0.6, sss: "#ff8a6a", rim: 0.2 });
  }

  // ---- the head
  const ear = (sg: number) => { const ex = HC[0] + sg * 196, ey = HC[1] + 10; vol(c, LH(blob([[ex - 52, ey - 50], [ex + 52, ey - 50], [ex + 58, ey + 40], [ex, ey + 62], [ex - 58, ey + 40]])), SKIN, { light: 0.6, sss: "#ff7a5a", rim: 0.4 }); vol(c, LH(blob([[ex - 28, ey - 26], [ex + 28, ey - 26], [ex + 30, ey + 24], [ex, ey + 36], [ex - 30, ey + 24]])), darken(SKIN, 0.18), { light: 0.3, shadow: 0.6, rim: 0, sss: "#ff6040" }); };
  ear(-1); ear(1);
  const skull = blob([[HC[0] - 190, HC[1] + 40], [HC[0] - 205, HC[1] - 70], [HC[0] - 150, HC[1] - 175], [HC[0] - 50, HC[1] - 215], [HC[0] + 60, HC[1] - 212], [HC[0] + 160, HC[1] - 170], [HC[0] + 208, HC[1] - 60], [HC[0] + 192, HC[1] + 50], [HC[0] + 120, HC[1] + 150], [HC[0], HC[1] + 180], [HC[0] - 120, HC[1] + 150]]);
  vol(c, LH(skull), FUR, { light: 0.8, ao: 0.2 });
  // the bare face: a heart-shaped mask, a fuller muzzle below the eyes
  const fx = HC[0] + turn * 22, fy = HC[1];
  const face = blob([[fx - 150, fy - 70], [fx - 70, fy - 104], [fx, fy - 74], [fx + 70, fy - 104], [fx + 150, fy - 70], [fx + 172, fy + 10], [fx + 146, fy + 100], [fx + 80, fy + 162], [fx, fy + 176], [fx - 80, fy + 162], [fx - 146, fy + 100], [fx - 172, fy + 10]]);
  vol(c, LH(face), SKIN, { light: 0.8, shadow: 0.55, sss: "#ff8a6a", rim: 0.25 });
  vol(c, LH(blob([[fx - 112, fy + 50], [fx, fy + 30], [fx + 112, fy + 50], [fx + 120, fy + 120], [fx, fy + 168], [fx - 120, fy + 120]])), lighten(SKIN, 0.06), { light: 0.55, shadow: 0.45, rim: 0, sss: "#ff8a6a" });
  // brows: the brow ridge as a fur-dark shelf, raised or knitted
  const bw = ps.brow ?? 0;
  for (const sg of [-1, 1]) { const bx = fx + sg * 72, by = fy - 100 - bw * 14, inner = -sg, lift = bw * 10; const pts: P[] = [[bx + inner * 50, by + 6 - lift], [bx, by - 12 - lift * 0.4], [bx - inner * 50, by + 4], [bx - inner * 46, by + 14], [bx, by + 2 - lift * 0.4], [bx + inner * 46, by + 16 - lift]]; vol(c, LH(blob(pts, 5)), FUR_DK, { light: 0.4, rim: 0 }); }
  // eyes
  const lk = ps.look ?? [0, 0], lid = clamp(0.07 + (ps.lid ?? 0) * 0.93);
  for (const sg of [-1, 1]) { const [ex, ey] = H([fx + sg * 68, fy - 30]); eye(c, { x: ex, y: ey, r: 58 * s * (sg === Math.sign(-turn || 1) ? 1.03 : 0.97), look: lk, lid, low: 0.06, iris: "#a0581c", skin: SKIN, tilt: (ps.tilt ?? 0) + sg * 0.05, seed: 31 + sg }); }
  // nose
  const [nx, ny] = H([fx, fy + 58]); nose(c, nx, ny, 40 * s, 30 * s, darken(SKIN, 0.04));
  // mouth: a wide line that smiles or frowns, opening to a dark mouth with a tongue
  const sm = ps.smile ?? 0.4, op = clamp(ps.open ?? 0), my = fy + 118, mw = 86 + sm * 14;
  const curve = (dy: number): P[] => [[fx - mw, my - sm * 16], [fx - mw * 0.5, my + sm * 10 + dy * 0.6], [fx, my + sm * 16 + dy], [fx + mw * 0.5, my + sm * 10 + dy * 0.6], [fx + mw, my - sm * 16]];
  if (op > 0.03) { const inner = [...curve(0), ...curve(op * 54).reverse()]; c.save(); c.fillStyle = "#3a1410"; trace(c, smooth(LH(inner), 6, true)); c.fill(); trace(c, smooth(LH(inner), 6, true)); c.clip(); vol(c, LH(blob([[fx - 40, my + op * 34], [fx + 40, my + op * 34], [fx + 34, my + op * 60], [fx - 34, my + op * 60]])), "#d86a6a", { light: 0.6, rim: 0 }); c.restore(); }
  c.save(); c.strokeStyle = "#5a2418"; c.lineCap = "round"; c.lineWidth = 6 * s; c.beginPath(); smooth(LH(curve(0)), 6).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke();
  // the corners of the mouth dimple in, the lower lip catches the light
  c.globalAlpha = 0.5; c.lineWidth = 3.5 * s; for (const sg of [-1, 1]) { const [qx, qy] = H([fx + sg * mw, my - sm * 16]); c.beginPath(); c.arc(qx - sg * 6 * s, qy, 9 * s, sg < 0 ? Math.PI * 0.6 : -Math.PI * 0.6, sg < 0 ? Math.PI * 1.2 : 0, sg > 0); c.stroke(); }
  c.globalAlpha = 0.35; c.strokeStyle = "#fff0e0"; c.lineWidth = 4 * s; c.beginPath(); smooth(LH(curve(op * 54 + 14).slice(1, 4)), 6).forEach(([x, y], i) => (i ? c.lineTo(x, y) : c.moveTo(x, y))); c.stroke(); c.restore();
  // fur: curly tufts on the crown and round the face edge, cheek tufts sweeping back
  const crown = (r: () => number): P => { const a = Math.PI * (1.05 + r() * 0.9), rr = 175 + r() * 35; return H([HC[0] + Math.cos(a) * rr, HC[1] - 30 + Math.sin(a) * rr]); };
  clumps(c, { n: 90, at: crown, dir: (x, y, r) => Math.atan2(y - H(HC)[1], x - H(HC)[0]) + (r() - 0.5) * 0.6, len: [26 * s, 52 * s], w: 3.4 * s, dark: FUR_DK, light: FUR_LT, curl: 0.9, seed: 71 });
  const cheek = (r: () => number): P => { const sg = r() < 0.5 ? -1 : 1, a = Math.PI * (0.05 + r() * 0.45), rr = 180 + r() * 20; return H([HC[0] + sg * Math.cos(a) * rr, HC[1] + 10 + Math.sin(a) * rr * 0.8]); };
  clumps(c, { n: 50, at: cheek, dir: (x, _y, r) => (x < H(HC)[0] ? Math.PI * 0.9 : Math.PI * 0.1) + (r() - 0.5) * 0.5, len: [22 * s, 40 * s], w: 3 * s, dark: FUR_DK, light: FUR_LT, curl: 0.5, seed: 72 });
  // the chest fur where the head meets the body
  clumps(c, { n: 40, at: (r) => T([(r() - 0.5) * 220, -250 + r() * 30]), dir: (_x, _y, r) => Math.PI / 2 + (r() - 0.5) * 0.8, len: [18 * s, 30 * s], w: 2.6 * s, dark: FUR_DK, light: FUR_LT, curl: 0.4, seed: 73, a: 0.8 });
  c.globalAlpha = 1; void mix;
  return { hands: T(hp) };
};
