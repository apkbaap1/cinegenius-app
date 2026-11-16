#!/usr/bin/env bash
# Download hima-tts-nano-te (Telugu TTS, 62M params, CPU) once and install its Python deps.
# Model dir: $HIMA_DIR (default ~/.cache/hima-tts-nano-te). Safe to re-run.
set -euo pipefail
HIMA_DIR="${HIMA_DIR:-$HOME/.cache/hima-tts-nano-te}"
if [ ! -f "$HIMA_DIR/model.safetensors" ]; then
  pip install -q -U huggingface_hub
  hf download Prahaladha/hima-tts-nano-te --local-dir "$HIMA_DIR"
fi
python -c "import torch, sentencepiece, soundfile, scipy, yaml" 2>/dev/null || pip install -q -r "$HIMA_DIR/requirements.txt"
command -v ffmpeg >/dev/null || echo "WARNING: ffmpeg not found (needed for mix.sh)"
echo "hima-tts ready at $HIMA_DIR"
