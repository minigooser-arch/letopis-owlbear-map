from __future__ import annotations

from .models import Border, LogicalTile


def logical_tile_for_block(x: int, z: int, blocks_per_tile: int = 4000, anchor_z: int = -10000) -> tuple[int, int]:
    return x // blocks_per_tile, (z - anchor_z) // blocks_per_tile


def chunk_for_block(value: int) -> int:
    return value // 16


def logical_tile_bounds(tile: LogicalTile, blocks_per_tile: int = 4000, anchor_z: int = -10000) -> Border:
    min_x = tile.gx * blocks_per_tile
    min_z = anchor_z + tile.gz * blocks_per_tile
    return Border(min_x, min_x + blocks_per_tile, min_z, min_z + blocks_per_tile)


def required_tiles(border: Border, blocks_per_tile: int = 4000, anchor_z: int = -10000) -> set[LogicalTile]:
    if border.max_x_exclusive <= border.min_x or border.max_z_exclusive <= border.min_z:
        return set()
    first_gx, first_gz = logical_tile_for_block(border.min_x, border.min_z, blocks_per_tile, anchor_z)
    last_gx, last_gz = logical_tile_for_block(border.max_x_exclusive - 1, border.max_z_exclusive - 1, blocks_per_tile, anchor_z)
    return {LogicalTile(gx, gz) for gx in range(first_gx, last_gx + 1) for gz in range(first_gz, last_gz + 1)}


def intersects(a: Border, b: Border) -> bool:
    return not (
        a.max_x_exclusive <= b.min_x or b.max_x_exclusive <= a.min_x or
        a.max_z_exclusive <= b.min_z or b.max_z_exclusive <= a.min_z
    )
