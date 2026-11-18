# 🎄 Naughty or Nice: The Fabric Best Practices Predictor

A festive Microsoft Fabric App that tests your Fabric data platform instincts.
Each "Santa's Workshop" scenario describes something a team did. You judge it,
and a slightly judgmental elf foreman explains the documented Microsoft Fabric
practice behind the answer. At the end you get a verdict, from **Lump of Coal**
to **North Pole Certified**, and a place on the seasonal **Top 10 Nice / Top 10
Naughty** scoreboard.

<img width="1141" height="587" alt="Screenshot 2026-11-18 144803" src="https://github.com/user-attachments/assets/81959b86-3739-4946-b30e-08a247571e7f" />


_An entry for 12 Days of Fabric Apps, Day 9._

## What's inside

| Area | Where |
| --- | --- |
| Quiz UI (React + Vite, Tailwind v4) | `packages/frontend/src/` |
| Data entities (`Scenario`, `QuizAttempt`) | `packages/data/src/` |
| Shared contracts, scoring, name sanitizing | `packages/shared/src/` |
| Scenario content (single source of truth) | `content/scenarios.ts` |
| Content publishing (unlock → seed → re-lock) | `scripts/publish-scenarios.ts` |
| Idempotent seed scripts | `scripts/seed-scenarios.ts`, `scripts/seed-demo-attempts.ts` |

- **One scenario at a time.** A string-light countdown ("5 sleeps until
  Christmas") shows progress. Every answer gets immediate feedback and the
  explanation before you move on.
  
<img width="1140" height="650" alt="Screenshot 2026-11-18 144256" src="https://github.com/user-attachments/assets/5dd021bf-e5eb-4589-af26-12f1a30225cb" />

- **Scoring.** A correct answer earns the scenario's `pointValue`; a wrong
  answer earns 0. The final percentage maps to one of four verdicts:
<img width="1144" height="944" alt="Screenshot 2026-11-18 144127" src="https://github.com/user-attachments/assets/a5f03e9a-f81a-430a-a072-df7de6c8b0fa" />
<img width="1166" height="870" alt="Screenshot 2026-11-18 144139" src="https://github.com/user-attachments/assets/8bb24e12-2499-4d0a-96c8-cb69983310e6" />


  | Score | Verdict |
  | --- | --- |
  | 90%+ | North Pole Certified |
  | 70–89% | Nice List |
  | 40–69% | Workshop Apprentice |
  | under 40% | Lump of Coal |

- **Scoreboard.** Two fixed top-10 lists for the current season (`Winter2026`):
  an honor-roll Nice List (highest scores) and a roast-style Naughty List
  (lowest scores). Ties go to whoever finished first. Your own rows are
  highlighted.
  <img width="1235" height="1267" alt="Screenshot 2026-11-18 144011" src="https://github.com/user-attachments/assets/f5c2236e-da00-41e2-9478-01eda6607c34" />
- **Content lives in data, not code.** The frontend reads scenarios from the
  `Scenario` entity, so you can edit content and reseed without redeploying the
  app.

## Run it

Prerequisites: Node.js 20, 22 or 24, and access to a Microsoft Fabric workspace
where you can create items.

```sh
npm install

# Validate content locally (no network)
npm run seed:scenarios:check

# Deploy the backend + app, then apply the schema
npx rayfin up --workspace "<your-workspace>"
npx rayfin up db apply

# Publish scenarios: unlocks Scenario writes, seeds, re-locks (safe to rerun)
npm run content:publish
npm run content:publish  # second run: every scenario "unchanged", no unlock at all

# Optional: fictional demo scores so the scoreboard isn't empty
npm run seed:demo

# Local development against the deployed backend
npm run dev
```

`rayfin up` writes connection details to `rayfin/.env` (git-ignored). The
frontend reads them through `import.meta.env.VITE_RAYFIN_*`. The seed scripts
read `RAYFIN_API_URL` / `RAYFIN_PUBLISHABLE_KEY`, or fall back to the
`RAYFIN_PUBLIC_*` values in `rayfin/.env`. See `rayfin/.env.example`.

The seed scripts sign in as you through the Rayfin CLI's cached login
(`npx rayfin login`). If your environment needs a different token, set
`RAYFIN_ENTRA_TOKEN` to a delegated Power BI / Fabric access token.

## Editing scenarios

Edit `content/scenarios.ts`, run `npm run seed:scenarios:check`, then
`npm run content:publish`. Use `npm run seed:scenarios:plan` for a read-only
preview of what would change.

- `slug` is the permanent identity key. Never reuse one for a different
  scenario, and never rename a shipped one.
- `true_false`: `options: null`, `correctAnswer` is `"naughty"` or `"nice"`.
- `multiple_choice`: `correctAnswer` must exactly match one of the `options`.
- Every explanation must be grounded in a real, documented Microsoft Fabric or
  Power BI practice. Each entry names its Microsoft Learn topic in a comment.

## Access model

Rayfin supports two built-in roles, `anonymous` and `authenticated`. A Fabric
App signs players in before it renders, so the app uses `authenticated`; that
adds no extra step for players.

| Entity | Read | Write |
| --- | --- | --- |
| `Scenario` | any signed-in player (`author_id` hidden) | **locked**: no writes at all, except during `content:publish` (see below) |
| `QuizAttempt` | any signed-in player | create only; no updates or deletes |

### How scenario publishing stays locked

`Scenario` write permission is decided when the Rayfin CLI builds the data
package. By default it grants read only. `npm run content:publish`:

1. validates the content and diffs it against the database (read-only). If
   nothing changed, it stops, and writes are never opened;
2. runs `rayfin up db apply` with `RAYFIN_SCENARIO_WRITES=open`, which
   temporarily grants create/update, still limited to rows stamped with the
   publisher's identity;
3. seeds;
4. runs `rayfin up db apply` again without the switch to remove the grant.
   This step always runs, even after a failure or Ctrl+C.

Any ordinary `npx rayfin up` or `db apply` also re-locks.

## Security notes

- No secrets or environment identifiers are committed. `rayfin/.env`, `.env*`
  and `*.local` are git-ignored; `rayfin/.env.example` holds placeholders only.
- `playerName` is untrusted public input. It is trimmed, stripped of control and
  bidi-override characters, and capped at 30 characters on input *and* on
  display. It is only ever rendered as React text, never as HTML.
- Demo scoreboard data uses invented festive names only.

## Checks

```sh
npm run typecheck && npm run build && npm run lint && npm test
```

## Publishing this repo

`npx rayfin up` adds your deployment's hosting origin (`*.fabricapps.net`) to
`allowedRedirectUris` in `rayfin/rayfin.yml`. That line is needed locally, but it
identifies your deployment, so `.gitattributes` runs `rayfin.yml` through a git
clean filter that strips it from commits. Enable the filter once per clone:

```sh
git config filter.strip-hosting-origin.clean "sed -e '/\.fabricapps\.net/d'"
git config filter.strip-hosting-origin.smudge cat
git config filter.strip-hosting-origin.required true
```
