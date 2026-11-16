#!/usr/bin/env bash
# Lay a voice-over on a video, ducking the video's own music under the voice.
# Usage: mix.sh VIDEO.mp4 VOICEOVER.wav OUT.mp4
# A video with no audio track gets the voice alone. Target: -16 LUFS, peak <= -1.5 dBTP.
set -euo pipefail
V="$1"; VO="$2"; OUT="$3"
DUR=$(ffprobe -v error -show_entries format=duration -of csv=p=0 "$V")  # the voice is padded/cut to the video
if ffprobe -v error -select_streams a -show_entries stream=index -of csv=p=0 "$V" | grep -q .; then
  ffmpeg -y -loglevel error -i "$V" -i "$VO" -filter_complex "[0:a]aresample=48000[m];[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,apad=whole_dur=$DUR,atrim=0:$DUR,asplit=2[v1][v2];[m][v1]sidechaincompress=threshold=0.02:ratio=8:attack=25:release=450:makeup=1[duck];[duck][v2]amix=inputs=2:normalize=0:weights=1 1.15,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 "$OUT"
else
  ffmpeg -y -loglevel error -i "$V" -i "$VO" -filter_complex "[1:a]aresample=48000,pan=stereo|c0=c0|c1=c0,apad=whole_dur=$DUR,atrim=0:$DUR,loudnorm=I=-16:TP=-1.5:LRA=11[a]" -map 0:v -map "[a]" -c:v copy -c:a aac -b:a 192k -ar 48000 "$OUT"
fi
ffprobe -v error -show_entries stream=codec_type,duration -of csv=p=0 "$OUT"
ffmpeg -nostats -i "$OUT" -af ebur128=peak=true -f null - 2>&1 | grep -E "^\s+(I:|Peak:)"
