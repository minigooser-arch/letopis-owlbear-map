import { expect, it } from "vitest";
import { tilePlacement } from "../src/placement";

const tile0 = {
  id: "x_0_z_-1",
  gx: 0,
  gz: -1,
  minX: 0,
  maxXExclusive: 4000,
  minZ: -14000,
  maxZExclusive: -10000,
  pixelWidth: 2000,
  pixelHeight: 2000,
  url: "https://x.test/a.png",
};
const right = {
  ...tile0,
  id: "x_1_z_-1",
  gx: 1,
  minX: 4000,
  maxXExclusive: 8000,
};
const below = {
  ...tile0,
  id: "x_0_z_0",
  gz: 0,
  minZ: -10000,
  maxZExclusive: -6000,
};

it("describes exactly 25 image-grid cells regardless of scene dpi", () => {
  for (const gridDpi of [80, 160, 240, 512]) {
    const placement = tilePlacement(tile0, { x: 1000, y: 2000 }, gridDpi);
    const imageCellsWide =
      (tile0.pixelWidth / placement.imageGridDpi) * placement.scale.x;
    const imageCellsHigh =
      (tile0.pixelHeight / placement.imageGridDpi) * placement.scale.y;

    expect(placement.sceneWidth).toBe(25 * gridDpi);
    expect(placement.sceneHeight).toBe(25 * gridDpi);
    expect(placement.imageGridDpi).toBe(80);
    expect(imageCellsWide).toBe(25);
    expect(imageCellsHigh).toBe(25);
    expect(placement.scale).toEqual({ x: 1, y: 1 });
  }
});

it("adjacent tiles share exact boundaries", () => {
  for (const dpi of [160, 240, 512]) {
    const a = tilePlacement(tile0, { x: 1, y: 2 }, dpi);
    expect(a.right).toBe(tilePlacement(right, { x: 1, y: 2 }, dpi).left);
    expect(a.bottom).toBe(tilePlacement(below, { x: 1, y: 2 }, dpi).top);
  }
});
