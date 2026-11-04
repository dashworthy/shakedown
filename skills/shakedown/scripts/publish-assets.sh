#!/usr/bin/env bash
# Commits a shakedown's files to the shakedown-assets branch, under pr-<n>/<timestamp>/,
# pushes it, and prints the URL prefix the files are served from in PR comments.
# Usage: publish-assets.sh <pr-number> <dir>
set -euo pipefail

pr=$1
src=$2
branch=shakedown-assets
repo=$(gh repo view --json nameWithOwner -q .nameWithOwner)
dest="pr-$pr/$(date +%Y%m%d-%H%M%S)"
wt="$(mktemp -d)/assets"

if git ls-remote --exit-code --heads origin "$branch" >/dev/null; then
	git fetch -q origin "$branch"
	git worktree add -q -B "$branch" "$wt" FETCH_HEAD
else
	git worktree add -q --orphan -b "$branch" "$wt"
fi

mkdir -p "$wt/$dest"
cp "$src"/*.jpg "$src"/*.png "$src"/*.tldraw "$src"/*.gif "$wt/$dest/" 2>/dev/null || true
git -C "$wt" add "$dest"
git -C "$wt" commit -q -m "Shakedown screenshots for PR #$pr"
git -C "$wt" push -q origin "$branch"
sha=$(git -C "$wt" rev-parse HEAD)

git worktree remove --force "$wt"
git branch -D -q "$branch"

echo "https://github.com/$repo/blob/$sha/$dest"
