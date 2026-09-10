from __future__ import annotations
import io
from pathlib import Path
from PIL import Image


def read_png(path: Path) -> Image.Image:
    payload = path.read_bytes()
    try:
        with Image.open(io.BytesIO(payload)) as image:
            image.load()
            return image.copy()
    except Exception as exc:
        raise RuntimeError(f"failed to decode PNG {path}: {exc}") from exc


def decode_color_plane(image: Image.Image, source_tile_blocks: int = 500) -> Image.Image:
    expected = (source_tile_blocks + 1, (source_tile_blocks + 1) * 2)
    if image.size != expected:
        raise ValueError(f"expected BlueMap 5.16 lowres PNG geometry {expected}, got {image.size}")
    return image.crop((0, 0, source_tile_blocks, source_tile_blocks)).convert("RGBA")
