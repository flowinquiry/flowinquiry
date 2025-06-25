#!/bin/bash

# Detect changes in the frontend directory since last push
CHANGED_FILES=$(git diff --name-only HEAD @{push})

run_frontend=false

for file in $CHANGED_FILES; do
  if [[ $file == apps/frontend/* ]]; then
    run_frontend=true
    break
  fi
done

if $run_frontend; then
  echo "🚧 Running frontend build before push..."
  pnpm build:frontend
  if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed. Push aborted."
    exit 1
  fi
fi

echo "✅ Pre-push check passed. Proceeding with push."
exit 0
