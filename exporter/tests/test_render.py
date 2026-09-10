from pathlib import Path
from PIL import Image
import pytest
from letopis_map_exporter.http_source import SourceTile
from letopis_map_exporter.models import Border, LogicalTile
from letopis_map_exporter.render import source_coords_for_logical_tile, render_logical_tile, required_source_coords

def _source(path:Path,rgba):
    path.parent.mkdir(parents=True,exist_ok=True); img=Image.new('RGBA',(501,1002),(0,0,0,0)); img.paste(rgba,(0,0,501,501)); img.save(path); return path

def test_logical_tile_uses_exactly_eight_by_eight_sources():
    c=source_coords_for_logical_tile(LogicalTile(0,-1)); assert len(c)==64; assert min(x for x,_ in c)==0; assert max(x for x,_ in c)==7; assert min(z for _,z in c)==-28; assert max(z for _,z in c)==-21

def test_required_coords_deduplicate_neighbors():
    c=required_source_coords({LogicalTile(0,0),LogicalTile(1,0)}); assert len(c)==128
    border=Border(-5760,12640,-16720,-6960); from letopis_map_exporter.geometry import required_tiles
    assert len(required_source_coords(required_tiles(border,4000,-10000), border, 4000, -10000, 500)) == 798

def test_render_orientation_size_and_exact_border_mask(tmp_path):
    idx={}
    for tz in range(-20,-12):
      for tx in range(0,8):
        p=_source(tmp_path/f'{tx}_{tz}.png',(tx*20,(tz+20)*20,10,255)); idx[(tx,tz)]=SourceTile(tx,tz,p)
    result=render_logical_tile(LogicalTile(0,0),idx,Border(160,3840,-9840,-6160),2)
    assert result.size==(2000,2000); assert result.getpixel((10,10))[3]==0; assert result.getpixel((100,100))[3]>0
    assert result.getpixel((100,100))[0] < result.getpixel((1900,100))[0]; assert result.getpixel((100,100))[1] < result.getpixel((100,1900))[1]

def test_missing_source_inside_border_aborts():
    with pytest.raises(RuntimeError,match='missing BlueMap source tile'): render_logical_tile(LogicalTile(0,0),{},Border(0,500,-10000,-9500),2)
