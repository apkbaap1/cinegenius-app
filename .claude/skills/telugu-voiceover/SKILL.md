---
name: telugu-voiceover
description: Generate a Telugu voice-over (narration and character dialogue) from a script with the local hima-tts-nano-te model, and optionally lay it on a film with the music ducked under it. Use when the user asks for a Telugu voice-over, narration, dubbing, "voice cheyyi", TTS for a Telugu script, a voice for a Panchatantra film, or sends a Telugu script to be voiced.
---

# Telugu voice-over (hima-tts-nano-te)

Local, free Telugu TTS: `Prahaladha/hima-tts-nano-te` (62M params, runs on CPU faster than real
time, 24 kHz). Telugu script plus English words in English letters; numbers, dates and ₹ amounts
are read as words. Chosen over Maya1 after a test: Maya1 (English-only open weights) produced no
intelligible Telugu. Maya 2 (paid API) is the upgrade path if the user ever has a key.

## Voices

- **Female:** Bhavana, Lakshmi, Sravani
- **Male:** Srinivas, Karthik, Pranay

Default casting (used for "Kothi, Mosali"): narrator **Bhavana**, gruff/older male **Srinivas**,
young/quick male **Pranay**. Ask only if the user named voices or the cast is unclear; otherwise
pick and say which. Also possible: a `.wav` (5-10 s of clear speech) to copy a voice (needs
`pip install speechbrain`), or a saved `.safetensors` voice.

## Steps

`SKILL_DIR` below is this skill's folder (in this repo: `.claude/skills/telugu-voiceover`).

1. **Setup** (once per container, ~1-2 min): `bash $SKILL_DIR/scripts/setup.sh`
   Model goes to `$HIMA_DIR` (default `~/.cache/hima-tts-nano-te`).
2. **Write or take the script.** Text format (`.txt`), one spoken line per line:
   ```
   # comments are skipped
   కథకుడు: ఒక నది ఒడ్డున, పెద్ద నేరేడు చెట్టు మీద, ఒక కోతి ఉండేది.
   మొసలి: మిత్రమా, మా ఇంటికి రా.

   కథకుడు: (blank line above = scene break, longer pause)
   ```
   Speaker labels are mapped with `--cast`. Unlabelled lines use `--default`. A label that is
   already a voice name (`Bhavana: ...`) needs no cast. **Only Telugu speech in the text**: the
   model reads everything, so no stage directions, timings or brackets in spoken lines.
   Tech terms with digits (3D, 4K, 5G, 1080p) are respelled automatically so they are read in English
   (the model's normaliser would say "3D" as "మూడు డీ"); the script prints each rewritten line.
   `--keep-digits` turns this off. For a Reel use tight pauses: `--lead 0.2 --gap 0.35 --scene-gap 0.6`.
   For a film with fixed timings use `.json`: `[{"id":"01","v":"Bhavana","t":"...","s":3.4,"e":7.8}]`
   (s/e in seconds). Each line is placed at `s`, and up to `--seeds` takes are tried to fit `s..e`.
3. **Generate:**
   ```bash
   python $SKILL_DIR/scripts/voiceover.py script.txt out/vo \
     --cast "కథకుడు=Bhavana,మొసలి=Srinivas,కోతి=Pranay" [--length 80]
   ```
   Output: `line<NN>.wav` per line, `voiceover.wav` (48 kHz, -18 LUFS), `report.json` (start/end
   of every line, for retiming a film's cues). It prints `OVERRUN` when a take is longer than its
   slot and `WARNING` on overlaps. Fix those by moving `s` of the line or the next one, shortening
   the text, or more `--seeds`. Don't speed speech up.
4. **Mix onto a video** (optional): `bash $SKILL_DIR/scripts/mix.sh film.mp4 out/vo/voiceover.wav film-VO.mp4`
   The music is ducked under the voice, then everything is normalised to -16 LUFS. The script prints the
   stream lengths and loudness. Check that the audio length matches the video.
5. **Verify** (you cannot listen): transcribe with
   `pip install faster-whisper` then `python $SKILL_DIR/scripts/transcribe.py medium out/vo/voiceover.wav`.
   Use Whisper in Hindi mode: it writes the Telugu sounds in Devanagari, so you can check that every line is present and in order.
6. **Deliver** (send or attach the files for the user): the video (if any), `voiceover.wav`, and the script. Name the voices
   used. In a git repo, never commit audio or video; commit the script/JSON if it belongs to a film.

## Requirements

Network access to huggingface.co (model download, ~250 MB, plus PyTorch from PyPI on first run) and ffmpeg.

## Panchatantra films (CineGenius repo only)

The film pipeline is in `films/panchatantra/PIPELINE.md`. The "Kothi, Mosali" example is in
`films/panchatantra/vo/`: `lines.json` holds its timed lines on the film's cue anchors. Render the
film with `node tools/render.mjs <film> --out out/<film>.mp4` (after `npm ci` in that folder), then mix.
