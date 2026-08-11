import type { Challenge } from "@/lib/challenges/types";
import { LEVEL_1 } from "./level-1-shutter";
import { LEVEL_2 } from "./level-2-aperture";
import { LEVEL_3 } from "./level-3-iso";
import { LEVEL_4 } from "./level-4-pairs";
import { LEVEL_5 } from "./level-5-manual";

export const CHALLENGE_DEFINITIONS: readonly Challenge[] = [
  ...LEVEL_1,
  ...LEVEL_2,
  ...LEVEL_3,
  ...LEVEL_4,
  ...LEVEL_5,
];

export interface LevelInfo {
  readonly level: number;
  readonly name: string;
  readonly teaches: string;
}

/**
 * The ladder. One control at a time, then pairs, then everything — which is the order people
 * actually graduate off automatic in.
 */
export const LEVELS: readonly LevelInfo[] = [
  { level: 1, name: "Shutter speed", teaches: "How long the sensor is exposed, and what moves." },
  { level: 2, name: "Aperture", teaches: "How wide the lens opens, and what stays sharp." },
  { level: 3, name: "ISO", teaches: "Buying light with sensitivity, and paying for it in noise." },
  {
    level: 4,
    name: "Two at once",
    teaches: "When two goals pull the controls in opposite directions.",
  },
  { level: 5, name: "Full manual", teaches: "All three, with nothing chosen for you." },
];
