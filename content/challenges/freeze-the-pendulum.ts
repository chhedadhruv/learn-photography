import type { Challenge } from "@/lib/challenges/types";

/**
 * Level 1. Shutter speed is the only control; aperture and ISO are chosen automatically and
 * shown, so the player can see what the camera picked for them.
 *
 * The scene is arranged so the shutter that exposes correctly is also the one that freezes the
 * bob. The two lessons agree rather than compete, which is what a first challenge needs — the
 * player should finish it believing "faster shutter, sharper subject", not juggling a trade-off
 * they have not been taught yet.
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
