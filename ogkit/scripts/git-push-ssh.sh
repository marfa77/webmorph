#!/usr/bin/env bash
# Push main to an existing GitHub repo over SSH (create the empty repo on github.com first).
# Usage: ./scripts/git-push-ssh.sh OWNER/REPO
# Example: ./scripts/git-push-ssh.sh marfa77/webmorph
set -euo pipefail
cd "$(dirname "$0")/.."
if [[ $# -ne 1 ]] || [[ "$1" != *"/"* ]]; then
  echo "Usage: $0 OWNER/REPO" >&2
  echo "Create an empty repo on GitHub first, then run this." >&2
  exit 1
fi
REPO="$1"
URL="git@github.com:${REPO}.git"
if git remote get-url origin &>/dev/null; then
  git remote set-url origin "$URL"
else
  git remote add origin "$URL"
fi
git push -u origin main
