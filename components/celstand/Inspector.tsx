import React, { useEffect, useState } from 'react';
import { AudioClip, CharacterLayer, ClipRole, FX_PRESETS, FxKind, FxLayer, ImageLayer, LOOKS, Layer, Look, Pose, Scene, ASPECTS, AspectId, lookOf, uid } from './types';
import { Selection } from './Timeline';
import { Btn, FileBtn, NumField, Section, Slider, Toggle, fmtTime } from './ui';
import { decodeAudio, fileToDataURL, getImage } from './assets';
import { cropToContent, isolateColor, keyOutBackground, sampleColor } from './imageTools';
import { cameraAt, poseAt } from './renderer';

type Update = (fn: (s: Scene) => Scene) => void;

interface Props {
  scene: Scene;
  time: number;
  selection: Selection;
  update: Update;
  select: (s: Selection) => void;
  run: (label: string, job: () => Promise<void>) => void;
}

const baseName = (f: File) => f.name.replace(/\.[^.]+$/, '');
const JACKET_SWATCHES = ['', '#e11d48', '#f97316', '#eab308', '#16a34a', '#0ea5e9', '#4f46e5', '#9333ea', '#111827', '#f5f5f4'];

export const patchLayer = (s: Scene, id: string, patch: Partial<Layer> | ((l: Layer) => Layer)): Scene => ({
  ...s,
  layers: s.layers.map(l => (l.id === id ? (typeof patch === 'function' ? patch(l) : ({ ...l, ...patch } as Layer)) : l)),
});

const CelThumb: React.FC<{ src: string }> = ({ src }) => {
  const [t, setT] = useState<string | null>(null);
  useEffect(() => { let on = true; cropToContent(src).then(x => on && setT(x)); return () => { on = false; }; }, [src]);
  return <div className="w-10 h-10 shrink-0 flex items-center justify-center bg-[#f3e0cf] rounded">{t && <img src={t} alt="" className="max-w-full max-h-full" />}</div>;
};

// ------------------------------------------------------------------ common

const Transform: React.FC<{ L: Layer; set: (p: Partial<Layer>) => void }> = ({ L, set }) => (
  <Section title="Placement">
    <div className="grid grid-cols-2 gap-2">
      <NumField label="X" value={L.x} onChange={x => set({ x })} />
      <NumField label="Y" value={L.y} onChange={y => set({ y })} />
    </div>
    <Slider label="Size" value={L.scale} min={0.1} max={3} onChange={scale => set({ scale })} fmt={v => `${Math.round(v * 100)}%`} />
    <Slider label="Opacity" value={L.opacity} min={0} max={1} onChange={opacity => set({ opacity })} fmt={v => `${Math.round(v * 100)}%`} />
    <Slider label="Parallax (follows camera)" value={L.parallax} min={0} max={1.5} onChange={parallax => set({ parallax })} />
    <div className="flex gap-3">
      <Toggle label="Flip" checked={L.flip} onChange={flip => set({ flip })} />
      <Toggle label="Lock on stage" checked={L.locked} onChange={locked => set({ locked })} />
    </div>
  </Section>
);

// ------------------------------------------------------------------ image

const ImageInspector: React.FC<{ L: ImageLayer; update: Update; run: Props['run'] }> = ({ L, update, run }) => {
  const set = (p: Partial<ImageLayer>) => update(s => patchLayer(s, L.id, p as Partial<Layer>));
  return (
    <>
      <Section title="Image cel">
        <img src={L.src} alt="" className="w-full max-h-32 object-contain bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:16px_16px] rounded" />
        <div className="flex flex-wrap gap-1.5">
          <FileBtn accept="image/*" onFiles={([f]) => run('Replacing image', async () => { const src = await fileToDataURL(f); set({ src }); })}>Replace image</FileBtn>
          <Btn onClick={() => run('Removing background', async () => set({ src: await keyOutBackground(L.src) }))} title="Makes the flat colour around the edges transparent">Remove flat background</Btn>
        </div>
      </Section>
      <Transform L={L} set={p => set(p as Partial<ImageLayer>)} />
      <Section title="Drift (clouds)" right={<Toggle label="" checked={L.scroll.enabled} onChange={enabled => set({ scroll: { ...L.scroll, enabled } })} />}>
        <p className="text-[11px] text-gray-500">Scrolls the cel sideways forever (mirrored tiles, no seam).</p>
        <Slider label="Speed (px/s)" value={L.scroll.speed} min={-200} max={200} step={1} onChange={speed => set({ scroll: { ...L.scroll, speed, enabled: true } })} fmt={v => v.toFixed(0)} />
      </Section>
      <Section title="Ripple (water)" right={<Toggle label="" checked={L.ripple.enabled} onChange={enabled => set({ ripple: { ...L.ripple, enabled } })} />}>
        <p className="text-[11px] text-gray-500">Waves a horizontal band of the image, stronger towards the viewer.</p>
        <Slider label="Band top" value={L.ripple.top} min={0} max={1} onChange={top => set({ ripple: { ...L.ripple, top: Math.min(top, L.ripple.bottom), enabled: true } })} fmt={v => `${Math.round(v * 100)}%`} />
        <Slider label="Band bottom" value={L.ripple.bottom} min={0} max={1} onChange={bottom => set({ ripple: { ...L.ripple, bottom: Math.max(bottom, L.ripple.top), enabled: true } })} fmt={v => `${Math.round(v * 100)}%`} />
        <Slider label="Strength" value={L.ripple.amplitude} min={0} max={20} step={0.5} onChange={amplitude => set({ ripple: { ...L.ripple, amplitude } })} fmt={v => v.toFixed(1)} />
        <Slider label="Wave size" value={L.ripple.wavelength} min={6} max={80} step={1} onChange={wavelength => set({ ripple: { ...L.ripple, wavelength } })} fmt={v => v.toFixed(0)} />
        <Slider label="Speed" value={L.ripple.speed} min={0} max={3} onChange={speed => set({ ripple: { ...L.ripple, speed } })} />
      </Section>
    </>
  );
};

// ------------------------------------------------------------------ character

const JacketTool: React.FC<{ ch: CharacterLayer; pose: Pose; update: Update; run: Props['run'] }> = ({ ch, pose, update, run }) => {
  const [color, setColor] = useState('#3b6fb6');
  const [tol, setTol] = useState(60);
  const setPoses = (fn: (p: Pose) => Pose) => update(s => patchLayer(s, ch.id, l => ({ ...(l as CharacterLayer), poses: (l as CharacterLayer).poses.map(fn) })));
  return (
    <div className="rounded border border-base-300 p-2 space-y-2 bg-base-100/50">
      <p className="text-[11px] text-gray-400">Click the jacket on the picture to pick its colour, then lift it onto its own cel.</p>
      <img src={pose.src} alt="" className="w-full max-h-40 object-contain cursor-crosshair bg-base-300/40 rounded"
        onClick={e => {
          const r = (e.target as HTMLImageElement).getBoundingClientRect();
          const img = getImage(pose.src);
          if (!img) return;
          // account for object-contain letterboxing
          const k = Math.min(r.width / img.naturalWidth, r.height / img.naturalHeight);
          const ox = (r.width - img.naturalWidth * k) / 2, oy = (r.height - img.naturalHeight * k) / 2;
          const fx = (e.clientX - r.left - ox) / (img.naturalWidth * k);
          const fy = (e.clientY - r.top - oy) / (img.naturalHeight * k);
          sampleColor(pose.src, fx, fy).then(setColor);
        }} />
      <div className="flex items-center gap-2 text-[11px] text-gray-400">
        Picked <span className="w-5 h-5 rounded border border-white/30" style={{ background: color }} /> <span className="font-mono">{color}</span>
      </div>
      <Slider label="Tolerance" value={tol} min={10} max={140} step={1} onChange={setTol} fmt={v => v.toFixed(0)} />
      <div className="flex flex-wrap gap-1.5">
        <Btn tone="primary" onClick={() => run('Lifting jacket', async () => {
          const jacketSrc = await isolateColor(pose.src, color, tol);
          setPoses(p => (p.id === pose.id ? { ...p, jacketSrc } : p));
        })}>Lift from this pose</Btn>
        <Btn onClick={() => run('Lifting jacket on all poses', async () => {
          const out = await Promise.all(ch.poses.map(async p => ({ id: p.id, src: await isolateColor(p.src, color, tol) })));
          setPoses(p => ({ ...p, jacketSrc: out.find(o => o.id === p.id)?.src }));
        })}>All poses</Btn>
      </div>
      {pose.jacketSrc && (
        <img src={pose.jacketSrc} alt="jacket cel" className="w-full max-h-24 object-contain bg-[repeating-conic-gradient(#374151_0%_25%,#1f2937_0%_50%)] bg-[length:12px_12px] rounded" />
      )}
    </div>
  );
};

const CharacterInspector: React.FC<{ ch: CharacterLayer; scene: Scene; time: number; update: Update; select: Props['select']; run: Props['run'] }> = ({ ch, scene, time, update, select, run }) => {
  const set = (p: Partial<CharacterLayer>) => update(s => patchLayer(s, ch.id, p as Partial<Layer>));
  const [keyBg, setKeyBg] = useState(true);
  const [jacketFor, setJacketFor] = useState<string | null>(null);
  const current = poseAt(ch, time);

  const addPoses = (files: File[]) => run('Importing poses', async () => {
    const poses: Pose[] = [];
    for (const f of files) {
      let src = await fileToDataURL(f);
      if (keyBg) src = await keyOutBackground(src);
      poses.push({ id: uid('pose'), name: baseName(f), src });
    }
    update(s => patchLayer(s, ch.id, l => {
      const c = l as CharacterLayer;
      const all = [...c.poses, ...poses];
      return { ...c, poses: all, defaultPoseId: c.defaultPoseId && all.some(p => p.id === c.defaultPoseId) ? c.defaultPoseId : all[0].id };
    }));
  });

  const addMouths = (files: File[]) => run('Importing mouths', async () => {
    const sorted = [...files].sort((a, b) => a.name.localeCompare(b.name, undefined, { numeric: true }));
    const mouths = [];
    for (let i = 0; i < sorted.length; i++) {
      let src = await fileToDataURL(sorted[i]);
      if (keyBg) src = await keyOutBackground(src);
      mouths.push({ id: uid('mouth'), name: baseName(sorted[i]), src, openness: sorted.length > 1 ? i / (sorted.length - 1) : 0 });
    }
    update(s => patchLayer(s, ch.id, l => ({ ...(l as CharacterLayer), mouths: [...(l as CharacterLayer).mouths, ...mouths] })));
  });

  const addCue = (poseId: string) => {
    const cue = { id: uid('cue'), t: Math.round(time * 20) / 20, poseId };
    update(s => patchLayer(s, ch.id, l => {
      const c = l as CharacterLayer;
      return { ...c, poseCues: [...c.poseCues.filter(q => Math.abs(q.t - cue.t) > 1e-3), cue].sort((a, b) => a.t - b.t) };
    }));
    select({ type: 'cue', id: cue.id, layerId: ch.id });
  };

  const addLine = () => {
    const line = { id: uid('line'), characterId: ch.id, start: Math.round(time * 20) / 20, end: Math.min(scene.duration, Math.round(time * 20) / 20 + 2), text: 'కొత్త dialogue ఇక్కడ…' };
    update(s => ({ ...s, dialogue: [...s.dialogue, line] }));
    select({ type: 'line', id: line.id });
  };

  return (
    <>
      <Section title="Character">
        <label className="block text-[11px] text-gray-400">Name
          <input value={ch.name} onChange={e => set({ name: e.target.value })}
            className="mt-0.5 w-full bg-base-100 border border-base-300 rounded px-2 py-1 text-sm text-gray-100" />
        </label>
        <div className="flex flex-wrap gap-1.5">
          <Btn tone="primary" onClick={addLine}>+ Dialogue at {fmtTime(time)}</Btn>
        </div>
      </Section>

      <Section title={`Poses (${ch.poses.length})`} right={<FileBtn accept="image/*" multiple onFiles={addPoses}>+ Pose cels</FileBtn>}>
        <Toggle label="Remove flat background on import" checked={keyBg} onChange={setKeyBg} />
        {!ch.poses.length && <p className="text-[11px] text-amber-300/80">Upload one PNG per pose. All cels of a character should be the same size and lined up (same canvas), like sheets on a cel stand.</p>}
        <div className="space-y-1.5">
          {ch.poses.map(p => (
            <div key={p.id} className={`rounded border p-1.5 ${current?.id === p.id ? 'border-violet-400 bg-violet-500/10' : 'border-base-300'}`}>
              <div className="flex items-center gap-2">
                <img src={p.src} alt="" className="w-10 h-12 object-contain bg-base-300/40 rounded" />
                <input value={p.name} onChange={e => update(s => patchLayer(s, ch.id, l => ({ ...(l as CharacterLayer), poses: (l as CharacterLayer).poses.map(q => q.id === p.id ? { ...q, name: e.target.value } : q) })))}
                  className="flex-1 min-w-0 bg-transparent text-xs text-gray-200 border-b border-transparent focus:border-base-300 outline-none" />
                <Btn onClick={() => addCue(p.id)} title="Switch to this pose at the playhead">Cue ▸</Btn>
              </div>
              <div className="flex flex-wrap gap-1 mt-1.5">
                <Btn className={ch.defaultPoseId === p.id ? '!bg-violet-600/60' : ''} onClick={() => set({ defaultPoseId: p.id })}>{ch.defaultPoseId === p.id ? '★ Start pose' : 'Set start'}</Btn>
                <Btn onClick={() => setJacketFor(jacketFor === p.id ? null : p.id)}>{p.jacketSrc ? 'Jacket ✓' : 'Jacket…'}</Btn>
                <FileBtn accept="image/*" title="Upload a ready-made jacket cel" onFiles={([f]) => run('Importing jacket cel', async () => {
                  const src = await fileToDataURL(f);
                  update(s => patchLayer(s, ch.id, l => ({ ...(l as CharacterLayer), poses: (l as CharacterLayer).poses.map(q => q.id === p.id ? { ...q, jacketSrc: src } : q) })));
                })}>⇪</FileBtn>
                <Btn tone="danger" onClick={() => update(s => patchLayer(s, ch.id, l => {
                  const c = l as CharacterLayer;
                  const poses = c.poses.filter(q => q.id !== p.id);
                  return { ...c, poses, poseCues: c.poseCues.filter(q => q.poseId !== p.id), defaultPoseId: c.defaultPoseId === p.id ? (poses[0]?.id ?? '') : c.defaultPoseId };
                }))}>✕</Btn>
              </div>
              {jacketFor === p.id && <div className="mt-2"><JacketTool ch={ch} pose={p} update={update} run={run} /></div>}
            </div>
          ))}
        </div>
      </Section>

      <Section title="Jacket colour">
        <div className="flex flex-wrap gap-1.5">
          {JACKET_SWATCHES.map(c => (
            <button key={c || 'orig'} onClick={() => set({ jacketColor: c })}
              title={c || 'Original colours'}
              className={`w-6 h-6 rounded-full border-2 ${ch.jacketColor === c ? 'border-white' : 'border-transparent'}`}
              style={{ background: c || 'conic-gradient(#f87171,#facc15,#4ade80,#60a5fa,#c084fc,#f87171)' }} />
          ))}
          <input type="color" value={ch.jacketColor || '#3b6fb6'} onChange={e => set({ jacketColor: e.target.value })} className="w-7 h-6 bg-transparent" />
        </div>
        <Slider label="Strength" value={ch.jacketStrength} min={0} max={1} onChange={jacketStrength => set({ jacketStrength })} fmt={v => `${Math.round(v * 100)}%`} />
        {!ch.poses.some(p => p.jacketSrc) && <p className="text-[11px] text-gray-500">No jacket cel yet: use “Jacket…” on a pose.</p>}
      </Section>

      <Section title={`Mouth shapes (${ch.mouths.length})`} right={<FileBtn accept="image/*" multiple onFiles={addMouths}>+ Mouth cels</FileBtn>}>
        <p className="text-[11px] text-gray-500">Name files in order closed → open (e.g. mouth_0 … mouth_3). Lip-sync picks the shape whose openness is nearest to the voice level.</p>
        {ch.mouths.map(m => (
          <div key={m.id} className="flex items-center gap-2">
            <CelThumb src={m.src} />
            <div className="flex-1">
              <Slider label={m.name} value={m.openness} min={0} max={1} onChange={openness => update(s => patchLayer(s, ch.id, l => ({ ...(l as CharacterLayer), mouths: (l as CharacterLayer).mouths.map(q => q.id === m.id ? { ...q, openness } : q) })))} />
            </div>
            <Btn tone="danger" onClick={() => update(s => patchLayer(s, ch.id, l => ({ ...(l as CharacterLayer), mouths: (l as CharacterLayer).mouths.filter(q => q.id !== m.id) })))}>✕</Btn>
          </div>
        ))}
      </Section>

      <Section title="Blink">
        <div className="flex items-center gap-2">
          {ch.blinkSrc && <CelThumb src={ch.blinkSrc} />}
          <FileBtn accept="image/*" onFiles={([f]) => run('Importing blink cel', async () => {
            let src = await fileToDataURL(f);
            if (keyBg) src = await keyOutBackground(src);
            set({ blinkSrc: src });
          })}>{ch.blinkSrc ? 'Replace' : 'Upload'} closed-eyes cel</FileBtn>
        </div>
        <Toggle label="Blink automatically" checked={ch.autoBlink} onChange={autoBlink => set({ autoBlink })} />
      </Section>

      <Transform L={ch} set={p => set(p as Partial<CharacterLayer>)} />
    </>
  );
};

// ------------------------------------------------------------------ timeline items

const LineInspector: React.FC<{ scene: Scene; id: string; update: Update; select: Props['select']; time: number }> = ({ scene, id, update, select, time }) => {
  const line = scene.dialogue.find(l => l.id === id);
  if (!line) return null;
  const chars = scene.layers.filter(l => l.kind === 'character');
  const set = (p: Partial<typeof line>) => update(s => ({ ...s, dialogue: s.dialogue.map(l => (l.id === id ? { ...l, ...p } : l)) }));
  return (
    <Section title="Dialogue line">
      <select value={line.characterId} onChange={e => set({ characterId: e.target.value })}
        className="w-full bg-base-100 border border-base-300 rounded px-2 py-1 text-sm text-gray-100">
        {chars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
      </select>
      <textarea value={line.text} onChange={e => set({ text: e.target.value })} rows={3}
        className="w-full bg-base-100 border border-base-300 rounded px-2 py-1.5 text-sm text-gray-100"
        style={{ fontFamily: '"Noto Sans Telugu", Inter, sans-serif' }} />
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Start" step={0.05} value={line.start} onChange={start => set({ start: Math.max(0, start) })} />
        <NumField label="End" step={0.05} value={line.end} onChange={end => set({ end: Math.max(line.start + 0.1, end) })} />
      </div>
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={() => set({ start: time, end: Math.max(time + 0.1, line.end) })}>Start = playhead</Btn>
        <Btn onClick={() => set({ end: Math.max(line.start + 0.1, time) })}>End = playhead</Btn>
        <Btn tone="danger" onClick={() => { update(s => ({ ...s, dialogue: s.dialogue.filter(l => l.id !== id) })); select({ type: 'scene' }); }}>Delete</Btn>
      </div>
      <p className="text-[11px] text-gray-500">Without a voice clip, the mouth flaps to the syllables of this text. With a voice clip assigned to the character, the audio drives the mouth instead.</p>
    </Section>
  );
};

const ClipInspector: React.FC<{ scene: Scene; id: string; update: Update; select: Props['select']; time: number }> = ({ scene, id, update, select, time }) => {
  const clip = scene.audio.find(c => c.id === id);
  if (!clip) return null;
  const chars = scene.layers.filter(l => l.kind === 'character');
  const set = (p: Partial<AudioClip>) => update(s => ({ ...s, audio: s.audio.map(c => (c.id === id ? { ...c, ...p } : c)) }));
  return (
    <Section title="Audio clip">
      <input value={clip.name} onChange={e => set({ name: e.target.value })}
        className="w-full bg-base-100 border border-base-300 rounded px-2 py-1 text-sm text-gray-100" />
      <div className="flex gap-1">
        {(['voice', 'ambient', 'sfx'] as ClipRole[]).map(r => (
          <Btn key={r} className={clip.role === r ? '!bg-violet-600/70' : ''} onClick={() => set({ role: r, loop: r === 'ambient' ? true : clip.loop })}>{r}</Btn>
        ))}
      </div>
      {clip.role === 'voice' && (
        <label className="block text-[11px] text-gray-400">Drives the mouth of
          <select value={clip.characterId || ''} onChange={e => set({ characterId: e.target.value || undefined })}
            className="mt-0.5 w-full bg-base-100 border border-base-300 rounded px-2 py-1 text-sm text-gray-100">
            <option value="">— nobody —</option>
            {chars.map(c => <option key={c.id} value={c.id}>{c.name}</option>)}
          </select>
        </label>
      )}
      <div className="grid grid-cols-2 gap-2">
        <NumField label="Start" step={0.05} value={clip.start} onChange={start => set({ start: Math.max(0, start) })} />
        <div className="text-[11px] text-gray-500 self-center">Length {clip.duration ? clip.duration.toFixed(2) + 's' : '…'}</div>
      </div>
      <Slider label="Volume" value={clip.gain} min={0} max={2} onChange={gain => set({ gain })} fmt={v => `${Math.round(v * 100)}%`} />
      <Toggle label="Loop to the end of the scene" checked={clip.loop} onChange={loop => set({ loop })} />
      <div className="flex flex-wrap gap-1.5">
        <Btn onClick={() => set({ start: time })}>Start = playhead</Btn>
        {clip.role === 'voice' && clip.characterId && clip.duration && (
          <Btn onClick={() => update(s => ({ ...s, dialogue: [...s.dialogue, { id: uid('line'), characterId: clip.characterId!, start: clip.start, end: clip.start + clip.duration!, text: clip.name }] }))}>+ Subtitle line for clip</Btn>
        )}
        <Btn tone="danger" onClick={() => { update(s => ({ ...s, audio: s.audio.filter(c => c.id !== id) })); select({ type: 'scene' }); }}>Delete</Btn>
      </div>
    </Section>
  );
};

const CamInspector: React.FC<{ scene: Scene; id: string; update: Update; select: Props['select'] }> = ({ scene, id, update, select }) => {
  const key = scene.camera.find(k => k.id === id);
  if (!key) return null;
  const set = (p: Partial<typeof key>) => update(s => ({ ...s, camera: s.camera.map(k => (k.id === id ? { ...k, ...p } : k)) }));
  return (
    <Section title="Camera key">
      <NumField label="Time" step={0.05} value={key.t} onChange={t => set({ t: Math.max(0, t) })} />
      <Slider label="Pan X" value={key.x} min={-600} max={600} step={1} onChange={x => set({ x })} fmt={v => v.toFixed(0)} />
      <Slider label="Pan Y" value={key.y} min={-400} max={400} step={1} onChange={y => set({ y })} fmt={v => v.toFixed(0)} />
      <Slider label="Zoom" value={key.zoom} min={0.5} max={3} onChange={zoom => set({ zoom })} fmt={v => `${Math.round(v * 100)}%`} />
      <Btn tone="danger" onClick={() => { update(s => ({ ...s, camera: s.camera.filter(k => k.id !== id) })); select({ type: 'scene' }); }}>Delete key</Btn>
      <p className="text-[11px] text-gray-500">Camera moves ease between keys. Layers move by their parallax, so the sky barely moves and the characters move most.</p>
    </Section>
  );
};

const CueInspector: React.FC<{ scene: Scene; id: string; layerId: string; update: Update; select: Props['select'] }> = ({ scene, id, layerId, update, select }) => {
  const ch = scene.layers.find(l => l.id === layerId) as CharacterLayer | undefined;
  const cue = ch?.poseCues.find(c => c.id === id);
  if (!ch || !cue) return null;
  const set = (p: Partial<typeof cue>) => update(s => patchLayer(s, layerId, l => ({ ...(l as CharacterLayer), poseCues: (l as CharacterLayer).poseCues.map(c => c.id === id ? { ...c, ...p } : c) })));
  return (
    <Section title={`Pose change · ${ch.name}`}>
      <NumField label="Time" step={0.05} value={cue.t} onChange={t => set({ t: Math.max(0, t) })} />
      <select value={cue.poseId} onChange={e => set({ poseId: e.target.value })}
        className="w-full bg-base-100 border border-base-300 rounded px-2 py-1 text-sm text-gray-100">
        {ch.poses.map(p => <option key={p.id} value={p.id}>{p.name}</option>)}
      </select>
      <div className="flex gap-1.5">
        <Btn onClick={() => select({ type: 'layer', id: layerId })}>Open character</Btn>
        <Btn tone="danger" onClick={() => { update(s => patchLayer(s, layerId, l => ({ ...(l as CharacterLayer), poseCues: (l as CharacterLayer).poseCues.filter(c => c.id !== id) }))); select({ type: 'layer', id: layerId }); }}>Delete</Btn>
      </div>
    </Section>
  );
};

// ------------------------------------------------------------------ effects

const FxInspector: React.FC<{ L: FxLayer; scene: Scene; time: number; update: Update }> = ({ L, scene, time, update }) => {
  const set = (p: Partial<FxLayer>) => update(s => patchLayer(s, L.id, p as Partial<Layer>));
  const isLines = L.fx === 'speedlines';
  return (
    <>
      <Section title="Anime effect">
        <div className="grid grid-cols-2 gap-1">
          {(Object.keys(FX_PRESETS) as FxKind[]).map(k => (
            <Btn key={k} className={L.fx === k ? '!bg-violet-600/70' : ''}
              onClick={() => { const p = FX_PRESETS[k]; set({ fx: k, name: `${p.name} ${p.jp}`, density: p.density, size: p.size, speed: p.speed, wind: p.wind, color: p.color }); }}>
              {FX_PRESETS[k].jp} <span className="text-gray-400">{FX_PRESETS[k].name}</span>
            </Btn>
          ))}
        </div>
      </Section>
      <Section title="When">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="From" step={0.05} value={L.start} onChange={start => set({ start: Math.max(0, Math.min(start, L.end - 0.1)) })} />
          <NumField label="To" step={0.05} value={L.end} onChange={end => set({ end: Math.max(L.start + 0.1, end) })} />
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Btn onClick={() => set({ start: Math.min(time, L.end - 0.1) })}>From = playhead</Btn>
          <Btn onClick={() => set({ end: Math.max(L.start + 0.1, time) })}>To = playhead</Btn>
          <Btn onClick={() => set({ start: 0, end: scene.duration })}>Whole scene</Btn>
        </div>
        <p className="text-[11px] text-gray-500">Fades in and out over 0.4 s. Drag the pink block on the timeline to move it.</p>
      </Section>
      <Section title="Look">
        <Slider label={isLines ? 'Number of lines' : 'Amount'} value={L.density} min={isLines ? 20 : 5} max={isLines ? 200 : 300} step={1} onChange={density => set({ density })} fmt={v => v.toFixed(0)} />
        <Slider label={isLines ? 'Open centre (smaller = tighter)' : 'Size'} value={L.size} min={0.3} max={3} onChange={size => set({ size })} />
        <Slider label={isLines ? 'Flicker rate' : 'Speed'} value={L.speed} min={0.1} max={3} onChange={speed => set({ speed })} />
        {!isLines && <Slider label="Wind" value={L.wind} min={-1} max={1} onChange={wind => set({ wind })} />}
        <Slider label="Opacity" value={L.opacity} min={0} max={1} onChange={opacity => set({ opacity })} fmt={v => `${Math.round(v * 100)}%`} />
        <label className="flex items-center gap-2 text-[11px] text-gray-400">Colour
          <input type="color" value={L.color} onChange={e => set({ color: e.target.value })} className="w-7 h-6 bg-transparent" />
          {isLines && <><Btn onClick={() => set({ color: '#ffffff' })}>White</Btn><Btn onClick={() => set({ color: '#111111' })}>Black (manga)</Btn></>}
        </label>
        <div className="flex gap-3">
          <Toggle label="Mirror" checked={L.flip} onChange={flip => set({ flip })} />
          <Btn onClick={() => set({ seed: Math.floor(Math.random() * 1e6) })}>Shuffle</Btn>
        </div>
        <p className="text-[11px] text-gray-500">Move this effect up or down in the cel list to put it in front of or behind the characters.</p>
      </Section>
    </>
  );
};

// ------------------------------------------------------------------ anime finish

const LookSection: React.FC<{ scene: Scene; update: Update }> = ({ scene, update }) => {
  const look = lookOf(scene);
  const set = (p: Partial<Look>) => update(s => ({ ...s, look: { ...lookOf(s), ...p } }));
  const pct = (v: number) => `${Math.round(v * 100)}%`;
  return (
    <Section title="Anime look · 撮影">
      <div className="grid grid-cols-2 gap-1.5">
        {LOOKS.map(o => (
          <button key={o.id} title={o.hint}
            onClick={() => update(s => ({ ...s, look: { ...o.look, letterbox: lookOf(s).letterbox } }))}
            className={`text-left rounded-md px-2 py-1.5 border transition-colors ${look.preset === o.id ? 'border-violet-400 bg-violet-500/20' : 'border-base-300 hover:bg-base-300/50'}`}>
            <div className="text-xs text-gray-100">{o.jp}</div>
            <div className="text-[10px] text-gray-400">{o.name}</div>
          </button>
        ))}
      </div>
      <p className="text-[11px] text-gray-500">{LOOKS.find(o => o.id === look.preset)?.hint} Fine-tune below.</p>
      <Toggle label="Cinema letterbox (2.39:1)" checked={look.letterbox} onChange={letterbox => set({ letterbox })} />
      <details className="group">
        <summary className="cursor-pointer text-[11px] text-violet-300 select-none">Adjust the finish</summary>
        <div className="space-y-2 mt-2">
          <Slider label="Diffusion glow" value={look.diffusion} min={0} max={1} onChange={diffusion => set({ diffusion })} fmt={pct} />
          <Slider label="Punch (contrast)" value={look.punch} min={0} max={1} onChange={punch => set({ punch })} fmt={pct} />
          <Slider label="Desaturate" value={look.desaturate} min={0} max={1} onChange={desaturate => set({ desaturate })} fmt={pct} />
          <Slider label="Faded blacks" value={look.fade} min={0} max={1} onChange={fade => set({ fade })} fmt={pct} />
          <div className="flex items-center gap-2 text-[11px] text-gray-400">
            Grade <input type="color" value={look.gradeTop} onChange={e => set({ gradeTop: e.target.value })} className="w-7 h-6 bg-transparent" title="Top (sky)" />
            → <input type="color" value={look.gradeBottom} onChange={e => set({ gradeBottom: e.target.value })} className="w-7 h-6 bg-transparent" title="Bottom (ground)" />
          </div>
          <Slider label="Grade strength" value={look.grade} min={0} max={1} onChange={grade => set({ grade })} fmt={pct} />
          <Slider label="Sun rays" value={look.rays} min={0} max={1} onChange={rays => set({ rays })} fmt={pct} />
          {look.rays > 0 && <>
            <Slider label="Sun X" value={look.raysX} min={-0.2} max={1.2} onChange={raysX => set({ raysX })} fmt={pct} />
            <Slider label="Sun Y" value={look.raysY} min={-0.2} max={1.2} onChange={raysY => set({ raysY })} fmt={pct} />
            <label className="flex items-center gap-2 text-[11px] text-gray-400">Ray colour <input type="color" value={look.raysColor} onChange={e => set({ raysColor: e.target.value })} className="w-7 h-6 bg-transparent" /></label>
          </>}
          <Slider label="Night (darken)" value={look.darken ?? 0} min={0} max={1} onChange={darken => set({ darken })} fmt={pct} />
          <Slider label="Vignette" value={look.vignette} min={0} max={1} onChange={vignette => set({ vignette })} fmt={pct} />
          <Slider label="Film grain" value={look.grain} min={0} max={1} onChange={grain => set({ grain })} fmt={pct} />
        </div>
      </details>
    </Section>
  );
};

// ------------------------------------------------------------------ scene

const SceneInspector: React.FC<{ scene: Scene; time: number; update: Update; select: Props['select']; run: Props['run'] }> = ({ scene, time, update, select, run }) => {
  const addAudio = (files: File[], role: ClipRole) => run('Importing audio', async () => {
    const clips: AudioClip[] = [];
    for (const f of files) {
      const src = await fileToDataURL(f);
      const buf = await decodeAudio(src);
      const firstChar = scene.layers.find(l => l.kind === 'character');
      clips.push({
        id: uid('clip'), name: baseName(f), role, src, start: role === 'ambient' ? 0 : Math.round(time * 20) / 20,
        gain: role === 'ambient' ? 0.5 : 1, loop: role === 'ambient', duration: buf.duration,
        characterId: role === 'voice' ? firstChar?.id : undefined,
      });
    }
    update(s => ({ ...s, audio: [...s.audio, ...clips] }));
    if (clips[0]) select({ type: 'clip', id: clips[0].id });
  });
  const cam = cameraAt(scene, time);
  return (
    <>
      <LookSection scene={scene} update={update} />
      <Section title="Scene">
        <div className="grid grid-cols-2 gap-2">
          <NumField label="Length (s)" step={0.5} value={scene.duration} onChange={duration => update(s => ({ ...s, duration: Math.max(1, duration) }))} />
          <NumField label="FPS" value={scene.fps} onChange={fps => update(s => ({ ...s, fps: Math.min(60, Math.max(12, Math.round(fps))) }))} />
        </div>
        <label className="block text-[11px] text-gray-400">Frame
          <select value={scene.aspect} onChange={e => update(s => ({ ...s, aspect: e.target.value as AspectId }))}
            className="mt-0.5 w-full bg-base-100 border border-base-300 rounded px-2 py-1 text-sm text-gray-100">
            {(Object.keys(ASPECTS) as AspectId[]).map(a => <option key={a} value={a}>{ASPECTS[a].label} ({ASPECTS[a].w}×{ASPECTS[a].h})</option>)}
          </select>
        </label>
        <Slider label="Mouth changes / second" value={scene.mouthRate} min={6} max={24} step={1} onChange={mouthRate => update(s => ({ ...s, mouthRate }))} fmt={v => `${v} (${v === 12 ? 'anime “on twos”' : v < 12 ? 'choppier' : 'smoother'})`} />
        <Toggle label="Burn in subtitles" checked={scene.subtitles} onChange={subtitles => update(s => ({ ...s, subtitles }))} />
        <label className="flex items-center gap-2 text-[11px] text-gray-400">Backdrop
          <input type="color" value={scene.background} onChange={e => update(s => ({ ...s, background: e.target.value }))} className="w-7 h-6 bg-transparent" />
        </label>
      </Section>
      <Section title="Sound">
        <div className="flex flex-wrap gap-1.5">
          <FileBtn accept="audio/*" multiple tone="primary" onFiles={f => addAudio(f, 'voice')}>+ Voice (VO)</FileBtn>
          <FileBtn accept="audio/*" multiple onFiles={f => addAudio(f, 'ambient')}>+ Ambience</FileBtn>
          <FileBtn accept="audio/*" multiple onFiles={f => addAudio(f, 'sfx')}>+ SFX</FileBtn>
        </div>
        <p className="text-[11px] text-gray-500">Voice clips are placed at the playhead. Assign each to a character and its loudness drives that character's mouth (ElevenLabs exports work well, one file per line).</p>
      </Section>
      <Section title="Camera">
        <p className="text-[11px] text-gray-400 font-mono">Now: x {cam.x.toFixed(0)} · y {cam.y.toFixed(0)} · zoom {cam.zoom.toFixed(2)}</p>
        <Btn onClick={() => {
          const k = { id: uid('cam'), t: Math.round(time * 20) / 20, x: cam.x, y: cam.y, zoom: cam.zoom };
          update(s => ({ ...s, camera: [...s.camera.filter(c => Math.abs(c.t - k.t) > 1e-3), k] }));
          select({ type: 'cam', id: k.id });
        }}>+ Camera key at {fmtTime(time)}</Btn>
      </Section>
    </>
  );
};

const Inspector: React.FC<Props> = ({ scene, time, selection, update, select, run }) => {
  if (selection.type === 'layer') {
    const L = scene.layers.find(l => l.id === selection.id);
    if (L?.kind === 'image') return <ImageInspector key={L.id} L={L} update={update} run={run} />;
    if (L?.kind === 'fx') return <FxInspector key={L.id} L={L} scene={scene} time={time} update={update} />;
    if (L?.kind === 'character') return <CharacterInspector key={L.id} ch={L} scene={scene} time={time} update={update} select={select} run={run} />;
  }
  if (selection.type === 'line') return <LineInspector scene={scene} id={selection.id} update={update} select={select} time={time} />;
  if (selection.type === 'clip') return <ClipInspector scene={scene} id={selection.id} update={update} select={select} time={time} />;
  if (selection.type === 'cam') return <CamInspector scene={scene} id={selection.id} update={update} select={select} />;
  if (selection.type === 'cue') return <CueInspector scene={scene} id={selection.id} layerId={selection.layerId} update={update} select={select} />;
  return <SceneInspector scene={scene} time={time} update={update} select={select} run={run} />;
};

export default Inspector;
