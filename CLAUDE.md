@AGENTS.md

# Working agreement

- **Ask before deciding.** Architecture, libraries, naming — surface options with trade-offs and
  a recommendation, don't choose silently. This applies to choices that look routine.
- **Pause for anything needing Dhruv's machine or accounts** — repo creation, DNS, Vercel,
  credentials, global installs. State what he needs to do, then stop.
- **Work in numbered phases**, one branch per phase (`phase-N/description`), one PR each. Push
  the branch and hand him the compare link; **he opens and merges the PR** and says when to start
  the next phase. Never commit to `main`.
- **Commit only after he has approved the work**, and never with a `Co-Authored-By` trailer.
- **Don't write photography lesson content.** Dhruv authors that himself. Build the platform,
  templates and engine, using clearly-labelled placeholder copy.

# Non-negotiables

- **No `any`, no `@ts-ignore`, no `eslint-disable`.** `noInlineConfig` makes disable comments
  inert by design. If something appears to need a suppression, that is a question for Dhruv, not
  a workaround. Parse loose data into a typed shape rather than casting it.
- **Warnings fail like errors.** `eslint --max-warnings 0` everywhere.
- **Gates before features.** Never add feature code that the existing gates don't cover.

# Architecture rules

- `src/lib/sim/` is **pure TypeScript and must never import three.js.** All physics and scoring
  are analytic functions over numbers, so grading stays deterministic and unit-testable. Never
  score by reading pixels from the canvas.
- three.js / react-three-fiber must stay behind a dynamic import and out of the shared bundle.
  Article pages load zero 3D code.
- The simulator is a `<canvas>` and therefore invisible to assistive tech: every capture must
  also emit a text description of the result into a live region, and the written critique is the
  primary feedback channel for all users.

# Next.js 16

This version differs from training data — read `node_modules/next/dist/docs/` before using an
API rather than recalling it. Route props use the generated global types (`LayoutProps<"/">`,
`PageProps<"/route">`).

Those globals are **generated into `.next/types/` and do not exist in a clean tree**, so
`yarn typecheck` runs `next typegen` first. Never assume a check that passes locally passes in
CI — a stale `.next/` directory masked exactly this failure once. Verify against a clean tree
(`rm -rf .next`) before pushing anything that touches types or the build.
