begin;

create extension if not exists pgtap with schema extensions;

select plan(6);

select ok(
  to_regprocedure('public.list_stamp_spots()') is not null,
  'list_stamp_spots exists'
);

select ok(
  (
    select not procedure_definition.prosecdef
      and procedure_definition.provolatile = 's'
      and procedure_definition.proconfig @> array['search_path=""']
    from pg_proc as procedure_definition
    where procedure_definition.oid =
      'public.list_stamp_spots()'::regprocedure
  ),
  'list_stamp_spots is stable SECURITY INVOKER with an empty search path'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.list_stamp_spots()',
    'execute'
  ),
  'authenticated can execute list_stamp_spots'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.list_stamp_spots()',
    'execute'
  ),
  'anon cannot execute list_stamp_spots'
);

insert into public.stamp_spots (content_id, title, kind, location)
values
  (
    '20',
    '두 번째 행사',
    'event',
    extensions.st_setsrid(
      extensions.st_point(127.027621, 37.497952),
      4326
    )::extensions.geography
  ),
  (
    '10',
    '첫 번째 관광지',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.977041, 37.579617),
      4326
    )::extensions.geography
  );

set local role authenticated;

select results_eq(
  $$
    select content_id, title, kind, latitude, longitude
    from public.list_stamp_spots()
  $$,
  $$
    values
      (
        '10'::text,
        '첫 번째 관광지'::text,
        'spot'::text,
        37.579617::double precision,
        126.977041::double precision
      ),
      (
        '20'::text,
        '두 번째 행사'::text,
        'event'::text,
        37.497952::double precision,
        127.027621::double precision
      )
  $$,
  'authenticated receives scalar coordinates ordered by content_id'
);

reset role;
set local role anon;

select throws_ok(
  $$select * from public.list_stamp_spots()$$,
  '42501'
);

reset role;

select * from finish();

rollback;
