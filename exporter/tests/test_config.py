from pathlib import Path
import pytest
TEST_ROOT = Path(__file__).resolve().parent

from letopis_map_exporter.config import load_config


def test_loads_approved_defaults(tmp_path: Path):
    cfg = tmp_path / 'config.yml'
    cfg.write_text('''
bluemap:
  baseUrl: https://map.letopisrp.ru/maps/world/tiles/1
  timeoutSeconds: 15
  retries: 3
  workers: 12
  map: world
  lod: 1
  sourceTileBlocks: 500
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
    loaded = load_config(cfg)
    assert loaded.bluemap.source_tile_blocks == 500
    assert loaded.border.source == 'corners'
    assert (loaded.border.min_x, loaded.border.max_x_exclusive) == (-5760, 12640)
    assert (loaded.border.min_z, loaded.border.max_z_exclusive) == (-16720, -6960)
    assert loaded.minecraft_grid.blocks_per_cell == 160
    assert loaded.export.blocks_per_tile == 4000
    assert loaded.bluemap.base_url == 'https://map.letopisrp.ru/maps/world/tiles/1'
    assert loaded.bluemap.workers == 12


def test_rejects_grid_that_breaks_4000_block_alignment(tmp_path: Path):
    cfg = tmp_path / 'config.yml'
    cfg.write_text((TEST_ROOT.parent / 'config.example.yml').read_text().replace('blocksPerCell: 160', 'blocksPerCell: 161'), encoding='utf-8')
    with pytest.raises(ValueError, match='blocksPerCell must equal chunksPerCell'):
        load_config(cfg)


def test_rejects_incomplete_corner_border(tmp_path: Path):
    cfg = tmp_path / 'config.yml'
    text = (TEST_ROOT.parent / 'config.example.yml').read_text(encoding='utf-8')
    text = text.replace('  maxZExclusive: -6960\n', '')
    cfg.write_text(text, encoding='utf-8')
    with pytest.raises(ValueError, match='corner border requires'):
        load_config(cfg)
