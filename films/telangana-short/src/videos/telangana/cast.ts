// Our cast as lit flat sprites in the 3D world. Each frame every character asks for a drawing (a key + a draw call);
// the pool keeps one canvas per distinct drawing, so soldiers marching in step share canvases (7 head shapes x 4
// outfits). Characters are yaw-only billboards shaded by cardShade() (scene tint, bright floor, side gradient toward
// the sun, painted crescent in the drawing); standing ones get a soft multiply contact blob. Effects are unlit cards.
// Cards, effects and blobs live on the NOINK layer so the world ink pass never outlines their quads.
import * as THREE from "three";
import {
  Pen, bodyFront, bodySide, fxBurst, fxShadow, fxContact, fxPaper, fxHand, fxGavel, fxFirework,
  student, woman, PROFESSOR, leader, villager, miner, kidIn, worker, lawyer, driver, Outfit, Expr, FrontOpts, SideOpts,
} from "./toon";
import {
  FPS, D0, FILES, ROW_GAP, STUDENTS, SHOTS, V3, W, marchFront, marchPhase, busZ, smooth, clamp01, HOOK_AT, TABLE_AT, TOP_FLOWER,
} from "./story";
import { QUAY_Z, CANOPY, VIL, BK, FIELDS, DELHI, MINE, BUS, SHOPS, GATE } from "./places";
import { LIGHTS } from "./lights";
import { NOINK } from "./ink";
import { cardShade, blobMaterial, CARD_K } from "./cardshade";

// ---------------- canvas pool ----------------
type Entry = { cv: HTMLCanvasElement; tex: THREE.CanvasTexture; w: number; h: number };
export type Req = { key: string; w: number; h: number; k: number; draw: (p: Pen) => void; tex?: THREE.CanvasTexture };
const makeEntry = (w: number, h: number): Entry => {
  const cv = document.createElement("canvas");
  cv.width = w; cv.height = h;
  const tex = new THREE.CanvasTexture(cv);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  return { cv, tex, w, h };
};
export class Pool {
  private live = new Map<string, Entry>();
  private free: Entry[] = [];
  private reqs: Req[] = [];
  req(key: string, w: number, h: number, k: number, draw: (p: Pen) => void) {
    const r: Req = { key: `${w}x${h}|${key}`, w, h, k, draw };
    this.reqs.push(r);
    return r;
  }
  flush() {
    const want = new Map<string, Req[]>();
    for (const r of this.reqs) { const l = want.get(r.key); if (l) l.push(r); else want.set(r.key, [r]); }
    for (const [key, e] of this.live) if (!want.has(key)) { this.live.delete(key); this.free.push(e); }
    for (const [key, rs] of want) {
      let e = this.live.get(key);
      if (!e) {
        const r = rs[0], i = this.free.findIndex((x) => x.w === r.w && x.h === r.h);
        e = i >= 0 ? this.free.splice(i, 1)[0] : makeEntry(r.w, r.h);
        const g = e.cv.getContext("2d")!;
        g.setTransform(1, 0, 0, 1, 0, 0); g.clearRect(0, 0, e.w, e.h); g.setTransform(r.k, 0, 0, r.k, 0, 0);
        r.draw(new Pen(g));
        e.tex.needsUpdate = true;
        this.live.set(key, e);
      }
      for (const r of rs) r.tex = e.tex;
    }
    this.reqs = [];
  }
}

// ---------------- sprite meshes ----------------
const blank = (() => { const c = document.createElement("canvas"); c.width = c.height = 2; return new THREE.CanvasTexture(c); })();
export const SU = 0.00216; // metres per design unit: 1000 units = 2.16 m
export const SU_SWING = 2.3 / 1830; // swing canvas: rope of 1830 units = 2.3 m
const BODY = (() => { const g = new THREE.PlaneGeometry(600 * SU, 1000 * SU); g.translate(0, (975 - 500) * SU, 0); return g; })();
const CARD = new THREE.PlaneGeometry(1, 1);
/** world roots that hold actors (to find the scene's sun when world.ts does not pass it) */
const ROOTS = new Set<THREE.Object3D>();

/** lit flat character: cardShade() material, receives shadows (dims to the bright floor only), casts its silhouette
 *  when world.ts says so (golden). Drawn after the contact blobs (renderOrder 1). */
export class Actor {
  mesh: THREE.Mesh; mat: THREE.MeshLambertMaterial; dmat: THREE.MeshDepthMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D, geo: THREE.BufferGeometry = BODY) {
    this.mat = cardShade(new THREE.MeshLambertMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide }));
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.dmat = new THREE.MeshDepthMaterial({ depthPacking: THREE.RGBADepthPacking, map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mesh = new THREE.Mesh(geo, this.mat);
    this.mesh.customDepthMaterial = this.dmat;
    // rim width is in output pixels: tell the card shader the render height (1920 = 1080 x 1920 frame)
    this.mesh.onBeforeRender = (r) => { const rt = r.getRenderTarget(); CARD_K.uPx.value = (rt ? rt.height : r.domElement.height) / 1920; };
    this.mesh.castShadow = false; this.mesh.receiveShadow = true; this.mesh.visible = false;
    this.mesh.rotation.order = "YXZ"; this.mesh.renderOrder = 1; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
    ROOTS.add(parent);
  }
  bind() { const t = this.r?.tex; if (t) { this.mat.map = t; this.dmat.map = t; } }
}
/** unlit effect card: hard cut-out (ink drawings), soft see-through (dust, mist) or a multiply ground blob */
export class Fx {
  mesh: THREE.Mesh; mat: THREE.MeshBasicMaterial; soft: THREE.MeshBasicMaterial; blob: THREE.MeshBasicMaterial; r: Req | null = null;
  constructor(parent: THREE.Object3D) {
    this.mat = new THREE.MeshBasicMaterial({ map: blank, alphaTest: 0.5, side: THREE.DoubleSide });
    this.mat.alphaToCoverage = false; // A2C + MSAA left 1 px sky-depth seams on blurred far cards (POST)
    this.soft = new THREE.MeshBasicMaterial({ map: blank, transparent: true, depthWrite: false, side: THREE.DoubleSide });
    this.blob = blobMaterial(blank);
    this.mesh = new THREE.Mesh(CARD, this.mat);
    this.mesh.visible = false; this.mesh.layers.set(NOINK);
    parent.add(this.mesh);
  }
  use(soft: boolean) { this.mesh.material = soft ? this.soft : this.mat; }
  bind() {
    const t = this.r?.tex;
    if (!t) return;
    if (this.r!.key.includes("|blob|")) {
      // no mipmaps: at grazing views the mip chain averages the blob with its white surround and it fades out
      if (t.generateMipmaps) { t.generateMipmaps = false; t.minFilter = THREE.LinearFilter; t.needsUpdate = true; }
      this.blob.map = t; this.mesh.material = this.blob; this.mesh.renderOrder = 0.5;
    }
    else { this.mat.map = t; this.soft.map = t; this.mesh.renderOrder = 0; }
  }
}

// ---------------- placements ----------------
export type Place = {
  key: string; draw: (p: Pen) => void; x: number; y: number; z: number;
  scale?: number; mirror?: boolean; yaw?: number; geo?: "body" | "swing"; roll?: number; size?: [number, number, number];
};
export type FxPlace = { key: string; cw: number; ch: number; draw: (p: Pen) => void; x: number; y: number; z: number; w: number; h: number; flat?: boolean; rot?: number; soft?: boolean };
/** sun = world direction TOWARD the sun (optional: when absent the scene's shadow-casting light is used) */
export type CamInfo = { pos: THREE.Vector3; right: THREE.Vector3; sun?: THREE.Vector3 };

const hh = (i: number, s = 0) => { const v = Math.sin(i * 127.1 + s * 311.7) * 43758.5453; return v - Math.floor(v); };
const q = (v: number, n = 120) => Math.round(v * n) / n;
const vOf = (i: number) => (i * 7 + (i >> 2)) % 4;
/** head-shape seed: 7 shapes, so marching soldiers in step still share canvases */
const seedOf = (i: number) => ((i * 5 + 3) % 7) + 1;
/** drawing resolution by distance: [canvas w, h, scale from the 600 x 1000 design]; sized for the 1440 x 2560 final */
const tier = (d: number): [number, number, number] =>
  d < 3.2 ? [1800, 3000, 3.0] : d < 6.5 ? [1080, 1800, 1.8] : d < 16 ? [480, 800, 0.8] : [240, 400, 0.4];

// ---------------- light ----------------
const SUN = new THREE.Vector3(0.5, 0.75, -0.4).normalize();
const tmp = new THREE.Vector3();
let LNAME: "day" | "golden" = "day";
const sunOf = (root: THREE.Object3D) => {
  let s: THREE.DirectionalLight | null = null;
  root.traverse((o) => { if (!s && o instanceof THREE.DirectionalLight && o.castShadow) s = o; });
  return s as THREE.DirectionalLight | null;
};
/** the sun of the world that is calling: the attached root whose sun target sits on this camera's view axis */
const findSun = (cam: CamInfo, out: THREE.Vector3) => {
  if (cam.sun) return out.copy(cam.sun).normalize();
  let best: THREE.DirectionalLight | null = null, err = Infinity;
  for (const r of ROOTS) {
    if (!r.parent) continue;
    const s = sunOf(r);
    if (!s) continue;
    const d = tmp.copy(s.target.position).sub(cam.pos), e = Math.abs(d.dot(cam.right)) / (d.length() || 1);
    if (e < err) { err = e; best = s; }
  }
  return best ? out.copy(best.position).sub(best.target.position).normalize() : out;
};
/** canvas angle the sun comes FROM on an upright card facing the camera, in 45-degree steps (small texture cache) */
const light2D = (cam: CamInfo, mirror: boolean) => {
  const sx = SUN.dot(cam.right) * (mirror ? -1 : 1), sy = -SUN.y;
  return Math.round(Math.atan2(sy, sx) / (Math.PI / 4)) * (Math.PI / 4);
};

/** front / side view and mirroring for someone at (x, z) walking along (dx, dz); fs = foreshortening of the walk */
const viewOf = (cam: CamInfo, x: number, z: number, dx: number, dz: number) => {
  const tx = cam.pos.x - x, tz = cam.pos.z - z, tl = Math.hypot(tx, tz) || 1;
  const c = (tx * dx + tz * dz) / tl;
  return { side: c < 0.57, mirror: dx * cam.right.x + dz * cam.right.z < 0, fs: Math.round(Math.sqrt(Math.max(0, 1 - c * c)) * 20) / 20 };
};

// ---------------- life: blinks and reaction timing ----------------
/** reference expression and action changes land 0-3 f before the word onset */
const LEAD = 2 / FPS;
/** eyelid 0 open .. 1 shut. Reference: gaps 0.5-2.3 s, 4-frame blink half / shut / shut / half, plus a blink across
 *  every expression swap (the shut frames hide the swap) */
const LID = [0.5, 1, 1, 0.5];
const lidAt = (t: number, i: number, swaps: number[] = []) => {
  const f = Math.round(t * FPS);
  for (const ts of swaps) { const k = f - Math.round((ts - LEAD) * FPS) + 1; if (k >= 0 && k < 4) return LID[k]; }
  let s = Math.round(-60 * hh(i, 9));
  for (let n = 0; s <= f && n < 400; n++) {
    const k = f - s;
    if (k >= 0 && k < 4) return LID[k];
    s += Math.round(15 + 54 * hh(i * 31 + n, 13)); // next blink 0.5-2.3 s later
  }
  return 0;
};
const fkey = (o: object) => JSON.stringify(o, (_k, v) => (typeof v === "number" ? q(v) : v));

type Who = { i: number; o: Outfit; okey: string };
/** one character drawing in the 600 x 1000 design space, sized by distance, lit from the scene's sun */
const person = (cam: CamInfo, who: Who, x: number, y: number, z: number, view: { side: boolean; mirror: boolean }, fo: FrontOpts, so: SideOpts, scale = 1): Place & { tierKey: string } => {
  const d = cam.pos.distanceTo(tmp.set(x, y + 1.2, z)) / scale;
  const [w, h, k] = tier(d);
  const mirror = view.side && view.mirror, light = light2D(cam, mirror), seed = seedOf(who.i);
  const f2: FrontOpts = { ...fo, light, seed }, s2: SideOpts = { ...so, light, seed };
  const key = view.side ? `S|${who.okey}|${fkey(s2)}` : `F|${who.okey}|${fkey(f2)}`;
  return {
    key, x, y, z, scale, mirror, tierKey: `${w}`,
    draw: (p) => (view.side ? bodySide(p, who.o, s2) : bodyFront(p, who.o, f2)),
    size: [w, h, k],
  };
};

/** ground shadow under a standing / sitting card (review rounds 2-4), multiply, blue-violet: a TIGHT contact pool right under
 *  the feet (~.5 on screen at the core) so nobody floats, plus by day (cards cast no real shadow) a lighter soft tail
 *  stretched AWAY from the sun, length ~1.6 m / tan(sun elevation), capped. Golden: world.ts casts real card shadows. */
const CONTACT: Record<"day" | "golden", [number, number, number]> = { day: [0.2, 0.21, 0.33], golden: [0.24, 0.2, 0.33] };
const TAIL: [number, number, number] = [0.42, 0.44, 0.62];
const toSrgb = (v: number) => { const c = clamp01(v); return c <= 0.0031308 ? 12.92 * c : 1.055 * c ** (1 / 2.4) - 0.055; };
const hexOf = (c: [number, number, number], k: number) => "#" + c.map((v) => Math.round(255 * toSrgb(1 - (1 - v) * k)).toString(16).padStart(2, "0")).join("");
const blob = (out: Stage, x: number, y: number, z: number, sc = 1, k = 1) => {
  const hl = Math.hypot(SUN.x, SUN.z) || 1, ox = -SUN.x / hl, oz = -SUN.z / hl, rot = Math.atan2(-ox, -oz);
  if (LNAME === "day") {
    const el = Math.asin(Math.min(0.99, Math.max(0.1, SUN.y)));
    const len = Math.min(2.4, Math.max(0.5, 1.6 / Math.tan(el))) * sc, h = len + 0.55 * sc, c = 0.3 * h; // feet at v = .2 of the card
    const tc = hexOf(TAIL, k);
    out.fx.push({ key: `blob|shadow|${tc}`, cw: 128, ch: 256, draw: (p) => fxShadow(p, tc), x: x + ox * c, y: y + 0.018, z: z + oz * c,
      w: 0.72 * sc, h, flat: true, rot });
  }
  const cc = hexOf(CONTACT[LNAME], k);
  out.fx.push({ key: `blob|contact|${cc}`, cw: 128, ch: 128, draw: (p) => fxContact(p, cc), x: x + ox * 0.03 * sc, y: y + 0.022, z: z + oz * 0.03 * sc,
    w: 0.52 * sc, h: 0.4 * sc, flat: true, rot });
};

// ---------------- the people of each scene ----------------
export type Stage = { places: Place[]; fx: FxPlace[] };
const G = D0;
const STU = Array.from({ length: 8 }, (_, v) => student(v));
const WOM = Array.from({ length: 7 }, (_, v) => woman(v));
const VILL = Array.from({ length: 4 }, (_, v) => villager(v));
const KIDS = Array.from({ length: 4 }, (_, v) => kidIn(v));
const LAW = Array.from({ length: 3 }, (_, v) => lawyer(v));
const WRK = Array.from({ length: 3 }, (_, v) => worker(v));
const MINER_ON = [0, 1].map((v) => miner(v, true)), MINER_OFF = [0, 1].map((v) => miner(v, false));
/** a mixed townsperson for crowds: students, women, villagers, kids */
const townWho = (i: number): Who => {
  const k = (i * 7 + 3) % 10;
  if (k < 3) return { i, o: STU[i % 8], okey: `st${i % 8}` };
  if (k < 7) return { i, o: WOM[i % 7], okey: `wo${i % 7}` };
  if (k < 9) return { i, o: VILL[i % 4], okey: `vi${i % 4}` };
  return { i, o: KIDS[i % 4], okey: `kd${i % 4}` };
};
const isKid = (w: Who) => w.okey.startsWith("kd");
/** someone standing still (front view), with blinks and an optional wave */
const stand = (cam: CamInfo, t: number, out: Stage, who: Who, x: number, z: number, expr: Expr, wave?: number, y = G, extra: Partial<FrontOpts> = {}) => {
  const sc = isKid(who) || who.o.build === "kid" ? 0.72 : 1;
  out.places.push(person(cam, who, x, y, z, { side: false, mirror: false }, { mode: "stand", expr, wave, blink: lidAt(t, who.i), ...extra }, {}, sc));
  blob(out, x, y, z, sc);
};
const sit = (cam: CamInfo, t: number, out: Stage, who: Who, x: number, z: number, expr: Expr, y = G) => {
  const sc = isKid(who) || who.o.build === "kid" ? 0.72 : 1;
  out.places.push(person(cam, who, x, y, z, { side: false, mirror: false }, { mode: "sit", expr, blink: lidAt(t, who.i) }, {}, sc));
  blob(out, x, y, z, 1.05 * sc, 0.8);
};
const waveAt = (t: number, i: number, speed = 9) => q(Math.sin(t * speed + i * 1.3), 30);

/** 1 the hook: grandfather, mother and child on the promenade at sunrise */
const hook = (cam: CamInfo, t: number, out: Stage) => {
  const [x, , z] = HOOK_AT;
  stand(cam, t, out, { i: 1, o: { ...VILL[0], hair: "#e9e6e0", build: "stout" }, okey: "grandpa" }, x - 0.95, z, "smile_closed");
  stand(cam, t, out, { i: 2, o: WOM[1], okey: "wo1" }, x, z - 0.15, "smile");
  stand(cam, t, out, { i: 3, o: KIDS[0], okey: "kd0" }, x + 0.8, z + 0.1, t > 4 ? "grin" : "smile", t > 4.5 ? waveAt(t, 3, 6) : undefined);
};
/** a light scatter of people on the promenade (aerials) */
const promenade = (cam: CamInfo, t: number, out: Stage, n: number, x0: number, x1: number, cheer = false) => {
  for (let i = 0; i < n; i++) {
    const x = x0 + ((i * 37.3) % 1 + hh(i)) / 2 * (x1 - x0), z = -35.8 + hh(i, 2) * 4.6;
    const who = townWho(i + 300);
    stand(cam, t, out, who, x, z, (["smile", "grin", "smile_closed", "laugh"] as Expr[])[i % 4], cheer && i % 3 !== 1 ? waveAt(t, i) : undefined);
  }
};
/** 3 the promise: two leaders at the table (the paper is an effect card on it), onlookers behind */
const signing = (cam: CamInfo, t: number, out: Stage) => {
  const [x, , z] = TABLE_AT;
  stand(cam, t, out, { i: 10, o: leader(0), okey: "ld0" }, x - 0.75, z - 0.7, t > 17.6 ? "smile" : "neutral");
  stand(cam, t, out, { i: 11, o: leader(1), okey: "ld1" }, x + 0.75, z - 0.7, t > 17.6 ? "smile_closed" : "neutral");
  for (let i = 0; i < 7; i++) stand(cam, t, out, townWho(i + 20), x - 4.2 + i * 1.4 + hh(i) * 0.4, z - 3.2 - hh(i, 3) * 1.6, i % 2 ? "smile" : "neutral");
  const sign = clamp01((t - 16.0) / 1.9), icons = clamp01((t - 19.2) / 0.3) + clamp01((t - 20.1) / 0.3) + clamp01((t - 20.85) / 0.3);
  out.fx.push({ key: `paper|${q(sign, 30)}|${q(icons, 30)}`, cw: 400, ch: 300, draw: (p) => fxPaper(p, q(sign, 30), q(icons, 30)), x, y: G + 0.78, z: z - 0.05, w: 0.56, h: 0.42, flat: true, rot: 0 });
};
/** 4 the 1969 column of students walking toward the lake; fists up from "జై తెలంగాణ" */
const march = (cam: CamInfo, t: number, out: Stage) => {
  const F = marchFront(t), ph = marchPhase(t);
  for (let i = 0; i < STUDENTS; i++) {
    const row = i >> 2, x = FILES[i & 3] + (hh(i) - 0.5) * 0.2, z = F - row * ROW_GAP + (hh(i, 2) - 0.5) * 0.15;
    const who: Who = { i, o: STU[(i * 3) % 8], okey: `st${(i * 3) % 8}` };
    const up = t > W.jai - 0.07 && (i + row) % 2 === 0;
    const expr: Expr = t > W.jai - 0.07 ? (i % 3 ? "stern" : "grin") : (i % 4 === 1 ? "neutral" : "stern");
    const view = viewOf(cam, x, z, 0, 1);
    const fo: FrontOpts = { mode: "stroll", phase: q(ph + hh(i, 4) * 0.08, 60), expr, blink: lidAt(t, i), wave: up ? 1 : undefined };
    const so: SideOpts = { mode: "march", phase: q(ph, 60), expr, stomp: 0.6, stride: 0.8 * view.fs, blink: lidAt(t, i) };
    out.places.push(person(cam, who, x, G, z, view, fo, so));
    blob(out, x, G, z);
  }
  for (let i = 0; i < 10; i++) { // onlookers at the doorways
    const sx = i % 2 ? 1 : -1, z = -60 - i * 4.2 + hh(i) * 2;
    stand(cam, t, out, townWho(i + 60), sx * (5.3 - hh(i, 5) * 0.5), z, i % 3 ? "smile" : "neutral", t > W.jai && i % 3 === 0 ? waveAt(t, i) : undefined);
  }
};
/** 6 the professor explaining under the tree, listeners on the mats */
const teach = (cam: CamInfo, t: number, out: Stage) => {
  const [vx, vz] = VIL;
  const talk = q(0.5 + 0.5 * Math.sin(t * 2.3), 12);
  stand(cam, t, out, { i: 40, o: PROFESSOR, okey: "prof" }, vx + 1.9, vz - 0.3, Math.sin(t * 3.1) > 0.2 ? "smile" : "smile_closed", talk);
  const spots: [number, number][] = [[-1.9, 2.0], [-0.9, 2.3], [0.2, 2.0], [1.2, 2.4], [-1.5, 3.4], [-0.3, 3.6], [0.9, 3.5], [2.0, 3.2]];
  spots.forEach(([dx, dz], k) => {
    const who = k % 3 === 0 ? { i: 41 + k, o: KIDS[k % 4], okey: `kd${k % 4}` } : k % 3 === 1 ? { i: 41 + k, o: STU[k % 8], okey: `st${k % 8}` } : { i: 41 + k, o: VILL[k % 4], okey: `vi${k % 4}` };
    sit(cam, t, out, who, vx + dx, vz + dz, (["smile", "neutral", "smile_closed"] as Expr[])[k % 3]);
  });
};
/** 7 the fast: a man on the mat under the canopy, supporters round him */
const fast = (cam: CamInfo, t: number, out: Stage) => {
  const [cx, cz] = CANOPY;
  sit(cam, t, out, { i: 60, o: { jacket: "#f4f1ea", pants: "#efe9dc", boots: "#5a3b2a", hat: "hair", hair: "#3a2a24", skin: "#c98f62", moustache: "#2a1a14", glasses: true }, okey: "faster" }, cx, cz - 0.2, "neutral");
  for (let i = 0; i < 9; i++) {
    const a = Math.PI * (1.1 + (i / 8) * 0.8), r = 2.3 + hh(i) * 1.2;
    const who = i % 2 ? { i: 61 + i, o: STU[i % 8], okey: `st${i % 8}` } : townWho(61 + i);
    stand(cam, t, out, who, cx + Math.cos(a) * r * 1.4, cz - 0.6 + Math.sin(a) * r * 0.5, i % 3 ? "stern" : "neutral", t > W.delhiYes - 1 && i % 3 === 0 ? waveAt(t, i) : undefined);
  }
};
/** 8 Delhi: the big hand over the building, thumbs up then a raised palm */
const delhi = (cam: CamInfo, t: number, out: Stage) => {
  if (t < W.yes - 0.25) return;
  const kind = t < W.wait - 0.07 ? 0 : 1, t0 = kind ? W.wait - 0.07 : W.yes - 0.25, pop = q(easeBack(clamp01((t - t0) / 0.3)), 30);
  out.fx.push({ key: `hand${kind}`, cw: 400, ch: 400, draw: (p) => fxHand(p, kind), x: DELHI[0], y: G + 36, z: DELHI[1] - 4, w: 22 * pop, h: 22 * pop });
};
const easeBack = (u: number) => { const c = 1.7; return 1 + (c + 1) * (u - 1) ** 3 + c * (u - 1) ** 2; };
/** 9-10 the street: the bus, the people at the shops, the lawyers on the steps of the court */
const street = (cam: CamInfo, t: number, out: Stage, id: number) => {
  const bz = busZ(t);
  if (id === 10 || t > W.halt + 0.5) {
    stand(cam, t, out, { i: 80, o: driver(0), okey: "drv0" }, BUS[0] + 1.9, bz - 3.6, "stern");
    stand(cam, t, out, { i: 81, o: driver(1), okey: "drv1" }, BUS[0] + 2.7, bz - 2.4, "neutral");
  }
  SHOPS.forEach((sz, k) => {
    const who = { i: 85 + k, o: WRK[k % 3], okey: `wk${k % 3}` };
    if (id === 9 && t < W.halt + 0.3 + k * 0.35) stand(cam, t, out, who, -5.0, sz + 1.0, "neutral");
    else sit(cam, t, out, who, -4.8, sz + 1.3, k % 2 ? "stern" : "neutral");
  });
  if (id === 10) {
    for (let k = 0; k < 4; k++) sit(cam, t, out, { i: 90 + k, o: LAW[k % 3], okey: `lw${k % 3}` }, -4.6 + (k % 2) * 0.7, -66.8 - k * 0.9, k % 2 ? "stern" : "neutral");
    for (let k = 0; k < 6; k++) sit(cam, t, out, townWho(95 + k), 1.0 + (k % 3) * 1.1, -60.5 - (k >> 1) * 1.4, "stern");
  }
};
/** 11 the mine: miners at the tunnel mouth; lamps go out one by one on "బొగ్గు గనులు" */
const mine = (cam: CamInfo, t: number, out: Stage) => {
  const [mx, mz] = MINE;
  for (let k = 0; k < 7; k++) {
    const off = t > W.mines + 0.4 + k * 0.17, v = k % 2;
    const x = mx - 3.3 + k * 1.1 + (hh(k) - 0.5) * 0.3, z = mz + 6.0 + (k % 2) * 0.9;
    stand(cam, t, out, { i: 110 + k, o: off ? MINER_OFF[v] : MINER_ON[v], okey: `mn${v}${off ? "x" : "o"}` }, x, z, off ? "stern" : "neutral");
  }
};
/** 12 the Million March on Tank Bund */
const million = (cam: CamInfo, t: number, out: Stage) => {
  let n = 0;
  for (let row = 0; row < 4; row++) for (let i = 0; i < 46; i++) {
    const x = -55 + i * 2.4 + (hh(n) - 0.5) * 1.1 + (row % 2) * 1.2, z = -35.7 + row * 1.25 + (hh(n, 2) - 0.5) * 0.4;
    if (Math.abs(x - CANOPY[0]) < 0.1) { n++; continue; }
    const who = townWho(400 + n);
    stand(cam, t, out, who, x, z, (["grin", "smile", "laugh", "smile_closed"] as Expr[])[n % 4], n % 3 === 0 ? waveAt(t, n, 7) : undefined);
    n++;
  }
};
/** 13 the gavel in front of the building */
const parliament = (cam: CamInfo, t: number, out: Stage) => {
  const k = t < W.gavel - 0.35 ? 0 : t < W.gavel ? 0 : 1;
  const wind = t > W.gavel - 0.5 && t < W.gavel ? -0.25 : 0;
  out.fx.push({ key: `gavel${k}${wind}`, cw: 400, ch: 400, draw: (p) => fxGavel(p, k + wind), x: DELHI[0] + 2, y: G + 6.5, z: DELHI[1] - 40, w: 9, h: 9 });
  if (t >= W.gavel && t < W.gavel + 0.25) {
    const u = q((t - W.gavel) / 0.25, 30);
    out.fx.push({ key: `burst${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u), x: DELHI[0] + 0.5, y: G + 4.4, z: DELHI[1] - 40.5, w: 9, h: 9 });
  }
};
/** 14 the second of June: the street cheering, fireworks over the gate */
const FIRE_COLS = ["#ffcf4a", "#ff6a8a", "#7fe0ff", "#b8ff7a", "#ffffff", "#ff9a3a"];
const june = (cam: CamInfo, t: number, out: Stage) => {
  for (let i = 0; i < 70; i++) {
    const x = (hh(i, 7) - 0.5) * 10.5, z = -79 - (i / 70) * 24 - hh(i, 8) * 1.5;
    stand(cam, t, out, townWho(500 + i), x, z, (["laugh", "grin", "relief_open"] as Expr[])[i % 3], i % 2 ? waveAt(t, i, 10) : undefined);
  }
  for (let k = 0; k < 14; k++) {
    const t0 = W.june + 0.1 + k * 0.42, u = (t - t0) / 1.4;
    if (u < 0 || u >= 1) continue;
    const col = FIRE_COLS[k % 6], uq = q(u, 30);
    out.fx.push({ key: `fw${k % 6}|${uq}`, cw: 500, ch: 500, draw: (p) => fxFirework(p, uq, col, k), x: GATE[0] + (hh(k, 3) - 0.5) * 50, y: G + 42 + hh(k, 4) * 24, z: GATE[1] - 6 + (hh(k, 5) - 0.5) * 20, w: 26, h: 26 });
  }
};
/** 15, 16, 20 Bathukamma: women round the plate (none on the camera's side), clapping as they circle */
const bathukamma = (cam: CamInfo, t: number, out: Stage, id: number) => {
  const [bx, bz] = BK, n = 7;
  for (let k = 0; k < n; k++) {
    const a = Math.PI * (1.08 + (k / (n - 1)) * 0.84) + 0.05 * Math.sin(t * 0.8), r = 1.85;
    const clap = q(0.5 + 0.5 * Math.sin(t * 6.5 + k * 1.1), 6);
    stand(cam, t, out, { i: 130 + k, o: WOM[k % 7], okey: `wo${k % 7}` }, bx + Math.cos(a) * r, bz + Math.sin(a) * r, k % 2 ? "smile_closed" : "grin", clap);
  }
  if (id === 20) {
    stand(cam, t, out, { i: 140, o: KIDS[1], okey: "kd1" }, bx + 0.75, bz + 0.15, t > TOP_FLOWER ? "laugh" : "smile", t > TOP_FLOWER - 0.6 && t < TOP_FLOWER + 0.4 ? 0.2 : undefined);
    if (t >= TOP_FLOWER && t < TOP_FLOWER + 0.5) {
      const u = q((t - TOP_FLOWER) / 0.5, 30);
      out.fx.push({ key: `spark${u}`, cw: 500, ch: 500, draw: (p) => fxBurst(p, u, "#fff3b0", 8, 30, 200), x: bx, y: G + 1.25, z: bz + 0.05, w: 0.6, h: 0.6 });
    }
  }
};
/** 17 every generation, standing behind the finished tower */
const generations = (cam: CamInfo, t: number, out: Stage) => {
  const [bx, bz] = BK;
  const rows: Who[][] = [
    [{ i: 150, o: WOM[0], okey: "wo0" }, { i: 151, o: KIDS[2], okey: "kd2" }, { i: 152, o: WOM[4], okey: "wo4" }, { i: 153, o: KIDS[1], okey: "kd1" }, { i: 154, o: WOM[2], okey: "wo2" }],
    [{ i: 160, o: MINER_ON[0], okey: "mn0o" }, { i: 161, o: driver(0), okey: "drv0" }, { i: 162, o: PROFESSOR, okey: "prof" }, { i: 163, o: LAW[0], okey: "lw0" }, { i: 164, o: WRK[1], okey: "wk1" }, { i: 165, o: MINER_ON[1], okey: "mn1o" }],
    [{ i: 170, o: leader(0), okey: "ld0" }, { i: 171, o: STU[1], okey: "st1" }, { i: 172, o: STU[4], okey: "st4" }, { i: 173, o: VILL[2], okey: "vi2" }, { i: 174, o: STU[6], okey: "st6" }, { i: 175, o: STU[2], okey: "st2" }, { i: 176, o: leader(1), okey: "ld1" }],
  ];
  rows.forEach((r, ri) => r.forEach((who, k) => {
    const x = bx + (k - (r.length - 1) / 2) * 1.05, z = bz - 2.6 - ri * 1.5;
    stand(cam, t, out, who, x, z, (["smile", "smile_closed", "grin"] as Expr[])[(k + ri) % 3]);
  }));
};
/** 19 farmers far out in the paddy */
const fields = (cam: CamInfo, t: number, out: Stage) => {
  for (let k = 0; k < 6; k++) stand(cam, t, out, { i: 180 + k, o: k % 2 ? VILL[k % 4] : WOM[k % 7], okey: k % 2 ? `vi${k % 4}` : `wo${k % 7}` },
    FIELDS[0] - 30 + k * 11 + hh(k) * 4, FIELDS[1] + 8 + hh(k, 2) * 20, "smile");
};

/** everything with a face in shot `id` at time t */
export const stage = (id: number, t: number, cam: CamInfo): Stage => {
  const out: Stage = { places: [], fx: [] };
  const s = SHOTS[id - 1];
  LNAME = s.light;
  findSun(cam, SUN);
  switch (s.scene) {
    case "hook": hook(cam, t, out); promenade(cam, t, out, 14, -30, 30); break;
    case "aerial": promenade(cam, t, out, 40, -60, 60); break;
    case "sign": signing(cam, t, out); break;
    case "march": march(cam, t, out); break;
    case "teach": teach(cam, t, out); break;
    case "fast": fast(cam, t, out); promenade(cam, t, out, 16, 10, 60); break;
    case "delhi": delhi(cam, t, out); break;
    case "halt": case "strike": street(cam, t, out, id); break;
    case "mine": mine(cam, t, out); break;
    case "million": million(cam, t, out); break;
    case "parliament": parliament(cam, t, out); break;
    case "june": june(cam, t, out); break;
    case "bk": bathukamma(cam, t, out, id); break;
    case "gens": generations(cam, t, out); break;
    case "fields": fields(cam, t, out); break;
  }
  return out;
};
export { FPS };
