#!/usr/bin/env bash
set -euo pipefail
cd "$(dirname "$0")/.."
npm install --prefix .local/hosting-tools --cache .local/npm-cache pnpm@10.32.1
export PATH="$PWD/.local/hosting-tools/node_modules/.bin:$PATH"
CI=true pnpm install --frozen-lockfile --prod=false --store-dir .local/pnpm-store
PORT=5173 BASE_PATH=/ pnpm --filter @workspace/rudy run build
PORT=5174 BASE_PATH=/manager/ pnpm --filter @workspace/manager run build
pnpm --filter @workspace/api-server run build
