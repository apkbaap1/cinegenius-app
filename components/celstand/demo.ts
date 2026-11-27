// A starter scene drawn entirely in code, so the stand works before any
// artwork is uploaded: sky, drifting clouds, a rippling river (and a seaside
// alternative), two characters with poses, a jacket cel, blink and 4 mouths.

import { CharacterLayer, ImageLayer, Scene, defaultRipple, defaultScroll, uid } from './types';

const cv = (w: number, h: number) => {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!] as const;
};
const url = (c: HTMLCanvasElement) => c.toDataURL('image/png');

// ---------------- backgrounds ----------------

function sky(): string {
  const [c, g] = cv(1920, 1080);
  const gr = g.createLinearGradient(0, 0, 0, 1080);
  gr.addColorStop(0, '#3d7fd6');
  gr.addColorStop(0.45, '#8cc3f0');
  gr.addColorStop(0.7, '#f7dfc2');
  gr.addColorStop(1, '#f9c99b');
  g.fillStyle = gr;
  g.fillRect(0, 0, 1920, 1080);
  const sun = g.createRadialGradient(1500, 520, 10, 1500, 520, 420);
  sun.addColorStop(0, 'rgba(255,245,215,0.9)');
  sun.addColorStop(1, 'rgba(255,245,215,0)');
  g.fillStyle = sun;
  g.fillRect(0, 0, 1920, 1080);
  return url(c);
}

function cloudPuff(g: CanvasRenderingContext2D, x: number, y: number, s: number) {
  const blobs = [[0, 0, 1], [-0.9, 0.25, 0.7], [0.95, 0.2, 0.75], [-0.4, -0.35, 0.75], [0.45, -0.3, 0.8], [1.7, 0.35, 0.5], [-1.6, 0.4, 0.45]];
  g.fillStyle = '#ffffff';
  for (const [dx, dy, r] of blobs) { g.beginPath(); g.arc(x + dx * s, y + dy * s, r * s, 0, Math.PI * 2); g.fill(); }
  g.fillStyle = 'rgba(170,190,225,0.55)';
  g.beginPath();
  g.ellipse(x, y + s * 0.55, s * 2.1, s * 0.32, 0, 0, Math.PI * 2);
  g.fill();
  g.fillStyle = '#ffffff';
  g.beginPath();
  g.ellipse(x, y + s * 0.35, s * 2.0, s * 0.3, 0, 0, Math.PI * 2);
  g.fill();
}

function clouds(): string {
  const [c, g] = cv(1920, 1080);
  cloudPuff(g, 300, 210, 70);
  cloudPuff(g, 900, 120, 50);
  cloudPuff(g, 1380, 260, 85);
  cloudPuff(g, 1750, 150, 45);
  cloudPuff(g, 620, 380, 40);
  return url(c);
}

function hills(g: CanvasRenderingContext2D, base: number, color: string, amp: number, seed: number) {
  g.fillStyle = color;
  g.beginPath();
  g.moveTo(0, 1080);
  for (let x = 0; x <= 1920; x += 20) {
    const y = base - amp * (0.6 * Math.sin(x / 260 + seed) + 0.4 * Math.sin(x / 110 + seed * 2.3));
    g.lineTo(x, y);
  }
  g.lineTo(1920, 1080);
  g.closePath();
  g.fill();
}

function river(): string {
  const [c, g] = cv(1920, 1080);
  hills(g, 560, '#7d9fc1', 50, 1);
  hills(g, 610, '#5f8a6a', 35, 4);
  // water
  const w = g.createLinearGradient(0, 630, 0, 840);
  w.addColorStop(0, '#9fc7e6');
  w.addColorStop(1, '#3f78ae');
  g.fillStyle = w;
  g.fillRect(0, 630, 1920, 220);
  g.strokeStyle = 'rgba(255,255,255,0.55)';
  for (let i = 0; i < 90; i++) {
    const y = 640 + Math.pow(Math.random(), 1.3) * 200;
    const x = Math.random() * 1920;
    const len = 20 + (y - 630) * 0.4 * Math.random();
    g.lineWidth = 1 + (y - 630) / 90;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + len, y); g.stroke();
  }
  // near bank
  g.fillStyle = '#6fa64f';
  g.beginPath();
  g.moveTo(0, 1080);
  g.lineTo(0, 830);
  for (let x = 0; x <= 1920; x += 40) g.lineTo(x, 830 + 18 * Math.sin(x / 180));
  g.lineTo(1920, 1080);
  g.fill();
  g.fillStyle = '#4f8a3a';
  for (let i = 0; i < 260; i++) {
    const x = Math.random() * 1920, y = 850 + Math.random() * 230;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 4, y - 18 - Math.random() * 14); g.lineTo(x + 8, y); g.fill();
  }
  return url(c);
}

function seaside(): string {
  const [c, g] = cv(1920, 1080);
  const sea = g.createLinearGradient(0, 560, 0, 880);
  sea.addColorStop(0, '#6fb7d9');
  sea.addColorStop(1, '#1f6fa3');
  g.fillStyle = sea;
  g.fillRect(0, 560, 1920, 330);
  g.fillStyle = 'rgba(255,255,255,0.6)';
  g.fillRect(0, 558, 1920, 4);
  g.strokeStyle = 'rgba(255,255,255,0.6)';
  for (let i = 0; i < 110; i++) {
    const y = 570 + Math.pow(Math.random(), 1.2) * 300;
    const x = Math.random() * 1920;
    g.lineWidth = 1 + (y - 560) / 100;
    g.beginPath(); g.moveTo(x, y); g.lineTo(x + 20 + Math.random() * (y - 540) * 0.4, y); g.stroke();
  }
  // foam line + sand
  g.fillStyle = '#f2f6f7';
  g.beginPath(); g.moveTo(0, 1080); g.lineTo(0, 875);
  for (let x = 0; x <= 1920; x += 30) g.lineTo(x, 870 + 10 * Math.sin(x / 90));
  g.lineTo(1920, 1080); g.fill();
  g.fillStyle = '#ecd3a1';
  g.beginPath(); g.moveTo(0, 1080); g.lineTo(0, 890);
  for (let x = 0; x <= 1920; x += 30) g.lineTo(x, 888 + 12 * Math.sin(x / 140 + 1));
  g.lineTo(1920, 1080); g.fill();
  return url(c);
}

// ---------------- characters ----------------

interface Look {
  skin: string; skinShade: string; hair: string; hairShade: string; longHair: boolean;
  iris: string; jacket: string; jacketShade: string; shirt: string;
}

type PoseName = 'idle' | 'wave' | 'happy';
const W = 600, H = 900, HX = 300, HY = 270;
const LINE = '#2b2230';

function strokeFill(g: CanvasRenderingContext2D, fill: string, lw = 5) {
  g.fillStyle = fill; g.fill();
  g.strokeStyle = LINE; g.lineWidth = lw; g.lineJoin = 'round'; g.stroke();
}

function jacketPaths(g: CanvasRenderingContext2D, L: Look, pose: PoseName, fill: (c: string) => void) {
  // torso left/right panels (open front)
  g.beginPath();
  g.moveTo(170, 900); g.lineTo(180, 560); g.quadraticCurveTo(200, 470, 270, 445); g.lineTo(285, 520); g.lineTo(265, 900); g.closePath();
  fill(L.jacket);
  g.beginPath();
  g.moveTo(430, 900); g.lineTo(420, 560); g.quadraticCurveTo(400, 470, 330, 445); g.lineTo(315, 520); g.lineTo(335, 900); g.closePath();
  fill(L.jacket);
  // collar
  g.beginPath(); g.moveTo(262, 440); g.lineTo(300, 520); g.lineTo(250, 500); g.closePath(); fill(L.jacketShade);
  g.beginPath(); g.moveTo(338, 440); g.lineTo(300, 520); g.lineTo(350, 500); g.closePath(); fill(L.jacketShade);
  // left sleeve (viewer's left), always down
  g.beginPath();
  g.moveTo(182, 500); g.quadraticCurveTo(120, 560, 115, 760); g.lineTo(175, 775); g.quadraticCurveTo(180, 640, 205, 580); g.closePath();
  fill(L.jacket);
  // right sleeve
  g.beginPath();
  if (pose === 'wave') {
    g.moveTo(418, 500); g.quadraticCurveTo(500, 470, 520, 330); g.lineTo(470, 310); g.quadraticCurveTo(455, 430, 400, 560); g.closePath();
  } else {
    g.moveTo(418, 500); g.quadraticCurveTo(480, 560, 485, 760); g.lineTo(425, 775); g.quadraticCurveTo(420, 640, 395, 580); g.closePath();
  }
  fill(L.jacket);
  // shading strip
  g.beginPath(); g.moveTo(180, 620); g.lineTo(185, 900); g.lineTo(215, 900); g.lineTo(205, 610); g.closePath(); fill(L.jacketShade);
}

function drawBody(g: CanvasRenderingContext2D, L: Look, pose: PoseName) {
  // back hair
  if (L.longHair) {
    g.beginPath();
    g.moveTo(160, 260); g.quadraticCurveTo(140, 520, 190, 640); g.lineTo(410, 640); g.quadraticCurveTo(460, 520, 440, 260); g.closePath();
    strokeFill(g, L.hairShade);
  }
  // shirt + neck
  g.beginPath(); g.moveTo(200, 900); g.lineTo(215, 470); g.quadraticCurveTo(300, 430, 385, 470); g.lineTo(400, 900); g.closePath();
  strokeFill(g, L.shirt);
  g.beginPath(); g.moveTo(268, 360); g.lineTo(268, 455); g.quadraticCurveTo(300, 480, 332, 455); g.lineTo(332, 360); g.closePath();
  strokeFill(g, L.skin);
  g.beginPath(); g.moveTo(268, 400); g.quadraticCurveTo(300, 430, 332, 400); g.lineTo(332, 380); g.lineTo(268, 380); g.closePath();
  g.fillStyle = L.skinShade; g.fill();
  // jacket (also drawn in the recolourable jacket cel)
  jacketPaths(g, L, pose, c => strokeFill(g, c));
  // hands
  g.beginPath(); g.ellipse(145, 785, 32, 28, 0, 0, Math.PI * 2); strokeFill(g, L.skin);
  if (pose === 'wave') {
    g.beginPath(); g.ellipse(497, 290, 34, 40, -0.2, 0, Math.PI * 2); strokeFill(g, L.skin);
    g.strokeStyle = LINE; g.lineWidth = 4;
    for (let i = 0; i < 3; i++) { g.beginPath(); g.moveTo(480 + i * 13, 262); g.lineTo(478 + i * 15, 236); g.stroke(); }
  } else {
    g.beginPath(); g.ellipse(455, 785, 32, 28, 0, 0, Math.PI * 2); strokeFill(g, L.skin);
  }
  // head
  g.beginPath(); g.ellipse(HX, HY, 135, 150, 0, 0, Math.PI * 2); strokeFill(g, L.skin);
  // ears
  g.beginPath(); g.ellipse(HX - 135, HY + 20, 18, 28, 0, 0, Math.PI * 2); strokeFill(g, L.skin, 4);
  g.beginPath(); g.ellipse(HX + 135, HY + 20, 18, 28, 0, 0, Math.PI * 2); strokeFill(g, L.skin, 4);
  // blush
  g.fillStyle = 'rgba(255,120,120,0.28)';
  g.beginPath(); g.ellipse(HX - 75, HY + 70, 28, 14, 0, 0, Math.PI * 2); g.fill();
  g.beginPath(); g.ellipse(HX + 75, HY + 70, 28, 14, 0, 0, Math.PI * 2); g.fill();
  // eyes
  for (const s of [-1, 1]) {
    const ex = HX + s * 58, ey = HY + 20;
    if (pose === 'happy') {
      g.strokeStyle = LINE; g.lineWidth = 7; g.lineCap = 'round';
      g.beginPath(); g.arc(ex, ey + 12, 26, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
      continue;
    }
    g.beginPath(); g.ellipse(ex, ey, 30, 40, 0, 0, Math.PI * 2); strokeFill(g, '#ffffff', 4);
    g.beginPath(); g.ellipse(ex + s * 2, ey + 6, 22, 31, 0, 0, Math.PI * 2); g.fillStyle = L.iris; g.fill();
    g.beginPath(); g.ellipse(ex + s * 2, ey + 10, 12, 17, 0, 0, Math.PI * 2); g.fillStyle = '#1a1420'; g.fill();
    g.beginPath(); g.ellipse(ex - 8, ey - 10, 8, 10, 0, 0, Math.PI * 2); g.fillStyle = '#fff'; g.fill();
    g.strokeStyle = LINE; g.lineWidth = 8; g.lineCap = 'round';
    g.beginPath(); g.arc(ex, ey + 4, 36, Math.PI * 1.15, Math.PI * 1.85); g.stroke();
  }
  // brows
  g.strokeStyle = L.hairShade; g.lineWidth = 7;
  for (const s of [-1, 1]) {
    g.beginPath(); g.moveTo(HX + s * 35, HY - 38 - (pose === 'happy' ? 8 : 0)); g.lineTo(HX + s * 85, HY - 44 - (pose === 'happy' ? 8 : 0)); g.stroke();
  }
  // fringe
  g.beginPath();
  g.moveTo(HX - 150, HY + 40);
  g.quadraticCurveTo(HX - 170, HY - 170, HX, HY - 165);
  g.quadraticCurveTo(HX + 170, HY - 170, HX + 150, HY + 40);
  g.lineTo(HX + 120, HY - 40); g.lineTo(HX + 80, HY - 30); g.lineTo(HX + 60, HY - 80);
  g.lineTo(HX + 20, HY - 40); g.lineTo(HX - 10, HY - 90); g.lineTo(HX - 40, HY - 40);
  g.lineTo(HX - 80, HY - 70); g.lineTo(HX - 110, HY - 30); g.lineTo(HX - 125, HY - 40);
  g.closePath();
  strokeFill(g, L.hair);
  g.fillStyle = 'rgba(255,255,255,0.25)';
  g.beginPath(); g.ellipse(HX - 40, HY - 125, 50, 12, -0.2, 0, Math.PI * 2); g.fill();
}

function drawJacket(g: CanvasRenderingContext2D, L: Look, pose: PoseName) {
  jacketPaths(g, L, pose, c => { g.fillStyle = c; g.fill(); });
}

function drawBlink(g: CanvasRenderingContext2D, L: Look) {
  for (const s of [-1, 1]) {
    const ex = HX + s * 58, ey = HY + 20;
    g.beginPath(); g.ellipse(ex, ey, 34, 44, 0, 0, Math.PI * 2); g.fillStyle = L.skin; g.fill();
    g.strokeStyle = LINE; g.lineWidth = 7; g.lineCap = 'round';
    g.beginPath(); g.arc(ex, ey - 20, 34, Math.PI * 0.2, Math.PI * 0.8); g.stroke();
  }
}

function drawMouth(g: CanvasRenderingContext2D, open: number) {
  const mx = HX, my = HY + 92;
  g.strokeStyle = LINE; g.lineWidth = 5; g.lineCap = 'round'; g.lineJoin = 'round';
  if (open === 0) {
    g.beginPath(); g.moveTo(mx - 20, my); g.quadraticCurveTo(mx, my + 8, mx + 20, my); g.stroke();
    return;
  }
  const w = 14 + open * 16, h = 6 + open * 26;
  g.beginPath(); g.ellipse(mx, my + h * 0.3, w, h, 0, 0, Math.PI * 2);
  g.fillStyle = '#7a2633'; g.fill(); g.stroke();
  if (open > 0.5) {
    g.save(); g.clip();
    g.fillStyle = '#e36b7b';
    g.beginPath(); g.ellipse(mx, my + h * 0.3 + h * 0.75, w * 0.8, h * 0.5, 0, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#ffffff';
    g.fillRect(mx - w, my + h * 0.3 - h - 2, w * 2, h * 0.28);
    g.restore();
  }
}

function makeCharacter(name: string, L: Look, x: number, y: number, flip: boolean): CharacterLayer {
  const poseIds: Record<PoseName, string> = { idle: uid('pose'), wave: uid('pose'), happy: uid('pose') };
  const poses = (Object.keys(poseIds) as PoseName[]).map(p => {
    const [b, gb] = cv(W, H); drawBody(gb, L, p);
    const [j, gj] = cv(W, H); drawJacket(gj, L, p);
    return { id: poseIds[p], name: p === 'idle' ? 'Neutral' : p === 'wave' ? 'Wave' : 'Happy', src: url(b), jacketSrc: url(j) };
  });
  const [bl, gbl] = cv(W, H); drawBlink(gbl, L);
  const mouths = [0, 0.33, 0.66, 1].map((o, i) => {
    const [m, gm] = cv(W, H); drawMouth(gm, o);
    return { id: uid('mouth'), name: ['Closed', 'Small', 'Mid', 'Wide'][i], src: url(m), openness: o };
  });
  return {
    id: uid('char'), kind: 'character', name, visible: true, locked: false, opacity: 1,
    x, y, scale: 0.9, flip, parallax: 1,
    poses, defaultPoseId: poseIds.idle, poseCues: [],
    mouths, blinkSrc: url(bl), autoBlink: true,
    jacketColor: '', jacketStrength: 0.9,
  };
}

// ---------------- ambient sound ----------------

function wavDataURL(samples: Float32Array, rate: number): string {
  const n = samples.length;
  const buf = new ArrayBuffer(44 + n * 2);
  const v = new DataView(buf);
  const s = (o: number, str: string) => { for (let i = 0; i < str.length; i++) v.setUint8(o + i, str.charCodeAt(i)); };
  s(0, 'RIFF'); v.setUint32(4, 36 + n * 2, true); s(8, 'WAVE'); s(12, 'fmt ');
  v.setUint32(16, 16, true); v.setUint16(20, 1, true); v.setUint16(22, 1, true);
  v.setUint32(24, rate, true); v.setUint32(28, rate * 2, true); v.setUint16(32, 2, true); v.setUint16(34, 16, true);
  s(36, 'data'); v.setUint32(40, n * 2, true);
  for (let i = 0; i < n; i++) v.setInt16(44 + i * 2, Math.max(-1, Math.min(1, samples[i])) * 32767, true);
  let bin = '';
  const bytes = new Uint8Array(buf);
  for (let i = 0; i < bytes.length; i += 0x8000) bin += String.fromCharCode(...bytes.subarray(i, i + 0x8000));
  return 'data:audio/wav;base64,' + btoa(bin);
}

/** Soft running-water bed: filtered noise with slow swells, loop-safe. */
function riverAmbience(): string {
  const rate = 22050, secs = 6, n = rate * secs;
  const out = new Float32Array(n);
  let lp = 0, lp2 = 0, last = 0;
  for (let i = 0; i < n; i++) {
    const white = Math.random() * 2 - 1;
    lp += (white - lp) * 0.08;
    lp2 += (lp - lp2) * 0.3;
    const hp = lp2 - last; last = lp2;
    const swell = 0.6 + 0.4 * Math.sin((i / n) * Math.PI * 2 * 3);
    out[i] = (lp2 * 0.9 + hp * 2.2) * swell * 0.9;
  }
  const fade = rate * 0.5; // crossfade the loop point
  for (let i = 0; i < fade; i++) {
    const k = i / fade;
    out[i] = out[i] * k + out[n - fade + i] * (1 - k);
  }
  return wavDataURL(out.subarray(0, n - fade), rate);
}

// ---------------- scene ----------------

export function demoScene(): Scene {
  const bg = (name: string, src: string, extra: Partial<ImageLayer> = {}): ImageLayer => ({
    id: uid('layer'), kind: 'image', name, src, visible: true, locked: true, opacity: 1,
    x: 960, y: 540, scale: 1.04, flip: false, parallax: 0.3,
    scroll: defaultScroll(), ripple: defaultRipple(), ...extra,
  });
  const skyL = bg('Sky', sky(), { parallax: 0.05 });
  const cloudL = bg('Clouds', clouds(), { parallax: 0.1, scroll: { enabled: true, speed: -28 } });
  const riverL = bg('Scenery · River', river(), {
    parallax: 0.4, ripple: { enabled: true, top: 0.585, bottom: 0.78, amplitude: 5, wavelength: 22, speed: 0.5 },
  });
  const seaL = bg('Scenery · Sea', seaside(), {
    parallax: 0.4, visible: false, ripple: { enabled: true, top: 0.52, bottom: 0.81, amplitude: 6, wavelength: 26, speed: 0.4 },
  });
  const kiran = makeCharacter('Kiran', {
    skin: '#f3cfb0', skinShade: '#e2ae8d', hair: '#2d2a3a', hairShade: '#1b1824', longHair: false,
    iris: '#6b4a2e', jacket: '#3b6fb6', jacketShade: '#2d5590', shirt: '#f4f1ea',
  }, 640, 740, false);
  const anu = makeCharacter('Anu', {
    skin: '#e9bf9b', skinShade: '#d39d78', hair: '#4a2b22', hairShade: '#2f1a14', longHair: true,
    iris: '#3f2a1c', jacket: '#d8744a', jacketShade: '#b0573a', shirt: '#fff7e6',
  }, 1290, 740, true);

  const wave = kiran.poses.find(p => p.name === 'Wave')!.id;
  const happyK = kiran.poses.find(p => p.name === 'Happy')!.id;
  const happyA = anu.poses.find(p => p.name === 'Happy')!.id;
  kiran.poseCues = [
    { id: uid('cue'), t: 6.4, poseId: wave },
    { id: uid('cue'), t: 8.8, poseId: kiran.defaultPoseId },
    { id: uid('cue'), t: 11.2, poseId: happyK },
  ];
  anu.poseCues = [{ id: uid('cue'), t: 9.3, poseId: happyA }];

  return {
    version: 1,
    title: 'Riverside chat',
    aspect: '16:9',
    duration: 12.5,
    fps: 30,
    background: '#000000',
    layers: [skyL, cloudL, seaL, riverL, kiran, anu],
    dialogue: [
      { id: uid('line'), characterId: kiran.id, start: 0.8, end: 3.3, text: 'ఈ నది దగ్గర కూర్చుంటే, సినిమా scene లా ఉంది కదా?' },
      { id: uid('line'), characterId: anu.id, start: 3.7, end: 6.1, text: 'అవును! కానీ background మారిస్తే ఇంకా బాగుంటుంది.' },
      { id: uid('line'), characterId: kiran.id, start: 6.5, end: 8.9, text: 'సరే, sea కి మార్చేద్దాం. Jacket color కూడా!' },
      { id: uid('line'), characterId: anu.id, start: 9.3, end: 11.6, text: 'ఇదే cel animation magic రా!' },
    ],
    audio: [
      { id: uid('clip'), name: 'River ambience (generated)', role: 'ambient', src: riverAmbience(), start: 0, gain: 0.35, loop: true },
    ],
    camera: [
      { id: uid('cam'), t: 0, x: 0, y: 0, zoom: 1 },
      { id: uid('cam'), t: 12.5, x: 40, y: 10, zoom: 1.08 },
    ],
    subtitles: true,
    mouthRate: 12,
  };
}
