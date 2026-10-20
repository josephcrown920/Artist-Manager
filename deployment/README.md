# Free browser hosting

This deployment serves Rudy at `/`, Artist Manager at `/manager/`, and the API at `/api` on one public origin. `render.yaml` describes a Render free Node web service; use a Neon free PostgreSQL database for persistence. Confirm the current free-plan limits in each service before creating resources. Neither an AI provider's usage charges nor third-party integrations are included in hosting.

## Connect the services

1. Create a free project at https://neon.com and copy its PostgreSQL connection URL using the **direct connection** option. Keep the required TLS parameters, such as `sslmode=require`.
2. Commit and push `render.yaml` and the `deployment/` directory to your GitHub repository. These are new configuration files; application source and lockfiles do not need changing for this preview.
3. Sign in at https://dashboard.render.com with GitHub. Select **New > Blueprint**, connect this repository, and select the branch containing these files. Confirm the service uses the free plan.
4. Enter the Neon URL as `DATABASE_URL` in Render's secure environment settings. Do not put it in Git, a chat message, or a public file. Apply the blueprint.
5. Open the service's Render URL when deployment completes. Artist Manager is at `/manager/` on that same URL. Verify `/api/healthz` returns `{"status":"ok"}`.
6. Enter `OPENROUTER_API_KEY` in Render's secure environment settings. OpenRouter is the selected provider. Live calls have not been tested without the key. If using Claude through OpenRouter, set `app_settings.openrouter_model` to an available Anthropic model ID from your OpenRouter account. A Claude chat subscription is separate from Anthropic API access.

The build installs pnpm 10.32.1 and builds the two frontends and API. Startup synchronizes the database schema with the repository's existing Drizzle push command, without a destructive force flag, then starts the API and static web server. Use a fresh development database for this preview. Free web services can sleep while idle; first requests may be slow. Local files in the web service are not durable, so persistence uses PostgreSQL. This is a development preview; authentication and public multi-user access have not been assessed.

## Existing repository failures

- The root type check fails at `artifacts/manager/src/pages/CreatorFactory.tsx:167` because its inline style includes `divideColor`. The independent frontend and API bundles can still build; this deployment uses those existing build commands.
- Task listing with rows and task updates return HTTP 500 because routes pass date strings to response schemas expecting `Date` objects. Task creation and deletion work. Fix these in a separate code change before relying on task management.

## Local validation

From the repository root:

```bash
bash deployment/build.sh
DATABASE_URL='<local development database URL>' PORT=8080 INTERNAL_API_PORT=3002 node deployment/server.mjs
```

`INTERNAL_API_PORT` defaults to 3001. The public listener uses `PORT` (default 10000). Only set `HOSTING_SCHEMA_PUSH=0` when the schema is already installed and you intentionally want to skip that step.


## Ollama Cloud models

In Artist Manager, open **Settings → AI team models**, select **Ollama Cloud**, choose a model and save. Supported catalog IDs: `beam`, `gemma4:31b`, `gpt-oss:120b`, `gpt-oss:20b`, `nemotron-3-nano:30b`, `nemotron-3-super`, `nemotron-3-ultra`. These IDs were checked against Ollama's public `/api/tags` catalog; access depends on the account and remaining credits.

Add `OLLAMA_API_KEY` securely in Render's environment settings (or the cloud environment secret settings), and restart the API. The key stays on the server. OpenRouter and Anthropic keys do not authenticate to Ollama. The direct endpoint is `https://ollama.com/api/chat`; no local model download or LM Studio process is required. An Ollama error will not silently switch to another provider. The selector affects existing AI agent responses and generation; autonomous delegation, publishing and spending are not enabled by selecting a model.

Contract tests: `pnpm --filter @workspace/scripts exec tsx --test ../artifacts/api-server/tests/ollama.test.ts` from the repository root. The API settings integration was validated against the local PostgreSQL database, including round-trip selection of all seven models, invalid input rejection, credential-presence metadata, and the Manager's missing-key response. Live model output still requires an Ollama key.
