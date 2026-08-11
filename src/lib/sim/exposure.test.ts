import { describe, expect, it } from "vitest";
import {
  describeExposure,
  evaluateExposure,
  isEquivalentExposure,
  requiredEv,
  settingEv,
  stopsBetween,
} from "./exposure";
import type { CameraSettings } from "./types";
import { APERTURES, SHUTTER_SPEEDS, nearestValue } from "./values";

/**
 * Printed markings are rounded conventions, so tests snap them to the exact ladder value the
 * same way the UI does. `f(2.8)` is the rung a lens marks "2.8", which is really 2√2.
 */
const f = (printed: number) => nearestValue(APERTURES, printed);
const s = (denominator: number) => nearestValue(SHUTTER_SPEEDS, 1 / denominator);

const settings = (overrides: Partial<CameraSettings> = {}): CameraSettings => ({
  shutterSeconds: s(125),
  aperture: f(5.6),
  iso: 100,
  focalLengthMm: 50,
  focusDistanceM: 3,
  ...overrides,
});

describe("settingEv", () => {
  it("puts f/1 at one second at EV 0, the definition", () => {
    expect(settingEv({ aperture: 1, shutterSeconds: 1 })).toBeCloseTo(0, 10);
  });

  it("matches the sunny-16 anchor: f/16 at 1/125 is EV 15", () => {
    expect(settingEv({ aperture: f(16), shutterSeconds: s(125) })).toBeCloseTo(15, 10);
  });

  it("gains exactly one stop when the shutter halves", () => {
    expect(
      settingEv({ aperture: f(4), shutterSeconds: s(500) }) -
        settingEv({ aperture: f(4), shutterSeconds: s(250) }),
    ).toBeCloseTo(1, 10);
  });

  it("gains exactly one stop for each aperture step", () => {
    for (let i = 1; i < APERTURES.length; i += 1) {
      const wider = APERTURES[i - 1] ?? 1;
      const narrower = APERTURES[i] ?? 1;

      expect(
        settingEv({ aperture: narrower, shutterSeconds: s(125) }) -
          settingEv({ aperture: wider, shutterSeconds: s(125) }),
      ).toBeCloseTo(1, 10);
    }
  });
});

describe("requiredEv", () => {
  it("allows one stop more EV for each doubling of ISO", () => {
    expect(requiredEv(12, 200) - requiredEv(12, 100)).toBeCloseTo(1, 10);
    expect(requiredEv(12, 6400) - requiredEv(12, 100)).toBeCloseTo(6, 10);
  });
});

describe("evaluateExposure", () => {
  it("calls a matched exposure correct", () => {
    const result = evaluateExposure(settings({ aperture: f(16), shutterSeconds: s(125) }), 15);

    expect(result.verdict).toBe("correct");
    expect(result.deviationStops).toBeCloseTo(0, 10);
  });

  it("reports too much light as overexposed, with a positive deviation", () => {
    const result = evaluateExposure(settings({ aperture: f(8), shutterSeconds: s(125) }), 15);

    expect(result.verdict).toBe("over");
    expect(result.deviationStops).toBeCloseTo(2, 10);
  });

  it("reports too little light as underexposed, with a negative deviation", () => {
    const result = evaluateExposure(settings({ aperture: f(16), shutterSeconds: s(500) }), 15);

    expect(result.verdict).toBe("under");
    expect(result.deviationStops).toBeCloseTo(-2, 10);
  });

  it("accepts anything within half a stop", () => {
    expect(
      evaluateExposure(settings({ aperture: f(16), shutterSeconds: s(125) }), 15.4).verdict,
    ).toBe("correct");
  });

  it("rejects beyond half a stop", () => {
    expect(
      evaluateExposure(settings({ aperture: f(16), shutterSeconds: s(125) }), 15.75).verdict,
    ).not.toBe("correct");
  });

  it("treats raising ISO as equivalent to opening up", () => {
    const result = evaluateExposure(
      settings({ aperture: f(16), shutterSeconds: s(125), iso: 400 }),
      13,
    );

    expect(result.verdict).toBe("correct");
  });
});

describe("isEquivalentExposure", () => {
  it("treats reciprocal pairs as exactly the same brightness", () => {
    expect(
      isEquivalentExposure(
        settings({ aperture: f(2.8), shutterSeconds: s(1000) }),
        settings({ aperture: f(4), shutterSeconds: s(500) }),
      ),
    ).toBe(true);
  });

  it("holds across the whole ladder, not just one pair", () => {
    // Each step wider must be matched by one step faster.
    for (let i = 1; i < 6; i += 1) {
      expect(
        isEquivalentExposure(
          settings({ aperture: APERTURES[i] ?? 1, shutterSeconds: SHUTTER_SPEEDS[i] ?? 1 }),
          settings({
            aperture: APERTURES[i - 1] ?? 1,
            shutterSeconds: SHUTTER_SPEEDS[i - 1] ?? 1,
          }),
        ),
      ).toBe(true);
    }
  });

  it("accounts for ISO in the equivalence", () => {
    expect(
      isEquivalentExposure(
        settings({ aperture: f(2.8), shutterSeconds: s(250), iso: 100 }),
        settings({ aperture: f(5.6), shutterSeconds: s(250), iso: 400 }),
      ),
    ).toBe(true);
  });

  it("does not treat different brightnesses as equivalent", () => {
    expect(
      isEquivalentExposure(
        settings({ aperture: f(2.8), shutterSeconds: s(1000) }),
        settings({ aperture: f(2.8), shutterSeconds: s(500) }),
      ),
    ).toBe(false);
  });
});

describe("stopsBetween", () => {
  it("counts a doubling as one stop", () => {
    expect(stopsBetween(100, 200)).toBeCloseTo(1, 10);
    expect(stopsBetween(100, 6400)).toBeCloseTo(6, 10);
  });
});

describe("describeExposure", () => {
  it("names the direction so the critique can act on it", () => {
    expect(describeExposure(evaluateExposure(settings({ aperture: f(8) }), 12))).toMatch(
      /overexposed|underexposed/,
    );
  });

  it("uses the singular for exactly one stop", () => {
    const result = evaluateExposure(settings({ aperture: f(16), shutterSeconds: s(250) }), 15);

    expect(describeExposure(result)).toBe("1 stop underexposed");
  });
});
