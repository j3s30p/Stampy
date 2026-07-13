create extension if not exists postgis with schema extensions;

create table public.stamp_spots (
  content_id text primary key,
  title text not null,
  kind text not null,
  location extensions.geography(point, 4326) not null,

  constraint stamp_spots_content_id_valid check (
    content_id <> '' and content_id = btrim(content_id)
  ),
  constraint stamp_spots_title_valid check (
    title <> '' and title = btrim(title)
  ),
  constraint stamp_spots_kind_valid check (kind in ('spot', 'event'))
);

create index stamp_spots_location_gix
  on public.stamp_spots
  using gist (location);

alter table public.stamp_spots enable row level security;

revoke all on table public.stamp_spots from public, anon, authenticated;

grant select on table public.stamp_spots to authenticated;
grant select, insert, update, delete on table public.stamp_spots to service_role;

create policy "authenticated users read stamp spots"
on public.stamp_spots
for select
to authenticated
using (true);
