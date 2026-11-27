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

## Japanese anime style

- **Anime look · 撮影** (Scene settings): one-click compositing finishes: テレビアニメ TV anime, 空と光 Sky drama,
  水彩・田園 Watercolour pastoral, レトロ・セル Retro 80s cel, 夕焼け Golden hour, 夜景 Night lights. Each is
  adjustable: diffusion glow, punch, desaturate, faded blacks, two-colour grade, sun rays (透過光), night darkening,
  vignette, film grain, and a 2.39:1 cinema letterbox (subtitles move into the bar).
- **Anime effects** (*✨ + Anime effect…*): 桜吹雪 sakura petals, 光の粒 light particles, 雪 snow, 雨 rain, 蛍 fireflies,
  集中線 speed lines (white, or black for a manga feel). Each one is timed on the timeline's ✨ lane and can sit
  in front of or behind the characters.
- **🎨 Anime art prompts**: image-generator prompts in 7 anime styles (TV, cinematic sky, watercolour pastoral,
  retro cel, shoujo, shounen, chibi) for a base cel plus *edit* prompts for poses, 4 mouths and blink, so the cels line up,
  and a background prompt built for the splitter. Every prompt, with its negative, stays under 10,000 characters.
- The demo scene is drawn in anime style: glossy two-highlight eyes, pointed bangs with a highlight ring,
  two-tone cel shading, 入道雲 cumulonimbus, utility poles (電柱) and a riverbank.

## Like a real cel stand (exposure sheet, table, masks, 3D)

- **Exposure sheet (タイムシート)**: every character has a per-frame drawing schedule at the mouth rate
  (12/s = on twos). It's built from pose cues, lip-sync and blinks; ticks on each character's timeline lane mark every drawing change.
- **Pose × mouth table (ポーズ×口)**: face close-ups of every drawing, closed / half / open / blink for each pose.
  The drawing on screen lights up gold. *Click = lock pose* pins a pose while the mouths keep following the dialogue;
  *Click = set frame* paints that frame of the sheet by hand (clear edits any time).
- **Complete drawings per pose**: *Drawings…* on a pose takes full cels with the mouth or eyes drawn in
  (`…closed`, `…half`, `…open`, `…blink`), like hand-animated drawings. Without them, mouth and blink overlays are used.
- **Water mask (水面マスク)**: only masked pixels ripple (*Auto from water colour*, or upload a mask). The background
  splitter builds one automatically. **Shoreline wash (波打ち際)** moves a beach line up and down.
- **3D layers (分解)**: the cels spread out in depth on tilted glass with labels. Scenes open with this as an intro,
  sheets flying in back to front, then settle into the picture (skipped for reduced-motion users; click to skip).
- Characters **resize from their feet**. Ambience can be **linked to a layer**: it plays only while that layer is
  visible, so swapping river → sea crossfades the sound. Jackets can **turn the hue** (keeps the drawn colour variation) as well as paint a colour.

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
| `look.ts` | Anime compositing finish (撮影) |
| `sheet.ts` | Exposure sheet: which drawing shows on each frame |
| `PoseTable.tsx` | Pose × mouth table |
| `breakdown.ts` | 3D layer breakdown and intro |
| `fx.ts` | Anime effects: petals, particles, snow, rain, fireflies, speed lines |
| `demo.ts`, `demoArt.ts` | The starter scene and its anime-style art, drawn in code |
| `ArtPrompts.tsx` | Image-generator prompt builder for cels that line up |
| `CelStand.tsx`, `Inspector.tsx`, `Timeline.tsx`, `SplitDialog.tsx` | Editor UI |
