#!/bin/bash

echo "🪝 Pre-push hook running..."

# Compare local HEAD against remote main
CHANGED_FILES=$(git diff --name-only origin/main)

run_frontend=false

for file in $CHANGED_FILES; do
  if [[ "$file" == apps/frontend/* ]]; then
    run_frontend=true
    break
  fi
done

if $run_frontend; then
  echo "🚧 Detected frontend change. Running build..."
  pnpm build:frontend
  if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed. Push aborted."
    exit 1
  fi
fi

echo "✅ Push allowed."
exit 0
