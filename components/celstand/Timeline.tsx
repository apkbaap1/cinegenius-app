import React, { useEffect, useRef, useState } from 'react';
import { CharacterLayer, FxLayer, Scene } from './types';

export type Selection =
  | { type: 'layer'; id: string }
  | { type: 'line'; id: string }
  | { type: 'clip'; id: string }
  | { type: 'cam'; id: string }
  | { type: 'cue'; id: string; layerId: string }
  | { type: 'scene' };

export type DragKind = 'line' | 'clip' | 'cam' | 'cue' | 'fx';

interface Props {
  scene: Scene;
  time: number;
  selection: Selection;
  onSeek: (t: number) => void;
  onSelect: (s: Selection) => void;
  /** Called with the new start time while an item is dragged. */
  onDrag: (kind: DragKind, id: string, t: number, phase: 'start' | 'move' | 'end') => void;
}

export const CHAR_COLORS = ['#f472b6', '#60a5fa', '#34d399', '#fbbf24', '#a78bfa', '#fb7185'];
const ROLE_COLORS = { voice: '#38bdf8', ambient: '#4ade80', sfx: '#f59e0b' };
const LABEL_W = 112;
const LANE_H = 30;

const Timeline: React.FC<Props> = ({ scene, time, selection, onSeek, onSelect, onDrag }) => {
  const areaRef = useRef<HTMLDivElement>(null);
  const [width, setWidth] = useState(600);
  const drag = useRef<{ kind: DragKind | 'seek'; id: string; x0: number; t0: number; moved: boolean } | null>(null);

  useEffect(() => {
    const el = areaRef.current;
    if (!el) return;
    const ro = new ResizeObserver(() => setWidth(el.clientWidth));
    ro.observe(el);
    setWidth(el.clientWidth);
    return () => ro.disconnect();
  }, []);

  const pps = width / Math.max(0.1, scene.duration);
  const toT = (clientX: number) => {
    const r = areaRef.current!.getBoundingClientRect();
    return Math.min(scene.duration, Math.max(0, (clientX - r.left) / pps));
  };
  const snap = (t: number) => Math.round(t * 20) / 20;

  const startDrag = (e: React.PointerEvent, kind: DragKind, id: string, t0: number, sel: Selection) => {
    e.stopPropagation();
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    drag.current = { kind, id, x0: e.clientX, t0, moved: false };
    onSelect(sel);
  };

  const onMove = (e: React.PointerEvent) => {
    const d = drag.current;
    if (!d) return;
    if (d.kind === 'seek') { onSeek(toT(e.clientX)); return; }
    const dt = (e.clientX - d.x0) / pps;
    if (!d.moved && Math.abs(e.clientX - d.x0) < 3) return;
    if (!d.moved) { d.moved = true; onDrag(d.kind, d.id, d.t0, 'start'); }
    onDrag(d.kind, d.id, Math.max(0, snap(d.t0 + dt)), 'move');
  };

  const onUp = () => {
    const d = drag.current;
    if (d && d.kind !== 'seek' && d.moved) onDrag(d.kind, d.id, 0, 'end');
    drag.current = null;
  };

  const characters = scene.layers.filter((l): l is CharacterLayer => l.kind === 'character');
  const ticks: number[] = [];
  const step = scene.duration > 40 ? 5 : scene.duration > 15 ? 2 : 1;
  for (let t = 0; t <= scene.duration + 1e-6; t += step) ticks.push(t);

  const lanes: { key: string; label: string; color?: string; render: () => React.ReactNode }[] = [];

  lanes.push({
    key: 'cam', label: '🎥 Camera', render: () => scene.camera.map(k => (
      <div key={k.id}
        onPointerDown={e => startDrag(e, 'cam', k.id, k.t, { type: 'cam', id: k.id })}
        title={`Camera key ${k.t.toFixed(2)}s · zoom ${k.zoom.toFixed(2)}`}
        className={`absolute top-1/2 w-3.5 h-3.5 -ml-[7px] -mt-[7px] rotate-45 cursor-ew-resize border ${selection.type === 'cam' && selection.id === k.id ? 'bg-white border-white' : 'bg-yellow-300 border-yellow-500'}`}
        style={{ left: k.t * pps }} />
    )),
  });

  characters.forEach((ch, i) => {
    const color = CHAR_COLORS[i % CHAR_COLORS.length];
    lanes.push({
      key: ch.id, label: ch.name, color, render: () => (
        <>
          {scene.dialogue.filter(l => l.characterId === ch.id).map(l => {
            const sel = selection.type === 'line' && selection.id === l.id;
            return (
              <div key={l.id}
                onPointerDown={e => startDrag(e, 'line', l.id, l.start, { type: 'line', id: l.id })}
                className={`absolute top-1 bottom-1 rounded px-1.5 text-[10px] leading-[22px] text-gray-900 overflow-hidden whitespace-nowrap cursor-grab ${sel ? 'ring-2 ring-white' : ''}`}
                style={{ left: l.start * pps, width: Math.max(6, (l.end - l.start) * pps), background: color, fontFamily: '"Noto Sans Telugu", Inter, sans-serif' }}
                title={l.text}>
                {l.text}
              </div>
            );
          })}
          {ch.poseCues.map(c => {
            const pose = ch.poses.find(p => p.id === c.poseId);
            const sel = selection.type === 'cue' && selection.id === c.id;
            return (
              <div key={c.id}
                onPointerDown={e => startDrag(e, 'cue', c.id, c.t, { type: 'cue', id: c.id, layerId: ch.id })}
                className="absolute top-0 bottom-0 -ml-px cursor-ew-resize group"
                style={{ left: c.t * pps, width: 10 }}
                title={`Pose → ${pose?.name ?? '?'} at ${c.t.toFixed(2)}s`}>
                <div className={`absolute left-0 top-0 bottom-0 w-0.5 ${sel ? 'bg-white' : 'bg-red-500'}`} />
                <div className={`absolute left-0 top-0 w-0 h-0 border-l-[8px] border-b-[8px] border-b-transparent ${sel ? 'border-l-white' : 'border-l-red-500'}`} />
              </div>
            );
          })}
        </>
      ),
    });
  });

  const fxLayers = scene.layers.filter((l): l is FxLayer => l.kind === 'fx');
  if (fxLayers.length) lanes.push({
    key: 'fx', label: '✨ Effects', render: () => fxLayers.map((f, i) => {
      const sel = selection.type === 'layer' && selection.id === f.id;
      const lane = i % 2;
      return (
        <div key={f.id}
          onPointerDown={e => startDrag(e, 'fx', f.id, f.start, { type: 'layer', id: f.id })}
          className={`absolute rounded px-1 text-[9px] leading-[12px] text-gray-900 overflow-hidden whitespace-nowrap cursor-grab ${sel ? 'ring-2 ring-white' : ''} ${f.visible ? '' : 'opacity-40'}`}
          style={{ left: f.start * pps, width: Math.max(6, (f.end - f.start) * pps), top: 2 + lane * 13, height: 12, background: 'linear-gradient(90deg,#f9a8d4,#c4b5fd)' }}
          title={f.name}>
          {f.name}
        </div>
      );
    }),
  });

  lanes.push({
    key: 'audio', label: '🔊 Audio', render: () => scene.audio.map((c, i) => {
      const len = c.loop ? scene.duration - c.start : (c.duration ?? 1);
      const sel = selection.type === 'clip' && selection.id === c.id;
      const lane = i % 2;
      return (
        <div key={c.id}
          onPointerDown={e => startDrag(e, 'clip', c.id, c.start, { type: 'clip', id: c.id })}
          className={`absolute rounded px-1 text-[9px] leading-[12px] text-gray-900 overflow-hidden whitespace-nowrap cursor-grab opacity-90 ${sel ? 'ring-2 ring-white' : ''}`}
          style={{ left: c.start * pps, width: Math.max(6, len * pps), top: 2 + lane * 13, height: 12, background: ROLE_COLORS[c.role] }}
          title={`${c.name} (${c.role})`}>
          {c.loop ? '↻ ' : ''}{c.name}
        </div>
      );
    }),
  });

  return (
    <div className="select-none text-gray-300" onPointerMove={onMove} onPointerUp={onUp} onPointerCancel={onUp}>
      <div className="flex">
        <div style={{ width: LABEL_W }} className="shrink-0" />
        <div ref={areaRef} className="relative flex-1 h-6 border-b border-base-300 cursor-pointer"
          onPointerDown={e => { (e.target as HTMLElement).setPointerCapture(e.pointerId); drag.current = { kind: 'seek', id: '', x0: e.clientX, t0: 0, moved: false }; onSeek(toT(e.clientX)); }}>
          {ticks.map(t => (
            <div key={t} className="absolute top-0 h-full border-l border-base-300 text-[10px] pl-1 text-gray-500" style={{ left: t * pps }}>{t}s</div>
          ))}
        </div>
      </div>
      <div className="relative">
        {lanes.map(l => (
          <div key={l.key} className="flex border-b border-base-300/60" style={{ height: LANE_H }}>
            <div style={{ width: LABEL_W }} className="shrink-0 px-2 text-[11px] flex items-center gap-1.5 truncate bg-base-200">
              {l.color && <span className="w-2 h-2 rounded-full shrink-0" style={{ background: l.color }} />}
              <span className="truncate">{l.label}</span>
            </div>
            <div className="relative flex-1"
              onPointerDown={e => { if (e.target === e.currentTarget) { onSeek(toT(e.clientX)); } }}>
              {l.render()}
            </div>
          </div>
        ))}
        <div className="pointer-events-none absolute top-0 bottom-0 w-px bg-violet-400"
          style={{ left: LABEL_W + time * pps }}>
          <div className="absolute -top-6 -left-1.5 w-3 h-3 bg-violet-400 rotate-45" />
        </div>
      </div>
    </div>
  );
};

export default Timeline;
