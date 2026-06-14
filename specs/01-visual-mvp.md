# SPEC 01 — Arcade Vault Visual MVP

> **Status:** Aprobado · **Depends on:** — · **Date:** 2026-06-14
> **Objective:** Port all 5 reference screens (Library, Game Detail, Game Player, Auth, Hall of Fame) + Nav into Next.js App Router as a fully visual, non-functional MVP with client-side user session via React Context + localStorage.

---

## Scope

**In:**

- `app/globals.css` — port of `references/templates/styles.css` (CSS vars, all classes, animations)
- `app/layout.tsx` — RootLayout with `.av-bg`, `.av-noise` background divs and `<Nav>`
- `_lib/data.ts` — GAMES array, CATS array, `seededScores()` utility (TypeScript)
- `_components/Nav.tsx` — sticky navbar, mobile drawer, coin counter, auth button (Client Component)
- `app/page.tsx` — Library screen: hero, search, category chips, game card grid
- `app/games/[id]/page.tsx` — Game Detail screen: cover, tags, stats, leaderboard aside
- `app/games/[id]/play/page.tsx` — Game Player screen: HUD, CRT mockup, pause overlay, game-over modal
- `app/auth/page.tsx` — Auth screen: login/register tabs, social buttons
- `app/salon/page.tsx` — Hall of Fame screen: podium, full table, user row
- `_contexts/UserContext.tsx` — React Context for user + score persistence via localStorage
- Google Fonts loaded via `next/font/google`: Press Start 2P, JetBrains Mono, Courier Prime

**Out of scope (future specs):**

- Any real playable game logic
- Backend API / database / real auth (Google/GitHub OAuth)
- Score aggregation across users (all scores are seeded/local)
- Multiplayer
- Mobile app / PWA

---

## Data model

```ts
// _lib/data.ts

export interface Game {
  id: string;
  title: string;
  short: string;
  long: string;
  cat: string;
  cover: string;   // CSS class name e.g. "cover-bricks"
  color: "cyan" | "magenta" | "yellow" | "green";
  best: number;
  plays: string;
}

export interface ScoreRow {
  rank: number;
  name: string;
  score: number;
  date: string;
}

export interface SavedScore {
  game: string;   // Game.id
  score: number;
  name: string;
  at: number;     // Date.now()
}
```

```ts
// _contexts/UserContext.tsx — shape of shared state
interface UserState {
  user: { name: string } | null;
  login: (u: { name: string }) => void;
  signOut: () => void;
  saveScore: (entry: SavedScore) => void;
}
// localStorage keys: "av_user", "av_scores"
```

No new DB structures. All leaderboard data is seeded deterministically via `seededScores(seed, count)` — no persistence needed for it.

---

## Implementation plan

1. Port `references/templates/styles.css` → `app/globals.css`. Add Google Fonts import
   in `app/layout.tsx` via `next/font/google`. Verify background grid + scanlines render.

2. Create `_lib/data.ts` with GAMES array, CATS array, `seededScores()` typed in TypeScript.

3. Create `_contexts/UserContext.tsx` with React Context, localStorage read on mount,
   `login`, `signOut`, `saveScore` handlers. Wrap root in `app/layout.tsx`.

4. Create `_components/Nav.tsx` (Client Component): sticky nav, logo, links,
   coin counter, auth button, mobile drawer. Wire to UserContext.

5. Implement `app/layout.tsx`: `.av-bg` + `.av-noise` divs, `<Nav>`, `<main>`, `<footer>`.

6. Implement `app/page.tsx` (Library): hero, search input, category chips,
   `GameCard` grid. `navigate` → `router.push('/games/[id]')`.

7. Implement `app/games/[id]/page.tsx` (Game Detail): two-column layout,
   cover CSS art, tags, stat strip, leaderboard aside with `seededScores`.

8. Implement `app/games/[id]/play/page.tsx` (Game Player): HUD from UserContext,
   CRT mockup with CSS animated enemies, pause toggle, game-over modal with score save.

9. Implement `app/auth/page.tsx` (Auth): login/register tabs, form fields,
   social buttons, calls `UserContext.login`, redirects to `/`.

10. Implement `app/salon/page.tsx` (Hall of Fame): game tabs, podium top-3,
    full table, logged-in user row highlighted in yellow.

---

## Acceptance criteria

- [ ] Background perspective grid, scanlines, and noise overlay render on all screens.
- [ ] Nav shows logo, links, coin counter; auth button shows "Iniciar Sesión" when logged out and username when logged in.
- [ ] Mobile hamburger opens/closes the side drawer.
- [ ] Library loads with all 8 game cards; search filters by title; category chips filter by category.
- [ ] Clicking a game card navigates to its Game Detail page.
- [ ] Game Detail shows correct cover CSS art, title, long description, stat strip, and seeded leaderboard.
- [ ] "JUGAR AHORA" button navigates to Game Player screen.
- [ ] Game Player HUD shows player name, auto-incrementing score, lives (♥ ♥ ♥), and level.
- [ ] Pause button toggles the pause overlay; score stops incrementing while paused.
- [ ] "FIN" button shows the game-over modal with final score and name input.
- [ ] Saving score in modal shows "PUNTUACIÓN GUARDADA_" typewriter animation.
- [ ] Auth screen toggles between login and register tabs (email field appears only on register).
- [ ] Submitting auth form sets user in context and redirects to Library.
- [ ] "JUGAR COMO INVITADO" clears user and redirects.
- [ ] Hall of Fame shows podium top-3 and full table; switching game tabs updates scores.
- [ ] Logged-in user row appears highlighted in yellow at bottom of Hall of Fame table.
- [ ] User session persists on page refresh (localStorage).
- [ ] No console errors on any screen.

---

## Decisions

- **Yes:** Port `styles.css` as plain CSS into `globals.css`. The template relies on
  pseudo-elements, perspective transforms, and keyframe animations that are not
  ergonomic in Tailwind 4 utility classes.
- **No:** Rewrite in Tailwind 4. Would lose pixel-fidelity and slow implementation
  without benefit at this MVP stage.

- **Yes:** React Context + localStorage for user session. Matches template behavior;
  no backend needed for visual MVP.
- **No:** Ephemeral state only. Would break the "Iniciar Sesión" → username flow and
  the logged-in user row in Hall of Fame.

- **Yes:** CRT mockup only in Game Player (auto-score + CSS enemies). Spec scope is
  explicitly visual.
- **No:** Real playable game. Goes in a separate spec per game if ever needed.

- **Yes:** Next.js file-based routing (`/games/[id]`, `/games/[id]/play`, `/auth`,
  `/salon`) replaces the hash-based router in the template.
- **No:** Preserve hash routing. Unnecessary complexity in App Router.

- **Yes:** `next/font/google` for Press Start 2P, JetBrains Mono, Courier Prime.
- **No:** Direct Google Fonts `<link>` tags. Next.js font optimization is preferred.

---

## What is **not** in this spec

- Any real playable game (each game goes in its own spec).
- Backend API, database, or real OAuth (Google/GitHub).
- Cross-user score aggregation — all leaderboard data is seeded/deterministic.
- Multiplayer.
- PWA / mobile app shell.
