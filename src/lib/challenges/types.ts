import { z } from "zod";
import type { ControlName } from "@/lib/sim/meter";
import type { Goal } from "@/lib/sim/scoring";

/**
 * Challenge definitions are logic rather than prose, so they are TypeScript rather than MDX —
 * but they are still validated, because a malformed goal threshold produces an unwinnable
 * challenge and a reader who blames themselves.
 */

export interface Challenge {
  readonly id: string;
  readonly level: number;
  readonly sceneId: string;
  readonly title: string;
  readonly brief: string;
  readonly hint: string;
  /** Controls the player operates. Everything else is set automatically and shown as locked. */
  readonly unlocked: readonly ControlName[];
  readonly goals: readonly Goal[];
  /**
   * How many stops away from correct the unlocked controls start. Declared per challenge rather
   * than fixed globally, so a player learns to read the meter instead of memorising "three
   * clicks right".
   */
  readonly startOffsetStops: number;
}

const controlName = z.enum(["shutter", "aperture", "iso"]);

const goal = z.discriminatedUnion("type", [
  z.object({ type: z.literal("exposure"), toleranceStops: z.number().positive().optional() }),
  z.object({ type: z.literal("freezeMotion"), maxBlurPx: z.number().positive() }),
  z.object({ type: z.literal("showMotion"), minBlurPx: z.number().positive() }),
  z.object({ type: z.literal("backgroundBlur"), minBlurPx: z.number().positive() }),
  z.object({ type: z.literal("deepFocus"), maxBlurPx: z.number().positive() }),
  z.object({ type: z.literal("noiseLimit"), maxIso: z.number().positive() }),
  z.object({ type: z.literal("handheldSteady") }),
]);

export const challengeSchema = z.object({
  id: z.string().regex(/^[a-z0-9]+(?:-[a-z0-9]+)*$/),
  level: z.number().int().min(1).max(7),
  sceneId: z.string().min(1),
  title: z.string().min(1).max(80),
  brief: z.string().min(20),
  hint: z.string().min(10),
  unlocked: z.array(controlName).min(1),
  goals: z.array(goal).min(1),
  startOffsetStops: z
    .number()
    .int()
    .refine((n) => Math.abs(n) >= 1 && Math.abs(n) <= 5, {
      message: "must be between 1 and 5 stops away from correct, in either direction",
    }),
});
