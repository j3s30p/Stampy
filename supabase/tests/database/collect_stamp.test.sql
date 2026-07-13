begin;

create extension if not exists pgtap with schema extensions;

select plan(48);

insert into auth.users (id)
values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.stamp_spots (content_id, title, kind, location)
values
  (
    'server-spot',
    '서버 경복궁',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.977041, 37.579617),
      4326
    )::extensions.geography
  ),
  (
    'boundary-spot',
    '경계 행사',
    'event',
    extensions.st_setsrid(
      extensions.st_point(126.977041, 37.579617),
      4326
    )::extensions.geography
  ),
  (
    'validation-spot',
    '검증 장소',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.977041, 37.579617),
      4326
    )::extensions.geography
  ),
  (
    'outside-spot',
    '거리 초과 장소',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.977041, 37.579617),
      4326
    )::extensions.geography
  ),
  (
    'older-spot',
    '먼저 모은 장소',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.977041, 37.579617),
      4326
    )::extensions.geography
  );

select ok(
  to_regclass('public.collected_stamps') is not null,
  'collected_stamps exists'
);

select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'collected_stamps'
  ),
  7::bigint,
  'collected_stamps has only the required columns'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'collected_stamps'
      and is_nullable = 'YES'
  ),
  'every collected_stamps column is required'
);

select results_eq(
  $$
    select attribute.attname
    from pg_index index_definition
    join pg_class table_definition
      on table_definition.oid = index_definition.indrelid
    join pg_attribute attribute
      on attribute.attrelid = table_definition.oid
      and attribute.attnum = any(index_definition.indkey)
    where table_definition.oid = 'public.collected_stamps'::regclass
      and index_definition.indisprimary
    order by array_position(index_definition.indkey, attribute.attnum)
  $$,
  $$values ('user_id'::name), ('content_id'::name)$$,
  'user_id and content_id form the composite primary key'
);

select ok(
  exists (
    select 1
    from pg_constraint constraint_definition
    where constraint_definition.conrelid = 'public.collected_stamps'::regclass
      and constraint_definition.contype = 'f'
      and constraint_definition.confrelid = 'auth.users'::regclass
      and constraint_definition.confdeltype = 'c'
  ),
  'user_id references auth.users with delete cascade'
);

select ok(
  exists (
    select 1
    from pg_constraint constraint_definition
    where constraint_definition.conrelid = 'public.collected_stamps'::regclass
      and constraint_definition.contype = 'f'
      and constraint_definition.confrelid = 'public.stamp_spots'::regclass
  ),
  'content_id references stamp_spots'
);

select ok(
  (
    select attribute.atttypid = 'extensions.geography'::regtype
      and extensions.postgis_typmod_type(attribute.atttypmod) = 'Point'
      and extensions.postgis_typmod_srid(attribute.atttypmod) = 4326
    from pg_attribute attribute
    where attribute.attrelid = 'public.collected_stamps'::regclass
      and attribute.attname = 'verification_location'
  ),
  'verification_location is a geography Point with SRID 4326'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.collected_stamps'::regclass
  ),
  'RLS is enabled'
);

select ok(
  has_table_privilege('authenticated', 'public.collected_stamps', 'select'),
  'authenticated can select collected stamps'
);

select ok(
  not has_table_privilege('authenticated', 'public.collected_stamps', 'insert'),
  'authenticated cannot insert collected stamps directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.collected_stamps', 'update'),
  'authenticated cannot update collected stamps directly'
);

select ok(
  not has_table_privilege('authenticated', 'public.collected_stamps', 'delete'),
  'authenticated cannot delete collected stamps directly'
);

select ok(
  not has_table_privilege('anon', 'public.collected_stamps', 'select'),
  'anon cannot select collected stamps'
);

select ok(
  has_table_privilege('service_role', 'public.collected_stamps', 'insert'),
  'service_role can manage collected stamps'
);

select ok(
  exists (
    select 1
    from pg_policies
    where schemaname = 'public'
      and tablename = 'collected_stamps'
      and cmd = 'SELECT'
      and roles = array['authenticated']::name[]
      and qual ilike '%auth.uid()%'
  ),
  'the SELECT policy is restricted to the current authenticated user'
);

select ok(
  to_regprocedure(
    'public.collect_stamp(text,double precision,double precision,double precision,timestamp with time zone)'
  ) is not null,
  'collect_stamp exposes only the client verification inputs'
);

select ok(
  (
    select procedure_definition.prosecdef
      and procedure_definition.proconfig @> array['search_path=""']
    from pg_proc procedure_definition
    where procedure_definition.oid =
      'public.collect_stamp(text,double precision,double precision,double precision,timestamp with time zone)'::regprocedure
  ),
  'collect_stamp is SECURITY DEFINER with an empty search path'
);

select ok(
  (
    select not procedure_definition.prosecdef
      and procedure_definition.provolatile = 's'
      and procedure_definition.proconfig @> array['search_path=""']
    from pg_proc procedure_definition
    where procedure_definition.oid =
      'public.list_collected_stamps()'::regprocedure
  ),
  'list_collected_stamps is stable SECURITY INVOKER with an empty search path'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.collect_stamp(text,double precision,double precision,double precision,timestamp with time zone)',
    'execute'
  ),
  'authenticated can execute collect_stamp'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.collect_stamp(text,double precision,double precision,double precision,timestamp with time zone)',
    'execute'
  ),
  'anon cannot execute collect_stamp'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.list_collected_stamps()',
    'execute'
  ),
  'authenticated can execute list_collected_stamps'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.list_collected_stamps()',
    'execute'
  ),
  'anon cannot execute list_collected_stamps'
);

select throws_ok(
  $$
    insert into public.collected_stamps (
      user_id,
      content_id,
      verification_location,
      verification_accuracy_meters,
      verification_timestamp,
      verified_distance_meters
    ) values (
      '11111111-1111-1111-1111-111111111111',
      'validation-spot',
      extensions.st_setsrid(
        extensions.st_point(126.977041, 37.579617),
        4326
      )::extensions.geography,
      100.01,
      '2026-07-13T06:55:00Z',
      0
    )
  $$,
  '23514',
  null,
  'accuracy above 100m violates the table constraint'
);

select throws_ok(
  $$
    insert into public.collected_stamps (
      user_id,
      content_id,
      verification_location,
      verification_accuracy_meters,
      verification_timestamp,
      verified_distance_meters
    ) values (
      '11111111-1111-1111-1111-111111111111',
      'validation-spot',
      extensions.st_setsrid(
        extensions.st_point(126.977041, 37.579617),
        4326
      )::extensions.geography,
      10,
      'infinity'::timestamptz,
      0
    )
  $$,
  '23514',
  null,
  'an infinite verification timestamp violates the table constraint'
);

select throws_ok(
  $$
    insert into public.collected_stamps (
      user_id,
      content_id,
      verification_location,
      verification_accuracy_meters,
      verification_timestamp,
      verified_distance_meters
    ) values (
      '11111111-1111-1111-1111-111111111111',
      'validation-spot',
      extensions.st_setsrid(
        extensions.st_point(126.977041, 37.579617),
        4326
      )::extensions.geography,
      10,
      '2026-07-13T06:55:00Z',
      100.01
    )
  $$,
  '23514',
  null,
  'a verified distance above 100m violates the table constraint'
);

set local role anon;

select throws_ok(
  $$
    select * from public.collect_stamp(
      'server-spot', 37.579617, 126.977041, 10, '2026-07-13T06:55:00Z'
    )
  $$,
  '42501',
  null,
  'anon calls to collect_stamp are denied'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role authenticated;

select throws_ok(
  $$
    select * from public.collect_stamp(
      'server-spot', 37.579617, 126.977041, 10, '2026-07-13T06:55:00Z'
    )
  $$,
  '42501',
  'authentication_required',
  'authenticated role without a user id is rejected'
);

select throws_ok(
  $$
    insert into public.collected_stamps (
      user_id,
      content_id,
      verification_location,
      verification_accuracy_meters,
      verification_timestamp,
      verified_distance_meters
    ) values (
      '11111111-1111-1111-1111-111111111111',
      'server-spot',
      extensions.st_setsrid(
        extensions.st_point(126.977041, 37.579617),
        4326
      )::extensions.geography,
      10,
      '2026-07-13T06:55:00Z',
      0
    )
  $$,
  '42501',
  null,
  'authenticated cannot bypass the RPC with a direct insert'
);

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);

select results_eq(
  $$
    select result, content_id, title, kind
    from public.collect_stamp(
      ' server-spot ',
      37.579617,
      126.977041,
      12.5,
      '2026-07-13T06:55:00Z'
    )
  $$,
  $$values ('success'::text, 'server-spot'::text, '서버 경복궁'::text, 'spot'::text)$$,
  'the first call succeeds with server-owned content metadata'
);

select ok(
  (
    select verification_latitude = 37.579617
      and verification_longitude = 126.977041
      and verification_accuracy_meters = 12.5
      and verification_timestamp = '2026-07-13T06:55:00Z'::timestamptz
      and verified_distance_meters = 0
    from public.list_collected_stamps()
    where content_id = 'server-spot'
  ),
  'the scalar projection preserves longitude, latitude, accuracy, and timestamp'
);

select is(
  (select count(*) from public.collected_stamps),
  1::bigint,
  'the first call stores one row for the current user'
);

select results_eq(
  $$
    select result, verification_accuracy_meters, verification_timestamp
    from public.collect_stamp(
      'server-spot',
      'Infinity'::double precision,
      'Infinity'::double precision,
      999,
      'infinity'::timestamptz
    )
  $$,
  $$values ('duplicate'::text, 12.5::double precision, '2026-07-13T06:55:00Z'::timestamptz)$$,
  'a duplicate returns the original row before validating new location data'
);

select ok(
  (
    select count(*) = 1
      and min(verification_accuracy_meters) = 12.5
      and min(verification_timestamp) = '2026-07-13T06:55:00Z'::timestamptz
    from public.collected_stamps
    where content_id = 'server-spot'
  ),
  'duplicate calls keep the first record unchanged'
);

select throws_ok(
  $$select * from public.collect_stamp(' ', 37.579617, 126.977041, 10, now())$$,
  '22023',
  'invalid_content_id',
  'blank content ids are rejected'
);

select throws_ok(
  $$
    select * from public.collect_stamp(
      'validation-spot',
      'NaN'::double precision,
      126.977041,
      10,
      now()
    )
  $$,
  '22023',
  'invalid_coordinates',
  'non-finite coordinates are rejected'
);

select throws_ok(
  $$
    select * from public.collect_stamp(
      'validation-spot', 37.579617, 126.977041, 100.01, now()
    )
  $$,
  '22023',
  'invalid_accuracy',
  'accuracy above 100m is rejected'
);

select throws_ok(
  $$
    select * from public.collect_stamp(
      'validation-spot',
      37.579617,
      126.977041,
      10,
      'infinity'::timestamptz
    )
  $$,
  '22023',
  'verification_timestamp_required',
  'an infinite verification timestamp is rejected'
);

select throws_ok(
  $$
    select * from public.collect_stamp(
      'missing-spot', 37.579617, 126.977041, 10, now()
    )
  $$,
  'P0002',
  'stamp_spot_not_found',
  'unregistered stamp spots are rejected'
);

select throws_ok(
  $$
    with projected as (
      select extensions.st_project(location, 101, 0)::extensions.geometry as point
      from public.stamp_spots
      where content_id = 'outside-spot'
    )
    select *
    from projected
    cross join lateral public.collect_stamp(
      'outside-spot',
      extensions.st_y(projected.point),
      extensions.st_x(projected.point),
      10,
      now()
    )
  $$,
  '22023',
  'outside_stamp_radius',
  'a location beyond 100m is rejected'
);

select is(
  (select count(*) from public.collected_stamps),
  1::bigint,
  'rejected calls do not add collected stamp rows'
);

select results_eq(
  $$
    with projected as (
      select extensions.st_project(location, 100, 0)::extensions.geometry as point
      from public.stamp_spots
      where content_id = 'boundary-spot'
    )
    select result
    from projected
    cross join lateral public.collect_stamp(
      'boundary-spot',
      extensions.st_y(projected.point),
      extensions.st_x(projected.point),
      100,
      '2026-07-13T06:56:00Z'
    )
  $$,
  $$values ('success'::text)$$,
  'the inclusive 100m distance and accuracy boundary succeeds'
);

select ok(
  (
    select pg_catalog.abs(verified_distance_meters - 100) < 0.001
    from public.collected_stamps
    where content_id = 'boundary-spot'
  ),
  'the server stores the distance calculated at the 100m boundary'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222',
  true
);
set local role authenticated;

select results_eq(
  $$
    select result
    from public.collect_stamp(
      'server-spot', 37.579617, 126.977041, 8, '2026-07-13T06:57:00Z'
    )
  $$,
  $$values ('success'::text)$$,
  'a second user can collect the same stamp spot'
);

select is(
  (select count(*) from public.collected_stamps),
  1::bigint,
  'RLS exposes only the second user record'
);

reset role;

insert into public.collected_stamps (
  user_id,
  content_id,
  verification_location,
  verification_accuracy_meters,
  verification_timestamp,
  verified_distance_meters,
  collected_at
)
values (
  '11111111-1111-1111-1111-111111111111',
  'older-spot',
  extensions.st_setsrid(
    extensions.st_point(126.977041, 37.579617),
    4326
  )::extensions.geography,
  5,
  '2026-07-12T06:55:00Z',
  0,
  '2026-07-12T06:55:01Z'
);

select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
set local role authenticated;

select results_eq(
  $$select content_id from public.list_collected_stamps()$$,
  $$
    values
      ('older-spot'::text),
      ('boundary-spot'::text),
      ('server-spot'::text)
  $$,
  'collected stamps are ordered by collected_at then content_id ascending'
);

select results_eq(
  $$
    select title, kind, verification_latitude, verification_longitude
    from public.list_collected_stamps()
    where content_id = 'older-spot'
  $$,
  $$values ('먼저 모은 장소'::text, 'spot'::text, 37.579617::double precision, 126.977041::double precision)$$,
  'the list RPC returns the canonical scalar stamp fields'
);

select is(
  (select count(*) from public.list_collected_stamps()),
  3::bigint,
  'the list RPC excludes the other user record'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.list_collected_stamps()$$,
  '42501',
  null,
  'anon calls to list_collected_stamps are denied'
);

reset role;

select * from finish();

rollback;
