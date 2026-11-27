// The compositing finish (撮影) that turns flat cels into an anime frame:
// diffusion glow, colour grade, punch, faded blacks, sun rays, vignette, grain, letterbox.
// Only uses canvas blend modes (no ctx.filter), so it works in every browser.

import { Look } from './types';

const pool = new Map<string, HTMLCanvasElement>();
const scratch = (key: string, w: number, h: number) => {
  let c = pool.get(key);
  if (!c) { c = document.createElement('canvas'); pool.set(key, c); }
  if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
  return c;
};

let grainTile: HTMLCanvasElement | null = null;
function grain(): HTMLCanvasElement {
  if (grainTile) return grainTile;
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const d = g.createImageData(256, 256);
  for (let i = 0; i < d.data.length; i += 4) {
    const v = 128 + (Math.random() - 0.5) * 255;
    d.data[i] = d.data[i + 1] = d.data[i + 2] = v;
    d.data[i + 3] = 255;
  }
  g.putImageData(d, 0, 0);
  grainTile = c;
  return c;
}

/** Cheap wide blur: shrink, then scale back up with smoothing. */
function blurred(src: HTMLCanvasElement, w: number, h: number): HTMLCanvasElement {
  const a = scratch('b1', Math.max(1, Math.round(w / 6)), Math.max(1, Math.round(h / 6)));
  const b = scratch('b2', Math.max(1, Math.round(w / 18)), Math.max(1, Math.round(h / 18)));
  const ga = a.getContext('2d')!, gb = b.getContext('2d')!;
  ga.imageSmoothingQuality = 'high';
  ga.globalCompositeOperation = 'copy';
  ga.drawImage(src, 0, 0, a.width, a.height);
  // keep only the bright parts: multiply the image by itself (≈ squaring)
  ga.globalCompositeOperation = 'multiply';
  ga.drawImage(a, 0, 0);
  ga.drawImage(a, 0, 0);
  gb.imageSmoothingQuality = 'high';
  gb.globalCompositeOperation = 'copy';
  gb.drawImage(a, 0, 0, b.width, b.height);
  ga.globalCompositeOperation = 'copy';
  ga.drawImage(b, 0, 0, a.width, a.height);
  return a;
}

export function letterboxBar(look: Look | undefined, w: number, h: number): number {
  if (!look?.letterbox) return 0;
  return w / h > 1.2 ? Math.max(0, (h - w / 2.39) / 2) : h * 0.08;
}

export function applyLook(g: CanvasRenderingContext2D, look: Look, t: number, w: number, h: number) {
  if (look.preset === 'none' && !look.letterbox) return;
  const canvas = g.canvas as HTMLCanvasElement;
  g.save();
  g.setTransform(1, 0, 0, 1, 0, 0);
  const sx = canvas.width / w;
  g.scale(sx, canvas.height / h);

  // punch: overlay the frame on itself (more contrast and colour)
  if (look.punch > 0) {
    const c = scratch('punch', canvas.width, canvas.height);
    const pc = c.getContext('2d')!;
    pc.globalCompositeOperation = 'copy';
    pc.drawImage(canvas, 0, 0);
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = look.punch * 0.6;
    g.drawImage(c, 0, 0, w, h);
  }

  if (look.desaturate > 0) {
    g.globalCompositeOperation = 'saturation';
    g.globalAlpha = look.desaturate;
    g.fillStyle = '#808080';
    g.fillRect(0, 0, w, h);
  }

  // colour grade: sky-side and ground-side tints, soft-light so shading survives
  if (look.grade > 0) {
    const gr = g.createLinearGradient(0, 0, 0, h);
    gr.addColorStop(0, look.gradeTop);
    gr.addColorStop(1, look.gradeBottom);
    g.globalCompositeOperation = 'soft-light';
    g.globalAlpha = look.grade;
    g.fillStyle = gr;
    g.fillRect(0, 0, w, h);
  }

  // day-for-night: multiply towards deep blue, keeping a little sky glow at the top
  if ((look.darken ?? 0) > 0) {
    const d = look.darken!;
    const n = g.createLinearGradient(0, 0, 0, h);
    n.addColorStop(0, '#3a4a9a');
    n.addColorStop(1, '#141a3c');
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = d;
    g.fillStyle = n;
    g.fillRect(0, 0, w, h);
  }

  // diffusion: blurred highlights screened back on top (ディフュージョン)
  if (look.diffusion > 0) {
    const b = blurred(canvas, canvas.width, canvas.height);
    g.globalCompositeOperation = 'screen';
    g.globalAlpha = look.diffusion * 0.85;
    g.drawImage(b, 0, 0, w, h);
  }

  // sun rays / lens glow (透過光)
  if (look.rays > 0) {
    const x = look.raysX * w, y = look.raysY * h;
    const R = Math.hypot(w, h);
    g.globalCompositeOperation = 'screen';
    const glow = g.createRadialGradient(x, y, 0, x, y, R * 0.45);
    glow.addColorStop(0, look.raysColor);
    glow.addColorStop(0.25, look.raysColor + '66');
    glow.addColorStop(1, 'rgba(0,0,0,0)');
    g.globalAlpha = look.rays * 0.7;
    g.fillStyle = glow;
    g.fillRect(0, 0, w, h);
    const beams = 9;
    for (let i = 0; i < beams; i++) {
      const base = (i / beams) * Math.PI * 2 + Math.sin(i * 12.9) * 0.4;
      const ang = base + Math.sin(t * 0.15 + i) * 0.04;
      const spread = 0.03 + 0.025 * Math.abs(Math.sin(i * 7.3));
      const len = R * (0.5 + 0.4 * Math.abs(Math.sin(i * 3.1)));
      const beam = g.createRadialGradient(x, y, 0, x, y, len);
      beam.addColorStop(0, look.raysColor + 'aa');
      beam.addColorStop(1, 'rgba(0,0,0,0)');
      g.fillStyle = beam;
      g.globalAlpha = look.rays * (0.25 + 0.2 * Math.sin(t * 0.6 + i * 1.3));
      g.beginPath();
      g.moveTo(x, y);
      g.arc(x, y, len, ang - spread, ang + spread);
      g.closePath();
      g.fill();
    }
  }

  // faded blacks (old film stock)
  if (look.fade > 0) {
    g.globalCompositeOperation = 'lighten';
    g.globalAlpha = 1;
    const v = Math.round(look.fade * 110);
    g.fillStyle = `rgb(${v},${Math.round(v * 0.95)},${Math.round(v * 1.1)})`;
    g.fillRect(0, 0, w, h);
  }

  if (look.vignette > 0) {
    const v = g.createRadialGradient(w / 2, h / 2, Math.min(w, h) * 0.35, w / 2, h / 2, Math.hypot(w, h) * 0.62);
    v.addColorStop(0, 'rgba(0,0,0,0)');
    v.addColorStop(1, 'rgba(10,8,30,1)');
    g.globalCompositeOperation = 'multiply';
    g.globalAlpha = look.vignette;
    g.fillStyle = v;
    g.fillRect(0, 0, w, h);
  }

  // film grain, new pattern every 1/24 s
  if (look.grain > 0) {
    const tile = grain();
    const f = Math.floor(t * 24);
    const ox = (f * 7919) % 256, oy = (f * 104729) % 256;
    const pat = g.createPattern(tile, 'repeat')!;
    g.save();
    g.translate(-ox, -oy);
    g.globalCompositeOperation = 'overlay';
    g.globalAlpha = look.grain * 0.35;
    g.fillStyle = pat;
    g.fillRect(ox, oy, w, h);
    g.restore();
  }

  const bar = letterboxBar(look, w, h);
  if (bar > 0) {
    g.globalCompositeOperation = 'source-over';
    g.globalAlpha = 1;
    g.fillStyle = '#000';
    g.fillRect(0, 0, w, bar);
    g.fillRect(0, h - bar, w, bar);
  }
  g.restore();
}
