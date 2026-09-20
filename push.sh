#!/usr/bin/env bash
# FX Bureau — One-Command Push to GitHub
set -e

COMMIT_MSG="${1:-Update $(date +'%Y-%m-%d %H:%M:%S')}"

echo "📦 Staging changes..."
git add .

if git diff-index --quiet HEAD -- 2>/dev/null; then
  echo "✓ Working tree clean, no new changes to commit."
else
  echo "✍️ Committing changes: '$COMMIT_MSG'..."
  git commit -m "$COMMIT_MSG"
fi

echo "🚀 Pushing to GitHub (origin main)..."
git push -u origin main

echo "✓ Successfully pushed to https://github.com/prx-mv/fx-bureau"
