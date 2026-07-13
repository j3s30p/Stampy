create function public.get_stamp_recommendation(
  p_latitude double precision,
  p_longitude double precision
)
returns table (
  content_id text,
  title text,
  kind text,
  latitude double precision,
  longitude double precision,
  distance_meters double precision,
  score double precision,
  reason text,
  generated_at timestamptz
)
language plpgsql
stable
security invoker
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_current_location extensions.geography(point, 4326);
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  if p_latitude is null
    or p_longitude is null
    or not (p_latitude between -90 and 90)
    or not (p_longitude between -180 and 180) then
    raise exception using
      errcode = '22023',
      message = 'invalid_coordinates';
  end if;

  v_current_location := extensions.st_setsrid(
    extensions.st_point(p_longitude, p_latitude),
    4326
  )::extensions.geography;

  return query
  with candidates as (
    select
      spot.content_id,
      spot.title,
      spot.kind,
      extensions.st_y(spot.location::extensions.geometry) as latitude,
      extensions.st_x(spot.location::extensions.geometry) as longitude,
      extensions.st_distance(
        spot.location,
        v_current_location
      ) as distance_meters
    from public.stamp_spots as spot
    where extensions.st_dwithin(
      spot.location,
      v_current_location,
      -- Keep the GiST prefilter tolerant, then enforce the exact radius below.
      1000.01
    )
      and extensions.st_distance(spot.location, v_current_location) <= 1000
      and not exists (
        select 1
        from public.collected_stamps as collected
        where collected.user_id = v_user_id
          and collected.content_id = spot.content_id
      )
  )
  select
    candidate.content_id,
    candidate.title,
    candidate.kind,
    candidate.latitude,
    candidate.longitude,
    candidate.distance_meters,
    greatest(
      0::double precision,
      100::double precision * (
        1::double precision - candidate.distance_meters / 1000
      )
    ),
    'nearby_uncollected'::text,
    pg_catalog.statement_timestamp()
  from candidates as candidate
  order by candidate.distance_meters, candidate.content_id
  limit 1;
end;
$$;

revoke execute on function public.get_stamp_recommendation(
  double precision,
  double precision
) from public, anon;
grant execute on function public.get_stamp_recommendation(
  double precision,
  double precision
) to authenticated;
