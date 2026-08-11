import { describe, expect, it } from "vitest";
import {
  EMPTY_PROGRESS,
  decodeProgress,
  encodeProgress,
  recordAttempt,
  starsFor,
} from "./progress";

const sample = (() => {
  let state = recordAttempt(EMPTY_PROGRESS, "freeze-the-pendulum", 3);
  state = recordAttempt(state, "show-the-swing", 2);
  return state;
})();

describe("progress codes", () => {
  it("round-trips a state exactly", () => {
    const decoded = decodeProgress(encodeProgress(sample));

    expect(decoded).toEqual(sample);
  });

  it("preserves individual scores", () => {
    const decoded = decodeProgress(encodeProgress(sample));

    expect(decoded).not.toBeNull();
    if (!decoded) return;
    expect(starsFor(decoded, "freeze-the-pendulum")).toBe(3);
    expect(starsFor(decoded, "show-the-swing")).toBe(2);
  });

  it("produces a code safe to paste into a URL or a chat window", () => {
    const code = encodeProgress(sample);

    expect(code.startsWith("LP1-")).toBe(true);
    expect(code).not.toMatch(/[+/=]/);
  });

  it("round-trips an empty slate", () => {
    expect(decodeProgress(encodeProgress(EMPTY_PROGRESS))).toEqual(EMPTY_PROGRESS);
  });

  it("survives non-ASCII challenge ids", () => {
    const unusual = recordAttempt(EMPTY_PROGRESS, "café—naïve", 2);

    expect(decodeProgress(encodeProgress(unusual))).toEqual(unusual);
  });

  // A code that fails to decode must report the failure rather than quietly returning an empty
  // state, which the UI would then write over whatever the person already had.
  it("rejects a code without the prefix", () => {
    expect(decodeProgress("not-a-code")).toBeNull();
  });

  it("rejects a prefixed code with rubbish after it", () => {
    expect(decodeProgress("LP1-!!!!not base64!!!!")).toBeNull();
  });

  it("rejects a code carrying valid base64 that is not progress", () => {
    expect(decodeProgress(encodeProgress(EMPTY_PROGRESS).replace(/.$/, "X"))).not.toEqual(sample);
  });

  it("ignores surrounding whitespace from a sloppy copy and paste", () => {
    expect(decodeProgress(`  ${encodeProgress(sample)}\n`)).toEqual(sample);
  });
});
