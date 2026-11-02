// KALIYA-5 — the geometry, built from code. update(state, pose) places every part from the frames kin.js computed.
// Materials are kept per subsystem so any one can be isolated (the rest ghosts out) or lit with the accent.
import * as THREE from 'three';
import {SPEC} from './kin.js';

export const SUBSYS = ['spine', 'power', 'necks', 'heads', 'hood', 'core', 'tail'];
export const ACCENT = '#f08a1c';

const BASE = {
  shell: {color: '#1d4743', metalness: 0.55, roughness: 0.42, envMapIntensity: 0.7},
  scale: {color: '#2c6a5f', metalness: 0.5, roughness: 0.45, envMapIntensity: 0.6},
  belly: {color: '#cfdde3', metalness: 0.15, roughness: 0.5, envMapIntensity: 0.5},
  stripe: {color: '#3a6f9c', metalness: 0.3, roughness: 0.45, envMapIntensity: 0.5},
  steel: {color: '#5b6068', metalness: 0.85, roughness: 0.45, envMapIntensity: 0.6},
  motor: {color: '#2b2f36', metalness: 0.6, roughness: 0.4, envMapIntensity: 0.6},
  copper: {color: '#b8733a', metalness: 0.9, roughness: 0.35, envMapIntensity: 0.6},
  pack: {color: '#2f4a6a', metalness: 0.3, roughness: 0.5, envMapIntensity: 0.5},
  gold: {color: '#c7963f', metalness: 0.85, roughness: 0.33, envMapIntensity: 0.75},
  ivory: {color: '#f1eadb', metalness: 0.05, roughness: 0.35, envMapIntensity: 0.4},
  eye: {color: '#0c2a30', metalness: 0.2, roughness: 0.2, emissive: '#3ff0ff', emissiveIntensity: 0.9},
  mouth: {color: '#5a1a22', metalness: 0.1, roughness: 0.6},
  membrane: {color: '#ffffff', metalness: 0.25, roughness: 0.55, vertexColors: true, side: THREE.DoubleSide, envMapIntensity: 0.5},
  core: {color: '#1b2026', metalness: 0.7, roughness: 0.35, envMapIntensity: 0.6},
  fin: {color: '#2c6a5f', metalness: 0.4, roughness: 0.45, side: THREE.DoubleSide, transparent: true, opacity: 0.92},
};
// which material in each subsystem is "the part doing the work" (glows with the accent)
const WORKING = {spine: ['motor'], power: ['pack'], necks: ['motor'], heads: ['eye', 'gold'], hood: ['membrane', 'steel'], core: ['core'], tail: ['fin']};
// which materials go to glass in x-ray
const ARMOUR = new Set(['shell', 'scale', 'belly', 'stripe', 'gold', 'fin']);

export function buildRobot() {
  const root = new THREE.Group();
  const mats = {}; // mats[subsys][name]
  const M = (sub, name) => {
    mats[sub] ??= {};
    if (!mats[sub][name]) {
      const m = new THREE.MeshStandardMaterial({...BASE[name]});
      m.userData = {base: {...BASE[name]}, name, sub};
      mats[sub][name] = m;
    }
    return mats[sub][name];
  };
  const mesh = (geo, mat, parent) => {
    const m = new THREE.Mesh(geo, mat);
    m.castShadow = true;
    m.receiveShadow = true;
    parent.add(m);
    return m;
  };

  // ---------------------------------------------------------------- one body module, unit length along +Z
  const barrel = (() => {
    const pts = [];
    for (let i = 0; i <= 10; i++) {
      const v = i / 10;
      const r = 0.84 + 0.16 * Math.sin(v * Math.PI);
      pts.push(new THREE.Vector2(r, v - 0.5));
    }
    const g = new THREE.LatheGeometry(pts, 20, Math.PI * 0.62, Math.PI * 1.76);
    g.rotateX(Math.PI / 2);
    return g;
  })();
  const bellyGeo = (() => {
    const g = new THREE.CylinderGeometry(0.97, 0.97, 0.86, 16, 1, true, -Math.PI * 0.38, Math.PI * 0.76);
    g.rotateX(Math.PI / 2);
    g.rotateZ(Math.PI); // underneath: facing -Y
    return g;
  })();
  const ridgeGeo = new THREE.ConeGeometry(0.22, 0.6, 4);
  ridgeGeo.rotateX(Math.PI / 2);
  ridgeGeo.scale(0.6, 1, 1);
  const collarGeo = new THREE.TorusGeometry(0.8, 0.09, 8, 20);
  const motorGeo = new THREE.CylinderGeometry(0.3, 0.3, 1.15, 16);
  const hubGeo = new THREE.CylinderGeometry(0.42, 0.42, 0.3, 16);
  const busGeo = new THREE.CylinderGeometry(0.07, 0.07, 1, 6);
  busGeo.rotateX(Math.PI / 2);
  const packGeo = new THREE.BoxGeometry(1.1, 0.62, 0.56);
  const termGeo = new THREE.BoxGeometry(0.2, 0.14, 0.12);

  const makeModule = (sub, r, len, opts = {}) => {
    const g = new THREE.Group();
    const armour = new THREE.Group(); // lifts off in the exploded view
    const bellyG = new THREE.Group();
    const inner = new THREE.Group();
    g.add(armour, bellyG, inner);
    const sh = mesh(barrel, M(sub, opts.gold ? 'gold' : 'shell'), armour);
    sh.scale.set(r, r, len * 0.96);
    const rid = mesh(ridgeGeo, M(sub, 'scale'), armour);
    rid.scale.set(r, r, len);
    rid.position.set(0, r * 0.98, 0);
    const be = mesh(bellyGeo, M(sub, opts.stripe ? 'stripe' : 'belly'), bellyG);
    be.scale.set(r, r, len);
    const co = mesh(collarGeo, M(sub, 'steel'), inner);
    co.scale.setScalar(r);
    co.position.z = len * 0.47;
    const m1 = mesh(motorGeo, M(sub, 'motor'), inner); // yaw actuator, vertical
    m1.scale.setScalar(r);
    m1.position.z = len * 0.3;
    const m2 = mesh(motorGeo, M(sub, 'motor'), inner); // pitch actuator, across
    m2.scale.setScalar(r * 0.85);
    m2.rotation.z = Math.PI / 2;
    m2.position.z = len * 0.08;
    const hb = mesh(hubGeo, M(sub, 'steel'), inner);
    hb.scale.setScalar(r);
    hb.position.z = len * 0.3;
    const bus = mesh(busGeo, M(sub, 'copper'), inner);
    bus.scale.set(r, r * 1.0, len);
    bus.position.y = -r * 0.45;
    let pack = null;
    if (opts.pack) {
      pack = new THREE.Group();
      const pk = mesh(packGeo, M('power', 'pack'), pack);
      pk.scale.set(r, r, len);
      const tm = mesh(termGeo, M('power', 'copper'), pack);
      tm.scale.set(r, r, len);
      tm.position.set(0, r * 0.36, len * 0.2);
      pack.position.z = -len * 0.2;
      inner.add(pack);
    }
    return {g, armour, bellyG, inner, pack, r, len};
  };

  const ground = [];
  for (let i = 0; i < SPEC.nGround; i++) {
    const u = i / (SPEC.nGround - 1);
    const r = 0.205 - 0.15 * Math.pow(u, 1.25);
    const m = makeModule('spine', r, SPEC.segL, {pack: i >= SPEC.packs[0] && i < SPEC.packs[1], stripe: i % 2 === 1});
    root.add(m.g);
    ground.push(m);
  }
  const trunk = [];
  for (let k = 0; k < SPEC.nTrunk; k++) {
    const m = makeModule('spine', 0.2 - 0.012 * k, SPEC.trunkL, {stripe: k % 2 === 1});
    root.add(m.g);
    trunk.push(m);
  }

  // ---------------------------------------------------------------- the core at the top of the trunk
  const hub = new THREE.Group();
  {
    const shell = new THREE.Group();
    const c = mesh(new THREE.SphereGeometry(0.24, 24, 16), M('core', 'shell'), shell);
    c.scale.set(1.25, 0.95, 1);
    hub.add(shell);
    const box = mesh(new THREE.BoxGeometry(0.26, 0.16, 0.2), M('core', 'core'), hub);
    box.position.y = 0;
    const ring = mesh(new THREE.TorusGeometry(0.27, 0.025, 8, 32), M('core', 'steel'), hub);
    ring.rotation.x = Math.PI / 2;
    hub.userData.shell = shell;
  }
  root.add(hub);

  // ---------------------------------------------------------------- five necks, heads and hoods
  const necks = [];
  const heads = [];
  const hoods = [];
  const skull = (() => {
    const pts = [];
    const prof = [
      [-0.17, 0.0],
      [-0.165, 0.07],
      [-0.12, 0.112],
      [-0.04, 0.118],
      [0.05, 0.1],
      [0.13, 0.068],
      [0.19, 0.035],
      [0.205, 0.0],
    ];
    for (const [z, r] of prof) pts.push(new THREE.Vector2(r, z));
    const up = new THREE.LatheGeometry(pts, 14, Math.PI / 2, Math.PI);
    up.rotateX(Math.PI / 2);
    up.scale(1.3, 0.62, 1);
    const lo = new THREE.LatheGeometry(pts, 14, -Math.PI / 2, Math.PI);
    lo.rotateX(Math.PI / 2);
    lo.scale(1.2, 0.42, 0.93);
    return {up, lo};
  })();
  const fangGeo = new THREE.ConeGeometry(0.012, 0.075, 8);
  fangGeo.rotateX(Math.PI); // point down
  const eyeGeo = new THREE.SphereGeometry(0.022, 12, 8);
  const mouthGeo = new THREE.CircleGeometry(1, 16, 0, Math.PI);
  const lidarGeo = new THREE.CylinderGeometry(0.035, 0.04, 0.035, 16);
  const ribGeo = new THREE.CylinderGeometry(0.008, 0.012, 1, 6);
  ribGeo.translate(0, 0.5, 0);

  for (let h = 0; h < SPEC.heads; h++) {
    const segs = [];
    for (let j = 0; j < SPEC.nNeck; j++) {
      const m = makeModule('necks', 0.1 - 0.025 * (j / (SPEC.nNeck - 1)), SPEC.neckL, {stripe: j % 2 === 1});
      root.add(m.g);
      segs.push(m);
    }
    necks.push(segs);

    const head = new THREE.Group();
    const upper = new THREE.Group();
    const lower = new THREE.Group();
    head.add(upper, lower);
    upper.position.z = -0.12;
    lower.position.z = -0.12;
    const su = mesh(skull.up, M('heads', 'gold'), upper);
    su.position.z = 0.12;
    const sl = mesh(skull.lo, M('heads', 'scale'), lower);
    sl.position.z = 0.12;
    const mouth = mesh(mouthGeo, M('heads', 'mouth'), lower);
    mouth.scale.set(0.12, 0.17, 1);
    mouth.rotation.x = -Math.PI / 2;
    mouth.position.set(0, 0.002, 0.13);
    for (const sx of [-1, 1]) {
      const f = mesh(fangGeo, M('heads', 'ivory'), upper);
      f.position.set(sx * 0.036, -0.03, 0.27);
      const e = mesh(eyeGeo, M('heads', 'eye'), upper);
      e.position.set(sx * 0.088, 0.035, 0.15);
    }
    if (h === 2) {
      const l = mesh(lidarGeo, M('heads', 'steel'), upper);
      l.position.set(0, 0.078, 0.06);
    }
    root.add(head);
    heads.push({g: head, upper, lower});

    // hood: ribs (meshes) and a membrane (one dynamic geometry per head, both sides)
    const ribs = [];
    for (let k = 0; k < 8; k++) ribs.push(mesh(ribGeo, M('hood', 'steel'), root));
    const geo = new THREE.BufferGeometry();
    const nv = 2 * 4 * 2 + 2; // per side 4 roots + 4 tips, plus the head-side caps
    geo.setAttribute('position', new THREE.BufferAttribute(new Float32Array(nv * 3), 3));
    const colArr = new Float32Array(nv * 3);
    const dark = new THREE.Color('#163a37');
    const pale = new THREE.Color('#5aa69a');
    const mark = new THREE.Color('#e9dcc0');
    for (let v = 0; v < nv; v++) {
      const isTip = v % 2 === 1;
      const k = (v >> 1) % 4;
      // the spectacle mark of a cobra hood: a pale band across the middle stations
      const c = isTip ? pale : k === 1 || k === 2 ? mark : dark;
      colArr.set([c.r, c.g, c.b], v * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(colArr, 3));
    const idx = [];
    for (let side = 0; side < 2; side++) {
      const o = side * 8;
      for (let k = 0; k < 3; k++) {
        const a = o + k * 2;
        idx.push(a, a + 1, a + 2, a + 1, a + 3, a + 2);
      }
    }
    // join the two sides across the neck at the roots
    for (let k = 0; k < 3; k++) idx.push(k * 2, 8 + k * 2, k * 2 + 2, 8 + k * 2, 8 + k * 2 + 2, k * 2 + 2);
    geo.setIndex(idx);
    const memb = mesh(geo, M('hood', 'membrane'), root);
    memb.frustumCulled = false;
    hoods.push({ribs, memb, geo});
  }

  // ---------------------------------------------------------------- tail paddle
  const fin = new THREE.Group();
  {
    const shape = new THREE.Shape();
    shape.moveTo(0, 0);
    shape.quadraticCurveTo(0.22, -0.05, 0.42, 0.0);
    shape.quadraticCurveTo(0.5, 0.18, 0.46, 0.3);
    shape.quadraticCurveTo(0.2, 0.18, 0, 0.08);
    const g = new THREE.ShapeGeometry(shape);
    g.translate(0, -0.1, 0);
    const m = mesh(g, M('tail', 'fin'), fin);
    m.rotation.y = -Math.PI / 2; // shape's +x runs back along -Z
  }
  root.add(fin);

  // ---------------------------------------------------------------- posing
  const mtx = new THREE.Matrix4();
  const vx = new THREE.Vector3();
  const vy = new THREE.Vector3();
  const vz = new THREE.Vector3();
  const place = (obj, pos, R) => {
    vx.set(R[0], R[1], R[2]);
    vy.set(R[3], R[4], R[5]);
    vz.set(R[6], R[7], R[8]);
    mtx.makeBasis(vx, vy, vz);
    obj.quaternion.setFromRotationMatrix(mtx);
    obj.position.set(pos[0], pos[1], pos[2]);
  };
  const Y = new THREE.Vector3(0, 1, 0);
  const tmp = new THREE.Vector3();

  const arriveObj = (obj, a) => {
    obj.visible = a > 0.002;
    if (a < 1) {
      obj.position.y += (1 - a) * (1 - a) * 3.2;
      obj.scale.setScalar(0.4 + 0.6 * a);
    } else obj.scale.setScalar(1);
  };
  const explodeModule = (m, e) => {
    m.armour.position.y = e * m.r * 2.2;
    m.bellyG.position.y = -e * m.r * 1.3;
    if (m.pack) m.pack.position.x = e * m.r * 1.6;
  };

  function update(s, P) {
    const {N, R} = P.order;
    const e = s.explode;
    for (let i = 0; i < N; i++) {
      const m = ground[i];
      place(m.g, P.ground[i].pos, P.ground[i].R);
      explodeModule(m, e);
      arriveObj(m.g, P.arrive(N - 1 - i));
    }
    for (let k = 0; k < R; k++) {
      place(trunk[k].g, P.trunk[k].pos, P.trunk[k].R);
      explodeModule(trunk[k], e);
      arriveObj(trunk[k].g, P.arrive(N + k));
    }
    place(hub, P.hub.pos, P.hub.R);
    hub.userData.shell.position.y = e * 0.3;
    arriveObj(hub, P.arrive(N + R));
    for (let h = 0; h < SPEC.heads; h++) {
      const aN = P.arrive(N + R + 1 + h);
      const aH = P.arrive(N + R + 1 + SPEC.heads + h);
      for (let j = 0; j < SPEC.nNeck; j++) {
        const sg = P.necks[h][j];
        const m = necks[h][j];
        place(m.g, sg.pos, sg.R);
        m.g.scale.set(1, 1, sg.len / SPEC.neckL);
        explodeModule(m, e);
        arriveObj(m.g, aN);
        if (aN >= 1) m.g.scale.set(1, 1, sg.len / SPEC.neckL);
      }
      const hd = P.heads[h];
      place(heads[h].g, hd.pos, hd.R);
      heads[h].lower.rotation.x = hd.jaw;
      heads[h].upper.rotation.x = -hd.jaw * 0.22;
      heads[h].upper.position.y = e * 0.12;
      heads[h].lower.position.y = -e * 0.1;
      arriveObj(heads[h].g, aH);

      // hood
      const H = P.hoods[h];
      const hd2 = hoods[h];
      const pos = hd2.geo.attributes.position.array;
      const lift = aH < 1 ? (1 - aH) * (1 - aH) * 3.2 : 0;
      const vis = aH > 0.002;
      H.ribs.forEach((rb, n) => {
        const mesh = hd2.ribs[n];
        mesh.visible = vis;
        mesh.position.set(rb.root[0], rb.root[1] + lift, rb.root[2]);
        tmp.set(rb.tip[0] - rb.root[0], rb.tip[1] - rb.root[1], rb.tip[2] - rb.root[2]);
        const L = tmp.length();
        mesh.quaternion.setFromUnitVectors(Y, tmp.normalize());
        mesh.scale.set(1, L, 1);
        // ribs come in side order [-1, +1] per station k; vertices: side block, station k, (root, tip)
        const side = rb.side < 0 ? 0 : 1;
        const v = side * 8 + rb.k * 2;
        pos.set([rb.root[0], rb.root[1] + lift, rb.root[2]], v * 3);
        pos.set([rb.tip[0], rb.tip[1] + lift, rb.tip[2]], (v + 1) * 3);
      });
      hd2.memb.visible = vis;
      hd2.geo.attributes.position.needsUpdate = true;
      hd2.geo.computeVertexNormals();
      hd2.geo.computeBoundingSphere();
    }
    // tail paddle grows out of the last module for swimming
    const t = P.ground[N - 1];
    place(fin, t.pos, t.R);
    const back = t.len * 0.5 * (1 + 0.55 * e);
    fin.translateZ(-back);
    fin.scale.setScalar(0.35 + 0.85 * s.swim);
    fin.visible = P.arrive(0) > 0.002;
  }

  // ---------------------------------------------------------------- isolate / glow / x-ray
  const accent = new THREE.Color(ACCENT);
  function look({isolate = null, isoK = 0, glow = null, glowK = 0, xray = 0}) {
    for (const sub of Object.keys(mats)) {
      for (const m of Object.values(mats[sub])) {
        const b = m.userData.base;
        const ghost = isolate && sub !== isolate && !(isolate === 'spine' && sub === 'power') ? isoK : 0;
        const glass = ARMOUR.has(m.userData.name) ? xray : 0;
        let op = (b.opacity ?? 1) * (1 - 0.9 * ghost) * (1 - 0.86 * glass);
        if (isolate === 'spine' && sub === 'power') op *= 1 - 0.75 * isoK;
        const transparent = op < 0.995 || !!b.transparent;
        if (m.transparent !== transparent) {
          m.transparent = transparent;
          m.needsUpdate = true;
        }
        m.opacity = op;
        m.depthWrite = op > 0.6;
        const lit = glow === sub && WORKING[sub].includes(m.userData.name) ? glowK : 0;
        m.emissive.set(b.emissive ?? '#000000');
        m.emissiveIntensity = b.emissiveIntensity ?? 1;
        if (lit > 0) {
          m.emissive.lerp(accent, lit);
          m.emissiveIntensity = Math.max(m.emissiveIntensity * (1 - lit), 0.4 * lit);
        }
      }
    }
  }

  // anchor points for callouts, in world space
  const anchor = (key, P) => {
    const w = new THREE.Vector3();
    switch (key) {
      case 'motor':
        return ground[12].inner.children[1].getWorldPosition(w);
      case 'shell':
        return ground[16].armour.children[0].getWorldPosition(w).add(new THREE.Vector3(0, ground[16].r * 0.9, 0));
      case 'belly':
        return trunk[2].bellyG.children[0].getWorldPosition(w).add(new THREE.Vector3(0.18, 0, 0));
      case 'pack':
        return ground[9].pack.getWorldPosition(w);
      case 'eye':
        return heads[1].upper.children[2].getWorldPosition(w);
      case 'lidar':
        return heads[2].upper.children.at(-1).getWorldPosition(w);
      case 'fang':
        return heads[3].upper.children[1].getWorldPosition(w);
      case 'jaw':
        return heads[4].lower.getWorldPosition(w);
      case 'rib': {
        const rb = P.hoods[0].ribs[4];
        return w.set(...rb.tip);
      }
      case 'membrane': {
        const rb = P.hoods[4].ribs[5];
        return w.set((rb.root[0] + rb.tip[0]) / 2, (rb.root[1] + rb.tip[1]) / 2, (rb.root[2] + rb.tip[2]) / 2);
      }
      case 'neck':
        return necks[3][2].g.getWorldPosition(w);
      case 'core':
        return hub.getWorldPosition(w);
      case 'tail':
        return fin.getWorldPosition(w);
      case 'trunk':
        return trunk[1].g.getWorldPosition(w);
    }
    return w;
  };

  return {root, update, look, anchor, mats};
}
