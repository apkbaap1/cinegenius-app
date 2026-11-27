// 3D layer breakdown: every cel on its own sheet of glass, spread out in depth,
// tilted and labelled, so you can see how the shot is built. Plain DOM + CSS 3D.

import { Layer, Scene } from './types';
import { renderLayer, stageSize } from './renderer';

export const eio = (x: number) => { x = Math.max(0, Math.min(1, x)); return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2; };

interface Item { el: HTMLDivElement; cv: HTMLCanvasElement; tag: HTMLDivElement; frame: HTMLDivElement; sig: string }

const RES = 0.5; // layer canvases at half resolution: plenty for a tilted preview

export function layerNote(L: Layer): string {
  if (L.kind === 'character') {
    const drawings = L.poses.reduce((n, p) => n + 1 + Object.keys(p.variants ?? {}).length, 0) + L.mouths.length + (L.blinkSrc ? 1 : 0);
    return `${drawings} drawings · 絵${drawings}枚を切り替え`;
  }
  if (L.kind === 'fx') return 'effect · 効果';
  if (L.ripple.enabled) return L.ripple.maskSrc ? 'water moves in its mask · 水面' : 'water band ripples · 水面';
  if (L.scroll.enabled) return 'drifts sideways · 流す';
  return 'still painting · 止め絵';
}

export class Breakdown {
  private world: HTMLDivElement;
  private items = new Map<string, Item>();

  constructor(private root: HTMLDivElement) {
    root.style.cssText += ';position:absolute;inset:0;overflow:hidden;display:none;perspective:2400px;perspective-origin:50% 42%;background:radial-gradient(ellipse at 50% 45%,#2a2a3d,#0d0d16 75%);';
    this.world = document.createElement('div');
    this.world.style.cssText = 'position:absolute;left:50%;top:50%;transform-style:preserve-3d;';
    root.appendChild(this.world);
  }

  private sync(scene: Scene) {
    const { w, h } = stageSize(scene);
    this.world.style.width = `${w}px`;
    this.world.style.height = `${h}px`;
    this.world.style.margin = `${-h / 2}px 0 0 ${-w / 2}px`;
    const keep = new Set(scene.layers.map(l => l.id));
    for (const [id, it] of this.items) if (!keep.has(id)) { it.el.remove(); this.items.delete(id); }
    scene.layers.forEach((L, i) => {
      let it = this.items.get(L.id);
      if (!it) {
        const el = document.createElement('div');
        el.style.cssText = 'position:absolute;inset:0;transform-style:preserve-3d;will-change:transform;';
        const cv = document.createElement('canvas');
        cv.style.cssText = 'position:absolute;inset:0;width:100%;height:100%;';
        const frame = document.createElement('div');
        frame.style.cssText = 'position:absolute;inset:0;border:5px solid rgba(255,236,200,.85);background:rgba(255,240,215,.04);border-radius:6px;';
        const tag = document.createElement('div');
        tag.style.cssText = 'position:absolute;padding:14px 30px 18px;border-radius:18px;background:#ffcf4a;color:#2a1d0c;font:900 64px "Zen Kaku Gothic New","Inter",sans-serif;white-space:nowrap;line-height:1.15;box-shadow:0 8px 30px rgba(0,0,0,.35)';
        el.append(cv, frame, tag);
        this.world.appendChild(el);
        it = { el, cv, tag, frame, sig: '' };
        this.items.set(L.id, it);
      }
      const sig = `${L.name}|${layerNote(L)}|${i}|${w}x${h}`;
      if (it.sig !== sig) {
        it.sig = sig;
        it.tag.innerHTML = '';
        const name = document.createElement('div'); name.textContent = L.name;
        const sub = document.createElement('div'); sub.textContent = layerNote(L);
        sub.style.cssText = 'font-size:38px;font-weight:700;opacity:.85';
        it.tag.append(name, sub);
        // alternate the labels left/right so they don't stack on top of each other
        const left = i % 2 === 0;
        it.tag.style.left = left ? `${-w * 0.2}px` : '';
        it.tag.style.right = left ? '' : `${-w * 0.2}px`;
        it.tag.style.top = `${h * (0.04 + (i % 3) * 0.06)}px`;
        it.cv.width = Math.round(w * RES);
        it.cv.height = Math.round(h * RES);
        this.world.appendChild(it.el); // keep DOM order = layer order
      }
    });
  }

  /** k: 0 = assembled (hidden), 1 = fully spread. intro: seconds since the opening flourish began. */
  draw(scene: Scene, t: number, k: number, intro: number | null) {
    if (k <= 0.001) { this.root.style.display = 'none'; return; }
    this.root.style.display = 'block';
    this.sync(scene);
    const { w } = stageSize(scene);
    const fit = this.root.clientWidth / w;
    this.world.style.transform = `scale(${fit * (1 - 0.48 * k)}) translateX(${w * 0.05 * k}px) rotateX(${10 * k}deg) rotateY(${38 * k}deg)`;
    const n = scene.layers.length;
    const spread = Math.min(560, 2600 / Math.max(2, n)) * k;
    const back = -0.5 * (n - 1) * spread;
    scene.layers.forEach((L, i) => {
      const it = this.items.get(L.id)!;
      let z = (i - (n - 1) / 2) * spread;
      let alpha = 1;
      if (intro !== null) {
        // sheets arrive one after another, back to front
        const a = eio((intro - 0.2 - 0.22 * i) / 0.4);
        z = back + (z - back) * a;
        alpha = a;
      }
      it.el.style.transform = `translateZ(${z}px)`;
      it.el.style.opacity = String((L.visible ? 1 : 0.25) * alpha);
      it.frame.style.opacity = String(0.9 * k);
      it.tag.style.opacity = String(Math.max(0, Math.min(1, k * 1.6 - 0.4)) * (L.visible ? 1 : 0.4));
      const g = it.cv.getContext('2d')!;
      g.setTransform(1, 0, 0, 1, 0, 0);
      g.clearRect(0, 0, it.cv.width, it.cv.height);
      if (i === 0) { g.fillStyle = scene.background || '#000'; g.fillRect(0, 0, it.cv.width, it.cv.height); }
      g.setTransform(RES, 0, 0, RES, 0, 0);
      renderLayer(g, scene, L, t);
    });
  }
}
