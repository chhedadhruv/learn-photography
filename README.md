# Learn Photography

Interactive photography lessons and a browser-based camera simulator for beginners.

Deployed at **[learn.dhruvchheda.com](https://learn.dhruvchheda.com)**.

The site is deliberately practical rather than theoretical. Alongside written lessons it runs a
camera simulator: you are shown a scene, you set shutter speed, aperture and ISO, you press
capture, and you get back a rendered photograph plus a graded critique of your settings. A level
ladder unlocks one control at a time, so each variable is learned in isolation before they are
combined.

## Stack

|                 |                                                 |
| --------------- | ----------------------------------------------- |
| Framework       | Next.js 16 (App Router, React Compiler enabled) |
| Language        | TypeScript, strict                              |
| Styling         | Tailwind CSS v4                                 |
| Content         | MDX in-repo, Zod-validated frontmatter          |
| 3D              | three.js via react-three-fiber, lazy-loaded     |
| Tests           | Vitest + Testing Library                        |
| Package manager | Yarn 1 (Classic)                                |
| Hosting         | Vercel                                          |

## Getting started

```bash
yarn install
yarn dev
```

Node 22 is expected — see `.nvmrc`.

## Scripts

| Script                              | Does                                      |
| ----------------------------------- | ----------------------------------------- |
| `yarn dev`                          | Development server                        |
| `yarn build` / `yarn start`         | Production build and serve                |
| `yarn lint`                         | ESLint, zero warnings tolerated           |
| `yarn typecheck`                    | `tsc --noEmit`                            |
| `yarn format` / `yarn format:check` | Prettier write / verify                   |
| `yarn test` / `yarn test:watch`     | Vitest                                    |
| `yarn verify`                       | Everything above, in the order CI runs it |

> Named `verify`, not `check` — `yarn check` is a built-in Yarn 1 command that validates
> `node_modules` against the lockfile, and it silently shadows a script of the same name.

## Quality gates

The gates are the point, not ceremony. They were set up before any feature code, so no commit in
this repository's history predates them.

- **pre-commit** — Prettier and ESLint on staged files, then a full typecheck and test run.
  Warnings fail the same as errors.
- **pre-push** — a production build, so nothing reaches CI unbuilt.
- **CI** — every check again on each pull request, as separate steps so failures are
  attributable at a glance.

Two rules have no exceptions:

- **No `any`.** Loose or `unknown` data gets parsed into a typed shape, not cast.
- **No suppression comments.** `noInlineConfig` is enabled in `eslint.config.mjs`, so
  `eslint-disable` comments are inert — a rule can only be silenced by fixing the code or by an
  explicit, reviewable change to the config. `@ts-ignore` is banned by `ban-ts-comment`.

## Architecture

The load-bearing decision: **all simulator physics and scoring live in `src/lib/sim/` as pure
TypeScript with no three.js dependency.** Exposure, circle of confusion and motion blur are
computed analytically from the settings and the scene's metadata rather than by inspecting
rendered pixels. Grading is therefore deterministic, identical on every GPU, and unit-testable
without a renderer — and the same number that blurs the background is the one the rubric checks.

three.js is dynamically imported and never enters the shared bundle, so article pages stay fast.

```
src/
  app/          routes (App Router)
  lib/
    sim/        pure physics + scoring, no renderer
    content/    MDX loading, Zod schemas, curriculum
  features/
    simulator/  react-three-fiber renderer and controls (lazy)
  components/
content/        authored MDX lessons and challenge definitions
public/assets/  brand, icons, images
```

## Deploying

Hosted on Vercel, built from `main`. The build runs `yarn search-index` first (via `prebuild`),
which also validates every glossary cross-reference — so a broken reference fails the deploy rather
than shipping a dead link.

No environment variables are required. `SITE_URL` is a constant in `src/lib/site.ts` rather than
configuration, because canonical URLs and the sitemap must name this subdomain regardless of which
host happens to serve a given request.

Every page is statically generated. There is no server-rendered route, no database and no API, so a
deploy is a set of files and nothing else.

## Contributing

Work proceeds in numbered phases, one branch and one pull request each: `phase-N/description`.
`main` is protected and only accepts merges whose CI run is green.

## License

MIT — see [LICENSE](./LICENSE).
