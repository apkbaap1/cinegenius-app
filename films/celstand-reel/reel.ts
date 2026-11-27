// "ఇది AI video కాదు": a 9:16 explainer reel, itself made the Cel Stand way.
// Every frame is drawn by code: the clip by the Cel Stand engine, the explainer
// graphics (cards, captions, pose table, waveform, 3D layers) on top.
// window.__seek(t) draws the frame at t seconds; a recorder captures frames.

import { renderFrame } from '../../components/celstand/renderer';
import { Breakdown, eio } from '../../components/celstand/breakdown';
import { CharacterLayer, MOUTH_SLOTS, Scene } from '../../components/celstand/types';
import { decodeAudio, getEnvelope, getImage, loadImage, ENV_RATE } from '../../components/celstand/assets';
import { Drawing, drawingAt, drawingLayers, slotLevel } from '../../components/celstand/sheet';
import { drawFx } from '../../components/celstand/fx';
import rendererSrc from '../../components/celstand/renderer.ts?raw';
import { CLIP_LEN, LINES, SWAP, clipScene } from './clipScene';

const W = 1080, H = 1920;
const CLIP_ONLY = new URLSearchParams(location.search).has('clip');
const ORANGE = '#D97757', ORANGE2 = '#F2A07A', INK = '#1d1a18', CREAM = '#FFF8F0', GREEN = '#2f5d4a';
const E0 = 16.6;                      // explainer VO starts
// explainer phrase windows (seconds into the explainer VO), from its pauses
const S: [number, number][] = [
  [0, 5.03], [5.37, 6.55], [6.9, 7.7], [8.08, 11.91], [12.31, 15.0], [15.36, 16.24], [16.55, 17.4], [17.73, 18.52],
  [18.85, 20.16], [20.59, 22.56], [22.85, 24.36], [24.8, 25.86], [26.26, 29.66], [30.11, 31.85], [32.25, 33.88],
  [34.26, 35.06], [35.45, 37.72], [38.06, 41.26], [41.59, 45.09], [45.45, 50.23], [50.64, 52.03], [52.4, 53.34],
];
const at = (i: number) => E0 + S[i][0];
export const DURATION = E0 + 53.63 + 1.0;

const CAPS: string[][] = [
  ['ఇప్పుడు చూసిన', '12 seconds scene లో', 'ఒక్క frame కూడా', 'AI video తో', 'generate చేయలేదు'],
  ['మొత్తం code.'], ['ఇది ఒక web app.'],
  ['Browser లో', 'HTML canvas మీద,', 'ప్రతి frame ని', 'code గీస్తుంది.'],
  ['Japan anime studios లాగే,', 'layer by layer.'],
  ['Sky ఒక layer,'], ['clouds ఒక layer,'], ['నీళ్లు ఒక layer,'], ['మేమిద్దరం వేరే layers.'],
  ['Clouds కదలడం,', 'నీళ్ల అలలు,'], ['అన్నీ code తో', 'వచ్చే motion.'],
  ['నా voice upload చేశా.'], ['Voice ని బట్టి,', 'ఒక second కి', '12 సార్లు', 'నోరు మారుతుంది.'],
  ['River నుంచి', 'sea కి మార్చాలా?'], ['Video మళ్ళీ', 'generate చేయక్కర్లేదు.'], ['ఒక్క click.'],
  ['మొత్తం app ని', 'Claude Code తో', 'build చేశా.'],
  ['React,', 'TypeScript,', 'HTML canvas,', 'Web Audio.'],
  ['Export కి WebCodecs,', 'direct గా', 'browser నుంచే MP4.'],
  ['ఈ tools list, steps', 'కావాలంటే', 'comment లో "ANIME"', 'అని రాయండి,', 'మీ DM కి పంపిస్తా.'],
  ['AI video లేదు.'], ['Code మాత్రమే.'],
];

// ------------------------------------------------------------------ helpers
const cl = (v: number, a = 0, b = 1) => Math.max(a, Math.min(b, v));
const prog = (t: number, a: number, b: number) => cl((t - a) / (b - a));
const backOut = (x: number) => { const c = 1.7; x = cl(x) - 1; return 1 + (c + 1) * x * x * x + c * x * x; };
const eo = (x: number) => 1 - Math.pow(1 - cl(x), 3);
const lerp = (a: number, b: number, k: number) => a + (b - a) * k;

const cv = document.getElementById('cv') as HTMLCanvasElement;
const ov = document.getElementById('ov') as HTMLCanvasElement;
const g = cv.getContext('2d')!;
const o = ov.getContext('2d')!;
const sceneCanvas = document.createElement('canvas'); sceneCanvas.width = W; sceneCanvas.height = H;
const sg = sceneCanvas.getContext('2d')!;
const maskCanvas = document.createElement('canvas'); maskCanvas.width = W; maskCanvas.height = H;
const mg = maskCanvas.getContext('2d')!;
const charCanvas = document.createElement('canvas'); charCanvas.width = W; charCanvas.height = H;
const chg = charCanvas.getContext('2d')!;
const breakdown = new Breakdown(document.getElementById('x3d') as HTMLDivElement);

const base = clipScene();
const byId = (id: string) => base.layers.find(l => l.id === id)!;

// a scene variant with a forced camera and/or forced background
function variant(opts: { cam?: { x: number; y: number; zoom: number }; bg?: 'river' | 'sea'; noFx?: boolean; only?: string[] } = {}): Scene {
  const layers = base.layers
    .filter(l => !opts.only || opts.only.includes(l.id))
    .filter(l => !(opts.noFx && l.kind === 'fx'))
    .map(l => {
      if (opts.bg && (l.id === 'river' || l.id === 'sea')) return { ...l, showFrom: undefined, showUntil: undefined, visible: l.id === opts.bg };
      return l;
    });
  return { ...base, layers, camera: opts.cam ? [{ id: 'c', t: 0, ...opts.cam }] : base.camera };
}

function sceneAt(s: Scene, t: number) {
  sg.setTransform(1, 0, 0, 1, 0, 0);
  renderFrame(sg, s, t, {});
  return sceneCanvas;
}

function rr(x: number, y: number, w: number, h: number, r: number) {
  o.beginPath();
  o.moveTo(x + r, y); o.arcTo(x + w, y, x + w, y + h, r); o.arcTo(x + w, y + h, x, y + h, r);
  o.arcTo(x, y + h, x, y, r); o.arcTo(x, y, x + w, y, r); o.closePath();
}

// Telugu caption font: rounded and friendly to match the clay characters (?font= to compare others)
const FONT = new URLSearchParams(location.search).get('font') || 'Baloo Tammudu 2';
const TEL = `"${FONT}", "Noto Sans Telugu", "Inter", sans-serif`;
const FW = /Ramabhadra|Mandali/.test(FONT) ? 400 : 800;
const isLatin = (w: string) => /[A-Za-z0-9"“”]/.test(w);

/** Text with Latin (English) words in an accent colour. Returns width. */
function richText(text: string, x: number, y: number, size: number, fg: string, accent: string, align: 'center' | 'left' = 'center', weight = FW, stroke = 0) {
  o.font = `${weight} ${size}px ${TEL}`;
  const words = text.split(' ');
  const space = o.measureText(' ').width;
  const widths = words.map(w => o.measureText(w).width);
  const total = widths.reduce((a, b) => a + b, 0) + space * (words.length - 1);
  let cx = align === 'center' ? x - total / 2 : x;
  o.textAlign = 'left'; o.textBaseline = 'middle';
  words.forEach((w, i) => {
    if (stroke) { o.lineJoin = 'round'; o.lineWidth = stroke; o.strokeStyle = 'rgba(24,14,10,0.92)'; o.strokeText(w, cx, y); }
    o.fillStyle = isLatin(w) ? accent : fg; o.fillText(w, cx, y); cx += widths[i] + space;
  });
  return total;
}

/** Pop-in pill card. age = seconds since it appeared, life = seconds until it leaves. */
function card(text: string, x: number, y: number, age: number, life: number, o2: { size?: number; bg?: string; fg?: string; accent?: string; pad?: number; rot?: number } = {}) {
  if (age < 0 || life < 0) return;
  const size = o2.size ?? 64, pad = o2.pad ?? 0.55;
  const k = backOut(age / 0.28) * (life < 0.2 ? eo(life / 0.2) : 1);
  if (k <= 0.01) return;
  o.save();
  o.translate(x, y); o.rotate((o2.rot ?? 0) * Math.PI / 180); o.scale(k, k);
  o.font = `${FW} ${size}px ${TEL}`;
  const tw = text.split(' ').reduce((a, w) => a + o.measureText(w).width, 0) + o.measureText(' ').width * (text.split(' ').length - 1);
  const w = tw + size * pad * 2, h = size * 1.55;
  o.shadowColor = 'rgba(0,0,0,0.28)'; o.shadowBlur = 30; o.shadowOffsetY = 10;
  rr(-w / 2, -h / 2, w, h, h / 2);
  o.fillStyle = o2.bg ?? CREAM; o.fill();
  o.shadowColor = 'transparent';
  richText(text, 0, size * 0.06, size, o2.fg ?? INK, o2.accent ?? ORANGE);
  o.restore();
}

/** Lower-third captions, 2–4 words per card. */
function captionAt(t: number): { text: string; age: number; life: number; who?: string } | null {
  if (t < CLIP_LEN) {
    for (const l of LINES) {
      if (t < l.start || t > l.start + l.dur + 0.15) continue;
      const words = l.text.split(' ');
      const chunks: string[] = [];
      for (let i = 0; i < words.length; i += 3) chunks.push(words.slice(i, i + 3).join(' '));
      const lens = chunks.map(c => c.length);
      const tot = lens.reduce((a, b) => a + b, 0);
      let acc = l.start;
      for (let i = 0; i < chunks.length; i++) {
        const d = (lens[i] / tot) * l.dur;
        if (t < acc + d || i === chunks.length - 1) return { text: chunks[i], age: t - acc, life: acc + d + 0.15 - t, who: l.who };
        acc += d;
      }
    }
    return null;
  }
  const e = t - E0;
  for (let i = 0; i < S.length; i++) {
    const [a, b] = S[i];
    if (e < a || e > b + 0.12) continue;
    const chunks = CAPS[i];
    const lens = chunks.map(c => Math.max(4, c.length));
    const tot = lens.reduce((x, y) => x + y, 0);
    let acc = a;
    for (let j = 0; j < chunks.length; j++) {
      const d = (lens[j] / tot) * (b - a);
      if (e < acc + d || j === chunks.length - 1) return { text: chunks[j], age: e - acc, life: acc + d + 0.12 - e };
      acc += d;
    }
  }
  return null;
}

/** Captions sit on the chest, below the chin (chin ≈ y 1336 in the wide shot), above Instagram's bottom UI. */
export const CAPTION_Y = 1470;
function drawCaption(t: number) {
  const c = captionAt(t);
  if (!c) return;
  const k = eo(c.age / 0.14) * (c.life < 0.1 ? cl(c.life / 0.1) : 1);
  const pop = 0.92 + 0.08 * backOut(c.age / 0.2);
  o.save();
  o.globalAlpha = k;
  o.translate(540, CAPTION_Y);
  o.scale(pop, pop);
  let size = 68;
  o.font = `${FW} ${size}px ${TEL}`;
  const measure = () => { const ws = c.text.split(' '); return ws.reduce((a, w) => a + o.measureText(w).width, 0) + o.measureText(' ').width * (ws.length - 1); };
  let tw = measure();
  while (tw > 900 && size > 44) { size -= 2; o.font = `${FW} ${size}px ${TEL}`; tw = measure(); }
  // soft dark glow behind the words, no hard box
  o.shadowColor = 'rgba(0,0,0,0.55)'; o.shadowBlur = 26; o.shadowOffsetY = 4;
  richText(c.text, 0, 0, size, '#ffffff', '#FFD166', 'center', FW, size * 0.2);
  o.shadowColor = 'transparent';
  richText(c.text, 0, 0, size, '#ffffff', '#FFD166', 'center', FW, 0);
  if (c.who) {
    const tag = c.who === 'ashok' ? 'Ashok' : 'Claude';
    o.font = `800 28px Inter, sans-serif`;
    const tw2 = o.measureText(tag).width + 30;
    rr(-tw2 / 2, -size * 0.95 - 30, tw2, 40, 20);
    o.fillStyle = c.who === 'ashok' ? GREEN : ORANGE; o.fill();
    o.fillStyle = '#fff'; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText(tag, 0, -size * 0.95 - 10);
  }
  o.restore();
}

// ------------------------------------------------------------------ explainer graphics

const CODE = rendererSrc.split('\n').slice(
  Math.max(0, rendererSrc.split('\n').findIndex(l => l.includes('function rowShift'))), undefined,
).slice(0, 40);

function codeRain(t: number, a: number, alpha: number) {
  o.save();
  o.globalAlpha = alpha;
  o.fillStyle = 'rgba(16,12,10,0.82)'; o.fillRect(0, 0, W, H);
  o.font = '500 30px "JetBrains Mono", monospace';
  o.textAlign = 'left'; o.textBaseline = 'top';
  const shown = Math.floor((t - a) * 60); // characters typed per... line reveal speed
  let y = 300 - Math.max(0, (t - a) * 90);
  let budget = shown * 6;
  for (const line of CODE) {
    const txt = line.replace(/\t/g, '  ').slice(0, 52);
    const n = Math.max(0, Math.min(txt.length, budget));
    budget -= txt.length;
    o.fillStyle = /function|const|return|let|for|if/.test(txt) ? ORANGE2 : '#f3e9df';
    o.fillText(txt.slice(0, n), 70, y);
    y += 44;
    if (budget <= 0) break;
  }
  o.restore();
}

function browserWindow(img: CanvasImageSource | undefined, cx: number, cy: number, w: number, age: number) {
  const k = backOut(age / 0.35);
  const h = w * 9 / 16 + 64;
  o.save();
  o.translate(cx, cy); o.scale(k, k);
  o.shadowColor = 'rgba(0,0,0,0.45)'; o.shadowBlur = 60; o.shadowOffsetY = 24;
  rr(-w / 2, -h / 2, w, h, 26); o.fillStyle = '#f3efe9'; o.fill();
  o.shadowColor = 'transparent';
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { o.beginPath(); o.arc(-w / 2 + 40 + i * 32, -h / 2 + 32, 10, 0, Math.PI * 2); o.fillStyle = c; o.fill(); });
  rr(-w / 2 + 150, -h / 2 + 14, w - 190, 36, 18); o.fillStyle = '#fff'; o.fill();
  o.font = `600 22px Inter, sans-serif`; o.fillStyle = '#6b625b'; o.textAlign = 'left'; o.textBaseline = 'middle';
  o.fillText('🔒  CineGenius  ·  Cel Stand  —  runs in your browser', -w / 2 + 172, -h / 2 + 33);
  o.save(); rr(-w / 2 + 10, -h / 2 + 64, w - 20, h - 74, 16); o.clip();
  if (img) o.drawImage(img, -w / 2 + 10, -h / 2 + 64, w - 20, h - 74);
  o.restore();
  o.restore();
}

function chip(label: string, sub: string, x: number, y: number, age: number, color = ORANGE) {
  if (age < 0) return;
  const k = backOut(age / 0.3);
  o.save(); o.translate(x, y); o.scale(k, k);
  o.font = `900 58px Inter, sans-serif`;
  const w = Math.max(560, o.measureText(label).width + 140), h = 120;
  o.shadowColor = 'rgba(0,0,0,0.35)'; o.shadowBlur = 30; o.shadowOffsetY = 10;
  rr(-w / 2, -h / 2, w, h, 30); o.fillStyle = CREAM; o.fill();
  o.shadowColor = 'transparent';
  rr(-w / 2, -h / 2, 22, h, 11); o.fillStyle = color; o.fill();
  o.fillStyle = INK; o.textAlign = 'left'; o.textBaseline = 'middle';
  o.fillText(label, -w / 2 + 52, -10);
  o.font = `700 28px ${TEL}`; o.fillStyle = '#7a6f67';
  o.fillText(sub, -w / 2 + 54, 34);
  o.restore();
}

/** Pose × mouth table for one character, drawn like the editor's. */
function poseTable(s: Scene, ch: CharacterLayer, t: number, x: number, y: number, cellW: number, age: number) {
  const k = eo(age / 0.3);
  if (k <= 0) return;
  const cur = drawingAt(s, ch, t);
  const cellH = cellW * 273 / 337;
  const fb = ch.faceBox!;
  o.save(); o.globalAlpha = k;
  const totalW = 150 + MOUTH_SLOTS.length * (cellW + 12);
  rr(x - 24, y - 70, totalW + 30, 90 + ch.poses.length * (cellH + 12), 28);
  o.fillStyle = 'rgba(22,18,16,0.86)'; o.fill();
  o.font = `700 26px ${TEL}`; o.fillStyle = '#d8cfc7'; o.textAlign = 'center'; o.textBaseline = 'middle';
  MOUTH_SLOTS.forEach((m, i) => o.fillText(m.jp, x + 150 + i * (cellW + 12) + cellW / 2, y - 34));
  ch.poses.forEach((p, r) => {
    const yy = y + r * (cellH + 12);
    o.font = `800 28px Inter, sans-serif`; o.fillStyle = cur.pose?.id === p.id ? ORANGE2 : '#d8cfc7'; o.textAlign = 'right';
    o.fillText(p.name, x + 136, yy + cellH / 2);
    MOUTH_SLOTS.forEach((m, i) => {
      const xx = x + 150 + i * (cellW + 12);
      const d: Drawing = { frame: 0, pose: p, slot: m.id, level: slotLevel(m.id), blinking: m.id === 'blink', source: 'edit' };
      const { base: b, overlays } = drawingLayers(ch, d);
      o.save(); rr(xx, yy, cellW, cellH, 12); o.clip();
      o.fillStyle = '#f3e9de'; o.fillRect(xx, yy, cellW, cellH);
      for (const src of [b, ...overlays]) { const im = getImage(src); if (im) o.drawImage(im, fb[0], fb[1], fb[2], fb[3], xx, yy, cellW, cellH); }
      o.restore();
      const on = cur.pose?.id === p.id && cur.slot === m.id;
      if (on) { o.lineWidth = 7; o.strokeStyle = '#f5b83d'; rr(xx - 2, yy - 2, cellW + 4, cellH + 4, 14); o.stroke(); }
    });
  });
  o.restore();
}

function waveform(src: string, t0: number, dur: number, t: number, x: number, y: number, w: number, h: number) {
  const env = getEnvelope(src);
  if (!env) return;
  const n = 90;
  o.save();
  rr(x - 20, y - h / 2 - 20, w + 40, h + 40, 24); o.fillStyle = 'rgba(22,18,16,0.82)'; o.fill();
  for (let i = 0; i < n; i++) {
    const idx = Math.floor((i / n) * env.length);
    let v = 0; for (let k = 0; k < env.length / n; k++) v = Math.max(v, env[Math.min(env.length - 1, idx + k)] ?? 0);
    const bh = Math.max(4, v * h);
    const played = (i / n) * dur <= t - t0;
    o.fillStyle = played ? ORANGE : '#6a5f58';
    rr(x + i * (w / n), y - bh / 2, w / n - 4, bh, 3); o.fill();
  }
  const px = x + cl((t - t0) / dur) * w;
  o.fillStyle = '#fff'; o.fillRect(px - 2, y - h / 2 - 8, 4, h + 16);
  o.restore();
}

function terminal(age: number, cx: number, cy: number) {
  const k = backOut(age / 0.35);
  const w = 980, h = 560;
  o.save(); o.translate(cx, cy); o.scale(k, k);
  o.shadowColor = 'rgba(0,0,0,0.5)'; o.shadowBlur = 50; o.shadowOffsetY = 20;
  rr(-w / 2, -h / 2, w, h, 28); o.fillStyle = '#1b1714'; o.fill();
  o.shadowColor = 'transparent';
  ['#ff5f57', '#febc2e', '#28c840'].forEach((c, i) => { o.beginPath(); o.arc(-w / 2 + 40 + i * 30, -h / 2 + 34, 9, 0, Math.PI * 2); o.fillStyle = c; o.fill(); });
  o.font = '600 22px Inter, sans-serif'; o.fillStyle = '#9b8f86'; o.textAlign = 'center'; o.fillText('Claude Code', 0, -h / 2 + 35);
  const lines: [string, string][] = [
    ['> ', 'build a cel stand for anime scenes'],
    ['✻ ', 'Writing renderer.ts · lipsync.ts · sheet.ts'],
    ['✻ ', 'Drawing water ripples, cloud drift, 3D layers'],
    ['✓ ', 'Exporting MP4 with WebCodecs'],
    ['✓ ', 'Tested in Chromium · no errors'],
  ];
  o.textAlign = 'left'; o.textBaseline = 'top';
  let budget = Math.floor(age * 120);
  lines.forEach(([p, txt], i) => {
    const n = Math.max(0, Math.min(txt.length, budget)); budget -= txt.length + 6;
    if (n <= 0 && budget < 0) return;
    o.font = '700 36px "JetBrains Mono", monospace';
    o.fillStyle = p.startsWith('✓') ? '#7ed492' : p.startsWith('✻') ? ORANGE2 : '#ffffff';
    o.fillText(p, -w / 2 + 44, -h / 2 + 90 + i * 76);
    o.fillStyle = '#efe6dd'; o.font = '500 31px "JetBrains Mono", monospace';
    o.fillText(txt.slice(0, n), -w / 2 + 92, -h / 2 + 92 + i * 76);
  });
  o.restore();
}

function progressBar(age: number, cx: number, cy: number) {
  const k = eo(age / 0.3);
  const p = eo(cl((age - 0.4) / 2.4));
  o.save(); o.globalAlpha = k;
  rr(cx - 420, cy - 110, 840, 220, 30); o.fillStyle = 'rgba(22,18,16,0.86)'; o.fill();
  o.font = `800 40px Inter, sans-serif`; o.fillStyle = '#fff'; o.textAlign = 'left'; o.textBaseline = 'middle';
  o.fillText(p < 1 ? 'Rendering MP4…' : 'reel.mp4 ✓', cx - 380, cy - 48);
  o.textAlign = 'right'; o.fillStyle = ORANGE2;
  o.fillText(`${Math.round(p * 489)} / 489 frames`, cx + 380, cy - 48);
  rr(cx - 380, cy + 10, 760, 34, 17); o.fillStyle = '#3d3531'; o.fill();
  rr(cx - 380, cy + 10, 760 * p, 34, 17); o.fillStyle = ORANGE; o.fill();
  o.font = `600 26px Inter, sans-serif`; o.fillStyle = '#b9ada4'; o.textAlign = 'left';
  o.fillText('H.264 · 1080×1920 · 30 fps · in the browser', cx - 380, cy + 78);
  o.restore();
}

function cursor(x: number, y: number, down: boolean) {
  o.save(); o.translate(x, y); if (down) o.scale(0.88, 0.88);
  o.beginPath(); o.moveTo(0, 0); o.lineTo(0, 64); o.lineTo(16, 50); o.lineTo(28, 76); o.lineTo(40, 70); o.lineTo(28, 46); o.lineTo(48, 46); o.closePath();
  o.fillStyle = '#fff'; o.fill(); o.lineWidth = 4; o.strokeStyle = INK; o.stroke();
  o.restore();
}

function toggle(x: number, y: number, sea: boolean, age: number) {
  const k = backOut(age / 0.3);
  o.save(); o.translate(x, y); o.scale(k, k);
  rr(-260, -60, 520, 120, 60); o.fillStyle = 'rgba(22,18,16,0.86)'; o.fill();
  rr(sea ? 4 : -256, -52, 252, 104, 52); o.fillStyle = sea ? '#3a86d6' : '#5aa24a'; o.fill();
  o.font = `800 46px ${TEL}`; o.textAlign = 'center'; o.textBaseline = 'middle';
  o.fillStyle = '#fff'; o.fillText('🏞 River', -130, 2); o.fillText('🌊 Sea', 130, 2);
  o.restore();
}

function commentBubble(age: number) {
  const k = backOut(age / 0.35);
  o.save(); o.translate(540, 620); o.scale(k, k);
  o.shadowColor = 'rgba(0,0,0,0.35)'; o.shadowBlur = 40; o.shadowOffsetY = 14;
  rr(-430, -150, 860, 300, 48); o.fillStyle = CREAM; o.fill();
  o.beginPath(); o.moveTo(-120, 148); o.lineTo(-40, 148); o.lineTo(-150, 230); o.closePath(); o.fill();
  o.shadowColor = 'transparent';
  o.font = `800 44px ${TEL}`; o.fillStyle = '#7a6f67'; o.textAlign = 'center'; o.textBaseline = 'middle';
  o.fillText('Comment చేయండి 👇', 0, -80);
  const word = 'ANIME';
  const n = Math.min(word.length, Math.floor(Math.max(0, age - 0.4) * 7));
  o.font = `900 150px Inter, sans-serif`; o.fillStyle = ORANGE;
  o.fillText(`“${word.slice(0, n)}${n < word.length && Math.floor(age * 4) % 2 ? '|' : ''}”`, 0, 40);
  o.restore();
  if (age > 1.3) card('Tools list + steps → మీ DM 📩', 540, 905, age - 1.3, 99, { size: 42 });
}

// ------------------------------------------------------------------ frame

const editorShot = new Image();
editorShot.src = new URL('./assets/editor.webp', import.meta.url).href;
const claudeHappy = new URL('./assets/claude_happy_open.webp', import.meta.url).href;

/** Zoom into the finished frame around (cx, cy), like a camera close-up on the printed picture. */
function zoomed(ctx: CanvasRenderingContext2D, img: CanvasImageSource, cx: number, cy: number, z: number) {
  cx = cl(cx, W / (2 * z), W - W / (2 * z)); cy = cl(cy, H / (2 * z), H - H / (2 * z));
  ctx.save();
  ctx.translate(W / 2, H / 2); ctx.scale(z, z); ctx.translate(-cx, -cy);
  ctx.drawImage(img, 0, 0);
  ctx.restore();
}

function drawBg(img: CanvasImageSource, opts: { blur?: number; dim?: number; scale?: number } = {}) {
  g.save();
  if (opts.blur) g.filter = `blur(${opts.blur}px)`;
  const s = opts.scale ?? 1;
  g.drawImage(img, (W - W * s) / 2, (H - H * s) / 2, W * s, H * s);
  g.filter = 'none';
  if (opts.dim) { g.fillStyle = `rgba(10,8,6,${opts.dim})`; g.fillRect(0, 0, W, H); }
  g.restore();
}

const BD_SCENE = variant({ bg: 'river', noFx: true, only: ['sky', 'clouds', 'river', 'ashok', 'claude'] });
const SEA = variant({ bg: 'sea' });
const RIVER = variant({ bg: 'river' });

function frame(t: number) {
  g.setTransform(1, 0, 0, 1, 0, 0);
  o.setTransform(1, 0, 0, 1, 0, 0);
  o.clearRect(0, 0, W, H);
  let k3d = 0, focus: Set<string> | undefined, intro: number | null = null, bdT = 0;
  const e = t - E0;

  if (CLIP_ONLY) {
    g.drawImage(sceneAt(base, Math.min(t, CLIP_LEN - 0.001)), 0, 0);
    drawCaption(Math.min(t, CLIP_LEN - 0.001));
    breakdown.draw(BD_SCENE, 0, 0, null);
    return;
  }
  if (t < CLIP_LEN) {
    // ---------------- A: the clip itself
    g.drawImage(sceneAt(base, t), 0, 0);
    card('ఇది AI video కాదు 👀', 540, 330, t - 0.15, 3.4 - t, { size: 70 });
    if (t > 13.4 && t < 15.8) card('1 click ✨', 540, 330, t - 13.5, 15.8 - t, { size: 60 });
  } else if (t < E0) {
    g.drawImage(sceneAt(base, CLIP_LEN - 0.01), 0, 0);
  } else if (e < S[1][0]) {
    // ---------------- B: rewind, then replay with a frame counter
    const rw = prog(e, 0, 1.5);
    const ct = rw < 1 ? lerp(CLIP_LEN, 0, eio(rw)) : (e - 1.5) * 1.2;
    g.drawImage(sceneAt(base, ct), 0, 0);
    if (rw < 1) {
      g.fillStyle = 'rgba(40,10,0,0.18)'; g.fillRect(0, 0, W, H);
      for (let y = (e * 900) % 40; y < H; y += 40) { g.fillStyle = 'rgba(255,255,255,0.06)'; g.fillRect(0, y, W, 3); }
      card('⏪', 540, 960, e, 1.5 - e, { size: 120, bg: 'rgba(255,248,240,0.9)' });
    } else {
      const fnum = Math.floor(ct * 30);
      o.save(); rr(60, 250, 430, 86, 22); o.fillStyle = 'rgba(22,18,16,0.8)'; o.fill();
      o.font = '700 42px "JetBrains Mono", monospace'; o.fillStyle = '#fff'; o.textBaseline = 'middle'; o.textAlign = 'left';
      o.fillText(`frame ${String(fnum).padStart(3, '0')}`, 90, 294); o.restore();
      card('0 AI video frames', 540, 480, e - 1.7, S[1][0] - e, { size: 64 });
    }
  } else if (e < S[3][0]) {
    // ---------------- C + D: it's all code → a web app
    g.drawImage(sceneAt(base, 3 + (e - S[1][0])), 0, 0);
    if (e < S[2][0]) {
      codeRain(t, at(1), eo(prog(e, S[1][0], S[1][0] + 0.25)));
      card('మొత్తం code 💻', 540, 940, e - S[1][0] - 0.1, S[2][0] - e, { size: 72 });
    } else {
      drawBg(sceneCanvas, { blur: 14, dim: 0.45 });
      browserWindow(editorShot.complete ? editorShot : undefined, 540, 760, 1000, e - S[2][0]);
      card('Web app · browser లో', 540, 1160, e - S[2][0] - 0.2, S[3][0] - e, { size: 60 });
    }
  } else if (e < S[4][0]) {
    // ---------------- E: the canvas paints the frame, layer by layer
    const order = ['sky', 'clouds', 'river', 'ashok', 'claude', 'motes'];
    const a = S[3][0];
    const n = Math.min(order.length, Math.floor((e - a) / 0.55) + 1);
    const s = variant({ bg: 'river', only: order.slice(0, n) });
    const sc = { ...s, look: n >= order.length && e - a > 3.5 ? base.look : undefined };
    g.fillStyle = '#0d0b0a'; g.fillRect(0, 0, W, H);
    g.drawImage(sceneAt(sc, 2 + (e - a)), 0, 0);
    const calls = ['ctx.drawImage(sky)', 'ctx.drawImage(clouds, x - t·16)', 'drawRippled(river, t)', 'drawCharacter(ashok, frame)', 'drawCharacter(claude, frame)', 'drawFx(sparkles, t)'];
    o.save();
    calls.slice(0, n).forEach((c, i) => {
      const age = e - a - i * 0.55;
      const k = eo(age / 0.2);
      o.globalAlpha = k;
      rr(60, 320 + i * 78, 640, 62, 16); o.fillStyle = 'rgba(22,18,16,0.82)'; o.fill();
      o.font = '600 30px "JetBrains Mono", monospace'; o.fillStyle = i === n - 1 ? ORANGE2 : '#efe6dd'; o.textAlign = 'left'; o.textBaseline = 'middle';
      o.fillText(c, 84, 351 + i * 78);
    });
    o.restore();
    card('🎨 HTML canvas', 260, 250, e - a - 0.1, S[4][0] - e, { size: 44 });
  } else if (e < S[9][0]) {
    // ---------------- F + G: 3D layers, spotlighting each as it's named
    g.fillStyle = '#0d0b0a'; g.fillRect(0, 0, W, H);
    k3d = 1; bdT = 4 + (e - S[4][0]);
    if (e < S[5][0]) intro = (e - S[4][0]) * 0.9;
    focus = e >= S[8][0] ? new Set(['ashok', 'claude']) : e >= S[7][0] ? new Set(['river']) : e >= S[6][0] ? new Set(['clouds']) : e >= S[5][0] ? new Set(['sky']) : undefined;
    card('Layer by layer 🎞', 540, 330, e - S[4][0] - 0.3, S[5][0] - e, { size: 66 });
  } else if (e < S[11][0]) {
    // ---------------- H: motion is code: clouds, then water
    const a = S[9][0];
    const onWater = e >= S[9][0] + 1.0;
    const p = eo(prog(e, onWater ? a + 1.0 : a, (onWater ? a + 1.0 : a) + 0.5));
    const target = onWater ? { x: 800, y: 1120, z: 2.1 } : { x: 330, y: 520, z: 2.0 };
    const from = onWater ? { x: 330, y: 520, z: 2.0 } : { x: 540, y: 960, z: 1 };
    const zx = lerp(from.x, target.x, p), zy = lerp(from.y, target.y, p), zz = lerp(from.z, target.z, p);
    const s = variant({ bg: 'river' });
    const ct = onWater ? 4 + (e - a) : 4 + (e - a) * 4; // clouds fast-forwarded so the drift reads
    zoomed(g, sceneAt(s, ct), zx, zy, zz);
    if (onWater && e > a + 1.4) {
      // flash the water mask so you can see exactly what moves: render the mask as a layer, tinted cyan
      const rv = byId('river') as any;
      const ms: Scene = { ...s, look: undefined, layers: [{ ...rv, src: rv.ripple.maskSrc, ripple: { ...rv.ripple, enabled: false }, showUntil: undefined }] };
      mg.setTransform(1, 0, 0, 1, 0, 0); mg.clearRect(0, 0, W, H);
      mg.globalCompositeOperation = 'source-over';
      renderFrame(mg, { ...ms, background: 'rgba(0,0,0,0)' }, ct, {});
      mg.globalCompositeOperation = 'source-in'; mg.fillStyle = '#39d0ff'; mg.fillRect(0, 0, W, H);
      // the characters stand in front of the water: cut them out of the highlight
      chg.setTransform(1, 0, 0, 1, 0, 0); chg.clearRect(0, 0, W, H);
      renderFrame(chg, { ...variant({ bg: 'river', only: ['ashok', 'claude'], noFx: true }), look: undefined, background: 'rgba(0,0,0,0)' }, ct, {});
      mg.globalCompositeOperation = 'destination-out'; mg.drawImage(charCanvas, 0, 0);
      mg.globalCompositeOperation = 'source-over';
      o.save(); o.globalAlpha = 0.28 + 0.16 * Math.sin(e * 7); zoomed(o, maskCanvas, zx, zy, zz); o.restore();
      card('Water mask · 水面', 540, 600, e - a - 1.4, S[11][0] - e, { size: 46, bg: '#39d0ff', fg: '#06233a', accent: '#06233a' });
    }
    const snippet = onWater ? 'x += amp · sin(y / wave + t)' : 'cloud.x = start − 16 · t';
    o.save(); rr(80, 280, 920, 90, 24); o.fillStyle = 'rgba(22,18,16,0.86)'; o.fill();
    o.font = '700 40px "JetBrains Mono", monospace'; o.fillStyle = ORANGE2; o.textAlign = 'center'; o.textBaseline = 'middle';
    o.fillText(snippet, 540, 326); o.restore();
    card('Motion = code ✨', 540, 470, e - S[10][0], S[11][0] - e, { size: 60 });
  } else if (e < S[13][0]) {
    // ---------------- I: voice → lip-sync, 12 drawings a second
    const a = S[11][0];
    const ct = LINES[0].start + ((e - a) % LINES[0].dur);
    zoomed(g, sceneAt(variant({ bg: 'river' }), ct), 470, 1125, 1.6);
    g.fillStyle = 'rgba(10,8,6,0.25)'; g.fillRect(0, 0, W, H);
    waveform(base.audio[0].src, LINES[0].start, LINES[0].dur, ct, 120, 310, 840, 100);
    poseTable(base, byId('ashok') as CharacterLayer, ct, 150, 520, 150, e - a - 0.3);
    card('12 నోరు మార్పులు / second', 540, 430, e - S[12][0] - 0.3, S[13][0] - e, { size: 44 });
  } else if (e < S[16][0]) {
    // ---------------- J: one click, river → sea, no re-generation
    const clickAt = S[15][0];
    const isSea = e >= clickAt;
    const s = isSea ? SEA : RIVER;
    g.drawImage(sceneAt(s, 6 + (e - S[13][0])), 0, 0);
    if (isSea && e < clickAt + 0.9) {
      drawFx(o, { ...(byId('lines') as any), start: clickAt, end: clickAt + 0.9 }, e, W, H);
      o.fillStyle = `rgba(255,255,255,${0.5 * (1 - prog(e, clickAt, clickAt + 0.25))})`; o.fillRect(0, 0, W, H);
    }
    toggle(540, 560, isSea, e - S[13][0]);
    const cx = lerp(820, 670, eo(prog(e, S[14][0], clickAt - 0.1)));
    const cy = lerp(900, 590, eo(prog(e, S[14][0], clickAt - 0.1)));
    cursor(cx, cy, Math.abs(e - clickAt) < 0.12);
    if (e > S[14][0]) card('Re-generate ❌', 540, 330, e - S[14][0], clickAt - e, { size: 60 });
    if (isSea) card('1 click ✓', 540, 330, e - clickAt, S[16][0] - e, { size: 66 });
  } else if (e < S[17][0]) {
    // ---------------- K: built with Claude Code
    drawBg(sceneAt(SEA, 8 + (e - S[16][0])), { blur: 16, dim: 0.5 });
    terminal(e - S[16][0], 540, 700);
    const ci = getImage(claudeHappy);
    if (ci) {
      const age = e - S[16][0] - 0.2, k = backOut(age / 0.4);
      if (age > 0) { o.save(); o.translate(830, 1030 + Math.sin(e * 3) * 12); o.scale(k, k); o.drawImage(ci, -150, -150, 300, 300); o.restore(); }
    }
    card('Built with Claude Code', 540, 330, e - S[16][0] - 0.1, S[17][0] - e, { size: 60 });
  } else if (e < S[19][0]) {
    // ---------------- L + M: the tools, then MP4 export
    drawBg(sceneAt(SEA, 9 + (e - S[16][0])), { blur: 18, dim: 0.55 });
    const a = S[17][0];
    if (e < S[18][0]) {
      const tools: [string, string][] = [['React', 'editor screens'], ['TypeScript', 'all the code'], ['HTML Canvas', 'ప్రతి frame గీస్తుంది'], ['Web Audio', 'voice → lip-sync']];
      tools.forEach(([l, s2], i) => chip(l, s2, 540, 430 + i * 150, e - a - i * 0.78));
    } else {
      chip('WebCodecs', 'browser లోనే video encode', 540, 430, e - S[18][0]);
      chip('mp4-muxer', 'frames → .mp4 file', 540, 580, e - S[18][0] - 0.5);
      progressBar(e - S[18][0] - 0.9, 540, 900);
    }
  } else if (e < S[20][0]) {
    // ---------------- N: call to action
    g.drawImage(sceneAt(SEA, 14.5 + ((e - S[19][0]) % 1.8)), 0, 0);
    g.fillStyle = 'rgba(10,8,6,0.3)'; g.fillRect(0, 0, W, H);
    commentBubble(e - S[19][0]);
  } else {
    // ---------------- O: back to the opening shot (loops into the start)
    g.drawImage(sceneAt(base, Math.max(0, (e - S[20][0]) * 0.6)), 0, 0);
    card('AI video ❌', 540, 330, e - S[20][0], 99, { size: 72 });
    if (e > S[21][0]) card('Code ✓', 540, 470, e - S[21][0], 99, { size: 72, accent: ORANGE });
  }

  breakdown.draw(BD_SCENE, bdT, k3d, intro, focus);
  drawCaption(t);
}

// ------------------------------------------------------------------ audio cue sheet (for the mixer)
export const CUES: { file: string; at: number; gain: number }[] = [
  ...base.audio.map(c => ({ file: c.src.split('/').pop()!, at: c.start, gain: c.gain, until: c.until })),
  { file: 'explainer_vo.wav', at: E0, gain: 1 },
  { file: 'sfx_pop.wav', at: 0.15, gain: 0.5 },
  { file: 'sfx_rewind.wav', at: E0, gain: 0.7 },
  { file: 'sfx_pop.wav', at: E0 + 1.7, gain: 0.45 },
  { file: 'sfx_typing.wav', at: at(1), gain: 0.5 },
  { file: 'sfx_whoosh.wav', at: at(2) - 0.15, gain: 0.45 },
  ...[0, 1, 2, 3, 4, 5].map(i => ({ file: 'sfx_click.wav', at: at(3) + i * 0.55, gain: 0.35 })),
  { file: 'sfx_whoosh.wav', at: at(4) - 0.1, gain: 0.5 },
  ...[5, 6, 7, 8].map(i => ({ file: 'sfx_pop_lo.wav', at: at(i), gain: 0.4 })),
  { file: 'sfx_whoosh.wav', at: at(9) - 0.1, gain: 0.4 },
  { file: 'sfx_pop.wav', at: at(12) + 0.3, gain: 0.4 },
  { file: 'sfx_click.wav', at: at(15), gain: 0.8 },
  { file: 'sfx_whoosh.wav', at: at(15) - 0.2, gain: 0.6 },
  { file: 'sfx_shimmer.wav', at: at(15) + 0.05, gain: 0.5 },
  { file: 'sfx_typing.wav', at: at(16) + 0.2, gain: 0.45 },
  ...[0, 1, 2, 3].map(i => ({ file: 'sfx_pop.wav', at: at(17) + i * 0.78, gain: 0.4 })),
  { file: 'sfx_pop.wav', at: at(18), gain: 0.4 },
  { file: 'sfx_shimmer.wav', at: at(19) + 0.3, gain: 0.5 },
  { file: 'sfx_pop.wav', at: at(20), gain: 0.5 },
  { file: 'sfx_pop.wav', at: at(21), gain: 0.5 },
];

// ------------------------------------------------------------------ boot

async function boot() {
  await Promise.all([
    ...base.layers.flatMap(l => l.kind === 'image' ? [l.src, l.ripple.maskSrc].filter(Boolean) as string[]
      : l.kind === 'character' ? l.poses.flatMap(p => [p.src, ...Object.values(p.variants ?? {})]) : []).map(s => loadImage(s)),
    loadImage(claudeHappy),
    new Promise(r => { if (editorShot.complete) r(0); editorShot.onload = () => r(0); editorShot.onerror = () => r(0); }),
  ]);
  // decode the voice lines so lip-sync can read their loudness
  for (const c of base.audio) if (c.role === 'voice') await decodeAudio(c.src);
  const allText = [...CAPS.flat(), ...LINES.map(l => l.text), 'ఇది AI video కాదు 👀 మొత్తం code నోరు మార్పులు బ్రౌజర్ లో ఒక్క click మీ DM కి పంపిస్తా చేయండి కావాలంటే అని రాయండి'].join(' ');
  for (const fam of [FONT, 'Noto Sans Telugu']) for (const wt of [400, 600, 700, 800]) await document.fonts.load(`${wt} 60px "${fam}"`, allText).catch(() => null);
  // draw every caption once off-screen so glyph caches are warm before frame 0
  o.font = `${FW} 60px ${TEL}`; for (const c of CAPS.flat()) o.measureText(c);
  await document.fonts.load(`900 60px Inter`);
  await document.fonts.load(`700 30px "JetBrains Mono"`);
  await document.fonts.ready;
  (window as any).__duration = CLIP_ONLY ? CLIP_LEN : DURATION;
  (window as any).__cues = CUES;
  (window as any).__scene = base;
  (window as any).__seek = (t: number) => { frame(t); return true; };
  (window as any).__ready = true;
  const q = new URLSearchParams(location.search);
  if (q.has('t')) frame(parseFloat(q.get('t')!));
  else if (!q.has('still')) {
    // live preview loop
    const t0 = performance.now();
    const loop = () => { frame(((performance.now() - t0) / 1000) % DURATION); requestAnimationFrame(loop); };
    loop();
  }
}
boot();
void ENV_RATE;
