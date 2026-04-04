# Dataset Inicial, Estructura del Proyecto y Variables

## Initial POI Dataset

### MVP Dataset

Start with `20-30` curated POIs in CABA.

### Priority Types

- monuments
- plazas
- ruins
- historic sites
- scientific or technical landmarks

### Data Sources

- OpenStreetMap
- Wikidata
- Wikipedia
- curated manual enrichment

### Editorial Requirements

Each POI should ideally include:

- Spanish and English names
- category
- coordinates and geometry where relevant
- source references
- factual summary seed
- scientific or historical angle
- editorial priority score

## Project Structure

Recommended module layout:

- `src/lib/auth`
- `src/lib/prisma`
- `src/lib/supabase`
- `src/lib/resend`
- `src/modules/auth`
- `src/modules/users`
- `src/modules/preferences`
- `src/modules/places`
- `src/modules/location`
- `src/modules/guides`
- `src/modules/audio`
- `src/modules/history`
- `src/modules/ingestion`
- `src/modules/jobs`
- `src/providers/llm`
- `src/providers/tts`
- `src/providers/email`

## Environment Variables

- `DATABASE_URL`
- `DIRECT_URL`
- `BETTER_AUTH_SECRET`
- `BETTER_AUTH_URL`
- `AUTH_CALLBACK_URL`
- `MOBILE_DEEP_LINK_URL=tourai://auth/callback`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `SUPABASE_URL`
- `SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_ROLE_KEY`
- `REDIS_URL`
- `GEMINI_API_KEY`
- `ELEVENLABS_API_KEY`
