import type { ComponentType, RefObject } from "react";
import type { Group } from "three";
import { PENDULUM_RIG, angleAt } from "../../scene/pendulum";
import { DepthRowRig } from "./DepthRowRig";
import { DimInteriorRig } from "./DimInteriorRig";
import { PendulumRig } from "./PendulumRig";

/**
 * Maps a scene id to the geometry that draws it, and to how that geometry moves through an
 * exposure.
 *
 * Lives inside the lazily-loaded chunk, so importing a scene's *physics* from the server never
 * pulls three.js along with it.
 */
export interface RigEntry {
  /** A component rather than a render function: handing a ref to a plain call during render is
   *  against React's rules, and the compiler lint enforces it. */
  readonly Component: ComponentType<{ readonly armRef: RefObject<Group | null> }>;
  /** Positions the rig at `seconds`. A no-op for scenes where nothing moves. */
  setTime(armRef: RefObject<Group | null>, seconds: number): void;
}

const PENDULUM_DEEP_RIG = { ...PENDULUM_RIG, backdropDistanceM: 12 };

const swingTo =
  (rig: typeof PENDULUM_RIG) => (armRef: RefObject<Group | null>, seconds: number) => {
    if (armRef.current) armRef.current.rotation.z = angleAt(rig, seconds);
  };

const stillLife = () => undefined;

const RIGS: Readonly<Record<string, RigEntry>> = {
  pendulum: {
    Component: ({ armRef }) => <PendulumRig armRef={armRef} />,
    setTime: swingTo(PENDULUM_RIG),
  },
  "pendulum-deep": {
    Component: ({ armRef }) => <PendulumRig armRef={armRef} rig={PENDULUM_DEEP_RIG} />,
    setTime: swingTo(PENDULUM_DEEP_RIG),
  },
  "pendulum-dusk": {
    Component: ({ armRef }) => <PendulumRig armRef={armRef} />,
    setTime: swingTo(PENDULUM_RIG),
  },
  "depth-row": { Component: DepthRowRig, setTime: stillLife },
  "depth-row-overcast": { Component: DepthRowRig, setTime: stillLife },
  "dim-interior": { Component: DimInteriorRig, setTime: stillLife },
  "dim-interior-evening": { Component: DimInteriorRig, setTime: stillLife },
};

export function getRig(sceneId: string): RigEntry {
  const rig = RIGS[sceneId];
  if (!rig) throw new Error(`No 3D rig registered for scene "${sceneId}".`);
  return rig;
}

export const REGISTERED_RIG_IDS = Object.keys(RIGS);
