# Orden de Implementación, MVP y Riesgos

## Implementation Order

1. Bootstrap `Fastify + TypeScript`
2. Configure Prisma with Supabase Postgres
3. Integrate `better-auth`
4. Configure `magic link`
5. Integrate `Resend`
6. Implement auth callback for Expo deep link flow
7. Create Prisma schema for domain tables
8. Enable and use `PostGIS`
9. Configure private Supabase Storage bucket for MP3 files
10. Implement signed URL generation
11. Create `LLMProvider` interface
12. Implement `GeminiProvider`
13. Create `TTSProvider` interface
14. Implement `ElevenLabsProvider`
15. Implement `places` module
16. Seed initial curated CABA POIs
17. Implement `location/resolve`
18. Implement `guides` workflow
19. Implement `audio-url` endpoint
20. Implement BullMQ jobs
21. Add pre-generation jobs for featured POIs
22. Add user preferences
23. Add playback history
24. Add integration tests for the end-to-end guide flow

## MVP First Cut

The first working slice should include:

- magic link auth with Resend
- Expo-compatible auth callback
- 20-30 curated POIs in CABA
- `location/resolve`
- bilingual guide generation
- MP3 audio generation
- private Storage uploads
- signed URLs for playback
- limited pre-generation for top POIs

## Main Risks

- Session persistence details for Expo with `better-auth`
- Prisma limitations around advanced PostGIS usage
- Quality of POI source data
- TTS latency and cost in ElevenLabs
- Need for strong editorial prompt design to avoid generic or inaccurate guides

## Practical Recommendation

Build in this order:

1. auth
2. schema
3. places seed
4. location resolve
5. guide generation with Gemini
6. audio generation with ElevenLabs
7. signed URLs
8. pre-generation jobs

This gives a usable vertical slice early while keeping the architecture extensible.
