import OBR from "@owlbear-rodeo/sdk";
import { CALIBRATION_MODE_ID, LETOPIS_TOOL_ID } from "./constants";
import { getSceneState } from "./calibration";
import { syncCurrentRevision } from "./sync";
import "./style.css";
function el<T extends HTMLElement>(id:string):T{const node=document.getElementById(id);if(!node)throw new Error(`Missing #${id}`);return node as T;}
async function render():Promise<void>{const role=await OBR.player.getRole();const state=await getSceneState();el('role').textContent=role;el('anchor').textContent=state.anchor?`Owlbear ${Math.round(state.anchor.x)}, ${Math.round(state.anchor.y)} → Minecraft 0, -10000`:'не задана';el('revision').textContent=state.appliedRevision?.toString()??'ещё не синхронизирована';el<HTMLButtonElement>('calibrate').hidden=role!=="GM";el<HTMLButtonElement>('sync').hidden=role!=="GM";el('playerHelp').hidden=role!=="PLAYER";}
async function setStatus(text:string,error=false){const s=el('status');s.textContent=text;s.className=error?'error':'ok';}
OBR.onReady(async()=>{await render();el<HTMLButtonElement>('calibrate').addEventListener('click',async()=>{await OBR.tool.activateMode(LETOPIS_TOOL_ID,CALIBRATION_MODE_ID);await setStatus('Кликните по нужному пересечению сетки Owlbear.');});el<HTMLButtonElement>('sync').addEventListener('click',async()=>{try{const result=await syncCurrentRevision();await setStatus(result.status==='noop'?`Ревизия ${result.revision} уже актуальна`:`Ревизия ${result.revision}: +${result.created}, ~${result.updated}, -${result.deleted}`);await render();}catch(e){const message=e instanceof Error?e.message:String(e);await setStatus(message,true);await OBR.notification.show(message,"ERROR");}});});
