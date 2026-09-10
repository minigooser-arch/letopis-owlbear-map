import { expect, it } from "vitest";
import {
  activateCalibrationSelection,
  finishCalibrationSelection,
  resolveCalibrationAnchor,
} from "../src/calibrationSelection";

it("activates the Letopis tool before activating calibration mode", async () => {
  const calls: string[] = [];
  const tool = {
    async activateTool(id: string) {
      calls.push(`tool:${id}`);
    },
    async activateMode(toolId: string, modeId: string) {
      calls.push(`mode:${toolId}:${modeId}`);
    },
  };

  await activateCalibrationSelection(tool);

  expect(calls).toEqual([
    "tool:ru.letopis.map/tool",
    "mode:ru.letopis.map/tool:ru.letopis.map/calibration",
  ]);
});

it("returns to coordinate mode after one calibration click", async () => {
  const calls: string[] = [];
  const tool = {
    async activateMode(toolId: string, modeId: string) {
      calls.push(`mode:${toolId}:${modeId}`);
    },
  };

  await finishCalibrationSelection(tool);

  expect(calls).toEqual([
    "mode:ru.letopis.map/tool:ru.letopis.map/coordinates",
  ]);
});

it("turns a click anywhere in a cell into that cell's top-left intersection", async () => {
  const snapCalls: unknown[][] = [];
  const grid = {
    async getDpi() {
      return 160;
    },
    async snapPosition(
      position: { x: number; y: number },
      sensitivity?: number,
      useCorners?: boolean,
      useCenter?: boolean,
    ) {
      snapCalls.push([position, sensitivity, useCorners, useCenter]);
      // Owlbear returns the center of the cell containing the pointer when
      // centers are the only valid snap targets.
      return { x: 580, y: 780 };
    },
  };

  const anchor = await resolveCalibrationAnchor({ x: 537, y: 744 }, grid);

  expect(snapCalls).toEqual([[{ x: 537, y: 744 }, 1, false, true]]);
  expect(anchor).toEqual({ x: 500, y: 700 });
});

it("rejects an invalid scene grid dpi instead of creating a broken anchor", async () => {
  const grid = {
    async getDpi() {
      return 0;
    },
    async snapPosition() {
      return { x: 0, y: 0 };
    },
  };

  await expect(
    resolveCalibrationAnchor({ x: 10, y: 20 }, grid),
  ).rejects.toThrow("gridDpi must be positive");
});
