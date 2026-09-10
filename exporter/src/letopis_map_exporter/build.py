from __future__ import annotations
import json
import shutil
from pathlib import Path
from tempfile import TemporaryDirectory
from PIL import Image
from .geometry import logical_tile_bounds, required_tiles
from .http_source import download_tiles
from .models import Border, ExporterConfig
from .render import render_logical_tile, required_source_coords


def configured_border(config: ExporterConfig) -> Border:
    b=config.border
    assert None not in (b.min_x,b.max_x_exclusive,b.min_z,b.max_z_exclusive)
    return Border(int(b.min_x),int(b.max_x_exclusive),int(b.min_z),int(b.max_z_exclusive))


def build_static_site_map(config: ExporterConfig, output: Path, revision: int) -> Path:
    if revision < 1: raise ValueError('revision must be positive')
    border=configured_border(config)
    logical=sorted(required_tiles(border,config.export.blocks_per_tile,config.minecraft_grid.anchor_z))
    if output.exists(): shutil.rmtree(output)
    output.mkdir(parents=True, exist_ok=True); tiles_dir=output/'tiles'; tiles_dir.mkdir(exist_ok=True)
    with TemporaryDirectory(prefix='letopis-bluemap-') as td:
        coords=required_source_coords(logical,border,config.export.blocks_per_tile,config.minecraft_grid.anchor_z,config.bluemap.source_tile_blocks)
        source=download_tiles(config.bluemap,coords,Path(td))
        manifest_tiles=[]; px=config.export.blocks_per_tile//config.export.blocks_per_pixel
        for tile in logical:
            img=render_logical_tile(tile,source,border,config.export.blocks_per_pixel,config.export.blocks_per_tile,config.minecraft_grid.anchor_z,config.bluemap.source_tile_blocks)
            target=tiles_dir/f'{tile.id}.png'; img.save(target,'PNG',compress_level=6)
            with Image.open(target) as check:
                check.load()
                if check.size != (px,px): raise RuntimeError(f'bad output size for {tile.id}')
            bounds=logical_tile_bounds(tile,config.export.blocks_per_tile,config.minecraft_grid.anchor_z)
            manifest_tiles.append({'id':tile.id,'gx':tile.gx,'gz':tile.gz,'minX':bounds.min_x,'maxXExclusive':bounds.max_x_exclusive,'minZ':bounds.min_z,'maxZExclusive':bounds.max_z_exclusive,'pixelWidth':px,'pixelHeight':px,'url':f'tiles/{tile.id}.png?v={revision}'})
    manifest={'revision':revision,'map':config.bluemap.map_id,'grid':{'chunksPerCell':config.minecraft_grid.chunks_per_cell,'blocksPerCell':config.minecraft_grid.blocks_per_cell,'anchorMinecraftX':config.minecraft_grid.anchor_x,'anchorMinecraftZ':config.minecraft_grid.anchor_z,'anchorCorner':config.minecraft_grid.anchor_corner},'render':{'blocksPerTile':config.export.blocks_per_tile,'blocksPerPixel':config.export.blocks_per_pixel},'border':{'minX':border.min_x,'maxXExclusive':border.max_x_exclusive,'minZ':border.min_z,'maxZExclusive':border.max_z_exclusive},'tiles':manifest_tiles}
    (output/'manifest.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2)+'\n',encoding='utf-8')
    (output/'current.json').write_text(json.dumps({'revision':revision},indent=2)+'\n',encoding='utf-8')
    return output
