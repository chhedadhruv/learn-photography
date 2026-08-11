import type { Challenge } from "@/lib/challenges/types";

/**
 * Level 1 — shutter speed alone. Aperture and ISO are chosen automatically and shown, so the
 * player can see what the camera picked for them.
 *
 * All three scenes agree that the shutter which exposes correctly is also the one that produces
 * the intended result. A first level should not ask anyone to weigh a trade-off they have not
 * been taught.
 */

export const freezeThePendulum: Challenge = {
  id: "freeze-the-pendulum",
  level: 1,
  sceneId: "pendulum",
  title: "Freeze the pendulum",
  brief:
    "The bob is swinging past a ruled backdrop. Catch it sharply as it passes through the centre, where it is moving fastest — without over- or under-exposing the shot.",
  hint: "The shutter fires the moment you press it, so the bob is caught wherever it happens to be. Every step towards a faster shutter halves the light, and halves how far the bob travels while the shutter is open.",
  unlocked: ["shutter"],
  goals: [{ type: "exposure" }, { type: "freezeMotion", maxBlurPx: 2 }],
  // Opens three stops too slow: the meter is pegged bright, the frame is washed out, and the bob
  // is a streak. All three are cured by the same correction.
  startOffsetStops: 3,
};

export const showTheSwing: Challenge = {
  id: "show-the-swing",
  level: 1,
  sceneId: "pendulum-dusk",
  title: "Show the swing",
  brief:
    "Now the opposite. Let the bob blur across at least a couple of the backdrop's rules, so the photograph says the pendulum was moving — while keeping the exposure correct.",
  hint: "A slower shutter leaves the sensor open longer, so the bob travels further across the frame during the exposure. Watch the meter: the extra light has to be paid for somewhere.",
  unlocked: ["shutter"],
  // A deliberate inversion of the first challenge: the same control, the opposite intent.
  goals: [{ type: "exposure" }, { type: "showMotion", minBlurPx: 12 }],
  startOffsetStops: -3,
};

export const steadyInTheHand: Challenge = {
  id: "steady-in-the-hand",
  level: 1,
  sceneId: "dim-interior",
  title: "Steady in the hand",
  brief:
    "A still life indoors, hand-held. Nothing is moving, but you are. Find a shutter speed that exposes correctly without the camera's own shake softening the picture.",
  hint: "The rule of thumb is one over the focal length: a 50mm lens wants about 1/50s or faster in the hand. Slower than that and your own movement blurs the shot even though the subject is still.",
  unlocked: ["shutter"],
  goals: [{ type: "exposure", toleranceStops: 1 }, { type: "handheldSteady" }],
  startOffsetStops: 2,
};

export const LEVEL_1 = [freezeThePendulum, showTheSwing, steadyInTheHand];
