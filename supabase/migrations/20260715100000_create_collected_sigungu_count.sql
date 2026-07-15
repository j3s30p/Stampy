alter table public.stamp_spots
  add column ldong_region_code text,
  add column ldong_sigungu_code text,
  add constraint stamp_spots_ldong_region_code_valid check (
    ldong_region_code is null
    or (
      ldong_region_code <> ''
      and ldong_region_code = pg_catalog.btrim(ldong_region_code)
      and ldong_region_code ~ '^[0-9]+$'
    )
  ),
  add constraint stamp_spots_ldong_sigungu_code_valid check (
    ldong_sigungu_code is null
    or (
      ldong_sigungu_code <> ''
      and ldong_sigungu_code = pg_catalog.btrim(ldong_sigungu_code)
      and ldong_sigungu_code ~ '^[0-9]+$'
    )
  ),
  add constraint stamp_spots_region_codes_paired check (
    (ldong_region_code is null) = (ldong_sigungu_code is null)
  );

create function public.get_collected_sigungu_count()
returns bigint
language sql
stable
security invoker
set search_path = ''
as $$
  select pg_catalog.count(*)
  from (
    select spot.ldong_region_code, spot.ldong_sigungu_code
    from public.collected_stamps as collected
    join public.stamp_spots as spot
      on spot.content_id = collected.content_id
    where collected.user_id = (select auth.uid())
      and spot.ldong_region_code is not null
      and spot.ldong_sigungu_code is not null
    group by spot.ldong_region_code, spot.ldong_sigungu_code
  ) as collected_sigungu
$$;

revoke execute on function public.get_collected_sigungu_count()
from public, anon;
grant execute on function public.get_collected_sigungu_count()
to authenticated;
