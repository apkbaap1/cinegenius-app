import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { CharacterLayer, FX_PRESETS, FxKind, FxLayer, ImageLayer, Layer, Scene, defaultRipple, defaultScroll, uid } from './types';
import { decodeAudio, fileToDataURL, loadImage, onAssetLoaded } from './assets';
import { hitTest, onScaleHandle, poseAt, renderFrame, stageSize, stageToLayer } from './renderer';
import { mouthState } from './lipsync';
import { AudioEngine, pickVideoMime } from './playback';
import { cropToContent, SplitResult } from './imageTools';
import { demoScene } from './demo';
import { canExportMp4, exportMp4 } from './exporter';
import Timeline, { CHAR_COLORS, DragKind, Selection } from './Timeline';
import Inspector, { patchLayer } from './Inspector';
import SplitDialog from './SplitDialog';
import ArtPrompts from './ArtPrompts';
import { Btn, FileBtn, fmtTime } from './ui';

// ---------------------------------------------------------------- autosave (IndexedDB)

const DB = 'cinegenius-celstand';
const idb = () => new Promise<IDBDatabase>((res, rej) => {
  const r = indexedDB.open(DB, 1);
  r.onupgradeneeded = () => r.result.createObjectStore('kv');
  r.onsuccess = () => res(r.result);
  r.onerror = () => rej(r.error);
});
const idbGet = async (k: string): Promise<any> => {
  const db = await idb();
  return new Promise((res, rej) => { const q = db.transaction('kv').objectStore('kv').get(k); q.onsuccess = () => res(q.result); q.onerror = () => rej(q.error); });
};
const idbSet = async (k: string, v: unknown) => {
  const db = await idb();
  return new Promise<void>((res, rej) => { const t = db.transaction('kv', 'readwrite'); t.objectStore('kv').put(v, k); t.oncomplete = () => res(); t.onerror = () => rej(t.error); });
};

const download = (blob: Blob, name: string) => {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 5000);
};
const slug = (s: string) => s.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'scene';

// ---------------------------------------------------------------- lip-sync monitor

const MouthThumb: React.FC<{ src: string; active: boolean; label: string }> = ({ src, active, label }) => {
  const [thumb, setThumb] = useState<string | null>(null);
  useEffect(() => { let on = true; cropToContent(src).then(t => on && setThumb(t)); return () => { on = false; }; }, [src]);
  return (
    <div className={`flex flex-col items-center rounded-md p-1 transition-all ${active ? 'bg-violet-500/30 ring-2 ring-violet-400 scale-110' : 'opacity-50'}`} title={label}>
      <div className="w-10 h-8 flex items-center justify-center bg-[#f3e0cf] rounded">
        {thumb && <img src={thumb} alt="" className="max-w-full max-h-full" />}
      </div>
      <span className="text-[9px] text-gray-400 mt-0.5 truncate max-w-[44px]">{label}</span>
    </div>
  );
};

const LipSyncMonitor: React.FC<{ scene: Scene; time: number }> = ({ scene, time }) => {
  const chars = scene.layers.filter((l): l is CharacterLayer => l.kind === 'character' && l.visible);
  if (!chars.length) return null;
  return (
    <div className="flex flex-wrap gap-3">
      {chars.map((ch, i) => {
        const st = mouthState(scene, ch, time);
        const pose = poseAt(ch, time);
        const mouths = [...ch.mouths].sort((a, b) => a.openness - b.openness);
        return (
          <div key={ch.id} className="flex items-center gap-2 bg-base-200 border border-base-300 rounded-lg px-2 py-1.5">
            <div className="w-20">
              <div className="flex items-center gap-1 text-xs text-gray-200 truncate">
                <span className="w-2 h-2 rounded-full" style={{ background: CHAR_COLORS[i % CHAR_COLORS.length] }} />{ch.name}
              </div>
              <div className="text-[10px] text-gray-500 truncate">{pose?.name ?? '—'} · {st.source === 'voice' ? '🎙 voice' : st.source === 'text' ? '📝 text' : 'silent'}</div>
              <div className="h-1 mt-1 bg-base-300 rounded overflow-hidden"><div className="h-full bg-violet-400" style={{ width: `${st.level * 100}%` }} /></div>
            </div>
            {mouths.length ? mouths.map(m => <MouthThumb key={m.id} src={m.src} active={st.mouth?.id === m.id} label={m.name} />)
              : <span className="text-[10px] text-gray-500">no mouth cels</span>}
          </div>
        );
      })}
    </div>
  );
};

// ---------------------------------------------------------------- main

const CelStand: React.FC = () => {
  const [scene, setSceneState] = useState<Scene | null>(null);
  const [selection, setSelection] = useState<Selection>({ type: 'scene' });
  const [time, setTime] = useState(0);
  const [playing, setPlaying] = useState(false);
  const [loop, setLoop] = useState(true);
  const [split, setSplit] = useState(false);
  const [showSplitDialog, setShowSplitDialog] = useState(false);
  const [showPrompts, setShowPrompts] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [exporting, setExporting] = useState<number | null>(null);
  const [toast, setToast] = useState<string | null>(null);
  const [, force] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement>(null);
  const sceneRef = useRef<Scene | null>(null);
  const timeRef = useRef(0);
  const selRef = useRef<Selection>(selection);
  const playRef = useRef<{ wall: number; from: number } | null>(null);
  const exportRef = useRef<{ wall: number; rec: MediaRecorder } | null>(null);
  const offlineRef = useRef<{ cancelled: boolean } | null>(null);
  const explodeRef = useRef(0);
  const splitRef = useRef(false);
  const loopRef = useRef(loop);
  const engine = useMemo(() => new AudioEngine(), []);
  const past = useRef<Scene[]>([]);
  const future = useRef<Scene[]>([]);
  const lastPush = useRef(0);

  sceneRef.current = scene;
  selRef.current = selection;
  splitRef.current = split;
  loopRef.current = loop;

  const say = (msg: string) => { setToast(msg); setTimeout(() => setToast(t => (t === msg ? null : t)), 3500); };

  const update = useCallback((fn: (s: Scene) => Scene) => {
    setSceneState(prev => {
      if (!prev) return prev;
      const next = fn(prev);
      if (next === prev) return prev;
      const now = performance.now();
      if (now - lastPush.current > 600) { past.current.push(prev); if (past.current.length > 80) past.current.shift(); }
      lastPush.current = now;
      future.current = [];
      return next;
    });
  }, []);

  const undo = useCallback(() => {
    const prev = past.current.pop();
    if (!prev || !sceneRef.current) return;
    future.current.push(sceneRef.current);
    lastPush.current = 0;
    setSceneState(prev);
  }, []);
  const redo = useCallback(() => {
    const next = future.current.pop();
    if (!next || !sceneRef.current) return;
    past.current.push(sceneRef.current);
    lastPush.current = 0;
    setSceneState(next);
  }, []);

  const loadScene = useCallback(async (s: Scene, resetHistory = true) => {
    // decode audio and fill durations
    const audio = await Promise.all(s.audio.map(async c => {
      try { const b = await decodeAudio(c.src); return { ...c, duration: b.duration }; } catch { return c; }
    }));
    await Promise.all(s.layers.flatMap(l => (l.kind === 'image' ? [l.src] : l.kind === 'character' ? l.poses.map(p => p.src) : [])).map(src => loadImage(src).catch(() => null)));
    if (resetHistory) { past.current = []; future.current = []; }
    setSceneState({ ...s, audio });
    setSelection({ type: 'scene' });
    timeRef.current = 0;
    setTime(0);
  }, []);

  // first load: autosave, else demo
  useEffect(() => {
    (async () => {
      try {
        const saved = await idbGet('scene');
        if (saved && saved.version === 1) { await loadScene(saved); return; }
      } catch { /* no saved scene */ }
      await loadScene(demoScene());
    })();
    return onAssetLoaded(() => force(n => n + 1));
  }, [loadScene]);

  // autosave
  useEffect(() => {
    if (!scene) return;
    const h = setTimeout(() => { idbSet('scene', scene).catch(() => {}); }, 800);
    return () => clearTimeout(h);
  }, [scene]);

  // ------------------------------------------------------------ transport

  const seek = useCallback((t: number) => {
    const s = sceneRef.current;
    if (!s) return;
    const tt = Math.max(0, Math.min(s.duration, t));
    timeRef.current = tt;
    setTime(tt);
    if (playRef.current) { playRef.current = { wall: performance.now(), from: tt }; engine.start(s, tt); }
  }, [engine]);

  const play = useCallback(async () => {
    const s = sceneRef.current;
    if (!s || exportRef.current) return;
    await engine.prepare(s);
    let from = timeRef.current;
    if (from >= s.duration - 0.01) from = 0;
    playRef.current = { wall: performance.now(), from };
    engine.start(s, from);
    setPlaying(true);
  }, [engine]);

  const pause = useCallback(() => {
    playRef.current = null;
    engine.stop();
    setPlaying(false);
  }, [engine]);

  // keep audio in step with edits while playing (e.g. a moved clip)
  const audioSig = scene ? scene.audio.map(c => `${c.id}:${c.start}:${c.gain}:${c.loop}`).join('|') : '';
  useEffect(() => {
    if (playRef.current && sceneRef.current) engine.start(sceneRef.current, timeRef.current);
  }, [audioSig, engine]);

  // ------------------------------------------------------------ render loop

  useEffect(() => {
    let raf = 0;
    let lastUi = 0;
    const tick = (now: number) => {
      raf = requestAnimationFrame(tick);
      const s = sceneRef.current;
      const c = canvasRef.current;
      if (!s || !c) return;
      const ex = exportRef.current;
      if (ex) {
        const t = (now - ex.wall) / 1000;
        timeRef.current = Math.min(s.duration, t);
        if (t >= s.duration + 0.15) { exportRef.current = null; ex.rec.stop(); }
      } else if (playRef.current) {
        let t = playRef.current.from + (now - playRef.current.wall) / 1000;
        if (t >= s.duration) {
          if (loopRef.current) { t = 0; playRef.current = { wall: now, from: 0 }; engine.start(s, 0); }
          else { t = s.duration; playRef.current = null; engine.stop(); setPlaying(false); }
        }
        timeRef.current = t;
      }
      const target = splitRef.current && !ex ? 1 : 0;
      explodeRef.current += (target - explodeRef.current) * 0.15;
      if (Math.abs(target - explodeRef.current) < 0.002) explodeRef.current = target;

      const { w, h } = stageSize(s);
      if (c.width !== w || c.height !== h) { c.width = w; c.height = h; }
      const g = c.getContext('2d')!;
      const sel = selRef.current;
      renderFrame(g, s, timeRef.current, {
        selectedId: sel.type === 'layer' ? sel.id : null,
        guides: !ex,
        explode: explodeRef.current,
      });
      if ((playRef.current || ex) && now - lastUi > 50) { lastUi = now; setTime(timeRef.current); if (ex) setExporting(timeRef.current / s.duration); }
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [engine]);

  // ------------------------------------------------------------ stage interaction

  const dragRef = useRef<{ id: string; mode: 'move' | 'scale'; ox: number; oy: number; x0: number; y0: number; s0: number; d0: number } | null>(null);
  const toStage = (e: React.PointerEvent) => {
    const c = canvasRef.current!;
    const r = c.getBoundingClientRect();
    return { x: ((e.clientX - r.left) / r.width) * c.width, y: ((e.clientY - r.top) / r.height) * c.height };
  };

  const onStageDown = (e: React.PointerEvent) => {
    const s = sceneRef.current;
    if (!s || split || exportRef.current) return;
    const p = toStage(e);
    const t = timeRef.current;
    const selLayer = selection.type === 'layer' ? s.layers.find(l => l.id === selection.id) : undefined;
    let target: Layer | null = null;
    let mode: 'move' | 'scale' = 'move';
    if (selLayer && !selLayer.locked && onScaleHandle(s, t, selLayer, p.x, p.y)) { target = selLayer; mode = 'scale'; }
    else target = hitTest(s, t, p.x, p.y);
    if (!target) { setSelection({ type: 'scene' }); return; }
    setSelection({ type: 'layer', id: target.id });
    const lp = stageToLayer(s, t, target, p.x, p.y);
    (e.target as HTMLElement).setPointerCapture(e.pointerId);
    dragRef.current = { id: target.id, mode, ox: lp.x, oy: lp.y, x0: target.x, y0: target.y, s0: target.scale, d0: Math.hypot(lp.x - target.x, lp.y - target.y) || 1 };
  };
  const onStageMove = (e: React.PointerEvent) => {
    const d = dragRef.current;
    const s = sceneRef.current;
    if (!d || !s) return;
    const L = s.layers.find(l => l.id === d.id);
    if (!L) return;
    const p = toStage(e);
    const lp = stageToLayer(s, timeRef.current, L, p.x, p.y);
    if (d.mode === 'move') update(sc => patchLayer(sc, d.id, { x: Math.round(d.x0 + lp.x - d.ox), y: Math.round(d.y0 + lp.y - d.oy) }));
    else {
      const dist = Math.hypot(lp.x - d.x0, lp.y - d.y0);
      update(sc => patchLayer(sc, d.id, { scale: Math.max(0.05, Math.round(d.s0 * (dist / d.d0) * 1000) / 1000) }));
    }
  };
  const onStageUp = () => { dragRef.current = null; };

  // ------------------------------------------------------------ timeline drags

  const onTimelineDrag = useCallback((kind: DragKind, id: string, t: number, phase: 'start' | 'move' | 'end') => {
    if (phase !== 'move') return;
    update(s => {
      if (kind === 'line') return { ...s, dialogue: s.dialogue.map(l => (l.id === id ? { ...l, start: t, end: t + (l.end - l.start) } : l)) };
      if (kind === 'clip') return { ...s, audio: s.audio.map(c => (c.id === id ? { ...c, start: t } : c)) };
      if (kind === 'cam') return { ...s, camera: s.camera.map(k => (k.id === id ? { ...k, t } : k)) };
      if (kind === 'fx') return { ...s, layers: s.layers.map(l => (l.id === id && l.kind === 'fx' ? { ...l, start: t, end: t + (l.end - l.start) } : l)) };
      return { ...s, layers: s.layers.map(l => (l.kind === 'character' && l.poseCues.some(c => c.id === id) ? { ...l, poseCues: l.poseCues.map(c => (c.id === id ? { ...c, t } : c)) } : l)) };
    });
  }, [update]);

  // ------------------------------------------------------------ layers

  const run = useCallback((label: string, job: () => Promise<void>) => {
    setBusy(label);
    job().catch(err => { console.error(err); say(`Couldn't finish: ${label.toLowerCase()}`); }).finally(() => setBusy(null));
  }, []);

  const addImageLayers = (files: File[]) => run('Adding image layers', async () => {
    const s = sceneRef.current!;
    const { w, h } = stageSize(s);
    const layers: ImageLayer[] = [];
    for (const f of files) {
      const src = await fileToDataURL(f);
      const img = await loadImage(src);
      const cover = Math.max(w / img.naturalWidth, h / img.naturalHeight);
      layers.push({
        id: uid('layer'), kind: 'image', name: f.name.replace(/\.[^.]+$/, ''), src, visible: true, locked: false, opacity: 1,
        x: w / 2, y: h / 2, scale: Math.round(cover * 1.02 * 1000) / 1000, flip: false, parallax: 0.4,
        scroll: defaultScroll(), ripple: defaultRipple(),
      });
    }
    update(sc => ({ ...sc, layers: [...sc.layers, ...layers] }));
    if (layers[0]) setSelection({ type: 'layer', id: layers[layers.length - 1].id });
  });

  const addSplitLayers = (r: SplitResult, water: { top: number; bottom: number } | null) => run('Adding split layers', async () => {
    const s = sceneRef.current!;
    const { w, h } = stageSize(s);
    const img = await loadImage(r.sky);
    const scale = Math.round(Math.max(w / img.naturalWidth, h / img.naturalHeight) * 1.04 * 1000) / 1000;
    const mk = (name: string, src: string, extra: Partial<ImageLayer>): ImageLayer => ({
      id: uid('layer'), kind: 'image', name, src, visible: true, locked: true, opacity: 1,
      x: w / 2, y: h / 2, scale, flip: false, parallax: 0.3, scroll: defaultScroll(), ripple: defaultRipple(), ...extra,
    });
    const layers = [
      mk('Sky', r.sky, { parallax: 0.05 }),
      mk('Clouds', r.clouds, { parallax: 0.1, scroll: { enabled: true, speed: -25 } }),
      mk('Scenery', r.scenery, { parallax: 0.4, ripple: water ? { ...defaultRipple(), enabled: true, top: water.top, bottom: water.bottom } : defaultRipple() }),
    ];
    // put backgrounds under existing characters
    update(sc => {
      const firstChar = sc.layers.findIndex(l => l.kind === 'character');
      const at = firstChar < 0 ? sc.layers.length : firstChar;
      return { ...sc, layers: [...sc.layers.slice(0, at), ...layers, ...sc.layers.slice(at)] };
    });
    setShowSplitDialog(false);
    setSelection({ type: 'layer', id: layers[2].id });
    say('Added Sky, Clouds and Scenery. Hide the old background layers with 👁 to swap.');
  });

  const addCharacter = () => {
    const s = sceneRef.current!;
    const { w, h } = stageSize(s);
    const n = s.layers.filter(l => l.kind === 'character').length + 1;
    const ch: CharacterLayer = {
      id: uid('char'), kind: 'character', name: `Character ${n}`, visible: true, locked: false, opacity: 1,
      x: w / 2, y: h * 0.62, scale: 0.8, flip: false, parallax: 1,
      poses: [], defaultPoseId: '', poseCues: [], mouths: [], autoBlink: true, jacketColor: '', jacketStrength: 0.9,
    };
    update(sc => ({ ...sc, layers: [...sc.layers, ch] }));
    setSelection({ type: 'layer', id: ch.id });
  };

  const addFx = (fx: FxKind) => {
    const s = sceneRef.current!;
    const { w, h } = stageSize(s);
    const p = FX_PRESETS[fx];
    const t0 = Math.round(timeRef.current * 20) / 20;
    const L: FxLayer = {
      id: uid('fx'), kind: 'fx', fx, name: `${p.name} ${p.jp}`, visible: true, locked: true, opacity: 1,
      x: w / 2, y: h / 2, scale: 1, flip: false, parallax: 0,
      start: fx === 'speedlines' ? t0 : 0, end: fx === 'speedlines' ? Math.min(s.duration, t0 + 1.5) : s.duration,
      density: p.density, size: p.size, speed: p.speed, wind: p.wind, color: p.color, seed: Math.floor(Math.random() * 1e6),
    };
    update(sc => ({ ...sc, layers: [...sc.layers, L] }));
    setSelection({ type: 'layer', id: L.id });
  };

  const duplicateLayer = (id: string) => {
    const s = sceneRef.current!;
    const L = s.layers.find(l => l.id === id);
    if (!L) return;
    const copy = { ...JSON.parse(JSON.stringify(L)), id: uid(L.kind === 'character' ? 'char' : 'layer'), name: `${L.name} copy`, x: L.x + 60 } as Layer;
    if (copy.kind === 'character') copy.poseCues = copy.poseCues.map(c => ({ ...c, id: uid('cue') }));
    const idx = s.layers.findIndex(l => l.id === id);
    update(sc => ({ ...sc, layers: [...sc.layers.slice(0, idx + 1), copy, ...sc.layers.slice(idx + 1)] }));
    setSelection({ type: 'layer', id: copy.id });
  };

  const deleteLayer = (id: string) => {
    update(sc => ({
      ...sc,
      layers: sc.layers.filter(l => l.id !== id),
      dialogue: sc.dialogue.filter(d => d.characterId !== id),
      audio: sc.audio.map(c => (c.characterId === id ? { ...c, characterId: undefined } : c)),
    }));
    setSelection({ type: 'scene' });
  };

  const moveLayer = (id: string, dir: 1 | -1) => update(sc => {
    const i = sc.layers.findIndex(l => l.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= sc.layers.length) return sc;
    const layers = [...sc.layers];
    [layers[i], layers[j]] = [layers[j], layers[i]];
    return { ...sc, layers };
  });

  const deleteSelection = useCallback(() => {
    const sel = selRef.current;
    if (sel.type === 'layer') deleteLayer(sel.id);
    else if (sel.type === 'line') { update(s => ({ ...s, dialogue: s.dialogue.filter(l => l.id !== sel.id) })); setSelection({ type: 'scene' }); }
    else if (sel.type === 'clip') { update(s => ({ ...s, audio: s.audio.filter(c => c.id !== sel.id) })); setSelection({ type: 'scene' }); }
    else if (sel.type === 'cam') { update(s => ({ ...s, camera: s.camera.filter(k => k.id !== sel.id) })); setSelection({ type: 'scene' }); }
    else if (sel.type === 'cue') { update(s => patchLayer(s, sel.layerId, l => ({ ...(l as CharacterLayer), poseCues: (l as CharacterLayer).poseCues.filter(c => c.id !== sel.id) }))); setSelection({ type: 'layer', id: sel.layerId }); }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [update]);

  // ------------------------------------------------------------ keyboard

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const el = e.target as HTMLElement;
      if (el && (el.tagName === 'INPUT' || el.tagName === 'TEXTAREA' || el.tagName === 'SELECT' || el.isContentEditable)) return;
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key.toLowerCase() === 'z') { e.preventDefault(); e.shiftKey ? redo() : undo(); return; }
      if (mod && e.key.toLowerCase() === 'y') { e.preventDefault(); redo(); return; }
      if (e.key === ' ') { e.preventDefault(); playRef.current ? pause() : play(); return; }
      if (e.key === 'Delete' || e.key === 'Backspace') { e.preventDefault(); deleteSelection(); return; }
      if (e.key === 'Home') { seek(0); return; }
      const sel = selRef.current;
      if (sel.type === 'layer' && e.key.startsWith('Arrow')) {
        e.preventDefault();
        const step = e.shiftKey ? 20 : 2;
        const dx = e.key === 'ArrowLeft' ? -step : e.key === 'ArrowRight' ? step : 0;
        const dy = e.key === 'ArrowUp' ? -step : e.key === 'ArrowDown' ? step : 0;
        update(s => patchLayer(s, sel.id, l => ({ ...l, x: l.x + dx, y: l.y + dy })));
      } else if (e.key === 'ArrowLeft' || e.key === 'ArrowRight') {
        const s = sceneRef.current;
        if (s) seek(timeRef.current + (e.key === 'ArrowLeft' ? -1 : 1) / s.fps * (e.shiftKey ? 10 : 1));
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [undo, redo, play, pause, seek, update, deleteSelection]);

  // ------------------------------------------------------------ project files + export

  const saveProject = () => {
    if (!scene) return;
    const clean = { ...scene, audio: scene.audio.map(({ duration, ...c }) => c) };
    download(new Blob([JSON.stringify(clean)], { type: 'application/json' }), `${slug(scene.title)}.celstand.json`);
  };
  const openProject = (f: File) => run('Opening project', async () => {
    const data = JSON.parse(await f.text());
    if (data?.version !== 1 || !Array.isArray(data.layers)) throw new Error('Not a Cel Stand project');
    pause();
    await loadScene(data as Scene);
  });

  const exportVideo = async () => {
    const s = sceneRef.current;
    if (!s || exportRef.current || offlineRef.current) return;
    pause();
    setSplit(false);
    // Preferred: frame-accurate H.264 MP4 via WebCodecs.
    if (await canExportMp4(s)) {
      const job = { cancelled: false };
      offlineRef.current = job;
      setExporting(0);
      try {
        const blob = await exportMp4(s, p => setExporting(p), () => job.cancelled);
        if (blob) { download(blob, `${slug(s.title)}.mp4`); say('Video exported: MP4 (H.264 + AAC), ready for Reels / YouTube.'); }
        else say('Export cancelled.');
      } catch (err) {
        console.error(err);
        say('MP4 export failed; trying real-time recording instead.');
        offlineRef.current = null;
        setExporting(null);
        return recordRealtime();
      } finally {
        offlineRef.current = null;
        setExporting(null);
      }
      return;
    }
    return recordRealtime();
  };

  const recordRealtime = async () => {
    const s = sceneRef.current;
    const c = canvasRef.current;
    if (!s || !c || exportRef.current) return;
    if (typeof MediaRecorder === 'undefined' || !c.captureStream) { say('This browser cannot record video. Try Chrome or Edge.'); return; }
    pause();
    setSplit(false);
    explodeRef.current = 0;
    await engine.prepare(s);
    const { mime, ext } = pickVideoMime();
    const video = c.captureStream(s.fps);
    engine.start(s, 0, true);
    const tracks = [...video.getVideoTracks(), ...(engine.recordStream?.getAudioTracks() ?? [])];
    const rec = new MediaRecorder(new MediaStream(tracks), { ...(mime ? { mimeType: mime } : {}), videoBitsPerSecond: 14_000_000, audioBitsPerSecond: 192_000 });
    const chunks: Blob[] = [];
    rec.ondataavailable = e => { if (e.data.size) chunks.push(e.data); };
    rec.onstop = () => {
      engine.stop();
      video.getTracks().forEach(t => t.stop());
      download(new Blob(chunks, { type: mime || 'video/webm' }), `${slug(s.title)}.${ext}`);
      setExporting(null);
      say(ext === 'mp4' ? 'Video exported (MP4).' : 'Video exported as WebM. Convert with: ffmpeg -i in.webm -c:v libx264 -crf 18 -c:a aac out.mp4');
    };
    timeRef.current = 0;
    setExporting(0);
    rec.start(250);
    exportRef.current = { wall: performance.now(), rec };
  };

  const cancelExport = () => {
    if (offlineRef.current) { offlineRef.current.cancelled = true; return; }
    const ex = exportRef.current;
    if (!ex) return;
    exportRef.current = null;
    ex.rec.ondataavailable = null;
    ex.rec.onstop = () => { engine.stop(); setExporting(null); say('Export cancelled.'); };
    ex.rec.stop();
  };

  // ------------------------------------------------------------ view

  if (!scene) {
    return <div className="flex items-center justify-center h-[70vh] text-gray-400">Setting up the cel stand…</div>;
  }

  const { w, h } = stageSize(scene);
  const layersTopFirst = [...scene.layers].reverse();
  const stageMaxW = scene.aspect === '9:16' ? 'max-w-[380px]' : scene.aspect === '1:1' ? 'max-w-[620px]' : 'max-w-none';

  return (
    <div className="flex flex-col gap-3 px-3 sm:px-4 py-3">
      {/* toolbar */}
      <div className="flex flex-wrap items-center gap-2">
        <input value={scene.title} onChange={e => update(s => ({ ...s, title: e.target.value }))}
          className="bg-transparent text-lg font-semibold text-gray-100 border-b border-transparent hover:border-base-300 focus:border-violet-400 outline-none min-w-0 w-56" />
        <span className="text-[11px] text-gray-500 font-mono">{w}×{h} · {scene.fps}fps · {scene.duration}s</span>
        <div className="flex-1" />
        <Btn onClick={() => setShowPrompts(true)} title="Prompts for generating anime cels that line up">🎨 Anime art prompts</Btn>
        <Btn onClick={undo} disabled={!past.current.length} title="Undo (Ctrl+Z)">↶</Btn>
        <Btn onClick={redo} disabled={!future.current.length} title="Redo (Ctrl+Shift+Z)">↷</Btn>
        <Btn onClick={() => { if (confirm('Replace the current scene with the demo scene? (Save your project first if you need it.)')) { pause(); loadScene(demoScene()); } }}>Demo scene</Btn>
        <Btn onClick={() => {
          if (!confirm('Start a new empty scene? (Save your project first if you need it.)')) return;
          pause();
          loadScene({ ...demoScene(), title: 'Untitled scene', layers: [], dialogue: [], audio: [], camera: [{ id: uid('cam'), t: 0, x: 0, y: 0, zoom: 1 }], duration: 10 });
        }}>New</Btn>
        <FileBtn accept=".json,application/json" onFiles={([f]) => openProject(f)}>Open</FileBtn>
        <Btn onClick={saveProject} title="Download the whole scene (art, audio, timing) as one file you can edit again later">Save project</Btn>
        <Btn tone="primary" onClick={exportVideo} disabled={exporting !== null}>⬇ Export video</Btn>
      </div>

      <div className="grid gap-3 lg:grid-cols-[230px_minmax(0,1fr)_300px]">
        {/* layers */}
        <aside className="bg-base-200 border border-base-300 rounded-xl overflow-hidden order-2 lg:order-1 self-start">
          <div className="px-3 py-2 border-b border-base-300 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">Cels (top → bottom)</h3>
          </div>
          <div className="p-2 grid grid-cols-2 gap-1.5 border-b border-base-300">
            <Btn tone="primary" onClick={() => setShowSplitDialog(true)} className="col-span-2">✂ Background from 1 painting</Btn>
            <FileBtn accept="image/*" multiple onFiles={addImageLayers}>+ Image cel</FileBtn>
            <Btn onClick={addCharacter}>+ Character</Btn>
            <select value="" onChange={e => { if (e.target.value) addFx(e.target.value as FxKind); }}
              className="col-span-2 bg-base-300/60 hover:bg-base-300 text-gray-200 text-xs rounded-md px-2 py-1.5 cursor-pointer">
              <option value="">✨ + Anime effect…</option>
              {(Object.keys(FX_PRESETS) as FxKind[]).map(k => <option key={k} value={k}>{FX_PRESETS[k].name} · {FX_PRESETS[k].jp}</option>)}
            </select>
          </div>
          <ul className="max-h-[52vh] overflow-auto">
            {layersTopFirst.map(L => {
              const sel = selection.type === 'layer' && selection.id === L.id;
              const thumb = L.kind === 'image' ? L.src : L.kind === 'character' ? L.poses[0]?.src : undefined;
              return (
                <li key={L.id}
                  onClick={() => setSelection({ type: 'layer', id: L.id })}
                  className={`group flex items-center gap-2 px-2 py-1.5 cursor-pointer border-l-2 ${sel ? 'bg-violet-500/15 border-violet-400' : 'border-transparent hover:bg-base-300/40'}`}>
                  <div className="w-10 h-7 rounded bg-base-300/60 overflow-hidden shrink-0 flex items-center justify-center">
                    {thumb ? <img src={thumb} alt="" className="max-w-full max-h-full object-contain" /> : <span className="text-[13px]">{L.kind === 'fx' ? '✨' : ''}</span>}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className={`text-xs truncate ${L.visible ? 'text-gray-200' : 'text-gray-500 line-through'}`}>{L.name}</div>
                    <div className="text-[10px] text-gray-500 truncate">
                      {L.kind === 'fx' ? `${FX_PRESETS[L.fx].jp} · ${L.start.toFixed(1)}–${L.end.toFixed(1)}s` :
                        L.kind === 'character' ? `character · ${L.poses.length} poses · ${L.mouths.length} mouths` :
                        [L.scroll.enabled && 'drift', L.ripple.enabled && 'ripple'].filter(Boolean).join(' · ') || 'image'}
                    </div>
                  </div>
                  <div className="flex items-center gap-0.5 text-[11px]">
                    <button title="Show / hide" onClick={e => { e.stopPropagation(); update(s => patchLayer(s, L.id, { visible: !L.visible })); }} className={`px-1 ${L.visible ? 'text-gray-300' : 'text-gray-600'}`}>👁</button>
                    <button title="Lock on stage" onClick={e => { e.stopPropagation(); update(s => patchLayer(s, L.id, { locked: !L.locked })); }} className={`px-1 ${L.locked ? 'text-amber-300' : 'text-gray-600'}`}>{L.locked ? '🔒' : '🔓'}</button>
                  </div>
                  {sel && (
                    <div className="flex flex-col text-[10px] leading-none">
                      <button title="Up" onClick={e => { e.stopPropagation(); moveLayer(L.id, 1); }} className="px-1 text-gray-400 hover:text-white">▲</button>
                      <button title="Down" onClick={e => { e.stopPropagation(); moveLayer(L.id, -1); }} className="px-1 text-gray-400 hover:text-white">▼</button>
                    </div>
                  )}
                </li>
              );
            })}
            {!scene.layers.length && <li className="px-3 py-6 text-center text-xs text-gray-500">No cels yet. Start with a background.</li>}
          </ul>
          {selection.type === 'layer' && (
            <div className="p-2 border-t border-base-300 flex gap-1.5">
              <Btn onClick={() => duplicateLayer(selection.id)}>Duplicate</Btn>
              <Btn tone="danger" onClick={() => deleteLayer(selection.id)}>Delete</Btn>
            </div>
          )}
        </aside>

        {/* stage */}
        <section className="order-1 lg:order-2 min-w-0 space-y-2">
          <div className={`mx-auto ${stageMaxW}`}>
            <div className="relative rounded-xl overflow-hidden border border-base-300 bg-black shadow-2xl">
              <canvas ref={canvasRef}
                className={`block w-full h-auto touch-none ${split ? 'cursor-default' : 'cursor-crosshair'}`}
                style={{ aspectRatio: `${w} / ${h}` }}
                onPointerDown={onStageDown} onPointerMove={onStageMove} onPointerUp={onStageUp} onPointerCancel={onStageUp} />
              {exporting !== null && (
                <div className="absolute inset-x-0 bottom-0 bg-black/70 px-3 py-2 flex items-center gap-3">
                  <span className="text-xs text-white">● {offlineRef.current ? 'Rendering MP4' : 'Recording (keep this tab visible)'} {Math.round(exporting * 100)}%</span>
                  <div className="flex-1 h-1.5 bg-white/20 rounded"><div className="h-full bg-red-500 rounded" style={{ width: `${exporting * 100}%` }} /></div>
                  <Btn tone="danger" onClick={cancelExport}>Cancel</Btn>
                </div>
              )}
            </div>
          </div>
          {/* transport */}
          <div className="flex flex-wrap items-center gap-2 bg-base-200 border border-base-300 rounded-xl px-3 py-2">
            <Btn onClick={() => seek(0)} title="To start (Home)">⏮</Btn>
            <Btn tone="primary" className="w-20 whitespace-nowrap" onClick={() => (playing ? pause() : play())} disabled={exporting !== null}>{playing ? '❚❚ Pause' : '▶ Play'}</Btn>
            <span className="font-mono text-sm text-gray-200 tabular-nums">{fmtTime(time)}</span>
            <span className="font-mono text-xs text-gray-500">/ {fmtTime(scene.duration)}</span>
            <label className="flex items-center gap-1 text-xs text-gray-400 ml-1"><input type="checkbox" checked={loop} onChange={e => setLoop(e.target.checked)} className="accent-violet-500" />loop</label>
            <div className="flex-1" />
            <div className="flex rounded-md overflow-hidden border border-base-300">
              <button onClick={() => setSplit(false)} className={`px-2.5 py-1 text-xs ${!split ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-base-300'}`}>Assembled</button>
              <button onClick={() => setSplit(true)} className={`px-2.5 py-1 text-xs ${split ? 'bg-violet-600 text-white' : 'text-gray-400 hover:bg-base-300'}`}>Split cels</button>
            </div>
          </div>
          <LipSyncMonitor scene={scene} time={time} />
        </section>

        {/* inspector */}
        <aside className="bg-base-200 border border-base-300 rounded-xl overflow-hidden order-3 self-start lg:max-h-[calc(100vh-140px)] lg:overflow-auto">
          <div className="px-3 py-2 border-b border-base-300 flex items-center justify-between">
            <h3 className="text-xs font-semibold uppercase tracking-wider text-gray-400">
              {selection.type === 'scene' ? 'Scene' : selection.type === 'layer' ? 'Cel' : selection.type === 'line' ? 'Dialogue' : selection.type === 'clip' ? 'Audio' : selection.type === 'cam' ? 'Camera' : 'Pose cue'}
            </h3>
            {selection.type !== 'scene' && <button onClick={() => setSelection({ type: 'scene' })} className="text-[11px] text-violet-300 hover:text-violet-200">Scene settings</button>}
          </div>
          <Inspector scene={scene} time={time} selection={selection} update={update} select={setSelection} run={run} />
        </aside>
      </div>

      {/* timeline */}
      <div className="bg-base-200 border border-base-300 rounded-xl p-2 pt-1 overflow-x-auto">
        <div className="min-w-[640px]">
          <Timeline scene={scene} time={time} selection={selection} onSeek={seek} onSelect={setSelection} onDrag={onTimelineDrag} />
        </div>
        <div className="flex flex-wrap gap-x-4 gap-y-1 text-[10px] text-gray-500 px-1 pt-2">
          <span><span className="inline-block w-2 h-2 bg-red-500 mr-1" />pose change</span>
          <span><span className="inline-block w-2 h-2 bg-yellow-300 rotate-45 mr-1" />camera key</span>
          <span>Drag blocks to retime · Space play · ←/→ step a frame · Del remove · Ctrl+Z undo</span>
        </div>
      </div>

      {showPrompts && <ArtPrompts onClose={() => setShowPrompts(false)} />}
      {showSplitDialog && <SplitDialog onClose={() => setShowSplitDialog(false)} onAdd={addSplitLayers} />}
      {(busy || toast) && (
        <div className="fixed bottom-4 left-1/2 -translate-x-1/2 z-[70] bg-base-300 border border-white/10 text-gray-100 text-sm rounded-lg px-4 py-2 shadow-xl">
          {busy ? `⏳ ${busy}…` : toast}
        </div>
      )}
    </div>
  );
};

export default CelStand;
