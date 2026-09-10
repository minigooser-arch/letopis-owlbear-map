import { expect, it } from "vitest";
import { parseCurrentRevision, parseManifest, resolveManifestUrls } from "../src/contracts";
import { defaultMapBaseUrl } from "../src/constants";
const valid={revision:43,map:"world",grid:{chunksPerCell:10,blocksPerCell:160,anchorMinecraftX:0,anchorMinecraftZ:-10000,anchorCorner:"upper-right"},render:{blocksPerTile:4000,blocksPerPixel:2},border:{minX:-5760,maxXExclusive:12640,minZ:-16720,maxZExclusive:-6960},tiles:[{id:"x_0_z_-1",gx:0,gz:-1,minX:0,maxXExclusive:4000,minZ:-14000,maxZExclusive:-10000,pixelWidth:2000,pixelHeight:2000,url:"tiles/x_0_z_-1.png?v=43"}]};
it("accepts relative Pages tile URLs and resolves them",()=>{const m=resolveManifestUrls(parseManifest(valid),"https://minigooser-arch.github.io/letopis-map-sync/map/manifest.json?v=43");expect(m.tiles[0].url).toBe("https://minigooser-arch.github.io/letopis-map-sync/map/tiles/x_0_z_-1.png?v=43");expect(parseCurrentRevision({revision:43}).revision).toBe(43);});
it("derives map base from a GitHub Pages project subpath",()=>expect(defaultMapBaseUrl("https://minigooser-arch.github.io/letopis-map-sync/background.html")).toBe("https://minigooser-arch.github.io/letopis-map-sync/map"));
it("rejects duplicate tile ids",()=>expect(()=>parseManifest({...valid,tiles:[valid.tiles[0],valid.tiles[0]]})).toThrow(/unique/i));
it("rejects wrong anchor",()=>expect(()=>parseManifest({...valid,grid:{...valid.grid,anchorMinecraftZ:0}})).toThrow());
