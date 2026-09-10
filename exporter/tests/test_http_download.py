from __future__ import annotations
from http.server import BaseHTTPRequestHandler, ThreadingHTTPServer
from pathlib import Path
from threading import Thread
from PIL import Image
import io
import pytest

from letopis_map_exporter.http_source import download_tiles, bluemap_tile_relative_path
from letopis_map_exporter.models import BlueMapConfig


def _png_bytes() -> bytes:
    buf=io.BytesIO(); Image.new('RGBA',(501,1002),(1,2,3,255)).save(buf,'PNG'); return buf.getvalue()

class Handler(BaseHTTPRequestHandler):
    hits: dict[str,int] = {}
    transient_path: str | None = None
    payload = _png_bytes()
    def log_message(self,*args): pass
    def do_GET(self):
        type(self).hits[self.path]=type(self).hits.get(self.path,0)+1
        if self.path == type(self).transient_path and type(self).hits[self.path] == 1:
            self.send_response(500); self.end_headers(); return
        if '/missing/' in self.path:
            self.send_response(404); self.end_headers(); return
        if self.path.endswith('.png'):
            self.send_response(200); self.send_header('Content-Type','image/png'); self.send_header('Content-Length',str(len(self.payload))); self.end_headers(); self.wfile.write(self.payload); return
        self.send_response(404); self.end_headers()

@pytest.fixture
def server():
    Handler.hits={}; Handler.transient_path=None
    httpd=ThreadingHTTPServer(('127.0.0.1',0),Handler); t=Thread(target=httpd.serve_forever,daemon=True); t.start()
    try: yield httpd
    finally: httpd.shutdown(); t.join()


def cfg(server, retries=2):
    # Unit test deliberately uses localhost HTTP; production config validation still requires HTTPS.
    return BlueMapConfig(f'http://127.0.0.1:{server.server_port}','world',1,500,2,retries,4)


def test_download_uses_exact_bluemap_path_and_deduplicated_coords(server,tmp_path):
    coords={(0,-20),(5,7)}
    result=download_tiles(cfg(server),coords,tmp_path)
    assert set(result)==coords
    assert Handler.hits['/'+bluemap_tile_relative_path(0,-20)]==1
    assert result[(0,-20)].path.read_bytes()==Handler.payload


def test_download_retries_transient_server_error(server,tmp_path):
    path='/'+bluemap_tile_relative_path(-12,-23); Handler.transient_path=path
    result=download_tiles(cfg(server,retries=2),{(-12,-23)},tmp_path)
    assert (-12,-23) in result
    assert Handler.hits[path]==2


def test_download_failure_is_fatal(server,tmp_path):
    # Force an invalid base path that the handler will 404.
    c=cfg(server,retries=1); c=BlueMapConfig(c.base_url+'/missing',c.map_id,c.lod,c.source_tile_blocks,c.timeout_seconds,c.retries,c.workers)
    with pytest.raises(RuntimeError,match='failed to download BlueMap tile'):
        download_tiles(c,{(0,-20)},tmp_path)
