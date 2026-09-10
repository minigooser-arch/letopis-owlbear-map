import type { MapManifest, ManifestTile } from "./contracts";
import { ITEM_METADATA_KEY } from "./constants";

export type OwnedMetadata = { tileId: string; revision: number };
export type SceneItemLike = {
  id: string;
  type: string;
  metadata?: Record<string, unknown>;
};
export type OwnedItem = SceneItemLike & { owned: OwnedMetadata };
export type SyncPlan = {
  create: ManifestTile[];
  update: Array<{ item: OwnedItem; tile: ManifestTile }>;
  delete: OwnedItem[];
};
export type SyncPlanOptions = { forceUpdate?: boolean };

export function ownedItem(item: SceneItemLike): OwnedItem | null {
  if (item.type !== "IMAGE" || !item.metadata) return null;
  const raw = item.metadata[ITEM_METADATA_KEY];
  if (!raw || typeof raw !== "object" || Array.isArray(raw)) return null;

  const metadata = raw as Record<string, unknown>;
  if (
    typeof metadata.tileId !== "string" ||
    !Number.isInteger(metadata.revision)
  ) {
    return null;
  }

  return {
    ...item,
    owned: {
      tileId: metadata.tileId,
      revision: metadata.revision as number,
    },
  };
}

export function planSync(
  existingItems: SceneItemLike[],
  manifest: MapManifest,
  options: SyncPlanOptions = {},
): SyncPlan {
  const owned = existingItems
    .map(ownedItem)
    .filter((item): item is OwnedItem => item !== null);
  const byTile = new Map(owned.map((item) => [item.owned.tileId, item]));
  const desired = new Set(manifest.tiles.map((tile) => tile.id));

  const create: ManifestTile[] = [];
  const update: Array<{ item: OwnedItem; tile: ManifestTile }> = [];

  for (const tile of manifest.tiles) {
    const existing = byTile.get(tile.id);
    if (!existing) {
      create.push(tile);
    } else if (
      options.forceUpdate ||
      existing.owned.revision !== manifest.revision
    ) {
      update.push({ item: existing, tile });
    }
  }

  const deleted = owned.filter((item) => !desired.has(item.owned.tileId));
  return { create, update, delete: deleted };
}
