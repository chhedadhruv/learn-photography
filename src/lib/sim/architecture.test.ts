import { readFile, readdir } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";

const SIM_DIR = path.join(process.cwd(), "src", "lib", "sim");

/** Anything that would drag a renderer, the DOM, or the filesystem into the physics. */
const FORBIDDEN = [
  "three",
  "@react-three",
  "react-dom",
  "next/",
  "node:fs",
  "server-only",
] as const;

async function simSourceFiles(): Promise<string[]> {
  const entries = await readdir(SIM_DIR);
  return entries.filter((name) => name.endsWith(".ts") && !name.endsWith(".test.ts"));
}

/**
 * The load-bearing rule of the whole simulator: `src/lib/sim` is pure TypeScript.
 *
 * Physics and scoring compute analytically from numbers, never by inspecting rendered pixels, so
 * grading is deterministic and identical on every GPU. That property is easy to lose one
 * convenient import at a time, so it is checked mechanically rather than remembered.
 */
describe("simulation core stays pure", () => {
  it("imports nothing from a renderer, the DOM or the filesystem", async () => {
    const files = await simSourceFiles();
    expect(files.length).toBeGreaterThan(0);

    const offenders: string[] = [];

    for (const file of files) {
      const source = await readFile(path.join(SIM_DIR, file), "utf8");

      for (const match of source.matchAll(/^\s*import[^;]*?from\s+"([^"]+)"/gm)) {
        const specifier = match[1] ?? "";
        if (FORBIDDEN.some((banned) => specifier.startsWith(banned))) {
          offenders.push(`${file} imports ${specifier}`);
        }
      }
    }

    expect(offenders).toEqual([]);
  });

  it("only imports from within the simulation core", async () => {
    const files = await simSourceFiles();
    const external: string[] = [];

    for (const file of files) {
      const source = await readFile(path.join(SIM_DIR, file), "utf8");

      for (const match of source.matchAll(/^\s*import[^;]*?from\s+"([^"]+)"/gm)) {
        const specifier = match[1] ?? "";
        if (!specifier.startsWith("./")) external.push(`${file} imports ${specifier}`);
      }
    }

    expect(external).toEqual([]);
  });
});
