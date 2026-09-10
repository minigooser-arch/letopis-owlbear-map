from pathlib import Path
import json, subprocess
from PIL import Image
ROOT=Path(__file__).resolve().parents[2]
PAGES_BASE='https://minigooser-arch.github.io/letopis-owlbear-map/'

def test_assemble_and_verify_pages_site(tmp_path):
    ext=tmp_path/'dist'; ext.mkdir();
    (ext/'manifest.json').write_text(json.dumps({
        'name':'x',
        'version':'1',
        'manifest_version':1,
        'icon':f'{PAGES_BASE}icon.svg',
        'background_url':f'{PAGES_BASE}background.html',
        'action':{
            'title':'x',
            'icon':f'{PAGES_BASE}icon.svg',
            'popover':f'{PAGES_BASE}index.html',
        },
    }))
    for name in ['icon.svg','background.html','index.html']:(ext/name).write_text('x')
    mapdir=tmp_path/'map'; tiles=mapdir/'tiles'; tiles.mkdir(parents=True)
    revision=9; mt=[]
    for gz in (-2,-1,0):
      for gx in (-2,-1,0,1,2,3):
        tid=f'x_{gx}_z_{gz}'; Image.new('RGBA',(2000,2000),(0,0,0,0)).save(tiles/f'{tid}.png',compress_level=1)
        mt.append({'id':tid,'gx':gx,'gz':gz,'minX':gx*4000,'maxXExclusive':gx*4000+4000,'minZ':-10000+gz*4000,'maxZExclusive':-6000+gz*4000,'pixelWidth':2000,'pixelHeight':2000,'url':f'tiles/{tid}.png?v={revision}'})
    manifest={'revision':revision,'map':'world','grid':{'chunksPerCell':10,'blocksPerCell':160,'anchorMinecraftX':0,'anchorMinecraftZ':-10000,'anchorCorner':'upper-right'},'render':{'blocksPerTile':4000,'blocksPerPixel':2},'border':{'minX':-5760,'maxXExclusive':12640,'minZ':-16720,'maxZExclusive':-6960},'tiles':mt}
    (mapdir/'current.json').write_text(json.dumps({'revision':revision})); (mapdir/'manifest.json').write_text(json.dumps(manifest))
    site=tmp_path/'site'; subprocess.run([str(ROOT/'scripts/assemble-pages.sh'),str(ext),str(mapdir),str(site)],check=True)
    run=subprocess.run(['python',str(ROOT/'scripts/verify-pages.py'),str(site)],check=True,text=True,capture_output=True)
    assert 'PASS' in run.stdout; assert (site/'map/tiles/x_0_z_0.png').is_file()
