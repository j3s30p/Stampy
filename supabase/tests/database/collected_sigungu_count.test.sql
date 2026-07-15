begin;

create extension if not exists pgtap with schema extensions;

select plan(12);

select ok(
  to_regprocedure('public.get_collected_sigungu_count()') is not null,
  'get_collected_sigungu_count exists'
);

select is(
  pg_get_function_result(
    'public.get_collected_sigungu_count()'::regprocedure
  ),
  'bigint',
  'the RPC returns a scalar bigint'
);

select ok(
  (
    select not procedure_definition.prosecdef
      and procedure_definition.provolatile = 's'
      and procedure_definition.proconfig @> array['search_path=""']
    from pg_proc as procedure_definition
    where procedure_definition.oid =
      'public.get_collected_sigungu_count()'::regprocedure
  ),
  'the RPC is stable SECURITY INVOKER with an empty search path'
);

select ok(
  has_function_privilege(
    'authenticated',
    'public.get_collected_sigungu_count()',
    'execute'
  ),
  'authenticated can execute get_collected_sigungu_count'
);

select ok(
  not has_function_privilege(
    'anon',
    'public.get_collected_sigungu_count()',
    'execute'
  ),
  'anon cannot execute get_collected_sigungu_count'
);

insert into auth.users (id)
values
  ('11111111-1111-1111-1111-111111111111'),
  ('22222222-2222-2222-2222-222222222222');

insert into public.stamp_spots (
  content_id,
  title,
  kind,
  location,
  ldong_region_code,
  ldong_sigungu_code
)
values
  (
    'sigungu-seoul-1',
    '서울 종로 관광지 1',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.977041, 37.579617),
      4326
    )::extensions.geography,
    '11',
    '11110'
  ),
  (
    'sigungu-seoul-2',
    '서울 종로 관광지 2',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.977141, 37.579717),
      4326
    )::extensions.geography,
    '11',
    '11110'
  ),
  (
    'sigungu-busan-1',
    '부산 시군구 코드 23 관광지',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(129.075642, 35.179554),
      4326
    )::extensions.geography,
    '26',
    '11110'
  ),
  (
    'sigungu-legacy',
    '지역 코드 없는 기존 관광지',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(127.027621, 37.497952),
      4326
    )::extensions.geography,
    null,
    null
  ),
  (
    'sigungu-uncollected',
    '수집하지 않은 관광지',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(128.601445, 35.871435),
      4326
    )::extensions.geography,
    '27',
    '27110'
  ),
  (
    'sigungu-other-user',
    '다른 사용자가 수집한 관광지',
    'spot',
    extensions.st_setsrid(
      extensions.st_point(126.705206, 37.456256),
      4326
    )::extensions.geography,
    '28',
    '28110'
  );

set local role anon;

select throws_ok(
  $$select public.get_collected_sigungu_count()$$,
  '42501'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '11111111-1111-1111-1111-111111111111',
  true
);
set local role authenticated;

select is(
  public.get_collected_sigungu_count(),
  0::bigint,
  'uncollected stamp spots are not counted'
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
  '11111111-1111-1111-1111-111111111111'::uuid,
  spot.content_id,
  spot.location,
  5,
  pg_catalog.transaction_timestamp(),
  0
from public.stamp_spots as spot
where spot.content_id in ('sigungu-seoul-1', 'sigungu-seoul-2');

set local role authenticated;

select is(
  public.get_collected_sigungu_count(),
  1::bigint,
  'multiple stamps in the same area and sigungu pair count once'
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
  '11111111-1111-1111-1111-111111111111'::uuid,
  spot.content_id,
  spot.location,
  5,
  pg_catalog.transaction_timestamp(),
  0
from public.stamp_spots as spot
where spot.content_id = 'sigungu-busan-1';

set local role authenticated;

select is(
  public.get_collected_sigungu_count(),
  2::bigint,
  'the same sigungu code under another area code counts separately'
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
  '11111111-1111-1111-1111-111111111111'::uuid,
  spot.content_id,
  spot.location,
  5,
  pg_catalog.transaction_timestamp(),
  0
from public.stamp_spots as spot
where spot.content_id = 'sigungu-legacy';

set local role authenticated;

select is(
  public.get_collected_sigungu_count(),
  2::bigint,
  'legacy rows without region codes are excluded from the count'
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
  '22222222-2222-2222-2222-222222222222'::uuid,
  spot.content_id,
  spot.location,
  5,
  pg_catalog.transaction_timestamp(),
  0
from public.stamp_spots as spot
where spot.content_id = 'sigungu-other-user';

set local role authenticated;

select is(
  public.get_collected_sigungu_count(),
  2::bigint,
  'another user collection does not change the current user count'
);

reset role;
select set_config(
  'request.jwt.claim.sub',
  '22222222-2222-2222-2222-222222222222',
  true
);
set local role authenticated;

select is(
  public.get_collected_sigungu_count(),
  1::bigint,
  'each authenticated user receives only their own distinct sigungu count'
);

reset role;

select * from finish();

rollback;
