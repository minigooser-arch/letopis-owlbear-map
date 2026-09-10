import { expect, it } from "vitest";
import { minecraftToScene, sceneToMinecraft } from "../src/coordinates";

it("maps the anchor exactly", () => {
  expect(sceneToMinecraft({x:500,y:700}, {x:500,y:700}, 240)).toEqual({x:0,z:-10000,chunkX:0,chunkZ:-625});
});
it("floors negative chunks", () => {
  const p = sceneToMinecraft({x:499,y:699}, {x:500,y:700}, 160);
  expect(p).toEqual({x:-1,z:-10001,chunkX:-1,chunkZ:-626});
});
it("round trips representative boundaries", () => {
  for (const dpi of [160,240,512]) for (const x of [-4000,-160,-1,0,159,160,3999,4000]) for (const z of [-14000,-10160,-10001,-10000,-9841,-9840,-6001]) {
    expect(sceneToMinecraft(minecraftToScene({x,z},{x:321,y:654},dpi),{x:321,y:654},dpi)).toMatchObject({x,z});
  }
});
