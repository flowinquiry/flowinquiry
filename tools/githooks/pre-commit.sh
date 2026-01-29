#!/bin/bash

CHANGED_FILES=$(git diff --cached --name-only)

run_frontend=false
run_docs=false
run_backend=false
only_cli=true

for file in $CHANGED_FILES; do
  if [[ $file == apps/frontend/* ]]; then
    run_frontend=true
    only_cli=false
  elif [[ $file == apps/docs/* ]]; then
    run_docs=true
    only_cli=false
  elif [[ $file == apps/backend/* ]]; then
    run_backend=true
    only_cli=false
  elif [[ $file != apps/cli/* ]]; then
    only_cli=false
  fi
done

# Skip pnpm checks for CLI-only changes
if $only_cli; then
  echo "✅ CLI-only changes, skipping pnpm hooks."
  exit 0
fi

if $run_backend; then
  echo "🧹 Running Spotless for backend..."
  ./gradlew -p apps/backend spotlessApply
  if [ $? -ne 0 ]; then
    echo "❌ Backend formatting failed. Commit aborted."
    exit 1
  fi
  git add .
fi

# Ensure Prettier is available
if ! pnpm exec prettier --version > /dev/null 2>&1; then
  echo "ℹ️ prettier not found. Installing..."
  pnpm add -w -D prettier
fi

# Ensure ESLint is available
if ! pnpm exec eslint --version > /dev/null 2>&1; then
  echo "ℹ️ eslint not found. Installing..."
  pnpm add -w -D eslint @eslint/js eslint-config-next
fi

if $run_frontend; then
  echo "🧹 Running Prettier and ESLint for frontend..."
  pnpm prettier --write apps/frontend
  pnpm eslint apps/frontend --fix
  if [ $? -ne 0 ]; then
    echo "❌ Frontend lint failed. Commit aborted."
    exit 1
  fi
  git add .
fi

if $run_docs; then
  echo "🧹 Running Prettier and ESLint for docs..."
  pnpm exec prettier --write apps/docs
  pnpm exec eslint apps/docs --fix
  if [ $? -ne 0 ]; then
    echo "❌ Docs lint failed. Commit aborted."
    exit 1
  fi
  git add .
fi

echo "✅ Pre-commit hook completed successfully."
exit 0
