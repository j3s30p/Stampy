begin;

create extension if not exists pgtap with schema extensions;

select plan(11);

select ok(
  to_regprocedure('public.list_weekly_ranking()') is not null,
  'list_weekly_ranking exists'
);

select is(
  pg_get_function_result(
    'public.list_weekly_ranking()'::regprocedure
  ),
  'TABLE(rank bigint, stamp_count bigint, is_current_user boolean)',
  'the RPC returns only anonymous ranking fields'
);

select ok(
  (
    select procedure_definition.prosecdef
      and procedure_definition.provolatile = 's'
      and procedure_definition.proconfig @> array['search_path=""']
    from pg_proc as procedure_definition
    where procedure_definition.oid =
      'public.list_weekly_ranking()'::regprocedure
  ),
  'list_weekly_ranking is stable SECURITY DEFINER with an empty search path'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.list_weekly_ranking()',
    'execute'
  ),
  'authenticated can execute list_weekly_ranking'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.list_weekly_ranking()',
    'execute'
  ),
  'anon cannot execute list_weekly_ranking'
);

insert into auth.users (id)
values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222'),
  ('33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444444');

insert into public.stamp_spots (content_id, title, kind, location)
select
  fixture.content_id,
  fixture.title,
  'spot',
  extensions.st_setsrid(
    extensions.st_point(126.977041, 37.579617),
    4326
  )::extensions.geography
from (
  values
    ('ranking-1', '랭킹 장소 1'),
    ('ranking-2', '랭킹 장소 2'),
    ('ranking-3', '랭킹 장소 3'),
    ('ranking-before', '지난 주 경계 장소'),
    ('ranking-after', '다음 주 경계 장소')
) as fixture (content_id, title);

set local role anon;

select throws_ok(
  $$select * from public.list_weekly_ranking()$$,
  '42501',
  null,
  'anon calls to list_weekly_ranking are denied'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role authenticated;

select throws_ok(
  $$select * from public.list_weekly_ranking()$$,
  '42501',
  'authentication_required',
  'authenticated role without a user id is rejected'
);

reset role;

with week_bounds as (
  select pg_catalog.timezone(
    'Asia/Seoul',
    pg_catalog.date_trunc(
      'week',
      pg_catalog.timezone(
        'Asia/Seoul',
        pg_catalog.transaction_timestamp()
      )
    )
  ) as week_start
), fixtures (user_id, content_id, collected_offset) as (
  values
    (
      '44444444-4444-4444-4444-444444444444'::uuid,
      'ranking-before'::text,
      interval '-1 microsecond'
    ),
    (
      '44444444-4444-4444-4444-444444444444'::uuid,
      'ranking-after'::text,
      interval '7 days'
    )
)
insert into public.collected_stamps (
  user_id,
  content_id,
  verification_location,
  verification_accuracy_meters,
  verification_timestamp,
  verified_distance_meters,
  collected_at
)
select
  fixture.user_id,
  fixture.content_id,
  spot.location,
  5,
  week_bounds.week_start + fixture.collected_offset,
  0,
  week_bounds.week_start + fixture.collected_offset
from fixtures as fixture
cross join week_bounds
join public.stamp_spots as spot
  on spot.content_id = fixture.content_id;

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222',
  true
);
set local role authenticated;

select is_empty(
  $$select * from public.list_weekly_ranking()$$,
  'timestamps outside the KST Monday week return an empty ranking'
);

reset role;

with week_bounds as (
  select pg_catalog.timezone(
    'Asia/Seoul',
    pg_catalog.date_trunc(
      'week',
      pg_catalog.timezone(
        'Asia/Seoul',
        pg_catalog.transaction_timestamp()
      )
    )
  ) as week_start
), fixtures (user_id, content_id, collected_offset) as (
  values
    ('11111111-1111-1111-1111-111111111111'::uuid, 'ranking-1', interval '0'),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'ranking-2', interval '1 hour'),
    ('11111111-1111-1111-1111-111111111111'::uuid, 'ranking-3', interval '2 hours'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'ranking-1', interval '0'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'ranking-2', interval '1 hour'),
    ('22222222-2222-2222-2222-222222222222'::uuid, 'ranking-3', interval '2 hours'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'ranking-1', interval '0'),
    ('33333333-3333-3333-3333-333333333333'::uuid, 'ranking-2', interval '1 hour'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'ranking-1', interval '0'),
    ('44444444-4444-4444-4444-444444444444'::uuid, 'ranking-2', interval '1 hour')
)
insert into public.collected_stamps (
  user_id,
  content_id,
  verification_location,
  verification_accuracy_meters,
  verification_timestamp,
  verified_distance_meters,
  collected_at
)
select
  fixture.user_id,
  fixture.content_id,
  spot.location,
  5,
  week_bounds.week_start + fixture.collected_offset,
  0,
  week_bounds.week_start + fixture.collected_offset
from fixtures as fixture
cross join week_bounds
join public.stamp_spots as spot
  on spot.content_id = fixture.content_id;

select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222',
  true
);
set local role authenticated;

select is(
  (select count(*) from public.list_weekly_ranking()),
  3::bigint,
  'the RPC returns at most three users'
);

select results_eq(
  $$
    select rank, stamp_count, is_current_user
    from public.list_weekly_ranking()
  $$,
  $$
    values
      (1::bigint, 3::bigint, false),
      (1::bigint, 3::bigint, true),
      (3::bigint, 2::bigint, false)
  $$,
  'ties share a rank while UUID order stays internal and deterministic'
);

select is(
  (
    select count(*)
    from public.list_weekly_ranking()
    where is_current_user
  ),
  1::bigint,
  'exactly one returned row marks the current user'
);

reset role;

select * from finish();

rollback;
