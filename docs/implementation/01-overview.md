# Overview y Decisiones Base

## Overview

Build the backend for `tourai`, a mobile app that detects the user's GPS location, identifies the current or nearest scientific/historic point of interest in Ciudad Autonoma de Buenos Aires, and generates a personalized audio guide in Spanish or English using generative AI and text-to-speech.

The MVP will support:

- GPS-based point-of-interest resolution in CABA
- Bilingual guides: `es-AR` and `en`
- User-selected guide duration and detail level
- AI-generated scripts with structured quality controls
- MP3 audio generation
- Signed audio URLs via Supabase Storage
- Magic link authentication with persistent mobile sessions
- Pre-generated guides for major tourist sites
- On-demand generation for uncached variants

## Final Stack

- `Node.js`
- `Fastify`
- `TypeScript`
- `Prisma`
- `Supabase Postgres`
- `Supabase Storage`
- `PostGIS`
- `better-auth`
- `Resend`
- `Gemini`
- `ElevenLabs`
- `Redis + BullMQ`
- Mobile client target: `Expo`

## Core Product Decisions

- Initial geography: `Ciudad Autonoma de Buenos Aires`
- Initial languages: `es-AR`, `en`
- Audio format: `mp3` only
- Authentication: `better-auth` with `magic link`
- Email delivery: `Resend`
- Mobile deep link: `tourai://auth/callback`
- ORM: `Prisma`
- Database and storage: `Supabase`
- LLM provider: `Gemini`
- TTS provider: `ElevenLabs`
- Audio delivery: `Supabase signed URLs`
- Pre-generation enabled for top tourist POIs
