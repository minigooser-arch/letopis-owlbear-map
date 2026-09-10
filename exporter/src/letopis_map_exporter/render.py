from __future__ import annotations
from PIL import Image, ImageDraw
from .bluemap_decode import decode_color_plane, read_png
from .http_source import SourceTile
from .geometry import intersects, logical_tile_bounds
from .models import Border, LogicalTile

SOURCE_BLOCKS = 500
LOGICAL_BLOCKS = 4000


def source_coords_for_logical_tile(tile: LogicalTile, blocks_per_tile: int = LOGICAL_BLOCKS, anchor_z: int = -10000, source_tile_blocks: int = SOURCE_BLOCKS) -> list[tuple[int, int]]:
    bounds = logical_tile_bounds(tile, blocks_per_tile, anchor_z)
    if bounds.min_x % source_tile_blocks or bounds.min_z % source_tile_blocks:
        raise ValueError("logical tile minima must align to BlueMap source tiles")
    count = blocks_per_tile // source_tile_blocks
    start_x = bounds.min_x // source_tile_blocks
    start_z = bounds.min_z // source_tile_blocks
    return [(tx, tz) for tz in range(start_z, start_z + count) for tx in range(start_x, start_x + count)]


def required_source_coords(tiles: set[LogicalTile] | list[LogicalTile], border: Border | None = None, blocks_per_tile: int = LOGICAL_BLOCKS, anchor_z: int = -10000, source_tile_blocks: int = SOURCE_BLOCKS) -> set[tuple[int, int]]:
    out: set[tuple[int, int]] = set()
    for tile in tiles:
        for tx, tz in source_coords_for_logical_tile(tile, blocks_per_tile, anchor_z, source_tile_blocks):
            if border is not None:
                src = Border(tx * source_tile_blocks, (tx + 1) * source_tile_blocks, tz * source_tile_blocks, (tz + 1) * source_tile_blocks)
                if not intersects(src, border):
                    continue
            out.add((tx, tz))
    return out


def render_logical_tile(tile: LogicalTile, source_index: dict[tuple[int, int], SourceTile], border: Border, blocks_per_pixel: int,
                        blocks_per_tile: int = LOGICAL_BLOCKS, anchor_z: int = -10000, source_tile_blocks: int = SOURCE_BLOCKS) -> Image.Image:
    if blocks_per_tile % blocks_per_pixel or source_tile_blocks % blocks_per_pixel:
        raise ValueError("blocks_per_pixel must evenly divide source and logical tile sizes")
    bounds = logical_tile_bounds(tile, blocks_per_tile, anchor_z)
    out_size = blocks_per_tile // blocks_per_pixel
    source_px = source_tile_blocks // blocks_per_pixel
    canvas = Image.new("RGBA", (out_size, out_size), (0, 0, 0, 0))
    for tx, tz in source_coords_for_logical_tile(tile, blocks_per_tile, anchor_z, source_tile_blocks):
        src_bounds = Border(tx*source_tile_blocks,(tx+1)*source_tile_blocks,tz*source_tile_blocks,(tz+1)*source_tile_blocks)
        source = source_index.get((tx,tz))
        if source is None:
            if intersects(src_bounds, border):
                raise RuntimeError(f"missing BlueMap source tile ({tx},{tz}) inside active border")
            continue
        color = decode_color_plane(read_png(source.path), source_tile_blocks)
        if blocks_per_pixel != 1:
            color = color.resize((source_px, source_px), Image.Resampling.LANCZOS)
        x = (src_bounds.min_x - bounds.min_x) // blocks_per_pixel
        z = (src_bounds.min_z - bounds.min_z) // blocks_per_pixel
        canvas.paste(color, (x, z), color)

    ix0=max(border.min_x,bounds.min_x)-bounds.min_x; iz0=max(border.min_z,bounds.min_z)-bounds.min_z
    ix1=min(border.max_x_exclusive,bounds.max_x_exclusive)-bounds.min_x; iz1=min(border.max_z_exclusive,bounds.max_z_exclusive)-bounds.min_z
    ix0 //= blocks_per_pixel; iz0 //= blocks_per_pixel; ix1 //= blocks_per_pixel; iz1 //= blocks_per_pixel
    if ix0 >= ix1 or iz0 >= iz1:
        return Image.new("RGBA", canvas.size, (0,0,0,0))
    if (ix0,iz0,ix1,iz1)!=(0,0,out_size,out_size):
        mask=Image.new("L", canvas.size, 0)
        ImageDraw.Draw(mask).rectangle((ix0,iz0,ix1-1,iz1-1), fill=255)
        alpha=canvas.getchannel('A')
        alpha.paste(0,(0,0,out_size,out_size),Image.eval(mask,lambda p:255-p))
        canvas.putalpha(alpha)
    return canvas
