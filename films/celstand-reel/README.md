# Cel Stand reel: "ఇది AI video కాదు"

A 71-second 9:16 explainer reel for @ashokkumar.ai, plus the 16-second clip it explains.
Both are made the Cel Stand way: **no generated video**. Every frame is drawn by code in the browser.

| File | What it is |
|---|---|
| `clipScene.ts` | The clip as a real Cel Stand scene: Ashok's clay avatar + the Claude emoji by a river, lip-synced to the VO, swapping to the sea on a click |
| `clip.celstand.json` | The same scene for **Open** in the Cel Stand editor (asset URLs point at the local dev server) |
| `reel.html`, `reel.ts` | The reel as a web page. `window.__seek(t)` draws the frame at `t`; open `reel.html` to watch a live preview |
| `assets/` | Cels (pose × mouth/blink drawings made from the character sheets), clay backgrounds and water masks, `editor.webp` |
| `assets/audio/` | Voice lines split from the clip VO, the explainer VO, code-synthesized ambience, SFX and music bed |
| `tools/record.cjs` | Steps the page frame by frame (30 fps) and saves JPEG frames with Playwright |
| `tools/mix.py` | FFmpeg: encodes frames to H.264 and mixes the audio from the reel's cue sheet (music ducks under the VO) |

## Render

```bash
npx vite --port 5173                     # from the repo root
node films/celstand-reel/tools/record.cjs /tmp/frames_reel          # the reel
python3 films/celstand-reel/tools/mix.py /tmp/frames_reel reel.mp4
node films/celstand-reel/tools/record.cjs /tmp/frames_clip clip     # the 16 s clip only
python3 films/celstand-reel/tools/mix.py /tmp/frames_clip clip.mp4 clip
```

## How the art was made

- **Ashok:** from one clay avatar image. Mouth half/open drawn as clay mouths, the original mouth line painted out
  with OpenCV inpainting; blink and a "surprised" pose (brows lifted) made the same way. 2 poses × 4 drawings.
- **Claude:** from the two-pose emoji sheet. The happy pose's open mouth is the original; closed and half-open
  mouths and blinks are inpainted/redrawn. Happy (4 drawings) + Thinking (2 drawings).
- **Backgrounds:** painted in code in a clay style: shapes are lit through a height map (blur → slope → light),
  so clouds, hills and grass match the avatar. River and sea versions, each with a water mask.

## Section map (reel seconds)

0–16.4 the clip · 16.6 rewind + "0 AI video frames" · 22 code takeover · 23.5 web app · 24.7 canvas paints the
layers · 28.9 3D layers (sky, clouds, water, characters spotlighted as named) · 37.2 motion = code (clouds, water mask) ·
41.4 voice → 12 mouth changes a second (waveform + pose table) · 46.7 one click river → sea · 52 built with Claude Code ·
54.7 the tools · 58.2 WebCodecs → MP4 · 62 comment "ANIME" · 67.2 back to the opening shot (loops).
