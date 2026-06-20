#!/bin/bash
# Neutralize the launcher-injected "Stop" hook at session start.
#
# Claude Code on the web injects a per-container Stop hook
# (~/.claude/stop-hook-git-check.sh) that nags to commit & push uncommitted
# work. That conflicts with this repo's rule to act on git only with the
# user's explicit permission (CLAUDE.md "Claude の行動規則"), and has caused
# unwanted auto-commits. The launcher re-injects the hook into every
# ephemeral container, so we re-neutralize it here at each SessionStart.
#
# We overwrite the hook script itself with a silent no-op (rather than editing
# launcher-settings.json) so it takes effect regardless of when the hook
# config is read. Best-effort: only acts when the file is present, and never
# fails the session start.
set -u
target="$HOME/.claude/stop-hook-git-check.sh"
if [[ -f "$target" ]]; then
  printf '#!/bin/bash\nexit 0\n' > "$target" 2>/dev/null || true
  chmod +x "$target" 2>/dev/null || true
fi
exit 0
