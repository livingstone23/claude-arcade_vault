# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users compete for points. Uses Spec Driven Design (via `/spec` and `/spec-impl` skills from `Klerith/fernando-skills`).

## Stack

- **Next.js 16.2.9** — App Router only; no Pages Router
- **React 19.2.4**
- **Tailwind CSS 4** — configured via `postcss.config.mjs`
- **TypeScript 5**
- **Supabase** (`@supabase/supabase-js`) — score persistence + leaderboards
- **Resend** — contact form email (`app/api/contact/route.ts`)

## Project Structure

Non-routable folders use `_` prefix (App Router convention):

- `app/` — routes. Pages: `/` (home), `/about`, `/auth`, `/biblioteca` (game library), `/salon` (leaderboards). Games at `/games/[id]` (detail) and `/games/[id]/play` (player).
- `_lib/data.ts` — `GAMES[]` registry (single source of truth for all games), `Game`/`ScoreRow`/`SavedScore` types, `CATS`, `seededScores()` (fake leaderboard filler).
- `_lib/supabase.ts` — browser client + `scoreTable(gameId)` helper → table name `scores_<game_id_underscored>`.
- `_contexts/UserContext.tsx` — `useUser()`: localStorage-backed login, `saveScore()` (writes localStorage + Supabase insert).
- `_components/` — shared UI (`Nav`, `Home/*`, `About/*`).
- `specs/` — spec-driven design docs (`NN-slug.md`), one per feature/game.
- `references/starter-games/` — vanilla JS reference games to port.
- `public/games/` + `public/<game>.js` — bundled canvas game JS + sprite assets.

## Games

Registry in `_lib/data.ts` (`GAMES[]`). 8 entries; implemented play pages: **bloque-buster** (Arkanoid), **caida** (Tetris), **serpentina** (Snake), **rocas** (Asteroids). Each game = canvas JS in `public/<id>.js` loaded by `app/games/<id>/play/page.tsx`.
can find more info in (see `references/implemented_games.md`) when you need to check more info about it.

### Adding a game → use the `add-game` skill

Integrates a canvas game at `/games/{id}/play`. 4 steps: register in `GAMES[]`, wrap JS with `window.GAME` bridge, build React play page (HUD + game-over modal + leaderboard), apply Supabase `scores_<id>` table migration. **Spec first**: write `specs/NN-slug.md` before implementing.

## Supabase

- Score tables per game: `scores_<game_id>` (underscores), columns `player_name`, `score`, `created_at`.
- `/salon` reads real leaderboards from Supabase.
- MCP server configured in `.mcp.json` (project `ozvrrayziiffplrueuix`) — use Supabase MCP tools for migrations/queries.
- Env: `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` (see `.env.template`).

## Skills

- `/spec` + `/spec-impl` (from `Klerith/fernando-skills`, pinned in `skills-lock.json`) — spec-driven workflow.
- `add-game` — integrate new canvas games (see above).
- `/frontend-design` — **always use for HTML/UI design work.**
- `/game-planner` — analyzes the catalog and recommends the next game to add. Tracks suggestions across sessions in `memory/game_suggestions.md` and `.agents/agents_sugestions.md`. Say "siguiente" to skip, "acepto" to commit.

## Next.js 16 Breaking Changes

Always read `node_modules/next/dist/docs/` before using any Next.js API.

Key v16 changes vs training data:

- **Turbopack default** — enabled automatically in `next dev` and `next build`; no `--turbopack` flag needed
- **`next lint` removed** — use `eslint` CLI directly; `next build` no longer runs lint
- **`middleware.ts` → `proxy.ts`** — middleware is now called "proxy"
- **Runtime config removed** — no `serverRuntimeConfig`/`publicRuntimeConfig`; use `process.env` in Server Components or `NEXT_PUBLIC_` prefix for client vars; use `connection()` from `next/server` to read runtime env at request time
- **`experimental.dynamicIO` / `experimental.useCache` deprecated** — use top-level `cacheComponents: true` in `next.config.ts`
- **Server Functions** — preferred term over "Server Actions"; use `'use server'` directive; always verify auth inside every Server Function
- **AMP removed** — `next/amp` and `amp` config gone
- **`unstable_rootParams` removed**
- **Node.js 20.9+ required**

## App Router Conventions

- Route exposed only when `page.tsx` or `route.ts` exists in a folder
- `(group)` folders group routes without affecting URL
- `_folder` prefix makes folder non-routable (safe for colocated components/utils)
- `layout.tsx` wraps all child segments at its level
- `loading.tsx`, `error.tsx`, `not-found.tsx` for UI states
- `route.ts` for API endpoints

## Environment Variables

Server-only: access `process.env.VAR` directly in Server Components.  
Client-accessible: prefix with `NEXT_PUBLIC_`.  
Runtime (not build-time): call `await connection()` from `next/server` before reading `process.env`.
