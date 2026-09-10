import type { MapManifest, ManifestTile } from "./contracts";
import { ITEM_METADATA_KEY } from "./constants";

export type OwnedMetadata = { tileId: string; revision: number };
export type SceneItemLike = { id: string; type: string; metadata?: Record<string, unknown> };
export type OwnedItem = SceneItemLike & { owned: OwnedMetadata };
export type SyncPlan = { create: ManifestTile[]; update: Array<{ item: OwnedItem; tile: ManifestTile }>; delete: OwnedItem[] };

export function ownedItem(item: SceneItemLike): OwnedItem | null {
  if (item.type !== "IMAGE" || !item.metadata) return null;
  const raw = item.metadata[ITEM_METADATA_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;
  const m = raw as Record<string, unknown>;
  if (typeof m.tileId !== "string" || !Number.isInteger(m.revision)) return null;
  return { ...item, owned: { tileId: m.tileId, revision: m.revision as number } };
}
export function planSync(existingItems: SceneItemLike[], manifest: MapManifest): SyncPlan {
  const owned = existingItems.map(ownedItem).filter((x): x is OwnedItem => x !== null);
  const byTile = new Map(owned.map(item => [item.owned.tileId, item]));
  const desired = new Set(manifest.tiles.map(t => t.id));
  const create: ManifestTile[] = []; const update: Array<{item:OwnedItem;tile:ManifestTile}> = [];
  for (const tile of manifest.tiles) {
    const existing = byTile.get(tile.id);
    if (!existing) create.push(tile);
    else if (existing.owned.revision !== manifest.revision) update.push({ item: existing, tile });
  }
  const del = owned.filter(item => !desired.has(item.owned.tileId));
  return { create, update, delete: del };
}
