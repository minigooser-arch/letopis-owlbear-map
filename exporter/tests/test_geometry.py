from letopis_map_exporter.geometry import chunk_for_block, logical_tile_for_block, required_tiles
from letopis_map_exporter.models import Border


def test_negative_flooring_and_anchor():
    assert logical_tile_for_block(-1, -10001, 4000, -10000) == (-1, -1)
    assert logical_tile_for_block(0, -10000, 4000, -10000) == (0, 0)
    assert chunk_for_block(-1) == -1
    assert chunk_for_block(-16) == -1
    assert chunk_for_block(-17) == -2


def test_required_tiles_cover_current_border():
    tiles = required_tiles(Border(-5760, 12640, -16720, -6960), 4000, -10000)
    assert {(t.gx, t.gz) for t in tiles} == {
        (-2,-2),(-1,-2),(0,-2),(1,-2),(2,-2),(3,-2),
        (-2,-1),(-1,-1),(0,-1),(1,-1),(2,-1),(3,-1),
        (-2,0),(-1,0),(0,0),(1,0),(2,0),(3,0),
    }


def test_exact_boundary_does_not_add_extra_tile():
    tiles = required_tiles(Border(0, 4000, -10000, -6000), 4000, -10000)
    assert {(t.gx, t.gz) for t in tiles} == {(0, 0)}
