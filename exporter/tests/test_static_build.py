from pathlib import Path
import json
from PIL import Image
from letopis_map_exporter.build import build_static_site_map
from letopis_map_exporter.config import load_config
from letopis_map_exporter.http_source import SourceTile

ROOT=Path(__file__).resolve().parent


def test_full_current_border_builds_18_static_pages_tiles(tmp_path, monkeypatch):
    cfg=load_config(ROOT.parent/'config.example.yml')
    fixture=tmp_path/'source.png'
    Image.new('RGBA',(501,1002),(20,40,60,255)).save(fixture)
    seen={}
    def fake_download(config, coords, root):
        seen['count']=len(coords)
        return {(tx,tz): SourceTile(tx,tz,fixture) for tx,tz in coords}
    monkeypatch.setattr('letopis_map_exporter.build.download_tiles', fake_download)
    out=tmp_path/'map'
    build_static_site_map(cfg,out,revision=77)
    current=json.loads((out/'current.json').read_text())
    manifest=json.loads((out/'manifest.json').read_text())
    pngs=sorted((out/'tiles').glob('*.png'))
    assert current=={'revision':77}
    assert manifest['revision']==77
    assert manifest['border']=={'minX':-5760,'maxXExclusive':12640,'minZ':-16720,'maxZExclusive':-6960}
    assert len(manifest['tiles'])==18
    assert len(pngs)==18
    assert seen['count']==798
    assert all(t['url'].startswith('tiles/') and t['url'].endswith('?v=77') for t in manifest['tiles'])
    with Image.open(pngs[0]) as image: assert image.size==(2000,2000)
    assert not (out/'revisions').exists()
