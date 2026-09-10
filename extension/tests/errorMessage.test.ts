import { expect, it } from "vitest";
import { formatUnknownError } from "../src/errorMessage";

it("keeps normal Error messages readable", () => {
  expect(formatUnknownError(new Error("Обычная ошибка"))).toBe("Обычная ошибка");
});

it("serializes Owlbear host object errors instead of showing object Object", () => {
  expect(
    formatUnknownError({
      code: "SCENE_UPDATE_FAILED",
      message: "Item update rejected",
      itemId: "tile-10",
    }),
  ).toBe(
    '{"code":"SCENE_UPDATE_FAILED","message":"Item update rejected","itemId":"tile-10"}',
  );
});

it("falls back safely for values that cannot be JSON serialized", () => {
  const circular: Record<string, unknown> = {};
  circular.self = circular;
  expect(formatUnknownError(circular)).toBe("[object Object]");
});
