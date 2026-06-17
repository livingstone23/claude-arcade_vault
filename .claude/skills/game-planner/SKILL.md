---
name: game-planner
description: Analyzes the Arcade Vault game catalog and recommends the next game to add. Reads _lib/data.ts for the current catalog state, reads/writes memory/game_suggestions.md across sessions to avoid repeat suggestions, and outputs one structured recommendation with category balance, color balance, and implementation-readiness rationale. Also maintains a human-readable TO-DO at .agents/agents_sugestions.md.
---

# Arcade Vault — Game Planner Skill

## Philosophy

This skill reasons through the catalog and makes **one concrete recommendation** — not
a ranked list. It remembers what it has already suggested across sessions so the user
never gets the same pitch twice. The recommendation is the starting point; the user
then decides whether to build it with `/add-game`.

Flow: **snapshot → analyze → recommend → write memory**

---

## Phase 1 — Catalog snapshot (automatic, no user input)

Execute all of the following reads silently. Do not produce any output yet.

1. Read `_lib/data.ts`. Extract every entry in `GAMES[]`: `id`, `title`, `cat`, `color`.
   Build two tallies in memory:
   - Category counts: how many games per `ARCADE / PUZZLE / SHOOTER / VERSUS`
   - Color counts: how many games per `cyan / magenta / yellow / green`

2. For each game `id` in `GAMES[]`, check whether
   `app/games/{id}/play/page.tsx` exists. Games without a play page are the
   **highest-priority candidates** — they are already registered but have no
   implementation.

3. List `references/starter-games/` to identify which reference JS sources are
   available for porting.

4. Read the memory file:
   `~/.claude/projects/-Users-lcano-github-com-ClaudeCode-05-arcade-vault/memory/game_suggestions.md`

   If the file does not exist, treat the suggestion history as empty.
   Otherwise, extract all rows where `status` is NOT `rejected` — these form
   the **exclusion set**. Rejected entries are re-eligible.

5. Read `.agents/agents_sugestions.md` to understand the current TO-DO state
   (which entries are already listed there).

Proceed automatically to Phase 2.

---

## Phase 2 — Analysis (internal reasoning, no output)

Score candidates in this priority order:

### Priority 1 — Already registered, no play page (highest)

Games in `GAMES[]` that have no `app/games/{id}/play/page.tsx` only need a play
page — they are already in the catalog and registry. Pick from these first unless
their `id` appears in the exclusion set.

### Priority 2 — Category gap

Whichever category has the fewest games scores higher. With the typical state of the
catalog: PUZZLE and VERSUS are usually underrepresented (≤1 game each).

### Priority 3 — Color gap

Whichever color appears the least in `GAMES[]` scores higher. magenta is often
underrepresented (≤1 game).

### Priority 4 — Implementation readiness

If a folder exists in `references/starter-games/` that corresponds to the candidate
game, set readiness = **High**. Already-registered games without a play page set
readiness = **Medium** (bridge pattern still needs writing). Brand-new games with no
JS source set readiness = **Low**.

### Exclusion filter

Never suggest an `id-slug` that has `status = pending` or `status = accepted` in the
memory file. Rejected entries can be suggested again if they re-rank highest.

### Curated new-game candidates

Use these when all registered-but-unimplemented games are in the exclusion set:

| id-slug | title | category | color | notes |
|---------|-------|----------|-------|-------|
| combate-galactico | GALAGA | SHOOTER | magenta | Fixed shooter, fills magenta + SHOOTER |
| minesweeper-px | MINAS | PUZZLE | magenta | Logic puzzle, fills PUZZLE + magenta |
| batalla-naval | BATTLESHIP | VERSUS | cyan | Turn-based, fills VERSUS gap |
| rally-neon | ROAD FIGHTER | ARCADE | yellow | Racing variant |
| plataforma-pixel | DONKEY KONG | ARCADE | cyan | Platform genre not yet represented |

Pick the **single best candidate** after applying all scoring criteria. Do not produce
a ranked list or ask the user to choose.

---

## Phase 3 — Output recommendation and write both files

### 3a — Output the recommendation block

```
## Game Planner Recommendation

**Game:** {TITLE} (`{id-slug}`)
**Genre:** {genre description, e.g. "Fixed shooter / wave survival"}
**Category:** {ARCADE / PUZZLE / SHOOTER / VERSUS}
**Suggested color:** {cyan / magenta / yellow / green}
**Implementation readiness:** {High / Medium / Low}
  - {reason, e.g. "Already registered in GAMES[] — only a play page needed." or
    "No starter-game JS available; needs fresh canvas implementation."}

**Why it fits:**
- {Category rationale, e.g. "PUZZLE has only 1 game out of 8; this raises it to 2."}
- {Color rationale, e.g. "magenta is used by 1 game; this balances the palette."}
- {Registration note, e.g. "Already in GAMES[] as `gloton`." or "Needs a new entry in GAMES[]."}
- {Any other relevant note.}

**Suggested cover class:** `cover-{slug}` (add to globals.css)

---
Ready to build? Run /add-game to begin integration.
Say "siguiente" / "skip" to get a different recommendation.
Say "acepto" / "build it" to commit to this game.
```

### 3b — Write to the memory file

File: `~/.claude/projects/-Users-lcano-github-com-ClaudeCode-05-arcade-vault/memory/game_suggestions.md`

If it **does not exist**, create it with this exact content and then append the row:

```markdown
---
name: game_suggestions
description: History of game recommendations made by /game-planner to avoid repeat suggestions
metadata:
  type: reference
---

# Game Suggestions History

| id-slug | title | genre | category | color | suggested-on | status | notes |
|---------|-------|-------|----------|-------|--------------|--------|-------|
```

Then append the new row:
```
| {id-slug} | {title} | {genre} | {category} | {color} | {YYYY-MM-DD} | pending | {one-line rationale} |
```

If the memory file is **new**, also append this line to
`~/.claude/projects/-Users-lcano-github-com-ClaudeCode-05-arcade-vault/memory/MEMORY.md`:
```
- [Game suggestions](game_suggestions.md) — History of game recommendations from /game-planner
```

### 3c — Write to the project TO-DO

File: `.agents/agents_sugestions.md`

If the file is **empty or missing the header**, write:
```markdown
# Game Planner — Suggestions TO-DO

```

Then append a new pending entry:
```
- [ ] **{TITLE}** (`{id-slug}`) — {category} / {color} — _suggested {YYYY-MM-DD}_
```

If the file already has entries, append after the last line (do not duplicate).

---

## Handling user follow-ups

After the recommendation is on screen, stay in an interactive loop:

### "siguiente" / "skip" / "otra" / "give me another"

1. Update the current recommendation's row in `game_suggestions.md`:
   change `pending` → `rejected`.
2. Update the matching line in `.agents/agents_sugestions.md`:
   replace `- [ ] **{TITLE}**...` with `- ~~**{TITLE}** (`{id-slug}`) — {category} / {color} — _rejected {YYYY-MM-DD}_~~`
3. Add the rejected id-slug to the exclusion set.
4. Re-run Phase 2 (now excluding the rejected entry).
5. Output a new Phase 3 recommendation block.

### "acepto" / "build it" / "let's go" / "sí"

1. Update the memory row: `pending` → `accepted`.
2. Update `.agents/agents_sugestions.md`: `- [ ] **{TITLE}**...` → `- [x] **{TITLE}**...`
3. Output:
   ```
   Perfecto. Run /add-game to begin integration.
   The skill will write the spec first — per the project's spec-driven workflow.
   ```
   Do not invoke `/add-game` automatically. Let the user trigger it.

### Any other response

Answer the question normally. Do not change any memory file status until the user
explicitly accepts or skips.

---

## Reference files

| File | Purpose |
|------|---------|
| `_lib/data.ts` | `GAMES[]` registry — primary catalog source |
| `app/games/*/play/page.tsx` | Ground truth for implemented status |
| `references/starter-games/` | Available JS sources for porting |
| `~/.claude/projects/.../memory/game_suggestions.md` | Cross-session suggestion history |
| `~/.claude/projects/.../memory/MEMORY.md` | Memory index |
| `.agents/agents_sugestions.md` | Human-readable project TO-DO |
