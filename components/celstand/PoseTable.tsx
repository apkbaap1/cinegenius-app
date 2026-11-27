import React, { useEffect, useRef, useState } from 'react';
import { CharacterLayer, MOUTH_SLOTS, MouthSlot, Pose, Scene } from './types';
import { getHueShifted, getImage, getTinted } from './assets';
import { Drawing, drawingAt, drawingKey, drawingLayers, faceBoxOf, frameAt, slotLevel } from './sheet';
import { contentBox } from './imageTools';
import { Btn } from './ui';

type Update = (fn: (s: Scene) => Scene) => void;

/** Face close-up of one drawing (pose × mouth), drawn like the stage draws it. */
const Cell: React.FC<{ ch: CharacterLayer; pose: Pose; slot: MouthSlot; box: [number, number, number, number] | null; on: boolean; onClick: () => void; label: string }> =
  ({ ch, pose, slot, box, on, onClick, label }) => {
    const ref = useRef<HTMLCanvasElement>(null);
    useEffect(() => {
      const c = ref.current;
      if (!c || !box) return;
      const d: Drawing = { frame: 0, pose, slot, level: slotLevel(slot), blinking: slot === 'blink', source: 'edit' };
      const { base, overlays } = drawingLayers(ch, d);
      const g = c.getContext('2d')!;
      g.clearRect(0, 0, c.width, c.height);
      const draw = (src?: string) => { const im = getImage(src); if (im) g.drawImage(im, box[0], box[1], box[2], box[3], 0, 0, c.width, c.height); };
      draw(base);
      if (pose.jacketSrc) {
        const j = ch.jacketMode === 'hue' ? getHueShifted(pose.jacketSrc, ch.jacketHue ?? 0) : getTinted(pose.jacketSrc, ch.jacketColor, ch.jacketStrength);
        if (j) g.drawImage(j, box[0], box[1], box[2], box[3], 0, 0, c.width, c.height);
      }
      overlays.forEach(draw);
    });
    return (
      <button onClick={onClick} title={label} aria-label={label}
        className={`relative rounded overflow-hidden bg-[#f3e9de] transition-all ${on ? 'ring-[3px] ring-amber-400 opacity-100 scale-[1.04] z-10' : 'opacity-70 hover:opacity-100'}`}
        style={{ aspectRatio: '337 / 273' }}>
        <canvas ref={ref} width={168} height={136} className="w-full h-full block" />
      </button>
    );
  };

const PoseTable: React.FC<{ scene: Scene; ch: CharacterLayer; time: number; update: Update }> = ({ scene, ch, time, update }) => {
  const [mode, setMode] = useState<'pin' | 'paint'>('pin');
  const [mouthBox, setMouthBox] = useState<[number, number, number, number] | null | undefined>(undefined);
  const first = ch.poses[0];
  const img = getImage(first?.src);

  useEffect(() => {
    let on = true;
    const src = ch.mouths[0]?.src ?? ch.blinkSrc;
    if (!src) { setMouthBox(null); return; }
    contentBox(src).then(b => on && setMouthBox(b));
    return () => { on = false; };
  }, [ch.mouths, ch.blinkSrc]);

  if (!first) return <p className="text-[11px] text-gray-500">Add pose cels to see the table.</p>;
  const box = img && mouthBox !== undefined ? faceBoxOf(ch, img.naturalWidth, img.naturalHeight, mouthBox ?? undefined) : null;
  const cur = drawingAt(scene, ch, time);
  const curKey = drawingKey(cur);
  const frame = frameAt(scene, time);
  const edits = Object.keys(ch.sheetEdits ?? {}).length;

  const patch = (fn: (c: CharacterLayer) => CharacterLayer) =>
    update(s => ({ ...s, layers: s.layers.map(l => (l.id === ch.id && l.kind === 'character' ? fn(l) : l)) }));

  const click = (pose: Pose, slot: MouthSlot) => {
    if (mode === 'pin') patch(c => ({ ...c, pinnedPoseId: c.pinnedPoseId === pose.id ? undefined : pose.id }));
    else patch(c => ({ ...c, sheetEdits: { ...(c.sheetEdits ?? {}), [frame]: `${pose.id}|${slot}` } }));
  };

  return (
    <div className="space-y-2">
      <div className="grid gap-1 items-center" style={{ gridTemplateColumns: '58px repeat(4, minmax(0, 1fr))' }}>
        <div />
        {MOUTH_SLOTS.map(m => <div key={m.id} className="text-[10px] text-gray-400 text-center leading-tight">{m.jp}<br /><span className="text-gray-500">{m.name}</span></div>)}
        {ch.poses.map(p => (
          <React.Fragment key={p.id}>
            <div className={`text-[11px] text-right pr-1 leading-tight truncate ${ch.pinnedPoseId === p.id ? 'text-red-400 font-semibold' : 'text-gray-300'}`} title={p.name}>
              {ch.pinnedPoseId === p.id ? '📌 ' : ''}{p.name}
            </div>
            {MOUTH_SLOTS.map(m => (
              <Cell key={m.id} ch={ch} pose={p} slot={m.id} box={box} on={curKey === `${p.id}|${m.id}`}
                label={`${p.name} · ${m.name}`} onClick={() => click(p, m.id)} />
            ))}
          </React.Fragment>
        ))}
      </div>
      <div className="flex rounded-md overflow-hidden border border-base-300 w-fit text-[11px]">
        <button onClick={() => setMode('pin')} className={`px-2 py-1 ${mode === 'pin' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Click = lock pose</button>
        <button onClick={() => setMode('paint')} className={`px-2 py-1 ${mode === 'paint' ? 'bg-violet-600 text-white' : 'text-gray-400'}`}>Click = set frame {frame}</button>
      </div>
      <div className="flex flex-wrap gap-1.5">
        {ch.pinnedPoseId && <Btn onClick={() => patch(c => ({ ...c, pinnedPoseId: undefined }))}>Unlock pose (follow script)</Btn>}
        {ch.sheetEdits?.[frame] && <Btn onClick={() => patch(c => { const e = { ...(c.sheetEdits ?? {}) }; delete e[frame]; return { ...c, sheetEdits: e }; })}>Clear frame {frame}</Btn>}
        {edits > 0 && <Btn tone="danger" onClick={() => patch(c => ({ ...c, sheetEdits: {} }))}>Clear {edits} hand edit{edits > 1 ? 's' : ''}</Btn>}
      </div>
      <p className="text-[11px] text-gray-500">
        The gold cell is the drawing on screen now (frame {frame}, {cur.source === 'edit' ? 'hand-set' : cur.source === 'voice' ? 'from the voice' : cur.source === 'text' ? 'from the text' : 'silent'}).
        Locking a pose keeps the mouths following the dialogue, like ポーズを固定. Painting sets one frame of the exposure sheet by hand.
      </p>
    </div>
  );
};

export default PoseTable;
