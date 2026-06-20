#!/usr/bin/env bash
# Latest-ize the default branch on each turn.
#
# Wired to SessionStart and UserPromptSubmit (see .claude/settings.json).
# Safe by design: always fetch (cheap, non-destructive); fast-forward the
# default branch ONLY when the working tree is clean AND currently checked
# out on that branch. Otherwise it fetch-onlys and exits, so it never
# clobbers uncommitted changes or feature-branch work. Network failures are
# swallowed so a hook never blocks the turn.
set -u

# Must be inside a git work tree.
git rev-parse --is-inside-work-tree >/dev/null 2>&1 || exit 0

# Resolve the default branch (origin/HEAD, else "main").
DEFAULT="$(git symbolic-ref --quiet --short refs/remotes/origin/HEAD 2>/dev/null | sed 's@^origin/@@')"
[ -n "$DEFAULT" ] || DEFAULT=main

# Always fetch the default branch (non-destructive). Ignore network errors.
git fetch --quiet origin "$DEFAULT" 2>/dev/null || exit 0

CURRENT="$(git symbolic-ref --quiet --short HEAD 2>/dev/null)"

# Fast-forward only when ON the default branch AND the tree is clean.
if [ "$CURRENT" = "$DEFAULT" ] && [ -z "$(git status --porcelain)" ]; then
  BEFORE="$(git rev-parse HEAD 2>/dev/null)"
  if git merge --ff-only "origin/$DEFAULT" >/dev/null 2>&1; then
    AFTER="$(git rev-parse HEAD 2>/dev/null)"
    [ "$BEFORE" != "$AFTER" ] &&
      echo "[main-sync] fast-forwarded $DEFAULT: ${BEFORE:0:7} -> ${AFTER:0:7}"
  fi
fi
exit 0
