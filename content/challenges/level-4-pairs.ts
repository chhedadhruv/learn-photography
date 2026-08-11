import type { Challenge } from "@/lib/challenges/types";

/**
 * Level 4 — two controls, and goals that compete.
 *
 * This is the first point where a player must reason about the triangle rather than turn one
 * dial. Each challenge pins one control by a creative goal and leaves the other to balance the
 * exposure, so neither can be ignored and only a narrow band of pairs works.
 */

export const frozenAndSeparated: Challenge = {
  id: "frozen-and-separated",
  level: 4,
  sceneId: "pendulum-deep",
  title: "Frozen and separated",
  brief:
    "Catch the bob sharp as it crosses the centre, and throw the distant backdrop out of focus at the same time. The shutter decides one, the aperture the other, and between them they have to leave the exposure right.",
  hint: "Work out what each goal demands on its own first. Freezing the bob sets a floor on shutter speed; softening the backdrop sets a ceiling on the f-number. Then see which pair of those lands the meter in the centre.",
  unlocked: ["shutter", "aperture"],
  goals: [
    { type: "exposure" },
    { type: "freezeMotion", maxBlurPx: 3 },
    { type: "backgroundBlur", minBlurPx: 12 },
  ],
  startOffsetStops: 3,
};

export const sharpThroughout: Challenge = {
  id: "sharp-throughout",
  level: 4,
  sceneId: "depth-row",
  title: "Sharp throughout",
  brief:
    "Everything sharp from the nearest marker to the furthest, at a shutter speed you could hold in the hand. A narrow aperture and a fast shutter both want light, and there is only so much of it.",
  hint: "Stopping down for depth costs light; keeping the shutter quick costs more. With ISO locked at base, something has to give — find the pair where both demands are just satisfied.",
  unlocked: ["shutter", "aperture"],
  goals: [{ type: "exposure" }, { type: "deepFocus", maxBlurPx: 7 }, { type: "handheldSteady" }],
  startOffsetStops: -2,
};

export const panningPractice: Challenge = {
  id: "panning-practice",
  level: 4,
  sceneId: "pendulum-deep",
  title: "A sense of movement",
  brief:
    "Let the bob smear to show it was moving, but keep the backdrop crisp so there is something to measure that movement against. A slow shutter and a sharp background pull in opposite directions.",
  hint: "A slower shutter gives the smear but floods the sensor with light. The only way to pay for it is a narrower aperture — which happens to be what keeps the backdrop sharp.",
  unlocked: ["shutter", "aperture"],
  goals: [
    { type: "exposure" },
    { type: "showMotion", minBlurPx: 10 },
    { type: "deepFocus", maxBlurPx: 6 },
  ],
  startOffsetStops: -3,
};

export const LEVEL_4 = [frozenAndSeparated, sharpThroughout, panningPractice];
