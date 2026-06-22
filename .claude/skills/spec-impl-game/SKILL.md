---
name: spec-impl-game
description: Implements an approved game spec (same workflow as /spec-impl). Validates state is "Approved" (any language), creates a git branch named after the spec, implements step by step with pauses, and once finished triggers skin-designer and then mobile-porter sequentially (never in parallel) to add skins and ensure mobile/touch parity for the new game.
disable-model-invocation: true
argument-hint: <NN-spec-name>
allowed-tools: Bash(git status:*), Bash(git branch:*), Bash(git checkout:*), Bash(cat:*), Bash(ls:*)
---

# /spec-impl-game — Implementer of approved game specs + post-impl agent chain

## Session context

Current repository state:
!`git status --short`

Current branch:
!`git branch --show-current`

Specs available in this folder:
!`ls specs/ 2>/dev/null || echo "The specs/ folder does not exist"`

---

## Instructions

This command follows the exact same Phases 1-4 as `/spec-impl` — same spec lookup, same
state validation, same branch-per-spec convention, same step-by-step implementation with
pauses for diff review. The only difference is **Phase 5**: once the spec is fully
implemented, this command triggers two follow-up agents in sequence (never in parallel)
to bring the new game to parity on skins and mobile/touch controls.

Follow these five phases in strict order. **Do not advance to the next phase if the
previous one did not complete correctly.**

---

### Phase 1 — Identify the spec

The received argument is: `$ARGUMENTS`

If `$ARGUMENTS` is empty:

- List the files available in `specs/` (you already have them above).
- Ask the user to specify the exact name of the spec.
- Stop and wait for an answer. Do not continue.

If `$ARGUMENTS` has a value:

- Look for the file in `specs/`. The user may have written the full name (`10-mvp-snake`), only the number (`10`), or only the slug (`mvp-snake`). Try to find the correct file in any of those cases.
- If you do not find the file, show the available specs and ask the user to correct the name.
- If you do find it, continue to Phase 2.

---

### Phase 2 — Validate the spec's state

Read the spec file you located in Phase 1 using the Read tool or `cat`.

In the file's contents, look for the line that contains the spec's state. The header label is typically `**Status:**` (English) or `**Estado:**` (Spanish), but it may use any language. Match by position (status line near the top of the spec) and by the surrounding state machine, not by the exact label.

**Absolute rule:** You can only continue if the state **means "Approved"** — regardless of the language used.

Treat any of the following (and their equivalents in other languages) as the **Approved** state and continue:

- English: `Approved`
- Spanish: `Aprobado`
- Portuguese: `Aprovado`
- French: `Approuvé`
- German: `Genehmigt`
- Italian: `Approvato`
- …or any other language's word that clearly means "approved"

Anything else (Draft / Borrador, In review / En revisión, Implemented / Implementado, Obsolete / Obsoleto, or any unrecognized value) means **stop** and show the error message below.

| State category                            | Examples (any language)                           | Action                                                                     |
| ----------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------- |
| Approved                                  | `Approved`, `Aprobado`, `Aprovado`, `Approuvé`, … | Continue to Phase 3.                                                       |
| Draft                                     | `Draft`, `Borrador`, …                            | Stop. Show the error message below.                                        |
| In review                                 | `In review`, `En revisión`, …                     | Stop. Show the error message below.                                        |
| Implemented                               | `Implemented`, `Implementado`, …                  | Stop. Show the error message below.                                        |
| Obsolete                                  | `Obsolete`, `Obsoleto`, …                         | Stop. Show the error message below.                                        |
| State line not found / unrecognized value | —                                                 | Stop. The file does not follow the expected format. Tell this to the user. |

If you are unsure whether a value means "approved", **do not assume**. Stop and ask the user to clarify or to update the spec to the canonical wording.

**Standard error message when the state does not mean Approved:**

```
❌ I cannot implement this spec.

Current state: [STATE FOUND]
I only work with specs whose state means "Approved" (e.g. `Approved`, `Aprobado`,
or the equivalent in another language).

To continue you have two options:
  1. If the spec is ready to be implemented, open it and change the state
     to "Approved" (or the equivalent term your team uses) manually.
     That change is made by the human, not the agent.
  2. If the spec still needs work, use /spec [name] to resume it.
```

Do not offer alternatives, do not suggest "I can still start if you want". The block is intentional.

---

### Phase 3 — Create the git branch and switch to it

Once you have confirmed the state means `Approved`:

1. Derive the branch name from the spec file's full name, without the extension. Format: `spec-NN-slug`. Examples:

   - `10-mvp-snake.md` → branch `spec-10-mvp-snake`
   - `11-powerups.md` → branch `spec-11-powerups`

2. Check whether the branch already exists:

   - If it **does not exist**: create it with `git checkout -b spec-NN-slug`.
   - If it **already exists**: inform the user that the branch already existed (it may mean previous work is being resumed).
   - In both cases: switch to the branch with `git checkout spec-NN-slug` and confirm the change was successful before continuing.

3. Visually confirm to the user that the branch was created and that you are on it:

   ```
   ✅ Ready to implement.

   Spec:   specs/NN-slug.md
   Branch: spec-NN-slug  (active)
   State:  Approved   (← echo back the actual value found in the spec)
   ```

4. **Do not start implementing yet.** First show the spec summary to the user so they have it fresh. Extract and show:
   - The **objective** (the line after `**Objective:**` / `**Objetivo:**` / equivalent label).
   - The **scope** (the `## Scope` / `## Alcance` / equivalent section).
   - The **implementation plan** (the section with the numbered steps — `## Implementation plan` / `## Plan de implementación` / equivalent).
   - The **acceptance criteria** (the checklist — `## Acceptance criteria` / `## Criterios de aceptación` / equivalent).

Match section headings by meaning, not by exact wording — the spec may be authored in any language.

---

### Phase 4 — Implement step by step

After showing the spec summary, tell the user:

```
I am going to implement the spec following the implementation plan exactly.
I will pause after each step so you can review the diff.

Shall we start with Step 1?
```

Wait for explicit confirmation ("yes", "go ahead", "go", or equivalent). Do not start without it.

Once confirmed, follow these rules during the entire implementation:

**One rule above all:** implement what the spec says. If something in the spec looks suboptimal to you, mention it as an observation but implement what was agreed. Changes to the spec go into the spec, not into the code by surprise.

**Work rhythm:**

- Implement one step of the plan.
- Show a summary of which files you touched and what you did.
- Say: `Step N completed. Could you review the diff and let me know if I continue with Step N+1?`
- Wait for confirmation before continuing.

**If during the implementation you find an ambiguity** the spec does not resolve:

- Stop.
- Describe the ambiguity exactly.
- Present two or three concrete options.
- Wait for the user's decision.
- Do not improvise.

**If the user asks for something that is out of the spec's scope:**

- Remind them that it is out of this spec's scope.
- Suggest noting it down for the next spec.
- Do not implement it on this branch.

**When finishing the last step:**

```
✅ All steps of the plan are implemented.

Next step: verify the spec's acceptance criteria one by one.
If they all pass, update the spec's state to "Implemented" (or the equivalent
in your repo's language) and make the final commit before merging this branch.
```

Wait for the user to confirm the acceptance criteria pass (or fix what's pending) before
moving to Phase 5. Do not trigger the agent chain on a half-finished implementation.

---

### Phase 5 — Post-implementation agent chain (skin-designer → mobile-porter)

Once Phase 4 is fully closed (acceptance criteria verified, spec state updated to
"Implemented" or equivalent), this is the step that distinguishes `/spec-impl-game` from
plain `/spec-impl`: trigger two agents to bring the new game up to the platform's
established standards for skins and mobile/touch parity.

**Hard rule: sequential, never parallel.** Run `skin-designer` to completion first, read
its result, and only then launch `mobile-porter`. Do not invoke both Agent calls in the
same message/batch — `mobile-porter` must start after `skin-designer` has finished and
its result has been reported.

1. Identify the game id just implemented (from the spec slug / the `GAMES[]` entry just
   registered / the branch name).
2. Tell the user:
   ```
   Implementation done. Now running the post-impl chain for this game:
     1. skin-designer (add classic/neon/retro skins)
     2. mobile-porter (audit + close touch/mobile gaps)
   Running them one after another, not in parallel.
   ```
3. Launch the `skin-designer` agent (subagent_type: `skin-designer`) scoped explicitly to
   the game id just implemented — pass it the game id and a short note that this is a
   freshly implemented game with no skins yet.
4. Wait for `skin-designer` to finish. Report its summary to the user.
5. Only after that, launch the `mobile-porter` agent (subagent_type: `mobile-porter`)
   scoped explicitly to `"revisa el juego nuevo {id}"` (per its own follow-up handling
   convention) — do not let it re-audit the whole site, just this one game, unless the
   user asked otherwise.
6. Wait for `mobile-porter` to finish. Report its summary to the user.
7. Give a final combined summary: what spec was implemented, what skins were added, what
   mobile/touch gaps were found/closed.

---

## Summary of expected behavior

```
/spec-impl-game 10-mvp-snake

  Phase 1  →  Finds specs/10-mvp-snake.md
  Phase 2  →  Reads the state → "Approved" (or "Aprobado", etc.) → ✅ continues
  Phase 3  →  git checkout -b spec-10-mvp-snake → git checkout spec-10-mvp-snake
              Shows objective, scope, plan and criteria
  Phase 4  →  Implements step by step with pauses
              Ends by verifying acceptance criteria and updating spec state
  Phase 5  →  Runs skin-designer for "snake" → waits → runs mobile-porter for "snake"
              Reports combined summary

/spec-impl-game 11-powerups  (state: Draft / Borrador)

  Phase 1  →  Finds specs/11-powerups.md
  Phase 2  →  Reads the state → "Draft" → ❌ stops
              Shows the standard error message
              Does not create branch, does not touch code, does not run Phase 5
```
