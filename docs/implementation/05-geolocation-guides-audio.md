# Geolocalización, Generación de Guías y Audio

## Geolocation Strategy

### Initial Scope

- CABA only for MVP

### Resolution Rules

1. User inside a known geometry
2. Nearest featured curated POI
3. Best nearby candidate by weighted score

### Geospatial Logic

Use `PostGIS` with raw SQL for:

- `ST_Contains`
- `ST_DWithin`
- `ST_Distance`

### Response Shape

Return:

- matched `place`
- `distanceMeters`
- `confidenceScore`
- `matchType`

## Guide Generation Strategy

### Personalization Inputs

- `language`
- `duration`
- `detailLevel`
- `place category`

### Language Support

- `es-AR`
- `en`

### Duration Presets

- `short`: about 45-75 seconds
- `medium`: about 90-150 seconds
- `long`: about 180-300 seconds

### Detail Presets

- `basic`
- `standard`
- `deep`

### Script Quality Controls

- Separate factual place context from style instructions
- Use prompt templates per place category
- Use different prompts per language
- Enforce approximate target length by duration
- Enforce depth and scope by detail level
- Store `promptVersion` for future regeneration compatibility

### Suggested Script Structure

1. Brief opening
2. What the user is seeing
3. Historical or scientific context
4. Distinctive insight
5. Short close

## TTS Strategy

### Provider

- `ElevenLabs`

### Output

- `mp3` only

### Delivery

- Upload generated files to a private Supabase Storage bucket
- Generate temporary signed URLs for playback
- Return signed URLs through the API when audio is ready

### TTS Abstraction

Use a `TTSProvider` interface so provider replacement is easy later.

## Caching and Variant Strategy

Cache guides by:

- `place`
- `language`
- `duration`
- `detailLevel`
- `promptVersion`

This avoids regenerating the same guide repeatedly and controls cost.

## Pre-Generation Strategy

### Purpose

Reduce perceived latency for the most important tourist sites.

### Initial Scope

Pre-generate for featured POIs in CABA for:

- `es-AR`
- `en`
- `short`
- `medium`
- `basic`
- `standard`

### Deferred Variants

Generate `long` and `deep` on-demand initially.
