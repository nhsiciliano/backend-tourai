# Railway Deploy

## Recommended Topology

Use one Railway project with three services:

1. `tourai-api`
2. `tourai-worker`
3. `redis`

Keep `Supabase` as the production database, PostGIS source and storage backend.

The repository includes `nixpacks.toml` so Railway can build the app consistently from GitHub.

## Service Commands

### API

- Build command: `npm install && npm run build`
- Start command: `npm run start`

### Worker

- Build command: `npm install && npm run build`
- Start command: `npm run start:worker`

## Shared Variables

Set these on both `tourai-api` and `tourai-worker`:

- `HOST=0.0.0.0`
- `LOG_LEVEL=info`
- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
- `ELEVENLABS_VOICE_ID_ES`
- `ELEVENLABS_VOICE_ID_EN`

## API-only Variables

Set these only on `tourai-api`:

- `ENABLE_DEV_ROUTES=false`
- `CORS_ORIGIN`
- `TRUSTED_ORIGINS`
- `BETTER_AUTH_URL`
- `AUTH_CALLBACK_URL`
- `MOBILE_DEEP_LINK_URL`
- optional social auth vars: `GOOGLE_*`, `MICROSOFT_*`, `APPLE_*`

## Worker-only Variables

Set this on `tourai-worker` too:

- `ENABLE_DEV_ROUTES=false`

The worker does not expose HTTP, but using the same env schema keeps boot predictable.

## Notes

- The API and worker must use the same `REDIS_URL`.
- The API and worker must use the same `DATABASE_URL` and Supabase credentials.
- `POST /guides` returns `202` for newly queued work.
- The worker is responsible for moving queued guides to `ready`.
- Keep `/dev/*` disabled in production.

## CLI Note

`railway` is optional for this setup because deployment will happen through GitHub integration.
You only need the CLI if you want to inspect environments or logs locally.
