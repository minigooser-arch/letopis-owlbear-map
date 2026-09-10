import { ANCHOR_X, ANCHOR_Z, BLOCKS_PER_CELL, BLOCKS_PER_TILE, CHUNKS_PER_CELL } from "./constants";

export type CurrentRevision = { revision: number };
export type ManifestTile = {
  id: string; gx: number; gz: number;
  minX: number; maxXExclusive: number; minZ: number; maxZExclusive: number;
  pixelWidth: number; pixelHeight: number; url: string;
};
export type MapManifest = {
  revision: number;
  map: string;
  grid: { chunksPerCell: number; blocksPerCell: number; anchorMinecraftX: number; anchorMinecraftZ: number; anchorCorner: "upper-right" };
  render: { blocksPerTile: number; blocksPerPixel: number };
  border: { minX: number; maxXExclusive: number; minZ: number; maxZExclusive: number };
  tiles: ManifestTile[];
};

function record(value: unknown, name: string): Record<string, unknown> {
  if (!value || typeof value !== "object" || Array.isArray(value)) throw new Error(`${name} must be an object`);
  return value as Record<string, unknown>;
}
function int(value: unknown, name: string): number { if (!Number.isInteger(value)) throw new Error(`${name} must be an integer`); return value as number; }
function positiveInt(value: unknown, name: string): number { const n=int(value,name); if(n<=0) throw new Error(`${name} must be positive`); return n; }
function str(value: unknown, name: string): string { if(typeof value!=="string"||!value.length) throw new Error(`${name} must be a non-empty string`); return value; }
function absoluteHttpsUrl(value: string, name: string): string {
  let url: URL; try { url=new URL(value); } catch { throw new Error(`${name} must be an absolute URL`); }
  const dev=url.protocol==="http:"&&(url.hostname==="localhost"||url.hostname==="127.0.0.1");
  if(url.protocol!=="https:"&&!dev) throw new Error(`${name} must use HTTPS`);
  return value;
}

export function parseCurrentRevision(value: unknown): CurrentRevision {
  const obj=record(value,"current revision"); return {revision:positiveInt(obj.revision,"revision")};
}

export function parseManifest(value: unknown): MapManifest {
  const obj=record(value,"manifest"), grid=record(obj.grid,"grid"), render=record(obj.render,"render"), border=record(obj.border,"border");
  if(int(grid.chunksPerCell,"chunksPerCell")!==CHUNKS_PER_CELL) throw new Error("chunksPerCell must be 10");
  if(int(grid.blocksPerCell,"blocksPerCell")!==BLOCKS_PER_CELL) throw new Error("blocksPerCell must be 160");
  if(int(grid.anchorMinecraftX,"anchorMinecraftX")!==ANCHOR_X) throw new Error("anchorMinecraftX must be 0");
  if(int(grid.anchorMinecraftZ,"anchorMinecraftZ")!==ANCHOR_Z) throw new Error("anchorMinecraftZ must be -10000");
  if(grid.anchorCorner!=="upper-right") throw new Error("anchorCorner must be upper-right");
  if(int(render.blocksPerTile,"blocksPerTile")!==BLOCKS_PER_TILE) throw new Error("blocksPerTile must be 4000");
  const blocksPerPixel=positiveInt(render.blocksPerPixel,"blocksPerPixel"); if(BLOCKS_PER_TILE%blocksPerPixel) throw new Error("blocksPerPixel must divide 4000");
  const parsedBorder={minX:int(border.minX,"border.minX"),maxXExclusive:int(border.maxXExclusive,"border.maxXExclusive"),minZ:int(border.minZ,"border.minZ"),maxZExclusive:int(border.maxZExclusive,"border.maxZExclusive")};
  if(parsedBorder.maxXExclusive<=parsedBorder.minX||parsedBorder.maxZExclusive<=parsedBorder.minZ) throw new Error("invalid border bounds");
  if(!Array.isArray(obj.tiles)) throw new Error("tiles must be an array");
  const ids=new Set<string>();
  const tiles=obj.tiles.map((raw,index)=>{
    const t=record(raw,`tiles[${index}]`); const id=str(t.id,`tiles[${index}].id`); if(ids.has(id)) throw new Error(`tile ids must be unique: ${id}`); ids.add(id);
    const tile:ManifestTile={id,gx:int(t.gx,`${id}.gx`),gz:int(t.gz,`${id}.gz`),minX:int(t.minX,`${id}.minX`),maxXExclusive:int(t.maxXExclusive,`${id}.maxXExclusive`),minZ:int(t.minZ,`${id}.minZ`),maxZExclusive:int(t.maxZExclusive,`${id}.maxZExclusive`),pixelWidth:positiveInt(t.pixelWidth,`${id}.pixelWidth`),pixelHeight:positiveInt(t.pixelHeight,`${id}.pixelHeight`),url:str(t.url,`${id}.url`)};
    if(tile.maxXExclusive-tile.minX!==BLOCKS_PER_TILE||tile.maxZExclusive-tile.minZ!==BLOCKS_PER_TILE) throw new Error(`${id} must cover 4000x4000 blocks`);
    return tile;
  });
  return {revision:positiveInt(obj.revision,"revision"),map:str(obj.map,"map"),grid:{chunksPerCell:CHUNKS_PER_CELL,blocksPerCell:BLOCKS_PER_CELL,anchorMinecraftX:ANCHOR_X,anchorMinecraftZ:ANCHOR_Z,anchorCorner:"upper-right"},render:{blocksPerTile:BLOCKS_PER_TILE,blocksPerPixel},border:parsedBorder,tiles};
}

export function resolveManifestUrls(manifest: MapManifest, manifestUrl: string): MapManifest {
  absoluteHttpsUrl(manifestUrl,"manifestUrl");
  return {...manifest, tiles: manifest.tiles.map(tile=>({...tile,url:absoluteHttpsUrl(new URL(tile.url,manifestUrl).href,`${tile.id}.url`)}))};
}
