import { describe, expect, it } from "vitest";
import { APERTURE_BARREL, APERTURE_BLADES, APERTURE_OPENING } from "./apertureGeometry";

const CENTRE = { x: APERTURE_BARREL.cx, y: APERTURE_BARREL.cy };
const OPENING_RADIUS = 4.2;

const distanceFromCentre = (x: number, y: number) => Math.hypot(x - CENTRE.x, y - CENTRE.y);

/** Pulls the numeric pairs out of a path built only from absolute M/L commands. */
const points = (path: string): { x: number; y: number }[] => {
  const numbers = path
    .replace(/[MLZ]/g, " ")
    .trim()
    .split(/\s+/)
    .filter((token) => token.length > 0)
    .map(Number);

  const parsed: { x: number; y: number }[] = [];
  for (let i = 0; i + 1 < numbers.length; i += 2) {
    const x = numbers[i];
    const y = numbers[i + 1];
    if (x === undefined || y === undefined) continue;
    parsed.push({ x, y });
  }
  return parsed;
};

/**
 * The blade coordinates are baked-in rotations rather than `transform` attributes, so nothing at
 * runtime would catch a mistyped digit. These assertions re-derive the constraints the shape was
 * built from, which is what keeps the mark correct across the header, favicon and Apple icon.
 */
describe("aperture geometry", () => {
  it("has six blades, one per hexagon edge", () => {
    expect(APERTURE_BLADES).toHaveLength(6);
  });

  it("puts every opening vertex on the hexagon's circumradius", () => {
    const vertices = points(APERTURE_OPENING);

    expect(vertices).toHaveLength(6);
    for (const vertex of vertices) {
      expect(distanceFromCentre(vertex.x, vertex.y)).toBeCloseTo(OPENING_RADIUS, 2);
    }
  });

  it("starts each blade at a vertex of the opening", () => {
    const vertices = points(APERTURE_OPENING);

    for (const blade of APERTURE_BLADES) {
      const start = points(blade)[0];
      expect(start).toBeDefined();
      if (!start) continue;

      const matchesAVertex = vertices.some(
        (vertex) => Math.hypot(vertex.x - start.x, vertex.y - start.y) < 0.01,
      );
      expect(matchesAVertex).toBe(true);
    }
  });

  it("ends each blade exactly on the barrel", () => {
    for (const blade of APERTURE_BLADES) {
      const parsed = points(blade);
      const end = parsed[parsed.length - 1];
      expect(end).toBeDefined();
      if (!end) continue;

      expect(distanceFromCentre(end.x, end.y)).toBeCloseTo(APERTURE_BARREL.r, 2);
    }
  });

  it("spaces the blades evenly around the circle", () => {
    const angles = APERTURE_BLADES.map((blade) => {
      const start = points(blade)[0] ?? { x: 0, y: 0 };
      const degrees = (Math.atan2(start.y - CENTRE.y, start.x - CENTRE.x) * 180) / Math.PI;
      return Math.round((degrees + 360) % 360);
    }).sort((a, b) => a - b);

    expect(angles).toEqual([0, 60, 120, 180, 240, 300]);
  });

  it("uses only absolute commands, so constrained renderers can parse it", () => {
    const allPaths = [APERTURE_OPENING, ...APERTURE_BLADES];

    for (const path of allPaths) {
      expect(path).not.toMatch(/[mlhvcsqtaz]/);
      expect(path).not.toContain("transform");
    }
  });
});
