# Arquitectura y Flujo General

## Architecture

### Main Components

- `Fastify` as the main backend API
- `better-auth` for authentication and session handling
- `Prisma` for standard database access
- `PostGIS` with raw SQL for geospatial logic
- `BullMQ` for async jobs
- `Gemini` for guide generation
- `ElevenLabs` for audio synthesis
- `Supabase Storage` for private MP3 files
- `Resend` for magic link email delivery

### High-Level Flow

1. App sends `lat`, `lng`, `language`, `duration`, and `detailLevel`
2. Backend resolves the current or nearest POI
3. Backend checks cache for an existing guide variant
4. If available, backend returns metadata and signed audio URL
5. If not available, backend creates a guide request
6. Background job generates guide script with Gemini
7. Background job synthesizes MP3 with ElevenLabs
8. Audio is uploaded to Supabase Storage
9. Backend returns signed URL once audio is ready
