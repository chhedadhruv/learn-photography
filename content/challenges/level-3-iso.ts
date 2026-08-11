import type { Challenge } from "@/lib/challenges/types";

/**
 * Level 3 — ISO alone, indoors, hand-held.
 *
 * ISO only becomes a real choice when there is not enough light and the other two controls are
 * already spent. The scenes cap the shutter at a hand-holdable speed for exactly that reason: a
 * tripod would let any shutter work and make ISO pointless.
 *
 * These challenges open *under*-exposed rather than over. The lesson is "it is too dark, so pay
 * for light with noise", and starting bright would teach the reverse.
 */

export const findTheLight: Challenge = {
  id: "find-the-light",
  level: 3,
  sceneId: "dim-interior",
  title: "Find the light",
  brief:
    "Window light only, and the shutter is already as slow as you can hold steady. Raise the sensor's sensitivity until the still life is properly exposed.",
  hint: "Each step up the ISO scale doubles the sensitivity, worth exactly one stop of light. Watch the meter climb towards the centre — and watch what it costs in the shadows.",
  unlocked: ["iso"],
  goals: [{ type: "exposure" }],
  startOffsetStops: -3,
};

export const cleanAsYouCan: Challenge = {
  id: "clean-as-you-can",
  level: 3,
  sceneId: "dim-interior",
  title: "As clean as you can",
  brief:
    "Same room, but now noise matters. Expose it correctly at the lowest sensitivity that will do the job — anything higher is grain you did not need to accept.",
  hint: "There is exactly one setting that is both bright enough and clean enough. Come up from the bottom rather than down from the top.",
  unlocked: ["iso"],
  // A full stop of latitude on exposure is what makes this a choice rather than a lookup: both
  // ISO 800 and ISO 1600 are acceptable exposures, and only one of them is acceptably clean.
  goals: [
    { type: "exposure", toleranceStops: 1 },
    { type: "noiseLimit", maxIso: 800 },
  ],
  startOffsetStops: -3,
};

export const lastLightOfTheDay: Challenge = {
  id: "last-light-of-the-day",
  level: 3,
  sceneId: "dim-interior-evening",
  title: "Last light of the day",
  brief:
    "Evening now, and two stops darker. Get a usable exposure — this time the sensitivity has to go somewhere you would rather it did not.",
  hint: "Sometimes the honest answer is a noisy photograph. A grainy picture of something is worth more than a clean picture of nothing.",
  unlocked: ["iso"],
  goals: [{ type: "exposure", toleranceStops: 1 }],
  startOffsetStops: -4,
};

export const LEVEL_3 = [findTheLight, cleanAsYouCan, lastLightOfTheDay];
