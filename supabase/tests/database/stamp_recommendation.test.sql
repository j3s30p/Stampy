begin;

create extension if not exists pgtap with schema extensions;

select plan(23);

insert into auth.users (id)
values
  ('33333333-3333-3333-3333-333333333333'),
  ('44444444-4444-4444-4444-444444444444');

with origin as (
  select extensions.st_setsrid(
    extensions.st_point(126.977041, 37.579617),
    4326
  )::extensions.geography as location
), fixtures (content_id, title, kind, distance_meters) as (
  values
    ('own-collected', '내가 수집한 장소', 'spot', 10::double precision),
    ('other-user-collected', '다른 사용자가 수집한 행사', 'event', 0::double precision),
    ('near-a', '가까운 A', 'spot', 500::double precision),
    ('near-b', '가까운 B', 'event', 500::double precision),
    ('boundary', '추천 경계 장소', 'spot', 1000::double precision),
    ('outside', '추천 반경 밖 장소', 'spot', 1000.005::double precision)
)
insert into public.stamp_spots (content_id, title, kind, location)
select
  fixture.content_id,
  fixture.title,
  fixture.kind,
  extensions.st_project(origin.location, fixture.distance_meters, 0)
from fixtures as fixture
cross join origin;

insert into public.collected_stamps (
  user_id,
  content_id,
  verification_location,
  verification_accuracy_meters,
  verification_timestamp,
  verified_distance_meters
)
select
  collected.user_id,
  collected.content_id,
  spot.location,
  5,
  '2026-07-13T07:10:00Z',
  0
from (
  values
    (
      '33333333-3333-3333-3333-333333333333'::uuid,
      'own-collected'::text
    ),
    (
      '44444444-4444-4444-4444-444444444444'::uuid,
      'other-user-collected'::text
    )
) as collected (user_id, content_id)
join public.stamp_spots as spot
  on spot.content_id = collected.content_id;

select ok(
  to_regprocedure(
    'public.get_stamp_recommendation(double precision,double precision)'
  ) is not null,
  'get_stamp_recommendation exists'
);

select is(
  pg_get_function_identity_arguments(
    'public.get_stamp_recommendation(double precision,double precision)'::regprocedure
  ),
  'p_latitude double precision, p_longitude double precision',
  'the RPC keeps the named scalar input contract'
);

select is(
  pg_get_function_result(
    'public.get_stamp_recommendation(double precision,double precision)'::regprocedure
  ),
  'TABLE(content_id text, title text, kind text, latitude double precision, longitude double precision, distance_meters double precision, score double precision, reason text, generated_at timestamp with time zone)',
  'the RPC keeps the ordered scalar result contract'
);

select ok(
  (
    select not procedure_definition.prosecdef
      and procedure_definition.provolatile = 's'
      and procedure_definition.proconfig @> array['search_path=""']
    from pg_proc as procedure_definition
    where procedure_definition.oid =
      'public.get_stamp_recommendation(double precision,double precision)'::regprocedure
  ),
  'get_stamp_recommendation is stable SECURITY INVOKER with an empty search path'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.get_stamp_recommendation(double precision,double precision)',
    'execute'
  ),
  'authenticated can execute get_stamp_recommendation'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.get_stamp_recommendation(double precision,double precision)',
    'execute'
  ),
  'anon cannot execute get_stamp_recommendation'
);

set local role anon;

select throws_ok(
  $$select * from public.get_stamp_recommendation(37.579617, 126.977041)$$,
  '42501',
  null,
  'anon calls to get_stamp_recommendation are denied'
);

reset role;
select set_config('request.jwt.claim.sub', '', true);
set local role authenticated;

select throws_ok(
  $$select * from public.get_stamp_recommendation(37.579617, 126.977041)$$,
  '42501',
  'authentication_required',
  'authenticated role without a user id is rejected'
);

select set_config(
  'request.jwt.claim.sub',
  '33333333-3333-3333-3333-333333333333',
  true
);

select throws_ok(
  $$select * from public.get_stamp_recommendation('NaN', 126.977041)$$,
  '22023',
  'invalid_coordinates',
  'non-finite coordinates are rejected'
);

select throws_ok(
  $$select * from public.get_stamp_recommendation(null, 126.977041)$$,
  '22023',
  'invalid_coordinates',
  'missing coordinates are rejected'
);

select throws_ok(
  $$select * from public.get_stamp_recommendation(90.1, 126.977041)$$,
  '22023',
  'invalid_coordinates',
  'out-of-range latitude is rejected'
);

select throws_ok(
  $$select * from public.get_stamp_recommendation(37.579617, 'Infinity')$$,
  '22023',
  'invalid_coordinates',
  'out-of-range longitude is rejected'
);

select results_eq(
  $$
    select content_id, title, kind, reason
    from public.get_stamp_recommendation(37.579617, 126.977041)
  $$,
  $$
    values (
      'other-user-collected'::text,
      '다른 사용자가 수집한 행사'::text,
      'event'::text,
      'nearby_uncollected'::text
    )
  $$,
  'only the current user collection history excludes a candidate'
);

select ok(
  (
    select recommendation.latitude = 37.579617
      and recommendation.longitude = 126.977041
    from public.get_stamp_recommendation(
      37.579617,
      126.977041
    ) as recommendation
  ),
  'the recommendation returns canonical scalar coordinates'
);

select ok(
  (
    select pg_catalog.abs(recommendation.distance_meters) < 0.001
      and recommendation.score = 100
      and recommendation.generated_at is not null
    from public.get_stamp_recommendation(
      37.579617,
      126.977041
    ) as recommendation
  ),
  'zero distance maps to score 100 with a server timestamp'
);

select is(
  (
    select count(*)
    from public.get_stamp_recommendation(37.579617, 126.977041)
  ),
  1::bigint,
  'the RPC returns at most one recommendation'
);

reset role;

select is(
  (select count(*) from public.collected_stamps),
  2::bigint,
  'recommendation calls do not persist GPS or collection data'
);

insert into public.collected_stamps (
  user_id,
  content_id,
  verification_location,
  verification_accuracy_meters,
  verification_timestamp,
  verified_distance_meters
)
select
  '33333333-3333-3333-3333-333333333333',
  spot.content_id,
  spot.location,
  5,
  '2026-07-13T07:11:00Z',
  0
from public.stamp_spots as spot
where spot.content_id = 'other-user-collected';

set local role authenticated;

select results_eq(
  $$
    select content_id
    from public.get_stamp_recommendation(37.579617, 126.977041)
  $$,
  $$values ('near-a'::text)$$,
  'the closest distance tie is resolved by content_id'
);

select ok(
  (
    select recommendation.distance_meters > 100
      and recommendation.distance_meters < 1000
      and recommendation.reason = 'nearby_uncollected'
      and pg_catalog.abs(
        recommendation.score - (
          100 - recommendation.distance_meters / 10
        )
      ) < 0.000001
    from public.get_stamp_recommendation(
      37.579617,
      126.977041
    ) as recommendation
  ),
  'the 1km recommendation radius stays separate from 100m collection verification'
);

reset role;

insert into public.collected_stamps (
  user_id,
  content_id,
  verification_location,
  verification_accuracy_meters,
  verification_timestamp,
  verified_distance_meters
)
select
  '33333333-3333-3333-3333-333333333333',
  spot.content_id,
  spot.location,
  5,
  '2026-07-13T07:12:00Z',
  0
from public.stamp_spots as spot
where spot.content_id in ('near-a', 'near-b');

set local role authenticated;

select results_eq(
  $$
    select content_id
    from public.get_stamp_recommendation(37.579617, 126.977041)
  $$,
  $$values ('boundary'::text)$$,
  'a candidate exactly 1km away remains eligible'
);

select ok(
  (
    select pg_catalog.abs(recommendation.distance_meters - 1000) < 0.001
      and recommendation.score < 0.001
      and recommendation.score >= 0
    from public.get_stamp_recommendation(
      37.579617,
      126.977041
    ) as recommendation
  ),
  'the inclusive 1km boundary maps to score zero'
);

reset role;

insert into public.collected_stamps (
  user_id,
  content_id,
  verification_location,
  verification_accuracy_meters,
  verification_timestamp,
  verified_distance_meters
)
select
  '33333333-3333-3333-3333-333333333333',
  spot.content_id,
  spot.location,
  5,
  '2026-07-13T07:13:00Z',
  0
from public.stamp_spots as spot
where spot.content_id = 'boundary';

set local role authenticated;

select is(
  (
    select count(*)
    from public.get_stamp_recommendation(37.579617, 126.977041)
  ),
  0::bigint,
  'a candidate beyond 1km is excluded and an exhausted catalog returns no row'
);

reset role;

select is(
  (select count(*) from public.collected_stamps),
  6::bigint,
  'only the six explicit collection fixtures were stored'
);

select * from finish();

rollback;
