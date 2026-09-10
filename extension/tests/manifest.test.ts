import { readFileSync } from "node:fs";
import { expect, it } from "vitest";

const manifest = JSON.parse(
  readFileSync(new URL("../public/manifest.json", import.meta.url), "utf8"),
) as {
  icon: string;
  background_url: string;
  action: { icon: string; popover: string };
};

const PAGES_BASE = "https://minigooser-arch.github.io/letopis-owlbear-map/";

it("uses absolute GitHub Pages URLs for Owlbear iframe entry points", () => {
  expect(manifest.icon).toBe(`${PAGES_BASE}icon.svg`);
  expect(manifest.background_url).toBe(`${PAGES_BASE}background.html`);
  expect(manifest.action.icon).toBe(`${PAGES_BASE}icon.svg`);
  expect(manifest.action.popover).toBe(`${PAGES_BASE}index.html`);
});
