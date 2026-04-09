# Dedicated Worker

## Purpose

Guide generation and pre-generation now run through a dedicated BullMQ worker instead of being processed inside the API process.

## Processes

Run the API:

```bash
npm run dev
```

Run the worker in a second terminal:

```bash
npm run dev:worker
```

Production equivalents:

```bash
npm run build
npm run start
npm run start:worker
```

## Requirements

- Redis must be reachable through `REDIS_URL`
- The API and worker must point to the same database, Redis instance and environment configuration
- In production, set `ENABLE_DEV_ROUTES=false` on the API service

## Current Job Flow

1. `POST /guides` creates or reuses a `generated_guide`
2. If the variant is not already ready, the API enqueues a BullMQ job
3. The worker consumes the job and performs:
   - script generation
   - fallback if Gemini is rate-limited
   - ElevenLabs synthesis
   - Supabase Storage upload
4. The API can then read status and signed URLs from the database and storage

## Notes

- `POST /guides` now returns `202` when a new guide is queued.
- Cached guides that are already ready still return immediately.
- Pre-generation scripts require the worker to be running for real execution.
- Development-only endpoints under `/dev/*` should stay disabled in production.
