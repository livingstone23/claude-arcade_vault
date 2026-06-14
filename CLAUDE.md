# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

@AGENTS.md

## Project

Arcade Vault — online gaming platform where users compete for points. Uses Spec Driven Design (via `/spec` and `/spec-impl` skills from `Klerith/fernando-skills`).

## Commands

```bash
npm run dev      # dev server (Turbopack by default in v16)
npm run build    # production build
npm run start    # start production server
npm run lint     # run ESLint directly (next lint removed in v16)
```

## Stack

- **Next.js 16.2.9** — App Router only; no Pages Router
- **React 19.2.4**
- **Tailwind CSS 4** — configured via `postcss.config.mjs`
- **TypeScript 5**

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
