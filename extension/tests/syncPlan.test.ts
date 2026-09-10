import { expect, it } from "vitest";
import { ITEM_METADATA_KEY } from "../src/constants";
import { planSync } from "../src/syncPlan";
const tile={id:"x_0_z_0",gx:0,gz:0,minX:0,maxXExclusive:4000,minZ:-10000,maxZExclusive:-6000,pixelWidth:2000,pixelHeight:2000,url:"https://x.test/a.png"};
const manifest={revision:2,map:"world",grid:{chunksPerCell:10,blocksPerCell:160,anchorMinecraftX:0,anchorMinecraftZ:-10000,anchorCorner:"upper-right" as const},render:{blocksPerTile:4000,blocksPerPixel:2},border:{minX:-5760,maxXExclusive:12640,minZ:-16720,maxZExclusive:-6960},tiles:[tile]};
it("creates missing owned tile",()=>expect(planSync([],manifest).create.map(x=>x.id)).toEqual([tile.id]));
it("updates older owned tile",()=>{const p=planSync([{id:"old",type:"IMAGE",metadata:{[ITEM_METADATA_KEY]:{tileId:tile.id,revision:1}}}],manifest);expect(p.update).toHaveLength(1);});
it("same revision is a no-op",()=>{const p=planSync([{id:"same",type:"IMAGE",metadata:{[ITEM_METADATA_KEY]:{tileId:tile.id,revision:2}}}],manifest);expect(p).toMatchObject({create:[],update:[],delete:[]});});
it("never touches unrelated scene objects",()=>{const unrelated={id:"char",type:"CHARACTER",metadata:{}};const obsolete={id:"old",type:"IMAGE",metadata:{[ITEM_METADATA_KEY]:{tileId:"old",revision:1}}};const p=planSync([unrelated,obsolete],manifest);expect(p.delete.map(x=>x.id)).not.toContain(unrelated.id);expect(p.delete.map(x=>x.id)).toContain("old");});
