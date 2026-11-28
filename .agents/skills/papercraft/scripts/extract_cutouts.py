"""Cut a sheet of pieces on a flat backdrop into one clean transparent PNG per piece.

The backdrop is a key colour (magenta, chroma green, any #RRGGBB, or the colour found in the corners) or the alpha a
PNG already carries. The script floods the backdrop in from the border, clears key-coloured holes inside a piece,
gives the edge pixels the alpha and the colour they had before the backdrop mixed in (no pink, green or grey rim),
splits the islands in reading order (rows top to bottom, each row left to right) and saves each with a clear border.

    python scripts/extract_cutouts.py <sheet.png|jpg|webp> --out <dir>
                                      [--key auto|magenta|green|#RRGGBB] [--tol 65] [--despill 2]
                                      [--min-area 0.004] [--pad 12] [--names a,b,c]
                                      [--keep-holes] [--punch-holes] [--sheet-preview]

--names must give one name per piece found: a mismatch FAILS before anything is written, with the pieces and the
small islands that were dropped listed, so a lost piece can never shift the names. Lower --min-area to keep a small
piece, or fix the list. Holes are cleared on a saturated key only; pass --punch-holes on a white or grey backdrop
(it would otherwise eat white eyes and paper highlights) and --keep-holes to clear none. Pick a key colour the
pieces do not use: a pink piece on magenta cannot be told from its backdrop.
"""
import argparse, math, os, re, sys

try:
    import numpy as np
    from PIL import Image, ImageDraw, ImageFilter
except ImportError as e:
    sys.exit(f'extract_cutouts.py: needs numpy and Pillow ({e}); pip install numpy pillow')

ME = 'extract_cutouts.py'


def corner_patch(a):
    """The four corner patches of an image array, as rows of pixels."""
    h, w = a.shape[:2]
    p = max(2, min(12, h // 32, w // 32))
    c = a.shape[2] if a.ndim == 3 else 1
    return np.concatenate([a[:p, :p].reshape(-1, c), a[:p, -p:].reshape(-1, c),
                           a[-p:, :p].reshape(-1, c), a[-p:, -p:].reshape(-1, c)], axis=0)


def parse_key_color(key_arg, rgb):
    """Return (kind, (r, g, b)) where kind is 'magenta', 'green', or 'custom'."""
    k = key_arg.strip().lower()
    if k == 'magenta':
        return 'magenta', (255.0, 0.0, 255.0)
    if k == 'green':
        return 'green', (0.0, 255.0, 0.0)
    m = re.fullmatch(r'#?([0-9a-f]{6})', k)
    if m:
        hx = m[1]
        return 'custom', (float(int(hx[0:2], 16)), float(int(hx[2:4], 16)), float(int(hx[4:6], 16)))
    if k != 'auto':
        raise SystemExit(f'{ME}: unknown --key {key_arg!r} (use auto, magenta, green, or #RRGGBB)')
    med = np.median(corner_patch(rgb), axis=0)
    r, g, b = float(med[0]), float(med[1]), float(med[2])
    if r > 170 and b > 170 and g < min(r, b) - 70:
        return 'magenta', (r, g, b)
    if g > 170 and g > max(r, b) + 60:
        return 'green', (r, g, b)
    return 'custom', (r, g, b)


def key_distance(rgb, kind, key_rgb):
    """Per-pixel distance to the key colour (lower = closer to the backdrop)."""
    kr, kg, kb = key_rgb
    r, g, b = rgb[:, :, 0], rgb[:, :, 1], rgb[:, :, 2]
    euclid = np.sqrt((r - kr) ** 2 + (g - kg) ** 2 + (b - kb) ** 2)
    if kind == 'magenta':
        # high R and B with low G also catches JPEG-compressed magenta edges
        dom = np.minimum(r, b) - g
        chroma_dist = np.where(dom > 35, np.maximum(0.0, 255.0 - dom) * 0.55 + np.abs(r - b) * 0.45, 255.0)
        return np.minimum(euclid, chroma_dist)
    if kind == 'green':
        dom = g - np.maximum(r, b)
        chroma_dist = np.where(dom > 35, np.maximum(0.0, 255.0 - dom) * 0.6, 255.0)
        return np.minimum(euclid, chroma_dist)
    return euclid


def label_components(mask_bool):
    """Run-length union-find, 4-connected. Returns an int32 label map (0 = False)."""
    h, w = mask_bool.shape
    parent = [0]
    labels = np.zeros((h, w), dtype=np.int32)
    next_lbl = 1

    def find(x):
        while parent[x] != x:
            parent[x] = parent[parent[x]]
            x = parent[x]
        return x

    def union(a, b):
        ra, rb = find(a), find(b)
        if ra != rb:
            if ra < rb: parent[rb] = ra
            else: parent[ra] = rb

    prev_runs = []
    for y in range(h):
        row = mask_bool[y]
        if not np.any(row):
            prev_runs = []
            continue
        padded = np.concatenate(([False], row, [False]))
        diff = np.flatnonzero(padded[1:] != padded[:-1])
        cur_runs = []
        p_idx = 0
        for i in range(0, len(diff), 2):
            x0, x1 = int(diff[i]), int(diff[i + 1])  # half-open [x0, x1)
            while p_idx < len(prev_runs) and prev_runs[p_idx][1] <= x0:
                p_idx += 1
            lbl = 0
            k = p_idx
            while k < len(prev_runs) and prev_runs[k][0] < x1:
                if lbl == 0:
                    lbl = find(prev_runs[k][2])
                else:
                    union(lbl, prev_runs[k][2])
                    lbl = find(lbl)
                k += 1
            if lbl == 0:
                lbl = next_lbl
                parent.append(lbl)
                next_lbl += 1
            labels[y, x0:x1] = lbl
            cur_runs.append((x0, x1, lbl))
        prev_runs = cur_runs

    if next_lbl == 1:
        return labels
    lut = np.array([find(i) for i in range(next_lbl)], dtype=np.int32)
    return lut[labels]


def flood_exterior(is_bg_bool):
    """Background pixels 4-connected to the image border."""
    h, w = is_bg_bool.shape
    pad = np.ones((h + 2, w + 2), dtype=bool)
    pad[1:-1, 1:-1] = is_bg_bool
    labels = label_components(pad)
    return labels[1:-1, 1:-1] == labels[0, 0]


def grow(mask_bool, radius):
    """The mask grown by `radius` px (square)."""
    if radius <= 0:
        return mask_bool.copy()
    im = Image.fromarray(mask_bool.astype(np.uint8) * 255, mode='L')
    return np.asarray(im.filter(ImageFilter.MaxFilter(size=radius * 2 + 1))) > 0


def bleed(values, filled, iters):
    """Spread the values of the filled pixels into their unfilled neighbours, `iters` px outward. In place."""
    v = values if values.ndim == 3 else values[:, :, None]
    f = filled
    for _ in range(iters):
        vp = np.pad(v * f[:, :, None], ((1, 1), (1, 1), (0, 0)))
        fp = np.pad(f, 1).astype(np.float32)
        acc = vp[:-2, 1:-1] + vp[2:, 1:-1] + vp[1:-1, :-2] + vp[1:-1, 2:]
        cnt = fp[:-2, 1:-1] + fp[2:, 1:-1] + fp[1:-1, :-2] + fp[1:-1, 2:]
        new = (~f) & (cnt > 0)
        if not new.any():
            break
        v[new] = acc[new] / cnt[new][:, None]
        f = f | new
    return f


def matte_edges(rgb, hard_bg, dist, tol, key_rgb, band=2):
    """Alpha and colour for the pixels within `band` px of the backdrop.

    An edge pixel is a mix of its piece and the backdrop. How much backdrop it holds is read on one axis (the key's
    own colour; brightness on a white, grey or black backdrop) between the backdrop and what the piece just inside
    the edge holds: that gives the alpha, and taking the backdrop back out gives the colour. A dark outline stays
    dark and opaque; a light piece keeps a light edge instead of a grey or pink rim. Where the piece is too close
    to the backdrop on that axis to tell them apart, the alpha is a plain ramp on the colour distance."""
    key = np.array(key_rgb, dtype=np.float32)
    fringe = grow(hard_bg, band) & ~hard_bg
    soft_lo, soft_hi = tol * 0.72, tol * 1.28
    ramp = np.clip((dist - soft_lo) / max(1.0, soft_hi - soft_lo), 0.0, 1.0)
    axis = key - key.mean()
    if float(np.linalg.norm(axis)) < 40.0:
        axis = np.ones(3, dtype=np.float32)                # no colour of its own: brightness
    axis = (axis / float(np.linalg.norm(axis))).astype(np.float32)
    held = rgb @ axis                                      # where each pixel sits on the axis
    k_key = float(key @ axis)
    solid = ~hard_bg & ~fringe
    k_piece = np.where(solid, held, 0.0).astype(np.float32)
    known = bleed(k_piece, solid.copy(), band + 2)         # the piece's own value, carried out to its edge
    span = k_piece - k_key
    sure = known & (np.abs(span) > 55.0)
    a = np.clip((held - k_key) / np.where(sure, span, 1.0), 0.0, 1.0)
    a = np.where(sure, a, ramp)
    a = np.where(a < 0.12, 0.0, a)
    alpha = np.where(hard_bg, 0.0, 1.0).astype(np.float32)
    alpha[fringe] = a[fringe]
    out = rgb.copy()
    mix = fringe & (alpha > 0) & (alpha < 1)
    if mix.any():
        am = np.maximum(alpha[mix], 0.2)[:, None]
        out[mix] = np.clip((rgb[mix] - (1.0 - am) * key) / am, 0.0, 255.0)
    return alpha, out


def despill_edges(rgb, alpha_u8, kind, radius):
    """Clamp what key colour is left on opaque pixels within `radius` px of the cut."""
    if radius <= 0 or kind not in ('magenta', 'green'):
        return rgb
    edge = grow(alpha_u8 < 200, radius) & (alpha_u8 > 0)
    if not np.any(edge):
        return rgb
    r, g, b = rgb[:, :, 0].copy(), rgb[:, :, 1].copy(), rgb[:, :, 2].copy()
    if kind == 'magenta':
        cap = g + 8.0
        spill = edge & (r > cap) & (b > cap)
        excess = np.minimum(r, b) - cap
        r = np.where(spill, np.clip(r - excess * 0.85, 0, 255), r)
        b = np.where(spill, np.minimum(b, cap), b)
    else:
        cap = np.maximum(r, b) + 12.0
        g = np.where(edge & (g > cap), cap, g)
    return np.stack([r, g, b], axis=2)


def islands(mask_bool):
    """Every island of the mask: [(area, x0, y0, x1, y1, label)], and the label map."""
    labels = label_components(mask_bool)
    flat = labels.ravel()
    idx = np.flatnonzero(flat)
    if not len(idx):
        return [], labels
    lab = flat[idx]
    order = np.argsort(lab, kind='stable')
    lab, idx = lab[order], idx[order]
    starts = np.concatenate(([0], np.flatnonzero(np.diff(lab)) + 1))
    w = labels.shape[1]
    ys, xs = idx // w, idx % w
    areas = np.diff(np.concatenate((starts, [len(lab)])))
    x0, x1 = np.minimum.reduceat(xs, starts), np.maximum.reduceat(xs, starts) + 1
    y0, y1 = np.minimum.reduceat(ys, starts), np.maximum.reduceat(ys, starts) + 1
    return [(int(areas[i]), int(x0[i]), int(y0[i]), int(x1[i]), int(y1[i]), int(lab[s]))
            for i, s in enumerate(starts)], labels


def sort_reading_order(boxes):
    """Rows top to bottom, each row left to right. A piece joins the row it shares most of its height with."""
    if len(boxes) <= 1:
        return list(boxes)
    rows = []
    for b in sorted(boxes, key=lambda b: (b[2] + b[4]) * 0.5):
        best, best_share = None, 0.5
        for row in rows:
            top = sum(r[2] for r in row) / len(row)
            bot = sum(r[4] for r in row) / len(row)
            share = (min(b[4], bot) - max(b[2], top)) / max(1.0, min(b[4] - b[2], bot - top))
            if share >= best_share:
                best, best_share = row, share
        if best is None:
            rows.append([b])
        else:
            best.append(b)
    rows.sort(key=lambda row: sum((r[2] + r[4]) * 0.5 for r in row) / len(row))
    return [b for row in rows for b in sorted(row, key=lambda r: r[1])]


def write_sheet_preview(cutouts, out_path):
    """A checkerboard contact sheet of the cutouts, for a look before use."""
    if not cutouts:
        return
    cols = min(4, len(cutouts))
    rows = math.ceil(len(cutouts) / cols)
    cell = 300
    W, H = cols * cell, rows * cell
    yy, xx = np.indices((H, W))
    chk = (((xx // 16) + (yy // 16)) % 2 == 0)
    bg = np.where(chk[:, :, None], np.array([224, 224, 224], dtype=np.uint8), np.array([196, 196, 196], dtype=np.uint8))
    canvas = Image.fromarray(bg, mode='RGB').convert('RGBA')
    draw = ImageDraw.Draw(canvas)
    for i, (name, im) in enumerate(cutouts):
        r, c = divmod(i, cols)
        x0, y0 = c * cell, r * cell
        thumb = im.copy()
        thumb.thumbnail((cell - 28, cell - 46), Image.Resampling.LANCZOS)
        ox = x0 + (cell - thumb.width) // 2
        oy = y0 + (cell - 22 - thumb.height) // 2
        canvas.alpha_composite(thumb, (ox, oy))
        draw.rectangle([x0, y0 + cell - 24, x0 + cell - 1, y0 + cell - 1], fill=(35, 32, 28, 210))
        draw.text((x0 + 8, y0 + cell - 19), f'{name} ({im.width}x{im.height})', fill=(250, 244, 232, 255))
    canvas.convert('RGB').save(out_path)


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument('input', help='the sheet, or one piece on a backdrop (PNG/JPG/WEBP)')
    ap.add_argument('--out', required=True, help='folder for the PNG cutouts')
    ap.add_argument('--key', default='auto', help='auto | magenta | green | #RRGGBB (auto: the PNG\'s own alpha, else the corner colour)')
    ap.add_argument('--tol', type=float, default=65.0, help='colour distance that still counts as backdrop (default 65)')
    ap.add_argument('--despill', type=int, default=2, help='width in px of the edge cleaned of key colour; 0 leaves the edge as it is (default 2)')
    ap.add_argument('--min-area', type=float, default=0.004, help='smallest piece kept, as a share of the image area (default 0.004)')
    ap.add_argument('--pad', type=int, default=12, help='clear border around each piece in px (default 12)')
    ap.add_argument('--names', default='', help='one output name per piece, comma-separated, in reading order')
    ap.add_argument('--keep-holes', action='store_true', help='clear the outside backdrop only, never a hole inside a piece')
    ap.add_argument('--punch-holes', action='store_true', help='clear backdrop-coloured holes on a white or grey backdrop too')
    ap.add_argument('--sheet-preview', action='store_true', help='also write _preview.png, the cutouts on a checkerboard')
    a = ap.parse_args()
    if a.pad < 0 or a.despill < 0 or not 0 <= a.min_area < 1 or a.tol <= 0:
        sys.exit(f'{ME}: --pad and --despill take 0 or more, --min-area a share from 0 up to 1, --tol more than 0')
    names = [s.strip() for s in a.names.split(',') if s.strip()]
    bad = [n for n in names if not re.fullmatch(r'[A-Za-z0-9][A-Za-z0-9._-]*', n)]
    if bad:
        sys.exit(f'{ME}: --names takes plain file names (letters, digits, . _ -), not {bad[0]!r}')
    if len({n.lower() for n in names}) != len(names):
        sys.exit(f'{ME}: --names repeats a name; each piece needs its own')
    try:
        src = Image.open(a.input)
        src.load()
    except (OSError, ValueError) as e:
        sys.exit(f'{ME}: cannot read {a.input}: {e}')

    arr = np.array(src.convert('RGBA'))
    rgb = arr[:, :, :3].astype(np.float32)
    in_alpha = arr[:, :, 3]
    h, w = in_alpha.shape
    if a.key.strip().lower() == 'auto' and float(np.median(corner_patch(in_alpha))) < 32:
        # the sheet is already cut out: its own alpha is the backdrop, and the colours are left alone
        kind, key_rgb, key_note = 'alpha', (0.0, 0.0, 0.0), 'the image\'s own alpha'
        alpha_u8 = in_alpha.copy()
        out_rgb = rgb
    else:
        kind, key_rgb = parse_key_color(a.key, rgb)
        key_note = f'{kind} {tuple(round(c) for c in key_rgb)}'
        dist = key_distance(rgb, kind, key_rgb)
        # the outside backdrop always goes; holes inside a piece only on a saturated key, so a white or cream
        # backdrop never eats white eyes or paper highlights unless --punch-holes says so
        hard_bg = flood_exterior(dist <= a.tol)
        saturated = kind in ('magenta', 'green') or (max(key_rgb) - min(key_rgb)) >= 40.0
        if not a.keep_holes and (saturated or a.punch_holes):
            hard_bg = hard_bg | (dist <= a.tol * 0.62)
        if a.despill > 0:
            alpha, out_rgb = matte_edges(rgb, hard_bg, dist, a.tol, key_rgb, band=a.despill)
        else:
            alpha, out_rgb = np.where(hard_bg, 0.0, 1.0), rgb
        alpha_u8 = np.clip(np.round(np.minimum(alpha * 255.0, in_alpha.astype(np.float32))), 0, 255).astype(np.uint8)
        out_rgb = despill_edges(out_rgb, alpha_u8, kind, a.despill)

    found, labels = islands(alpha_u8 > 24)
    min_px = max(16, int(w * h * a.min_area))
    boxes = sort_reading_order([b for b in found if b[0] >= min_px])
    dropped = sorted((b for b in found if 16 <= b[0] < min_px), reverse=True)
    drop_note = ''
    if dropped:
        big = ', '.join(f'{b[3] - b[1]}x{b[4] - b[2]} px at ({b[1]},{b[2]})' for b in dropped[:4])
        drop_note = (f'  dropped {len(dropped)} small island(s) under --min-area {a.min_area:g} ({min_px} px): {big}'
                     f'{", ..." if len(dropped) > 4 else ""}')
    if not boxes:
        sys.exit(f'{ME}: no pieces found (backdrop: {key_note}, --tol {a.tol:g})' + ('\n' + drop_note if drop_note else ''))
    print(f'extract_cutouts: {os.path.basename(a.input)} ({w}x{h}), backdrop {key_note} -> {len(boxes)} piece(s)')
    if names and len(names) != len(boxes):
        for i, (area, x0, y0, x1, y1, _) in enumerate(boxes):
            print(f'  [{i + 1}] {x1 - x0}x{y1 - y0} px at ({x0},{y0})')
        if drop_note:
            print(drop_note)
        sys.exit(f'{ME}: --names gives {len(names)} name(s) for {len(boxes)} piece(s); nothing written. '
                 f'Match the list to the pieces above (reading order), or change --min-area.')

    os.makedirs(a.out, exist_ok=True)
    rgba = np.dstack([np.clip(np.round(out_rgb), 0, 255).astype(np.uint8), alpha_u8])
    saved = []
    for idx, (area, x0, y0, x1, y1, lbl) in enumerate(boxes):
        piece_name = names[idx] if names else f'piece_{idx + 1:02d}'
        bw, bh = x1 - x0, y1 - y0
        piece = np.zeros((bh + 2 * a.pad, bw + 2 * a.pad, 4), dtype=np.uint8)
        crop = rgba[y0:y1, x0:x1].copy()
        crop[labels[y0:y1, x0:x1] != lbl, 3] = 0           # another piece, or a speck, inside this box
        piece[a.pad:a.pad + bh, a.pad:a.pad + bw] = crop
        # clear pixels take the colour of the edge beside them, so a filtered texture never shows a backdrop halo
        col = piece[:, :, :3].astype(np.float32)
        reached = bleed(col, piece[:, :, 3] > 24, 4)
        clear = piece[:, :, 3] == 0
        col[~reached] = 0.0
        piece[:, :, :3][clear] = np.clip(np.round(col[clear]), 0, 255).astype(np.uint8)
        out_im = Image.fromarray(piece, mode='RGBA')
        out_im.save(os.path.join(a.out, f'{piece_name}.png'))
        saved.append((piece_name, out_im))
        print(f'  [{idx + 1}] {piece_name}.png  {piece.shape[1]}x{piece.shape[0]}  from ({x0},{y0})-({x1},{y1})  fill {100.0 * area / max(1, bw * bh):.0f}%')
    if drop_note:
        print(drop_note)
    if a.sheet_preview:
        prev_path = os.path.join(a.out, '_preview.png')
        write_sheet_preview(saved, prev_path)
        print(f'  preview -> {prev_path}')


if __name__ == '__main__':
    main()
