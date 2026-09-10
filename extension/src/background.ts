import OBR from "@owlbear-rodeo/sdk";
import {
  LETOPIS_TOOL_ID,
  COORDINATE_MODE_ID,
  extensionAssetUrl,
} from "./constants";
import { registerCalibrationMode } from "./calibration";
import { registerCoordinateTool } from "./coordinateTool";
import { canSyncMap } from "./roleAccess";
import { syncCurrentRevision } from "./sync";

async function register(): Promise<void> {
  await OBR.tool.create({
    id: LETOPIS_TOOL_ID,
    icons: [
      { icon: extensionAssetUrl("icon.svg"), label: "Летопись: карта" },
    ],
    defaultMode: COORDINATE_MODE_ID,
  });
  await registerCoordinateTool();
  await registerCalibrationMode();

  if (
    (await OBR.scene.isReady()) &&
    canSyncMap(await OBR.player.getRole())
  ) {
    try {
      await syncCurrentRevision();
    } catch {
      /* popover can show/retry transient failures */
    }
  }

  OBR.scene.onReadyChange(async (ready) => {
    if (ready && canSyncMap(await OBR.player.getRole())) {
      try {
        await syncCurrentRevision();
      } catch {
        /* preserve last-known-good map */
      }
    }
  });
}

OBR.onReady(() => {
  void register();
});
