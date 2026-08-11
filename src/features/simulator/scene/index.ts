import { DEPTH_ROW, DEPTH_ROW_OVERCAST } from "./depthRow";
import { BACKLIT_PORTRAIT, SNOW_FIELD } from "./metering";
import { DIM_INTERIOR, DIM_INTERIOR_EVENING } from "./dimInterior";
import { PENDULUM, PENDULUM_DEEP, PENDULUM_DUSK } from "./pendulum";
import type { SceneSpec } from "./types";

/**
 * Every scene the simulator can stage, as physics only.
 *
 * Safe to import from the server: nothing here touches three.js. The matching 3D rigs are
 * registered separately in `render/rigs`, inside the lazily-loaded chunk.
 */
export const SCENE_SPECS: readonly SceneSpec[] = [
  PENDULUM,
  PENDULUM_DEEP,
  PENDULUM_DUSK,
  DEPTH_ROW,
  DEPTH_ROW_OVERCAST,
  DIM_INTERIOR,
  DIM_INTERIOR_EVENING,
  BACKLIT_PORTRAIT,
  SNOW_FIELD,
];

const BY_ID = new Map(SCENE_SPECS.map((spec) => [spec.id, spec]));

export function getSceneSpec(id: string): SceneSpec | undefined {
  return BY_ID.get(id);
}

export type { SceneSpec };
