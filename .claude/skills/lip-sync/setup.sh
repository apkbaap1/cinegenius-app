#!/usr/bin/env bash
# One-time install of SadTalker-Video-Lip-Sync for the lip-sync skill.
#
#   bash setup.sh [install_dir] [--with-dain]
#
# Makes install_dir/repo (the pinned upstream commit) and install_dir/venv.
# Safe to re-run: each step is skipped when already done.
# Needs: an NVIDIA GPU with a CUDA 11.x-capable driver, Python 3.8 or 3.9,
# git, ffmpeg, and several GB of disk for the weights.
set -euo pipefail

HOME_DIR="${HOME}/sadtalker-lipsync"
WITH_DAIN=0
for arg in "$@"; do
  case "$arg" in
    --with-dain) WITH_DAIN=1 ;;
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
command -v nvidia-smi >/dev/null || fail "no NVIDIA GPU found (nvidia-smi missing). This model needs one; see SKILL.md for what to do instead."

# scipy==1.5.3 and torch==1.12.1 only ship wheels for Python 3.8 and 3.9.
PY=""
for cand in python3.9 python3.8 python3 python; do
  if command -v "$cand" >/dev/null; then
    v="$("$cand" -c 'import sys; print("%d.%d" % sys.version_info[:2])')"
    if [ "$v" = "3.9" ] || [ "$v" = "3.8" ]; then PY="$cand"; break; fi
  fi
done
[ -n "$PY" ] || fail "need Python 3.8 or 3.9 on PATH (conda create -n lipsync python=3.9, or pyenv install 3.9)"

mkdir -p "$HOME_DIR"
REPO="$HOME_DIR/repo"
VENV="$HOME_DIR/venv"

say "upstream code -> $REPO"
if [ ! -f "$REPO/inference.py" ]; then
  git clone "$UPSTREAM" "$REPO"
fi
git -C "$REPO" checkout -q "$COMMIT"

say "virtual environment -> $VENV ($PY)"
[ -x "$VENV/bin/python" ] || "$PY" -m venv "$VENV"
PIP="$VENV/bin/python -m pip"
$PIP install -q --upgrade "pip<24.1" wheel setuptools

say "PyTorch 1.12.1 (CUDA 11.3)"
$PIP install torch==1.12.1+cu113 torchvision==0.13.1+cu113 torchaudio==0.12.1 \
  --extra-index-url https://download.pytorch.org/whl/cu113

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
  tar -xzf "$TARBALL" -C "$REPO"
  [ -f "$REPO/checkpoints/wav2lip.pth" ] || fail "extracted, but checkpoints/wav2lip.pth is missing. Check the archive layout in $REPO."
  rm -f "$TARBALL"
fi

say "done"
echo "export LIPSYNC_HOME=\"$HOME_DIR\""
echo "then: python3 $(dirname "$0")/run_lipsync.py --check"
