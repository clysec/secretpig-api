#!/usr/bin/env bash
# Build the SecretPig server binary for Android (linux/arm64).
# Output: android/android/app/src/main/jniLibs/arm64-v8a/libsecretpig.so
#
# Prerequisites:
#   - Go 1.21+
#   - Run from the repo root: ./android/scripts/build-server.sh
#   - libre2-dev is NOT needed because we use -tags purego (Go stdlib regexp)
#
# The binary is packaged as a .so file in jniLibs/ so the Android package manager
# extracts it to nativeLibraryDir (an exec-mounted path) on installation.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT="${SCRIPT_DIR}/../android/app/src/main/jniLibs/arm64-v8a/libsecretpig.so"

mkdir -p "$(dirname "${OUT}")"

echo "Building SecretPig for linux/arm64 (Android)..."
echo "  Source: ${REPO_ROOT}"
echo "  Output: ${OUT}"

cd "${REPO_ROOT}"

CGO_ENABLED=0 \
GOOS=linux \
GOARCH=arm64 \
  go build \
    -tags purego \
    -ldflags="-s -w" \
    -o "${OUT}" \
    .

echo ""
echo "Done. Binary size: $(du -sh "${OUT}" | cut -f1)"
echo ""
echo "Next step: build the Android APK with:"
echo "  cd android && npx react-native run-android"
echo "  OR"
echo "  cd android/android && ./gradlew assembleRelease"
