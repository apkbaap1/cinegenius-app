# The daily Panchatantra film · how a day runs

Read this whole file before doing anything. It is the handover from the session that made the first
film ("Kothi, Mosali", 2026-10-25) and set the schedule up. The owner records the narration
themselves (a Telugu TTS voice) from the script you send; you build and render the film.

## The day, in IST

| When | What | Done when |
|---|---|---|
| 09:38 | The scheduled run starts. Pick today's row in `STORIES.md` (or the next backlog story). | |
| by 10:00 | **Send the script** (two files, below) with SendUserFile, status `proactive`. | the owner has the script |
| 10:00-15:00 | **Build the film** while they record: characters, sets, the look still, the score, a silent draft render paced on the script's estimated timing. Send the look still (proactive, FYI; do not block on it). | a draft renders end to end, gate passes |
| 15:00 | A `send_later` you set at 10:00 wakes the session: is the audio here? | |
| on audio | **Edit to the voice**: transcribe, cut stray speech, place lines, retime the cue table and score, render, mix, verify. | |
| by 17:00 | **Send the final MP4** (status `proactive`), then commit the source and merge (below). | the owner has the video |

If no audio by 15:00: send one short message saying the edit is waiting for the audio, and that the
music-only draft is attached; send the draft. When the audio arrives later, do the edit then.

## The script: two files, never mixed

The owner pastes the script into a TTS tool. **The TTS reads everything it is given.** On day one it
read a stage direction aloud in English ("leave a beat: the leap lands at about 0:59") and it had to
be cut out of the audio. So:

1. `script-<date>.txt` · **narration only**, Telugu script, nothing else: no times, no brackets, no
   English, no speaker labels. One paragraph per scene, blank line between scenes. Dialogue in quotes
   inside the narration ("..." అంది మొసలి).
2. `timing-<date>.md` · for the owner to read, not to paste: scene list with target times, who speaks,
   where pauses go, and the note "paste ONLY script-<date>.txt into the TTS".

Also put the script text in the chat message itself so they can copy it on a phone.

Length: the owner's TTS reads about **1.8 Telugu words a second** (measured on day one). A 6-7 minute
film with narration over about 70 % of it needs **450-550 words**; never under 380 (5 min) or over
1000 (10 min). Write for the ear: short sentences, a hook in the first line, two or three characters'
lines in direct speech, the moral as the last sentence on its own (it is also the end card).
The title line is the first paragraph on its own: "పంచతంత్ర కథలు… <title>".

## The film

Work in `films/panchatantra` (this folder is a scaffolded anidoodle project). Setup in a fresh
container:

```bash
cd films/panchatantra && npm install
node tools/soundfetch.mjs get harp rooms   # the owner already said yes to these (2026-10-25): no need to ask again
```

Follow the anidoodle skill (`.claude/skills/anidoodle/SKILL.md`), with these standing decisions:

- **Style: SOFT TOON, from 2026-10-30** (the owner's choice, replacing `folkTale`). The look of a
  3D feature-animation character, painted in 2D: oversized glossy eyes, a bulb nose, big curly
  hair/fur and beards, soft rounded volumes under one warm key light (high left) with a cool rim,
  skin that glows warm at thin edges, and a background drawn sharp then blurred (depth of field,
  never disc bokeh). Build every character and prop with `src/canvas-core/pt/toonKit.ts`
  (`vol`, `eye`, `nose`, `clumps`, `contact`, `blob`); `pt/toonMonkey.ts` is the worked character
  and `toonLook.ts` (rendered in `looks/soft-toon-look.png`) the approved look: match it. Animals
  stay animals (the stories are fables) but take the caricature canon: head about 40-45 % of the
  body, eyes about a third of the face width, friendly arched brows by default. 16:9, 1920x1080.
  The older `folkTale` modules (`pt/monkey.ts`, `pt/croc.ts`, `pt/river.ts`) are day-one history:
  do not use them for new films.
- **fps 24, bpm 90** (one beat = 16 frames, one bar = 64). 24 fps keeps a 6-7 minute render near
  35-40 minutes on 4 cores (day one drew ~270 ms a frame; 30 fps would push a 7-minute film past an hour).
- **Approval gates are pre-agreed for the daily run**: the owner approved the look and the music
  style on day one. Send the look still as information; do not wait for replies to keep going.
- **Characters** are modules in `src/canvas-core/pt/`, posed, never redrawn. Reuse `monkey.ts`,
  `croc.ts`, `river.ts` where they fit. A new animal: write its anatomy from named reference in the
  module header, author it in three-quarter view facing left, mirror it to face right
  (`mirror()` in `monkeyCroc.ts`), give it pose parameters (head, mouth, eyes, limbs, tail).
- **Every film is chapters** (anidoodle `references/workflows/long-film.md`): 6-10 scenes, each with
  its own small arc; one cue table; cuts on bars; a token planted early that returns at the end.
- **Score**: compose a NEW score per story in the `world` vocabulary (South Indian folk colour:
  drone, flute lead, hand drums, recorded harp), written under the voice: sparse lead, holes for words.
  `node tools/music.mjs check ... --fit --seconds <len>` must PASS, novelty included. Never reuse
  `monkeyCrocScore.ts`'s motifs.
- **Text**: title and moral as PNGs from `node pipeline/text.cjs <id> "<Telugu>"` (Gurajada font,
  OFL), revealed with `reveal()` on a soft rounded card (a `vol()` panel) over the blurred background. Never `fillText`.
- **Dead air**: the gate measures at 270 px wide. Quiet narration stretches need real action: a
  character idles (scratches, looks around, breathes), wind in the trees, birds crossing, the river
  current (`CURRENT` in `monkeyCroc.ts`). Test a range with `render.mjs --from F --to T` and
  `tools/motion.mjs` `changedArea(file, 270, 152)` before the full render. Declare holds only for text being read.
- **No module-level mutable state** that touches pixels (the contract). Pass the frame in.

## Editing to the voice (what worked on day one)

1. **Durations and pauses**: `ffprobe`, then `ffmpeg -af silencedetect=noise=-38dB:d=0.35`.
2. **Transcribe** with faster-whisper (CPU, `medium`, int8) in a venv in the scratchpad:
   `pip install faster-whisper`, then `pipeline/w.py` (decodes with ffmpeg; PyAV's `open` signature
   breaks otherwise). **Use `language="hi"`**: forced to Telugu, Whisper writes garbage Kannada;
   forced to Hindi it writes the Telugu speech phonetically in Devanagari with good word times,
   which is enough to find every line. A minute of audio takes about 5 minutes on 4 cores.
   (The Gemini key in this environment only reaches aistudio.google.com, not the API: 403.)
3. **Map lines to scenes**, and listen for speech that is not in the script (stage directions, a
   repeated title). Cut it. If the owner sends several clips, check which lines each one holds:
   on day one clip 1 held the title and the ending, clip 2 the story and the ending again.
4. **Place the pieces** on the film's timeline with `atrim` + `adelay` + `amix`, `loudnorm=I=-18`
   (the day-one recipe is in the session log; it is ten lines of Python driving ffmpeg). Keep each
   line's pauses; add silence between scenes rather than squeezing speech.
5. **Retime the cue table and the score's section bars** to the lines: each event on the word
   that tells it, cuts on bars. Total bars x 64 frames = the film. Re-run `music.mjs check`.
6. **Render**, then `gate.mjs` (must PASS 15/15), then mix the voice over the score with the music
   ducked under it:

   ```bash
   ffmpeg -i out/<film>.mp4 -i vo/voiceover.wav -filter_complex "[0:a]aresample=48000[m];[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.02:ratio=8:attack=25:release=450:makeup=1[duck];[duck][v2]amix=inputs=2:normalize=0:weights=1 1.15,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 out/<Title>-VO.mp4
   ```

   Check it: integrated about -16 LUFS, peak under -1 dB, both streams the film's length.
7. **Send** the MP4 (proactive). Say plainly what was checked and what you could not (you cannot hear it).

## Saving the day's work

Commit the film's source (its `src/canvas-core/<film>*.ts`, new `pt/` modules, assets PNGs, a row
update in `STORIES.md`, and a short `notes/<date>.md` of decisions and lessons) to a branch
`films/<date>`, open a PR into `main` titled "Film <date>: <story>", and merge it. Never commit
video or audio files (`.gitignore` blocks them). Add any new lesson to THIS file in the same PR.

## Day-one film for reference

`src/canvas-core/monkeyCroc.ts` (+ `monkeyCrocScore.ts`, `pt/`): 80 s, 7 shots, the cue table at the
top, retimed to the owner's voice. `mcLook.ts` is its look still.
