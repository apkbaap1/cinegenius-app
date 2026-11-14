#!/usr/bin/env bash
# One-time install of SadTalker-Video-Lip-Sync for the lip-sync skill.
#
#   bash setup.sh [install_dir] [--with-dain]
#
# Makes install_dir/repo (the pinned upstream commit) and install_dir/venv.
# Safe to re-run: each step is skipped when already done.
# Needs: an NVIDIA GPU with a CUDA 11.x-capable driver (or pass --cpu),
# Python 3.8, git, ffmpeg, and about 10 GB of disk for the weights.
set -euo pipefail

HOME_DIR="${HOME}/sadtalker-lipsync"
WITH_DAIN=0
CPU=0
for arg in "$@"; do
  case "$arg" in
    --with-dain) WITH_DAIN=1 ;;
    --cpu) CPU=1 ;;
    -h|--help) sed -n '2,10p' "$0"; exit 0 ;;
    *) HOME_DIR="$arg" ;;
  esac
done

UPSTREAM="https://github.com/Zz-ww/SadTalker-Video-Lip-Sync"
COMMIT="131466e"
WEIGHTS_ID="1lW4mf5YNtS4MAD7ZkAauDDWp2N3_Qzs7"
WEIGHTS_URL="https://drive.google.com/file/d/${WEIGHTS_ID}/view"

say() { printf '\n== %s\n' "$*"; }
fail() { printf 'error: %s\n' "$*" >&2; exit 1; }

command -v git >/dev/null || fail "git not found"
command -v ffmpeg >/dev/null || fail "ffmpeg not found (apt install ffmpeg / conda install ffmpeg)"
if [ "$CPU" = 0 ]; then
  command -v nvidia-smi >/dev/null || fail "no NVIDIA GPU found (nvidia-smi missing). Re-run with --cpu to install the CPU build (about 10 s of compute per output frame), or see SKILL.md."
fi

# The pinned scipy==1.5.3 only ships wheels up to Python 3.8; on 3.9 it tries
# to compile from source and fails.
PY=""
for cand in python3.8 python3 python; do
  if command -v "$cand" >/dev/null; then
    v="$("$cand" -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
    if [ "$v" = "3.8" ]; then PY="$cand"; break; fi
  fi
done
if [ -z "$PY" ] && command -v uv >/dev/null; then
  uv python install 3.8 && PY="$(uv python find 3.8)"
fi
[ -n "$PY" ] || fail "need Python 3.8 on PATH (conda create -n lipsync python=3.8, pyenv install 3.8, or install uv)"

mkdir -p "$HOME_DIR"
REPO="$HOME_DIR/repo"
VENV="$HOME_DIR/venv"

say "upstream code -> $REPO"
if [ ! -f "$REPO/inference.py" ]; then
  git clone "$UPSTREAM" "$REPO"
fi
git -C "$REPO" checkout -q "$COMMIT"
# Upstream bug: face_alignment 1.3.5 on PyPI names this enum TWO_D, not _2D.
sed -i 's/LandmarksType\._2D/LandmarksType.TWO_D/' "$REPO/src/face3d/extract_kp_videos.py"

say "virtual environment -> $VENV ($PY)"
[ -x "$VENV/bin/python" ] || "$PY" -m venv "$VENV"
PIP="$VENV/bin/python -m pip"
$PIP install -q --upgrade "pip<24.1" wheel setuptools

if [ "$CPU" = 1 ]; then TAG=cpu; else TAG=cu113; fi
say "PyTorch 1.12.1 ($TAG)"
$PIP install "torch==1.12.1+$TAG" "torchvision==0.13.1+$TAG" torchaudio==0.12.1 \
  --extra-index-url "https://download.pytorch.org/whl/$TAG"

say "requirements"
$PIP install -r "$REPO/requirements.txt"

if [ "$WITH_DAIN" = 1 ]; then
  say "PaddlePaddle for DAIN frame interpolation"
  $PIP install paddlepaddle-gpu==2.3.2.post112 \
    -f https://www.paddlepaddle.org.cn/whl/linux/mkl/avx/stable.html
fi

say "weights"
if [ -f "$REPO/checkpoints/wav2lip.pth" ]; then
  echo "already present"
else
  TARBALL="$HOME_DIR/checkpoints.tar.gz"
  if [ ! -f "$TARBALL" ]; then
    $PIP install -q gdown
    "$VENV/bin/gdown" "$WEIGHTS_ID" -O "$TARBALL" || {
      rm -f "$TARBALL"
      cat >&2 <<EOF

Google Drive refused the automatic download (it rate-limits popular files).
Download checkpoints.tar.gz in a browser from:
  $WEIGHTS_URL
save it as:
  $TARBALL
and run this script again.
EOF
      exit 1
    }
  fi
  # The upstream archive ends with a gzip CRC error (same bytes on every
  # download); every file still extracts, so check for the files instead.
  tar -xzf "$TARBALL" -C "$REPO" || echo "note: tar reported an error; checking the extracted files"
  [ -f "$REPO/checkpoints/wav2lip.pth" ] || fail "extracted, but checkpoints/wav2lip.pth is missing. Check the archive layout in $REPO."
  rm -f "$TARBALL"
fi

say "done"
echo "export LIPSYNC_HOME=\"$HOME_DIR\""
echo "then: python3 $(dirname "$0")/run_lipsync.py --check"
