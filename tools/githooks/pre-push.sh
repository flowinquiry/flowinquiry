#!/bin/bash
echo "🪝 Pre-push hook running..."

CHANGED_FILES=$(git diff --name-only HEAD @{push})

for file in $CHANGED_FILES; do
  if [[ $file == apps/frontend/* ]]; then
    echo "🚧 Detected frontend change. Building..."
    pnpm build:frontend
    if [ $? -ne 0 ]; then
      echo "❌ Build failed. Push aborted."
      exit 1
    fi
    break
  fi
done

echo "✅ Push allowed."
exit 0
