#!/bin/bash

# Usage: ./build-frontend-image.sh mytag [--push]
TAG=$1
PUSH_FLAG=$2

if [ -z "$TAG" ]; then
  echo "❌ Please provide a tag: ./build-frontend-image.sh <tag> [--push]"
  exit 1
fi

IMAGE_NAME="flowinquiry/flowinquiry-frontend"
DOCKERFILE_PATH="apps/frontend/Dockerfile"
CONTEXT_DIR="."
PLATFORMS="linux/amd64,linux/arm64"

# Ensure buildx is available and create/use a builder instance
echo "🔧 Setting up Docker buildx..."
docker buildx create --name multiplatform-builder --use 2>/dev/null || docker buildx use multiplatform-builder

# Determine if we should push or load
if [ "$PUSH_FLAG" == "--push" ]; then
  echo "📦 Building and pushing multi-platform image: $IMAGE_NAME:$TAG"
  echo "🏗️  Platforms: $PLATFORMS"
  docker buildx build \
    --platform $PLATFORMS \
    -f $DOCKERFILE_PATH \
    -t $IMAGE_NAME:$TAG \
    -t $IMAGE_NAME:latest \
    --push \
    $CONTEXT_DIR

  echo "✅ Successfully built and pushed multi-platform images"
else
  echo "📦 Building multi-platform image locally: $IMAGE_NAME:$TAG"
  echo "🏗️  Platforms: $PLATFORMS"
  echo "⚠️  Note: Multi-platform builds will be cached but not loaded to local Docker"
  echo "💡 Use --push flag to push to registry, or build single platform for local use"

  docker buildx build \
    --platform $PLATFORMS \
    -f $DOCKERFILE_PATH \
    -t $IMAGE_NAME:$TAG \
    -t $IMAGE_NAME:latest \
    $CONTEXT_DIR

  echo "✅ Successfully built multi-platform images (cached)"
  echo "💡 To load a single platform locally, run:"
  echo "   docker buildx build --platform linux/amd64 -f $DOCKERFILE_PATH -t $IMAGE_NAME:$TAG --load $CONTEXT_DIR"
fi
