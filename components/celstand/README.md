# Cel Stand

A browser "cel photography stand" for anime-style scenes made **without generative video**.
Art stays as flat cels (PNG layers); the code moves them, animates clouds and water,
switches poses, picks mouth shapes from the voice, and renders the video. Everything stays
editable after the scene is "finished": swap the background, move a character, recolour a jacket,
then export again.

Open it from the header (**Cel Stand**) or go to `/#cel-stand`.

## Workflow

1. **Background**: *✂ Background from 1 painting*. Upload one image, set the horizon and the
   water band, and it becomes three cels: **Sky** (a clean gradient), **Clouds** (drift sideways)
   and **Scenery** (the water band ripples). You can also add any PNG with *+ Image cel*.
2. **Characters**: *+ Character*, then upload:
   - **Pose cels**: one PNG per pose (neutral, wave, happy…). The flat background is removed on import.
   - **Mouth cels**: closed → wide (name them `mouth_0…mouth_3`); each gets an *openness* value.
   - **Closed-eyes cel** for automatic blinking (optional).
   - All cels of one character must be the **same canvas size and aligned**, like sheets on a stand.
3. **Jacket recolour**: on a pose, *Jacket…* → click the jacket to pick its colour → *Lift from this
   pose / All poses*. The jacket goes onto its own cel, and the colour swatches recolour it live while keeping its shading.
4. **Dialogue + voice**:
   - *+ Dialogue at playhead* on a character writes a line (Telugu script works and is burned in as subtitles).
   - *+ Voice (VO)* in Scene settings adds audio at the playhead (e.g. one ElevenLabs file per line). Assign it
     to a character and its loudness drives that character's mouth. Lines without audio flap to their syllables.
   - *+ Ambience / + SFX* for beds and effects (Epidemic Sound etc.).
5. **Timing**: drag blocks on the timeline. **Cue ▸** on a pose adds a pose change (red marker) at the playhead.
   *+ Camera key* adds an eased pan/zoom key; each layer's *parallax* sets how much it follows the camera.
6. **Export video**: frame-accurate MP4 (H.264) rendered with WebCodecs (Chrome / Edge / recent Safari).
   Other browsers fall back to real-time recording (keep the tab visible). **Save project** writes one
   `.celstand.json` with all art, audio and timing, which you can open again later to edit.

Shortcuts: Space play/pause · ←/→ step a frame · arrows nudge the selected cel · Del remove · Ctrl+Z / Ctrl+Shift+Z.

## Code map

| File | Role |
|---|---|
| `types.ts` | Scene data model (plain JSON) |
| `renderer.ts` | Draws a frame: camera + parallax, cloud drift, water ripple, characters, subtitles, split-cel view |
| `lipsync.ts` | Voice-loudness and text-syllable mouth picking, quantised to the mouth rate (12/s = anime "on twos") |
| `imageTools.ts` | Background split, flat-background removal, jacket isolation |
| `exporter.ts` | WebCodecs H.264 + AAC/Opus → MP4 (`mp4-muxer`) |
| `playback.ts` | Audio playback in sync with the timeline; real-time recording fallback |
| `demo.ts` | The starter scene, drawn in code |
| `CelStand.tsx`, `Inspector.tsx`, `Timeline.tsx`, `SplitDialog.tsx` | Editor UI |
