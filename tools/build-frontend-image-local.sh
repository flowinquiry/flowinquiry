#!/bin/bash

# Usage: ./build-frontend-image-local.sh mytag
# This script builds for the current platform only and loads it into local Docker

TAG=$1

if [ -z "$TAG" ]; then
  echo "❌ Please provide a tag: ./build-frontend-image-local.sh <tag>"
  exit 1
fi

IMAGE_NAME="flowinquiry/flowinquiry-frontend"
DOCKERFILE_PATH="apps/frontend/Dockerfile"
CONTEXT_DIR="."

# Detect current platform
PLATFORM=$(docker version --format '{{.Server.Os}}/{{.Server.Arch}}')

echo "📦 Building image for current platform: $PLATFORM"
echo "🏗️  Image: $IMAGE_NAME:$TAG"

docker buildx build \
  --platform $PLATFORM \
  -f $DOCKERFILE_PATH \
  -t $IMAGE_NAME:$TAG \
  -t $IMAGE_NAME:latest \
  --load \
  $CONTEXT_DIR

if [ $? -eq 0 ]; then
  echo "✅ Successfully built and loaded image to local Docker"
  echo "🐳 You can now run: docker run -p 3000:3000 $IMAGE_NAME:$TAG"
else
  echo "❌ Build failed"
  exit 1
fi
