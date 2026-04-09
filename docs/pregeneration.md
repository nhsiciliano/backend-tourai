# Featured Guide Pregeneration

## Purpose

Pre-generate the most common guide variants for featured places in CABA so the mobile app can return ready-to-play audio with minimal latency.

## Default Variant Matrix

The current default matrix is:

- `es-AR` + `short` + `basic`
- `es-AR` + `medium` + `standard`
- `en` + `short` + `basic`
- `en` + `medium` + `standard`

## Commands

Dry run without calling Gemini or ElevenLabs:

```bash
npm run guides:pregenerate:dry -- --limit=2
```

Real execution for featured places:

```bash
npm run guides:pregenerate
```

Limit the number of featured places:

```bash
npm run guides:pregenerate -- --limit=1
```

## Development Endpoint

You can also trigger it through the dev route:

```bash
curl -X POST http://localhost:3000/dev/guides/pregenerate-featured \
  -H "Content-Type: application/json" \
  -d '{"dryRun":true,"limit":2}'
```

## Notes

- The system reuses cached guides when they already exist.
- Failed guides are retried automatically.
- If Gemini is rate-limited, the backend falls back to a structured local template and still generates MP3 audio with ElevenLabs.
- Real execution requires the dedicated worker to be running.
- The current implementation runs sequential queue dispatch in the pre-generation script to keep provider usage predictable.
