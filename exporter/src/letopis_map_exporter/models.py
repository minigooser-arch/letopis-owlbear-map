from __future__ import annotations
from dataclasses import dataclass

@dataclass(frozen=True)
class BlueMapConfig:
    base_url: str
    map_id: str
    lod: int
    source_tile_blocks: int
    timeout_seconds: float
    retries: int
    workers: int

@dataclass(frozen=True)
class BorderConfig:
    source: str
    min_x: int | None = None
    max_x_exclusive: int | None = None
    min_z: int | None = None
    max_z_exclusive: int | None = None

@dataclass(frozen=True)
class MinecraftGridConfig:
    chunks_per_cell: int
    blocks_per_cell: int
    anchor_x: int
    anchor_z: int
    anchor_corner: str

@dataclass(frozen=True)
class ExportConfig:
    blocks_per_tile: int
    blocks_per_pixel: int

@dataclass(frozen=True)
class ExporterConfig:
    bluemap: BlueMapConfig
    border: BorderConfig
    minecraft_grid: MinecraftGridConfig
    export: ExportConfig

@dataclass(frozen=True)
class Border:
    min_x: int
    max_x_exclusive: int
    min_z: int
    max_z_exclusive: int

@dataclass(frozen=True, order=True)
class LogicalTile:
    gx: int
    gz: int
    @property
    def id(self) -> str:
        return f"x_{self.gx}_z_{self.gz}"
