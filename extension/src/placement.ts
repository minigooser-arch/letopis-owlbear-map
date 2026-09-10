import type { ManifestTile } from "./contracts";
import { minecraftToScene, type Vec2 } from "./coordinates";
import { BLOCKS_PER_CELL } from "./constants";

export type TilePlacement = {
  position: Vec2;
  scale: Vec2;
  imageGridDpi: number;
  sceneWidth: number;
  sceneHeight: number;
  left: number;
  top: number;
  right: number;
  bottom: number;
};

export function tilePlacement(
  tile: ManifestTile,
  anchor: Vec2,
  gridDpi: number,
): TilePlacement {
  const position = minecraftToScene(
    { x: tile.minX, z: tile.minZ },
    anchor,
    gridDpi,
  );
  const cellsWide =
    (tile.maxXExclusive - tile.minX) / BLOCKS_PER_CELL;
  const cellsHigh =
    (tile.maxZExclusive - tile.minZ) / BLOCKS_PER_CELL;

  // ImageGrid.dpi describes how many source-image pixels make one grid cell.
  // Owlbear maps that image grid onto the scene grid itself, so scale must stay
  // at 1. Multiplying by sceneDpi/imageGridDpi here would apply the scene DPI
  // twice and make the map too large.
  const imageGridDpi = tile.pixelWidth / cellsWide;
  const scale = { x: 1, y: 1 };

  const sceneWidth = cellsWide * gridDpi;
  const sceneHeight = cellsHigh * gridDpi;
  return {
    position,
    scale,
    imageGridDpi,
    sceneWidth,
    sceneHeight,
    left: position.x,
    top: position.y,
    right: position.x + sceneWidth,
    bottom: position.y + sceneHeight,
  };
}
