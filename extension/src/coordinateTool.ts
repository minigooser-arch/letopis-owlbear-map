import OBR, { buildLabel, type Label } from "@owlbear-rodeo/sdk";
import { COORDINATE_MODE_ID, COPY_COORDS_ACTION_ID, COPY_TP_ACTION_ID, LETOPIS_TOOL_ID, extensionAssetUrl } from "./constants";
import { getSceneState } from "./calibration";
import { sceneToMinecraft, type MinecraftCursor } from "./coordinates";

let labelId: string | null = null;
let lastCoordinate: MinecraftCursor | null = null;

async function clearLabel(): Promise<void> {
  if (labelId) await OBR.scene.local.deleteItems([labelId]);
  labelId = null;
  lastCoordinate = null;
}
async function showCoordinate(position: {x:number;y:number}, coordinate: MinecraftCursor): Promise<void> {
  const text = `X: ${coordinate.x}\nZ: ${coordinate.z}\nChunk: ${coordinate.chunkX}, ${coordinate.chunkZ}`;
  if (!labelId) {
    const item = buildLabel()
      .plainText(text)
      .position({ x: position.x + 18, y: position.y + 18 })
      .layer("POPOVER")
      .disableHit(true)
      .build();
    await OBR.scene.local.addItems([item]);
    labelId = item.id;
  } else {
    await OBR.scene.local.updateItems<Label>([labelId], items => {
      const item = items[0]; if (!item || item.type !== "LABEL") return;
      item.text.plainText = text;
      item.position = { x: position.x + 18, y: position.y + 18 };
    }, true);
  }
}

export function getLastCoordinate(): MinecraftCursor | null { return lastCoordinate; }

export async function registerCoordinateTool(): Promise<void> {
  await OBR.tool.createMode({
    id: COORDINATE_MODE_ID,
    icons: [{ icon: extensionAssetUrl("coordinates.svg"), label: "Координаты Minecraft", filter: { activeTools: [LETOPIS_TOOL_ID], roles: ["GM", "PLAYER"] } }],
    cursors: [{ cursor: "crosshair" }],
    async onToolMove(_context, event) {
      const state = await getSceneState();
      if (!state.anchor) return;
      const dpi = await OBR.scene.grid.getDpi();
      lastCoordinate = sceneToMinecraft(event.pointerPosition, state.anchor, dpi);
      await showCoordinate(event.pointerPosition, lastCoordinate);
    },
    async onDeactivate() { await clearLabel(); }
  });
  await OBR.tool.createAction({
    id: COPY_COORDS_ACTION_ID,
    icons: [{ icon: extensionAssetUrl("coordinates.svg"), label: "Копировать X Z", filter: { activeTools: [LETOPIS_TOOL_ID], activeModes: [COORDINATE_MODE_ID] } }],
    async onClick() { if (lastCoordinate) await navigator.clipboard.writeText(`${lastCoordinate.x} ${lastCoordinate.z}`); }
  });
  await OBR.tool.createAction({
    id: COPY_TP_ACTION_ID,
    icons: [{ icon: extensionAssetUrl("coordinates.svg"), label: "Копировать /tp", filter: { activeTools: [LETOPIS_TOOL_ID], activeModes: [COORDINATE_MODE_ID] } }],
    async onClick() { if (lastCoordinate) await navigator.clipboard.writeText(`/tp ${lastCoordinate.x} ~ ${lastCoordinate.z}`); }
  });
  OBR.tool.onToolChange(async id => { if (id !== LETOPIS_TOOL_ID) await clearLabel(); });
  OBR.tool.onToolModeChange(async id => { if (id !== COORDINATE_MODE_ID) await clearLabel(); });
}
