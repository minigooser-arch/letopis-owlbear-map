import OBR from "@owlbear-rodeo/sdk";
import { getSceneState } from "./calibration";
import { activateCalibrationSelection } from "./calibrationSelection";
import { formatUnknownError } from "./errorMessage";
import { canCalibrateMap, canSyncMap } from "./roleAccess";
import { syncCurrentRevision } from "./sync";
import "./style.css";

function el<T extends HTMLElement>(id: string): T {
  const node = document.getElementById(id);
  if (!node) throw new Error(`Missing #${id}`);
  return node as T;
}

async function render(): Promise<void> {
  const role = await OBR.player.getRole();
  const state = await getSceneState();
  el("role").textContent = role;
  el("anchor").textContent = state.anchor
    ? `Owlbear ${Math.round(state.anchor.x)}, ${Math.round(state.anchor.y)} → Minecraft 0, -10000`
    : "не задана";
  el("revision").textContent = state.appliedRevision?.toString() ?? "ещё не синхронизирована";
  el<HTMLButtonElement>("calibrate").hidden = !canCalibrateMap(role);
  el<HTMLButtonElement>("sync").hidden = !canSyncMap(role);
  el("playerHelp").hidden = role !== "PLAYER";
}

async function setStatus(text: string, error = false) {
  const status = el("status");
  status.textContent = text;
  status.className = error ? "error" : "ok";
}

OBR.onReady(async () => {
  await render();

  el<HTMLButtonElement>("calibrate").addEventListener("click", async () => {
    try {
      const role = await OBR.player.getRole();
      if (!canCalibrateMap(role)) {
        throw new Error("Привязка карты доступна только GM");
      }
      await activateCalibrationSelection(OBR.tool);
      await setStatus(
        "Кликните внутри нужной клетки. Её верхний левый угол станет точкой Minecraft 0, -10000.",
      );
    } catch (error) {
      const message = formatUnknownError(error);
      await setStatus(message, true);
      await OBR.notification.show(message, "ERROR");
    }
  });

  el<HTMLButtonElement>("sync").addEventListener("click", async () => {
    try {
      const result = await syncCurrentRevision();
      await setStatus(
        result.status === "noop"
          ? `Ревизия ${result.revision} уже актуальна`
          : `Ревизия ${result.revision}: +${result.created}, ~${result.updated}, -${result.deleted}`,
      );
      await render();
    } catch (error) {
      const message = formatUnknownError(error);
      await setStatus(message, true);
      await OBR.notification.show(message, "ERROR");
    }
  });
});
