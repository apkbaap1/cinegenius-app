// Anime-style starter art, drawn in code: a summer riverbank with towering
// cumulonimbus (入道雲) and utility poles, a seaside alternative, and two
// characters with glossy anime eyes, pointed bangs, a hair highlight ring
// (天使の輪) and two-tone cel shading.

export const cv = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
};
export const url = (c: HTMLCanvasElement) => c.toDataURL('image/png');

// deterministic random so the demo looks the same every time
let _s = 7;
const rand = () => { _s = (_s * 16807) % 2147483647; return (_s - 1) / 2147483646; };

// =========================================================== backgrounds

export function animeSky(): string {
  const [c, g] = cv(1920, 1080);
  const gr = g.createLinearGradient(0, 0, 0, 1080);
  gr.addColorStop(0, '#0f4fc4');
  gr.addColorStop(0.35, '#2f86ea');
  gr.addColorStop(0.62, '#8cc9f7');
  gr.addColorStop(0.8, '#d8efff');
  gr.addColorStop(1, '#eef8ff');
  g.fillStyle = gr;
  g.fillRect(0, 0, 1920, 1080);
  // thin high cirrus streaks
  g.strokeStyle = 'rgba(255,255,255,0.18)';
  g.lineCap = 'round';
  for (let i = 0; i < 14; i++) {
    const y = 60 + rand() * 300, x = rand() * 1920, len = 200 + rand() * 400;
    g.lineWidth = 2 + rand() * 6;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + len / 2, y - 12, x + len, y + 4); g.stroke();
  }
  return url(c);
}

/** Anime cloud: hard-edged puffs, lit from the upper left, flat underside. */
function cloud(g: CanvasRenderingContext2D, puffs: [number, number, number][], flatY: number) {
  const shape = new Path2D();
  for (const [x, y, r] of puffs) { shape.moveTo(x + r, y); shape.arc(x, y, r, 0, Math.PI * 2); }
  g.save();
  g.beginPath(); g.rect(-5000, -5000, 10000, flatY + 5000); g.clip();
  g.fillStyle = '#b9cbe8';
  g.fill(shape);
  g.save();
  g.clip(shape);
  g.fillStyle = '#ffffff';
  for (const [x, y, r] of puffs) { g.beginPath(); g.arc(x - r * 0.16, y - r * 0.2, r * 0.9, 0, Math.PI * 2); g.fill(); }
  // soft cool underside
  const under = g.createLinearGradient(0, flatY - 60, 0, flatY);
  under.addColorStop(0, 'rgba(185,203,232,0)');
  under.addColorStop(1, 'rgba(160,182,222,0.9)');
  g.fillStyle = under;
  g.fillRect(-5000, flatY - 60, 10000, 60);
  g.restore();
  g.restore();
}

function tower(g: CanvasRenderingContext2D, cx: number, base: number, scale: number) {
  const puffs: [number, number, number][] = [];
  const levels = 7;
  for (let l = 0; l < levels; l++) {
    const y = base - l * 70 * scale;
    const width = (260 - l * 24) * scale;
    const n = 4 + Math.round(rand() * 2);
    for (let i = 0; i < n; i++) {
      const x = cx - width / 2 + (i / (n - 1)) * width + (rand() - 0.5) * 30 * scale;
      puffs.push([x, y - rand() * 20 * scale, (55 + rand() * 40 - l * 4) * scale]);
    }
  }
  puffs.push([cx - 20 * scale, base - levels * 70 * scale, 75 * scale]);
  cloud(g, puffs, base + 40 * scale);
}

function puffRow(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const p: [number, number, number][] = [];
  for (let i = 0; i < 6; i++) p.push([x + i * 38 * s, y - Math.sin(i / 5 * Math.PI) * 30 * s, (30 + rand() * 18) * s]);
  cloud(g, p, y + 18 * s);
}

export function animeClouds(): string {
  const [c, g] = cv(1920, 1080);
  tower(g, 1480, 600, 1.05);
  tower(g, 330, 610, 0.62);
  puffRow(g, 780, 470, 1);
  puffRow(g, 1060, 230, 0.7);
  puffRow(g, 120, 180, 0.6);
  return url(c);
}

function pole(g: CanvasRenderingContext2D, x: number, ground: number, top: number, s: number) {
  g.fillStyle = '#4b4f63';
  g.fillRect(x - 7 * s, top, 14 * s, ground - top);
  g.fillRect(x - 60 * s, top + 30 * s, 120 * s, 8 * s);
  g.fillRect(x - 45 * s, top + 70 * s, 90 * s, 7 * s);
  g.fillStyle = '#6b7088';
  for (const dx of [-50, -20, 20, 50]) g.fillRect(x + dx * s - 3 * s, top + 22 * s, 6 * s, 9 * s);
  g.fillStyle = '#5a5e75';
  g.fillRect(x - 22 * s, top + 100 * s, 44 * s, 36 * s); // transformer
}

function wires(g: CanvasRenderingContext2D, pts: [number, number][], sag: number) {
  g.strokeStyle = 'rgba(40,44,64,0.85)';
  g.lineWidth = 2;
  for (const off of [30, 33, 70]) {
    g.beginPath();
    for (let i = 0; i < pts.length - 1; i++) {
      const [x1, y1] = pts[i], [x2, y2] = pts[i + 1];
      g.moveTo(x1, y1 + off);
      g.quadraticCurveTo((x1 + x2) / 2, (y1 + y2) / 2 + off + sag, x2, y2 + off);
    }
    g.stroke();
  }
}

function grassBlades(g: CanvasRenderingContext2D, y0: number, y1: number, n: number, dark: string, light: string) {
  for (let i = 0; i < n; i++) {
    const x = rand() * 1920, y = y0 + rand() * (y1 - y0);
    const hgt = 10 + (y - y0) / (y1 - y0) * 30;
    g.fillStyle = rand() > 0.5 ? dark : light;
    g.beginPath(); g.moveTo(x, y); g.quadraticCurveTo(x + 3, y - hgt * 0.6, x + 8 * (rand() - 0.3), y - hgt); g.lineTo(x + 6, y); g.fill();
  }
}

export function animeRiver(): string {
  const [c, g] = cv(1920, 1080);
  // far mountains in haze
  g.fillStyle = '#86a8d4';
  g.beginPath(); g.moveTo(0, 640);
  for (let x = 0; x <= 1920; x += 30) g.lineTo(x, 575 - 45 * Math.sin(x / 300 + 1) - 20 * Math.sin(x / 97));
  g.lineTo(1920, 640); g.fill();
  // far bank: town + tree line
  g.fillStyle = '#7d9bbf';
  for (let i = 0; i < 40; i++) { const x = i * 50 + rand() * 20, hh = 15 + rand() * 40; g.fillRect(x, 625 - hh, 30 + rand() * 25, hh + 10); }
  g.fillStyle = '#4f8a5b';
  g.beginPath(); g.moveTo(0, 650);
  for (let x = 0; x <= 1920; x += 24) g.lineTo(x, 628 - 10 * Math.abs(Math.sin(x / 40)) - 6 * rand());
  g.lineTo(1920, 650); g.fill();
  // river
  const w = g.createLinearGradient(0, 645, 0, 820);
  w.addColorStop(0, '#a9d6f5'); w.addColorStop(0.4, '#4f9be0'); w.addColorStop(1, '#2a6db8');
  g.fillStyle = w;
  g.fillRect(0, 645, 1920, 180);
  for (let i = 0; i < 150; i++) {
    const y = 650 + Math.pow(rand(), 1.4) * 165;
    const x = rand() * 1920;
    g.fillStyle = rand() > 0.3 ? 'rgba(255,255,255,0.8)' : 'rgba(30,80,150,0.5)';
    g.fillRect(x, y, 10 + (y - 645) * 0.35 * rand(), 1 + (y - 645) / 70);
  }
  // near embankment (河川敷): slope + path on top
  g.fillStyle = '#5fae4a';
  g.beginPath(); g.moveTo(0, 1080); g.lineTo(0, 815);
  for (let x = 0; x <= 1920; x += 40) g.lineTo(x, 812 + 10 * Math.sin(x / 220));
  g.lineTo(1920, 1080); g.fill();
  g.fillStyle = '#4a9339';
  g.beginPath(); g.moveTo(0, 1080); g.lineTo(0, 900); g.quadraticCurveTo(960, 860, 1920, 905); g.lineTo(1920, 1080); g.fill();
  grassBlades(g, 820, 1080, 700, '#3f8a31', '#8fd06a');
  // far-bank pole belongs to the river painting (it stands above the water band, so it never ripples)
  pole(g, 250, 630, 350, 0.7);
  return url(c);
}

/** Utility poles + wires on their own cel, so the river ripple doesn't bend them. */
export function animePoles(): string {
  const [c, g] = cv(1920, 1080);
  pole(g, 1650, 1080, 150, 1.25);
  wires(g, [[-300, 300], [1650, 150], [2300, 120]], 60);
  return url(c);
}

export function animeSea(): string {
  const [c, g] = cv(1920, 1080);
  // distant island
  g.fillStyle = '#7fa4cf';
  g.beginPath(); g.moveTo(1150, 560); g.quadraticCurveTo(1350, 470, 1600, 560); g.fill();
  const sea = g.createLinearGradient(0, 560, 0, 860);
  sea.addColorStop(0, '#8fd0f2'); sea.addColorStop(0.3, '#3d9ee0'); sea.addColorStop(1, '#155fae');
  g.fillStyle = sea;
  g.fillRect(0, 558, 1920, 310);
  g.fillStyle = 'rgba(255,255,255,0.85)';
  g.fillRect(0, 556, 1920, 3);
  for (let i = 0; i < 200; i++) {
    const y = 565 + Math.pow(rand(), 1.3) * 290;
    const x = rand() * 1920;
    g.fillStyle = rand() > 0.25 ? 'rgba(255,255,255,0.85)' : 'rgba(20,70,140,0.5)';
    g.fillRect(x, y, 8 + (y - 560) * 0.3 * rand(), 1 + (y - 560) / 80);
  }
  // beach: foam line, wet sand, dry sand (the shoreline washes up and down on the stand)
  g.fillStyle = '#c9b48a';
  g.beginPath(); g.moveTo(0, 1080); g.lineTo(0, 872);
  for (let x = 0; x <= 1920; x += 30) g.lineTo(x, 868 + 8 * Math.sin(x / 110));
  g.lineTo(1920, 1080); g.fill();
  g.fillStyle = '#f4f8fa';
  g.beginPath(); g.moveTo(0, 878);
  for (let x = 0; x <= 1920; x += 30) g.lineTo(x, 862 + 8 * Math.sin(x / 110) + 4 * Math.sin(x / 23));
  for (let x = 1920; x >= 0; x -= 30) g.lineTo(x, 876 + 8 * Math.sin(x / 110));
  g.fill();
  g.fillStyle = '#ead7ad';
  g.beginPath(); g.moveTo(0, 1080); g.lineTo(0, 905);
  for (let x = 0; x <= 1920; x += 40) g.lineTo(x, 900 + 10 * Math.sin(x / 170 + 1));
  g.lineTo(1920, 1080); g.fill();
  for (let i = 0; i < 400; i++) { g.fillStyle = rand() > 0.5 ? 'rgba(160,130,90,0.35)' : 'rgba(255,255,255,0.35)'; g.fillRect(rand() * 1920, 910 + rand() * 170, 3, 2); }
  return url(c);
}

/** Water masks for the demo backgrounds: opaque where the water is. */
export function waterMask(top: number, bottom: number, waveEdge = false): string {
  const [c, g] = cv(1920, 1080);
  g.fillStyle = '#fff';
  g.beginPath(); g.moveTo(0, top); g.lineTo(1920, top);
  if (waveEdge) { for (let x = 1920; x >= 0; x -= 30) g.lineTo(x, bottom + 8 * Math.sin(x / 110)); }
  else { g.lineTo(1920, bottom); g.lineTo(0, bottom); }
  g.closePath(); g.fill();
  return url(c);
}

// =========================================================== characters

export interface Look {
  skin: string; skinShade: string; hair: string; hairShade: string; hairLight: string; longHair: boolean;
  irisDark: string; irisLight: string; jacket: string; jacketShade: string; shirt: string; ribbon: string;
}
export type PoseName = 'idle' | 'wave' | 'happy';

export const CW = 600, CH = 900;
const HX = 300, LINE = '#3a2426', TORSO_UP = 38;

const facePath = () => {
  const p = new Path2D();
  p.moveTo(190, 250);
  p.bezierCurveTo(188, 335, 214, 398, 262, 432);
  p.quadraticCurveTo(300, 456, 338, 432);
  p.bezierCurveTo(386, 398, 412, 335, 410, 250);
  p.bezierCurveTo(412, 112, 188, 112, 190, 250);
  return p;
};

const bangsPath = (long: boolean) => {
  const p = new Path2D();
  p.moveTo(176, 300);
  p.bezierCurveTo(150, 120, 290, 90, 330, 110);
  p.bezierCurveTo(420, 120, 455, 200, 424, 300);
  // locks hanging over the forehead, pointed tips
  const tips: [number, number, number][] = [[408, 250, 395], [380, 272, 362], [352, 236, 338], [322, 278, 300], [290, 232, 272], [258, 270, 238], [222, 244, 205], [200, 290, 190]];
  for (const [tx, ty, nx] of tips) { p.lineTo(tx, ty); p.lineTo(nx, ty - 52); }
  p.closePath();
  if (long) {
    // side locks framing the face
    p.moveTo(186, 230); p.bezierCurveTo(170, 330, 178, 420, 200, 470); p.lineTo(214, 400); p.lineTo(212, 260); p.closePath();
    p.moveTo(414, 230); p.bezierCurveTo(430, 330, 422, 420, 400, 470); p.lineTo(386, 400); p.lineTo(388, 260); p.closePath();
  } else {
    p.moveTo(186, 240); p.bezierCurveTo(176, 300, 182, 350, 196, 380); p.lineTo(210, 320); p.lineTo(208, 250); p.closePath();
    p.moveTo(414, 240); p.bezierCurveTo(424, 300, 418, 350, 404, 380); p.lineTo(390, 320); p.lineTo(392, 250); p.closePath();
  }
  return p;
};

function line(g: CanvasRenderingContext2D, w = 3.5) {
  g.strokeStyle = LINE; g.lineWidth = w; g.lineJoin = 'round'; g.lineCap = 'round';
}

function jacketPaths(g: CanvasRenderingContext2D, L: Look, pose: PoseName, fill: (c: string, p: Path2D) => void) {
  const mirror = (pts: [number, number][]) => pts.map(([x, y]) => [600 - x, y] as [number, number]);
  const poly = (pts: [number, number][]) => { const p = new Path2D(); p.moveTo(pts[0][0], pts[0][1]); pts.slice(1).forEach(([x, y]) => p.lineTo(x, y)); p.closePath(); return p; };
  const leftPanel: [number, number][] = [[150, 900], [156, 620], [170, 560], [255, 518], [283, 612], [268, 900]];
  fill(L.jacket, poly(leftPanel));
  fill(L.jacket, poly(mirror(leftPanel)));
  // lapels
  fill(L.jacketShade, poly([[254, 516], [300, 625], [244, 588]]));
  fill(L.jacketShade, poly([[346, 516], [300, 625], [356, 588]]));
  // cel shadow on the far side of the body
  fill(L.jacketShade, poly([[318, 640], [445, 600], [450, 900], [332, 900]]));
  // sleeves
  const ls = new Path2D();
  ls.moveTo(168, 560); ls.quadraticCurveTo(108, 640, 100, 880); ls.lineTo(168, 890); ls.quadraticCurveTo(172, 730, 196, 650); ls.closePath();
  fill(L.jacket, ls);
  const rs = new Path2D();
  if (pose === 'wave') { rs.moveTo(432, 560); rs.quadraticCurveTo(520, 530, 532, 390); rs.lineTo(478, 372); rs.quadraticCurveTo(468, 490, 404, 625); rs.closePath(); }
  else { rs.moveTo(432, 560); rs.quadraticCurveTo(492, 640, 500, 880); rs.lineTo(432, 890); rs.quadraticCurveTo(428, 730, 404, 650); rs.closePath(); }
  fill(L.jacketShade, rs);
}

function eye(g: CanvasRenderingContext2D, L: Look, s: number, happy: boolean) {
  const ex = HX + s * 62, ey = 318;
  g.save();
  g.translate(ex, ey);
  g.scale(s, 1); // outer corner on +x
  if (happy) {
    line(g, 6);
    g.beginPath(); g.moveTo(-30, 8); g.quadraticCurveTo(4, -26, 36, 4); g.stroke();
    g.beginPath(); g.moveTo(30, -4); g.lineTo(42, -10); g.stroke();
    g.restore();
    return;
  }
  const sclera = new Path2D();
  sclera.moveTo(-30, -20); sclera.quadraticCurveTo(0, -38, 34, -24);
  sclera.quadraticCurveTo(40, 6, 26, 30); sclera.quadraticCurveTo(0, 40, -24, 28);
  sclera.quadraticCurveTo(-36, 2, -30, -20);
  g.fillStyle = '#ffffff'; g.fill(sclera);
  g.save(); g.clip(sclera);
  const ir = g.createLinearGradient(0, -28, 0, 34);
  ir.addColorStop(0, L.irisDark); ir.addColorStop(0.55, L.irisDark); ir.addColorStop(1, L.irisLight);
  g.fillStyle = ir;
  g.beginPath(); g.ellipse(3, 4, 23, 32, 0, 0, Math.PI * 2); g.fill();
  g.fillStyle = 'rgba(10,6,20,0.85)';
  g.beginPath(); g.ellipse(3, 2, 11, 16, 0, 0, Math.PI * 2); g.fill();
  // ring of lighter iris colour at the bottom
  g.strokeStyle = L.irisLight; g.lineWidth = 3;
  g.beginPath(); g.ellipse(3, 4, 18, 26, 0, Math.PI * 0.15, Math.PI * 0.85); g.stroke();
  // shadow cast by the upper lid
  g.fillStyle = 'rgba(40,20,40,0.35)';
  g.beginPath(); g.ellipse(2, -26, 44, 20, 0, 0, Math.PI * 2); g.fill();
  g.restore();
  // highlights
  g.fillStyle = '#ffffff';
  g.beginPath(); g.ellipse(-8, -8, 8, 10, -0.3, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(12, 18, 4, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.arc(-12, 12, 2, 0, Math.PI * 2); g.fill();
  // lashes: heavy upper line with an outer flick, light lower line
  g.fillStyle = LINE;
  g.beginPath();
  g.moveTo(-34, -16); g.quadraticCurveTo(0, -46, 38, -26); g.lineTo(48, -34); g.lineTo(40, -18);
  g.quadraticCurveTo(0, -36, -30, -12); g.closePath(); g.fill();
  line(g, 2.2);
  g.beginPath(); g.moveTo(6, 33); g.quadraticCurveTo(20, 30, 28, 24); g.stroke();
  // brow
  line(g, 3);
  g.beginPath(); g.moveTo(-24, -62); g.quadraticCurveTo(6, -72, 36, -62); g.stroke();
  g.restore();
}

export function drawBody(g: CanvasRenderingContext2D, L: Look, pose: PoseName) {
  // back hair
  const back = new Path2D();
  if (L.longHair) {
    back.moveTo(178, 230); back.bezierCurveTo(140, 420, 150, 600, 140, 700);
    back.lineTo(185, 660); back.lineTo(205, 720); back.lineTo(240, 640); back.lineTo(360, 640); back.lineTo(395, 720); back.lineTo(415, 660); back.lineTo(460, 700);
    back.bezierCurveTo(450, 600, 460, 420, 422, 230); back.closePath();
  } else {
    back.moveTo(182, 260); back.bezierCurveTo(170, 330, 200, 400, 225, 410); back.lineTo(375, 410); back.bezierCurveTo(400, 400, 430, 330, 418, 260); back.closePath();
  }
  g.fillStyle = L.hairShade; g.fill(back); line(g); g.stroke(back);

  // everything below the head sits a little higher (shorter anime neck)
  g.save();
  g.translate(0, -TORSO_UP);
  // neck with cel shadow under the jaw
  const neck = new Path2D();
  neck.moveTo(272, 410); neck.lineTo(270, 520); neck.quadraticCurveTo(300, 540, 330, 520); neck.lineTo(328, 410); neck.closePath();
  g.fillStyle = L.skin; g.fill(neck); line(g, 3); g.stroke(neck);
  g.fillStyle = L.skinShade;
  g.beginPath(); g.moveTo(270, 430); g.quadraticCurveTo(300, 478, 330, 430); g.lineTo(330, 470); g.quadraticCurveTo(300, 495, 270, 470); g.fill();

  // shirt with collar points and a ribbon / tie
  const shirt = new Path2D();
  shirt.moveTo(190, 900); shirt.lineTo(200, 560); shirt.quadraticCurveTo(300, 505, 400, 560); shirt.lineTo(410, 900); shirt.closePath();
  g.fillStyle = L.shirt; g.fill(shirt); line(g, 3); g.stroke(shirt);
  g.fillStyle = L.shirt;
  const col = new Path2D(); col.moveTo(262, 505); col.lineTo(300, 548); col.lineTo(250, 560); col.closePath();
  const cor = new Path2D(); cor.moveTo(338, 505); cor.lineTo(300, 548); cor.lineTo(350, 560); cor.closePath();
  for (const p of [col, cor]) { g.fill(p); g.stroke(p); }
  g.fillStyle = L.ribbon;
  if (L.longHair) {
    g.beginPath(); g.moveTo(300, 552); g.lineTo(262, 532); g.lineTo(266, 578); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.moveTo(300, 552); g.lineTo(338, 532); g.lineTo(334, 578); g.closePath(); g.fill(); g.stroke();
    g.beginPath(); g.arc(300, 554, 9, 0, Math.PI * 2); g.fill(); g.stroke();
  } else {
    g.beginPath(); g.moveTo(290, 548); g.lineTo(310, 548); g.lineTo(318, 700); g.lineTo(300, 722); g.lineTo(282, 700); g.closePath(); g.fill(); g.stroke();
  }

  // jacket (also drawn alone into the recolourable jacket cel)
  jacketPaths(g, L, pose, (c, p) => { g.fillStyle = c; g.fill(p); line(g, 3.5); g.stroke(p); });

  // hands
  const hand = (x: number, y: number, r: number) => { g.beginPath(); g.ellipse(x, y, r, r * 0.9, 0, 0, Math.PI * 2); g.fillStyle = L.skin; g.fill(); line(g, 3); g.stroke(); };
  hand(134, 890, 30);
  if (pose === 'wave') {
    hand(505, 345, 34);
    line(g, 3);
    for (let i = 0; i < 4; i++) { g.beginPath(); g.moveTo(482 + i * 13, 318); g.lineTo(478 + i * 15, 292 - (i === 1 || i === 2 ? 6 : 0)); g.stroke(); }
    g.beginPath(); g.moveTo(476, 352); g.lineTo(462, 336); g.stroke();
  } else hand(466, 890, 30);
  g.restore();

  // face
  const face = facePath();
  g.fillStyle = L.skin; g.fill(face);
  // hair shadow on the forehead (cel shading): the bangs shape, shifted down, clipped to the face
  g.save(); g.clip(face); g.translate(6, 16); g.fillStyle = L.skinShade; g.fill(bangsPath(L.longHair)); g.restore();
  line(g, 3.5); g.stroke(face);

  // blush with hatching
  for (const s of [-1, 1]) {
    const bx = HX + s * 70, by = 378;
    g.fillStyle = 'rgba(255,110,130,0.28)';
    g.beginPath(); g.ellipse(bx, by, 30, 12, 0, 0, Math.PI * 2); g.fill();
    g.strokeStyle = 'rgba(220,70,100,0.55)'; g.lineWidth = 2;
    for (let i = -2; i <= 2; i++) { g.beginPath(); g.moveTo(bx + i * 10 - 4, by + 6); g.lineTo(bx + i * 10 + 4, by - 6); g.stroke(); }
  }
  eye(g, L, -1, pose === 'happy');
  eye(g, L, 1, pose === 'happy');
  // nose: a single small shade stroke
  line(g, 2.5);
  g.beginPath(); g.moveTo(305, 352); g.lineTo(298, 368); g.lineTo(306, 369); g.stroke();

  // front hair: base, shadow band, highlight ring (天使の輪)
  const bangs = bangsPath(L.longHair);
  g.fillStyle = L.hair; g.fill(bangs);
  g.save(); g.clip(bangs);
  g.fillStyle = L.hairShade;
  g.globalAlpha = 0.75; g.beginPath(); g.moveTo(150, 266); g.quadraticCurveTo(300, 228, 460, 266); g.lineTo(460, 320); g.lineTo(150, 320); g.fill(); g.globalAlpha = 1;
  g.fillStyle = L.hairLight;
  g.beginPath();
  g.moveTo(200, 178);
  for (let x = 200; x <= 400; x += 20) g.lineTo(x, 160 + Math.abs(Math.sin(x / 30)) * 10 - Math.sin((x - 200) / 200 * Math.PI) * 18);
  for (let x = 400; x >= 200; x -= 20) g.lineTo(x, 182 + (x % 40 === 0 ? 10 : 0) - Math.sin((x - 200) / 200 * Math.PI) * 18);
  g.closePath(); g.fill();
  g.restore();
  line(g, 3.5); g.stroke(bangs);
  // a few strand lines
  line(g, 2);
  for (const [x1, y1, x2, y2] of [[250, 140, 228, 230], [310, 120, 318, 220], [360, 140, 380, 220]]) {
    g.beginPath(); g.moveTo(x1, y1); g.quadraticCurveTo((x1 + x2) / 2 + 8, (y1 + y2) / 2, x2, y2); g.stroke();
  }
}

export function drawJacket(g: CanvasRenderingContext2D, L: Look, pose: PoseName) {
  g.save();
  g.translate(0, -TORSO_UP);
  jacketPaths(g, L, pose, (c, p) => { g.fillStyle = c; g.fill(p); });
  g.restore();
}

export function drawBlink(g: CanvasRenderingContext2D, L: Look) {
  for (const s of [-1, 1]) {
    g.save();
    g.translate(HX + s * 62, 318);
    g.scale(s, 1);
    g.fillStyle = L.skin;
    g.beginPath(); g.ellipse(2, -4, 44, 46, 0, 0, Math.PI * 2); g.fill();
    // brow again (it was covered)
    line(g, 3);
    g.beginPath(); g.moveTo(-24, -62); g.quadraticCurveTo(6, -72, 36, -62); g.stroke();
    // closed lid: a soft downward curve with the lash flick
    line(g, 5.5);
    g.beginPath(); g.moveTo(-30, 4); g.quadraticCurveTo(4, 22, 38, 2); g.stroke();
    g.beginPath(); g.moveTo(36, 3); g.lineTo(46, -4); g.stroke();
    g.restore();
  }
}

export function drawMouth(g: CanvasRenderingContext2D, open: number) {
  g.save();
  g.translate(HX, 402);
  line(g, 3);
  if (open === 0) {
    g.beginPath(); g.moveTo(-14, 0); g.quadraticCurveTo(0, 5, 14, -1); g.stroke();
    g.restore();
    return;
  }
  // the classic anime "D" mouth: flat-ish top, round bottom
  const w = 10 + open * 12, h = 6 + open * 24;
  const m = new Path2D();
  m.moveTo(-w, 0); m.quadraticCurveTo(0, -4, w, 0);
  m.bezierCurveTo(w * 0.9, h * 0.9, -w * 0.9, h * 0.9, -w, 0);
  g.fillStyle = '#6e1f2c'; g.fill(m);
  if (open > 0.4) {
    g.save(); g.clip(m);
    g.fillStyle = '#e8737f';
    g.beginPath(); g.ellipse(0, h * 0.85, w * 0.7, h * 0.4, 0, 0, Math.PI * 2); g.fill();
    if (open > 0.7) { g.fillStyle = '#ffffff'; g.fillRect(-w, -4, w * 2, 5); }
    g.restore();
  }
  g.stroke(m);
  g.restore();
}
