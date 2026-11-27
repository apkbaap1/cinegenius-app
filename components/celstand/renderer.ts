// Draws one frame of a scene at time t. Used by the live editor and the exporter,
// so what you see in the editor is exactly what gets rendered.

import { ASPECTS, CameraKey, CharacterLayer, ImageLayer, Layer, Pose, Scene, lookOf, shownAt } from './types';
import { drawFx } from './fx';
import { applyLook, letterboxBar } from './look';
import { getHueShifted, getImage, getTinted } from './assets';
import { drawingAt, drawingLayers } from './sheet';

export const stageSize = (scene: Scene) => ASPECTS[scene.aspect];

const ease = (x: number) => x * x * (3 - 2 * x);

export function cameraAt(scene: Scene, t: number): { x: number; y: number; zoom: number } {
  const keys = [...scene.camera].sort((a, b) => a.t - b.t);
  if (!keys.length) return { x: 0, y: 0, zoom: 1 };
  if (t <= keys[0].t) return keys[0];
  const last = keys[keys.length - 1];
  if (t >= last.t) return last;
  let a: CameraKey = keys[0], b: CameraKey = last;
  for (let i = 0; i < keys.length - 1; i++) {
    if (t >= keys[i].t && t <= keys[i + 1].t) { a = keys[i]; b = keys[i + 1]; break; }
  }
  const k = ease((t - a.t) / Math.max(1e-6, b.t - a.t));
  return { x: a.x + (b.x - a.x) * k, y: a.y + (b.y - a.y) * k, zoom: a.zoom + (b.zoom - a.zoom) * k };
}

/** Stage point → layer space (where layer.x/.y live). */
export function stageToLayer(scene: Scene, t: number, layer: Layer, sx: number, sy: number) {
  const { w, h } = stageSize(scene);
  const cam = cameraAt(scene, t);
  return {
    x: (sx - w / 2) / cam.zoom + w / 2 + cam.x * layer.parallax,
    y: (sy - h / 2) / cam.zoom + h / 2 + cam.y * layer.parallax,
  };
}

function applyCamera(g: CanvasRenderingContext2D, scene: Scene, t: number, layer: Layer) {
  const { w, h } = stageSize(scene);
  const cam = cameraAt(scene, t);
  g.translate(w / 2, h / 2);
  g.scale(cam.zoom, cam.zoom);
  g.translate(-w / 2 - cam.x * layer.parallax, -h / 2 - cam.y * layer.parallax);
}

export function poseAt(ch: CharacterLayer, t: number): Pose | undefined {
  const pinned = ch.pinnedPoseId && ch.poses.find(p => p.id === ch.pinnedPoseId);
  if (pinned) return pinned;
  let poseId = ch.defaultPoseId;
  let bestT = -Infinity;
  for (const c of ch.poseCues) if (c.t <= t && c.t >= bestT) { bestT = c.t; poseId = c.poseId; }
  return ch.poses.find(p => p.id === poseId) || ch.poses[0];
}

/** Size of a layer's artwork in layer space (before camera). */
export function layerBox(layer: Layer): { w: number; h: number } | null {
  if (layer.kind === 'fx') return null;
  const src = layer.kind === 'image' ? layer.src : layer.poses[0]?.src;
  const img = getImage(src);
  if (!img) return null;
  return { w: img.naturalWidth * layer.scale, h: img.naturalHeight * layer.scale };
}

// --- image layers ---------------------------------------------------------

const ripplePool = new Map<string, HTMLCanvasElement>();
function rippleCanvas(key: string, w: number, h: number) {
  let c = ripplePool.get(key);
  if (!c) { c = document.createElement('canvas'); ripplePool.set(key, c); }
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
}

/** Offset in image px for row y of the ripple band. */
function rowShift(r: ImageLayer['ripple'], y: number, top: number, bot: number, phase: number) {
  const depth = (y - top) / Math.max(1, bot - top); // stronger near the viewer
  const wl = r.wavelength * (0.5 + depth);
  return r.amplitude * (0.35 + 0.65 * depth) *
    (Math.sin(y / wl * Math.PI * 2 + phase) * 0.7 + Math.sin(y / (wl * 0.37) * Math.PI * 2 - phase * 1.7) * 0.3);
}

/**
 * Water: rows of the band slide sideways. With a mask, the rippled rows are cut to the
 * mask so only water moves (poles, boats, people standing in front stay still).
 * A shore band can also wash up and down.
 */
function drawRippled(g: CanvasRenderingContext2D, img: HTMLImageElement, L: ImageLayer, t: number, dx: number, dy: number, dw: number, dh: number) {
  const iw = img.naturalWidth, ih = img.naturalHeight;
  const r = L.ripple;
  if (!r.enabled) { g.drawImage(img, dx, dy, dw, dh); return; }
  const top = Math.max(0, Math.min(ih, Math.round(r.top * ih)));
  const bot = Math.max(top, Math.min(ih, Math.round(r.bottom * ih)));
  const phase = t * r.speed * Math.PI * 2;
  const mask = r.maskSrc ? getImage(r.maskSrc) : undefined;
  const shoreAmt = r.shoreAmount ?? 0;
  const sTop = Math.round((r.shoreTop ?? 0) * ih), sBot = Math.round((r.shoreBottom ?? 0) * ih);
  const shore = shoreAmt > 0 && sBot > sTop;

  if (!mask && !shore) {
    const sy = dh / ih, sx = dw / iw;
    if (top > 0) g.drawImage(img, 0, 0, iw, top, dx, dy, dw, top * sy);
    if (bot < ih) g.drawImage(img, 0, bot, iw, ih - bot, dx, dy + bot * sy, dw, (ih - bot) * sy);
    for (let y = top; y < bot; y += 2) {
      const hgt = Math.min(2, bot - y);
      g.drawImage(img, 0, y, iw, hgt, dx + rowShift(r, y, top, bot, phase) * sx, dy + y * sy, dw, hgt * sy + 0.6);
    }
    return;
  }

  // masked: the still picture, then the moving water cut to the mask on top
  g.drawImage(img, dx, dy, dw, dh);
  const c = rippleCanvas(L.id, iw, ih);
  const x = c.getContext('2d')!;
  x.globalCompositeOperation = 'source-over';
  x.clearRect(0, 0, iw, ih);
  const y0 = Math.min(top, shore ? sTop : top), y1 = Math.max(bot, shore ? sBot : bot);
  for (let y = y0; y < y1; y += 1) {
    let src = y;
    if (shore && y >= sTop && y < sBot) {
      const u = (y - sTop) / (sBot - sTop);
      src = Math.round(y + shoreAmt * Math.sin(t * 1.1 * r.speed * 2) * Math.sin(Math.PI * u));
    }
    const shift = y >= top && y < bot ? rowShift(r, y, top, bot, phase) : 0;
    x.drawImage(img, 0, Math.max(0, Math.min(ih - 1, src)), iw, 1, shift, y, iw, 1);
  }
  if (mask) {
    x.globalCompositeOperation = 'destination-in';
    x.drawImage(mask, 0, 0, iw, ih);
    x.globalCompositeOperation = 'source-over';
  }
  g.drawImage(c, dx, dy, dw, dh);
}

function drawImageLayer(g: CanvasRenderingContext2D, scene: Scene, L: ImageLayer, t: number) {
  const img = getImage(L.src);
  if (!img) return;
  const dw = img.naturalWidth * L.scale, dh = img.naturalHeight * L.scale;
  g.save();
  applyCamera(g, scene, t, L);
  g.globalAlpha = L.opacity;
  g.translate(L.x, L.y);
  if (L.flip) g.scale(-1, 1);
  if (L.scroll.enabled && dw > 0) {
    const { w } = stageSize(scene);
    const period = dw * 2; // mirrored pair hides the seam
    let off = (t * L.scroll.speed) % period;
    if (off > 0) off -= period;
    const n = Math.ceil((w * 3) / dw) + 4;
    for (let k = -n; k <= n; k++) {
      const x = -dw / 2 + off + k * dw;
      const mirrored = ((k % 2) + 2) % 2 === 1;
      g.save();
      if (mirrored) { g.translate(x + dw, 0); g.scale(-1, 1); drawRippled(g, img, L, t, 0, -dh / 2, dw, dh); }
      else drawRippled(g, img, L, t, x, -dh / 2, dw, dh);
      g.restore();
    }
  } else {
    drawRippled(g, img, L, t, -dw / 2, -dh / 2, dw, dh);
  }
  g.restore();
}

// --- characters --------------------------------------------------------------

/** Jacket cel recoloured either by tint or by rotating its own hues. */
function jacketImage(ch: CharacterLayer, src: string): CanvasImageSource | undefined {
  if (ch.jacketMode === 'hue') return getHueShifted(src, ch.jacketHue ?? 0);
  return getTinted(src, ch.jacketColor, ch.jacketStrength);
}

function drawCharacter(g: CanvasRenderingContext2D, scene: Scene, ch: CharacterLayer, t: number) {
  const d = drawingAt(scene, ch, t);
  const pose = d.pose;
  if (!pose) return;
  const { base, overlays } = drawingLayers(ch, d);
  const body = getImage(base);
  if (!body) return;
  const dw = body.naturalWidth * ch.scale, dh = body.naturalHeight * ch.scale;
  g.save();
  applyCamera(g, scene, t, ch);
  g.globalAlpha = ch.opacity;
  g.translate(ch.x, ch.y);
  if (ch.idleBob) {
    // float / breathe: a gentle bob plus a hint of squash from the feet
    const ph = Math.sin(t * Math.PI * 2 * (ch.idleSpeed ?? 0.5) + ch.id.length);
    g.translate(0, -ch.idleBob * ph);
    const sq = 1 + ph * Math.min(0.012, ch.idleBob / 900);
    g.translate(0, dh / 2); g.scale(1 / Math.sqrt(sq), sq); g.translate(0, -dh / 2);
  }
  if (ch.flip) g.scale(-1, 1);
  const x = -dw / 2, y = -dh / 2;
  g.drawImage(body, x, y, dw, dh);
  if (pose.jacketSrc) {
    const j = jacketImage(ch, pose.jacketSrc);
    if (j) g.drawImage(j, x, y, dw, dh);
  }
  for (const o of overlays) {
    const im = getImage(o);
    if (im) g.drawImage(im, x, y, dw, dh);
  }
  g.restore();
}

/** Draws a single layer (used by the 3D breakdown view). */
export function renderLayer(g: CanvasRenderingContext2D, scene: Scene, L: Layer, t: number) {
  const { w, h } = stageSize(scene);
  if (L.kind === 'image') drawImageLayer(g, scene, L, t);
  else if (L.kind === 'character') drawCharacter(g, scene, L, t);
  else drawFx(g, L, t, w, h);
}

// --- subtitles -----------------------------------------------------------

function wrap(g: CanvasRenderingContext2D, text: string, maxW: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let cur = '';
  for (const w of words) {
    const test = cur ? cur + ' ' + w : w;
    if (g.measureText(test).width > maxW && cur) { lines.push(cur); cur = w; } else cur = test;
  }
  if (cur) lines.push(cur);
  return lines;
}

function drawSubtitles(g: CanvasRenderingContext2D, scene: Scene, t: number) {
  const { w, h } = stageSize(scene);
  const lines = scene.dialogue.filter(l => t >= l.start && t < l.end && l.text.trim());
  if (!lines.length) return;
  const size = Math.round(Math.min(w, h) * 0.05);
  g.save();
  g.font = `700 ${size}px "Noto Sans Telugu", "Inter", sans-serif`;
  g.textAlign = 'center';
  g.textBaseline = 'alphabetic';
  g.lineJoin = 'round';
  const rows = lines.flatMap(l => wrap(g, l.text, w * 0.86));
  const lh = size * 1.35;
  const bar = letterboxBar(lookOf(scene), w, h);
  // In letterbox, sit the subtitles in the bottom bar when they fit, like a film.
  const inBar = bar > lh * rows.length + size * 0.4;
  let y = inBar
    ? h - bar / 2 - ((rows.length - 1) * lh) / 2 + size * 0.35
    : h - Math.max(bar + size * 0.6, scene.aspect === '9:16' ? h * 0.2 : h * 0.07) - (rows.length - 1) * lh;
  for (const r of rows) {
    g.lineWidth = size * 0.22;
    g.strokeStyle = 'rgba(0,0,0,0.85)';
    g.strokeText(r, w / 2, y);
    g.fillStyle = '#ffffff';
    g.fillText(r, w / 2, y);
    y += lh;
  }
  g.restore();
}

export interface RenderOptions {
  selectedId?: string | null;
  guides?: boolean;
}

export function renderFrame(g: CanvasRenderingContext2D, scene: Scene, t: number, opts: RenderOptions = {}) {
  const { w, h } = stageSize(scene);
  const base = g.getTransform();
  g.save();
  g.fillStyle = scene.background || '#000';
  g.fillRect(0, 0, w, h);
  for (const L of scene.layers) if (shownAt(L, t)) renderLayer(g, scene, L, t);
  applyLook(g, lookOf(scene), t, w, h);
  if (scene.subtitles) drawSubtitles(g, scene, t);

  if (opts.guides && opts.selectedId) {
    const L = scene.layers.find(l => l.id === opts.selectedId);
    const box = L && layerBox(L);
    if (L && box) {
      g.save();
      applyCamera(g, scene, t, L);
      g.strokeStyle = '#a78bfa';
      g.lineWidth = 3 / cameraAt(scene, t).zoom;
      g.setLineDash([12, 8]);
      g.strokeRect(L.x - box.w / 2, L.y - box.h / 2, box.w, box.h);
      g.setLineDash([]);
      g.fillStyle = '#a78bfa';
      const s = 22 / cameraAt(scene, t).zoom;
      g.fillRect(L.x + box.w / 2 - s / 2, L.y + box.h / 2 - s / 2, s, s);
      g.restore();
    }
  }
  g.restore();
  g.setTransform(base);
}

/** Topmost unlocked layer under a stage point. Characters win over backgrounds. */
export function hitTest(scene: Scene, t: number, sx: number, sy: number): Layer | null {
  const order = [...scene.layers].reverse().filter(l => shownAt(l, t) && !l.locked);
  const inside = (L: Layer) => {
    const box = layerBox(L);
    if (!box) return false;
    const p = stageToLayer(scene, t, L, sx, sy);
    return Math.abs(p.x - L.x) <= box.w / 2 && Math.abs(p.y - L.y) <= box.h / 2;
  };
  return order.find(l => l.kind === 'character' && inside(l)) || order.find(inside) || null;
}

/** True if the point is on the selected layer's scale handle. */
export function onScaleHandle(scene: Scene, t: number, L: Layer, sx: number, sy: number): boolean {
  const box = layerBox(L);
  if (!box) return false;
  const p = stageToLayer(scene, t, L, sx, sy);
  const r = 30 / cameraAt(scene, t).zoom;
  return Math.abs(p.x - (L.x + box.w / 2)) < r && Math.abs(p.y - (L.y + box.h / 2)) < r;
}
