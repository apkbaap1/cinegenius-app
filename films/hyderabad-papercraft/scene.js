// Hyderabad: a pop-up paper city film, cut to a 74 s Tenglish voiceover (9 scenes).
//
// PAPER SPEC
// BRIEF      "How amazing a city Hyderabad is": Charminar + Laad Bazaar bangles, Golconda's clap acoustics, Hussain
//            Sagar's Buddha at evening on Necklace Road, dum biryani (UNESCO Creative City of Gastronomy), Irani chai +
//            Osmania biscuits, HITEC City glass towers, Durgam Cheruvu cable bridge changing colour at night, Ramoji Film
//            City (largest film studio complex), the mixed Telugu-Urdu-Hindi people, and a wide close. No references.
// SUBJECT    one toy city map whose districts fold up when the camera arrives; the old city's lime-plaster cream and
//            Golconda's granite against the cyber city's teal glass is the twist (400 years of history + the future)
// STOCK      cream cardstock, quiet fibre; granite boulders get a heavier speckle
// PALETTE    ground #d6c6a0 / #cbb98f (sun-baked sandstone map), lead family lime plaster + pastel houses #ecd8b0
//            #e8be93 #d8aea6 #c5d2bd #e3cc8c #d3bfd3, Charminar plaster #e7d4ad, granite #b3a08c / #8e7c6a, lake
//            #5f8f9a / #3f6f7c, accents saffron #e0952e + bangle red #c33b4d + bangle pink #d56f98, glass teal #4c7f97,
//            neem green #6d8a4e, ink #3a2414, shadow amber-umber, haze #d9c08f
// LIGHT      warm key from the left 52 deg up; golden for the lanes, dusk on the lake, night on the bridge, dusk wide end
// LENS       fov from the harness (tall frame keeps the short side), pitch 40-54, band per shot, blur 14 px
// FORMAT     1080x1920 9:16 Reel, 30 fps, 74 s, the subject in the Meta safe box (y 288-1248)
// GROUND     a printed city map: sandstone washes, torn pale roads, tiled plazas, granite patches, two lakes
// LAYOUT     Charminar (0,0) at the centre, Laad Bazaar lane west, Golconda far west, Hussain Sagar NE, food street S,
//            HITEC City + Durgam Cheruvu far NE, Ramoji NW; the roads are the leading lines between them
// MOTION     each district: flat print -> landmark rises -> dressing ripples outward (0.03 s stagger), one camera
//            move per shot, cuts on the VO pauses
// LIFE       pigeons over Charminar, kites over the old city, steam from the handi and chai, paper boats on the lake,
//            autos and walkers moving along the roads, a tower crane turning in HITEC City
// TYPES      folded prisms (houses, Charminar, towers, cafe), slotted crosses (minarets, neem, palms, lamp posts),
//            layered stacks (Golconda terraces, bougainvillea), half-crosses (film-set flats braced behind), cards
// SOUND      paper flaps per rise + a quiet felt-piano bed under the VO (mixed outside)
// BANNED     grey shadows, a horizon, gloss, countryside colours, saturated green, stamped clones, text across faces
import * as P2 from 'papercraft/lib/paperkit-2d.js';
import * as THREE from 'three';
import { makeCard, layeredCard, prismFold, boxFold } from 'papercraft/lib/paperkit-3d.js';
import { createLife } from 'papercraft/lib/paper-life.js';
import { renderScoreOffline } from 'papercraft/lib/paper-music.js';
import { checkContinuity, polarCameraPos } from 'papercraft/lib/paper-motion.js';
import { createHarness } from './harness.js';

const T0 = performance.now(), stage = (n) => console.log('stage', n, Math.round(performance.now() - T0), 'ms');
const D = P2.draw2, shade = P2.shade, mix = P2.mix, rgba = P2.rgba;
const C = {
  ground: '#d6c6a0', groundB: '#cbb98f', groundC: '#ddd0ae', road: '#efe4c8', roadEdge: '#bfa77e', tile: '#e4d6b6',
  plaster: '#e7d4ad', plasterB: '#d4bd90', trim: '#b8946a', recess: '#5a3c26',
  walls: ['#ecd8b0', '#e8be93', '#d8aea6', '#c5d2bd', '#e3cc8c', '#d3bfd3', '#e9d0c0'],
  doors: ['#3f7a70', '#2f5d7c', '#b5523b', '#7a4a8a'],
  granite: '#b3a08c', graniteB: '#8e7c6a', lake: '#5f8f9a', lakeDeep: '#3f6f7c',
  saffron: '#e0952e', red: '#c33b4d', pink: '#d56f98', gold: '#d9a441', glass: '#4c7f97', glassB: '#7fb0c2',
  neem: '#6d8a4e', neemB: '#56723f', olive: '#4a5a30', bloom: '#c2407a', ink: '#3a2414', cream: '#f6ecd4', window: '#ffc45a',
};
const PI = Math.PI;

// ---------------------------------------------------------------------------------------------------------------
// the harness: a film (no hero), a camera on a controller
// ---------------------------------------------------------------------------------------------------------------
const H = createHarness({
  ground: C.ground, bounds: { x0: -135, x1: 145, z0: -135, z1: 105 }, autoOpen: false, roam: true, crossTurn: 40,
  view: { pitch: 48, dist: 70, target: [0, 2, 4] }, subject: [0, 0],
  lens: { haze: '#d9c08f', hazeStart: 40, hazeEnd: 130, hazeAmount: 0.25, aoTint: '#5a3214', shadowTint: '#3a200c', saturation: 1.06, tint: [1.0, 0.99, 0.985], greenDesat: 0.12, exposure: 0.86 },
});

// ---------------------------------------------------------------------------------------------------------------
// the map: places and roads (one spec drives the print and the placement)
// ---------------------------------------------------------------------------------------------------------------
const AT = {
  charminar: [0, 0], bazaar: [-20, 6], golconda: [-64, -14], lake: [50, -10], food: [-4, 44],
  hitec: [92, -62], durgam: [62, -64], ramoji: [-60, -74], lanes: [-24, 26],
};
const LAKE = { x: 50, z: -10, rx: 18, rz: 11 };
const DURGAM = { x: 62, z: -64, rx: 15, rz: 5.2 };
const blob = (o, n = 48, wob = [0.06, 0.05]) => Array.from({ length: n }, (_, i) => { const a = i / n * 2 * PI, w = 1 + wob[0] * Math.sin(a * 3 + 1) + wob[1] * Math.sin(a * 5 + 2); return [o.x + Math.cos(a) * o.rx * w, o.z + Math.sin(a) * o.rz * w]; });
const inside = (poly, x, z) => { let c = false; for (let i = 0, j = poly.length - 1; i < poly.length; j = i++) { const [xi, zi] = poly[i], [xj, zj] = poly[j]; if ((zi > z) !== (zj > z) && x < (xj - xi) * (z - zi) / (zj - zi) + xi) c = !c; } return c; };
const lakePts = blob(LAKE), durgamPts = blob(DURGAM, 40, [0.1, 0.06]);
const inLake = (x, z, m = 0) => ((x - LAKE.x) / (LAKE.rx + m)) ** 2 + ((z - LAKE.z) / (LAKE.rz + m)) ** 2 < 1.2;
const inDurgam = (x, z, m = 0) => ((x - DURGAM.x) / (DURGAM.rx + m)) ** 2 + ((z - DURGAM.z) / (DURGAM.rz + m)) ** 2 < 1.25;
const ROADS = [
  P2.pathLine([[0, 8], [-10, 9], [-22, 5], [-34, 8], [-46, 2], [-56, -4]]),            // Laad Bazaar lane -> Golconda
  P2.pathLine([[6, -6], [16, -14], [26, -12], [32, -24], [42, -26], [58, -26], [72, -20], [74, -6], [66, 4], [44, 5], [30, 0]]),   // to the lake, round it (Necklace Road)
  P2.pathLine([[0, 9], [3, 18], [-2, 28], [-4, 36], [-6, 52], [-2, 64]]),             // south to the food street
  P2.pathLine([[72, -22], [76, -34], [70, -46], [74, -54], [84, -52], [96, -48], [108, -54]]),   // to HITEC City
  P2.pathLine([[-56, -4], [-60, -26], [-52, -40], [-58, -56], [-64, -80], [-58, -96]]),   // Golconda -> Ramoji
  P2.pathLine([[-34, 8], [-30, 20], [-22, 26], [-8, 30], [-2, 28]]),                   // the old-city lane loop
  P2.pathLine([[50, -78], [62, -74], [76, -72], [92, -76], [106, -70]]),                // behind the Durgam Cheruvu
];
const roadDist = (x, z) => Math.min(...ROADS.map((r) => r.dist(x, z)));
const PLAZAS = [[0, 0, 13], [-4, 44, 10], [-60, -74, 15], [92, -62, 13]];   // x, z, r: paved (tiled) squares
const keepOut = [];
const mark = (x, z, r) => keepOut.push([x, z, r]);
const free = (x, z, m = 0) => roadDist(x, z) > 2.6 + m && !inLake(x, z, 2 + m) && !inDurgam(x, z, 2.5 + m) && keepOut.every(([kx, kz, r]) => Math.hypot(x - kx, z - kz) > r + m);

H.printGround(({ g, ppu, X, Z, rnd, washes, torn, bandOf, line, drifts, water }) => {
  washes([C.ground, C.groundB, C.groundC, '#d2bf98', '#c9c09a']);
  // districts: torn regions of their own paper
  const region = (cx, cz, rx, rz, col, n = 30, fr) => torn(Array.from({ length: n }, (_, i) => { const a = i / n * 2 * PI, w = 1 + 0.12 * Math.sin(a * 4 + cx) + 0.07 * Math.sin(a * 7 + cz); return [cx + Math.cos(a) * rx * w, cz + Math.sin(a) * rz * w]; }), col, fr);
  region(-64, -16, 26, 20, rgba('#b8a587', 0.75));                  // Golconda's granite ground
  region(-60, -74, 30, 22, rgba('#d8b882', 0.7));                   // Ramoji's dusty lot
  region(88, -58, 34, 26, rgba('#c9c8bc', 0.6));                    // HITEC City paving
  region(-24, 26, 22, 14, rgba('#dcc29a', 0.55));                    // old-city lanes
  region(50, -10, 27, 19, rgba('#b9b98a', 0.55));                    // the green lake shore
  for (let k = 0; k < 18; k++) {                                     // parks: muted green torn patches
    const x = -120 + rnd() * 250, z = -120 + rnd() * 210; if (!free(x, z, 3)) continue;
    region(x, z, 5 + rnd() * 6, 3.5 + rnd() * 4, rgba('#a6ad78', 0.6), 18);
  }
  // granite patches with boulder marks near Golconda and Durgam Cheruvu
  for (let k = 0; k < 260; k++) {
    const near = k % 2 ? [-64, -16, 26] : [62, -64, 20], a = rnd() * 2 * PI, r = Math.sqrt(rnd()) * near[2], x = near[0] + Math.cos(a) * r, z = near[1] + Math.sin(a) * r * 0.8;
    if (inDurgam(x, z, 0.5)) continue;
    g.fillStyle = rgba(rnd() < 0.5 ? '#9c8a76' : '#c4b39e', 0.55); g.beginPath(); g.ellipse(X(x), Z(z), (0.3 + rnd() * 0.7) * ppu, (0.2 + rnd() * 0.4) * ppu, rnd() * 3, 0, 7); g.fill();
  }
  // plazas: tiled stone squares (a pale torn disc with a printed tile grid)
  for (const [px, pz, pr] of PLAZAS) {
    const disc = Array.from({ length: 40 }, (_, i) => { const a = i / 40 * 2 * PI; return [px + Math.cos(a) * pr * (1 + 0.04 * Math.sin(a * 5)), pz + Math.sin(a) * pr * (1 + 0.04 * Math.sin(a * 5))]; });
    torn(disc, C.tile);
    g.save(); g.beginPath(); disc.forEach(([x, z], i) => (i ? g.lineTo(X(x), Z(z)) : g.moveTo(X(x), Z(z)))); g.closePath(); g.clip();
    g.strokeStyle = rgba(shade(C.tile, -0.25), 0.45); g.lineWidth = 0.08 * ppu;
    for (let d = -pr; d <= pr; d += 1.6) { g.beginPath(); g.moveTo(X(px + d), Z(pz - pr)); g.lineTo(X(px + d), Z(pz + pr)); g.stroke(); g.beginPath(); g.moveTo(X(px - pr), Z(pz + d)); g.lineTo(X(px + pr), Z(pz + d)); g.stroke(); }
    g.fillStyle = rgba('#c9a46a', 0.4); for (let k = 0; k < 40; k++) { const x = px + (rnd() - 0.5) * pr * 1.6, z = pz + (rnd() - 0.5) * pr * 1.6; g.fillRect(X(Math.round(x / 1.6) * 1.6), Z(Math.round(z / 1.6) * 1.6), 1.6 * ppu, 1.6 * ppu); }
    g.restore();
  }
  // roads: torn pale strips with a darker fringe and grit
  for (const r of ROADS) {
    torn(bandOf(r.pts, 2.45), rgba(shade(C.roadEdge, -0.05), 0.55), 'rgba(0,0,0,0)');
    torn(bandOf(r.pts, 2.0), C.road);
    line(r.pts, 0.16, rgba('#c9b085', 0.5));
    for (let k = 0; k < r.pts.length; k += 2) { const [x, z] = r.pts[k]; g.fillStyle = rnd() < 0.6 ? rgba(shade(C.road, -0.3), 0.5) : rgba('#fff6e2', 0.7); g.beginPath(); g.arc(X(x + (rnd() - 0.5) * 3), Z(z + (rnd() - 0.5) * 3), (0.05 + rnd() * 0.07) * ppu, 0, 7); g.fill(); }
  }
  // the two lakes (the brief's water), printed into the page
  water(lakePts, { colors: [C.lake, C.lakeDeep], rim: '#e8dcc0', marks: 'ripples', markColor: 'rgba(246,236,212,0.75)', flow: 0.2, foam: 'rgba(246,236,212,0.6)', density: 1.4 });
  g.fillStyle = '#a99a84'; g.beginPath(); g.ellipse(X(LAKE.x), Z(LAKE.z), 2.6 * ppu, 1.8 * ppu, 0, 0, 7); g.fill();   // the Buddha's rock island
  g.strokeStyle = rgba('#f2e8d2', 0.8); g.lineWidth = 0.14 * ppu; g.stroke();
  water(durgamPts, { colors: ['#4f7f8c', '#335f6c'], rim: '#cdbfa6', marks: 'ripples', markColor: 'rgba(246,236,212,0.7)', flow: 0, density: 1.2 });
  drifts((x, y) => {                                                  // grass ticks and tiny flowers in drifts
    if (rnd() < 0.8) { g.strokeStyle = rgba(rnd() < 0.5 ? '#7d8650' : '#9a9a5e', 0.6); g.lineWidth = 1.4; g.beginPath(); g.moveTo(x, y); g.lineTo(x + (rnd() - 0.5) * 3, y - 4 - rnd() * 4); g.stroke(); }
    else { g.fillStyle = rnd() < 0.5 ? '#f3e6c8' : C.bloom; g.beginPath(); g.arc(x, y, 1.8, 0, 7); g.fill(); }
  }, { n: 12000 });
});

// ---------------------------------------------------------------------------------------------------------------
// districts: every piece belongs to the district whose shot raises it
// ---------------------------------------------------------------------------------------------------------------
const GROUPS = {};
let CUR = 'city';
const within = (name, fn) => { const prev = CUR; CUR = name; fn(); CUR = prev; };
const put = (pts, paint, o = {}) => { const h = H.popup(pts, paint, o); (GROUPS[o.group || CUR] ||= []).push(h); return h; };
const putNode = (node, o) => put(null, null, { ...o, node });
let rnd = P2.rng(101);
const between = (a, b) => a + rnd() * (b - a);
const pick = (arr) => arr[Math.floor(rnd() * arr.length) % arr.length];

// text on a card (the canvas is y up: flip locally)
const text = (g, str, x, y, size, color, { font = 'Georgia, serif', weight = 'bold', align = 'center' } = {}) => {
  g.save(); g.translate(x, y); g.scale(size / 100, -size / 100); g.fillStyle = color; g.font = `${weight} 100px ${font}`; g.textAlign = align; g.textBaseline = 'middle'; g.fillText(str, 0, 0); g.restore();
};
const arch = (x0, x1, y0, spring, peak, n = 10) => {   // a pointed (Deccani) arch outline, base y0, springing at y0+spring
  const w = x1 - x0, cx = (x0 + x1) / 2, pts = [[x0, y0], [x1, y0], [x1, y0 + spring]];
  for (let i = 1; i <= n; i++) { const t = i / n; pts.push([x1 - t * w / 2 + Math.sin(t * PI) * 0.12 * w * 0.5, y0 + spring + Math.sin(t * PI / 2) * peak]); }
  for (let i = 1; i < n; i++) { const t = i / n; pts.push([cx - t * w / 2 - Math.sin(t * PI) * 0.12 * w * 0.5, y0 + spring + peak - (1 - Math.cos(t * PI / 2)) * peak]); }
  pts.push([x0, y0 + spring]);
  return pts;
};
const pathOf = (g, pts) => { g.beginPath(); pts.forEach(([x, y], i) => (i ? g.lineTo(x, y) : g.moveTo(x, y))); g.closePath(); };

// ---------------------------------------------------------------------------------------------------------------
// prints
// ---------------------------------------------------------------------------------------------------------------
const plasterBase = (P, col, felt = 0.5) => { P.gradient(shade(col, 0.08), shade(col, -0.1), 0.5); P.felt(felt); };
// a house wall: plaster, a plinth, rows of arched windows with shutters (lit panes), a door on the front, a parapet band
const paintHouseWall = (col, { door = false, floors = 2, doorCol = '#3f7a70', seed = 1, balcony = false } = {}) => (P) => {
  const { box } = P, r = P2.rng(seed), W = box.w, Hh = box.h;
  plasterBase(P, col);
  P.marks('dab', { color: shade(col, -0.25), alpha: 0.25, size: 0.05, density: 0.35 });
  P.layer((g) => { g.fillRect(box.x0 - 1, box.y0 - 1, W + 2, Hh * 0.1 + 1); }, shade(col, -0.22), { lip: 0.6 });               // plinth
  P.layer((g) => { g.fillRect(box.x0 - 1, box.y1 - Hh * 0.09, W + 2, Hh * 0.1); }, mix(col, C.cream, 0.45), { lip: 0.7 });    // parapet band
  const nWin = Math.max(1, Math.round(W / 2.2)), fh = (Hh * 0.8) / floors;
  // batched layers (one lip-and-shadow pass each): window frames, then shutters, then the door
  const win = (fn) => { for (let f = 0; f < floors; f++) for (let i = 0; i < nWin; i++) { const isDoor = door && f === 0 && i === Math.floor(nWin / 2); fn(box.x0 + (i + 0.5) * W / nWin, box.y0 + Hh * 0.13 + f * fh + fh * 0.18, Math.min(1.0, W / nWin * 0.45), fh * 0.55, isDoor); } };
  P.layer((g) => { win((cx, y, ww, wh, isDoor) => { if (isDoor) return; pathOf(g, arch(cx - ww / 2 - 0.1, cx + ww / 2 + 0.1, y - 0.1, wh * 0.72, wh * 0.36, 6)); g.fill(); }); if (balcony) g.fillRect(box.x0 + W * 0.15, box.y0 + Hh * 0.13 + fh - 0.1, W * 0.7, 0.32); }, shade(col, -0.45), { lip: 0.5 });
  const shut = r() < 0.5 ? '#2f5d7c' : '#3f7a70';
  P.layer((g) => { win((cx, y, ww, wh, isDoor) => { if (isDoor) return; g.fillRect(cx - ww / 2 - 0.34, y, 0.26, wh * 0.8); g.fillRect(cx + ww / 2 + 0.08, y, 0.26, wh * 0.8); }); }, shut, { lip: 0.5 });
  if (door) P.layer((g) => { win((cx, y, ww, wh, isDoor) => { if (!isDoor) return; pathOf(g, arch(cx - 0.55, cx + 0.55, box.y0 + Hh * 0.1, fh * 0.55, 0.5, 6)); g.fill(); }); }, doorCol, { lip: 0.6 });
  P.glow((g) => {
    for (let f = 0; f < floors; f++) for (let i = 0; i < nWin; i++) {
      if (door && f === 0 && i === Math.floor(nWin / 2)) continue;
      if (((i * 7 + f * 3 + seed) % 5) > 2) continue;                                  // some panes lit, some dark
      const cx = box.x0 + (i + 0.5) * W / nWin, y = box.y0 + Hh * 0.13 + f * fh + fh * 0.18, ww = Math.min(1.0, W / nWin * 0.45), wh = fh * 0.55;
      pathOf(g, arch(cx - ww / 2, cx + ww / 2, y, wh * 0.65, wh * 0.3, 6)); g.fill();
    }
  });
  P.draw((g) => { for (let f = 0; f < floors; f++) for (let i = 0; i < nWin; i++) {
    if (door && f === 0 && i === Math.floor(nWin / 2)) continue;
    if (((i * 7 + f * 3 + seed) % 5) > 2) { const cx = box.x0 + (i + 0.5) * W / nWin, y = box.y0 + Hh * 0.13 + f * fh + fh * 0.18, ww = Math.min(1.0, W / nWin * 0.45), wh = fh * 0.55; g.fillStyle = '#4a3a30'; pathOf(g, arch(cx - ww / 2, cx + ww / 2, y, wh * 0.65, wh * 0.3, 6)); g.fill(); }
    else { const cx = box.x0 + (i + 0.5) * W / nWin, y = box.y0 + Hh * 0.13 + f * fh + fh * 0.18, ww = Math.min(1.0, W / nWin * 0.45), wh = fh * 0.55; g.fillStyle = C.window; pathOf(g, arch(cx - ww / 2, cx + ww / 2, y, wh * 0.65, wh * 0.3, 6)); g.fill(); }
  } });
  P.innerShade(shade(col, -0.6), { alpha: 0.3, blurPx: 8 });
};
// a flat terrace roof: concrete, a parapet, and the city's black water tank
const paintTerrace = (col, tank = true) => (P) => {
  const { box } = P;
  P.gradient(shade(col, -0.02), shade(col, -0.14), 0.4); P.felt(0.5);
  P.marks('dab', { color: shade(col, -0.3), alpha: 0.2, size: 0.06, density: 0.3 });
  P.layer((g) => { g.lineWidth = Math.min(box.w, box.h) * 0.08; g.strokeStyle = '#000'; g.strokeRect(box.x0, box.y0, box.w, box.h); }, mix(col, C.cream, 0.4), { lip: 0.6 });
  if (tank) P.draw((g) => { const ink = (c) => c; g.fillStyle = ink('#2c2722'); D.ell(g, box.x0 + box.w * 0.7, box.y0 + box.h * 0.6, Math.min(box.w, box.h) * 0.16, Math.min(box.w, box.h) * 0.16); g.fillStyle = '#4a443c'; D.ell(g, box.x0 + box.w * 0.7, box.y0 + box.h * 0.6, Math.min(box.w, box.h) * 0.07, Math.min(box.w, box.h) * 0.07); });
};

// ---------------------------------------------------------------------------------------------------------------
// pieces
// ---------------------------------------------------------------------------------------------------------------
// a city house: a folded box with a flat terrace, pastel lime-plaster walls
function house(x, z, { w = between(4.2, 6.2), d = between(3.6, 5), h = between(4.6, 8), col = pick(C.walls), yaw = null, floors = null, ppu = 26 } = {}) {
  const seed = Math.floor(rnd() * 1000), fl = floors || (h > 6.4 ? 3 : 2), doorCol = pick(C.doors);
  const node = prismFold([[-w / 2, 0], [w / 2, 0], [w / 2, -d], [-w / 2, -d]], {
    h, roof: 'flat', paper: H.paper, center: true, print: { ...H.cardOpts(x, z), pxPerUnit: ppu },
    paints: { wall: [paintHouseWall(col, { door: true, floors: fl, doorCol, seed, balcony: rnd() < 0.4 }), paintHouseWall(shade(col, -0.04), { floors: fl, seed: seed + 1 }), paintHouseWall(col, { floors: fl, seed: seed + 2 }), paintHouseWall(shade(col, -0.04), { floors: fl, seed: seed + 3 })], roof: paintTerrace('#cbbd9e', rnd() < 0.7) },
  });
  mark(x, z, Math.max(w, d) * 0.62);
  return putNode(node, { x, z, height: h, yaw: yaw ?? (rnd() - 0.5) * 0.5 });
}
// a neem tree: a slotted cross, a lobed crown on a trunk, small leaves in two accents and pale blossom
const neemTree = () => {
  const hh = between(7, 9.5), w = hh * between(0.72, 0.85), r = rnd;
  const crown = P2.shape.radial(r, { cx: 0, cy: hh * 0.62, rx: w / 2, ry: hh * 0.36, lobes: 9, depth: 0.12, stalk: { w: w * 0.14, base: 0 } });
  const paint = (P) => {
    const { box } = P, rr = P.r;
    P.gradient(shade(C.neem, 0.1), shade(C.neemB, -0.05), 0.5); P.felt(0.6);
    P.layer((g) => { g.fillStyle = '#000'; P2.fillLimb(g, 0, box.y0, -0.1, hh * 0.3, 0, hh * 0.45, w * 0.08, w * 0.05); for (const a of [-0.9, -0.4, 0.3, 0.85]) P2.fillLimb(g, 0, hh * 0.38, Math.sin(a) * w * 0.2, hh * 0.5, Math.sin(a) * w * 0.34, hh * 0.66 + Math.cos(a) * hh * 0.12, w * 0.045, w * 0.015); }, '#6e4a2c', { lip: 0.6 });
    P.layer((g) => { for (let i = 0; i < 26; i++) { const a = rr() * 2 * PI, rad = Math.sqrt(rr()) * 0.9; g.fillStyle = '#000'; P2.fillLeaf(g, Math.cos(a) * w * 0.45 * rad, hh * 0.62 + Math.sin(a) * hh * 0.32 * rad, w * 0.15, rr() * 6.28, 0.32); } }, '#93a356', { lip: 0.7 });
    P.layer((g) => { for (let i = 0; i < 14; i++) { const a = rr() * 2 * PI, rad = Math.sqrt(rr()) * 0.85; g.fillStyle = '#000'; P2.fillLeaf(g, Math.cos(a) * w * 0.42 * rad, hh * 0.62 + Math.sin(a) * hh * 0.3 * rad, w * 0.13, rr() * 6.28, 0.32); } }, C.olive, { lip: 0.5 });
    P.parts((g, ink) => { for (let i = 0; i < 10; i++) { const a = rr() * 2 * PI, rad = Math.sqrt(rr()) * 0.8; g.fillStyle = ink('#f1e2b8'); D.ell(g, Math.cos(a) * w * 0.4 * rad, hh * 0.62 + Math.sin(a) * hh * 0.28 * rad, w * 0.03, w * 0.03); } });
    P.innerShade('#2c3a1c', { alpha: 0.35, blurPx: 8 });
  };
  return [crown, paint];
};
// a palm: fronds fanned from a ringed trunk
const palm = () => P2.drawnPiece((g, ink) => {
  const r = P2.rng(7), hh = 9;
  g.fillStyle = ink('#8a6a44'); P2.fillLimb(g, 0, 0, 0.6, hh * 0.5, 0.2, hh * 0.82, 0.55, 0.36);
  g.fillStyle = ink('#6b4e30', 'print'); for (let k = 1; k < 9; k++) { const t = k / 10, [x, y] = P2.limbPoint(0, 0, 0.6, hh * 0.5, 0.2, hh * 0.82, t); D.rect(g, x - 0.3, y, 0.6, 0.12); }
  for (const [a, col] of [[-0.45, '#5b7a3e'], [3.6, '#5b7a3e'], [0.1, '#6e8f48'], [3.05, '#6e8f48'], [0.65, '#7f9c52'], [2.5, '#7f9c52'], [1.15, '#5b7a3e'], [2.0, '#6e8f48'], [1.57, '#7f9c52']]) { g.fillStyle = ink(col); P2.fillLeaf(g, 0.2, hh * 0.84, 3.3, a, 0.26); }
  g.fillStyle = ink('#c8812e'); D.ell(g, 0.0, hh * 0.8, 0.32, 0.3); D.ell(g, 0.5, hh * 0.78, 0.3, 0.28);
}, { w: 8, h: 11.4, name: 'palm' });
// bougainvillea: a dark scalloped body + a lighter card of magenta bracts in front (two cards on one hinge)
function bougainvillea(x, z, s = 1) {
  const w = between(4.5, 6.5);
  const body = P2.roughen(P2.shape.mound(rnd, { w, h: w * 0.5, lobes: 7, depth: 0.2 }), rnd);
  const front = P2.roughen(P2.shape.mound(rnd, { w: w * 0.78, h: w * 0.36, lobes: 6, depth: 0.16 }), rnd);
  const paintBody = (P) => { P.gradient('#5f7c44', '#4a6436', 0.5); P.felt(0.5); P.layer((g) => { const rr = P.r; for (let i = 0; i < 16; i++) { g.fillStyle = '#000'; P2.fillLeaf(g, (rr() - 0.5) * w * 0.8, rr() * w * 0.42, w * 0.11, rr() * 6.3, 0.35); } }, '#7f9a52', { lip: 0.6 }); };
  const paintFront = (P) => {
    P.gradient('#6e8a4a', '#58733c', 0.5); P.felt(0.4);
    P.layer((g) => { const rr = P.r; for (let i = 0; i < 22; i++) { const x0 = (rr() - 0.5) * w * 0.68, y0 = rr() * w * 0.32; g.fillStyle = '#000'; for (let q = 0; q < 3; q++) D.ell(g, x0 + Math.cos(q * 2.1) * 0.22, y0 + Math.sin(q * 2.1) * 0.22, 0.24, 0.2, q); } }, C.bloom, { lip: 0.7 });
    P.parts((g, ink) => { const rr = P.r; for (let i = 0; i < 9; i++) { g.fillStyle = ink('#f3dfe6'); D.ell(g, (rr() - 0.5) * w * 0.6, rr() * w * 0.3, 0.16, 0.14); } });
    P.innerShade('#2c3a1c', { alpha: 0.3, blurPx: 6 });
  };
  const node = layeredCard([{ pts: body, paint: paintBody }, { pts: front, paint: paintFront, z: 0.4 }], H.cardOpts(x, z, s));
  return putNode(node, { x, z, height: w * 0.5, scale: s, yaw: null, sway: 0.5 });
}
// Deccan granite: rounded boulders balanced on each other (one card)
const boulders = (seed) => P2.drawnPiece((g, ink) => {
  const r = P2.rng(seed); let y = 0; const n = 2 + Math.floor(r() * 2);
  for (let i = 0; i < n; i++) { const rw = 2.3 - i * 0.45 + r() * 0.5, rh = rw * (0.6 + r() * 0.25), x = (r() - 0.5) * 1.2; g.fillStyle = ink(shade(C.granite, (i % 2 ? 0.08 : -0.04) + r() * 0.06)); D.ell(g, x, y + rh, rw, rh, (r() - 0.5) * 0.3); g.fillStyle = ink(shade(C.granite, -0.25), 'print'); D.ell(g, x + rw * 0.35, y + rh * 0.7, rw * 0.45, rh * 0.55); g.fillStyle = ink('#c9b98a', 'print'); D.ell(g, x - rw * 0.4, y + rh * 1.5, rw * 0.25, rh * 0.18); y += rh * 1.75; }
  g.fillStyle = ink(shade(C.granite, -0.1)); D.rect(g, -2.4, 0, 4.8, 0.5, 0.2);
}, { w: 5.6, h: 9, name: 'boulders' });
// people: one card each, legs -> body -> head, costume detail printed
const PEOPLE = [
  { body: '#f3ecdd', trim: '#c9a46a', head: '#f1f0ea', legs: '#e8e2d2', kind: 'kurta' },   // white kurta, skullcap
  { body: '#c2407a', trim: '#e3b44a', head: '#2a1a12', legs: '#c2407a', kind: 'saree' },  // magenta saree
  { body: '#3f7a70', trim: '#e3b44a', head: '#2a1a12', legs: '#e8c77a', kind: 'salwar' }, // teal salwar
  { body: '#2f5d7c', trim: '#f3ecdd', head: '#3a2414', legs: '#4a4038', kind: 'shirt' },  // blue shirt
  { body: '#e0952e', trim: '#7a3020', head: '#2a1a12', legs: '#e0952e', kind: 'saree' },  // saffron saree
  { body: '#e8d9b8', trim: '#8a5a3a', head: '#3a2414', legs: '#6a5a48', kind: 'shirt' },  // chai vendor
  { body: '#7a4a8a', trim: '#f0d58a', head: '#2a1a12', legs: '#e8d9b8', kind: 'salwar' }, // violet salwar
];
const person = (p, s = 1, extra = null) => P2.drawnPiece((g, ink) => {
  const skin = '#c58a5c';
  if (p.kind === 'saree') { g.fillStyle = ink(p.body); D.poly(g, [[-0.55, 0], [0.55, 0], [0.38, 1.6], [-0.38, 1.6]]); }
  else { g.fillStyle = ink(p.legs); D.rect(g, -0.34, 0, 0.28, 1.3, 0.08); D.rect(g, 0.06, 0, 0.28, 1.3, 0.08); g.fillStyle = ink('#3a2414'); D.rect(g, -0.4, 0, 0.36, 0.16, 0.06); D.rect(g, 0.04, 0, 0.36, 0.16, 0.06); }
  g.fillStyle = ink(p.body); D.rect(g, -0.46, p.kind === 'kurta' ? 0.75 : 1.1, 0.92, p.kind === 'kurta' ? 1.6 : 1.25, 0.2);
  g.fillStyle = ink(p.trim, 'print'); D.rect(g, -0.46, 1.35, 0.92, 0.08); D.rect(g, -0.04, 1.6, 0.08, 0.7);
  if (p.kind === 'saree') { g.fillStyle = ink(shade(p.body, 0.15)); D.poly(g, [[0.46, 2.3], [0.2, 2.35], [-0.5, 1.2], [-0.3, 1.0]]); g.fillStyle = ink(p.trim, 'print'); D.poly(g, [[-0.5, 1.2], [-0.3, 1.0], [-0.24, 1.1], [-0.44, 1.3]]); }
  g.fillStyle = ink(skin); D.rect(g, -0.62, 1.4, 0.18, 0.85, 0.08); D.rect(g, 0.44, 1.4, 0.18, 0.85, 0.08);
  g.fillStyle = ink(skin); D.ell(g, 0, 2.72, 0.36, 0.4);
  g.fillStyle = ink(p.head); if (p.kind === 'kurta') D.rect(g, -0.32, 2.95, 0.64, 0.28, 0.12); else if (p.kind === 'saree' || p.kind === 'salwar') D.ell(g, 0, 2.92, 0.4, 0.3); else D.ell(g, 0, 2.98, 0.36, 0.2);
  g.fillStyle = ink('#2a1608', 'print'); D.ell(g, -0.12, 2.74, 0.04, 0.05); D.ell(g, 0.12, 2.74, 0.04, 0.05);
  g.fillStyle = ink('#8a3a22', 'print'); D.rect(g, -0.08, 2.54, 0.16, 0.035);
  if (p.kind === 'saree' || p.kind === 'salwar') { g.fillStyle = ink('#c33b4d', 'print'); D.ell(g, 0, 2.86, 0.035, 0.035); }
  if (extra) extra(g, ink);
}, { w: 1.6 * s + 0.4, h: 3.4, name: 'person' });
// an auto-rickshaw in profile: yellow canopy, green body, three wheels
const autoRickshaw = () => P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#2a2622'); D.ell(g, -1.3, 0.42, 0.42, 0.42); D.ell(g, 1.35, 0.42, 0.42, 0.42);
  g.fillStyle = ink('#2e6a44'); D.poly(g, [[-1.9, 0.55], [1.9, 0.55], [2.05, 1.5], [1.4, 1.65], [-1.7, 1.65], [-2.0, 1.2]]);
  g.fillStyle = ink('#e3b22e'); D.poly(g, [[-1.8, 1.6], [1.5, 1.6], [1.7, 2.9], [-0.6, 3.15], [-1.75, 2.95]]);
  g.fillStyle = ink('#3a2a1a', 'print'); D.poly(g, [[-1.4, 1.75], [0.2, 1.75], [0.2, 2.7], [-1.4, 2.7]]);
  g.fillStyle = ink('#f3ecdd', 'print'); D.rect(g, -1.9, 0.95, 3.9, 0.1);
  g.fillStyle = ink('#e3b22e', 'print'); D.ell(g, 1.9, 1.25, 0.12, 0.12);
  g.fillStyle = ink('#9a948a', 'print'); D.ell(g, -1.3, 0.42, 0.16, 0.16); D.ell(g, 1.35, 0.42, 0.16, 0.16);
}, { w: 4.4, h: 3.3, name: 'auto' });
// a scooter with a family of three
const scooter = () => P2.drawnPiece((g, ink) => {
  g.fillStyle = ink('#2a2622'); D.ell(g, -1.0, 0.34, 0.34, 0.34); D.ell(g, 1.1, 0.34, 0.34, 0.34);
  g.fillStyle = ink('#c33b4d'); D.poly(g, [[-1.4, 0.5], [0.2, 0.5], [0.6, 1.1], [1.3, 1.0], [1.45, 0.45], [1.0, 0.4], [1.2, 1.9], [1.0, 1.95], [0.8, 1.2], [-1.4, 1.2]]);
  for (const [x, c, hh, sk] of [[-0.9, '#2f5d7c', 2.6, '#2a1a12'], [-0.3, '#e0952e', 2.2, '#2a1a12'], [0.35, '#3f7a70', 2.75, '#3a2414']]) {
    g.fillStyle = ink(c); D.rect(g, x - 0.3, 1.1, 0.6, hh - 1.4, 0.15); g.fillStyle = ink('#c58a5c'); D.ell(g, x, hh - 0.05, 0.27, 0.3); g.fillStyle = ink(sk); D.ell(g, x, hh + 0.1, 0.3, 0.18);
  }
  g.fillStyle = ink('#9a948a', 'print'); D.ell(g, -1.0, 0.34, 0.13, 0.13); D.ell(g, 1.1, 0.34, 0.13, 0.13);
}, { w: 3.4, h: 3.1, name: 'scooter' });
// a street lamp (slotted cross, a lit lantern)
const streetLamp = () => [P2.fromDrawing((g) => { D.rect(g, -0.09, 0, 0.18, 4.6); D.rect(g, -0.32, 4.4, 0.64, 0.7, 0.08); D.poly(g, [[-0.42, 5.05], [0, 5.45], [0.42, 5.05]]); D.rect(g, -0.3, 0, 0.6, 0.22, 0.05); }, { w: 1.0, h: 5.5, name: 'lamp' }),
  (P) => { const { box, g } = P; P.fill('#3a3430'); P.draw(() => { g.fillStyle = '#ffd27a'; g.fillRect(box.x0 + box.w * 0.25, box.y0 + box.h * 0.82, box.w * 0.5, box.h * 0.1); }); P.glow((gc) => { gc.fillRect(box.x0 + box.w * 0.25, box.y0 + box.h * 0.82, box.w * 0.5, box.h * 0.1); }); P.innerShade('#1e120a', { alpha: 0.4, blurPx: 4 }); }];

stage('1. CHARMINAR');
// ---------------------------------------------------------------------------------------------------------------
// 1. CHARMINAR and Laad Bazaar
// ---------------------------------------------------------------------------------------------------------------
const CH = {};
within('charminar', () => {
  const S = 10, HB = 11.5;                                            // the body: 10 x 10 footprint, 11.5 tall
  const wallPaint = (i) => (P) => {
    const { box } = P, W = box.w, Hh = box.h;
    plasterBase(P, C.plaster, 0.45);
    P.marks('dab', { color: shade(C.plaster, -0.2), alpha: 0.2, size: 0.04, density: 0.3 });
    // the grand arch's frame (the hole is cut through the card), the carved spandrels, the gallery storeys above
    P.layer((g) => { pathOf(g, arch(W * 0.17, W * 0.83, 0, Hh * 0.38, Hh * 0.2, 12)); g.fill(); }, shade(C.plasterB, -0.08), { lip: 0.8 });
    P.parts((g, ink) => {
      g.fillStyle = ink(C.trim); g.fillRect(0, Hh * 0.62, W, Hh * 0.05);                                    // the cornice band
      g.fillStyle = ink(shade(C.plaster, 0.05)); g.fillRect(0, Hh * 0.67, W, Hh * 0.33);                    // the gallery storeys
      for (let k = 0; k < 6; k++) { const cx = W * (k + 0.5) / 6; g.fillStyle = ink(C.recess); pathOf(g, arch(cx - W * 0.045, cx + W * 0.045, Hh * 0.7, Hh * 0.08, Hh * 0.05, 6)); g.fill(); }
      for (let k = 0; k < 9; k++) { const cx = W * (k + 0.5) / 9; g.fillStyle = ink(C.recess); pathOf(g, arch(cx - W * 0.03, cx + W * 0.03, Hh * 0.85, Hh * 0.05, Hh * 0.03, 6)); g.fill(); }
      g.fillStyle = ink(C.trim); g.fillRect(0, Hh * 0.82, W, Hh * 0.025); g.fillRect(0, Hh * 0.95, W, Hh * 0.05);
      for (const sx of [W * 0.1, W * 0.9]) { g.fillStyle = ink('#c9a46a', 'print'); D.ell(g, sx, Hh * 0.5, W * 0.035, W * 0.035); }   // carved roundels
    }, { depth: 0.8 });
    P.marks('scallop', { color: shade(C.trim, -0.2), alpha: 0.45, size: 0.05, region: { x0: 0, y0: Hh * 0.95, w: W, h: Hh * 0.05, x1: W, y1: Hh } });
    P.innerShade(shade(C.plaster, -0.6), { alpha: 0.28, blurPx: 10 });
  };
  const holes = {}; for (let i = 0; i < 4; i++) holes[i] = [arch(S * 0.22, S * 0.78, 0.25, HB * 0.34, HB * 0.17, 12)];
  const body = prismFold([[-S / 2, 0], [S / 2, 0], [S / 2, -S], [-S / 2, -S]], { h: HB, roof: 'flat', paper: H.paper, center: true, print: { ...H.cardOpts(0, 0), pxPerUnit: 60 },
    paints: { wall: [0, 1, 2, 3].map(wallPaint), roof: (P) => { plasterBase(P, C.plasterB); P.marks('brick', { color: shade(C.plasterB, -0.3), alpha: 0.3, size: 0.06 }); } }, holes });
  CH.body = putNode(body, { x: 0, z: 0, height: HB, yaw: 0.12 });
  // four minarets at the corners: slotted crosses (round and upright), balconies, an onion dome and a gold finial
  const minaret = P2.drawnPiece((g, ink) => {
    const T = 20.5;
    g.fillStyle = ink(C.plasterB); D.rect(g, -1.0, 0, 2.0, 2.0, 0.1);
    g.fillStyle = ink(C.plaster); D.poly(g, [[-0.78, 1.9], [0.78, 1.9], [0.62, T * 0.8], [-0.62, T * 0.8]]);
    for (const [y, w] of [[T * 0.36, 1.25], [T * 0.58, 1.12], [T * 0.8, 1.05]]) { g.fillStyle = ink(C.trim); D.rect(g, -w, y - 0.25, w * 2, 0.5, 0.1); g.fillStyle = ink(shade(C.plaster, 0.04)); D.rect(g, -w * 0.82, y + 0.25, w * 1.64, 0.6, 0.05); }
    g.fillStyle = ink(shade(C.plaster, 0.06)); D.ell(g, 0, T * 0.87, 0.95, 1.1);
    g.fillStyle = ink(shade(C.plaster, 0.06)); D.poly(g, [[-0.4, T * 0.9], [0.4, T * 0.9], [0, T * 0.98]]);
    g.fillStyle = ink(C.gold); D.rect(g, -0.09, T * 0.95, 0.18, T * 0.05, 0.04); D.ell(g, 0, T * 0.97, 0.16, 0.16);
    g.fillStyle = ink(C.recess, 'print'); for (const y of [T * 0.38, T * 0.6, T * 0.82]) for (let k = -2; k <= 2; k++) D.rect(g, k * 0.32 - 0.08, y + 0.32, 0.16, 0.38, 0.06);
    g.fillStyle = ink(shade(C.trim, -0.1), 'print'); for (let y = 2.6; y < T * 0.78; y += 1.2) D.rect(g, -0.6, y, 1.2, 0.07);
  }, { w: 2.8, h: 21, name: 'minaret' });
  const c = Math.cos(0.12), s = Math.sin(0.12);
  CH.minarets = [[-1, 1], [1, 1], [-1, -1], [1, -1]].map(([sx, sz]) => { const lx = sx * (S / 2 + 1.05), lz = sz * (S / 2 + 1.05) - 0; return put(...minaret, { x: lx * c + lz * s, z: -lx * s + lz * c, cross: true, scale: 1 }); });
  mark(0, 0, 11);
  // Laad Bazaar: bangle stalls along the lane west of Charminar, each a box fold with a striped awning print
  const bangleWall = (col, seed) => (P) => {
    const { box } = P, W = box.w, Hh = box.h, r = P2.rng(seed);
    plasterBase(P, col);
    P.layer((g) => { g.fillRect(0, Hh * 0.72, W, Hh * 0.28); }, C.red, { lip: 0.7 });                        // the awning band
    P.marks('stripe', { color: C.cream, alpha: 0.7, size: 0.12, region: { x0: 0, y0: Hh * 0.72, w: W, h: Hh * 0.28, x1: W, y1: Hh } });
    P.layer((g) => { g.fillRect(W * 0.08, Hh * 0.12, W * 0.84, Hh * 0.55); }, '#6b4a2c', { lip: 0.5 });
    P.draw((g) => { for (let row = 0; row < 4; row++) for (let k = 0; k < Math.floor(W * 2.2); k++) { const x = W * 0.12 + k * 0.45, y = Hh * 0.18 + row * Hh * 0.12; if (x > W * 0.88) continue; g.fillStyle = [C.red, C.pink, C.gold, '#3f7a70', '#7a4a8a', '#e0952e'][(row * 7 + k * 3 + seed) % 6]; D.ell(g, x, y, 0.2, 0.2); g.fillStyle = '#6b4a2c'; D.ell(g, x, y, 0.1, 0.1); } });
    P.glow((g) => { g.fillRect(W * 0.1, Hh * 0.62, W * 0.8, Hh * 0.04); });
    P.innerShade(shade(col, -0.6), { alpha: 0.3, blurPx: 6 });
  };
  const stall = (x, z, yaw) => {
    const w = between(4.2, 5.4), col = pick(C.walls), seed = Math.floor(rnd() * 999);
    const node = boxFold({ w, d: 3.2, wallH: 3.8, roofH: 1.1, overhang: 0.35, paper: H.paper, seed, print: H.cardOpts(x, z),
      paints: { front: bangleWall(col, seed), gable: (P) => { plasterBase(P, col); P.marks('dab', { color: shade(col, -0.25), alpha: 0.25, size: 0.06 }); }, roof: (P) => { P.gradient(C.saffron, shade(C.saffron, -0.15), 0.5); P.marks('stripe', { color: C.cream, alpha: 0.55, size: 0.14 }); } } });
    mark(x, z, 3);
    return putNode(node, { x, z, height: 4.9, yaw });
  };
  for (const [x, z, yaw] of [[-11, 3.5, 0.1], [-16.5, 1.4, 0.05], [-22, 0.6, -0.05], [-28, 3.0, 0.08], [-12, 13.6, -0.1], [-18, 12.6, 0.05], [-24, 10.8, 0.12], [-31, 13.2, 0.0]]) stall(x, z, yaw);
  // bangle stands, shoppers and pigeons on the plaza (front of the stalls)
  const bangleStand = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink('#6b4a2c'); D.rect(g, -0.08, 0, 0.16, 2.2); D.rect(g, -0.8, 0, 1.6, 0.16, 0.05);
    const cols = [C.red, C.pink, C.gold, '#3f7a70', '#7a4a8a'];
    for (let k = 0; k < 5; k++) { g.fillStyle = ink(cols[k]); D.ell(g, 0, 0.7 + k * 0.36, 0.55, 0.2); g.fillStyle = ink(shade(cols[k], -0.3), 'print'); D.ell(g, 0, 0.7 + k * 0.36, 0.38, 0.1); }
  }, { w: 1.8, h: 2.4, name: 'bangle stand' });
  for (const [x, z] of [[-13, 7], [-19.5, 5.4], [-26, 6.8], [-8.5, 9.5]]) { put(...bangleStand, { x, z, scale: 1.2 }); }
  for (const [x, z, k] of [[-15, 8.2, 1], [-21.5, 7.6, 4], [-9.5, 6.5, 0], [-29.5, 7.4, 6], [6.5, 9.5, 2], [-6, -9, 3], [8, -8, 1], [9.5, 4, 4]]) put(...person(PEOPLE[k]), { x, z, scale: 1.05 });
  // a fruit cart and a paan shop on the plaza
  const cart = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink('#2a2622'); D.ell(g, -0.9, 0.45, 0.45, 0.45); D.ell(g, 0.9, 0.45, 0.45, 0.45);
    g.fillStyle = ink('#8a5634'); D.rect(g, -1.6, 0.8, 3.2, 0.4, 0.05); D.rect(g, 1.5, 0.9, 0.9, 0.12);
    for (let k = 0; k < 9; k++) { g.fillStyle = ink(['#e0952e', '#c33b4d', '#9bb04a'][k % 3]); D.ell(g, -1.3 + (k % 5) * 0.65, 1.4 + Math.floor(k / 5) * 0.4, 0.34, 0.3); }
    g.fillStyle = ink('#9a948a', 'print'); D.ell(g, -0.9, 0.45, 0.15, 0.15); D.ell(g, 0.9, 0.45, 0.15, 0.15);
  }, { w: 4.4, h: 2.2, name: 'cart' });
  put(...cart, { x: 9, z: 7.5, scale: 1.15 }); put(...cart, { x: -7, z: 10.5, scale: 1.0 });
  for (const [x, z] of [[11, -3], [-10, -5], [6, -12], [-3, -13]]) put(...neemTree(), { x, z, cross: true, scale: 0.9, sway: 0.5 });
  bougainvillea(12, 2, 0.9); bougainvillea(-9, -11, 0.8);
});

stage('2. GOLCONDA');
// ---------------------------------------------------------------------------------------------------------------
// 2. GOLCONDA: granite terraces stepping up, battlements, the Baradari pavilion; sound arcs climbing on the clap
// ---------------------------------------------------------------------------------------------------------------
const GK = { arcs: [] };
within('golconda', () => {
  const [gx, gz] = AT.golconda;
  const terrace = (w, h, k, n, pavilion = false) => {
    const r = P2.rng(40 + k), pts = [[-w / 2, 0], [w / 2, 0]];
    const top = []; const steps = 34;
    for (let i = 0; i <= steps; i++) { const t = i / steps, x = w / 2 - t * w, base = h * (0.72 + 0.28 * Math.sin(t * PI)) * (0.92 + 0.08 * Math.sin(t * 9 + k)); top.push([x, base]); }
    // battlements: merlons along the top; two round bastions; the Baradari pavilion on the summit (back layer)
    const bastions = [0.22, 0.74], pw = w * 0.26, ph = h * 1.05;
    let out = [];
    top.forEach(([x, y], i) => { out.push([x, y]); if (i % 2 === 0 && i < steps) out.push([x, y + 0.7], [x - w / steps * 0.55, y + 0.7]); });
    out = out.map(([x, y]) => { let yy = y; for (const b of bastions) { const bx = w / 2 - b * w, d = (x - bx) / (w * 0.06); if (Math.abs(d) < 1) yy += Math.sqrt(1 - d * d) * 1.4; } return [x, yy]; });
    if (pavilion) {
      const right = out.filter(([x]) => x > pw / 2), left = out.filter(([x]) => x < -pw / 2);
      out = [...right, [pw / 2, ph - 0.5], [pw / 2, ph + 3.4], [pw * 0.28, ph + 3.6], [pw * 0.2, ph + 4.6], [0, ph + 5.2], [-pw * 0.2, ph + 4.6], [-pw * 0.28, ph + 3.6], [-pw / 2, ph + 3.4], [-pw / 2, ph - 0.5], ...left];
    }
    const shape = [...pts, ...out];
    const paint = (P) => {
      const { box } = P, col = shade(C.granite, -0.18 + k * 0.08), wall = shade('#c9b08a', -0.12 + k * 0.06);
      P.gradient(shade(col, 0.08), shade(col, -0.08), 0.5); P.felt(0.7);
      P.parts((g, ink) => { for (let i = 0; i < 14; i++) { const x = box.x0 + r() * box.w, y = r() * h * 0.55, rw = 0.8 + r() * 1.6; g.fillStyle = ink(shade(col, r() < 0.5 ? 0.12 : -0.1)); D.ell(g, x, y + rw * 0.5, rw, rw * 0.6); } }, { depth: 0.5 });
      P.layer((g) => { g.beginPath(); g.moveTo(box.x0 - 1, h * 0.6); for (let i = 0; i <= 40; i++) { const t = i / 40; g.lineTo(box.x0 + t * box.w, h * (0.55 + 0.25 * Math.sin(t * PI))); } g.lineTo(box.x1 + 1, box.y1 + 3); g.lineTo(box.x0 - 1, box.y1 + 3); g.closePath(); g.fill(); }, wall, { lip: 0.8 });
      P.marks('brick', { color: shade(wall, -0.35), alpha: 0.4, size: 0.035, region: { x0: box.x0, y0: h * 0.62, w: box.w, h: box.h - h * 0.62, x1: box.x1, y1: box.y1 } });
      if (pavilion) P.parts((g, ink) => { g.fillStyle = ink('#e4d2ae'); D.rect(g, -pw / 2 + 0.3, ph - 0.5, pw - 0.6, 3.9); for (let a = -1; a <= 1; a++) { g.fillStyle = ink(C.recess, 'print'); pathOf(g, arch(a * pw * 0.28 - 0.7, a * pw * 0.28 + 0.7, ph, 1.4, 0.8, 6)); g.fill(); } g.fillStyle = ink('#e9dbbd'); D.ell(g, 0, ph + 3.9, pw * 0.2, 1.2); }, { depth: 0.6 });
      if (k === 3) P.parts((g, ink) => { g.fillStyle = ink('#6b4a2c'); pathOf(g, arch(-1.4, 1.4, 0, 2.6, 1.5, 8)); g.fill(); g.fillStyle = ink('#4a3020', 'print'); for (let i = 0; i < 4; i++) D.rect(g, -1.1 + i * 0.6, 0.2, 0.08, 2.6); g.fillStyle = ink(C.gold, 'print'); for (let i = 0; i < 6; i++) D.ell(g, -0.9 + i * 0.36, 1.6, 0.07, 0.07); }, { depth: 0.6 });  // Fateh Darwaza
      P.innerShade('#3a2a1a', { alpha: 0.35, blurPx: 10 });
    };
    return { pts: shape, paint };
  };
  const layers = [terrace(34, 15, 0, 0, true), terrace(30, 10.5, 1), terrace(26, 7, 2), terrace(22, 4.2, 3)].map((L, i) => ({ ...L, d: i * 3.2, dx: (i % 2 ? 1.2 : -1) }));
  GK.terraces = H.stack(gx, gz - 6, layers, { yaw: 0.25 });
  mark(gx, gz - 3, 18);
  // granite boulders and scrub either side
  for (const [x, z, s] of [[gx - 21, gz + 6, 1.0], [gx + 20, gz + 8, 1.15], [gx - 16, gz + 13, 0.8], [gx + 14, gz + 15, 0.75], [gx - 26, gz - 4, 1.2], [gx + 25, gz - 2, 1.0]]) put(...boulders(Math.floor(x * 7 + z)), { x, z, cross: 'half', scale: s });
  for (const [x, z] of [[gx - 10, gz + 14], [gx + 7, gz + 16], [gx - 24, gz + 12]]) bougainvillea(x, z, 0.8);
  for (const [x, z] of [[gx + 22, gz + 14], [gx - 28, gz + 16], [gx + 3, gz + 19]]) put(...palm(), { x, z, cross: true, scale: 0.85, sway: 0.4 });
  // the clap: two hands at the gate, then sound arcs climbing to the top
  const hands = P2.drawnPiece((g, ink) => { for (const s of [-1, 1]) { g.fillStyle = ink('#c58a5c'); D.poly(g, [[-s * 0.08, 0], [s * 0.7, 0.1], [s * 0.9, 1.6], [s * 0.6, 2.4], [s * 0.15, 2.2]]); g.fillStyle = ink('#9a6440', 'print'); for (let k = 0; k < 3; k++) D.rect(g, s * 0.25 + (s < 0 ? -0.5 : 0), 1.3 + k * 0.3, 0.5, 0.05); } g.fillStyle = ink(C.gold, 'print'); for (const a of [-0.6, 0, 0.6]) D.rect(g, Math.sin(a) * 0.5 - 0.07, 1.6, 0.14, 0.5); }, { w: 2.6, h: 3.6, name: 'clap' });
  const arcCard = (r) => { const pts = []; for (let i = 0; i <= 24; i++) { const a = PI * i / 24; pts.push([Math.cos(a) * r, Math.sin(a) * r]); } for (let i = 24; i >= 0; i--) { const a = PI * i / 24; pts.push([Math.cos(a) * (r - 0.55), Math.max(0, Math.sin(a) * (r - 0.55))]); } return pts; };
  const arcPaint = (P) => { P.gradient('#f6e3a8', C.gold, 0.5); P.marks('dot', { color: C.cream, alpha: 0.6, size: 0.06, density: 0.5 }); P.glow((g) => { g.fillRect(P.box.x0, P.box.y0, P.box.w, P.box.h); }); };
  for (let i = 0; i < 4; i++) GK.arcs.push(put(arcCard(2.2 + i * 1.3), arcPaint, { x: gx + 2.5 + i * 0.3, z: gz + 8 - i * 3.6, yaw: 0.25, group: 'arcs' }));
});

stage('3. HUSSAIN');
// ---------------------------------------------------------------------------------------------------------------
// 3. HUSSAIN SAGAR: the Buddha on his rock island, Necklace Road lamps, paper boats
// ---------------------------------------------------------------------------------------------------------------
const HS = { boats: [], lamps: [] };
within('lake', () => {
  const buddha = P2.drawnPiece((g, ink) => {
    const stone = '#e6e0d3';
    g.fillStyle = ink('#9b8f80'); D.rect(g, -2.0, 0, 4.0, 1.2, 0.1); g.fillStyle = ink('#b3a898'); D.rect(g, -1.6, 1.1, 3.2, 1.0, 0.1);
    g.fillStyle = ink(stone); D.poly(g, [[-1.05, 2.0], [1.05, 2.0], [0.95, 8.6], [0.75, 10.4], [-0.75, 10.4], [-0.95, 8.6]]);
    g.fillStyle = ink(shade(stone, -0.05)); D.poly(g, [[0.8, 8.0], [1.5, 9.4], [1.7, 10.9], [1.4, 11.0], [1.1, 9.8], [0.7, 9.0]]);   // the raised hand
    g.fillStyle = ink(stone); D.ell(g, 0, 11.3, 0.75, 0.9); g.fillStyle = ink(shade(stone, -0.06)); D.ell(g, 0, 12.15, 0.35, 0.32);
    g.fillStyle = ink(shade(stone, -0.18), 'print'); for (let k = 0; k < 7; k++) { g.beginPath(); g.moveTo(-0.9 + k * 0.05, 2.3 + k * 0.9); g.quadraticCurveTo(0, 2.0 + k * 0.9, 0.9 - k * 0.04, 2.6 + k * 0.9); g.lineTo(0.9 - k * 0.04, 2.7 + k * 0.9); g.quadraticCurveTo(0, 2.1 + k * 0.9, -0.9 + k * 0.05, 2.4 + k * 0.9); g.fill(); }
    g.fillStyle = ink('#7a7064', 'print'); D.ell(g, -0.25, 11.3, 0.1, 0.04); D.ell(g, 0.25, 11.3, 0.1, 0.04);
    g.fillStyle = ink(C.gold, 'print'); D.rect(g, -1.6, 1.45, 3.2, 0.12);
  }, { w: 4.4, h: 12.6, name: 'buddha' });
  HS.buddha = put(...buddha, { x: LAKE.x, z: LAKE.z, cross: 'half', scale: 1.0, yaw: 0.05 });
  // Necklace Road: lamp posts along the lake's south and east shore (the road ring)
  const lampAt = [];
  for (let k = 0; k < 18; k++) { const a = 0.15 + k / 18 * PI * 1.25, x = LAKE.x + Math.cos(a) * (LAKE.rx + 3.6), z = LAKE.z + Math.sin(a) * (LAKE.rz + 3.4); lampAt.push([x, z]); }
  lampAt.forEach(([x, z], i) => { HS.lamps.push(put(...streetLamp(), { x, z, cross: true, scale: 1.1 })); if (i % 3 === 1) H.lamp(x, 6, z, 0.9, 12); });
  // paper boats on the water (moved by the step hook)
  const boat = (sail) => P2.drawnPiece((g, ink) => { g.fillStyle = ink('#f3ecdd'); D.poly(g, [[-1.4, 0.5], [1.4, 0.5], [1.0, 0], [-1.0, 0]]); g.fillStyle = ink('#6b4a2c'); D.rect(g, -0.05, 0.45, 0.1, 2.3); g.fillStyle = ink(sail); D.poly(g, [[0.05, 0.75], [0.05, 2.75], [1.2, 0.85]]); g.fillStyle = ink(shade(sail, -0.25), 'print'); D.rect(g, 0.05, 1.5, 0.8, 0.08); }, { w: 3, h: 2.9, name: 'boat' });
  for (const [i, sail] of [C.red, C.saffron, '#2f5d7c', C.cream, C.pink].entries()) {
    const a = i / 5 * 2 * PI + 0.4, rx = LAKE.rx * 0.6, rz = LAKE.rz * 0.55;
    HS.boats.push({ h: put(...boat(sail), { x: LAKE.x + Math.cos(a) * rx, z: LAKE.z + Math.sin(a) * rz, scale: 1.1 }), a, rx, rz, w: 0.05 + i * 0.01 });
  }
  // the green shore: palms, neem, bougainvillea, strolling people
  for (let k = 0; k < 26; k++) {
    const a = k / 26 * 2 * PI, rr = 1 + between(0.42, 0.75), x = LAKE.x + Math.cos(a) * LAKE.rx * rr, z = LAKE.z + Math.sin(a) * LAKE.rz * rr;
    if (!free(x, z, 0.5)) continue;
    const kind = k % 3;
    if (kind === 0) put(...palm(), { x, z, cross: true, scale: between(0.7, 0.95), sway: 0.4 });
    else if (kind === 1) put(...neemTree(), { x, z, cross: true, scale: between(0.75, 0.95), sway: 0.4 });
    else bougainvillea(x, z, 0.8);
    mark(x, z, 2.2);
  }
  for (const [k, a] of [[1, 0.6], [3, 1.3], [0, 2.0], [6, 2.9], [4, 3.6]]) { const x = LAKE.x + Math.cos(a) * (LAKE.rx + 5.6), z = LAKE.z + Math.sin(a) * (LAKE.rz + 5.2); put(...person(PEOPLE[k]), { x, z }); }
});

stage('4. FOOD');
// ---------------------------------------------------------------------------------------------------------------
// 4. FOOD: the dum biryani handi (sealed -> open), the UNESCO rosette, an Irani cafe with chai and Osmania biscuits
// ---------------------------------------------------------------------------------------------------------------
const FD = { steam: [] };
within('food', () => {
  const [fx, fz] = AT.food;
  const pot = (open) => P2.drawnPiece((g, ink) => {
    g.fillStyle = ink('#4a3a30'); D.rect(g, -3.2, 0, 6.4, 1.6, 0.2);                                        // the coal stove
    g.fillStyle = ink('#d9542b', 'print'); for (let k = 0; k < 6; k++) D.ell(g, -2.4 + k * 0.95, 0.9, 0.32, 0.22);
    g.fillStyle = ink('#c9963c'); D.ell(g, 0, 4.1, 3.9, 2.9);                                                 // the brass belly
    g.fillStyle = ink(shade('#c9963c', -0.2)); D.rect(g, -3.3, 3.3, 6.6, 0.5, 0.2);
    g.fillStyle = ink('#c33b4d', 'print'); D.rect(g, -3.5, 4.6, 7.0, 0.34, 0.1); g.fillStyle = ink(C.gold, 'print'); for (let k = 0; k < 9; k++) D.ell(g, -3.0 + k * 0.75, 4.77, 0.1, 0.1);
    g.fillStyle = ink(shade('#c9963c', 0.08)); D.rect(g, -2.4, 6.3, 4.8, 0.9, 0.2);                           // the neck
    if (!open) {
      g.fillStyle = ink('#efe0c0'); D.rect(g, -2.7, 7.05, 5.4, 0.55, 0.25);                                     // the dough seal (dum)
      g.fillStyle = ink('#b07a3a'); D.ell(g, 0, 7.75, 2.6, 0.6); g.fillStyle = ink('#8a5a2a'); D.rect(g, -0.35, 8.1, 0.7, 0.55, 0.15);
      g.fillStyle = ink('#d8c49a', 'print'); for (let k = 0; k < 10; k++) D.ell(g, -2.4 + k * 0.53, 7.33, 0.14, 0.08);
    } else {
      g.fillStyle = ink('#f3e6c4'); D.ell(g, 0, 7.4, 2.9, 1.6);                                                 // the rice mound
      g.fillStyle = ink(C.saffron, 'print'); for (let k = 0; k < 16; k++) { const a = k * 2.4, r = (k % 5) / 5; D.ell(g, Math.cos(a) * 2.1 * r, 7.5 + Math.sin(a) * 0.9 * r, 0.42, 0.18, a); }
      g.fillStyle = ink('#8a4a26'); for (const [x, y] of [[-1.3, 7.9], [0.6, 8.3], [1.6, 7.6], [-0.2, 7.3]]) D.ell(g, x, y, 0.55, 0.38);
      g.fillStyle = ink('#f6f0e0'); D.ell(g, 0.2, 8.8, 0.45, 0.32); g.fillStyle = ink('#e8b42a', 'print'); D.ell(g, 0.2, 8.8, 0.2, 0.15);
      g.fillStyle = ink('#4f7a3a', 'print'); for (let k = 0; k < 7; k++) P2.fillLeaf(g, -1.8 + k * 0.6, 8.0 + (k % 2) * 0.4, 0.45, k, 0.4);
      g.fillStyle = ink('#7a3a1a', 'print'); for (let k = 0; k < 12; k++) D.ell(g, -2 + (k * 0.37) % 4, 7.1 + (k % 3) * 0.35, 0.12, 0.05, k);
    }
    g.fillStyle = ink(shade('#c9963c', 0.25), 'print'); D.ell(g, -1.8, 4.9, 0.6, 1.2, 0.3);
  }, { w: 8, h: 9.4, name: open ? 'handi open' : 'handi' });
  FD.sealed = put(...pot(false), { x: fx - 3, z: fz - 2, yaw: 0.05, group: 'handiSealed' });
  FD.open = put(...pot(true), { x: fx - 3, z: fz - 2.3, yaw: 0.05, group: 'handiOpen' });
  // the UNESCO rosette: a gold scalloped disc on a stick with ribbon tails
  const rosette = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink('#6b4a2c'); D.rect(g, -0.12, 0, 0.24, 4.2);
    g.fillStyle = ink(C.red); D.poly(g, [[-0.9, 3.2], [-0.2, 5.6], [0.3, 5.4], [-0.3, 3.0]]); D.poly(g, [[0.9, 3.2], [0.2, 5.6], [-0.3, 5.4], [0.3, 3.0]]);
    g.fillStyle = ink(C.gold); const n = 22, R = 2.5; g.beginPath(); for (let i = 0; i <= n * 2; i++) { const a = i / (n * 2) * 2 * PI, r = i % 2 ? R : R - 0.28; g.lineTo(Math.cos(a) * r, 6.6 + Math.sin(a) * r); } g.fill();
    g.fillStyle = ink('#f6ecd4'); D.ell(g, 0, 6.6, 2.0, 2.0);
    g.fillStyle = ink(C.red, 'print'); D.ell(g, 0, 6.6, 1.88, 1.88); g.fillStyle = ink('#f6ecd4', 'print'); D.ell(g, 0, 6.6, 1.7, 1.7);
    text(g, 'UNESCO', 0, 7.45, 0.56, '#7a2a1a'); text(g, 'CITY OF', 0, 6.75, 0.36, '#3a2414'); text(g, 'GASTRONOMY', 0, 6.25, 0.36, '#3a2414'); text(g, '2019', 0, 5.6, 0.4, '#b5523b');
  }, { w: 5.4, h: 9.2, name: 'rosette' });
  FD.rosette = put(...rosette, { x: fx + 5.5, z: fz - 5, yaw: -0.08, group: 'rosette' });
  // the Irani cafe: a box fold with arched windows, wooden chairs printed and a sign
  const cafeFront = (P) => {
    const { box } = P, W = box.w, Hh = box.h; plasterBase(P, '#e9d7b4');
    P.layer((g) => { g.fillRect(0, Hh * 0.78, W, Hh * 0.18); }, '#2f5d7c', { lip: 0.7 });
    P.draw((g) => { text(g, 'IRANI CAFE', W / 2, Hh * 0.87, Hh * 0.11, '#f6ecd4'); });
    P.parts((g, ink) => { for (let k = 0; k < 3; k++) { const cx = W * (k + 0.5) / 3; g.fillStyle = ink('#6b4a2c'); pathOf(g, arch(cx - W * 0.12, cx + W * 0.12, Hh * 0.1, Hh * 0.42, Hh * 0.16, 8)); g.fill(); g.fillStyle = ink('#f0d58a', 'print'); pathOf(g, arch(cx - W * 0.1, cx + W * 0.1, Hh * 0.14, Hh * 0.38, Hh * 0.14, 8)); g.fill(); g.fillStyle = ink('#6b4a2c', 'print'); D.rect(g, cx - 0.04, Hh * 0.14, 0.08, Hh * 0.5); } }, { depth: 0.6 });
    P.glow((g) => { for (let k = 0; k < 3; k++) { const cx = W * (k + 0.5) / 3; pathOf(g, arch(cx - W * 0.1, cx + W * 0.1, Hh * 0.14, Hh * 0.38, Hh * 0.14, 8)); g.fill(); } });
    P.innerShade('#4a3020', { alpha: 0.3, blurPx: 8 });
  };
  FD.cafe = putNode(boxFold({ w: 11, d: 6, wallH: 6.5, roofH: 1.6, overhang: 0.3, paper: H.paper, print: H.cardOpts(fx + 10, fz - 12),
    paints: { front: cafeFront, gable: (P) => { plasterBase(P, '#e2cfaa'); }, roof: (P) => { P.gradient('#b5523b', '#8f3f2c', 0.5); P.marks('scale', { color: '#f0c9a0', alpha: 0.35, size: 0.08 }); } } }), { x: fx + 9, z: fz - 13, height: 8, yaw: -0.1, group: 'cafe' });
  // the chai table: a round marble table with glasses of chai and a plate of Osmania biscuits
  const table = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink('#5a3a24'); D.rect(g, -0.18, 0, 0.36, 2.6); D.rect(g, -1.2, 0, 2.4, 0.22, 0.1);
    g.fillStyle = ink('#efe8dc'); D.ell(g, 0, 2.75, 3.2, 0.45);
    g.fillStyle = ink('#cfc6b8', 'print'); D.ell(g, 0.6, 2.7, 1.2, 0.15);
    for (const x of [-2.1, -1.2, 1.6]) { g.fillStyle = ink('#e8dfcf'); D.poly(g, [[x - 0.42, 2.95], [x + 0.42, 2.95], [x + 0.52, 4.4], [x - 0.52, 4.4]]); g.fillStyle = ink('#b8743a'); D.poly(g, [[x - 0.4, 3.0], [x + 0.4, 3.0], [x + 0.48, 4.0], [x - 0.48, 4.0]]); g.fillStyle = ink('#e3c28a', 'print'); D.rect(g, x - 0.46, 3.85, 0.92, 0.14); }
    g.fillStyle = ink('#f6f0e0'); D.ell(g, 0.2, 3.05, 1.3, 0.28);
    for (const [x, y] of [[-0.3, 3.25], [0.35, 3.3], [0.9, 3.22], [0.05, 3.6], [0.65, 3.62]]) { g.fillStyle = ink('#d9a441'); D.ell(g, x, y, 0.42, 0.24); g.fillStyle = ink('#9a6428', 'print'); D.ell(g, x - 0.1, y + 0.03, 0.05, 0.04); D.ell(g, x + 0.12, y - 0.02, 0.05, 0.04); }
  }, { w: 6.8, h: 4.6, name: 'chai table' });
  FD.table = put(...table, { x: fx + 9, z: fz - 4.5, scale: 1.05, yaw: -0.05, group: 'chai' });
  const kettle = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#9a948a'); D.ell(g, 0, 1.2, 1.1, 1.1); D.poly(g, [[0.8, 1.4], [1.9, 2.4], [1.7, 2.6], [0.6, 1.8]]); g.fillStyle = ink('#6a645a'); D.rect(g, -0.4, 2.1, 0.8, 0.4, 0.1); g.fillStyle = ink('#4a443c'); D.rect(g, -1.2, 0, 2.4, 0.3, 0.1); g.fillStyle = ink('#c8c2b6', 'print'); D.ell(g, -0.4, 1.5, 0.25, 0.4); }, { w: 4, h: 2.8, name: 'kettle' });
  FD.vendor = put(...person(PEOPLE[5]), { x: fx + 16, z: fz - 7.5, scale: 1.05, group: 'chai' });
  FD.steam = [[fx - 3, 9.6, fz - 2.3], [fx + 6.8, 4.9, fz - 4.5], [fx + 7.8, 4.9, fz - 4.5], [fx + 10.7, 4.9, fz - 4.5], [fx + 16.5, 3.3, fz - 6]];
  // street-food dressing: a mirchi bajji cart, people, neem shade
  const bajji = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#2a2622'); D.ell(g, -1.1, 0.45, 0.45, 0.45); D.ell(g, 1.1, 0.45, 0.45, 0.45); g.fillStyle = ink('#3f7a70'); D.rect(g, -1.8, 0.8, 3.6, 1.4, 0.1); g.fillStyle = ink('#2a2622'); D.ell(g, 0, 2.3, 1.2, 0.35); g.fillStyle = ink('#9bb04a', 'print'); for (let k = 0; k < 6; k++) D.ell(g, -1.2 + k * 0.5, 2.45, 0.28, 0.1, 0.3); g.fillStyle = ink(C.cream, 'print'); D.rect(g, -1.8, 1.6, 3.6, 0.12); g.fillStyle = ink(C.saffron); D.poly(g, [[-2.1, 3.6], [2.1, 3.6], [1.8, 4.2], [-1.8, 4.2]]); D.rect(g, -1.7, 2.2, 0.12, 1.5); D.rect(g, 1.58, 2.2, 0.12, 1.5); }, { w: 4.6, h: 4.4, name: 'bajji cart' });
  put(...bajji, { x: fx - 12, z: fz - 4, scale: 1.0 });
  for (const [x, z, k] of [[fx - 9, fz + 3, 2], [fx + 2, fz + 4, 3], [fx - 14, fz + 1, 1], [fx + 4, fz - 10, 6]]) put(...person(PEOPLE[k]), { x, z });
  for (const [x, z] of [[fx - 16, fz - 10], [fx + 18, fz + 2], [fx - 6, fz - 12]]) put(...neemTree(), { x, z, cross: true, scale: 0.9, sway: 0.5 });
  mark(fx, fz - 4, 12); mark(fx + 9, fz - 13, 7);
});

stage('5. HITEC');
// ---------------------------------------------------------------------------------------------------------------
// 5. HITEC CITY: glass towers, the curved Cyber Towers, a tower crane; DURGAM CHERUVU cable bridge (night colours)
// ---------------------------------------------------------------------------------------------------------------
const HT = { cranes: [], bridgeMats: [] };
const glassWall = (col, seed, bands = false) => (P) => {
  const { box } = P, W = box.w, Hh = box.h, r = P2.rng(seed);
  P.gradient(shade(col, 0.12), shade(col, -0.12), 0.35); P.felt(0.35);
  const cw = 0.9, ch = 1.1;
  P.draw((g) => { for (let y = 0.6; y < Hh - 0.6; y += ch) for (let x = 0.3; x < W - 0.3; x += cw) { g.fillStyle = shade(col, r() < 0.5 ? 0.18 : -0.05); g.fillRect(x, y, cw - 0.16, ch - 0.18); } });
  P.layer((g) => { g.fillRect(0, Hh - 0.6, W, 0.6); if (bands) for (let y = 2.4; y < Hh - 1; y += 3.3) g.fillRect(0, y, W, 0.32); }, '#e9ecea', { lip: 0.5 });
  P.glow((g) => { const rr = P2.rng(seed + 9); for (let y = 0.6; y < Hh - 0.6; y += ch) for (let x = 0.3; x < W - 0.3; x += cw) if (rr() < 0.32) g.fillRect(x, y, cw - 0.16, ch - 0.18); });
  P.draw((g) => { const rr = P2.rng(seed + 9); g.fillStyle = rgba('#ffe3a0', 0.55); for (let y = 0.6; y < Hh - 0.6; y += ch) for (let x = 0.3; x < W - 0.3; x += cw) if (rr() < 0.32) g.fillRect(x, y, cw - 0.16, ch - 0.18); });
  P.marks('stripe', { color: '#ffffff', alpha: 0.12, size: 0.2, angle: 0.8 });
  P.innerShade('#1e2e3a', { alpha: 0.3, blurPx: 10 });
};
within('hitec', () => {
  const [hx, hz] = AT.hitec;
  const tower = (x, z, w, d, h, col, seed, yaw = 0) => {
    const node = prismFold([[-w / 2, 0], [w / 2, 0], [w / 2, -d], [-w / 2, -d]], { h, roof: 'flat', paper: H.paper, center: true, print: H.cardOpts(x, z),
      paints: { wall: [glassWall(col, seed, seed % 2 === 0), glassWall(shade(col, -0.08), seed + 1), glassWall(col, seed + 2), glassWall(shade(col, -0.08), seed + 3)], roof: (P) => { P.gradient('#c9cbc6', '#a9aca6', 0.4); P.marks('panel', { color: '#7a7e78', alpha: 0.35, size: 0.12 }); } } });
    mark(x, z, Math.max(w, d) * 0.7);
    return putNode(node, { x, z, height: h, yaw });
  };
  // Cyber Towers: a curved front (a half-octagon footprint), stepped glass bands
  const cyber = prismFold(P2.shape.ngon(10, 5.5), { h: 15, roof: 'flat', paper: H.paper, center: true, print: H.cardOpts(hx, hz),
    paints: { wall: glassWall('#5c8fa4', 77, true), roof: (P) => { P.gradient('#d5d6cf', '#b0b2aa', 0.4); P.parts((g, ink) => { g.fillStyle = ink('#c33b4d'); D.ell(g, P.box.x0 + P.box.w / 2, P.box.y0 + P.box.h / 2, 1.2, 1.2); }); } } });
  HT.cyber = putNode(cyber, { x: hx, z: hz + 4, height: 15, yaw: 0.0 }); mark(hx, hz + 2, 8);
  const T = [[hx - 14, hz - 4, 7, 6, 24, C.glass], [hx + 13, hz - 6, 8, 6, 28, '#3f6f86'], [hx - 6, hz - 16, 7, 7, 20, '#6a98a8'], [hx + 4, hz - 18, 9, 6, 26, '#4c7f97'], [hx + 22, hz + 6, 6, 6, 17, '#7aa4b0'], [hx - 22, hz + 8, 6, 5, 14, '#5c8fa4'], [hx + 26, hz - 18, 7, 6, 22, '#46778e'], [hx - 26, hz - 14, 6, 6, 18, '#6f9aa6']];
  T.forEach(([x, z, w, d, h, col], i) => tower(x, z, w, d, h, col, 100 + i * 7, (i % 3 - 1) * 0.08));
  // a tower crane: mast + jib (the jib turns on the step hook)
  const mast = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#e3b22e'); D.rect(g, -0.45, 0, 0.9, 24); g.fillStyle = ink('#9a7a1a', 'print'); for (let y = 0.4; y < 24; y += 1.2) { D.poly(g, [[-0.4, y], [-0.3, y], [0.4, y + 1.0], [0.3, y + 1.0]]); } g.fillStyle = ink('#3a3430'); D.rect(g, -1.6, 0, 3.2, 0.6, 0.1); }, { w: 3.4, h: 24.2, name: 'crane mast' });
  const cx0 = hx + 2, cz0 = hz - 30;
  HT.mast = put(...mast, { x: cx0, z: cz0, cross: true });
  const jibPts = P2.fromDrawing((g) => { D.rect(g, -4, 0, 17, 0.8); D.poly(g, [[-0.5, 0.7], [0.5, 0.7], [0, 2.6]]); D.rect(g, -4.2, -0.9, 2.2, 1.0); D.rect(g, 9.5, -3.5, 0.12, 3.6); D.rect(g, 9.0, -4.3, 1.0, 0.9); }, { w: 17.4, h: 7, name: 'jib' }).map(([x, y]) => [x, y]);
  const jib = makeCard(jibPts, { paper: H.paper, thickness: 0.08, edgeWidth: 0.06, pxPerUnit: 40, seed: 901, folds: [], paint: (P) => { P.fill('#e3b22e'); P.marks('hatch', { color: '#9a7a1a', alpha: 0.45, size: 0.06 }); P.draw((g) => { g.fillStyle = '#3a3430'; g.fillRect(-4.2, -0.9, 2.2, 1.0); g.fillStyle = '#c33b4d'; g.fillRect(9.0, -4.3, 1.0, 0.9); }); } });
  const jibPivot = new THREE.Group(); jibPivot.position.set(cx0, 24.2, cz0); jibPivot.add(jib); jib.position.set(0, 0, 0); jibPivot.visible = false; H.scene.add(jibPivot);
  HT.jib = jibPivot;
  // trees and boulders between the towers, a few walkers
  for (let k = 0; k < 18; k++) { const a = k / 18 * 2 * PI, r = between(12, 30), x = hx + Math.cos(a) * r, z = hz + Math.sin(a) * r * 0.8; if (!free(x, z, 0.4)) continue; if (k % 3 === 0) put(...boulders(k * 13), { x, z, cross: 'half', scale: 0.8 }); else put(...neemTree(), { x, z, cross: true, scale: between(0.75, 0.95), sway: 0.4 }); mark(x, z, 2.5); }
  for (const [x, z, k] of [[hx - 4, hz + 12, 3], [hx + 6, hz + 11, 6], [hx + 10, hz + 14, 0]]) put(...person(PEOPLE[k]), { x, z });
});
within('durgam', () => {
  const { x: dx, z: dz } = DURGAM;
  // the deck: a long low card across the lake (railing printed, lights glowing), the pylon with fanned cables
  const span = 28;
  const deck = P2.fromDrawing((g) => { D.rect(g, -span / 2, 0, span, 1.0); D.rect(g, -span / 2, 1.0, span, 0.9); for (let x = -span / 2; x <= span / 2; x += 7) D.rect(g, x - 0.4, -0.1, 0.8, 0.2); }, { w: span + 1, h: 2.1, name: 'deck' });
  const deckPaint = (P) => { const { box } = P; P.gradient('#d9d6cc', '#b8b4a8', 0.4); P.layer((g) => { g.fillRect(box.x0, 0.75, box.w, 0.3); }, '#8a8e8c', { lip: 0.5 }); P.marks('stripe', { color: '#6a6e6c', alpha: 0.5, size: 0.08, angle: 1.57, region: { x0: box.x0, y0: 1.05, w: box.w, h: 0.85, x1: box.x1, y1: 1.9 } }); P.glow((g) => { for (let x = box.x0 + 0.5; x < box.x1; x += 1.4) g.fillRect(x, 0.82, 0.6, 0.16); }); };
  HT.deck = put(deck, deckPaint, { x: dx, z: dz + 0.6, yaw: 0 });
  const pylon = P2.fromDrawing((g) => {
    D.poly(g, [[-1.6, 0], [1.6, 0], [0.4, 22], [-0.4, 22]]); D.rect(g, -0.6, 21.6, 1.2, 1.6, 0.3);
    D.rect(g, -14.5, 1.3, 29, 0.5);
  }, { w: 30, h: 23.4, name: 'pylon', res: 60 });
  const pylonPaint = (P) => { P.gradient('#e2ded2', '#bdb8ab', 0.4); P.felt(0.3); P.marks('dot', { color: '#8a8478', alpha: 0.3, size: 0.02, density: 0.3 }); };
  HT.pylon = put(pylon, pylonPaint, { x: dx, z: dz - 0.4, yaw: 0, edge: 0.05 });
  // the stay cables: thin lit strips fanned from the pylon to the deck (they change colour at night)
  HT.cableMat = new THREE.MeshBasicMaterial({ color: '#f0e6d0', toneMapped: false, side: THREE.DoubleSide });
  HT.cables = new THREE.Group(); HT.cables.position.set(dx, 0, dz - 0.4); HT.cables.visible = false; H.scene.add(HT.cables);
  for (let k = 0; k < 7; k++) for (const sgn of [-1, 1]) {
    const ty = 21 - k * 1.5, bx = sgn * (3.5 + k * 1.75), by = 1.8, L = Math.hypot(bx, ty - by);
    const m = new THREE.Mesh(new THREE.PlaneGeometry(L, 0.13), HT.cableMat);
    m.position.set(bx / 2, (ty + by) / 2, 0.05); m.rotation.z = Math.atan2(by - ty, bx); HT.cables.add(m);
  }
  // granite boulders round the lake, the rock faces it is famous for
  for (const [x, z, s] of [[dx - 20, dz - 5, 1.2], [dx + 19, dz - 6, 1.3], [dx - 17, dz + 7, 0.9], [dx + 16, dz + 7, 1.0], [dx - 8, dz - 10, 1.1], [dx + 6, dz - 11, 1.2], [dx - 24, dz + 3, 0.9], [dx + 24, dz + 2, 1.0]]) { put(...boulders(Math.floor(x * 3 + z * 5)), { x, z, cross: 'half', scale: s }); mark(x, z, 3); }
  for (let k = 0; k < 3; k++) H.lamp(dx - 10 + k * 10, 3, dz + 3, 0.7, 12);
});

stage('6. RAMOJI');
// ---------------------------------------------------------------------------------------------------------------
// 6. RAMOJI FILM CITY: film-set flats braced behind, a camera crane, the clapperboard, the record badge
// ---------------------------------------------------------------------------------------------------------------
const RJ = {};
within('ramoji', () => {
  const [rx, rz] = AT.ramoji;
  const brace = (w, h) => ({ pts: [[-w * 0.9, 0], [-w * 0.3, h], [w * 0.3, h], [w * 0.9, 0]], paint: (P) => { P.fill('#b98a58'); P.marks('hatch', { color: '#6b4a2c', alpha: 0.5, size: 0.08, angle: 0.9 }); }, ymax: h * 0.95 });
  // a Mughal palace front
  const palace = P2.drawnPiece((g, ink) => {
    g.fillStyle = ink('#ead9b8'); D.rect(g, -7, 0, 14, 8);
    g.fillStyle = ink('#f1e6cf'); D.ell(g, 0, 8.6, 3.0, 2.6); D.rect(g, -0.12, 10.8, 0.24, 1.6);
    for (const s of [-1, 1]) { g.fillStyle = ink('#e4d2ae'); D.rect(g, s * 6.4 - 0.7, 0, 1.4, 11); D.ell(g, s * 6.4, 11.2, 0.9, 1.0); g.fillStyle = ink(C.gold); D.rect(g, s * 6.4 - 0.06, 12, 0.12, 0.8); }
    g.fillStyle = ink(C.recess, 'print'); pathOf(g, arch(-2.2, 2.2, 0, 4, 2.2, 8)); g.fill(); for (const s of [-1, 1]) { pathOf(g, arch(s * 4 - 1, s * 4 + 1, 1, 2.6, 1.2, 6)); g.fill(); }
    g.fillStyle = ink('#c9a46a', 'print'); D.rect(g, -7, 7.5, 14, 0.35);
  }, { w: 16, h: 13, name: 'palace set' });
  RJ.palace = put(palace[0], palace[1], { x: rx - 10, z: rz - 8, cross: 'half', second: brace(5, 9), yaw: 0.15 });
  // a village temple gopuram (Telugu cinema's favourite set)
  const gopuram = P2.drawnPiece((g, ink) => {
    for (let k = 0; k < 6; k++) { const w = 9 - k * 1.3, y = k * 2.1; g.fillStyle = ink(k % 2 ? '#e8c27a' : '#e3a86a'); D.rect(g, -w / 2, y, w, 2.2, 0.1); g.fillStyle = ink(['#c33b4d', '#3f7a70', '#2f5d7c'][k % 3], 'print'); for (let i = 0; i < Math.max(1, Math.floor(w / 1.3)); i++) D.rect(g, -w / 2 + 0.4 + i * 1.3, y + 0.5, 0.6, 1.1, 0.25); }
    g.fillStyle = ink('#e3a86a'); D.ell(g, 0, 13.2, 1.8, 0.9); g.fillStyle = ink(C.gold); for (const x of [-1, 0, 1]) D.rect(g, x - 0.1, 13.6, 0.2, 1.0);
    g.fillStyle = ink(C.recess, 'print'); D.rect(g, -1.1, 0, 2.2, 3.2, 0.5);
  }, { w: 10, h: 15, name: 'gopuram set' });
  RJ.gopuram = put(gopuram[0], gopuram[1], { x: rx + 10, z: rz - 10, cross: 'half', second: brace(4, 12), yaw: -0.12 });
  // a western saloon front
  const saloon = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#b98a58'); D.poly(g, [[-5, 0], [5, 0], [5, 7], [3, 7], [3, 8.4], [-3, 8.4], [-3, 7], [-5, 7]]); g.fillStyle = ink('#8a5634', 'print'); for (let y = 0.6; y < 8.2; y += 0.6) D.rect(g, -5, y, 10, 0.06); g.fillStyle = ink('#f3e6c8', 'print'); D.rect(g, -2.6, 7.2, 5.2, 0.9); text(g, 'SALOON', 0, 7.65, 0.6, '#6b2a1a'); g.fillStyle = ink(C.recess, 'print'); D.rect(g, -1.2, 0, 2.4, 3.2); D.rect(g, -4.2, 3.6, 1.8, 1.8); D.rect(g, 2.4, 3.6, 1.8, 1.8); g.fillStyle = ink('#6b4a2c'); D.rect(g, -5.2, 3.0, 10.4, 0.4); }, { w: 10.6, h: 8.6, name: 'saloon set' });
  RJ.saloon = put(saloon[0], saloon[1], { x: rx + 2, z: rz - 18, cross: 'half', second: brace(4, 7), yaw: 0.0 });
  // the clapperboard: the board on a hinge + its striped stick (a child that snaps shut)
  const board = makeCard(P2.shape.rect(6, 4.6), { paper: H.paper, thickness: 0.1, edgeWidth: 0.06, pxPerUnit: 48, seed: 777, paint: (P) => {
    P.fill('#2a2622'); P.draw((g) => { g.strokeStyle = '#efe8dc'; g.lineWidth = 0.08; for (const y of [1.2, 2.3, 3.4]) { g.beginPath(); g.moveTo(-2.8, y); g.lineTo(2.8, y); g.stroke(); } g.beginPath(); g.moveTo(0, 0.1); g.lineTo(0, 2.3); g.stroke(); text(g, 'HYDERABAD', -1.4, 2.85, 0.5, '#efe8dc'); text(g, 'SCENE 7', 1.4, 1.75, 0.42, '#efe8dc'); text(g, 'TAKE 1', -1.4, 1.75, 0.42, '#efe8dc'); text(g, 'RAMOJI', 0, 0.65, 0.5, C.gold); });
    P.layer((g) => { for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(-3 + k * 1.1, 3.9); g.lineTo(-2.45 + k * 1.1, 3.9); g.lineTo(-2.0 + k * 1.1, 4.6); g.lineTo(-2.55 + k * 1.1, 4.6); g.closePath(); g.fill(); } }, '#efe8dc', { lip: 0.4 });
  } });
  const stick = makeCard([[0, 0], [6.2, 0], [6.2, 0.8], [0, 0.8]], { paper: H.paper, thickness: 0.1, edgeWidth: 0.06, pxPerUnit: 48, seed: 778, folds: [], paint: (P) => { P.fill('#2a2622'); P.layer((g) => { for (let k = 0; k < 6; k++) { g.beginPath(); g.moveTo(k * 1.1, 0); g.lineTo(k * 1.1 + 0.55, 0); g.lineTo(k * 1.1 + 1.0, 0.8); g.lineTo(k * 1.1 + 0.45, 0.8); g.closePath(); g.fill(); } }, '#efe8dc', { lip: 0.4 }); } });
  const clap = new THREE.Group(), stickPivot = new THREE.Group();
  clap.add(board); stickPivot.position.set(-3, 4.65, 0.06); stick.position.set(0, 0, 0); stickPivot.add(stick); clap.add(stickPivot);
  RJ.stick = stickPivot; stickPivot.rotation.z = 0.5;
  RJ.clap = putNode(clap, { x: rx - 2, z: rz + 6, height: 5.4, yaw: 0.1, group: 'clapper' });
  // the camera crane: a dolly, a long arm, the camera (one card that turns slowly on its hinge's yaw)
  const crane = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#2a2622'); D.ell(g, -1.4, 0.4, 0.4, 0.4); D.ell(g, 1.4, 0.4, 0.4, 0.4); g.fillStyle = ink('#5a5a58'); D.rect(g, -2, 0.6, 4, 0.7, 0.1); D.rect(g, -0.25, 1.2, 0.5, 4.4); g.fillStyle = ink('#3a3a38'); D.poly(g, [[-4.5, 4.0], [5.5, 6.4], [5.6, 6.9], [-4.6, 4.5]]); g.fillStyle = ink('#2a2622'); D.rect(g, 5.0, 6.6, 1.9, 1.3, 0.15); D.ell(g, 7.1, 7.25, 0.5, 0.5); g.fillStyle = ink('#c33b4d', 'print'); D.ell(g, 5.4, 7.6, 0.12, 0.12); g.fillStyle = ink('#7a7a78'); D.rect(g, -5.2, 3.4, 1.4, 1.4, 0.1); }, { w: 12.6, h: 8.2, name: 'camera crane' });
  RJ.crane = put(...crane, { x: rx - 13, z: rz + 3, scale: 1.0, yaw: 0.2 });
  // the record badge: a gold star
  const star = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#6b4a2c'); D.rect(g, -0.12, 0, 0.24, 6.2); g.fillStyle = ink(C.gold); g.beginPath(); for (let i = 0; i <= 10; i++) { const a = PI / 2 + i / 10 * 2 * PI, r = i % 2 ? 1.25 : 2.9; g.lineTo(Math.cos(a) * r, 7 + Math.sin(a) * r); } g.fill(); g.fillStyle = ink('#f6ecd4', 'print'); D.ell(g, 0, 7, 1.15, 1.15); text(g, 'WORLD', 0, 7.35, 0.34, '#7a2a1a'); text(g, 'RECORD', 0, 6.8, 0.34, '#7a2a1a'); }, { w: 6.2, h: 10.2, name: 'record star' });
  RJ.star = put(...star, { x: rx + 8, z: rz + 2, yaw: -0.15, group: 'record' });
  // spotlights, a director's chair, extras
  const spot = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#3a3a38'); D.poly(g, [[-1, 0], [1, 0], [0.12, 3.2], [-0.12, 3.2]]); g.fillStyle = ink('#2a2622'); D.rect(g, -0.9, 3.0, 1.8, 1.3, 0.2); g.fillStyle = ink('#fff0c0', 'print'); D.ell(g, 0, 3.65, 0.55, 0.5); }, { w: 2.2, h: 4.4, name: 'spotlight' });
  for (const [x, z] of [[rx - 6, rz + 8], [rx + 4, rz + 9], [rx + 14, rz - 2]]) put(...spot, { x, z, scale: 1.1 });
  const chair = P2.drawnPiece((g, ink) => { g.fillStyle = ink('#6b4a2c'); D.poly(g, [[-0.9, 0], [-0.7, 0], [0.9, 1.6], [0.7, 1.6]]); D.poly(g, [[0.9, 0], [0.7, 0], [-0.9, 1.6], [-0.7, 1.6]]); g.fillStyle = ink('#2f5d7c'); D.rect(g, -1, 1.5, 2, 0.3); D.rect(g, -1, 2.3, 2, 0.9); g.fillStyle = ink('#6b4a2c'); D.rect(g, -1, 1.5, 0.12, 1.8); D.rect(g, 0.88, 1.5, 0.12, 1.8); g.fillStyle = ink('#f3ecdd', 'print'); text(g, 'DIRECTOR', 0, 2.75, 0.28, '#f3ecdd'); }, { w: 2.2, h: 3.4, name: 'chair' });
  put(...chair, { x: rx - 7, z: rz + 2, scale: 1.2 });
  for (const [x, z, k] of [[rx - 4, rz + 4, 3], [rx + 1, rz + 3, 1], [rx + 12, rz + 6, 6], [rx - 16, rz + 9, 0]]) put(...person(PEOPLE[k]), { x, z });
  for (const [x, z] of [[rx - 24, rz - 6], [rx + 22, rz - 12], [rx - 20, rz + 12], [rx + 24, rz + 8]]) put(...palm(), { x, z, cross: true, scale: 0.9, sway: 0.4 });
  mark(rx, rz - 6, 16);
});

stage('7. the old-c');
// ---------------------------------------------------------------------------------------------------------------
// 7. the old-city LANES: houses close together, walkers and vehicles that move, kites in the air
// ---------------------------------------------------------------------------------------------------------------
const MOVERS = [];   // { h, path: pathLine, speed, offset, flip }
within('lanes', () => {
  const lane = ROADS[5], route = ROADS[0];
  const walkers = [[0, 0.0, 0.9], [2, 0.18, 0.8], [4, 0.35, 1.0], [1, 0.52, 0.85], [6, 0.7, 0.95], [3, 0.86, 0.9]];
  for (const [k, off, sp] of walkers) MOVERS.push({ h: put(...person(PEOPLE[k]), { x: 0, z: 0, yaw: 0 }), path: lane, speed: sp * 1.2, offset: off, side: (k % 2 ? 1 : -1) * 0.9 });
  MOVERS.push({ h: put(...scooter(), { x: 0, z: 0, yaw: 0 }), path: lane, speed: 4.2, offset: 0.3, side: -0.5 });
  for (const [k, off, sp] of [[5, 0.1, 0.7], [3, 0.44, 1.1], [0, 0.62, 0.75], [4, 0.94, 0.9]]) MOVERS.push({ h: put(...person(PEOPLE[k]), { x: 0, z: 0, yaw: 0 }), path: lane, speed: sp, offset: off, side: (k % 2 ? -1 : 1) * 1.1 });
  // the old-city rows: houses shoulder to shoulder on both sides of the lane, a fruit cart and a chai stall between
  const P = lane.pts;
  for (let i = 4; i < P.length - 4; i += 11) for (const side of [-1, 1]) {
    const [ax, az] = P[i], [bx, bz] = P[Math.min(P.length - 1, i + 2)], dir = Math.atan2(bx - ax, bz - az), nx = Math.cos(dir), nz = -Math.sin(dir);
    const x = ax + nx * side * 6.2, z = az + nz * side * 6.2;
    if (!free(x, z, -0.5)) continue;
    house(x, z, { w: between(4.6, 5.6), d: between(3.8, 4.6), h: between(5.5, 8.5), yaw: dir + (side > 0 ? -PI / 2 : PI / 2) + PI });
  }
  put(...person(PEOPLE[5]), { x: -26, z: 17 }); bougainvillea(-17, 33, 0.85); bougainvillea(-31, 27, 0.8);
});
// autos on the main roads (part of the city: up from the first shot)
for (const [ri, off, sp] of [[0, 0.1, 5], [0, 0.6, 4.4], [1, 0.2, 5.5], [1, 0.7, 4.8], [2, 0.4, 4.6], [3, 0.3, 5.2], [4, 0.5, 4.6], [6, 0.2, 5]]) MOVERS.push({ h: put(...autoRickshaw(), { x: 0, z: 0, yaw: 0, group: 'city' }), path: ROADS[ri], speed: sp, offset: off, side: 0.9 });

stage('8. the city ');
// ---------------------------------------------------------------------------------------------------------------
// 8. the city fill: houses, trees and granite between the districts (seeded, varied, never on roads or water)
// ---------------------------------------------------------------------------------------------------------------
const nearest = (x, z) => { let best = 'city', bd = 1e9; for (const [k, r] of [['charminar', 30], ['lanes', 22], ['golconda', 30], ['lake', 30], ['food', 22], ['hitec', 34], ['durgam', 22], ['ramoji', 30]]) { const [ax, az] = k === 'durgam' ? [DURGAM.x, DURGAM.z] : AT[k]; const d = Math.hypot(x - ax, z - az); if (d < r && d < bd) { bd = d; best = k === 'charminar' ? 'oldcity' : k; } } return best; };
rnd = P2.rng(505);
const NOFILL = /nofill/.test(location.search);
// print once, stamp many: a dozen house designs (folded once, then cloned open: each clone rises whole on its hinge),
// six neem / four palm / five boulder prints and four bougainvillea cards shared by the whole fill
const PROTO = { houses: [], neem: [], palm: [], rock: [], bush: [] };
if (!NOFILL) {
  for (let k = 0; k < 12; k++) {
    const w = between(4.2, 6.2), d = between(3.6, 5), h = between(4.6, 8), col = C.walls[k % C.walls.length], seed = 300 + k, fl = h > 6.4 ? 3 : 2, doorCol = C.doors[k % C.doors.length];
    const node = prismFold([[-w / 2, 0], [w / 2, 0], [w / 2, -d], [-w / 2, -d]], { h, roof: 'flat', paper: H.paper, center: true, print: { ...H.cardOpts(0, 0), pxPerUnit: 26 },
      paints: { wall: [paintHouseWall(col, { door: true, floors: fl, doorCol, seed, balcony: k % 3 === 0 }), paintHouseWall(shade(col, -0.04), { floors: fl, seed: seed + 1 }), paintHouseWall(col, { floors: fl, seed: seed + 2 }), paintHouseWall(shade(col, -0.04), { floors: fl, seed: seed + 3 })], roof: paintTerrace('#cbbd9e', k % 4 !== 0) } });
    PROTO.houses.push({ node, w, d, h });
  }
  for (let k = 0; k < 6; k++) { const [pts, paint] = neemTree(); PROTO.neem.push({ pts, paint, materials: H.printed(pts, paint, { cross: true }) }); }
  for (let k = 0; k < 3; k++) { const [pts, paint] = palm(); PROTO.palm.push({ pts, paint, materials: H.printed(pts, paint, { cross: true }) }); }
  for (let k = 0; k < 5; k++) { const [pts, paint] = boulders(700 + k * 37); PROTO.rock.push({ pts, paint, materials: H.printed(pts, paint, { cross: true }) }); }
}
const stamp = (list, x, z, o) => { const v = list[Math.floor(rnd() * list.length) % list.length]; return put(v.pts, v.paint, { ...o, x, z, materials: v.materials }); };
if (!NOFILL) {
  let n = 0;
  for (let gz = -128; gz < 100; gz += 8.6) for (let gx = -130; gx < 140; gx += 8.8) {
    const x = gx + (rnd() - 0.5) * 4.5, z = gz + (rnd() - 0.5) * 4.5;
    if (!free(x, z, 1.2)) continue;
    const g = nearest(x, z), roll = rnd();
    const rocky = g === 'golconda' || g === 'durgam' || g === 'ramoji';
    within(g, () => {
      if (roll < (rocky ? 0.2 : 0.62)) {
        const v = PROTO.houses[Math.floor(rnd() * PROTO.houses.length)], s = between(0.9, 1.1);
        const node = v.node.clone(true);
        putNode(node, { x, z, height: v.h * s, scale: s, yaw: (rnd() - 0.5) * 0.5 }); mark(x, z, Math.max(v.w, v.d) * 0.62 * s);
      }
      else if (roll < 0.74) { stamp(PROTO.neem, x, z, { cross: true, scale: between(0.75, 1.0), sway: 0.4 }); mark(x, z, 2.4); }
      else if (roll < 0.82) { stamp(PROTO.palm, x, z, { cross: true, scale: between(0.7, 0.9), sway: 0.4 }); mark(x, z, 2.2); }
      else if (roll < 0.88) { bougainvillea(x, z, between(0.7, 0.9)); mark(x, z, 2.4); }
      else { stamp(PROTO.rock, x, z, { cross: 'half', scale: between(0.7, 1.1) }); mark(x, z, 2.6); }
    });
    n++;
  }
  console.log('fill pieces', n);
}
stage('fill done');
const life = createLife({ scene: H.scene, camera: H.camera, heroHeight: 3.6, seed: 9, box: { w: 70, d: 60, h: 14 } });
life.flock({ size: 9, every: 7, cross: 5, height: 5, span: 80, colors: ['#a8a4a0', '#c9c4bc', '#8e8a86'], night: 0.2 });
const steam = life.puffs({ at: FD.steam, perEmitter: 3, life: 3.0, rise: 0.55, size: [0.14, 0.26], colors: ['#f6efe2', '#ece2d0'] });
life.motes({ count: 40, colors: ['#f6e6b8', '#f0d9a0'], size: [0.05, 0.08], height: [1, 8] });
void steam;
// kites: diamond cards with tails, hung in the air over the old city and the lanes, bobbing on the wind
const KITES = [];
for (const [i, [x, y, z, col]] of [[-24, 11, 20, C.red], [-30, 13, 15, C.saffron], [-14, 12, 22, '#2f5d7c'], [-36, 10, 22, C.pink], [-8, 13, 14, '#3f7a70'], [-4, 18, -12, '#7a4a8a'], [12, 20, 2, C.gold], [-20, 14, 10, '#c33b4d']].entries()) {
  const kp = P2.fromDrawing((g) => { D.poly(g, [[0, 0], [0.9, 1.3], [0, 2.8], [-0.9, 1.3]]); }, { w: 2, h: 2.9, name: 'kite' });
  const k = makeCard(kp, { paper: H.paper, thickness: 0.05, edgeWidth: 0.05, pxPerUnit: 40, seed: 1200 + i, folds: [], paint: (P) => { P.gradient(shade(col, 0.1), shade(col, -0.1), 0.5); P.layer((g) => { g.beginPath(); g.moveTo(0, 0); g.lineTo(0.9, 1.3); g.lineTo(0, 1.3); g.closePath(); g.fill(); }, mix(col, C.cream, 0.5), { lip: 0.5 }); P.draw((g) => { g.strokeStyle = '#3a2414'; g.lineWidth = 0.06; g.beginPath(); g.moveTo(0, 0); g.lineTo(0, 2.8); g.moveTo(-0.9, 1.3); g.lineTo(0.9, 1.3); g.stroke(); }); } });
  const tail = makeCard(P2.fromDrawing((g) => { D.rect(g, -0.08, 0, 0.16, 2.4); for (let q = 0; q < 3; q++) D.poly(g, [[-0.35, 0.4 + q * 0.7], [0.35, 0.4 + q * 0.7], [0, 0.75 + q * 0.7]]); }, { w: 0.8, h: 2.5, name: 'tail' }), { paper: H.paper, thickness: 0.04, edgeWidth: 0.04, pxPerUnit: 40, seed: 1300 + i, folds: [], paint: (P) => P.fill(shade(col, 0.15)) });
  tail.position.set(0, -2.4, -0.05);
  const kg = new THREE.Group(); kg.add(k, tail); kg.scale.setScalar(1.8); kg.position.set(x, y, z); kg.visible = false; H.scene.add(kg);
  KITES.push({ g: kg, x, y, z, ph: i * 1.7 });
}

// ---------------------------------------------------------------------------------------------------------------
// the film: shots (cuts on the VO's pauses), rises, light
// ---------------------------------------------------------------------------------------------------------------
const ease = (u) => u * u * (3 - 2 * u);
const smoothIn = (u) => (u < 0 ? 0 : u > 1 ? 1 : 0.5 - 0.5 * Math.cos(u * PI));
// each shot: from/to { t: target [x, y, z], a: azimuth rad, p: pitch deg, d: distance }, focus band
const SHOTS = [
  { t0: 0.0, t1: 6.9, from: { t: [-2, 1, 10], a: -0.35, p: 54, d: 118 }, to: { t: [0, 3, 2], a: -0.12, p: 47, d: 72 }, band: 0.32 },                 // 1 hook: crane down over the old city
  { t0: 6.9, t1: 15.5, from: { t: [0, 7, 0], a: -0.55, p: 40, d: 54 }, to: { t: [-6, 6, 3], a: 0.35, p: 43, d: 50 }, band: 0.3 },                   // 2 Charminar orbit, bazaar
  { t0: 15.5, t1: 22.9, from: { t: [-62, 4, 0], a: 0.4, p: 44, d: 80 }, to: { t: [-62, 8, -8], a: 0.12, p: 48, d: 74 }, band: 0.34 },              // 3 Golconda: crane up the terraces
  { t0: 22.9, t1: 29.7, from: { t: [40, 4, -4], a: -0.35, p: 42, d: 58 }, to: { t: [56, 5, -8], a: 0.15, p: 44, d: 52 }, band: 0.3 },                // 4 Hussain Sagar truck, dusk
  { t0: 29.7, t1: 38.1, from: { t: [-7, 4.5, 41], a: -0.22, p: 42, d: 44 }, to: { t: [-3, 4.5, 40], a: 0.08, p: 44, d: 42 }, band: 0.32 },                 // 5a the handi, the rosette
  { t0: 38.1, t1: 42.0, from: { t: [5, 3, 39.5], a: 0.25, p: 42, d: 30 }, to: { t: [6.5, 3, 39], a: 0.0, p: 44, d: 26 }, band: 0.34 },              // 5b chai and Osmania biscuits
  { t0: 42.0, t1: 47.2, from: { t: [90, 8, -56], a: -0.25, p: 38, d: 74 }, to: { t: [90, 13, -62], a: 0.12, p: 44, d: 72 }, band: 0.32 },           // 6a HITEC City rises
  { t0: 47.2, t1: 50.9, from: { t: [58, 9, -64], a: -0.28, p: 36, d: 78 }, to: { t: [65, 9, -64], a: 0.08, p: 38, d: 72 }, band: 0.36 },                // 6b Durgam Cheruvu at night
  { t0: 50.9, t1: 57.8, from: { t: [-68, 5, -70], a: -0.25, p: 41, d: 58 }, to: { t: [-54, 5, -74], a: 0.25, p: 44, d: 54 }, band: 0.32 },         // 7 Ramoji truck
  { t0: 57.8, t1: 66.7, from: { t: [-30, 4, 22], a: 0.3, p: 44, d: 50 }, to: { t: [-14, 4, 28], a: -0.1, p: 46, d: 48 }, band: 0.32 },              // 8 the lanes, people, kites
  { t0: 66.7, t1: 74.2, from: { t: [0, 5, 2], a: -0.2, p: 45, d: 60 }, to: { t: [10, 4, -16], a: 0.12, p: 54, d: 205 }, band: 0.36 },                // 9 pull back over the whole city
];
const CUTS = SHOTS.slice(1).map((s) => s.t0);
const shotAt = (t) => SHOTS.find((s) => t >= s.t0 && t < s.t1) || SHOTS[SHOTS.length - 1];
const camAt = (t) => {
  const s = shotAt(t), u0 = Math.min(1, Math.max(0, (t - s.t0) / (s.t1 - s.t0)));
  const u = s === SHOTS[SHOTS.length - 1] ? ease(u0) * 0.85 + u0 * 0.15 : 0.12 * u0 + 0.88 * ease(u0);   // committed moves, eased in and out
  const L = (a, b) => a + (b - a) * u;
  const tg = [0, 1, 2].map((i) => L(s.from.t[i], s.to.t[i])), azim = L(s.from.a, s.to.a), pitchDeg = L(s.from.p, s.to.p), dist = L(s.from.d, s.to.d);
  return { tgt: tg, yaw: azim, dist, pitchDeg, pos: polarCameraPos({ target: tg, azim, pitchDeg, dist, time: t, drift: 0.08 }), band: s.band };
};
const check = checkContinuity(camAt, { duration: 74.2, fps: 30, cuts: CUTS, maxPosStep: 3, maxDistStep: 3 });
if (!check.ok) console.warn('camera path jumps', JSON.stringify(check.issues.slice(0, 6)));
const moodAt = (t) => {                     // [a, b, k]
  if (t < 22.9) return ['day', 'golden', 0.08];
  if (t < 29.7) return ['golden', 'dusk', smoothIn((t - 23.5) / 5)];
  if (t < 42.0) return ['day', 'golden', 0.15];
  if (t < 47.2) return ['day', 'golden', 0.0];
  if (t < 50.9) return ['dusk', 'night', 0.85];
  if (t < 57.8) return ['day', 'golden', 0.05];
  if (t < 66.7) return ['day', 'golden', 0.3];
  return ['golden', 'dusk', smoothIn((t - 68) / 5.5) * 0.85];
};
H.setCameraController((t, dt, ctx) => {
  const c = camAt(t);
  ctx.target.set(...c.tgt); ctx.camera.position.set(...c.pos); ctx.camera.lookAt(ctx.target);
  ctx.post.o.focusBand = c.band; ctx.post.o.ramp = 0.34;
  ctx.fitShadow(ctx.lights, ctx.target);
  const [a, b, k] = moodAt(t); H.mixMood(a, b, k);
});

// rises: a group comes up nearest-first (the card on top of the flat stack), staggered
const raise = (name, at, { stagger = 0.03, max = 1.6, first = null } = {}) => H.cue(at, () => {
  const hs = (GROUPS[name] || []).slice().sort((p, q) => q.z - p.z);
  if (first) { H.fold(first, true, 0); }
  hs.forEach((h, i) => { if (h !== first) H.fold(h, true, Math.min(max, (first ? 0.35 : 0) + i * stagger)); });
});
raise('city', 0.15, { stagger: 0.002, max: 0.4 });
raise('oldcity', 0.9, { stagger: 0.012, max: 3.2 });
raise('lanes', 1.6, { stagger: 0.05, max: 1.0 });
raise('charminar', 7.25, { stagger: 0.035, max: 2.6, first: CH.body });
H.cue(7.5, () => CH.minarets.forEach((h, i) => H.fold(h, true, i * 0.12)));
raise('golconda', 15.75, { stagger: 0.03, max: 2.2 });
H.cue(15.75, () => GK.terraces.slice().reverse().forEach((h, i) => H.fold(h, true, i * 0.22)));
GK.arcs.forEach((h, i) => { H.cue(18.3 + i * 0.42, () => H.fold(h, true, 0)); H.cue(21.2 + i * 0.12, () => H.fold(h, false, 0)); });
raise('lake', 23.1, { stagger: 0.03, max: 2.0, first: HS.buddha });
raise('food', 29.9, { stagger: 0.03, max: 1.6 });
raise('handiSealed', 30.0);
H.cue(32.1, () => { H.fold(FD.sealed, false, 0); H.fold(FD.open, true, 0.35); });
raise('rosette', 34.3);
raise('cafe', 30.6); raise('chai', 38.3, { stagger: 0.18 });
raise('hitec', 42.2, { stagger: 0.03, max: 2.4, first: HT.cyber });
raise('durgam', 0.5, { stagger: 0.01, max: 0.5 });
raise('ramoji', 51.1, { stagger: 0.04, max: 2.2 });
raise('clapper', 51.6); raise('record', 55.0);
// the lanes, oldcity and the rest are already up; make sure every group is up before the final pull back
H.cue(66.8, () => { for (const k of Object.keys(GROUPS)) if (!['handiSealed', 'arcs', 'clap'].includes(k)) for (const h of GROUPS[k]) if (h.open < 1) H.fold(h, true, 0.05); });

// the step hook: movers, boats, kites, crane, the bridge colours, the clapper's snap
const _c = new THREE.Color();
const posOn = (path, s) => { const P = path.pts, L = P.length - 1, f = ((s % L) + L) % L, i = Math.floor(f), k = f - i, a = P[i], b = P[Math.min(L, i + 1)]; return [a[0] + (b[0] - a[0]) * k, a[1] + (b[1] - a[1]) * k, Math.atan2(b[0] - a[0], b[1] - a[1])]; };
H.onStep((t, dt) => {
  life.update(dt, H.target);
  for (const m of MOVERS) {
    const s = (m.offset * m.path.pts.length) + t * m.speed * 2;           // pts are ~0.5 units apart
    const [x, z, dir] = posOn(m.path, s), nx = Math.cos(dir), nz = -Math.sin(dir);
    m.h.group.position.x = x + nx * m.side; m.h.group.position.z = z + nz * m.side;
    // face the camera (a card), mirrored by the direction it travels across the frame
    const cam = H.camera.position, face = Math.atan2(cam.x - x, cam.z - z);
    m.h.group.rotation.y = face;
    const across = Math.sin(dir - face); m.h.pivot.scale.x = across >= 0 ? 1 : -1;
    m.h.pivot.position.y = Math.abs(Math.sin(t * 9 + m.offset * 20)) * 0.06;
  }
  for (const b of HS.boats) { const a = b.a + t * b.w; b.h.group.position.x = LAKE.x + Math.cos(a) * b.rx; b.h.group.position.z = LAKE.z + Math.sin(a) * b.rz; b.h.pivot.position.y = Math.sin(t * 2 + b.a) * 0.05; }
  const kitesOn = (t > 0.5 && t < 6.9) || (t > 57.8 && t < 66.7) || t > 66.7;
  for (const k of KITES) { k.g.visible = kitesOn; k.g.position.set(k.x + Math.sin(t * 0.7 + k.ph) * 0.9, k.y + Math.sin(t * 1.3 + k.ph) * 0.6, k.z + Math.cos(t * 0.5 + k.ph) * 0.5); k.g.rotation.set(Math.sin(t * 1.1 + k.ph) * 0.15, Math.atan2(H.camera.position.x - k.x, H.camera.position.z - k.z), Math.sin(t * 0.9 + k.ph) * 0.3); }
  HT.jib.visible = t > 42.8; HT.jib.rotation.y = 0.6 + t * 0.18;
  // the cable bridge changes colour at night
  const hue = (t * 0.12) % 1; _c.setHSL(hue, 0.85, 0.5);
  HT.cables.visible = t > 1.2; HT.cableMat.color.copy(t > 47.2 && t < 50.9 ? _c : new THREE.Color('#d9d2c2'));
  for (const h of [HT.deck]) h.group.traverse((o) => { if (o.isMesh && o.material && o.material[0]?.emissiveMap) { o.material[0].emissive.copy(_c); o.material[0].emissiveIntensity = t > 47.2 && t < 50.9 ? 0.32 : 0.0; } });
  // the clapper: open, then snap shut on "film city" and once more
  const ct = t - 52.2; RJ.stick.rotation.z = ct < 0 ? 0.5 : ct < 0.12 ? 0.5 * (1 - ct / 0.12) : ct < 1.6 ? 0 : ct < 2.4 ? 0.45 * Math.sin((ct - 1.6) / 0.8 * PI / 2) : ct < 2.52 ? 0.45 * (1 - (ct - 2.4) / 0.12) : 0;
  if (ct >= 0 && ct - dt < 0) H.recordFlap({ size: 0.4, up: false, key: 9001, pan: 0, distance: 0.3 });
  if (ct >= 2.52 && ct - dt < 2.52) H.recordFlap({ size: 0.4, up: false, key: 9002, pan: 0, distance: 0.3 });
});
H.onRestart(() => { life.reset(H.target); RJ.stick.rotation.z = 0.5; });
// windows glow with the mood (night lights up the panes)
// panes glow only where the night comes (HITEC City, the lake): elsewhere the printed windows stay printed
for (const [name, hs] of Object.entries(GROUPS)) for (const h of hs) { if (['hitec', 'lake'].includes(name)) H.glowing(h.group); else h.group.traverse((o) => { if (!o.isMesh) return; for (const m of [].concat(o.material)) if (m && m.emissiveMap) m.emissiveIntensity = 0; }); }

// ---------------------------------------------------------------------------------------------------------------
// the score: a soft felt-piano bed in D, 84 bpm (it sits under the voice)
// ---------------------------------------------------------------------------------------------------------------
const mel = (pairs) => pairs.map(([b, m, v = 0.24]) => [b, m, v]);
const SCORE = { bpm: 84, gain: 0.5, wet: 0.36, reverbDuration: 2.6, seed: 23, bars: [
  { beats: 4, chord: [38, 45, 54, 57], melody: mel([[0, 66], [1.5, 69], [3, 71]]) },
  { beats: 4, chord: [37, 45, 52, 57], melody: mel([[0, 69], [2, 66]]) },
  { beats: 4, chord: [35, 42, 50, 54], melody: mel([[0, 62], [1, 64], [2.5, 66]]) },
  { beats: 4, chord: [31, 43, 47, 50], melody: mel([[0, 67], [2, 64]]) },
  { beats: 4, chord: [38, 45, 54, 57], melody: mel([[0, 66], [1.5, 64], [3, 62]]) },
  { beats: 4, chord: [33, 45, 49, 52], melody: mel([[0, 64], [2, 61]]) },
  { beats: 4, chord: [31, 43, 47, 50], melody: mel([[0, 59], [1.5, 62], [3, 64]]) },
  { beats: 4, chord: [33, 45, 49, 52], melody: mel([[0, 66], [2, 64], [3, 61]]) },
], bells: [{ t: 7.4, midi: 74, vel: 0.08 }, { t: 18.3, midi: 78, vel: 0.07 }, { t: 32.4, midi: 74, vel: 0.07 }, { t: 52.2, midi: 81, vel: 0.06 }, { t: 72.0, midi: 74, vel: 0.08 }] };
H.setMusicRenderer((sec, sr, from) => renderScoreOffline(SCORE, sec, { sampleRate: sr, from }));

window.__hyd = { GROUPS, SHOTS, camAt, check };
stage('before start'); H.start(); stage('after start');
