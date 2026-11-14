---
name: lip-sync
description: >-
  Re-syncs the lips in an existing video to a new audio track (a dub, a
  re-recorded line, a translated voiceover) with SadTalker-Video-Lip-Sync, a
  Wav2Lip-based tool. Checks the machine, prepares the clip and audio the way
  the model needs them, runs it, and returns an H.264 MP4 with the original
  full-quality audio. Use when the user says "lip sync this video", "dub this
  clip", "make the lips match this audio", "sync the mouth to the new
  voiceover", "fix the lip sync on this take", or names
  SadTalker-Video-Lip-Sync or Wav2Lip. Needs an NVIDIA GPU machine; not for
  animating a still photo or generating a talking avatar from nothing.
---

# lip-sync

Takes a video of one person talking and an audio file, and redraws the mouth so
it matches the audio. The rest of the frame is untouched.

Upstream: https://github.com/Zz-ww/SadTalker-Video-Lip-Sync, pinned to commit
`131466e` (April 2023, the last one). Three scripts in this folder wrap it:

```bash
bash   setup.sh [install_dir]                       # once per machine: clone, venv, weights
python3 prep_inputs.py VIDEO AUDIO --out WORKDIR    # make the inputs model-safe
python3 run_lipsync.py WORKDIR --out final.mp4      # run the model, finish the file
```

`prep_inputs.py` and the finishing half of `run_lipsync.py` need only Python 3
and ffmpeg, so they run anywhere. The model itself does not.

## Before you start

**1. Whose face and whose voice.** Ask if it is not obvious. Go ahead for the
user's own footage, actors or clients who agreed to the dub, and licensed or
generated characters. Do not make a real person appear to say something they
did not say without their consent, whatever the stated purpose. If the result
will be published, say that many platforms require altered or synthetic media
of real people to be labelled.

**2. Licence.** The upstream repo has no licence file, and it bundles code and
weights from SadTalker, Wav2Lip, GFPGAN, GPEN and DAIN, each with its own
terms. The original Wav2Lip weights are research and personal use only. Tell
the user this once if the output is for paid or client work; it is their call.

**3. The machine.** Run `python3 run_lipsync.py --check`. It reports the GPU,
ffmpeg, the install and each weight file. The model needs:

| Need | Detail |
|---|---|
| NVIDIA GPU with CUDA | 8 GB VRAM is a sensible floor; the upstream README gives no number. CPU mode exists (`--cpu`) and is hours per clip |
| Python 3.8 or 3.9 | `scipy==1.5.3` and `torch==1.12.1` have no wheels for newer Pythons |
| RAM | Every frame is held in memory uncompressed, more than once. See the limits below |
| Weights | A `checkpoints.tar.gz` from Google Drive, several GB |

A Claude Code cloud session, a laptop without an NVIDIA card and a Mac all
fail this check. Do not try to install there. Run `prep_inputs.py` so the
inputs are ready, then give the user the two commands to run on a GPU machine
(their own, Colab, RunPod or similar) and offer to finish the file when they
bring the result back with `run_lipsync.py --finish-only`.

## Step 1: Set up (once)

```bash
bash setup.sh ~/sadtalker-lipsync
export LIPSYNC_HOME=~/sadtalker-lipsync
```

The script clones the pinned commit, builds a venv, installs PyTorch 1.12.1
for CUDA 11.3 and the requirements, and fetches the weights with `gdown`.
Google Drive often rate-limits that file. If the download fails, the script
prints the link; the user downloads `checkpoints.tar.gz` in a browser and
re-runs `setup.sh`, which picks up from there.

## Step 2: Prepare the inputs

```bash
python3 prep_inputs.py take3.mp4 dub_telugu.wav --out work/take3
```

It writes `video_25fps.mp4`, `audio_16k.wav` and `job.json` into the work
folder, and prints warnings. What it fixes, and why the model needs it:

| Fix | Why |
|---|---|
| Video to 25 fps, constant | The model assumes 25 fps everywhere. Any other rate drifts out of sync |
| Audio to 16 kHz mono WAV | What the mouth model reads. The original audio is kept for the final file |
| Both trimmed to the shorter one | The model stops at whichever ends first, silently |
| Optional `--max-height 720` | Cuts memory roughly in half from 1080p |
| Optional `--start` / `--duration` | Cut the clip to the line being dubbed |

Limits it warns about but cannot fix:

- **Length.** Aim for 30 seconds or less at 1080p, 60 at 720p. Longer clips
  run out of RAM. Split at cuts, sync each part, join afterwards.
- **One face, roughly in place.** The face is found on the first frame and
  that crop is used for the whole clip. A cut to another angle, a second
  person, or someone walking across frame breaks it. Split at every cut.
- **A visible mouth on frame one.** No hand, mic or turned-away head.

Look at the first frame before running (`ffmpeg -i video_25fps.mp4 -frames:v 1
first.png`) and check these three yourself.

## Step 3: Run

```bash
python3 run_lipsync.py work/take3 --out take3_synced.mp4
```

| Option | Use |
|---|---|
| `--enhancer lip` | Default. Sharpens only the mouth. Best match to the untouched skin around it |
| `--enhancer face` | Sharpens the whole face. Use when the source is soft or low resolution; can look waxy on a sharp source |
| `--enhancer none` | Fastest. The mouth is 256 px stretched to fit, so it is blurry on anything above 480p |
| `--dain` | Interpolates to 50 fps with DAIN. Needs PaddlePaddle (`setup.sh --with-dain`), much more VRAM and time. Skip it unless the user asks for 50 fps |
| `--cpu` | No GPU. Only for a few seconds of video |

The script then finishes the file, because the raw upstream output is MPEG-4
Part 2 video with 16 kHz mono audio: it re-encodes to H.264 and puts the
original audio back at full quality.

## Step 4: Check the result

Do not hand it over unseen. Pull frames and look:

```bash
ffmpeg -i take3_synced.mp4 -vf fps=2,scale=480:-1,tile=6x4 -frames:v 1 sheet.png
```

| Look for | Likely cause | Fix |
|---|---|---|
| A soft or mismatched box around the mouth | `none`, or a sharp source with `lip` | Try `face`; or downscale the source with `--max-height` |
| Mouth drifts off the face | Head moved a lot, or there was a cut | Split the clip |
| Lips late or early throughout | Audio has leading silence the video does not | Trim the audio, re-run prep |
| Teeth flicker, mouth shimmers | Normal for Wav2Lip on wide-open mouths | `face` enhancer helps a little; otherwise this is the model's ceiling |
| Wrong person's mouth moves | Two faces in frame | Crop to one face, sync, composite back |

Say plainly what you saw. Wav2Lip-generation models are convincing on medium
and wide shots and visibly synthetic in tight close-ups; tell the user that
rather than re-running in the hope it changes.

## Output

```
File: [path]  [duration] s, [w]x[h], 25 fps (or 50 with DAIN), H.264 + AAC
Settings: enhancer [x], DAIN [on/off]
Checked: [what you looked at, and what you saw]
Known flaws: [timecodes, or "none seen"]
```
