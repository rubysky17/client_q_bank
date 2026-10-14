#!/usr/bin/env bash
# Creates the Android upload keystore for release builds and prints the Gradle properties to add.
# Usage: npm run keystore
set -euo pipefail

ROOT="$(cd "$(dirname "$0")/.." && pwd)"
DIR="$ROOT/credentials"
FILE="$DIR/q-bank-upload.keystore"
ALIAS="q-bank-upload"

if [[ -f "$FILE" ]]; then
  echo "Keystore already exists: $FILE (delete it first to create a new one)."
  exit 1
fi

mkdir -p "$DIR"
read -r -s -p "Keystore password (min 6 chars): " PASSWORD
echo

keytool -genkeypair -v \
  -storetype PKCS12 \
  -keystore "$FILE" \
  -alias "$ALIAS" \
  -keyalg RSA -keysize 2048 -validity 10000 \
  -storepass "$PASSWORD" -keypass "$PASSWORD" \
  -dname "CN=Q Bank, O=Q Bank, C=VN"

cat <<EOF

Keystore created: $FILE
Back it up somewhere safe: losing it means you can't update the app on Google Play.

Add these lines to ~/.gradle/gradle.properties (NOT to the repo):

QBANK_UPLOAD_STORE_FILE=$FILE
QBANK_UPLOAD_STORE_PASSWORD=<your password>
QBANK_UPLOAD_KEY_ALIAS=$ALIAS
QBANK_UPLOAD_KEY_PASSWORD=<your password>
EOF
