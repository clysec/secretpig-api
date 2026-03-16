#!/usr/bin/env bash
# Build the SecretPig server binary for Android (linux/arm64).
# Output: android/app/src/main/assets/secretpig
#
# Prerequisites:
#   - Go 1.21+
#   - Run from the repo root: ./android/scripts/build-server.sh
#   - libre2-dev is NOT needed because we use -tags purego (Go stdlib regexp)
#
# The binary is placed in assets/ so the Android app can extract it to the
# private files directory at runtime and execute it.

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_ROOT="$(cd "${SCRIPT_DIR}/../.." && pwd)"
OUT="${SCRIPT_DIR}/../android/app/src/main/assets/secretpig"

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
