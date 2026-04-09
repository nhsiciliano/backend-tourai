# Railway Checklist

## Before Creating Services

1. Push the current branch to GitHub.
2. Confirm `Supabase` production values are available.
3. Confirm `Resend` production sender is ready.
4. Confirm `BETTER_AUTH_URL` target domain is known.
5. Confirm `ENABLE_DEV_ROUTES=false` for production.

## Create Project

1. Create one Railway project.
2. Connect the GitHub repository.
3. Add a `Redis` service.
4. Add a service named `tourai-api` from the repo.
5. Add a second service named `tourai-worker` from the same repo.

## Configure `tourai-api`

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm run start
```

Healthcheck path:

```text
/health
```

Required variables:

```env
HOST=0.0.0.0
LOG_LEVEL=info
ENABLE_DEV_ROUTES=false
CORS_ORIGIN=
TRUSTED_ORIGINS=
DATABASE_URL=
DIRECT_URL=
BETTER_AUTH_SECRET=
BETTER_AUTH_URL=
AUTH_CALLBACK_URL=
MOBILE_DEEP_LINK_URL=tourai://auth/callback
RESEND_API_KEY=
EMAIL_FROM=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID_ES=
ELEVENLABS_VOICE_ID_EN=
```

Optional social auth vars:

```env
GOOGLE_CLIENT_ID=
GOOGLE_CLIENT_SECRET=
MICROSOFT_CLIENT_ID=
MICROSOFT_CLIENT_SECRET=
MICROSOFT_TENANT_ID=common
APPLE_CLIENT_ID=
APPLE_TEAM_ID=
APPLE_KEY_ID=
APPLE_PRIVATE_KEY=
APPLE_APP_BUNDLE_IDENTIFIER=
```

## Configure `tourai-worker`

Build command:

```bash
npm install && npm run build
```

Start command:

```bash
npm run start:worker
```

Required variables:

```env
HOST=0.0.0.0
LOG_LEVEL=info
ENABLE_DEV_ROUTES=false
DATABASE_URL=
DIRECT_URL=
BETTER_AUTH_SECRET=
RESEND_API_KEY=
EMAIL_FROM=
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
REDIS_URL=
GEMINI_API_KEY=
ELEVENLABS_API_KEY=
ELEVENLABS_VOICE_ID_ES=
ELEVENLABS_VOICE_ID_EN=
```

## After Deploy

1. Open `GET /health` on the API service.
2. Test auth sign-up and sign-in from Postman.
3. Create a new non-cached guide.
4. Confirm `POST /guides` returns `202`.
5. Poll `GET /guides/:id/status` until `ready`.
6. Confirm the signed audio URL works.
7. Check Railway logs for both `api` and `worker`.

## First Production Smoke Test

1. Sign up a fresh user.
2. Verify the email flow through Resend.
3. Sign in.
4. Call `POST /location/resolve`.
5. Call `POST /guides` for a featured place in English.
6. Confirm the worker processes the job.
7. Confirm audio playback from Supabase signed URL.
