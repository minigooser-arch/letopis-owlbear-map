#!/usr/bin/env python3
from __future__ import annotations
import json, sys
from pathlib import Path
from PIL import Image
EXPECTED_BORDER={"minX":-5760,"maxXExclusive":12640,"minZ":-16720,"maxZExclusive":-6960}

def fail(msg:str)->None: raise SystemExit(msg)
def main(root:Path)->None:
    ext=root/'manifest.json'; current=root/'map/current.json'; manifest_path=root/'map/manifest.json'; tiles=root/'map/tiles'
    for p in (ext,current,manifest_path):
        if not p.is_file(): fail(f'missing {p}')
    em=json.loads(ext.read_text(encoding='utf-8'))
    if em.get('manifest_version')!=1: fail('invalid Owlbear manifest_version')
    for key in ('icon','background_url'):
        if not isinstance(em.get(key),str) or not em[key].startswith('./'): fail(f'Owlbear {key} must be Pages-relative')
    action=em.get('action',{})
    if not str(action.get('popover','')).startswith('./'): fail('Owlbear action.popover must be Pages-relative')
    cur=json.loads(current.read_text()); m=json.loads(manifest_path.read_text())
    if cur.get('revision')!=m.get('revision') or not isinstance(cur.get('revision'),int) or cur['revision']<1: fail('map revisions do not match')
    if m.get('border')!=EXPECTED_BORDER: fail(f"wrong map border: {m.get('border')}")
    mt=m.get('tiles');
    if not isinstance(mt,list) or len(mt)!=18: fail(f'expected 18 manifest tiles, got {len(mt) if isinstance(mt,list) else "invalid"}')
    files=sorted(tiles.glob('*.png')) if tiles.is_dir() else []
    if len(files)!=18: fail(f'expected 18 PNG files, got {len(files)}')
    ids=set()
    for t in mt:
        tid=t.get('id'); url=t.get('url')
        if not isinstance(tid,str) or tid in ids: fail('invalid/duplicate tile id')
        ids.add(tid)
        if url!=f"tiles/{tid}.png?v={m['revision']}": fail(f'bad relative tile URL for {tid}: {url}')
        p=tiles/f'{tid}.png'
        if not p.is_file(): fail(f'missing tile {p}')
        with Image.open(p) as im:
            im.load()
            if im.size!=(2000,2000): fail(f'wrong PNG size for {tid}: {im.size}')
    print(f"Pages verification PASS: revision={m['revision']} tiles=18 border={EXPECTED_BORDER}")
if __name__=='__main__':
    if len(sys.argv)!=2: fail('usage: verify-pages.py SITE_DIR')
    main(Path(sys.argv[1]))
