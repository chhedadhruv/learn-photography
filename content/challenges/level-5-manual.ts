import type { Challenge } from "@/lib/challenges/types";

/**
 * Level 5 — everything unlocked.
 *
 * With all three controls in play almost any exposure is reachable, so the goals have to carry
 * the difficulty. Each of these constrains all three: a motion or depth demand pins two, and a
 * noise ceiling closes the escape route of simply winding ISO up until the meter centres.
 */

export const fullManual: Challenge = {
  id: "full-manual",
  level: 5,
  sceneId: "pendulum-deep",
  title: "Full manual",
  brief:
    "Everything is yours now. Freeze the bob, soften the backdrop, expose it correctly, and keep the sensitivity low enough that the picture stays clean.",
  hint: "Three demands and three controls, but they are not independent. Set the two the goals dictate, then use the third to bring the meter home — and check you have not spent more sensitivity than you needed.",
  unlocked: ["shutter", "aperture", "iso"],
  goals: [
    { type: "exposure" },
    { type: "freezeMotion", maxBlurPx: 3 },
    { type: "backgroundBlur", minBlurPx: 12 },
    { type: "noiseLimit", maxIso: 800 },
  ],
  startOffsetStops: 3,
};

export const theWholeRoom: Challenge = {
  id: "the-whole-room",
  level: 5,
  sceneId: "dim-interior",
  title: "The whole room",
  brief:
    "Indoors and hand-held, with depth to hold and not much light to hold it with. Sharp front to back, steady in the hand, correctly exposed, and as clean as you can manage.",
  hint: "This is the situation every beginner meets and loses. Decide what you are least willing to give up, then discover what the other two cost you.",
  unlocked: ["shutter", "aperture", "iso"],
  goals: [
    { type: "exposure", toleranceStops: 1 },
    { type: "deepFocus", maxBlurPx: 6 },
    { type: "handheldSteady" },
    { type: "noiseLimit", maxIso: 3200 },
  ],
  startOffsetStops: -3,
};

export const theDecidingShot: Challenge = {
  id: "the-deciding-shot",
  level: 5,
  sceneId: "depth-row-overcast",
  title: "The deciding shot",
  brief:
    "Dull light, and a portrait to make. Separate the subject from the background, hold the camera steady, expose it properly, and keep the noise down. Every control matters and none of them is free.",
  hint: "Start from the aperture the look demands, then find the shutter that keeps you steady, and only then reach for sensitivity to make up the difference.",
  unlocked: ["shutter", "aperture", "iso"],
  goals: [
    { type: "exposure" },
    { type: "backgroundBlur", minBlurPx: 10 },
    { type: "handheldSteady" },
    { type: "noiseLimit", maxIso: 1600 },
  ],
  startOffsetStops: 2,
};

export const LEVEL_5 = [fullManual, theWholeRoom, theDecidingShot];
