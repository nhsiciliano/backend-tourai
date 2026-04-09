create index if not exists places_geography_idx
on public.places
using gist ((st_setsrid(st_makepoint(longitude::double precision, latitude::double precision), 4326)::geography));

create index if not exists places_featured_editorial_idx
on public.places ("isFeatured" desc, "editorialScore" desc);
