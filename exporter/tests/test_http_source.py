from pathlib import Path
import pytest

from letopis_map_exporter.http_source import bluemap_tile_relative_path
from letopis_map_exporter.config import load_config


def test_bluemap_tile_relative_path_matches_file_grid_storage():
    assert bluemap_tile_relative_path(0, -20) == 'x0/z-2/0.png'
    assert bluemap_tile_relative_path(-12, -23) == 'x-1/2/z-2/3.png'
    assert bluemap_tile_relative_path(5, 7) == 'x5/z7.png'


def test_http_bluemap_config_requires_https(tmp_path: Path):
    cfg = tmp_path / 'config.yml'
    cfg.write_text('''
bluemap:
  baseUrl: http://map.letopisrp.ru/maps/world/tiles/1
  map: world
  lod: 1
  sourceTileBlocks: 500
  timeoutSeconds: 15
  retries: 3
  workers: 12
border:
  source: corners
  minX: -5760
  maxXExclusive: 12640
  minZ: -16720
  maxZExclusive: -6960
minecraftGrid:
  chunksPerCell: 10
  blocksPerCell: 160
  anchorX: 0
  anchorZ: -10000
  anchorCorner: upper-right
export:
  blocksPerTile: 4000
  blocksPerPixel: 2
''', encoding='utf-8')
    with pytest.raises(ValueError, match='baseUrl must be an HTTPS URL'):
        load_config(cfg)
