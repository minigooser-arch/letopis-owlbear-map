import { expect, it } from "vitest";
import { applyMapImageUpdates } from "../src/mapUpdateBatch";

type TestImage = {
  id: string;
  type: "IMAGE";
  name: string;
  position: { x: number; y: number };
  scale: { x: number; y: number };
  layer: "MAP";
  locked: boolean;
  disableHit?: boolean;
  metadata: Record<string, unknown>;
  image: { url: string };
  grid: { dpi: number; offset: { x: number; y: number } };
};

function image(id: string, x: number, revision: number): TestImage {
  return {
    id,
    type: "IMAGE",
    name: `tile-${id}`,
    position: { x, y: 20 },
    scale: { x: 1, y: 1 },
    layer: "MAP",
    locked: true,
    disableHit: true,
    metadata: { map: { revision } },
    image: { url: `https://example.test/${id}?v=${revision}` },
    grid: { dpi: 80, offset: { x: 0, y: 0 } },
  };
}

it("updates every existing map tile through one Owlbear batch request", async () => {
  const current = [image("a", 0, 1), image("b", 100, 1), image("c", 200, 1)];
  const replacements = [
    { itemId: "a", replacement: image("new-a", 10, 2) },
    { itemId: "b", replacement: image("new-b", 110, 2) },
    { itemId: "c", replacement: image("new-c", 210, 2) },
  ];
  const calls: string[][] = [];

  await applyMapImageUpdates(
    async (ids, update) => {
      calls.push([...ids]);
      update(current.filter((item) => ids.includes(item.id)));
    },
    replacements,
  );

  expect(calls).toEqual([["a", "b", "c"]]);
  expect(current.map((item) => item.position.x)).toEqual([10, 110, 210]);
  expect(current.map((item) => item.image.url)).toEqual([
    "https://example.test/new-a?v=2",
    "https://example.test/new-b?v=2",
    "https://example.test/new-c?v=2",
  ]);
});

it("does not silently mark a partial batch when Owlbear cannot return every target", async () => {
  const current = [image("a", 0, 1), image("b", 100, 1)];
  const replacements = [
    { itemId: "a", replacement: image("new-a", 10, 2) },
    { itemId: "b", replacement: image("new-b", 110, 2) },
    { itemId: "c", replacement: image("new-c", 210, 2) },
  ];

  await expect(
    applyMapImageUpdates(
      async (_ids, update) => update(current),
      replacements,
    ),
  ).rejects.toThrow("Не найдены все тайлы для пакетного обновления");
});
