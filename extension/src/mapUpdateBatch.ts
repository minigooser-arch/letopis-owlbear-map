export type MutableMapImage = {
  id: string;
  type: string;
  name: string;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  layer: string;
  locked: boolean;
  disableHit?: boolean;
  metadata: Record<string, unknown>;
  image: unknown;
  grid: unknown;
};

export type MapImageReplacement<T extends MutableMapImage = MutableMapImage> = {
  itemId: string;
  replacement: T;
};

export type BatchUpdateItems<T extends MutableMapImage = MutableMapImage> = (
  ids: string[],
  update: (items: T[]) => void,
) => Promise<void>;

export async function applyMapImageUpdates<T extends MutableMapImage>(
  updateItems: BatchUpdateItems<T>,
  replacements: Array<MapImageReplacement<T>>,
): Promise<void> {
  if (replacements.length === 0) return;

  const byId = new Map(replacements.map((change) => [change.itemId, change.replacement]));
  if (byId.size !== replacements.length) {
    throw new Error("Повторяющийся тайл в пакетном обновлении карты");
  }

  const ids = replacements.map((change) => change.itemId);
  await updateItems(ids, (items) => {
    const seen = new Set<string>();

    for (const item of items) {
      const replacement = byId.get(item.id);
      if (!replacement || item.type !== "IMAGE") continue;

      item.name = replacement.name;
      item.position = replacement.position;
      item.scale = replacement.scale;
      item.layer = replacement.layer;
      item.locked = replacement.locked;
      item.disableHit = replacement.disableHit;
      item.metadata = { ...item.metadata, ...replacement.metadata };
      item.image = replacement.image;
      item.grid = replacement.grid;
      seen.add(item.id);
    }

    if (seen.size !== replacements.length) {
      throw new Error("Не найдены все тайлы для пакетного обновления");
    }
  });
}
