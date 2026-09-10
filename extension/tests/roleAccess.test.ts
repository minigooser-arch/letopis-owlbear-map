import { expect, it } from "vitest";
import {
  canCalibrateMap,
  canSyncMap,
  canViewCoordinates,
} from "../src/roleAccess";

it("lets both GM and PLAYER view Minecraft coordinates", () => {
  expect(canViewCoordinates("GM")).toBe(true);
  expect(canViewCoordinates("PLAYER")).toBe(true);
});

it("allows only GM to calibrate the map", () => {
  expect(canCalibrateMap("GM")).toBe(true);
  expect(canCalibrateMap("PLAYER")).toBe(false);
});

it("allows only GM to synchronize the map", () => {
  expect(canSyncMap("GM")).toBe(true);
  expect(canSyncMap("PLAYER")).toBe(false);
});
