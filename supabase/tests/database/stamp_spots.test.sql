begin;

create extension if not exists pgtap with schema extensions;

select plan(21);

select ok(
  exists (select 1 from pg_extension where extname = 'postgis'),
  'PostGIS is enabled'
);

select ok(
  to_regclass('public.stamp_spots') is not null,
  'stamp_spots exists'
);

select is(
  (
    select count(*)
    from information_schema.columns
    where table_schema = 'public' and table_name = 'stamp_spots'
  ),
  4::bigint,
  'stamp_spots has only the required columns'
);

select ok(
  not exists (
    select 1
    from information_schema.columns
    where table_schema = 'public'
      and table_name = 'stamp_spots'
      and is_nullable = 'YES'
  ),
  'every stamp_spots column is required'
);

select ok(
  (
    select attribute.atttypid = 'extensions.geography'::regtype
      and extensions.postgis_typmod_type(attribute.atttypmod) = 'Point'
      and extensions.postgis_typmod_srid(attribute.atttypmod) = 4326
    from pg_attribute attribute
    where attribute.attrelid = 'public.stamp_spots'::regclass
      and attribute.attname = 'location'
  ),
  'location is a geography Point with SRID 4326'
);

select is(
  (
    select attribute.attname
    from pg_index index_definition
    join pg_class table_definition
      on table_definition.oid = index_definition.indrelid
    join pg_namespace table_namespace
      on table_namespace.oid = table_definition.relnamespace
    join pg_attribute attribute
      on attribute.attrelid = table_definition.oid
      and attribute.attnum = any(index_definition.indkey)
    where table_namespace.nspname = 'public'
      and table_definition.relname = 'stamp_spots'
      and index_definition.indisprimary
  ),
  'content_id'::name,
  'content_id is the primary key'
);

select ok(
  (
    select relrowsecurity
    from pg_class
    where oid = 'public.stamp_spots'::regclass
  ),
  'RLS is enabled'
);

select ok(
  exists (
    select 1
    from pg_indexes
    where schemaname = 'public'
      and tablename = 'stamp_spots'
      and indexname = 'stamp_spots_location_gix'
      and indexdef ilike '%using gist (location)%'
  ),
  'location has a GiST index'
);

select ok(
  has_table_privilege('authenticated', 'public.stamp_spots', 'select'),
  'authenticated can select stamp spots'
);

select ok(
  not has_table_privilege('authenticated', 'public.stamp_spots', 'insert'),
  'authenticated cannot insert stamp spots'
);

select ok(
  not has_table_privilege('authenticated', 'public.stamp_spots', 'update'),
  'authenticated cannot update stamp spots'
);

select ok(
  not has_table_privilege('authenticated', 'public.stamp_spots', 'delete'),
  'authenticated cannot delete stamp spots'
);

select ok(
  not has_table_privilege('anon', 'public.stamp_spots', 'select'),
  'anon cannot select stamp spots'
);

select ok(
  has_table_privilege('service_role', 'public.stamp_spots', 'insert'),
  'service_role can manage the server-owned catalog'
);

select is(
  (
    select count(*)
    from pg_policies
    where schemaname = 'public'
      and tablename = 'stamp_spots'
      and cmd = 'SELECT'
  ),
  1::bigint,
  'stamp_spots has one read policy'
);

select throws_ok(
  $$
    insert into public.stamp_spots (content_id, title, kind, location)
    values (
      ' ',
      '경복궁',
      'spot',
      extensions.st_setsrid(
        extensions.st_point(126.977041, 37.579617),
        4326
      )::extensions.geography
    )
  $$,
  '23514'
);

select throws_ok(
  $$
    insert into public.stamp_spots (content_id, title, kind, location)
    values (
      'tour-blank-title',
      '',
      'spot',
      extensions.st_setsrid(
        extensions.st_point(126.977041, 37.579617),
        4326
      )::extensions.geography
    )
  $$,
  '23514'
);

select throws_ok(
  $$
    insert into public.stamp_spots (content_id, title, kind, location)
    values (
      'tour-invalid-kind',
      '경복궁',
      'unknown',
      extensions.st_setsrid(
        extensions.st_point(126.977041, 37.579617),
        4326
      )::extensions.geography
    )
  $$,
  '23514'
);

insert into public.stamp_spots (content_id, title, kind, location)
values (
  'tour-126508',
  '경복궁',
  'spot',
  extensions.st_setsrid(
    extensions.st_point(126.977041, 37.579617),
    4326
  )::extensions.geography
);

select is(
  (
    select extensions.st_x(location::extensions.geometry)
    from public.stamp_spots
    where content_id = 'tour-126508'
  ),
  126.977041::double precision,
  'longitude remains the Point x coordinate'
);

select is(
  (
    select extensions.st_y(location::extensions.geometry)
    from public.stamp_spots
    where content_id = 'tour-126508'
  ),
  37.579617::double precision,
  'latitude remains the Point y coordinate'
);

set local role authenticated;

select results_eq(
  $$select content_id from public.stamp_spots order by content_id$$,
  $$values ('tour-126508'::text)$$,
  'authenticated users can read the server-owned catalog'
);

reset role;

select * from finish();

rollback;
