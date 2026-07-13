create table public.collected_stamps (
  user_id uuid not null
    references auth.users (id) on delete cascade,
  content_id text not null
    references public.stamp_spots (content_id),
  verification_location extensions.geography(point, 4326) not null,
  verification_accuracy_meters double precision not null,
  verification_timestamp timestamptz not null,
  verified_distance_meters double precision not null,
  collected_at timestamptz not null default pg_catalog.transaction_timestamp(),

  primary key (user_id, content_id),

  constraint collected_stamps_accuracy_valid check (
    verification_accuracy_meters between 0 and 100
  ),
  constraint collected_stamps_timestamp_valid check (
    pg_catalog.isfinite(verification_timestamp)
  ),
  constraint collected_stamps_distance_valid check (
    verified_distance_meters between 0 and 100
  )
);

alter table public.collected_stamps enable row level security;

revoke all on table public.collected_stamps from public, anon, authenticated;

grant select on table public.collected_stamps to authenticated;
grant select, insert, update, delete
  on table public.collected_stamps
  to service_role;

create policy "users read own collected stamps"
on public.collected_stamps
for select
to authenticated
using ((select auth.uid()) = user_id);

create function public.collect_stamp(
  p_content_id text,
  p_latitude double precision,
  p_longitude double precision,
  p_accuracy_meters double precision,
  p_verification_timestamp timestamptz
)
returns table (
  result text,
  content_id text,
  title text,
  kind text,
  verification_latitude double precision,
  verification_longitude double precision,
  verification_accuracy_meters double precision,
  verification_timestamp timestamptz,
  verified_distance_meters double precision,
  collected_at timestamptz
)
language plpgsql
security definer
set search_path = ''
as $$
declare
  v_user_id uuid;
  v_content_id text;
  v_target_location extensions.geography(point, 4326);
  v_verification_location extensions.geography(point, 4326);
  v_verified_distance_meters double precision;
  v_created boolean := false;
begin
  v_user_id := auth.uid();
  if v_user_id is null then
    raise exception using
      errcode = '42501',
      message = 'authentication_required';
  end if;

  v_content_id := pg_catalog.btrim(p_content_id);
  if v_content_id is null or v_content_id = '' then
    raise exception using
      errcode = '22023',
      message = 'invalid_content_id';
  end if;

  perform pg_catalog.pg_advisory_xact_lock(
    pg_catalog.hashtextextended(
      v_user_id::text || pg_catalog.chr(31) || v_content_id,
      0
    )
  );

  return query
  select
    'duplicate'::text,
    collected.content_id,
    spot.title,
    spot.kind,
    extensions.st_y(collected.verification_location::extensions.geometry),
    extensions.st_x(collected.verification_location::extensions.geometry),
    collected.verification_accuracy_meters,
    collected.verification_timestamp,
    collected.verified_distance_meters,
    collected.collected_at
  from public.collected_stamps as collected
  join public.stamp_spots as spot
    on spot.content_id = collected.content_id
  where collected.user_id = v_user_id
    and collected.content_id = v_content_id;

  if found then
    return;
  end if;

  if p_latitude is null
    or p_longitude is null
    or not (p_latitude between -90 and 90)
    or not (p_longitude between -180 and 180) then
    raise exception using
      errcode = '22023',
      message = 'invalid_coordinates';
  end if;

  if p_accuracy_meters is null
    or not (p_accuracy_meters between 0 and 100) then
    raise exception using
      errcode = '22023',
      message = 'invalid_accuracy';
  end if;

  if p_verification_timestamp is null
    or not pg_catalog.isfinite(p_verification_timestamp) then
    raise exception using
      errcode = '22023',
      message = 'verification_timestamp_required';
  end if;

  select spot.location
  into v_target_location
  from public.stamp_spots as spot
  where spot.content_id = v_content_id;

  if not found then
    raise exception using
      errcode = 'P0002',
      message = 'stamp_spot_not_found';
  end if;

  v_verification_location := extensions.st_setsrid(
    extensions.st_point(p_longitude, p_latitude),
    4326
  )::extensions.geography;

  if not extensions.st_dwithin(
    v_verification_location,
    v_target_location,
    100
  ) then
    raise exception using
      errcode = '22023',
      message = 'outside_stamp_radius';
  end if;

  v_verified_distance_meters := extensions.st_distance(
    v_verification_location,
    v_target_location
  );

  insert into public.collected_stamps (
    user_id,
    content_id,
    verification_location,
    verification_accuracy_meters,
    verification_timestamp,
    verified_distance_meters
  )
  values (
    v_user_id,
    v_content_id,
    v_verification_location,
    p_accuracy_meters,
    p_verification_timestamp,
    v_verified_distance_meters
  )
  on conflict on constraint collected_stamps_pkey do nothing
  returning true into v_created;

  v_created := coalesce(v_created, false);

  return query
  select
    case when v_created then 'success' else 'duplicate' end,
    collected.content_id,
    spot.title,
    spot.kind,
    extensions.st_y(collected.verification_location::extensions.geometry),
    extensions.st_x(collected.verification_location::extensions.geometry),
    collected.verification_accuracy_meters,
    collected.verification_timestamp,
    collected.verified_distance_meters,
    collected.collected_at
  from public.collected_stamps as collected
  join public.stamp_spots as spot
    on spot.content_id = collected.content_id
  where collected.user_id = v_user_id
    and collected.content_id = v_content_id;

  if not found then
    raise exception using
      errcode = 'XX000',
      message = 'collect_stamp_persistence_failed';
  end if;
end;
$$;

create function public.list_collected_stamps()
returns table (
  content_id text,
  title text,
  kind text,
  verification_latitude double precision,
  verification_longitude double precision,
  verification_accuracy_meters double precision,
  verification_timestamp timestamptz,
  verified_distance_meters double precision,
  collected_at timestamptz
)
language sql
stable
security invoker
set search_path = ''
as $$
  select
    collected.content_id,
    spot.title,
    spot.kind,
    extensions.st_y(collected.verification_location::extensions.geometry),
    extensions.st_x(collected.verification_location::extensions.geometry),
    collected.verification_accuracy_meters,
    collected.verification_timestamp,
    collected.verified_distance_meters,
    collected.collected_at
  from public.collected_stamps as collected
  join public.stamp_spots as spot
    on spot.content_id = collected.content_id
  where collected.user_id = (select auth.uid())
  order by collected.collected_at, collected.content_id
$$;

revoke execute on function public.collect_stamp(
  text,
  double precision,
  double precision,
  double precision,
  timestamptz
) from public, anon;
grant execute on function public.collect_stamp(
  text,
  double precision,
  double precision,
  double precision,
  timestamptz
) to authenticated;

revoke execute on function public.list_collected_stamps() from public, anon;
grant execute on function public.list_collected_stamps() to authenticated;
