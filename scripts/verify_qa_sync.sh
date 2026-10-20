#!/usr/bin/env bash
set -e

# 1. Auto-fail if .agents/qa_matrix.md doesn't exist at all
if [ ! -f ".agents/qa_matrix.md" ]; then
  echo "ERROR: .agents/qa_matrix.md is missing! You must generate the complete Application QA Matrix before finishing."
  exit 1
fi

# 2. Check if routes, controllers, or pages were modified in git without updating qa_matrix.md
CHANGED_APP_FILES=$(git status --porcelain | grep -E '(src/|app/|pages/|routes/|controllers/|api/)' || true)
CHANGED_MATRIX=$(git status --porcelain | grep '.agents/qa_matrix.md' || true)

if [ -n "$CHANGED_APP_FILES" ] && [ -z "$CHANGED_MATRIX" ]; then
  echo "ERROR: Application code was modified, but .agents/qa_matrix.md was not updated or verified in this session."
  echo "Review .agents/qa_matrix.md, add any new/modified use cases, and run @qa-verifier."
  exit 1
fi