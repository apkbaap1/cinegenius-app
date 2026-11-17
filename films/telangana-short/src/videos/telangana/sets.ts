// The places of the Telangana short: an old Deccan city on a lake (flat-roofed houses with parapets and water tanks,
// a four-minaret gate across the street, the Tank Bund promenade), a village with a teaching tree, paddy fields and
// a Bathukamma courtyard, a round parliament building, and a coal mine. Static parts are merged batches; the things
// the story moves (bus, shutters, Bathukamma rings, the lit window) come back as objects for world.ts to pose.
import * as THREE from "three";
import { Batch, V, lam, boxGeo, quad, tri, house, prop, Kit, Ray, setSight, inTheWay } from "./build";
import { ctex, rng, facadeHD, rep, stoneHD } from "./paint";
import { D0 } from "./story";
import { GATE, GATE_W, SHOPS, BUS, LAMP_WIN, CANOPY, VIL, BOARD, CHAIR, BK, FIELDS, DELHI, MINE } from "./places";

const M4 = (x: number, y: number, z: number, ry = 0, s: [number, number, number] = [1, 1, 1]) =>
  new THREE.Matrix4().compose(V(x, y, z), new THREE.Quaternion().setFromAxisAngle(V(0, 1, 0), ry), V(...s));

// ---------------- Deccan houses ----------------
const DECCAN = [
  { wall: "#efe6d2", shutter: "#2f6fbf" }, { wall: "#e8b96a", shutter: "#2f6a43" }, { wall: "#9fc9b7", shutter: "#7b3fa8" },
  { wall: "#e7a59a", shutter: "#2f5f6a" }, { wall: "#a9c4e2", shutter: "#8c3b4a" }, { wall: "#f1d79a", shutter: "#2f6fbf" },
  { wall: "#d98f5f", shutter: "#2f6a43" }, { wall: "#e6dccd", shutter: "#3f6fb5" },
];
const trim = () => lam("deccanTrim", () => ({ color: "#f3ead6" }));
const tankM = () => lam("waterTank", () => ({ color: "#2b2c33" }));
/** flat-roofed house: facade on local +z, parapet round the roof, a black water tank on some roofs (left out if it blocks a shot) */
export const flatHouse = (b: Batch, x: number, z: number, yaw: number, w: number, d: number, h: number, si: number, tank = false, y = D0, force = false) => {
  const across = Math.abs(Math.sin(yaw)) > 0.5, hx = (across ? d : w) / 2 + 0.6, hz = (across ? w : d) / 2 + 0.6;
  if (!force && inTheWay(x - hx, x + hx, y, y + h + 2.2, z - hz, z + hz)) return;
  const st = DECCAN[si % DECCAN.length], m = M4(x, y, z, yaw);
  const front = lam(`dh${si}_${w}_${h}`, () => ({ map: facadeHD(`dh${si}_${w}_${h}`, w, h, { ...st, door: true }) }));
  const side = lam(`ds${si}_${h}`, () => ({ map: facadeHD(`ds${si}_${h}`, 8, h, st) }));
  const top = lam("roofFlat", () => ({ color: "#cfc3ad" }));
  const hw = w / 2, hd = d / 2;
  b.add(quad(V(-hw, 0, hd), V(hw, 0, hd), V(hw, h, hd), V(-hw, h, hd)), front, m);
  b.add(quad(V(hw, 0, -hd), V(-hw, 0, -hd), V(-hw, h, -hd), V(hw, h, -hd)), side, m);
  b.add(quad(V(-hw, 0, -hd), V(-hw, 0, hd), V(-hw, h, hd), V(-hw, h, -hd)), side, m);
  b.add(quad(V(hw, 0, hd), V(hw, 0, -hd), V(hw, h, -hd), V(hw, h, hd)), side, m);
  b.add(quad(V(-hw, h, hd), V(hw, h, hd), V(hw, h, -hd), V(-hw, h, -hd)), top, m);
  const t = trim(), pw = 0.22, ph = 0.95;
  b.add(boxGeo(V(-hw - 0.1, h - 0.3, hd - 0.02), V(hw + 0.1, h - 0.05, hd + 0.18)), t, m); // cornice
  for (const [x0, x1, z0, z1] of [[-hw, hw, hd - pw, hd], [-hw, hw, -hd, -hd + pw], [-hw, -hw + pw, -hd, hd], [hw - pw, hw, -hd, hd]])
    b.add(boxGeo(V(x0, h, z0), V(x1, h + ph, z1)), t, m);
  b.add(boxGeo(V(-hw - 0.06, -0.05, -hd - 0.06), V(hw + 0.06, 0.45, hd + 0.06)), lam("plinthDeccan", () => ({ color: "#bba98c" })), m);
  if (tank) b.add(new THREE.CylinderGeometry(0.6, 0.6, 1.2, 14).translate(0, 0.6, 0), tankM(), m.clone().multiply(M4(hw * 0.4, h, -hd * 0.3)));
};

// ---------------- the four-minaret gate ----------------
const plaster = () => lam("gatePlaster", () => ({ color: "#ecdcbc" }));
const plasterD = () => lam("gatePlasterD", () => ({ color: "#d9c39b" }));
const arcadeTex = () => ctex("gateArcade", 1024, 256, (g) => {
  g.fillStyle = "#ecdcbc"; g.fillRect(0, 0, 1024, 256);
  for (let i = 0; i < 8; i++) {
    const cx = 64 + i * 128;
    g.fillStyle = "#6a5a6e"; g.beginPath(); g.moveTo(cx - 34, 230); g.lineTo(cx - 34, 120);
    g.quadraticCurveTo(cx - 34, 60, cx, 40); g.quadraticCurveTo(cx + 34, 60, cx + 34, 120); g.lineTo(cx + 34, 230); g.closePath(); g.fill();
    g.strokeStyle = "#b99f74"; g.lineWidth = 6; g.stroke();
  }
  g.fillStyle = "#b99f74"; g.fillRect(0, 0, 1024, 14); g.fillRect(0, 242, 1024, 14);
});
/** one face of the gate: a wall with a tall pointed arch through it, extruded 1.6 m */
const archFace = () => {
  const s = new THREE.Shape([V(-10, 0, 0), V(10, 0, 0), V(10, 21, 0), V(-10, 21, 0)].map((v) => new THREE.Vector2(v.x, v.y)));
  const hole = new THREE.Path();
  hole.moveTo(-5.5, 0); hole.lineTo(-5.5, 11.5);
  hole.quadraticCurveTo(-5.5, 15.5, 0, 17.5); hole.quadraticCurveTo(5.5, 15.5, 5.5, 11.5); hole.lineTo(5.5, 0); hole.lineTo(-5.5, 0);
  s.holes.push(hole);
  const g = new THREE.ExtrudeGeometry(s, { depth: 1.6, bevelEnabled: false, curveSegments: 10 });
  g.translate(0, 0, -0.8);
  return g;
};
const buildGate = (b: Batch) => {
  const [gx, gz] = GATE, h = GATE_W / 2, P = plaster(), Pd = plasterD();
  const face = archFace();
  for (const [dx, dz, ry] of [[0, h - 0.8, 0], [0, -h + 0.8, Math.PI], [h - 0.8, 0, Math.PI / 2], [-h + 0.8, 0, -Math.PI / 2]] as const)
    b.add(face, P, M4(gx + dx, D0, gz + dz, ry));
  // upper storeys: arcade bands, balcony ledges, parapet
  const arc = lam("gateArcade", () => ({ map: arcadeTex() }));
  for (const [y0, y1] of [[21, 25.5], [26.3, 30]] as const) b.add(boxGeo(V(gx - h, D0 + y0, gz - h), V(gx + h, D0 + y1, gz + h)), arc);
  for (const y of [21, 25.5, 30]) b.add(boxGeo(V(gx - h - 0.7, D0 + y - 0.1, gz - h - 0.7), V(gx + h + 0.7, D0 + y + 0.8, gz + h + 0.7)), Pd);
  b.add(boxGeo(V(gx - h, D0 + 30.8, gz - h), V(gx + h, D0 + 31.8, gz + h)), P);
  // four minarets: a fat lower shaft as the corner, slimmer upper shaft, two balconies, a small onion dome and finial
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) {
    const x = gx + sx * h, z = gz + sz * h;
    b.add(new THREE.CylinderGeometry(2.0, 2.2, 31.8, 18).translate(0, 15.9, 0), P, M4(x, D0, z));
    b.add(new THREE.CylinderGeometry(1.25, 1.6, 17, 16).translate(0, 8.5, 0), P, M4(x, D0 + 31.8, z));
    for (const y of [31.8, 39.5, 46.5]) b.add(new THREE.CylinderGeometry(2.5, 2.1, 0.8, 18), Pd, M4(x, D0 + y, z));
    const dome = new THREE.SphereGeometry(1.7, 18, 12); dome.scale(1, 1.25, 1);
    b.add(dome, P, M4(x, D0 + 49.9, z));
    b.add(new THREE.ConeGeometry(0.45, 2.4, 10).translate(0, 1.2, 0), Pd, M4(x, D0 + 51.6, z));
  }
};

// ---------------- village ----------------
const paddyTex = () => ctex("paddy", 512, 512, (g, r) => {
  g.fillStyle = "#79b64a"; g.fillRect(0, 0, 512, 512);
  for (let y = 0; y < 512; y += 16) { g.fillStyle = r() < 0.5 ? "#6aa83e" : "#8cc456"; g.fillRect(0, y, 512, 8); }
  g.fillStyle = "rgba(255,255,255,0.12)"; for (let i = 0; i < 120; i++) g.fillRect(r() * 512, r() * 512, 2, 10);
});
const boardTex = () => ctex("chalkboard", 512, 352, (g) => {
  g.fillStyle = "#2f4a3a"; g.fillRect(0, 0, 512, 352);
  g.strokeStyle = "#8a5a34"; g.lineWidth = 22; g.strokeRect(0, 0, 512, 352);
  g.strokeStyle = "rgba(240,240,230,0.9)"; g.lineWidth = 6; g.lineCap = "round";
  // chalk drawing, no words: a sapling under a sun, and a row of little people holding hands
  g.beginPath(); g.moveTo(170, 280); g.lineTo(170, 170); g.stroke();
  for (const [a, l] of [[-0.9, 50], [0.9, 50], [-0.5, 70], [0.4, 66]]) { g.beginPath(); g.moveTo(170, 210 - l * 0.3); g.quadraticCurveTo(170 + Math.sin(a) * l, 180 - l * 0.6, 170 + Math.sin(a) * l * 1.2, 190 - l); g.stroke(); }
  g.beginPath(); g.arc(380, 90, 34, 0, 7); g.stroke();
  for (let i = 0; i < 8; i++) { const a = (i * Math.PI) / 4; g.beginPath(); g.moveTo(380 + 46 * Math.cos(a), 90 + 46 * Math.sin(a)); g.lineTo(380 + 62 * Math.cos(a), 90 + 62 * Math.sin(a)); g.stroke(); }
  for (let i = 0; i < 5; i++) { const x = 270 + i * 40; g.beginPath(); g.arc(x, 222, 9, 0, 7); g.moveTo(x, 231); g.lineTo(x, 262); g.moveTo(x - 20, 244); g.lineTo(x + 20, 244); g.moveTo(x, 262); g.lineTo(x - 10, 286); g.moveTo(x, 262); g.lineTo(x + 10, 286); g.stroke(); }
  g.beginPath(); g.moveTo(90, 284); g.lineTo(250, 284); g.stroke();
});
const wood = () => lam("woodPlain", () => ({ color: "#9a6a42" }));
const buildVillage = (b: Batch, kit: Kit, r: () => number) => {
  const [vx, vz] = VIL;
  // beaten-earth yard round the tree, paddy fields to the south, a dirt lane
  b.add(new THREE.CircleGeometry(22, 40).rotateX(-Math.PI / 2), lam("earth", () => ({ color: "#c9a273" })), M4(vx, D0 + 0.01, vz));
  const pad = lam("paddy", () => ({ map: rep(paddyTex(), 8, 8) }));
  for (let i = 0; i < 6; i++) for (let j = 0; j < 3; j++) {
    const x0 = FIELDS[0] - 60 + i * 21, z0 = FIELDS[1] - 30 + j * 21;
    b.add(new THREE.PlaneGeometry(20, 20).rotateX(-Math.PI / 2), pad, M4(x0, D0 + 0.03, z0));
    b.add(boxGeo(V(x0 - 10, D0, z0 - 10.4), V(x0 + 10, D0 + 0.25, z0 - 9.9)), lam("bund", () => ({ color: "#a98557" })));
  }
  b.add(new THREE.PlaneGeometry(4, 60).rotateX(-Math.PI / 2), lam("lane", () => ({ color: "#c2a074" })), M4(vx + 22, D0 + 0.02, vz + 20));
  // the teaching tree (a big banyan-like canopy), the chalkboard on an easel, the professor's chair, mats
  prop(b, kit, "tree_oak", vx, D0, vz + 2.5, 13, 0.4);
  const bm = lam("chalkboard", () => ({ map: boardTex() }));
  b.add(boxGeo(V(-0.8, 0, -0.04), V(0.8, 1.1, 0.04)), wood(), M4(BOARD[0], D0 + 0.9, BOARD[1], -0.35));
  b.add(new THREE.PlaneGeometry(1.5, 1.0).translate(0, 0.55, 0.05), bm, M4(BOARD[0], D0 + 0.9, BOARD[1], -0.35));
  for (const s of [-0.65, 0.65]) b.add(boxGeo(V(s - 0.04, 0, -0.04), V(s + 0.04, 2.05, 0.04)), wood(), M4(BOARD[0], D0, BOARD[1], -0.35));
  // chair: seat, back, legs
  const cm = M4(CHAIR[0], D0, CHAIR[1], 0.5);
  b.add(boxGeo(V(-0.25, 0.45, -0.25), V(0.25, 0.5, 0.25)), wood(), cm);
  b.add(boxGeo(V(-0.25, 0.5, -0.27), V(0.25, 1.0, -0.22)), wood(), cm);
  for (const [lx, lz] of [[-0.22, -0.22], [0.22, -0.22], [-0.22, 0.22], [0.22, 0.22]]) b.add(boxGeo(V(lx - 0.03, 0, lz - 0.03), V(lx + 0.03, 0.45, lz + 0.03)), wood(), cm);
  for (const [mx, mz, c] of [[-1.5, 2.2, "#c2185b"], [1.2, 2.6, "#2f6fbf"], [-0.2, 3.8, "#e98b2a"]] as const)
    b.add(new THREE.PlaneGeometry(2.2, 1.1).rotateX(-Math.PI / 2), lam("mat" + c, () => ({ color: c })), M4(vx + mx, D0 + 0.025, vz + mz, 0.2));
  // huts: small gabled houses with tiled roofs round the yard
  for (let i = 0; i < 12; i++) {
    const a = (i / 12) * Math.PI * 2 + 0.3, d = 26 + r() * 8;
    const x = vx + Math.cos(a) * d, z = vz + Math.sin(a) * d * 0.8;
    if (z > vz + 12 && Math.abs(x - vx - 22) < 6) continue; // keep the lane clear
    house(b, x, z, Math.atan2(vx - x, vz - z), 6, 5, 3.2, Math.floor(r() * 8));
  }
  // Bathukamma courtyard: a swept circle with a rangoli ring
  b.add(new THREE.CircleGeometry(6, 40).rotateX(-Math.PI / 2), lam("yard", () => ({ color: "#e8d3ae" })), M4(BK[0], D0 + 0.02, BK[1]));
  b.add(new THREE.RingGeometry(1.4, 1.75, 40).rotateX(-Math.PI / 2), lam("rangoli", () => ({ color: "#d8344f" })), M4(BK[0], D0 + 0.03, BK[1]));
  for (let i = 0; i < 30; i++) {
    const x = vx + (r() - 0.5) * 160, z = vz + (r() - 0.5) * 120;
    if (Math.hypot(x - vx, z - vz) < 40 || (z > vz + 25 && Math.abs(x - FIELDS[0]) < 70)) continue;
    prop(b, kit, r() < 0.5 ? "tree_default" : "tree_fat", x, D0, z, 8 + r() * 5, r() * 6);
  }
};

// ---------------- the round parliament building ----------------
const buildDelhi = (b: Batch) => {
  const [dx, dz] = DELHI, R = 26, sand = lam("sandstone", () => ({ map: stoneHD("sandHD", ["#e2b48c", "#d9a87e", "#e8bf98", "#d1a074"], "#b98b66") }));
  const sandL = lam("sandL", () => ({ color: "#efc9a2" }));
  b.add(new THREE.CircleGeometry(80, 48).rotateX(-Math.PI / 2), lam("lawn", () => ({ color: "#7cbc55" })), M4(dx, D0 + 0.01, dz));
  b.add(new THREE.CylinderGeometry(R + 2, R + 2.5, 2.2, 64).translate(0, 1.1, 0), sand, M4(dx, D0, dz));          // plinth
  b.add(new THREE.CylinderGeometry(R - 3, R - 3, 11, 64, 1, true).translate(0, 7.2, 0), sand, M4(dx, D0, dz));     // inner wall
  b.add(new THREE.CylinderGeometry(R + 1.2, R + 1.2, 1.4, 64).translate(0, 13.2, 0), sandL, M4(dx, D0, dz));       // entablature
  b.add(new THREE.CylinderGeometry(R - 3, R - 3, 1.0, 64).translate(0, 13.9, 0), sand, M4(dx, D0, dz));            // roof
  const dome = new THREE.SphereGeometry(9, 32, 12, 0, Math.PI * 2, 0, Math.PI / 2);
  b.add(dome, sandL, M4(dx, D0 + 14.2, dz));
  const col = new THREE.CylinderGeometry(0.45, 0.5, 10.6, 12).translate(0, 5.3, 0);
  for (let i = 0; i < 72; i++) { const a = (i / 72) * Math.PI * 2; b.add(col, sandL, M4(dx + Math.cos(a) * R, D0 + 2.2, dz + Math.sin(a) * R)); }
  // the path up to it
  b.add(new THREE.PlaneGeometry(8, 54).rotateX(-Math.PI / 2), lam("path", () => ({ color: "#d9c7a7" })), M4(dx, D0 + 0.02, dz - R - 27));
};

// ---------------- coal mine ----------------
const buildMine = (b: Batch) => {
  const [mx, mz] = MINE;
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  b.add(hill, lam("minehill", () => ({ color: "#8a8a6a" })), M4(mx, D0 - 1, mz + 42, 0, [55, 26, 34]));
  b.add(new THREE.CircleGeometry(45, 40).rotateX(-Math.PI / 2), lam("coalyard", () => ({ color: "#5d5560" })), M4(mx, D0 + 0.01, mz - 6));
  // tunnel mouth: a timber portal with a black opening in the hill face
  const s = new THREE.Shape(); s.moveTo(-3.2, 0); s.lineTo(-3.2, 3.6); s.quadraticCurveTo(0, 6.2, 3.2, 3.6); s.lineTo(3.2, 0); s.lineTo(-3.2, 0);
  b.add(new THREE.ShapeGeometry(s, 12), lam("tunnel", () => ({ color: "#121015" })), M4(mx, D0, mz + 9.0, Math.PI));
  for (const x of [-3.6, 3.6]) b.add(boxGeo(V(mx + x - 0.3, D0, mz + 8.6), V(mx + x + 0.3, D0 + 4.4, mz + 9.4)), wood());
  b.add(boxGeo(V(mx - 4.2, D0 + 4.4, mz + 8.6), V(mx + 4.2, D0 + 5.1, mz + 9.4)), wood());
  // headframe: four steel legs, cross braces, a wheel at the top
  const steel = lam("steelRed", () => ({ color: "#9a3b2f" }));
  const leg = (a: THREE.Vector3, c: THREE.Vector3, th: number) => {
    const g = new THREE.BoxGeometry(th, a.distanceTo(c), th);
    b.add(g, steel, new THREE.Matrix4().compose(a.clone().add(c).multiplyScalar(0.5), new THREE.Quaternion().setFromUnitVectors(V(0, 1, 0), c.clone().sub(a).normalize()), V(1, 1, 1)));
  };
  const hx = mx - 16, hz = mz - 4;
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) leg(V(hx + sx * 3.4, D0, hz + sz * 3.4), V(hx + sx * 1.2, D0 + 22, hz + sz * 1.2), 0.45);
  for (const y of [6, 12, 18]) { const k = 3.4 - (2.2 * y) / 22; for (const sz of [-1, 1]) leg(V(hx - k, D0 + y, hz + sz * k), V(hx + k, D0 + y, hz + sz * k), 0.3); }
  const wheel = new THREE.TorusGeometry(2.2, 0.22, 8, 28);
  b.add(wheel, steel, M4(hx, D0 + 23.4, hz));
  // coal heaps and a rail line with tubs
  for (const [x, z, r] of [[mx + 14, mz - 10, 5], [mx + 22, mz - 2, 3.5]] as const) b.add(new THREE.ConeGeometry(r, r * 0.9, 18).translate(0, r * 0.45, 0), lam("coal", () => ({ color: "#2e2a30" })), M4(x, D0, z));
  b.add(boxGeo(V(mx - 0.8, D0, mz - 30), V(mx + 0.8, D0 + 0.08, mz + 8)), lam("rail", () => ({ color: "#6a5a4a" })));
  for (const z of [-4, -9]) b.add(boxGeo(V(mx - 0.75, D0 + 0.3, mz + z - 1.1), V(mx + 0.75, D0 + 1.3, mz + z + 1.1)), steel);
};

// ---------------- dynamic objects ----------------
const busTex = () => ctex("busSide", 1024, 320, (g) => {
  g.fillStyle = "#c8372d"; g.fillRect(0, 0, 1024, 320);
  g.fillStyle = "#f1e6cf"; g.fillRect(0, 40, 1024, 120);
  g.fillStyle = "#4d6a8c"; for (let i = 0; i < 9; i++) g.fillRect(40 + i * 108, 58, 88, 84);
  g.fillStyle = "rgba(255,255,255,0.35)"; for (let i = 0; i < 9; i++) { g.beginPath(); g.moveTo(52 + i * 108, 130); g.lineTo(80 + i * 108, 66); g.lineTo(92 + i * 108, 66); g.lineTo(64 + i * 108, 130); g.fill(); }
  g.fillStyle = "#f2c14e"; g.fillRect(0, 186, 1024, 18);
});
const busFrontTex = () => ctex("busFront", 320, 320, (g) => {
  g.fillStyle = "#c8372d"; g.fillRect(0, 0, 320, 320);
  g.fillStyle = "#4d6a8c"; g.fillRect(24, 40, 272, 130);
  g.fillStyle = "#f2c14e"; g.fillRect(0, 186, 320, 18);
  g.fillStyle = "#fff6d0"; for (const x of [50, 270]) { g.beginPath(); g.arc(x, 250, 22, 0, 7); g.fill(); }
});
const shutterTex = () => ctex("shutter", 256, 256, (g) => {
  g.fillStyle = "#9aa0a8"; g.fillRect(0, 0, 256, 256);
  for (let y = 0; y < 256; y += 12) { g.fillStyle = "#7d838c"; g.fillRect(0, y, 256, 3); g.fillStyle = "#b9bec5"; g.fillRect(0, y + 4, 256, 2); }
});
export type Dyn = { bus: THREE.Group; shutters: THREE.Mesh[]; rings: THREE.Mesh[]; bkTop: THREE.Mesh; window: THREE.Mesh; canopy: THREE.Group };
const RING_COLS = ["#4c9a37", "#f2c14e", "#c2185b", "#f6f1e6", "#e98b2a", "#f2c14e", "#7b3fa8", "#f2c14e", "#c2185b"];
const buildDyn = (root: THREE.Object3D): Dyn => {
  // bus: 10 m, painted sides, wheels
  const bus = new THREE.Group(), bb = new Batch();
  const side = lam("busSide", () => ({ map: busTex() })), frontM = lam("busFront", () => ({ map: busFrontTex() })), roofM = lam("busRoof", () => ({ color: "#e7dcc4" }));
  const L = 10, W = 2.5, H = 3.0, y0 = 0.45;
  bb.add(quad(V(-W / 2, y0, L / 2), V(-W / 2, y0, -L / 2), V(-W / 2, y0 + H, -L / 2), V(-W / 2, y0 + H, L / 2)), side);
  bb.add(quad(V(W / 2, y0, -L / 2), V(W / 2, y0, L / 2), V(W / 2, y0 + H, L / 2), V(W / 2, y0 + H, -L / 2)), side);
  bb.add(quad(V(W / 2, y0, -L / 2), V(-W / 2, y0, -L / 2), V(-W / 2, y0 + H, -L / 2), V(W / 2, y0 + H, -L / 2)), frontM);
  bb.add(quad(V(-W / 2, y0, L / 2), V(W / 2, y0, L / 2), V(W / 2, y0 + H, L / 2), V(-W / 2, y0 + H, L / 2)), side);
  bb.add(boxGeo(V(-W / 2 - 0.03, y0 + H, -L / 2 - 0.03), V(W / 2 + 0.03, y0 + H + 0.18, L / 2 + 0.03)), roofM);
  const wheel = new THREE.CylinderGeometry(0.5, 0.5, 0.35, 16).rotateZ(Math.PI / 2);
  for (const sx of [-1, 1]) for (const z of [-3.2, 3.3]) bb.add(wheel, lam("tyre", () => ({ color: "#26252b" })), M4(sx * (W / 2 - 0.1), 0.5, z));
  bb.build(bus); bus.traverse((o) => { o.matrixAutoUpdate = true; });
  root.add(bus);
  // rolling shutters over three shop openings (dark interiors behind them)
  const shutters: THREE.Mesh[] = [], sm = lam("shutter", () => ({ map: shutterTex(), side: THREE.DoubleSide }));
  const dark = new THREE.MeshBasicMaterial({ color: "#1c1820" });
  for (const z of SHOPS) {
    const hole = new THREE.Mesh(new THREE.PlaneGeometry(3.2, 2.7), dark); hole.position.set(-5.99, D0 + 1.35, z); hole.rotation.y = Math.PI / 2; root.add(hole);
    const s = new THREE.Mesh(new THREE.PlaneGeometry(3.3, 2.8).translate(0, -1.4, 0), sm); s.position.set(-5.95, D0 + 2.8, z); s.rotation.y = Math.PI / 2;
    s.castShadow = true; s.receiveShadow = true; shutters.push(s); root.add(s);
    const box = new THREE.Mesh(new THREE.BoxGeometry(0.35, 0.4, 3.4), lam("shutterBox", () => ({ color: "#6d737c" }))); box.position.set(-5.85, D0 + 3.0, z); root.add(box);
  }
  // Bathukamma: a brass plate and rings of flowers, widest at the bottom; world.ts shows them one by one
  const rings: THREE.Mesh[] = [];
  const plate = new THREE.Mesh(new THREE.CylinderGeometry(0.6, 0.5, 0.06, 32), lam("brass", () => ({ color: "#d9a93a" })));
  plate.position.set(BK[0], D0 + 0.03, BK[1]); root.add(plate);
  let y = D0 + 0.06;
  RING_COLS.forEach((c, i) => {
    const r0 = 0.5 - i * 0.05, r1 = r0 - 0.05, h = 0.12;
    const m = new THREE.Mesh(new THREE.CylinderGeometry(r1, r0, h, 32), lam("ring" + c, () => ({ color: c })));
    m.position.set(BK[0], y + h / 2, BK[1]); m.castShadow = true; y += h; rings.push(m); root.add(m);
  });
  const bkTop = new THREE.Mesh(new THREE.SphereGeometry(0.09, 16, 10), lam("gauramma", () => ({ color: "#f2c14e" })));
  bkTop.position.set(BK[0], y + 0.06, BK[1]); root.add(bkTop);
  // the one lit window on the quiet street (bright enough to bloom)
  const window = new THREE.Mesh(new THREE.PlaneGeometry(1.0, 1.25), new THREE.MeshBasicMaterial({ color: new THREE.Color(3.2, 2.2, 0.9), fog: false }));
  window.position.set(...LAMP_WIN); window.rotation.y = Math.PI / 2; root.add(window);
  // hunger-strike canopy: four poles, a striped roof, a mat
  const canopy = new THREE.Group(), cb = new Batch();
  const stripe = lam("canopyCloth", () => ({ map: ctex("canopyCloth", 256, 256, (g) => { for (let i = 0; i < 8; i++) { g.fillStyle = i % 2 ? "#f6f1e6" : "#d8344f"; g.fillRect(i * 32, 0, 32, 256); } }), side: THREE.DoubleSide }));
  for (const sx of [-1, 1]) for (const sz of [-1, 1]) cb.add(boxGeo(V(sx * 2.4 - 0.05, 0, sz * 1.8 - 0.05), V(sx * 2.4 + 0.05, 2.7, sz * 1.8 + 0.05)), wood());
  cb.add(quad(V(-2.6, 2.7, 2.0), V(2.6, 2.7, 2.0), V(2.6, 3.2, 0), V(-2.6, 3.2, 0)), stripe);
  cb.add(quad(V(2.6, 2.7, -2.0), V(-2.6, 2.7, -2.0), V(-2.6, 3.2, 0), V(2.6, 3.2, 0)), stripe);
  cb.add(new THREE.PlaneGeometry(3.6, 2.4).rotateX(-Math.PI / 2).translate(0, 0.02, 0), lam("strikeMat", () => ({ color: "#e8d8b0" })));
  cb.build(canopy); canopy.position.set(CANOPY[0], D0, CANOPY[1]); canopy.traverse((o) => { o.matrixAutoUpdate = true; o.updateMatrix(); });
  root.add(canopy);
  return { bus, shutters, rings, bkTop, window, canopy };
};

// ---------------- the city ----------------
export const buildTelangana = (root: THREE.Object3D, kit: Kit, rays: Ray[]): Dyn => {
  const b = new Batch(), r = rng(19);
  setSight(rays);
  const pick = <T,>(a: T[]) => a[Math.floor(r() * a.length) % a.length];
  // the street: continuous flat-roofed fronts at |x| = 6 from the promenade to past the gate
  for (const sx of [-1, 1]) {
    let z = 39;
    while (z < 190) {
      const w = pick([6, 7, 8]), h = pick([6.5, 8, 9.5, 11]), cz = -(z + w / 2);
      if (Math.abs(cz - GATE[1]) > GATE_W / 2 + 4) flatHouse(b, sx * 10, cz, sx < 0 ? Math.PI / 2 : -Math.PI / 2, w, 8, h, Math.floor(r() * 8), r() < 0.5, D0, true);
      z += w + (r() < 0.15 ? 2 : 0.2);
    }
  }
  // lakefront rows facing the water on both banks, back rows behind
  for (const bank of [-1, 1]) for (const sx of [-1, 1]) {
    let x = 8;
    while (x < 150) {
      const w = pick([7, 8, 9]), h = pick([7, 9, 11, 13]);
      flatHouse(b, sx * (x + w / 2), bank * 41, bank > 0 ? Math.PI : 0, w, 8, h, Math.floor(r() * 8), r() < 0.4, D0, bank < 0);
      x += w + (r() < 0.2 ? 2 : 0.3);
    }
  }
  for (const zf of [56, 72, 90, 110, 130]) for (const bank of [-1, 1]) for (const sx of [-1, 1]) {
    let x = 17 + r() * 5;
    while (x < 170) {
      const w = pick([7, 9, 11]), h = pick([7, 9, 12, 15]), cx = sx * (x + w / 2), cz = bank * (zf + r() * 3);
      if (r() > 0.15 && !(bank < 0 && Math.abs(cx) < 30 && Math.abs(cz - GATE[1]) < 22)) flatHouse(b, cx, cz, bank > 0 ? Math.PI : 0, w, 8, h, Math.floor(r() * 8), r() < 0.5);
      x += w + 0.8 + r() * 3;
    }
  }
  buildGate(b);
  // the promenade: lamp posts and trees along the lake, a few stalls; the far shore: trees and low hills
  for (let x = -140; x <= 140; x += 10) if (Math.abs(x) > 6 && Math.abs(x - 30) > 5) prop(b, kit, "lantern", x, D0, -30.9, 3.2);
  for (const bank of [-1, 1]) for (let x = -150; x <= 150; x += 18) if (Math.abs(x) > 12) prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat"]), x + r() * 4, D0, bank * 34.6, 7 + r() * 3, r() * 6);
  const hill = new THREE.SphereGeometry(1, 28, 14, 0, Math.PI * 2, 0, Math.PI / 2);
  const hm = [lam("rockA", () => ({ color: "#b59a7a" })), lam("rockB", () => ({ color: "#a68c6e" })), lam("hillG", () => ({ color: "#8bb05c" }))];
  ([[-360, 250, 190, 40, 120], [140, 380, 240, 50, 140], [430, 150, 170, 38, 130], [-440, -160, 190, 34, 150], [-90, -390, 250, 44, 140],
    [320, -260, 160, 40, 110], [620, -120, 160, 40, 120], [-640, 40, 200, 46, 140]] as const).forEach(([x, z, sx, sy, sz], i) =>
    b.add(hill, hm[i % 3], new THREE.Matrix4().compose(V(x, D0 - 2, z), new THREE.Quaternion(), V(sx, sy, sz))));
  // Deccan boulders (the granite tors of the plateau) out on the plain
  const boulder = new THREE.SphereGeometry(1, 16, 10);
  for (let i = 0; i < 40; i++) {
    const a = r() * Math.PI * 2, d = 220 + r() * 300, x = Math.cos(a) * d, z = Math.sin(a) * d;
    if (Math.hypot(x - VIL[0], z - VIL[1]) < 110 || Math.hypot(x - DELHI[0], z - DELHI[1]) < 110 || Math.hypot(x - MINE[0], z - MINE[1]) < 90) continue;
    b.add(boulder, hm[i % 2], M4(x, D0 + 2, z, r() * 6, [4 + r() * 5, 3 + r() * 4, 4 + r() * 5]));
  }
  for (let i = 0; i < 160; i++) {
    const x = (r() - 0.5) * 560, z = (r() < 0.5 ? -1 : 1) * (50 + r() * 260);
    if (Math.abs(x) < 16 || (z < 0 && Math.abs(x) < 34 && z > -140)) continue;
    prop(b, kit, pick(["tree_oak", "tree_default", "tree_fat", "tree_detailed"]), x, D0, z, 7 + r() * 4, r() * 6);
  }
  buildVillage(b, kit, r);
  buildDelhi(b);
  buildMine(b);
  for (let i = 0; i < 10; i++) prop(b, kit, "lily_large", (r() - 0.5) * 120, 0.03, (r() < 0.5 ? -1 : 1) * (27.2 + r() * 2.2), 0.08, r() * 6);
  b.build(root);
  setSight([]);
  return buildDyn(root);
};
export { BUS };
