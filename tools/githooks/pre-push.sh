#!/bin/bash

echo "🪝 Pre-push hook running..."

# Compare local HEAD against remote main
CHANGED_FILES=$(git diff --name-only origin/main)

run_frontend=false
run_backend=false

for file in $CHANGED_FILES; do
  if [[ "$file" == apps/frontend/* ]]; then
    run_frontend=true
  fi
  if [[ "$file" == apps/backend/* ]]; then
    run_backend=true
  fi
done

if $run_backend; then
  echo "🚧 Detected backend change. Running tests..."
  ./gradlew :apps:backend:server:test
  if [ $? -ne 0 ]; then
    echo "❌ Backend tests failed. Push aborted."
    exit 1
  fi
fi

if $run_frontend; then
  echo "🚧 Detected frontend change. Running build..."
  pnpm frontend:build
  if [ $? -ne 0 ]; then
    echo "❌ Frontend build failed. Push aborted."
    exit 1
  fi
fi

echo "✅ Push allowed."
exit 0
