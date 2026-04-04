# Supabase Setup

## Remote Project

- Project name: `tourai-backend`
- Project ref: `vsfgnaknjkuopjecbmpt`
- Region: `sa-east-1`
- Dashboard: `https://supabase.com/dashboard/project/vsfgnaknjkuopjecbmpt`

## Repository State

This repository is already initialized with `supabase init` and linked to the remote project.

Files created for Supabase:

- `supabase/config.toml`
- `supabase/migrations/20260403175500_tourai_project_setup.sql`
- `supabase/seed.sql`

## What Was Configured

### Database extensions

- `postgis`
- `pg_trgm`
- `unaccent`
- `btree_gist`

### Storage

- Private bucket: `audio-guides`
- File size limit: `50 MiB`
- Allowed mime type: `audio/mpeg`

## Notes

- Supabase Auth is available in the project, but the backend uses `better-auth` as the application auth layer.
- Supabase Storage is the source of truth for generated MP3 files.
- PostGIS is enabled so the backend can later use raw SQL geospatial queries from Fastify/Prisma.

## Useful Commands

```bash
supabase db query "select current_database(), current_user;" --linked
supabase projects api-keys --project-ref vsfgnaknjkuopjecbmpt
supabase db push
supabase start
```

## Environment Variables

Use the linked project values in your local `.env`:

```env
SUPABASE_URL=https://vsfgnaknjkuopjecbmpt.supabase.co
```

Fill these from the dashboard or CLI output instead of committing them:

```env
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
DATABASE_URL=
DIRECT_URL=
```

## Database Password

The remote project was created with a dedicated database password during setup.
Keep it out of version control and use it only in local secrets or your deployment platform.
