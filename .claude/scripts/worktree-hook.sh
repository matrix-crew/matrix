#!/bin/bash

# UserPromptSubmit hook: auto-copy files into worktree
# File list defined in .worktreeinclude (supports globs and ! exclusions)

CURRENT_DIR="$(pwd)"
MAIN_REPO="$(git worktree list --porcelain 2>/dev/null | head -1 | sed 's/^worktree //')"

[ -z "$MAIN_REPO" ] && exit 0
[ "$CURRENT_DIR" = "$MAIN_REPO" ] && exit 0

INCLUDE="$MAIN_REPO/.worktreeinclude"
[ -f "$INCLUDE" ] || exit 0

# Collect exclude patterns
EXCLUDES=()
while IFS= read -r line || [ -n "$line" ]; do
  line=$(echo "$line" | sed 's/#.*//' | xargs)
  [ -z "$line" ] && continue
  if [[ "$line" == !* ]]; then
    EXCLUDES+=("${line#!}")
  fi
done < "$INCLUDE"

is_excluded() {
  local base
  base=$(basename "$1")
  for pat in "${EXCLUDES[@]}"; do
    # shellcheck disable=SC2254
    case "$base" in $pat) return 0 ;; esac
  done
  return 1
}

# Process include patterns
while IFS= read -r line || [ -n "$line" ]; do
  line=$(echo "$line" | sed 's/#.*//' | xargs)
  [ -z "$line" ] && continue
  [[ "$line" == !* ]] && continue

  for src in "$MAIN_REPO"/$line; do
    [ -e "$src" ] || continue
    rel="${src#$MAIN_REPO/}"
    dst="$CURRENT_DIR/$rel"
    is_excluded "$rel" && continue
    [ -e "$dst" ] && continue
    mkdir -p "$(dirname "$dst")"
    cp -r "$src" "$dst"
  done
done < "$INCLUDE"
