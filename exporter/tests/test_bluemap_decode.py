from pathlib import Path
from PIL import Image
import pytest
from letopis_map_exporter.bluemap_decode import decode_color_plane, read_png


def test_lowres_geometry_and_color_plane(tmp_path: Path):
    source = tmp_path / "lowres.png"
    image = Image.new("RGBA", (501, 1002), (0, 0, 0, 0))
    for x in range(500):
        image.putpixel((x, 0), (10, 20, 30, 255))
    image.save(source)
    decoded = read_png(source)
    assert decoded.size == (501, 1002)
    color = decode_color_plane(decoded)
    assert color.size == (500, 500)
    assert color.mode == "RGBA"
    assert color.getpixel((0, 0)) == (10, 20, 30, 255)


def test_rejects_unexpected_geometry(tmp_path):
    p = tmp_path / "bad.png"
    Image.new("RGBA", (500, 500)).save(p)
    with pytest.raises(ValueError, match="expected BlueMap 5.16"):
        decode_color_plane(read_png(p))
