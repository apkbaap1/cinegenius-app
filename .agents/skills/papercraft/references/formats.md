# Formats: aspect ratios, resolutions, safe areas and export

How to make the same paper world for any frame: a 16:9 film, a 9:16 Reel, a square or 4:5 post, a 4K master, an
ultrawide still, a phone page. What the harness does for each shape, the standard sizes per destination, where a
vertical platform covers the frame, what scales with resolution, and how to export a video every platform takes.

Read this when: the brief names a platform, a screen or a size (Reels, TikTok, Shorts, YouTube, a poster, 4K, "for
mobile"), or any frame that is not 16:9; before you capture deliverables; before you export a video.

Contents: 1 One world, many frames; 2 How the harness frames a shape; 3 Composition by shape; 4 Standard formats;
5 Vertical video: safe areas and feed crops; 6 What scales with resolution; 7 Video export; 8 Interactive pages on
phones; 9 Checks

## 1. One world, many frames

- **Author for 16:9, deliver in any shape.** Every number in this skill (lens, band, blur, hero size, density) was
  calibrated on 16:9 frames. Write the view for 16:9; the harness derives every other shape from it, so one scene
  serves a YouTube cut, a Reel and a square post without three sets of numbers.
- **The same world in every format.** A format only decides how much of the world the frame shows and from where.
  The printed sheet covers every shape from 9:16 to 2.39:1, and a fill seeded per cell (each grid cell its own seed,
  `worlds.md` section 6) builds the same pieces in the same places, whichever frame is open. A fill drawn from one
  running stream gives each format a different world.
- **Name the format in the spec** (the FORMAT line: aspect, pixel size, fps, length, platform) before the first
  capture, and capture every review frame at that size: a frame checked at 16:9 says little about the Reel.

## 2. How the harness frames a shape

Both templates take the output frame from `?size=1080x1920` (exactly those pixels, shown scaled to fit the window), or
`?aspect=9:16` (the largest frame of that shape in the window), or the window itself (createHarness options `size`,
`aspect`). `capture.py --size reel` passes the size for you. Then:

| Shape | What the frame shows | Subject |
|---|---|---|
| Wider than 16:9 (21:9, 2.39:1) | the same height, more world at the sides | where you put it |
| 16:9 | the authored view | where you put it (off-centre, on a third) |
| 16:10, 3:2, 4:3, 1:1 | the same height, less at the sides | swings toward the middle as the frame narrows |
| 4:5, 3:4 | the short side keeps the lens; a little taller; slightly closer | nearer the middle, lifted a little |
| 9:16 | the 16:9 camera turned upright, 1.33x closer | near the middle, lifted to ~42 % from the top |

- **The short side keeps the lens.** A frame taller than wide is the 16:9 camera turned on its side: its width sees
  what the 16:9 frame's height sees, so the perspective, the lens and the hero's size against the short side stay
  as calibrated, and the frame gains world above (far rows) and below (near rows, big blurred cards).
- **Tall frames come closer** (`view.closer`, default 1.33 at 9:16, less toward square): on a phone the whole frame
  is a few centimetres wide, and the turned camera leaves the hero tiny. 1 shows the most world; 1.78 is the 16:9
  frame's own height, a close-up. Closer is a crop from the same camera, so the perspective does not change.
- **Narrow frames swing toward the subject** (`subject: [x, z]`, the hero's start or the landmark; default `focus`),
  so a hero on the right third of 16:9 does not fall off a 9:16 frame. Without a subject the harness warns when he
  sits at the edge.
- **Tall frames lift the subject** to ~42 % from the top (`view.subjectY`, -1 bottom .. 1 top), clear of the
  captions and buttons a vertical platform lays over the lower third (section 5). The walking camera keeps him there.
- **The lens band keeps its size on the page**: in a tall frame it covers a smaller share of the height, so more of
  the frame is blurred, the stronger miniature look vertical tilt-shift photographs have. Blur, lines and grain
  scale with the short side (`PaperPost.bandScale`, `magnify`).
- **Prints follow the resolution**: a bigger frame, a closer tall frame or a closer camera prints finer
  (`H.frame.printScale`; `?res=` sets it); the live window keeps 1x so phones build fast.
- `H.frame` = { w, h, aspect, fovY, wide, tall, lat, mag, printScale }: branch on it when a format needs its own
  touch (a taller backdrop, a different landmark in a square frame).
- 2D (`harness-2d.js`): the same rules (size, aspect, subject, view.closer, view.subjectY). The world is built for
  the frame the page opens with; `H.frame.cx` and `H.frame.half(z)` place things across its actual width. It has
  no `?safe` overlay and none of the film hooks (`web-2d.md` section 7).

## 3. Composition by shape

- **16:9 and wider:** the calibrated look. Hero off-centre on a third, a leading line crossing the frame, big
  blurred cards along the bottom edge. Ultrawide (21:9, 2.39:1) adds world at the sides: fill it; keep the pitch, a
  wide frame does not need a higher camera. A 2.39 delivery inside a 16:9 file is letterboxed (1920 x 804 image).
- **1:1 and 4:5 (feed posts):** a centred, stacked composition: the landmark above, the hero in the band, the
  leading line entering from a bottom corner. No platform UI covers a feed post, but the profile grid crops it to 3:4.
- **9:16 (Reels, Stories, TikTok, Shorts):** read from top to bottom. Far rows and a landmark at the top, the hero
  and the action in the band at ~40 % from the top, the leading line running down to the bottom edge, the lower third
  calm: blurred near cards and open page, where captions and buttons go. Keep everything that matters inside the
  safe box (section 5). The tall frame sees further up the page: the far rows need pieces (blurred, low-res prints are
  enough) and the haze; the template fills them because its fill tests the frame.
- **A phone page** (interactive) is usually portrait, ~19.5:9 to 20:9 (section 8).
- Big blurred foreground cards belong to every shape: place them across the actual frame (the templates read the
  frame's bottom edge: `H.groundAt(x, -1)` in 3D, `H.frame.cx` / `half(z)` in 2D), never at fixed 16:9 positions.

## 4. Standard formats

Recommended masters as of November 2026 (platforms change these; check the destination's current spec page before a
delivery). Sizes are width x height.

| Destination | Aspect | Size | Notes |
|---|---|---|---|
| YouTube | 16:9 | 1920x1080, 2560x1440, 3840x2160 | keep the source frame rate; 4K is worth it for a 4K master |
| YouTube Shorts | 9:16 | 1080x1920 | up to 3 min; kept at 1080p |
| Instagram Reels, Stories | 9:16 | 1080x1920 (Meta's ads guide: 1440x2560) | fixed frame rate; the feed preview is reported to crop to ~4:5 |
| Instagram feed | 4:5 / 3:4 / 1:1 | 1080x1350 / 1080x1440 / 1080x1080 | 3:4 shown uncropped since 2025; the profile grid crops every post to 3:4 |
| Facebook Reels / feed | 9:16 / 4:5 | 1440x2560 / 1440x1800 | every new Facebook video posts as a Reel (2025) |
| TikTok | 9:16 | 1080x1920 | 1:1 and 16:9 accepted, shown small |
| X | 16:9, 1:1, 9:16 | 1920x1080, 1080x1080, 1080x1920 | H.264 High, at most 60 fps, AAC-LC; non-subscribers see 720p |
| LinkedIn | 1:1, 4:5, 16:9, 9:16 | up to 4096x2304; vertical 1080x1920 | 4:5 recommended for vertical ads |
| Pinterest | 9:16 video, 2:3 images | 1080x1920, 1000x1500 | |
| Snapchat | 9:16 | 1080x1920 | |
| Cinema (DCI) | 1.85 / 2.39 | 1998x1080, 2048x858 (4K: 3996x2160, 4096x1716) | 24 fps |
| Ultrawide screens | ~21:9 | 2560x1080, 3440x1440 | |
| Classic / tablets | 4:3 | 1440x1080 | |

Frame rates: 30 (or 60) for the web, phones and social; 24 for a film look (and cinema); 25 / 50 in PAL regions,
29.97 / 59.94 for NTSC broadcast. Paper motion is designed in seconds on the fixed clock, so any rate works; 60
keeps a walking camera smooth, 24 reads more handmade (`motion.md` section 11: stop-motion on twos).

`capture.py --size` names: 1080p, 720p, 1440p, 4k, reel (= story, tiktok, shorts, vertical), reel-hd, feed
(= portrait, 4:5), grid (3:4), square, ultrawide, flat, scope, or any WxH, or a ratio (9:16 -> 1080x1920).

## 5. Vertical video: safe areas and feed crops

On a 1080x1920 frame, the platforms lay their UI over these margins (the bottom holds the caption, the right the
buttons):

| Platform | Top | Bottom | Left | Right |
|---|---|---|---|---|
| Instagram / Facebook Reels and Stories (Meta) | 14 % (269 px) | 35 % (672 px) | 6 % (65 px) | 6 % (65 px) |
| TikTok | 240 px | 660 px (more with a long caption) | 120 px | 120 px, plus a button column lower right |
| YouTube Shorts (Google's vertical diagram) | 288 px | 672 px | 48 px | 192 px |
| **All of them** | 288 px (15 %) | 672 px (35 %) | 120 px (11 %) | 192 px (18 %) |

- The box every platform leaves clear: x 120-888, y 288-1248 (768 x 960): the hero, the landmark, any text you burn
  in. If a square crop of the Reel must also read, keep the subject within y 420-1248.
- Feed crops of a 9:16 frame: 4:5 keeps y 285-1635, the 3:4 grid y 240-1680, 1:1 y 420-1500 (all centred).
- `?safe=all` (or meta, tiktok, shorts; `capture.py --safe all`; 3D harness only) outlines the box and the crops
  over the frame: a preview aid, never a deliverable. The default lift puts the subject inside it.
- Burned-in text: inside the box, paper-cut lettering on its own card (`paper-ui.md`), never across the bottom third.

## 6. What scales with resolution

- **Blur, depth lines, grain, chroma** scale with the frame's short side (1080 px = the calibration), so a 4K frame
  and a 1080p frame look the same, one sharper.
- **Prints**: about 35 px per world unit at the target for a 1080 px short side; 4K prints at 2x (four times the
  pixels: the template's build goes from ~5 s to ~15 s), a 9:16 frame at 1.33x. The ground sheet prints finer with
  it, and every pixel-sized detail in a print (blurs, minimum line widths, the fibre) scales too.
- **Supersampling** (`?ss=2`) smooths edges for review stills; for a 4K deliverable render 4K natively instead.
- **Cost per frame** grows with pixels (the lens's blur taps grow at big sizes). For video, capture on the fixed clock
  (`capture.py video=`): the real frame rate does not matter, the result plays at the rate you ask for.
- Big frames hit browser limits: a canvas side above ~16k px or a GPU texture above the device's maximum fails; the
  harness caps the ground sheet. Above 4K, render tiles (`camera.setViewOffset`) or stay at 4K.

## 7. Video export

```text
python scripts/capture.py <project> clip:timeline=10,60 --size reel --audio --verify-frames 4
python scripts/capture.py <project> rise:video=6,30 walk:video=8,30,ArrowLeft+ArrowUp --size reel --audio
```

- **Shots.** `timeline=SEC[,FPS[,FROM]]` records a scripted film, a scrolling world or any scene without a hero on
  the fixed clock (`motion.md` section 11); `video=SEC[,FPS[,KEYS[,FROM]]]` records from the restart, holding the
  keys; `route=SEC,FPS[,FROM];X,Z;X,Z;...` walks the hero through waypoints. FPS may be fractional (23.976, 29.97,
  59.94). Files land in `<project>/frames/<name>.mp4`. `time=SEC[,FPS]` saves one PNG of the film at SEC seconds,
  stepped as the video steps (FPS default 30): a still per shot to review before any video is encoded.
- **Frames.** They go through Chrome's WebCodecs H.264 encoder on the GPU (60-200 fps instead of ~3), then ffmpeg
  writes the MP4 every platform takes: H.264 High, `yuv420p`, BT.709, `+faststart`. The first encoded frame is a
  set of colour patches, read back to learn which range and matrix this encoder wrote (they differ by machine and
  are not tagged; without the check blacks crush and colours shift).
- **Lossless frames.** `--png-frames` records PNG screenshots instead (slower: use it for a master). The script
  falls back to them by itself with `--safe`, `--ss` above 1, an odd frame size, HTML drawn over the canvas (the
  fast path records the canvas alone), no WebCodecs, an encoder failure or a failed colour check.
- **Sound (`--audio`).** The page's hook renders the stems (`renderAudio(seconds, { from })`: the paper sounds the
  harness logged and, with `H.setMusicRenderer`, the score); `--paper-wav` / `--music-wav` replace them with files
  of any format ffmpeg reads, cut to the clip. With music, the paper peak is set `--paper-ratio` dB (default 18)
  under the music peak and the mix is brought to `--lufs` (default -16) by one gain; nothing is compressed. Without
  music the paper keeps the kit's own quiet level (`--paper-gain DB` adds gain): paper is never normalised. The
  mix is 48 kHz stereo AAC at 192 kbps (`sound.md` section 9). The music fades out over the clip's last second or
  less; `--loop` leaves it unfaded, for a film whose end runs into its start.
- **Checks.** Every MP4's frame count is read back with ffprobe, and a mismatch fails the run. `--verify-frames N`
  also saves N evenly spaced frames from the finished MP4 as PNGs: look at them (colour, framing, the last frame).
- **2D pages** record `video=`, `timeline=` and `route=` too, without `--audio` or `--safe`.

The equivalent ffmpeg transcode by hand:

```text
ffmpeg -framerate 30 -i f_%05d.png -vf "scale=out_color_matrix=bt709:out_range=tv,format=yuv420p,setparams=color_primaries=bt709:color_trc=bt709:colorspace=bt709:range=tv" -c:v libx264 -profile:v high -preset slow -crf 18 -g 15 -bf 2 -movflags +faststart out.mp4
```

- CRF 18 is visually clean; to hit a bitrate instead, YouTube's SDR guide: 1080p 8 Mbps (12 at 60 fps), 1440p 16 (24),
  2160p 35-45 (53-68).
- Clip length: hooks 3-4 s, clips 5-8 s (`motion.md` section 11); a Reel or Short loops, so let the last frame lead
  back to the first (the world settled and quiet, or folding flat).

## 8. Interactive pages on phones

- Phone viewports are portrait, ~19.5:9 to 20:9 (CSS ~360-414 px wide), device pixel ratio 2-3 (the harness caps it
  at 2). The harness frames them like a 9:16 frame; `rotate: true` also fills the turned frame, so a phone turned to
  landscape finds a full world (more pieces: a slower build).
- Size the page with `100dvh` (or `svh`) rather than `vh`, which ignores the browser bars. Keep HTML overlays (a
  hint, a menu) inside `env(safe-area-inset-*)`, which needs `viewport-fit=cover` in the viewport meta tag.
- A desktop window resized to an odd shape after the build may show unbuilt page at its new edges: build for the
  frame the page will live in.

## 9. Checks

- [ ] The FORMAT line in the spec names every deliverable (aspect, size, fps, length, platform).
- [ ] Every format captured at its own size (`capture.py --size`), from the same scene: one world, framed for each.
- [ ] Tall frames: the subject inside the safe box (`--safe all`), the lower third calm, no bare page at the top
      (the far rows are filled) or along the sides; the hero readable on a phone.
- [ ] Narrow frames: the subject did not fall off the side (pass `subject`); big blurred cards along the bottom edge.
- [ ] `measure.py` on each frame: it reads any shape at the same scale (the short side matches a 1600 px 16:9 frame).
- [ ] Videos: plays from the first frame (`+faststart`), the right frame rate, BT.709, sound muxed and level.

Sources (read November 2026): YouTube Help (recommended upload encoding settings; aspect ratios; Shorts), Meta Ads
Guide (Instagram Reels, Stories and feed; Facebook Reels and feed), TikTok Ads Help (in-feed ads), X developer media
best practices, LinkedIn and Pinterest help pages, Snapchat business help, Google's universal safe-zone diagram for
vertical video, MDN (env(), viewport units, viewport meta), Netflix DCP specifications.
