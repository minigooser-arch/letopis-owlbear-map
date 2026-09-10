import OBR, { buildImage, type Image } from "@owlbear-rodeo/sdk";
import { parseCurrentRevision, parseManifest, resolveManifestUrls, type ManifestTile, type MapManifest } from "./contracts";
import { defaultMapBaseUrl } from "./constants";
import { ITEM_METADATA_KEY } from "./constants";
import { getSceneState, setSceneState } from "./calibration";
import { tilePlacement } from "./placement";
import { planSync } from "./syncPlan";

export type SyncResult={status:"noop"|"updated";revision:number;created:number;updated:number;deleted:number};
async function fetchJson(url:string):Promise<unknown>{const r=await fetch(url,{cache:"no-store"});if(!r.ok)throw new Error(`${r.status} ${r.statusText}: ${url}`);return r.json();}
async function loadManifest(baseUrl:string):Promise<{revision:number;manifest:MapManifest}>{
  for(let attempt=0;attempt<2;attempt++){
    const current=parseCurrentRevision(await fetchJson(`${baseUrl}/current.json?t=${Date.now()}`));
    const manifestUrl=`${baseUrl}/manifest.json?v=${current.revision}`;
    const manifest=resolveManifestUrls(parseManifest(await fetchJson(manifestUrl)),manifestUrl);
    if(manifest.revision===current.revision)return {revision:current.revision,manifest};
  }
  throw new Error("Ревизия manifest не совпадает с current.json");
}
async function preflightImages(manifest:MapManifest):Promise<void>{for(const tile of manifest.tiles){const r=await fetch(tile.url,{method:"HEAD",cache:"no-store"});if(!r.ok)throw new Error(`Недоступен ${tile.id}: HTTP ${r.status}`);}}
function buildMapImage(tile:ManifestTile,manifest:MapManifest,anchor:{x:number;y:number},gridDpi:number):Image{const p=tilePlacement(tile,anchor,gridDpi);return buildImage({width:tile.pixelWidth,height:tile.pixelHeight,url:tile.url,mime:"image/png"},{dpi:p.imageGridDpi,offset:{x:0,y:0}}).name(`Летопись ${tile.id}`).position(p.position).scale(p.scale).layer("MAP").locked(true).disableHit(true).metadata({[ITEM_METADATA_KEY]:{tileId:tile.id,revision:manifest.revision}}).build();}
export async function syncCurrentRevision():Promise<SyncResult>{
  if(!(await OBR.scene.isReady()))throw new Error("Сцена Owlbear ещё не готова"); if((await OBR.player.getRole())!=="GM")throw new Error("Синхронизация карты доступна только GM");
  const state=await getSceneState(); if(!state.anchor)throw new Error("Сначала привяжите Minecraft 0, -10000 к пересечению сетки"); const baseUrl=defaultMapBaseUrl();
  const loaded=await loadManifest(baseUrl); if(state.appliedRevision===loaded.revision)return {status:"noop",revision:loaded.revision,created:0,updated:0,deleted:0}; const manifest=loaded.manifest; await preflightImages(manifest);
  const gridDpi=await OBR.scene.grid.getDpi(); const items=await OBR.scene.items.getItems(); const plan=planSync(items as unknown as Array<{id:string;type:string;metadata?:Record<string,unknown>}>,manifest);
  const creates=plan.create.map(tile=>buildMapImage(tile,manifest,state.anchor!,gridDpi)); if(creates.length)await OBR.scene.items.addItems(creates);
  for(const change of plan.update){const replacement=buildMapImage(change.tile,manifest,state.anchor,gridDpi);await OBR.scene.items.updateItems<Image>([change.item.id],draft=>{const item=draft[0];if(!item||item.type!=="IMAGE")return;const source=replacement as Image;item.name=source.name;item.position=source.position;item.scale=source.scale;item.layer="MAP";item.locked=true;item.disableHit=true;item.metadata={...item.metadata,[ITEM_METADATA_KEY]:{tileId:change.tile.id,revision:manifest.revision}};item.image=source.image;item.grid=source.grid;});}
  if(plan.delete.length)await OBR.scene.items.deleteItems(plan.delete.map(i=>i.id)); await setSceneState({appliedRevision:loaded.revision}); return {status:"updated",revision:loaded.revision,created:creates.length,updated:plan.update.length,deleted:plan.delete.length};
}
