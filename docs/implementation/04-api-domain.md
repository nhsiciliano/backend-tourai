# API y Modelo de Dominio

## API Surface

### Auth

- `POST /auth/sign-in/magic-link`
- `GET /auth/callback`
- `GET /auth/session`
- `POST /auth/sign-out`

### Places and Geolocation

- `POST /location/resolve`
- `GET /places/:id`

### Guides and Audio

- `POST /guides`
- `GET /guides/:id`
- `GET /guides/:id/status`
- `GET /guides/:id/audio-url`

### User

- `GET /me/preferences`
- `PUT /me/preferences`
- `GET /me/history`

## Domain Model

### Main Tables

- better-auth tables
- `user_preference`
- `place`
- `place_source`
- `generated_guide`
- `guide_request`
- `audio_asset`
- `playback_history`

### Recommended Enums

- `language`: `es-AR | en`
- `duration`: `short | medium | long`
- `detailLevel`: `basic | standard | deep`
- `guideStatus`: `pending | processing | ready | failed`
- `audioStatus`: `pending | processing | ready | failed`
- `placeCategory`: `monument | plaza | ruin | scientific_site | historic_site`

### Key Fields

#### `place`

- `id`
- `slug`
- `name_es`
- `name_en`
- `category`
- `lat`
- `lng`
- `geometry`
- `city`
- `country`
- `is_featured`
- `editorial_score`
- `summary_seed_es`
- `summary_seed_en`
- `scientific_relevance`

#### `generated_guide`

- `id`
- `place_id`
- `language`
- `duration`
- `detail_level`
- `script`
- `status`
- `provider`
- `prompt_version`
- `input_hash`
- `estimated_duration_sec`

#### `audio_asset`

- `id`
- `guide_id`
- `storage_bucket`
- `storage_path`
- `mime_type`
- `voice_code`
- `status`
- `duration_ms`

#### `guide_request`

- `id`
- `user_id`
- `place_id`
- `language`
- `duration`
- `detail_level`
- `status`
- `source`
