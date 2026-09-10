from __future__ import annotations

from concurrent.futures import ThreadPoolExecutor, as_completed
from dataclasses import dataclass
from pathlib import Path
import time
from urllib.error import HTTPError, URLError
from urllib.request import Request, urlopen

from .models import BlueMapConfig


@dataclass(frozen=True)
class SourceTile:
    tx: int
    tz: int
    path: Path


def bluemap_tile_relative_path(tx: int, tz: int) -> str:
    encoded = f"x{tx}z{tz}"
    parts: list[str] = []
    buf = ""
    for char in encoded:
        buf += char
        if char.isdigit():
            parts.append(buf)
            buf = ""
    if buf or not parts:
        raise ValueError(f"cannot encode BlueMap tile coordinates: {tx}, {tz}")
    parts[-1] += ".png"
    return "/".join(parts)


def tile_url(config: BlueMapConfig, tx: int, tz: int) -> str:
    return f"{config.base_url}/{bluemap_tile_relative_path(tx, tz)}"


def _download_one(config: BlueMapConfig, tx: int, tz: int, root: Path) -> SourceTile:
    rel = Path(bluemap_tile_relative_path(tx, tz))
    target = root / rel
    target.parent.mkdir(parents=True, exist_ok=True)
    url = tile_url(config, tx, tz)
    last: Exception | None = None
    for attempt in range(config.retries):
        try:
            req = Request(url, headers={"User-Agent": "LetopisMapSync/1.0", "Accept": "image/png"})
            with urlopen(req, timeout=config.timeout_seconds) as response:
                status = getattr(response, "status", 200)
                if status != 200:
                    raise RuntimeError(f"HTTP {status} for {url}")
                content_type = response.headers.get_content_type()
                if content_type not in {"image/png", "application/octet-stream"}:
                    raise RuntimeError(f"unexpected content-type {content_type!r} for {url}")
                payload = response.read()
            target.write_bytes(payload)
            return SourceTile(tx, tz, target)
        except (HTTPError, URLError, TimeoutError, RuntimeError, OSError) as exc:
            last = exc
            if attempt + 1 < config.retries:
                time.sleep(min(2 ** attempt, 4))
    raise RuntimeError(f"failed to download BlueMap tile ({tx},{tz}) from {url}: {last}")


def download_tiles(config: BlueMapConfig, coords: set[tuple[int, int]], root: Path) -> dict[tuple[int, int], SourceTile]:
    root.mkdir(parents=True, exist_ok=True)
    result: dict[tuple[int, int], SourceTile] = {}
    with ThreadPoolExecutor(max_workers=config.workers) as pool:
        futures = {pool.submit(_download_one, config, tx, tz, root): (tx, tz) for tx, tz in sorted(coords)}
        try:
            for future in as_completed(futures):
                tile = future.result()
                result[(tile.tx, tile.tz)] = tile
        except Exception:
            for future in futures:
                future.cancel()
            raise
    return result
