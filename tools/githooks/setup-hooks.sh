#!/bin/bash

# Ensure .git/hooks exists
mkdir -p .git/hooks

# Link the pre-commit hook
ln -sf ../../tools/githooks/pre-commit.sh .git/hooks/pre-commit
chmod +x .git/hooks/pre-commit

echo "✅ pre-commit hook set up!"

# Link the pre-commit hook
ln -sf ../../tools/githooks/pre-push.sh .git/hooks/pre-push
chmod +x .git/hooks/pre-push

echo "✅ pre-push hook set up!"