import OBR from "@owlbear-rodeo/sdk";
import { CALIBRATION_MODE_ID, LETOPIS_TOOL_ID, SCENE_METADATA_KEY, extensionAssetUrl } from "./constants";
import { finishCalibrationSelection, resolveCalibrationAnchor } from "./calibrationSelection";

export type SceneState = { anchor?: {x:number;y:number}; appliedRevision?: number };
function isSceneState(value:unknown):value is SceneState{
  if(!value||typeof value!=="object"||Array.isArray(value))return false; const v=value as Record<string,unknown>;
  if(v.appliedRevision!==undefined&&!Number.isInteger(v.appliedRevision))return false;
  if(v.anchor!==undefined){if(!v.anchor||typeof v.anchor!=="object"||Array.isArray(v.anchor))return false;const a=v.anchor as Record<string,unknown>;if(typeof a.x!=="number"||typeof a.y!=="number"||!Number.isFinite(a.x)||!Number.isFinite(a.y))return false;}
  return true;
}
export async function getSceneState():Promise<SceneState>{const metadata=await OBR.scene.getMetadata();const raw=metadata[SCENE_METADATA_KEY];return isSceneState(raw)?raw:{};}
export async function setSceneState(update:Partial<SceneState>):Promise<SceneState>{const current=await getSceneState();const next:SceneState={...current,...update};if(next.appliedRevision===undefined)delete next.appliedRevision;if(next.anchor===undefined)delete next.anchor;await OBR.scene.setMetadata({[SCENE_METADATA_KEY]:next});return next;}
export async function registerCalibrationMode():Promise<void>{await OBR.tool.createMode({id:CALIBRATION_MODE_ID,icons:[{icon:extensionAssetUrl("coordinates.svg"),label:"Привязать карту",filter:{activeTools:[LETOPIS_TOOL_ID],roles:["GM"]}}],cursors:[{cursor:"crosshair"}],async onToolClick(_context,event){if((await OBR.player.getRole())!=="GM")return false;const anchor=await resolveCalibrationAnchor(event.pointerPosition,OBR.scene.grid);await setSceneState({anchor,appliedRevision:undefined});await OBR.notification.show("Minecraft 0, -10000 привязан к верхнему левому углу выбранной клетки","SUCCESS");await finishCalibrationSelection(OBR.tool);return false;}});}
