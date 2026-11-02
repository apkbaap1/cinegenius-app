// KALIYA-5 — the math. No three.js here. Real units: metres, kilograms, seconds, radians.
//
// One state object drives everything (gait phase, raise, coil, flare, gaze, strike, jaw, explode, build, swim).
// pose(state) returns a frame (position + 3x3 rotation, columns = right, up, forward) for every module, neck
// segment, head and hood rib; readouts(state, pose) computes every number the console shows from that same pose.
//
// Locomotion is Hirose's serpenoid curve: the body's heading along its length is
//   theta(s) = alpha * cos(psi + beta * i)
// so the relative angle of joint i is  phi_i = -2 alpha sin(beta/2) sin(psi + beta (i + 1/2))  — a travelling wave.

export const SPEC = {
  nGround: 36, // body modules on the ground, each with a 2-axis (yaw + pitch) joint
  nTrunk: 8, // modules that rear the front of the body up off the ground
  segL: 0.3, // module pitch, m
  trunkL: 0.27,
  nNeck: 6, // segments per neck
  neckL: 0.19,
  heads: 5,
  massModule: 14, // kg, ground module incl. armour
  massTrunk: 16,
  massNeck: 4,
  massHead: 6.5,
  massHub: 42,
  packs: [4, 23], // ground modules [from, to) that carry a 2.4 kWh Li-ion pack
  packKWh: 2.4,
  waves: 1.5, // serpenoid waves along the ground body (K)
  motorTorque: 180, // N·m peak, each harmonic-drive body joint actuator
  trunkJointTorque: 6000, // N·m, each trunk joint: 4 actuators × 1500 N·m
  etaMotor: 0.82,
};
SPEC.nPacks = SPEC.packs[1] - SPEC.packs[0];
SPEC.capacityKWh = SPEC.nPacks * SPEC.packKWh;
SPEC.lengthGround = SPEC.nGround * SPEC.segL;
SPEC.mass =
  SPEC.nGround * SPEC.massModule + SPEC.nTrunk * SPEC.massTrunk + SPEC.heads * (SPEC.nNeck * SPEC.massNeck + SPEC.massHead) + SPEC.massHub;
SPEC.joints = SPEC.nGround * 2 + SPEC.nTrunk * 2 + SPEC.heads * (SPEC.nNeck * 2 + 1) + SPEC.heads * 1; // + jaw + hood

// body radius along the ground chain (0 = base of the trunk, 1 = tail tip)
export const radiusAt = (u) => 0.205 - 0.15 * Math.pow(u, 1.25);
export const neckRadius = (u) => 0.1 - 0.025 * u;

const clamp = (x, a, b) => Math.min(b, Math.max(a, x));
const mix = (a, b, k) => a + (b - a) * k;
export const smooth = (x) => {
  const u = clamp(x, 0, 1);
  return u * u * (3 - 2 * u);
};

// ------------------------------------------------------------- tiny 3x3 algebra (column-major arrays of 9)
const I3 = () => [1, 0, 0, 0, 1, 0, 0, 0, 1];
const mul = (a, b) => {
  const r = new Array(9);
  for (let c = 0; c < 3; c++)
    for (let row = 0; row < 3; row++) r[c * 3 + row] = a[row] * b[c * 3] + a[3 + row] * b[c * 3 + 1] + a[6 + row] * b[c * 3 + 2];
  return r;
};
// rotation about local Y (yaw: positive turns forward toward +right... we use right-handed)
const rotY = (a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, 0, -s, 0, 1, 0, s, 0, c];
};
// rotation about local X (pitch: positive tips forward up)
const rotX = (a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [1, 0, 0, 0, c, s, 0, -s, c];
};
const rotZ = (a) => {
  const c = Math.cos(a), s = Math.sin(a);
  return [c, s, 0, -s, c, 0, 0, 0, 1];
};
const col = (m, i) => [m[i * 3], m[i * 3 + 1], m[i * 3 + 2]];
const add = (p, d, k) => [p[0] + d[0] * k, p[1] + d[1] * k, p[2] + d[2] * k];
// frame whose forward (+Z) is direction d with world-up hint
const frameFromDir = (d, upHint = [0, 1, 0]) => {
  const f = norm(d);
  let r = cross(upHint, f);
  if (Math.hypot(...r) < 1e-6) r = [1, 0, 0];
  r = norm(r);
  const u = cross(f, r);
  return [r[0], r[1], r[2], u[0], u[1], u[2], f[0], f[1], f[2]];
};
const cross = (a, b) => [a[1] * b[2] - a[2] * b[1], a[2] * b[0] - a[0] * b[2], a[0] * b[1] - a[1] * b[0]];
const norm = (a) => {
  const l = Math.hypot(a[0], a[1], a[2]) || 1;
  return [a[0] / l, a[1] / l, a[2] / l];
};

// ------------------------------------------------------------- the default state
export const STATE0 = {
  psi: 0, // gait phase, rad (integrated by the caller from freq)
  freq: 0, // gait frequency, Hz
  alpha: 0.55, // serpenoid winding amplitude, rad
  raise: 1, // 0 flat on the ground .. 1 reared like a cobra
  coil: 1, // 0 straight serpenoid .. 1 coiled spiral
  flare: 0.2, // hood ribs 0 folded .. 1 spread
  gazeYaw: 0, // rad, where the heads look
  gazePitch: 0,
  strike: 0, // 0..1 strike extension
  jaw: 0.1, // 0..1 jaw opening
  explode: 0, // 0..1
  build: 1, // 0..1 assembly progress
  swim: 0, // 0..1 in water
  time: 0, // seconds, for small idle motion only
};

/** Every frame of the machine for one state. */
export function pose(s) {
  const {nGround: N, nTrunk: R, segL, trunkL, nNeck, neckL} = SPEC;
  const ex = s.explode;
  const gap = 1 + 0.55 * ex; // explode spreads the module pitch
  const sink = -0.12 * s.swim; // the body rides a little lower in the water

  // ---------------- ground chain: headings from the trunk base back to the tail
  const beta = (2 * Math.PI * SPEC.waves) / N;
  const alpha = s.alpha * (1 + 0.25 * s.swim);
  const headings = new Array(N);
  let rCoil = 0.62;
  let thCoil = Math.PI; // the coil leaves the trunk base heading back, then curls around it
  for (let i = 0; i < N; i++) {
    // serpenoid: the body trails behind (heading pi = toward -x)
    const serp = Math.PI + alpha * Math.cos(s.psi + beta * i);
    headings[i] = mix(serp, thCoil, smooth(s.coil));
    thCoil += segL / rCoil; // spiral outward: constant arc step, radius growing ~0.46 m per turn
    rCoil += (0.46 * segL) / (2 * Math.PI * rCoil);
  }
  const ground = [];
  let p = [0, 0, 0];
  for (let i = 0; i < N; i++) {
    const h = headings[i];
    const dir = [Math.cos(h), 0, Math.sin(h)];
    const u = i / (N - 1);
    const r = radiusAt(u);
    // the coil stacks a little so turns rest on each other
    const turnLift = smooth(s.coil) * Math.max(0, 0.08 - i * 0.002);
    const centre = add(p, dir, (segL * gap) / 2);
    // a module points the way the snake travels (toward the head): forward = -dir
    ground.push({pos: [centre[0], r + turnLift + sink, centre[2]], R: frameFromDir([-dir[0], 0, -dir[2]]), r, len: segL, i});
    p = add(p, dir, segL * gap);
  }
  const base = [0, 0, 0];
  // centre the snake's mass sideways (the trunk base sways, the body stays in frame)
  if (s.coil < 0.999) {
    let mz = 0;
    for (const g of ground) mz += g.pos[2];
    mz /= N;
    const k = 1 - smooth(s.coil);
    for (const g of ground) g.pos[2] -= mz * k;
    base[2] -= mz * k;
  }

  // joint angles along the ground chain (yaw), the travelling wave the chart draws
  const jointYaw = new Array(N - 1);
  for (let i = 0; i < N - 1; i++) {
    let d = headings[i + 1] - headings[i];
    d = Math.atan2(Math.sin(d), Math.cos(d));
    jointYaw[i] = d;
  }

  // ---------------- trunk: rears up from the base. Pitch distributed as a sine bump, total ~100° when fully raised
  const trunk = [];
  const raise = smooth(s.raise);
  const h0 = Math.PI + (headings[0] - Math.PI) * 0.3; // the trunk turns only a little with the wave
  const fwd0 = norm([-Math.cos(h0), 0, -Math.sin(h0)]);
  let Rt = frameFromDir(fwd0);
  let pt = [base[0], ground[0].r * 0.6 + sink, base[2]];
  const totalPitch = raise * (1.62 + 0.06 * Math.sin(s.time * 0.9)) - 0.45 * s.strike * raise;
  const trunkPitch = [];
  for (let k = 0; k < R; k++) {
    const w = Math.sin(((k + 0.5) / R) * Math.PI);
    // first half lifts up, the top tips back over toward the heads (cobra S): negative at the top
    const lean = k < R * 0.62 ? w : -0.3 * w;
    const pk = (totalPitch * lean) / (R * 0.5);
    trunkPitch.push(pk);
    // sway with the gait so it reads as alive
    const yaw = 0.05 * Math.sin(s.psi - k * 0.6) * (1 - s.coil * 0.5) + 0.03 * Math.sin(s.time * 0.7 + k);
    Rt = mul(Rt, mul(rotY(yaw), rotX(-pk)));
    const f = col(Rt, 2);
    const centre = add(pt, f, (trunkL * gap) / 2);
    trunk.push({pos: centre, R: Rt.slice(), r: 0.2 - 0.012 * k, len: trunkL, k});
    pt = add(pt, f, trunkL * gap);
  }
  // hub: the hood core / brain at the top of the trunk
  const hubR = Rt.slice();
  const hub = {pos: add(pt, col(hubR, 2), 0.12 * gap), R: hubR};

  // ---------------- five necks fanning out of the hub, each ending in a head that tracks the gaze
  const necks = [];
  const heads = [];
  const hoods = [];
  const fan = [-0.62, -0.31, 0, 0.31, 0.62];
  const lift = [0.0, 0.1, 0.18, 0.1, 0.0];
  for (let h = 0; h < SPEC.heads; h++) {
    const segs = [];
    const strikeH = s.strike * (h === 2 ? 1 : 0.55); // the centre head leads the strike
    // start: tilt out from the hub's forward (up) axis
    let Rn = mul(hubR, mul(rotZ(0), mul(rotY(fan[h] * (1 + 0.15 * s.flare)), rotX(-0.35 - lift[h]))));
    let pn = add(add(hub.pos, col(hubR, 2), 0.1 * gap), col(Rn, 0), fan[h] * 0.12 * gap);
    // total bend so the head ends level and looking at the gaze; spread is undone toward the tip so heads converge
    const idle = 0.06 * Math.sin(s.time * 1.3 + h * 1.7);
    const bendPitch = -(1.45 + 0.35 * strikeH) * raise - 0.2 + s.gazePitch * 0.8 + idle;
    const bendYaw = -fan[h] * 0.7 + s.gazeYaw * (0.9 - 0.2 * Math.abs(fan[h])) + idle * 0.5;
    const ext = 1 + 0.42 * strikeH; // telescoping neck modules extend on the strike
    for (let j = 0; j < nNeck; j++) {
      const u = (j + 0.5) / nNeck;
      const wP = Math.sin(u * Math.PI) * (Math.PI / 2) / nNeck * 1.0;
      Rn = mul(Rn, mul(rotY(bendYaw * wP), rotX(-bendPitch * wP)));
      const f = col(Rn, 2);
      const L = neckL * ext * gap;
      segs.push({pos: add(pn, f, L / 2), R: Rn.slice(), r: neckRadius(j / (nNeck - 1)), len: neckL * ext, j});
      pn = add(pn, f, L);
    }
    // head: level it so the skull's up is close to world up (a robot stabilises its sensors)
    const fH = col(Rn, 2);
    const Rh = frameFromDir(fH);
    const headPos = add(pn, fH, 0.12 + 0.18 * ex);
    heads.push({pos: headPos, R: Rh, jaw: (0.06 + 0.98 * s.jaw) * 1.05, h});
    necks.push(segs);

    // hood: 4 rib stations on neck segments 1..4, each with a left and right rib
    const ribs = [];
    const len = [0.17, 0.27, 0.3, 0.2];
    for (let k = 0; k < 4; k++) {
      const sg = segs[k];
      const r = col(sg.R, 0);
      const up = col(sg.R, 1);
      const f = col(sg.R, 2);
      for (const side of [-1, 1]) {
        const fl = smooth(s.flare);
        // folded: lying back along the neck; flared: straight out sideways, a touch forward and down
        const folded = norm([r[0] * side * 0.25 - f[0] * 0.95 + up[0] * 0.1, r[1] * side * 0.25 - f[1] * 0.95 + up[1] * 0.1, r[2] * side * 0.25 - f[2] * 0.95 + up[2] * 0.1]);
        const spread = norm([r[0] * side + f[0] * 0.12 - up[0] * 0.18, r[1] * side + f[1] * 0.12 - up[1] * 0.18, r[2] * side + f[2] * 0.12 - up[2] * 0.18]);
        const d = norm([mix(folded[0], spread[0], fl), mix(folded[1], spread[1], fl), mix(folded[2], spread[2], fl)]);
        const root = add(sg.pos, up, -sg.r * 0.2 - 0.05 * ex);
        const L = len[k] * (0.55 + 0.45 * fl);
        ribs.push({root, tip: add(root, d, L), side, k, L});
      }
    }
    hoods.push({ribs, angle: mix(17, 86, smooth(s.flare))});
  }

  // tail fin (swim paddle) on the last module
  const tail = ground[N - 1];

  // ---------------- assembly: modules arrive in order, tail first then up the body, necks, heads, hoods
  const parts = N + R + 1 + SPEC.heads * 2; // ground, trunk, hub, necks, heads
  const arrive = (idx) => smooth((s.build * (parts + 3) - idx) / 3);

  return {ground, trunk, hub, necks, heads, hoods, tail, jointYaw, trunkPitch, base, arrive, order: {N, R}, sink, explode: ex};
}

/** Every number on the console, from the same pose. */
export function readouts(s, P) {
  const g = 9.81;
  const {segL, nGround: N} = SPEC;
  // speed: wave speed along the body times a slip efficiency (land ≈ 0.36 with low-friction belly rollers, water 0.5)
  const beta = (2 * Math.PI * SPEC.waves) / N;
  const waveSpeed = ((2 * Math.PI * s.freq) / beta) * segL; // m/s
  const eta = mix(0.36, 0.5, s.swim);
  const moving = 1 - smooth(s.coil);
  const speed = waveSpeed * eta * moving;
  const lambda = (N * segL) / SPEC.waves;

  // gravity moment the lowest trunk actuator holds: everything above it, times its horizontal reach from the base
  const b = P.trunk[0].pos;
  let M = 0;
  let mAbove = 0;
  const addMass = (pos, m) => {
    M += m * g * Math.hypot(pos[0] - b[0], pos[2] - b[2]);
    mAbove += m;
  };
  for (const t of P.trunk.slice(1)) addMass(t.pos, SPEC.massTrunk);
  addMass(P.hub.pos, SPEC.massHub);
  for (const n of P.necks) for (const sg of n) addMass(sg.pos, SPEC.massNeck);
  for (const h of P.heads) addMass(h.pos, SPEC.massHead);
  const trunkTorque = M / 1000; // kN·m
  // the base is shared by a pair of actuators per joint, geared 2:1 through the spine
  const trunkLoad = clamp(M / SPEC.trunkJointTorque, 0, 1.5);

  // power: locomotion (belly friction on land, drag in water) + holding the trunk + idle electronics
  const mGround = SPEC.nGround * SPEC.massModule;
  const pLand = (0.22 * mGround * g * speed) / SPEC.etaMotor;
  const pWater = (0.5 * 1000 * 0.12 * (0.38 * 2.2) * speed * speed * speed) / SPEC.etaMotor + 60 * s.freq * 10;
  const pLoco = mix(pLand, pWater, s.swim) + 280 * s.freq * moving;
  const pHold = 0.012 * M * smooth(s.raise);
  const pHead = 120 * s.strike + 40 * s.flare + 25;
  const pIdle = 260; // compute, lidar, stereo cameras, cooling
  const power = pLoco + pHold + pHead + pIdle; // W
  const endurance = (SPEC.capacityKWh * 1000) / power; // h

  const maxJoint = Math.max(...P.jointYaw.map(Math.abs));
  const head = P.heads[2];
  return {
    speed,
    waveSpeed,
    lambda,
    freq: s.freq,
    alpha: s.alpha,
    trunkTorque,
    trunkLoad,
    mAbove,
    power,
    endurance,
    maxJoint,
    hoodAngle: P.hoods[2].angle,
    jawDeg: (P.heads[2].jaw * 180) / Math.PI,
    headHeight: head.pos[1],
    reach: Math.hypot(head.pos[0] - P.base[0], head.pos[2] - P.base[2]),
  };
}
