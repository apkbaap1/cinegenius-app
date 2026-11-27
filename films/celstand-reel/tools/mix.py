"""Encode recorded frames + mix the audio from the reel's cue sheet into a final MP4.
usage: python3 mix.py <framesDir> <out.mp4> [clip]"""
import json, subprocess, sys, os

frames, out = sys.argv[1], sys.argv[2]
clip = len(sys.argv) > 3 and sys.argv[3] == 'clip'
AUD = os.path.join(os.path.dirname(os.path.abspath(__file__)), '..', 'assets', 'audio')
cues = json.load(open(os.path.join(frames, 'cues.json')))
n = len([f for f in os.listdir(frames) if f.endswith('.jpg')])
DUR = n / 30
CLIP_LEN, E0 = 16.4, 16.6

if clip:
    cues = [c for c in cues if c['at'] < CLIP_LEN and c['file'] != 'explainer_vo.wav' and not c['file'].startswith('sfx_pop') and c['file'] != 'sfx_rewind.wav']

inputs, filters, labels = [], [], []
for i, c in enumerate(cues):
    inputs += ['-i', os.path.join(AUD, c['file'])]
    ms = int(round(c['at'] * 1000))
    chain = f"[{i}:a]aformat=sample_rates=48000:channel_layouts=stereo,volume={c['gain']}"
    if c['file'].startswith('amb_'):
        end = c.get('until') or (CLIP_LEN if not clip else CLIP_LEN)
        end = min(end, CLIP_LEN + 0.6) if not clip else min(end, CLIP_LEN)
        length = max(0.1, end - c['at'])
        chain += f",atrim=0:{length:.3f},afade=t=in:d=0.3,afade=t=out:st={max(0, length - 0.5):.3f}:d=0.5"
    chain += f",adelay={ms}|{ms}[a{i}]"
    filters.append(chain); labels.append(f'[a{i}]')

vo_idx = next((i for i, c in enumerate(cues) if c['file'] == 'explainer_vo.wav'), None)
mix_inputs = ''.join(labels)
filters.append(f"{mix_inputs}amix=inputs={len(labels)}:normalize=0:dropout_transition=0[fx]")
final = '[fx]'
if not clip:
    # music bed: comes in after the clip, ducks under the explainer VO, fades at the end
    m = len(cues)
    inputs += ['-i', os.path.join(AUD, 'music_bed.wav'), '-i', os.path.join(AUD, 'explainer_vo.wav')]
    start = CLIP_LEN - 0.4
    filters.append(f"[{m}:a]aformat=sample_rates=48000:channel_layouts=stereo,atrim=0:{DUR - start:.3f},volume=0.5,afade=t=in:d=1.5,afade=t=out:st={DUR - start - 2.2:.3f}:d=2.2,adelay={int(start * 1000)}|{int(start * 1000)}[mus]")
    filters.append(f"[{m + 1}:a]aformat=sample_rates=48000:channel_layouts=stereo,adelay={int(E0 * 1000)}|{int(E0 * 1000)},apad[key]")
    filters.append("[mus][key]sidechaincompress=threshold=0.03:ratio=6:attack=20:release=350[duck]")
    filters.append("[fx][duck]amix=inputs=2:normalize=0[pre]")
    final = '[pre]'
filters.append(f"{final}atrim=0:{DUR:.3f},alimiter=limit=0.95,loudnorm=I=-14:TP=-1.0:LRA=11[aout]")

cmd = ['ffmpeg', '-v', 'error', '-y', '-framerate', '30', '-i', os.path.join(frames, 'f%05d.jpg')] + inputs + [
    '-filter_complex', ';'.join(filters).replace('[0:a]', '[0:a]'),
    '-map', '0:v', '-map', '[aout]',
    '-c:v', 'libx264', '-preset', 'slow', '-crf', '17', '-pix_fmt', 'yuv420p', '-profile:v', 'high',
    '-c:a', 'aac', '-b:a', '192k', '-ar', '48000', '-movflags', '+faststart', '-shortest', out]
# frames are input 0, so audio inputs are offset by one
fixed = []
for f in filters:
    import re
    fixed.append(re.sub(r'\[(\d+):a\]', lambda mm: f'[{int(mm.group(1)) + 1}:a]', f))
cmd[cmd.index('-filter_complex') + 1] = ';'.join(fixed)
subprocess.run(cmd, check=True)
print('wrote', out, round(DUR, 2), 's')
