import type { Challenge } from "@/lib/challenges/types";

/**
 * Level 2 — aperture alone, against a row of markers at known distances.
 *
 * Depth of field is otherwise a vague impression. With markers at stated distances a player can
 * see exactly how far back sharpness survives, and watch that distance move as the aperture
 * changes.
 */

export const separateTheSubject: Challenge = {
  id: "separate-the-subject",
  level: 2,
  sceneId: "depth-row",
  title: "Separate the subject",
  brief:
    "Focus is on the second marker. Open the lens far enough that the furthest marker dissolves into a soft wash, so the eye goes straight to the subject — and keep the exposure right.",
  hint: "A smaller f-number is a wider opening. Wider lets in more light and shrinks the band of sharpness around the focus point, so the markers behind fall away.",
  unlocked: ["aperture"],
  // The shutter is pinned fast so the aperture that exposes correctly is a wide one. Left to
  // the automatic mid-range choice, the answer would be f/5.6 and the background would stay
  // stubbornly legible however the brief was worded.
  locked: { shutterSeconds: 1 / 1024 },
  goals: [{ type: "exposure" }, { type: "backgroundBlur", minBlurPx: 14 }],
  startOffsetStops: -3,
};

export const keepItAllSharp: Challenge = {
  id: "keep-it-all-sharp",
  level: 2,
  sceneId: "depth-row",
  title: "Keep it all sharp",
  brief:
    "The opposite problem. Stop the lens down until even the furthest marker is readable, front to back, without losing the exposure.",
  hint: "A larger f-number is a narrower opening. It cuts the light, but it stretches the band of sharpness so far more of the scene falls inside it.",
  unlocked: ["aperture"],
  // Pinned slow, so the correct aperture is a narrow one and depth is what the player buys.
  locked: { shutterSeconds: 1 / 64 },
  goals: [{ type: "exposure" }, { type: "deepFocus", maxBlurPx: 5 }],
  startOffsetStops: 3,
};

export const justEnoughSeparation: Challenge = {
  id: "just-enough-separation",
  level: 2,
  sceneId: "depth-row-overcast",
  title: "Just enough separation",
  brief:
    "Flat, dull light this time. Soften the background enough that the subject stands clear, but not so much that the scene loses its sense of depth — and expose it correctly.",
  hint: "There is a band of apertures that satisfies both. Work out which end fails first: too wide and the background is a smear, too narrow and nothing separates.",
  unlocked: ["aperture"],
  // Two competing thresholds on the same control: the first challenge with a right *range*
  // rather than a right end of the scale.
  goals: [
    { type: "exposure" },
    { type: "backgroundBlur", minBlurPx: 6 },
    { type: "deepFocus", maxBlurPx: 22 },
  ],
  startOffsetStops: 3,
};

export const LEVEL_2 = [separateTheSubject, keepItAllSharp, justEnoughSeparation];
