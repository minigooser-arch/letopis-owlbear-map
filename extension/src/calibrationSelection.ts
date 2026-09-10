import {
  CALIBRATION_MODE_ID,
  LETOPIS_TOOL_ID,
} from "./constants";

export type Vec2 = { x: number; y: number };

type CalibrationToolApi = {
  activateTool(id: string): Promise<void>;
  activateMode(toolId: string, modeId: string): Promise<void>;
};

type CalibrationGridApi = {
  getDpi(): Promise<number>;
  snapPosition(
    position: Vec2,
    snappingSensitivity?: number,
    useCorners?: boolean,
    useCenter?: boolean,
  ): Promise<Vec2>;
};

export async function activateCalibrationSelection(
  tool: CalibrationToolApi,
): Promise<void> {
  await tool.activateTool(LETOPIS_TOOL_ID);
  await tool.activateMode(LETOPIS_TOOL_ID, CALIBRATION_MODE_ID);
}

export async function resolveCalibrationAnchor(
  pointerPosition: Vec2,
  grid: CalibrationGridApi,
): Promise<Vec2> {
  const gridDpi = await grid.getDpi();
  if (!(gridDpi > 0)) {
    throw new Error("gridDpi must be positive");
  }

  // Snap to the center only. Every point inside the same square grid cell
  // therefore resolves to the same cell, instead of sometimes snapping to a
  // corner and sometimes to the center. Minecraft 0/-10000 is defined at the
  // top-left corner of the selected 160-block cell, so convert that stable
  // cell center back to its top-left intersection.
  const cellCenter = await grid.snapPosition(
    pointerPosition,
    1,
    false,
    true,
  );

  return {
    x: cellCenter.x - gridDpi / 2,
    y: cellCenter.y - gridDpi / 2,
  };
}
