// Anime effects drawn in screen space. Every particle's position is a pure
// function of (seed, index, time), so playback, scrubbing and export always match.

import { FxLayer } from './types';

const rnd = (seed: number, i: number, k: number) => {
  let h = (seed * 374761393 + i * 668265263 + k * 2147483647) | 0;
  h = Math.imul(h ^ (h >>> 13), 1274126177);
  h ^= h >>> 16;
  return ((h >>> 0) % 100000) / 100000;
};
const wrap = (v: number, m: number) => ((v % m) + m) % m;

/** 0..1 fade at the edges of the effect's time range. */
export function fxStrength(L: FxLayer, t: number): number {
  if (t < L.start || t > L.end) return 0;
  const f = 0.4;
  return Math.min(1, (t - L.start) / f, (L.end - t) / f);
}

function petal(g: CanvasRenderingContext2D, x: number, y: number, s: number, rot: number, flip: number, color: string) {
  g.save();
  g.translate(x, y);
  g.rotate(rot);
  g.scale(1, Math.max(0.15, Math.abs(flip)));
  g.beginPath();
  g.moveTo(0, -s);
  g.bezierCurveTo(s * 0.9, -s * 0.6, s * 0.7, s * 0.7, 0, s);
  g.bezierCurveTo(-s * 0.7, s * 0.7, -s * 0.9, -s * 0.6, 0, -s);
  g.fillStyle = color;
  g.fill();
  // the little notch and a darker vein
  g.fillStyle = 'rgba(255,120,160,0.35)';
  g.beginPath(); g.ellipse(0, s * 0.2, s * 0.18, s * 0.6, 0, 0, Math.PI * 2); g.fill();
  g.restore();
}

function star(g: CanvasRenderingContext2D, x: number, y: number, r: number) {
  g.beginPath();
  g.moveTo(x, y - r);
  g.quadraticCurveTo(x, y, x + r, y);
  g.quadraticCurveTo(x, y, x, y + r);
  g.quadraticCurveTo(x, y, x - r, y);
  g.quadraticCurveTo(x, y, x, y - r);
  g.fill();
}

export function drawFx(g: CanvasRenderingContext2D, L: FxLayer, t: number, w: number, h: number) {
  const k = fxStrength(L, t) * L.opacity;
  if (k <= 0) return;
  const n = Math.max(1, Math.round(L.density));
  const unit = Math.min(w, h) / 1080;
  const sz = L.size * unit;
  const seed = L.seed;
  g.save();
  g.globalAlpha = k;
  if (L.flip) { g.translate(w, 0); g.scale(-1, 1); }

  switch (L.fx) {
    case 'sakura': {
      for (let i = 0; i < n; i++) {
        const depth = 0.4 + 0.6 * rnd(seed, i, 1); // nearer petals are bigger & faster
        const vy = (60 + 90 * rnd(seed, i, 2)) * L.speed * depth * unit;
        const vx = L.wind * 220 * depth * unit;
        const span = h + 200 * unit;
        const y = wrap(rnd(seed, i, 3) * span + vy * t, span) - 100 * unit;
        const x = wrap(rnd(seed, i, 4) * (w + 400) + vx * t + Math.sin(t * (0.8 + rnd(seed, i, 5)) + i) * 40 * unit, w + 400) - 200;
        const rot = t * (1 + 2 * rnd(seed, i, 6)) + i;
        const flip = Math.sin(t * (2 + 2 * rnd(seed, i, 7)) + i);
        petal(g, x, y, (7 + 6 * depth) * sz, rot, flip, L.color);
      }
      break;
    }
    case 'snow': {
      g.fillStyle = L.color;
      for (let i = 0; i < n; i++) {
        const depth = 0.3 + 0.7 * rnd(seed, i, 1);
        const vy = (40 + 60 * rnd(seed, i, 2)) * L.speed * depth * unit;
        const span = h + 40;
        const y = wrap(rnd(seed, i, 3) * span + vy * t, span) - 20;
        const x = wrap(rnd(seed, i, 4) * w + L.wind * 150 * depth * unit * t + Math.sin(t * 0.9 + i) * 25 * unit, w);
        g.globalAlpha = k * (0.5 + 0.5 * depth);
        g.beginPath(); g.arc(x, y, (2 + 4 * depth) * sz, 0, Math.PI * 2); g.fill();
      }
      break;
    }
    case 'rain': {
      g.strokeStyle = L.color;
      g.lineCap = 'round';
      for (let i = 0; i < n; i++) {
        const depth = 0.3 + 0.7 * rnd(seed, i, 1);
        const v = (1400 + 600 * rnd(seed, i, 2)) * L.speed * unit * depth;
        const len = (30 + 50 * depth) * sz;
        const span = h + len * 2;
        const y = wrap(rnd(seed, i, 3) * span + v * t, span) - len;
        const dx = L.wind * len;
        const x = wrap(rnd(seed, i, 4) * w + L.wind * v * 0.3 * t, w);
        g.globalAlpha = k * (0.25 + 0.45 * depth);
        g.lineWidth = (1 + 1.5 * depth) * sz;
        g.beginPath(); g.moveTo(x, y); g.lineTo(x + dx, y + len); g.stroke();
      }
      break;
    }
    case 'sparkles': {
      // floating motes of light (光の粒): drift upwards and twinkle
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const depth = 0.3 + 0.7 * rnd(seed, i, 1);
        const span = h + 60;
        const y = wrap(rnd(seed, i, 3) * span - (20 + 30 * rnd(seed, i, 2)) * L.speed * unit * t, span) - 30;
        const x = wrap(rnd(seed, i, 4) * w + Math.sin(t * 0.5 + i * 1.7) * 30 * unit + L.wind * 100 * unit * t, w);
        const tw = 0.5 + 0.5 * Math.sin(t * (2 + 3 * rnd(seed, i, 5)) + i * 2.1);
        const r = (3 + 7 * depth) * sz;
        const grad = g.createRadialGradient(x, y, 0, x, y, r * 3);
        grad.addColorStop(0, L.color);
        grad.addColorStop(1, 'rgba(255,255,255,0)');
        g.globalAlpha = k * tw * (0.35 + 0.5 * depth);
        g.fillStyle = grad;
        g.beginPath(); g.arc(x, y, r * 3, 0, Math.PI * 2); g.fill();
        if (rnd(seed, i, 8) > 0.6) {
          g.fillStyle = '#ffffff';
          g.globalAlpha = k * tw;
          star(g, x, y, r * 2.2 * tw);
        }
      }
      break;
    }
    case 'fireflies': {
      g.globalCompositeOperation = 'lighter';
      for (let i = 0; i < n; i++) {
        const a = rnd(seed, i, 1) * 10;
        const x = w * (0.05 + 0.9 * rnd(seed, i, 2)) + Math.sin(t * 0.37 * L.speed + a) * 80 * unit + Math.sin(t * 0.91 * L.speed + a * 2) * 30 * unit;
        const y = h * (0.35 + 0.6 * rnd(seed, i, 3)) + Math.cos(t * 0.29 * L.speed + a) * 60 * unit;
        const pulse = Math.max(0, Math.sin(t * (1.2 + rnd(seed, i, 4)) + a));
        const r = 14 * sz;
        const grad = g.createRadialGradient(x, y, 0, x, y, r);
        grad.addColorStop(0, '#ffffff');
        grad.addColorStop(0.25, L.color);
        grad.addColorStop(1, 'rgba(0,0,0,0)');
        g.globalAlpha = k * pulse;
        g.fillStyle = grad;
        g.beginPath(); g.arc(x, y, r, 0, Math.PI * 2); g.fill();
      }
      break;
    }
    case 'speedlines': {
      // 集中線: radial wedges towards the centre, re-drawn 12 times a second like hand animation
      const frame = Math.floor(t * 12 * L.speed);
      const cx = w / 2, cy = h / 2;
      const R = Math.hypot(w, h) * 0.6;
      g.fillStyle = L.color;
      for (let i = 0; i < n; i++) {
        const ang = (i / n) * Math.PI * 2 + (rnd(seed, i, frame) - 0.5) * (Math.PI * 2 / n);
        const inner = R * (0.42 + 0.25 * rnd(seed, i, frame + 7)) / L.size;
        const width = (0.004 + 0.012 * rnd(seed, i, frame + 3)) * Math.PI;
        g.beginPath();
        g.moveTo(cx + Math.cos(ang) * inner, cy + Math.sin(ang) * inner);
        g.lineTo(cx + Math.cos(ang - width) * R, cy + Math.sin(ang - width) * R);
        g.lineTo(cx + Math.cos(ang + width) * R, cy + Math.sin(ang + width) * R);
        g.closePath();
        g.globalAlpha = k * (0.55 + 0.45 * rnd(seed, i, frame + 11));
        g.fill();
      }
      break;
    }
  }
  g.restore();
}
