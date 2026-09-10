import { ANCHOR_Z, BLOCKS_PER_CELL } from "./constants";
export type Vec2 = { x: number; y: number };
export type MinecraftPosition = { x: number; z: number };
export type MinecraftCursor = MinecraftPosition & { chunkX: number; chunkZ: number };

export function minecraftToScene(p: MinecraftPosition, anchor: Vec2, gridDpi: number): Vec2 {
  if (!(gridDpi > 0)) throw new Error("gridDpi must be positive");
  return { x: anchor.x + (p.x / BLOCKS_PER_CELL) * gridDpi, y: anchor.y + ((p.z - ANCHOR_Z) / BLOCKS_PER_CELL) * gridDpi };
}
export function sceneToMinecraft(p: Vec2, anchor: Vec2, gridDpi: number): MinecraftCursor {
  if (!(gridDpi > 0)) throw new Error("gridDpi must be positive");
  const x = Math.floor(((p.x - anchor.x) / gridDpi) * BLOCKS_PER_CELL);
  const z = Math.floor(((p.y - anchor.y) / gridDpi) * BLOCKS_PER_CELL + ANCHOR_Z);
  return { x, z, chunkX: Math.floor(x / 16), chunkZ: Math.floor(z / 16) };
}
