/**
 * Progression: stars held, XP earned, levels unlocked, badges awarded.
 *
 * Pure functions over a plain object. Phase 6 persists it to localStorage; nothing here knows
 * that, so the rules can be tested without a browser.
 */

export const XP_PER_STAR = 20;

export interface ProgressState {
  /** Schema version, so a future shape change can migrate rather than discard someone's work. */
  readonly version: 1;
  /** Best stars ever earned per challenge id. */
  readonly best: Readonly<Record<string, number>>;
}

export const EMPTY_PROGRESS: ProgressState = { version: 1, best: {} };

/**
 * Records an attempt, keeping the best result.
 *
 * A worse retry never costs anything. Experimenting with settings to see what happens is the
 * behaviour this whole thing exists to encourage, so it must never be punished.
 */
export function recordAttempt(
  state: ProgressState,
  challengeId: string,
  stars: number,
): ProgressState {
  const previous = state.best[challengeId] ?? 0;
  if (stars <= previous) return state;

  return { ...state, best: { ...state.best, [challengeId]: stars } };
}

export function starsFor(state: ProgressState, challengeId: string): number {
  return state.best[challengeId] ?? 0;
}

export function totalStars(state: ProgressState, challengeIds?: readonly string[]): number {
  const entries = Object.entries(state.best);
  const relevant =
    challengeIds === undefined ? entries : entries.filter(([id]) => challengeIds.includes(id));

  return relevant.reduce((sum, [, stars]) => sum + stars, 0);
}

export function totalXp(state: ProgressState): number {
  return totalStars(state) * XP_PER_STAR;
}

export interface LevelDefinition {
  readonly level: number;
  readonly name: string;
  readonly challengeIds: readonly string[];
  /** Stars needed within this level before the next one opens. */
  readonly starsToUnlockNext: number;
}

/**
 * A level opens when the one before it has earned enough stars. Level 1 is always open — a
 * locked front door would be absurd.
 */
export function isLevelUnlocked(
  state: ProgressState,
  levels: readonly LevelDefinition[],
  level: number,
): boolean {
  if (level <= 1) return true;

  const previous = levels.find((candidate) => candidate.level === level - 1);
  if (!previous) return false;

  return (
    totalStars(state, previous.challengeIds) >= previous.starsToUnlockNext &&
    isLevelUnlocked(state, levels, level - 1)
  );
}

export function highestUnlockedLevel(
  state: ProgressState,
  levels: readonly LevelDefinition[],
): number {
  return levels.reduce(
    (highest, level) => (isLevelUnlocked(state, levels, level.level) ? level.level : highest),
    1,
  );
}

export interface Badge {
  readonly id: string;
  readonly name: string;
  readonly description: string;
  readonly earned: (state: ProgressState, levels: readonly LevelDefinition[]) => boolean;
}

export const BADGES: readonly Badge[] = [
  {
    id: "first-frame",
    name: "First Frame",
    description: "Complete your first challenge.",
    earned: (state) => Object.keys(state.best).length >= 1,
  },
  {
    id: "clean-sweep",
    name: "Clean Sweep",
    description: "Earn three stars on every challenge in a level.",
    earned: (state, levels) =>
      levels.some(
        (level) =>
          level.challengeIds.length > 0 &&
          level.challengeIds.every((id) => starsFor(state, id) === 3),
      ),
  },
  {
    id: "halfway",
    name: "Halfway",
    description: "Earn half the stars on offer.",
    earned: (state, levels) => {
      const total = levels.reduce((sum, level) => sum + level.challengeIds.length * 3, 0);
      return total > 0 && totalStars(state) >= total / 2;
    },
  },
  {
    id: "full-manual",
    name: "Full Manual",
    description: "Reach the level where every control is yours.",
    earned: (state, levels) => highestUnlockedLevel(state, levels) >= 5,
  },
  {
    id: "every-frame",
    name: "Every Frame",
    description: "Three stars on every challenge.",
    earned: (state, levels) =>
      levels.every(
        (level) =>
          level.challengeIds.length > 0 &&
          level.challengeIds.every((id) => starsFor(state, id) === 3),
      ),
  },
];

export function earnedBadges(
  state: ProgressState,
  levels: readonly LevelDefinition[],
): readonly Badge[] {
  return BADGES.filter((badge) => badge.earned(state, levels));
}

/**
 * Parsing is defensive because the input is localStorage — user-editable, and possibly written
 * by an older version of the app. Anything unrecognised resets rather than throwing, since
 * losing progress is annoying but a crash on load is worse.
 */
export function parseProgress(raw: string | null): ProgressState {
  if (raw === null) return EMPTY_PROGRESS;

  try {
    const parsed: unknown = JSON.parse(raw);
    if (typeof parsed !== "object" || parsed === null) return EMPTY_PROGRESS;

    const record = parsed as Record<string, unknown>;
    if (record.version !== 1) return EMPTY_PROGRESS;

    const best = record.best;
    if (typeof best !== "object" || best === null) return EMPTY_PROGRESS;

    const cleaned: Record<string, number> = {};
    for (const [id, stars] of Object.entries(best as Record<string, unknown>)) {
      if (typeof stars === "number" && Number.isFinite(stars) && stars >= 0 && stars <= 3) {
        cleaned[id] = Math.floor(stars);
      }
    }

    return { version: 1, best: cleaned };
  } catch {
    return EMPTY_PROGRESS;
  }
}

export function serialiseProgress(state: ProgressState): string {
  return JSON.stringify(state);
}

/**
 * Portable progress codes.
 *
 * A copyable string rather than an account: it moves progress between devices and doubles as a
 * backup before someone clears their site data, without a server, a login, or anything to leak.
 */
const CODE_PREFIX = "LP1-";

/** UTF-8 safe base64, without the deprecated escape/unescape pair. */
function toBase64(text: string): string {
  const bytes = new TextEncoder().encode(text);
  let binary = "";
  for (const byte of bytes) binary += String.fromCharCode(byte);
  return btoa(binary);
}

function fromBase64(base64: string): string {
  const binary = atob(base64);
  return new TextDecoder().decode(Uint8Array.from(binary, (char) => char.charCodeAt(0)));
}

export function encodeProgress(state: ProgressState): string {
  const base64 = toBase64(JSON.stringify(state));
  // URL-safe, so the code survives being pasted into a chat window or an address bar.
  return CODE_PREFIX + base64.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

/** Returns null for anything unrecognised, so a mistyped code reports a problem rather than
 *  silently wiping what is already there. */
export function decodeProgress(code: string): ProgressState | null {
  const trimmed = code.trim();
  if (!trimmed.startsWith(CODE_PREFIX)) return null;

  const body = trimmed.slice(CODE_PREFIX.length).replace(/-/g, "+").replace(/_/g, "/");
  const padded = body + "=".repeat((4 - (body.length % 4)) % 4);

  try {
    const json = fromBase64(padded);
    const parsed = parseProgress(json);
    // parseProgress falls back to empty for anything malformed; an empty result from a non-empty
    // code means the code was junk rather than a genuine record of no progress.
    if (Object.keys(parsed.best).length === 0 && !json.includes('"best":{}')) return null;
    return parsed;
  } catch {
    return null;
  }
}
