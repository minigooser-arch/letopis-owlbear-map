import OBR, { buildImage, type Image } from "@owlbear-rodeo/sdk";
import {
  parseCurrentRevision,
  parseManifest,
  resolveManifestUrls,
  type ManifestTile,
  type MapManifest,
} from "./contracts";
import { defaultMapBaseUrl, ITEM_METADATA_KEY } from "./constants";
import { getSceneState, setSceneState } from "./calibration";
import { tilePlacement } from "./placement";
import { canSyncMap } from "./roleAccess";
import { planSync } from "./syncPlan";

export type SyncResult = {
  status: "noop" | "updated";
  revision: number;
  created: number;
  updated: number;
  deleted: number;
};

async function fetchJson(url: string): Promise<unknown> {
  const response = await fetch(url, { cache: "no-store" });
  if (!response.ok) {
    throw new Error(`${response.status} ${response.statusText}: ${url}`);
  }
  return response.json();
}

async function loadManifest(
  baseUrl: string,
): Promise<{ revision: number; manifest: MapManifest }> {
  for (let attempt = 0; attempt < 2; attempt++) {
    const current = parseCurrentRevision(
      await fetchJson(`${baseUrl}/current.json?t=${Date.now()}`),
    );
    const manifestUrl = `${baseUrl}/manifest.json?v=${current.revision}`;
    const manifest = resolveManifestUrls(
      parseManifest(await fetchJson(manifestUrl)),
      manifestUrl,
    );
    if (manifest.revision === current.revision) {
      return { revision: current.revision, manifest };
    }
  }
  throw new Error("Ревизия manifest не совпадает с current.json");
}

async function preflightImages(manifest: MapManifest): Promise<void> {
  for (const tile of manifest.tiles) {
    const response = await fetch(tile.url, { method: "HEAD", cache: "no-store" });
    if (!response.ok) {
      throw new Error(`Недоступен ${tile.id}: HTTP ${response.status}`);
    }
  }
}

function buildMapImage(
  tile: ManifestTile,
  manifest: MapManifest,
  anchor: { x: number; y: number },
  gridDpi: number,
): Image {
  const placement = tilePlacement(tile, anchor, gridDpi);
  return buildImage(
    {
      width: tile.pixelWidth,
      height: tile.pixelHeight,
      url: tile.url,
      mime: "image/png",
    },
    {
      dpi: placement.imageGridDpi,
      offset: { x: 0, y: 0 },
    },
  )
    .name(`Летопись ${tile.id}`)
    .position(placement.position)
    .scale(placement.scale)
    .layer("MAP")
    .locked(true)
    .disableHit(true)
    .metadata({
      [ITEM_METADATA_KEY]: {
        tileId: tile.id,
        revision: manifest.revision,
      },
    })
    .build();
}

export async function syncCurrentRevision(): Promise<SyncResult> {
  if (!(await OBR.scene.isReady())) {
    throw new Error("Сцена Owlbear ещё не готова");
  }
  if (!canSyncMap(await OBR.player.getRole())) {
    throw new Error("Синхронизация карты доступна только GM");
  }

  const state = await getSceneState();
  if (!state.anchor) {
    throw new Error(
      "Сначала привяжите Minecraft 0, -10000 к пересечению сетки",
    );
  }

  const loaded = await loadManifest(defaultMapBaseUrl());
  if (state.appliedRevision === loaded.revision) {
    return {
      status: "noop",
      revision: loaded.revision,
      created: 0,
      updated: 0,
      deleted: 0,
    };
  }

  const manifest = loaded.manifest;
  await preflightImages(manifest);

  const gridDpi = await OBR.scene.grid.getDpi();
  const items = await OBR.scene.items.getItems();

  // Reaching this point means either a new map revision exists or the GM
  // deliberately cleared appliedRevision by recalibrating the anchor. In both
  // cases existing owned images must be rebuilt so their URL and/or position
  // matches the current scene state.
  const plan = planSync(
    items as unknown as Array<{
      id: string;
      type: string;
      metadata?: Record<string, unknown>;
    }>,
    manifest,
    { forceUpdate: true },
  );

  const creates = plan.create.map((tile) =>
    buildMapImage(tile, manifest, state.anchor!, gridDpi),
  );
  if (creates.length) {
    await OBR.scene.items.addItems(creates);
  }

  for (const change of plan.update) {
    const replacement = buildMapImage(
      change.tile,
      manifest,
      state.anchor,
      gridDpi,
    );
    await OBR.scene.items.updateItems<Image>([change.item.id], (draft) => {
      const item = draft[0];
      if (!item || item.type !== "IMAGE") return;
      const source = replacement as Image;
      item.name = source.name;
      item.position = source.position;
      item.scale = source.scale;
      item.layer = "MAP";
      item.locked = true;
      item.disableHit = true;
      item.metadata = {
        ...item.metadata,
        [ITEM_METADATA_KEY]: {
          tileId: change.tile.id,
          revision: manifest.revision,
        },
      };
      item.image = source.image;
      item.grid = source.grid;
    });
  }

  if (plan.delete.length) {
    await OBR.scene.items.deleteItems(plan.delete.map((item) => item.id));
  }

  await setSceneState({ appliedRevision: loaded.revision });
  return {
    status: "updated",
    revision: loaded.revision,
    created: creates.length,
    updated: plan.update.length,
    deleted: plan.delete.length,
  };
}
