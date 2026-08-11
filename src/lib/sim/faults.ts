import { handheldShakePx, subjectBlurPx } from "./motion";
import { evaluateExposure } from "./exposure";
import { subjectEv100 } from "./meter";
import { backgroundBlurPx } from "./optics";
import type { CameraSettings, Scene } from "./types";

/**
 * The faults a beginner's photograph actually suffers from, and how to tell them apart.
 *
 * Every one of these is *generated* by the simulator from settings that genuinely cause it —
 * nothing is staged. That matters twice over: the picture cannot disagree with its own answer,
 * and the fix a player applies is checked against the same physics that produced the fault.
 */

export const FAULTS = [
  {
    id: "underexposed",
    label: "Underexposed",
    explanation:
      "Not enough light reached the sensor, so the shadows have gone muddy and detail in them is lost for good.",
    control: "Any of the three — a slower shutter, a wider aperture, or a higher ISO.",
  },
  {
    id: "overexposed",
    label: "Overexposed",
    explanation:
      "Too much light reached the sensor. The brightest areas have gone pure white with nothing left in them, and no amount of editing brings that back.",
    control: "Any of the three — a faster shutter, a narrower aperture, or a lower ISO.",
  },
  {
    id: "subject-motion",
    label: "Subject motion blur",
    explanation:
      "The subject moved across the frame while the shutter was open. The background is sharp, which is what tells you the camera was steady and the subject was not.",
    control: "Shutter speed.",
  },
  {
    id: "camera-shake",
    label: "Camera shake",
    explanation:
      "Your own movement blurred the whole frame during the exposure. Everything is soft, including things that were not moving — that is the tell.",
    control: "Shutter speed, or something to rest the camera on.",
  },
  {
    id: "too-shallow",
    label: "Depth of field too shallow",
    explanation:
      "The aperture was so wide that only a sliver of the scene is sharp. Everything in front of and behind the focus point has fallen away.",
    control: "Aperture.",
  },
  {
    id: "noisy",
    label: "Too noisy",
    explanation:
      "The sensitivity was pushed higher than the scene needed, and the shadows have gone grainy as a result.",
    control: "ISO — and buy the light back with a wider aperture or a slower shutter.",
  },
] as const;

export type FaultId = (typeof FAULTS)[number]["id"];

export function getFault(id: string) {
  return FAULTS.find((fault) => fault.id === id);
}

/**
 * Works out which faults a set of settings actually produces.
 *
 * Used at build time to check that a diagnose challenge's stated answer is the fault its settings
 * genuinely cause — an exercise whose picture disagrees with its answer key is worse than no
 * exercise at all.
 */
export function faultsPresent(settings: CameraSettings, scene: Scene): readonly FaultId[] {
  const present: FaultId[] = [];

  const exposure = evaluateExposure(settings, subjectEv100(scene));
  if (exposure.deviationStops <= -1.5) present.push("underexposed");
  if (exposure.deviationStops >= 1.5) present.push("overexposed");

  const motion = subjectBlurPx(
    settings,
    scene.subjectSpeedMps,
    scene.subjectDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );
  if (motion > 6) present.push("subject-motion");

  if (handheldShakePx(settings, scene.imageWidthPx) > 2) present.push("camera-shake");

  const depth = backgroundBlurPx(
    settings,
    scene.backgroundDistanceM,
    scene.sensor,
    scene.imageWidthPx,
  );
  if (depth > 25) present.push("too-shallow");

  if (settings.iso >= 3200) present.push("noisy");

  return present;
}

/** Whether a proposed correction actually cures the fault it was aimed at. */
export function isFixed(fault: FaultId, settings: CameraSettings, scene: Scene): boolean {
  return !faultsPresent(settings, scene).includes(fault);
}
