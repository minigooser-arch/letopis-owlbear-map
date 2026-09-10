from __future__ import annotations
from pathlib import Path
from urllib.parse import urlparse
import yaml
from .models import BlueMapConfig, BorderConfig, ExportConfig, ExporterConfig, MinecraftGridConfig

def _required(mapping: dict, key: str):
    if key not in mapping:
        raise ValueError(f"missing config key: {key}")
    return mapping[key]

def load_config(path: Path) -> ExporterConfig:
    raw = yaml.safe_load(path.read_text(encoding="utf-8")) or {}
    b = _required(raw, "bluemap"); border = _required(raw, "border"); grid = _required(raw, "minecraftGrid"); exp = _required(raw, "export")
    cfg = ExporterConfig(
        bluemap=BlueMapConfig(
            base_url=str(_required(b,"baseUrl")).rstrip('/'), map_id=str(_required(b,"map")), lod=int(_required(b,"lod")),
            source_tile_blocks=int(_required(b,"sourceTileBlocks")), timeout_seconds=float(_required(b,"timeoutSeconds")),
            retries=int(_required(b,"retries")), workers=int(_required(b,"workers"))),
        border=BorderConfig(source=str(_required(border,"source")), min_x=int(border["minX"]) if "minX" in border else None,
            max_x_exclusive=int(border["maxXExclusive"]) if "maxXExclusive" in border else None,
            min_z=int(border["minZ"]) if "minZ" in border else None, max_z_exclusive=int(border["maxZExclusive"]) if "maxZExclusive" in border else None),
        minecraft_grid=MinecraftGridConfig(chunks_per_cell=int(_required(grid,"chunksPerCell")), blocks_per_cell=int(_required(grid,"blocksPerCell")),
            anchor_x=int(_required(grid,"anchorX")), anchor_z=int(_required(grid,"anchorZ")), anchor_corner=str(_required(grid,"anchorCorner"))),
        export=ExportConfig(blocks_per_tile=int(_required(exp,"blocksPerTile")), blocks_per_pixel=int(_required(exp,"blocksPerPixel"))))
    _validate(cfg); return cfg

def _validate(c: ExporterConfig) -> None:
    p=urlparse(c.bluemap.base_url)
    if p.scheme != 'https' or not p.netloc: raise ValueError('baseUrl must be an HTTPS URL')
    if c.border.source != 'corners': raise ValueError('border.source must be corners')
    vals=(c.border.min_x,c.border.max_x_exclusive,c.border.min_z,c.border.max_z_exclusive)
    if any(v is None for v in vals): raise ValueError('corner border requires minX, maxXExclusive, minZ and maxZExclusive')
    assert c.border.max_x_exclusive is not None and c.border.min_x is not None and c.border.max_z_exclusive is not None and c.border.min_z is not None
    if c.border.max_x_exclusive <= c.border.min_x or c.border.max_z_exclusive <= c.border.min_z: raise ValueError('corner border max values must be greater than min values')
    if c.minecraft_grid.blocks_per_cell != c.minecraft_grid.chunks_per_cell*16: raise ValueError('blocksPerCell must equal chunksPerCell * 16')
    if c.export.blocks_per_tile % c.minecraft_grid.blocks_per_cell: raise ValueError('blocksPerTile must be divisible by blocksPerCell')
    if c.bluemap.source_tile_blocks != 500: raise ValueError('only 500-block BlueMap lowres geometry is supported')
    if c.export.blocks_per_tile % c.bluemap.source_tile_blocks: raise ValueError('blocksPerTile must be divisible by sourceTileBlocks')
    if c.export.blocks_per_pixel <= 0 or c.export.blocks_per_tile % c.export.blocks_per_pixel: raise ValueError('blocksPerTile must be divisible by blocksPerPixel')
    if c.minecraft_grid.anchor_corner != 'upper-right': raise ValueError('anchorCorner must be upper-right')
    if c.bluemap.lod != 1: raise ValueError('only BlueMap lod 1 is supported')
    if c.bluemap.timeout_seconds <= 0 or c.bluemap.retries < 1 or c.bluemap.workers < 1: raise ValueError('HTTP timeout/retries/workers must be positive')
