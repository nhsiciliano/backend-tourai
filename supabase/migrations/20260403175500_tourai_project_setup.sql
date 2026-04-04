create extension if not exists postgis with schema extensions;
create extension if not exists pg_trgm with schema extensions;
create extension if not exists unaccent with schema extensions;
create extension if not exists btree_gist with schema extensions;

insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values (
  'audio-guides',
  'audio-guides',
  false,
  52428800,
  array['audio/mpeg']
)
on conflict (id) do update
set
  public = excluded.public,
  file_size_limit = excluded.file_size_limit,
  allowed_mime_types = excluded.allowed_mime_types;

comment on extension postgis is 'Required for Tourai geospatial point-of-interest lookup.';
comment on extension pg_trgm is 'Prepared for future fuzzy search on places and aliases.';
comment on extension unaccent is 'Prepared for accent-insensitive search over place names.';
