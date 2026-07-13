create function public.list_stamp_spots()
returns table (
  content_id text,
  title text,
  kind text,
  latitude double precision,
  longitude double precision
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    spot.content_id,
    spot.title,
    spot.kind,
    extensions.st_y(spot.location::extensions.geometry),
    extensions.st_x(spot.location::extensions.geometry)
  from public.stamp_spots as spot
  order by spot.content_id
$$;

revoke execute on function public.list_stamp_spots() from public, anon;
grant execute on function public.list_stamp_spots() to authenticated;
