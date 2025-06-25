#!/bin/bash

echo "🪝 Pre-push hook running..."

# Read local and remote refs from stdin (Git passes this to pre-push)
while read local_ref local_sha remote_ref remote_sha; do
  # If new branch (remote_sha is 0000...), diff from nothing
  if [ "$remote_sha" = "0000000000000000000000000000000000000000" ]; then
    CHANGED_FILES=$(git diff --name-only "$local_sha")
  else
    CHANGED_FILES=$(git diff --name-only "$remote_sha" "$local_sha")
  fi
done

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
