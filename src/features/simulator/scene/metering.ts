import { FULL_FRAME, type Scene } from "@/lib/sim/types";
import type { SceneSpec } from "./types";

/**
 * Scenes built to fool a light meter, in opposite directions.
 *
 * A meter is not confused by backlighting specifically — it is confused by anything that is not
 * mid-grey. Showing only the backlit case teaches the wrong rule ("compensate when the sun is
 * behind them"); pairing it with snow, where the fault is the same and the frame has no bright
 * background at all, teaches the actual one.
 */

const BACKLIT_SUBJECT_DISTANCE_M = 3;

/**
 * A figure in shade against a bright sky.
 *
 * The proportions matter, and are tuned rather than guessed. Average metering lands 3.6 stops
 * out — further than the compensation dial reaches — so the lesson is that compensation alone
 * will not save you and the metering mode has to change. Centre-weighting cuts it to 2.9, which
 * the dial can just cover. Spot metering removes the error entirely.
 */
export const BACKLIT_PORTRAIT: SceneSpec = {
  id: "backlit-portrait",
  scene: {
    id: "backlit-portrait",
    subjectDistanceM: BACKLIT_SUBJECT_DISTANCE_M,
    backgroundDistanceM: 40,
    subjectSpeedMps: 0,
    imageWidthPx: 1000,
    sensor: FULL_FRAME,
    regions: [
      { id: "figure", ev100: 12, frameShare: 0.25, inCentre: true, isSubject: true },
      { id: "sky", ev100: 16, frameShare: 0.75, inCentre: false, isSubject: false },
    ],
  } satisfies Scene,
  focalLengthMm: 85,
  focusDistanceM: BACKLIT_SUBJECT_DISTANCE_M,
  animated: false,
  effectiveSpeedMps: () => 0,
  speedFraction: () => 0,
};

/**
 * A snow field, evenly lit and uniformly bright.
 *
 * No bright background to blame, and every metering mode reads the same thing — so switching
 * modes changes nothing and only compensation helps. Snow should render about two stops above
 * mid-grey; a camera left alone renders it as dishwater.
 */
export const SNOW_FIELD: SceneSpec = {
  id: "snow-field",
  scene: {
    id: "snow-field",
    subjectDistanceM: 6,
    backgroundDistanceM: 30,
    subjectSpeedMps: 0,
    imageWidthPx: 1000,
    sensor: FULL_FRAME,
    regions: [
      {
        id: "snow",
        ev100: 15,
        frameShare: 0.75,
        inCentre: true,
        isSubject: true,
        rendersStopsAboveMidGrey: 2,
      },
      { id: "posts", ev100: 14.5, frameShare: 0.25, inCentre: false, isSubject: false },
    ],
  } satisfies Scene,
  focalLengthMm: 50,
  focusDistanceM: 6,
  animated: false,
  effectiveSpeedMps: () => 0,
  speedFraction: () => 0,
};
