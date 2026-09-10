export const EXTENSION_ID = "ru.letopis.map";
export const SCENE_METADATA_KEY = `${EXTENSION_ID}/scene`;
export const ITEM_METADATA_KEY = `${EXTENSION_ID}/tile`;
export const LETOPIS_TOOL_ID = `${EXTENSION_ID}/tool`;
export const CALIBRATION_MODE_ID = `${EXTENSION_ID}/calibration`;
export const COORDINATE_MODE_ID = `${EXTENSION_ID}/coordinates`;
export const COPY_COORDS_ACTION_ID = `${EXTENSION_ID}/copy-coordinates`;
export const COPY_TP_ACTION_ID = `${EXTENSION_ID}/copy-tp`;
export const BLOCKS_PER_CELL = 160;
export const CHUNKS_PER_CELL = 10;
export const ANCHOR_X = 0;
export const ANCHOR_Z = -10000;
export const BLOCKS_PER_TILE = 4000;

export function extensionAssetUrl(filename: string): string {
  return new URL(filename, window.location.href).href;
}

export function defaultMapBaseUrl(pageUrl: string = window.location.href): string {
  return new URL("./map", pageUrl).href.replace(/\/+$/, "");
}
